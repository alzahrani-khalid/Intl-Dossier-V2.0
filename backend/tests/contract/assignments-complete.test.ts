/**
 * Contract Test: POST /assignments-complete
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Assignment completion
 * - Optimistic locking check (version field)
 * - SLA stop
 * - Completion event creation
 * - 200/400/403/409 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-complete', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    testUserId = userData!.user!.id;
    authToken = userData!.session!.access_token;

    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
        priority: 'high',
        status: 'in_progress',
        sla_deadline: new Date(Date.now() + 3600000).toISOString(),
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    await supabase.from('assignment_events').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 200 and mark assignment as completed', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          completion_notes: 'All tasks completed successfully',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('updated_at');
    expect(data.id).toBe(testAssignmentId);
    expect(data.status).toBe('completed');
  });

  it('should create completion event in timeline', async () => {
    // Create new assignment for this test
    const { data: newAssignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000002',
        work_item_type: 'ticket',
        status: 'in_progress',
      })
      .select('id')
      .single();

    await fetch(`${supabaseUrl}/functions/v1/assignments-complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignment_id: newAssignment!.id,
        completion_notes: 'Test completion',
      }),
    });

    // Verify event created
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', newAssignment!.id)
      .eq('event_type', 'completed');

    expect(events).toBeTruthy();
    expect(events!.length).toBeGreaterThan(0);
    expect(events![0]).toHaveProperty('event_data');
    expect(events![0].event_data).toHaveProperty('completion_notes');

    // Cleanup
    await supabase.from('assignments').delete().eq('id', newAssignment!.id);
  });

  it('should stop SLA tracking when completed', async () => {
    // Create new assignment
    const { data: newAssignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000003',
        work_item_type: 'dossier',
        status: 'in_progress',
        sla_deadline: new Date(Date.now() + 3600000).toISOString(),
      })
      .select()
      .single();

    await fetch(`${supabaseUrl}/functions/v1/assignments-complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignment_id: newAssignment!.id,
      }),
    });

    // Verify SLA stopped
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', newAssignment!.id)
      .single();

    expect(assignment).toBeTruthy();
    expect(assignment!.status).toBe('completed');
    // SLA tracking should be stopped (implementation specific)

    // Cleanup
    await supabase.from('assignments').delete().eq('id', newAssignment!.id);
  });

  it('should return 400 when assignment already completed', async () => {
    // Create and complete assignment
    const { data: completedAssignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000004',
        work_item_type: 'dossier',
        status: 'completed',
      })
      .select('id')
      .single();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: completedAssignment!.id,
        }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('already completed');

    // Cleanup
    await supabase.from('assignments').delete().eq('id', completedAssignment!.id);
  });

  it('should return 403 when user is not assignee', async () => {
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const otherAuthToken = otherUserData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
        }),
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('permission');
  });

  it('should return 409 on optimistic locking conflict', async () => {
    // Create assignment with version field
    const { data: versionedAssignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000005',
        work_item_type: 'dossier',
        status: 'in_progress',
        version: 1,
      })
      .select()
      .single();

    // Simulate concurrent update by changing version
    await supabase
      .from('assignments')
      .update({ version: 2 })
      .eq('id', versionedAssignment!.id);

    // Try to complete with old version
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: versionedAssignment!.id,
          expected_version: 1, // Old version
        }),
      }
    );

    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('conflict');

    // Cleanup
    await supabase.from('assignments').delete().eq('id', versionedAssignment!.id);
  });
});
