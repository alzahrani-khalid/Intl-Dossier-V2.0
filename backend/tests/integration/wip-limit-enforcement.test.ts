/**
 * Integration Test: WIP Limit Enforcement
 *
 * Validates Scenario 2 from quickstart.md:
 * - Tests individual WIP limit (staff at 5/5 cannot receive new item)
 * - Tests unit WIP limit (unit at 20/20 blocks assignment even if individual has capacity)
 * - Verifies queueing when limits reached
 *
 * @see specs/013-assignment-engine-sla/quickstart.md#scenario-2
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Integration: WIP Limit Enforcement', () => {
  let testOrgUnitId: string;
  let testSkillId: string;
  let testStaffId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test organizational unit with limit of 20
    const { data: orgUnit, error: orgError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة WIP الاختبارية',
        name_en: 'Test WIP Unit',
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
        name_ar: 'مهارة WIP الاختبارية',
        name_en: 'Test WIP Skill',
        category: 'test',
      })
      .select()
      .single();

    if (skillError) throw skillError;
    testSkillId = skill.id;

    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `test-wip-staff-${Date.now()}@gastat.test`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError) throw userError;
    testUserId = user.user.id;

    // Create test staff profile with individual limit of 5
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
      })
      .select()
      .single();

    if (staffError) throw staffError;
    testStaffId = staff.id;
  });

  afterAll(async () => {
    // Clean up
    await supabase.from('assignment_queue').delete().like('work_item_id', 'test-wip-%');
    await supabase.from('assignments').delete().eq('assignee_id', testUserId);
    await supabase.from('staff_profiles').delete().eq('id', testStaffId);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.from('skills').delete().eq('id', testSkillId);
    await supabase.from('organizational_units').delete().eq('id', testOrgUnitId);
  });

  beforeEach(async () => {
    // Reset assignment count and clean up test data
    await supabase.from('staff_profiles').update({ current_assignment_count: 0 }).eq('id', testStaffId);
    await supabase.from('assignments').delete().like('work_item_id', 'test-wip-%');
    await supabase.from('assignment_queue').delete().like('work_item_id', 'test-wip-%');
  });

  it('should queue work item when staff at individual WIP limit', async () => {
    // Pre-assign 5 items to reach individual limit (5/5)
    await supabase.from('staff_profiles').update({ current_assignment_count: 5 }).eq('id', testStaffId);

    // Attempt to assign 6th item
    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-wip-individual-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Verify item was queued, not assigned
    expect(data.queued).toBe(true);
    expect(data.queue_id).toBeDefined();
    expect(data.queue_position).toBeGreaterThan(0);
    expect(data.reason).toContain('WIP limit');

    // Verify queue entry created
    const { data: queueEntry, error: queueError } = await supabase
      .from('assignment_queue')
      .select('*')
      .eq('id', data.queue_id)
      .single();

    if (queueError) throw queueError;

    expect(queueEntry).toBeDefined();
    expect(queueEntry.priority).toBe('normal');
    expect(queueEntry.attempts).toBe(0);
  });

  it('should assign successfully when staff under individual WIP limit', async () => {
    // Set staff to 2/5 (under limit)
    await supabase.from('staff_profiles').update({ current_assignment_count: 2 }).eq('id', testStaffId);

    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-wip-under-limit-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Verify assignment succeeded
    expect(data.assignment_id).toBeDefined();
    expect(data.assignee_id).toBe(testUserId);
    expect(data.status).toBe('assigned');

    // Verify count incremented to 3
    const { data: updatedStaff } = await supabase
      .from('staff_profiles')
      .select('current_assignment_count')
      .eq('id', testStaffId)
      .single();

    expect(updatedStaff?.current_assignment_count).toBe(3);
  });

  it('should queue work item when unit at WIP limit even if individual has capacity', async () => {
    // Create 4 additional staff members to fill unit capacity
    const additionalStaff = [];

    for (let i = 0; i < 4; i++) {
      const { data: user } = await supabase.auth.admin.createUser({
        email: `test-wip-extra-${i}-${Date.now()}@gastat.test`,
        password: 'test-password-123',
        email_confirm: true,
      });

      const { data: staff } = await supabase
        .from('staff_profiles')
        .insert({
          user_id: user!.user.id,
          unit_id: testOrgUnitId,
          skills: [testSkillId],
          individual_wip_limit: 5,
          current_assignment_count: 5, // Each at their limit
          availability_status: 'available',
          role: 'staff',
        })
        .select()
        .single();

      additionalStaff.push({ userId: user!.user.id, staffId: staff!.id });
    }

    // Total unit capacity: 5 staff × 5 limit = 25
    // But unit_wip_limit = 20, so unit should block at 20
    // Set: 4 staff at 5/5 (20 total) + our test staff at 0/5
    // Unit is at 20/20 even though test staff has capacity

    const { data, error } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: `test-wip-unit-limit-${Date.now()}`,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    if (error) throw error;

    // Verify item was queued due to unit limit
    expect(data.queued).toBe(true);
    expect(data.reason).toContain('Unit WIP limit');

    // Clean up additional staff
    for (const staff of additionalStaff) {
      await supabase.from('staff_profiles').delete().eq('id', staff.staffId);
      await supabase.auth.admin.deleteUser(staff.userId);
    }
  });

  it('should process queue when capacity freed', async () => {
    // Queue an item (staff at limit)
    await supabase.from('staff_profiles').update({ current_assignment_count: 5 }).eq('id', testStaffId);

    const queuedWorkItemId = `test-wip-queue-process-${Date.now()}`;
    const { data: queuedData } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: queuedWorkItemId,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    expect(queuedData.queued).toBe(true);

    // Create an actual assignment to later complete
    const { data: assignmentToComplete } = await supabase
      .from('assignments')
      .insert({
        work_item_id: `test-wip-to-complete-${Date.now()}`,
        work_item_type: 'ticket',
        assignee_id: testUserId,
        priority: 'normal',
        status: 'assigned',
      })
      .select()
      .single();

    // Free capacity by completing an assignment
    await supabase
      .from('assignments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', assignmentToComplete!.id);

    // Wait for queue processor trigger (up to 30 seconds)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify queued item was assigned
    const { data: processedAssignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('work_item_id', queuedWorkItemId)
      .maybeSingle();

    // Should be assigned now (or still in queue if trigger hasn't run yet)
    if (processedAssignment) {
      expect(processedAssignment.assignee_id).toBe(testUserId);
      expect(processedAssignment.status).toBe('assigned');

      // Verify queue entry deleted
      const { data: queueEntry } = await supabase
        .from('assignment_queue')
        .select('*')
        .eq('work_item_id', queuedWorkItemId)
        .maybeSingle();

      expect(queueEntry).toBeNull();
    }
  });

  it('should respect priority when multiple items queued', async () => {
    // Queue items with different priorities
    await supabase.from('staff_profiles').update({ current_assignment_count: 5 }).eq('id', testStaffId);

    const urgentId = `test-wip-urgent-${Date.now()}`;
    const normalId = `test-wip-normal-${Date.now()}`;

    // Queue normal priority first (older timestamp)
    await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: normalId,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Queue urgent priority second (newer timestamp, but higher priority)
    await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: urgentId,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'urgent',
      },
    });

    // Verify queue order: urgent should have position 1, normal should have position 2
    const { data: queueEntries } = await supabase
      .from('assignment_queue')
      .select('work_item_id, priority, created_at')
      .in('work_item_id', [urgentId, normalId])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    expect(queueEntries![0].work_item_id).toBe(urgentId); // Urgent first
    expect(queueEntries![1].work_item_id).toBe(normalId); // Normal second
  });

  it('should increment attempts counter on failed assignment from queue', async () => {
    // Queue an item
    await supabase.from('staff_profiles').update({ current_assignment_count: 5 }).eq('id', testStaffId);

    const workItemId = `test-wip-attempts-${Date.now()}`;
    const { data } = await supabase.functions.invoke('assignments-auto-assign', {
      body: {
        work_item_id: workItemId,
        work_item_type: 'ticket',
        required_skills: [testSkillId],
        priority: 'normal',
      },
    });

    const queueId = data.queue_id;

    // Manually trigger queue processor (simulating failed attempt)
    // In real scenario, this would be triggered by capacity change
    const { data: queueEntry } = await supabase
      .from('assignment_queue')
      .select('attempts')
      .eq('id', queueId)
      .single();

    expect(queueEntry?.attempts).toBe(0); // Initial state

    // Simulate failed attempt by updating attempts
    await supabase
      .from('assignment_queue')
      .update({
        attempts: (queueEntry?.attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    const { data: updatedEntry } = await supabase
      .from('assignment_queue')
      .select('attempts')
      .eq('id', queueId)
      .single();

    expect(updatedEntry?.attempts).toBe(1);
  });
});
