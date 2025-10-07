/**
 * T082: Contract test for GET /escalations-report
 * Tests escalation reporting endpoint according to API spec
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestClient, createServiceRoleClient } from '../helpers/supabase-client';
import { cleanupTestData, createTestStaff, createTestAssignment } from '../helpers/test-data';

describe('GET /escalations-report', () => {
  const client = createTestClient();
  const serviceClient = createServiceRoleClient();
  let testAssignmentIds: string[] = [];
  let testEscalationIds: string[] = [];

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    // Cleanup test escalations
    if (testEscalationIds.length > 0) {
      await serviceClient
        .from('escalation_events')
        .delete()
        .in('id', testEscalationIds);
    }

    // Cleanup test assignments
    if (testAssignmentIds.length > 0) {
      await serviceClient
        .from('assignments')
        .delete()
        .in('id', testAssignmentIds);
    }

    await cleanupTestData();
  });

  it('should return 200 with escalation summary statistics', async () => {
    // Setup: Create test staff and assignments with escalations
    const staff = await createTestStaff({
      skills: ['skill-arabic'],
      individual_wip_limit: 5,
      current_assignment_count: 3,
      availability_status: 'available',
    });

    // Create 3 assignments with escalations
    for (let i = 0; i < 3; i++) {
      const assignment = await createTestAssignment({
        work_item_id: `test-work-${i}`,
        work_item_type: 'ticket',
        assignee_id: staff.user_id,
        organizational_unit_id: staff.organizational_unit_id,
        sla_status: 'escalated',
        priority: 'urgent',
      });

      testAssignmentIds.push(assignment.id);

      // Create escalation event
      const { data: escalation } = await serviceClient
        .from('escalation_events')
        .insert({
          assignment_id: assignment.id,
          reason: 'sla_breach',
          escalated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (escalation) {
        testEscalationIds.push(escalation.id);
      }
    }

    // Get auth token
    const { data: authData } = await client.auth.signInWithPassword({
      email: 'supervisor@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    const token = authData.session?.access_token;

    // Act: Call escalations-report endpoint
    const response = await fetch('http://localhost:54321/functions/v1/escalations-report', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Assert: Response structure
    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate summary
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('total_escalations');
    expect(data.summary).toHaveProperty('avg_escalations_per_day');
    expect(data.summary).toHaveProperty('most_common_reason');
    expect(data.summary).toHaveProperty('affected_assignments');

    // Validate time_series
    expect(data).toHaveProperty('time_series');
    expect(Array.isArray(data.time_series)).toBe(true);

    // Validate by_unit
    expect(data).toHaveProperty('by_unit');
    expect(Array.isArray(data.by_unit)).toBe(true);

    // Validate by_assignee
    expect(data).toHaveProperty('by_assignee');
    expect(Array.isArray(data.by_assignee)).toBe(true);

    // Validate by_work_type
    expect(data).toHaveProperty('by_work_type');
    expect(Array.isArray(data.by_work_type)).toBe(true);

    // Validate metadata
    expect(data).toHaveProperty('metadata');
    expect(data.metadata).toHaveProperty('start_date');
    expect(data.metadata).toHaveProperty('end_date');
    expect(data.metadata).toHaveProperty('group_by');
  });

  it('should filter escalations by date range', async () => {
    // Setup: Create escalation 5 days ago
    const staff = await createTestStaff({
      skills: ['skill-arabic'],
      individual_wip_limit: 5,
      current_assignment_count: 1,
    });

    const oldDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const assignment = await createTestAssignment({
      work_item_id: 'test-work-old',
      work_item_type: 'ticket',
      assignee_id: staff.user_id,
      sla_status: 'escalated',
    });

    testAssignmentIds.push(assignment.id);

    const { data: escalation } = await serviceClient
      .from('escalation_events')
      .insert({
        assignment_id: assignment.id,
        reason: 'sla_breach',
        escalated_at: oldDate.toISOString(),
        created_at: oldDate.toISOString(),
      })
      .select()
      .single();

    if (escalation) {
      testEscalationIds.push(escalation.id);
    }

    // Get auth token
    const { data: authData } = await client.auth.signInWithPassword({
      email: 'supervisor@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    const token = authData.session?.access_token;

    // Act: Request last 2 days only (should not include 5-day-old escalation)
    const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    const response = await fetch(
      `http://localhost:54321/functions/v1/escalations-report?start_date=${startDate}&end_date=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Assert: Old escalation should not be included
    expect(data.summary.total_escalations).toBe(0);
  });

  it('should filter escalations by organizational unit', async () => {
    // Setup: Create two units with escalations
    const staff1 = await createTestStaff({
      skills: ['skill-arabic'],
      organizational_unit_name: 'Unit A',
    });

    const staff2 = await createTestStaff({
      skills: ['skill-arabic'],
      organizational_unit_name: 'Unit B',
    });

    // Create escalation for Unit A
    const assignment1 = await createTestAssignment({
      work_item_id: 'test-work-unit-a',
      work_item_type: 'ticket',
      assignee_id: staff1.user_id,
      organizational_unit_id: staff1.organizational_unit_id,
      sla_status: 'escalated',
    });

    testAssignmentIds.push(assignment1.id);

    const { data: escalation1 } = await serviceClient
      .from('escalation_events')
      .insert({
        assignment_id: assignment1.id,
        reason: 'sla_breach',
        escalated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (escalation1) {
      testEscalationIds.push(escalation1.id);
    }

    // Create escalation for Unit B
    const assignment2 = await createTestAssignment({
      work_item_id: 'test-work-unit-b',
      work_item_type: 'ticket',
      assignee_id: staff2.user_id,
      organizational_unit_id: staff2.organizational_unit_id,
      sla_status: 'escalated',
    });

    testAssignmentIds.push(assignment2.id);

    const { data: escalation2 } = await serviceClient
      .from('escalation_events')
      .insert({
        assignment_id: assignment2.id,
        reason: 'sla_breach',
        escalated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (escalation2) {
      testEscalationIds.push(escalation2.id);
    }

    // Get auth token
    const { data: authData } = await client.auth.signInWithPassword({
      email: 'supervisor@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    const token = authData.session?.access_token;

    // Act: Filter by Unit A only
    const response = await fetch(
      `http://localhost:54321/functions/v1/escalations-report?unit_id=${staff1.organizational_unit_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Assert: Should only include Unit A escalation
    expect(data.summary.total_escalations).toBe(1);
    expect(data.by_unit.length).toBe(1);
    expect(data.by_unit[0].unit_id).toBe(staff1.organizational_unit_id);
  });

  it('should group time series by day or week', async () => {
    // Setup: Create escalations on different days
    const staff = await createTestStaff({
      skills: ['skill-arabic'],
      individual_wip_limit: 5,
    });

    const dates = [
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(), // today
    ];

    for (let i = 0; i < dates.length; i++) {
      const assignment = await createTestAssignment({
        work_item_id: `test-work-day-${i}`,
        work_item_type: 'ticket',
        assignee_id: staff.user_id,
        sla_status: 'escalated',
      });

      testAssignmentIds.push(assignment.id);

      const { data: escalation } = await serviceClient
        .from('escalation_events')
        .insert({
          assignment_id: assignment.id,
          reason: 'sla_breach',
          escalated_at: dates[i].toISOString(),
          created_at: dates[i].toISOString(),
        })
        .select()
        .single();

      if (escalation) {
        testEscalationIds.push(escalation.id);
      }
    }

    // Get auth token
    const { data: authData } = await client.auth.signInWithPassword({
      email: 'supervisor@gastat.gov.sa',
      password: 'TestPassword123!',
    });

    const token = authData.session?.access_token;

    // Act: Group by day
    const responseDay = await fetch(
      'http://localhost:54321/functions/v1/escalations-report?group_by=day',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    expect(responseDay.status).toBe(200);

    const dataDay = await responseDay.json();

    // Assert: Should have 3 day entries
    expect(dataDay.time_series.length).toBeGreaterThanOrEqual(3);

    // Act: Group by week
    const responseWeek = await fetch(
      'http://localhost:54321/functions/v1/escalations-report?group_by=week',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    expect(responseWeek.status).toBe(200);

    const dataWeek = await responseWeek.json();

    // Assert: Should have fewer entries when grouped by week
    expect(dataWeek.time_series.length).toBeLessThanOrEqual(dataDay.time_series.length);
  });

  it('should return 401 when unauthorized', async () => {
    // Act: Call without auth token
    const response = await fetch('http://localhost:54321/functions/v1/escalations-report', {
      method: 'GET',
    });

    // Assert
    expect(response.status).toBe(401);
  });
});
