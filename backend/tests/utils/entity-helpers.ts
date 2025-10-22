/**
 * Entity Creation Helpers for Tests
 *
 * Flexible helper functions that match actual database schema
 * Provides sensible defaults while allowing customization
 *
 * Created: 2025-10-17
 * Purpose: Simplify test entity creation with correct field mappings
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dossier Creation Options
 */
export interface CreateDossierOptions {
  nameEn?: string;
  nameAr?: string;
  type?: 'country' | 'organization' | 'forum' | 'theme';
  status?: 'active' | 'inactive' | 'archived';
  sensitivityLevel?: 'low' | 'medium' | 'high';
}

/**
 * Create a test dossier with proper schema mapping
 *
 * Database requires: name_en, name_ar, type, status, sensitivity_level
 * Schema constraints:
 * - type: 'country' | 'organization' | 'forum' | 'theme'
 * - status: 'active' | 'inactive' | 'archived'
 * - sensitivity_level: 'low' | 'medium' | 'high'
 */
export async function createTestDossier(
  adminClient: SupabaseClient,
  options: CreateDossierOptions = {}
) {
  const { data, error } = await adminClient
    .from('dossiers')
    .insert({
      name_en: options.nameEn || 'Test Dossier',
      name_ar: options.nameAr || 'ملف اختبار',
      type: options.type || 'country',
      status: options.status || 'active',
      sensitivity_level: options.sensitivityLevel || 'low',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dossier: ${error.message}`);
  }

  return data;
}

/**
 * Position Creation Options
 */
export interface CreatePositionOptions {
  titleEn?: string;
  titleAr?: string;
  positionTypeId?: string;
  authorId?: string;
}

/**
 * Create a test position with proper schema mapping
 *
 * Database requires: position_type_id, title_en, title_ar, author_id
 * Test used to expect: title_en, title_ar, classification_level, organization_id
 */
export async function createTestPosition(
  adminClient: SupabaseClient,
  userId: string,
  options: CreatePositionOptions = {}
) {
  // First, get or create a position type
  let positionTypeId = options.positionTypeId;

  if (!positionTypeId) {
    const { data: positionType, error: typeError } = await adminClient
      .from('position_types')
      .select('id')
      .limit(1)
      .single();

    if (typeError || !positionType) {
      // Create a test position type if none exists
      const { data: newType, error: createTypeError } = await adminClient
        .from('position_types')
        .insert({
          name_en: 'Test Position Type',
          name_ar: 'نوع الموقف الاختباري',
        })
        .select()
        .single();

      if (createTypeError) {
        throw new Error(`Failed to create position type: ${createTypeError.message}`);
      }

      positionTypeId = newType.id;
    } else {
      positionTypeId = positionType.id;
    }
  }

  const { data, error } = await adminClient
    .from('positions')
    .insert({
      position_type_id: positionTypeId,
      title_en: options.titleEn || 'Test Position',
      title_ar: options.titleAr || 'موقف اختبار',
      author_id: options.authorId || userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create position: ${error.message}`);
  }

  return data;
}

/**
 * MOU Creation Options
 */
export interface CreateMOUOptions {
  title?: string;
  titleAr?: string;
  referenceNumber?: string;
  category?: 'technical' | 'financial' | 'political' | 'cultural' | 'scientific';
  type?: 'bilateral' | 'multilateral' | 'framework' | 'implementing';
  tenantId?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  organizationId?: string;
}

/**
 * Create a test MOU with proper schema mapping
 *
 * Database requires: reference_number, title (not title_en!), title_ar,
 *                    mou_category, type, tenant_id, created_by, last_modified_by
 * Test used to expect: title_en, title_ar, classification_level, organization_id
 */
export async function createTestMOU(
  adminClient: SupabaseClient,
  userId: string,
  tenantId: string,
  options: CreateMOUOptions = {}
) {
  const { data, error } = await adminClient
    .from('mous')
    .insert({
      reference_number: options.referenceNumber || `MOU-TEST-${Date.now()}`,
      title: options.title || 'Test MOU',
      title_ar: options.titleAr || 'مذكرة تفاهم اختبارية',
      mou_category: options.category || 'technical',
      type: options.type || 'bilateral',
      tenant_id: options.tenantId || tenantId,
      created_by: options.createdBy || userId,
      last_modified_by: options.lastModifiedBy || userId,
      organization_id: options.organizationId || null, // Optional field
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create MOU: ${error.message}`);
  }

  return data;
}

/**
 * Country Creation Options
 */
export interface CreateCountryOptions {
  code?: string;
  code3?: string;
  nameEn?: string;
  nameAr?: string;
  region?: string;
  tenantId?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/**
 * Create a test country with proper schema mapping
 *
 * Database requires: code (2-letter), code3 (3-letter), name_en, name_ar,
 *                    region, tenant_id, created_by, last_modified_by
 * Test used to expect: name_en, name_ar, iso_code
 */
export async function createTestCountry(
  adminClient: SupabaseClient,
  userId: string,
  tenantId: string,
  options: CreateCountryOptions = {}
) {
  // Generate unique codes using timestamp + random to ensure no collisions
  // Use microseconds from performance.now() for better uniqueness
  const timestamp = Date.now();
  const microtime = Math.floor(performance.now() * 1000) % 1000000;
  const random = Math.floor(Math.random() * 676); // 0-675 for 26x26 combinations

  // Combine timestamp, microtime, and random for 2-char code
  const num2 = (timestamp % 100 + microtime % 100 + random) % 676;
  const code2 = String.fromCharCode(65 + (num2 % 26)) + String.fromCharCode(65 + Math.floor(num2 / 26));

  // Combine for 3-char code (use full range 0-17575 for AAA-ZZZ)
  const num3 = (timestamp % 1000 + microtime % 1000 + random) % 17576;
  const code3 = String.fromCharCode(65 + (num3 % 26)) +
                String.fromCharCode(65 + Math.floor(num3 / 26) % 26) +
                String.fromCharCode(65 + Math.floor(num3 / 676) % 26);

  const { data, error } = await adminClient
    .from('countries')
    .insert({
      code: options.code || code2,
      code3: options.code3 || code3,
      name_en: options.nameEn || 'Test Country',
      name_ar: options.nameAr || 'دولة اختبارية',
      region: options.region || 'test_region',
      statistical_system: {
        type: 'centralized',
        nso_name: 'Test Statistical Office',
        website: 'https://test.stats.gov',
        established_year: '2000',
      },
      tenant_id: options.tenantId || tenantId,
      created_by: options.createdBy || userId,
      last_modified_by: options.lastModifiedBy || userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create country: ${error.message}`);
  }

  return data;
}

/**
 * Organization Creation Options
 */
export interface CreateOrganizationOptions {
  code?: string;
  nameEn?: string;
  nameAr?: string;
  type?: 'government' | 'international' | 'regional' | 'ngo' | 'private';
  headquartersCountry?: string;
  tenantId?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

/**
 * Create a test organization with proper schema mapping
 */
export async function createTestOrganization(
  adminClient: SupabaseClient,
  userId: string,
  tenantId: string,
  options: CreateOrganizationOptions = {}
) {
  // Use timestamp + random to ensure unique code even across test runs
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();

  const { data, error } = await adminClient
    .from('organizations')
    .insert({
      code: options.code || `ORG_${timestamp}_${randomSuffix}`,
      name_en: options.nameEn || 'Test Organization',
      name_ar: options.nameAr || 'منظمة اختبارية',
      type: options.type || 'government',
      headquarters_country: options.headquartersCountry || 'SA',
      tenant_id: options.tenantId || tenantId,
      created_by: options.createdBy || userId,
      last_modified_by: options.lastModifiedBy || userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create organization: ${error.message}`);
  }

  return data;
}

/**
 * Helper to map old classification_level to new sensitivity_level
 *
 * Test used classification_level (1-4 integer)
 * Database uses sensitivity_level ('low' | 'medium' | 'high')
 */
export function mapClassificationToSensitivity(
  classificationLevel: number
): 'low' | 'medium' | 'high' {
  switch (classificationLevel) {
    case 1:
      return 'low';
    case 2:
      return 'medium';
    case 3:
    case 4:
      return 'high';
    default:
      return 'low';
  }
}

/**
 * Helper to map sensitivity_level back to classification_level for test compatibility
 */
export function mapSensitivityToClassification(
  sensitivityLevel: 'low' | 'medium' | 'high'
): number {
  switch (sensitivityLevel) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    default:
      return 1;
  }
}
