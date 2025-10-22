/**
 * Integration Test: Task Auto-Creation from Commitments (T045)
 *
 * Purpose: Verify automatic task creation when after-action is published
 * Tests: 5 commitments → 5 tasks with correct metadata
 *
 * This test should FAIL initially (TDD approach) before backend implementation
 *
 * Test Scenarios:
 * 1. Publish after-action with 5 commitments
 * 2. Verify exactly 5 tasks are created
 * 3. Verify each task has correct metadata (title, owner, due date, priority, source link)
 * 4. Verify tasks are linked to both after-action and dossier
 * 5. Verify task notifications are queued for owners
 * 6. Verify commitment status is updated to 'task_created'
 *
 * Reference: specs/022-after-action-structured/contracts/after-action-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1/after-action`;

interface TestContext {
  supabase: SupabaseClient;
  testUsers: Array<{
    id: string;
    email: string;
    token: string;
  }>;
  testDossierId: string;
  testEngagementId: string;
  createdAfterActionIds: string[];
  createdTaskIds: string[];
}

describe('Integration Test: Task Creation from Commitments (T045)', () => {
  let context: TestContext;

  beforeAll(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create multiple test users for different commitment owners
    const testUsers = [];
    for (let i = 0; i < 3; i++) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `task-test-user-${i}-${Date.now()}@example.com`,
        password: 'test-password-123',
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create test user ${i}: ${authError?.message}`);
      }

      testUsers.push({
        id: authData.user.id,
        email: authData.user.email!,
        token: authData.session!.access_token,
      });
    }

    // Create test dossier
    const { data: dossierData, error: dossierError } = await supabase
      .from('dossiers')
      .insert({
        title: 'Test Dossier for Task Creation',
        status: 'active',
      })
      .select()
      .single();

    if (dossierError || !dossierData) {
      throw new Error(`Failed to create test dossier: ${dossierError?.message}`);
    }

    // Assign all users to dossier
    for (const user of testUsers) {
      await supabase.from('dossier_assignments').insert({
        dossier_id: dossierData.id,
        user_id: user.id,
        role: 'staff',
      });
    }

    // Create test engagement
    const { data: engagementData, error: engagementError } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossierData.id,
        title: 'Test Engagement for Task Creation',
        engagement_type: 'workshop',
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (engagementError || !engagementData) {
      throw new Error(`Failed to create test engagement: ${engagementError?.message}`);
    }

    context = {
      supabase,
      testUsers,
      testDossierId: dossierData.id,
      testEngagementId: engagementData.id,
      createdAfterActionIds: [],
      createdTaskIds: [],
    };
  });

  afterAll(async () => {
    // Cleanup
    if (context.createdTaskIds.length > 0) {
      await context.supabase.from('tasks').delete().in('id', context.createdTaskIds);
    }
    if (context.createdAfterActionIds.length > 0) {
      await context.supabase.from('after_action_records').delete().in('id', context.createdAfterActionIds);
    }
    if (context.testEngagementId) {
      await context.supabase.from('engagements').delete().eq('id', context.testEngagementId);
    }
    if (context.testDossierId) {
      await context.supabase.from('dossiers').delete().eq('id', context.testDossierId);
    }
    for (const user of context.testUsers) {
      await context.supabase.auth.admin.deleteUser(user.id);
    }
  });

  beforeEach(() => {
    // Clear arrays for each test
    context.createdAfterActionIds = [];
    context.createdTaskIds = [];
  });

  it('should create exactly 5 tasks from 5 commitments with correct metadata', async () => {
    const currentDate = new Date();
    const commitments = [
      {
        description: 'Complete stakeholder analysis report',
        owner_type: 'internal',
        owner_internal_id: context.testUsers[0].id,
        due_date: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        priority: 'high',
        ai_extracted: false,
      },
      {
        description: 'Draft policy recommendations document',
        owner_type: 'internal',
        owner_internal_id: context.testUsers[1].id,
        due_date: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        priority: 'critical',
        ai_extracted: false,
      },
      {
        description: 'Organize follow-up consultation session',
        owner_type: 'internal',
        owner_internal_id: context.testUsers[2].id,
        due_date: new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
        priority: 'medium',
        ai_extracted: false,
      },
      {
        description: 'Review and validate technical requirements',
        owner_type: 'internal',
        owner_internal_id: context.testUsers[0].id,
        due_date: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
        priority: 'high',
        ai_extracted: true,
        confidence_score: 0.85,
      },
      {
        description: 'Submit final implementation timeline',
        owner_type: 'internal',
        owner_internal_id: context.testUsers[1].id,
        due_date: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        priority: 'low',
        ai_extracted: true,
        confidence_score: 0.92,
      },
    ];

    // Step 1: Create after-action draft
    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engagement_id: context.testEngagementId,
        dossier_id: context.testDossierId,
        title: 'After-Action with 5 Commitments for Task Creation',
        description: 'Testing automatic task creation from multiple commitments',
        confidentiality_level: 'internal',
        commitments,
      }),
    });

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    const afterActionId = createData.data.id;
    context.createdAfterActionIds.push(afterActionId);

    // Step 2: Publish the after-action to trigger task creation
    const publishResponse = await fetch(`${API_BASE_URL}/publish/${afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _version: 1,
        send_notifications: true,
      }),
    });

    expect(publishResponse.status).toBe(200);
    const publishData = await publishResponse.json();
    expect(publishData.success).toBe(true);

    // Step 3: Verify exactly 5 tasks were created
    expect(publishData.data.created_tasks).toBeDefined();
    expect(publishData.data.created_tasks).toHaveLength(5);
    expect(publishData.message).toContain('5 tasks created');

    const createdTasks = publishData.data.created_tasks;
    context.createdTaskIds = createdTasks.map((task: any) => task.id);

    // Step 4: Verify each task has correct metadata
    for (let i = 0; i < createdTasks.length; i++) {
      const task = createdTasks[i];
      const commitment = commitments[i];

      // Verify basic task properties
      expect(task.id).toBeDefined();
      expect(task.title).toContain(commitment.description);
      expect(task.description).toContain(commitment.description);
      expect(task.assigned_to).toBe(commitment.owner_internal_id);
      expect(task.due_date).toBe(commitment.due_date);
      expect(task.priority).toBe(commitment.priority);
      expect(task.status).toBe('pending');

      // Verify source link
      expect(task.source_type).toBe('commitment');
      expect(task.source_id).toBeDefined(); // Commitment ID

      // Verify links to after-action and dossier
      expect(task.after_action_id).toBe(afterActionId);
      expect(task.dossier_id).toBe(context.testDossierId);

      // Verify metadata includes after-action context
      expect(task.metadata).toBeDefined();
      expect(task.metadata.after_action_title).toBe('After-Action with 5 Commitments for Task Creation');
      expect(task.metadata.engagement_id).toBe(context.testEngagementId);

      // Verify AI extraction metadata if applicable
      if (commitment.ai_extracted) {
        expect(task.metadata.ai_extracted).toBe(true);
        expect(task.metadata.confidence_score).toBe(commitment.confidence_score);
      }

      // Verify audit fields
      expect(task.created_by).toBe(context.testUsers[0].id); // Publisher
      expect(task.created_at).toBeDefined();
      expect(new Date(task.created_at).getTime()).toBeGreaterThan(0);
    }

    // Step 5: Verify tasks are retrievable via API
    for (const task of createdTasks) {
      const { data: retrievedTask, error } = await context.supabase
        .from('tasks')
        .select('*')
        .eq('id', task.id)
        .single();

      expect(error).toBeNull();
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.id).toBe(task.id);
    }

    // Step 6: Verify commitment status is updated to 'task_created'
    const { data: updatedAfterAction } = await context.supabase
      .from('after_action_records')
      .select('*, commitments(*)')
      .eq('id', afterActionId)
      .single();

    expect(updatedAfterAction.commitments).toHaveLength(5);
    for (const commitment of updatedAfterAction.commitments) {
      expect(commitment.task_id).toBeDefined();
      expect(commitment.task_status).toBe('task_created');
      expect(context.createdTaskIds).toContain(commitment.task_id);
    }

    // Step 7: Verify task notifications were queued for each owner
    const uniqueOwnerIds = [...new Set(commitments.map(c => c.owner_internal_id))];
    for (const ownerId of uniqueOwnerIds) {
      const { data: notifications } = await context.supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', ownerId)
        .eq('notification_type', 'commitment_assigned')
        .eq('entity_type', 'task');

      if (notifications && notifications.length > 0) {
        // Verify notification metadata
        for (const notification of notifications) {
          expect(notification.status).toBe('pending');
          expect(notification.metadata.after_action_id).toBe(afterActionId);
          expect(notification.metadata.after_action_title).toBe('After-Action with 5 Commitments for Task Creation');
        }
      }
    }
  });

  it('should handle different priority levels correctly', async () => {
    const commitments = [
      { description: 'Critical priority task', priority: 'critical', owner_internal_id: context.testUsers[0].id, due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), owner_type: 'internal', ai_extracted: false },
      { description: 'High priority task', priority: 'high', owner_internal_id: context.testUsers[0].id, due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), owner_type: 'internal', ai_extracted: false },
      { description: 'Medium priority task', priority: 'medium', owner_internal_id: context.testUsers[0].id, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), owner_type: 'internal', ai_extracted: false },
      { description: 'Low priority task', priority: 'low', owner_internal_id: context.testUsers[0].id, due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), owner_type: 'internal', ai_extracted: false },
    ];

    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engagement_id: context.testEngagementId,
        dossier_id: context.testDossierId,
        title: 'After-Action with Different Priority Commitments',
        confidentiality_level: 'internal',
        commitments,
      }),
    });

    const createData = await createResponse.json();
    const afterActionId = createData.data.id;
    context.createdAfterActionIds.push(afterActionId);

    const publishResponse = await fetch(`${API_BASE_URL}/publish/${afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _version: 1,
        send_notifications: false,
      }),
    });

    const publishData = await publishResponse.json();
    const createdTasks = publishData.data.created_tasks;
    context.createdTaskIds.push(...createdTasks.map((t: any) => t.id));

    // Verify each task has correct priority
    const priorities = createdTasks.map((t: any) => t.priority);
    expect(priorities).toContain('critical');
    expect(priorities).toContain('high');
    expect(priorities).toContain('medium');
    expect(priorities).toContain('low');
  });

  it('should distribute tasks to multiple owners correctly', async () => {
    const commitments = [
      { description: 'Task for user 0', owner_internal_id: context.testUsers[0].id, owner_type: 'internal', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', ai_extracted: false },
      { description: 'Task for user 1', owner_internal_id: context.testUsers[1].id, owner_type: 'internal', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', ai_extracted: false },
      { description: 'Task for user 2', owner_internal_id: context.testUsers[2].id, owner_type: 'internal', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', ai_extracted: false },
      { description: 'Another task for user 0', owner_internal_id: context.testUsers[0].id, owner_type: 'internal', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', ai_extracted: false },
      { description: 'Another task for user 1', owner_internal_id: context.testUsers[1].id, owner_type: 'internal', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', ai_extracted: false },
    ];

    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engagement_id: context.testEngagementId,
        dossier_id: context.testDossierId,
        title: 'After-Action with Multiple Owner Commitments',
        confidentiality_level: 'internal',
        commitments,
      }),
    });

    const createData = await createResponse.json();
    const afterActionId = createData.data.id;
    context.createdAfterActionIds.push(afterActionId);

    const publishResponse = await fetch(`${API_BASE_URL}/publish/${afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _version: 1,
        send_notifications: false,
      }),
    });

    const publishData = await publishResponse.json();
    const createdTasks = publishData.data.created_tasks;
    context.createdTaskIds.push(...createdTasks.map((t: any) => t.id));

    // Verify task distribution
    const user0Tasks = createdTasks.filter((t: any) => t.assigned_to === context.testUsers[0].id);
    const user1Tasks = createdTasks.filter((t: any) => t.assigned_to === context.testUsers[1].id);
    const user2Tasks = createdTasks.filter((t: any) => t.assigned_to === context.testUsers[2].id);

    expect(user0Tasks).toHaveLength(2);
    expect(user1Tasks).toHaveLength(2);
    expect(user2Tasks).toHaveLength(1);
  });

  it('should handle zero commitments gracefully', async () => {
    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engagement_id: context.testEngagementId,
        dossier_id: context.testDossierId,
        title: 'After-Action with No Commitments',
        confidentiality_level: 'internal',
        decisions: [
          {
            description: 'Decision without commitments',
            decision_maker: 'Director',
            decided_at: new Date().toISOString(),
            ai_extracted: false,
          },
        ],
      }),
    });

    const createData = await createResponse.json();
    const afterActionId = createData.data.id;
    context.createdAfterActionIds.push(afterActionId);

    const publishResponse = await fetch(`${API_BASE_URL}/publish/${afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUsers[0].token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _version: 1,
        send_notifications: false,
      }),
    });

    expect(publishResponse.status).toBe(200);
    const publishData = await publishResponse.json();
    expect(publishData.data.created_tasks).toHaveLength(0);
    expect(publishData.message).toContain('0 tasks created');
  });
});
