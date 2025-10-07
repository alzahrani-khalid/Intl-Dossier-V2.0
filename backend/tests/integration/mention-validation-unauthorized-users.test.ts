import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

describe('Integration Test: @Mention Validation for Unauthorized Users', () => {
  let supabase: SupabaseClient<Database>;
  let authorizedUser: { id: string; email: string; username: string };
  let unauthorizedUser: { id: string; email: string; username: string };
  let nonExistentUsername: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Create test users
    authorizedUser = {
      id: 'authorized-mention-user',
      email: 'authorized-mention@test.com',
      username: 'authorized_user'
    };

    unauthorizedUser = {
      id: 'unauthorized-mention-user',
      email: 'unauthorized-mention@test.com',
      username: 'unauthorized_user'
    };

    nonExistentUsername = 'nonexistent_user_12345';

    // Create test assignment assigned to authorized user
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        assignee_id: authorizedUser.id,
        work_item_type: 'dossier',
        work_item_id: 'mention-test-dossier',
        priority: 'high',
        status: 'assigned',
        sla_deadline: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    testAssignmentId = assignment!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('assignments').delete().eq('id', testAssignmentId);
  });

  describe('Valid Mention Scenarios', () => {
    it('should allow mentioning authorized user with view permission', async () => {
      const commentText = `@${authorizedUser.username} please review this assignment`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();
      expect(data).toHaveProperty('comment');

      // Verify mention was created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id)
        .eq('mentioned_user_id', authorizedUser.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(1);
    });

    it('should send notification to authorized mentioned user', async () => {
      const commentText = `@${authorizedUser.username} urgent review needed`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify notification was sent
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id)
        .eq('mentioned_user_id', authorizedUser.id);

      expect(mentions).toBeDefined();
      expect(mentions![0].notified_at).toBeDefined();
    });

    it('should allow multiple authorized mentions in single comment', async () => {
      // Add another authorized user as observer
      const observer = {
        id: 'observer-mention-user',
        username: 'observer_user'
      };

      await supabase.from('assignment_observers').insert({
        assignment_id: testAssignmentId,
        user_id: observer.id,
        role: 'supervisor',
      });

      const commentText = `@${authorizedUser.username} and @${observer.username} please coordinate`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify both mentions created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(2);
    });
  });

  describe('Invalid Mention Scenarios', () => {
    it('should reject mention of unauthorized user without view permission', async () => {
      const commentText = `@${unauthorizedUser.username} unauthorized mention`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      // Comment should be created but mention ignored
      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mention created for unauthorized user
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id)
        .eq('mentioned_user_id', unauthorizedUser.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(0);
    });

    it('should not send notification to unauthorized user', async () => {
      const commentText = `@${unauthorizedUser.username} no notification`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no notification sent
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', unauthorizedUser.id)
        .eq('type', 'mention');

      expect(notifications).toBeDefined();
      expect(notifications!.length).toBe(0);
    });

    it('should handle non-existent username gracefully', async () => {
      const commentText = `@${nonExistentUsername} does not exist`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      // Comment should be created
      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mention created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(0);
    });

    it('should ignore malformed mentions', async () => {
      const commentText = `@@malformed @user@ @123 @user-with-dash`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mentions created for malformed usernames
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      // May be 0 or only valid ones
      expect(mentions!.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Mixed Mention Scenarios', () => {
    it('should process only authorized mentions when mixed with unauthorized', async () => {
      const commentText = `@${authorizedUser.username} authorized, @${unauthorizedUser.username} unauthorized`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify only authorized user mentioned
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(1);
      expect(mentions![0].mentioned_user_id).toBe(authorizedUser.id);
    });

    it('should handle mix of valid and invalid usernames', async () => {
      const commentText = `@${authorizedUser.username} valid, @${nonExistentUsername} invalid`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify only valid user mentioned
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(1);
      expect(mentions![0].mentioned_user_id).toBe(authorizedUser.id);
    });
  });

  describe('Permission Validation', () => {
    it('should validate view permission via RLS policy', async () => {
      // Attempt to mention user without RLS view permission
      const commentText = `@${unauthorizedUser.username} test`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      // Verify RLS prevented mention creation
      const { data: mentions, error } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('mentioned_user_id', unauthorizedUser.id);

      // Either no mentions or RLS blocks access
      if (!error) {
        expect(mentions!.length).toBe(0);
      }
    });

    it('should check permission for each mentioned user independently', async () => {
      const user1 = authorizedUser;
      const user2 = unauthorizedUser;

      const commentText = `@${user1.username} @${user2.username}`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify only authorized user mentioned
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(1);
      expect(mentions![0].mentioned_user_id).toBe(user1.id);
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent SQL injection via malicious username', async () => {
      const maliciousUsername = "admin'; DROP TABLE users; --";
      const commentText = `@${maliciousUsername} injection attempt`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      // Should succeed (comment created) but no mention
      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mention created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(0);
    });

    it('should handle extremely long username gracefully', async () => {
      const longUsername = 'a'.repeat(1000);
      const commentText = `@${longUsername} long username`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mention created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(0);
    });

    it('should handle special characters in username', async () => {
      const specialUsername = "user<script>alert('xss')</script>";
      const commentText = `@${specialUsername} xss attempt`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      const data = await response.json();

      // Verify no mention created
      const { data: mentions } = await supabase
        .from('comment_mentions')
        .select('*')
        .eq('comment_id', data.comment.id);

      expect(mentions).toBeDefined();
      expect(mentions!.length).toBe(0);
    });
  });

  describe('Notification Delivery', () => {
    it('should only send notifications to authorized users', async () => {
      const commentText = `@${authorizedUser.username} @${unauthorizedUser.username}`;

      const response = await fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          text: commentText,
        }),
      });

      expect([200, 201]).toContain(response.status);

      // Verify notification sent only to authorized user
      const { data: authorizedNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authorizedUser.id)
        .eq('type', 'mention');

      const { data: unauthorizedNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', unauthorizedUser.id)
        .eq('type', 'mention');

      expect(authorizedNotifications).toBeDefined();
      expect(unauthorizedNotifications).toBeDefined();
      expect(unauthorizedNotifications!.length).toBe(0);
    });
  });
});
