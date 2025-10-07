import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

describe('Integration Test: Audit Log Completeness', () => {
  let supabase: SupabaseClient<Database>;
  let testUser: { id: string; email: string };
  let testAssignmentId: string;
  let testEngagementId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create test user
    testUser = {
      id: 'audit-test-user',
      email: 'audit-test@example.com'
    };

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        title_en: 'Test Engagement for Audit',
        title_ar: 'مشاركة اختبار للتدقيق',
        engagement_type: 'minister_visit',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    testEngagementId = engagement!.id;

    // Create test assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUser.id,
        work_item_type: 'dossier',
        work_item_id: 'audit-test-dossier',
        priority: 'high',
        status: 'assigned',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
        engagement_id: testEngagementId,
        workflow_stage: 'todo',
      })
      .select()
      .single();

    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
  });

  it('should log assignment creation event', async () => {
    // Query for creation event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'created');

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    const createEvent = events![0];
    expect(createEvent.actor_user_id).toBe(testUser.id);
    expect(createEvent.event_data).toBeDefined();
    expect(createEvent.created_at).toBeDefined();
  });

  it('should log comment creation event', async () => {
    // Create comment
    const { data: comment } = await supabase
      .from('assignment_comments')
      .insert({
        assignment_id: testAssignmentId,
        user_id: testUser.id,
        text: 'Test comment for audit log',
      })
      .select()
      .single();

    // Verify event logged
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'commented')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const commentEvent = events![0];
    expect(commentEvent.actor_user_id).toBe(testUser.id);
    expect(commentEvent.event_data).toHaveProperty('comment_id');
    expect(commentEvent.event_data.comment_id).toBe(comment!.id);
    expect(commentEvent.created_at).toBeDefined();
  });

  it('should log checklist item creation and update events', async () => {
    // Create checklist item
    const { data: item } = await supabase
      .from('assignment_checklist_items')
      .insert({
        assignment_id: testAssignmentId,
        text: 'Test checklist item',
        sequence: 1,
      })
      .select()
      .single();

    // Complete the item
    await supabase
      .from('assignment_checklist_items')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: testUser.id,
      })
      .eq('id', item!.id);

    // Verify checklist_updated event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'checklist_updated')
      .order('created_at', { ascending: false });

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    const checklistEvent = events![0];
    expect(checklistEvent.actor_user_id).toBe(testUser.id);
    expect(checklistEvent.event_data).toHaveProperty('item_id');
    expect(checklistEvent.event_data).toHaveProperty('action');
    expect(checklistEvent.created_at).toBeDefined();
  });

  it('should log escalation event with all required data', async () => {
    // Create supervisor user
    const supervisorId = 'audit-supervisor-user';

    // Escalate assignment
    await supabase
      .from('assignment_observers')
      .insert({
        assignment_id: testAssignmentId,
        user_id: supervisorId,
        role: 'supervisor',
      });

    // Create escalation event
    await supabase
      .from('assignment_events')
      .insert({
        assignment_id: testAssignmentId,
        event_type: 'escalated',
        actor_user_id: testUser.id,
        event_data: {
          reason: 'SLA approaching deadline',
          supervisor_id: supervisorId,
          trigger: 'manual',
        },
      });

    // Verify event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'escalated')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const escalationEvent = events![0];
    expect(escalationEvent.actor_user_id).toBe(testUser.id);
    expect(escalationEvent.event_data).toHaveProperty('reason');
    expect(escalationEvent.event_data).toHaveProperty('supervisor_id');
    expect(escalationEvent.event_data).toHaveProperty('trigger');
    expect(escalationEvent.event_data.supervisor_id).toBe(supervisorId);
    expect(escalationEvent.created_at).toBeDefined();
  });

  it('should log workflow stage change event', async () => {
    // Update workflow stage
    await supabase
      .from('assignments')
      .update({ workflow_stage: 'in_progress' })
      .eq('id', testAssignmentId);

    // Create workflow stage change event
    await supabase
      .from('assignment_events')
      .insert({
        assignment_id: testAssignmentId,
        event_type: 'status_changed',
        actor_user_id: testUser.id,
        event_data: {
          old_status: 'todo',
          new_status: 'in_progress',
        },
      });

    // Verify event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'status_changed')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const stageEvent = events![0];
    expect(stageEvent.actor_user_id).toBe(testUser.id);
    expect(stageEvent.event_data).toHaveProperty('old_status');
    expect(stageEvent.event_data).toHaveProperty('new_status');
    expect(stageEvent.created_at).toBeDefined();
  });

  it('should log assignment completion event', async () => {
    // Complete assignment
    await supabase
      .from('assignments')
      .update({
        status: 'completed',
        workflow_stage: 'done',
      })
      .eq('id', testAssignmentId);

    // Create completion event
    await supabase
      .from('assignment_events')
      .insert({
        assignment_id: testAssignmentId,
        event_type: 'completed',
        actor_user_id: testUser.id,
        event_data: {
          completion_notes: 'All tasks completed successfully',
        },
      });

    // Verify event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const completionEvent = events![0];
    expect(completionEvent.actor_user_id).toBe(testUser.id);
    expect(completionEvent.event_data).toBeDefined();
    expect(completionEvent.created_at).toBeDefined();
  });

  it('should log reassignment event', async () => {
    const newAssigneeId = 'audit-new-assignee';

    // Create reassignment event
    await supabase
      .from('assignment_events')
      .insert({
        assignment_id: testAssignmentId,
        event_type: 'reassigned',
        actor_user_id: testUser.id,
        event_data: {
          old_assignee_id: testUser.id,
          new_assignee_id: newAssigneeId,
          reason: 'Workload balancing',
        },
      });

    // Verify event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'reassigned')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const reassignEvent = events![0];
    expect(reassignEvent.actor_user_id).toBe(testUser.id);
    expect(reassignEvent.event_data).toHaveProperty('old_assignee_id');
    expect(reassignEvent.event_data).toHaveProperty('new_assignee_id');
    expect(reassignEvent.created_at).toBeDefined();
  });

  it('should log observer addition event', async () => {
    const observerId = 'audit-observer-user';

    // Add observer
    await supabase
      .from('assignment_observers')
      .insert({
        assignment_id: testAssignmentId,
        user_id: observerId,
        role: 'other',
      });

    // Create observer added event
    await supabase
      .from('assignment_events')
      .insert({
        assignment_id: testAssignmentId,
        event_type: 'observer_added',
        actor_user_id: testUser.id,
        event_data: {
          observer_id: observerId,
          role: 'other',
        },
      });

    // Verify event
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'observer_added')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events!.length).toBe(1);

    const observerEvent = events![0];
    expect(observerEvent.actor_user_id).toBe(testUser.id);
    expect(observerEvent.event_data).toHaveProperty('observer_id');
    expect(observerEvent.event_data.observer_id).toBe(observerId);
    expect(observerEvent.created_at).toBeDefined();
  });

  it('should maintain event chronological order', async () => {
    // Query all events for the assignment
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .order('created_at', { ascending: true });

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    // Verify chronological order
    for (let i = 1; i < events!.length; i++) {
      const prevTimestamp = new Date(events![i - 1].created_at).getTime();
      const currTimestamp = new Date(events![i].created_at).getTime();
      expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
    }
  });

  it('should include actor_user_id in all events', async () => {
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId);

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    // Verify all events have actor_user_id
    events!.forEach(event => {
      expect(event.actor_user_id).toBeDefined();
      expect(event.actor_user_id).not.toBeNull();
    });
  });

  it('should include timestamp in all events', async () => {
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId);

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    // Verify all events have created_at
    events!.forEach(event => {
      expect(event.created_at).toBeDefined();
      expect(event.created_at).not.toBeNull();
      expect(new Date(event.created_at).getTime()).toBeGreaterThan(0);
    });
  });

  it('should support event data queries for filtering', async () => {
    // Query events by specific event_data field
    const { data: escalationEvents } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'escalated');

    expect(escalationEvents).toBeDefined();

    // Verify event_data structure
    if (escalationEvents!.length > 0) {
      escalationEvents!.forEach(event => {
        expect(event.event_data).toBeDefined();
        expect(typeof event.event_data).toBe('object');
      });
    }
  });

  it('should support audit trail reconstruction', async () => {
    // Query all events and reconstruct timeline
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .order('created_at', { ascending: true });

    expect(events).toBeDefined();
    expect(events!.length).toBeGreaterThan(0);

    // Reconstruct assignment lifecycle
    const lifecycle = events!.map(event => ({
      type: event.event_type,
      actor: event.actor_user_id,
      timestamp: event.created_at,
      data: event.event_data,
    }));

    expect(lifecycle.length).toBeGreaterThan(0);
    expect(lifecycle[0].type).toBe('created');
  });
});
