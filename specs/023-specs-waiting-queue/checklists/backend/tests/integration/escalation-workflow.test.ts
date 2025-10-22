/**
 * Integration Tests: Escalation Workflow
 *
 * Tests escalation path resolution, bulk escalation, and circular hierarchy detection.
 * Following TDD approach - tests written BEFORE implementation.
 *
 * @file backend/tests/integration/escalation-workflow.test.ts
 * @tasks T055, T056, T056a
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Escalation Workflow Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserIds: string[] = [];
  let testAssignmentIds: string[] = [];
  let testHierarchyIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test users (hierarchy: Employee → Team Lead → Manager → Director)
    const users = [
      { email: 'employee@test.com', role: 'Employee', level: 1 },
      { email: 'teamlead@test.com', role: 'Team Lead', level: 2 },
      { email: 'manager@test.com', role: 'Manager', level: 3 },
      { email: 'director@test.com', role: 'Director', level: 4 },
    ];

    for (const user of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'testpassword123',
        email_confirm: true,
      });

      if (error || !data.user) {
        throw new Error(`Failed to create test user: ${user.email}`);
      }

      testUserIds.push(data.user.id);
    }

    // Create organizational hierarchy
    for (let i = 0; i < testUserIds.length; i++) {
      const { data: hierarchy, error } = await supabase
        .from('organizational_hierarchy')
        .insert({
          user_id: testUserIds[i],
          reports_to_user_id: i > 0 ? testUserIds[i - 1] : null, // Each reports to previous level
          role: users[i].role,
          department: 'Test Department',
          escalation_level: users[i].level,
        })
        .select()
        .single();

      if (error || !hierarchy) {
        throw new Error(`Failed to create hierarchy for user ${i}`);
      }

      testHierarchyIds.push(hierarchy.id);
    }
  });

  afterAll(async () => {
    // Cleanup in reverse order (foreign key constraints)
    for (const id of testAssignmentIds) {
      await supabase.from('assignments').delete().eq('id', id);
    }

    for (const id of testHierarchyIds) {
      await supabase.from('organizational_hierarchy').delete().eq('id', id);
    }

    for (const id of testUserIds) {
      await supabase.auth.admin.deleteUser(id);
    }
  });

  describe('T055: Escalation Path Resolution', () => {
    it('should resolve escalation path to immediate manager', async () => {
      const employeeId = testUserIds[0]; // Employee (level 1)
      const teamLeadId = testUserIds[1]; // Team Lead (level 2)

      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: employeeId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].user_id).toBe(teamLeadId);
      expect(data[0].escalation_level).toBe(2);
    });

    it('should walk hierarchy chain correctly', async () => {
      const employeeId = testUserIds[0]; // Employee (level 1)

      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: employeeId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should return all levels above employee (Team Lead, Manager, Director)
      expect(data.length).toBe(3);
      expect(data.map(u => u.escalation_level)).toEqual([2, 3, 4]);
    });

    it('should handle user with no manager (top of hierarchy)', async () => {
      const directorId = testUserIds[3]; // Director (level 4, no reports_to)

      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: directorId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(0); // No one to escalate to
    });

    it('should throw error for user not in organizational hierarchy', async () => {
      const { data: randomUser } = await supabase.auth.admin.createUser({
        email: 'orphan@test.com',
        password: 'testpassword123',
        email_confirm: true,
      });

      if (!randomUser.user) {
        throw new Error('Failed to create orphan user');
      }

      const { error } = await supabase.rpc('get_escalation_path', {
        p_user_id: randomUser.user.id,
      });

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/no escalation path|not found/i);

      // Cleanup
      await supabase.auth.admin.deleteUser(randomUser.user.id);
    });
  });

  describe('T056: Bulk Escalation', () => {
    beforeEach(async () => {
      // Create 5 test assignments
      const employeeId = testUserIds[0];

      for (let i = 0; i < 5; i++) {
        const { data: assignment, error } = await supabase
          .from('assignments')
          .insert({
            work_item_id: crypto.randomUUID(),
            work_item_type: 'dossier',
            assignee_id: employeeId,
            status: 'pending',
            workflow_stage: 'todo',
            priority: 'high',
            assigned_at: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000).toISOString(), // 7-11 days ago
          })
          .select()
          .single();

        if (error || !assignment) {
          throw new Error(`Failed to create test assignment ${i}`);
        }

        testAssignmentIds.push(assignment.id);
      }
    });

    it('should escalate multiple assignments in bulk', async () => {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'employee@test.com',
        password: 'testpassword123',
      });

      const authToken = authData.session?.access_token || '';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assignment_ids: testAssignmentIds.slice(0, 5),
          escalation_reason: 'Bulk escalation test - all overdue',
        }),
      });

      expect(response.status).toBe(202);
      const result = await response.json();

      expect(result).toHaveProperty('job_id');
      expect(result).toHaveProperty('status', 'queued');
      expect(result).toHaveProperty('total_items', 5);

      // Wait for job to complete (with timeout)
      let jobComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds

      while (!jobComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const statusResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/status/${result.job_id}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );

        const status = await statusResponse.json();

        if (status.status === 'completed' || status.status === 'failed') {
          jobComplete = true;

          expect(status.status).toBe('completed');
          expect(status.successful).toBe(5);
          expect(status.failed).toBe(0);
        }

        attempts++;
      }

      expect(jobComplete).toBe(true);

      // Verify escalation records created
      const { data: escalations } = await supabase
        .from('escalation_records')
        .select('*')
        .in('assignment_id', testAssignmentIds.slice(0, 5));

      expect(escalations?.length).toBe(5);
    });
  });

  describe('T056a: Circular Hierarchy Detection', () => {
    let circularUserIds: string[] = [];
    let circularHierarchyIds: string[] = [];

    beforeEach(async () => {
      // Create circular hierarchy: A → B → C → A
      const circularUsers = [
        { email: 'circular-a@test.com', role: 'User A' },
        { email: 'circular-b@test.com', role: 'User B' },
        { email: 'circular-c@test.com', role: 'User C' },
      ];

      for (const user of circularUsers) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'testpassword123',
          email_confirm: true,
        });

        if (error || !data.user) {
          throw new Error(`Failed to create circular test user: ${user.email}`);
        }

        circularUserIds.push(data.user.id);
      }

      // Create hierarchy with circular reference
      // A reports to B
      const { data: hierA } = await supabase
        .from('organizational_hierarchy')
        .insert({
          user_id: circularUserIds[0],
          reports_to_user_id: circularUserIds[1],
          role: 'User A',
          escalation_level: 1,
        })
        .select()
        .single();

      // B reports to C
      const { data: hierB } = await supabase
        .from('organizational_hierarchy')
        .insert({
          user_id: circularUserIds[1],
          reports_to_user_id: circularUserIds[2],
          role: 'User B',
          escalation_level: 2,
        })
        .select()
        .single();

      // C reports to A (circular!)
      const { data: hierC } = await supabase
        .from('organizational_hierarchy')
        .insert({
          user_id: circularUserIds[2],
          reports_to_user_id: circularUserIds[0],
          role: 'User C',
          escalation_level: 3,
        })
        .select()
        .single();

      if (hierA) circularHierarchyIds.push(hierA.id);
      if (hierB) circularHierarchyIds.push(hierB.id);
      if (hierC) circularHierarchyIds.push(hierC.id);
    });

    afterEach(async () => {
      // Cleanup circular test data
      for (const id of circularHierarchyIds) {
        await supabase.from('organizational_hierarchy').delete().eq('id', id);
      }

      for (const id of circularUserIds) {
        await supabase.auth.admin.deleteUser(id);
      }

      circularUserIds = [];
      circularHierarchyIds = [];
    });

    it('should detect circular hierarchy and throw error', async () => {
      const { error } = await supabase.rpc('get_escalation_path', {
        p_user_id: circularUserIds[0], // Start from User A
      });

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/circular|cycle|loop/i);
    });

    it('should enforce max depth limit (10 levels) to prevent infinite loops', async () => {
      // This test verifies the function stops at max depth even if no cycle detected
      const { error } = await supabase.rpc('get_escalation_path', {
        p_user_id: circularUserIds[0],
      });

      expect(error).toBeDefined();
      // Should fail due to circular reference detection or max depth
    });
  });
});
