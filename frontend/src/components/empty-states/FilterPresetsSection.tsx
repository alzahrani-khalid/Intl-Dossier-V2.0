/**
 * FilterPresetsSection Component
 * Feature: Smart filter presets for no-results scenarios
 * Description: Displays clickable preset filter combinations to help users
 *              find results when their complex filters return empty
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  Shield,
  ClipboardCheck,
  User,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FilterPreset, FilterPresetsSectionProps } from '@/types/enhanced-search.types'

/**
 * Get icon component for a preset based on icon name
 */
function getPresetIcon(iconName: string): React.ElementType {
  const icons: Record<string, React.ElementType> = {
    globe: Globe,
    'alert-triangle': AlertTriangle,
    'file-text': FileText,
    users: Users,
    clock: Clock,
    shield: Shield,
    'clipboard-check': ClipboardCheck,
    user: User,
    sparkles: Sparkles,
    'trending-up': TrendingUp,
  }
  return icons[iconName] || FileText
}

/**
 * Get color classes for a preset based on color theme
 */
function getColorClasses(theme?: string): string {
  const colors: Record<string, string> = {
    default: 'bg-muted/50 hover:bg-muted border-border',
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:border-blue-900',
    green:
      'bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/30 dark:hover:bg-green-950/50 dark:border-green-900',
    amber:
      'bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:border-amber-900',
    red: 'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:border-red-900',
    purple:
      'bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:border-purple-900',
  }
  return colors[theme || 'default'] || colors.default
}

/**
 * Get icon color classes for a preset based on color theme
 */
function getIconColorClasses(theme?: string): string {
  const colors: Record<string, string> = {
    default: 'text-muted-foreground',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }
  return colors[theme || 'default'] || colors.default
}

/**
 * Single filter preset card
 */
function FilterPresetCard({
  preset,
  onApply,
  isRTL,
  language,
}: {
  preset: FilterPreset
  onApply: (preset: FilterPreset) => void
  isRTL: boolean
  language: string
}) {
  const { t } = useTranslation('enhanced-search')
  const Icon = getPresetIcon(preset.icon)

  const name = language === 'ar' ? preset.name_ar : preset.name_en
  const description = language === 'ar' ? preset.description_ar : preset.description_en

  return (
    <button
      onClick={() => onApply(preset)}
      className={cn(
        'relative flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all duration-200',
        'text-start min-h-11 w-full',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'group',
        getColorClasses(preset.color_theme),
      )}
      data-testid={`filter-preset-${preset.id}`}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-md', 'bg-background/50 dark:bg-background/30')}>
        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', getIconColorClasses(preset.color_theme))} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground line-clamp-1">{name}</p>
          {preset.is_popular && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              <TrendingUp className="h-3 w-3 me-1" />
              {language === 'ar' ? 'شائع' : 'Popular'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        {preset.estimated_count !== undefined && preset.estimated_count > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t('filterPresets.resultsExpected', { count: preset.estimated_count })}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <ChevronRight
        className={cn(
          'h-4 w-4 text-muted-foreground flex-shrink-0',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isRTL && 'rotate-180',
        )}
      />
    </button>
  )
}

/**
 * Loading skeleton for preset cards
 */
function FilterPresetsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30 animate-pulse"
        >
          <div className="flex-shrink-0 p-2 rounded-md bg-muted">
            <div className="h-5 w-5 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * FilterPresetsSection Component
 * Displays smart filter presets when search returns no results
 */
export function FilterPresetsSection({
  presets,
  onApplyPreset,
  isLoading = false,
  error,
  maxVisible = 4,
  className,
}: FilterPresetsSectionProps) {
  const { t, i18n } = useTranslation('enhanced-search')
  const isRTL = i18n.language === 'ar'
  const language = i18n.language

  const [showAll, setShowAll] = useState(false)

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('filterPresets.loading')}</span>
        </div>
        <FilterPresetsSkeleton />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {t('filterPresets.error')}
      </div>
    )
  }

  // No presets available
  if (!presets || presets.length === 0) {
    return null
  }

  const visiblePresets = showAll ? presets : presets.slice(0, maxVisible)
  const hasMore = presets.length > maxVisible

  return (
    <div
      className={cn('space-y-3', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="filter-presets-section"
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>{t('filterPresets.title')}</span>
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visiblePresets.map((preset) => (
          <FilterPresetCard
            key={preset.id}
            preset={preset}
            onApply={onApplyPreset}
            isRTL={isRTL}
            language={language}
          />
        ))}
      </div>

      {/* Show more/less toggle */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground min-h-9"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 me-1" />
                {t('filterPresets.showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 me-1" />
                {t('filterPresets.showMore')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default FilterPresetsSection
