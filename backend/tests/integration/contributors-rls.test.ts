import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

/**
 * Integration Tests for Contributors RLS Policies - User Story 2
 *
 * Tests:
 * - T043: RLS policy tests (contributors can view tasks, non-contributors cannot)
 * - T044: "Tasks I Contributed To" query joining tasks and task_contributors tables
 *
 * Prerequisites:
 * - Supabase local instance running
 * - RLS policies enabled on tasks and task_contributors tables
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('Contributors RLS Policy Integration Tests', () => {
  let supabaseService: SupabaseClient<Database>;
  let supabaseTaskOwner: SupabaseClient<Database>;
  let supabaseContributor: SupabaseClient<Database>;
  let supabaseNonContributor: SupabaseClient<Database>;

  let taskOwnerId: string;
  let contributorId: string;
  let nonContributorId: string;

  let testTask1Id: string;
  let testTask2Id: string;
  let testTask3Id: string;

  beforeAll(async () => {
    // Initialize service role client
    supabaseService = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test users
    const { data: taskOwner, error: ownerError } = await supabaseService.auth.admin.createUser({
      email: 'rls-test-owner@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    const { data: contributor, error: contributorError } = await supabaseService.auth.admin.createUser({
      email: 'rls-test-contributor@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    const { data: nonContributor, error: nonContribError } = await supabaseService.auth.admin.createUser({
      email: 'rls-test-noncontributor@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (ownerError || contributorError || nonContribError) {
      throw new Error('Failed to create test users');
    }

    taskOwnerId = taskOwner!.user!.id;
    contributorId = contributor!.user!.id;
    nonContributorId = nonContributor!.user!.id;

    // Authenticate users
    const { data: ownerSession } = await supabaseService.auth.signInWithPassword({
      email: 'rls-test-owner@test.com',
      password: 'testpassword123'
    });

    const { data: contributorSession } = await supabaseService.auth.signInWithPassword({
      email: 'rls-test-contributor@test.com',
      password: 'testpassword123'
    });

    const { data: nonContribSession } = await supabaseService.auth.signInWithPassword({
      email: 'rls-test-noncontributor@test.com',
      password: 'testpassword123'
    });

    supabaseTaskOwner = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${ownerSession.session?.access_token}` } }
    });

    supabaseContributor = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${contributorSession.session?.access_token}` } }
    });

    supabaseNonContributor = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${nonContribSession.session?.access_token}` } }
    });

    // Create test tasks
    const { data: task1 } = await supabaseService
      .from('tasks')
      .insert({
        title: 'Task 1 - Owner Only',
        description: 'No contributors on this task',
        assignee_id: taskOwnerId,
        created_by: taskOwnerId,
        status: 'pending',
        workflow_stage: 'todo',
        priority: 'medium'
      })
      .select()
      .single();

    const { data: task2 } = await supabaseService
      .from('tasks')
      .insert({
        title: 'Task 2 - With Contributor',
        description: 'Has one contributor',
        assignee_id: taskOwnerId,
        created_by: taskOwnerId,
        status: 'in_progress',
        workflow_stage: 'in_progress',
        priority: 'high'
      })
      .select()
      .single();

    const { data: task3 } = await supabaseService
      .from('tasks')
      .insert({
        title: 'Task 3 - Multiple Contributors',
        description: 'Has multiple contributors',
        assignee_id: taskOwnerId,
        created_by: taskOwnerId,
        status: 'review',
        workflow_stage: 'review',
        priority: 'low'
      })
      .select()
      .single();

    testTask1Id = task1!.id;
    testTask2Id = task2!.id;
    testTask3Id = task3!.id;

    // Add contributor to task 2
    await supabaseService.from('task_contributors').insert({
      task_id: testTask2Id,
      user_id: contributorId,
      role: 'helper',
      notes: 'Helping with data analysis'
    });

    // Add multiple contributors to task 3
    await supabaseService.from('task_contributors').insert([
      {
        task_id: testTask3Id,
        user_id: contributorId,
        role: 'reviewer',
        notes: 'Reviewing outputs'
      },
      {
        task_id: testTask3Id,
        user_id: nonContributorId,
        role: 'advisor',
        notes: 'Providing guidance',
        removed_at: new Date().toISOString() // Removed contributor
      }
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabaseService.from('task_contributors').delete().in('task_id', [testTask1Id, testTask2Id, testTask3Id]);
    await supabaseService.from('tasks').delete().in('id', [testTask1Id, testTask2Id, testTask3Id]);

    await supabaseService.auth.admin.deleteUser(taskOwnerId);
    await supabaseService.auth.admin.deleteUser(contributorId);
    await supabaseService.auth.admin.deleteUser(nonContributorId);
  });

  /**
   * T043: RLS policy tests
   *
   * Tests that:
   * 1. Task owners can view their tasks
   * 2. Active contributors can view tasks they contributed to
   * 3. Non-contributors cannot view tasks they have no relation to
   * 4. Removed contributors cannot view tasks they previously contributed to
   */
  describe('T043: RLS Policies for Task Visibility', () => {
    it('T043.1: task owner can view all their tasks', async () => {
      const { data, error } = await supabaseTaskOwner
        .from('tasks')
        .select('*')
        .or(`assignee_id.eq.${taskOwnerId},created_by.eq.${taskOwnerId}`);

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(data!.map((t) => t.id).sort()).toEqual([testTask1Id, testTask2Id, testTask3Id].sort());
    });

    it('T043.2: active contributors can view tasks they contributed to', async () => {
      // Contributor should see task2 and task3 (both have active contributions)
      const { data, error } = await supabaseContributor
        .from('tasks')
        .select('*')
        .in('id', [testTask1Id, testTask2Id, testTask3Id]);

      expect(error).toBeNull();
      expect(data).toHaveLength(2); // task2 and task3
      expect(data!.map((t) => t.id).sort()).toEqual([testTask2Id, testTask3Id].sort());
    });

    it('T043.3: non-contributors cannot view tasks they have no relation to', async () => {
      // Non-contributor should NOT see any tasks (removed from task3)
      const { data, error } = await supabaseNonContributor
        .from('tasks')
        .select('*')
        .in('id', [testTask1Id, testTask2Id, testTask3Id]);

      expect(error).toBeNull();
      expect(data).toHaveLength(0); // RLS filters out all tasks
    });

    it('T043.4: removed contributors cannot view tasks after removal', async () => {
      // Add non-contributor as active contributor to task1
      await supabaseService.from('task_contributors').insert({
        task_id: testTask1Id,
        user_id: nonContributorId,
        role: 'helper'
      });

      // Verify non-contributor can see task1
      let { data: beforeRemoval } = await supabaseNonContributor
        .from('tasks')
        .select('*')
        .eq('id', testTask1Id);

      expect(beforeRemoval).toHaveLength(1);

      // Remove contributor
      await supabaseService
        .from('task_contributors')
        .update({ removed_at: new Date().toISOString() })
        .eq('task_id', testTask1Id)
        .eq('user_id', nonContributorId);

      // Verify non-contributor can no longer see task1
      let { data: afterRemoval } = await supabaseNonContributor
        .from('tasks')
        .select('*')
        .eq('id', testTask1Id);

      expect(afterRemoval).toHaveLength(0);
    });

    it('T043.5: contributors can view contributor list for tasks they have access to', async () => {
      // Contributor should be able to view task2's contributors (including themselves)
      const { data, error } = await supabaseContributor
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTask2Id)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].user_id).toBe(contributorId);
    });

    it('T043.6: non-contributors cannot view contributor list for tasks they have no access to', async () => {
      // Non-contributor should NOT be able to view task1's contributors
      const { data, error } = await supabaseNonContributor
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTask1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0); // RLS filters out
    });
  });

  /**
   * T044: "Tasks I Contributed To" query
   *
   * Tests the JOIN query that retrieves tasks where user is an active contributor
   */
  describe('T044: Tasks I Contributed To Query', () => {
    it('T044.1: should fetch all tasks user actively contributes to', async () => {
      // Query: Tasks I Contributed To
      const { data, error } = await supabaseContributor
        .from('task_contributors')
        .select(`
          id,
          task_id,
          role,
          notes,
          added_at,
          tasks (
            id,
            title,
            description,
            assignee_id,
            status,
            workflow_stage,
            priority,
            created_at
          )
        `)
        .eq('user_id', contributorId)
        .is('removed_at', null)
        .order('added_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(2); // task2 (helper) and task3 (reviewer)

      // Verify task2 contribution
      const task2Contribution = data!.find((c) => c.task_id === testTask2Id);
      expect(task2Contribution).toBeDefined();
      expect(task2Contribution!.role).toBe('helper');
      expect(task2Contribution!.tasks).toBeDefined();
      expect((task2Contribution!.tasks as any).title).toBe('Task 2 - With Contributor');

      // Verify task3 contribution
      const task3Contribution = data!.find((c) => c.task_id === testTask3Id);
      expect(task3Contribution).toBeDefined();
      expect(task3Contribution!.role).toBe('reviewer');
      expect((task3Contribution!.tasks as any).title).toBe('Task 3 - Multiple Contributors');
    });

    it('T044.2: should exclude tasks where user is removed as contributor', async () => {
      // Non-contributor was added to task3 then removed (see beforeAll)
      const { data, error } = await supabaseNonContributor
        .from('task_contributors')
        .select(`
          id,
          task_id,
          tasks (
            id,
            title
          )
        `)
        .eq('user_id', nonContributorId)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Removed contributor should not appear
    });

    it('T044.3: should filter by workflow_stage for contributed tasks', async () => {
      // Query: Tasks I Contributed To that are in "review" stage
      const { data, error } = await supabaseContributor
        .from('task_contributors')
        .select(`
          id,
          task_id,
          tasks!inner (
            id,
            title,
            workflow_stage
          )
        `)
        .eq('user_id', contributorId)
        .is('removed_at', null)
        .eq('tasks.workflow_stage', 'review');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect((data![0].tasks as any).id).toBe(testTask3Id);
      expect((data![0].tasks as any).workflow_stage).toBe('review');
    });

    it('T044.4: should order contributed tasks by added_at DESC', async () => {
      // Add contributor to task1 with a later timestamp
      await new Promise((resolve) => setTimeout(resolve, 100)); // Ensure different timestamps

      await supabaseService.from('task_contributors').insert({
        task_id: testTask1Id,
        user_id: contributorId,
        role: 'observer'
      });

      const { data, error } = await supabaseContributor
        .from('task_contributors')
        .select(`
          id,
          task_id,
          added_at,
          tasks (
            title
          )
        `)
        .eq('user_id', contributorId)
        .is('removed_at', null)
        .order('added_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(3); // task1, task2, task3

      // First item should be the most recently added (task1)
      expect(data![0].task_id).toBe(testTask1Id);

      // Cleanup
      await supabaseService
        .from('task_contributors')
        .delete()
        .eq('task_id', testTask1Id)
        .eq('user_id', contributorId);
    });

    it('T044.5: should return empty array if user has never contributed', async () => {
      // Create a new user who has never contributed
      const { data: newUser } = await supabaseService.auth.admin.createUser({
        email: 'never-contributed@test.com',
        password: 'testpassword123',
        email_confirm: true
      });

      const { data: newSession } = await supabaseService.auth.signInWithPassword({
        email: 'never-contributed@test.com',
        password: 'testpassword123'
      });

      const supabaseNewUser = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${newSession.session?.access_token}` } }
      });

      const { data, error } = await supabaseNewUser
        .from('task_contributors')
        .select(`
          id,
          tasks (
            title
          )
        `)
        .eq('user_id', newUser!.user!.id)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Cleanup
      await supabaseService.auth.admin.deleteUser(newUser!.user!.id);
    });
  });

  /**
   * Additional Test: Performance of JOIN queries
   */
  describe('Performance Tests', () => {
    it('should efficiently query tasks with 50 contributors (NFR-002)', async () => {
      // Create a task with 50 contributors
      const { data: task50 } = await supabaseService
        .from('tasks')
        .insert({
          title: 'Task with 50 Contributors',
          assignee_id: taskOwnerId,
          created_by: taskOwnerId,
          status: 'pending',
          workflow_stage: 'todo',
          priority: 'medium'
        })
        .select()
        .single();

      // Add 50 contributors (using contributor and creating 49 more test users)
      const contributors = [contributorId];

      // Create 49 additional users
      for (let i = 0; i < 49; i++) {
        const { data: user } = await supabaseService.auth.admin.createUser({
          email: `perf-test-contributor-${i}@test.com`,
          password: 'testpassword123',
          email_confirm: true
        });
        contributors.push(user!.user!.id);
      }

      // Insert all contributors
      await supabaseService.from('task_contributors').insert(
        contributors.map((userId) => ({
          task_id: task50!.id,
          user_id: userId,
          role: 'helper' as const
        }))
      );

      // Query with JOIN (should complete in <2s per NFR-002)
      const startTime = Date.now();
      const { data, error } = await supabaseTaskOwner
        .from('tasks')
        .select(`
          *,
          task_contributors (
            id,
            user_id,
            role
          )
        `)
        .eq('id', task50!.id)
        .single();
      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data!.task_contributors as any).length).toBe(50);
      expect(queryTime).toBeLessThan(2000); // <2s per NFR-002

      // Cleanup
      await supabaseService.from('task_contributors').delete().eq('task_id', task50!.id);
      await supabaseService.from('tasks').delete().eq('id', task50!.id);

      for (let i = 0; i < 49; i++) {
        await supabaseService.auth.admin.deleteUser(contributors[i + 1]);
      }
    });
  });
});
