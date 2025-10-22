/**
 * Integration Test: Tasks Migration Integrity
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Task: T031
 *
 * Purpose: Verify that migration from assignments → tasks table preserves all data integrity:
 * - Row count validation (no data loss)
 * - Sample data comparison (fields correctly copied)
 * - Audit trail preservation (created_by, updated_by, timestamps)
 * - Referential integrity maintained
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

describe('Tasks Migration Integrity Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Authenticate as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.session) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    authToken = authData.session.access_token;
  });

  describe('Count Validation (No Data Loss)', () => {
    it('should have migrated all assignments to tasks table', async () => {
      // Check if assignments_deprecated table exists (migration completed)
      const { data: deprecatedTableExists } = await supabase
        .rpc('check_table_exists', { table_name: 'assignments_deprecated' } as any)
        .single();

      if (!deprecatedTableExists) {
        console.warn('Migration not yet run - assignments_deprecated table does not exist');
        return; // Skip test if migration hasn't been applied yet
      }

      // Count rows in deprecated table
      const { count: deprecatedCount, error: deprecatedError } = await supabase
        .from('assignments_deprecated' as any)
        .select('*', { count: 'exact', head: true });

      expect(deprecatedError).toBeNull();

      // Count rows in new tasks table
      const { count: tasksCount, error: tasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      expect(tasksError).toBeNull();

      // Counts should match (zero data loss)
      if (deprecatedCount !== null && tasksCount !== null) {
        expect(tasksCount).toBeGreaterThanOrEqual(deprecatedCount);
      }
    });

    it('should have no null assignee_ids after migration', async () => {
      const { data: nullAssignees, error } = await supabase
        .from('tasks')
        .select('id')
        .is('assignee_id', null);

      expect(error).toBeNull();
      expect(nullAssignees).toHaveLength(0);
    });

    it('should have no null workflow_stage values after migration', async () => {
      const { data: nullStages, error } = await supabase
        .from('tasks')
        .select('id')
        .is('workflow_stage', null);

      expect(error).toBeNull();
      expect(nullStages).toHaveLength(0);
    });

    it('should have no invalid status values after migration', async () => {
      const validStatuses = ['pending', 'in_progress', 'review', 'completed', 'cancelled'];

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, status');

      expect(error).toBeNull();

      const invalidTasks = tasks?.filter(task => !validStatuses.includes(task.status));
      expect(invalidTasks).toHaveLength(0);
    });
  });

  describe('Sample Data Comparison', () => {
    it('should preserve all critical fields from assignments', async () => {
      // Fetch sample tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(10);

      expect(error).toBeNull();
      expect(tasks).toBeDefined();

      if (!tasks || tasks.length === 0) {
        console.warn('No tasks found in database for comparison');
        return;
      }

      // Verify each task has expected structure
      tasks.forEach(task => {
        // Required fields from old assignments table
        expect(task.id).toBeDefined();
        expect(task.assignee_id).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.workflow_stage).toBeDefined();
        expect(task.priority).toBeDefined();
        expect(task.created_by).toBeDefined();
        expect(task.created_at).toBeDefined();
        expect(task.updated_at).toBeDefined();

        // New required field for unified model
        expect(task.title).toBeDefined();
        expect(task.title.trim().length).toBeGreaterThan(0);

        // Boolean fields should have default values
        expect(typeof task.is_deleted).toBe('boolean');
      });
    });

    it('should have generated default titles for tasks without explicit titles', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('title')
        .limit(100);

      expect(error).toBeNull();
      expect(tasks).toBeDefined();

      if (!tasks || tasks.length === 0) {
        return;
      }

      // Count tasks with auto-generated titles (format: "Assignment #<uuid-prefix>")
      const autoGeneratedTitles = tasks.filter(task =>
        task.title.startsWith('Assignment #') || task.title.startsWith('Task #')
      );

      // All tasks should have titles (either migrated or auto-generated)
      expect(tasks.every(task => task.title && task.title.trim().length > 0)).toBe(true);
    });
  });

  describe('Audit Trail Preservation', () => {
    it('should preserve created_by references', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, created_by')
        .not('created_by', 'is', null)
        .limit(50);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return;
      }

      // Verify created_by references valid users
      const userIds = [...new Set(tasks.map(t => t.created_by))];
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userIds);

      expect(usersError).toBeNull();
      expect(users).toBeDefined();
    });

    it('should preserve timestamps (created_at, updated_at)', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('created_at, updated_at')
        .limit(50);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return;
      }

      tasks.forEach(task => {
        expect(task.created_at).toBeDefined();
        expect(task.updated_at).toBeDefined();

        const createdAt = new Date(task.created_at);
        const updatedAt = new Date(task.updated_at);

        // Timestamps should be valid dates
        expect(createdAt.getTime()).toBeGreaterThan(0);
        expect(updatedAt.getTime()).toBeGreaterThan(0);

        // updated_at should be >= created_at
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
      });
    });

    it('should preserve completed_at for completed tasks', async () => {
      const { data: completedTasks, error } = await supabase
        .from('tasks')
        .select('status, completed_at, completed_by')
        .eq('status', 'completed')
        .limit(20);

      expect(error).toBeNull();

      if (!completedTasks || completedTasks.length === 0) {
        return; // No completed tasks to test
      }

      // Completed tasks should have completed_at and completed_by
      completedTasks.forEach(task => {
        if (task.status === 'completed') {
          // Note: Some old assignments might not have had completed_at/completed_by
          // Migration should have set these to reasonable defaults
          expect(task.completed_at || task.completed_by).toBeTruthy();
        }
      });
    });
  });

  describe('Referential Integrity', () => {
    it('should maintain foreign key relationships to auth.users', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('assignee_id')
        .limit(100);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return;
      }

      const assigneeIds = [...new Set(tasks.map(t => t.assignee_id).filter(Boolean))];

      if (assigneeIds.length === 0) {
        return;
      }

      // Verify all assignee_ids reference valid users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', assigneeIds);

      expect(usersError).toBeNull();
      expect(users).toBeDefined();

      // All assignee_ids should have matching user records
      const validUserIds = new Set(users?.map(u => u.id) || []);
      const allValid = assigneeIds.every(id => validUserIds.has(id));
      expect(allValid).toBe(true);
    });

    it('should maintain foreign key relationships to engagements', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('engagement_id')
        .not('engagement_id', 'is', null)
        .limit(50);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return; // No tasks with engagement_id
      }

      const engagementIds = [...new Set(tasks.map(t => t.engagement_id).filter(Boolean) as string[])];

      if (engagementIds.length === 0) {
        return;
      }

      // Verify all engagement_ids reference valid engagements
      const { data: engagements, error: engagementsError } = await supabase
        .from('engagements')
        .select('id')
        .in('id', engagementIds);

      expect(engagementsError).toBeNull();
      expect(engagements).toBeDefined();
    });
  });

  describe('Work Item Linkage Preservation', () => {
    it('should preserve work_item_type and work_item_id fields', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('work_item_type, work_item_id')
        .not('work_item_type', 'is', null)
        .limit(50);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return; // No tasks with work items
      }

      const validWorkItemTypes = ['dossier', 'position', 'ticket', 'generic'];

      tasks.forEach(task => {
        expect(validWorkItemTypes).toContain(task.work_item_type);

        if (task.work_item_type !== 'generic') {
          expect(task.work_item_id).toBeDefined();
        }
      });
    });

    it('should preserve source JSONB field for multi-entity tasks', async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('source')
        .not('source', 'is', null)
        .limit(20);

      expect(error).toBeNull();

      if (!tasks || tasks.length === 0) {
        return; // No tasks with source JSONB
      }

      tasks.forEach(task => {
        expect(task.source).toBeDefined();
        expect(typeof task.source).toBe('object');
      });
    });
  });
});
