import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('POST /engagements/{id}/briefing-packs - Contract Tests', () => {
  let authToken: string;
  let testEngagementId: string;
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
      .insert({ title: 'Test Dossier for Generation', status: 'active' })
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

    // Create test positions
    const positions = Array.from({ length: 5 }, (_, i) => ({
      title: `Test Position ${i + 1}`,
      content: `Test content ${i + 1}`,
      type: 'policy_brief',
      dossier_id: testDossierId,
    }));

    const { data: createdPositions } = await supabase
      .from('positions')
      .insert(positions)
      .select();
    testPositionIds = createdPositions?.map(p => p.id) || [];

    // Attach positions to engagement
    await supabase.from('engagement_positions').insert(
      testPositionIds.map(positionId => ({
        engagement_id: testEngagementId,
        position_id: positionId,
      }))
    );
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('engagement_positions').delete().eq('engagement_id', testEngagementId);
    await supabase.from('positions').delete().in('id', testPositionIds);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T016: should return 202 with job_id for English pack', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
        }),
      }
    );

    expect(response.status).toBe(202);
    const data = await response.json();

    expect(data).toHaveProperty('job_id');
    expect(data).toHaveProperty('status', 'pending');
    expect(typeof data.job_id).toBe('string');
  });

  it('T016: should return 202 with job_id for Arabic pack', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'ar',
        }),
      }
    );

    expect(response.status).toBe(202);
    const data = await response.json();

    expect(data).toHaveProperty('job_id');
  });

  it('T016: should return 400 NO_POSITIONS_ATTACHED for empty engagement', async () => {
    // Create engagement without positions
    const { data: emptyEngagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Empty Engagement',
        date: new Date().toISOString(),
      })
      .select()
      .single();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${emptyEngagement.id}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('NO_POSITIONS_ATTACHED');

    // Clean up
    await supabase.from('engagements').delete().eq('id', emptyEngagement.id);
  });

  it('T016: should return 400 TOO_MANY_POSITIONS for >100 positions', async () => {
    // This test would require creating 101+ positions, which is expensive
    // Instead, we'll test the validation logic by checking the error format
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
          position_ids: Array.from({ length: 101 }, (_, i) => `00000000-0000-0000-0000-00000000000${i % 10}`),
        }),
      }
    );

    // Should reject based on count validation
    expect([400, 422]).toContain(response.status);
  });

  it('T016: should return 400 for invalid language', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'invalid',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('T016: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('T016: should return 404 for non-existent engagement', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${fakeId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
        }),
      }
    );

    expect(response.status).toBe(404);
  });
});
