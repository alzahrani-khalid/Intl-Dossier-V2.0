/**
 * Type guards for dossier entity types
 *
 * This module provides runtime type validation for the discriminated union pattern
 * used across all dossier entity types. It ensures type safety when working with
 * polymorphic dossier data from the API.
 *
 * @module dossier-type-guards
 * @feature 028-type-specific-dossier-pages
 *
 * @example
 * ```typescript
 * import { isCountryDossier, assertDossierType } from '@/lib/dossier-type-guards';
 *
 * // Using type guard in conditional
 * if (isCountryDossier(dossier)) {
 *   console.log(dossier.extension.iso_code_2); // TypeScript knows this is safe
 * }
 *
 * // Using assertion in route loader
 * assertDossierType(dossier, 'country'); // Throws if type mismatch
 * ```
 */

/**
 * Union type of all valid dossier type strings
 *
 * @description
 * These correspond to the `type` column in the `dossiers` database table.
 * Each type has a corresponding extension table with type-specific fields.
 */
export type DossierType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group'
  | 'topic'
  | 'elected_official'

/**
 * Extension schema for country dossiers
 *
 * @description
 * Contains country-specific metadata following ISO 3166 standards.
 * IMPORTANT: Must match database schema in supabase/migrations/20251022000002_create_extension_tables.sql
 *
 * @property iso_code_2 - ISO 3166-1 alpha-2 code (e.g., "SA" for Saudi Arabia)
 * @property iso_code_3 - ISO 3166-1 alpha-3 code (e.g., "SAU" for Saudi Arabia)
 * @property capital_en - Capital city name in English
 * @property capital_ar - Capital city name in Arabic
 * @property region - Geographic region (e.g., "Middle East")
 * @property subregion - Geographic subregion (e.g., "Western Asia")
 * @property population - Current population count
 * @property area_sq_km - Land area in square kilometers
 * @property flag_url - URL to country flag image
 */
export interface CountryExtension {
  iso_code_2: string // ISO 3166-1 alpha-2 (e.g., "SA")
  iso_code_3: string // ISO 3166-1 alpha-3 (e.g., "SAU")
  capital_en?: string // Capital city (English)
  capital_ar?: string // Capital city (Arabic)
  region?: string // Geographic region
  subregion?: string // Geographic subregion
  population?: number // Population count
  area_sq_km?: number // Area in square kilometers
  flag_url?: string // URL to country flag image
}

/**
 * Extension schema for organization dossiers
 *
 * @description
 * Contains organization-specific metadata including type classification,
 * hierarchy information, and basic operational data.
 *
 * @property org_code - Unique internal organization code
 * @property org_type - Organization classification
 * @property parent_org_id - Parent organization dossier ID for hierarchy
 * @property head_count - Number of employees/members
 * @property established_date - Organization founding date (ISO 8601)
 * @property website_url - Official website URL
 */
export interface OrganizationExtension {
  org_code: string
  org_type: 'government' | 'ngo' | 'international' | 'private'
  parent_org_id?: string
  head_count?: number
  established_date?: string
  website_url?: string
}

/**
 * Extension schema for person dossiers
 *
 * @description
 * Contains individual-specific metadata including professional information,
 * biographical data, and current employment details.
 *
 * @property title - Professional/honorific title (e.g., "Ambassador", "Minister")
 * @property photo_url - Profile photo URL
 * @property birth_date - Date of birth (ISO 8601)
 * @property nationality - ISO 3166-1 alpha-2 country code
 * @property education - List of educational qualifications
 * @property languages - List of spoken languages (ISO 639-1 codes)
 * @property current_position - Current employment details
 */
export interface PersonExtension {
  title?: string
  photo_url?: string
  birth_date?: string
  nationality?: string
  education?: string[]
  languages?: string[]
  current_position?: {
    title: string
    organization: string
    start_date: string
  }
}

/**
 * Extension schema for engagement dossiers
 *
 * @description
 * Contains engagement-specific metadata for meetings, conferences,
 * visits, and negotiations. Links to participating dossiers.
 *
 * @property engagement_type - Type of engagement event
 * @property start_date - Engagement start date/time (ISO 8601)
 * @property end_date - Engagement end date/time (ISO 8601)
 * @property location - Physical or virtual location
 * @property participants - Array of participating dossiers with roles
 * @property outcomes - List of documented outcomes/decisions
 */
export interface EngagementExtension {
  engagement_type: 'meeting' | 'conference' | 'visit' | 'negotiation'
  start_date: string
  end_date?: string
  location?: string
  participants: Array<{
    dossier_id: string
    role: string
  }>
  outcomes?: string[]
}

/**
 * Extension schema for forum dossiers
 *
 * @description
 * Contains forum-specific metadata for bilateral/multilateral forums
 * and working groups. Tracks membership, meetings, and deliverables.
 *
 * @property forum_type - Forum classification
 * @property member_organizations - Array of member organization dossier IDs
 * @property meeting_frequency - Human-readable meeting frequency (e.g., "Quarterly")
 * @property next_meeting_date - Next scheduled meeting date (ISO 8601)
 * @property deliverables - Tracked deliverables with status
 */
export interface ForumExtension {
  forum_type: 'bilateral' | 'multilateral' | 'working_group'
  member_organizations: string[]
  meeting_frequency?: string
  next_meeting_date?: string
  deliverables?: Array<{
    name: string
    due_date: string
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

/**
 * Extension schema for working group dossiers
 *
 * @description
 * Contains working group-specific metadata. Working groups are typically
 * sub-entities of forums with defined mandates and timeframes.
 *
 * @property parent_forum_id - Parent forum dossier ID
 * @property chair_organization - Chairing organization dossier ID
 * @property mandate - Working group mandate/purpose
 * @property start_date - Working group establishment date (ISO 8601)
 * @property end_date - Working group dissolution date (ISO 8601)
 * @property members - Array of member dossiers with roles
 */
export interface WorkingGroupExtension {
  parent_forum_id?: string
  chair_organization?: string
  mandate: string
  start_date: string
  end_date?: string
  members: Array<{
    dossier_id: string
    role: 'chair' | 'member' | 'observer'
  }>
}

/**
 * Extension schema for topic dossiers
 *
 * @description
 * Contains topic-specific metadata for organizing dossiers
 * by subject matter. Supports hierarchical topic structures.
 *
 * @property topic_category - Topic classification
 * @property parent_topic_id - Parent topic dossier ID for hierarchy
 */
export interface TopicExtension {
  topic_category?: 'policy' | 'technical' | 'strategic' | 'operational'
  parent_topic_id?: string
}

/**
 * Office types for elected officials
 */
export type OfficeType =
  | 'head_of_state'
  | 'head_of_government'
  | 'cabinet_minister'
  | 'legislature_upper'
  | 'legislature_lower'
  | 'regional_executive'
  | 'regional_legislature'
  | 'local_executive'
  | 'local_legislature'
  | 'judiciary'
  | 'ambassador'
  | 'international_org'
  | 'other'

/**
 * Extension schema for elected official dossiers
 *
 * @description
 * Contains elected official-specific metadata including office details,
 * political affiliation, committee assignments, and contact preferences.
 *
 * @property title_en - Professional title in English (e.g., "Senator")
 * @property title_ar - Professional title in Arabic
 * @property office_name_en - Name of office in English
 * @property office_type - Type of governmental office
 * @property district_en - Electoral district in English
 * @property party_en - Political party name
 * @property term_start - Current term start date
 * @property committee_assignments - JSONB array of committee assignments
 * @property contact_preferences - JSONB with preferred contact methods
 * @property staff_contacts - JSONB array of key staff members
 * @property importance_level - 1=Regular, 2=Important, 3=Key, 4=VIP, 5=Critical
 */
export interface ElectedOfficialExtension {
  title_en?: string
  title_ar?: string
  photo_url?: string
  office_name_en: string
  office_name_ar?: string
  office_type: OfficeType
  district_en?: string
  district_ar?: string
  party_en?: string
  party_ar?: string
  party_abbreviation?: string
  party_ideology?:
    | 'conservative'
    | 'liberal'
    | 'centrist'
    | 'socialist'
    | 'green'
    | 'nationalist'
    | 'libertarian'
    | 'independent'
    | 'other'
  term_start?: string
  term_end?: string
  is_current_term?: boolean
  term_number?: number
  committee_assignments?: Array<{
    name_en: string
    name_ar?: string
    role: 'chair' | 'vice_chair' | 'member'
    is_active: boolean
  }>
  contact_preferences?: {
    preferred_channel?: 'email' | 'phone' | 'in_person' | 'formal_letter'
    best_time?: 'morning' | 'afternoon' | 'evening'
    scheduling_notes_en?: string
    scheduling_notes_ar?: string
    protocol_notes_en?: string
    protocol_notes_ar?: string
  }
  email_official?: string
  email_personal?: string
  phone_office?: string
  phone_mobile?: string
  address_office_en?: string
  address_office_ar?: string
  website_official?: string
  website_campaign?: string
  social_media?: Record<string, string>
  staff_contacts?: Array<{
    name: string
    role: 'chief_of_staff' | 'scheduler' | 'policy_advisor' | 'press_secretary' | 'other'
    email?: string
    phone?: string
    notes?: string
  }>
  country_id?: string
  organization_id?: string
  biography_en?: string
  biography_ar?: string
  policy_priorities?: string[]
  notes_en?: string
  notes_ar?: string
  data_source?: 'official_website' | 'api_gov' | 'manual'
  data_source_url?: string
  last_verified_at?: string
  last_refresh_at?: string
  refresh_frequency_days?: number
  importance_level?: 1 | 2 | 3 | 4 | 5
}

/**
 * Base dossier interface shared by all dossier types
 *
 * @description
 * Contains common fields present in all dossiers. Maps to the
 * unified `dossiers` table in the database.
 *
 * @property id - Unique UUID identifier
 * @property name_en - Display name in English
 * @property name_ar - Display name in Arabic
 * @property description_en - Full description in English
 * @property description_ar - Full description in Arabic
 * @property created_at - Creation timestamp (ISO 8601)
 * @property updated_at - Last update timestamp (ISO 8601)
 * @property created_by - Creator user ID
 * @property updated_by - Last updater user ID
 */
export interface BaseDossier {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

/**
 * Country dossier type with country-specific extension
 *
 * @see CountryExtension for type-specific fields
 */
export interface CountryDossier extends BaseDossier {
  type: 'country'
  extension: CountryExtension
}

/**
 * Organization dossier type with organization-specific extension
 *
 * @see OrganizationExtension for type-specific fields
 */
export interface OrganizationDossier extends BaseDossier {
  type: 'organization'
  extension: OrganizationExtension
}

/**
 * Person dossier type with person-specific extension
 *
 * @see PersonExtension for type-specific fields
 */
export interface PersonDossier extends BaseDossier {
  type: 'person'
  extension: PersonExtension
}

/**
 * Engagement dossier type with engagement-specific extension
 *
 * @see EngagementExtension for type-specific fields
 */
export interface EngagementDossier extends BaseDossier {
  type: 'engagement'
  extension: EngagementExtension
}

/**
 * Forum dossier type with forum-specific extension
 *
 * @see ForumExtension for type-specific fields
 */
export interface ForumDossier extends BaseDossier {
  type: 'forum'
  extension: ForumExtension
}

/**
 * Working group dossier type with working group-specific extension
 *
 * @see WorkingGroupExtension for type-specific fields
 */
export interface WorkingGroupDossier extends BaseDossier {
  type: 'working_group'
  extension: WorkingGroupExtension
}

/**
 * Topic dossier type with topic-specific extension
 *
 * @see TopicExtension for type-specific fields
 */
export interface TopicDossier extends BaseDossier {
  type: 'topic'
  extension: TopicExtension
}

/**
 * Elected official dossier type with elected official-specific extension
 *
 * @see ElectedOfficialExtension for type-specific fields
 */
export interface ElectedOfficialDossier extends BaseDossier {
  type: 'elected_official'
  extension: ElectedOfficialExtension
}

/**
 * Discriminated union type for all dossier types
 *
 * @description
 * Use this type when accepting any dossier type. Use type guards
 * like `isCountryDossier()` to narrow down to specific types.
 *
 * @example
 * ```typescript
 * function processDossier(dossier: Dossier) {
 *   if (isCountryDossier(dossier)) {
 *     // TypeScript knows dossier.extension is CountryExtension
 *     console.log(dossier.extension.iso_code_2);
 *   }
 * }
 * ```
 */
export type Dossier =
  | CountryDossier
  | OrganizationDossier
  | PersonDossier
  | EngagementDossier
  | ForumDossier
  | WorkingGroupDossier
  | TopicDossier
  | ElectedOfficialDossier

// =============================================================================
// TYPE GUARD FUNCTIONS
// =============================================================================

/**
 * Type guard for country dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is a country dossier
 *
 * @example
 * ```typescript
 * if (isCountryDossier(dossier)) {
 *   console.log(dossier.extension.iso_code_2); // TypeScript knows this is safe
 * }
 * ```
 */
export function isCountryDossier(dossier: Dossier): dossier is CountryDossier {
  return dossier.type === 'country'
}

/**
 * Type guard for organization dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is an organization dossier
 */
export function isOrganizationDossier(dossier: Dossier): dossier is OrganizationDossier {
  return dossier.type === 'organization'
}

/**
 * Type guard for person dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is a person dossier
 */
export function isPersonDossier(dossier: Dossier): dossier is PersonDossier {
  return dossier.type === 'person'
}

/**
 * Type guard for engagement dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is an engagement dossier
 */
export function isEngagementDossier(dossier: Dossier): dossier is EngagementDossier {
  return dossier.type === 'engagement'
}

/**
 * Type guard for forum dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is a forum dossier
 */
export function isForumDossier(dossier: Dossier): dossier is ForumDossier {
  return dossier.type === 'forum'
}

/**
 * Type guard for working group dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is a working group dossier
 */
export function isWorkingGroupDossier(dossier: Dossier): dossier is WorkingGroupDossier {
  return dossier.type === 'working_group'
}

/**
 * Type guard for topic dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is a topic dossier
 */
export function isTopicDossier(dossier: Dossier): dossier is TopicDossier {
  return dossier.type === 'topic'
}

/**
 * Type guard for elected official dossiers
 *
 * @param dossier - Dossier to check
 * @returns True if the dossier is an elected official dossier
 */
export function isElectedOfficialDossier(dossier: Dossier): dossier is ElectedOfficialDossier {
  return dossier.type === 'elected_official'
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates that a dossier matches the expected type
 *
 * @param dossier - Dossier to validate
 * @param expectedType - Expected dossier type string
 * @returns True if dossier type matches expected type
 *
 * @example
 * ```typescript
 * if (validateDossierType(dossier, 'country')) {
 *   // dossier.type === 'country'
 * }
 * ```
 */
export function validateDossierType(dossier: Dossier, expectedType: DossierType): boolean {
  return dossier.type === expectedType
}

/**
 * Returns the appropriate type guard function for a given dossier type
 *
 * @param type - Dossier type to get guard for
 * @returns Type guard function for the specified type
 * @throws Error if type is unknown
 *
 * @example
 * ```typescript
 * const typeGuard = getTypeGuard('country');
 * if (typeGuard(dossier)) {
 *   // dossier is a country dossier
 * }
 * ```
 */
export function getTypeGuard(type: DossierType): (dossier: Dossier) => boolean {
  switch (type) {
    case 'country':
      return isCountryDossier
    case 'organization':
      return isOrganizationDossier
    case 'person':
      return isPersonDossier
    case 'engagement':
      return isEngagementDossier
    case 'forum':
      return isForumDossier
    case 'working_group':
      return isWorkingGroupDossier
    case 'topic':
      return isTopicDossier
    case 'elected_official':
      return isElectedOfficialDossier
    default:
      throw new Error(`Unknown dossier type: ${type}`)
  }
}

/**
 * Validates that a dossier has the expected type at runtime and throws if not
 *
 * This is useful for route loaders and API responses where type mismatches
 * should stop execution with a clear error message.
 *
 * @param dossier - Dossier to validate
 * @param expectedType - Expected dossier type
 * @throws Error if types don't match
 *
 * @example
 * ```typescript
 * // In a route loader
 * export const Route = createFileRoute('/dossiers/countries/$id')({
 *   loader: async ({ params }) => {
 *     const dossier = await fetchDossier(params.id);
 *     assertDossierType(dossier, 'country');
 *     return { dossier }; // TypeScript now knows dossier is CountryDossier
 *   },
 * });
 * ```
 */
export function assertDossierType(
  dossier: Dossier,
  expectedType: DossierType,
): asserts dossier is Extract<Dossier, { type: typeof expectedType }> {
  if (dossier.type !== expectedType) {
    throw new Error(`Dossier type mismatch: expected "${expectedType}", got "${dossier.type}"`)
  }
}

/**
 * Returns a human-readable label for a dossier type
 *
 * @param type - Dossier type
 * @param language - Language code ('en' | 'ar')
 * @returns Localized type label
 *
 * @example
 * ```typescript
 * getDossierTypeLabel('country', 'en'); // Returns "Country"
 * getDossierTypeLabel('working_group', 'ar'); // Returns "مجموعة عمل"
 * ```
 */
export function getDossierTypeLabel(type: DossierType, language: 'en' | 'ar'): string {
  const labels: Record<DossierType, { en: string; ar: string }> = {
    country: { en: 'Country', ar: 'دولة' },
    organization: { en: 'Organization', ar: 'منظمة' },
    person: { en: 'Person', ar: 'شخص' },
    engagement: { en: 'Engagement', ar: 'مشاركة' },
    forum: { en: 'Forum', ar: 'منتدى' },
    working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
    topic: { en: 'Topic', ar: 'موضوع' },
    elected_official: { en: 'Elected Official', ar: 'مسؤول منتخب' },
  }

  return labels[type][language]
}

/**
 * Returns an array of all dossier types
 *
 * Useful for iteration and type selection UIs
 *
 * @returns Array of all valid dossier types
 *
 * @example
 * ```typescript
 * const allTypes = getAllDossierTypes();
 * // ['country', 'organization', 'person', 'engagement', 'forum', 'working_group', 'topic']
 * ```
 */
export function getAllDossierTypes(): DossierType[] {
  return [
    'country',
    'organization',
    'person',
    'engagement',
    'forum',
    'working_group',
    'topic',
    'elected_official',
  ]
}
