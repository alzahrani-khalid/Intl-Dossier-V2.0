/**
 * Type guards for dossier entity types
 * Provides runtime validation for discriminated union pattern
 * Feature: 028-type-specific-dossier-pages
 */

// Base dossier type (from existing schema)
export type DossierType =
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'forum'
  | 'working_group'
  | 'topic';

// Extension schemas for each dossier type
// IMPORTANT: Must match database schema in supabase/migrations/20251022000002_create_extension_tables.sql
export interface CountryExtension {
  iso_code_2: string; // ISO 3166-1 alpha-2 (e.g., "SA")
  iso_code_3: string; // ISO 3166-1 alpha-3 (e.g., "SAU")
  capital_en?: string; // Capital city (English)
  capital_ar?: string; // Capital city (Arabic)
  region?: string; // Geographic region
  subregion?: string; // Geographic subregion
  population?: number; // Population count
  area_sq_km?: number; // Area in square kilometers
  flag_url?: string; // URL to country flag image
}

export interface OrganizationExtension {
  org_code: string; // Unique organization code
  org_type: 'government' | 'ngo' | 'international' | 'private';
  parent_org_id?: string; // For hierarchical organizations
  head_count?: number;
  established_date?: string;
  website_url?: string;
}

export interface PersonExtension {
  title?: string; // Professional title
  photo_url?: string; // Profile photo
  birth_date?: string;
  nationality?: string;
  education?: string[];
  languages?: string[];
  current_position?: {
    title: string;
    organization: string;
    start_date: string;
  };
}

export interface EngagementExtension {
  engagement_type: 'meeting' | 'conference' | 'visit' | 'negotiation';
  start_date: string;
  end_date?: string;
  location?: string;
  participants: Array<{
    dossier_id: string;
    role: string;
  }>;
  outcomes?: string[];
}

export interface ForumExtension {
  forum_type: 'bilateral' | 'multilateral' | 'working_group';
  member_organizations: string[]; // Dossier IDs
  meeting_frequency?: string;
  next_meeting_date?: string;
  deliverables?: Array<{
    name: string;
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}

export interface WorkingGroupExtension {
  parent_forum_id?: string;
  chair_organization?: string;
  mandate: string;
  start_date: string;
  end_date?: string;
  members: Array<{
    dossier_id: string;
    role: 'chair' | 'member' | 'observer';
  }>;
}

export interface TopicExtension {
  topic_category?: 'policy' | 'technical' | 'strategic' | 'operational';
  parent_topic_id?: string; // For hierarchical topics
}

// Base dossier interface (from existing unified schema)
export interface BaseDossier {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Type-specific dossier interfaces (discriminated union)
export interface CountryDossier extends BaseDossier {
  type: 'country';
  extension: CountryExtension;
}

export interface OrganizationDossier extends BaseDossier {
  type: 'organization';
  extension: OrganizationExtension;
}

export interface PersonDossier extends BaseDossier {
  type: 'person';
  extension: PersonExtension;
}

export interface EngagementDossier extends BaseDossier {
  type: 'engagement';
  extension: EngagementExtension;
}

export interface ForumDossier extends BaseDossier {
  type: 'forum';
  extension: ForumExtension;
}

export interface WorkingGroupDossier extends BaseDossier {
  type: 'working_group';
  extension: WorkingGroupExtension;
}

export interface TopicDossier extends BaseDossier {
  type: 'topic';
  extension: TopicExtension;
}

// Discriminated union type
export type Dossier =
  | CountryDossier
  | OrganizationDossier
  | PersonDossier
  | EngagementDossier
  | ForumDossier
  | WorkingGroupDossier
  | TopicDossier;

// Type guard functions
export function isCountryDossier(dossier: Dossier): dossier is CountryDossier {
  return dossier.type === 'country';
}

export function isOrganizationDossier(
  dossier: Dossier
): dossier is OrganizationDossier {
  return dossier.type === 'organization';
}

export function isPersonDossier(dossier: Dossier): dossier is PersonDossier {
  return dossier.type === 'person';
}

export function isEngagementDossier(
  dossier: Dossier
): dossier is EngagementDossier {
  return dossier.type === 'engagement';
}

export function isForumDossier(dossier: Dossier): dossier is ForumDossier {
  return dossier.type === 'forum';
}

export function isWorkingGroupDossier(
  dossier: Dossier
): dossier is WorkingGroupDossier {
  return dossier.type === 'working_group';
}

export function isTopicDossier(dossier: Dossier): dossier is TopicDossier {
  return dossier.type === 'topic';
}

// Helper function to validate dossier type at runtime
export function validateDossierType(
  dossier: Dossier,
  expectedType: DossierType
): boolean {
  return dossier.type === expectedType;
}

// Helper function to get type guard by type name
export function getTypeGuard(
  type: DossierType
): (dossier: Dossier) => boolean {
  switch (type) {
    case 'country':
      return isCountryDossier;
    case 'organization':
      return isOrganizationDossier;
    case 'person':
      return isPersonDossier;
    case 'engagement':
      return isEngagementDossier;
    case 'forum':
      return isForumDossier;
    case 'working_group':
      return isWorkingGroupDossier;
    case 'topic':
      return isTopicDossier;
    default:
      throw new Error(`Unknown dossier type: ${type}`);
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
  expectedType: DossierType
): asserts dossier is Extract<Dossier, { type: typeof expectedType }> {
  if (dossier.type !== expectedType) {
    throw new Error(
      `Dossier type mismatch: expected "${expectedType}", got "${dossier.type}"`
    );
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
  };

  return labels[type][language];
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
  return ['country', 'organization', 'person', 'engagement', 'forum', 'working_group', 'topic'];
}
