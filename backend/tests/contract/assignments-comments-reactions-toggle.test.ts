/**
 * Contract Test: POST /assignments-comments-reactions-toggle
 * Feature: 014-full-assignment-detail
 *
 * Verifies:
 * - Toggle behavior (add/remove reaction)
 * - Emoji validation
 * - 200/400/403 responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const VALID_EMOJIS = ['👍', '✅', '❓', '❤️', '🎯', '💡'];

describe('POST /assignments-comments-reactions-toggle', () => {
  let supabase: ReturnType<typeof createClient>;
  let testAssignmentId: string;
  let testCommentId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    if (userError) throw userError;
    testUserId = userData.user!.id;
    authToken = userData.session!.access_token;

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

    const { data: comment } = await supabase
      .from('assignment_comments')
      .insert({
        assignment_id: testAssignmentId,
        user_id: testUserId,
        text: 'Test comment',
      })
      .select('id')
      .single();
    testCommentId = comment!.id;
  });

  afterAll(async () => {
    await supabase.from('comment_reactions').delete().eq('comment_id', testCommentId);
    await supabase.from('assignment_comments').delete().eq('id', testCommentId);
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  it('should return 200 and add reaction when not existing', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-reactions-toggle`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: testCommentId,
          emoji: '👍',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('action');
    expect(data).toHaveProperty('reaction');
    expect(data.action).toBe('added');
    expect(data.reaction).toHaveProperty('emoji');
    expect(data.reaction.emoji).toBe('👍');
    expect(data.reaction).toHaveProperty('count');
    expect(data.reaction.count).toBeGreaterThanOrEqual(1);
  });

  it('should return 200 and remove reaction when already exists', async () => {
    // First add the reaction
    await fetch(`${supabaseUrl}/functions/v1/assignments-comments-reactions-toggle`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment_id: testCommentId,
        emoji: '✅',
      }),
    });

    // Toggle again to remove
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-reactions-toggle`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: testCommentId,
          emoji: '✅',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.action).toBe('removed');
  });

  it('should return 400 for invalid emoji', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-reactions-toggle`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: testCommentId,
          emoji: '😊', // Not in allowed list
        }),
      }
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('Invalid emoji');
  });

  it('should return 403 when user does not have permission', async () => {
    const { data: otherUserData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });
    const otherAuthToken = otherUserData!.session!.access_token;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/assignments-comments-reactions-toggle`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: testCommentId,
          emoji: '👍',
        }),
      }
    );

    expect(response.status).toBe(403);
  });
});
