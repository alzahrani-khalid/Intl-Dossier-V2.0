/**
 * Contract Tests: AI Metadata Extraction with Entity Context
 * Feature: 024 - Intake Entity Linking
 * User Stories: 2 (AI-Powered Link Suggestions)
 * 
 * Tests AI-powered metadata extraction from intake content:
 * - T080: Extract entities from unstructured text
 * - Named entity recognition (NER)
 * - Entity type classification
 * - Confidence scoring
 * - Batch extraction processing
 * - Graceful degradation when AI unavailable
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getTestSupabaseClient,
  createTestUser,
  createTestIntake,
  createTestEntity,
  cleanupTestData,
} from '@tests/utils/testHelpers';

// API Base URL (will be Edge Functions after implementation)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:54321/functions/v1';

// Test data interfaces
interface User {
  id: string;
  email: string;
  clearance_level: number;
  organization_id: string;
  token: string;
}

interface Intake {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'active' | 'completed';
  priority: number;
  organization_id: string;
}

interface Entity {
  entity_id: string;
  entity_type: string;
  name: string;
  classification_level: number;
  organization_id: string;
}

interface ExtractionRequest {
  intake_id: string;
  extract_from: 'title' | 'description' | 'both';
  confidence_threshold?: number; // 0.0 - 1.0, default 0.5
  max_entities?: number; // default 10
}

interface ExtractionResponse {
  success: boolean;
  data?: {
    extraction_id: string;
    intake_id: string;
    extracted_entities: Array<{
      entity_mention: string;
      entity_type: string;
      confidence: number;
      matched_entity?: {
        entity_id: string;
        entity_name: string;
        similarity_score: number;
      };
      position: {
        start: number;
        end: number;
      };
    }>;
    total_extracted: number;
    processing_time_ms: number;
    ai_model: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

interface BatchExtractionRequest {
  intake_ids: string[];
  extract_from: 'title' | 'description' | 'both';
  confidence_threshold?: number;
}

interface BatchExtractionResponse {
  success: boolean;
  data?: {
    batch_id: string;
    total_intakes: number;
    processed_count: number;
    failed_count: number;
    results: Array<{
      intake_id: string;
      extraction_id?: string;
      total_extracted: number;
      status: 'success' | 'failed';
      error?: string;
    }>;
    total_processing_time_ms: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Test state
let supabase: ReturnType<typeof getTestSupabaseClient>;
let testOrganizationId: string;
let testUser: User;
let testIntakes: Intake[] = [];
let testEntities: Entity[] = [];
let testExtractionIds: string[] = [];

describe('T080: AI Metadata Extraction with Entity Recognition', () => {
  beforeAll(async () => {
    supabase = getTestSupabaseClient();
    
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'AI Extraction Test Org' })
      .select()
      .single();
    testOrganizationId = org!.id;

    // Create test user
    testUser = await createTestUser(3, testOrganizationId);

    // Create test entities for matching
    const dossierEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Ambassador Johnson',
      classification_level: 2,
    });

    const countryEntity = await createTestEntity('country', testOrganizationId, {
      name: 'United States',
      classification_level: 1,
    });

    const orgEntity = await createTestEntity('organization', testOrganizationId, {
      name: 'United Nations',
      classification_level: 1,
    });

    const mouEntity = await createTestEntity('mou', testOrganizationId, {
      name: 'Trade Agreement 2024',
      classification_level: 2,
    });

    testEntities = [dossierEntity, countryEntity, orgEntity, mouEntity];

    // Create test intakes with entity-rich content
    const intake1 = await createTestIntake(testOrganizationId, {
      title: 'Meeting with Ambassador Johnson regarding United States trade relations',
      description: 'Discussed the Trade Agreement 2024 terms with representatives from the United Nations. Key points covered included tariff reductions and intellectual property protections.',
      status: 'waiting',
      priority: 3,
    });

    const intake2 = await createTestIntake(testOrganizationId, {
      title: 'Simple intake without entities',
      description: 'This is a simple intake ticket for testing extraction with no matches.',
      status: 'waiting',
      priority: 2,
    });

    const intake3 = await createTestIntake(testOrganizationId, {
      title: 'Complex intake with multiple entity mentions',
      description: 'Ambassador Johnson met with United States officials at the United Nations headquarters to finalize Trade Agreement 2024. The discussions also involved European Union representatives and focused on multilateral cooperation.',
      status: 'waiting',
      priority: 4,
    });

    testIntakes = [intake1, intake2, intake3];

    console.log('✅ AI extraction test environment ready');
  });

  afterAll(async () => {
    await cleanupTestData({
      userIds: [testUser.id],
      intakeIds: testIntakes.map(i => i.id),
      organizationIds: [testOrganizationId],
    });

    // Cleanup extraction records
    if (testExtractionIds.length > 0) {
      await supabase
        .from('ai_extractions')
        .delete()
        .in('id', testExtractionIds);
    }

    console.log('✅ AI extraction test cleanup complete');
  });

  it('should extract entities from intake title and description', async () => {
    const extractionRequest: ExtractionRequest = {
      intake_id: testIntakes[0].id,
      extract_from: 'both',
      confidence_threshold: 0.5,
      max_entities: 10,
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.extraction_id).toBeDefined();
    expect(responseData.data!.intake_id).toBe(testIntakes[0].id);
    expect(responseData.data!.total_extracted).toBeGreaterThan(0);
    expect(responseData.data!.processing_time_ms).toBeDefined();
    expect(responseData.data!.ai_model).toBeDefined();

    // Verify extracted entities
    const extractedEntities = responseData.data!.extracted_entities;
    expect(extractedEntities.length).toBeGreaterThan(0);

    // Should extract "Ambassador Johnson"
    expect(extractedEntities.some(e => 
      e.entity_mention.includes('Ambassador Johnson') && e.entity_type === 'dossier'
    )).toBe(true);

    // Should extract "United States"
    expect(extractedEntities.some(e => 
      e.entity_mention.includes('United States') && e.entity_type === 'country'
    )).toBe(true);

    // Should extract "United Nations"
    expect(extractedEntities.some(e => 
      e.entity_mention.includes('United Nations') && e.entity_type === 'organization'
    )).toBe(true);

    // Should extract "Trade Agreement 2024"
    expect(extractedEntities.some(e => 
      e.entity_mention.includes('Trade Agreement 2024') && e.entity_type === 'mou'
    )).toBe(true);

    // Verify confidence scores
    extractedEntities.forEach(entity => {
      expect(entity.confidence).toBeGreaterThanOrEqual(0.5);
      expect(entity.confidence).toBeLessThanOrEqual(1.0);
    });

    testExtractionIds.push(responseData.data!.extraction_id);
  }, 15000); // 15 second timeout for AI processing

  it('should classify entity types correctly using NER', async () => {
    const extractionRequest: ExtractionRequest = {
      intake_id: testIntakes[2].id, // Complex intake with multiple mentions
      extract_from: 'both',
      confidence_threshold: 0.3,
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    const extractedEntities = responseData.data!.extracted_entities;

    // Verify entity type classification
    const entityTypes = extractedEntities.map(e => e.entity_type);
    expect(entityTypes).toContain('dossier'); // Ambassador Johnson
    expect(entityTypes).toContain('country'); // United States
    expect(entityTypes).toContain('organization'); // United Nations, European Union
    expect(entityTypes).toContain('mou'); // Trade Agreement 2024

    // Verify position tracking
    extractedEntities.forEach(entity => {
      expect(entity.position.start).toBeGreaterThanOrEqual(0);
      expect(entity.position.end).toBeGreaterThan(entity.position.start);
    });

    testExtractionIds.push(responseData.data!.extraction_id);
  }, 15000);

  it('should match extracted entities to existing database entities', async () => {
    const extractionRequest: ExtractionRequest = {
      intake_id: testIntakes[0].id,
      extract_from: 'both',
      confidence_threshold: 0.5,
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    const extractedEntities = responseData.data!.extracted_entities;

    // Verify matched entities
    const matchedEntities = extractedEntities.filter(e => e.matched_entity !== undefined);
    expect(matchedEntities.length).toBeGreaterThan(0);

    // Verify match structure
    matchedEntities.forEach(entity => {
      expect(entity.matched_entity!.entity_id).toBeDefined();
      expect(entity.matched_entity!.entity_name).toBeDefined();
      expect(entity.matched_entity!.similarity_score).toBeGreaterThanOrEqual(0.0);
      expect(entity.matched_entity!.similarity_score).toBeLessThanOrEqual(1.0);
    });

    // Should match "Ambassador Johnson" to dossier entity
    const ambassadorMatch = matchedEntities.find(e => 
      e.entity_mention.includes('Ambassador Johnson')
    );
    expect(ambassadorMatch).toBeDefined();
    expect(ambassadorMatch!.matched_entity!.entity_id).toBe(testEntities[0].entity_id);

    testExtractionIds.push(responseData.data!.extraction_id);
  }, 15000);

  it('should apply confidence threshold filter correctly', async () => {
    // High confidence threshold
    const highThresholdRequest: ExtractionRequest = {
      intake_id: testIntakes[0].id,
      extract_from: 'both',
      confidence_threshold: 0.9, // Very high threshold
    };

    const highThresholdResponse = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highThresholdRequest),
    });

    expect(highThresholdResponse.status).toBe(200);

    const highThresholdData: ExtractionResponse = await highThresholdResponse.json();
    const highConfidenceCount = highThresholdData.data!.total_extracted;

    // Low confidence threshold
    const lowThresholdRequest: ExtractionRequest = {
      intake_id: testIntakes[0].id,
      extract_from: 'both',
      confidence_threshold: 0.3, // Low threshold
    };

    const lowThresholdResponse = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lowThresholdRequest),
    });

    expect(lowThresholdResponse.status).toBe(200);

    const lowThresholdData: ExtractionResponse = await lowThresholdResponse.json();
    const lowConfidenceCount = lowThresholdData.data!.total_extracted;

    // Low threshold should extract more entities
    expect(lowConfidenceCount).toBeGreaterThanOrEqual(highConfidenceCount);

    testExtractionIds.push(highThresholdData.data!.extraction_id, lowThresholdData.data!.extraction_id);
  }, 20000);

  it('should handle intake with no extractable entities gracefully', async () => {
    const extractionRequest: ExtractionRequest = {
      intake_id: testIntakes[1].id, // Simple intake without entities
      extract_from: 'both',
      confidence_threshold: 0.5,
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.total_extracted).toBe(0);
    expect(responseData.data!.extracted_entities.length).toBe(0);

    testExtractionIds.push(responseData.data!.extraction_id);
  }, 15000);

  it('should process batch extraction for multiple intakes', async () => {
    const batchRequest: BatchExtractionRequest = {
      intake_ids: [testIntakes[0].id, testIntakes[1].id, testIntakes[2].id],
      extract_from: 'both',
      confidence_threshold: 0.5,
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequest),
    });

    expect(response.status).toBe(200);

    const responseData: BatchExtractionResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.batch_id).toBeDefined();
    expect(responseData.data!.total_intakes).toBe(3);
    expect(responseData.data!.processed_count).toBe(3);
    expect(responseData.data!.failed_count).toBe(0);

    // Verify results for each intake
    expect(responseData.data!.results.length).toBe(3);
    responseData.data!.results.forEach(result => {
      expect(result.intake_id).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.extraction_id).toBeDefined();
      expect(result.total_extracted).toBeGreaterThanOrEqual(0);
    });

    // Verify processing time
    expect(responseData.data!.total_processing_time_ms).toBeGreaterThan(0);
    expect(responseData.data!.total_processing_time_ms).toBeLessThan(30000); // Should complete within 30 seconds
  }, 30000); // 30 second timeout for batch processing

  it('should enforce clearance levels for extracted entities', async () => {
    // Create high-classification entity
    const secretEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Classified Operation Phoenix',
      classification_level: 4, // Secret
    });

    // Create intake mentioning classified entity
    const classifiedIntake = await createTestIntake(testOrganizationId, {
      title: 'Discussion about Classified Operation Phoenix',
      description: 'This intake mentions a classified operation that requires high clearance.',
      status: 'waiting',
      priority: 5,
    });

    // Create user with insufficient clearance
    const lowClearanceUser = await createTestUser(2, testOrganizationId); // Clearance 2

    const extractionRequest: ExtractionRequest = {
      intake_id: classifiedIntake.id,
      extract_from: 'both',
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lowClearanceUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    
    // Extracted entities should exclude those requiring higher clearance
    const extractedEntities = responseData.data!.extracted_entities;
    const classifiedEntityMatch = extractedEntities.find(e => 
      e.matched_entity?.entity_id === secretEntity.entity_id
    );
    
    // Should NOT match classified entity for low-clearance user
    expect(classifiedEntityMatch).toBeUndefined();

    // Cleanup
    await cleanupTestData({
      userIds: [lowClearanceUser.id],
      intakeIds: [classifiedIntake.id],
    });
  }, 15000);

  it('should gracefully degrade when AI service is unavailable', async () => {
    // Simulate AI service unavailability by using invalid API key
    const originalKey = process.env.ANYTHINGLLM_API_KEY;
    process.env.ANYTHINGLLM_API_KEY = 'invalid-key-for-testing';

    const extractionRequest: ExtractionRequest = {
      intake_id: testIntakes[0].id,
      extract_from: 'both',
    };

    const response = await fetch(`${API_BASE_URL}/ai/extract-entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extractionRequest),
    });

    // Should return 200 with fallback behavior instead of hard failure
    expect(response.status).toBe(200);

    const responseData: ExtractionResponse = await response.json();
    expect(responseData.success).toBe(true);
    
    // Should use fallback extraction method (simple keyword matching)
    expect(responseData.data!.ai_model).toContain('fallback');
    expect(responseData.data!.extracted_entities).toBeDefined();

    // Restore original API key
    process.env.ANYTHINGLLM_API_KEY = originalKey;
  }, 15000);
});
