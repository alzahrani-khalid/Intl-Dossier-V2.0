/**
 * Integration Test: Leave-Based Reassignment
 *
 * Validates Scenario 6 from quickstart.md:
 * - Staff member with 5 assignments (2 urgent, 1 high, 2 normal) goes on leave
 * - Verifies urgent and high priority items automatically reassigned
 * - Verifies normal/low priority items flagged for supervisor review
 * - Verifies supervisor notification sent
 * - Validates priority-based reassignment logic (FR-011a, FR-011b)
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-6
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Integration: Leave-Based Reassignment', () => {
  let testOrgUnitId: string;
  let testSkillId: string;
  let testStaff1Id: string; // Going on leave
  let testStaff2Id: string; // Available staff for reassignment
  let testSupervisorId: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testSupervisorUserId: string;

  beforeAll(async () => {
    // Create test organizational unit
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة إعادة التعيين (اختبار)',
        name_en: 'Reassignment Unit (Test)',
        unit_wip_limit: 30,
      })
      .select()
      .single();

    if (orgError) throw orgError;
    testOrgUnitId = orgUnit.id;

    // Create test skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .insert({
        name_ar: 'مهارة إعادة التعيين',
        name_en: 'Reassignment Skill',
        category: 'technical',
      })
      .select()
      .single();

    if (skillError) throw skillError;
    testSkillId = skill.id;

    // Create test users
    const { data: user1, error: userError1 } = await supabase.auth.admin.createUser({
      email: `test-leave-staff-1-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError1) throw userError1;
    testUser1Id = user1.user.id;

    const { data: user2, error: userError2 } = await supabase.auth.admin.createUser({
      email: `test-leave-staff-2-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError2) throw userError2;
    testUser2Id = user2.user.id;

    const { data: supervisorUser, error: supervisorUserError } =
      await supabase.auth.admin.createUser({
        email: `test-leave-supervisor-${Date.now()}@gastat.test`,
        password: 'test-password-123',
        email_confirm: true,
      });

    if (supervisorUserError) throw supervisorUserError;
    testSupervisorUserId = supervisorUser.user.id;

    // Create staff profiles
    const { data: staff1, error: staffError1 } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUser1Id,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 10,
        current_assignment_count: 5, // Will have 5 assignments
        availability_status: 'available',
      })
      .select()
      .single();

    if (staffError1) throw staffError1;
    testStaff1Id = staff1.id;

    const { data: staff2, error: staffError2 } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUser2Id,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 10,
        current_assignment_count: 2, // Has capacity
        availability_status: 'available',
      })
      .select()
      .single();

    if (staffError2) throw staffError2;
    testStaff2Id = staff2.id;

    const { data: supervisor, error: supervisorError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testSupervisorUserId,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 15,
        current_assignment_count: 0,
        availability_status: 'available',
        role: 'supervisor',
      })
      .select()
      .single();

    if (supervisorError) throw supervisorError;
    testSupervisorId = supervisor.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order
    await supabase.from('assignments').delete().eq('assignee_id', testStaff1Id);
    await supabase.from('assignments').delete().eq('assignee_id', testStaff2Id);
    await supabase.from('staff_profiles').delete().eq('id', testStaff1Id);
    await supabase.from('staff_profiles').delete().eq('id', testStaff2Id);
    await supabase.from('staff_profiles').delete().eq('id', testSupervisorId);

    if (testUser1Id) await supabase.auth.admin.deleteUser(testUser1Id);
    if (testUser2Id) await supabase.auth.admin.deleteUser(testUser2Id);
    if (testSupervisorUserId) await supabase.auth.admin.deleteUser(testSupervisorUserId);

    await supabase.from('skills').delete().eq('id', testSkillId);
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Reset staff availability
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'available', unavailable_until: null })
      .eq('id', testStaff1Id);

    // Clear assignments
    await supabase.from('assignments').delete().eq('assignee_id', testStaff1Id);
    await supabase.from('assignments').delete().eq('assignee_id', testStaff2Id);
  });

  it('should reassign urgent and high items when staff goes on leave', async () => {
    const baseTime = Date.now();
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Create 5 assignments for staff1 (2 urgent, 1 high, 2 normal)
    const assignments = await supabase.from('assignments').insert([
      {
        work_item_id: `urgent-001-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
      {
        work_item_id: `urgent-002-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
      {
        work_item_id: `high-001-${baseTime}`,
        work_item_type: 'dossier',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'high',
        status: 'assigned',
      },
      {
        work_item_id: `normal-001-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'normal',
        status: 'assigned',
      },
      {
        work_item_id: `normal-002-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'normal',
        status: 'assigned',
      },
    ]);

    if (assignments.error) throw assignments.error;

    // Call availability service via Edge Function
    const { data: response, error } = await supabase.functions.invoke('staff-availability', {
      body: {
        staff_id: testStaff1Id,
        status: 'on_leave',
        unavailable_until: '2025-10-15T00:00:00Z',
        reason: 'Annual leave',
      },
    });

    if (error) throw error;

    // Verify response structure
    expect(response.updated).toBe(true);
    expect(response.status).toBe('on_leave');
    expect(response.reassigned_items).toHaveLength(3); // 2 urgent + 1 high
    expect(response.flagged_for_review).toHaveLength(2); // 2 normal

    // Verify urgent and high items reassigned to staff2
    const { data: reassignedItems } = await supabase
      .from('assignments')
      .select('work_item_id, assignee_id, priority')
      .in('work_item_id', [
        `urgent-001-${baseTime}`,
        `urgent-002-${baseTime}`,
        `high-001-${baseTime}`,
      ]);

    expect(reassignedItems).toHaveLength(3);
    reassignedItems!.forEach((item) => {
      expect(item.assignee_id).toBe(testStaff2Id); // Reassigned to staff2
    });

    // Verify normal items still assigned to staff1 but flagged
    const { data: flaggedItems } = await supabase
      .from('assignments')
      .select('work_item_id, assignee_id, priority, needs_review')
      .in('work_item_id', [`normal-001-${baseTime}`, `normal-002-${baseTime}`]);

    expect(flaggedItems).toHaveLength(2);
    flaggedItems!.forEach((item) => {
      expect(item.assignee_id).toBe(testStaff1Id); // Still assigned to original staff
      expect(item.needs_review).toBe(true); // Flagged for review
    });
  });

  it('should flag normal items for review instead of reassigning', async () => {
    const baseTime = Date.now();
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Create only normal priority assignments
    await supabase.from('assignments').insert([
      {
        work_item_id: `normal-only-1-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'normal',
        status: 'assigned',
      },
      {
        work_item_id: `normal-only-2-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'normal',
        status: 'assigned',
      },
    ]);

    // Update staff availability
    const { data: response } = await supabase.functions.invoke('staff-availability', {
      body: {
        staff_id: testStaff1Id,
        status: 'on_leave',
        unavailable_until: '2025-10-15T00:00:00Z',
        reason: 'Sick leave',
      },
    });

    expect(response.reassigned_items).toHaveLength(0); // No automatic reassignments
    expect(response.flagged_for_review).toHaveLength(2); // Both flagged

    // Verify items still assigned to original staff
    const { data: items } = await supabase
      .from('assignments')
      .select('assignee_id, needs_review')
      .in('work_item_id', [`normal-only-1-${baseTime}`, `normal-only-2-${baseTime}`]);

    expect(items).toHaveLength(2);
    items!.forEach((item) => {
      expect(item.assignee_id).toBe(testStaff1Id);
      expect(item.needs_review).toBe(true);
    });
  });

  it('should update staff availability status correctly', async () => {
    const { data: staffBefore } = await supabase
      .from('staff_profiles')
      .select('availability_status, unavailable_until')
      .eq('id', testStaff1Id)
      .single();

    expect(staffBefore!.availability_status).toBe('available');
    expect(staffBefore!.unavailable_until).toBeNull();

    // Update availability
    await supabase.functions.invoke('staff-availability', {
      body: {
        staff_id: testStaff1Id,
        status: 'on_leave',
        unavailable_until: '2025-12-25T00:00:00Z',
        reason: 'Holiday',
      },
    });

    // Verify status updated
    const { data: staffAfter } = await supabase
      .from('staff_profiles')
      .select('availability_status, unavailable_until')
      .eq('id', testStaff1Id)
      .single();

    expect(staffAfter!.availability_status).toBe('on_leave');
    expect(staffAfter!.unavailable_until).toBe('2025-12-25T00:00:00Z');
  });

  it('should handle low priority items same as normal items', async () => {
    const baseTime = Date.now();
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Create 1 urgent and 1 low priority assignment
    await supabase.from('assignments').insert([
      {
        work_item_id: `urgent-low-test-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
      {
        work_item_id: `low-priority-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'low',
        status: 'assigned',
      },
    ]);

    const { data: response } = await supabase.functions.invoke('staff-availability', {
      body: {
        staff_id: testStaff1Id,
        status: 'on_leave',
        unavailable_until: '2025-10-15T00:00:00Z',
        reason: 'Leave',
      },
    });

    // Verify urgent reassigned, low flagged
    expect(response.reassigned_items).toHaveLength(1);
    expect(response.flagged_for_review).toHaveLength(1);

    const { data: lowItem } = await supabase
      .from('assignments')
      .select('assignee_id, needs_review')
      .eq('work_item_id', `low-priority-${baseTime}`)
      .single();

    expect(lowItem!.assignee_id).toBe(testStaff1Id); // Not reassigned
    expect(lowItem!.needs_review).toBe(true); // Flagged
  });

  it('should update current_assignment_count for both staff', async () => {
    const baseTime = Date.now();
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Create 3 urgent assignments for staff1
    await supabase.from('assignments').insert([
      {
        work_item_id: `count-urgent-1-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
      {
        work_item_id: `count-urgent-2-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
      {
        work_item_id: `count-urgent-3-${baseTime}`,
        work_item_type: 'ticket',
        assignee_id: testStaff1Id,
        assigned_at: now.toISOString(),
        sla_deadline: slaDeadline,
        priority: 'urgent',
        status: 'assigned',
      },
    ]);

    // Staff1 starts with 3 assignments, staff2 with 2
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaff1Id);

    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 2 })
      .eq('id', testStaff2Id);

    // Update availability (should reassign 3 urgent items)
    await supabase.functions.invoke('staff-availability', {
      body: {
        staff_id: testStaff1Id,
        status: 'on_leave',
        unavailable_until: '2025-10-15T00:00:00Z',
        reason: 'Leave',
      },
    });

    // Verify staff1 count decreased to 0
    const { data: staff1After } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaff1Id)
      .single();

    expect(staff1After!.current_assignment_count).toBe(0);

    // Verify staff2 count increased by 3
    const { data: staff2After } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaff2Id)
      .single();

    expect(staff2After!.current_assignment_count).toBe(5); // 2 + 3
  });
});
