/**
 * Contract Test: GET /assignments/my-assignments
 *
 * Validates:
 * - Returns 200 with MyAssignmentsResponse
 * - Includes SLA countdown (time_remaining_seconds)
 * - Filters: status, include_completed
 *
 * Dependencies: T007 (assignments table)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('GET /assignments/my-assignments', () => {
  let supabase: SupabaseClient;
  let userClient: SupabaseClient;

  let testUserId: string;
  let testUnitId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test unit
    const { data: unit } = await supabase
      .from('organizational_units')
      .insert({ name_ar: 'وحدة المهام', name_en: 'My Assignments Unit', unit_wip_limit: 20 })
      .select()
      .single();

    testUnitId = unit!.id;

    // Create test user
    const { data: staff } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: 'my-assignments-user-id',
        unit_id: testUnitId,
        skills: [],
        individual_wip_limit: 5,
        role: 'staff'
      })
      .select()
      .single();

    testUserId = staff!.user_id;

    userClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    // Create test assignments with different statuses and SLAs
    const now = new Date();
    await supabase.from('assignments').insert([
      {
        work_item_id: 'my-ticket-1',
        work_item_type: 'ticket',
        assignee_id: testUserId,
        assigned_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        sla_deadline: new Date(now.getTime() + 46 * 60 * 60 * 1000).toISOString(), // 46 hours from now
        priority: 'normal',
        status: 'assigned'
      },
      {
        work_item_id: 'my-dossier-1',
        work_item_type: 'dossier',
        assignee_id: testUserId,
        assigned_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        sla_deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now (warning threshold)
        priority: 'urgent',
        status: 'in_progress'
      },
      {
        work_item_id: 'my-ticket-2',
        work_item_type: 'ticket',
        assignee_id: testUserId,
        assigned_at: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
        sla_deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (breached)
        priority: 'normal',
        status: 'in_progress'
      },
      {
        work_item_id: 'my-ticket-3',
        work_item_type: 'ticket',
        assignee_id: testUserId,
        assigned_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sla_deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        status: 'completed',
        completed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
  });

  afterAll(async () => {
    await supabase.from('assignments').delete().ilike('work_item_id', 'my-%');
    await supabase.from('staff_profiles').delete().eq('user_id', testUserId);
    await supabase.from('organizational_units').delete().eq('id', testUnitId);
  });

  it('should return 200 with user assignments including SLA countdown', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      assignments: expect.any(Array),
      total_count: expect.any(Number)
    });

    const assignments = response.data.assignments;

    // Verify each assignment has required fields
    assignments.forEach((assignment: any) => {
      expect(assignment).toMatchObject({
        assignment_id: expect.any(String),
        work_item_id: expect.any(String),
        work_item_type: expect.any(String),
        assigned_at: expect.any(String),
        sla_deadline: expect.any(String),
        time_remaining_seconds: expect.any(Number),
        sla_status: expect.stringMatching(/ok|warning|breached/),
        priority: expect.any(String),
        status: expect.any(String)
      });
    });
  });

  it('should calculate time_remaining_seconds correctly', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();

    const normalAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-ticket-1'
    );

    expect(normalAssignment.time_remaining_seconds).toBeGreaterThan(0);
    expect(normalAssignment.time_remaining_seconds).toBeLessThan(48 * 60 * 60); // Less than 48 hours

    const breachedAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-ticket-2'
    );

    expect(breachedAssignment.time_remaining_seconds).toBeLessThan(0); // Negative = breached
  });

  it('should set sla_status based on time remaining', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();

    const okAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-ticket-1'
    );
    expect(okAssignment.sla_status).toBe('ok'); // <75% elapsed

    const warningAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-dossier-1'
    );
    expect(warningAssignment.sla_status).toBe('warning'); // 75-100% elapsed

    const breachedAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-ticket-2'
    );
    expect(breachedAssignment.sla_status).toBe('breached'); // >100%
  });

  it('should filter by status when status param provided', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET',
      body: { status: 'assigned' }
    });

    expect(response.error).toBeNull();
    expect(response.data.assignments.every((a: any) => a.status === 'assigned')).toBe(true);
    expect(response.data.assignments).toHaveLength(1);
    expect(response.data.assignments[0].work_item_id).toBe('my-ticket-1');
  });

  it('should filter multiple statuses when provided as array', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET',
      body: { status: ['assigned', 'in_progress'] }
    });

    expect(response.error).toBeNull();
    expect(response.data.assignments.every((a: any) =>
      a.status === 'assigned' || a.status === 'in_progress'
    )).toBe(true);
    expect(response.data.assignments).toHaveLength(3);
  });

  it('should exclude completed assignments by default', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data.assignments.every((a: any) => a.status !== 'completed')).toBe(true);
    expect(response.data.assignments.some((a: any) => a.work_item_id === 'my-ticket-3')).toBe(false);
  });

  it('should include completed assignments when include_completed=true', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET',
      body: { include_completed: true }
    });

    expect(response.error).toBeNull();
    expect(response.data.assignments.some((a: any) => a.status === 'completed')).toBe(true);
    expect(response.data.assignments.some((a: any) => a.work_item_id === 'my-ticket-3')).toBe(true);
    expect(response.data.total_count).toBe(4);
  });

  it('should sort by sla_deadline ASC (most urgent first)', async () => {
    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();

    const assignments = response.data.assignments;

    // First should be breached (most urgent)
    expect(assignments[0].sla_status).toBe('breached');

    // Last should have most time remaining
    const timeRemaining = assignments.map((a: any) => a.time_remaining_seconds);
    expect(timeRemaining[0]).toBeLessThan(timeRemaining[timeRemaining.length - 1]);
  });

  it('should include escalation status if assignment was escalated', async () => {
    // Create escalated assignment
    const now = new Date();
    await supabase.from('assignments').insert({
      work_item_id: 'my-escalated-1',
      work_item_type: 'ticket',
      assignee_id: testUserId,
      assigned_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      sla_deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'in_progress',
      escalated_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      escalation_recipient_id: 'supervisor-id'
    });

    const response = await userClient.functions.invoke('assignments-my-assignments', {
      method: 'GET',
      body: { include_completed: true }
    });

    expect(response.error).toBeNull();

    const escalatedAssignment = response.data.assignments.find(
      (a: any) => a.work_item_id === 'my-escalated-1'
    );

    expect(escalatedAssignment).toMatchObject({
      escalated: true,
      escalated_at: expect.any(String),
      escalation_recipient_id: 'supervisor-id'
    });

    // Cleanup
    await supabase.from('assignments').delete().eq('work_item_id', 'my-escalated-1');
  });

  it('should return 401 when unauthenticated', async () => {
    const anonClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const response = await anonClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(401);
    expect(response.error.message).toContain('Unauthorized');
  });

  it('should return empty array when user has no assignments', async () => {
    // Create new user with no assignments
    const { data: newUser } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: 'new-user-no-assignments',
        unit_id: testUnitId,
        skills: [],
        individual_wip_limit: 5,
        role: 'staff'
      })
      .select()
      .single();

    const newUserClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const response = await newUserClient.functions.invoke('assignments-my-assignments', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data.assignments).toEqual([]);
    expect(response.data.total_count).toBe(0);

    // Cleanup
    await supabase.from('staff_profiles').delete().eq('user_id', newUser!.user_id);
  });
});
