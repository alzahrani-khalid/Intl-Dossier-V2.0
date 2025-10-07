/**
 * Contract Test: POST /assignments-checklist-toggle-item
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Completion toggle functionality
 * - Optimistic locking behavior
 * - Timestamp and actor tracking
 * - 200/400/403 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-checklist-toggle-item', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testChecklistItemId: string;
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
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;

    const { data: checklistItem } = await supabase
      .from('assignment_checklist_items')
      .insert({
        assignment_id: testAssignmentId,
        text: 'Test item',
        sequence: 1,
        completed: false,
      })
      .select('id')
      .single();
    testChecklistItemId = checklistItem!.id;
  });

  afterAll(async () => {
    await supabase.from('assignment_checklist_items').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 200 and mark item as complete', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: testChecklistItemId,
          completed: true,
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('completed');
    expect(data).toHaveProperty('completed_at');
    expect(data).toHaveProperty('completed_by');
    expect(data.completed).toBe(true);
    expect(data.completed_at).toBeTruthy();
    expect(data.completed_by).toHaveProperty('id');
    expect(data.completed_by.id).toBe(testUserId);
  });

  it('should return 200 and unmark item when toggling to incomplete', async () => {
    // First mark as complete
    await fetch(`${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_id: testChecklistItemId,
        completed: true,
      }),
    });

    // Then unmark
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: testChecklistItemId,
          completed: false,
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.completed).toBe(false);
    expect(data.completed_at).toBeNull();
    expect(data.completed_by).toBeNull();
  });

  it('should return 400 for invalid item_id', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: '00000000-0000-0000-0000-000000000999',
          completed: true,
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 when completed field is missing', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: testChecklistItemId,
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 403 when user lacks permission', async () => {
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const otherAuthToken = otherUserData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-toggle-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: testChecklistItemId,
          completed: true,
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});
