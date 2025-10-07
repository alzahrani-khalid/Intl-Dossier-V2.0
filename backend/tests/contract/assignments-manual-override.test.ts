/**
 * Contract Test: POST /assignments/manual-override
 *
 * Validates:
 * - Success: Returns 200 for supervisor/admin
 * - Permission: Returns 403 for non-supervisor staff
 * - Validation: Returns 400 for invalid assignee_id or missing override_reason
 *
 * Dependencies: T007 (assignments table)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('POST /assignments/manual-override', () => {
  let supabase: SupabaseClient;
  let supervisorClient: SupabaseClient;
  let staffClient: SupabaseClient;
  let adminClient: SupabaseClient;

  let testStaffId: string;
  let testSupervisorId: string;
  let testAdminId: string;
  let testUnitId: string;

  beforeAll(async () => {
    // Initialize clients with different auth levels
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test organizational unit
    const { data: unit, error: unitError } = await supabase
      .from('organizational_units')
      .insert({
        name_ar: 'وحدة اختبار التجاوز',
        name_en: 'Override Test Unit',
        unit_wip_limit: 20
      })
      .select()
      .single();

    if (unitError) throw unitError;
    testUnitId = unit.id;

    // Create test staff profiles
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .insert([
        {
          user_id: 'test-staff-user-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 5,
          role: 'staff'
        },
        {
          user_id: 'test-supervisor-user-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 8,
          role: 'supervisor'
        },
        {
          user_id: 'test-admin-user-id',
          unit_id: testUnitId,
          skills: [],
          individual_wip_limit: 10,
          role: 'admin'
        }
      ])
      .select();

    if (staffError) throw staffError;

    testStaffId = staff![0].user_id;
    testSupervisorId = staff![1].user_id;
    testAdminId = staff![2].user_id;

    // Create authenticated clients (mocked for testing)
    // In real implementation, these would use actual JWT tokens
    staffClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    supervisorClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('assignments').delete().eq('work_item_id', 'test-override-ticket');
    await supabase.from('staff_profiles').delete().in('user_id', [testStaffId, testSupervisorId, testAdminId]);
    await supabase.from('organizational_units').delete().eq('id', testUnitId);
  });

  it('should return 200 when supervisor overrides assignment in their unit', async () => {
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-ticket-001',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Staff has specific expertise in this area'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      assignment_id: expect.any(String),
      assignee_id: testStaffId,
      assigned_by: testSupervisorId,
      override_reason: 'Staff has specific expertise in this area',
      status: 'assigned'
    });

    // Verify assignment created in database
    const { data: assignment } = await supabase
      .from('assignments')
      .select()
      .eq('work_item_id', 'test-override-ticket-001')
      .single();

    expect(assignment).toBeTruthy();
    expect(assignment?.assignee_id).toBe(testStaffId);
    expect(assignment?.assigned_by).toBe(testSupervisorId);
  });

  it('should return 200 when admin overrides assignment system-wide', async () => {
    const response = await adminClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-ticket-002',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Urgent priority requires immediate assignment'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      assignment_id: expect.any(String),
      assignee_id: testStaffId,
      assigned_by: testAdminId
    });
  });

  it('should log capacity warning if assignee at/over WIP limit', async () => {
    // First, fill assignee to WIP limit
    const assignments = Array.from({ length: 5 }, (_, i) => ({
      work_item_id: `capacity-test-${i}`,
      work_item_type: 'ticket',
      assignee_id: testStaffId,
      sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'normal',
      status: 'assigned'
    }));

    await supabase.from('assignments').insert(assignments);

    // Attempt override when at limit
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-at-limit',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Critical issue requires this staff member'
      }
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      assignment_id: expect.any(String),
      capacity_warning: expect.stringContaining('assignee is at or over WIP limit')
    });

    // Cleanup
    await supabase.from('assignments').delete().in('work_item_id',
      assignments.map(a => a.work_item_id).concat(['test-override-at-limit'])
    );
  });

  it('should return 403 when non-supervisor staff attempts override', async () => {
    const response = await staffClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-forbidden',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Trying to override without permission'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(403);
    expect(response.error.message).toContain('Insufficient permissions');
  });

  it('should return 400 when override_reason is missing', async () => {
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-no-reason',
        work_item_type: 'ticket',
        assignee_id: testStaffId
        // Missing override_reason
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('override_reason is required');
  });

  it('should return 400 when override_reason is too short', async () => {
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-short-reason',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Short' // Less than 10 characters
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('override_reason must be at least 10 characters');
  });

  it('should return 400 when assignee_id is invalid (not a staff member)', async () => {
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-invalid-assignee',
        work_item_type: 'ticket',
        assignee_id: 'non-existent-user-id',
        override_reason: 'Valid reason but invalid assignee'
      }
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(400);
    expect(response.error.message).toContain('Invalid assignee_id');
  });

  it('should record audit trail with override metadata', async () => {
    const response = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-audit',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'Audit trail test - manual override for testing purposes'
      }
    });

    expect(response.error).toBeNull();

    // Verify audit fields in assignments table
    const { data: assignment } = await supabase
      .from('assignments')
      .select('assigned_by, created_at, updated_at')
      .eq('work_item_id', 'test-override-audit')
      .single();

    expect(assignment?.assigned_by).toBe(testSupervisorId);
    expect(assignment?.created_at).toBeTruthy();
    expect(assignment?.updated_at).toBeTruthy();
  });

  it('should prevent duplicate active assignments for same work item', async () => {
    // Create first assignment
    const firstResponse = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-duplicate',
        work_item_type: 'ticket',
        assignee_id: testStaffId,
        override_reason: 'First assignment for testing duplicate prevention'
      }
    });

    expect(firstResponse.error).toBeNull();

    // Attempt second assignment for same work item
    const secondResponse = await supervisorClient.functions.invoke('assignments-manual-override', {
      body: {
        work_item_id: 'test-override-duplicate',
        work_item_type: 'ticket',
        assignee_id: testSupervisorId,
        override_reason: 'Second assignment attempt - should fail'
      }
    });

    expect(secondResponse.error).toBeTruthy();
    expect(secondResponse.status).toBe(409); // Conflict
    expect(secondResponse.error.message).toContain('Work item already has active assignment');
  });
});
