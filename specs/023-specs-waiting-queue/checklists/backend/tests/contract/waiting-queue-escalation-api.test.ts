/**
 * Contract Tests: Waiting Queue Escalation API
 *
 * Tests the request/response schemas and error codes for escalation endpoints.
 * Following TDD approach - tests written BEFORE implementation.
 *
 * @file backend/tests/contract/waiting-queue-escalation-api.test.ts
 * @task T054
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Escalation API Contract Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let testAssignmentId: string;
  let testEscalationId: string;
  let authToken: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.user) {
      throw new Error('Failed to authenticate test user');
    }

    testUserId = authData.user.id;
    authToken = authData.session?.access_token || '';

    // Create test assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        work_item_id: crypto.randomUUID(),
        work_item_type: 'dossier',
        assignee_id: testUserId,
        status: 'pending',
        workflow_stage: 'todo',
        priority: 'high',
        assigned_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      })
      .select()
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Failed to create test assignment');
    }

    testAssignmentId = assignment.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testEscalationId) {
      await supabase.from('escalation_records').delete().eq('id', testEscalationId);
    }
    if (testAssignmentId) {
      await supabase.from('assignments').delete().eq('id', testAssignmentId);
    }
  });

  describe('POST /escalate', () => {
    it('should validate request schema - required fields', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('assignment_id');
    });

    it('should return 200 with valid escalation record structure', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          escalation_reason: 'Assignment overdue by 10 days',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Validate response schema
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('assignment_id', testAssignmentId);
      expect(data).toHaveProperty('escalated_by', testUserId);
      expect(data).toHaveProperty('escalated_to');
      expect(data).toHaveProperty('escalation_reason', 'Assignment overdue by 10 days');
      expect(data).toHaveProperty('escalated_at');
      expect(data).toHaveProperty('status', 'pending');

      testEscalationId = data.id;
    });
  });

  describe('POST /escalate-bulk', () => {
    it('should return 202 with job_id for bulk escalation', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assignment_ids: [testAssignmentId],
          escalation_reason: 'Bulk escalation test',
        }),
      });

      expect(response.status).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty('job_id');
      expect(typeof data.job_id).toBe('string');
    });
  });
});
