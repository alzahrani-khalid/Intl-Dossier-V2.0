/**
 * Integration Test: Escalation Workflow
 * Feature: User Story 4 - Assignment Escalation (023-specs-waiting-queue)
 * Purpose: Test escalation path resolution, bulk escalation, and circular hierarchy detection
 *
 * Tests:
 * - T055: Escalation path resolution - Walk hierarchy, find manager, handle no path error
 * - T056: Bulk escalation - Escalate 5 assignments, verify all records created
 * - T056a: Circular hierarchy detection - Seed cycle (A→B→C→A), attempt escalation, verify error
 *
 * Dependencies:
 * - organizational_hierarchy table with valid data
 * - get_escalation_path PostgreSQL function
 * - escalation.service.ts with resolveEscalationPath()
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Escalation Workflow Integration Tests', () => {
  let supabase: SupabaseClient;
  let authToken: string;
  let testUserIds: string[] = [];
  let testAssignmentIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.session) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    authToken = authData.session.access_token;
  });

  afterAll(async () => {
    // Cleanup all test data
    if (testAssignmentIds.length > 0) {
      await supabase.from('assignments').delete().in('id', testAssignmentIds);
    }
    if (testUserIds.length > 0) {
      await supabase.from('organizational_hierarchy').delete().in('user_id', testUserIds);
      await supabase.from('profiles').delete().in('id', testUserIds);
    }
  });

  describe('T055: Escalation Path Resolution', () => {
    let analystId: string;
    let teamLeadId: string;
    let divisionManagerId: string;
    let assignmentId: string;

    beforeAll(async () => {
      // Create 3-level hierarchy: Analyst → Team Lead → Division Manager
      // Division Manager (top level)
      const { data: manager } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Division Manager',
          email: 'division.manager@test.com',
          role: 'manager',
        })
        .select()
        .single();
      divisionManagerId = manager?.id || '';
      testUserIds.push(divisionManagerId);

      // Team Lead (reports to Division Manager)
      const { data: teamLead } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Team Lead',
          email: 'team.lead@test.com',
          role: 'lead',
        })
        .select()
        .single();
      teamLeadId = teamLead?.id || '';
      testUserIds.push(teamLeadId);

      await supabase.from('organizational_hierarchy').insert({
        user_id: teamLeadId,
        reports_to_id: divisionManagerId,
        position_title: 'Team Lead',
        department: 'Analytics',
      });

      // Analyst (reports to Team Lead)
      const { data: analyst } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Test Analyst',
          email: 'test.analyst@test.com',
          role: 'analyst',
        })
        .select()
        .single();
      analystId = analyst?.id || '';
      testUserIds.push(analystId);

      await supabase.from('organizational_hierarchy').insert({
        user_id: analystId,
        reports_to_id: teamLeadId,
        position_title: 'Analyst',
        department: 'Analytics',
      });

      // Create assignment for analyst
      const { data: assignment } = await supabase
        .from('assignments')
        .insert({
          work_item_id: '00000000-0000-0000-0000-000000000010',
          work_item_type: 'dossier',
          assignee_id: analystId,
          status: 'pending',
          workflow_stage: 'review',
          assigned_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
        })
        .select()
        .single();
      assignmentId = assignment?.id || '';
      testAssignmentIds.push(assignmentId);
    });

    it('should walk hierarchy and find immediate manager (Team Lead)', async () => {
      // Call PostgreSQL function to get escalation path
      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: analystId,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // First in path should be immediate manager (Team Lead)
      expect(data[0].user_id).toBe(teamLeadId);
      expect(data[0].position_title).toBe('Team Lead');
    });

    it('should return full escalation path (Team Lead → Division Manager)', async () => {
      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: analystId,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data.length).toBe(2); // Team Lead + Division Manager

      // Verify path order
      expect(data[0].user_id).toBe(teamLeadId);
      expect(data[1].user_id).toBe(divisionManagerId);
    });

    it('should handle user with no manager (returns empty path)', async () => {
      // Division Manager has no reports_to_id
      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: divisionManagerId,
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0); // No manager above Division Manager
    });

    it('should escalate assignment to immediate manager via API', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            assignment_id: assignmentId,
            reason: 'Assignment overdue for 8 days',
          }),
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.escalated_to_id).toBe(teamLeadId);
      expect(result.escalated_to_name).toBe('Team Lead');

      // Verify escalation record created in database
      const { data: escalation } = await supabase
        .from('escalation_records')
        .select('*')
        .eq('id', result.escalation_id)
        .single();

      expect(escalation).not.toBeNull();
      expect(escalation?.assignment_id).toBe(assignmentId);
      expect(escalation?.escalated_to_id).toBe(teamLeadId);
      expect(escalation?.reason).toBe('Assignment overdue for 8 days');
      expect(escalation?.status).toBe('pending');
    });

    it('should throw NO_ESCALATION_PATH error when user has no hierarchy', async () => {
      // Create user with no organizational_hierarchy entry
      const { data: orphanUser } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Orphan User',
          email: 'orphan.user@test.com',
          role: 'analyst',
        })
        .select()
        .single();
      testUserIds.push(orphanUser?.id || '');

      const { data: orphanAssignment } = await supabase
        .from('assignments')
        .insert({
          work_item_id: '00000000-0000-0000-0000-000000000011',
          work_item_type: 'dossier',
          assignee_id: orphanUser?.id,
          status: 'pending',
          workflow_stage: 'review',
          assigned_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
        })
        .select()
        .single();
      testAssignmentIds.push(orphanAssignment?.id || '');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            assignment_id: orphanAssignment?.id,
            reason: 'Testing no escalation path',
          }),
        }
      );

      expect(response.status).toBe(400);

      const error = await response.json();
      expect(error.error).toBe('NO_ESCALATION_PATH');
      expect(error.message).toMatch(/no escalation path|manager not found/i);
    });
  });

  describe('T056: Bulk Escalation', () => {
    let bulkAnalystId: string;
    let bulkManagerId: string;
    let bulkAssignmentIds: string[] = [];

    beforeAll(async () => {
      // Create manager
      const { data: manager } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Bulk Test Manager',
          email: 'bulk.manager@test.com',
          role: 'manager',
        })
        .select()
        .single();
      bulkManagerId = manager?.id || '';
      testUserIds.push(bulkManagerId);

      // Create analyst reporting to manager
      const { data: analyst } = await supabase
        .from('profiles')
        .insert({
          full_name: 'Bulk Test Analyst',
          email: 'bulk.analyst@test.com',
          role: 'analyst',
        })
        .select()
        .single();
      bulkAnalystId = analyst?.id || '';
      testUserIds.push(bulkAnalystId);

      await supabase.from('organizational_hierarchy').insert({
        user_id: bulkAnalystId,
        reports_to_id: bulkManagerId,
        position_title: 'Analyst',
        department: 'Testing',
      });

      // Create 5 test assignments
      const assignments = [];
      for (let i = 0; i < 5; i++) {
        assignments.push({
          work_item_id: `00000000-0000-0000-0000-0000000000${20 + i}`,
          work_item_type: 'dossier',
          assignee_id: bulkAnalystId,
          status: 'pending',
          workflow_stage: 'review',
          assigned_at: new Date(Date.now() - (7 + i) * 24 * 60 * 60 * 1000).toISOString(),
          priority: i % 2 === 0 ? 'high' : 'medium',
        });
      }

      const { data } = await supabase.from('assignments').insert(assignments).select();
      bulkAssignmentIds = data?.map((a) => a.id) || [];
      testAssignmentIds.push(...bulkAssignmentIds);
    });

    it('should escalate 5 assignments in bulk and verify all records created', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            assignment_ids: bulkAssignmentIds,
            reason: 'Bulk escalation test - all overdue',
          }),
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.job_id).toBeDefined();
      expect(result.total_items).toBe(5);

      // Poll job status until completion
      let jobStatus;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/status/${result.job_id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        jobStatus = await statusResponse.json();

        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      expect(jobStatus).toBeDefined();
      expect(jobStatus.status).toBe('completed');
      expect(jobStatus.successful_items).toBe(5);
      expect(jobStatus.failed_items).toBe(0);

      // Verify all 5 escalation records created
      const { data: escalations, count } = await supabase
        .from('escalation_records')
        .select('*', { count: 'exact' })
        .in('assignment_id', bulkAssignmentIds);

      expect(count).toBe(5);
      expect(escalations?.length).toBe(5);

      // Verify all escalated to same manager
      escalations?.forEach((escalation) => {
        expect(escalation.escalated_to_id).toBe(bulkManagerId);
        expect(escalation.reason).toBe('Bulk escalation test - all overdue');
        expect(escalation.status).toBe('pending');
      });
    });

    it('should handle partial failures in bulk escalation', async () => {
      // Mix valid and invalid assignment IDs
      const mixedIds = [
        bulkAssignmentIds[0], // valid
        '00000000-0000-0000-0000-000000000000', // invalid
        bulkAssignmentIds[1], // valid
      ];

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate-bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            assignment_ids: mixedIds,
            reason: 'Partial failure test',
          }),
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();

      // Poll for completion
      let jobStatus;
      let attempts = 0;
      while (attempts < 30) {
        const statusResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/status/${result.job_id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        jobStatus = await statusResponse.json();
        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      expect(jobStatus.status).toBe('completed');
      expect(jobStatus.successful_items).toBe(2); // 2 valid
      expect(jobStatus.failed_items).toBe(1); // 1 invalid

      // Verify results array shows failure reason
      const failedResult = jobStatus.results?.find((r: any) => !r.success);
      expect(failedResult).toBeDefined();
      expect(failedResult.error).toMatch(/not found/i);
    });
  });

  describe('T056a: Circular Hierarchy Detection', () => {
    let userA: string;
    let userB: string;
    let userC: string;
    let circularAssignmentId: string;

    beforeAll(async () => {
      // Create 3 users: A → B → C → A (circular)
      const { data: profileA } = await supabase
        .from('profiles')
        .insert({
          full_name: 'User A',
          email: 'user.a@test.com',
          role: 'analyst',
        })
        .select()
        .single();
      userA = profileA?.id || '';
      testUserIds.push(userA);

      const { data: profileB } = await supabase
        .from('profiles')
        .insert({
          full_name: 'User B',
          email: 'user.b@test.com',
          role: 'lead',
        })
        .select()
        .single();
      userB = profileB?.id || '';
      testUserIds.push(userB);

      const { data: profileC } = await supabase
        .from('profiles')
        .insert({
          full_name: 'User C',
          email: 'user.c@test.com',
          role: 'manager',
        })
        .select()
        .single();
      userC = profileC?.id || '';
      testUserIds.push(userC);

      // Create circular hierarchy: A → B → C → A
      await supabase.from('organizational_hierarchy').insert([
        { user_id: userA, reports_to_id: userB, position_title: 'Analyst', department: 'Test' },
        { user_id: userB, reports_to_id: userC, position_title: 'Lead', department: 'Test' },
        { user_id: userC, reports_to_id: userA, position_title: 'Manager', department: 'Test' }, // Circular!
      ]);

      // Create assignment for User A
      const { data: assignment } = await supabase
        .from('assignments')
        .insert({
          work_item_id: '00000000-0000-0000-0000-000000000030',
          work_item_type: 'dossier',
          assignee_id: userA,
          status: 'pending',
          workflow_stage: 'review',
          assigned_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
        })
        .select()
        .single();
      circularAssignmentId = assignment?.id || '';
      testAssignmentIds.push(circularAssignmentId);
    });

    it('should detect circular reference and throw error', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/waiting-queue-escalation/escalate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            assignment_id: circularAssignmentId,
            reason: 'Testing circular hierarchy',
          }),
        }
      );

      expect(response.status).toBe(400);

      const error = await response.json();
      expect(error.error).toMatch(/circular|cycle|loop/i);
      expect(error.message).toMatch(/circular reference detected|hierarchy contains cycle/i);
    });

    it('should enforce max depth limit (10 levels) to prevent infinite loops', async () => {
      // The get_escalation_path function should have max_depth = 10
      // Even if there's no cycle, it should stop at 10 levels
      const { data, error } = await supabase.rpc('get_escalation_path', {
        p_user_id: userA,
      });

      // Should either return error or empty array (depending on implementation)
      // Both are acceptable - either detect cycle or hit max depth
      if (error) {
        expect(error.message).toMatch(/circular|cycle|max depth|loop/i);
      } else {
        // If no error, should have stopped at max depth
        expect(data.length).toBeLessThanOrEqual(10);
      }
    });
  });
});
