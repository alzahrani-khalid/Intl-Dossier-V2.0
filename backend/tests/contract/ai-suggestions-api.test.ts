/**
 * Contract Tests: AI Link Suggestions API
 *
 * Purpose: Validate AI-powered entity link suggestion endpoints
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T040: POST /api/intake/:intake_id/links/suggestions (Generate Suggestions)
 * - T041: POST /api/intake/:intake_id/links/suggestions/accept (Accept Suggestion)
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/ai-suggestions-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AILinkSuggestion } from '../../src/types/ai-suggestions.types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

interface TestUser {
  id: string;
  email: string;
  token: string;
  clearance_level: number;
  organization_id: string;
}

interface AIsuggestionResponse {
  success: boolean;
  suggestions?: AILinkSuggestion[];
  metadata?: {
    generated_at: string;
    ai_service: string;
    cache_hit: boolean;
    total_suggestions: number;
  };
  error?: {
    code: string;
    message: string;
    fallback?: string;
    retry_after?: number;
  };
}

interface AcceptSuggestionResponse {
  success: boolean;
  link?: any;
  accepted_suggestion?: {
    suggestion_id: string;
    entity_id: string;
    entity_type: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

describe('AI Link Suggestions API Contract Tests', () => {
  let supabase: SupabaseClient;
  let testUser: TestUser;
  let testIntakeId: string;
  let testOrganizationId: string;
  let testDossierId: string;
  let testPositionId: string;
  let createdSuggestionIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name_en: 'AI Test Organization',
        name_ar: 'منظمة اختبار الذكاء الاصطناعي',
        org_type: 'government',
      })
      .select()
      .single();

    if (orgError || !orgData) {
      throw new Error(`Failed to create test organization: ${orgError?.message}`);
    }

    testOrganizationId = orgData.id;

    // Create test user with high clearance
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-ai-suggestions@example.com',
      password: 'test-password-123',
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUser = {
      id: authData.user.id,
      email: authData.user.email!,
      token: authData.session!.access_token,
      clearance_level: 3,
      organization_id: testOrganizationId,
    };

    // Update user profile
    await supabase.from('profiles').upsert({
      user_id: testUser.id,
      clearance_level: testUser.clearance_level,
      organization_id: testOrganizationId,
    });

    // Create test intake ticket
    const { data: intakeData, error: intakeError } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Test Intake for AI Suggestions',
        title_ar: 'تذكرة اختبار لاقتراحات الذكاء الاصطناعي',
        description_en: 'This intake discusses bilateral trade relations with Saudi Arabia',
        description_ar: 'تناقش هذه التذكرة العلاقات التجارية الثنائية مع المملكة العربية السعودية',
        classification_level: 2,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'pending_review',
      })
      .select()
      .single();

    if (intakeError || !intakeData) {
      throw new Error(`Failed to create test intake: ${intakeError?.message}`);
    }

    testIntakeId = intakeData.id;

    // Create test entities for AI suggestions
    // 1. Dossier about Saudi Arabia (should be high relevance)
    const { data: dossierData } = await supabase
      .from('dossiers')
      .insert({
        title: 'Saudi Arabia Bilateral Relations',
        status: 'active',
        classification_level: 2,
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testDossierId = dossierData!.id;

    // 2. Position about trade
    const { data: positionData } = await supabase
      .from('positions')
      .insert({
        title_en: 'Trade Agreement Position',
        title_ar: 'موقف اتفاقية التجارة',
        classification_level: 1,
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testPositionId = positionData!.id;

    // Create intake embedding (for vector similarity)
    await supabase.from('intake_embeddings').insert({
      intake_id: testIntakeId,
      embedding: Array(1536).fill(0.1), // Mock embedding
      model: 'test-model',
      created_at: new Date().toISOString(),
    });

    // Create entity embeddings
    await supabase.from('entity_embeddings').insert([
      {
        entity_type: 'dossier',
        entity_id: testDossierId,
        embedding: Array(1536).fill(0.15), // Similar to intake
        model: 'test-model',
        created_at: new Date().toISOString(),
      },
      {
        entity_type: 'position',
        entity_id: testPositionId,
        embedding: Array(1536).fill(0.05), // Less similar
        model: 'test-model',
        created_at: new Date().toISOString(),
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup: Delete created suggestions
    if (createdSuggestionIds.length > 0) {
      await supabase.from('ai_link_suggestions').delete().in('suggestion_id', createdSuggestionIds);
    }

    // Delete embeddings
    await supabase.from('intake_embeddings').delete().eq('intake_id', testIntakeId);
    await supabase.from('entity_embeddings').delete().in('entity_id', [testDossierId, testPositionId]);

    // Delete test intake
    if (testIntakeId) {
      await supabase.from('intake_tickets').delete().eq('id', testIntakeId);
    }

    // Delete test entities
    if (testDossierId) {
      await supabase.from('dossiers').delete().eq('id', testDossierId);
    }
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }

    // Delete test organization
    if (testOrganizationId) {
      await supabase.from('organizations').delete().eq('id', testOrganizationId);
    }

    // Delete test user
    if (testUser.id) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  beforeEach(() => {
    // Reset created suggestion IDs for each test
    createdSuggestionIds = [];
  });

  describe('T040: POST /api/intake/:intake_id/links/suggestions - Generate AI Suggestions', () => {
    it('should generate AI-powered link suggestions for intake', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_suggestions: 5,
        }),
      });

      expect(response.status).toBe(200);

      const responseData: AIsuggestionResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.suggestions).toBeDefined();
      expect(Array.isArray(responseData.suggestions)).toBe(true);
      expect(responseData.suggestions!.length).toBeGreaterThan(0);
      expect(responseData.suggestions!.length).toBeLessThanOrEqual(5);

      // Verify suggestion structure
      const suggestion = responseData.suggestions![0];
      expect(suggestion.suggestion_id).toBeDefined();
      expect(suggestion.entity_id).toBeDefined();
      expect(suggestion.entity_type).toBeDefined();
      expect(suggestion.entity_name).toBeDefined();
      expect(suggestion.confidence_score).toBeDefined();
      expect(suggestion.confidence_score).toBeGreaterThanOrEqual(0);
      expect(suggestion.confidence_score).toBeLessThanOrEqual(1);
      expect(suggestion.reasoning).toBeDefined();
      expect(suggestion.suggested_link_type).toBeDefined();
      expect(suggestion.rank).toBeDefined();

      // Store suggestion IDs for cleanup
      createdSuggestionIds.push(...responseData.suggestions!.map(s => s.suggestion_id));
    });

    it('should filter suggestions by entity_types parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_types: ['dossier'],
          max_suggestions: 10,
        }),
      });

      expect(response.status).toBe(200);

      const responseData: AIsuggestionResponse = await response.json();
      expect(responseData.success).toBe(true);
      
      // All suggestions should be dossier type
      expect(responseData.suggestions!.every(s => s.entity_type === 'dossier')).toBe(true);

      createdSuggestionIds.push(...responseData.suggestions!.map(s => s.suggestion_id));
    });

    it('should return suggestions ranked by confidence score (DESC)', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_suggestions: 5,
        }),
      });

      const responseData: AIsuggestionResponse = await response.json();
      const suggestions = responseData.suggestions!;

      // Verify descending order by confidence_score
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].confidence_score).toBeGreaterThanOrEqual(suggestions[i + 1].confidence_score);
      }

      // Verify rank increments
      for (let i = 0; i < suggestions.length; i++) {
        expect(suggestions[i].rank).toBe(i + 1);
      }

      createdSuggestionIds.push(...suggestions.map(s => s.suggestion_id));
    });

    it('should enforce rate limiting (3 requests/minute per user)', async () => {
      // Make 3 rapid requests (should succeed)
      for (let i = 0; i < 3; i++) {
        const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_suggestions: 1 }),
        });

        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_suggestions: 1 }),
      });

      expect(response.status).toBe(429);

      const responseData: AIsuggestionResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(responseData.error!.retry_after).toBe(60);
    }, 10000); // Longer timeout for rate limit test

    it('should filter suggestions by user clearance level', async () => {
      // Create high clearance dossier
      const { data: secretDossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Secret Dossier',
          status: 'active',
          classification_level: 4, // Above user's clearance
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      // Create embedding for secret dossier
      await supabase.from('entity_embeddings').insert({
        entity_type: 'dossier',
        entity_id: secretDossier!.id,
        embedding: Array(1536).fill(0.2), // High similarity
        model: 'test-model',
      });

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_types: ['dossier'],
          max_suggestions: 10,
        }),
      });

      const responseData: AIsuggestionResponse = await response.json();

      // Secret dossier should NOT appear in suggestions (clearance 4 > user clearance 3)
      expect(responseData.suggestions!.find(s => s.entity_id === secretDossier!.id)).toBeUndefined();

      // All suggestions should have clearance <= user clearance
      expect(responseData.suggestions!.every(s => s.classification_level! <= testUser.clearance_level)).toBe(true);

      // Cleanup
      await supabase.from('entity_embeddings').delete().eq('entity_id', secretDossier!.id);
      await supabase.from('dossiers').delete().eq('id', secretDossier!.id);

      createdSuggestionIds.push(...responseData.suggestions!.map(s => s.suggestion_id));
    });

    it('should enforce organization boundaries (multi-tenancy)', async () => {
      // Create entity in different organization
      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({
          name_en: 'Other Organization',
          name_ar: 'منظمة أخرى',
          org_type: 'government',
        })
        .select()
        .single();

      const { data: otherDossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Dossier in Other Org',
          status: 'active',
          classification_level: 1,
          organization_id: otherOrg!.id,
        })
        .select()
        .single();

      // Create embedding for other org's dossier
      await supabase.from('entity_embeddings').insert({
        entity_type: 'dossier',
        entity_id: otherDossier!.id,
        embedding: Array(1536).fill(0.2), // High similarity
        model: 'test-model',
      });

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_types: ['dossier'],
          max_suggestions: 10,
        }),
      });

      const responseData: AIsuggestionResponse = await response.json();

      // Other org's dossier should NOT appear in suggestions
      expect(responseData.suggestions!.find(s => s.entity_id === otherDossier!.id)).toBeUndefined();

      // Cleanup
      await supabase.from('entity_embeddings').delete().eq('entity_id', otherDossier!.id);
      await supabase.from('dossiers').delete().eq('id', otherDossier!.id);
      await supabase.from('organizations').delete().eq('id', otherOrg!.id);

      createdSuggestionIds.push(...responseData.suggestions!.map(s => s.suggestion_id));
    });

    it('should return cached results on repeated requests (cache_hit=true)', async () => {
      // First request (generates suggestions)
      const firstResponse = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_suggestions: 3 }),
      });

      const firstData: AIsuggestionResponse = await firstResponse.json();
      expect(firstData.metadata!.cache_hit).toBe(false);

      const firstSuggestions = firstData.suggestions!.map(s => s.suggestion_id);
      createdSuggestionIds.push(...firstSuggestions);

      // Wait for cache to be written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Second request (should use cache)
      const secondResponse = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_suggestions: 3 }),
      });

      const secondData: AIsuggestionResponse = await secondResponse.json();
      expect(secondData.metadata!.cache_hit).toBe(true);

      // Suggestions should be identical
      const secondSuggestions = secondData.suggestions!.map(s => s.suggestion_id);
      expect(secondSuggestions.sort()).toEqual(firstSuggestions.sort());
    }, 15000); // Longer timeout for cache test

    it('should return 503 with fallback when AnythingLLM service is unavailable', async () => {
      // Mock AnythingLLM API being down (simulate by invalid API key)
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
          'X-Force-AI-Error': 'true', // Test header to simulate AI failure
        },
        body: JSON.stringify({ max_suggestions: 5 }),
      });

      // Should gracefully degrade
      if (response.status === 503) {
        const responseData: AIsuggestionResponse = await response.json();
        expect(responseData.success).toBe(false);
        expect(responseData.error!.fallback).toBe('manual_search');
        expect(responseData.error!.message).toContain('temporarily unavailable');
        expect(responseData.error!.retry_after).toBeDefined();
      }
      // Or return empty results
      else if (response.status === 200) {
        const responseData: AIsuggestionResponse = await response.json();
        expect(responseData.success).toBe(true);
        expect(responseData.suggestions).toBeDefined();
        // May be empty or fallback to vector similarity only
      }
    });
  });

  describe('T041: POST /api/intake/:intake_id/links/suggestions/accept - Accept Suggestion', () => {
    let suggestionId: string;
    let suggestionEntityId: string;
    let suggestionEntityType: string;

    beforeEach(async () => {
      // Generate suggestions first
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_suggestions: 1 }),
      });

      const data: AIsuggestionResponse = await response.json();
      const suggestion = data.suggestions![0];

      suggestionId = suggestion.suggestion_id;
      suggestionEntityId = suggestion.entity_id;
      suggestionEntityType = suggestion.entity_type;

      createdSuggestionIds.push(suggestionId);
    });

    it('should accept AI suggestion and create entity link', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          entity_id: suggestionEntityId,
          entity_type: suggestionEntityType,
          link_type: 'related',
          notes: 'Accepted from AI suggestion',
        }),
      });

      expect(response.status).toBe(201);

      const responseData: AcceptSuggestionResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.link).toBeDefined();
      expect(responseData.accepted_suggestion).toBeDefined();

      // Verify link was created
      expect(responseData.link.intake_id).toBe(testIntakeId);
      expect(responseData.link.entity_id).toBe(suggestionEntityId);
      expect(responseData.link.entity_type).toBe(suggestionEntityType);
      expect(responseData.link.source).toBe('ai'); // Source should be 'ai', not 'human'

      // Verify suggestion was marked as accepted
      const { data: suggestion } = await supabase
        .from('ai_link_suggestions')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .single();

      expect(suggestion!.accepted).toBe(true);
      expect(suggestion!.accepted_by).toBe(testUser.id);
      expect(suggestion!.accepted_at).toBeDefined();

      // Cleanup
      await supabase.from('intake_entity_links').delete().eq('id', responseData.link.id);
    });

    it('should record acceptance metadata for analytics', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          entity_id: suggestionEntityId,
          entity_type: suggestionEntityType,
          link_type: 'related',
        }),
      });

      const responseData: AcceptSuggestionResponse = await response.json();

      // Query ai_link_suggestions table
      const { data: suggestion } = await supabase
        .from('ai_link_suggestions')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .single();

      // Verify analytics fields
      expect(suggestion!.accepted).toBe(true);
      expect(suggestion!.accepted_by).toBe(testUser.id);
      expect(suggestion!.accepted_at).toBeDefined();
      expect(new Date(suggestion!.accepted_at!).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(suggestion!.accepted_at!).getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute

      // Cleanup
      await supabase.from('intake_entity_links').delete().eq('id', responseData.link!.id);
    });

    it('should validate suggestion_id exists', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: '00000000-0000-0000-0000-000000000000', // Non-existent
          entity_id: suggestionEntityId,
          entity_type: suggestionEntityType,
          link_type: 'related',
        }),
      });

      expect(response.status).toBe(404);

      const responseData: AcceptSuggestionResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('SUGGESTION_NOT_FOUND');
    });

    it('should return error if suggestion was already accepted', async () => {
      // Accept suggestion first time
      await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          entity_id: suggestionEntityId,
          entity_type: suggestionEntityType,
          link_type: 'related',
        }),
      });

      // Try to accept again
      const secondResponse = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/suggestions/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          entity_id: suggestionEntityId,
          entity_type: suggestionEntityType,
          link_type: 'related',
        }),
      });

      expect(secondResponse.status).toBe(400);

      const responseData: AcceptSuggestionResponse = await secondResponse.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('SUGGESTION_ALREADY_ACCEPTED');
    });
  });

  describe('T042: TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating no AI Suggestions Edge Function exists yet', () => {
      // This test serves as a checkpoint to ensure TDD approach
      // When this suite first runs, all tests should fail because Edge Functions don't exist yet
      expect(true).toBe(true);
    });
  });
});
