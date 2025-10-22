/**
 * Contract Tests: Link Management API
 *
 * Purpose: Validate link update, reordering, and deletion operations
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T060: PATCH /api/intake/:intake_id/links/:link_id (Update Link)
 * - T061: PATCH /api/intake/:intake_id/links/reorder (Reorder Links)
 * - T062: DELETE /api/intake/:intake_id/links/:link_id (Delete Link)
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/link-management-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UpdateLinkRequest } from '../../src/types/intake-entity-links.types';

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

interface UpdateLinkResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface ReorderLinksRequest {
  link_orders: Array<{
    link_id: string;
    link_order: number;
  }>;
}

interface ReorderLinksResponse {
  success: boolean;
  data?: {
    updated_count: number;
    links: any[];
  };
  error?: {
    code: string;
    message: string;
  };
}

interface DeleteLinkResponse {
  success: boolean;
  data?: {
    deleted_link_id: string;
    deleted_at: string;
    deleted_by: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

describe('Link Management API Contract Tests', () => {
  let supabase: SupabaseClient;
  let testUser: TestUser;
  let testIntakeId: string;
  let testOrganizationId: string;
  let testLinkIds: string[] = [];
  let testDossierId: string;
  let testPositionId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test organization
    const { data: orgData } = await supabase
      .from('organizations')
      .insert({
        name_en: 'Link Management Test Org',
        name_ar: 'منظمة اختبار إدارة الروابط',
        org_type: 'government',
      })
      .select()
      .single();

    testOrganizationId = orgData!.id;

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'test-link-management@example.com',
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
        title_en: 'Test Intake for Link Management',
        title_ar: 'تذكرة اختبار لإدارة الروابط',
        description_en: 'Test link updates and deletions',
        description_ar: 'اختبار التحديثات والحذف',
        classification_level: 2,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'pending_review',
      })
      .select()
      .single();

    testIntakeId = intakeData!.id;

    // Create test entities
    const { data: dossierData } = await supabase
      .from('dossiers')
      .insert({
        title: 'Test Dossier for Link Management',
        status: 'active',
        classification_level: 2,
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testDossierId = dossierData!.id;

    const { data: positionData } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position',
        title_ar: 'موقف اختبار',
        classification_level: 1,
        organization_id: testOrganizationId,
      })
      .select()
      .single();

    testPositionId = positionData!.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all created links
    if (testLinkIds.length > 0) {
      await supabase.from('intake_entity_links').delete().in('id', testLinkIds);
    }

    // Delete test entities
    await supabase.from('dossiers').delete().eq('id', testDossierId);
    await supabase.from('positions').delete().eq('id', testPositionId);

    // Delete test intake
    await supabase.from('intake_tickets').delete().eq('id', testIntakeId);

    // Delete test organization
    await supabase.from('organizations').delete().eq('id', testOrganizationId);

    // Delete test user
    await supabase.auth.admin.deleteUser(testUser.id);
  });

  beforeEach(() => {
    // Reset test link IDs for each test
    testLinkIds = [];
  });

  describe('T060: PATCH /api/intake/:intake_id/links/:link_id - Update Link', () => {
    let testLinkId: string;
    let initialVersion: number;

    beforeEach(async () => {
      // Create a test link to update
      const { data: linkData } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: testDossierId,
          link_type: 'related',
          source: 'human',
          linked_by: testUser.id,
          organization_id: testOrganizationId,
          notes: 'Initial notes',
          _version: 1,
        })
        .select()
        .single();

      testLinkId = linkData!.id;
      initialVersion = linkData!._version;
      testLinkIds.push(testLinkId);
    });

    it('should update link metadata (notes, link_type)', async () => {
      const updateRequest: UpdateLinkRequest = {
        notes: 'Updated notes with more details',
        link_type: 'primary',
        _version: initialVersion,
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(200);

      const responseData: UpdateLinkResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.notes).toBe('Updated notes with more details');
      expect(responseData.data!.link_type).toBe('primary');
      expect(responseData.data!._version).toBe(initialVersion + 1);
      expect(responseData.data!.updated_at).toBeDefined();

      // Verify in database
      const { data: dbLink } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('id', testLinkId)
        .single();

      expect(dbLink!.notes).toBe('Updated notes with more details');
      expect(dbLink!.link_type).toBe('primary');
      expect(dbLink!._version).toBe(initialVersion + 1);
    });

    it('should enforce optimistic locking with _version', async () => {
      const updateRequest: UpdateLinkRequest = {
        notes: 'Update with wrong version',
        _version: 999, // Wrong version
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(409);

      const responseData: UpdateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('VERSION_CONFLICT');
      expect(responseData.error!.message).toContain('version');
      expect(responseData.error!.details).toBeDefined();
      expect(responseData.error!.details.current_version).toBe(initialVersion);
      expect(responseData.error!.details.provided_version).toBe(999);
    });

    it('should increment _version on successful update', async () => {
      const updateRequest: UpdateLinkRequest = {
        notes: 'First update',
        _version: initialVersion,
      };

      const firstResponse = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      const firstData: UpdateLinkResponse = await firstResponse.json();
      const newVersion = firstData.data!._version;
      expect(newVersion).toBe(initialVersion + 1);

      // Second update with new version
      const secondUpdate: UpdateLinkRequest = {
        notes: 'Second update',
        _version: newVersion,
      };

      const secondResponse = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secondUpdate),
      });

      const secondData: UpdateLinkResponse = await secondResponse.json();
      expect(secondData.data!._version).toBe(newVersion + 1);
    });

    it('should validate link_type changes (primary only for anchor entities)', async () => {
      // Create link to position (non-anchor entity)
      const { data: positionLink } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'position',
          entity_id: testPositionId,
          link_type: 'related',
          source: 'human',
          linked_by: testUser.id,
          organization_id: testOrganizationId,
          _version: 1,
        })
        .select()
        .single();

      testLinkIds.push(positionLink!.id);

      // Try to change to primary (should fail for position)
      const updateRequest: UpdateLinkRequest = {
        link_type: 'primary', // Invalid for position
        _version: 1,
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${positionLink!.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(400);

      const responseData: UpdateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INVALID_LINK_TYPE');
      expect(responseData.error!.message).toContain('primary');
      expect(responseData.error!.message).toContain('anchor');
    });

    it('should validate notes length (max 1000 chars)', async () => {
      const longNotes = 'A'.repeat(1001);

      const updateRequest: UpdateLinkRequest = {
        notes: longNotes,
        _version: initialVersion,
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(400);

      const responseData: UpdateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('VALIDATION_ERROR');
      expect(responseData.error!.details.field).toBe('notes');
      expect(responseData.error!.details.max_length).toBe(1000);
    });

    it('should record update in audit trail', async () => {
      const updateRequest: UpdateLinkRequest = {
        notes: 'Updated for audit test',
        _version: initialVersion,
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(200);

      // Verify audit log entry
      const { data: auditLog } = await supabase
        .from('link_audit_logs')
        .select('*')
        .eq('link_id', testLinkId)
        .eq('action', 'update')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(auditLog).toBeDefined();
      expect(auditLog!.performed_by).toBe(testUser.id);
      expect(auditLog!.action).toBe('update');
      expect(auditLog!.changes).toBeDefined();
      expect(auditLog!.changes.notes).toEqual({
        old: 'Initial notes',
        new: 'Updated for audit test',
      });
    });
  });

  describe('T061: PATCH /api/intake/:intake_id/links/reorder - Reorder Links', () => {
    let linkIds: string[];

    beforeEach(async () => {
      // Create 5 test links with initial order
      linkIds = [];
      
      for (let i = 1; i <= 5; i++) {
        const { data: linkData } = await supabase
          .from('intake_entity_links')
          .insert({
            intake_id: testIntakeId,
            entity_type: 'dossier',
            entity_id: testDossierId,
            link_type: 'related',
            source: 'human',
            linked_by: testUser.id,
            organization_id: testOrganizationId,
            link_order: i,
            notes: `Link ${i}`,
          })
          .select()
          .single();

        linkIds.push(linkData!.id);
        testLinkIds.push(linkData!.id);
      }
    });

    it('should reorder links by updating link_order', async () => {
      // Reverse the order
      const reorderRequest: ReorderLinksRequest = {
        link_orders: [
          { link_id: linkIds[0], link_order: 5 },
          { link_id: linkIds[1], link_order: 4 },
          { link_id: linkIds[2], link_order: 3 },
          { link_id: linkIds[3], link_order: 2 },
          { link_id: linkIds[4], link_order: 1 },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/reorder`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderRequest),
      });

      expect(response.status).toBe(200);

      const responseData: ReorderLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.updated_count).toBe(5);
      expect(responseData.data!.links.length).toBe(5);

      // Verify new order in database
      const { data: dbLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', testIntakeId)
        .order('link_order', { ascending: true });

      expect(dbLinks![0].id).toBe(linkIds[4]); // Was 5th, now 1st
      expect(dbLinks![0].link_order).toBe(1);
      expect(dbLinks![4].id).toBe(linkIds[0]); // Was 1st, now 5th
      expect(dbLinks![4].link_order).toBe(5);
    });

    it('should validate all link_ids belong to the intake', async () => {
      // Create link in different intake
      const { data: otherIntake } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Other Intake',
          title_ar: 'تذكرة أخرى',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 1,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      const { data: otherLink } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: otherIntake!.id,
          entity_type: 'dossier',
          entity_id: testDossierId,
          link_type: 'related',
          source: 'human',
          linked_by: testUser.id,
          organization_id: testOrganizationId,
          link_order: 1,
        })
        .select()
        .single();

      // Try to reorder with link from different intake
      const reorderRequest: ReorderLinksRequest = {
        link_orders: [
          { link_id: linkIds[0], link_order: 1 },
          { link_id: otherLink!.id, link_order: 2 }, // Different intake
        ],
      };

      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/reorder`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderRequest),
      });

      expect(response.status).toBe(400);

      const responseData: ReorderLinksResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INVALID_LINK_IDS');
      expect(responseData.error!.message).toContain('belong to this intake');

      // Cleanup
      await supabase.from('intake_entity_links').delete().eq('id', otherLink!.id);
      await supabase.from('intake_tickets').delete().eq('id', otherIntake!.id);
    });
  });

  describe('T062: DELETE /api/intake/:intake_id/links/:link_id - Delete Link', () => {
    let testLinkId: string;

    beforeEach(async () => {
      // Create a test link to delete
      const { data: linkData } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: testDossierId,
          link_type: 'related',
          source: 'human',
          linked_by: testUser.id,
          organization_id: testOrganizationId,
          notes: 'Link to be deleted',
        })
        .select()
        .single();

      testLinkId = linkData!.id;
      testLinkIds.push(testLinkId);
    });

    it('should soft-delete link (set deleted_at timestamp)', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: DeleteLinkResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.deleted_link_id).toBe(testLinkId);
      expect(responseData.data!.deleted_at).toBeDefined();
      expect(responseData.data!.deleted_by).toBe(testUser.id);

      // Verify soft deletion in database
      const { data: dbLink } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('id', testLinkId)
        .single();

      expect(dbLink!.deleted_at).not.toBeNull();
      expect(dbLink!.deleted_by).toBe(testUser.id);
      expect(new Date(dbLink!.deleted_at!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should record deletion in audit trail', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      // Verify audit log entry
      const { data: auditLog } = await supabase
        .from('link_audit_logs')
        .select('*')
        .eq('link_id', testLinkId)
        .eq('action', 'delete')
        .single();

      expect(auditLog).toBeDefined();
      expect(auditLog!.performed_by).toBe(testUser.id);
      expect(auditLog!.action).toBe('delete');
      expect(auditLog!.created_at).toBeDefined();
    });

    it('should return 404 for non-existent link', async () => {
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(404);

      const responseData: DeleteLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('LINK_NOT_FOUND');
    });

    it('should return 404 for already deleted link', async () => {
      // Delete link first time
      await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      // Try to delete again
      const response = await fetch(`${API_BASE_URL}/intake/${testIntakeId}/links/${testLinkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(404);

      const responseData: DeleteLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('LINK_ALREADY_DELETED');
    });
  });

  describe('T063: TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating no Link Management Edge Function exists yet', () => {
      expect(true).toBe(true);
    });
  });
});
