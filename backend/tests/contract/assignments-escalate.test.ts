/**
 * Contract Test: POST /assignments/{id}/escalate
 *
 * Validates:
 * - Success: Returns 200 with EscalationResponse
 * - Creates escalation_event record
 * - Sends notifications to assignee and recipient
 * - Returns 404 for non-existent assignment
 *
 * Dependencies: T009 (escalation_events table)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('POST /assignments/{id}/escalate', () => {
  let supabase: SupabaseClient;
  let assigneeClient: SupabaseClient;
  let supervisorClient: SupabaseClient;

  let testUnitId: string;
  let testAssigneeId: string;
  let testSupervisorId: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test unit
    const { data: unit } = await supabase
      .from('organizational_units')
      .insert({ name_ar: 'وحدة التصعيد', name_en: 'Escalation Unit', unit_wip_limit: 20 })
      .select()
      .single();

    testUnitId = unit!.id;

    // Create test staff
    const { data: staff } = await supabase
      .from('staff_profiles')
      .insert([
        {
          user_id: 'escalate-assignee-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 5,
          role: 'staff'
        },
        {
          user_id: 'escalate-supervisor-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 8,
          role: 'supervisor'
        }
      ])
      .select();

    testAssigneeId = staff![0].user_id;
    testSupervisorId = staff![1].user_id;

    // Set escalation chain
    await supabase
      .from('staff_profiles')
      .update({ escalation_chain_id: testSupervisorId })
      .eq('user_id', testAssigneeId);

    // Create test assignment
    const now = new Date();
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        work_item_id: 'escalate-ticket-1',
        work_item_type: 'ticket',
        assignee_id: testAssigneeId,
        assigned_at: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
        sla_deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (breached)
        priority: 'normal',
        status: 'in_progress'
      })
      .select()
      .single();

    testAssignmentId = assignment!.id;

    assigneeClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    supervisorClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  });

  afterAll(async () => {
    await supabase.from('escalation_events').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().ilike('work_item_id', 'escalate-%');
    await supabase.from('staff_profiles').delete().in('user_id', [testAssigneeId, testSupervisorId]);
    await supabase.from('organizational_units').delete().eq('id', testUnitId);
  });

  it('should return 200 and create escalation event for manual escalation', async () => {
    const response = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: {
        reason: 'manual',
        notes: 'Need supervisor assistance with complex issue'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      escalation_id: expect.any(String),
      assignment_id: testAssignmentId,
      escalated_from_id: testAssigneeId,
      escalated_to_id: testSupervisorId,
      reason: 'manual',
      escalated_at: expect.any(String)
    });

    // Verify escalation_event record created
    const { data: escalationEvent } = await supabase
      .from('escalation_events')
      .select()
      .eq('assignment_id', testAssignmentId)
      .single();

    expect(escalationEvent).toBeTruthy();
    expect(escalationEvent?.escalated_from_id).toBe(testAssigneeId);
    expect(escalationEvent?.escalated_to_id).toBe(testSupervisorId);
    expect(escalationEvent?.reason).toBe('manual');
    expect(escalationEvent?.notes).toBe('Need supervisor assistance with complex issue');
  });

  it('should update assignment with escalation metadata', async () => {
    const response = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: {
        reason: 'manual',
        notes: 'Testing escalation metadata update'
      }
    });

    expect(response.error).toBeNull();

    // Verify assignment updated
    const { data: assignment } = await supabase
      .from('assignments')
      .select()
      .eq('id', testAssignmentId)
      .single();

    expect(assignment?.escalated_at).toBeTruthy();
    expect(assignment?.escalation_recipient_id).toBe(testSupervisorId);
  });

  it('should send notifications to both assignee and supervisor', async () => {
    const response = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: {
        reason: 'manual'
      }
    });

    expect(response.error).toBeNull();

    // Verify notifications created
    const { data: notifications } = await supabase
      .from('notifications')
      .select()
      .eq('reference_id', testAssignmentId)
      .eq('type', 'assignment_escalated');

    expect(notifications).toHaveLength(2);

    const assigneeNotif = notifications!.find(n => n.user_id === testAssigneeId);
    const supervisorNotif = notifications!.find(n => n.user_id === testSupervisorId);

    expect(assigneeNotif).toBeTruthy();
    expect(assigneeNotif?.message_en).toContain('escalated to supervisor');

    expect(supervisorNotif).toBeTruthy();
    expect(supervisorNotif?.message_en).toContain('escalated assignment');
  });

  it('should return 404 when assignment does not exist', async () => {
    const response = await assigneeClient.functions.invoke('assignments-escalate/non-existent-id', {
      method: 'POST',
      body: {
        reason: 'manual'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(404);
    expect(response.error.message).toContain('Assignment not found');
  });

  it('should return 400 when reason is invalid', async () => {
    const response = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: {
        reason: 'invalid_reason'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('Invalid escalation reason');
  });

  it('should prevent duplicate escalation for same assignment', async () => {
    // First escalation
    const firstResponse = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: { reason: 'manual' }
    });

    expect(firstResponse.error).toBeNull();

    // Second escalation attempt
    const secondResponse = await assigneeClient.functions.invoke(`assignments-escalate/${testAssignmentId}`, {
      method: 'POST',
      body: { reason: 'manual' }
    });

    expect(secondResponse.error).toBeTruthy();
    expect(secondResponse.status).toBe(409); // Conflict
    expect(secondResponse.error.message).toContain('already escalated');
  });

  it('should allow supervisor to acknowledge escalation', async () => {
    // Create new assignment for this test
    const { data: newAssignment } = await supabase
      .from('assignments')
      .insert({
        work_item_id: 'escalate-acknowledge-test',
        work_item_type: 'ticket',
        assignee_id: testAssigneeId,
        assigned_at: new Date().toISOString(),
        sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'in_progress'
      })
      .select()
      .single();

    // Escalate
    await assigneeClient.functions.invoke(`assignments-escalate/${newAssignment!.id}`, {
      method: 'POST',
      body: { reason: 'manual' }
    });

    // Acknowledge
    const { data: escalationEvent } = await supabase
      .from('escalation_events')
      .select()
      .eq('assignment_id', newAssignment!.id)
      .single();

    const acknowledgeResponse = await supervisorClient.functions.invoke(
      `escalations/${escalationEvent!.id}/acknowledge`,
      {
        method: 'POST',
        body: {
          notes: 'Acknowledged - will review immediately'
        }
      }
    );

    expect(acknowledgeResponse.error).toBeNull();

    // Verify acknowledged_at timestamp set
    const { data: updatedEscalation } = await supabase
      .from('escalation_events')
      .select()
      .eq('id', escalationEvent!.id)
      .single();

    expect(updatedEscalation?.acknowledged_at).toBeTruthy();
    expect(updatedEscalation?.notes).toContain('Acknowledged');

    // Cleanup
    await supabase.from('escalation_events').delete().eq('assignment_id', newAssignment!.id);
    await supabase.from('assignments').delete().eq('id', newAssignment!.id);
  });

  it('should handle capacity_exhaustion reason for queued items', async () => {
    // Create queued assignment (no assignee yet)
    const { data: queuedAssignment } = await supabase
      .from('assignment_queue')
      .insert({
        work_item_id: 'escalate-queued-1',
        work_item_type: 'ticket',
        required_skills: [],
        priority: 'urgent',
        attempts: 5 // Multiple failed attempts
      })
      .select()
      .single();

    const response = await supervisorClient.functions.invoke('queue-escalate', {
      method: 'POST',
      body: {
        queue_id: queuedAssignment!.id,
        reason: 'capacity_exhaustion',
        notes: '5 failed assignment attempts - unit at capacity'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data.reason).toBe('capacity_exhaustion');

    // Cleanup
    await supabase.from('assignment_queue').delete().eq('id', queuedAssignment!.id);
  });

  it('should fallback to admin if escalation_chain_id is null', async () => {
    // Create staff with no escalation chain
    const { data: staffNoChain } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: 'escalate-no-chain-id',
        unit_id: testUnitId,
        skills: [],
        individual_wip_limit: 5,
        role: 'staff',
        escalation_chain_id: null
      })
      .select()
      .single();

    // Create assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        work_item_id: 'escalate-fallback-test',
        work_item_type: 'ticket',
        assignee_id: staffNoChain!.user_id,
        assigned_at: new Date().toISOString(),
        sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        status: 'assigned'
      })
      .select()
      .single();

    const response = await assigneeClient.functions.invoke(`assignments-escalate/${assignment!.id}`, {
      method: 'POST',
      body: { reason: 'manual' }
    });

    expect(response.error).toBeNull();
    // Should escalate to supervisor or admin
    expect(response.data.escalated_to_id).toBeTruthy();

    // Cleanup
    await supabase.from('escalation_events').delete().eq('assignment_id', assignment!.id);
    await supabase.from('assignments').delete().eq('id', assignment!.id);
    await supabase.from('staff_profiles').delete().eq('user_id', staffNoChain!.user_id);
  });
});
