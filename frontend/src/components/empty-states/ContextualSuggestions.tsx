/**
 * Contextual Suggestions Component
 * Feature: intelligent-empty-states
 *
 * Displays contextually relevant suggestions in empty states based on
 * current date, upcoming events, and organizational calendar.
 *
 * Mobile-first, RTL-compatible component following project guidelines.
 */

import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Target,
  Sparkles,
  ChevronRight,
  CalendarDays,
  FileWarning,
  Timer,
  Star,
  Rocket,
  LucideIcon,
} from 'lucide-react'
import { useContextualSuggestions, hasUrgentSuggestions } from '@/hooks/useContextualSuggestions'
import type {
  ContextualSuggestion,
  SuggestionCategory,
  SuggestionContext,
} from '@/types/contextual-suggestion.types'

// ============================================================================
// Types
// ============================================================================

export type ContextualSuggestionsVariant = 'default' | 'compact' | 'card' | 'inline'
export type ContextualSuggestionsSize = 'sm' | 'md' | 'lg'

export interface ContextualSuggestionsProps {
  /** Page context for filtering suggestions */
  context?: SuggestionContext
  /** Maximum number of suggestions to show */
  limit?: number
  /** Visual variant */
  variant?: ContextualSuggestionsVariant
  /** Size variant */
  size?: ContextualSuggestionsSize
  /** Show loading skeleton while fetching */
  showSkeleton?: boolean
  /** Additional CSS classes */
  className?: string
  /** Show section title */
  showTitle?: boolean
  /** Entity context (for entity-specific suggestions) */
  entityType?: string
  entityId?: string
  /** Test ID for automated testing */
  testId?: string
}

// ============================================================================
// Icon Mapping
// ============================================================================

const categoryIcons: Record<SuggestionCategory, LucideIcon> = {
  upcoming_event: CalendarDays,
  expiring_mou: FileWarning,
  overdue_commitment: AlertCircle,
  pending_task: Timer,
  seasonal: Calendar,
  anniversary: Star,
  quick_action: Rocket,
}

const badgeVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  default: 'secondary',
  warning: 'outline',
  danger: 'destructive',
  success: 'default',
}

// ============================================================================
// Size Classes
// ============================================================================

const sizeClasses = {
  sm: {
    container: 'gap-2 p-3 sm:p-4',
    title: 'text-xs sm:text-sm font-medium',
    description: 'text-xs',
    icon: 'w-4 h-4',
    badge: 'text-[10px] px-1.5 py-0',
    button: 'h-8 text-xs px-2',
    card: 'p-2 sm:p-3',
  },
  md: {
    container: 'gap-3 p-4 sm:p-5',
    title: 'text-sm sm:text-base font-medium',
    description: 'text-xs sm:text-sm',
    icon: 'w-5 h-5',
    badge: 'text-xs px-2 py-0.5',
    button: 'h-9 text-sm px-3',
    card: 'p-3 sm:p-4',
  },
  lg: {
    container: 'gap-4 p-5 sm:p-6',
    title: 'text-base sm:text-lg font-medium',
    description: 'text-sm sm:text-base',
    icon: 'w-6 h-6',
    badge: 'text-sm px-2.5 py-1',
    button: 'h-10 text-sm px-4',
    card: 'p-4 sm:p-5',
  },
}

// ============================================================================
// Suggestion Item Component
// ============================================================================

interface SuggestionItemProps {
  suggestion: ContextualSuggestion
  size: ContextualSuggestionsSize
  variant: ContextualSuggestionsVariant
  isRTL: boolean
}

function SuggestionItem({ suggestion, size, variant, isRTL }: SuggestionItemProps) {
  const { i18n } = useTranslation()
  const sizes = sizeClasses[size]
  const Icon = categoryIcons[suggestion.category] || Sparkles

  const title = isRTL ? suggestion.title_ar : suggestion.title_en
  const description = isRTL ? suggestion.description_ar : suggestion.description_en
  const actionLabel = isRTL ? suggestion.action_label_ar : suggestion.action_label_en
  const badgeText = suggestion.badge_text_en
    ? isRTL
      ? suggestion.badge_text_ar
      : suggestion.badge_text_en
    : null

  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-full',
          suggestion.priority === 'high'
            ? 'bg-destructive/10 text-destructive'
            : suggestion.priority === 'medium'
              ? 'bg-warning/10 text-warning'
              : 'bg-muted text-muted-foreground',
          size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12',
        )}
      >
        <Icon className={sizes.icon} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-foreground truncate', sizes.title)}>{title}</span>
          {badgeText && (
            <Badge
              variant={badgeVariantMap[suggestion.badge_variant || 'default']}
              className={sizes.badge}
            >
              {badgeText}
            </Badge>
          )}
        </div>
        <p className={cn('text-muted-foreground line-clamp-2', sizes.description)}>{description}</p>
        {suggestion.days_until_event !== undefined && suggestion.days_until_event >= 0 && (
          <p
            className={cn(
              'text-muted-foreground/70 flex items-center gap-1 mt-1',
              sizes.description,
            )}
          >
            <Clock className="w-3 h-3" />
            <span>
              {suggestion.days_until_event === 0
                ? isRTL
                  ? 'اليوم'
                  : 'Today'
                : suggestion.days_until_event === 1
                  ? isRTL
                    ? 'غداً'
                    : 'Tomorrow'
                  : isRTL
                    ? `في ${suggestion.days_until_event} أيام`
                    : `In ${suggestion.days_until_event} days`}
            </span>
          </p>
        )}
      </div>

      {/* Action */}
      {suggestion.action_route && variant !== 'compact' && (
        <div className="flex-shrink-0">
          <Button variant="ghost" size="sm" className={cn('min-h-9 min-w-9', sizes.button)} asChild>
            <Link to={suggestion.action_route} search={suggestion.action_params}>
              <span className="hidden sm:inline me-1">{actionLabel}</span>
              <ChevronRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            </Link>
          </Button>
        </div>
      )}
    </>
  )

  if (variant === 'card') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className={cn('flex items-start gap-3', sizes.card)}>{content}</CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return suggestion.action_route ? (
      <Link
        to={suggestion.action_route}
        search={suggestion.action_params}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Icon className={cn(sizes.icon, 'text-muted-foreground')} />
        <span className={cn('text-foreground truncate flex-1', sizes.title)}>{title}</span>
        {badgeText && (
          <Badge
            variant={badgeVariantMap[suggestion.badge_variant || 'default']}
            className={sizes.badge}
          >
            {badgeText}
          </Badge>
        )}
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground', isRTL && 'rotate-180')} />
      </Link>
    ) : (
      <div className="flex items-center gap-2 p-2">
        <Icon className={cn(sizes.icon, 'text-muted-foreground')} />
        <span className={cn('text-foreground truncate flex-1', sizes.title)}>{title}</span>
      </div>
    )
  }

  // Default and inline
  return (
    <div
      className={cn(
        'flex items-start gap-3',
        variant === 'inline' && 'py-2 border-b border-border last:border-0',
      )}
    >
      {content}
    </div>
  )
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SuggestionSkeleton({
  size,
  count = 3,
}: {
  size: ContextualSuggestionsSize
  count?: number
}) {
  const sizes = sizeClasses[size]

  return (
    <div className={cn('space-y-3', sizes.container)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton
            className={cn(
              'rounded-full flex-shrink-0',
              size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12',
            )}
          />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Displays contextually relevant suggestions in empty states.
 *
 * @example
 * // In a dashboard empty state
 * <ContextualSuggestions context="dashboard" limit={5} />
 *
 * @example
 * // In an engagement list empty state
 * <ContextualSuggestions
 *   context="engagement"
 *   variant="card"
 *   size="md"
 *   showTitle
 * />
 *
 * @example
 * // Compact inline suggestions
 * <ContextualSuggestions
 *   context="calendar"
 *   variant="compact"
 *   size="sm"
 *   limit={3}
 * />
 */
export function ContextualSuggestions({
  context = 'global',
  limit = 5,
  variant = 'default',
  size = 'md',
  showSkeleton = true,
  className,
  showTitle = false,
  entityType,
  entityId,
  testId = 'contextual-suggestions',
}: ContextualSuggestionsProps) {
  const { t, i18n } = useTranslation('contextual-suggestions')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, isError } = useContextualSuggestions({
    context,
    entity_type: entityType,
    entity_id: entityId,
    limit,
  })

  const sizes = sizeClasses[size]
  const suggestions = data?.suggestions || []
  const hasUrgent = hasUrgentSuggestions(suggestions)

  // Don't render anything if no suggestions and not loading
  if (!isLoading && suggestions.length === 0) {
    return null
  }

  // Loading state
  if (isLoading && showSkeleton) {
    return (
      <div
        className={cn('rounded-lg bg-muted/30', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid={`${testId}-loading`}
      >
        <SuggestionSkeleton size={size} count={Math.min(limit, 3)} />
      </div>
    )
  }

  // Error state - silently return null
  if (isError) {
    return null
  }

  return (
    <div className={cn('rounded-lg', className)} dir={isRTL ? 'rtl' : 'ltr'} data-testid={testId}>
      {/* Title */}
      {showTitle && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Sparkles className={cn(sizes.icon, 'text-primary')} />
          <h3 className={cn('text-foreground', sizes.title)}>{t('title')}</h3>
          {hasUrgent && (
            <Badge variant="destructive" className={sizes.badge}>
              {t('urgentBadge')}
            </Badge>
          )}
        </div>
      )}

      {/* Suggestions List */}
      <div
        className={cn(
          variant === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2 sm:space-y-3',
        )}
      >
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            size={size}
            variant={variant}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Metadata footer */}
      {data?.metadata && variant !== 'compact' && (
        <div
          className={cn(
            'flex items-center justify-between text-muted-foreground/70 mt-3 pt-3 border-t border-border',
            size === 'sm' ? 'text-[10px]' : 'text-xs',
          )}
        >
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {isRTL
              ? `${data.metadata.upcoming_events_count} فعالية قادمة`
              : `${data.metadata.upcoming_events_count} upcoming events`}
          </span>
          {data.metadata.overdue_commitments_count > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              {isRTL
                ? `${data.metadata.overdue_commitments_count} التزام متأخر`
                : `${data.metadata.overdue_commitments_count} overdue`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default ContextualSuggestions
