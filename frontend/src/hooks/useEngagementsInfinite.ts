/**
 * useEngagementsInfinite — Plan 40-02b infinite-scroll adapter.
 *
 * `useInfiniteQuery` wrapper around `engagementsRepo.getEngagements`.
 * Each page is the repo's `EngagementListResponse` (`{ data, pagination }`).
 * `getNextPageParam` returns `undefined` once the latest page is short
 * (`page.data.length < limit`), signalling the end of the stream.
 *
 * Plan 09 consumes pages flattened to `EngagementListItem[]` (the row shape
 * verified against `frontend/src/types/engagement.types.ts` in Plan 02b).
 */

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { engagementsRepo } from '@/domains/engagements'
import { supabase } from '@/lib/supabase'
import type {
  EngagementCategory,
  EngagementListItem,
  EngagementListResponse,
  EngagementStatus,
  EngagementType,
} from '@/types/engagement.types'

export interface EngagementsInfiniteParams {
  search?: string
  type?: EngagementTypeBucket
  limit?: number
}

const ENGAGEMENTS_INFINITE_QUERY_KEY = 'engagements-infinite'
const ENGAGEMENTS_TOTAL_QUERY_KEY = 'engagements-total'

export type EngagementTypeBucket = 'meeting' | 'travel' | 'event'

const ENGAGEMENT_TYPE_BUCKETS: Record<EngagementTypeBucket, EngagementType[]> = {
  meeting: ['bilateral_meeting', 'consultation', 'working_group', 'roundtable'],
  travel: ['mission', 'delegation', 'official_visit'],
  event: ['summit', 'forum_session'],
}

/** Row shape returned by the `search_engagements_advanced` RPC. */
interface EngagementRpcRow {
  id: string
  name_en: string | null
  name_ar: string | null
  engagement_type: EngagementType
  engagement_category: EngagementCategory | null
  engagement_status: EngagementStatus | null
  start_date: string | null
  end_date: string | null
  location_en: string | null
  location_ar: string | null
  is_virtual: boolean | null
  host_country_id: string | null
  participant_count: number | string | null
}

export type EngagementsInfiniteResult = UseInfiniteQueryResult<
  InfiniteData<EngagementListResponse, number>,
  Error
> & {
  total: number
}

// ponytail: counting ceiling — the RPC applies its LIMIT internally, so the exact
// head-count saturates here; raise if engagements ever approach this volume.
const COUNT_CEILING = 100_000

/** `null` when the term is blank, so the RPC's `IS NULL` short-circuit applies. */
const toSearchTerm = (search: string | undefined): string | null =>
  search !== undefined && search.trim() !== '' ? search : null

/**
 * Exact filtered total via a `head: true` count on the SAME
 * `search_engagements_advanced` RPC that serves the visible rows — the count
 * predicate matches the list by construction (the edge function's own
 * `pagination.total` is unfiltered).
 *
 * The RPC applies LIMIT/OFFSET internally, so an `{ count: 'exact' }` on a paged
 * call would count the page, not the filter. Counting is therefore its own
 * head-only call at `COUNT_CEILING`.
 */
async function countEngagements(
  search: string | undefined,
  type: EngagementTypeBucket | undefined,
): Promise<number> {
  const { count, error } = await supabase.rpc(
    'search_engagements_advanced',
    {
      p_search_term: toSearchTerm(search),
      p_engagement_types: type !== undefined ? ENGAGEMENT_TYPE_BUCKETS[type] : null,
      p_limit: COUNT_CEILING,
      p_offset: 0,
    },
    { count: 'exact', head: true },
  )
  if (error != null) throw new Error(error.message)
  return count ?? 0
}

function toListItem(row: EngagementRpcRow): EngagementListItem {
  return {
    id: row.id,
    name_en: row.name_en ?? row.location_en ?? row.engagement_type,
    name_ar: row.name_ar ?? row.location_ar ?? row.engagement_type,
    engagement_type: row.engagement_type,
    engagement_category: row.engagement_category ?? 'other',
    engagement_status: row.engagement_status ?? 'planned',
    start_date: row.start_date ?? '',
    end_date: row.end_date ?? row.start_date ?? '',
    location_en: row.location_en ?? undefined,
    location_ar: row.location_ar ?? undefined,
    is_virtual: row.is_virtual ?? false,
    host_country_id: row.host_country_id ?? undefined,
    participant_count: Number(row.participant_count ?? 0),
  }
}

/**
 * A type-bucket ("meeting" = 4 `engagement_type` values) is served by the same
 * `search_engagements_advanced` RPC as the unbucketed stream, via its
 * `p_engagement_types TEXT[]` parameter. This keeps ONE predicate path for the
 * rows and the count — including the RPC's archived-dossier exclusion and its
 * dossier-name search, neither of which a hand-rolled PostgREST query can express.
 *
 * ponytail: `pagination.total` is a per-page lower bound; the authoritative
 * filtered total is the hook's `total` (the cached `countEngagements` head-count).
 * Nothing outside this hook reads `pagination.total`.
 */
async function fetchEngagementsPage(
  params: EngagementsInfiniteParams,
  page: number,
  limit: number,
): Promise<EngagementListResponse> {
  const type = params.type
  if (type === undefined) {
    return engagementsRepo.getEngagements({ page, limit, search: params.search })
  }

  const offset = (page - 1) * limit
  const { data, error } = await supabase.rpc('search_engagements_advanced', {
    p_search_term: toSearchTerm(params.search),
    p_engagement_types: ENGAGEMENT_TYPE_BUCKETS[type],
    p_limit: limit,
    p_offset: offset,
  })
  if (error != null) throw new Error(error.message)

  const rows = (data ?? []) as unknown as EngagementRpcRow[]
  return {
    data: rows.map(toListItem),
    pagination: {
      page,
      limit,
      total: offset + rows.length,
      totalPages: page,
      has_more: rows.length === limit,
    },
  }
}

export function useEngagementsInfinite(
  params: EngagementsInfiniteParams = {},
): EngagementsInfiniteResult {
  const limit = params.limit ?? 20
  const search = params.search
  const type = params.type

  // One head-count serves BOTH streams: it hits the same RPC (and the same
  // predicates) the rows come from, so the peek counter can never disagree with
  // the visible rows — bucketed or not.
  const totalQuery = useQuery({
    queryKey: [ENGAGEMENTS_TOTAL_QUERY_KEY, { search, type }] as const,
    queryFn: () => countEngagements(search, type),
    staleTime: 1000 * 30,
  })

  const infiniteQuery = useInfiniteQuery<
    EngagementListResponse,
    Error,
    InfiniteData<EngagementListResponse, number>,
    readonly [
      string,
      { search: string | undefined; type: EngagementTypeBucket | undefined; limit: number },
    ],
    number
  >({
    queryKey: [ENGAGEMENTS_INFINITE_QUERY_KEY, { search, type, limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam }): Promise<EngagementListResponse> => {
      const page = typeof pageParam === 'number' ? pageParam : 1
      return fetchEngagementsPage({ search, type }, page, limit)
    },
    getNextPageParam: (lastPage, allPages): number | undefined => {
      if (lastPage.data.length < limit) {
        return undefined
      }
      return allPages.length + 1
    },
    staleTime: 1000 * 30,
  })

  return {
    ...infiniteQuery,
    total: totalQuery.data ?? 0,
  }
}
