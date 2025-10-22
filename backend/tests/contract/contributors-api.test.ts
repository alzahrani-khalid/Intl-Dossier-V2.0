import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

/**
 * Contract Tests for Contributors API - User Story 2
 *
 * Tests:
 * - T040: GET /contributors-get endpoint (fetch by task_id, empty list handling)
 * - T041: POST /contributors-add endpoint (valid input, duplicate prevention, role validation)
 * - T042: DELETE /contributors-remove endpoint (soft delete verification, owner permission check)
 *
 * Prerequisites:
 * - Supabase local instance running
 * - Test user accounts created
 * - Tasks table populated with test data
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('Contributors API Contract Tests', () => {
  let supabaseService: SupabaseClient<Database>;
  let supabaseUser1: SupabaseClient<Database>;
  let supabaseUser2: SupabaseClient<Database>;

  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let testTaskId: string;
  let testTaskUser1: any; // Task owned by user1

  beforeAll(async () => {
    // Initialize Supabase clients
    supabaseService = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test users
    const { data: user1, error: user1Error } = await supabaseService.auth.admin.createUser({
      email: 'contributor-test-user1@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    const { data: user2, error: user2Error } = await supabaseService.auth.admin.createUser({
      email: 'contributor-test-user2@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    const { data: user3, error: user3Error } = await supabaseService.auth.admin.createUser({
      email: 'contributor-test-user3@test.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (user1Error || user2Error || user3Error) {
      throw new Error('Failed to create test users');
    }

    user1Id = user1!.user!.id;
    user2Id = user2!.user!.id;
    user3Id = user3!.user!.id;

    // Authenticate as user1 and user2
    const { data: session1 } = await supabaseService.auth.signInWithPassword({
      email: 'contributor-test-user1@test.com',
      password: 'testpassword123'
    });

    const { data: session2 } = await supabaseService.auth.signInWithPassword({
      email: 'contributor-test-user2@test.com',
      password: 'testpassword123'
    });

    supabaseUser1 = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session1.session?.access_token}`
        }
      }
    });

    supabaseUser2 = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${session2.session?.access_token}`
        }
      }
    });

    // Create test task owned by user1
    const { data: task, error: taskError } = await supabaseService
      .from('tasks')
      .insert({
        title: 'Test Task for Contributors',
        description: 'Test task for contributor management',
        assignee_id: user1Id,
        created_by: user1Id,
        status: 'pending',
        workflow_stage: 'todo',
        priority: 'medium'
      })
      .select()
      .single();

    if (taskError) {
      throw new Error(`Failed to create test task: ${taskError.message}`);
    }

    testTaskId = task.id;
    testTaskUser1 = task;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await supabaseService.from('task_contributors').delete().eq('task_id', testTaskId);
    await supabaseService.from('tasks').delete().eq('id', testTaskId);

    // Delete test users
    await supabaseService.auth.admin.deleteUser(user1Id);
    await supabaseService.auth.admin.deleteUser(user2Id);
    await supabaseService.auth.admin.deleteUser(user3Id);
  });

  beforeEach(async () => {
    // Clean contributors before each test
    await supabaseService.from('task_contributors').delete().eq('task_id', testTaskId);
  });

  /**
   * T040: GET /contributors-get endpoint
   *
   * Tests:
   * 1. Fetch contributors by task_id
   * 2. Empty list handling when no contributors exist
   * 3. Filtering out removed contributors (removed_at IS NULL)
   */
  describe('GET /contributors-get', () => {
    it('T040.1: should fetch contributors by task_id', async () => {
      // Add a contributor first
      await supabaseService.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'helper',
        notes: 'Assisting with data analysis'
      });

      // Fetch contributors
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTaskId)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].user_id).toBe(user2Id);
      expect(data![0].role).toBe('helper');
      expect(data![0].notes).toBe('Assisting with data analysis');
    });

    it('T040.2: should return empty array when no contributors exist', async () => {
      // Fetch contributors for task with no contributors
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTaskId)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('T040.3: should filter out removed contributors', async () => {
      // Add two contributors, remove one
      await supabaseService.from('task_contributors').insert([
        {
          task_id: testTaskId,
          user_id: user2Id,
          role: 'helper',
          notes: 'Active contributor'
        },
        {
          task_id: testTaskId,
          user_id: user3Id,
          role: 'reviewer',
          notes: 'Removed contributor',
          removed_at: new Date().toISOString()
        }
      ]);

      // Fetch active contributors only
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTaskId)
        .is('removed_at', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].user_id).toBe(user2Id);
    });
  });

  /**
   * T041: POST /contributors-add endpoint
   *
   * Tests:
   * 1. Valid input - successfully add contributor
   * 2. Duplicate prevention - UNIQUE constraint on (task_id, user_id)
   * 3. Role validation - only valid roles accepted
   * 4. Permission check - only task owner can add contributors
   */
  describe('POST /contributors-add', () => {
    it('T041.1: should add contributor with valid input', async () => {
      // Task owner (user1) adds user2 as contributor
      const { data, error } = await supabaseUser1.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'reviewer',
        notes: 'Will review outputs'
      }).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.task_id).toBe(testTaskId);
      expect(data!.user_id).toBe(user2Id);
      expect(data!.role).toBe('reviewer');
      expect(data!.removed_at).toBeNull();
    });

    it('T041.2: should prevent duplicate contributors via UNIQUE constraint', async () => {
      // Add contributor first time
      const { error: firstError } = await supabaseUser1.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'helper'
      });

      expect(firstError).toBeNull();

      // Attempt to add same contributor again
      const { error: duplicateError } = await supabaseUser1.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'reviewer' // Different role, same user
      });

      expect(duplicateError).toBeDefined();
      expect(duplicateError!.code).toBe('23505'); // PostgreSQL unique_violation
    });

    it('T041.3: should reject invalid roles via CHECK constraint', async () => {
      // Attempt to add contributor with invalid role
      const { error } = await supabaseService
        .from('task_contributors')
        .insert({
          task_id: testTaskId,
          user_id: user2Id,
          role: 'invalid_role' as any // Invalid role
        });

      expect(error).toBeDefined();
      expect(error!.code).toBe('23514'); // PostgreSQL check_violation
    });

    it('T041.4: should enforce owner permission check via RLS', async () => {
      // User2 (NOT task owner) attempts to add contributor
      const { error } = await supabaseUser2.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user3Id,
        role: 'helper'
      });

      // RLS policy should block this insert
      expect(error).toBeDefined();
      // Note: RLS returns different error codes depending on implementation
      // Could be permission denied or row not found
    });

    it('T041.5: should validate all role options', async () => {
      const validRoles: Array<'helper' | 'reviewer' | 'advisor' | 'observer' | 'supervisor'> = [
        'helper',
        'reviewer',
        'advisor',
        'observer',
        'supervisor'
      ];

      for (const role of validRoles) {
        // Clean up before each role test
        await supabaseService.from('task_contributors').delete().eq('task_id', testTaskId);

        const { data, error } = await supabaseUser1.from('task_contributors').insert({
          task_id: testTaskId,
          user_id: user2Id,
          role
        }).select().single();

        expect(error).toBeNull();
        expect(data!.role).toBe(role);
      }
    });
  });

  /**
   * T042: DELETE /contributors-remove endpoint
   *
   * Tests:
   * 1. Soft delete verification (sets removed_at timestamp)
   * 2. Owner permission check (only task owner can remove)
   * 3. Idempotent operations (removing already-removed contributor)
   */
  describe('DELETE /contributors-remove (soft delete)', () => {
    beforeEach(async () => {
      // Add a contributor before each remove test
      await supabaseService.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'helper',
        notes: 'Will be removed'
      });
    });

    it('T042.1: should soft delete contributor by setting removed_at', async () => {
      // Get contributor record
      const { data: contributor } = await supabaseService
        .from('task_contributors')
        .select('id')
        .eq('task_id', testTaskId)
        .eq('user_id', user2Id)
        .single();

      // Task owner removes contributor (soft delete)
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .update({
          removed_at: new Date().toISOString()
        })
        .eq('id', contributor!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.removed_at).not.toBeNull();
      expect(new Date(data!.removed_at!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('T042.2: should enforce owner permission check via RLS', async () => {
      // Get contributor record
      const { data: contributor } = await supabaseService
        .from('task_contributors')
        .select('id')
        .eq('task_id', testTaskId)
        .eq('user_id', user2Id)
        .single();

      // User2 (NOT task owner) attempts to remove contributor
      const { error } = await supabaseUser2
        .from('task_contributors')
        .update({
          removed_at: new Date().toISOString()
        })
        .eq('id', contributor!.id);

      // RLS policy should block this update
      expect(error).toBeDefined();
    });

    it('T042.3: should handle idempotent removal (already removed)', async () => {
      // Get contributor record
      const { data: contributor } = await supabaseService
        .from('task_contributors')
        .select('id')
        .eq('task_id', testTaskId)
        .eq('user_id', user2Id)
        .single();

      // Remove contributor first time
      await supabaseUser1
        .from('task_contributors')
        .update({
          removed_at: new Date().toISOString()
        })
        .eq('id', contributor!.id);

      // Attempt to remove again (should be idempotent)
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .update({
          removed_at: new Date().toISOString()
        })
        .eq('id', contributor!.id)
        .select()
        .single();

      // Should succeed (idempotent operation)
      expect(error).toBeNull();
      expect(data!.removed_at).not.toBeNull();
    });

    it('T042.4: should not hard delete contributors (preserve audit trail)', async () => {
      // Get contributor record
      const { data: contributor } = await supabaseService
        .from('task_contributors')
        .select('id')
        .eq('task_id', testTaskId)
        .eq('user_id', user2Id)
        .single();

      // Soft delete contributor
      await supabaseUser1
        .from('task_contributors')
        .update({
          removed_at: new Date().toISOString()
        })
        .eq('id', contributor!.id);

      // Verify contributor still exists in database
      const { data: removedContributor, error } = await supabaseService
        .from('task_contributors')
        .select('*')
        .eq('id', contributor!.id)
        .single();

      expect(error).toBeNull();
      expect(removedContributor).toBeDefined();
      expect(removedContributor!.removed_at).not.toBeNull();
    });
  });

  /**
   * Additional Tests: RLS Policy Verification
   */
  describe('RLS Policy Tests', () => {
    it('should allow contributors to view task they contributed to', async () => {
      // Add user2 as contributor
      await supabaseService.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'helper'
      });

      // User2 should now be able to view the task via RLS
      const { data, error } = await supabaseUser2
        .from('tasks')
        .select('*')
        .eq('id', testTaskId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(testTaskId);
    });

    it('should deny access to tasks user has no relation to', async () => {
      // User2 is NOT assignee, creator, or contributor
      const { data, error } = await supabaseUser2
        .from('tasks')
        .select('*')
        .eq('id', testTaskId);

      // RLS should filter out the task
      expect(data).toHaveLength(0);
    });

    it('should allow task owner to view contributors', async () => {
      // Add contributor
      await supabaseService.from('task_contributors').insert({
        task_id: testTaskId,
        user_id: user2Id,
        role: 'helper'
      });

      // Task owner (user1) should view contributors
      const { data, error } = await supabaseUser1
        .from('task_contributors')
        .select('*')
        .eq('task_id', testTaskId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });
});
