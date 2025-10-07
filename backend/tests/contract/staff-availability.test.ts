/**
 * Contract Test: PUT /staff/availability
 *
 * Validates:
 * - Success: Returns 200 with AvailabilityUpdateResponse
 * - On "on_leave": Reassigns urgent/high items, flags normal/low items
 * - Permission: Users update own, supervisors update team, admins update any
 * - Validation: Returns 400 for invalid status or unavailable_until
 *
 * Dependencies: T004 (staff_profiles table), T007 (assignments table)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('PUT /staff/availability', () => {
  let supabase: SupabaseClient;
  let staffClient: SupabaseClient;
  let supervisorClient: SupabaseClient;
  let adminClient: SupabaseClient;

  let testUnitId: string;
  let testStaffId: string;
  let testSupervisorId: string;
  let testAdminId: string;
  let otherStaffId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test unit
    const { data: unit } = await supabase
      .from('organizational_units')
      .insert({ name_ar: 'وحدة التوفر', name_en: 'Availability Unit', unit_wip_limit: 20 })
      .select()
      .single();

    testUnitId = unit!.id;

    // Create test staff
    const { data: staff } = await supabase
      .from('staff_profiles')
      .insert([
        {
          user_id: 'availability-staff-id',
          unit_id: testUnitId,
          skills: ['skill-test'],
          individual_wip_limit: 5,
          role: 'staff'
        },
        {
          user_id: 'availability-supervisor-id',
          unit_id: testUnitId,
          skills: ['skill-test'],
          individual_wip_limit: 8,
          role: 'supervisor'
        },
        {
          user_id: 'availability-admin-id',
          unit_id: testUnitId,
          skills: ['skill-test'],
          individual_wip_limit: 10,
          role: 'admin'
        },
        {
          user_id: 'availability-other-staff-id',
          unit_id: testUnitId,
          skills: ['skill-test'],
          individual_wip_limit: 5,
          role: 'staff'
        }
      ])
      .select();

    testStaffId = staff![0].user_id;
    testSupervisorId = staff![1].user_id;
    testAdminId = staff![2].user_id;
    otherStaffId = staff![3].user_id;

    staffClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    supervisorClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    // Create test assignments for reassignment testing
    const now = new Date();
    await supabase.from('assignments').insert([
      {
        work_item_id: 'avail-urgent-1',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        assigned_at: now.toISOString(),
        sla_deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        priority: 'urgent',
        status: 'assigned'
      },
      {
        work_item_id: 'avail-urgent-2',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        assigned_at: now.toISOString(),
        sla_deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        priority: 'urgent',
        status: 'in_progress'
      },
      {
        work_item_id: 'avail-high-1',
        work_item_type: 'dossier',
        assignee_id: testStaffId,
        assigned_at: now.toISOString(),
        sla_deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'assigned'
      },
      {
        work_item_id: 'avail-normal-1',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        assigned_at: now.toISOString(),
        sla_deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        status: 'assigned'
      },
      {
        work_item_id: 'avail-normal-2',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        assigned_at: now.toISOString(),
        sla_deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        status: 'in_progress'
      }
    ]);
  });

  afterAll(async () => {
    await supabase.from('assignments').delete().ilike('work_item_id', 'avail-%');
    await supabase.from('staff_profiles').delete().ilike('user_id', 'availability-%');
    await supabase.from('organizational_units').delete().eq('id', testUnitId);
  });

  it('should return 200 when user updates their own availability', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'unavailable',
        unavailable_until: '2025-10-05T00:00:00Z',
        reason: 'Medical appointment'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      updated: true,
      staff_id: testStaffId,
      status: 'unavailable',
      unavailable_until: '2025-10-05T00:00:00Z',
      reason: 'Medical appointment'
    });

    // Verify database update
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select()
      .eq('user_id', testStaffId)
      .single();

    expect(staff?.availability_status).toBe('unavailable');
    expect(staff?.unavailable_until).toBe('2025-10-05T00:00:00Z');
    expect(staff?.unavailable_reason).toBe('Medical appointment');

    // Reset
    await supabase
      .from('staff_profiles')
      .update({
        availability_status: 'available',
        unavailable_until: null,
        unavailable_reason: null
      })
      .eq('user_id', testStaffId);
  });

  it('should reassign urgent and high items when status changes to on_leave', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'on_leave',
        unavailable_until: '2025-10-15T00:00:00Z',
        reason: 'Annual leave'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      updated: true,
      reassigned_items: expect.arrayContaining([
        expect.objectContaining({ work_item_id: 'avail-urgent-1', priority: 'urgent' }),
        expect.objectContaining({ work_item_id: 'avail-urgent-2', priority: 'urgent' }),
        expect.objectContaining({ work_item_id: 'avail-high-1', priority: 'high' })
      ]),
      flagged_for_review: expect.arrayContaining([
        expect.objectContaining({ work_item_id: 'avail-normal-1', priority: 'normal' }),
        expect.objectContaining({ work_item_id: 'avail-normal-2', priority: 'normal' })
      ])
    });

    // Verify urgent/high items reassigned
    const { data: urgentItems } = await supabase
      .from('assignments')
      .select()
      .in('work_item_id', ['avail-urgent-1', 'avail-urgent-2', 'avail-high-1']);

    urgentItems!.forEach(item => {
      expect(item.assignee_id).not.toBe(testStaffId); // Reassigned to someone else
      expect([otherStaffId, testSupervisorId, testAdminId]).toContain(item.assignee_id);
    });

    // Verify normal items flagged but not reassigned
    const { data: normalItems } = await supabase
      .from('assignments')
      .select()
      .in('work_item_id', ['avail-normal-1', 'avail-normal-2']);

    normalItems!.forEach(item => {
      expect(item.assignee_id).toBe(testStaffId); // Still assigned to original staff
      expect(item.needs_review).toBe(true); // Flagged for review
    });
  });

  it('should send notification to supervisor about flagged items', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'on_leave',
        unavailable_until: '2025-10-20T00:00:00Z',
        reason: 'Sick leave'
      }
    });

    expect(response.error).toBeNull();

    // Verify supervisor notification
    const { data: notifications } = await supabase
      .from('notifications')
      .select()
      .eq('user_id', testSupervisorId)
      .eq('type', 'staff_leave_items_for_review');

    expect(notifications).toHaveLength(1);
    expect(notifications![0].message_en).toContain('items need review');
    expect(notifications![0].metadata).toMatchObject({
      staff_id: testStaffId,
      flagged_items: expect.any(Array)
    });
  });

  it('should allow supervisor to update team member availability', async () => {
    const response = await supervisorClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        staff_id: testStaffId,
        status: 'unavailable',
        reason: 'Supervisor override - training session'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      updated: true,
      staff_id: testStaffId,
      status: 'unavailable'
    });
  });

  it('should allow admin to update any staff availability', async () => {
    const response = await adminClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        staff_id: testStaffId,
        status: 'on_leave',
        unavailable_until: '2025-11-01T00:00:00Z',
        reason: 'Admin override - extended leave'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data.updated).toBe(true);
  });

  it('should return 403 when staff tries to update other staff availability', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        staff_id: otherStaffId,
        status: 'unavailable',
        reason: 'Trying to update colleague'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(403);
    expect(response.error.message).toContain('Insufficient permissions');
  });

  it('should return 400 when status is invalid', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'invalid_status',
        reason: 'Testing invalid status'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('Invalid availability status');
  });

  it('should return 400 when unavailable_until is in the past', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'on_leave',
        unavailable_until: '2020-01-01T00:00:00Z', // Past date
        reason: 'Testing past date'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('unavailable_until must be in the future');
  });

  it('should clear unavailable_until when status changes to available', async () => {
    // First set as unavailable
    await supabase
      .from('staff_profiles')
      .update({
        availability_status: 'unavailable',
        unavailable_until: '2025-10-10T00:00:00Z',
        unavailable_reason: 'Test'
      })
      .eq('user_id', testStaffId);

    // Then set back to available
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'available'
      }
    });

    expect(response.error).toBeNull();

    // Verify cleared
    const { data: staff } = await supabase
      .from('staff_profiles')
      .select()
      .eq('user_id', testStaffId)
      .single();

    expect(staff?.availability_status).toBe('available');
    expect(staff?.unavailable_until).toBeNull();
    expect(staff?.unavailable_reason).toBeNull();
  });

  it('should set availability_source to manual when user updates own', async () => {
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'unavailable',
        reason: 'Self-service update'
      }
    });

    expect(response.error).toBeNull();

    const { data: staff } = await supabase
      .from('staff_profiles')
      .select()
      .eq('user_id', testStaffId)
      .single();

    expect(staff?.availability_source).toBe('manual');
  });

  it('should set availability_source to supervisor_override when supervisor updates', async () => {
    const response = await supervisorClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        staff_id: testStaffId,
        status: 'on_leave',
        reason: 'Supervisor-initiated leave'
      }
    });

    expect(response.error).toBeNull();

    const { data: staff } = await supabase
      .from('staff_profiles')
      .select()
      .eq('user_id', testStaffId)
      .single();

    expect(staff?.availability_source).toBe('supervisor_override');
  });

  it('should not reassign items when status changes from on_leave to available', async () => {
    // Set as on_leave first
    await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'on_leave',
        reason: 'Testing return to available'
      }
    });

    // Change back to available
    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'available'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data.reassigned_items).toBeUndefined(); // No reassignments when returning
    expect(response.data.flagged_for_review).toBeUndefined();
  });

  it('should handle reassignment when no other staff available', async () => {
    // Set all other staff as unavailable
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'on_leave' })
      .in('user_id', [otherStaffId, testSupervisorId]);

    const response = await staffClient.functions.invoke('staff-availability', {
      method: 'PUT',
      body: {
        status: 'on_leave',
        reason: 'Testing no capacity scenario'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      updated: true,
      reassignment_warning: expect.stringContaining('No available capacity'),
      flagged_for_review: expect.arrayContaining([
        expect.objectContaining({ priority: 'urgent' }), // Even urgent items flagged when no capacity
        expect.objectContaining({ priority: 'high' })
      ])
    });

    // Reset
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'available' })
      .in('user_id', [otherStaffId, testSupervisorId]);
  });
});
