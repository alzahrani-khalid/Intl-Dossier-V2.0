/**
 * Contract Tests: Waiting Queue Escalation API with Entity Context
 * Feature: 024 - Intake Entity Linking
 * User Stories: 3 (Waiting Queue Integration)
 * 
 * Tests the escalation workflow integration with entity linking:
 * - T072: Escalate intakes with entity context
 * - Preserve entity links during escalation
 * - Entity summary in escalation notifications
 * - Filter escalation queue by linked entities
 * - Organization and clearance enforcement
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

interface EscalationRequest {
  intake_id: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  target_clearance_level?: number;
  include_entity_context?: boolean;
}

interface EscalationResponse {
  success: boolean;
  data?: {
    escalation_id: string;
    intake_id: string;
    escalated_to: string;
    escalated_by: string;
    escalated_at: string;
    reason: string;
    urgency: string;
    entity_summary?: {
      linked_entities: Array<{
        entity_type: string;
        entity_id: string;
        entity_name: string;
        link_type: string;
      }>;
      total_links: number;
    };
    status: 'pending' | 'accepted' | 'rejected';
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

interface EscalationQueueResponse {
  success: boolean;
  data?: Array<{
    escalation_id: string;
    intake_id: string;
    intake_title: string;
    escalated_by: string;
    escalated_at: string;
    reason: string;
    urgency: string;
    status: string;
    linked_entities?: Array<{
      entity_type: string;
      entity_id: string;
      entity_name: string;
      link_type: string;
    }>;
  }>;
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Test state
let supabase: ReturnType<typeof getTestSupabaseClient>;
let testOrganizationId: string;
let testUser: User;
let supervisorUser: User;
let testIntakes: Intake[] = [];
let testEntities: Entity[] = [];
let testLinkIds: string[] = [];
let testEscalationIds: string[] = [];

describe('T072: POST /api/escalations (Escalate with Entity Context)', () => {
  beforeAll(async () => {
    supabase = getTestSupabaseClient();
    
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Escalation Test Org' })
      .select()
      .single();
    testOrganizationId = org!.id;

    // Create test users
    testUser = await createTestUser(2, testOrganizationId); // Regular user
    supervisorUser = await createTestUser(3, testOrganizationId); // Supervisor

    // Create test entities
    const dossierEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Dossier A - High Priority',
      classification_level: 2,
    });

    const positionEntity = await createTestEntity('position', testOrganizationId, {
      name: 'Position X - Critical',
      classification_level: 2,
    });

    const mouEntity = await createTestEntity('mou', testOrganizationId, {
      name: 'MOU Agreement 123',
      classification_level: 2,
    });

    testEntities = [dossierEntity, positionEntity, mouEntity];

    // Create test intakes with different priorities
    const intake1 = await createTestIntake(testOrganizationId, {
      title: 'Intake 1 - Needs Escalation',
      status: 'waiting',
      priority: 3,
      assigned_to: testUser.id,
    });

    const intake2 = await createTestIntake(testOrganizationId, {
      title: 'Intake 2 - Already High Priority',
      status: 'waiting',
      priority: 5,
      assigned_to: testUser.id,
    });

    testIntakes = [intake1, intake2];

    // Create entity links for intake1
    const link1 = await createTestLink(
      intake1.id,
      'dossier',
      dossierEntity.entity_id,
      'primary',
      testUser.id,
      { notes: 'Primary dossier for this intake' }
    );

    const link2 = await createTestLink(
      intake1.id,
      'position',
      positionEntity.entity_id,
      'related',
      testUser.id,
      { notes: 'Related position' }
    );

    const link3 = await createTestLink(
      intake1.id,
      'mou',
      mouEntity.entity_id,
      'related',
      testUser.id,
      { notes: 'Related MOU agreement' }
    );

    testLinkIds = [link1.link_id, link2.link_id, link3.link_id];

    console.log('✅ Escalation test environment ready');
  });

  afterAll(async () => {
    await cleanupTestData({
      userIds: [testUser.id, supervisorUser.id],
      intakeIds: testIntakes.map(i => i.id),
      linkIds: testLinkIds,
      organizationIds: [testOrganizationId],
    });

    // Cleanup escalations
    if (testEscalationIds.length > 0) {
      await supabase
        .from('escalation_records')
        .delete()
        .in('id', testEscalationIds);
    }

    console.log('✅ Escalation test cleanup complete');
  });

  it('should escalate intake with entity context included', async () => {
    const escalationRequest: EscalationRequest = {
      intake_id: testIntakes[0].id,
      reason: 'Complex case requiring supervisor review - involves multiple high-priority entities',
      urgency: 'high',
      include_entity_context: true,
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(201);

    const responseData: EscalationResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.escalation_id).toBeDefined();
    expect(responseData.data!.intake_id).toBe(testIntakes[0].id);
    expect(responseData.data!.escalated_by).toBe(testUser.id);
    expect(responseData.data!.urgency).toBe('high');
    expect(responseData.data!.status).toBe('pending');

    // Verify entity summary is included
    expect(responseData.data!.entity_summary).toBeDefined();
    expect(responseData.data!.entity_summary!.total_links).toBe(3);
    expect(responseData.data!.entity_summary!.linked_entities.length).toBe(3);

    // Verify entity details
    const entitySummary = responseData.data!.entity_summary!.linked_entities;
    expect(entitySummary.some(e => e.entity_type === 'dossier' && e.link_type === 'primary')).toBe(true);
    expect(entitySummary.some(e => e.entity_type === 'position' && e.link_type === 'related')).toBe(true);
    expect(entitySummary.some(e => e.entity_type === 'mou' && e.link_type === 'related')).toBe(true);

    testEscalationIds.push(responseData.data!.escalation_id);
  });

  it('should preserve entity links during escalation', async () => {
    const escalationRequest: EscalationRequest = {
      intake_id: testIntakes[0].id,
      reason: 'Second escalation for testing link preservation',
      urgency: 'medium',
      include_entity_context: true,
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(201);

    // Verify links are still intact in database
    const { data: links } = await supabase
      .from('intake_entity_links')
      .select('*')
      .eq('intake_id', testIntakes[0].id)
      .is('deleted_at', null);

    expect(links!.length).toBe(3);
    expect(links!.every(link => link.deleted_at === null)).toBe(true);
  });

  it('should include entity summary in escalation notifications', async () => {
    const escalationRequest: EscalationRequest = {
      intake_id: testIntakes[0].id,
      reason: 'Testing notification with entity context',
      urgency: 'critical',
      target_clearance_level: 3,
      include_entity_context: true,
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(201);

    const responseData: EscalationResponse = await response.json();

    // Verify entity summary format is suitable for notifications
    expect(responseData.data!.entity_summary).toBeDefined();
    const summary = responseData.data!.entity_summary!;
    
    expect(summary.total_links).toBeGreaterThan(0);
    expect(summary.linked_entities.every(e => 
      e.entity_type && e.entity_id && e.entity_name && e.link_type
    )).toBe(true);

    testEscalationIds.push(responseData.data!.escalation_id);
  });

  it('should allow filtering escalation queue by entity', async () => {
    // First, create escalations for both intakes
    await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intake_id: testIntakes[1].id,
        reason: 'Escalation without entity links',
        urgency: 'low',
      }),
    });

    // Query escalation queue filtered by entity
    const response = await fetch(
      `${API_BASE_URL}/escalations?entity_id=${testEntities[0].entity_id}&status=pending`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supervisorUser.token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const responseData: EscalationQueueResponse = await response.json();
    expect(responseData.success).toBe(true);

    // Should only return escalations for intake1 (which has entity links)
    expect(responseData.data!.length).toBeGreaterThan(0);
    expect(responseData.data!.every(e => 
      e.linked_entities?.some(ent => ent.entity_id === testEntities[0].entity_id)
    )).toBe(true);
  });

  it('should enforce organization boundaries during escalation', async () => {
    // Create user in different organization
    const { data: otherOrg } = await supabase
      .from('organizations')
      .insert({ name: 'Other Org' })
      .select()
      .single();

    const otherUser = await createTestUser(3, otherOrg!.id);

    // Attempt to escalate intake from another organization
    const escalationRequest: EscalationRequest = {
      intake_id: testIntakes[0].id, // Belongs to testOrganizationId
      reason: 'Unauthorized escalation attempt',
      urgency: 'high',
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${otherUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(403);

    const responseData: EscalationResponse = await response.json();
    expect(responseData.error!.code).toBe('ORGANIZATION_MISMATCH');

    // Cleanup
    await cleanupTestData({
      userIds: [otherUser.id],
      organizationIds: [otherOrg!.id],
    });
  });

  it('should validate clearance for escalated intakes with high-classification entities', async () => {
    // Create high-classification entity
    const secretEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Secret Dossier',
      classification_level: 4, // Secret
    });

    // Create intake with secret entity link
    const secretIntake = await createTestIntake(testOrganizationId, {
      title: 'Intake with Secret Entity',
      status: 'waiting',
      priority: 3,
    });

    await createTestLink(
      secretIntake.id,
      'dossier',
      secretEntity.entity_id,
      'primary',
      supervisorUser.id // Created by supervisor (clearance 3)
    );

    // Attempt to escalate with insufficient clearance
    const escalationRequest: EscalationRequest = {
      intake_id: secretIntake.id,
      reason: 'Escalation with high-classification entity',
      urgency: 'high',
      target_clearance_level: 3, // User has clearance 2, entity requires 4
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`, // Clearance level 2
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(403);

    const responseData: EscalationResponse = await response.json();
    expect(responseData.error!.code).toBe('INSUFFICIENT_CLEARANCE');
    expect(responseData.error!.details.required_clearance).toBe(4);
    expect(responseData.error!.details.user_clearance).toBe(2);

    // Cleanup
    await cleanupTestData({
      intakeIds: [secretIntake.id],
    });
  });

  it('should support escalation path with entity filters', async () => {
    // Query escalation path filtered by entity type
    const response = await fetch(
      `${API_BASE_URL}/escalations/path?entity_type=dossier&urgency=high`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();

    // Verify escalation path structure
    expect(Array.isArray(responseData.data.escalation_path)).toBe(true);
    expect(responseData.data.escalation_path.length).toBeGreaterThan(0);

    // Verify each level has clearance requirements
    responseData.data.escalation_path.forEach((level: any) => {
      expect(level.clearance_level).toBeDefined();
      expect(level.role_name).toBeDefined();
    });
  });

  it('should handle gracefully when entity links are broken during escalation', async () => {
    // Create intake with valid link
    const tempEntity = await createTestEntity('position', testOrganizationId, {
      name: 'Temporary Position',
      classification_level: 2,
    });

    const tempIntake = await createTestIntake(testOrganizationId, {
      title: 'Intake with Temporary Link',
      status: 'waiting',
      priority: 3,
    });

    const tempLink = await createTestLink(
      tempIntake.id,
      'position',
      tempEntity.entity_id,
      'related',
      testUser.id
    );

    // Soft-delete the entity link (simulate broken link)
    await supabase
      .from('intake_entity_links')
      .update({ deleted_at: new Date().toISOString() })
      .eq('link_id', tempLink.link_id);

    // Attempt to escalate with broken link
    const escalationRequest: EscalationRequest = {
      intake_id: tempIntake.id,
      reason: 'Escalation with broken entity link',
      urgency: 'medium',
      include_entity_context: true,
    };

    const response = await fetch(`${API_BASE_URL}/escalations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationRequest),
    });

    expect(response.status).toBe(201);

    const responseData: EscalationResponse = await response.json();
    expect(responseData.success).toBe(true);

    // Entity summary should exclude soft-deleted links
    expect(responseData.data!.entity_summary?.total_links).toBe(0);
    expect(responseData.data!.entity_summary?.linked_entities.length).toBe(0);

    // Cleanup
    await cleanupTestData({
      intakeIds: [tempIntake.id],
    });
  });
});
