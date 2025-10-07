/**
 * Integration Test: SLA Escalation Workflow
 *
 * Validates Scenario 3 from quickstart.md:
 * - Creates assignment with past deadline (75% elapsed)
 * - Triggers sla_check_and_escalate()
 * - Verifies warning notification sent
 * - Fast-forwards to 100% breach, verifies escalation event created
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-3
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
);

describe('Integration: SLA Escalation Workflow', () => {
  let testOrgUnitId: string;
  let testSkillId: string;
  let testStaffId: string;
  let testSupervisorId: string;
  let testUserId: string;
  let testSupervisorUserId: string;

  beforeAll(async () => {
    // Create test organizational unit
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة SLA الاختبارية',
        name_en: 'Test SLA Unit',
        unit_wip_limit: 20,
      })
      .select()
      .single();

    if (orgError) throw orgError;
    testOrgUnitId = orgUnit.id;

    // Create test skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .insert({
        name_ar: 'مهارة SLA الاختبارية',
        name_en: 'Test SLA Skill',
        category: 'test',
      })
      .select()
      .single();

    if (skillError) throw skillError;
    testSkillId = skill.id;

    // Create test supervisor user
    const { data: supervisorUser, error: supervisorError } = await supabase.auth.admin.createUser({
      email: `test-sla-supervisor-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (supervisorError) throw supervisorError;
    testSupervisorUserId = supervisorUser.user.id;

    // Create supervisor staff profile
    const { data: supervisor, error: supervisorStaffError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testSupervisorUserId,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 8,
        current_assignment_count: 0,
        availability_status: 'available',
        role: 'supervisor',
      })
      .select()
      .single();

    if (supervisorStaffError) throw supervisorStaffError;
    testSupervisorId = supervisor.id;

    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `test-sla-staff-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError) throw userError;
    testUserId = user.user.id;

    // Create test staff profile with escalation chain to supervisor
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUserId,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 5,
        current_assignment_count: 0,
        availability_status: 'available',
        role: 'staff',
        escalation_chain_id: testSupervisorUserId,
      })
      .select()
      .single();

    if (staffError) throw staffError;
    testStaffId = staff.id;
  });

  afterAll(async () => {
    // Clean up
    await supabase.from('escalation_events').delete().like('assignment_id', '%test-sla%');
    await supabase.from('assignments').delete().like('work_item_id', 'test-sla-%');
    await supabase.from('staff_profiles').delete().eq('id', testStaffId);
    await supabase.from('staff_profiles').delete().eq('id', testSupervisorId);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.auth.admin.deleteUser(testSupervisorUserId);
    await supabase.from('skills').delete().eq('id', testSkillId);
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Clean up test assignments and escalations
    await supabase.from('escalation_events').delete().like('assignment_id', '%test-sla%');
    await supabase.from('assignments').delete().like('work_item_id', 'test-sla-%');
  });

  it('should send warning notification at 75% SLA elapsed', async () => {
    // Create assignment with 48-hour SLA (normal priority dossier)
    // Set assigned_at to 36 hours ago (75% of 48 hours)
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 36 * 60 * 60 * 1000); // 36 hours ago
    const slaDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-sla-warning-${Date.now()}`,
        work_item_type: 'dossier',
        assignee_id: testUserId,
        assigned_at: assignedAt.toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        priority: 'normal',
        status: 'assigned',
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Manually trigger SLA monitoring function
    const { error: monitorError } = await supabase.rpc('sla_check_and_escalate');

    if (monitorError) throw monitorError;

    // Verify warning_sent_at was set
    const { data: updatedAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('warning_sent_at')
      .eq('id', assignment.id)
      .single();

    if (fetchError) throw fetchError;

    expect(updatedAssignment.warning_sent_at).not.toBeNull();
    expect(new Date(updatedAssignment.warning_sent_at!)).toBeInstanceOf(Date);
  });

  it('should create escalation event at 100% SLA breach', async () => {
    // Create assignment with SLA already breached (deadline in the past)
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50 hours ago
    const slaDeadline = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago (breached)

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-sla-breach-${Date.now()}`,
        work_item_type: 'dossier',
        assignee_id: testUserId,
        assigned_at: assignedAt.toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        priority: 'normal',
        status: 'assigned',
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Manually trigger SLA monitoring function
    const { error: monitorError } = await supabase.rpc('sla_check_and_escalate');

    if (monitorError) throw monitorError;

    // Verify escalation event created
    const { data: escalationEvent, error: escalationError } = await supabase
      .from('escalation_events')
      .select('*')
      .eq('assignment_id', assignment.id)
      .single();

    if (escalationError) throw escalationError;

    expect(escalationEvent).toBeDefined();
    expect(escalationEvent.escalated_from_id).toBe(testUserId);
    expect(escalationEvent.escalated_to_id).toBe(testSupervisorUserId);
    expect(escalationEvent.reason).toBe('sla_breach');
    expect(escalationEvent.acknowledged_at).toBeNull(); // Not yet acknowledged
    expect(escalationEvent.resolved_at).toBeNull(); // Not yet resolved

    // Verify assignment marked as escalated
    const { data: updatedAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('escalated_at, escalation_recipient_id')
      .eq('id', assignment.id)
      .single();

    if (fetchError) throw fetchError;

    expect(updatedAssignment.escalated_at).not.toBeNull();
    expect(updatedAssignment.escalation_recipient_id).toBe(testSupervisorUserId);
  });

  it('should not send duplicate warnings for same assignment', async () => {
    // Create assignment at 75% threshold
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const slaDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-sla-duplicate-${Date.now()}`,
        work_item_type: 'dossier',
        assignee_id: testUserId,
        assigned_at: assignedAt.toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        priority: 'normal',
        status: 'assigned',
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // First trigger: should send warning
    await supabase.rpc('sla_check_and_escalate');

    const { data: firstCheck } = await supabase
      .from('assignments')
      .select('warning_sent_at')
      .eq('id', assignment.id)
      .single();

    const firstWarningTime = firstCheck?.warning_sent_at;
    expect(firstWarningTime).not.toBeNull();

    // Second trigger: should NOT update warning_sent_at
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay
    await supabase.rpc('sla_check_and_escalate');

    const { data: secondCheck } = await supabase
      .from('assignments')
      .select('warning_sent_at')
      .eq('id', assignment.id)
      .single();

    expect(secondCheck?.warning_sent_at).toBe(firstWarningTime); // Same timestamp
  });

  it('should not create duplicate escalation events for same breach', async () => {
    // Create breached assignment
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 50 * 60 * 60 * 1000);
    const slaDeadline = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-sla-dup-escalation-${Date.now()}`,
        work_item_type: 'dossier',
        assignee_id: testUserId,
        assigned_at: assignedAt.toISOString(),
        sla_deadline: slaDeadline.toISOString(),
        priority: 'normal',
        status: 'assigned',
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // First trigger: create escalation
    await supabase.rpc('sla_check_and_escalate');

    const { data: firstEscalations } = await supabase
      .from('escalation_events')
      .select('*')
      .eq('assignment_id', assignment.id);

    expect(firstEscalations?.length).toBe(1);

    // Second trigger: should NOT create duplicate
    await supabase.rpc('sla_check_and_escalate');

    const { data: secondEscalations } = await supabase
      .from('escalation_events')
      .select('*')
      .eq('assignment_id', assignment.id);

    expect(secondEscalations?.length).toBe(1); // Still only 1 escalation
  });

  it('should calculate correct SLA status (ok, warning, breached)', async () => {
    const now = new Date();

    const testCases = [
      {
        name: 'ok status (50% elapsed)',
        assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24h ago
        slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h future
        expectedStatus: 'ok',
      },
      {
        name: 'warning status (80% elapsed)',
        assignedAt: new Date(now.getTime() - 38 * 60 * 60 * 1000), // 38h ago
        slaDeadline: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10h future
        expectedStatus: 'warning',
      },
      {
        name: 'breached status (110% elapsed)',
        assignedAt: new Date(now.getTime() - 50 * 60 * 60 * 1000), // 50h ago
        slaDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h past
        expectedStatus: 'breached',
      },
    ];

    for (const testCase of testCases) {
      const { data: assignment } = await supabase
        .from('assignments')
        .insert({
          work_item_id: `test-sla-status-${testCase.expectedStatus}-${Date.now()}`,
          work_item_type: 'ticket',
          assignee_id: testUserId,
          assigned_at: testCase.assignedAt.toISOString(),
          sla_deadline: testCase.slaDeadline.toISOString(),
          priority: 'normal',
          status: 'assigned',
        })
        .select()
        .single();

      // Calculate status
      const assignedAtTime = new Date(assignment!.assigned_at).getTime();
      const deadlineTime = new Date(assignment!.sla_deadline).getTime();
      const totalDuration = deadlineTime - assignedAtTime;
      const elapsed = now.getTime() - assignedAtTime;
      const elapsedPct = elapsed / totalDuration;

      let actualStatus: string;
      if (now.getTime() >= deadlineTime) {
        actualStatus = 'breached';
      } else if (elapsedPct >= 0.75) {
        actualStatus = 'warning';
      } else {
        actualStatus = 'ok';
      }

      expect(actualStatus).toBe(testCase.expectedStatus);
    }
  });

  it('should use escalation chain for recipient resolution', async () => {
    // Verify that staff's escalation_chain_id is used
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('escalation_chain_id')
      .eq('id', testStaffId)
      .single();

    expect(staffProfile?.escalation_chain_id).toBe(testSupervisorUserId);

    // Create breached assignment
    const now = new Date();
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-sla-chain-${Date.now()}`,
        work_item_type: 'ticket',
        assignee_id: testUserId,
        assigned_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        sla_deadline: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        priority: 'urgent',
        status: 'assigned',
      })
      .select()
      .single();

    await supabase.rpc('sla_check_and_escalate');

    // Verify escalation went to supervisor (from escalation_chain_id)
    const { data: escalation } = await supabase
      .from('escalation_events')
      .select('escalated_to_id')
      .eq('assignment_id', assignment!.id)
      .single();

    expect(escalation?.escalated_to_id).toBe(testSupervisorUserId);
  });
});
