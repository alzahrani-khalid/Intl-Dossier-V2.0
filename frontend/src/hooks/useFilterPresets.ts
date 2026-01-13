/**
 * Filter Presets Hook
 * Feature: Smart filter presets for no-results scenarios
 * Description: Provides predefined filter presets based on common queries
 *              to help users when complex filters return empty results
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { FilterPreset, FilterPresetCategory } from '@/types/enhanced-search.types'

// =============================================================================
// Default Presets Data
// =============================================================================

/**
 * Create default presets with translations
 * These are static presets that cover common query patterns
 */
function createDefaultPresets(language: string): FilterPreset[] {
  const isArabic = language === 'ar'

  return [
    // Dossier-focused presets
    {
      id: 'active-mena-dossiers',
      name_en: 'Active dossiers in MENA region',
      name_ar: 'الملفات النشطة في منطقة الشرق الأوسط وشمال أفريقيا',
      description_en: 'All active dossiers for Middle East and North Africa',
      description_ar: 'جميع الملفات النشطة لمنطقة الشرق الأوسط وشمال أفريقيا',
      icon: 'globe',
      category: 'geographic',
      color_theme: 'blue',
      is_popular: true,
      estimated_count: 45,
      filters: {
        entity_types: ['dossier'],
        status: ['active'],
        region: 'MENA',
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
    },
    {
      id: 'high-priority-briefs',
      name_en: 'High-priority briefs due this month',
      name_ar: 'الملخصات ذات الأولوية العالية المستحقة هذا الشهر',
      description_en: 'Urgent and high-priority briefs with deadlines this month',
      description_ar: 'الملخصات العاجلة وذات الأولوية العالية مع مواعيد نهائية هذا الشهر',
      icon: 'alert-triangle',
      category: 'brief',
      color_theme: 'red',
      is_popular: true,
      estimated_count: 12,
      filters: {
        entity_types: ['brief', 'document'],
        priority: ['high', 'urgent'],
        due_date: 'this_month',
        sort_by: 'deadline',
        sort_order: 'asc',
      },
    },
    {
      id: 'unassigned-intake',
      name_en: 'Unassigned intake requests',
      name_ar: 'طلبات الاستلام غير المعينة',
      description_en: 'Service requests waiting for assignment',
      description_ar: 'طلبات الخدمة في انتظار التعيين',
      icon: 'clipboard-check',
      category: 'intake',
      color_theme: 'amber',
      is_popular: true,
      estimated_count: 23,
      filters: {
        entity_types: ['intake'],
        assigned: false,
        status: ['pending', 'open'],
        sort_by: 'created_at',
        sort_order: 'asc',
      },
    },
    {
      id: 'overdue-tasks',
      name_en: 'Overdue tasks',
      name_ar: 'المهام المتأخرة',
      description_en: 'Work items past their deadline',
      description_ar: 'عناصر العمل التي تجاوزت موعدها النهائي',
      icon: 'clock',
      category: 'workflow',
      color_theme: 'red',
      estimated_count: 8,
      filters: {
        due_date: 'overdue',
        status: ['pending', 'in_progress'],
        sort_by: 'deadline',
        sort_order: 'asc',
      },
    },
    {
      id: 'recent-engagements',
      name_en: 'Recent engagements',
      name_ar: 'المشاركات الحديثة',
      description_en: 'Engagements updated in the last 7 days',
      description_ar: 'المشاركات المحدثة في آخر 7 أيام',
      icon: 'users',
      category: 'engagement',
      color_theme: 'green',
      estimated_count: 34,
      filters: {
        entity_types: ['engagement'],
        custom: {
          updated_within_days: 7,
        },
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
    },
    {
      id: 'sensitive-dossiers',
      name_en: 'High-sensitivity dossiers',
      name_ar: 'الملفات عالية الحساسية',
      description_en: 'Dossiers marked as highly sensitive',
      description_ar: 'الملفات المصنفة كحساسة للغاية',
      icon: 'shield',
      category: 'dossier',
      color_theme: 'purple',
      estimated_count: 15,
      filters: {
        entity_types: ['dossier'],
        sensitivity: ['high'],
        status: ['active'],
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
    },
    {
      id: 'pending-review',
      name_en: 'Pending review',
      name_ar: 'في انتظار المراجعة',
      description_en: 'Items waiting for approval or review',
      description_ar: 'العناصر في انتظار الموافقة أو المراجعة',
      icon: 'file-text',
      category: 'workflow',
      color_theme: 'amber',
      estimated_count: 18,
      filters: {
        status: ['review', 'pending_approval'],
        sort_by: 'updated_at',
        sort_order: 'asc',
      },
    },
    {
      id: 'my-assignments',
      name_en: 'My assignments',
      name_ar: 'تكليفاتي',
      description_en: 'All work items assigned to you',
      description_ar: 'جميع عناصر العمل المعينة لك',
      icon: 'user',
      category: 'workflow',
      color_theme: 'blue',
      estimated_count: 27,
      filters: {
        assigned: true,
        custom: {
          assigned_to_me: true,
        },
        sort_by: 'deadline',
        sort_order: 'asc',
      },
    },
  ]
}

// =============================================================================
// Hook Options
// =============================================================================

export interface UseFilterPresetsOptions {
  /** Filter presets by category */
  category?: FilterPresetCategory
  /** Entity types to filter presets for */
  entityTypes?: string[]
  /** Maximum number of presets to return */
  limit?: number
  /** Whether to include personalized presets (future feature) */
  includePersonalized?: boolean
  /** Current active filters count to determine relevance */
  activeFiltersCount?: number
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for getting filter presets
 *
 * @example
 * ```tsx
 * const { presets, getPresetsByCategory } = useFilterPresets({
 *   entityTypes: ['dossier', 'document'],
 *   limit: 4,
 * });
 *
 * // Display presets when no results
 * if (results.length === 0) {
 *   return <FilterPresetsSection presets={presets} onApplyPreset={handleApply} />;
 * }
 * ```
 */
export function useFilterPresets(options?: UseFilterPresetsOptions) {
  const { i18n } = useTranslation()
  const language = i18n.language

  const { category, entityTypes, limit, activeFiltersCount = 0 } = options || {}

  // Get all available presets
  const allPresets = useMemo(() => {
    return createDefaultPresets(language)
  }, [language])

  // Filter presets based on options
  const filteredPresets = useMemo(() => {
    let result = [...allPresets]

    // Filter by category
    if (category) {
      result = result.filter((preset) => preset.category === category)
    }

    // Filter by entity types (if preset has entity_types that overlap with requested)
    if (entityTypes && entityTypes.length > 0) {
      result = result.filter((preset) => {
        const presetEntityTypes = preset.filters.entity_types || []
        // Include if no entity_types specified in preset (generic) or if there's overlap
        if (presetEntityTypes.length === 0) return true
        return presetEntityTypes.some((t) => entityTypes.includes(t))
      })
    }

    // Sort by popularity and relevance
    result.sort((a, b) => {
      // Popular first
      if (a.is_popular && !b.is_popular) return -1
      if (!a.is_popular && b.is_popular) return 1

      // Higher estimated count indicates more relevant
      const countA = a.estimated_count || 0
      const countB = b.estimated_count || 0
      return countB - countA
    })

    // Apply limit
    if (limit && limit > 0) {
      result = result.slice(0, limit)
    }

    return result
  }, [allPresets, category, entityTypes, limit])

  // Get presets grouped by category
  const presetsByCategory = useMemo(() => {
    const grouped: Record<FilterPresetCategory, FilterPreset[]> = {
      dossier: [],
      intake: [],
      brief: [],
      engagement: [],
      workflow: [],
      geographic: [],
    }

    allPresets.forEach((preset) => {
      grouped[preset.category].push(preset)
    })

    return grouped
  }, [allPresets])

  // Get presets for a specific category
  const getPresetsByCategory = (cat: FilterPresetCategory): FilterPreset[] => {
    return presetsByCategory[cat] || []
  }

  // Get a specific preset by ID
  const getPresetById = (id: string): FilterPreset | undefined => {
    return allPresets.find((preset) => preset.id === id)
  }

  // Get recommended presets based on current context
  const getRecommendedPresets = (context: {
    hasFilters: boolean
    noResults: boolean
    entityTypes?: string[]
  }): FilterPreset[] => {
    let recommended = [...filteredPresets]

    // If user has filters that returned no results, prioritize presets that remove restrictions
    if (context.hasFilters && context.noResults) {
      // Prioritize less restrictive presets
      recommended = recommended.filter(
        (preset) =>
          !preset.filters.priority ||
          preset.filters.priority.length === 0 ||
          preset.filters.status?.includes('active'),
      )
    }

    // Further filter by entity types if provided
    if (context.entityTypes && context.entityTypes.length > 0) {
      const entityTypesSet = new Set(context.entityTypes)
      recommended = recommended.filter((preset) => {
        const presetTypes = preset.filters.entity_types || []
        return presetTypes.length === 0 || presetTypes.some((t) => entityTypesSet.has(t))
      })
    }

    return recommended.slice(0, 4)
  }

  return {
    /** All filtered presets based on options */
    presets: filteredPresets,
    /** All available presets without filtering */
    allPresets,
    /** Presets grouped by category */
    presetsByCategory,
    /** Get presets for a specific category */
    getPresetsByCategory,
    /** Get a preset by ID */
    getPresetById,
    /** Get recommended presets based on context */
    getRecommendedPresets,
    /** Whether presets are loading (for future API integration) */
    isLoading: false,
    /** Error if loading failed */
    error: null,
  }
}

export default useFilterPresets
