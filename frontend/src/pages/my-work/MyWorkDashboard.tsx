/**
 * Feature 032: Unified Work Management Dashboard
 * Mobile-first, RTL-compatible design
 */
import { useTranslation } from 'react-i18next'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { LayoutGrid, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryErrorState } from '@/components/error-states/QueryErrorState'
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
  const { t } = useTranslation('my-work')
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
    assignee,
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
      const mapped = sourceMap[tab]
      if (mapped) {
        result.sources = [mapped]
      }
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

    // Assignee filter (manager drill-down)
    if (assignee) {
      result.assigneeId = assignee
    }

    return result
  }, [tab, trackingType, filter, search, assignee])

  // Fetch data. `activeItems` is the single result set every number on this page reads
  // (COUNT-01 / D-06) — see useUnifiedWork.ts for the population definition and its seams.
  const { summary, metrics, items, activeItems } = useMyWorkDashboard(
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
        to: '/my-work',
        search: { ...searchParams, ...updates },
        replace: true,
      })
    },
    [navigate, searchParams],
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

  // Manager drill-down: click team member to filter by assignee
  const handleMemberClick = useCallback(
    (memberId: string) => {
      // Toggle: click again to clear
      updateSearch({ assignee: assignee === memberId ? undefined : memberId })
    },
    [updateSearch, assignee],
  )

  // COUNT-01 (D-06): every tab count is derived from `activeItems` — the SAME array the list
  // renders — so the badge, the footer total and the rows cannot disagree. A source tab's
  // response contains only that source, so the counts it cannot honestly answer are left
  // unrendered (WorkItemTabs draws no badge at 0) rather than filled from a second query with a
  // different population; that second query is precisely what made the badge read 18 while the
  // footer read 21.
  const counts = useMemo(() => {
    const countOf = (source: WorkSource, tabId: string): number =>
      tab === 'all' || tab === tabId
        ? activeItems.filter((item) => item.source === source).length
        : 0
    return {
      all: tab === 'all' ? activeItems.length : 0,
      commitments: countOf('commitment', 'commitments'),
      tasks: countOf('task', 'tasks'),
      intake: countOf('intake', 'intake'),
    }
  }, [activeItems, tab])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        title={t('title', 'My Work')}
        subtitle={t('subtitle', 'Track your commitments, tasks, and intake tickets in one place')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/my-work/board', search: { mode: 'status' } as any })}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>{t('viewBoard', 'Board View')}</span>
          </Button>
        }
      />

      {/* Summary Header with Stats. A failed summary query renders the error contract — never a
          strip of zeros over work the server never answered for (the forbidden shape, D-06). */}
      {summary.isError ? (
        <QueryErrorState
          variant="inline"
          onRetry={() => void summary.refetch()}
          isRetrying={summary.isFetching}
        />
      ) : (
        <WorkSummaryHeader
          summary={summary.data}
          isLoading={summary.isLoading}
          onFilterClick={handleFilterChange}
          currentFilter={filter}
        />
      )}

      {/* Productivity Metrics */}
      <ProductivityMetrics metrics={metrics.data} isLoading={metrics.isLoading} />

      {/* Team Workload Panel (managers only) */}
      {teamWorkload.data && teamWorkload.data.length > 0 && (
        <TeamWorkloadPanel
          teamMembers={teamWorkload.data}
          isLoading={teamWorkload.isLoading}
          onMemberClick={handleMemberClick}
          selectedMemberId={assignee}
        />
      )}

      {/* Tabs for Source Filter */}
      <WorkItemTabs activeTab={tab} onTabChange={handleTabChange} counts={counts} />

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
        items={activeItems}
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
