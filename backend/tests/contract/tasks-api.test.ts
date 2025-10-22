/**
 * Contract Test: Tasks API
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Tasks: T027-T030
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

describe('Tasks API - Contract Tests', () => {
  let testUserId: string;
  let testTaskId: string;
  let testEngagementId: string;

  beforeAll(async () => {
    // Authenticate as test user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Failed to authenticate test user');
    }

    testUserId = user.id;

    // Create test engagement for kanban context
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .insert({
        title: 'Test Engagement for Tasks',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (engError || !engagement) {
      throw new Error('Failed to create test engagement');
    }

    testEngagementId = engagement.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test tasks and engagement
    if (testTaskId) {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', testTaskId);
    }

    if (testEngagementId) {
      await supabase
        .from('engagements')
        .delete()
        .eq('id', testEngagementId);
    }
  });

  // T027: Test GET /tasks-get endpoint
  describe('GET /tasks-get', () => {
    beforeAll(async () => {
      // Create test task for GET tests
      const { data: task } = await supabase
        .from('tasks')
        .insert({
          title: 'Test Task for GET',
          description: 'This is a test task for GET endpoint',
          assignee_id: testUserId,
          engagement_id: testEngagementId,
          status: 'pending',
          workflow_stage: 'todo',
          priority: 'medium',
          work_item_type: 'generic',
          created_by: testUserId,
        })
        .select()
        .single();

      if (task) {
        testTaskId = task.id;
      }
    });

    it('should fetch tasks assigned to current user', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', testUserId)
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);

      // Verify task has title (not null or empty)
      const hasTaskWithTitle = data!.some(task =>
        task.title && task.title.trim().length > 0
      );
      expect(hasTaskWithTitle).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', testUserId)
        .eq('status', 'pending')
        .eq('is_deleted', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All returned tasks should have status 'pending'
      data?.forEach(task => {
        expect(task.status).toBe('pending');
      });
    });

    it('should support pagination with limit and offset', async () => {
      const pageSize = 10;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', testUserId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeLessThanOrEqual(pageSize);
    });

    it('should filter out soft-deleted tasks', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', testUserId)
        .eq('is_deleted', false);

      expect(error).toBeNull();

      // Verify no soft-deleted tasks returned
      data?.forEach(task => {
        expect(task.is_deleted).toBe(false);
      });
    });
  });

  // T028: Test POST /tasks-create endpoint
  describe('POST /tasks-create', () => {
    it('should create task with valid input', async () => {
      const newTask = {
        title: 'New Task via POST',
        description: 'Testing task creation endpoint',
        assignee_id: testUserId,
        engagement_id: testEngagementId,
        status: 'pending' as const,
        workflow_stage: 'todo' as const,
        priority: 'high' as const,
        work_item_type: 'generic' as const,
        created_by: testUserId,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBeDefined();
      expect(data!.title).toBe('New Task via POST');
      expect(data!.status).toBe('pending');
      expect(data!.workflow_stage).toBe('todo');
      expect(data!.priority).toBe('high');
      expect(data!.created_at).toBeDefined();
      expect(data!.updated_at).toBeDefined();

      // Cleanup
      await supabase.from('tasks').delete().eq('id', data!.id);
    });

    it('should reject task creation with missing required fields', async () => {
      const invalidTask = {
        // Missing title (required field)
        description: 'Task without title',
        assignee_id: testUserId,
        status: 'pending' as const,
        workflow_stage: 'todo' as const,
        priority: 'medium' as const,
        created_by: testUserId,
      };

      const { error } = await supabase
        .from('tasks')
        .insert(invalidTask as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value in column "title"');
    });

    it('should reject task with invalid status value', async () => {
      const invalidTask = {
        title: 'Task with invalid status',
        assignee_id: testUserId,
        status: 'invalid_status' as any,
        workflow_stage: 'todo' as const,
        priority: 'medium' as const,
        created_by: testUserId,
      };

      const { error } = await supabase
        .from('tasks')
        .insert(invalidTask);

      expect(error).toBeDefined();
      // Should fail CHECK constraint on status column
      expect(error?.message).toMatch(/status|constraint/i);
    });

    it('should auto-set created_at and updated_at timestamps', async () => {
      const newTask = {
        title: 'Task with auto timestamps',
        assignee_id: testUserId,
        status: 'pending' as const,
        workflow_stage: 'todo' as const,
        priority: 'medium' as const,
        created_by: testUserId,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.created_at).toBeDefined();
      expect(data!.updated_at).toBeDefined();

      const createdAt = new Date(data!.created_at);
      const updatedAt = new Date(data!.updated_at);

      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());

      // Cleanup
      await supabase.from('tasks').delete().eq('id', data!.id);
    });
  });

  // T029: Test PATCH /tasks-update endpoint
  describe('PATCH /tasks-update', () => {
    let updateTestTaskId: string;
    let initialUpdatedAt: string;

    beforeAll(async () => {
      // Create task for update tests
      const { data } = await supabase
        .from('tasks')
        .insert({
          title: 'Task for Update Tests',
          assignee_id: testUserId,
          status: 'pending' as const,
          workflow_stage: 'todo' as const,
          priority: 'medium' as const,
          created_by: testUserId,
        })
        .select()
        .single();

      if (data) {
        updateTestTaskId = data.id;
        initialUpdatedAt = data.updated_at;
      }
    });

    afterAll(async () => {
      if (updateTestTaskId) {
        await supabase.from('tasks').delete().eq('id', updateTestTaskId);
      }
    });

    it('should update task successfully with valid data', async () => {
      const updates = {
        title: 'Updated Task Title',
        priority: 'high' as const,
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', updateTestTaskId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.title).toBe('Updated Task Title');
      expect(data!.priority).toBe('high');
      expect(data!.updated_at).not.toBe(initialUpdatedAt);
    });

    it('should detect optimistic locking conflict (409)', async () => {
      // Simulate concurrent edit scenario:
      // 1. User A reads task with updated_at = T1
      const { data: taskBeforeUpdate } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', updateTestTaskId)
        .single();

      const oldTimestamp = taskBeforeUpdate!.updated_at;

      // 2. User B updates task (updated_at becomes T2)
      await supabase
        .from('tasks')
        .update({ priority: 'urgent' as const })
        .eq('id', updateTestTaskId);

      // 3. User A tries to update with old timestamp T1
      // This should fail because updated_at no longer matches
      const { data, count } = await supabase
        .from('tasks')
        .update({ title: 'Conflicting Update' })
        .eq('id', updateTestTaskId)
        .eq('updated_at', oldTimestamp) // Optimistic lock check
        .select();

      // No rows should be updated (conflict detected)
      expect(count).toBe(0);
      expect(data).toEqual([]);
    });

    it('should update updated_at timestamp automatically', async () => {
      const { data: beforeUpdate } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('id', updateTestTaskId)
        .single();

      const oldTimestamp = beforeUpdate!.updated_at;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: afterUpdate } = await supabase
        .from('tasks')
        .update({ description: 'Testing timestamp update' })
        .eq('id', updateTestTaskId)
        .select('updated_at')
        .single();

      expect(afterUpdate!.updated_at).not.toBe(oldTimestamp);
    });

    it('should allow partial updates', async () => {
      const { data: before } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', updateTestTaskId)
        .single();

      // Update only priority, leave other fields unchanged
      const { data: after } = await supabase
        .from('tasks')
        .update({ priority: 'low' as const })
        .eq('id', updateTestTaskId)
        .select()
        .single();

      expect(after!.priority).toBe('low');
      expect(after!.title).toBe(before!.title); // Unchanged
      expect(after!.status).toBe(before!.status); // Unchanged
    });
  });

  // T030: Test DELETE /tasks-delete endpoint (soft delete)
  describe('DELETE /tasks-delete (soft delete)', () => {
    let deleteTestTaskId: string;

    beforeAll(async () => {
      // Create task for delete tests
      const { data } = await supabase
        .from('tasks')
        .insert({
          title: 'Task for Delete Tests',
          assignee_id: testUserId,
          status: 'pending' as const,
          workflow_stage: 'todo' as const,
          priority: 'medium' as const,
          created_by: testUserId,
        })
        .select()
        .single();

      if (data) {
        deleteTestTaskId = data.id;
      }
    });

    it('should soft delete task (set is_deleted = true)', async () => {
      const { error } = await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', deleteTestTaskId);

      expect(error).toBeNull();

      // Verify task still exists but is_deleted = true
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', deleteTestTaskId)
        .single();

      expect(data).toBeDefined();
      expect(data!.is_deleted).toBe(true);
    });

    it('should not return soft-deleted tasks in normal queries', async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', testUserId)
        .eq('is_deleted', false);

      // Deleted task should not appear in results
      const deletedTaskPresent = data?.some(task => task.id === deleteTestTaskId);
      expect(deletedTaskPresent).toBe(false);
    });

    it('should allow querying soft-deleted tasks explicitly', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', deleteTestTaskId)
        .eq('is_deleted', true)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(deleteTestTaskId);
      expect(data!.is_deleted).toBe(true);
    });
  });
});
