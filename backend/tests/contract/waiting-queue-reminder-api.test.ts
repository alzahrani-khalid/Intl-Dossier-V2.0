/**
 * Contract Tests: Waiting Queue Reminder API with Entity Context
 * Feature: 024 - Intake Entity Linking
 * User Stories: 3 (Waiting Queue Integration)
 * 
 * Tests the automated reminder system integration with entity linking:
 * - T073: Configure and send reminders with entity context
 * - Entity-based reminder rules
 * - Stakeholder notifications
 * - Priority-based frequency
 * - Cooldown period enforcement
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getTestSupabaseClient,
  createTestUser,
  createTestIntake,
  createTestEntity,
  createTestLink,
  cleanupTestData,
} from '@tests/utils/testHelpers';

// API Base URL (will be Edge Functions after implementation)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:54321/functions/v1';

// Test data interfaces
interface User {
  id: string;
  email: string;
  clearance_level: number;
  organization_id: string;
  token: string;
}

interface Intake {
  id: string;
  title: string;
  status: 'waiting' | 'active' | 'completed';
  priority: number;
  organization_id: string;
}

interface Entity {
  entity_id: string;
  entity_type: string;
  name: string;
  classification_level: number;
  organization_id: string;
}

interface ReminderRuleRequest {
  intake_id: string;
  reminder_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  notify_stakeholders: boolean;
  include_entity_context?: boolean;
  entity_priority_multiplier?: number; // 1.0 = normal, 2.0 = double frequency
}

interface ReminderRuleResponse {
  success: boolean;
  data?: {
    reminder_rule_id: string;
    intake_id: string;
    reminder_frequency: string;
    next_reminder_at: string;
    notify_stakeholders: boolean;
    include_entity_context: boolean;
    entity_priority_multiplier: number;
    status: 'active' | 'paused';
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

interface SendReminderRequest {
  intake_id: string;
  manual_trigger?: boolean;
  override_cooldown?: boolean;
}

interface SendReminderResponse {
  success: boolean;
  data?: {
    reminder_id: string;
    intake_id: string;
    sent_at: string;
    sent_to: string[];
    entity_context?: {
      linked_entities: Array<{
        entity_type: string;
        entity_name: string;
        link_type: string;
      }>;
    };
    next_reminder_at: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Test state
let supabase: ReturnType<typeof getTestSupabaseClient>;
let testOrganizationId: string;
let testUser: User;
let stakeholderUser: User;
let testIntakes: Intake[] = [];
let testEntities: Entity[] = [];
let testLinkIds: string[] = [];
let testReminderRuleIds: string[] = [];
let testReminderIds: string[] = [];

describe('T073: Reminder System with Entity Context', () => {
  beforeAll(async () => {
    supabase = getTestSupabaseClient();
    
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Reminder Test Org' })
      .select()
      .single();
    testOrganizationId = org!.id;

    // Create test users
    testUser = await createTestUser(2, testOrganizationId);
    stakeholderUser = await createTestUser(2, testOrganizationId);

    // Create test entities
    const highPriorityDossier = await createTestEntity('dossier', testOrganizationId, {
      name: 'High Priority Dossier',
      classification_level: 2,
      metadata: { priority: 'high' },
    });

    const normalPositionEntity = await createTestEntity('position', testOrganizationId, {
      name: 'Normal Position',
      classification_level: 2,
    });

    testEntities = [highPriorityDossier, normalPositionEntity];

    // Create test intakes
    const intake1 = await createTestIntake(testOrganizationId, {
      title: 'Intake 1 - High Priority with Entities',
      status: 'waiting',
      priority: 5,
      assigned_to: testUser.id,
    });

    const intake2 = await createTestIntake(testOrganizationId, {
      title: 'Intake 2 - Normal Priority',
      status: 'waiting',
      priority: 3,
      assigned_to: testUser.id,
    });

    testIntakes = [intake1, intake2];

    // Create entity links for intake1 (high priority)
    const link1 = await createTestLink(
      intake1.id,
      'dossier',
      highPriorityDossier.entity_id,
      'primary',
      testUser.id,
      { notes: 'High priority dossier requiring frequent updates' }
    );

    const link2 = await createTestLink(
      intake1.id,
      'position',
      normalPositionEntity.entity_id,
      'related',
      testUser.id
    );

    testLinkIds = [link1.link_id, link2.link_id];

    console.log('✅ Reminder test environment ready');
  });

  afterAll(async () => {
    await cleanupTestData({
      userIds: [testUser.id, stakeholderUser.id],
      intakeIds: testIntakes.map(i => i.id),
      linkIds: testLinkIds,
      organizationIds: [testOrganizationId],
    });

    // Cleanup reminder rules
    if (testReminderRuleIds.length > 0) {
      await supabase
        .from('reminder_rules')
        .delete()
        .in('id', testReminderRuleIds);
    }

    // Cleanup sent reminders
    if (testReminderIds.length > 0) {
      await supabase
        .from('followup_reminders')
        .delete()
        .in('id', testReminderIds);
    }

    console.log('✅ Reminder test cleanup complete');
  });

  it('should configure automated reminder with entity context', async () => {
    const reminderRuleRequest: ReminderRuleRequest = {
      intake_id: testIntakes[0].id,
      reminder_frequency: 'daily',
      notify_stakeholders: true,
      include_entity_context: true,
      entity_priority_multiplier: 1.0,
    };

    const response = await fetch(`${API_BASE_URL}/reminders/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminderRuleRequest),
    });

    expect(response.status).toBe(201);

    const responseData: ReminderRuleResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.reminder_rule_id).toBeDefined();
    expect(responseData.data!.intake_id).toBe(testIntakes[0].id);
    expect(responseData.data!.reminder_frequency).toBe('daily');
    expect(responseData.data!.notify_stakeholders).toBe(true);
    expect(responseData.data!.include_entity_context).toBe(true);
    expect(responseData.data!.status).toBe('active');
    expect(responseData.data!.next_reminder_at).toBeDefined();

    testReminderRuleIds.push(responseData.data!.reminder_rule_id);
  });

  it('should send reminder with entity summary to stakeholders', async () => {
    const sendReminderRequest: SendReminderRequest = {
      intake_id: testIntakes[0].id,
      manual_trigger: true,
    };

    const response = await fetch(`${API_BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendReminderRequest),
    });

    expect(response.status).toBe(200);

    const responseData: SendReminderResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.reminder_id).toBeDefined();
    expect(responseData.data!.intake_id).toBe(testIntakes[0].id);
    expect(responseData.data!.sent_to.length).toBeGreaterThan(0);

    // Verify entity context is included
    expect(responseData.data!.entity_context).toBeDefined();
    expect(responseData.data!.entity_context!.linked_entities.length).toBe(2);

    const entityContext = responseData.data!.entity_context!.linked_entities;
    expect(entityContext.some(e => e.entity_type === 'dossier' && e.link_type === 'primary')).toBe(true);
    expect(entityContext.some(e => e.entity_type === 'position' && e.link_type === 'related')).toBe(true);

    // Verify next reminder is scheduled
    expect(responseData.data!.next_reminder_at).toBeDefined();

    testReminderIds.push(responseData.data!.reminder_id);
  });

  it('should adjust reminder frequency based on entity priority multiplier', async () => {
    // High priority intake with entity priority multiplier
    const highPriorityRule: ReminderRuleRequest = {
      intake_id: testIntakes[0].id,
      reminder_frequency: 'weekly', // Base: 7 days
      notify_stakeholders: true,
      entity_priority_multiplier: 2.0, // Should become 3.5 days
    };

    const response = await fetch(`${API_BASE_URL}/reminders/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highPriorityRule),
    });

    expect(response.status).toBe(201);

    const responseData: ReminderRuleResponse = await response.json();
    expect(responseData.data!.entity_priority_multiplier).toBe(2.0);

    // Verify next_reminder_at reflects adjusted frequency
    const nextReminderDate = new Date(responseData.data!.next_reminder_at);
    const now = new Date();
    const daysDifference = (nextReminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Should be approximately 3-4 days (weekly / 2.0)
    expect(daysDifference).toBeGreaterThan(3);
    expect(daysDifference).toBeLessThan(4);

    testReminderRuleIds.push(responseData.data!.reminder_rule_id);
  });

  it('should enforce cooldown period to prevent reminder spam', async () => {
    // Send first reminder
    const firstRequest: SendReminderRequest = {
      intake_id: testIntakes[0].id,
      manual_trigger: true,
    };

    const firstResponse = await fetch(`${API_BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firstRequest),
    });

    expect(firstResponse.status).toBe(200);

    // Attempt to send second reminder immediately (should be blocked by cooldown)
    const secondRequest: SendReminderRequest = {
      intake_id: testIntakes[0].id,
      manual_trigger: true,
      override_cooldown: false,
    };

    const secondResponse = await fetch(`${API_BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(secondRequest),
    });

    expect(secondResponse.status).toBe(429);

    const responseData: SendReminderResponse = await response.json();
    expect(responseData.error!.code).toBe('REMINDER_COOLDOWN_ACTIVE');
    expect(responseData.error!.details.cooldown_remaining_seconds).toBeDefined();
    expect(responseData.error!.details.next_allowed_at).toBeDefined();
  }, 10000);

  it('should notify entity stakeholders when configured', async () => {
    // Create stakeholder link to entity
    const { data: stakeholderLink } = await supabase
      .from('entity_stakeholders')
      .insert({
        entity_type: 'dossier',
        entity_id: testEntities[0].entity_id,
        user_id: stakeholderUser.id,
        role: 'reviewer',
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    // Send reminder with stakeholder notifications
    const sendReminderRequest: SendReminderRequest = {
      intake_id: testIntakes[0].id,
      manual_trigger: true,
    };

    const response = await fetch(`${API_BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendReminderRequest),
    });

    expect(response.status).toBe(200);

    const responseData: SendReminderResponse = await response.json();
    
    // Verify stakeholder is included in recipients
    expect(responseData.data!.sent_to).toContain(stakeholderUser.id);
    expect(responseData.data!.sent_to).toContain(testUser.id); // Assigned user

    // Cleanup
    await supabase
      .from('entity_stakeholders')
      .delete()
      .eq('id', stakeholderLink!.id);
  });

  it('should respect organization boundaries when sending reminders', async () => {
    // Create user in different organization
    const { data: otherOrg } = await supabase
      .from('organizations')
      .insert({ name: 'Other Reminder Org' })
      .select()
      .single();

    const otherUser = await createTestUser(2, otherOrg!.id);

    // Attempt to send reminder for intake in another organization
    const sendReminderRequest: SendReminderRequest = {
      intake_id: testIntakes[0].id, // Belongs to testOrganizationId
      manual_trigger: true,
    };

    const response = await fetch(`${API_BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${otherUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendReminderRequest),
    });

    expect(response.status).toBe(403);

    const responseData: SendReminderResponse = await response.json();
    expect(responseData.error!.code).toBe('ORGANIZATION_MISMATCH');

    // Cleanup
    await cleanupTestData({
      userIds: [otherUser.id],
      organizationIds: [otherOrg!.id],
    });
  });
});
