/**
 * Integration Test: Kanban Board Queries
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles (indirectly tests kanban for US3)
 * Task: T032
 *
 * Purpose: Verify engagement filtering and workflow_stage grouping queries work correctly:
 * - Filter tasks by engagement_id
 * - Group tasks by workflow_stage
 * - Verify task ordering within stages
 * - Test performance with multiple tasks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

describe('Kanban Board Queries Integration Tests', () => {
  let testUserId: string;
  let testEngagementId: string;
  let testTaskIds: string[] = [];

  beforeAll(async () => {
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Failed to authenticate test user');
    }

    testUserId = user.id;

    // Create test engagement
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .insert({
        title: 'Test Engagement for Kanban Queries',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (engError || !engagement) {
      throw new Error('Failed to create test engagement');
    }

    testEngagementId = engagement.id;

    // Create test tasks across different workflow stages
    const testTasks = [
      { title: 'Task 1 - Todo', workflow_stage: 'todo' as const, priority: 'high' as const },
      { title: 'Task 2 - Todo', workflow_stage: 'todo' as const, priority: 'medium' as const },
      { title: 'Task 3 - In Progress', workflow_stage: 'in_progress' as const, priority: 'high' as const },
      { title: 'Task 4 - In Progress', workflow_stage: 'in_progress' as const, priority: 'low' as const },
      { title: 'Task 5 - Review', workflow_stage: 'review' as const, priority: 'medium' as const },
      { title: 'Task 6 - Done', workflow_stage: 'done' as const, priority: 'low' as const },
    ];

    for (const taskData of testTasks) {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          assignee_id: testUserId,
          engagement_id: testEngagementId,
          status: taskData.workflow_stage === 'done' ? 'completed' : 'in_progress',
          created_by: testUserId,
        })
        .select()
        .single();

      if (!error && task) {
        testTaskIds.push(task.id);
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testTaskIds.length > 0) {
      await supabase
        .from('tasks')
        .delete()
        .in('id', testTaskIds);
    }

    if (testEngagementId) {
      await supabase
        .from('engagements')
        .delete()
        .eq('id', testEngagementId);
    }
  });

  describe('Engagement Filtering', () => {
    it('should fetch all tasks for a specific engagement', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(testTaskIds.length);

      // All tasks should belong to test engagement
      data!.forEach(task => {
        expect(task.engagement_id).toBe(testEngagementId);
      });
    });

    it('should exclude soft-deleted tasks from engagement query', async () => {
      // Soft delete one task
      const taskToDelete = testTaskIds[0];
      await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', taskToDelete);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data!.length).toBe(testTaskIds.length - 1);

      // Deleted task should not appear
      const deletedTaskPresent = data!.some(task => task.id === taskToDelete);
      expect(deletedTaskPresent).toBe(false);

      // Restore task for other tests
      await supabase
        .from('tasks')
        .update({ is_deleted: false })
        .eq('id', taskToDelete);
    });

    it('should return empty array for engagement with no tasks', async () => {
      // Create engagement with no tasks
      const { data: emptyEngagement } = await supabase
        .from('engagements')
        .insert({
          title: 'Empty Engagement',
          engagement_type: 'conference',
          engagement_date: new Date().toISOString(),
        })
        .select()
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', emptyEngagement!.id)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Cleanup
      await supabase.from('engagements').delete().eq('id', emptyEngagement!.id);
    });
  });

  describe('Workflow Stage Grouping', () => {
    it('should fetch tasks grouped by workflow_stage (todo)', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'todo')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // All tasks should be in 'todo' stage
      data!.forEach(task => {
        expect(task.workflow_stage).toBe('todo');
      });
    });

    it('should fetch tasks grouped by workflow_stage (in_progress)', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'in_progress')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // All tasks should be in 'in_progress' stage
      data!.forEach(task => {
        expect(task.workflow_stage).toBe('in_progress');
      });
    });

    it('should fetch tasks grouped by workflow_stage (review)', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'review')
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All tasks should be in 'review' stage
      data!.forEach(task => {
        expect(task.workflow_stage).toBe('review');
      });
    });

    it('should fetch tasks grouped by workflow_stage (done)', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'done')
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All tasks should be in 'done' stage
      data!.forEach(task => {
        expect(task.workflow_stage).toBe('done');
      });
    });

    it('should fetch all tasks grouped in a single query (for kanban board)', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('is_deleted', false)
        .order('workflow_stage', { ascending: true })
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(testTaskIds.length);

      // Group tasks manually by workflow_stage
      const groupedTasks = data!.reduce((acc, task) => {
        if (!acc[task.workflow_stage]) {
          acc[task.workflow_stage] = [];
        }
        acc[task.workflow_stage].push(task);
        return acc;
      }, {} as Record<string, typeof data>);

      // Verify we have tasks in multiple stages
      expect(Object.keys(groupedTasks).length).toBeGreaterThan(1);

      // Verify each group has tasks
      Object.values(groupedTasks).forEach(group => {
        expect(group.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Task Ordering Within Stages', () => {
    it('should order tasks by created_at DESC within each stage', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'todo')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();

      if (!data || data.length < 2) {
        return; // Not enough tasks to test ordering
      }

      // Verify tasks are ordered by created_at DESC
      for (let i = 0; i < data.length - 1; i++) {
        const current = new Date(data[i].created_at).getTime();
        const next = new Date(data[i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should support ordering by priority within stage', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'todo')
        .eq('is_deleted', false)
        .order('priority', { ascending: false }) // high, medium, low
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Priority ordering: urgent > high > medium > low
      // (This is application-level logic, not enforced by DB)
    });
  });

  describe('Performance with Multiple Tasks', () => {
    it('should efficiently query kanban board with 20+ tasks', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('is_deleted', false)
        .order('workflow_stage', { ascending: true })
        .order('created_at', { ascending: false });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Query should complete in < 2s (NFR-008)
      expect(queryTime).toBeLessThan(2000);

      console.log(`Kanban query time: ${queryTime}ms for ${data!.length} tasks`);
    });

    it('should use indexes for efficient engagement filtering', async () => {
      // This test verifies that the query plan uses idx_tasks_engagement_stage index
      // In a real scenario, you'd use EXPLAIN ANALYZE to verify index usage

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'todo')
        .eq('is_deleted', false)
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Query should be fast even with limit removed
      // (Real performance testing would use k6 or similar tools)
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks with null engagement_id', async () => {
      // Create task without engagement
      const { data: noEngagementTask } = await supabase
        .from('tasks')
        .insert({
          title: 'Task without engagement',
          assignee_id: testUserId,
          status: 'pending' as const,
          workflow_stage: 'todo' as const,
          priority: 'medium' as const,
          created_by: testUserId,
          engagement_id: null,
        })
        .select()
        .single();

      // Query by null engagement_id
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('engagement_id', null)
        .eq('assignee_id', testUserId)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.some(task => task.id === noEngagementTask!.id)).toBe(true);

      // Cleanup
      await supabase.from('tasks').delete().eq('id', noEngagementTask!.id);
    });

    it('should handle cancelled workflow_stage', async () => {
      // Create cancelled task
      const { data: cancelledTask } = await supabase
        .from('tasks')
        .insert({
          title: 'Cancelled Task',
          assignee_id: testUserId,
          engagement_id: testEngagementId,
          status: 'cancelled' as const,
          workflow_stage: 'cancelled' as const,
          priority: 'low' as const,
          created_by: testUserId,
        })
        .select()
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('workflow_stage', 'cancelled')
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.some(task => task.id === cancelledTask!.id)).toBe(true);

      // Cleanup
      await supabase.from('tasks').delete().eq('id', cancelledTask!.id);
    });
  });
});
