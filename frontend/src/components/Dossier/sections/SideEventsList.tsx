/**
 * SideEventsList Component
 *
 * Displays list of side events for a forum session with filtering and calendar view.
 * Mobile-first responsive, RTL support.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Filter, ChevronDown, CalendarDays, List, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SideEventCard } from './SideEventCard'
import { useSideEvents, useDeleteSideEvent } from '@/hooks/useSideEvents'
import type {
  SideEventWithStats,
  SideEventType,
  SideEventStatus,
  SideEventFilters,
} from '@/types/forum-extended.types'

interface SideEventsListProps {
  sessionId: string
  onCreateEvent?: () => void
  onEditEvent?: (event: SideEventWithStats) => void
  onViewEvent?: (event: SideEventWithStats) => void
}

export function SideEventsList({
  sessionId,
  onCreateEvent,
  onEditEvent,
  onViewEvent,
}: SideEventsListProps) {
  const { t, i18n } = useTranslation('forum-management')
  const isRTL = i18n.language === 'ar'

  // View and filter state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [filters, setFilters] = useState<Partial<SideEventFilters>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data fetching
  const { data, isLoading, error, refetch } = useSideEvents(sessionId, filters)
  const deleteEvent = useDeleteSideEvent()

  // Filter options
  const eventTypes: SideEventType[] = [
    'bilateral_meeting',
    'multilateral_meeting',
    'reception',
    'exhibition',
    'workshop',
    'press_conference',
    'signing_ceremony',
    'cultural_event',
    'networking',
    'breakfast_meeting',
    'lunch_meeting',
    'dinner_meeting',
    'other',
  ]
  const statuses: SideEventStatus[] = [
    'planned',
    'confirmed',
    'tentative',
    'cancelled',
    'postponed',
    'completed',
  ]

  // Filter events by search query
  const filteredEvents = useMemo(() => {
    if (!data?.data || !searchQuery.trim()) return data?.data || []

    const query = searchQuery.toLowerCase()
    return data.data.filter(
      (event) =>
        event.title_en?.toLowerCase().includes(query) ||
        event.title_ar?.toLowerCase().includes(query) ||
        event.venue_en?.toLowerCase().includes(query) ||
        event.venue_ar?.toLowerCase().includes(query) ||
        event.organizer_name_en?.toLowerCase().includes(query) ||
        event.organizer_name_ar?.toLowerCase().includes(query),
    )
  }, [data?.data, searchQuery])

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    if (!filteredEvents) return {}

    return filteredEvents.reduce<Record<string, SideEventWithStats[]>>((acc, event) => {
      const date = event.scheduled_date
      if (!acc[date]) acc[date] = []
      acc[date].push(event)
      return acc
    }, {})
  }, [filteredEvents])

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Handle delete
  const handleDelete = async (event: SideEventWithStats) => {
    if (
      window.confirm(t('sideEvents.confirmDelete', 'Are you sure you want to delete this event?'))
    ) {
      await deleteEvent.mutateAsync(event.id)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-start">
              {t('sideEvents.title', 'Side Events')}
            </h3>
            <p className="text-sm text-muted-foreground text-start">
              {t('sideEvents.description', 'Manage side events and bilateral meetings')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Toggle */}
            <div className="hidden sm:flex items-center rounded-md border p-0.5">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>

            {/* Create Button */}
            <Button variant="default" size="sm" className="gap-2 min-h-10" onClick={onCreateEvent}>
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              <span className="hidden sm:inline">{t('sideEvents.create', 'Create')}</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search', 'Search...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-10 ps-9 pe-9 rounded-md border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {t('common.filters', 'Filters')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('sideEvents.scheduledDate', 'Date')}
                </label>
                <input
                  type="date"
                  value={filters.date || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, date: e.target.value || undefined }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.type', 'Type')}
                </label>
                <select
                  value={filters.event_type || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      event_type: (e.target.value as SideEventType) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`sideEventTypes.${type}`, type.replace(/_/g, ' '))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.status', 'Status')}
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: (e.target.value as SideEventStatus) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {t(`sideEventStatus.${status}`, status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t('common.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h4 className="text-lg font-medium mb-2 text-destructive">
            {t('common.error', 'Error')}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || t('sideEvents.loadError', 'Failed to load side events')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* List View */}
      {!isLoading && !error && viewMode === 'list' && filteredEvents.length > 0 && (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <SideEventCard
              key={event.id}
              event={event}
              isRTL={isRTL}
              onEdit={onEditEvent}
              onDelete={handleDelete}
              onViewDetails={onViewEvent}
            />
          ))}
        </div>
      )}

      {/* Calendar View */}
      {!isLoading && !error && viewMode === 'calendar' && filteredEvents.length > 0 && (
        <div className="space-y-6">
          {Object.entries(eventsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, events]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground px-3">
                      {new Date(date).toLocaleDateString(i18n.language, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {events.length}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {events.map((event) => (
                    <SideEventCard
                      key={event.id}
                      event={event}
                      isRTL={isRTL}
                      onEdit={onEditEvent}
                      onDelete={handleDelete}
                      onViewDetails={onViewEvent}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredEvents.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">
            {searchQuery || activeFilterCount > 0
              ? t('common.noResults', 'No Results Found')
              : t('sideEvents.empty', 'No Side Events')}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery || activeFilterCount > 0
              ? t('common.adjustFilters', 'Try adjusting your search or filters')
              : t('sideEvents.emptyDescription', 'Create your first side event to get started')}
          </p>

          {searchQuery || activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          ) : (
            <Button variant="default" onClick={onCreateEvent} className="gap-2 min-h-11">
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('sideEvents.create', 'Create Side Event')}
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && data?.data && data.data.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-muted-foreground">
          <span>
            {t('common.total', 'Total')}: {data.data.length} {t('sideEvents.events', 'events')}
          </span>
          {searchQuery && (
            <span>
              {t('common.showing', 'Showing')}: {filteredEvents.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SideEventsList
