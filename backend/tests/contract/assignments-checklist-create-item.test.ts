/**
 * Contract Test: POST /assignments-checklist-create-item
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Item creation with proper sequence
 * - 201/400/403 responses
 * - RLS policy enforcement
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-checklist-create-item', () => {
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
      })
      .select('id')
      .single();
    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    await supabase.from('assignment_checklist_items').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 201 with valid checklist item creation', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-create-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'Review documents',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('text');
    expect(data).toHaveProperty('completed');
    expect(data).toHaveProperty('sequence');
    expect(data.text).toBe('Review documents');
    expect(data.completed).toBe(false);
    expect(data.sequence).toBeGreaterThanOrEqual(1);
  });

  it('should calculate sequence automatically', async () => {
    // Create first item
    await fetch(`${supabaseUrl}/functions/v1/assignments-checklist-create-item`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignment_id: testAssignmentId,
        text: 'First item',
      }),
    });

    // Create second item
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-create-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'Second item',
        }),
      }
    );

    const data = await response.json();
    expect(data.sequence).toBeGreaterThan(1);
  });

  it('should return 400 when text exceeds 500 characters', async () => {
    const longText = 'a'.repeat(501);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-checklist-create-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: longText,
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
      `${supabaseUrl}/functions/v1/assignments-checklist-create-item`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'Unauthorized item',
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});
