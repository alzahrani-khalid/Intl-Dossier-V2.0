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
  type EngagementRow,
  type EngagementFilter,
} from '@/components/list-page'
import { useEngagementsInfinite } from '@/hooks/useEngagementsInfinite'
import type { EngagementListItem, EngagementType, EngagementStatus } from '@/types/engagement.types'

/**
 * URL search contract for the engagements list (Phase 87-05, AFF-02). Shared by
 * both mounts (`/dossiers/engagements` and `/engagements`) so the tampering
 * whitelist has a single source. The `type` param whitelists the non-'all'
 * FilterPill values ('all' clears the param); `satisfies` anchors the
 * enumeration to the EngagementFilter contract so it errors if the union drifts.
 */
export type EngagementTypeParam = Exclude<EngagementFilter, 'all'>

const ENGAGEMENT_TYPE_VALUES = [
  'meeting',
  'call',
  'travel',
  'event',
] as const satisfies readonly EngagementTypeParam[]

export interface EngagementsListSearch {
  search?: string
  type?: EngagementTypeParam
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
  /** Writes the FilterPill selection back to the URL. */
  onFilterChange: (next: EngagementFilter) => void
}

export default function EngagementsListPage({
  search,
  filter,
  onSearchChange,
  onFilterChange,
}: EngagementsListPageProps): ReactNode {
  const { t, i18n } = useTranslation(['engagements', 'list-pages'])
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useEngagementsInfinite({ search: search.length > 0 ? search : undefined })

  const engagements = useMemo<EngagementRow[]>(() => {
    if (!data) return []
    const flat: EngagementRow[] = []
    for (const page of data.pages) {
      for (const item of page.data) {
        flat.push(toEngagementRow(item, isRTL))
      }
    }
    if (filter === 'all') return flat
    return flat.filter((row) => row.type === filter)
  }, [data, isRTL, filter])

  const handleEngagementClick = useCallback(
    (row: EngagementRow): void => {
      void navigate({
        to: '/engagements/$engagementId/overview',
        params: { engagementId: row.id },
      })
    },
    [navigate],
  )

  const handleLoadMore = useCallback((): void => {
    void fetchNextPage()
  }, [fetchNextPage])

  return (
    <ListPageShell
      title={t('title', { ns: 'engagements', defaultValue: 'Engagements' })}
      subtitle={t('subtitle', {
        ns: 'engagements',
        defaultValue: 'Meetings, consultations, and visits',
      })}
      isLoading={isLoading}
    >
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
      />
    </ListPageShell>
  )
}
