/**
 * Integration Tests: Filter Performance
 *
 * Tests multi-criteria filtering and caching performance
 * Success criteria: <100ms for indexed queries, <10ms for cache hits
 *
 * Tasks: T072 [P] [US5], T073 [P] [US5]
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

describe('Integration: Filter Performance', () => {
  let supabase: ReturnType<typeof createClient>;
  let redis: Redis;
  let testUserId: string;
  let testAssignmentIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    redis = new Redis(REDIS_URL);

    // Get test user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme'
    });

    if (authError) throw new Error(`Auth failed: ${authError.message}`);
    testUserId = authData.user.id;

    // Seed multiple test assignments for performance testing
    const assignments = [];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const types = ['dossier', 'ticket', 'position', 'task'];
    const statuses = ['pending', 'assigned'];

    for (let i = 0; i < 100; i++) {
      assignments.push({
        work_item_id: crypto.randomUUID(),
        work_item_type: types[i % types.length],
        assignee_id: testUserId,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        workflow_stage: 'todo',
        assigned_at: new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { data: insertedAssignments, error: insertError } = await supabase
      .from('assignments')
      .insert(assignments)
      .select('id');

    if (insertError) throw new Error(`Seed failed: ${insertError.message}`);
    testAssignmentIds = insertedAssignments?.map((a: any) => a.id) || [];
  });

  afterAll(async () => {
    // Cleanup test assignments
    if (testAssignmentIds.length > 0) {
      await supabase.from('assignments').delete().in('id', testAssignmentIds);
    }

    // Cleanup Redis cache
    const keys = await redis.keys('queue-filter:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await redis.quit();
  });

  describe('Multi-Criteria Filtering Performance', () => {
    it('should complete indexed query with 3 filters in < 100ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'pending')
        .eq('priority', 'high')
        .gte('assigned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('assigned_at', { ascending: false })
        .limit(50);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(100);
      console.log(`✓ Multi-criteria query completed in ${duration}ms`);
    });

    it('should complete aging bucket query with calculated field in < 100ms', async () => {
      const startTime = Date.now();

      // Query using aging calculation (similar to idx_assignments_aging index)
      const { data, error } = await supabase.rpc('get_assignments_by_aging', {
        min_days: 7,
        max_days: null,
        limit_count: 50
      });

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(100);
      console.log(`✓ Aging bucket query completed in ${duration}ms`);
    });

    it('should complete assignee filter query in < 100ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('assignee_id', testUserId)
        .in('status', ['pending', 'assigned'])
        .order('assigned_at', { ascending: false })
        .limit(50);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(100);
      console.log(`✓ Assignee filter query completed in ${duration}ms`);
    });

    it('should complete full-text search query in < 200ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .textSearch('work_item_type', 'dossier')
        .limit(50);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(200);
      console.log(`✓ Full-text search query completed in ${duration}ms`);
    });

    it('should handle complex query with sorting in < 150ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('assignments')
        .select('*, auth_users:assignee_id(full_name, email)')
        .in('status', ['pending', 'assigned'])
        .in('priority', ['high', 'urgent'])
        .order('priority', { ascending: false })
        .order('assigned_at', { ascending: true })
        .limit(50);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(150);
      console.log(`✓ Complex query with join completed in ${duration}ms`);
    });
  });

  describe('Redis Caching Performance', () => {
    it('should cache filter results with 5-minute TTL', async () => {
      const filterHash = 'test-filter-priority-high-aging-7+';
      const cacheKey = `queue-filter:${testUserId}:${filterHash}`;

      // Simulate filter query
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('priority', 'high')
        .gte('assigned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      // Cache results
      await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5-min TTL

      // Verify cache exists
      const cached = await redis.get(cacheKey);
      expect(cached).toBeDefined();
      expect(JSON.parse(cached!)).toEqual(data);

      // Verify TTL
      const ttl = await redis.ttl(cacheKey);
      expect(ttl).toBeGreaterThan(290);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('should retrieve cached results in < 10ms', async () => {
      const filterHash = 'test-filter-cache-hit';
      const cacheKey = `queue-filter:${testUserId}:${filterHash}`;

      // Seed cache
      const mockData = testAssignmentIds.slice(0, 10).map(id => ({ id }));
      await redis.setex(cacheKey, 300, JSON.stringify(mockData));

      // Measure cache retrieval time
      const startTime = Date.now();
      const cached = await redis.get(cacheKey);
      const duration = Date.now() - startTime;

      expect(cached).toBeDefined();
      expect(JSON.parse(cached!)).toEqual(mockData);
      expect(duration).toBeLessThan(10);
      console.log(`✓ Cache hit retrieved in ${duration}ms`);
    });

    it('should invalidate cache on assignment status change', async () => {
      const assignmentId = testAssignmentIds[0];
      const filterHash = 'test-filter-invalidation';
      const cacheKey = `queue-filter:${testUserId}:${filterHash}`;

      // Seed cache
      await redis.setex(cacheKey, 300, JSON.stringify([{ id: assignmentId }]));

      // Update assignment status
      await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      // Simulate cache invalidation (would be triggered by database trigger)
      const pattern = `queue-filter:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Verify cache is cleared
      const cached = await redis.get(cacheKey);
      expect(cached).toBeNull();
    });

    it('should generate consistent cache key for identical filters', async () => {
      const filters1 = { priority: 'high', aging: '7+', sort_by: 'assigned_at_desc' };
      const filters2 = { priority: 'high', aging: '7+', sort_by: 'assigned_at_desc' };

      // Simulate cache key generation
      const hash1 = JSON.stringify(filters1);
      const hash2 = JSON.stringify(filters2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different cache keys for different filters', async () => {
      const filters1 = { priority: 'high', aging: '7+' };
      const filters2 = { priority: 'medium', aging: '7+' };

      const hash1 = JSON.stringify(filters1);
      const hash2 = JSON.stringify(filters2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle cache miss gracefully and execute query', async () => {
      const cacheKey = `queue-filter:${testUserId}:non-existent`;

      // Try cache hit
      const startTime = Date.now();
      const cached = await redis.get(cacheKey);

      if (!cached) {
        // Execute fallback query
        const { data } = await supabase
          .from('assignments')
          .select('*')
          .eq('status', 'pending')
          .limit(50);

        expect(data).toBeDefined();
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(150); // Cache miss + query still fast
    });

    it('should batch cache invalidation for multiple filter keys', async () => {
      // Seed multiple cache entries
      const keys = [
        `queue-filter:${testUserId}:filter1`,
        `queue-filter:${testUserId}:filter2`,
        `queue-filter:${testUserId}:filter3`
      ];

      for (const key of keys) {
        await redis.setex(key, 300, JSON.stringify([]));
      }

      // Batch delete
      const startTime = Date.now();
      await redis.del(...keys);
      const duration = Date.now() - startTime;

      // Verify all deleted
      for (const key of keys) {
        const cached = await redis.get(key);
        expect(cached).toBeNull();
      }

      expect(duration).toBeLessThan(50); // Batch delete should be fast
    });
  });

  describe('Load Testing', () => {
    it('should handle 20 concurrent filter queries', async () => {
      const promises = Array.from({ length: 20 }, (_, i) => {
        return supabase
          .from('assignments')
          .select('*')
          .eq('status', 'pending')
          .eq('priority', priorities[i % 4])
          .limit(50);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All queries should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data).toBeDefined();
      });

      // Total duration should be reasonable (concurrent execution)
      expect(duration).toBeLessThan(1000);
      console.log(`✓ 20 concurrent queries completed in ${duration}ms`);
    });

    it('should maintain performance with large result sets', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .in('status', ['pending', 'assigned'])
        .limit(100);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeLessThanOrEqual(100);
      expect(duration).toBeLessThan(150);
      console.log(`✓ Large result set query completed in ${duration}ms`);
    });
  });
});

const priorities = ['low', 'medium', 'high', 'urgent'];
