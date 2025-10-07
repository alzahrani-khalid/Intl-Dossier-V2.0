import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Performance Test: Auto-Assignment Latency - T080
 * Validates p95 latency for auto-assignment endpoint
 *
 * Prerequisites:
 * - Run seed-performance-data.sql to populate test data
 *   (500 staff, 10k assignments, 1k queue items)
 *
 * Targets:
 * - Auto-assignment: <500ms p95
 * - 100 requests to assignments-auto-assign endpoint
 */

describe('Auto-Assignment Latency Performance', () => {
  let supabase: SupabaseClient;
  let authToken: string;
  let testSkills: string[] = [];

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    supabase = createClient(supabaseUrl, supabaseKey);

    // Login as supervisor (can trigger auto-assignment)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'supervisor@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    if (authError) throw authError;
    authToken = authData.session?.access_token || '';

    // Get some skills from the seeded data for realistic tests
    const { data: skills } = await supabase
      .from('skills')
      .select('id')
      .limit(10);

    testSkills = skills?.map((s) => s.id) || [];
  });

  afterAll(async () => {
    // Cleanup test assignments created during performance test
    await supabase
      .from('assignments')
      .delete()
      .ilike('work_item_id', 'perf-test-%');
  });

  it('should auto-assign work items in <500ms p95 (capacity available)', async () => {
    const iterations = 100;
    const responseTimes: number[] = [];
    const createdWorkItemIds: string[] = [];

    console.log('\n🚀 Testing auto-assignment latency with available capacity...');

    for (let i = 0; i < iterations; i++) {
      const workItemId = `perf-test-capacity-${Date.now()}-${i}`;
      createdWorkItemIds.push(workItemId);

      // Select 1-3 random skills for each request
      const skillCount = 1 + Math.floor(Math.random() * 3);
      const requiredSkills = testSkills.slice(0, skillCount);

      const startTime = performance.now();

      const response = await fetch(`${process.env.SUPABASE_URL || 'http://localhost:54321'}/functions/v1/assignments-auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          work_item_id: workItemId,
          work_item_type: 'ticket',
          required_skills: requiredSkills,
          priority: 'normal',
        }),
      });

      const endTime = performance.now();
      const latency = endTime - startTime;
      responseTimes.push(latency);

      // Verify response
      expect(response.ok).toBe(true);
      const data = await response.json();

      // Can be either assigned (200) or queued (202)
      if (response.status === 200) {
        expect(data).toHaveProperty('assignment_id');
        expect(data).toHaveProperty('assignee_id');
        expect(data).toHaveProperty('sla_deadline');
      } else if (response.status === 202) {
        expect(data.queued).toBe(true);
        expect(data).toHaveProperty('queue_id');
      }

      // Progress indicator every 20 iterations
      if ((i + 1) % 20 === 0) {
        console.log(`  ✓ Completed ${i + 1}/${iterations} requests...`);
      }
    }

    // Calculate statistics
    const p50 = calculatePercentile(responseTimes, 50);
    const p75 = calculatePercentile(responseTimes, 75);
    const p95 = calculatePercentile(responseTimes, 95);
    const p99 = calculatePercentile(responseTimes, 99);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);

    console.log('\n📊 Auto-Assignment Latency Statistics:');
    console.log(`  Min:  ${min.toFixed(2)}ms`);
    console.log(`  Avg:  ${avg.toFixed(2)}ms`);
    console.log(`  P50:  ${p50.toFixed(2)}ms`);
    console.log(`  P75:  ${p75.toFixed(2)}ms`);
    console.log(`  P95:  ${p95.toFixed(2)}ms`);
    console.log(`  P99:  ${p99.toFixed(2)}ms`);
    console.log(`  Max:  ${max.toFixed(2)}ms\n`);

    // Assert target: p95 < 500ms
    expect(p95).toBeLessThan(500);
  });

  it('should handle queuing in <500ms p95 (no capacity)', async () => {
    const iterations = 50; // Fewer iterations for queuing scenario
    const responseTimes: number[] = [];
    const createdWorkItemIds: string[] = [];

    console.log('\n🚀 Testing auto-assignment latency with queuing fallback...');

    for (let i = 0; i < iterations; i++) {
      const workItemId = `perf-test-queue-${Date.now()}-${i}`;
      createdWorkItemIds.push(workItemId);

      // Request very specific skill combination to trigger queuing
      const requiredSkills = testSkills.slice(0, 5); // Many skills = harder to match

      const startTime = performance.now();

      const response = await fetch(`${process.env.SUPABASE_URL || 'http://localhost:54321'}/functions/v1/assignments-auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          work_item_id: workItemId,
          work_item_type: 'dossier',
          required_skills: requiredSkills,
          priority: 'urgent',
        }),
      });

      const endTime = performance.now();
      const latency = endTime - startTime;
      responseTimes.push(latency);

      expect(response.ok).toBe(true);

      // Progress indicator every 10 iterations
      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Completed ${i + 1}/${iterations} requests...`);
      }
    }

    // Calculate statistics
    const p50 = calculatePercentile(responseTimes, 50);
    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log('\n📊 Queuing Latency Statistics:');
    console.log(`  Avg:  ${avg.toFixed(2)}ms`);
    console.log(`  P50:  ${p50.toFixed(2)}ms`);
    console.log(`  P95:  ${p95.toFixed(2)}ms\n`);

    // Cleanup queue entries
    await supabase
      .from('assignment_queue')
      .delete()
      .in('work_item_id', createdWorkItemIds);

    // Assert target: p95 < 500ms even for queuing
    expect(p95).toBeLessThan(500);
  });

  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 20;
    const responseTimes: number[] = [];
    const createdWorkItemIds: string[] = [];

    console.log('\n🚀 Testing concurrent auto-assignment requests...');

    const startTime = performance.now();

    // Create array of concurrent promises
    const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
      const workItemId = `perf-test-concurrent-${Date.now()}-${i}`;
      createdWorkItemIds.push(workItemId);

      const requestStart = performance.now();

      const response = await fetch(`${process.env.SUPABASE_URL || 'http://localhost:54321'}/functions/v1/assignments-auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          work_item_id: workItemId,
          work_item_type: 'ticket',
          required_skills: [testSkills[0]],
          priority: 'normal',
        }),
      });

      const requestEnd = performance.now();
      responseTimes.push(requestEnd - requestStart);

      expect(response.ok).toBe(true);
      return response.json();
    });

    // Wait for all concurrent requests to complete
    await Promise.all(promises);

    const totalTime = performance.now() - startTime;

    // Calculate statistics
    const p95 = calculatePercentile(responseTimes, 95);
    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

    console.log('\n📊 Concurrent Request Statistics:');
    console.log(`  Concurrent Requests: ${concurrentRequests}`);
    console.log(`  Total Time:          ${totalTime.toFixed(2)}ms`);
    console.log(`  Avg Latency:         ${avg.toFixed(2)}ms`);
    console.log(`  P95 Latency:         ${p95.toFixed(2)}ms\n`);

    // Assert: concurrent processing should still meet p95 target
    expect(p95).toBeLessThan(500);

    // Assert: total time should be reasonable (concurrent processing benefit)
    // With good concurrency, should complete in < 2000ms
    expect(totalTime).toBeLessThan(2000);
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
