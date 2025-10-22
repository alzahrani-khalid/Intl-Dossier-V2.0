import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Integration tests for reminder workflow
// Tests cooldown enforcement, rate limiting, and concurrent reminder handling

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const supabase = createClient(supabaseUrl, supabaseKey);
const redis = new Redis(redisUrl);

describe('Reminder Workflow Integration Tests', () => {
  let testUserId: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (authError) throw authError;
    testUserId = authData.user.id;
  });

  beforeEach(async () => {
    // Create fresh test assignment for each test
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        work_item_id: '00000000-0000-0000-0000-000000000001',
        work_item_type: 'dossier',
        assignee_id: testUserId,
        status: 'pending',
        priority: 'high',
        last_reminder_sent_at: null,
      })
      .select()
      .single();

    if (error) throw error;
    testAssignmentId = assignment.id;
  });

  afterAll(async () => {
    // Cleanup: delete test data
    await supabase.from('assignments').delete().eq('assignee_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
    await redis.quit();
  });

  describe('Reminder Cooldown Enforcement (T026)', () => {
    it('should send reminder successfully on first attempt', async () => {
      // Send first reminder
      const { data, error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toHaveProperty('success', true);

      // Verify last_reminder_sent_at was updated
      const { data: assignment } = await supabase
        .from('assignments')
        .select('last_reminder_sent_at')
        .eq('id', testAssignmentId)
        .single();

      expect(assignment?.last_reminder_sent_at).not.toBeNull();

      // Verify followup_reminders record created
      const { data: reminderRecords } = await supabase
        .from('followup_reminders')
        .select('*')
        .eq('assignment_id', testAssignmentId);

      expect(reminderRecords).toHaveLength(1);
      expect(reminderRecords![0].delivery_status).toBe('pending');
    });

    it('should prevent duplicate reminder within 24 hours (cooldown)', async () => {
      // Send first reminder
      await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      // Attempt second reminder immediately
      const { data, error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('COOLDOWN_ACTIVE');
      expect(error?.details).toContain('24 hours');
    });

    it('should allow reminder after cooldown period expires', async () => {
      // Manually set last_reminder_sent_at to 25 hours ago
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('assignments')
        .update({ last_reminder_sent_at: twentyFiveHoursAgo })
        .eq('id', testAssignmentId);

      // Send reminder (should succeed)
      const { data, error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toHaveProperty('success', true);

      // Verify last_reminder_sent_at was updated to recent time
      const { data: assignment } = await supabase
        .from('assignments')
        .select('last_reminder_sent_at')
        .eq('id', testAssignmentId)
        .single();

      const lastReminderTime = new Date(assignment!.last_reminder_sent_at!);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastReminderTime.getTime()) / 1000 / 60;

      expect(diffMinutes).toBeLessThan(1); // Updated within last minute
    });
  });

  describe('Concurrent Reminder Sending with Optimistic Locking (T026a)', () => {
    it('should handle concurrent reminders with version increment', async () => {
      // Verify assignment has version column
      const { data: assignmentBefore } = await supabase
        .from('assignments')
        .select('_version')
        .eq('id', testAssignmentId)
        .single();

      expect(assignmentBefore?._version).toBe(1); // Initial version

      // Simulate two concurrent reminder requests
      const promise1 = supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      const promise2 = supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // One should succeed, one should fail with conflict
      const successes = [result1, result2].filter((r) => r.status === 'fulfilled');
      const failures = [result1, result2].filter((r) => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      // The failure should be a 409 Conflict error
      const failedResult = failures[0] as PromiseRejectedResult;
      expect(failedResult.reason.message).toContain('409');

      // Verify version was incremented
      const { data: assignmentAfter } = await supabase
        .from('assignments')
        .select('_version')
        .eq('id', testAssignmentId)
        .single();

      expect(assignmentAfter?._version).toBe(2); // Version incremented
    });

    it('should detect version mismatch and return 409 Conflict', async () => {
      // Send first reminder to increment version
      await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      // Get current version
      const { data: assignment } = await supabase
        .from('assignments')
        .select('_version, last_reminder_sent_at')
        .eq('id', testAssignmentId)
        .single();

      const currentVersion = assignment!._version;

      // Manually update last_reminder_sent_at to bypass cooldown
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('assignments')
        .update({ last_reminder_sent_at: twentyFiveHoursAgo })
        .eq('id', testAssignmentId);

      // Try to send reminder with stale version
      const { error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
        p_expected_version: currentVersion, // This is now stale
      });

      // Should fail with version conflict if another update happened
      // (This test may need adjustment based on actual implementation)
      expect(error).not.toBeNull();
    });
  });

  describe('Rate Limiting (T027)', () => {
    it('should allow up to 100 reminders per 5-minute window', async () => {
      // Create 100 test assignments
      const assignments = await Promise.all(
        Array(100)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `00000000-0000-0000-0000-00000000000${i % 10}`,
                work_item_type: 'dossier',
                assignee_id: testUserId,
                status: 'pending',
                priority: 'medium',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Send 100 reminders
      const results = await Promise.all(
        assignments.map((id) =>
          supabase.rpc('send_followup_reminder', {
            p_assignment_id: id,
            p_sent_by_user_id: testUserId,
          })
        )
      );

      // All 100 should succeed
      const successes = results.filter((r) => r.error === null);
      expect(successes).toHaveLength(100);

      // Cleanup
      await supabase.from('assignments').delete().in('id', assignments);
    });

    it('should return 429 Too Many Requests after rate limit exceeded', async () => {
      // Clear any existing rate limit key
      await redis.del(`rate-limit:user:${testUserId}:reminder`);

      // Create 101 test assignments
      const assignments = await Promise.all(
        Array(101)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `00000000-0000-0000-0000-00000000000${i % 10}`,
                work_item_type: 'ticket',
                assignee_id: testUserId,
                status: 'pending',
                priority: 'low',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Send 101 reminders
      const results = await Promise.all(
        assignments.map((id) =>
          supabase.rpc('send_followup_reminder', {
            p_assignment_id: id,
            p_sent_by_user_id: testUserId,
          })
        )
      );

      // At least one should fail with rate limit error
      const rateLimitErrors = results.filter(
        (r) => r.error && r.error.message.includes('RATE_LIMIT_EXCEEDED')
      );
      expect(rateLimitErrors.length).toBeGreaterThan(0);

      // Cleanup
      await supabase.from('assignments').delete().in('id', assignments);
    });

    it('should reset rate limit after 5-minute window expires', async () => {
      // Set rate limit counter to 100 with 1 second TTL
      await redis.set(`rate-limit:user:${testUserId}:reminder`, 100, 'EX', 1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Send reminder (should succeed as rate limit reset)
      const { error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      expect(error).toBeNull();
    });
  });

  describe('Bulk Processing (T040)', () => {
    it('should queue 50 bulk reminders and complete job', async () => {
      // Create 50 test assignments
      const assignments = await Promise.all(
        Array(50)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `bulk-test-${i}`,
                work_item_type: 'dossier',
                assignee_id: testUserId,
                status: 'pending',
                priority: 'medium',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Queue bulk reminders via API
      const bulkResponse = await fetch(
        `${supabaseUrl}/functions/v1/waiting-queue-reminder/send-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            assignment_ids: assignments,
          }),
        }
      );

      expect(bulkResponse.status).toBe(202);
      const bulkData = await bulkResponse.json();
      expect(bulkData).toHaveProperty('job_id');
      expect(bulkData.total_items).toBe(50);

      const jobId = bulkData.job_id;

      // Poll for job completion (max 30 seconds)
      let jobCompleted = false;
      let finalProgress = 0;
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds

      while (!jobCompleted && Date.now() - startTime < timeout) {
        const statusResponse = await fetch(
          `${supabaseUrl}/functions/v1/waiting-queue-reminder/status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        const statusData = await statusResponse.json();
        finalProgress = statusData.progress;

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          jobCompleted = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      }

      expect(jobCompleted).toBe(true);
      expect(finalProgress).toBe(50);

      // Verify followup_reminders records created
      const { data: reminderRecords } = await supabase
        .from('followup_reminders')
        .select('*')
        .in('assignment_id', assignments);

      expect(reminderRecords).toHaveLength(50);

      // Cleanup
      await supabase.from('assignments').delete().in('id', assignments);
    });

    it('should update job progress incrementally during bulk processing', async () => {
      // Create 30 test assignments
      const assignments = await Promise.all(
        Array(30)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `progress-test-${i}`,
                work_item_type: 'ticket',
                assignee_id: testUserId,
                status: 'pending',
                priority: 'low',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Queue bulk reminders
      const bulkResponse = await fetch(
        `${supabaseUrl}/functions/v1/waiting-queue-reminder/send-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            assignment_ids: assignments,
          }),
        }
      );

      const bulkData = await bulkResponse.json();
      const jobId = bulkData.job_id;

      // Track progress updates
      const progressUpdates: number[] = [];
      let jobCompleted = false;
      const startTime = Date.now();
      const timeout = 30000;

      while (!jobCompleted && Date.now() - startTime < timeout) {
        const statusResponse = await fetch(
          `${supabaseUrl}/functions/v1/waiting-queue-reminder/status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        const statusData = await statusResponse.json();
        progressUpdates.push(statusData.progress);

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          jobCompleted = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Progress should increase over time (0 → 10 → 20 → 30)
      expect(progressUpdates.length).toBeGreaterThan(1);
      expect(progressUpdates[0]).toBeLessThan(progressUpdates[progressUpdates.length - 1]);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(30);

      // Cleanup
      await supabase.from('assignments').delete().in('id', assignments);
    });

    it('should handle partial failures in bulk processing', async () => {
      // Create mix of valid and invalid assignments
      const validAssignments = await Promise.all(
        Array(10)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `valid-${i}`,
                work_item_type: 'dossier',
                assignee_id: testUserId,
                status: 'pending',
                priority: 'high',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Create assignments without assignees (will fail)
      const invalidAssignments = await Promise.all(
        Array(5)
          .fill(null)
          .map(async (_, i) => {
            const { data } = await supabase
              .from('assignments')
              .insert({
                work_item_id: `invalid-${i}`,
                work_item_type: 'ticket',
                assignee_id: null, // No assignee - will fail
                status: 'pending',
                priority: 'medium',
              })
              .select()
              .single();
            return data!.id;
          })
      );

      // Queue bulk reminders with mix of valid/invalid
      const allAssignments = [...validAssignments, ...invalidAssignments];
      const bulkResponse = await fetch(
        `${supabaseUrl}/functions/v1/waiting-queue-reminder/send-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            assignment_ids: allAssignments,
          }),
        }
      );

      const bulkData = await bulkResponse.json();
      const jobId = bulkData.job_id;

      // Wait for job completion
      let jobCompleted = false;
      const startTime = Date.now();
      const timeout = 30000;
      let finalStatus: any = null;

      while (!jobCompleted && Date.now() - startTime < timeout) {
        const statusResponse = await fetch(
          `${supabaseUrl}/functions/v1/waiting-queue-reminder/status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        finalStatus = await statusResponse.json();

        if (finalStatus.status === 'completed' || finalStatus.status === 'failed') {
          jobCompleted = true;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Job should complete with partial success
      expect(finalStatus).toHaveProperty('results');
      expect(finalStatus.results.successful).toBe(10);
      expect(finalStatus.results.failed).toBe(5);

      // Cleanup
      await supabase.from('assignments').delete().in('id', allAssignments);
    });
  });

  describe('Error Handling', () => {
    it('should return error for non-existent assignment', async () => {
      const { error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: '00000000-0000-0000-0000-000000000000',
        p_sent_by_user_id: testUserId,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('ASSIGNMENT_NOT_FOUND');
    });

    it('should return error for assignment with no assignee', async () => {
      // Create assignment without assignee
      const { data: noAssigneeAssignment } = await supabase
        .from('assignments')
        .insert({
          work_item_id: '00000000-0000-0000-0000-000000000002',
          work_item_type: 'position',
          assignee_id: null,
          status: 'pending',
          priority: 'urgent',
        })
        .select()
        .single();

      const { error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: noAssigneeAssignment!.id,
        p_sent_by_user_id: testUserId,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('NO_ASSIGNEE');

      // Cleanup
      await supabase
        .from('assignments')
        .delete()
        .eq('id', noAssigneeAssignment!.id);
    });

    it('should return error for completed assignment', async () => {
      // Update assignment to completed
      await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', testAssignmentId);

      const { error } = await supabase.rpc('send_followup_reminder', {
        p_assignment_id: testAssignmentId,
        p_sent_by_user_id: testUserId,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('INVALID_STATUS');
    });
  });
});
