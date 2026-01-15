/**
 * StakeholderInteractionTimeline Component
 *
 * Aggregates all interactions with a stakeholder (emails, meetings,
 * document exchanges, comments) into a unified chronological timeline.
 *
 * Features:
 * - Infinite scroll pagination
 * - Full-text search
 * - Type, date, sentiment filtering
 * - Annotation support for key moments
 * - Statistics overview
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  Calendar,
  X,
  TrendingUp,
  MessageSquare,
  Clock,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  useStakeholderTimeline,
  useStakeholderInteractionMutations,
  getAvailableInteractionTypes,
} from '@/hooks/useStakeholderTimeline'
import { StakeholderTimelineFilters } from './StakeholderTimelineFilters'
import { StakeholderTimelineCard } from './StakeholderTimelineCard'
import { StakeholderInteractionDialog } from './StakeholderInteractionDialog'
import { StakeholderAnnotationDialog } from './StakeholderAnnotationDialog'
import type {
  StakeholderInteractionTimelineProps,
  StakeholderTimelineFilters as IFilters,
  StakeholderTimelineEvent,
  CreateInteractionRequest,
  CreateAnnotationRequest,
} from '@/types/stakeholder-interaction.types'

/**
 * Loading skeleton for timeline
 */
function TimelineLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-11 w-11 rounded-full" />
            {index < count - 1 && <Skeleton className="h-20 w-0.5 mt-2" />}
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state component
 */
function TimelineEmptyState({ message }: { message: string }) {
  const { t } = useTranslation('stakeholder-interactions')
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="rounded-full bg-muted p-6 sm:p-8 mb-4 sm:mb-6">
        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('empty.title')}</h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md">
        {message || t('empty.description')}
      </p>
    </div>
  )
}

/**
 * Error state component
 */
function TimelineErrorState({ error }: { error: Error }) {
  const { t } = useTranslation('stakeholder-interactions')
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTitle>{t('error.title')}</AlertTitle>
      <AlertDescription className="text-start">
        {error.message || t('error.description')}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Stats overview card
 */
function StatsOverviewCard({
  stats,
  isLoading,
  className,
}: {
  stats: {
    total_interactions: number
    key_moments_count: number
    last_interaction_date: string | null
    most_common_type: string | null
    avg_sentiment: number
  } | null
  isLoading: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      label: t('stats.total_interactions'),
      value: stats.total_interactions,
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      label: t('stats.key_moments'),
      value: stats.key_moments_count,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: t('stats.most_common'),
      value: stats.most_common_type ? t(`types.${stats.most_common_type}`) : '-',
      icon: MessageSquare,
      color: 'text-purple-500',
    },
    {
      label: t('stats.last_interaction'),
      value: stats.last_interaction_date
        ? new Date(stats.last_interaction_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')
        : '-',
      icon: Clock,
      color: 'text-orange-500',
    },
  ]

  return (
    <Card className={cn('mb-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-start">{t('stats.title')}</CardTitle>
        <CardDescription className="text-start">{t('stats.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center sm:items-start gap-1 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', item.color)} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main StakeholderInteractionTimeline component
 */
export function StakeholderInteractionTimeline({
  stakeholderType,
  stakeholderId,
  stakeholderName,
  initialFilters = {},
  showFilters = true,
  showSearch = true,
  showStats = true,
  showAnnotations = true,
  allowNewInteractions = true,
  itemsPerPage = 20,
  className,
}: StakeholderInteractionTimelineProps) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'

  // State
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialFilters.search_query || '')
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false)
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false)
  const [selectedEventForAnnotation, setSelectedEventForAnnotation] =
    useState<StakeholderTimelineEvent | null>(null)

  // Hooks
  const {
    events,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
    filters,
    setFilters,
    stats,
    isLoadingStats,
  } = useStakeholderTimeline({
    stakeholderType,
    stakeholderId,
    initialFilters,
    itemsPerPage,
    enableStats: showStats,
  })

  const { createInteraction, isCreating, createAnnotation, isAnnotating } =
    useStakeholderInteractionMutations(stakeholderType, stakeholderId)

  // Handlers
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setFilters({ ...filters, search_query: query || undefined })
    },
    [filters, setFilters],
  )

  const handleFiltersChange = useCallback(
    (newFilters: IFilters) => {
      setFilters(newFilters)
    },
    [setFilters],
  )

  const handleCreateInteraction = useCallback(
    async (data: CreateInteractionRequest) => {
      await createInteraction({
        ...data,
        stakeholder_type: stakeholderType,
        stakeholder_id: stakeholderId,
      })
      setIsInteractionDialogOpen(false)
    },
    [createInteraction, stakeholderType, stakeholderId],
  )

  const handleAnnotate = useCallback((event: StakeholderTimelineEvent) => {
    setSelectedEventForAnnotation(event)
    setIsAnnotationDialogOpen(true)
  }, [])

  const handleCreateAnnotation = useCallback(
    async (data: CreateAnnotationRequest) => {
      await createAnnotation(data)
      setIsAnnotationDialogOpen(false)
      setSelectedEventForAnnotation(null)
    },
    [createAnnotation],
  )

  // Count active filters
  const activeFiltersCount =
    (filters.event_types?.length || 0) +
    (filters.date_from ? 1 : 0) +
    (filters.date_to ? 1 : 0) +
    (filters.sentiment ? 1 : 0) +
    (filters.direction ? 1 : 0)

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-start">
            {t('title')}
            {stakeholderName && (
              <span className="text-muted-foreground font-normal ms-2">- {stakeholderName}</span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground text-start mt-1">{t('subtitle')}</p>
        </div>
        {allowNewInteractions && (
          <Button onClick={() => setIsInteractionDialogOpen(true)} className="min-h-11 sm:min-h-10">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('add_interaction')}
          </Button>
        )}
      </div>

      {/* Stats overview */}
      {showStats && <StatsOverviewCard stats={stats} isLoading={isLoadingStats} />}

      {/* Search and filter bar */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
          {showSearch && (
            <div className="relative flex-1">
              <Search
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  isRTL ? 'end-3' : 'start-3',
                )}
              />
              <Input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={cn('min-h-11 sm:min-h-10', isRTL ? 'pe-9' : 'ps-9')}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0',
                    isRTL ? 'start-1' : 'end-1',
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="min-h-11 sm:min-h-10 justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              {showFiltersPanel ? (
                <ChevronUp className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
              ) : (
                <ChevronDown className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Filters panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <StakeholderTimelineFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              availableEventTypes={getAvailableInteractionTypes(stakeholderType)}
              className="mb-6"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && <TimelineErrorState error={error} />}

      {/* Loading state */}
      {isLoading && <TimelineLoadingSkeleton count={5} />}

      {/* Empty state */}
      {!isLoading && !error && events.length === 0 && (
        <TimelineEmptyState message={t('empty.description')} />
      )}

      {/* Timeline events */}
      {!isLoading && !error && events.length > 0 && (
        <motion.div
          className="space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {events.map((event, index) => (
            <StakeholderTimelineCard
              key={event.id}
              event={event}
              isFirst={index === 0}
              isLast={index === events.length - 1 && !hasNextPage}
              onAnnotate={showAnnotations ? () => handleAnnotate(event) : undefined}
              showAnnotations={showAnnotations}
            />
          ))}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center py-6 sm:py-8">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('loading_more')}</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  className="min-h-11 sm:min-h-10"
                >
                  {t('load_more')}
                </Button>
              )}
            </div>
          )}

          {/* End of timeline */}
          {!hasNextPage && events.length > 0 && (
            <div className="flex justify-center py-6 sm:py-8">
              <p className="text-sm text-muted-foreground">{t('end_of_timeline')}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Create interaction dialog */}
      <StakeholderInteractionDialog
        open={isInteractionDialogOpen}
        onOpenChange={setIsInteractionDialogOpen}
        onSubmit={handleCreateInteraction}
        stakeholderType={stakeholderType}
        stakeholderId={stakeholderId}
        isLoading={isCreating}
      />

      {/* Annotation dialog */}
      <StakeholderAnnotationDialog
        open={isAnnotationDialogOpen}
        onOpenChange={setIsAnnotationDialogOpen}
        onSubmit={handleCreateAnnotation}
        event={selectedEventForAnnotation}
        isLoading={isAnnotating}
      />
    </div>
  )
}
