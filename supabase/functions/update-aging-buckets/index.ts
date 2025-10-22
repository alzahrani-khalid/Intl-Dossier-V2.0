/**
 * Scheduled Job: Update Aging Buckets
 *
 * Task: T089a [Polish]
 * Schedule: Daily at 00:00 UTC (configured via pg_cron or external scheduler)
 * Purpose: Recalculate aging for all pending assignments and invalidate cache
 *
 * Aging buckets:
 * - 0-2 days: Recent
 * - 3-6 days: Moderate
 * - 7+ days: Overdue
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Redis } from 'https://deno.land/x/redis@v0.31.0/mod.ts';

interface AgingUpdateResult {
  total_assignments: number;
  updated_count: number;
  cache_keys_invalidated: number;
  execution_time_ms: number;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    // Verify this is a scheduled invocation (optional auth token)
    const authHeader = req.headers.get('Authorization');
    const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');

    if (schedulerToken && authHeader !== `Bearer ${schedulerToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Redis client
    const redisUrl = Deno.env.get('REDIS_URL') || 'redis://localhost:6379';
    const redis = await Redis.connect(redisUrl);

    // Step 1: Get all pending assignments with their current aging
    const { data: assignments, error: fetchError, count } = await supabase
      .from('assignments')
      .select('id, assignee_id, assigned_at', { count: 'exact' })
      .eq('status', 'pending');

    if (fetchError) {
      console.error('[update-aging-buckets] Error fetching assignments:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch assignments',
          details: fetchError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const totalAssignments = count || 0;
    console.log(`[update-aging-buckets] Processing ${totalAssignments} pending assignments`);

    // Step 2: Recalculate aging for each assignment
    // Note: In production, this could be optimized with a single SQL UPDATE statement
    // For now, we're using the query approach to trigger cache invalidation per assignment

    let updatedCount = 0;
    const affectedUserIds = new Set<string>();

    for (const assignment of assignments || []) {
      const daysSinceAssignment = Math.floor(
        (Date.now() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine aging bucket
      let agingBucket: string;
      if (daysSinceAssignment <= 2) {
        agingBucket = '0-2';
      } else if (daysSinceAssignment <= 6) {
        agingBucket = '3-6';
      } else {
        agingBucket = '7+';
      }

      // Update assignment with aging metadata (optional: store in metadata column)
      // For now, we just track affected users for cache invalidation

      if (assignment.assignee_id) {
        affectedUserIds.add(assignment.assignee_id);
      }

      updatedCount++;
    }

    // Step 3: Invalidate cache for all affected users
    let cacheKeysInvalidated = 0;

    for (const userId of affectedUserIds) {
      // Pattern: queue-filter:{user_id}:* - invalidate all filter caches for this user
      const pattern = `queue-filter:${userId}:*`;

      try {
        // Get all keys matching the pattern
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
          await redis.del(...keys);
          cacheKeysInvalidated += keys.length;
        }
      } catch (cacheError) {
        console.error(`[update-aging-buckets] Error invalidating cache for user ${userId}:`, cacheError);
        // Continue processing other users even if one fails
      }
    }

    // Step 4: Log completion
    const executionTimeMs = Date.now() - startTime;
    const result: AgingUpdateResult = {
      total_assignments: totalAssignments,
      updated_count: updatedCount,
      cache_keys_invalidated: cacheKeysInvalidated,
      execution_time_ms: executionTimeMs,
      timestamp: new Date().toISOString()
    };

    console.log('[update-aging-buckets] Job completed:', result);

    // Close Redis connection
    await redis.quit();

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('[update-aging-buckets] Job failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Job execution failed',
        details: error instanceof Error ? error.message : String(error),
        execution_time_ms: executionTimeMs,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
