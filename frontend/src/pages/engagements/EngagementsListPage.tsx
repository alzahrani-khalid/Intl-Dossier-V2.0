/**
 * Engagements List Page (Phase 40 LIST-04)
 *
 * Wires the EngagementsList primitive (search + filter pills + week-list +
 * GlobeSpinner load-more) into ListPageShell. Source data flows from
 * `useEngagementsInfinite`; rows are mapped from `EngagementListItem` shape
 * (`name_en/name_ar/engagement_type/engagement_status/start_date/...`) onto
 * the primitive's `EngagementRow` shape (`title_en/title_ar/type/status/...`).
 *
 * Replaces the legacy implementation per .planning/phases/40-list-pages/40-CONTEXT.md
 * decisions D-07 / D-08 / D-10.
 */

import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ListPageShell,
  EngagementsList,
  ToolbarSearch,
  type EngagementRow,
  type EngagementFilter,
} from '@/components/list-page'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import { FilterChipsRow } from '@/components/list-controls/FilterChipsRow'
import { FilterPopover } from '@/components/list-controls/FilterPopover'
import { ListEmptyState } from '@/components/empty-states'
import type {
  ListControlsConfig,
  UseListControlsReturn,
} from '@/components/list-controls/useListControls'
import { useEngagementsInfinite, type EngagementTypeBucket } from '@/hooks/useEngagementsInfinite'
import type { PeekRegistration } from '@/store/peekStore'
import type { EngagementListItem, EngagementType, EngagementStatus } from '@/types/engagement.types'

/**
 * URL search contract for the engagements list (Phase 87-05, AFF-02). Shared by
 * both mounts (`/dossiers/engagements` and `/engagements`) so the tampering
 * whitelist has a single source. The `type` param whitelists the non-'all'
 * inline filter values ('all' clears the param); `satisfies` anchors the
 * enumeration to the EngagementFilter contract so it errors if the union drifts.
 */
export type EngagementTypeParam = EngagementTypeBucket

const ENGAGEMENT_TYPE_VALUES = [
  'meeting',
  'travel',
  'event',
] as const satisfies readonly EngagementTypeBucket[]

export const engagementsListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'type',
      labelKey: 'list-controls:field.type',
      options: [
        { value: 'meeting', labelKey: 'engagements:filter.meeting' },
        { value: 'travel', labelKey: 'engagements:filter.travel' },
        { value: 'event', labelKey: 'engagements:filter.event' },
      ],
    },
  ],
  properties: [
    { id: 'type', labelKey: 'list-controls:property.type', defaultVisible: true },
    { id: 'status', labelKey: 'list-controls:property.status', defaultVisible: true },
    { id: 'location', labelKey: 'list-controls:property.location', defaultVisible: true },
  ],
}

export interface EngagementsListSearch {
  search?: string
  type?: EngagementTypeParam
  cols?: string
}

export function validateEngagementsListSearch(
  search: Record<string, unknown>,
): EngagementsListSearch {
  return {
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
    type: ENGAGEMENT_TYPE_VALUES.includes(search.type as EngagementTypeParam)
      ? (search.type as EngagementTypeParam)
      : undefined,
  }
}

/**
 * Map the real `engagement_type` enum onto the primitive's narrow union
 * (`'meeting' | 'call' | 'travel' | 'event'`). Anything that isn't a clear
 * call/travel falls back to `'meeting'` for bilateral_meeting/consultation,
 * `'event'` otherwise — chosen so the four filter pills surface a usable
 * partition over the wider enum.
 */
const mapEngagementType = (kind: EngagementType): EngagementRow['type'] => {
  switch (kind) {
    case 'bilateral_meeting':
    case 'consultation':
    case 'working_group':
    case 'roundtable':
      return 'meeting'
    case 'mission':
    case 'delegation':
    case 'official_visit':
      return 'travel'
    case 'summit':
    case 'forum_session':
      return 'event'
    case 'other':
    default:
      return 'meeting'
  }
}

/**
 * Map the real `engagement_status` enum onto the primitive's narrow union
 * (`'scheduled' | 'in_progress' | 'completed' | 'cancelled'`).
 */
const mapEngagementStatus = (status: EngagementStatus): EngagementRow['status'] => {
  switch (status) {
    case 'planned':
    case 'confirmed':
    case 'postponed':
      return 'scheduled'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'scheduled'
  }
}

const toEngagementRow = (item: EngagementListItem, isRTL: boolean): EngagementRow => {
  const localizedLocation = isRTL
    ? (item.location_ar ?? item.host_country_name_ar)
    : (item.location_en ?? item.host_country_name_en)
  return {
    id: item.id,
    title_en: item.name_en,
    title_ar: item.name_ar,
    starts_at: item.start_date,
    type: mapEngagementType(item.engagement_type),
    location: localizedLocation,
    status: mapEngagementStatus(item.engagement_status),
  }
}

export interface EngagementsListPageProps {
  /** Search term from the route's validated URL params. */
  search: string
  /** Type filter from the route's validated URL params ('all' = no `type` param). */
  filter: EngagementFilter
  /** Writes the search term back to the URL (debounced by ToolbarSearch). */
  onSearchChange: (next: string) => void
  /** Writes the type-filter selection back to the URL. */
  onFilterChange: (next: EngagementFilter) => void
  controls?: UseListControlsReturn
  onClearFilters?: () => void
  onCreate?: () => void
  onEngagementOpen?: (row: EngagementRow, registration: PeekRegistration) => void
}

export default function EngagementsListPage({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  controls,
  onClearFilters,
  onCreate,
  onEngagementOpen,
}: EngagementsListPageProps): ReactNode {
  const { t, i18n } = useTranslation(['engagements', 'list-pages'])
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const activeType = ENGAGEMENT_TYPE_VALUES.includes(filter as EngagementTypeBucket)
    ? (filter as EngagementTypeBucket)
    : undefined

  const { data, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useEngagementsInfinite({
      search: search.length > 0 ? search : undefined,
      type: activeType,
    })

  const flatEngagements = useMemo<EngagementRow[]>(() => {
    if (!data) return []
    const flat: EngagementRow[] = []
    for (const page of data.pages) {
      for (const item of page.data) {
        flat.push(toEngagementRow(item, isRTL))
      }
    }
    return flat
  }, [data, isRTL])

  const engagements = useMemo<EngagementRow[]>(() => {
    const flat = flatEngagements
    if (filter === 'all') return flat
    return flat.filter((row) => row.type === filter)
  }, [flatEngagements, filter])

  const handleEngagementClick = useCallback(
    (row: EngagementRow): void => {
      if (onEngagementOpen !== undefined) {
        onEngagementOpen(row, {
          ids: engagements.map((engagement) => engagement.id),
          type: 'engagement',
          total,
          pageOffset: 0,
          pageSize: 20,
          fetchPage: async (page: number): Promise<string[]> => {
            // Serve already-loaded pages from the cache; otherwise advance the
            // infinite window one fetch at a time until the requested page is in
            // (handles requests 2+ pages past the loaded edge). The no-progress
            // guard breaks at the end of the stream or on a failed fetch.
            let pages = data?.pages ?? []
            while (pages.length < page) {
              const result = await fetchNextPage()
              const nextPages = result.data?.pages ?? []
              if (nextPages.length <= pages.length) break
              pages = nextPages
            }
            const targetPage = pages[page - 1]
            if (targetPage === undefined) return []
            return targetPage.data
              .map((item) => toEngagementRow(item, isRTL))
              .filter((engagement) => filter === 'all' || engagement.type === filter)
              .map((engagement) => engagement.id)
          },
        })
        return
      }
      void navigate({
        to: '/engagements/$engagementId/overview',
        params: { engagementId: row.id },
      })
    },
    [data, engagements, fetchNextPage, filter, isRTL, navigate, onEngagementOpen, total],
  )

  const handleLoadMore = useCallback((): void => {
    void fetchNextPage()
  }, [fetchNextPage])

  const filtered = search !== '' || controls?.hasActiveFilters === true
  const clearFilters = onClearFilters ?? controls?.clearAll

  const toolbar =
    controls !== undefined ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <ToolbarSearch
          value={search}
          onChange={onSearchChange}
          placeholder={t('search.placeholder', { defaultValue: 'Search engagements...' })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            config={engagementsListConfig}
            surfaceKey="engagements"
            activeFilters={controls.filters}
            activeFilterCount={controls.activeFilterCount}
            onFilterChange={controls.setFilter}
          />
          <DisplayPopover
            config={engagementsListConfig}
            sort={controls.sort}
            dir={controls.dir}
            visibleProperties={controls.visibleProperties}
            onSetSort={controls.setSort}
            onSetDir={controls.setDir}
            onToggleProperty={controls.toggleProperty}
            onSetGroup={controls.setGroup}
            onReset={controls.resetDisplay}
          />
        </div>
      </div>
    ) : null

  return (
    <ListPageShell
      title={t('title', { ns: 'engagements', defaultValue: 'Engagements' })}
      subtitle={t('subtitle', {
        ns: 'engagements',
        defaultValue: 'Meetings, consultations, and visits',
      })}
      isLoading={isLoading}
    >
      {toolbar}
      {controls !== undefined ? (
        <FilterChipsRow
          chips={controls.filterChips}
          onRemove={controls.removeFilter}
          onClearAll={controls.clearAll}
        />
      ) : null}
      <EngagementsList
        engagements={engagements}
        search={search}
        onSearchChange={onSearchChange}
        filter={filter}
        onFilterChange={onFilterChange}
        onEngagementClick={handleEngagementClick}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        showToolbar={controls === undefined}
        visibleProperties={controls?.visibleProperties}
        emptyState={
          <ListEmptyState
            entityType="engagement"
            onCreate={onCreate}
            filtered={filtered}
            onClearFilters={clearFilters}
          />
        }
      />
    </ListPageShell>
  )
}
