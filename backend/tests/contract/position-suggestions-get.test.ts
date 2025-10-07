import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('GET /engagements/{id}/positions/suggestions - Contract Tests', () => {
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
      .insert({ title: 'Test Dossier for Suggestions', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Climate Policy Meeting',
        description: 'Discussion on climate policy and environmental regulations',
        date: new Date().toISOString(),
      })
      .select()
      .single();
    testEngagementId = engagement.id;

    // Create test positions with embeddings
    const positions = [
      { title: 'Climate Policy Brief', content: 'Climate change mitigation strategies', type: 'policy_brief', dossier_id: testDossierId },
      { title: 'Environmental Regulations', content: 'Regulatory framework for environment', type: 'talking_points', dossier_id: testDossierId },
      { title: 'Economic Report', content: 'Economic indicators and forecasts', type: 'briefing_note', dossier_id: testDossierId },
    ];

    await supabase.from('positions').insert(positions);
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T013: should return 200 with AI suggestions', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data).toHaveProperty('fallback_mode');

    if (data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];
      expect(suggestion).toHaveProperty('position_id');
      expect(suggestion).toHaveProperty('relevance_score');
      expect(suggestion.relevance_score).toBeGreaterThanOrEqual(0);
      expect(suggestion.relevance_score).toBeLessThanOrEqual(1);
    }
  });

  it('T013: should respect min_relevance filter', async () => {
    const minRelevance = 0.8;
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?min_relevance=${minRelevance}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    data.suggestions.forEach((suggestion: any) => {
      expect(suggestion.relevance_score).toBeGreaterThanOrEqual(minRelevance);
    });
  });

  it('T013: should respect limit parameter', async () => {
    const limit = 5;
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.suggestions.length).toBeLessThanOrEqual(limit);
  });

  it('T013: should return 503 with fallback mode when AI unavailable', async () => {
    // This test simulates AI service being down
    // In production, circuit breaker would trigger this

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Simulate-AI-Failure': 'true', // Test header to simulate failure
        },
      }
    );

    // Could be 200 with fallback_mode: true or 503
    expect([200, 503]).toContain(response.status);

    const data = await response.json();
    if (response.status === 200) {
      expect(data.fallback_mode).toBe(true);
    }
  });

  it('T013: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`
    );

    expect(response.status).toBe(401);
  });

  it('T013: should return 404 for non-existent engagement', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${fakeId}/positions/suggestions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);
  });
});
