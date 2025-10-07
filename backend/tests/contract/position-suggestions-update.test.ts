import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('POST /engagements/{id}/positions/suggestions - Contract Tests', () => {
  let authToken: string;
  let testEngagementId: string;
  let testDossierId: string;
  let testSuggestionId: string;

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
        title: 'Test Engagement',
        date: new Date().toISOString(),
      })
      .select()
      .single();
    testEngagementId = engagement.id;

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title: 'Test Position',
        content: 'Test content',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();

    // Create test suggestion
    const { data: suggestion } = await supabase
      .from('position_suggestions')
      .insert({
        engagement_id: testEngagementId,
        position_id: position.id,
        relevance_score: 0.85,
        suggestion_reasoning: { keywords: ['test'] },
      })
      .select()
      .single();
    testSuggestionId = suggestion.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('position_suggestions').delete().eq('id', testSuggestionId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T014: should return 200 when updating action to accepted', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: testSuggestionId,
          action: 'accepted',
        }),
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('user_action', 'accepted');
    expect(data).toHaveProperty('actioned_at');
  });

  it('T014: should return 200 when updating action to rejected', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: testSuggestionId,
          action: 'rejected',
        }),
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('user_action', 'rejected');
  });

  it('T014: should return 200 when updating action to ignored', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: testSuggestionId,
          action: 'ignored',
        }),
      }
    );

    expect(response.status).toBe(200);
  });

  it('T014: should return 400 for invalid action', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: testSuggestionId,
          action: 'invalid_action',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('T014: should return 400 for missing suggestion_id', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'accepted',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('T014: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: testSuggestionId,
          action: 'accepted',
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('T014: should return 404 for non-existent suggestion', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions/suggestions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_id: fakeId,
          action: 'accepted',
        }),
      }
    );

    expect(response.status).toBe(404);
  });
});
