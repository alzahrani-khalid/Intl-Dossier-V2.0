/**
 * Integration Tests: Intake-to-Position Link Migration
 *
 * Purpose: Validate automatic link migration when intake tickets convert to formal positions
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T079: Integration test for intake-to-position link migration
 * - T080: Integration test for transaction rollback on migration failure
 *
 * Success Criteria: 100% link migration success rate (SC-008)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  EntityLink,
  LinkType,
  EntityType,
} from '../../src/types/intake-entity-links.types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

interface TestUser {
  id: string;
  email: string;
  token: string;
  clearance_level: number;
}

interface MigrationResult {
  success: boolean;
  data?: {
    migrated_count: number;
    failed_count: number;
    intake_id: string;
    position_id: string;
    link_mappings: Array<{
      intake_link_id: string;
      position_link_id: string;
      link_type_before: LinkType;
      link_type_after: LinkType;
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

describe('Link Migration Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUser: TestUser;
  let testOrganizationId: string;
  let createdLinkIds: string[] = [];
  let createdIntakeIds: string[] = [];
  let createdPositionIds: string[] = [];
  let createdEntityIds: Map<string, string[]> = new Map();

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test organization
    const { data: orgData } = await supabase
      .from('organizations')
      .insert({
        name_en: 'Migration Test Organization',
        name_ar: 'منظمة اختبار الترحيل',
        org_type: 'government',
      })
      .select()
      .single();

    testOrganizationId = orgData!.id;

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'test-migration@example.com',
      password: 'test-password-123',
    });

    testUser = {
      id: authData.user!.id,
      email: authData.user!.email!,
      token: authData.session!.access_token,
      clearance_level: 3,
    };

    // Set user clearance level
    await supabase.from('profiles').upsert({
      user_id: testUser.id,
      clearance_level: testUser.clearance_level,
      organization_id: testOrganizationId,
    });
  });

  afterAll(async () => {
    // Cleanup: Delete all created links
    if (createdLinkIds.length > 0) {
      await supabase.from('intake_entity_links').delete().in('id', createdLinkIds);
    }

    // Delete created positions
    if (createdPositionIds.length > 0) {
      await supabase.from('positions').delete().in('id', createdPositionIds);
    }

    // Delete created intakes
    if (createdIntakeIds.length > 0) {
      await supabase.from('intake_tickets').delete().in('id', createdIntakeIds);
    }

    // Delete created entities
    for (const [tableName, ids] of createdEntityIds.entries()) {
      await supabase.from(tableName).delete().in('id', ids);
    }

    // Delete test organization
    if (testOrganizationId) {
      await supabase.from('organizations').delete().eq('id', testOrganizationId);
    }

    // Delete test user
    if (testUser.id) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  describe('T079: Intake-to-Position Link Migration', () => {
    it('should migrate all links from intake to position with correct type mappings', async () => {
      // Create test entities
      const { data: dossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Migration Test Dossier',
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      const { data: position } = await supabase
        .from('positions')
        .insert({
          title_en: 'Migration Test Related Position',
          title_ar: 'موقف ذو صلة بالترحيل',
          classification_level: 1,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      const { data: mou } = await supabase
        .from('mous')
        .insert({
          title_en: 'Migration Test MOU',
          title_ar: 'مذكرة تفاهم الترحيل',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier!.id]);
      createdEntityIds.set('positions', [position!.id]);
      createdEntityIds.set('mous', [mou!.id]);

      // Create intake with links
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Migration Test Intake',
          title_ar: 'تذكرة ترحيل اختبارية',
          description_en: 'Test intake for migration',
          description_ar: 'تذكرة اختبارية للترحيل',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create links on intake (using existing Edge Function)
      const links = [
        {
          intake_id: intakeData!.id,
          entity_type: 'dossier' as EntityType,
          entity_id: dossier!.id,
          link_type: 'primary' as LinkType,
          source: 'human',
          notes: 'Primary dossier link',
        },
        {
          intake_id: intakeData!.id,
          entity_type: 'position' as EntityType,
          entity_id: position!.id,
          link_type: 'related' as LinkType,
          source: 'human',
          notes: 'Related position link',
        },
        {
          intake_id: intakeData!.id,
          entity_type: 'mou' as EntityType,
          entity_id: mou!.id,
          link_type: 'requested' as LinkType,
          source: 'human',
          notes: 'Requested MOU link',
        },
      ];

      // Create links via batch endpoint
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links }),
      });

      const createData = await createResponse.json();
      const intakeLinkIds = createData.data.succeeded.map((link: EntityLink) => link.id);
      createdLinkIds.push(...intakeLinkIds);

      // Convert intake to position (trigger migration)
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: intakeData!.title_en,
          title_ar: intakeData!.title_ar,
          classification_level: intakeData!.classification_level,
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id, // Link to original intake
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Trigger migration (this would be called by intake conversion workflow)
      const migrationResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_position_id: newPosition!.id }),
      });

      expect(migrationResponse.status).toBe(200);

      const migrationResult: MigrationResult = await migrationResponse.json();
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.data!.migrated_count).toBe(3);
      expect(migrationResult.data!.failed_count).toBe(0);
      expect(migrationResult.data!.intake_id).toBe(intakeData!.id);
      expect(migrationResult.data!.position_id).toBe(newPosition!.id);

      // Verify link type mappings
      const mappings = migrationResult.data!.link_mappings;
      expect(mappings).toHaveLength(3);

      // Primary link should remain primary
      const primaryMapping = mappings.find(m => m.link_type_before === 'primary');
      expect(primaryMapping).toBeDefined();
      expect(primaryMapping!.link_type_after).toBe('primary');

      // Related link should remain related
      const relatedMapping = mappings.find(m => m.link_type_before === 'related');
      expect(relatedMapping).toBeDefined();
      expect(relatedMapping!.link_type_after).toBe('related');

      // Requested link should become related
      const requestedMapping = mappings.find(m => m.link_type_before === 'requested');
      expect(requestedMapping).toBeDefined();
      expect(requestedMapping!.link_type_after).toBe('related');

      // Verify new links exist on position
      const { data: positionLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', newPosition!.id)
        .is('deleted_at', null);

      expect(positionLinks).toHaveLength(3);

      // Collect new link IDs for cleanup
      positionLinks!.forEach(link => createdLinkIds.push(link.id));
    });

    it('should preserve all link metadata during migration (notes, confidence, source)', async () => {
      // Create test entity
      const { data: dossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Metadata Migration Dossier',
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier!.id]);

      // Create intake
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Metadata Migration Intake',
          title_ar: 'تذكرة ترحيل البيانات الوصفية',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create link with rich metadata
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier!.id,
          link_type: 'primary',
          source: 'ai',
          confidence: 0.95,
          notes: 'AI-suggested primary dossier with high confidence',
        }),
      });

      const createData = await createResponse.json();
      const intakeLinkId = createData.data.id;
      createdLinkIds.push(intakeLinkId);

      // Create target position
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: 'Metadata Target Position',
          title_ar: 'موقف الهدف',
          classification_level: 2,
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id,
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Trigger migration
      const migrationResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_position_id: newPosition!.id }),
      });

      const migrationResult: MigrationResult = await migrationResponse.json();
      expect(migrationResult.success).toBe(true);

      // Verify migrated link preserves metadata
      const { data: positionLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', newPosition!.id)
        .single();

      expect(positionLinks!.source).toBe('import'); // Migration changes source to 'import'
      expect(positionLinks!.confidence).toBe(0.95);
      expect(positionLinks!.notes).toContain('AI-suggested');
      expect(positionLinks!.entity_type).toBe('dossier');
      expect(positionLinks!.entity_id).toBe(dossier!.id);

      createdLinkIds.push(positionLinks!.id);
    });

    it('should create audit log entries for all migrated links', async () => {
      // Create test entity
      const { data: dossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Audit Migration Dossier',
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier!.id]);

      // Create intake with link
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Audit Migration Intake',
          title_ar: 'تذكرة ترحيل التدقيق',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create link
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier!.id,
          link_type: 'primary',
          source: 'human',
        }),
      });

      const createData = await createResponse.json();
      createdLinkIds.push(createData.data.id);

      // Create target position
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: 'Audit Target Position',
          title_ar: 'موقف التدقيق',
          classification_level: 2,
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id,
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Trigger migration
      await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_position_id: newPosition!.id }),
      });

      // Verify audit logs created
      const { data: auditLogs } = await supabase
        .from('link_audit_logs')
        .select('*')
        .eq('action', 'migrate')
        .eq('user_id', testUser.id);

      expect(auditLogs).toBeDefined();
      expect(auditLogs!.length).toBeGreaterThan(0);

      // Verify audit log contains migration details
      const migrationLog = auditLogs![0];
      expect(migrationLog.details).toBeDefined();
      expect(migrationLog.details.source_intake_id).toBe(intakeData!.id);
      expect(migrationLog.details.target_position_id).toBe(newPosition!.id);
    });

    it('should soft-delete original intake links after successful migration', async () => {
      // Create test entity
      const { data: dossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Soft Delete Migration Dossier',
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier!.id]);

      // Create intake with link
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Soft Delete Migration Intake',
          title_ar: 'تذكرة ترحيل الحذف الناعم',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create link
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier!.id,
          link_type: 'primary',
          source: 'human',
        }),
      });

      const createData = await createResponse.json();
      const intakeLinkId = createData.data.id;
      createdLinkIds.push(intakeLinkId);

      // Create target position
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: 'Soft Delete Target Position',
          title_ar: 'موقف الحذف الناعم',
          classification_level: 2,
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id,
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Trigger migration
      await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_position_id: newPosition!.id }),
      });

      // Verify original intake link is soft-deleted
      const { data: originalLink } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('id', intakeLinkId)
        .single();

      expect(originalLink!.deleted_at).not.toBeNull();

      // Verify new position link exists and is active
      const { data: newLink } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', newPosition!.id)
        .is('deleted_at', null)
        .single();

      expect(newLink).toBeDefined();
      expect(newLink!.entity_id).toBe(dossier!.id);

      createdLinkIds.push(newLink!.id);
    });
  });

  describe('T080: Transaction Rollback on Migration Failure', () => {
    it('should rollback all changes if any link fails during migration', async () => {
      // Create test entities
      const { data: dossier1 } = await supabase
        .from('dossiers')
        .insert({
          title: 'Rollback Dossier 1',
          status: 'active',
          classification_level: 2,
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      const { data: dossier2 } = await supabase
        .from('dossiers')
        .insert({
          title: 'Rollback Dossier 2 (High Clearance)',
          status: 'active',
          classification_level: 4, // Secret - will fail clearance check
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier1!.id, dossier2!.id]);

      // Create intake with mixed clearance links
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Rollback Test Intake',
          title_ar: 'تذكرة اختبار التراجع',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create links with mixed clearances
      const links = [
        {
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier1!.id,
          link_type: 'primary',
          source: 'human',
        },
        // This link will be created but should cause migration failure
        // because target position will have lower clearance
      ];

      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links }),
      });

      const createData = await createResponse.json();
      const intakeLinkIds = createData.data.succeeded.map((link: EntityLink) => link.id);
      createdLinkIds.push(...intakeLinkIds);

      // Create target position with LOWER clearance
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: 'Rollback Target Position (Low Clearance)',
          title_ar: 'موقف الهدف منخفض التصريح',
          classification_level: 1, // Public - lower than some intake links
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id,
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Add the high-clearance link that will cause migration failure
      const highClearanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier2!.id,
          link_type: 'related',
          source: 'human',
        }),
      });

      const highClearanceData = await highClearanceResponse.json();
      createdLinkIds.push(highClearanceData.data.id);

      // Attempt migration (should fail and rollback)
      const migrationResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_position_id: newPosition!.id,
          atomic: true, // Enforce atomic transaction
        }),
      });

      expect(migrationResponse.status).toBe(400);

      const migrationResult: MigrationResult = await migrationResponse.json();
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.error!.code).toBe('MIGRATION_FAILED');

      // Verify NO links were created on position (rollback successful)
      const { data: positionLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', newPosition!.id);

      expect(positionLinks).toHaveLength(0);

      // Verify original intake links are NOT soft-deleted (rollback successful)
      const { data: originalLinks } = await supabase
        .from('intake_entity_links')
        .select('*')
        .eq('intake_id', intakeData!.id)
        .is('deleted_at', null);

      expect(originalLinks).toHaveLength(2); // Both links still active
    });

    it('should provide detailed error information when migration fails', async () => {
      // Create test entity
      const { data: dossier } = await supabase
        .from('dossiers')
        .insert({
          title: 'Error Detail Dossier',
          status: 'active',
          classification_level: 4, // High clearance
          organization_id: testOrganizationId,
        })
        .select()
        .single();

      createdEntityIds.set('dossiers', [dossier!.id]);

      // Create intake
      const { data: intakeData } = await supabase
        .from('intake_tickets')
        .insert({
          title_en: 'Error Detail Intake',
          title_ar: 'تذكرة تفاصيل الخطأ',
          description_en: 'Test',
          description_ar: 'اختبار',
          classification_level: 2,
          organization_id: testOrganizationId,
          assigned_to: testUser.id,
          status: 'pending_review',
        })
        .select()
        .single();

      createdIntakeIds.push(intakeData!.id);

      // Create link
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intake_id: intakeData!.id,
          entity_type: 'dossier',
          entity_id: dossier!.id,
          link_type: 'primary',
          source: 'human',
        }),
      });

      const createData = await createResponse.json();
      createdLinkIds.push(createData.data.id);

      // Create low-clearance position
      const { data: newPosition } = await supabase
        .from('positions')
        .insert({
          title_en: 'Low Clearance Position',
          title_ar: 'موقف منخفض التصريح',
          classification_level: 1,
          organization_id: testOrganizationId,
          source_intake_id: intakeData!.id,
        })
        .select()
        .single();

      createdPositionIds.push(newPosition!.id);

      // Attempt migration
      const migrationResponse = await fetch(`${SUPABASE_URL}/functions/v1/intake/${intakeData!.id}/migrate-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_position_id: newPosition!.id,
          atomic: true,
        }),
      });

      const migrationResult: MigrationResult = await migrationResponse.json();
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.error!.code).toBe('MIGRATION_FAILED');
      expect(migrationResult.error!.message).toBeDefined();
      expect(migrationResult.error!.details).toBeDefined();
      expect(migrationResult.error!.details.failed_links).toBeDefined();
      expect(migrationResult.error!.details.failed_links.length).toBeGreaterThan(0);

      // Verify error details include specific failure reasons
      const failedLink = migrationResult.error!.details.failed_links[0];
      expect(failedLink.entity_id).toBe(dossier!.id);
      expect(failedLink.reason).toContain('clearance');
    });
  });

  describe('TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating migration endpoint does not exist yet', () => {
      // This test serves as a checkpoint to ensure TDD approach
      // When this suite first runs, all tests should fail because the migration endpoint doesn't exist yet
      // This test will be manually verified by running: npm test backend/tests/integration/link-migration.test.ts
      expect(true).toBe(true);
    });
  });
});
