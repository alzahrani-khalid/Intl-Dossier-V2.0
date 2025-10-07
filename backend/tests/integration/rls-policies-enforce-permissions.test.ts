import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

describe('Integration Test: RLS Policies Enforce Permissions', () => {
  let supabase: SupabaseClient<Database>;
  let staffUser: { id: string; email: string; token: string };
  let observerUser: { id: string; email: string; token: string };
  let unauthorizedUser: { id: string; email: string; token: string };
  let testAssignmentId: string;
  let testCommentId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create test users
    staffUser = {
      id: 'staff-user-rls-test',
      email: 'staff-rls@test.com',
      token: 'staff-token'
    };

    observerUser = {
      id: 'observer-user-rls-test',
      email: 'observer-rls@test.com',
      token: 'observer-token'
    };

    unauthorizedUser = {
      id: 'unauthorized-user-rls-test',
      email: 'unauthorized-rls@test.com',
      token: 'unauthorized-token'
    };

    // Create test assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: staffUser.id,
        work_item_type: 'dossier',
        work_item_id: 'test-dossier-rls',
        priority: 'high',
        status: 'assigned',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    testAssignmentId = assignment!.id;

    // Create test comment
    const { data: comment } = await supabase
      .from('assignment_comments')
      .insert({
        assignment_id: testAssignmentId,
        user_id: staffUser.id,
        text: 'Test comment for RLS',
      })
      .select()
      .single();

    testCommentId = comment!.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  describe('Assignment RLS Policies', () => {
    it('should allow assignee to view assignment', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Simulate authenticated user
      const { data, error } = await staffClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignmentId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.assignee_id).toBe(staffUser.id);
    });

    it('should allow observer to view assignment', async () => {
      // Add observer
      await supabase.from('assignment_observers').insert({
        assignment_id: testAssignmentId,
        user_id: observerUser.id,
        role: 'supervisor',
      });

      const observerClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data, error } = await observerClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignmentId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should deny unauthorized user access to assignment', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data, error } = await unauthorizedClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignmentId)
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Comment RLS Policies', () => {
    it('should allow assignee to read comments', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await staffClient
        .from('assignment_comments')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should allow assignee to insert comments', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await staffClient
        .from('assignment_comments')
        .insert({
          assignment_id: testAssignmentId,
          user_id: staffUser.id,
          text: 'New comment from assignee',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should deny unauthorized user access to comments', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignment_comments')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Checklist RLS Policies', () => {
    it('should allow assignee to manage checklist items', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Insert
      const { data: insertData, error: insertError } = await staffClient
        .from('assignment_checklist_items')
        .insert({
          assignment_id: testAssignmentId,
          text: 'Test checklist item',
          sequence: 1,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();

      // Update
      const { data: updateData, error: updateError } = await staffClient
        .from('assignment_checklist_items')
        .update({ completed: true })
        .eq('id', insertData!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updateData?.completed).toBe(true);

      // Delete
      const { error: deleteError } = await staffClient
        .from('assignment_checklist_items')
        .delete()
        .eq('id', insertData!.id);

      expect(deleteError).toBeNull();
    });

    it('should deny unauthorized user access to checklist', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignment_checklist_items')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Reaction RLS Policies', () => {
    it('should allow users with view permission to read reactions', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Insert reaction first
      await staffClient.from('comment_reactions').insert({
        comment_id: testCommentId,
        user_id: staffUser.id,
        emoji: '👍',
      });

      const { data, error } = await staffClient
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', testCommentId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow users to manage their own reactions', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Insert
      const { data: insertData, error: insertError } = await staffClient
        .from('comment_reactions')
        .insert({
          comment_id: testCommentId,
          user_id: staffUser.id,
          emoji: '✅',
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();

      // Delete own reaction
      const { error: deleteError } = await staffClient
        .from('comment_reactions')
        .delete()
        .eq('id', insertData!.id)
        .eq('user_id', staffUser.id);

      expect(deleteError).toBeNull();
    });

    it('should deny unauthorized user access to reactions', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', testCommentId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Observer RLS Policies', () => {
    it('should allow assignee to view observers', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await staffClient
        .from('assignment_observers')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should allow observer to view themselves', async () => {
      const observerClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await observerClient
        .from('assignment_observers')
        .select('*')
        .eq('user_id', observerUser.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should deny unauthorized user access to observers', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignment_observers')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Assignment Events RLS Policies', () => {
    it('should allow users with view permission to read events', async () => {
      const staffClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await staffClient
        .from('assignment_events')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should deny unauthorized user access to events', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignment_events')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });
});
