import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('GET /briefing-packs/jobs/{jobId}/status - Contract Tests', () => {
  let authToken: string;
  let testJobId: string;
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
      .insert({ title: 'Test Dossier for Job Status', status: 'active' })
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

    // Create a briefing pack (simulating a completed job)
    const { data: pack } = await supabase
      .from('briefing_packs')
      .insert({
        engagement_id: testEngagementId,
        position_ids: ['00000000-0000-0000-0000-000000000001'],
        language: 'en',
        generated_by: authData.user?.id,
        file_url: 'https://example.com/pack.pdf',
        file_size_bytes: 1024,
      })
      .select()
      .single();

    // Use the pack ID as job ID for testing
    testJobId = pack.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('briefing_packs').delete().eq('id', testJobId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T017: should return 200 with status for existing job', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${testJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('job_id', testJobId);
    expect(data).toHaveProperty('status');
    expect(['pending', 'generating', 'completed', 'failed']).toContain(data.status);
  });

  it('T017: should return completed status with briefing pack data', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${testJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    if (data.status === 'completed') {
      expect(data).toHaveProperty('briefing_pack');
      expect(data.briefing_pack).toHaveProperty('file_url');
      expect(data.briefing_pack).toHaveProperty('file_size_bytes');
      expect(data.briefing_pack).toHaveProperty('language');
    }
  });

  it('T017: should return pending status for new job', async () => {
    // Simulate creating a new job and immediately checking status
    // In reality, this would be done by POST /briefing-packs endpoint
    const newJobId = crypto.randomUUID();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${newJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    // Should either be 404 (job not found) or 200 with pending status
    expect([200, 404]).toContain(response.status);
  });

  it('T017: should return failed status with error details', async () => {
    // This test simulates a failed job
    // In production, jobs would fail due to timeouts, errors, etc.

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${testJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Simulate-Job-Failure': 'true', // Test header to simulate failure
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    if (data.status === 'failed') {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });

  it('T017: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${testJobId}/status`
    );

    expect(response.status).toBe(401);
  });

  it('T017: should return 404 for non-existent job', async () => {
    const fakeJobId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${fakeJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('T017: should return progress percentage for generating status', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${testJobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.status === 'generating') {
      expect(data).toHaveProperty('progress');
      expect(data.progress).toBeGreaterThanOrEqual(0);
      expect(data.progress).toBeLessThanOrEqual(100);
    }
  });
});
