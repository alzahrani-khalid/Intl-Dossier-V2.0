/**
 * Tag Hierarchy Taxonomy Types
 *
 * Hierarchical tag system for organizing entities with parent-child relationships,
 * synonyms, and auto-suggestions. Supports tag merging, renaming, and usage analytics.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Entity types that can have tags assigned
 */
export const TAG_ENTITY_TYPES = [
  'dossier',
  'document',
  'brief',
  'engagement',
  'person',
  'working_group',
  'forum',
  'organization',
  'country',
] as const

export type TagEntityType = (typeof TAG_ENTITY_TYPES)[number]

/**
 * Types of tag matches from search
 */
export const TAG_MATCH_TYPES = ['exact', 'prefix', 'partial', 'synonym', 'fuzzy'] as const
export type TagMatchType = (typeof TAG_MATCH_TYPES)[number]

/**
 * Suggestion reasons for auto-suggested tags
 */
export const TAG_SUGGESTION_REASONS = [
  'similar_entities',
  'popular_in_type',
  'ai_recommended',
] as const
export type TagSuggestionReason = (typeof TAG_SUGGESTION_REASONS)[number]

// ============================================================================
// Tag Category (Main hierarchy structure)
// ============================================================================

export interface TagCategory {
  id: string
  parent_id: string | null

  // Bilingual names
  name_en: string
  name_ar: string

  // Visual properties
  color: string
  icon: string

  // Descriptions
  description_en?: string
  description_ar?: string

  // Hierarchy metadata
  hierarchy_level: number
  hierarchy_path: string[]

  // Usage tracking
  usage_count: number
  last_used_at?: string

  // Ordering
  sort_order: number

  // Status
  is_active: boolean
  is_system: boolean

  // Audit
  created_at: string
  updated_at: string
  created_by?: string

  // Computed/populated fields
  children?: TagCategory[]
  children_count?: number
}

/**
 * Tag category for creation (minimal required fields)
 */
export interface TagCategoryCreate {
  parent_id?: string | null
  name_en: string
  name_ar: string
  color?: string
  icon?: string
  description_en?: string
  description_ar?: string
  sort_order?: number
}

/**
 * Tag category for update
 */
export interface TagCategoryUpdate {
  parent_id?: string | null
  name_en?: string
  name_ar?: string
  color?: string
  icon?: string
  description_en?: string
  description_ar?: string
  sort_order?: number
  is_active?: boolean
}

// ============================================================================
// Tag Synonym
// ============================================================================

export interface TagSynonym {
  id: string
  tag_id: string
  synonym_en?: string
  synonym_ar?: string
  created_at: string
  created_by?: string
}

export interface TagSynonymCreate {
  tag_id: string
  synonym_en?: string
  synonym_ar?: string
}

// ============================================================================
// Entity Tag Assignment
// ============================================================================

export interface EntityTagAssignment {
  id: string
  entity_type: TagEntityType
  entity_id: string
  tag_id: string
  confidence_score: number
  is_auto_assigned: boolean
  auto_assignment_source?: string
  assigned_at: string
  assigned_by?: string

  // Populated tag details
  tag?: TagCategory
}

export interface EntityTagAssignmentCreate {
  entity_type: TagEntityType
  entity_id: string
  tag_id: string
  confidence_score?: number
  is_auto_assigned?: boolean
  auto_assignment_source?: string
}

// ============================================================================
// Tag Merge & Rename History
// ============================================================================

export interface TagMergeHistory {
  id: string
  target_tag_id: string
  source_tag_name_en: string
  source_tag_name_ar: string
  source_tag_id?: string
  assignments_transferred: number
  merged_at: string
  merged_by?: string
  merge_reason?: string
}

export interface TagRenameHistory {
  id: string
  tag_id: string
  old_name_en: string
  old_name_ar: string
  new_name_en: string
  new_name_ar: string
  renamed_at: string
  renamed_by?: string
  rename_reason?: string
}

// ============================================================================
// Tag Usage Analytics
// ============================================================================

export interface TagUsageAnalytics {
  tag_id: string
  name_en: string
  name_ar: string
  parent_id: string | null
  hierarchy_level: number
  color: string
  is_active: boolean
  total_assignments: number
  dossier_count: number
  document_count: number
  brief_count: number
  engagement_count: number
  auto_assigned_count: number
  avg_confidence: number
  last_assigned_at?: string
  children_count: number
}

// ============================================================================
// Search & Suggestions
// ============================================================================

export interface TagSearchResult {
  id: string
  name_en: string
  name_ar: string
  color: string
  parent_id: string | null
  hierarchy_level: number
  usage_count: number
  match_type: TagMatchType
  match_score: number
}

export interface TagSuggestion {
  tag_id: string
  name_en: string
  name_ar: string
  color: string
  suggestion_reason: TagSuggestionReason
  confidence: number
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface TagHierarchyFilters {
  root_id?: string
  max_depth?: number
  include_inactive?: boolean
  search?: string
}

export interface TagSearchParams {
  query: string
  language?: 'en' | 'ar'
  limit?: number
  entity_type?: TagEntityType
}

export interface TagAssignmentParams {
  entity_type: TagEntityType
  entity_id: string
}

export interface TagMergeRequest {
  source_tag_id: string
  target_tag_id: string
  reason?: string
}

export interface TagRenameRequest {
  tag_id: string
  new_name_en: string
  new_name_ar: string
  reason?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface TagHierarchyResponse {
  data: TagCategory[]
  total: number
}

export interface TagSearchResponse {
  data: TagSearchResult[]
  total: number
}

export interface TagSuggestionResponse {
  data: TagSuggestion[]
  entity_type: TagEntityType
  entity_id: string
}

export interface EntityTagsResponse {
  data: EntityTagAssignment[]
  entity_type: TagEntityType
  entity_id: string
}

export interface TagAnalyticsResponse {
  data: TagUsageAnalytics[]
  total: number
  last_refreshed?: string
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * Default tag colors for quick selection
 */
export const TAG_COLOR_PALETTE = [
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#EF4444', // Red
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#F59E0B', // Amber
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#10B981', // Emerald
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#3B82F6', // Blue
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#8B5CF6', // Violet
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#EC4899', // Pink
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#06B6D4', // Cyan
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#84CC16', // Lime
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#F97316', // Orange
  // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#tag-hierarchy.types
  '#6366F1', // Indigo
] as const

/**
 * Bilingual labels for entity types
 */
export const TAG_ENTITY_TYPE_LABELS: Record<TagEntityType, { en: string; ar: string }> = {
  dossier: { en: 'Dossier', ar: 'ملف' },
  document: { en: 'Document', ar: 'مستند' },
  brief: { en: 'Brief', ar: 'موجز' },
  engagement: { en: 'Engagement', ar: 'تفاعل' },
  person: { en: 'Person', ar: 'شخص' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  forum: { en: 'Forum', ar: 'منتدى' },
  organization: { en: 'Organization', ar: 'منظمة' },
  country: { en: 'Country', ar: 'دولة' },
}

/**
 * Bilingual labels for suggestion reasons
 */
export const TAG_SUGGESTION_REASON_LABELS: Record<TagSuggestionReason, { en: string; ar: string }> =
  {
    similar_entities: { en: 'Used in similar items', ar: 'مستخدم في عناصر مشابهة' },
    popular_in_type: { en: 'Popular for this type', ar: 'شائع لهذا النوع' },
    ai_recommended: { en: 'AI recommended', ar: 'موصى به من الذكاء الاصطناعي' },
  }

// ============================================================================
// Type Guards
// ============================================================================

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the display name for a tag based on language
 */
export function getTagName(tag: Pick<TagCategory, 'name_en' | 'name_ar'>, isRTL: boolean): string {
  return isRTL ? tag.name_ar : tag.name_en
}

/**
 * Build hierarchical structure from flat list
 */
export function buildTagHierarchy(flatTags: TagCategory[]): TagCategory[] {
  const tagMap = new Map<string, TagCategory>()
  const roots: TagCategory[] = []

  // First pass: create map of all tags
  flatTags.forEach((tag) => {
    tagMap.set(tag.id, { ...tag, children: [] })
  })

  // Second pass: build hierarchy
  flatTags.forEach((tag) => {
    const current = tagMap.get(tag.id)!
    if (tag.parent_id && tagMap.has(tag.parent_id)) {
      const parent = tagMap.get(tag.parent_id)!
      parent.children = parent.children || []
      parent.children.push(current)
    } else {
      roots.push(current)
    }
  })

  return roots
}

/**
 * Get all ancestor tags for a given tag
 */
export function getTagAncestors(tag: TagCategory, allTags: TagCategory[]): TagCategory[] {
  const ancestors: TagCategory[] = []
  let currentId = tag.parent_id

  while (currentId) {
    const parent = allTags.find((t) => t.id === currentId)
    if (parent) {
      ancestors.unshift(parent)
      currentId = parent.parent_id
    } else {
      break
    }
  }

  return ancestors
}
