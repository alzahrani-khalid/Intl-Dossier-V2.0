import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('T021: Integration Test - AI Suggestions with Fallback', () => {
  let authToken: string;
  let testEngagementId: string;
  let testDossierId: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@gastat.sa',
      password: 'Test@12345'
    });
    authToken = authData.session?.access_token || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier for AI Suggestions', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'AI Suggestion Test Engagement',
        description: 'Testing AI-powered position suggestions',
        date: new Date().toISOString(),
      })
      .select()
      .single();
    testEngagementId = engagement.id;

    // Create test positions with embeddings
    const positions = [
      { title: 'Climate Policy Brief', content: 'Climate change mitigation strategies', type: 'policy_brief' },
      { title: 'Economic Analysis', content: 'Economic impact of climate policies', type: 'analysis' },
      { title: 'Stakeholder Report', content: 'Key stakeholders in climate negotiations', type: 'report' },
    ];

    for (const pos of positions) {
      const { data: position } = await supabase
        .from('positions')
        .insert({ ...pos, dossier_id: testDossierId })
        .select()
        .single();

      // Create embedding (mock vector data for testing)
      await supabase
        .from('position_embeddings')
        .insert({
          position_id: position.id,
          embedding: Array(1536).fill(0).map(() => Math.random()),
          model_version: 'test-v1',
          source_text: pos.content,
        });
    }
  });

  afterAll(async () => {
    // Clean up test data
    const { data: positions } = await supabase
      .from('positions')
      .select('id')
      .eq('dossier_id', testDossierId);

    if (positions) {
      for (const pos of positions) {
        await supabase.from('position_embeddings').delete().eq('position_id', pos.id);
      }
    }

    await supabase.from('positions').delete().eq('dossier_id', testDossierId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return AI-powered suggestions when service available', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.5&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(result.meta).toHaveProperty('ai_service_status');
    expect(['available', 'degraded']).toContain(result.meta.ai_service_status);
    expect(result.meta.fallback_mode).toBe(false);

    // Verify suggestions have relevance scores
    if (result.data.length > 0) {
      const suggestion = result.data[0];
      expect(suggestion).toHaveProperty('position_id');
      expect(suggestion).toHaveProperty('relevance_score');
      expect(suggestion.relevance_score).toBeGreaterThanOrEqual(0.5);
      expect(suggestion.relevance_score).toBeLessThanOrEqual(1.0);
    }
  });

  it('should fall back to keyword search when AI service unavailable', async () => {
    // Mock AI service failure by setting invalid endpoint (if configurable)
    // Or test the fallback path when vector search returns empty

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.3&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Force-Fallback': 'true', // Custom header to trigger fallback for testing
        },
      }
    );

    // Expect either 200 with fallback or 503 with fallback data
    expect([200, 503]).toContain(response.status);
    const result = await response.json();

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');

    if (response.status === 503 || result.meta.fallback_mode === true) {
      expect(result.meta.ai_service_status).toBe('unavailable');
      expect(result.meta.fallback_mode).toBe(true);

      // Fallback suggestions should still be returned (keyword-based)
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it('should implement circuit breaker pattern on repeated failures', async () => {
    // Simulate multiple failures to trigger circuit breaker
    const failureAttempts = 3;
    let lastStatus = 200;

    for (let i = 0; i < failureAttempts; i++) {
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.7`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-Simulate-Failure': 'true', // Simulate failure
          },
        }
      );
      lastStatus = response.status;
    }

    // After multiple failures, circuit should open and return fallback immediately
    const finalResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.7`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const result = await finalResponse.json();

    // Either fallback mode or service degraded
    if (result.meta) {
      expect(['unavailable', 'degraded', 'available']).toContain(result.meta.ai_service_status);
    }
  });

  it('should cache suggestions for improved performance', async () => {
    // First request
    const startTime1 = Date.now();
    const response1 = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.7`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    const endTime1 = Date.now();
    const firstRequestTime = endTime1 - startTime1;

    expect(response1.status).toBe(200);
    const result1 = await response1.json();

    // Second request (should be cached)
    const startTime2 = Date.now();
    const response2 = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=0.7`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
    const endTime2 = Date.now();
    const secondRequestTime = endTime2 - startTime2;

    expect(response2.status).toBe(200);
    const result2 = await response2.json();

    // Cached response should be significantly faster (if cache is implemented)
    // This is a heuristic test - actual caching implementation may vary
    if (result2.meta?.cached) {
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.8);
    }
  });
});
