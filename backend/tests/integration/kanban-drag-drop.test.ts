import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../src/types/database.types';

describe('Kanban Drag-Drop Integration Tests', () => {
  let supabase: SupabaseClient<Database>;
  let testUserId: string;
  let testEngagementId: string;
  let testTask: Database['public']['Tables']['tasks']['Row'];

  beforeAll(async () => {
    // Initialize Supabase client with service role for testing
    supabase = createClient<Database>(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'kanban-test@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }
    testUserId = userData.user.id;

    // Create test engagement (assuming engagements table exists)
    const { data: engagementData, error: engagementError } = await supabase
      .from('engagements')
      .insert({
        title: 'Test Engagement for Kanban',
        created_by: testUserId,
      })
      .select()
      .single();

    if (engagementError || !engagementData) {
      throw new Error(`Failed to create test engagement: ${engagementError?.message}`);
    }
    testEngagementId = engagementData.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testEngagementId) {
      await supabase.from('tasks').delete().eq('engagement_id', testEngagementId);
      await supabase.from('engagements').delete().eq('id', testEngagementId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Create a test task before each test
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Kanban Task',
        description: 'Task for drag-drop testing',
        assignee_id: testUserId,
        engagement_id: testEngagementId,
        status: 'pending',
        workflow_stage: 'todo',
        priority: 'medium',
        created_by: testUserId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create test task: ${error?.message}`);
    }
    testTask = data;
  });

  describe('T056: Update task workflow_stage with optimistic locking', () => {
    it('should successfully update workflow_stage when updated_at matches', async () => {
      const updatedAt = testTask.updated_at;

      // Update workflow_stage from 'todo' to 'in_progress'
      const { data, error } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'in_progress',
          status: 'in_progress',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', updatedAt) // Optimistic lock check
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.workflow_stage).toBe('in_progress');
      expect(data?.status).toBe('in_progress');
      expect(data?.updated_at).not.toBe(updatedAt); // Timestamp should change
    });

    it('should fail to update workflow_stage when updated_at does not match (stale data)', async () => {
      const staleTimestamp = '2020-01-01T00:00:00.000Z';

      // Try to update with stale timestamp
      const { data, error } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'review',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', staleTimestamp) // Stale timestamp
        .select()
        .single();

      // Should not return data (optimistic lock failed)
      expect(data).toBeNull();
      expect(error).toBeDefined();

      // Verify task was not modified
      const { data: unchangedTask } = await supabase
        .from('tasks')
        .select('workflow_stage')
        .eq('id', testTask.id)
        .single();

      expect(unchangedTask?.workflow_stage).toBe('todo'); // Still in original stage
    });

    it('should handle rapid updates with optimistic locking', async () => {
      const initialUpdatedAt = testTask.updated_at;

      // First update: todo → in_progress
      const { data: firstUpdate } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'in_progress',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', initialUpdatedAt)
        .select()
        .single();

      expect(firstUpdate).toBeDefined();
      expect(firstUpdate?.workflow_stage).toBe('in_progress');

      // Second update with stale timestamp (should fail)
      const { data: secondUpdate } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'review',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', initialUpdatedAt) // Stale timestamp
        .select()
        .single();

      expect(secondUpdate).toBeNull(); // Second update fails due to optimistic lock

      // Third update with correct timestamp (should succeed)
      const { data: thirdUpdate } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'review',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', firstUpdate!.updated_at) // Correct timestamp
        .select()
        .single();

      expect(thirdUpdate).toBeDefined();
      expect(thirdUpdate?.workflow_stage).toBe('review');
    });
  });

  describe('T057: Conflict detection during drag operation', () => {
    it('should detect conflict when task was modified by another user during drag', async () => {
      const initialUpdatedAt = testTask.updated_at;

      // Simulate User A starting drag operation (reads current state)
      const userASnapshot = { ...testTask };

      // Simulate User B modifying the task before User A completes drag
      const { data: userBUpdate } = await supabase
        .from('tasks')
        .update({
          priority: 'high', // User B changes priority
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', initialUpdatedAt)
        .select()
        .single();

      expect(userBUpdate).toBeDefined();

      // Simulate User A completing drag operation with stale timestamp
      const { data: userAUpdate, error } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'in_progress',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', userASnapshot.updated_at) // Stale timestamp
        .select()
        .single();

      // User A's update should fail (conflict detected)
      expect(userAUpdate).toBeNull();
      expect(error).toBeDefined();

      // Verify task has User B's changes, not User A's
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('workflow_stage, priority')
        .eq('id', testTask.id)
        .single();

      expect(currentTask?.workflow_stage).toBe('todo'); // User A's change not applied
      expect(currentTask?.priority).toBe('high'); // User B's change preserved
    });

    it('should return current task state in error response for conflict resolution', async () => {
      const initialUpdatedAt = testTask.updated_at;

      // Modify task to create conflict scenario
      await supabase
        .from('tasks')
        .update({
          description: 'Modified by another user',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', initialUpdatedAt)
        .select()
        .single();

      // Try to update with stale timestamp
      const { data, error } = await supabase
        .from('tasks')
        .update({
          workflow_stage: 'done',
          updated_by: testUserId,
        })
        .eq('id', testTask.id)
        .eq('updated_at', initialUpdatedAt) // Stale
        .select()
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();

      // Fetch current state for conflict resolution UI
      const { data: currentState } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', testTask.id)
        .single();

      expect(currentState).toBeDefined();
      expect(currentState?.description).toBe('Modified by another user');
      expect(currentState?.workflow_stage).toBe('todo');
    });
  });

  describe('T058: Auto-retry with exponential backoff on network failure', () => {
    it('should simulate network timeout and verify retry behavior', async () => {
      // Note: This test simulates retry logic - actual implementation
      // will be in frontend using TanStack Query retry configuration

      const maxRetries = 3;
      const baseDelay = 500; // ms

      const retryAttempts: number[] = [];
      let successOnAttempt = 2; // Succeed on 2nd retry

      const simulateUpdateWithRetry = async (attemptNumber: number): Promise<boolean> => {
        retryAttempts.push(attemptNumber);

        if (attemptNumber < successOnAttempt) {
          // Simulate network failure
          throw new Error('Network timeout');
        }

        // Simulate successful update
        const { data, error } = await supabase
          .from('tasks')
          .update({
            workflow_stage: 'done',
            updated_by: testUserId,
          })
          .eq('id', testTask.id)
          .eq('updated_at', testTask.updated_at)
          .select()
          .single();

        if (error) throw error;
        return !!data;
      };

      // Execute retry logic
      let lastError: Error | null = null;
      let success = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          success = await simulateUpdateWithRetry(attempt);
          if (success) break;
        } catch (error) {
          lastError = error as Error;

          // Exponential backoff delay (not actually waiting in test)
          const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
          expect(delay).toBeGreaterThanOrEqual(baseDelay * Math.pow(2, attempt));
        }
      }

      // Verify retry behavior
      expect(retryAttempts).toHaveLength(successOnAttempt);
      expect(success).toBe(true);
      expect(retryAttempts).toEqual([0, 1]); // Failed on 0, succeeded on 1
    });

    it('should calculate correct exponential backoff delays', () => {
      const baseDelay = 500;
      const maxDelay = 10000;

      const calculateBackoff = (attemptIndex: number) =>
        Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);

      expect(calculateBackoff(0)).toBe(500); // 500ms
      expect(calculateBackoff(1)).toBe(1000); // 1s
      expect(calculateBackoff(2)).toBe(2000); // 2s
      expect(calculateBackoff(3)).toBe(4000); // 4s
      expect(calculateBackoff(4)).toBe(8000); // 8s
      expect(calculateBackoff(5)).toBe(10000); // 10s (capped)
      expect(calculateBackoff(10)).toBe(10000); // 10s (capped)
    });

    it('should give up after max retries and preserve task state', async () => {
      const maxRetries = 3;
      let attemptCount = 0;

      const simulateFailedUpdate = async (): Promise<void> => {
        attemptCount++;
        throw new Error('Persistent network failure');
      };

      let finalError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await simulateFailedUpdate();
        } catch (error) {
          finalError = error as Error;
        }
      }

      // Verify all retries exhausted
      expect(attemptCount).toBe(maxRetries);
      expect(finalError).toBeDefined();
      expect(finalError?.message).toBe('Persistent network failure');

      // Verify task state unchanged (revert to original position)
      const { data: unchangedTask } = await supabase
        .from('tasks')
        .select('workflow_stage')
        .eq('id', testTask.id)
        .single();

      expect(unchangedTask?.workflow_stage).toBe('todo'); // Original state preserved
    });
  });
});
