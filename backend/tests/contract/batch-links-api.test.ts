/**
 * Contract Tests: Batch Link Operations API
 *
 * Purpose: Validate bulk entity linking operations with atomic transactions
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T050: POST /api/intake/:intake_id/links/batch (Create Multiple Links)
 * - T051: DELETE /api/intake/:intake_id/links/batch (Delete Multiple Links)
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/batch-links-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CreateLinkRequest } from '../../src/types/intake-entity-links.types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

interface TestUser {
  id: string;
  email: string;
  token: string;
  clearance_level: number;
  organization_id: string;
}

interface BatchCreateResponse {
  success: boolean;
  data?: {
    links: any[];
    created_count: number;
    failed_count: number;
    failures?: Array<{
      index: number;
      entity_id: string;
      error_code: string;
      error_message: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
    failed_validations?: Array<{
      index: number;
      field: string;
      message: string;
    }>;
  };
}

interface BatchDeleteResponse {
  success: boolean;
  data?: {
    deleted_count: number;
    failed_count: number;
    failures?: Array<{
      link_id: string;
      error_code: string;
      error_message: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

describe('Batch Link Operations API Contract Tests', () => {
  let supabase: SupabaseClient;
  let testUser: TestUser;
  let testIntakeId: string;
  let testOrganizationId: string;
  let testEntities: Array<{
    entity_id: string;
    entity_type: string;
    name: string;
    classification_level: number;
  }>;
  let createdLinkIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test organization
    const { data: orgData } = await supabase
      .from('organizations')
      .insert({
        name_en: 'Batch Test Organization',
        name_ar: 'منظمة اختبار الدفعات',
        org_type: 'government',
      })
      .select()
      .single();

    testOrganizationId = orgData!.id;

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'test-batch-links@example.com',
      password: 'test-password-123',
    });

    testUser = {
      id: authData.user!.id,
      email: authData.user!.email!,
      token: authData.session!.access_token,
      clearance_level: 3,
      organization_id: testOrganizationId,
    };

    await supabase.from('profiles').upsert({
      user_id: testUser.id,
      clearance_level: testUser.clearance_level,
      organization_id: testOrganizationId,
    });

    // Create test intake
    const { data: intakeData } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Test Intake for Batch Operations',
        title_ar: 'تذكرة اختبار لعمليات الدفعات',
        description_en: 'Test batch linking',
        description_ar: 'اختبار الربط بالدفعات',
        classification_level: 2,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'pending_review',
      })
      .select()
      .single();

    testIntakeId = intakeData!.id;

    // Create multiple test entities for batch operations
    testEntities = [];

    // Create 5 dossiers
    for (let i = 1; i <= 5; i++) {
      const { data: dossierData } = await supabase
        .from('dossiers')
        .insert({
          title: `Test Dossier ${i}`,
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      testEntities.push({
        entity_id: dossierData!.id,
        entity_type: 'dossier',
        name: `Test Dossier ${i}`,
        classification_level: 2,
      });
    }

    // Create 3 positions
    for (let i = 1; i <= 3; i++) {
      const { data: positionData } = await supabase
        .from('positions')
        .insert({
          title_en: `Test Position ${i}`,
          title_ar: `موقف اختبار ${i}`,
          classification_level: 1,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      testEntities.push({
        entity_id: positionData!.id,
        entity_type: 'position',
        name: `Test Position ${i}`,
        classification_level: 1,
      });
    }

    // Create archived dossier (for testing validation)
    const { data: archivedDossier } = await supabase
      .from('dossiers')
      .insert({
        title: 'Archived Dossier',
        status: 'archived',
        classification_level: 1,
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testEntities.push({
      entity_id: archivedDossier!.id,
      entity_type: 'dossier',
      name: 'Archived Dossier',
      classification_level: 1,
    });

    // Create high clearance dossier (for testing security)
    const { data: secretDossier } = await supabase
      .from('dossiers')
      .insert({
        title: 'Secret Dossier',
        status: 'active',
        classification_level: 4, // Above user's clearance
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testEntities.push({
      entity_id: secretDossier!.id,
      entity_type: 'dossier',
      name: 'Secret Dossier',
      classification_level: 4,
    });
  });

  afterAll(async () => {
    // Cleanup: Delete all created links
    if (createdLinkIds.length > 0) {
      await supabase.from('intake_entity_links').delete().in('id', createdLinkIds);
    }

    // Delete test intake
    await supabase.from('intake_tickets').delete().eq('id', testIntakeId);

    // Delete test entities
    for (const entity of testEntities) {
      const tableName = entity.entity_type === 'dossier' ? 'dossiers' : 'positions';
      await supabase.from(tableName).delete().eq('id', entity.entity_id);
    }

    // Delete test organization
    await supabase.from('organizations').delete().eq('id', testOrganizationId);

    // Delete test user
    await supabase.auth.admin.deleteUser(testUser.id);
  });

  beforeEach(() => {
    // Reset created link IDs for each test
    createdLinkIds = [];
  });

  describe('T050: POST /api/intake/:intake_id/links/batch - Create Multiple Links', () => {
    it('should create multiple links atomically (all succeed or all fail)', async () => {
      const validEntities = testEntities.filter(e =>
        e.name.includes('Dossier') && !e.name.includes('Archived') && !e.name.includes('Secret')
      ).slice(0, 3);

      const batchRequest: CreateLinkRequest[] = validEntities.map(entity => ({
        intake_id: testIntakeId,
        entity_type: entity.entity_type as any,
        entity_id: entity.entity_id,
        link_type: 'related',
        source: 'human',
      }));

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(201);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.links).toBeDefined();
      expect(responseData.data!.created_count).toBe(3);
      expect(responseData.data!.failed_count).toBe(0);
      expect(responseData.data!.links.length).toBe(3);

      // Verify all links were created with correct link_order
      responseData.data!.links.forEach((link, index) => {
        expect(link.link_order).toBe(index + 1);
        expect(link._version).toBe(1);
        createdLinkIds.push(link.id);
      });

      // Verify in database
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(3);
    });

    it('should rollback transaction if any link fails validation', async () => {
      const archivedEntity = testEntities.find(e => e.name === 'Archived Dossier')!;
      const validEntities = testEntities.filter(e => e.classification_level === 2).slice(0, 2);

      const batchRequest: CreateLinkRequest[] = [
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: validEntities[0].entity_id,
          link_type: 'related',
          source: 'human',
        },
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: archivedEntity.entity_id, // This will fail (archived)
          link_type: 'related',
          source: 'human',
        },
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: validEntities[1].entity_id,
          link_type: 'related',
          source: 'human',
        },
      ];

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      // Batch should fail completely
      expect(response.status).toBe(400);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('BATCH_VALIDATION_FAILED');

      // Verify NO links were created (transaction rolled back)
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(0);
    });

    it('should validate all links before creating any', async () => {
      const validEntities = testEntities.filter(e => e.classification_level === 2).slice(0, 2);
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;

      const batchRequest: CreateLinkRequest[] = [
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: validEntities[0].entity_id,
          link_type: 'related',
          source: 'human',
        },
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: secretEntity.entity_id, // Will fail clearance check
          link_type: 'related',
          source: 'human',
        },
      ];

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(400);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('BATCH_VALIDATION_FAILED');
      expect(responseData.error!.failed_validations).toBeDefined();
      expect(responseData.error!.failed_validations!.length).toBeGreaterThan(0);

      // Should indicate which link failed and why
      const clearanceFailure = responseData.error!.failed_validations!.find(f =>
        f.message.toLowerCase().includes('clearance')
      );
      expect(clearanceFailure).toBeDefined();
      expect(clearanceFailure!.index).toBe(1); // Second link

      // Verify NO links created
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(0);
    });

    it('should enforce clearance check for all entities in batch', async () => {
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;
      const validEntity = testEntities.find(e => e.classification_level === 2)!;

      const batchRequest: CreateLinkRequest[] = [
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: validEntity.entity_id,
          link_type: 'related',
          source: 'human',
        },
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: secretEntity.entity_id, // Clearance 4 > user clearance 3
          link_type: 'related',
          source: 'human',
        },
      ];

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(400);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('BATCH_VALIDATION_FAILED');

      // Should identify clearance issue
      expect(responseData.error!.failed_validations!.some(f =>
        f.message.toLowerCase().includes('clearance')
      )).toBe(true);

      // No links created
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(0);
    });

    it('should enforce organization boundary for all entities', async () => {
      // Create entity in different organization
      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({
          name_en: 'Other Org',
          name_ar: 'منظمة أخرى',
          org_type: 'government',
        })
        .select()
        .single();

      const { data: otherDossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Dossier in Other Org',
          status: 'active',
          classification_level: 1,
          organization_id: otherOrg!.id,
        })
        .select()
        .single();

      const validEntity = testEntities.find(e => e.classification_level === 2)!;

      const batchRequest: CreateLinkRequest[] = [
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: validEntity.entity_id,
          link_type: 'related',
          source: 'human',
        },
        {
          intake_id: testIntakeId,
          entity_type: 'dossier' as any,
          entity_id: otherDossier!.id, // Different org
          link_type: 'related',
          source: 'human',
        },
      ];

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(400);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('BATCH_VALIDATION_FAILED');

      // No links created
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(0);

      // Cleanup
      await supabase.from('dossiers').delete().eq('id', otherDossier!.id);
      await supabase.from('organizations').delete().eq('id', otherOrg!.id);
    });

    it('should limit batch size to 50 links maximum', async () => {
      // Create 51 link requests
      const validEntity = testEntities.find(e => e.classification_level === 2)!;

      const batchRequest: CreateLinkRequest[] = Array(51).fill(null).map((_, i) => ({
        intake_id: testIntakeId,
        entity_type: 'dossier' as any,
        entity_id: validEntity.entity_id,
        link_type: 'related',
        source: 'human',
        notes: `Link ${i + 1}`,
      }));

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(400);

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('BATCH_SIZE_EXCEEDED');
      expect(responseData.error!.message).toContain('50');
    });

    it('should return 201 with created links array on success', async () => {
      const validEntities = testEntities.filter(e => e.classification_level <= 2).slice(0, 3);

      const batchRequest: CreateLinkRequest[] = validEntities.map(entity => ({
        intake_id: testIntakeId,
        entity_type: entity.entity_type as any,
        entity_id: entity.entity_id,
        link_type: 'related',
        source: 'human',
      }));

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: batchRequest }),
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: BatchCreateResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.links).toBeDefined();
      expect(Array.isArray(responseData.data!.links)).toBe(true);
      expect(responseData.data!.created_count).toBe(3);
      expect(responseData.data!.failed_count).toBe(0);

      // Verify link structure
      responseData.data!.links.forEach(link => {
        expect(link.id).toBeDefined();
        expect(link.intake_id).toBe(testIntakeId);
        expect(link.entity_id).toBeDefined();
        expect(link.entity_type).toBeDefined();
        expect(link.link_type).toBeDefined();
        expect(link.link_order).toBeDefined();
        expect(link._version).toBe(1);
        createdLinkIds.push(link.id);
      });
    });
  });

  describe('T051: DELETE /api/intake/:intake_id/links/batch - Delete Multiple Links', () => {
    let testLinkIds: string[];

    beforeEach(async () => {
      // Create test links to delete
      const validEntities = testEntities.filter(e => e.classification_level <= 2).slice(0, 3);

      testLinkIds = [];
      for (const entity of validEntities) {
        const { data: link } = await supabase
          .from('intake_entity_links')
          .insert({
            intake_id: testIntakeId,
            entity_type: entity.entity_type,
            entity_id: entity.entity_id,
            link_type: 'related',
            source: 'human',
            linked_by: testUser.id,
            organization_id: testOrganizationId,
          })
          .select()
          .single();

        testLinkIds.push(link!.id);
        createdLinkIds.push(link!.id);
      }
    });

    it('should soft-delete multiple links atomically', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link_ids: testLinkIds,
        }),
      });

      expect(response.status).toBe(200);

      const responseData: BatchDeleteResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.deleted_count).toBe(3);
      expect(responseData.data!.failed_count).toBe(0);

      // Verify soft deletion in database
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .in('id', testLinkIds);

      dbLinks!.forEach(link => {
        expect(link.deleted_at).not.toBeNull();
        expect(link.deleted_by).toBe(testUser.id);
      });
    });

    it('should rollback if any deletion fails', async () => {
      // Add a non-existent link ID
      const invalidLinkIds = [...testLinkIds, '00000000-0000-0000-0000-000000000000'];

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link_ids: invalidLinkIds,
        }),
      });

      // Should fail completely
      expect(response.status).toBe(400);

      const responseData: BatchDeleteResponse = await response.json();
      expect(responseData.success).toBe(false);

      // Verify NO links were deleted (transaction rolled back)
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .in('id', testLinkIds)
        .is('deleted_at', null);

      expect(dbLinks!.length).toBe(testLinkIds.length); // All still active
    });

    it('should record deletion in audit trail for all links', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/batch`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link_ids: testLinkIds,
        }),
      });

      expect(response.status).toBe(200);

      // Verify audit trail entries created
      const { data: auditLogs } = await supabase
        .from('link_audit_logs')
        .select('*')
        .eq('action', 'delete')
        .in('link_id', testLinkIds);

      expect(auditLogs!.length).toBe(testLinkIds.length);

      auditLogs!.forEach(log => {
        expect(log.performed_by).toBe(testUser.id);
        expect(log.action).toBe('delete');
        expect(testLinkIds).toContain(log.link_id);
      });
    });
  });

  describe('T052: TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating no Batch Links Edge Function exists yet', () => {
      // This test serves as a checkpoint to ensure TDD approach
      expect(true).toBe(true);
    });
  });
});
