/**
 * Entity Comparison Hook
 * @module hooks/useEntityComparison
 * @feature entity-comparison-view
 *
 * TanStack Query hooks for entity comparison functionality.
 * Handles fetching multiple entities and generating comparison results.
 */

import { useQueries } from '@tanstack/react-query'
import { useMemo, useCallback, useState } from 'react'
import { getDossier } from '@/services/dossier-api'
import type { DossierType, Dossier } from '@/lib/dossier-type-guards'
import type {
  EntityComparisonResult,
  FieldComparison,
  ComparisonSummary,
  FieldDifferenceType,
  FieldDisplayConfig,
  ComparisonFilters,
} from '@/types/entity-comparison.types'
import { dossierKeys } from '@/hooks/useDossier'

/**
 * Field configuration for base dossier fields
 */
const BASE_FIELD_CONFIGS: FieldDisplayConfig[] = [
  {
    key: 'id',
    labelKey: 'fields.base.id',
    category: 'base',
    defaultVisible: false,
    renderType: 'text',
  },
  {
    key: 'name_en',
    labelKey: 'fields.base.name_en',
    category: 'base',
    defaultVisible: true,
    renderType: 'text',
  },
  {
    key: 'name_ar',
    labelKey: 'fields.base.name_ar',
    category: 'base',
    defaultVisible: true,
    renderType: 'text',
  },
  {
    key: 'description_en',
    labelKey: 'fields.base.description_en',
    category: 'base',
    defaultVisible: true,
    renderType: 'text',
  },
  {
    key: 'description_ar',
    labelKey: 'fields.base.description_ar',
    category: 'base',
    defaultVisible: true,
    renderType: 'text',
  },
  {
    key: 'created_at',
    labelKey: 'fields.base.created_at',
    category: 'metadata',
    defaultVisible: false,
    renderType: 'date',
  },
  {
    key: 'updated_at',
    labelKey: 'fields.base.updated_at',
    category: 'metadata',
    defaultVisible: false,
    renderType: 'date',
  },
  {
    key: 'created_by',
    labelKey: 'fields.base.created_by',
    category: 'metadata',
    defaultVisible: false,
    renderType: 'text',
  },
  {
    key: 'updated_by',
    labelKey: 'fields.base.updated_by',
    category: 'metadata',
    defaultVisible: false,
    renderType: 'text',
  },
]

/**
 * Field configuration registry for extension fields by dossier type
 */
const EXTENSION_FIELD_CONFIGS: Record<DossierType, FieldDisplayConfig[]> = {
  country: [
    {
      key: 'iso_code_2',
      labelKey: 'fields.country.iso_code_2',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'iso_code_3',
      labelKey: 'fields.country.iso_code_3',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'capital_en',
      labelKey: 'fields.country.capital_en',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'capital_ar',
      labelKey: 'fields.country.capital_ar',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'region',
      labelKey: 'fields.country.region',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'subregion',
      labelKey: 'fields.country.subregion',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'population',
      labelKey: 'fields.country.population',
      category: 'extension',
      defaultVisible: true,
      renderType: 'number',
    },
    {
      key: 'area_sq_km',
      labelKey: 'fields.country.area_sq_km',
      category: 'extension',
      defaultVisible: true,
      renderType: 'number',
    },
    {
      key: 'flag_url',
      labelKey: 'fields.country.flag_url',
      category: 'extension',
      defaultVisible: false,
      renderType: 'url',
    },
  ],
  organization: [
    {
      key: 'org_code',
      labelKey: 'fields.organization.org_code',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'org_type',
      labelKey: 'fields.organization.org_type',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'parent_org_id',
      labelKey: 'fields.organization.parent_org_id',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'head_count',
      labelKey: 'fields.organization.head_count',
      category: 'extension',
      defaultVisible: true,
      renderType: 'number',
    },
    {
      key: 'established_date',
      labelKey: 'fields.organization.established_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'website_url',
      labelKey: 'fields.organization.website_url',
      category: 'extension',
      defaultVisible: true,
      renderType: 'url',
    },
  ],
  person: [
    {
      key: 'title',
      labelKey: 'fields.person.title',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'photo_url',
      labelKey: 'fields.person.photo_url',
      category: 'extension',
      defaultVisible: false,
      renderType: 'url',
    },
    {
      key: 'birth_date',
      labelKey: 'fields.person.birth_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'nationality',
      labelKey: 'fields.person.nationality',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'education',
      labelKey: 'fields.person.education',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
    {
      key: 'languages',
      labelKey: 'fields.person.languages',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
    {
      key: 'current_position',
      labelKey: 'fields.person.current_position',
      category: 'extension',
      defaultVisible: true,
      renderType: 'object',
    },
  ],
  engagement: [
    {
      key: 'engagement_type',
      labelKey: 'fields.engagement.engagement_type',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'start_date',
      labelKey: 'fields.engagement.start_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'end_date',
      labelKey: 'fields.engagement.end_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'location',
      labelKey: 'fields.engagement.location',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'participants',
      labelKey: 'fields.engagement.participants',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
    {
      key: 'outcomes',
      labelKey: 'fields.engagement.outcomes',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
  ],
  forum: [
    {
      key: 'forum_type',
      labelKey: 'fields.forum.forum_type',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'member_organizations',
      labelKey: 'fields.forum.member_organizations',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
    {
      key: 'meeting_frequency',
      labelKey: 'fields.forum.meeting_frequency',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'next_meeting_date',
      labelKey: 'fields.forum.next_meeting_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'deliverables',
      labelKey: 'fields.forum.deliverables',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
  ],
  working_group: [
    {
      key: 'parent_forum_id',
      labelKey: 'fields.working_group.parent_forum_id',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'chair_organization',
      labelKey: 'fields.working_group.chair_organization',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'mandate',
      labelKey: 'fields.working_group.mandate',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'start_date',
      labelKey: 'fields.working_group.start_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'end_date',
      labelKey: 'fields.working_group.end_date',
      category: 'extension',
      defaultVisible: true,
      renderType: 'date',
    },
    {
      key: 'members',
      labelKey: 'fields.working_group.members',
      category: 'extension',
      defaultVisible: true,
      renderType: 'array',
    },
  ],
  topic: [
    {
      key: 'topic_category',
      labelKey: 'fields.topic.topic_category',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
    {
      key: 'parent_topic_id',
      labelKey: 'fields.topic.parent_topic_id',
      category: 'extension',
      defaultVisible: true,
      renderType: 'text',
    },
  ],
}

/**
 * Serialize a value for comparison
 */
function serializeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * Get value from entity for a given field key
 */
function getEntityFieldValue(
  entity: Dossier,
  fieldKey: string,
  category: 'base' | 'extension' | 'metadata',
): unknown {
  if (category === 'base' || category === 'metadata') {
    return (entity as unknown as Record<string, unknown>)[fieldKey]
  }
  // Extension field
  const extension = (entity as unknown as { extension?: Record<string, unknown> }).extension
  return extension?.[fieldKey]
}

/**
 * Determine the difference type between values
 */
function getDifferenceType(values: unknown[]): FieldDifferenceType {
  const serialized = values.map(serializeValue)
  const uniqueValues = new Set(serialized)

  // All values are the same
  if (uniqueValues.size === 1) {
    return 'same'
  }

  // Check for added/removed (some values are empty, others are not)
  const hasEmpty = serialized.some((v) => v === '')
  const hasNonEmpty = serialized.some((v) => v !== '')

  if (hasEmpty && hasNonEmpty) {
    // If most are empty, it's "added" in the ones that have it
    // If most have values, it's "removed" from those missing
    const emptyCount = serialized.filter((v) => v === '').length
    if (emptyCount > serialized.length / 2) {
      return 'added'
    }
    return 'removed'
  }

  // Values are different but all present
  return 'different'
}

/**
 * Generate field comparisons for a list of entities
 */
function generateFieldComparisons(entities: Dossier[], entityType: DossierType): FieldComparison[] {
  const comparisons: FieldComparison[] = []

  // Add base field comparisons
  for (const config of BASE_FIELD_CONFIGS) {
    const rawValues = entities.map((entity) =>
      getEntityFieldValue(entity, config.key, config.category),
    )
    const values = rawValues as (string | number | boolean | null | undefined)[]
    comparisons.push({
      fieldKey: config.key,
      fieldLabel: config.labelKey,
      values,
      differenceType: getDifferenceType(rawValues),
      category: config.category,
      isBilingual: config.key.endsWith('_en') || config.key.endsWith('_ar'),
    })
  }

  // Add extension field comparisons
  const extensionConfigs = EXTENSION_FIELD_CONFIGS[entityType] || []
  for (const config of extensionConfigs) {
    const rawValues = entities.map((entity) => getEntityFieldValue(entity, config.key, 'extension'))
    const values = rawValues as (string | number | boolean | null | undefined)[]
    comparisons.push({
      fieldKey: config.key,
      fieldLabel: config.labelKey,
      values,
      differenceType: getDifferenceType(rawValues),
      category: 'extension',
      isBilingual: config.key.endsWith('_en') || config.key.endsWith('_ar'),
    })
  }

  return comparisons
}

/**
 * Generate comparison summary statistics
 */
function generateComparisonSummary(fieldComparisons: FieldComparison[]): ComparisonSummary {
  const totalFields = fieldComparisons.length
  const sameFields = fieldComparisons.filter((f) => f.differenceType === 'same').length
  const differentFields = totalFields - sameFields

  const similarityPercentage = totalFields > 0 ? Math.round((sameFields / totalFields) * 100) : 0

  // Get top 5 most different fields
  const mostDifferentFields = fieldComparisons
    .filter((f) => f.differenceType !== 'same')
    .slice(0, 5)
    .map((f) => f.fieldKey)

  return {
    totalFields,
    sameFields,
    differentFields,
    similarityPercentage,
    mostDifferentFields,
  }
}

/**
 * Query key factory for entity comparison
 */
export const entityComparisonKeys = {
  all: ['entityComparison'] as const,
  comparison: (type: DossierType, ids: string[]) =>
    [...entityComparisonKeys.all, 'compare', type, ids.sort().join(',')] as const,
}

/**
 * Hook to fetch and compare multiple entities
 *
 * @param entityType - Type of entities to compare
 * @param entityIds - Array of entity IDs to compare
 * @returns Comparison result with field-by-field analysis
 */
export function useEntityComparison(entityType: DossierType | null, entityIds: string[]) {
  // Fetch all entities in parallel
  const entityQueries = useQueries({
    queries: entityIds.map((id) => ({
      queryKey: dossierKeys.detail(id),
      queryFn: () => getDossier(id),
      enabled: !!entityType && entityIds.length >= 2,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  })

  // Check if all queries are loaded
  const isLoading = entityQueries.some((q) => q.isLoading)
  const isError = entityQueries.some((q) => q.isError)
  const errors = entityQueries.filter((q) => q.error).map((q) => q.error)

  // Get all successful entity data
  const entities = entityQueries.filter((q) => q.data).map((q) => q.data as unknown as Dossier)

  // Generate comparison result
  const comparisonResult = useMemo<EntityComparisonResult | null>(() => {
    if (!entityType || entities.length < 2) {
      return null
    }

    // Validate all entities are of the expected type
    const allSameType = entities.every((e) => e.type === entityType)
    if (!allSameType) {
      return null
    }

    const fieldComparisons = generateFieldComparisons(entities, entityType)
    const summary = generateComparisonSummary(fieldComparisons)

    return {
      entityType,
      entityIds,
      entities,
      fieldComparisons,
      summary,
      comparedAt: new Date().toISOString(),
    }
  }, [entityType, entities, entityIds])

  return {
    comparisonResult,
    isLoading,
    isError,
    errors,
    entities,
  }
}

/**
 * Hook to get field configurations for a dossier type
 */
export function useFieldConfigs(entityType: DossierType | null) {
  return useMemo(() => {
    if (!entityType) {
      return { baseFields: BASE_FIELD_CONFIGS, extensionFields: [] }
    }

    return {
      baseFields: BASE_FIELD_CONFIGS,
      extensionFields: EXTENSION_FIELD_CONFIGS[entityType] || [],
    }
  }, [entityType])
}

/**
 * Hook to manage comparison filters
 */
export function useComparisonFilters(initialFilters?: Partial<ComparisonFilters>) {
  const defaultFilters: ComparisonFilters = {
    showOnlyDifferences: false,
    showBaseFields: true,
    showExtensionFields: true,
    showMetadataFields: true,
    includedFields: [],
    excludedFields: [],
    ...initialFilters,
  }

  const [filters, setFilters] = useState<ComparisonFilters>(defaultFilters)

  const updateFilter = useCallback(
    <K extends keyof ComparisonFilters>(key: K, value: ComparisonFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const filteredComparisons = useCallback(
    (fieldComparisons: FieldComparison[]): FieldComparison[] => {
      return fieldComparisons.filter((field) => {
        // Filter by difference
        if (filters.showOnlyDifferences && field.differenceType === 'same') {
          return false
        }

        // Filter by category
        if (field.category === 'base' && !filters.showBaseFields) {
          return false
        }
        if (field.category === 'extension' && !filters.showExtensionFields) {
          return false
        }
        if (field.category === 'metadata' && !filters.showMetadataFields) {
          return false
        }

        // Filter by included fields
        if (filters.includedFields.length > 0 && !filters.includedFields.includes(field.fieldKey)) {
          return false
        }

        // Filter by excluded fields
        if (filters.excludedFields.includes(field.fieldKey)) {
          return false
        }

        return true
      })
    },
    [filters],
  )

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredComparisons,
  }
}

/**
 * Hook for entity selection state management
 */
export function useEntitySelection(maxSelections: number = 5, minSelections: number = 2) {
  const [selectedType, setSelectedType] = useState<DossierType | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((existingId) => existingId !== id)
        }
        if (prev.length >= maxSelections) {
          return prev
        }
        return [...prev, id]
      })
    },
    [maxSelections],
  )

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const canCompare = selectedIds.length >= minSelections && selectedIds.length <= maxSelections

  return {
    selectedType,
    setSelectedType,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    toggleSelection,
    clearSelection,
    canCompare,
    maxSelections,
    minSelections,
  }
}

export default useEntityComparison
