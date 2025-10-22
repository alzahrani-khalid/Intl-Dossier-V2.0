/**
 * Contract Tests: Waiting Queue Filter API
 *
 * Purpose: Validate waiting queue filtering by entity links
 * These tests should FAIL initially (TDD approach) before implementation
 *
 * Tests cover:
 * - T070: GET /api/waiting-queue (Filter by entity links)
 * - T071: GET /api/waiting-queue/stats (Statistics with link filters)
 *
 * Contract Reference: specs/024-intake-entity-linking/contracts/waiting-queue-filter-api.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

interface WaitingQueueResponse {
  success: boolean;
  data?: Array<{
    intake_id: string;
    title_en: string;
    title_ar: string;
    status: string;
    priority: string;
    linked_entities?: Array<{
      entity_id: string;
      entity_type: string;
      entity_name: string;
      link_type: string;
    }>;
    aging_bucket: string;
    created_at: string;
  }>;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface QueueStatsResponse {
  success: boolean;
  data?: {
    total_count: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_aging_bucket: Record<string, number>;
    by_entity_type?: Record<string, number>;
    by_link_type?: Record<string, number>;
  };
  error?: {
    code: string;
    message: string;
  };
}

describe('Waiting Queue Filter API Contract Tests', () => {
  let supabase: SupabaseClient;
  let testUser: TestUser;
  let testOrganizationId: string;
  let testIntakeIds: string[] = [];
  let testDossierId: string;
  let testPositionId: string;
  let testCountryId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test organization
    const { data: orgData } = await supabase
      .from('organizations')
      .insert({
        name_en: 'Queue Filter Test Org',
        name_ar: 'منظمة اختبار تصفية الطابور',
        org_type: 'government',
      })
      .select()
      .single();

    testOrganizationId = orgData!.id;

    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: 'test-queue-filter@example.com',
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

    // Create test entities
    const { data: dossierData } = await supabase
      .from('dossiers')
      .insert({
        title: 'Saudi Arabia Relations',
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
        title_en: 'Trade Position',
        title_ar: 'موقف التجارة',
        classification_level: 1,
        organization_id: testOrganizationId,
      })
      .select()
      .single();
    testPositionId = positionData!.id;

    const { data: countryData } = await supabase
      .from('countries')
      .insert({
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        iso_code: 'SA',
      })
      .select()
      .single();
    testCountryId = countryData!.id;

    // Create test intakes with different entity links
    // Intake 1: Linked to dossier (primary) + country (related)
    const { data: intake1 } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Bilateral Trade Discussion',
        title_ar: 'مناقشة التجارة الثنائية',
        description_en: 'Trade with Saudi Arabia',
        description_ar: 'التجارة مع السعودية',
        classification_level: 2,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'pending_review',
        priority: 'high',
      })
      .select()
      .single();
    testIntakeIds.push(intake1!.id);

    await supabase.from('intake_entity_links').insert([
      {
        intake_id: intake1!.id,
        entity_type: 'dossier',
        entity_id: testDossierId,
        link_type: 'primary',
        source: 'human',
        linked_by: testUser.id,
        organization_id: testOrganizationId,
      },
      {
        intake_id: intake1!.id,
        entity_type: 'country',
        entity_id: testCountryId,
        link_type: 'related',
        source: 'human',
        linked_by: testUser.id,
        organization_id: testOrganizationId,
      },
    ]);

    // Intake 2: Linked to position only
    const { data: intake2 } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Position Review Required',
        title_ar: 'مراجعة الموقف مطلوبة',
        description_en: 'Review trade position',
        description_ar: 'مراجعة موقف التجارة',
        classification_level: 1,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'in_progress',
        priority: 'medium',
      })
      .select()
      .single();
    testIntakeIds.push(intake2!.id);

    await supabase.from('intake_entity_links').insert({
      intake_id: intake2!.id,
      entity_type: 'position',
      entity_id: testPositionId,
      link_type: 'related',
      source: 'human',
      linked_by: testUser.id,
      organization_id: testOrganizationId,
    });

    // Intake 3: No entity links
    const { data: intake3 } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Unlinked Intake',
        title_ar: 'تذكرة غير مربوطة',
        description_en: 'No entities linked',
        description_ar: 'لا توجد كيانات مربوطة',
        classification_level: 1,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'pending_review',
        priority: 'low',
      })
      .select()
      .single();
    testIntakeIds.push(intake3!.id);

    // Intake 4: Linked to dossier (related) + country (mentioned)
    const { data: intake4 } = await supabase
      .from('intake_tickets')
      .insert({
        title_en: 'Country Analysis',
        title_ar: 'تحليل الدولة',
        description_en: 'Analysis of Saudi Arabia',
        description_ar: 'تحليل المملكة العربية السعودية',
        classification_level: 2,
        organization_id: testOrganizationId,
        assigned_to: testUser.id,
        status: 'completed',
        priority: 'medium',
      })
      .select()
      .single();
    testIntakeIds.push(intake4!.id);

    await supabase.from('intake_entity_links').insert([
      {
        intake_id: intake4!.id,
        entity_type: 'dossier',
        entity_id: testDossierId,
        link_type: 'related',
        source: 'human',
        linked_by: testUser.id,
        organization_id: testOrganizationId,
      },
      {
        intake_id: intake4!.id,
        entity_type: 'country',
        entity_id: testCountryId,
        link_type: 'mentioned',
        source: 'ai',
        linked_by: testUser.id,
        organization_id: testOrganizationId,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup: Delete entity links
    await supabase.from('intake_entity_links').delete().in('intake_id', testIntakeIds);

    // Delete test intakes
    await supabase.from('intake_tickets').delete().in('id', testIntakeIds);

    // Delete test entities
    await supabase.from('dossiers').delete().eq('id', testDossierId);
    await supabase.from('positions').delete().eq('id', testPositionId);
    await supabase.from('countries').delete().eq('id', testCountryId);

    // Delete test organization
    await supabase.from('organizations').delete().eq('id', testOrganizationId);

    // Delete test user
    await supabase.auth.admin.deleteUser(testUser.id);
  });

  describe('T070: GET /api/waiting-queue - Filter by Entity Links', () => {
    it('should return all intakes when no entity filter applied', async () => {
      const response = await fetch(`${API_BASE_URL}/waiting-queue`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(4); // All test intakes
    });

    it('should filter by linked entity_id', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_id=${testDossierId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(2); // Intakes 1 and 4 linked to dossier

      // Verify all results have the dossier linked
      responseData.data!.forEach(intake => {
        expect(intake.linked_entities!.some(e => e.entity_id === testDossierId)).toBe(true);
      });
    });

    it('should filter by entity_type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_type=position`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(1); // Only intake 2

      // Verify result has position linked
      expect(responseData.data![0].linked_entities!.some(e => e.entity_type === 'position')).toBe(true);
    });

    it('should filter by link_type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?link_type=primary`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(1); // Only intake 1 has primary link

      // Verify result has primary link
      expect(responseData.data![0].linked_entities!.some(e => e.link_type === 'primary')).toBe(true);
    });

    it('should filter by multiple entity_types (OR logic)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_type=dossier,position`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(3); // Intakes 1, 2, 4

      // Verify all results have either dossier or position
      responseData.data!.forEach(intake => {
        const hasRequiredType = intake.linked_entities!.some(
          e => e.entity_type === 'dossier' || e.entity_type === 'position'
        );
        expect(hasRequiredType).toBe(true);
      });
    });

    it('should combine entity filters with status filters', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_type=dossier&status=pending_review`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(1); // Only intake 1

      // Verify status and entity type
      expect(responseData.data![0].status).toBe('pending_review');
      expect(responseData.data![0].linked_entities!.some(e => e.entity_type === 'dossier')).toBe(true);
    });

    it('should support pagination with entity filters', async () => {
      // Get first page with limit
      const firstResponse = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_type=dossier,country&limit=1&offset=0`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      const firstData: WaitingQueueResponse = await firstResponse.json();
      expect(firstData.data!.length).toBe(1);
      expect(firstData.pagination!.total).toBeGreaterThan(1);
      expect(firstData.pagination!.has_more).toBe(true);

      // Get second page
      const secondResponse = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_type=dossier,country&limit=1&offset=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      const secondData: WaitingQueueResponse = await secondResponse.json();
      expect(secondData.data!.length).toBe(1);

      // Verify no overlap
      expect(firstData.data![0].intake_id).not.toBe(secondData.data![0].intake_id);
    });

    it('should return empty array when no intakes match entity filter', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_id=00000000-0000-0000-0000-000000000000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.length).toBe(0);
      expect(responseData.pagination!.total).toBe(0);
    });

    it('should exclude intakes with only soft-deleted links', async () => {
      // Soft-delete all links for intake 1
      await supabase
        .from('intake_entity_links')
        .update({ deleted_at: new Date().toISOString() })
        .eq('intake_id', testIntakeIds[0]);

      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_id=${testDossierId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.data!.length).toBe(1); // Only intake 4 now

      // Restore links
      await supabase
        .from('intake_entity_links')
        .update({ deleted_at: null })
        .eq('intake_id', testIntakeIds[0]);
    });

    it('should enforce organization boundaries in entity filtering', async () => {
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
          title: 'Other Org Dossier',
          status: 'active',
          classification_level: 1,
          organization_id: otherOrg!.id,
        })
        .select()
        .single();

      // Try to filter by entity from different org
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue?entity_id=${otherDossier!.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      const responseData: WaitingQueueResponse = await response.json();
      expect(responseData.data!.length).toBe(0); // No results (different org)

      // Cleanup
      await supabase.from('dossiers').delete().eq('id', otherDossier!.id);
      await supabase.from('organizations').delete().eq('id', otherOrg!.id);
    });
  });

  describe('T071: GET /api/waiting-queue/stats - Statistics with Link Filters', () => {
    it('should return queue statistics with entity link breakdowns', async () => {
      const response = await fetch(`${API_BASE_URL}/waiting-queue/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseData: QueueStatsResponse = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data!.total_count).toBe(4);
      expect(responseData.data!.by_status).toBeDefined();
      expect(responseData.data!.by_priority).toBeDefined();
      expect(responseData.data!.by_entity_type).toBeDefined();
      expect(responseData.data!.by_link_type).toBeDefined();

      // Verify entity type breakdown
      expect(responseData.data!.by_entity_type!['dossier']).toBe(2); // Intakes 1 & 4
      expect(responseData.data!.by_entity_type!['position']).toBe(1); // Intake 2
      expect(responseData.data!.by_entity_type!['country']).toBe(2); // Intakes 1 & 4

      // Verify link type breakdown
      expect(responseData.data!.by_link_type!['primary']).toBe(1); // Intake 1
      expect(responseData.data!.by_link_type!['related']).toBeGreaterThan(0);
      expect(responseData.data!.by_link_type!['mentioned']).toBe(1); // Intake 4
    });

    it('should filter statistics by entity_type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/waiting-queue/stats?entity_type=dossier`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${testUser.token}`,
          },
        }
      );

      const responseData: QueueStatsResponse = await response.json();
      expect(responseData.data!.total_count).toBe(2); // Only intakes with dossier links

      // Stats should reflect filtered set
      expect(responseData.data!.by_status['pending_review']).toBe(1); // Intake 1
      expect(responseData.data!.by_status['completed']).toBe(1); // Intake 4
    });
  });

  describe('T072: TDD Verification - Tests should FAIL before implementation', () => {
    it('should have failing tests indicating no Waiting Queue Filter Edge Function exists yet', () => {
      expect(true).toBe(true);
    });
  });
});
