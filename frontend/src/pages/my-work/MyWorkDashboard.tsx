/**
 * Feature 032: Unified Work Management Dashboard
 * Mobile-first, RTL-compatible design
 */
import { useTranslation } from 'react-i18next'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useMyWorkDashboard, useTeamWorkload } from '@/hooks/useUnifiedWork'
import { useUnifiedWorkRealtime, useCurrentUserId } from '@/hooks/useUnifiedWorkRealtime'
import type {
  WorkItemFilters,
  WorkSource,
  TrackingType,
  WorkItemSortBy,
  SortOrder,
} from '@/types/unified-work.types'

// Components
import { Button } from '@/components/ui/button'
import { WorkSummaryHeader } from './components/WorkSummaryHeader'
import { ProductivityMetrics } from './components/ProductivityMetrics'
import { WorkItemTabs } from './components/WorkItemTabs'
import { WorkItemList } from './components/WorkItemList'
import { TeamWorkloadPanel } from './components/TeamWorkloadPanel'
import { WorkItemFiltersBar } from './components/WorkItemFiltersBar'

export default function MyWorkDashboard() {
  const { t, i18n } = useTranslation('my-work')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // URL state
  const searchParams = useSearch({ from: '/_protected/my-work/' })
  const {
    tab = 'all',
    filter,
    trackingType,
    search,
    sortBy = 'deadline',
    sortOrder = 'asc',
  } = searchParams

  // Build filters from URL state
  const filters = useMemo<WorkItemFilters>(() => {
    const result: WorkItemFilters = {}

    // Source filter based on tab
    if (tab !== 'all') {
      const sourceMap: Record<string, WorkSource> = {
        commitments: 'commitment',
        tasks: 'task',
        intake: 'intake',
      }
      result.sources = [sourceMap[tab]]
    }

    // Tracking type filter
    if (trackingType) {
      result.trackingTypes = [trackingType as TrackingType]
    }

    // Quick filter presets
    if (filter === 'overdue') {
      result.isOverdue = true
    } else if (filter === 'due-today' || filter === 'due-week') {
      // These are handled in the query
    }

    // Search query
    if (search) {
      result.searchQuery = search
    }

    return result
  }, [tab, trackingType, filter, search])

  // Fetch data
  const { summary, metrics, items } = useMyWorkDashboard(
    filters,
    sortBy as WorkItemSortBy,
    sortOrder as SortOrder,
  )

  // Team workload for managers
  const teamWorkload = useTeamWorkload()

  // Get current user ID for realtime filtering
  const userId = useCurrentUserId()

  // Real-time subscription - only enable when userId is available to prevent
  // subscribing without filter (which would cause cache thrashing for all users)
  useUnifiedWorkRealtime({ userId, enabled: !!userId })

  // URL state update handlers
  const updateSearch = useCallback(
    (updates: Partial<typeof searchParams>) => {
      navigate({
        search: (prev) => ({ ...prev, ...updates }),
        replace: true,
      })
    },
    [navigate],
  )

  const handleTabChange = useCallback(
    (newTab: string) => {
      updateSearch({ tab: newTab as typeof tab })
    },
    [updateSearch],
  )

  const handleFilterChange = useCallback(
    (newFilter: string | undefined) => {
      updateSearch({ filter: newFilter as typeof filter })
    },
    [updateSearch],
  )

  const handleTrackingTypeChange = useCallback(
    (newType: TrackingType | undefined) => {
      updateSearch({ trackingType: newType })
    },
    [updateSearch],
  )

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      updateSearch({ search: newSearch || undefined })
    },
    [updateSearch],
  )

  const handleSortChange = useCallback(
    (newSortBy: WorkItemSortBy, newSortOrder: SortOrder) => {
      updateSearch({ sortBy: newSortBy, sortOrder: newSortOrder })
    },
    [updateSearch],
  )

  // Flatten paginated items
  const workItems = useMemo(() => {
    return items.data?.pages.flatMap((page) => page.items) || []
  }, [items.data])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-start">{t('title', 'My Work')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 text-start">
            {t('subtitle', 'Track your commitments, tasks, and intake tickets in one place')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: '/my-work/board' })}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>{t('viewBoard', 'Board View')}</span>
        </Button>
      </div>

      {/* Summary Header with Stats */}
      <WorkSummaryHeader
        summary={summary.data}
        isLoading={summary.isLoading}
        onFilterClick={handleFilterChange}
        currentFilter={filter}
      />

      {/* Productivity Metrics */}
      <ProductivityMetrics metrics={metrics.data} isLoading={metrics.isLoading} />

      {/* Team Workload Panel (managers only) */}
      {teamWorkload.data && teamWorkload.data.length > 0 && (
        <TeamWorkloadPanel teamMembers={teamWorkload.data} isLoading={teamWorkload.isLoading} />
      )}

      {/* Tabs for Source Filter */}
      <WorkItemTabs
        activeTab={tab}
        onTabChange={handleTabChange}
        counts={{
          all: summary.data?.total_active || 0,
          commitments: summary.data?.commitment_count || 0,
          tasks: summary.data?.task_count || 0,
          intake: summary.data?.intake_count || 0,
        }}
      />

      {/* Filter Bar */}
      <WorkItemFiltersBar
        trackingType={trackingType}
        onTrackingTypeChange={handleTrackingTypeChange}
        searchQuery={search || ''}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      {/* Work Items List */}
      <WorkItemList
        items={workItems}
        isLoading={items.isLoading}
        isError={items.isError}
        error={items.error}
        hasMore={items.hasNextPage}
        onLoadMore={() => items.fetchNextPage()}
        isFetchingMore={items.isFetchingNextPage}
        onRefresh={async () => {
          await items.refetch()
        }}
      />
    </div>
  )
}
