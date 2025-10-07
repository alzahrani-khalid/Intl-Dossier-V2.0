import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('T022: Integration Test - Briefing Pack Generation', () => {
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
      .insert({ title: 'Test Dossier for Briefing Pack', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Briefing Pack Test Engagement',
        description: 'Testing briefing pack generation',
        date: new Date().toISOString(),
        stakeholders: ['Ministry of Finance', 'World Bank'],
      })
      .select()
      .single();
    testEngagementId = engagement.id;

    // Create test positions (mix of English and Arabic)
    const positions = [
      { title: 'Economic Policy Brief', content: 'Economic policy analysis...', language: 'en', type: 'policy_brief' },
      { title: 'التحليل الاقتصادي', content: 'تحليل اقتصادي مفصل...', language: 'ar', type: 'analysis' },
      { title: 'Stakeholder Report', content: 'Key stakeholder insights...', language: 'en', type: 'report' },
      { title: 'خطة التنفيذ', content: 'خطة تنفيذ شاملة...', language: 'ar', type: 'action_plan' },
      { title: 'Budget Analysis', content: 'Budget implications...', language: 'en', type: 'analysis' },
    ];

    for (const pos of positions) {
      const { data: position } = await supabase
        .from('positions')
        .insert({ ...pos, dossier_id: testDossierId })
        .select()
        .single();
      testPositionIds.push(position.id);

      // Attach position to engagement
      await supabase
        .from('engagement_positions')
        .insert({
          engagement_id: testEngagementId,
          position_id: position.id,
          attached_by: authData.user?.id,
        });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('briefing_packs').delete().eq('engagement_id', testEngagementId);
    await supabase.from('engagement_positions').delete().eq('engagement_id', testEngagementId);

    for (const positionId of testPositionIds) {
      await supabase.from('positions').delete().eq('id', positionId);
    }

    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should generate English briefing pack without translation', async () => {
    // Initiate generation
    const generateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
          position_ids: testPositionIds,
        }),
      }
    );

    expect(generateResponse.status).toBe(202);
    const generateResult = await generateResponse.json();
    expect(generateResult).toHaveProperty('job_id');
    const jobId = generateResult.job_id;

    // Poll for completion (max 15 seconds for 5 positions)
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 15;

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(statusResponse.status).toBe(200);
      const statusResult = await statusResponse.json();
      status = statusResult.status;

      attempts++;
    }

    expect(status).toBe('completed');
    expect(attempts).toBeLessThan(maxAttempts); // Should complete within timeout
  });

  it('should generate Arabic briefing pack with auto-translation', async () => {
    // Initiate generation with Arabic language
    const generateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'ar',
          position_ids: testPositionIds,
        }),
      }
    );

    expect(generateResponse.status).toBe(202);
    const generateResult = await generateResponse.json();
    expect(generateResult).toHaveProperty('job_id');
    const jobId = generateResult.job_id;

    // Poll for completion (may take longer due to translation)
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 20; // More time for translation

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const statusResult = await statusResponse.json();
      status = statusResult.status;

      // Check if translation was required
      if (status === 'completed' && statusResult.briefing_pack) {
        expect(statusResult.briefing_pack).toHaveProperty('file_url');
        expect(statusResult.briefing_pack.language).toBe('ar');

        // Verify metadata indicates translation occurred for English positions
        if (statusResult.briefing_pack.metadata) {
          expect(statusResult.briefing_pack.metadata).toHaveProperty('translations_performed');
        }
      }

      attempts++;
    }

    expect(status).toBe('completed');
  });

  it('should handle timeout for large briefing packs gracefully', async () => {
    // Create a very large number of positions (simulate 100+ positions)
    // This test verifies timeout handling

    const generateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'X-Simulate-Timeout': 'true', // Custom header to simulate timeout
        },
        body: JSON.stringify({
          language: 'en',
          position_ids: testPositionIds,
        }),
      }
    );

    // Should still accept the request
    expect([202, 400, 503]).toContain(generateResponse.status);

    if (generateResponse.status === 202) {
      const result = await generateResponse.json();
      const jobId = result.job_id;

      // Poll for status
      await new Promise(resolve => setTimeout(resolve, 12000)); // Wait beyond timeout

      const statusResponse = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const statusResult = await statusResponse.json();

      // Should be either failed with timeout error or completed
      expect(['failed', 'completed']).toContain(statusResult.status);

      if (statusResult.status === 'failed') {
        expect(statusResult.error).toBeDefined();
        expect(statusResult.error).toMatch(/timeout|exceeded/i);
      }
    }
  });

  it('should retry on generation failure with exponential backoff', async () => {
    // Simulate a failure scenario
    const generateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'X-Simulate-Transient-Error': 'true', // Simulate transient error
        },
        body: JSON.stringify({
          language: 'en',
          position_ids: testPositionIds.slice(0, 2), // Use fewer positions for faster test
        }),
      }
    );

    if (generateResponse.status === 202) {
      const result = await generateResponse.json();
      const jobId = result.job_id;

      // Monitor retry attempts via status endpoint
      let retryCount = 0;
      let lastStatus = 'pending';

      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(
          `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );

        const statusResult = await statusResponse.json();

        if (statusResult.metadata?.retry_count !== undefined) {
          retryCount = statusResult.metadata.retry_count;
        }

        if (statusResult.status === 'completed' || statusResult.status === 'failed') {
          lastStatus = statusResult.status;
          break;
        }
      }

      // Should have attempted retries (up to 3 as per spec)
      expect(retryCount).toBeGreaterThan(0);
      expect(retryCount).toBeLessThanOrEqual(3);
    }
  });

  it('should store briefing pack in Supabase Storage with correct URL', async () => {
    // Generate a briefing pack
    const generateResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
          position_ids: testPositionIds.slice(0, 3),
        }),
      }
    );

    const generateResult = await generateResponse.json();
    const jobId = generateResult.job_id;

    // Wait for completion
    let completed = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const statusResult = await statusResponse.json();

      if (statusResult.status === 'completed') {
        completed = true;

        // Verify briefing pack details
        expect(statusResult.briefing_pack).toHaveProperty('file_url');
        expect(statusResult.briefing_pack.file_url).toMatch(/supabase\.co\/storage\/v1\/object\/public/);
        expect(statusResult.briefing_pack).toHaveProperty('file_size_bytes');
        expect(statusResult.briefing_pack.file_size_bytes).toBeGreaterThan(0);

        // Verify PDF can be accessed
        const pdfResponse = await fetch(statusResult.briefing_pack.file_url);
        expect(pdfResponse.status).toBe(200);
        expect(pdfResponse.headers.get('content-type')).toContain('application/pdf');

        break;
      }
    }

    expect(completed).toBe(true);
  });
});
