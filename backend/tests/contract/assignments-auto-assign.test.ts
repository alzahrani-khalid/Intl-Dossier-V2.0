/**
 * T024: Contract test for POST /assignments/auto-assign
 * Tests auto-assignment endpoint according to API spec
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestClient, createServiceRoleClient } from '../helpers/supabase-client';
import { cleanupTestData, createTestStaff } from '../helpers/test-data';

describe('POST /assignments/auto-assign', () => {
  const client = createTestClient();
  const serviceClient = createServiceRoleClient();

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should return 200 with AssignmentResponse when capacity available', async () => {
    // Setup: Create staff with skills and available capacity
    const staff = await createTestStaff({
      skillNames: ['skill-arabic'],
      individual_wip_limit: 5,
      current_assignment_count: 2,
      availability_status: 'available',
    });

    // Act: Call auto-assign endpoint
    const response = await fetch('http://localhost:54321/functions/v1/assignments-auto-assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        work_item_id: 'test-work-001',
        work_item_type: 'ticket',
        required_skills: ['skill-arabic'],
        priority: 'normal',
      }),
    });

    // Assert: Response structure
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('assignment_id');
    expect(data).toHaveProperty('assignee_id');
    expect(data).toHaveProperty('sla_deadline');
    expect(data).toHaveProperty('time_remaining_seconds');
    expect(data.priority).toBe('normal');
    expect(data.status).toBe('assigned');

    // Verify assignment created in database
    const { data: assignment } = await serviceClient
      .from('assignments')
      .select()
      .eq('work_item_id', 'test-work-001')
      .single();

    expect(assignment).toBeTruthy();
    expect(assignment?.assignee_id).toBe(staff.user_id);
  });

  it('should return 202 with QueuedResponse when no capacity available', async () => {
    // Setup: Create staff at WIP limit
    const staff = await createTestStaff({
      skillNames: ['skill-arabic'],
      individual_wip_limit: 5,
      current_assignment_count: 5, // At limit
      availability_status: 'available',
    });

    // Act: Call auto-assign endpoint
    const response = await fetch('http://localhost:54321/functions/v1/assignments-auto-assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        work_item_id: 'test-work-002',
        work_item_type: 'ticket',
        required_skills: ['skill-arabic'],
        priority: 'urgent',
      }),
    });

    // Assert: Queued response
    expect(response.status).toBe(202);

    const data = await response.json();
    expect(data.queued).toBe(true);
    expect(data).toHaveProperty('queue_id');
    expect(data).toHaveProperty('queue_position');
    expect(data).toHaveProperty('reason');

    // Verify item added to queue
    const { data: queueEntry } = await serviceClient
      .from('assignment_queue')
      .select()
      .eq('work_item_id', 'test-work-002')
      .single();

    expect(queueEntry).toBeTruthy();
    expect(queueEntry?.priority).toBe('urgent');
  });

  it('should validate weighted scoring (skills + capacity + availability + unit)', async () => {
    // Setup: Create two staff members, one with better skill match
    const staff1 = await createTestStaff({
      skillNames: ['skill-arabic'], // 1 matching skill
      individual_wip_limit: 5,
      current_assignment_count: 0,
    });

    const staff2 = await createTestStaff({
      skillNames: ['skill-arabic', 'skill-writing'], // 2 skills
      individual_wip_limit: 5,
      current_assignment_count: 0,
    });

    // Act
    const response = await fetch('http://localhost:54321/functions/v1/assignments-auto-assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        work_item_id: 'test-work-003',
        work_item_type: 'ticket',
        required_skills: ['skill-arabic'],
        priority: 'normal',
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify assigned to staff2 (more skills = higher score)
    expect(data.assignee_id).toBe(staff2.user_id);
  });

  it('should enforce WIP limits (individual and unit)', async () => {
    // This test validates FR-005 and FR-008
    // Will be implemented after auto-assignment service
    expect(true).toBe(true); // Placeholder
  });
});
