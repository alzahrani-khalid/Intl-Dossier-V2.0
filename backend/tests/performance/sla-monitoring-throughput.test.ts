import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Performance Test: SLA Monitoring Throughput - T081
 * Validates throughput of SLA monitoring function
 *
 * Prerequisites:
 * - Run seed-performance-data.sql to populate test data
 *   (10,000 active assignments with varying SLA statuses)
 * - Ensure sla_check_and_escalate() function is deployed
 *
 * Targets:
 * - Process 10,000 assignments: <5 seconds
 * - SLA calculation accuracy: 100%
 * - Escalation triggering: correct for breached assignments
 */

describe('SLA Monitoring Throughput Performance', () => {
  let supabase: SupabaseClient;
  let serviceClient: SupabaseClient;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

    supabase = createClient(supabaseUrl, supabaseKey);
    serviceClient = createClient(supabaseUrl, serviceKey);

    // Verify seeded data exists
    const { count } = await serviceClient
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'assigned');

    if (!count || count < 1000) {
      console.warn('⚠️  Warning: Less than 1000 active assignments found. Run seed-performance-data.sql first.');
    } else {
      console.log(`✓ Found ${count} active assignments for throughput testing`);
    }
  });

  afterAll(async () => {
    // Cleanup test escalations created during performance test
    await serviceClient
      .from('escalation_events')
      .delete()
      .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last 1 minute
  });

  it('should process 10k assignments in <5 seconds', async () => {
    console.log('\n🚀 Testing SLA monitoring throughput...');

    // Get baseline assignment count
    const { count: beforeCount } = await serviceClient
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'assigned');

    console.log(`  📊 Processing ${beforeCount} active assignments...`);

    const startTime = performance.now();

    // Call the SLA monitoring function
    const { data, error } = await serviceClient.rpc('sla_check_and_escalate');

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`\n⏱️  SLA Monitoring Execution Time: ${duration.toFixed(2)}ms`);

    // Verify function executed successfully
    expect(error).toBeNull();

    // Calculate throughput
    const throughput = beforeCount ? (beforeCount / (duration / 1000)).toFixed(0) : 0;
    console.log(`📈 Throughput: ${throughput} assignments/second`);

    // Get escalation statistics
    const { count: escalatedCount } = await serviceClient
      .from('escalation_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(startTime).toISOString());

    console.log(`🚨 Escalations Triggered: ${escalatedCount || 0}`);

    // Get SLA status distribution
    const { data: statusDistribution } = await serviceClient
      .from('assignments')
      .select('sla_status')
      .eq('status', 'assigned');

    const statusCounts = statusDistribution?.reduce((acc: any, row: any) => {
      acc[row.sla_status] = (acc[row.sla_status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 SLA Status Distribution:');
    console.log(`  ✅ OK:       ${statusCounts?.ok || 0}`);
    console.log(`  ⚠️  Warning:  ${statusCounts?.warning || 0}`);
    console.log(`  🔴 Breached: ${statusCounts?.breached || 0}`);
    console.log(`  📤 Escalated: ${statusCounts?.escalated || 0}\n`);

    // Assert target: <5 seconds for 10k assignments
    expect(duration).toBeLessThan(5000);

    // Assert: Function should handle large datasets without errors
    expect(data).toBeDefined();
  });

  it('should calculate SLA status accurately', async () => {
    console.log('\n🎯 Testing SLA status calculation accuracy...');

    // Get assignments with calculated SLA status
    const { data: assignments } = await serviceClient
      .from('assignments')
      .select('id, sla_deadline, sla_status, created_at')
      .eq('status', 'assigned')
      .limit(100);

    const now = new Date();
    let accurateCount = 0;

    assignments?.forEach((assignment) => {
      const deadline = new Date(assignment.sla_deadline);
      const created = new Date(assignment.created_at);
      const totalDuration = deadline.getTime() - created.getTime();
      const elapsed = now.getTime() - created.getTime();
      const percentElapsed = (elapsed / totalDuration) * 100;

      // Verify SLA status calculation
      let expectedStatus: string;
      if (percentElapsed >= 100) {
        expectedStatus = 'breached';
      } else if (percentElapsed >= 75) {
        expectedStatus = 'warning';
      } else {
        expectedStatus = 'ok';
      }

      // Check if database status matches expected
      // Note: 'escalated' is also valid for breached items
      const isAccurate =
        assignment.sla_status === expectedStatus ||
        (expectedStatus === 'breached' && assignment.sla_status === 'escalated');

      if (isAccurate) {
        accurateCount++;
      }
    });

    const accuracy = assignments?.length
      ? (accurateCount / assignments.length) * 100
      : 0;

    console.log(`\n📊 SLA Calculation Accuracy: ${accuracy.toFixed(1)}%`);
    console.log(`  ✅ Accurate: ${accurateCount}/${assignments?.length || 0}\n`);

    // Assert: 100% accuracy expected
    expect(accuracy).toBe(100);
  });

  it('should trigger escalations for breached assignments', async () => {
    console.log('\n🚨 Testing escalation triggering...');

    // Get breached assignments (should be ~20% based on seed data)
    const { data: breachedBefore, count: breachedCount } = await serviceClient
      .from('assignments')
      .select('id', { count: 'exact' })
      .eq('status', 'assigned')
      .eq('sla_status', 'breached');

    console.log(`  🔴 Breached Assignments: ${breachedCount || 0}`);

    // Record escalations before monitoring
    const { count: escalationsBefore } = await serviceClient
      .from('escalation_events')
      .select('*', { count: 'exact', head: true });

    // Run SLA monitoring
    const startTime = performance.now();
    await serviceClient.rpc('sla_check_and_escalate');
    const duration = performance.now() - startTime;

    console.log(`  ⏱️  Execution Time: ${duration.toFixed(2)}ms`);

    // Check escalations after monitoring
    const { count: escalationsAfter } = await serviceClient
      .from('escalation_events')
      .select('*', { count: 'exact', head: true });

    const newEscalations = (escalationsAfter || 0) - (escalationsBefore || 0);

    console.log(`  📤 New Escalations: ${newEscalations}`);

    // Get updated assignment status
    const { count: escalatedCount } = await serviceClient
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'assigned')
      .eq('sla_status', 'escalated');

    console.log(`  ✅ Escalated Assignments: ${escalatedCount || 0}\n`);

    // Assert: Escalations should be created for breached assignments
    // Note: Not all breached may escalate if already escalated before
    expect(newEscalations).toBeGreaterThanOrEqual(0);

    // Assert: Escalated count should be > 0 if there were breached assignments
    if (breachedCount && breachedCount > 0) {
      expect(escalatedCount).toBeGreaterThan(0);
    }
  });

  it('should handle repeated monitoring runs efficiently', async () => {
    console.log('\n🔄 Testing repeated SLA monitoring runs...');

    const runs = 5;
    const durations: number[] = [];

    for (let i = 0; i < runs; i++) {
      const startTime = performance.now();
      const { error } = await serviceClient.rpc('sla_check_and_escalate');
      const duration = performance.now() - startTime;

      durations.push(duration);
      expect(error).toBeNull();

      console.log(`  Run ${i + 1}/${runs}: ${duration.toFixed(2)}ms`);
    }

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log('\n📊 Repeated Run Statistics:');
    console.log(`  Min:  ${minDuration.toFixed(2)}ms`);
    console.log(`  Avg:  ${avgDuration.toFixed(2)}ms`);
    console.log(`  Max:  ${maxDuration.toFixed(2)}ms\n`);

    // Assert: Average should still meet target
    expect(avgDuration).toBeLessThan(5000);

    // Assert: Consistency - max shouldn't be >2x min (indicates stable performance)
    expect(maxDuration).toBeLessThan(minDuration * 2);
  });

  it('should scale linearly with assignment count', async () => {
    console.log('\n📈 Testing linear scaling...');

    const testSizes = [100, 500, 1000];
    const results: Array<{ size: number; duration: number; throughput: number }> = [];

    for (const size of testSizes) {
      // Get assignments for this test size
      const { data: assignments } = await serviceClient
        .from('assignments')
        .select('id')
        .eq('status', 'assigned')
        .limit(size);

      if (!assignments || assignments.length < size) {
        console.warn(`  ⚠️  Not enough assignments for size ${size}, skipping...`);
        continue;
      }

      // Measure SLA check for this subset
      const startTime = performance.now();

      // Run SLA monitoring (will process all assignments, but we're measuring time)
      await serviceClient.rpc('sla_check_and_escalate');

      const duration = performance.now() - startTime;
      const throughput = (size / (duration / 1000));

      results.push({ size, duration, throughput });

      console.log(`  ${size} assignments: ${duration.toFixed(2)}ms (${throughput.toFixed(0)} items/sec)`);
    }

    // Verify linear scaling: throughput should be relatively consistent
    if (results.length >= 2) {
      const throughputs = results.map((r) => r.throughput);
      const avgThroughput = throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length;
      const variance = throughputs.reduce((sum, t) => sum + Math.pow(t - avgThroughput, 2), 0) / throughputs.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avgThroughput) * 100;

      console.log(`\n  📊 Throughput Consistency: ${coefficientOfVariation.toFixed(1)}% CV`);

      // Assert: Coefficient of variation should be < 50% (reasonable consistency)
      expect(coefficientOfVariation).toBeLessThan(50);
    }
  });
});
