/**
 * Integration Test: After-Action Creation Workflow (T044)
 *
 * Purpose: Test end-to-end workflow from draft creation to publication
 * Covers: draft → publish → tasks created → dossier linked
 *
 * This test should FAIL initially (TDD approach) before backend implementation
 *
 * Test Scenario:
 * 1. Create after-action draft with 3 commitments
 * 2. Verify draft is saved correctly
 * 3. Publish the after-action
 * 4. Verify 3 tasks are automatically created from commitments
 * 5. Verify tasks are linked to after-action and dossier
 * 6. Verify after-action appears in dossier timeline
 *
 * Reference: specs/022-after-action-structured/contracts/after-action-api.md
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1/after-action`;

interface TestContext {
  supabase: SupabaseClient;
  testUser: {
    id: string;
    email: string;
    token: string;
  };
  testDossierId: string;
  testEngagementId: string;
  afterActionId?: string;
  createdTaskIds: string[];
}

describe('Integration Test: After-Action Workflow (T044)', () => {
  let context: TestContext;

  beforeAll(async () => {
    // Setup test environment
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `workflow-test-${Date.now()}@example.com`,
      password: 'test-password-123',
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    // Create test dossier
    const { data: dossierData, error: dossierError } = await supabase
      .from('dossiers')
      .insert({
        title: 'Test Dossier for Workflow',
        status: 'active',
      })
      .select()
      .single();

    if (dossierError || !dossierData) {
      throw new Error(`Failed to create test dossier: ${dossierError?.message}`);
    }

    // Assign user to dossier
    await supabase.from('dossier_assignments').insert({
      dossier_id: dossierData.id,
      user_id: authData.user.id,
      role: 'staff',
    });

    // Create test engagement
    const { data: engagementData, error: engagementError } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossierData.id,
        title: 'Test Engagement for Workflow',
        engagement_type: 'meeting',
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (engagementError || !engagementData) {
      throw new Error(`Failed to create test engagement: ${engagementError?.message}`);
    }

    context = {
      supabase,
      testUser: {
        id: authData.user.id,
        email: authData.user.email!,
        token: authData.session!.access_token,
      },
      testDossierId: dossierData.id,
      testEngagementId: engagementData.id,
      createdTaskIds: [],
    };
  });

  afterAll(async () => {
    // Cleanup: Delete test data in reverse order
    if (context.createdTaskIds.length > 0) {
      await context.supabase.from('tasks').delete().in('id', context.createdTaskIds);
    }
    if (context.afterActionId) {
      await context.supabase.from('after_action_records').delete().eq('id', context.afterActionId);
    }
    if (context.testEngagementId) {
      await context.supabase.from('engagements').delete().eq('id', context.testEngagementId);
    }
    if (context.testDossierId) {
      await context.supabase.from('dossiers').delete().eq('id', context.testDossierId);
    }
    if (context.testUser.id) {
      await context.supabase.auth.admin.deleteUser(context.testUser.id);
    }
  });

  it('should complete full workflow: draft → publish → tasks created → dossier linked', async () => {
    // Step 1: Create draft with 3 commitments
    const draftPayload = {
      engagement_id: context.testEngagementId,
      dossier_id: context.testDossierId,
      title: 'End-to-End Workflow Test After-Action',
      description: 'Testing complete workflow from draft to publication with task creation',
      confidentiality_level: 'internal',
      attendance_list: [
        {
          name: 'Alice Johnson',
          role: 'Senior Analyst',
          organization: 'Test Organization A',
        },
        {
          name: 'Bob Smith',
          role: 'Policy Officer',
          organization: 'Test Organization B',
        },
      ],
      decisions: [
        {
          description: 'Approved budget allocation for Q1 2025',
          rationale: 'Based on detailed cost-benefit analysis',
          decision_maker: 'Director Johnson',
          decided_at: new Date().toISOString(),
          ai_extracted: false,
        },
      ],
      commitments: [
        {
          description: 'Complete technical feasibility study',
          owner_type: 'internal',
          owner_internal_id: context.testUser.id,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          priority: 'high',
          ai_extracted: false,
        },
        {
          description: 'Prepare stakeholder engagement plan',
          owner_type: 'internal',
          owner_internal_id: context.testUser.id,
          due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
          priority: 'medium',
          ai_extracted: false,
        },
        {
          description: 'Submit initial draft recommendations',
          owner_type: 'internal',
          owner_internal_id: context.testUser.id,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          priority: 'high',
          ai_extracted: false,
        },
      ],
      risks: [
        {
          description: 'Potential delays due to resource constraints',
          severity: 'medium',
          likelihood: 'possible',
          mitigation_strategy: 'Allocate contingency resources and identify backup team members',
          ai_extracted: false,
        },
      ],
    };

    const createResponse = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload),
    });

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);
    expect(createData.data.status).toBe('draft');

    context.afterActionId = createData.data.id;

    // Step 2: Verify draft is saved correctly
    const getResponse = await fetch(`${API_BASE_URL}/get/${context.afterActionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${context.testUser.token}`,
      },
    });

    expect(getResponse.status).toBe(200);
    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    expect(getData.data.id).toBe(context.afterActionId);
    expect(getData.data.title).toBe(draftPayload.title);
    expect(getData.data.commitments).toHaveLength(3);
    expect(getData.data.decisions).toHaveLength(1);
    expect(getData.data.risks).toHaveLength(1);

    // Step 3: Publish the after-action
    const publishResponse = await fetch(`${API_BASE_URL}/publish/${context.afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUser.token}`,
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
    expect(publishData.data.after_action.status).toBe('published');
    expect(publishData.data.after_action.published_by).toBe(context.testUser.id);
    expect(publishData.data.after_action.published_at).toBeDefined();

    // Step 4: Verify 3 tasks were created from commitments
    expect(publishData.data.created_tasks).toBeDefined();
    expect(publishData.data.created_tasks).toHaveLength(3);
    expect(publishData.message).toContain('3 tasks created');

    // Store task IDs for cleanup
    context.createdTaskIds = publishData.data.created_tasks.map((task: any) => task.id);

    // Step 5: Verify tasks are linked to after-action and dossier
    for (const createdTask of publishData.data.created_tasks) {
      expect(createdTask.source_type).toBe('commitment');
      expect(createdTask.source_id).toBeDefined(); // Commitment ID
      expect(createdTask.after_action_id).toBe(context.afterActionId);
      expect(createdTask.dossier_id).toBe(context.testDossierId);
      expect(createdTask.assigned_to).toBe(context.testUser.id);
      expect(createdTask.status).toBe('pending');
      expect(createdTask.title).toBeDefined();
      expect(createdTask.due_date).toBeDefined();

      // Verify task matches corresponding commitment
      const matchingCommitment = getData.data.commitments.find(
        (c: any) => c.id === createdTask.source_id
      );
      expect(matchingCommitment).toBeDefined();
      expect(createdTask.title).toContain(matchingCommitment.description);
      expect(createdTask.due_date).toBe(matchingCommitment.due_date);
      expect(createdTask.priority).toBe(matchingCommitment.priority);
    }

    // Step 6: Verify after-action appears in dossier timeline
    // Query timeline API (assuming it exists)
    const timelineResponse = await context.supabase
      .from('dossier_timeline')
      .select('*')
      .eq('dossier_id', context.testDossierId)
      .eq('entity_type', 'after_action_record')
      .eq('entity_id', context.afterActionId)
      .single();

    expect(timelineResponse.error).toBeNull();
    expect(timelineResponse.data).toBeDefined();
    expect(timelineResponse.data.event_type).toBe('after_action_published');
    expect(timelineResponse.data.created_by).toBe(context.testUser.id);
    expect(timelineResponse.data.metadata).toMatchObject({
      title: draftPayload.title,
      commitments_count: 3,
      decisions_count: 1,
      risks_count: 1,
    });

    // Step 7: Verify notifications were queued (if notification table exists)
    // This assumes notifications are stored in a notification_queue table
    const notificationResponse = await context.supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', context.testUser.id)
      .eq('entity_type', 'commitment')
      .in('entity_id', getData.data.commitments.map((c: any) => c.id));

    if (!notificationResponse.error) {
      // If notification system is implemented
      expect(notificationResponse.data).toBeDefined();
      expect(notificationResponse.data.length).toBeGreaterThan(0);

      for (const notification of notificationResponse.data) {
        expect(notification.notification_type).toBe('commitment_assigned');
        expect(notification.status).toBe('pending');
        expect(notification.metadata).toMatchObject({
          after_action_id: context.afterActionId,
          after_action_title: draftPayload.title,
        });
      }
    }
  });

  it('should maintain data integrity throughout workflow', async () => {
    // Verify the after-action record maintains referential integrity
    const { data: afterAction, error } = await context.supabase
      .from('after_action_records')
      .select(`
        *,
        engagement:engagements(*),
        dossier:dossiers(*),
        creator:profiles!created_by(*),
        publisher:profiles!published_by(*),
        decisions(*),
        commitments(*),
        risks(*),
        follow_up_actions(*)
      `)
      .eq('id', context.afterActionId!)
      .single();

    expect(error).toBeNull();
    expect(afterAction).toBeDefined();

    // Verify foreign keys
    expect(afterAction.engagement).toBeDefined();
    expect(afterAction.engagement.id).toBe(context.testEngagementId);
    expect(afterAction.dossier).toBeDefined();
    expect(afterAction.dossier.id).toBe(context.testDossierId);

    // Verify creator and publisher
    expect(afterAction.creator).toBeDefined();
    expect(afterAction.creator.id).toBe(context.testUser.id);
    expect(afterAction.publisher).toBeDefined();
    expect(afterAction.publisher.id).toBe(context.testUser.id);

    // Verify nested entities
    expect(afterAction.decisions.length).toBeGreaterThan(0);
    expect(afterAction.commitments.length).toBe(3);
    expect(afterAction.risks.length).toBeGreaterThan(0);
  });

  it('should handle workflow errors gracefully', async () => {
    // Test error case: Try to publish already published record
    const secondPublishResponse = await fetch(`${API_BASE_URL}/publish/${context.afterActionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _version: 2, // Updated version from previous publish
        send_notifications: false,
      }),
    });

    expect(secondPublishResponse.status).toBe(403);
    const errorData = await secondPublishResponse.json();
    expect(errorData.success).toBe(false);
    expect(errorData.error.code).toBe('ALREADY_PUBLISHED');
  });
});
