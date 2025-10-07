import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('T020: Integration Test - Attach Position Flow', () => {
  let authToken: string;
  let userId: string;
  let testEngagementId: string;
  let testDossierId: string;
  let testPositionId: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@gastat.sa',
      password: 'Test@12345'
    });
    authToken = authData.session?.access_token || '';
    userId = authData.user?.id || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier for Attach Flow', status: 'active' })
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
        title: 'Test Position for Attach',
        content: 'Test content',
        type: 'policy_brief',
        dossier_id: testDossierId,
      })
      .select()
      .single();
    testPositionId = position.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('engagement_positions').delete().eq('engagement_id', testEngagementId);
    await supabase.from('positions').delete().eq('id', testPositionId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should complete full attach position flow', async () => {
    // Step 1: Select position (GET positions)
    const listResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/positions?dossier_id=eq.${testDossierId}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.SUPABASE_ANON_KEY || '',
        },
      }
    );

    expect(listResponse.status).toBe(200);
    const positions = await listResponse.json();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.some((p: any) => p.id === testPositionId)).toBe(true);

    // Step 2: Attach position to engagement
    const attachResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: testPositionId,
          attachment_reason: 'Relevant for testing',
        }),
      }
    );

    expect(attachResponse.status).toBe(201);
    const attachedPosition = await attachResponse.json();
    expect(attachedPosition).toHaveProperty('id');
    expect(attachedPosition.position_id).toBe(testPositionId);
    expect(attachedPosition.engagement_id).toBe(testEngagementId);

    // Step 3: Verify in attached positions list
    const attachedListResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(attachedListResponse.status).toBe(200);
    const attachedList = await attachedListResponse.json();
    expect(attachedList.positions.some((p: any) => p.position_id === testPositionId)).toBe(true);
  });

  it('should increment analytics on attach', async () => {
    // Get initial analytics
    let analyticsResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    let analytics = await analyticsResponse.json();
    const initialAttachmentCount = analytics.attachment_count || 0;

    // Attach position
    await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: testPositionId,
        }),
      }
    );

    // Verify analytics incremented
    analyticsResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions/${testPositionId}/analytics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    analytics = await analyticsResponse.json();
    expect(analytics.attachment_count).toBe(initialAttachmentCount + 1);
    expect(analytics.last_attached_at).toBeDefined();
  });

  it('should create audit log on attach', async () => {
    // Attach position
    await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: testPositionId,
          attachment_reason: 'Test audit',
        }),
      }
    );

    // Query audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'position_attached')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(auditLogs).toBeDefined();
    expect(auditLogs!.length).toBeGreaterThan(0);

    const log = auditLogs![0];
    expect(log.metadata).toHaveProperty('position_id', testPositionId);
    expect(log.metadata).toHaveProperty('engagement_id', testEngagementId);
  });

  it('should handle duplicate attachment correctly', async () => {
    // Attach position first time
    await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: testPositionId,
        }),
      }
    );

    // Attempt to attach same position again
    const duplicateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/positions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: testPositionId,
        }),
      }
    );

    expect(duplicateResponse.status).toBe(400);
    const error = await duplicateResponse.json();
    expect(error.error).toContain('POSITION_ALREADY_ATTACHED');
  });
});
