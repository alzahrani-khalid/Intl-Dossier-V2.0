/**
 * EntityTypeFilterChips Component
 * Feature: Cross-Entity Search Disambiguation
 *
 * Quick filter chips for narrowing search results by entity type.
 * Shows counts per entity type and allows multi-select filtering.
 *
 * Mobile-first, RTL-compatible design.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  Building2,
  Users,
  Briefcase,
  Target,
  BookOpen,
  User,
  FileText,
  ScrollText,
  X,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type FilterableEntityType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'theme'
  | 'working_group'
  | 'person'
  | 'position'
  | 'document'
  | 'mou'

interface EntityTypeCounts {
  country?: number
  organization?: number
  forum?: number
  engagement?: number
  theme?: number
  working_group?: number
  person?: number
  position?: number
  document?: number
  mou?: number
}

interface EntityTypeFilterChipsProps {
  counts: EntityTypeCounts
  selectedTypes: FilterableEntityType[]
  onTypeToggle: (type: FilterableEntityType) => void
  onClearAll: () => void
  isLoading?: boolean
  showZeroCounts?: boolean
}

// Entity type configuration with icons and colors
const entityTypeConfig: Record<
  FilterableEntityType,
  {
    icon: React.ComponentType<{ className?: string }>
    label: { en: string; ar: string }
    activeColor: string
    activeBg: string
  }
> = {
  country: {
    icon: Globe,
    label: { en: 'Countries', ar: 'الدول' },
    activeColor: 'text-blue-700 dark:text-blue-300',
    activeBg: 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700',
  },
  organization: {
    icon: Building2,
    label: { en: 'Organizations', ar: 'المنظمات' },
    activeColor: 'text-purple-700 dark:text-purple-300',
    activeBg: 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700',
  },
  forum: {
    icon: Users,
    label: { en: 'Forums', ar: 'المنتديات' },
    activeColor: 'text-cyan-700 dark:text-cyan-300',
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/50 border-cyan-300 dark:border-cyan-700',
  },
  engagement: {
    icon: Briefcase,
    label: { en: 'Engagements', ar: 'المشاركات' },
    activeColor: 'text-green-700 dark:text-green-300',
    activeBg: 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700',
  },
  theme: {
    icon: Target,
    label: { en: 'Themes', ar: 'المواضيع' },
    activeColor: 'text-pink-700 dark:text-pink-300',
    activeBg: 'bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-700',
  },
  working_group: {
    icon: BookOpen,
    label: { en: 'Working Groups', ar: 'مجموعات العمل' },
    activeColor: 'text-amber-700 dark:text-amber-300',
    activeBg: 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700',
  },
  person: {
    icon: User,
    label: { en: 'People', ar: 'الأشخاص' },
    activeColor: 'text-teal-700 dark:text-teal-300',
    activeBg: 'bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-700',
  },
  position: {
    icon: FileText,
    label: { en: 'Positions', ar: 'المواقف' },
    activeColor: 'text-orange-700 dark:text-orange-300',
    activeBg: 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700',
  },
  document: {
    icon: FileText,
    label: { en: 'Documents', ar: 'الوثائق' },
    activeColor: 'text-indigo-700 dark:text-indigo-300',
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700',
  },
  mou: {
    icon: ScrollText,
    label: { en: 'MoUs', ar: 'مذكرات التفاهم' },
    activeColor: 'text-red-700 dark:text-red-300',
    activeBg: 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700',
  },
}

// Order of entity types to display
const entityTypeOrder: FilterableEntityType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'theme',
  'working_group',
  'person',
  'position',
  'document',
  'mou',
]

export function EntityTypeFilterChips({
  counts,
  selectedTypes,
  onTypeToggle,
  onClearAll,
  isLoading = false,
  showZeroCounts = false,
}: EntityTypeFilterChipsProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // Filter to only show types with counts (unless showZeroCounts is true)
  const visibleTypes = entityTypeOrder.filter((type) => {
    const count = counts[type] || 0
    return showZeroCounts || count > 0
  })

  // Calculate total count
  const totalCount = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0)

  if (visibleTypes.length === 0 && !isLoading) {
    return null
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="group"
      aria-label={isRTL ? 'تصفية حسب نوع الكيان' : 'Filter by entity type'}
    >
      {/* Filter label */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Filter className="size-4" />
        <span className="font-medium">{isRTL ? 'تصفية:' : 'Filter:'}</span>
        <span className="text-gray-500">
          ({totalCount} {isRTL ? 'نتيجة' : 'results'})
        </span>
      </div>

      {/* Filter chips container */}
      <div className="flex flex-wrap gap-2">
        {/* Entity type chips */}
        {visibleTypes.map((type) => {
          const config = entityTypeConfig[type]
          const Icon = config.icon
          const count = counts[type] || 0
          const isSelected = selectedTypes.includes(type)

          return (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              disabled={isLoading || count === 0}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? cn(config.activeBg, config.activeColor)
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
              )}
              aria-pressed={isSelected}
              title={`${isRTL ? config.label.ar : config.label.en}: ${count}`}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{isRTL ? config.label.ar : config.label.en}</span>
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn('ms-1 px-1.5 py-0 text-xs', isSelected && 'bg-white/20 text-inherit')}
              >
                {count > 999 ? '999+' : count}
              </Badge>
              {isSelected && <X className="ms-1 size-3 opacity-70" aria-hidden="true" />}
            </button>
          )
        })}

        {/* Clear all button */}
        {selectedTypes.length > 0 && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X className="size-3" />
            {isRTL ? 'مسح الكل' : 'Clear all'}
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        )}
      </div>
    </div>
  )
}
