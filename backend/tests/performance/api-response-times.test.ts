import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Performance Test: API Response Times - T092
 * Validates p95 response times for position endpoints
 *
 * Targets:
 * - GET/POST/PUT: <200ms p95
 * - Approve (with step-up): <300ms p95
 * - 100 requests per endpoint
 */

describe('API Response Times Performance', () => {
  let supabase: SupabaseClient;
  let authToken: string;
  let testPositionId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    supabase = createClient(supabaseUrl, supabaseKey);

    // Login as drafter
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'drafter@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    if (authError) throw authError;
    authToken = authData.session?.access_token || '';

    // Create a test position for GET/PUT tests
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type: 'talking_point',
        title_en: 'Performance Test Position',
        title_ar: 'موقف اختبار الأداء',
        content_en: 'Test content',
        content_ar: 'محتوى الاختبار',
        thematic_category: 'economic',
        status: 'draft',
      })
      .select()
      .single();

    testPositionId = position?.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should GET position details in <200ms p95', async () => {
    const iterations = 100;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      await supabase
        .from('positions')
        .select('*')
        .eq('id', testPositionId)
        .single();

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
    }

    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log(`GET position - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);

    expect(p95).toBeLessThan(200);
  });

  it('should POST new position in <200ms p95', async () => {
    const iterations = 100;
    const responseTimes: number[] = [];
    const createdIds: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      const { data } = await supabase
        .from('positions')
        .insert({
          position_type: 'talking_point',
          title_en: `Perf Test ${i}`,
          title_ar: `اختبار الأداء ${i}`,
          content_en: 'Test content',
          content_ar: 'محتوى الاختبار',
          thematic_category: 'economic',
          status: 'draft',
        })
        .select()
        .single();

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
      if (data?.id) createdIds.push(data.id);
    }

    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log(`POST position - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);

    // Cleanup
    if (createdIds.length > 0) {
      await supabase.from('positions').delete().in('id', createdIds);
    }

    expect(p95).toBeLessThan(200);
  });

  it('should PUT position update in <200ms p95', async () => {
    const iterations = 100;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      await supabase
        .from('positions')
        .update({
          content_en: `Updated content ${i}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testPositionId);

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
    }

    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log(`PUT position - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);

    expect(p95).toBeLessThan(200);
  });

  it('should approve with step-up in <300ms p95', async () => {
    const iterations = 50; // Fewer iterations for approve due to complexity
    const responseTimes: number[] = [];

    // Submit position for approval first
    await supabase
      .from('positions')
      .update({ status: 'pending_approval' })
      .eq('id', testPositionId);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      // Simulate step-up verification + approval
      const { data: challenge } = await supabase
        .from('step_up_challenges')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified: true,
        })
        .select()
        .single();

      await supabase
        .from('approvals')
        .insert({
          position_id: testPositionId,
          stage: 1,
          action: 'approve',
          step_up_verified: true,
          step_up_challenge_id: challenge?.id,
          comments: `Approval ${i}`,
        });

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);

      // Cleanup approval records
      if (challenge?.id) {
        await supabase.from('step_up_challenges').delete().eq('id', challenge.id);
      }
    }

    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log(`Approve with step-up - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);

    expect(p95).toBeLessThan(300);
  });

  it('should list positions in <200ms p95', async () => {
    const iterations = 100;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      await supabase
        .from('positions')
        .select('id, title_en, title_ar, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
    }

    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log(`LIST positions - Avg: ${avg.toFixed(2)}ms, P95: ${p95.toFixed(2)}ms`);

    expect(p95).toBeLessThan(200);
  });
});

/**
 * Calculate percentile from array of numbers
 */
function calculatePercentile(arr: number[], percentile: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}
