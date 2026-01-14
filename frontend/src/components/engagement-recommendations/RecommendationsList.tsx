/**
 * RecommendationsList Component
 * Feature: predictive-engagement-recommendations
 *
 * Displays a list of engagement recommendations with filtering and pagination.
 * Mobile-first, RTL-compatible design.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, RefreshCw, ChevronDown, Loader2, Inbox, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RecommendationCard } from './RecommendationCard'
import {
  useEngagementRecommendations,
  useAcceptRecommendation,
  useDismissRecommendation,
  useGenerateRecommendations,
} from '@/hooks/useEngagementRecommendations'
import type {
  RecommendationType,
  RecommendationUrgency,
  RecommendationListParams,
} from '@/types/engagement-recommendation.types'
import { RECOMMENDATION_TYPE_LABELS, URGENCY_LABELS } from '@/types/engagement-recommendation.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface RecommendationsListProps {
  relationshipId?: string
  dossierId?: string
  defaultFilters?: RecommendationListParams
  showFilters?: boolean
  showGenerateButton?: boolean
  maxHeight?: string
  onViewDetails?: (id: string) => void
  className?: string
}

// ============================================================================
// Filter Options
// ============================================================================

const typeOptions: RecommendationType[] = [
  'proactive_outreach',
  'follow_up',
  'commitment_reminder',
  'relationship_maintenance',
  'strategic_opportunity',
  'risk_mitigation',
  'reciprocity_balance',
]

const urgencyOptions: RecommendationUrgency[] = ['critical', 'high', 'normal', 'low']

// ============================================================================
// Loading Skeleton
// ============================================================================

function RecommendationSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ message }: { message: string }) {
  const { t } = useTranslation('engagement-recommendations')

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t('noRecommendations')}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {message || t('noRecommendationsDescription')}
      </p>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RecommendationsList({
  relationshipId,
  dossierId,
  defaultFilters = {},
  showFilters = true,
  showGenerateButton = false,
  maxHeight,
  onViewDetails,
  className,
}: RecommendationsListProps) {
  const { t, i18n } = useTranslation('engagement-recommendations')
  const isRTL = i18n.language === 'ar'

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<RecommendationType[]>([])
  const [selectedUrgencies, setSelectedUrgencies] = useState<RecommendationUrgency[]>([])

  // Build query params
  const queryParams: RecommendationListParams = useMemo(
    () => ({
      ...defaultFilters,
      relationship_id: relationshipId,
      target_dossier_id: dossierId,
      status: ['pending', 'viewed'],
      recommendation_type: selectedTypes.length > 0 ? selectedTypes : undefined,
      urgency: selectedUrgencies.length > 0 ? selectedUrgencies : undefined,
      sort_by: 'priority',
      sort_order: 'desc',
      limit: 20,
    }),
    [relationshipId, dossierId, selectedTypes, selectedUrgencies, defaultFilters],
  )

  // Queries and mutations
  const { data, isLoading, isError, error, refetch, isFetching } =
    useEngagementRecommendations(queryParams)

  const acceptMutation = useAcceptRecommendation()
  const dismissMutation = useDismissRecommendation()
  const generateMutation = useGenerateRecommendations()

  // Handlers
  const handleAccept = (id: string) => {
    acceptMutation.mutate(id)
  }

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id)
  }

  const handleGenerate = () => {
    generateMutation.mutate({
      relationship_ids: relationshipId ? [relationshipId] : undefined,
    })
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleTypeToggle = (type: RecommendationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleUrgencyToggle = (urgency: RecommendationUrgency) => {
    setSelectedUrgencies((prev) =>
      prev.includes(urgency) ? prev.filter((u) => u !== urgency) : [...prev, urgency],
    )
  }

  const recommendations = data?.data || []
  const hasActiveFilters = selectedTypes.length > 0 || selectedUrgencies.length > 0

  return (
    <div className={cn('flex flex-col gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Filters */}
      {(showFilters || showGenerateButton) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">{t('title')}</h2>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {showFilters && (
              <>
                {/* Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'min-h-9 gap-1.5',
                        selectedTypes.length > 0 && 'border-primary',
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('filterByType')}</span>
                      {selectedTypes.length > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                          {selectedTypes.length}
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                    <DropdownMenuLabel>{t('recommendationType')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {typeOptions.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => handleTypeToggle(type)}
                      >
                        {isRTL
                          ? RECOMMENDATION_TYPE_LABELS[type].ar
                          : RECOMMENDATION_TYPE_LABELS[type].en}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Urgency Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'min-h-9 gap-1.5',
                        selectedUrgencies.length > 0 && 'border-primary',
                      )}
                    >
                      <span className="hidden sm:inline">{t('filterByUrgency')}</span>
                      <span className="sm:hidden">{t('urgency')}</span>
                      {selectedUrgencies.length > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                          {selectedUrgencies.length}
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuLabel>{t('urgencyLevel')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {urgencyOptions.map((urgency) => (
                      <DropdownMenuCheckboxItem
                        key={urgency}
                        checked={selectedUrgencies.includes(urgency)}
                        onCheckedChange={() => handleUrgencyToggle(urgency)}
                      >
                        {isRTL ? URGENCY_LABELS[urgency].ar : URGENCY_LABELS[urgency].en}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="min-h-9 min-w-9"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>

            {/* Generate Button */}
            {showGenerateButton && (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="min-h-9 gap-1.5"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t('generate')}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('activeFilters', { count: selectedTypes.length + selectedUrgencies.length })}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedTypes([])
              setSelectedUrgencies([])
            }}
            className="h-auto p-0 text-sm"
          >
            {t('clearFilters')}
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className={maxHeight ? `max-h-[${maxHeight}]` : undefined}>
        <div className="space-y-3 pe-4">
          {/* Loading State */}
          {isLoading && (
            <>
              <RecommendationSkeleton />
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">
                {(error as Error)?.message || t('errorLoading')}
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                {t('retry')}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && recommendations.length === 0 && (
            <EmptyState
              message={
                hasActiveFilters
                  ? t('noMatchingRecommendations')
                  : t('noRecommendationsDescription')
              }
            />
          )}

          {/* Recommendations List */}
          <AnimatePresence mode="popLayout">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onView={onViewDetails}
                isLoading={acceptMutation.isPending || dismissMutation.isPending}
              />
            ))}
          </AnimatePresence>

          {/* Load More */}
          {data?.pagination.has_more && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                {t('loadMore')}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default RecommendationsList
