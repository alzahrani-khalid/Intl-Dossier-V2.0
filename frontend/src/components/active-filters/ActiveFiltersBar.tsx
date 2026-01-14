/**
 * ActiveFiltersBar Component v1.0
 * Feature: Active Filters Display
 *
 * A persistent chip bar showing all active filters with:
 * - Individual remove buttons on each filter chip
 * - Clear all button when multiple filters are active
 * - Hidden results warning indicator
 * - Mobile-first, RTL-compatible design
 * - 44x44px touch targets for mobile
 */

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, Filter, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Generic filter chip configuration
 */
export interface FilterChipConfig {
  /** Unique key for the filter */
  key: string
  /** Display label for the filter */
  label: string
  /** Value to display (can be translated) */
  value: string
  /** Optional category for grouping (e.g., 'status', 'priority') */
  category?: string
  /** If this is an array filter, the specific value to remove */
  arrayValue?: string
  /** Custom variant for styling */
  variant?: 'default' | 'warning' | 'info' | 'success'
  /** Custom icon to show */
  icon?: React.ReactNode
}

export interface ActiveFiltersBarProps {
  /** Array of active filter chips to display */
  filters: FilterChipConfig[]
  /** Callback when a filter is removed */
  onRemoveFilter: (key: string, arrayValue?: string) => void
  /** Callback when all filters are cleared */
  onClearAll: () => void
  /** Total number of results in the list */
  totalResults?: number
  /** Estimated total without filters (for hidden results indicator) */
  unfilteredTotal?: number
  /** Whether to show the hidden results warning */
  showHiddenResultsWarning?: boolean
  /** Custom message for hidden results warning */
  hiddenResultsMessage?: string
  /** Whether the filters bar should be sticky */
  sticky?: boolean
  /** Additional CSS classes */
  className?: string
  /** Collapsed state (for mobile) */
  collapsed?: boolean
  /** Toggle collapsed state */
  onToggleCollapsed?: () => void
}

/**
 * Individual filter chip component
 */
function FilterChip({ filter, onRemove }: { filter: FilterChipConfig; onRemove: () => void }) {
  const variantStyles = {
    default: 'bg-secondary text-secondary-foreground',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  }

  const hoverStyles = {
    default: 'hover:bg-muted',
    warning: 'hover:bg-amber-200 dark:hover:bg-amber-800',
    info: 'hover:bg-blue-200 dark:hover:bg-blue-800',
    success: 'hover:bg-green-200 dark:hover:bg-green-800',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
    >
      <Badge
        variant="none"
        className={cn(
          'flex items-center gap-1.5 pe-1 py-1 text-xs sm:text-sm',
          'transition-colors duration-150',
          variantStyles[filter.variant || 'default'],
        )}
      >
        {filter.icon && <span className="flex-shrink-0">{filter.icon}</span>}
        <span className="flex items-center gap-1">
          {filter.category && <span className="font-medium opacity-70">{filter.category}:</span>}
          <span className="font-medium">{filter.value}</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ms-1 rounded-full p-0.5',
            'min-w-6 min-h-6 sm:min-w-7 sm:min-h-7',
            'flex items-center justify-center',
            'transition-colors duration-150',
            hoverStyles[filter.variant || 'default'],
          )}
          aria-label={`Remove ${filter.label} filter`}
        >
          <X className="size-3 sm:size-3.5" />
        </button>
      </Badge>
    </motion.div>
  )
}

/**
 * Hidden results warning component
 */
function HiddenResultsWarning({
  totalResults,
  unfilteredTotal,
  customMessage,
  isRTL,
}: {
  totalResults: number
  unfilteredTotal: number
  customMessage?: string
  isRTL: boolean
}) {
  const { t } = useTranslation('active-filters')
  const hiddenCount = unfilteredTotal - totalResults

  if (hiddenCount <= 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2',
        'bg-amber-50 dark:bg-amber-950/50',
        'border border-amber-200 dark:border-amber-800',
        'rounded-lg',
        'text-xs sm:text-sm text-amber-700 dark:text-amber-300',
      )}
    >
      <AlertTriangle className={cn('size-4 flex-shrink-0', isRTL ? 'ms-1' : 'me-1')} />
      <span>
        {customMessage ||
          t('hiddenResults', {
            count: hiddenCount,
            total: unfilteredTotal,
          })}
      </span>
    </motion.div>
  )
}

/**
 * Main ActiveFiltersBar component
 */
export function ActiveFiltersBar({
  filters,
  onRemoveFilter,
  onClearAll,
  totalResults,
  unfilteredTotal,
  showHiddenResultsWarning = true,
  hiddenResultsMessage,
  sticky = false,
  className,
  collapsed = false,
  onToggleCollapsed,
}: ActiveFiltersBarProps) {
  const { t, i18n } = useTranslation('active-filters')
  const isRTL = i18n.language === 'ar'

  // Don't render if no active filters
  if (filters.length === 0) {
    return null
  }

  const hasHiddenResults =
    showHiddenResultsWarning &&
    totalResults !== undefined &&
    unfilteredTotal !== undefined &&
    unfilteredTotal > totalResults

  return (
    <div
      className={cn('w-full', sticky && 'sticky top-0 z-10', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Main filter bar container */}
      <div
        className={cn(
          'rounded-xl',
          'border border-border/50',
          'bg-background/95 backdrop-blur-sm',
          'shadow-sm',
          'transition-all duration-200',
        )}
      >
        {/* Filter bar header with count and controls */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2">
            <Filter className={cn('size-4 text-muted-foreground', isRTL ? 'ms-1' : 'me-1')} />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('activeFilters', { count: filters.length })}
            </span>
            {hasHiddenResults && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0.5 text-amber-600 border-amber-300"
              >
                <EyeOff className="size-3 me-1" />
                {t('hiddenCount', { count: (unfilteredTotal || 0) - (totalResults || 0) })}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle collapse button (mobile) */}
            {onToggleCollapsed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleCollapsed}
                className="sm:hidden min-h-9 min-w-9 p-0"
                aria-label={collapsed ? t('expand') : t('collapse')}
              >
                {collapsed ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
            )}

            {/* Clear all button */}
            {filters.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className={cn(
                  'min-h-9 px-2 sm:px-3',
                  'text-xs sm:text-sm',
                  'text-muted-foreground hover:text-destructive',
                  'transition-colors duration-150',
                )}
              >
                <X className={cn('size-3.5', isRTL ? 'ms-1' : 'me-1')} />
                {t('clearAll')}
              </Button>
            )}
          </div>
        </div>

        {/* Filter chips container */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence mode="popLayout">
                    {filters.map((filter) => (
                      <FilterChip
                        key={`${filter.key}-${filter.arrayValue || ''}`}
                        filter={filter}
                        onRemove={() => onRemoveFilter(filter.key, filter.arrayValue)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Hidden results warning */}
                {hasHiddenResults && (
                  <div className="mt-3">
                    <HiddenResultsWarning
                      totalResults={totalResults!}
                      unfilteredTotal={unfilteredTotal!}
                      customMessage={hiddenResultsMessage}
                      isRTL={isRTL}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ActiveFiltersBar
