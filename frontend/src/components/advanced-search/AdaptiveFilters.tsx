/**
 * AdaptiveFilters Component
 * Feature: Enhanced search with adaptive filters
 * Description: Filter panel that shows result counts for each filter option
 *              before applying, adapting based on current context
 */

import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Circle,
  Loader2,
  Filter,
  Calendar,
  Tag,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useFilterCounts } from '@/hooks/useEnhancedSearch'
import type { FilterCount, FilterType } from '@/types/enhanced-search.types'

// =============================================================================
// Types
// =============================================================================

interface AdaptiveFiltersProps {
  cacheKey: string
  entityTypes: string[]
  baseQuery?: string
  selectedFilters: Record<FilterType, string[]>
  onFilterChange: (filterType: FilterType, values: string[]) => void
  className?: string
  defaultExpanded?: boolean
}

interface FilterSectionProps {
  type: FilterType
  title: string
  icon: React.ReactNode
  options: FilterOptionWithCount[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  isLoading: boolean
  isRTL: boolean
}

interface FilterOptionWithCount {
  value: string
  label_en: string
  label_ar: string
  count: number
}

// =============================================================================
// Filter Configuration
// =============================================================================

const STATUS_OPTIONS: Omit<FilterOptionWithCount, 'count'>[] = [
  { value: 'active', label_en: 'Active', label_ar: 'نشط' },
  { value: 'inactive', label_en: 'Inactive', label_ar: 'غير نشط' },
  { value: 'archived', label_en: 'Archived', label_ar: 'مؤرشف' },
  { value: 'draft', label_en: 'Draft', label_ar: 'مسودة' },
  { value: 'published', label_en: 'Published', label_ar: 'منشور' },
]

const TYPE_OPTIONS: Omit<FilterOptionWithCount, 'count'>[] = [
  { value: 'country', label_en: 'Country', label_ar: 'دولة' },
  { value: 'organization', label_en: 'Organization', label_ar: 'منظمة' },
  { value: 'forum', label_en: 'Forum', label_ar: 'منتدى' },
  { value: 'theme', label_en: 'Theme', label_ar: 'موضوع' },
]

const DATE_RANGE_OPTIONS: Omit<FilterOptionWithCount, 'count'>[] = [
  { value: 'last_7_days', label_en: 'Last 7 days', label_ar: 'آخر 7 أيام' },
  { value: 'last_30_days', label_en: 'Last 30 days', label_ar: 'آخر 30 يوماً' },
  { value: 'last_90_days', label_en: 'Last 90 days', label_ar: 'آخر 90 يوماً' },
]

const SENSITIVITY_OPTIONS: Omit<FilterOptionWithCount, 'count'>[] = [
  { value: 'low', label_en: 'Low', label_ar: 'منخفض' },
  { value: 'medium', label_en: 'Medium', label_ar: 'متوسط' },
  { value: 'high', label_en: 'High', label_ar: 'عالي' },
]

// =============================================================================
// Filter Option Component
// =============================================================================

interface FilterOptionProps {
  option: FilterOptionWithCount
  isSelected: boolean
  onClick: () => void
  isRTL: boolean
  isLoading: boolean
}

function FilterOption({ option, isSelected, onClick, isRTL, isLoading }: FilterOptionProps) {
  const label = isRTL ? option.label_ar : option.label_en

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-h-10',
        'text-start hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected && 'bg-primary/10 text-primary',
      )}
      disabled={option.count === 0}
    >
      {/* Checkbox indicator */}
      {isSelected ? (
        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
      ) : (
        <Circle className={cn('h-4 w-4 flex-shrink-0', option.count === 0 && 'opacity-50')} />
      )}

      {/* Label */}
      <span className={cn('flex-1 text-sm', option.count === 0 && 'opacity-50')}>{label}</span>

      {/* Count Badge */}
      {isLoading ? (
        <Skeleton className="h-5 w-8 rounded-full" />
      ) : (
        <Badge
          variant={isSelected ? 'default' : 'secondary'}
          className={cn('text-xs px-2', option.count === 0 && 'opacity-50')}
        >
          {option.count.toLocaleString()}
        </Badge>
      )}
    </button>
  )
}

// =============================================================================
// Filter Section Component
// =============================================================================

function FilterSection({
  type,
  title,
  icon,
  options,
  selectedValues,
  onChange,
  isLoading,
  isRTL,
}: FilterSectionProps) {
  const handleOptionClick = useCallback(
    (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
      onChange(newValues)
    },
    [selectedValues, onChange],
  )

  const activeCount = selectedValues.length

  return (
    <Collapsible defaultOpen={activeCount > 0}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 min-h-11 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="ms-1">
                {activeCount}
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="ps-2 pt-1 pb-2 space-y-0.5">
        {options.map((option) => (
          <FilterOption
            key={option.value}
            option={option}
            isSelected={selectedValues.includes(option.value)}
            onClick={() => handleOptionClick(option.value)}
            isRTL={isRTL}
            isLoading={isLoading}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function AdaptiveFilters({
  cacheKey,
  entityTypes,
  baseQuery,
  selectedFilters,
  onFilterChange,
  className,
  defaultExpanded = true,
}: AdaptiveFiltersProps) {
  const { t, i18n } = useTranslation('enhanced-search')
  const isRTL = i18n.language === 'ar'

  // Fetch filter counts
  const { data: filterCounts, isLoading } = useFilterCounts(cacheKey, entityTypes, baseQuery, {
    enabled: true,
  })

  // Merge counts with options
  const mergeWithCounts = useCallback(
    (
      options: Omit<FilterOptionWithCount, 'count'>[],
      filterType: FilterType,
    ): FilterOptionWithCount[] => {
      return options.map((option) => {
        const count = filterCounts?.find(
          (fc) => fc.filter_type === filterType && fc.filter_value === option.value,
        )
        return {
          ...option,
          count: count?.result_count ?? 0,
        }
      })
    },
    [filterCounts],
  )

  // Options with counts
  const statusOptions = useMemo(() => mergeWithCounts(STATUS_OPTIONS, 'status'), [mergeWithCounts])

  const typeOptions = useMemo(() => mergeWithCounts(TYPE_OPTIONS, 'type'), [mergeWithCounts])

  const dateRangeOptions = useMemo(
    () => mergeWithCounts(DATE_RANGE_OPTIONS, 'date_range'),
    [mergeWithCounts],
  )

  const sensitivityOptions = useMemo(
    () => mergeWithCounts(SENSITIVITY_OPTIONS, 'sensitivity_level'),
    [mergeWithCounts],
  )

  // Count active filters
  const totalActiveFilters = useMemo(() => {
    return Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0)
  }, [selectedFilters])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    const filterTypes: FilterType[] = ['status', 'type', 'date_range', 'sensitivity_level']
    filterTypes.forEach((type) => onFilterChange(type, []))
  }, [onFilterChange])

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="region"
      aria-label={t('filters.a11y.adaptiveFilters')}
    >
      {/* Header with Clear All */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{t('filters.adaptive.title')}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {totalActiveFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs h-7 px-2">
            {t('filters.adaptive.clearAll')}
          </Button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-1">
        {/* Status Filter */}
        <FilterSection
          type="status"
          title={t('filters.adaptive.status')}
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
          options={statusOptions}
          selectedValues={selectedFilters.status || []}
          onChange={(values) => onFilterChange('status', values)}
          isLoading={isLoading}
          isRTL={isRTL}
        />

        {/* Type Filter */}
        <FilterSection
          type="type"
          title={t('filters.adaptive.type')}
          icon={<Tag className="h-4 w-4 text-muted-foreground" />}
          options={typeOptions}
          selectedValues={selectedFilters.type || []}
          onChange={(values) => onFilterChange('type', values)}
          isLoading={isLoading}
          isRTL={isRTL}
        />

        {/* Date Range Filter */}
        <FilterSection
          type="date_range"
          title={t('filters.adaptive.dateRange')}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          options={dateRangeOptions}
          selectedValues={selectedFilters.date_range || []}
          onChange={(values) => onFilterChange('date_range', values)}
          isLoading={isLoading}
          isRTL={isRTL}
        />

        {/* Sensitivity Filter */}
        <FilterSection
          type="sensitivity_level"
          title={t('filters.adaptive.sensitivity')}
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          options={sensitivityOptions}
          selectedValues={selectedFilters.sensitivity_level || []}
          onChange={(values) => onFilterChange('sensitivity_level', values)}
          isLoading={isLoading}
          isRTL={isRTL}
        />
      </div>

      {/* Active Filters Summary */}
      {totalActiveFilters > 0 && (
        <div className="px-3 py-2 bg-muted/50 rounded-lg mt-2">
          <div className="text-xs text-muted-foreground">
            {t('filters.adaptive.activeCount', { count: totalActiveFilters })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdaptiveFilters
