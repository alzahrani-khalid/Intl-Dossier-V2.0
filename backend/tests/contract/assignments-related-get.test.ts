/**
 * Contract Test: GET /assignments-related/{id}
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Sibling assignments retrieval (same engagement or dossier)
 * - Context type identification (engagement/dossier/standalone)
 * - Progress statistics
 * - 200/403/404 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('GET /assignments-related/{id}', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let authToken: string;
  let engagementId: string;
  let engagementAssignmentId: string;
  let siblingAssignment1Id: string;
  let siblingAssignment2Id: string;
  let standaloneAssignmentId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    testUserId = userData!.user!.id;
    authToken = userData!.session!.access_token;

    // Create test engagement
    const { data: engagement } = await supabase
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
    engagementId = engagement!.id;

    // Create engagement-linked assignments
    const { data: mainAssignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'task',
        engagement_id: engagementId,
        workflow_stage: 'in_progress',
        priority: 'high',
        status: 'in_progress',
      })
      .select('id')
      .single();
    engagementAssignmentId = mainAssignment!.id;

    const { data: sibling1 } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000002',
        work_item_type: 'task',
        engagement_id: engagementId,
        workflow_stage: 'todo',
        priority: 'medium',
        status: 'assigned',
      })
      .select('id')
      .single();
    siblingAssignment1Id = sibling1!.id;

    const { data: sibling2 } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000003',
        work_item_type: 'task',
        engagement_id: engagementId,
        workflow_stage: 'done',
        priority: 'low',
        status: 'completed',
      })
      .select('id')
      .single();
    siblingAssignment2Id = sibling2!.id;

    // Create standalone assignment
    const { data: standalone } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000004',
        work_item_type: 'dossier',
        engagement_id: null,
        priority: 'high',
        status: 'assigned',
      })
      .select('id')
      .single();
    standaloneAssignmentId = standalone!.id;
  });

  afterAll(async () => {
    await supabase.from('assignments').delete().eq('engagement_id', engagementId);
    await supabase.from('assignments').delete().eq('id', standaloneAssignmentId);
    await supabase.from('engagements').delete().eq('id', engagementId);
  });

  it('should return 200 with engagement context and siblings', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/${engagementAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify schema
    expect(data).toHaveProperty('context_type');
    expect(data).toHaveProperty('context_id');
    expect(data).toHaveProperty('context_title');
    expect(data).toHaveProperty('progress');
    expect(data).toHaveProperty('related_assignments');

    // Verify engagement context
    expect(data.context_type).toBe('engagement');
    expect(data.context_id).toBe(engagementId);
    expect(data.context_title).toBeTruthy();

    // Verify progress stats
    expect(data.progress).toHaveProperty('total');
    expect(data.progress).toHaveProperty('completed');
    expect(data.progress).toHaveProperty('in_progress');
    expect(data.progress).toHaveProperty('todo');
    expect(data.progress).toHaveProperty('percentage');
    expect(data.progress.total).toBe(3); // Total assignments in engagement
    expect(data.progress.completed).toBe(1);
    expect(data.progress.in_progress).toBe(1);
    expect(data.progress.todo).toBe(1);

    // Verify related assignments (siblings only, not current)
    expect(Array.isArray(data.related_assignments)).toBe(true);
    expect(data.related_assignments.length).toBe(2); // 2 siblings

    // Verify sibling assignment schema
    const sibling = data.related_assignments[0];
    expect(sibling).toHaveProperty('id');
    expect(sibling).toHaveProperty('title');
    expect(sibling).toHaveProperty('status');
    expect(sibling).toHaveProperty('workflow_stage');
    expect(sibling).toHaveProperty('priority');

    // Current assignment should NOT be in related list
    const currentInList = data.related_assignments.find(
      (a: any) => a.id === engagementAssignmentId
    );
    expect(currentInList).toBeUndefined();
  });

  it('should return standalone context for non-engagement assignment', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/${standaloneAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.context_type).toBe('standalone');
    expect(data.context_id).toBeNull();
    expect(data.related_assignments).toHaveLength(0);
  });

  it('should include workflow stage for engagement assignments', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/${engagementAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    data.related_assignments.forEach((assignment: any) => {
      expect(assignment).toHaveProperty('workflow_stage');
      expect(['todo', 'in_progress', 'review', 'done']).toContain(
        assignment.workflow_stage
      );
    });
  });

  it('should include SLA remaining for each sibling', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/${engagementAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    data.related_assignments.forEach((assignment: any) => {
      expect(assignment).toHaveProperty('sla_remaining_seconds');
    });
  });

  it('should return 403 when user lacks permission', async () => {
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const otherAuthToken = otherUserData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/${engagementAssignmentId}`,
      {
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('permission');
  });

  it('should return 404 for non-existent assignment', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-related/00000000-0000-0000-0000-000000000999`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('not found');
  });
});
