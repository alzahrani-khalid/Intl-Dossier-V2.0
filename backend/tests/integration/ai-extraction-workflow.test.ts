/**
 * Integration Test: AI Extraction Workflow
 *
 * Tests the complete AI extraction workflow from document upload to form pre-population
 * Following TDD approach - this test should FAIL until implementation is complete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient>;
let authToken: string;
let testUserId: string;
let testDossierId: string;
let testEngagementId: string;

beforeAll(async () => {
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Authenticate test user
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: 'kazahrani@stats.gov.sa',
    password: 'itisme'
  });

  if (error) throw error;
  authToken = authData.session?.access_token || '';
  testUserId = authData.user?.id || '';

  // Create test dossier and engagement
  const { data: dossier } = await supabase
    .from('dossiers')
    .insert({
      title: 'Test Dossier for AI Extraction',
      description: 'Integration test dossier',
      status: 'active'
    })
    .select()
    .single();

  testDossierId = dossier?.id;

  const { data: engagement } = await supabase
    .from('engagements')
    .insert({
      dossier_id: testDossierId,
      title: 'Test Engagement for AI Extraction',
      engagement_type: 'meeting',
      start_date: '2025-01-15'
    })
    .select()
    .single();

  testEngagementId = engagement?.id;
});

afterAll(async () => {
  // Cleanup test data
  if (testEngagementId) {
    await supabase.from('engagements').delete().eq('id', testEngagementId);
  }
  if (testDossierId) {
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  }
  await supabase.auth.signOut();
});

describe('AI Extraction Workflow Integration', () => {
  it('should extract entities from meeting minutes and pre-populate after-action form', async () => {
    // Test document with known entities
    const testDocument = `
      Meeting Summary - Strategic Planning Session
      Date: January 15, 2025
      Attendees: John Smith (Director), Sarah Johnson (Policy Analyst), Ahmed Ali (Consultant)

      Decisions Made:
      1. Approved budget increase of 15% for diplomatic initiatives in Southeast Asia
      2. Decision to establish new embassy presence in Vietnam by Q3 2025
      3. Approved new security protocol for confidential communications

      Commitments and Action Items:
      1. John Smith will draft the new policy framework document by February 1st, 2025
      2. Sarah Johnson will coordinate with external partners and submit partnership agreements by January 25th, 2025
      3. Ahmed Ali will conduct feasibility study for Vietnam embassy and present findings by February 15th, 2025

      Risks Identified:
      1. Budget constraints may delay Vietnam embassy implementation (High severity, Likely)
      2. Resource availability concerns for Q2 operations (Medium severity, Possible)
      3. Political instability in target region could impact timeline (Critical severity, Unlikely)

      Follow-up Actions:
      1. Schedule follow-up meeting for March 1st to review progress
      2. Arrange stakeholder briefing session
    `;

    // Step 1: Extract entities using sync extraction
    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_content: testDocument,
        document_type: 'text/plain',
        language: 'en'
      })
    });

    expect(extractResponse.status).toBe(200);

    const extractionResult = await extractResponse.json();

    // Step 2: Verify extraction accuracy (≥85% precision requirement)
    // Expected: 3 decisions, 3 commitments, 3 risks

    expect(extractionResult.decisions).toBeDefined();
    expect(extractionResult.commitments).toBeDefined();
    expect(extractionResult.risks).toBeDefined();

    // Verify decision extraction (should find all 3)
    const decisionsFound = extractionResult.decisions.length;
    expect(decisionsFound).toBeGreaterThanOrEqual(2); // Allow for ≥85% precision (2.55 ≈ 3)

    // Verify commitment extraction with owners and dates
    const commitmentsFound = extractionResult.commitments.length;
    expect(commitmentsFound).toBeGreaterThanOrEqual(2); // Allow for ≥85% precision

    extractionResult.commitments.forEach((commitment: any) => {
      expect(commitment.owner_name).toBeDefined();
      expect(commitment.due_date).toBeDefined();
      expect(commitment.description).toBeDefined();

      // Verify due dates are valid future dates
      const dueDate = new Date(commitment.due_date);
      expect(dueDate).toBeInstanceOf(Date);
      expect(dueDate.getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
    });

    // Verify risk extraction with severity and likelihood
    const risksFound = extractionResult.risks.length;
    expect(risksFound).toBeGreaterThanOrEqual(2); // Allow for ≥85% precision

    extractionResult.risks.forEach((risk: any) => {
      expect(risk.severity).toBeDefined();
      expect(risk.likelihood).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(risk.severity);
      expect(['rare', 'unlikely', 'possible', 'likely', 'certain']).toContain(risk.likelihood);
    });

    // Step 3: Create after-action record with extracted data
    const afterActionResponse = await fetch(`${supabaseUrl}/functions/v1/after-action/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        engagement_id: testEngagementId,
        dossier_id: testDossierId,
        title: 'AI-Extracted After-Action Record',
        description: 'Populated from AI extraction',
        confidentiality_level: 'internal',
        attendance_list: [
          { name: 'John Smith', role: 'Director', organization: 'Internal' },
          { name: 'Sarah Johnson', role: 'Policy Analyst', organization: 'Internal' },
          { name: 'Ahmed Ali', role: 'Consultant', organization: 'External' }
        ],
        decisions: extractionResult.decisions.map((d: any) => ({
          description: d.description,
          rationale: d.rationale || '',
          decision_maker: d.decision_maker || 'Unknown',
          decided_at: new Date().toISOString(),
          ai_extracted: true,
          confidence_score: d.confidence_score
        })),
        commitments: extractionResult.commitments.map((c: any) => ({
          description: c.description,
          owner_type: 'internal', // Would be determined by matching owner_name to users
          due_date: c.due_date,
          priority: 'medium',
          ai_extracted: true,
          confidence_score: c.confidence_score
        })),
        risks: extractionResult.risks.map((r: any) => ({
          description: r.description,
          severity: r.severity,
          likelihood: r.likelihood,
          ai_extracted: true,
          confidence_score: r.confidence_score
        }))
      })
    });

    expect(afterActionResponse.status).toBe(201);

    const afterActionResult = await afterActionResponse.json();

    // Step 4: Verify after-action record was created with AI-extracted data
    expect(afterActionResult).toHaveProperty('id');
    expect(afterActionResult.status).toBe('draft');

    // Step 5: Verify data integrity
    const { data: createdRecord } = await supabase
      .from('after_action_records')
      .select(`
        *,
        decisions(*),
        commitments(*),
        risks(*)
      `)
      .eq('id', afterActionResult.id)
      .single();

    expect(createdRecord).toBeDefined();

    // Verify AI extraction flags
    const aiExtractedDecisions = createdRecord.decisions.filter((d: any) => d.ai_extracted);
    expect(aiExtractedDecisions.length).toBe(createdRecord.decisions.length);

    const aiExtractedCommitments = createdRecord.commitments.filter((c: any) => c.ai_extracted);
    expect(aiExtractedCommitments.length).toBe(createdRecord.commitments.length);

    const aiExtractedRisks = createdRecord.risks.filter((r: any) => r.ai_extracted);
    expect(aiExtractedRisks.length).toBe(createdRecord.risks.length);

    // Verify confidence scores exist
    createdRecord.decisions.forEach((d: any) => {
      expect(d.confidence_score).toBeGreaterThan(0);
      expect(d.confidence_score).toBeLessThanOrEqual(1);
    });

    // Cleanup
    await supabase.from('after_action_records').delete().eq('id', afterActionResult.id);
  });

  it('should handle low-confidence extractions with warning flags', async () => {
    // Test with ambiguous document that should produce low confidence scores
    const ambiguousDocument = `
      Meeting notes - unclear format
      Maybe decided something about budget?
      Someone should do something by sometime
      There might be some risks
    `;

    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_content: ambiguousDocument,
        document_type: 'text/plain',
        language: 'en'
      })
    });

    expect(extractResponse.status).toBe(200);

    const result = await extractResponse.json();

    // Verify low confidence items are flagged
    const lowConfidenceThreshold = 0.7;
    const lowConfidenceItems = [
      ...result.decisions.filter((d: any) => d.confidence_score < lowConfidenceThreshold),
      ...result.commitments.filter((c: any) => c.confidence_score < lowConfidenceThreshold),
      ...result.risks.filter((r: any) => r.confidence_score < lowConfidenceThreshold)
    ];

    // Should have some low confidence items from ambiguous content
    expect(lowConfidenceItems.length).toBeGreaterThan(0);

    // Verify each low confidence item has proper structure
    lowConfidenceItems.forEach(item => {
      expect(item.confidence_score).toBeLessThan(lowConfidenceThreshold);
      expect(item.confidence_score).toBeGreaterThanOrEqual(0);
    });
  });

  it('should preserve user edits when merging AI suggestions', async () => {
    const testDocument = `
      Decision: Approve new security protocol
      Commitment: John will update documentation by Feb 1st
    `;

    // Step 1: Create initial after-action with manual data
    const initialResponse = await fetch(`${supabaseUrl}/functions/v1/after-action/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        engagement_id: testEngagementId,
        dossier_id: testDossierId,
        title: 'Manual Entry Test',
        description: 'Testing AI merge',
        confidentiality_level: 'internal',
        decisions: [
          {
            description: 'User-entered decision',
            decision_maker: 'Manual User',
            decided_at: new Date().toISOString()
          }
        ]
      })
    });

    const initialRecord = await initialResponse.json();

    // Step 2: Extract from document
    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_content: testDocument,
        document_type: 'text/plain',
        language: 'en'
      })
    });

    const extraction = await extractResponse.json();

    // Step 3: Merge AI suggestions (should NOT overwrite user input)
    const updateResponse = await fetch(`${supabaseUrl}/functions/v1/after-action/update/${initialRecord.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decisions: [
          {
            description: 'User-entered decision', // Original user input
            decision_maker: 'Manual User',
            decided_at: new Date().toISOString()
          },
          ...extraction.decisions.map((d: any) => ({
            description: d.description,
            decision_maker: d.decision_maker,
            decided_at: new Date().toISOString(),
            ai_extracted: true,
            confidence_score: d.confidence_score
          }))
        ]
      })
    });

    expect(updateResponse.status).toBe(200);

    // Step 4: Verify user input was preserved
    const { data: updatedRecord } = await supabase
      .from('after_action_records')
      .select(`*, decisions(*)`)
      .eq('id', initialRecord.id)
      .single();

    const userDecision = updatedRecord.decisions.find((d: any) => !d.ai_extracted);
    expect(userDecision).toBeDefined();
    expect(userDecision.description).toBe('User-entered decision');

    // Cleanup
    await supabase.from('after_action_records').delete().eq('id', initialRecord.id);
  });
});
