/**
 * Contract Test: GET /assignments-get/{id}
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Schema compliance with api-spec.yaml
 * - 200/403/404 responses
 * - Engagement context included when applicable
 * - SLA tracking data present
 * - Comments, checklist, timeline, observers arrays
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('GET /assignments-get/{id}', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testEngagementId: string;
  let testUserId: string;
  let otherUserId: string;
  let authToken: string;
  let otherAuthToken: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test users
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    if (userError) throw userError;
    testUserId = userData.user!.id;
    authToken = userData.session!.access_token;

    const { data: otherUserData, error: otherUserError } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    if (otherUserError) throw otherUserError;
    otherUserId = otherUserData.user!.id;
    otherAuthToken = otherUserData.session!.access_token;

    // Create test engagement
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .insert({
        title_en: 'Test Engagement',
        title_ar: 'اختبار المشاركة',
        engagement_type: 'event',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
      })
      .select('id')
      .single();
    if (engagementError) throw engagementError;
    testEngagementId = engagement.id;

    // Create test assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
        priority: 'high',
        status: 'assigned',
        engagement_id: testEngagementId,
        workflow_stage: 'todo',
        sla_deadline: new Date(Date.now() + 3600000).toISOString(),
      })
      .select('id')
      .single();
    if (assignmentError) throw assignmentError;
    testAssignmentId = assignment.id;

    // Create test comment
    await supabase.from('assignment_comments').insert({
      assignment_id: testAssignmentId,
      user_id: testUserId,
      text: 'Test comment',
    });

    // Create test checklist item
    await supabase.from('assignment_checklist_items').insert({
      assignment_id: testAssignmentId,
      text: 'Test checklist item',
      sequence: 1,
      completed: false,
    });

    // Create test timeline event
    await supabase.from('assignment_events').insert({
      assignment_id: testAssignmentId,
      event_type: 'created',
      actor_user_id: testUserId,
      event_data: {},
    });
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('assignment_comments').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_checklist_items').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_events').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
  });

  it('should return 200 with valid assignment detail schema', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-get/${testAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify top-level schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('assignment_metadata');
    expect(data).toHaveProperty('work_item');
    expect(data).toHaveProperty('sla_tracking');
    expect(data).toHaveProperty('comments');
    expect(data).toHaveProperty('checklist_items');
    expect(data).toHaveProperty('timeline');
    expect(data).toHaveProperty('observers');
    expect(data).toHaveProperty('can_escalate');
    expect(data).toHaveProperty('can_complete');
    expect(data).toHaveProperty('progress_percentage');

    // Verify assignment_metadata schema
    expect(data.assignment_metadata).toHaveProperty('assignment_id');
    expect(data.assignment_metadata).toHaveProperty('assigned_date');
    expect(data.assignment_metadata).toHaveProperty('assignee_name');
    expect(data.assignment_metadata).toHaveProperty('priority');
    expect(data.assignment_metadata).toHaveProperty('status');
    expect(data.assignment_metadata.priority).toBe('high');
    expect(data.assignment_metadata.status).toBe('assigned');

    // Verify work_item schema
    expect(data.work_item).toHaveProperty('id');
    expect(data.work_item).toHaveProperty('type');
    expect(data.work_item).toHaveProperty('title');
    expect(data.work_item.type).toBe('dossier');

    // Verify sla_tracking schema
    expect(data.sla_tracking).toHaveProperty('deadline');
    expect(data.sla_tracking).toHaveProperty('time_remaining_seconds');
    expect(data.sla_tracking).toHaveProperty('percentage_elapsed');
    expect(data.sla_tracking).toHaveProperty('health_status');
    expect(data.sla_tracking.health_status).toMatch(/safe|warning|breached/);

    // Verify arrays are present
    expect(Array.isArray(data.comments)).toBe(true);
    expect(Array.isArray(data.checklist_items)).toBe(true);
    expect(Array.isArray(data.timeline)).toBe(true);
    expect(Array.isArray(data.observers)).toBe(true);

    // Verify at least one item in each array from setup
    expect(data.comments.length).toBeGreaterThan(0);
    expect(data.checklist_items.length).toBeGreaterThan(0);
    expect(data.timeline.length).toBeGreaterThan(0);
  });

  it('should include engagement context when assignment is engagement-linked', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-get/${testAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify engagement context is included
    expect(data).toHaveProperty('engagement_context');
    expect(data.engagement_context).toHaveProperty('engagement_id');
    expect(data.engagement_context).toHaveProperty('engagement_title');
    expect(data.engagement_context).toHaveProperty('workflow_stage');
    expect(data.engagement_context.engagement_id).toBe(testEngagementId);
    expect(data.engagement_context.workflow_stage).toBe('todo');
  });

  it('should return 403 when user is not assignee or observer', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-get/${testAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('permission');
  });

  it('should return 404 when assignment does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000999';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-get/${nonExistentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('not found');
  });

  it('should return 401 when no authorization provided', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-get/${testAssignmentId}`
    );

    expect(response.status).toBe(401);
  });
});
