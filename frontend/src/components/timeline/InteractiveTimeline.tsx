/**
 * InteractiveTimeline Component
 *
 * Full-featured interactive timeline view with:
 * - Zoom controls (day/week/month/quarter/year/all)
 * - Event annotations (notes, markers, highlights, milestones)
 * - Filtering by event type, priority, status, date range
 * - Full-text search
 * - Infinite scroll pagination
 * - Mobile-first responsive design
 * - RTL support
 * - Engagement history focus
 */

import { useState, useCallback, useMemo, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { StickyNote, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { UnifiedVerticalTimeline } from './UnifiedVerticalTimeline'
import { TimelineFilters } from './TimelineFilters'
import { TimelineZoomControls, useTimelineZoom } from './TimelineZoomControls'
import { TimelineAnnotationDialog } from './TimelineAnnotationDialog'
import {
  useUnifiedTimeline,
  getDefaultEventTypes,
  getAvailableEventTypes,
} from '@/hooks/useUnifiedTimeline'
// TimelineFilters type imported for potential future use with filter state
import type {
  TimelineZoomLevel,
  TimelineViewMode,
  TimelineAnnotation,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
  InteractiveTimelineState,
  TimelineNavigationAction,
} from '@/types/timeline-annotation.types'

interface InteractiveTimelineProps {
  dossierId: string
  dossierType:
    | 'Country'
    | 'Organization'
    | 'Person'
    | 'Engagement'
    | 'Forum'
    | 'WorkingGroup'
    | 'Topic'
  title?: string
  showFilters?: boolean
  showZoomControls?: boolean
  showAnnotations?: boolean
  initialZoom?: TimelineZoomLevel
  initialViewMode?: TimelineViewMode
  className?: string
}

/**
 * Timeline state reducer
 */
function timelineReducer(
  state: InteractiveTimelineState,
  action: TimelineNavigationAction,
): InteractiveTimelineState {
  switch (action.type) {
    case 'ZOOM_IN': {
      const zoomOrder: TimelineZoomLevel[] = ['day', 'week', 'month', 'quarter', 'year', 'all']
      const currentIndex = zoomOrder.indexOf(state.zoomLevel)
      const newZoom = currentIndex > 0 ? zoomOrder[currentIndex - 1] : undefined
      return {
        ...state,
        zoomLevel: newZoom ?? state.zoomLevel,
      }
    }
    case 'ZOOM_OUT': {
      const zoomOrder: TimelineZoomLevel[] = ['day', 'week', 'month', 'quarter', 'year', 'all']
      const currentIndex = zoomOrder.indexOf(state.zoomLevel)
      const newZoom = currentIndex < zoomOrder.length - 1 ? zoomOrder[currentIndex + 1] : undefined
      return {
        ...state,
        zoomLevel: newZoom ?? state.zoomLevel,
      }
    }
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.level }
    case 'GO_TO_DATE':
      return { ...state, focusedDate: action.date }
    case 'GO_TO_TODAY':
      return { ...state, focusedDate: new Date() }
    case 'SCROLL_BACKWARD': {
      const newStart = new Date(state.visibleDateRange.start)
      const diff = state.visibleDateRange.end.getTime() - state.visibleDateRange.start.getTime()
      newStart.setTime(newStart.getTime() - diff)
      return {
        ...state,
        visibleDateRange: {
          start: newStart,
          end: new Date(state.visibleDateRange.start),
        },
      }
    }
    case 'SCROLL_FORWARD': {
      const newEnd = new Date(state.visibleDateRange.end)
      const diff = state.visibleDateRange.end.getTime() - state.visibleDateRange.start.getTime()
      newEnd.setTime(newEnd.getTime() + diff)
      return {
        ...state,
        visibleDateRange: {
          start: new Date(state.visibleDateRange.end),
          end: newEnd,
        },
      }
    }
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.eventId }
    case 'TOGGLE_ANNOTATIONS':
      return { ...state, showAnnotations: !state.showAnnotations }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode }
    default:
      return state
  }
}

/**
 * Get initial date range based on zoom level
 */
function getInitialDateRange(zoomLevel: TimelineZoomLevel): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)

  switch (zoomLevel) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(start.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(start.getFullYear() - 10)
      break
  }

  return { start, end }
}

/**
 * Format date for display based on zoom level
 */
function formatDateLabel(date: Date, zoomLevel: TimelineZoomLevel, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {}

  switch (zoomLevel) {
    case 'day':
      options.weekday = 'long'
      options.day = 'numeric'
      options.month = 'short'
      options.year = 'numeric'
      break
    case 'week':
      options.day = 'numeric'
      options.month = 'short'
      options.year = 'numeric'
      break
    case 'month':
      options.month = 'long'
      options.year = 'numeric'
      break
    case 'quarter':
    case 'year':
      options.year = 'numeric'
      break
    case 'all':
      return locale === 'ar' ? 'كل الوقت' : 'All Time'
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(date)
}

export function InteractiveTimeline({
  dossierId,
  dossierType,
  title,
  showFilters = true,
  showZoomControls = true,
  showAnnotations = true,
  initialZoom = 'month',
  initialViewMode = 'vertical',
  className,
}: InteractiveTimelineProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Timeline state
  const [state, dispatch] = useReducer(timelineReducer, {
    zoomLevel: initialZoom,
    viewMode: initialViewMode,
    showAnnotations: showAnnotations,
    selectedEventId: null,
    focusedDate: null,
    visibleDateRange: getInitialDateRange(initialZoom),
  })

  // Filter visibility
  const [filtersVisible, setFiltersVisible] = useState(false)

  // Annotation dialog state
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false)
  const [selectedEventForAnnotation] = useState<string | null>(null)
  const [editingAnnotation] = useState<TimelineAnnotation | null>(null)

  // Zoom utilities
  const { canZoomIn, canZoomOut } = useTimelineZoom(initialZoom)

  // Calculate date filters based on zoom level
  const dateFilters = useMemo(() => {
    if (state.zoomLevel === 'all') {
      return {}
    }
    return {
      date_from: state.visibleDateRange.start.toISOString(),
      date_to: state.visibleDateRange.end.toISOString(),
    }
  }, [state.zoomLevel, state.visibleDateRange])

  // Fetch timeline data
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
  } = useUnifiedTimeline({
    dossierId,
    dossierType,
    initialFilters: {
      event_types: getDefaultEventTypes(dossierType),
      ...dateFilters,
    },
    itemsPerPage: 20,
    enableRealtime: false,
  })

  // Event type configurations
  const availableEventTypes = getAvailableEventTypes(dossierType)
  const defaultEventTypes = getDefaultEventTypes(dossierType)

  // Handle zoom changes
  const handleZoomChange = useCallback(
    (level: TimelineZoomLevel) => {
      dispatch({ type: 'SET_ZOOM', level })
      const newRange = getInitialDateRange(level)
      setFilters({
        ...filters,
        date_from: level === 'all' ? undefined : newRange.start.toISOString(),
        date_to: level === 'all' ? undefined : newRange.end.toISOString(),
      })
    },
    [filters, setFilters],
  )

  // Handle annotation submit (placeholder for when annotation API is integrated)
  const handleAnnotationSubmit = useCallback(
    (_data: CreateAnnotationRequest | UpdateAnnotationRequest) => {
      // TODO: Integrate with annotation API when available
      setAnnotationDialogOpen(false)
    },
    [],
  )

  // Current date label
  const currentDateLabel = formatDateLabel(
    state.focusedDate || new Date(),
    state.zoomLevel,
    i18n.language,
  )

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {title && <h2 className="text-xl sm:text-2xl font-semibold text-start">{title}</h2>}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          {showAnnotations && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={state.showAnnotations ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => dispatch({ type: 'TOGGLE_ANNOTATIONS' })}
                    className="min-h-10 min-w-10"
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('timeline.annotations.toggle')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  className="min-h-10 min-w-10"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.refresh')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Zoom Controls */}
      {showZoomControls && (
        <TimelineZoomControls
          currentZoom={state.zoomLevel}
          onZoomChange={handleZoomChange}
          onZoomIn={() => dispatch({ type: 'ZOOM_IN' })}
          onZoomOut={() => dispatch({ type: 'ZOOM_OUT' })}
          onGoToToday={() => dispatch({ type: 'GO_TO_TODAY' })}
          onScrollBackward={() => dispatch({ type: 'SCROLL_BACKWARD' })}
          onScrollForward={() => dispatch({ type: 'SCROLL_FORWARD' })}
          canZoomIn={canZoomIn(state.zoomLevel)}
          canZoomOut={canZoomOut(state.zoomLevel)}
          canScrollBackward={true}
          canScrollForward={state.visibleDateRange.end < new Date()}
          currentDateLabel={currentDateLabel}
        />
      )}

      {/* Filters */}
      {showFilters && (
        <TimelineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableEventTypes={availableEventTypes}
          defaultEventTypes={defaultEventTypes}
          showFilters={filtersVisible}
          onToggleFilters={() => setFiltersVisible(!filtersVisible)}
          onRefresh={() => refetch()}
        />
      )}

      {/* Timeline Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <UnifiedVerticalTimeline
          events={events}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
          error={error}
          emptyMessage={t(`timeline.empty.${dossierType.toLowerCase()}`)}
        />
      </motion.div>

      {/* Annotation Dialog */}
      <TimelineAnnotationDialog
        open={annotationDialogOpen}
        onOpenChange={setAnnotationDialogOpen}
        onSubmit={handleAnnotationSubmit}
        annotation={editingAnnotation || undefined}
        eventId={selectedEventForAnnotation || undefined}
      />
    </div>
  )
}

/**
 * Compact timeline view for embedding in other components
 */
export function CompactInteractiveTimeline({
  dossierId,
  dossierType,
  maxEvents = 5,
  className,
}: {
  dossierId: string
  dossierType:
    | 'Country'
    | 'Organization'
    | 'Person'
    | 'Engagement'
    | 'Forum'
    | 'WorkingGroup'
    | 'Topic'
  maxEvents?: number
  className?: string
}) {
  const { events, isLoading, error } = useUnifiedTimeline({
    dossierId,
    dossierType,
    initialFilters: {
      event_types: getDefaultEventTypes(dossierType),
    },
    itemsPerPage: maxEvents,
  })

  return (
    <div className={cn('space-y-2', className)}>
      <UnifiedVerticalTimeline
        events={events.slice(0, maxEvents)}
        isLoading={isLoading}
        hasNextPage={false}
        error={error}
      />
    </div>
  )
}
