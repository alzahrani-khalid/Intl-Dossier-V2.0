import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('GET /positions/analytics/top - Contract Tests', () => {
  let authToken: string;
  let testDossierId: string;
  let testPositionIds: string[] = [];

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
      .insert({ title: 'Test Dossier for Top Analytics', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test positions
    const positions = [
      { title: 'High Views Position', views: 100, attachments: 5, briefings: 2 },
      { title: 'High Attachments Position', views: 50, attachments: 20, briefings: 5 },
      { title: 'High Briefings Position', views: 30, attachments: 10, briefings: 15 },
      { title: 'Low Activity Position', views: 5, attachments: 1, briefings: 0 },
    ];

    for (const pos of positions) {
      const { data: position } = await supabase
        .from('positions')
        .insert({
          title: pos.title,
          content: `Test content for ${pos.title}`,
          type: 'policy_brief',
          dossier_id: testDossierId,
        })
        .select()
        .single();

      testPositionIds.push(position.id);

      // Create analytics
      await supabase.from('position_usage_analytics').insert({
        position_id: position.id,
        view_count: pos.views,
        attachment_count: pos.attachments,
        briefing_pack_count: pos.briefings,
        last_viewed_at: new Date().toISOString(),
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('position_usage_analytics').delete().in('position_id', testPositionIds);
    await supabase.from('positions').delete().in('id', testPositionIds);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T019: should return 200 with top positions by views', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data.positions)).toBe(true);
    expect(data.positions[0].title).toBe('High Views Position');

    // Verify descending order
    for (let i = 1; i < data.positions.length; i++) {
      expect(data.positions[i - 1].view_count).toBeGreaterThanOrEqual(data.positions[i].view_count);
    }
  });

  it('T019: should return top positions by attachments', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=attachments&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.positions[0].title).toBe('High Attachments Position');

    // Verify descending order
    for (let i = 1; i < data.positions.length; i++) {
      expect(data.positions[i - 1].attachment_count).toBeGreaterThanOrEqual(data.positions[i].attachment_count);
    }
  });

  it('T019: should return top positions by briefings', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=briefings&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.positions[0].title).toBe('High Briefings Position');

    // Verify descending order
    for (let i = 1; i < data.positions.length; i++) {
      expect(data.positions[i - 1].briefing_pack_count).toBeGreaterThanOrEqual(data.positions[i].briefing_pack_count);
    }
  });

  it('T019: should return top positions by popularity', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=popularity&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Popularity is weighted score, verify it exists
    data.positions.forEach((pos: any) => {
      expect(pos).toHaveProperty('popularity_score');
    });

    // Verify descending order by popularity_score
    for (let i = 1; i < data.positions.length; i++) {
      expect(data.positions[i - 1].popularity_score).toBeGreaterThanOrEqual(data.positions[i].popularity_score);
    }
  });

  it('T019: should filter by time_range=7d', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&time_range=7d`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // All positions should have last_viewed_at within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    data.positions.forEach((pos: any) => {
      if (pos.last_viewed_at) {
        const viewedAt = new Date(pos.last_viewed_at);
        expect(viewedAt.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      }
    });
  });

  it('T019: should filter by time_range=30d', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&time_range=30d`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
  });

  it('T019: should filter by time_range=90d', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&time_range=90d`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
  });

  it('T019: should return all results for time_range=all', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&time_range=all`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.positions.length).toBeGreaterThanOrEqual(4); // At least our 4 test positions
  });

  it('T019: should respect limit parameter', async () => {
    const limit = 2;
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.positions.length).toBeLessThanOrEqual(limit);
  });

  it('T019: should return 400 for invalid metric', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=invalid`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  it('T019: should return 400 for invalid time_range', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views&time_range=invalid`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  it('T019: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/analytics/top?metric=views`
    );

    expect(response.status).toBe(401);
  });
});
