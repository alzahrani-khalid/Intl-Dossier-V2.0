import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('GET /positions/{id}/analytics - Contract Tests', () => {
  let authToken: string;
  let testPositionId: string;
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
      .insert({ title: 'Test Dossier for Analytics', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title: 'Test Position for Analytics',
        content: 'Test content',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();
    testPositionId = position.id;

    // Create analytics record
    await supabase.from('position_usage_analytics').insert({
      position_id: testPositionId,
      view_count: 42,
      attachment_count: 7,
      briefing_pack_count: 3,
      last_viewed_at: new Date().toISOString(),
      last_attached_at: new Date().toISOString(),
      trend_data: {
        daily: [5, 8, 12, 17],
        weekly: [25, 35, 42],
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('position_usage_analytics').delete().eq('position_id', testPositionId);
    await supabase.from('positions').delete().eq('id', testPositionId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T018: should return 200 with analytics data', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('position_id', testPositionId);
    expect(data).toHaveProperty('view_count');
    expect(data).toHaveProperty('attachment_count');
    expect(data).toHaveProperty('briefing_pack_count');
    expect(data).toHaveProperty('last_viewed_at');
    expect(data).toHaveProperty('last_attached_at');
  });

  it('T018: should include computed popularity_score', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    expect(data).toHaveProperty('popularity_score');
    expect(typeof data.popularity_score).toBe('number');
    expect(data.popularity_score).toBeGreaterThanOrEqual(0);
  });

  it('T018: should include usage_rank', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    expect(data).toHaveProperty('usage_rank');
    expect(typeof data.usage_rank).toBe('number');
    expect(data.usage_rank).toBeGreaterThan(0);
  });

  it('T018: should include trend_data', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    expect(data).toHaveProperty('trend_data');
    expect(data.trend_data).toHaveProperty('daily');
    expect(data.trend_data).toHaveProperty('weekly');
    expect(Array.isArray(data.trend_data.daily)).toBe(true);
  });

  it('T018: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`
    );

    expect(response.status).toBe(401);
  });

  it('T018: should return 404 for non-existent position', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${fakeId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('T018: should return analytics even for positions with zero usage', async () => {
    // Create a new position with no usage
    const { data: newPosition } = await supabase
      .from('positions')
      .insert({
        title: 'Unused Position',
        content: 'Test content',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${newPosition.id}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.view_count).toBe(0);
    expect(data.attachment_count).toBe(0);
    expect(data.briefing_pack_count).toBe(0);

    // Clean up
    await supabase.from('positions').delete().eq('id', newPosition.id);
  });
});
