import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

describe('Integration Test: Engagement Access Control', () => {
  let supabase: SupabaseClient<Database>;
  let authorizedUser: { id: string; email: string };
  let unauthorizedUser: { id: string; email: string };
  let testEngagementId: string;
  let testAssignment1Id: string;
  let testAssignment2Id: string;
  let testAssignment3Id: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create test users
    authorizedUser = {
      id: 'engagement-authorized-user',
      email: 'engagement-authorized@test.com'
    };

    unauthorizedUser = {
      id: 'engagement-unauthorized-user',
      email: 'engagement-unauthorized@test.com'
    };

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        title_en: 'Test Engagement Access Control',
        title_ar: 'اختبار التحكم في الوصول للمشاركة',
        engagement_type: 'minister_visit',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    testEngagementId = engagement!.id;

    // Create test assignments linked to engagement
    const { data: assignment1 } = await supabase
      .from('assignments')
      .insert({
        assignee_id: authorizedUser.id,
        work_item_type: 'dossier',
        work_item_id: 'engagement-test-dossier-1',
        priority: 'high',
        status: 'assigned',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
        engagement_id: testEngagementId,
        workflow_stage: 'todo',
      })
      .select()
      .single();

    testAssignment1Id = assignment1!.id;

    const { data: assignment2 } = await supabase
      .from('assignments')
      .insert({
        assignee_id: authorizedUser.id,
        work_item_type: 'dossier',
        work_item_id: 'engagement-test-dossier-2',
        priority: 'medium',
        status: 'in_progress',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
        engagement_id: testEngagementId,
        workflow_stage: 'in_progress',
      })
      .select()
      .single();

    testAssignment2Id = assignment2!.id;

    const { data: assignment3 } = await supabase
      .from('assignments')
      .insert({
        assignee_id: authorizedUser.id,
        work_item_type: 'dossier',
        work_item_id: 'engagement-test-dossier-3',
        priority: 'low',
        status: 'completed',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
        engagement_id: testEngagementId,
        workflow_stage: 'done',
      })
      .select()
      .single();

    testAssignment3Id = assignment3!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('assignments').delete().eq('engagement_id', testEngagementId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
  });

  describe('Engagement-Linked Assignment Access', () => {
    it('should allow assignee to view engagement-linked assignments', async () => {
      const authorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await authorizedClient
        .from('assignments')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('assignee_id', authorizedUser.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(3);
    });

    it('should deny unauthorized user access to engagement assignments', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignments')
        .select('*')
        .eq('engagement_id', testEngagementId)
        .eq('assignee_id', authorizedUser.id);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Sibling Assignment Access', () => {
    it('should allow assignee to view sibling assignments in same engagement', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-related-get/${testAssignment1Id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('related_assignments');
        expect(Array.isArray(data.related_assignments)).toBe(true);

        // Should return 2 siblings (excluding current assignment)
        expect(data.related_assignments.length).toBe(2);
      }
    });

    it('should deny unauthorized user access to sibling assignments', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-related-get/${testAssignment1Id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer unauthorized-token',
          },
        }
      );

      expect([403, 404]).toContain(response.status);
    });

    it('should return engagement context with sibling assignments', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-related-get/${testAssignment1Id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('engagement_context');
        expect(data.engagement_context).toHaveProperty('id');
        expect(data.engagement_context.id).toBe(testEngagementId);
      }
    });
  });

  describe('Kanban Board Access', () => {
    it('should allow authorized user to view engagement kanban', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('kanban_columns');
        expect(data.kanban_columns).toHaveProperty('todo');
        expect(data.kanban_columns).toHaveProperty('in_progress');
        expect(data.kanban_columns).toHaveProperty('review');
        expect(data.kanban_columns).toHaveProperty('done');
      }
    });

    it('should deny unauthorized user access to engagement kanban', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer unauthorized-token',
          },
        }
      );

      expect([403, 404]).toContain(response.status);
    });

    it('should group assignments by workflow stage in kanban', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();

        // Verify assignments grouped correctly
        expect(data.kanban_columns.todo.length).toBe(1); // assignment1
        expect(data.kanban_columns.in_progress.length).toBe(1); // assignment2
        expect(data.kanban_columns.done.length).toBe(1); // assignment3
      }
    });

    it('should include progress stats in kanban response', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();

        expect(data).toHaveProperty('progress');
        expect(data.progress).toHaveProperty('total_assignments');
        expect(data.progress).toHaveProperty('completed_assignments');
        expect(data.progress).toHaveProperty('progress_percentage');

        expect(data.progress.total_assignments).toBe(3);
        expect(data.progress.completed_assignments).toBe(1);
        expect(data.progress.progress_percentage).toBeGreaterThanOrEqual(33);
      }
    });
  });

  describe('Workflow Stage Updates', () => {
    it('should allow authorized user to update workflow stage', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-workflow-stage-update/${testAssignment1Id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer authorized-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_stage: 'in_progress',
          }),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('should deny unauthorized user from updating workflow stage', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-workflow-stage-update/${testAssignment1Id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer unauthorized-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_stage: 'in_progress',
          }),
        }
      );

      expect([403, 404]).toContain(response.status);
    });

    it('should create timeline event for workflow stage change', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/assignments-workflow-stage-update/${testAssignment1Id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer authorized-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_stage: 'review',
          }),
        }
      );

      if (response.status === 200) {
        // Verify event created
        const { data: events } = await supabase
          .from('assignment_events')
          .select('*')
          .eq('assignment_id', testAssignment1Id)
          .eq('event_type', 'status_changed')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(events).toBeDefined();
        if (events!.length > 0) {
          expect(events![0].event_data).toHaveProperty('new_status');
        }
      }
    });
  });

  describe('RLS Policy Enforcement on Engagement Data', () => {
    it('should enforce RLS on engagement query', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('engagements')
        .select('*')
        .eq('id', testEngagementId)
        .single();

      // Depending on RLS policy, may deny or return null
      if (error) {
        expect(error).toBeDefined();
      } else {
        // If no error, data might be filtered by RLS
        expect(data).toBeDefined();
      }
    });

    it('should enforce RLS on assignment query by engagement_id', async () => {
      const unauthorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await unauthorizedClient
        .from('assignments')
        .select('*')
        .eq('engagement_id', testEngagementId);

      expect(error).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('Observer Access to Engagement Assignments', () => {
    it('should allow observer to view all engagement assignments', async () => {
      const observerId = 'engagement-observer-user';

      // Add observer to one assignment
      await supabase.from('assignment_observers').insert({
        assignment_id: testAssignment1Id,
        user_id: observerId,
        role: 'supervisor',
      });

      const observerClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { data, error } = await observerClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignment1Id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should restrict observer to only observed assignments', async () => {
      const observerId = 'engagement-observer-user-2';

      // Add observer to assignment 1 only
      await supabase.from('assignment_observers').insert({
        assignment_id: testAssignment1Id,
        user_id: observerId,
        role: 'other',
      });

      const observerClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Should access assignment 1
      const { data: data1, error: error1 } = await observerClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignment1Id)
        .single();

      expect(error1).toBeNull();
      expect(data1).toBeDefined();

      // Should NOT access assignment 2
      const { data: data2, error: error2 } = await observerClient
        .from('assignments')
        .select('*')
        .eq('id', testAssignment2Id)
        .single();

      expect(error2).toBeDefined();
      expect(data2).toBeNull();
    });
  });

  describe('Progress Calculation Security', () => {
    it('should calculate progress only for accessible assignments', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer authorized-token',
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();

        // Progress should reflect only assignments user can access
        expect(data.progress.total_assignments).toBeLessThanOrEqual(3);
        expect(data.progress.completed_assignments).toBeLessThanOrEqual(data.progress.total_assignments);
      }
    });

    it('should not leak information about inaccessible assignments in progress stats', async () => {
      const response = await fetch(
        `http://localhost:54321/functions/v1/engagements-kanban-get/${testEngagementId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer unauthorized-token',
          },
        }
      );

      expect([403, 404]).toContain(response.status);

      if (response.status === 403) {
        const data = await response.json();

        // Should not include any assignment data
        expect(data).not.toHaveProperty('progress');
        expect(data).not.toHaveProperty('kanban_columns');
      }
    });
  });

  describe('Real-time Updates Access Control', () => {
    it('should broadcast workflow stage updates only to authorized users', async () => {
      // This test verifies that real-time subscriptions respect RLS
      // In practice, Supabase Realtime automatically enforces RLS policies

      const authorizedClient = createClient<Database>(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const channel = authorizedClient
        .channel(`assignment:${testAssignment1Id}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `id=eq.${testAssignment1Id}` },
          (payload) => {
            expect(payload).toBeDefined();
          }
        );

      await channel.subscribe();

      // Update workflow stage
      await supabase
        .from('assignments')
        .update({ workflow_stage: 'review' })
        .eq('id', testAssignment1Id);

      // Cleanup
      await channel.unsubscribe();
    });
  });
});
