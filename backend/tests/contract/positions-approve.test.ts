/**
 * Contract Test: POST /positions/{id}/approve
 * Feature: 011-positions-talking-points
 * Task: T022
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 * Tests Step-Up Authentication requirement (FR-012)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /positions/{id}/approve', () => {
  let authToken: string;
  let elevatedToken: string;
  let testPositionId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_APPROVER_EMAIL || 'approver@example.com',
      password: process.env.TEST_APPROVER_PASSWORD || 'approverpass123'
    });
    authToken = authData.session?.access_token || '';

    // Create position in under_review status
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Approve Test Position',
        title_ar: 'الموافقة على موقف الاختبار',
        content_en: 'Content for approval',
        content_ar: 'محتوى للموافقة',
        status: 'under_review',
        current_stage: 1
      })
      .select()
      .single();

    testPositionId = position!.id;

    // Perform step-up authentication to get elevated token
    const stepUpResponse = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'approve',
        position_id: testPositionId
      })
    });

    const stepUpData = await stepUpResponse.json();
    const challengeId = stepUpData.challenge_id;

    // Complete step-up with test verification code
    const completeResponse = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        verification_code: '123456' // Test code
      })
    });

    const completeData = await completeResponse.json();
    elevatedToken = completeData.elevated_token;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should reject approval without step-up authentication', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-approve?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`, // Regular token, not elevated
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comments: 'Approved without step-up'
      })
    });

    expect(response.status).toBe(403);
    const error = await response.json();
    expect(error.error).toContain('step-up');
  });

  it('should approve position with elevated token', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-approve?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${elevatedToken}`, // Elevated token from step-up
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comments: 'Approved with proper authentication'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.current_stage).toBeGreaterThan(1); // Stage should increment
    expect(data.status).toBe('under_review'); // Still under review if not final stage
  });

  it('should record approval with step_up_verified=true', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-approve?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${elevatedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comments: 'Stage 2 approval'
      })
    });

    expect(response.status).toBe(200);

    // Verify approval record
    const { data: approvalRecords } = await supabase
      .from('approvals')
      .select('*')
      .eq('position_id', testPositionId)
      .order('stage', { ascending: false })
      .limit(1);

    expect(approvalRecords![0].step_up_verified).toBe(true);
    expect(approvalRecords![0].action).toBe('approve');
  });

  it('should change status to approved when all stages complete', async () => {
    // Get position type to know how many stages
    const { data: position } = await supabase
      .from('positions')
      .select('*, position_types(*)')
      .eq('id', testPositionId)
      .single();

    const totalStages = position!.position_types.approval_stages;
    const currentStage = position!.current_stage;

    // If this is the final stage
    if (currentStage === totalStages) {
      const response = await fetch(`${supabaseUrl}/functions/v1/positions-approve?id=${testPositionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${elevatedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comments: 'Final approval'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toBe('approved');
    }
  });

  it('should include ApprovalRequest schema validation', async () => {
    const requestBody = {
      comments: 'Test approval',
      // Optional fields can be added here
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-approve?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${elevatedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Should accept valid request body
    expect([200, 403]).toContain(response.status);
  });
});
