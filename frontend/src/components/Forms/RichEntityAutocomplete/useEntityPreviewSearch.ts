/**
 * Enhanced Entity Search Hook with Preview Data
 * Feature: rich-entity-autocomplete
 *
 * Extends base entity search with additional preview data
 * including status, recent activity, and key details.
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Entity type - matching the backend types
export type EntityType =
  | 'dossier'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'assignment'
  | 'commitment'
  | 'intelligence_signal'
  | 'organization'
  | 'country'
  | 'forum'
  | 'working_group'
  | 'topic'

/**
 * Debounced value hook
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Entity with preview data for rich display
 */
export interface EntityWithPreview {
  // Core identity
  entity_id: string
  entity_type: EntityType

  // Display names (bilingual)
  name_en: string
  name_ar: string

  // Type-specific subtitle (e.g., "Ministry of Finance" for a person)
  subtitle_en?: string
  subtitle_ar?: string

  // Entity status
  status: 'active' | 'inactive' | 'archived' | 'draft'

  // Key details for disambiguation
  key_details: {
    label_en: string
    label_ar: string
    value_en: string
    value_ar: string
  }[]

  // Recent activity summary
  recent_activity?: {
    type: 'engagement' | 'document' | 'update' | 'relationship'
    description_en: string
    description_ar: string
    date: string
  }

  // Search relevance
  combined_score: number
  similarity_score?: number

  // Additional metadata
  classification_level?: number
  tags?: string[]
  photo_url?: string
  organization_name_en?: string
  organization_name_ar?: string
  last_updated: string
}

/**
 * Search filters for entity preview search
 */
export interface EntityPreviewSearchFilters {
  query?: string
  entity_types?: EntityType[]
  exclude_ids?: string[]
  organization_id?: string
  classification_level?: number
  include_archived?: boolean
  limit?: number
}

/**
 * Hook options
 */
export interface UseEntityPreviewSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  enabled?: boolean
  limit?: number
}

/**
 * Query keys for cache management
 */
export const entityPreviewSearchKeys = {
  all: ['entity-preview-search'] as const,
  searches: () => [...entityPreviewSearchKeys.all, 'search'] as const,
  search: (filters: EntityPreviewSearchFilters) =>
    [...entityPreviewSearchKeys.searches(), filters] as const,
}

/**
 * Transform database result to EntityWithPreview
 */
function transformToEntityPreview(
  result: Record<string, unknown>,
  entityType: EntityType,
): EntityWithPreview {
  const basePreview: EntityWithPreview = {
    entity_id: result.id as string,
    entity_type: entityType,
    name_en: (result.name_en as string) || (result.title_en as string) || '',
    name_ar: (result.name_ar as string) || (result.title_ar as string) || '',
    status: (result.status as EntityWithPreview['status']) || 'active',
    key_details: [],
    combined_score: (result.combined_score as number) || 0,
    similarity_score: result.similarity_score as number | undefined,
    classification_level: result.classification_level as number | undefined,
    tags: result.tags as string[] | undefined,
    last_updated:
      (result.updated_at as string) || (result.created_at as string) || new Date().toISOString(),
  }

  // Add type-specific details
  switch (entityType) {
    case 'dossier':
      basePreview.key_details.push({
        label_en: 'Type',
        label_ar: 'النوع',
        value_en: formatDossierType(result.type as string),
        value_ar: formatDossierTypeAr(result.type as string),
      })
      if (result.sensitivity_level) {
        basePreview.key_details.push({
          label_en: 'Sensitivity',
          label_ar: 'الحساسية',
          value_en: formatSensitivityLevel(result.sensitivity_level as string),
          value_ar: formatSensitivityLevelAr(result.sensitivity_level as string),
        })
      }
      break

    case 'organization':
      if (result.org_type) {
        basePreview.key_details.push({
          label_en: 'Type',
          label_ar: 'النوع',
          value_en: result.org_type as string,
          value_ar: result.org_type as string,
        })
      }
      if (result.country_name_en) {
        basePreview.key_details.push({
          label_en: 'Country',
          label_ar: 'الدولة',
          value_en: result.country_name_en as string,
          value_ar: (result.country_name_ar as string) || (result.country_name_en as string),
        })
      }
      break

    case 'country':
      if (result.region) {
        basePreview.key_details.push({
          label_en: 'Region',
          label_ar: 'المنطقة',
          value_en: result.region as string,
          value_ar: (result.region_ar as string) || (result.region as string),
        })
      }
      if (result.iso_code) {
        basePreview.key_details.push({
          label_en: 'ISO Code',
          label_ar: 'رمز ISO',
          value_en: result.iso_code as string,
          value_ar: result.iso_code as string,
        })
      }
      break

    case 'forum':
      if (result.forum_type) {
        basePreview.key_details.push({
          label_en: 'Type',
          label_ar: 'النوع',
          value_en: result.forum_type as string,
          value_ar: result.forum_type as string,
        })
      }
      if (result.member_count) {
        basePreview.key_details.push({
          label_en: 'Members',
          label_ar: 'الأعضاء',
          value_en: `${result.member_count} members`,
          value_ar: `${result.member_count} عضو`,
        })
      }
      break

    case 'engagement':
      basePreview.subtitle_en = result.engagement_type as string
      basePreview.subtitle_ar = result.engagement_type as string
      if (result.start_date) {
        basePreview.key_details.push({
          label_en: 'Date',
          label_ar: 'التاريخ',
          value_en: formatDate(result.start_date as string),
          value_ar: formatDateAr(result.start_date as string),
        })
      }
      if (result.location) {
        basePreview.key_details.push({
          label_en: 'Location',
          label_ar: 'الموقع',
          value_en: result.location as string,
          value_ar: result.location as string,
        })
      }
      break

    case 'position':
      basePreview.subtitle_en = result.position_type_en as string
      basePreview.subtitle_ar =
        (result.position_type_ar as string) || (result.position_type_en as string)
      if (result.person_name_en) {
        basePreview.key_details.push({
          label_en: 'Person',
          label_ar: 'الشخص',
          value_en: result.person_name_en as string,
          value_ar: (result.person_name_ar as string) || (result.person_name_en as string),
        })
      }
      if (result.start_date) {
        basePreview.key_details.push({
          label_en: 'Since',
          label_ar: 'منذ',
          value_en: formatDate(result.start_date as string),
          value_ar: formatDateAr(result.start_date as string),
        })
      }
      break

    case 'mou':
      if (result.signed_date) {
        basePreview.key_details.push({
          label_en: 'Signed',
          label_ar: 'التوقيع',
          value_en: formatDate(result.signed_date as string),
          value_ar: formatDateAr(result.signed_date as string),
        })
      }
      if (result.expiry_date) {
        basePreview.key_details.push({
          label_en: 'Expires',
          label_ar: 'انتهاء الصلاحية',
          value_en: formatDate(result.expiry_date as string),
          value_ar: formatDateAr(result.expiry_date as string),
        })
      }
      break

    case 'commitment':
      if (result.deadline) {
        basePreview.key_details.push({
          label_en: 'Deadline',
          label_ar: 'الموعد النهائي',
          value_en: formatDate(result.deadline as string),
          value_ar: formatDateAr(result.deadline as string),
        })
      }
      if (result.priority) {
        basePreview.key_details.push({
          label_en: 'Priority',
          label_ar: 'الأولوية',
          value_en: result.priority as string,
          value_ar: formatPriorityAr(result.priority as string),
        })
      }
      break

    case 'working_group':
      if (result.chair_name_en) {
        basePreview.key_details.push({
          label_en: 'Chair',
          label_ar: 'الرئيس',
          value_en: result.chair_name_en as string,
          value_ar: (result.chair_name_ar as string) || (result.chair_name_en as string),
        })
      }
      if (result.member_count) {
        basePreview.key_details.push({
          label_en: 'Members',
          label_ar: 'الأعضاء',
          value_en: `${result.member_count} members`,
          value_ar: `${result.member_count} عضو`,
        })
      }
      break

    case 'topic':
      if (result.category) {
        basePreview.key_details.push({
          label_en: 'Category',
          label_ar: 'الفئة',
          value_en: result.category as string,
          value_ar: result.category as string,
        })
      }
      break
  }

  // Add recent activity if available
  if (result.recent_activity_type && result.recent_activity_date) {
    const activityType = result.recent_activity_type as
      | 'engagement'
      | 'document'
      | 'update'
      | 'relationship'
    basePreview.recent_activity = {
      type: activityType,
      description_en: (result.recent_activity_desc_en as string) || 'Recent activity',
      description_ar: (result.recent_activity_desc_ar as string) || 'نشاط حديث',
      date: result.recent_activity_date as string,
    }
  }

  // Add organization info if available
  if (result.organization_name_en) {
    basePreview.organization_name_en = result.organization_name_en as string
    basePreview.organization_name_ar =
      (result.organization_name_ar as string) || (result.organization_name_en as string)
    basePreview.subtitle_en = basePreview.organization_name_en
    basePreview.subtitle_ar = basePreview.organization_name_ar
  }

  // Add photo if available
  if (result.photo_url) {
    basePreview.photo_url = result.photo_url as string
  }

  return basePreview
}

// Helper formatting functions
function formatDossierType(type: string): string {
  const typeMap: Record<string, string> = {
    country: 'Country Dossier',
    organization: 'Organization Dossier',
    forum: 'Forum Dossier',
    theme: 'Theme Dossier',
    person: 'Person Dossier',
  }
  return typeMap[type] || type
}

function formatDossierTypeAr(type: string): string {
  const typeMap: Record<string, string> = {
    country: 'ملف دولة',
    organization: 'ملف منظمة',
    forum: 'ملف منتدى',
    theme: 'ملف موضوع',
    person: 'ملف شخص',
  }
  return typeMap[type] || type
}

function formatSensitivityLevel(level: string): string {
  const levelMap: Record<string, string> = {
    low: 'Public',
    medium: 'Internal',
    high: 'Confidential',
  }
  return levelMap[level] || level
}

function formatSensitivityLevelAr(level: string): string {
  const levelMap: Record<string, string> = {
    low: 'عام',
    medium: 'داخلي',
    high: 'سري',
  }
  return levelMap[level] || level
}

function formatPriorityAr(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    urgent: 'عاجل',
  }
  return priorityMap[priority] || priority
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateAr(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Fetch entities with preview data
 */
async function fetchEntitiesWithPreview(
  filters: EntityPreviewSearchFilters,
): Promise<EntityWithPreview[]> {
  if (!filters.query || filters.query.length < 2) {
    return []
  }

  const results: EntityWithPreview[] = []
  const defaultTypes: EntityType[] = ['dossier', 'organization', 'country', 'forum']
  const entityTypes: EntityType[] = filters.entity_types || defaultTypes
  const searchQuery = `%${filters.query}%`
  const limit = Math.ceil((filters.limit || 20) / entityTypes.length)

  // Search dossiers
  if (entityTypes.includes('dossier')) {
    const { data: dossiers } = await supabase
      .from('dossiers')
      .select(
        `
        id, type, name_en, name_ar, status, sensitivity_level,
        tags, updated_at, created_at
      `,
      )
      .or(`name_en.ilike.${searchQuery},name_ar.ilike.${searchQuery}`)
      .neq('status', filters.include_archived ? '' : 'archived')
      .limit(limit)

    if (dossiers) {
      for (const d of dossiers) {
        if (!filters.exclude_ids?.includes(d.id)) {
          results.push(transformToEntityPreview(d, 'dossier'))
        }
      }
    }
  }

  // Search organizations
  if (entityTypes.includes('organization')) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select(
        `
        id, name_en, name_ar, status, org_type,
        country:countries(name_en, name_ar),
        updated_at, created_at
      `,
      )
      .or(`name_en.ilike.${searchQuery},name_ar.ilike.${searchQuery}`)
      .limit(limit)

    if (orgs) {
      for (const o of orgs) {
        if (!filters.exclude_ids?.includes(o.id)) {
          // Handle country as array or object (Supabase foreign key joins can return either)
          const countryData = Array.isArray(o.country) ? o.country[0] : o.country
          const orgData = {
            ...o,
            country_name_en: countryData?.name_en,
            country_name_ar: countryData?.name_ar,
          }
          results.push(transformToEntityPreview(orgData as Record<string, unknown>, 'organization'))
        }
      }
    }
  }

  // Search countries
  if (entityTypes.includes('country')) {
    const { data: countries } = await supabase
      .from('countries')
      .select(
        `
        id, name_en, name_ar, status, iso_code, region,
        updated_at, created_at
      `,
      )
      .or(`name_en.ilike.${searchQuery},name_ar.ilike.${searchQuery},iso_code.ilike.${searchQuery}`)
      .limit(limit)

    if (countries) {
      for (const c of countries) {
        if (!filters.exclude_ids?.includes(c.id)) {
          results.push(transformToEntityPreview(c, 'country'))
        }
      }
    }
  }

  // Search forums
  if (entityTypes.includes('forum')) {
    const { data: forums } = await supabase
      .from('forums')
      .select(
        `
        id, name_en, name_ar, status, forum_type,
        updated_at, created_at
      `,
      )
      .or(`name_en.ilike.${searchQuery},name_ar.ilike.${searchQuery}`)
      .limit(limit)

    if (forums) {
      for (const f of forums) {
        if (!filters.exclude_ids?.includes(f.id)) {
          results.push(transformToEntityPreview(f, 'forum'))
        }
      }
    }
  }

  // Calculate combined scores
  const queryLower = filters.query.toLowerCase()
  results.forEach((r) => {
    const nameEnMatch = r.name_en.toLowerCase().includes(queryLower)
    const nameArMatch = r.name_ar.toLowerCase().includes(queryLower)
    const exactMatch =
      r.name_en.toLowerCase() === queryLower || r.name_ar.toLowerCase() === queryLower

    // Score based on match quality
    let score = 0
    if (exactMatch) score = 1.0
    else if (nameEnMatch || nameArMatch) score = 0.8
    else score = 0.5

    // Recency bonus (last 30 days gets boost)
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(r.last_updated).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSinceUpdate < 30) {
      score += 0.1 * (1 - daysSinceUpdate / 30)
    }

    r.combined_score = Math.min(1, score)
  })

  // Sort by combined score
  results.sort((a, b) => b.combined_score - a.combined_score)

  return results.slice(0, filters.limit || 20)
}

/**
 * Hook for entity search with preview data
 */
export function useEntityPreviewSearch(
  filters: Omit<EntityPreviewSearchFilters, 'limit'>,
  options: UseEntityPreviewSearchOptions = {},
) {
  const { debounceMs = 300, minQueryLength = 2, enabled = true, limit = 20 } = options

  const debouncedQuery = useDebouncedValue(filters.query || '', debounceMs)

  const shouldSearch = enabled && debouncedQuery.length >= minQueryLength

  return useQuery({
    queryKey: entityPreviewSearchKeys.search({
      ...filters,
      query: debouncedQuery,
      limit,
    }),
    queryFn: () =>
      fetchEntitiesWithPreview({
        ...filters,
        query: debouncedQuery,
        limit,
      }),
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Stateful entity preview search hook
 */
export function useEntityPreviewSearchState(
  initialFilters: Omit<EntityPreviewSearchFilters, 'query' | 'limit'> = {},
  options: UseEntityPreviewSearchOptions = {},
) {
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<EntityType[] | undefined>(
    initialFilters.entity_types,
  )

  const searchFilters: Omit<EntityPreviewSearchFilters, 'limit'> = {
    query,
    entity_types: selectedTypes,
    exclude_ids: initialFilters.exclude_ids,
    organization_id: initialFilters.organization_id,
    classification_level: initialFilters.classification_level,
    include_archived: initialFilters.include_archived ?? false,
  }

  const searchQuery = useEntityPreviewSearch(searchFilters, options)

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  const toggleEntityType = useCallback((entityType: EntityType) => {
    setSelectedTypes((prev) => {
      if (!prev) return [entityType]
      if (prev.includes(entityType)) {
        return prev.filter((t) => t !== entityType)
      }
      return [...prev, entityType]
    })
  }, [])

  const clearFilters = useCallback(() => {
    setQuery('')
    setSelectedTypes(undefined)
  }, [])

  return {
    query,
    setQuery,
    selectedTypes,
    setSelectedTypes,
    toggleEntityType,
    clearSearch,
    clearFilters,
    ...searchQuery,
  }
}
