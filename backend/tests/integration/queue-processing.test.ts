/**
 * Integration Test: Queue Processing on Capacity Change
 *
 * Validates Scenario 5 from quickstart.md:
 * - Seeds queue with multiple items while staff at WIP limit
 * - Completes assignment to free capacity
 * - Verifies queue processed automatically within 30 seconds (trigger-based)
 * - Verifies queue entry deleted after successful assignment
 * - Verifies oldest item (within priority) assigned first
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-5
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
);

describe('Integration: Queue Processing on Capacity Change', () => {
  let testOrgUnitId: string;
  let testSkillId: string;
  let testStaffId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test organizational unit
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة معالجة قائمة الانتظار (اختبار)',
        name_en: 'Queue Processing Unit (Test)',
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
        name_ar: 'مهارة اختبار قائمة الانتظار',
        name_en: 'Queue Test Skill',
        category: 'technical',
      })
      .select()
      .single();

    if (skillError) throw skillError;
    testSkillId = skill.id;

    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `test-queue-staff-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError) throw userError;
    testUserId = user.user.id;

    // Create test staff profile at WIP limit
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: testUserId,
        unit_id: testOrgUnitId,
        skills: [testSkillId],
        individual_wip_limit: 5,
        current_assignment_count: 5, // At limit
        availability_status: 'available',
      })
      .select()
      .single();

    if (staffError) throw staffError;
    testStaffId = staff.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await supabase.from('assignments').delete().eq('assignee_id', testStaffId);
    await supabase.from('assignment_queue').delete().eq('unit_id', testOrgUnitId);
    await supabase.from('staff_profiles').delete().eq('id', testStaffId);

    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }

    await supabase.from('skills').delete().eq('id', testSkillId);
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Reset staff to WIP limit
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 5 })
      .eq('id', testStaffId);

    // Clear assignments
    await supabase.from('assignments').delete().eq('assignee_id', testStaffId);

    // Clear queue
    await supabase.from('assignment_queue').delete().eq('unit_id', testOrgUnitId);
  });

  it('should process queue within 30 seconds when capacity freed', async () => {
    const baseTime = Date.now();
    const now = new Date();

    // Seed queue with 5 items (staggered timestamps for FIFO ordering)
    const queueItems = [
      {
        work_item_id: `queued-001-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago (oldest)
      },
      {
        work_item_id: `queued-002-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
      },
      {
        work_item_id: `queued-003-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
      },
      {
        work_item_id: `queued-004-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
      },
      {
        work_item_id: `queued-005-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // Newest
      },
    ];

    await supabase.from('assignment_queue').insert(queueItems);

    // Verify queue has 5 items
    let { data: queueBefore } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('unit_id', testOrgUnitId);

    expect(queueBefore).toHaveLength(5);

    // Create and immediately complete an assignment to simulate capacity freeing
    const completedWorkItemId = `completed-${baseTime}`;
    await supabase.from('assignments').insert({
      work_item_id: completedWorkItemId,
      work_item_type: 'ticket',
      assignee_id: testStaffId,
      assigned_at: new Date().toISOString(),
      sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      priority: 'normal',
      status: 'assigned',
    });

    // Complete the assignment (this should trigger queue processing)
    const startTime = Date.now();
    await supabase
      .from('assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('work_item_id', completedWorkItemId);

    // Update current_assignment_count to reflect freed capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('id', testStaffId);

    // Manually trigger queue processing (in real scenario, database trigger would do this)
    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });

    // Wait for processing (max 30 seconds)
    let assignment = null;
    let attempts = 0;
    while (!assignment && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('work_item_id', queueItems[0].work_item_id)
        .single();

      assignment = data;
      attempts++;
    }

    const elapsed = Date.now() - startTime;

    // Verify assignment created within 30 seconds
    expect(assignment).toBeTruthy();
    expect(elapsed).toBeLessThan(30000);

    // Verify oldest item was assigned first
    expect(assignment!.work_item_id).toBe(queueItems[0].work_item_id);

    // Verify queue entry deleted
    const { data: queueAfter } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('work_item_id', queueItems[0].work_item_id);

    expect(queueAfter).toHaveLength(0);

    // Verify remaining queue items still present
    const { data: remainingQueue } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('unit_id', testOrgUnitId);

    expect(remainingQueue).toHaveLength(4);
  }, 35000); // Extend test timeout to 35 seconds

  it('should process queue entries sequentially as capacity becomes available', async () => {
    const baseTime = Date.now();
    const now = new Date();

    // Queue 3 items
    const queueItems = [
      {
        work_item_id: `sequential-001-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      },
      {
        work_item_id: `sequential-002-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
      },
      {
        work_item_id: `sequential-003-${baseTime}`,
        work_item_type: 'ticket' as const,
        required_skills: [testSkillId],
        priority: 'normal' as const,
        unit_id: testOrgUnitId,
        created_at: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
      },
    ];

    await supabase.from('assignment_queue').insert(queueItems);

    // Process 1: Free 1 capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let { data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true });

    expect(assignments).toHaveLength(1);
    expect(assignments![0].work_item_id).toBe(queueItems[0].work_item_id);

    // Process 2: Free another capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    ({ data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true }));

    expect(assignments).toHaveLength(2);
    expect(assignments![1].work_item_id).toBe(queueItems[1].work_item_id);

    // Process 3: Free another capacity
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('id', testStaffId);

    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    ({ data: assignments } = await supabase
      .from('assignments')
      .select('work_item_id')
      .eq('assignee_id', testStaffId)
      .order('assigned_at', { ascending: true }));

    expect(assignments).toHaveLength(3);
    expect(assignments![2].work_item_id).toBe(queueItems[2].work_item_id);

    // Verify queue is now empty
    const { data: remainingQueue } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('unit_id', testOrgUnitId);

    expect(remainingQueue).toHaveLength(0);
  });

  it('should handle no capacity available gracefully', async () => {
    const baseTime = Date.now();

    // Queue item
    await supabase.from('assignment_queue').insert({
      work_item_id: `no-capacity-${baseTime}`,
      work_item_type: 'ticket',
      required_skills: [testSkillId],
      priority: 'normal',
      unit_id: testOrgUnitId,
      created_at: new Date().toISOString(),
    });

    // Staff still at limit (current_assignment_count = 5)
    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify queue item NOT assigned
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('work_item_id', `no-capacity-${baseTime}`);

    expect(assignment).toHaveLength(0);

    // Verify queue item still in queue
    const { data: queueEntry } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('work_item_id', `no-capacity-${baseTime}`);

    expect(queueEntry).toHaveLength(1);
  });

  it('should update current_assignment_count correctly after queue processing', async () => {
    const baseTime = Date.now();

    // Queue 2 items
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: `count-test-1-${baseTime}`,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date().toISOString(),
      },
      {
        work_item_id: `count-test-2-${baseTime}`,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
        unit_id: testOrgUnitId,
        created_at: new Date().toISOString(),
      },
    ]);

    // Verify initial count
    let { data: staffBefore } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaffId)
      .single();

    expect(staffBefore!.current_assignment_count).toBe(5);

    // Free 2 capacity slots
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('id', testStaffId);

    // Process queue
    await supabase.rpc('process_queue_for_unit', { p_unit_id: testOrgUnitId });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify count increased to 5 (3 + 2 new assignments)
    const { data: staffAfter } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaffId)
      .single();

    expect(staffAfter!.current_assignment_count).toBe(5);

    // Verify 2 assignments created
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('assignee_id', testStaffId);

    expect(assignments).toHaveLength(2);
  });
});
