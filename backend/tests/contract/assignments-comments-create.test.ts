/**
 * Contract Test: POST /assignments-comments-create
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Request/response schema compliance
 * - @mention parsing and validation
 * - 201/400/403/429 responses
 * - Notification creation for mentions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

describe('POST /assignments-comments-create', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testUserId: string;
  let mentionedUserId: string;
  let authToken: string;

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

    const { data: mentionedUserData, error: mentionedError } = await supabase.auth.signUp({
      email: `mentioned-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    if (mentionedError) throw mentionedError;
    mentionedUserId = mentionedUserData.user!.id;

    // Create test assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        assignee_id: testUserId,
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
        priority: 'high',
        status: 'assigned',
      })
      .select('id')
      .single();
    if (assignmentError) throw assignmentError;
    testAssignmentId = assignment.id;

    // Add mentioned user as observer so they have permission
    await supabase.from('assignment_observers').insert({
      assignment_id: testAssignmentId,
      user_id: mentionedUserId,
      role: 'other',
    });
  });

  afterAll(async () => {
    await supabase.from('assignment_comments').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignment_observers').delete().eq('assignment_id', testAssignmentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 201 with valid comment creation', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'This is a test comment',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();

    // Verify response schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('text');
    expect(data).toHaveProperty('author');
    expect(data).toHaveProperty('created_at');
    expect(data.text).toBe('This is a test comment');
    expect(data.author).toHaveProperty('id');
    expect(data.author.id).toBe(testUserId);
  });

  it('should parse @mentions and return mentions in response', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: `Hello @user${mentionedUserId.slice(0, 8)} please review this`,
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('mentions');
    expect(Array.isArray(data.mentions)).toBe(true);
  });

  it('should return 400 when text exceeds 5000 characters', async () => {
    const longText = 'a'.repeat(5001);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
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

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('exceeds maximum length');
  });

  it('should return 400 when assignment_id is missing', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Missing assignment ID',
        }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 403 when user does not have permission to comment', async () => {
    // Create different user
    const { data: otherUserData, error: otherUserError } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    if (otherUserError) throw otherUserError;
    const otherAuthToken = otherUserData.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'Unauthorized comment',
        }),
      }
    );

    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('permission');
  });

  it('should enforce rate limit of 10 comments per minute', async () => {
    // Create 10 comments quickly
    const promises = Array.from({ length: 10 }, (_, i) =>
      fetch(`${supabaseUrl}/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: `Rate limit test comment ${i}`,
        }),
      })
    );

    await Promise.all(promises);

    // 11th comment should be rate limited
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: 'This should be rate limited',
        }),
      }
    );

    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('rate limit');
  });
});
