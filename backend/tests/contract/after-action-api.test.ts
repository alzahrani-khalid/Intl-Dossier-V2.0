/**
 * Contract Tests: After-Action Reports with Entity Context
 * Feature: 024 - Intake Entity Linking
 * User Stories: 3 (Waiting Queue Integration)
 * 
 * Tests after-action report generation with entity context:
 * - T074: Generate reports with linked entity summary
 * - Filter reports by entity involvement
 * - Include entity timeline in reports
 * - Entity-based analytics
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

interface AfterActionRequest {
  intake_id: string;
  summary: string;
  outcomes: string[];
  lessons_learned?: string;
  include_entity_context?: boolean;
  include_entity_timeline?: boolean;
}

interface AfterActionResponse {
  success: boolean;
  data?: {
    after_action_id: string;
    intake_id: string;
    created_by: string;
    created_at: string;
    summary: string;
    outcomes: string[];
    lessons_learned?: string;
    entity_context?: {
      linked_entities: Array<{
        entity_type: string;
        entity_id: string;
        entity_name: string;
        link_type: string;
        linked_at: string;
      }>;
      total_entities: number;
      entity_types_involved: string[];
    };
    entity_timeline?: Array<{
      event_type: string;
      entity_type: string;
      entity_name: string;
      timestamp: string;
      description: string;
    }>;
    status: 'draft' | 'published';
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

interface AfterActionListResponse {
  success: boolean;
  data?: Array<{
    after_action_id: string;
    intake_id: string;
    intake_title: string;
    created_by: string;
    created_at: string;
    status: string;
    linked_entities_count: number;
    entity_types: string[];
  }>;
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface AfterActionAnalyticsResponse {
  success: boolean;
  data?: {
    total_reports: number;
    reports_by_entity_type: Record<string, number>;
    most_common_entities: Array<{
      entity_type: string;
      entity_id: string;
      entity_name: string;
      report_count: number;
    }>;
    avg_entities_per_report: number;
    entity_involvement_trend: Array<{
      month: string;
      entity_count: number;
    }>;
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
let testIntakes: Intake[] = [];
let testEntities: Entity[] = [];
let testLinkIds: string[] = [];
let testAfterActionIds: string[] = [];

describe('T074: After-Action Reports with Entity Context', () => {
  beforeAll(async () => {
    supabase = getTestSupabaseClient();
    
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'After-Action Test Org' })
      .select()
      .single();
    testOrganizationId = org!.id;

    // Create test user
    testUser = await createTestUser(3, testOrganizationId);

    // Create test entities
    const dossierEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Dossier AAR-1',
      classification_level: 2,
    });

    const positionEntity = await createTestEntity('position', testOrganizationId, {
      name: 'Position AAR-2',
      classification_level: 2,
    });

    const mouEntity = await createTestEntity('mou', testOrganizationId, {
      name: 'MOU Agreement AAR-3',
      classification_level: 2,
    });

    testEntities = [dossierEntity, positionEntity, mouEntity];

    // Create completed intakes for after-action reports
    const intake1 = await createTestIntake(testOrganizationId, {
      title: 'Completed Intake 1 - Multiple Entities',
      status: 'completed',
      priority: 4,
      assigned_to: testUser.id,
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    });

    const intake2 = await createTestIntake(testOrganizationId, {
      title: 'Completed Intake 2 - Single Entity',
      status: 'completed',
      priority: 3,
      assigned_to: testUser.id,
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    });

    testIntakes = [intake1, intake2];

    // Create entity links for intake1 (multiple entities)
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
      'mentioned',
      testUser.id,
      { notes: 'Referenced in documentation' }
    );

    // Create single entity link for intake2
    const link4 = await createTestLink(
      intake2.id,
      'dossier',
      dossierEntity.entity_id,
      'primary',
      testUser.id
    );

    testLinkIds = [link1.link_id, link2.link_id, link3.link_id, link4.link_id];

    console.log('✅ After-action test environment ready');
  });

  afterAll(async () => {
    await cleanupTestData({
      userIds: [testUser.id],
      intakeIds: testIntakes.map(i => i.id),
      linkIds: testLinkIds,
      organizationIds: [testOrganizationId],
    });

    // Cleanup after-action reports
    if (testAfterActionIds.length > 0) {
      await supabase
        .from('after_action_records')
        .delete()
        .in('id', testAfterActionIds);
    }

    console.log('✅ After-action test cleanup complete');
  });

  it('should create after-action report with entity context', async () => {
    const afterActionRequest: AfterActionRequest = {
      intake_id: testIntakes[0].id,
      summary: 'Successfully processed intake involving multiple entities across dossiers, positions, and agreements.',
      outcomes: [
        'Dossier updated with latest intelligence',
        'Position requirements clarified',
        'MOU agreement terms validated',
      ],
      lessons_learned: 'Coordination across multiple entities requires early stakeholder engagement.',
      include_entity_context: true,
      include_entity_timeline: false,
    };

    const response = await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(afterActionRequest),
    });

    expect(response.status).toBe(201);

    const responseData: AfterActionResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.after_action_id).toBeDefined();
    expect(responseData.data!.intake_id).toBe(testIntakes[0].id);
    expect(responseData.data!.summary).toBe(afterActionRequest.summary);
    expect(responseData.data!.outcomes.length).toBe(3);
    expect(responseData.data!.status).toBe('draft');

    // Verify entity context is included
    expect(responseData.data!.entity_context).toBeDefined();
    expect(responseData.data!.entity_context!.total_entities).toBe(3);
    expect(responseData.data!.entity_context!.entity_types_involved).toContain('dossier');
    expect(responseData.data!.entity_context!.entity_types_involved).toContain('position');
    expect(responseData.data!.entity_context!.entity_types_involved).toContain('mou');

    // Verify linked entities details
    const linkedEntities = responseData.data!.entity_context!.linked_entities;
    expect(linkedEntities.length).toBe(3);
    expect(linkedEntities.some(e => e.entity_type === 'dossier' && e.link_type === 'primary')).toBe(true);
    expect(linkedEntities.some(e => e.entity_type === 'position' && e.link_type === 'related')).toBe(true);
    expect(linkedEntities.some(e => e.entity_type === 'mou' && e.link_type === 'mentioned')).toBe(true);

    testAfterActionIds.push(responseData.data!.after_action_id);
  });

  it('should include entity timeline in after-action report when requested', async () => {
    const afterActionRequest: AfterActionRequest = {
      intake_id: testIntakes[0].id,
      summary: 'Report with entity timeline',
      outcomes: ['Timeline generated successfully'],
      include_entity_context: true,
      include_entity_timeline: true,
    };

    const response = await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(afterActionRequest),
    });

    expect(response.status).toBe(201);

    const responseData: AfterActionResponse = await response.json();
    
    // Verify entity timeline is included
    expect(responseData.data!.entity_timeline).toBeDefined();
    expect(responseData.data!.entity_timeline!.length).toBeGreaterThan(0);

    // Verify timeline structure
    responseData.data!.entity_timeline!.forEach(event => {
      expect(event.event_type).toBeDefined();
      expect(event.entity_type).toBeDefined();
      expect(event.entity_name).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.description).toBeDefined();
    });

    // Timeline should include link creation events
    expect(responseData.data!.entity_timeline!.some(e => e.event_type === 'link_created')).toBe(true);

    testAfterActionIds.push(responseData.data!.after_action_id);
  });

  it('should filter after-action reports by entity involvement', async () => {
    // Create multiple reports first
    const report1Request: AfterActionRequest = {
      intake_id: testIntakes[0].id,
      summary: 'Report 1 with dossier entity',
      outcomes: ['Outcome 1'],
      include_entity_context: true,
    };

    const report2Request: AfterActionRequest = {
      intake_id: testIntakes[1].id,
      summary: 'Report 2 with single dossier',
      outcomes: ['Outcome 2'],
      include_entity_context: true,
    };

    // Create both reports
    await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report1Request),
    });

    await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report2Request),
    });

    // Query reports filtered by dossier entity
    const response = await fetch(
      `${API_BASE_URL}/after-actions?entity_id=${testEntities[0].entity_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const responseData: AfterActionListResponse = await response.json();
    expect(responseData.success).toBe(true);
    
    // Should return both reports (both have dossier entity)
    expect(responseData.data!.length).toBe(2);
    responseData.data!.forEach(report => {
      expect(report.entity_types).toContain('dossier');
    });
  });

  it('should generate entity-based analytics for after-action reports', async () => {
    const response = await fetch(
      `${API_BASE_URL}/after-actions/analytics?entity_breakdown=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const responseData: AfterActionAnalyticsResponse = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data!.total_reports).toBeGreaterThan(0);

    // Verify entity type breakdown
    expect(responseData.data!.reports_by_entity_type).toBeDefined();
    expect(responseData.data!.reports_by_entity_type.dossier).toBeGreaterThan(0);

    // Verify most common entities
    expect(responseData.data!.most_common_entities).toBeDefined();
    expect(responseData.data!.most_common_entities.length).toBeGreaterThan(0);
    expect(responseData.data!.most_common_entities[0].report_count).toBeGreaterThan(0);

    // Verify average calculation
    expect(responseData.data!.avg_entities_per_report).toBeGreaterThan(0);

    // Verify involvement trend
    expect(responseData.data!.entity_involvement_trend).toBeDefined();
    expect(Array.isArray(responseData.data!.entity_involvement_trend)).toBe(true);
  });

  it('should enforce clearance levels for after-action reports with classified entities', async () => {
    // Create high-classification entity
    const secretEntity = await createTestEntity('dossier', testOrganizationId, {
      name: 'Secret Dossier',
      classification_level: 4, // Secret
    });

    // Create intake with secret entity
    const secretIntake = await createTestIntake(testOrganizationId, {
      title: 'Classified Intake',
      status: 'completed',
      priority: 5,
      assigned_to: testUser.id, // User has clearance 3
      completed_at: new Date().toISOString(),
    });

    await createTestLink(
      secretIntake.id,
      'dossier',
      secretEntity.entity_id,
      'primary',
      testUser.id
    );

    // Attempt to create report (user has insufficient clearance)
    const afterActionRequest: AfterActionRequest = {
      intake_id: secretIntake.id,
      summary: 'Report with classified entity',
      outcomes: ['Outcome 1'],
      include_entity_context: true,
    };

    const response = await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(afterActionRequest),
    });

    expect(response.status).toBe(403);

    const responseData: AfterActionResponse = await response.json();
    expect(responseData.error!.code).toBe('INSUFFICIENT_CLEARANCE');
    expect(responseData.error!.details.required_clearance).toBe(4);
    expect(responseData.error!.details.user_clearance).toBe(3);

    // Cleanup
    await cleanupTestData({
      intakeIds: [secretIntake.id],
    });
  });

  it('should respect organization boundaries for after-action reports', async () => {
    // Create user in different organization
    const { data: otherOrg } = await supabase
      .from('organizations')
      .insert({ name: 'Other AAR Org' })
      .select()
      .single();

    const otherUser = await createTestUser(3, otherOrg!.id);

    // Attempt to create report for intake in another organization
    const afterActionRequest: AfterActionRequest = {
      intake_id: testIntakes[0].id, // Belongs to testOrganizationId
      summary: 'Unauthorized report',
      outcomes: ['Outcome 1'],
    };

    const response = await fetch(`${API_BASE_URL}/after-actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${otherUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(afterActionRequest),
    });

    expect(response.status).toBe(403);

    const responseData: AfterActionResponse = await response.json();
    expect(responseData.error!.code).toBe('ORGANIZATION_MISMATCH');

    // Cleanup
    await cleanupTestData({
      userIds: [otherUser.id],
      organizationIds: [otherOrg!.id],
    });
  });
});
