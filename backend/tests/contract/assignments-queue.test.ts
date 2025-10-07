/**
 * Contract Test: GET /assignments/queue
 *
 * Validates:
 * - Returns 200 with paginated QueueListResponse
 * - Sorted by priority DESC, created_at ASC (FIFO within priority)
 * - Filters: priority, work_item_type, unit_id
 * - Permission: Supervisors see unit queue, admins see all
 *
 * Dependencies: T008 (assignment_queue table)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('GET /assignments/queue', () => {
  let supabase: SupabaseClient;
  let supervisorClient: SupabaseClient;
  let adminClient: SupabaseClient;
  let staffClient: SupabaseClient;

  let testUnitId: string;
  let otherUnitId: string;
  let testSupervisorId: string;
  let testAdminId: string;
  let testStaffId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test units
    const { data: units } = await supabase
      .from('organizational_units')
      .insert([
        { name_ar: 'وحدة الطابور', name_en: 'Queue Unit', unit_wip_limit: 20 },
        { name_ar: 'وحدة أخرى', name_en: 'Other Unit', unit_wip_limit: 15 }
      ])
      .select();

    testUnitId = units![0].id;
    otherUnitId = units![1].id;

    // Create test staff
    const { data: staff } = await supabase
      .from('staff_profiles')
      .insert([
        { user_id: 'queue-supervisor-id', unit_id: testUnitId, skills: [], individual_wip_limit: 8, role: 'supervisor' },
        { user_id: 'queue-admin-id', unit_id: testUnitId, skills: [], individual_wip_limit: 10, role: 'admin' },
        { user_id: 'queue-staff-id', unit_id: testUnitId, skills: [], individual_wip_limit: 5, role: 'staff' }
      ])
      .select();

    testSupervisorId = staff![0].user_id;
    testAdminId = staff![1].user_id;
    testStaffId = staff![2].user_id;

    // Create authenticated clients
    supervisorClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    staffClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    // Seed queue with test data
    await supabase.from('assignment_queue').insert([
      {
        work_item_id: 'queue-urgent-1',
        work_item_type: 'ticket',
        required_skills: ['skill-test'],
        target_unit_id: testUnitId,
        priority: 'urgent',
        created_at: new Date('2025-10-02T10:00:00Z').toISOString()
      },
      {
        work_item_id: 'queue-urgent-2',
        work_item_type: 'ticket',
        required_skills: ['skill-test'],
        target_unit_id: testUnitId,
        priority: 'urgent',
        created_at: new Date('2025-10-02T10:05:00Z').toISOString()
      },
      {
        work_item_id: 'queue-high-1',
        work_item_type: 'dossier',
        required_skills: ['skill-test'],
        target_unit_id: testUnitId,
        priority: 'high',
        created_at: new Date('2025-10-02T10:10:00Z').toISOString()
      },
      {
        work_item_id: 'queue-normal-1',
        work_item_type: 'ticket',
        required_skills: ['skill-test'],
        target_unit_id: testUnitId,
        priority: 'normal',
        created_at: new Date('2025-10-02T10:15:00Z').toISOString()
      },
      {
        work_item_id: 'queue-other-unit',
        work_item_type: 'ticket',
        required_skills: ['skill-test'],
        target_unit_id: otherUnitId,
        priority: 'high',
        created_at: new Date('2025-10-02T10:20:00Z').toISOString()
      }
    ]);
  });

  afterAll(async () => {
    await supabase.from('assignment_queue').delete().ilike('work_item_id', 'queue-%');
    await supabase.from('staff_profiles').delete().in('user_id', [testSupervisorId, testAdminId, testStaffId]);
    await supabase.from('organizational_units').delete().in('id', [testUnitId, otherUnitId]);
  });

  it('should return 200 with queue items sorted by priority DESC, created_at ASC', async () => {
    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data).toMatchObject({
      items: expect.any(Array),
      total_count: expect.any(Number),
      page: 1,
      page_size: 50
    });

    const items = response.data.items;

    // Verify sorting: urgent first, then by created_at ASC within priority
    expect(items[0].work_item_id).toBe('queue-urgent-1'); // Oldest urgent
    expect(items[1].work_item_id).toBe('queue-urgent-2'); // Newer urgent
    expect(items[2].work_item_id).toBe('queue-high-1');   // High priority
    expect(items[3].work_item_id).toBe('queue-normal-1'); // Normal priority

    // Verify queue positions
    expect(items[0].queue_position).toBe(1);
    expect(items[1].queue_position).toBe(2);
    expect(items[2].queue_position).toBe(3);
    expect(items[3].queue_position).toBe(4);
  });

  it('should filter queue items by priority', async () => {
    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET',
      body: { priority: 'urgent' }
    });

    expect(response.error).toBeNull();
    expect(response.data.items).toHaveLength(2);
    expect(response.data.items.every((item: any) => item.priority === 'urgent')).toBe(true);
  });

  it('should filter queue items by work_item_type', async () => {
    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET',
      body: { work_item_type: 'dossier' }
    });

    expect(response.error).toBeNull();
    expect(response.data.items).toHaveLength(1);
    expect(response.data.items[0].work_item_type).toBe('dossier');
    expect(response.data.items[0].work_item_id).toBe('queue-high-1');
  });

  it('should filter queue items by unit_id', async () => {
    const response = await adminClient.functions.invoke('assignments-queue', {
      method: 'GET',
      body: { unit_id: testUnitId }
    });

    expect(response.error).toBeNull();
    expect(response.data.items.every((item: any) => item.target_unit_id === testUnitId)).toBe(true);
    expect(response.data.items).toHaveLength(4); // Excludes other unit
  });

  it('should support pagination with page and page_size', async () => {
    const responsePage1 = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET',
      body: { page: 1, page_size: 2 }
    });

    expect(responsePage1.error).toBeNull();
    expect(responsePage1.data.items).toHaveLength(2);
    expect(responsePage1.data.page).toBe(1);
    expect(responsePage1.data.page_size).toBe(2);
    expect(responsePage1.data.total_count).toBeGreaterThanOrEqual(4);

    const responsePage2 = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET',
      body: { page: 2, page_size: 2 }
    });

    expect(responsePage2.error).toBeNull();
    expect(responsePage2.data.items).toHaveLength(2);
    expect(responsePage2.data.page).toBe(2);

    // Verify no overlap between pages
    const page1Ids = responsePage1.data.items.map((i: any) => i.work_item_id);
    const page2Ids = responsePage2.data.items.map((i: any) => i.work_item_id);
    expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false);
  });

  it('should allow supervisor to see only their unit queue', async () => {
    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data.items.every((item: any) => item.target_unit_id === testUnitId)).toBe(true);
    expect(response.data.items.some((item: any) => item.work_item_id === 'queue-other-unit')).toBe(false);
  });

  it('should allow admin to see all queue items', async () => {
    const response = await adminClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data.items.some((item: any) => item.target_unit_id === testUnitId)).toBe(true);
    expect(response.data.items.some((item: any) => item.target_unit_id === otherUnitId)).toBe(true);
    expect(response.data.total_count).toBe(5); // All items
  });

  it('should return 403 when regular staff tries to view queue', async () => {
    const response = await staffClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeTruthy();
    expect(response.status).toBe(403);
    expect(response.error.message).toContain('Insufficient permissions');
  });

  it('should include queue metadata: attempts, last_attempt_at, notes', async () => {
    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeNull();

    const firstItem = response.data.items[0];
    expect(firstItem).toMatchObject({
      queue_id: expect.any(String),
      work_item_id: expect.any(String),
      work_item_type: expect.any(String),
      required_skills: expect.any(Array),
      priority: expect.any(String),
      queue_position: expect.any(Number),
      queued_at: expect.any(String),
      attempts: expect.any(Number),
      last_attempt_at: expect.toBeOneOf([expect.any(String), null]),
      notes: expect.toBeOneOf([expect.any(String), null])
    });
  });

  it('should return empty array when queue is empty', async () => {
    // Clear queue
    await supabase.from('assignment_queue').delete().eq('target_unit_id', testUnitId);

    const response = await supervisorClient.functions.invoke('assignments-queue', {
      method: 'GET'
    });

    expect(response.error).toBeNull();
    expect(response.data.items).toEqual([]);
    expect(response.data.total_count).toBe(0);
  });
});
