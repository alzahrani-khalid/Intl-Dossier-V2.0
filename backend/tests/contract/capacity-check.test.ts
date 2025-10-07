/**
 * Contract Test: GET /capacity/check
 *
 * Validates:
 * - Success: Returns 200 with CapacityResponse (individual or unit)
 * - Permission: Users can check own, supervisors check unit, admins check any
 * - Validation: Returns 400 if neither staff_id nor unit_id provided
 * - Returns 403 for unauthorized capacity checks
 *
 * Dependencies: T004 (staff_profiles table)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('GET /capacity/check', () => {
  let supabase: SupabaseClient;
  let staffClient: SupabaseClient;
  let supervisorClient: SupabaseClient;
  let adminClient: SupabaseClient;

  let testUnitId: string;
  let otherUnitId: string;
  let testStaffId: string;
  let testSupervisorId: string;
  let testAdminId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test units
    const { data: units } = await supabase
      .from('organizational_units')
      .insert([
        { name_ar: 'وحدة السعة', name_en: 'Capacity Unit', unit_wip_limit: 20 },
        { name_ar: 'وحدة أخرى', name_en: 'Other Unit', unit_wip_limit: 15 }
      ])
      .select();

    testUnitId = units![0].id;
    otherUnitId = units![1].id;

    // Create test staff
    const { data: staff } = await supabase
      .from('staff_profiles')
      .insert([
        {
          user_id: 'capacity-staff-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 5,
          current_assignment_count: 3,
          role: 'staff'
        },
        {
          user_id: 'capacity-supervisor-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 8,
          current_assignment_count: 2,
          role: 'supervisor'
        },
        {
          user_id: 'capacity-admin-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 10,
          current_assignment_count: 1,
          role: 'admin'
        },
        {
          user_id: 'capacity-other-staff-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 5,
          current_assignment_count: 4,
          role: 'staff'
        }
      ])
      .select();

    testStaffId = staff![0].user_id;
    testSupervisorId = staff![1].user_id;
    testAdminId = staff![2].user_id;

    staffClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    supervisorClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  });

  afterAll(async () => {
    await supabase.from('staff_profiles').delete().ilike('user_id', 'capacity-%');
    await supabase.from('organizational_units').delete().in('id', [testUnitId, otherUnitId]);
  });

  it('should return 200 with individual capacity when staff_id provided', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      type: 'individual',
      staff_id: testStaffId,
      current_count: 3,
      wip_limit: 5,
      available_capacity: 2,
      utilization_pct: 60.0,
      status: 'ok' // <75%
    });
  });

  it('should return 200 with unit capacity when unit_id provided', async () => {
    const response = await supervisorClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: testUnitId }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      type: 'unit',
      unit_id: testUnitId,
      total_staff: 4,
      current_count: 10, // 3 + 2 + 1 + 4
      wip_limit: 20,
      available_capacity: 10,
      utilization_pct: 50.0,
      status: 'ok'
    });
  });

  it('should calculate utilization_pct correctly', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });

    expect(response.error).toBeNull();
    expect(response.data.utilization_pct).toBe(60.0); // 3/5 * 100

    // Test high utilization
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('user_id', testStaffId);

    const highUtilResponse = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });

    expect(highUtilResponse.data.utilization_pct).toBe(80.0); // 4/5 * 100

    // Reset
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('user_id', testStaffId);
  });

  it('should set status based on utilization threshold', async () => {
    // Test "ok" status (<75%)
    const okResponse = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });
    expect(okResponse.data.status).toBe('ok');
    expect(okResponse.data.utilization_pct).toBeLessThan(75);

    // Test "warning" status (75-90%)
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 4 })
      .eq('user_id', testStaffId);

    const warningResponse = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });
    expect(warningResponse.data.status).toBe('warning');
    expect(warningResponse.data.utilization_pct).toBeGreaterThanOrEqual(75);

    // Test "critical" status (>90%)
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 5 })
      .eq('user_id', testStaffId);

    const criticalResponse = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });
    expect(criticalResponse.data.status).toBe('critical');
    expect(criticalResponse.data.utilization_pct).toBeGreaterThanOrEqual(90);

    // Reset
    await supabase
      .from('staff_profiles')
      .update({ current_assignment_count: 3 })
      .eq('user_id', testStaffId);
  });

  it('should allow user to check their own capacity', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });

    expect(response.error).toBeNull();
    expect(response.data.staff_id).toBe(testStaffId);
  });

  it('should return 403 when regular staff checks other staff capacity', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: 'capacity-other-staff-id' }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(403);
    expect(response.error.message).toContain('Insufficient permissions');
  });

  it('should allow supervisor to check unit capacity', async () => {
    const response = await supervisorClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: testUnitId }
    });

    expect(response.error).toBeNull();
    expect(response.data.unit_id).toBe(testUnitId);
  });

  it('should return 403 when supervisor checks other unit capacity', async () => {
    const response = await supervisorClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: otherUnitId }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(403);
    expect(response.error.message).toContain('Insufficient permissions');
  });

  it('should allow admin to check any capacity', async () => {
    // Check individual
    const individualResponse = await adminClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId }
    });
    expect(individualResponse.error).toBeNull();

    // Check unit
    const unitResponse = await adminClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: testUnitId }
    });
    expect(unitResponse.error).toBeNull();

    // Check other unit
    const otherUnitResponse = await adminClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: otherUnitId }
    });
    expect(otherUnitResponse.error).toBeNull();
  });

  it('should return 400 when neither staff_id nor unit_id provided', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: {}
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('Either staff_id or unit_id must be provided');
  });

  it('should return 400 when both staff_id and unit_id provided', async () => {
    const response = await staffClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: testStaffId, unit_id: testUnitId }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('Cannot provide both staff_id and unit_id');
  });

  it('should return 404 when staff_id does not exist', async () => {
    const response = await adminClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { staff_id: 'non-existent-staff-id' }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(404);
    expect(response.error.message).toContain('Staff member not found');
  });

  it('should return 404 when unit_id does not exist', async () => {
    const response = await adminClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: 'non-existent-unit-id' }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(404);
    expect(response.error.message).toContain('Organizational unit not found');
  });

  it('should exclude unavailable staff from unit capacity calculation', async () => {
    // Set one staff member as on_leave
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'on_leave' })
      .eq('user_id', 'capacity-other-staff-id');

    const response = await supervisorClient.functions.invoke('capacity-check', {
      method: 'GET',
      body: { unit_id: testUnitId }
    });

    expect(response.error).toBeNull();
    expect(response.data.total_staff).toBe(3); // Excludes on_leave staff
    expect(response.data.current_count).toBe(6); // 3 + 2 + 1 (excludes 4 from on_leave staff)

    // Reset
    await supabase
      .from('staff_profiles')
      .update({ availability_status: 'available' })
      .eq('user_id', 'capacity-other-staff-id');
  });
});
