/**
 * Integration Test: Priority-Based Assignment
 *
 * Validates Scenario 4 from quickstart.md:
 * - Queues multiple work items with different priorities (urgent, high, normal)
 * - Frees capacity by completing assignments
 * - Verifies urgent items assigned before high items
 * - Verifies high items assigned before normal items
 * - Verifies FIFO ordering within the same priority level
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-4
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Integration: Priority-Based Assignment', () => {
  let testOrgUnitId: string;
  let testSkillId: string;
  let testStaffId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test organizational unit
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة الأولويات الاختبارية',
        name_en: 'Test Priority Unit',
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
        name_ar: 'مهارة الترجمة (اختبار)',
        name_en: 'Translation Skill (Test)',
        category: 'languages',
      })
      .select()
      .single();

    if (skillError) throw skillError;
    testSkillId = skill.id;

    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `test-priority-staff-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError) throw userError;
    testUserId = user.user.id;

    // Create test staff profile with capacity for 1 item
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUserId,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 5,
        current_assignment_count: 4, // 1 slot available
        availability_status: 'available',
      })
      .select()
      .single();

    if (staffError) throw staffError;
    testStaffId = staff.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    // Delete assignments first (foreign key to staff_profiles)
    await supabase.from('assignments').delete().eq('assignee_id', testStaffId);

    // Delete queue entries
    await supabase.from('assignment_queue').delete().eq('unit_id', testOrgUnitId);

    // Delete staff profile
    await supabase.from('staff_profiles').delete().eq('id', testStaffId);

    // Delete auth user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }

    // Delete skill
    await supabase.from('skills').delete().eq('id', testSkillId);

    // Delete org unit
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Reset staff capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('id', testStaffId);

    // Clear any existing assignments
    await supabase.from('assignments').delete().eq('assignee_id', testStaffId);

    // Clear queue
    await supabase.from('assignment_queue').delete().eq('unit_id', testOrgUnitId);
  });

  it('should assign urgent items before high and normal items', async () => {
    const baseTime = Date.now();

    // Queue 4 items with different priorities and creation times
    const normalTicket1 = `ticket-normal-1-${baseTime}`;
    const normalTicket2 = `ticket-normal-2-${baseTime}`;
    const urgentTicket = `ticket-urgent-1-${baseTime}`;
    const highTicket = `ticket-high-1-${baseTime}`;

    // Insert queue items with staggered timestamps
    const now = new Date();
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: normalTicket1,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
      },
      {
        work_item_id: normalTicket2,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago (older)
      },
      {
        work_item_id: urgentTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'urgent',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 min ago
      },
      {
        work_item_id: highTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'high',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(), // 8 min ago
      },
    ]);

    // Free capacity by updating current_assignment_count
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 }) // 2 slots available
      .eq('id', testStaffId);

    // Trigger queue processing
    const { error: processError } = await supabase.rpc('process_queue_for_unit', {
      p_unit_id: testOrgUnitId,
    });

    if (processError) throw processError;

    // Wait a bit for processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify urgent item was assigned first
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('work_item_id, priority, assigned_at')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true });

    if (assignmentError) throw assignmentError;

    expect(assignments).toHaveLength(1); // Only 1 slot was freed
    expect(assignments![0].work_item_id).toBe(urgentTicket);
    expect(assignments![0].priority).toBe('urgent');
  });

  it('should assign high items before normal items', async () => {
    const baseTime = Date.now();

    const normalTicket = `ticket-normal-${baseTime}`;
    const highTicket = `ticket-high-${baseTime}`;

    const now = new Date();
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: normalTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // Older
      },
      {
        work_item_id: highTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'high',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // Newer
      },
    ]);

    // Free capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    // Process queue
    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify high priority assigned first despite being newer
    const { data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id, priority')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true });

    expect(assignments).toHaveLength(1);
    expect(assignments![0].work_item_id).toBe(highTicket);
    expect(assignments![0].priority).toBe('high');
  });

  it('should respect FIFO within same priority level', async () => {
    const baseTime = Date.now();

    const normalTicket1 = `ticket-normal-1-${baseTime}`;
    const normalTicket2 = `ticket-normal-2-${baseTime}`;
    const normalTicket3 = `ticket-normal-3-${baseTime}`;

    const now = new Date();
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: normalTicket1,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // Middle
      },
      {
        work_item_id: normalTicket2,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // Oldest
      },
      {
        work_item_id: normalTicket3,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // Newest
      },
    ]);

    // Free capacity for 2 assignments
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 2 })
      .eq('id', testStaffId);

    // Process queue
    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify oldest normal item assigned first, then second oldest
    const { data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id, assigned_at')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true });

    expect(assignments).toHaveLength(2);
    expect(assignments![0].work_item_id).toBe(normalTicket2); // Oldest
    expect(assignments![1].work_item_id).toBe(normalTicket1); // Second oldest
  });

  it('should process queue multiple times as capacity becomes available', async () => {
    const baseTime = Date.now();

    const urgentTicket = `ticket-urgent-${baseTime}`;
    const highTicket = `ticket-high-${baseTime}`;
    const normalTicket = `ticket-normal-${baseTime}`;

    const now = new Date();
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: urgentTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'urgent',
        unit_id: testOrgUnitId,
        created_at: now.toISOString(),
      },
      {
        work_item_id: highTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'high',
        unit_id: testOrgUnitId,
        created_at: now.toISOString(),
      },
      {
        work_item_id: normalTicket,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: now.toISOString(),
      },
    ]);

    // Step 1: Free 1 capacity slot
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify urgent assigned
    let { data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId);

    expect(assignments).toHaveLength(1);
    expect(assignments![0].work_item_id).toBe(urgentTicket);

    // Step 2: Free another capacity slot
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify high assigned next
    ({ data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true }));

    expect(assignments).toHaveLength(2);
    expect(assignments![1].work_item_id).toBe(highTicket);

    // Step 3: Free another capacity slot
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify normal assigned last
    ({ data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true }));

    expect(assignments).toHaveLength(3);
    expect(assignments![2].work_item_id).toBe(normalTicket);
  });

  it('should delete queue entry after successful assignment', async () => {
    const baseTime = Date.now();
    const urgentTicket = `ticket-urgent-${baseTime}`;

    await supabase.from('assignment_queue').insert({
      work_item_id: urgentTicket,
      work_item_type: 'ticket',
      required_skills: [testSkillId],
      priority: 'urgent',
      unit_id: testOrgUnitId,
      created_at: new Date().toISOString(),
    });

    // Verify queue entry exists
    let { data: queueBefore } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('work_item_id', urgentTicket);

    expect(queueBefore).toHaveLength(1);

    // Free capacity and process
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify assignment created
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('work_item_id', urgentTicket)
      .single();

    expect(assignment).toBeTruthy();

    // Verify queue entry deleted
    const { data: queueAfter } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('work_item_id', urgentTicket);

    expect(queueAfter).toHaveLength(0);
  });
});
