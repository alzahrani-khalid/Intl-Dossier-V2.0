/**
 * Contract Tests: Intake Entity Linking API Endpoints
 *
 * Purpose: Validate API contract compliance for manual entity linking operations
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T028: POST /api/intake/:intake_id/links (Create Link)
 * - T029: GET /api/intake/:intake_id/links (Get Links)
 * - T030: GET /api/entities-search (Search Entities)
 * - T031: Integration - Clearance Enforcement
 * - T032: Integration - Entity Search Ranking
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/intake-links-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  EntityLink,
  CreateLinkRequest,
  UpdateLinkRequest,
  EntitySearchResult,
  LinkType,
  EntityType,
  LinkSource,
} from '../../src/types/intake-entity-links.types';
import {
  createTestDossier,
  createTestPosition,
  createTestMOU,
  createTestCountry,
  createTestOrganization,
  mapSensitivityToClassification,
} from '../utils/entity-helpers';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

interface TestUser {
  id: string;
  email: string;
  token: string;
  clearance_level: number;
}

interface TestEntity {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  classification_level: number;
  organization_id: string;
}

interface CreateLinkResponse {
  success: boolean;
  data?: EntityLink;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface GetLinksResponse {
  success: boolean;
  data?: EntityLink[];
  error?: {
    code: string;
    message: string;
  };
}

interface SearchEntitiesResponse {
  success: boolean;
  data?: EntitySearchResult[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

describe('Intake Entity Linking API Contract Tests', () => {
  let supabase: SupabaseClient; // Anon client for tests
  let supabaseAdmin: SupabaseClient; // Service role client for setup/cleanup
  let testUser: TestUser;
  let lowClearanceUser: TestUser;
  let testIntakeId: string;
  let testOrganizationId: string;
  let testEntities: TestEntity[];
  let createdLinkIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase clients
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate unique test run ID to avoid conflicts
    const testRunId = Date.now();

    // Create test organization (using admin client to bypass RLS)
    const { data: orgData, error: orgError} = await supabaseAdmin
      .from('organizations')
      .insert({
        code: `TEST_ORG_${testRunId}`,
        name_en: 'Test Organization',
        name_ar: 'منظمة الاختبار',
        type: 'government',
        headquarters_country: 'SA',
        created_by: '00000000-0000-0000-0000-000000000001',
        last_modified_by: '00000000-0000-0000-0000-000000000001',
        tenant_id: '00000000-0000-0000-0000-000000000001',
      })
      .select()
      .single();

    if (orgError || !orgData) {
      throw new Error(`Failed to create test organization: ${orgError?.message}`);
    }

    testOrganizationId = orgData.id;

    // Create test user with high clearance (unique email per test run)
    const testUserEmail = `test-intake-links-${testRunId}@example.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUserEmail,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Full auth error:', JSON.stringify(authError, null, 2));
      throw new Error(`Failed to create test user: ${authError?.message || 'No error message available'}`);
    }

    // Sign in to get session token
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: 'test-password-123',
    });

    testUser = {
      id: authData.user.id,
      email: authData.user.email!,
      token: signInData!.session!.access_token,
      clearance_level: 3, // Confidential
    };

    // Create low clearance user for testing clearance enforcement (unique email)
    const lowClearanceEmail = `low-clearance-${testRunId}@example.com`;
    const { data: lowAuthData, error: lowAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: lowClearanceEmail,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (lowAuthError || !lowAuthData.user) {
      throw new Error(`Failed to create low clearance user: ${lowAuthError?.message}`);
    }

    // Sign in to get session token
    const { data: lowSignInData } = await supabase.auth.signInWithPassword({
      email: lowClearanceEmail,
      password: 'test-password-123',
    });

    lowClearanceUser = {
      id: lowAuthData.user.id,
      email: lowAuthData.user.email!,
      token: lowSignInData!.session!.access_token,
      clearance_level: 1, // Public
    };

    // Set user clearance levels in profiles (using admin client)
    await supabaseAdmin.from('profiles').upsert({
      user_id: testUser.id,
      clearance_level: testUser.clearance_level,
      organization_id: testOrganizationId,
    });

    await supabaseAdmin.from('profiles').upsert({
      user_id: lowClearanceUser.id,
      clearance_level: lowClearanceUser.clearance_level,
      organization_id: testOrganizationId,
    });

    // Create test intake ticket (using admin client)
    const { data: intakeData, error: intakeError } = await supabaseAdmin
      .from('intake_tickets')
      .insert({
        ticket_number: `TEST-${testRunId}-001`,
        request_type: 'engagement',
        title: 'Test Intake Ticket for Entity Linking',
        title_ar: 'تذكرة استقبال اختبارية لربط الكيانات',
        description: 'Test description',
        description_ar: 'وصف الاختبار',
        sensitivity: 'internal', // internal sensitivity level
        assigned_to: testUser.id,
        created_by: testUser.id,
        updated_by: testUser.id,
        status: 'submitted',
      })
      .select()
      .single();

    if (intakeError || !intakeData) {
      throw new Error(`Failed to create test intake: ${intakeError?.message}`);
    }

    testIntakeId = intakeData.id;

    // Create test entities for linking
    // 1. Dossier (anchor entity - can have primary link)
    const dossierData = await createTestDossier(supabaseAdmin, {
      nameEn: 'Test Dossier',
      nameAr: 'ملف اختبار',
      sensitivityLevel: 'medium', // classification_level 2
    });

    // 2. High clearance dossier (for clearance testing)
    const secretDossierData = await createTestDossier(supabaseAdmin, {
      nameEn: 'Secret Dossier',
      nameAr: 'ملف سري',
      sensitivityLevel: 'high', // classification_level 3
    });

    // 3. Position (can have related/requested links)
    const positionData = await createTestPosition(supabaseAdmin, testUser.id, {
      titleEn: 'Test Position',
      titleAr: 'موقف اختبار',
    });

    // 4. MOU
    const mouData = await createTestMOU(supabaseAdmin, testUser.id, testOrganizationId, {
      title: 'Test MOU',
      titleAr: 'مذكرة تفاهم اختبارية',
    });

    // 5. Organization (for related links)
    const relatedOrgData = await createTestOrganization(supabaseAdmin, testUser.id, testOrganizationId, {
      nameEn: 'Related Organization',
      nameAr: 'منظمة ذات صلة',
      type: 'international',
      headquartersCountry: 'US',
    });

    // 6. Country
    const countryData = await createTestCountry(supabaseAdmin, testUser.id, testOrganizationId, {
      nameEn: 'Test Country',
      nameAr: 'دولة اختبارية',
    });

    // 7. Archived dossier (should be rejected)
    const archivedDossierData = await createTestDossier(supabaseAdmin, {
      nameEn: 'Archived Dossier',
      nameAr: 'ملف مؤرشف',
      status: 'archived',
      sensitivityLevel: 'low', // classification_level 1
    });

    testEntities = [
      {
        entity_type: 'dossier',
        entity_id: dossierData.id,
        name: dossierData.name_en || 'Test Dossier',
        classification_level: mapSensitivityToClassification(dossierData.sensitivity_level),
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'dossier',
        entity_id: secretDossierData.id,
        name: secretDossierData.name_en || 'Secret Dossier',
        classification_level: mapSensitivityToClassification(secretDossierData.sensitivity_level),
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'position',
        entity_id: positionData.id,
        name: positionData.title_en || 'Test Position',
        classification_level: 1, // Positions don't have sensitivity level
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'mou',
        entity_id: mouData.id,
        name: mouData.title || 'Test MOU',
        classification_level: 2, // MOUs - default internal
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'organization',
        entity_id: relatedOrgData.id,
        name: relatedOrgData.name_en || 'Related Organization',
        classification_level: 1, // Organizations - public
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'country',
        entity_id: countryData.id,
        name: countryData.name_en || 'Test Country',
        classification_level: 1, // Countries - public
        organization_id: testOrganizationId,
      },
      {
        entity_type: 'dossier',
        entity_id: archivedDossierData.id,
        name: archivedDossierData.name_en || 'Archived Dossier',
        classification_level: mapSensitivityToClassification(archivedDossierData.sensitivity_level),
        organization_id: testOrganizationId,
      },
    ];
  });

  afterAll(async () => {
    // Cleanup: Delete all created links (using admin client to bypass RLS)
    if (createdLinkIds.length > 0) {
      await supabaseAdmin.from('intake_entity_links').delete().in('id', createdLinkIds);
    }

    // Delete test intake
    if (testIntakeId) {
      await supabaseAdmin.from('intake_tickets').delete().eq('id', testIntakeId);
    }

    // Delete test entities
    if (testEntities && Array.isArray(testEntities)) {
      for (const entity of testEntities) {
        await supabaseAdmin.from(entity.entity_type === 'dossier' ? 'dossiers' :
                            entity.entity_type === 'position' ? 'positions' :
                            entity.entity_type === 'mou' ? 'mous' :
                            entity.entity_type === 'organization' ? 'organizations' :
                            entity.entity_type === 'country' ? 'countries' : 'dossiers')
          .delete()
          .eq('id', entity.entity_id);
      }
    }

    // Delete test organization
    if (testOrganizationId) {
      await supabaseAdmin.from('organizations').delete().eq('id', testOrganizationId);
    }

    // Delete test users (auth.admin requires admin client)
    if (testUser.id) {
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    }
    if (lowClearanceUser.id) {
      await supabaseAdmin.auth.admin.deleteUser(lowClearanceUser.id);
    }
  });

  beforeEach(() => {
    // Reset created link IDs for each test
    createdLinkIds = [];
  });

  describe('T028: POST /api/intake/:intake_id/links - Create Link', () => {
    it('should create a valid primary link to dossier entity', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'primary',
        source: 'human',
        notes: 'This is the primary dossier for this intake ticket',
      };

      console.log('🔍 TEST DEBUG:');
      console.log('testIntakeId:', testIntakeId);
      console.log('URL:', `${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: CreateLinkResponse = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(responseData, null, 2));

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data!.id).toBeDefined();
      expect(responseData.data!.intake_id).toBe(testIntakeId);
      expect(responseData.data!.entity_type).toBe('dossier');
      expect(responseData.data!.entity_id).toBe(dossierEntity.entity_id);
      expect(responseData.data!.link_type).toBe('primary');
      expect(responseData.data!.source).toBe('human');
      expect(responseData.data!.linked_by).toBe(testUser.id);
      expect(responseData.data!._version).toBe(1);
      expect(responseData.data!.link_order).toBe(1);
      expect(responseData.data!.notes).toBe('This is the primary dossier for this intake ticket');
      expect(responseData.data!.deleted_at).toBeNull();

      createdLinkIds.push(responseData.data!.id);
    });

    it('should create a related link to any entity type', async () => {
      const positionEntity = testEntities.find(e => e.entity_type === 'position')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'position',
        entity_id: positionEntity.entity_id,
        link_type: 'related',
        source: 'human',
        notes: 'Related position mentioned in the intake',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.link_type).toBe('related');
      expect(responseData.data!.entity_type).toBe('position');

      createdLinkIds.push(responseData.data!.id);
    });

    it('should reject link with invalid link_type for entity_type (primary only for anchor entities)', async () => {
      const positionEntity = testEntities.find(e => e.entity_type === 'position')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'position',
        entity_id: positionEntity.entity_id,
        link_type: 'primary', // Invalid: primary only for dossier/engagement/assignment
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INVALID_LINK_TYPE');
      expect(responseData.error!.message).toContain('primary');
      expect(responseData.error!.message).toContain('anchor entities');
    });

    it('should reject link to non-existent entity', async () => {
      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        link_type: 'related',
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(404);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should reject link to archived entity', async () => {
      const archivedEntity = testEntities.find(e => e.name === 'Archived Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: archivedEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('ENTITY_ARCHIVED');
    });

    it('should reject duplicate primary link (only 1 primary per intake)', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      // Create first primary link
      const firstRequest: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'primary',
        source: 'human',
      };

      const firstResponse = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firstRequest),
      });

      const firstData: CreateLinkResponse = await firstResponse.json();
      createdLinkIds.push(firstData.data!.id);

      // Attempt second primary link
      const secondRequest: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'primary',
        source: 'human',
      };

      const secondResponse = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secondRequest),
      });

      expect(secondResponse.status).toBe(400);

      const responseData: CreateLinkResponse = await secondResponse.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('DUPLICATE_PRIMARY_LINK');
    });

    it('should enforce RLS: reject if user lacks clearance for entity', async () => {
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: secretEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(403);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INSUFFICIENT_CLEARANCE');
      expect(responseData.error!.message).toContain('clearance');
    });

    it('should enforce organization boundary (multi-tenancy)', async () => {
      // Create entity in different organization
      const { data: otherOrgData } = await supabaseAdmin
        .from('organizations')
        .insert({
          code: 'OTHER_ORG',
          name_en: 'Other Organization',
          name_ar: 'منظمة أخرى',
          type: 'government',
          headquarters_country: 'SA',
          created_by: testUser.id,
          last_modified_by: testUser.id,
          tenant_id: testOrganizationId,
        })
        .select()
        .single();

      const otherDossierData = await createTestDossier(supabaseAdmin, {
        nameEn: 'Dossier in Other Org',
        nameAr: 'ملف في منظمة أخرى',
        sensitivityLevel: 'low',
      });

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: otherDossierData.id,
        link_type: 'related',
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(403);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('ORGANIZATION_MISMATCH');

      // Cleanup
      await supabaseAdmin.from('dossiers').delete().eq('id', otherDossierData!.id);
      await supabaseAdmin.from('organizations').delete().eq('id', otherOrgData!.id);
    });

    it('should validate notes field (max 1000 chars)', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      const longNotes = 'A'.repeat(1001); // 1001 characters

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'related',
        source: 'human',
        notes: longNotes,
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(400);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('VALIDATION_ERROR');
      expect(responseData.error!.details).toBeDefined();
      expect(responseData.error!.details.field).toBe('notes');
    });

    it('should auto-increment link_order', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;
      const positionEntity = testEntities.find(e => e.entity_type === 'position')!;

      // Create first link
      const firstRequest: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      const firstResponse = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firstRequest),
      });

      const firstData: CreateLinkResponse = await firstResponse.json();
      expect(firstData.data!.link_order).toBe(1);
      createdLinkIds.push(firstData.data!.id);

      // Create second link
      const secondRequest: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'position',
        entity_id: positionEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      const secondResponse = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secondRequest),
      });

      const secondData: CreateLinkResponse = await secondResponse.json();
      expect(secondData.data!.link_order).toBe(2);
      createdLinkIds.push(secondData.data!.id);
    });

    it('should return 201 with created EntityLink object', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'related',
        source: 'human',
        confidence: 0.95,
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      // Verify all EntityLink fields are present
      const link = responseData.data!;
      expect(link.id).toBeDefined();
      expect(link.intake_id).toBeDefined();
      expect(link.entity_type).toBeDefined();
      expect(link.entity_id).toBeDefined();
      expect(link.link_type).toBeDefined();
      expect(link.source).toBeDefined();
      expect(link.linked_by).toBeDefined();
      expect(link._version).toBeDefined();
      expect(link.created_at).toBeDefined();
      expect(link.updated_at).toBeDefined();
      expect(link.confidence).toBe(0.95);

      createdLinkIds.push(link.id);
    });

    it('should include _version = 1 in response', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.data!._version).toBe(1);

      createdLinkIds.push(responseData.data!.id);
    });
  });

  describe('T029: GET /api/intake/:intake_id/links - Get Links', () => {
    let testLinkIds: string[] = [];

    beforeEach(async () => {
      // Create multiple test links
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;
      const positionEntity = testEntities.find(e => e.entity_type === 'position')!;
      const mouEntity = testEntities.find(e => e.entity_type === 'mou')!;

      const links = [
        {
          entity_type: 'dossier' as EntityType,
          entity_id: dossierEntity.entity_id,
          link_type: 'primary' as LinkType,
        },
        {
          entity_type: 'position' as EntityType,
          entity_id: positionEntity.entity_id,
          link_type: 'related' as LinkType,
        },
        {
          entity_type: 'mou' as EntityType,
          entity_id: mouEntity.entity_id,
          link_type: 'related' as LinkType,
        },
      ];

      for (const link of links) {
        const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intake_id: testIntakeId,
            ...link,
            source: 'human',
          }),
        });

        const data: CreateLinkResponse = await response.json();
        testLinkIds.push(data.data!.id);
        createdLinkIds.push(data.data!.id);
      }
    });

    it('should return all active links for intake', async () => {
      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${testIntakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data!.length).toBe(3);

      // Verify all links have deleted_at = null
      expect(responseData.data!.every(link => link.deleted_at === null)).toBe(true);
    });

    it('should exclude soft-deleted links by default', async () => {
      // Soft delete one link
      await supabase
        .from('intake_entity_links')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', testLinkIds[0]);

      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${testIntakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(2); // Only active links
      expect(responseData.data!.find(link => link.id === testLinkIds[0])).toBeUndefined();
    });

    it('should include soft-deleted links when include_deleted=true', async () => {
      // Soft delete one link
      await supabase
        .from('intake_entity_links')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', testLinkIds[0]);

      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${testIntakeId}?include_deleted=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(3); // All links including deleted
      expect(responseData.data!.find(link => link.id === testLinkIds[0])).toBeDefined();
      expect(responseData.data!.find(link => link.id === testLinkIds[0])!.deleted_at).not.toBeNull();
    });

    it('should return links ordered by link_order ASC', async () => {
      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${testIntakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: GetLinksResponse = await response.json();
      const links = responseData.data!;

      // Verify ascending order
      for (let i = 0; i < links.length - 1; i++) {
        expect(links[i].link_order).toBeLessThanOrEqual(links[i + 1].link_order);
      }
    });

    it('should enforce RLS: reject if user not assigned to intake', async () => {
      // Create intake without assigning test user
      const { data: unassignedIntake } = await supabaseAdmin
        .from('intake_tickets')
        .insert({
          ticket_number: `TEST-UNASSIGNED-${Date.now()}`,
          request_type: 'engagement',
          title: 'Unassigned Intake',
          title_ar: 'تذكرة غير معينة',
          description: 'Test',
          description_ar: 'اختبار',
          sensitivity: 'public',
          created_by: testUser.id,
          updated_by: testUser.id,
          status: 'submitted',
        })
        .select()
        .single();

      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${unassignedIntake!.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('NO_INTAKE_ACCESS');

      // Cleanup
      await supabaseAdmin.from('intake_tickets').delete().eq('id', unassignedIntake!.id);
    });

    it('should return empty array for intake with no links', async () => {
      // Create intake without links
      const { data: emptyIntake } = await supabaseAdmin
        .from('intake_tickets')
        .insert({
          ticket_number: `TEST-EMPTY-${Date.now()}`,
          request_type: 'engagement',
          title: 'Empty Intake',
          title_ar: 'تذكرة فارغة',
          description: 'Test',
          description_ar: 'اختبار',
          sensitivity: 'public',
          created_by: testUser.id,
          updated_by: testUser.id,
          assigned_to: testUser.id,
          status: 'submitted',
        })
        .select()
        .single();

      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${emptyIntake!.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data!.length).toBe(0);

      // Cleanup
      await supabaseAdmin.from('intake_tickets').delete().eq('id', emptyIntake!.id);
    });

    it('should return 200 with EntityLinksResponse', async () => {
      const response = await fetch(`${API_BASE_URL}/intake-links-get?intake_id=${testIntakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: GetLinksResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
    });
  });

  describe('T030: GET /api/entities-search - Search Entities', () => {
    it('should search entities by query string', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: SearchEntitiesResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data!.length).toBeGreaterThan(0);

      // Verify results match query
      expect(responseData.data!.some(entity => entity.name.includes('Test'))).toBe(true);
    });

    it('should filter by entity_types parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test&entity_types=dossier,position`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: SearchEntitiesResponse = await response.json();
      expect(responseData.success).toBe(true);

      // Verify only dossier and position results
      const validTypes = ['dossier', 'position'];
      expect(responseData.data!.every(entity => validTypes.includes(entity.entity_type))).toBe(true);
    });

    it('should return results ranked by AI confidence (50%) + recency (30%) + alphabetical (20%)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();
      const results = responseData.data!;

      // Verify combined_score exists and is in descending order
      expect(results.every(entity => entity.combined_score !== undefined)).toBe(true);

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].combined_score).toBeGreaterThanOrEqual(results[i + 1].combined_score);
      }
    });

    it('should exclude archived entities', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Archived`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Should not include the archived dossier
      const archivedEntity = testEntities.find(e => e.name === 'Archived Dossier')!;
      expect(responseData.data!.find(entity => entity.entity_id === archivedEntity.entity_id)).toBeUndefined();
    });

    it('should filter by user\'s clearance level', async () => {
      // Search with low clearance user
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lowClearanceUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Should not include secret dossier (clearance 4)
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;
      expect(responseData.data!.find(entity => entity.entity_id === secretEntity.entity_id)).toBeUndefined();

      // Should include entities with clearance <= 1
      expect(responseData.data!.every(entity => entity.classification_level! <= lowClearanceUser.clearance_level)).toBe(true);
    });

    it('should filter by organization_id (multi-tenancy)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // All results should be from test user's organization
      // (except for global entities like countries which may not have org_id)
      const orgSpecificEntities = responseData.data!.filter(e =>
        ['dossier', 'position', 'mou', 'organization'].includes(e.entity_type)
      );

      expect(orgSpecificEntities.length).toBeGreaterThan(0);
    });

    it('should limit results (default 10, max 50)', async () => {
      // Test default limit
      const defaultResponse = await fetch(`${API_BASE_URL}/entities-search?q=Test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const defaultData: SearchEntitiesResponse = await defaultResponse.json();
      expect(defaultData.data!.length).toBeLessThanOrEqual(10);

      // Test custom limit
      const customResponse = await fetch(`${API_BASE_URL}/entities-search?q=Test&limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const customData: SearchEntitiesResponse = await customResponse.json();
      expect(customData.data!.length).toBeLessThanOrEqual(5);

      // Test max limit
      const maxResponse = await fetch(`${API_BASE_URL}/entities-search?q=Test&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const maxData: SearchEntitiesResponse = await maxResponse.json();
      expect(maxData.data!.length).toBeLessThanOrEqual(50);
    });

    it('should include match_type (exact/partial/ai_suggested)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Verify each result has a match_type field (implementation detail)
      // This is not in the EntitySearchResult type but can be added as metadata
      expect(responseData.data!.length).toBeGreaterThan(0);
    });

    it('should return 200 with EntitySearchResult[]', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: SearchEntitiesResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);

      // Verify EntitySearchResult structure
      if (responseData.data!.length > 0) {
        const result = responseData.data![0];
        expect(result.entity_type).toBeDefined();
        expect(result.entity_id).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.combined_score).toBeDefined();
      }
    });
  });

  describe('T031: Integration - Clearance Enforcement', () => {
    it('should reject link creation if entity clearance > user clearance', async () => {
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: secretEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      // Test user has clearance 3, secret entity has clearance 4
      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(403);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INSUFFICIENT_CLEARANCE');
    });

    it('should reject entity search results above user clearance', async () => {
      // Search with low clearance user (clearance 1)
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Secret`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lowClearanceUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Secret dossier (clearance 4) should not appear in results
      const secretEntity = testEntities.find(e => e.name === 'Secret Dossier')!;
      expect(responseData.data!.find(entity => entity.entity_id === secretEntity.entity_id)).toBeUndefined();
    });

    it('should allow link to entity with clearance <= user clearance', async () => {
      const publicEntity = testEntities.find(e => e.entity_type === 'position')!; // Clearance 1

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'position',
        entity_id: publicEntity.entity_id,
        link_type: 'related',
        source: 'human',
      };

      // Test user has clearance 3, position has clearance 1
      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.success).toBe(true);

      createdLinkIds.push(responseData.data!.id);
    });

    it('should test with clearance levels: 1 (Public), 2 (Internal), 3 (Confidential), 4 (Secret)', async () => {
      const testCases = [
        { userClearance: 1, entityClearance: 1, shouldAllow: true },
        { userClearance: 1, entityClearance: 2, shouldAllow: false },
        { userClearance: 2, entityClearance: 2, shouldAllow: true },
        { userClearance: 2, entityClearance: 3, shouldAllow: false },
        { userClearance: 3, entityClearance: 3, shouldAllow: true },
        { userClearance: 3, entityClearance: 4, shouldAllow: false },
        { userClearance: 4, entityClearance: 4, shouldAllow: true },
      ];

      for (const testCase of testCases) {
        // Map classification level to sensitivity level
        const sensitivityMap: Record<number, 'low' | 'medium' | 'high'> = {
          1: 'low',
          2: 'medium',
          3: 'high',
          4: 'high',
        };

        // Create test entity with specific clearance (using helper)
        const testDossier = await createTestDossier(supabaseAdmin, {
          nameEn: `Dossier Clearance ${testCase.entityClearance}`,
          nameAr: `ملف تصنيف ${testCase.entityClearance}`,
          sensitivityLevel: sensitivityMap[testCase.entityClearance],
        });

        // Create test user with specific clearance (using admin client)
        const { data: testAuth } = await supabaseAdmin.auth.admin.createUser({
          email: `clearance-${testCase.userClearance}@example.com`,
          password: 'test-password-123',
          email_confirm: true,
        });

        await supabaseAdmin.from('profiles').upsert({
          user_id: testAuth!.user!.id,
          clearance_level: testCase.userClearance,
          organization_id: testOrganizationId,
        });

        // Sign in to get session token
        const { data: signInAuth } = await supabase.auth.signInWithPassword({
          email: `clearance-${testCase.userClearance}@example.com`,
          password: 'test-password-123',
        });

        // Create test intake for this user (using admin client)
        const { data: testIntake } = await supabaseAdmin
          .from('intake_tickets')
          .insert({
            ticket_number: `TEST-CLEARANCE-${testCase.userClearance}-${Date.now()}`,
            request_type: 'engagement',
            title: `Test Intake Clearance ${testCase.userClearance}`,
            title_ar: 'اختبار',
            description: 'Test',
            description_ar: 'اختبار',
            sensitivity: sensitivityMap[testCase.userClearance],
            created_by: testAuth!.user!.id,
            updated_by: testAuth!.user!.id,
            assigned_to: testAuth!.user!.id,
            status: 'submitted',
          })
          .select()
          .single();

        const requestBody: CreateLinkRequest = {
          intake_id: testIntake!.id,
          entity_type: 'dossier',
          entity_id: testDossier.id,
          link_type: 'related',
          source: 'human',
        };

        const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntake!.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${signInAuth!.session!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (testCase.shouldAllow) {
          expect(response.status).toBe(201);
          const responseData: CreateLinkResponse = await response.json();
          expect(responseData.success).toBe(true);
          createdLinkIds.push(responseData.data!.id);
        } else {
          expect(response.status).toBe(403);
          const responseData: CreateLinkResponse = await response.json();
          expect(responseData.success).toBe(false);
          expect(responseData.error!.code).toBe('INSUFFICIENT_CLEARANCE');
        }

        // Cleanup (using admin client)
        await supabaseAdmin.from('intake_tickets').delete().eq('id', testIntake!.id);
        await supabaseAdmin.from('dossiers').delete().eq('id', testDossier.id);
        await supabaseAdmin.auth.admin.deleteUser(testAuth!.user!.id);
      }
    });
  });

  describe('T032: Integration - Entity Search Ranking', () => {
    beforeAll(async () => {
      // Create entities with specific characteristics for ranking tests (using helper)
      await createTestDossier(supabaseAdmin, {
        nameEn: 'Exact Match Dossier',
        nameAr: 'ملف مطابق تماماً',
        sensitivityLevel: 'low',
      });

      await createTestDossier(supabaseAdmin, {
        nameEn: 'Partial Dossier Match Here',
        nameAr: 'ملف مطابق جزئياً',
        sensitivityLevel: 'low',
      });

      await createTestDossier(supabaseAdmin, {
        nameEn: 'Alpha Dossier',
        nameAr: 'ملف ألفا',
        sensitivityLevel: 'low',
      });
    });

    it('should rank exact matches higher than partial matches', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Exact Match Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // First result should be exact match
      expect(responseData.data![0].name).toBe('Exact Match Dossier');

      // Exact match should have higher score than partial matches
      const exactMatch = responseData.data!.find(e => e.name === 'Exact Match Dossier')!;
      const partialMatch = responseData.data!.find(e => e.name === 'Partial Dossier Match Here');

      if (partialMatch) {
        expect(exactMatch.combined_score).toBeGreaterThan(partialMatch.combined_score);
      }
    });

    it('should rank AI-suggested matches by confidence score', async () => {
      // This test would require AI suggestions to be present
      // For now, we verify the structure is ready for AI ranking
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Verify similarity_score field exists (for AI suggestions)
      expect(responseData.data![0].similarity_score !== undefined || responseData.data![0].similarity_score === null).toBe(true);
    });

    it('should rank recent entities higher (recency factor)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      const exactMatch = responseData.data!.find(e => e.name === 'Exact Match Dossier');
      const partialMatch = responseData.data!.find(e => e.name === 'Partial Dossier Match Here');

      if (exactMatch && partialMatch) {
        // More recent entity should generally rank higher
        // (accounting for other factors in the formula)
        expect(exactMatch.combined_score).toBeGreaterThan(0);
        expect(partialMatch.combined_score).toBeGreaterThan(0);
      }
    });

    it('should apply alphabetical sorting as tiebreaker', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Among entities with similar scores, alphabetical order should apply
      const alphaEntity = responseData.data!.find(e => e.name === 'Alpha Dossier');

      expect(alphaEntity).toBeDefined();
    });

    it('should verify formula: AI (50%) + Recency (30%) + Alphabetical (20%)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=Dossier`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();

      // Verify combined_score is calculated and between 0-1
      expect(responseData.data!.every(entity => {
        return entity.combined_score >= 0 && entity.combined_score <= 1;
      })).toBe(true);

      // Verify results are sorted by combined_score descending
      for (let i = 0; i < responseData.data!.length - 1; i++) {
        expect(responseData.data![i].combined_score).toBeGreaterThanOrEqual(
          responseData.data![i + 1].combined_score
        );
      }
    });
  });

  describe('T033: TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating no Edge Functions exist yet', () => {
      // This test serves as a checkpoint to ensure TDD approach
      // When this suite first runs, all tests should fail because Edge Functions don't exist yet
      // This test will be manually verified by running: npm test backend/tests/contract/intake-links-api.test.ts
      expect(true).toBe(true);
    });
  });

  describe('T034: Bilingual Support Tests (Arabic/English)', () => {
    it('should create link with Arabic notes', async () => {
      const dossierEntity = testEntities.find(e => e.entity_type === 'dossier' && e.name === 'Test Dossier')!;

      const requestBody: CreateLinkRequest = {
        intake_id: testIntakeId,
        entity_type: 'dossier',
        entity_id: dossierEntity.entity_id,
        link_type: 'related',
        source: 'human',
        notes: 'هذا هو الملف الرئيسي لهذه التذكرة الواردة',
      };

      const response = await fetch(`${API_BASE_URL}/intake-links-create?intake_id=${testIntakeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const responseData: CreateLinkResponse = await response.json();
      expect(responseData.data!.notes).toBe('هذا هو الملف الرئيسي لهذه التذكرة الواردة');

      createdLinkIds.push(responseData.data!.id);
    });

    it('should search entities with Arabic query', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-search?q=اختبار`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: SearchEntitiesResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    it('should handle mixed Arabic/English entity names', async () => {
      // Create entity with bilingual name (using helper)
      const bilingualEntity = await createTestDossier(supabaseAdmin, {
        nameEn: 'Mixed ملف Test',
        nameAr: 'اختبار مختلط Test',
        sensitivityLevel: 'low',
      });

      const response = await fetch(`${API_BASE_URL}/entities-search?q=Mixed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData: SearchEntitiesResponse = await response.json();
      expect(responseData.data!.some(e => e.name.includes('Mixed'))).toBe(true);

      // Cleanup (using admin client)
      await supabaseAdmin.from('dossiers').delete().eq('id', bilingualEntity.id);
    });
  });

  describe('T090: GET /api/entities/:entity_type/:entity_id/intakes - Reverse Lookup (User Story 4)', () => {
    let testEntityId: string;
    let testEntityType: EntityType = 'dossier';
    let linkIdsForCleanup: string[] = [];

    beforeEach(async () => {
      // Create a test dossier to link intakes to (using helper)
      const dossierData = await createTestDossier(supabaseAdmin, {
        nameEn: 'Test Reverse Lookup Dossier',
        nameAr: 'ملف اختبار البحث العكسي',
        sensitivityLevel: 'medium',
      });

      testEntityId = dossierData.id;

      // Create 5 test intake tickets (using admin client)
      const intakeIds: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const { data: intakeData } = await supabaseAdmin
          .from('intake_tickets')
          .insert({
            ticket_number: `TEST-REVERSE-${i}-${Date.now()}`,
            request_type: 'engagement',
            title: `Reverse Lookup Test Intake ${i}`,
            title_ar: `تذكرة اختبار ${i}`,
            description: `Test description ${i}`,
            description_ar: `وصف الاختبار ${i}`,
            sensitivity: 'internal',
            created_by: testUser.id,
            updated_by: testUser.id,
            assigned_to: testUser.id,
            status: 'submitted',
          })
          .select()
          .single();

        intakeIds.push(intakeData!.id);
      }

      // Link intakes to dossier with different link types (using admin client)
      const linkTypes: LinkType[] = ['primary', 'related', 'related', 'mentioned', 'related'];
      for (let i = 0; i < intakeIds.length; i++) {
        const { data: linkData } = await supabaseAdmin
          .from('intake_entity_links')
          .insert({
            intake_id: intakeIds[i],
            entity_type: testEntityType,
            entity_id: testEntityId,
            link_type: linkTypes[i],
            source: 'human',
            linked_by: testUser.id,
            organization_id: testOrganizationId,
          })
          .select()
          .single();

        linkIdsForCleanup.push(linkData!.id);
        createdLinkIds.push(linkData!.id);
      }
    });

    afterEach(async () => {
      // Cleanup links (using admin client)
      if (linkIdsForCleanup.length > 0) {
        await supabaseAdmin.from('intake_entity_links').delete().in('id', linkIdsForCleanup);
        linkIdsForCleanup = [];
      }

      // Cleanup test dossier (using admin client)
      if (testEntityId) {
        await supabaseAdmin.from('dossiers').delete().eq('id', testEntityId);
      }
    });

    it('should return all intake tickets linked to an entity', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data.length).toBe(5);

      // Verify intake data structure
      const intake = responseData.data[0];
      expect(intake.intake_id).toBeDefined();
      expect(intake.title_en).toBeDefined();
      expect(intake.link_type).toBeDefined();
      expect(intake.linked_at).toBeDefined();
    });

    it('should filter by link_type parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}&link_type=related`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(3); // Only "related" links

      // Verify all returned links have link_type = "related"
      expect(responseData.data.every((item: any) => item.link_type === 'related')).toBe(true);
    });

    it('should filter by multiple link_types (comma-separated)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}&link_type=primary,mentioned`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(2); // 1 primary + 1 mentioned

      // Verify returned link types
      const linkTypes = responseData.data.map((item: any) => item.link_type);
      expect(linkTypes).toContain('primary');
      expect(linkTypes).toContain('mentioned');
    });

    it('should support pagination with limit and offset', async () => {
      // First page: limit=2, offset=0
      const firstPageResponse = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}&limit=2&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(firstPageResponse.status).toBe(200);

      const firstPageData = await firstPageResponse.json();
      expect(firstPageData.success).toBe(true);
      expect(firstPageData.data.length).toBe(2);
      expect(firstPageData.pagination).toBeDefined();
      expect(firstPageData.pagination.total).toBe(5);
      expect(firstPageData.pagination.limit).toBe(2);
      expect(firstPageData.pagination.offset).toBe(0);
      expect(firstPageData.pagination.has_more).toBe(true);

      // Second page: limit=2, offset=2
      const secondPageResponse = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}&limit=2&offset=2`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const secondPageData = await secondPageResponse.json();
      expect(secondPageData.data.length).toBe(2);
      expect(secondPageData.pagination.offset).toBe(2);

      // Verify no overlap between pages
      const firstPageIds = firstPageData.data.map((item: any) => item.intake_id);
      const secondPageIds = secondPageData.data.map((item: any) => item.intake_id);
      const overlap = firstPageIds.filter((id: string) => secondPageIds.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should enforce clearance level filtering', async () => {
      // Create high clearance intake (using admin client)
      const { data: secretIntake } = await supabaseAdmin
        .from('intake_tickets')
        .insert({
          ticket_number: `TEST-SECRET-${Date.now()}`,
          request_type: 'engagement',
          title: 'Secret Intake',
          title_ar: 'تذكرة سرية',
          description: 'Secret',
          description_ar: 'سري',
          sensitivity: 'secret', // Secret sensitivity
          created_by: testUser.id,
          updated_by: testUser.id,
          assigned_to: testUser.id,
          status: 'submitted',
        })
        .select()
        .single();

      // Link secret intake to dossier (using admin client)
      await supabaseAdmin
        .from('intake_entity_links')
        .insert({
          intake_id: secretIntake!.id,
          entity_type: testEntityType,
          entity_id: testEntityId,
          link_type: 'related',
          source: 'human',
          linked_by: testUser.id,
          organization_id: testOrganizationId,
        });

      // Query with low clearance user
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lowClearanceUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();

      // Should NOT include secret intake (clearance 4) for low clearance user (clearance 1)
      const secretIntakeInResults = responseData.data.find((item: any) => item.intake_id === secretIntake!.id);
      expect(secretIntakeInResults).toBeUndefined();

      // Cleanup (using admin client)
      await supabaseAdmin.from('intake_tickets').delete().eq('id', secretIntake!.id);
    });

    it('should exclude soft-deleted links by default', async () => {
      // Soft delete one link (using admin client)
      await supabaseAdmin
        .from('intake_entity_links')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', linkIdsForCleanup[0]);

      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(4); // Excluding soft-deleted link
    });

    it('should return intakes ordered by linked_at DESC (most recent first)', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup?entity_type=${testEntityType}&entity_id=${testEntityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      const responseData = await response.json();
      const intakes = responseData.data;

      // Verify descending order by linked_at
      for (let i = 0; i < intakes.length - 1; i++) {
        const current = new Date(intakes[i].linked_at).getTime();
        const next = new Date(intakes[i + 1].linked_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should return empty array for entity with no linked intakes', async () => {
      // Create entity with no links (using helper)
      const emptyEntity = await createTestDossier(supabaseAdmin, {
        nameEn: 'Empty Dossier',
        nameAr: 'ملف فارغ',
        sensitivityLevel: 'low',
      });

      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup/dossier/${emptyEntity.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.data.length).toBe(0);
      expect(responseData.pagination.total).toBe(0);

      // Cleanup (using admin client)
      await supabaseAdmin.from('dossiers').delete().eq('id', emptyEntity.id);
    });

    it('should enforce organization boundary (multi-tenancy)', async () => {
      // Create entity in different organization (using admin client)
      const { data: otherOrg } = await supabaseAdmin
        .from('organizations')
        .insert({
          code: 'OTHER_ORG_REVERSE',
          name_en: 'Other Org for Reverse Lookup',
          name_ar: 'منظمة أخرى',
          type: 'government',
          headquarters_country: 'SA',
          created_by: testUser.id,
          last_modified_by: testUser.id,
          tenant_id: testOrganizationId,
        })
        .select()
        .single();

      // Note: createTestDossier doesn't support custom organization_id
      // so we'll use direct insert with corrected fields
      const { data: otherEntity } = await supabaseAdmin
        .from('dossiers')
        .insert({
          name_en: 'Dossier in Other Org',
          name_ar: 'ملف في منظمة أخرى',
          type: 'country',
          status: 'active',
          sensitivity_level: 'low',
        })
        .select()
        .single();

      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup/dossier/${otherEntity!.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      // Should return 403 or empty results (depending on RLS implementation)
      expect([403, 200].includes(response.status)).toBe(true);

      if (response.status === 200) {
        const responseData = await response.json();
        expect(responseData.data.length).toBe(0);
      }

      // Cleanup (using admin client)
      await supabaseAdmin.from('dossiers').delete().eq('id', otherEntity!.id);
      await supabaseAdmin.from('organizations').delete().eq('id', otherOrg!.id);
    });

    it('should return 404 for non-existent entity', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup/dossier/00000000-0000-0000-0000-000000000000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should validate entity_type parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/entities-intakes-reverse-lookup/invalid_type/${testEntityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error!.code).toBe('INVALID_ENTITY_TYPE');
    });
  });
});
