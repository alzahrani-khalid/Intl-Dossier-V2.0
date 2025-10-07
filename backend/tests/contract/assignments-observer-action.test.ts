/**
 * Contract Test: POST /assignments-observer-action
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Accept action (observer becomes assignee)
 * - Reassign action (assign to different user)
 * - Continue observing action
 * - 200/400/403 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-observer-action', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let assigneeId: string;
  let observerId: string;
  let otherUserId: string;
  let observerAuthToken: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create assignee
    const { data: assigneeData } = await supabase.auth.signUp({
      email: `assignee-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    assigneeId = assigneeData!.user!.id;

    // Create observer (supervisor)
    const { data: observerData } = await supabase.auth.signUp({
      email: `observer-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    observerId = observerData!.user!.id;
    observerAuthToken = observerData!.session!.access_token;

    // Create other user for reassignment
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    otherUserId = otherUserData!.user!.id;

    // Create assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: assigneeId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
        priority: 'high',
        status: 'assigned',
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;

    // Add observer
    await supabase.from('assignment_observers').insert({
      assignment_id: testAssignmentId,
      user_id: observerId,
      role: 'supervisor',
    });
  });

  afterAll(async () => {
    await supabase.from('assignment_observers').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_events').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 200 and reassign when observer accepts', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'accept',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('assignee_id');
    expect(data.assignee_id).toBe(observerId);

    // Verify observer removed from observers list
    const { data: observers } = await supabase
      .from('assignment_observers')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('user_id', observerId);

    expect(observers).toHaveLength(0);
  });

  it('should return 200 and reassign to specified user', async () => {
    // Re-add observer for this test
    await supabase.from('assignment_observers').insert({
      assignment_id: testAssignmentId,
      user_id: observerId,
      role: 'supervisor',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'reassign',
          reassign_to_user_id: otherUserId,
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.assignee_id).toBe(otherUserId);

    // Verify reassignment event created
    const { data: events } = await supabase
      .from('assignment_events')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('event_type', 'reassigned');

    expect(events).toBeTruthy();
    expect(events!.length).toBeGreaterThan(0);
  });

  it('should return 200 and keep observing when continue_observing', async () => {
    // Re-add observer
    await supabase.from('assignment_observers').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_observers').insert({
      assignment_id: testAssignmentId,
      user_id: observerId,
      role: 'supervisor',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'continue_observing',
        }),
      }
    );

    expect(response.status).toBe(200);

    // Verify observer still in list
    const { data: observers } = await supabase
      .from('assignment_observers')
      .select('*')
      .eq('assignment_id', testAssignmentId)
      .eq('user_id', observerId);

    expect(observers).toHaveLength(1);
  });

  it('should return 400 for invalid action', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'invalid_action',
        }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('Invalid action');
  });

  it('should return 400 when reassign action missing user_id', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${observerAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'reassign',
          // Missing reassign_to_user_id
        }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 403 when user is not an observer', async () => {
    const { data: nonObserverData } = await supabase.auth.signUp({
      email: `nonobserver-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const nonObserverToken = nonObserverData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-observer-action`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${nonObserverToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          action: 'accept',
        }),
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('not an observer');
  });
});
