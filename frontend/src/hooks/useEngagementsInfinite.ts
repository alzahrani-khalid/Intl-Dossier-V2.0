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

interface EngagementJoinedRow {
  id: string
  engagement_type: EngagementType
  engagement_category: EngagementCategory | null
  engagement_status: EngagementStatus | null
  start_date: string | null
  end_date: string | null
  location_en: string | null
  location_ar: string | null
  is_virtual: boolean | null
  host_country_id: string | null
  dossier:
    | {
        id: string
        name_en: string | null
        name_ar: string | null
      }
    | Array<{
        id: string
        name_en: string | null
        name_ar: string | null
      }>
    | null
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

/**
 * Exact filtered total for the unbucketed stream via a `head: true` count on the
 * SAME `search_engagements_advanced` RPC the engagement-dossiers edge function
 * serves the visible rows from — the count predicate matches the list by
 * construction (the edge function's own `pagination.total` is unfiltered).
 */
async function countEngagements(search: string | undefined): Promise<number> {
  const { count, error } = await supabase.rpc(
    'search_engagements_advanced',
    {
      p_search_term: search !== undefined && search.trim() !== '' ? search : null,
      p_limit: COUNT_CEILING,
      p_offset: 0,
    },
    { count: 'exact', head: true },
  )
  if (error != null) throw new Error(error.message)
  return count ?? 0
}

/** Escape LIKE wildcards so user input matches literally. */
const escapeLike = (term: string): string =>
  term.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')

/**
 * Double-quote a value for a PostgREST `.or()` filter so reserved characters
 * (commas, parentheses) in the search term cannot break the filter grammar.
 */
const quoteOrValue = (value: string): string =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`

function toListItem(row: EngagementJoinedRow): EngagementListItem {
  const dossier = Array.isArray(row.dossier) ? (row.dossier[0] ?? null) : row.dossier
  return {
    id: row.id,
    name_en: dossier?.name_en ?? row.location_en ?? row.engagement_type,
    name_ar: dossier?.name_ar ?? row.location_ar ?? row.engagement_type,
    engagement_type: row.engagement_type,
    engagement_category: row.engagement_category ?? 'other',
    engagement_status: row.engagement_status ?? 'planned',
    start_date: row.start_date ?? '',
    end_date: row.end_date ?? row.start_date ?? '',
    location_en: row.location_en ?? undefined,
    location_ar: row.location_ar ?? undefined,
    is_virtual: row.is_virtual ?? false,
    host_country_id: row.host_country_id ?? undefined,
    participant_count: 0,
  }
}

async function fetchBucketedEngagementsPage(
  params: EngagementsInfiniteParams,
  page: number,
  limit: number,
): Promise<EngagementListResponse> {
  const type = params.type
  if (type === undefined) {
    return engagementsRepo.getEngagements({ page, limit, search: params.search })
  }

  const offset = (page - 1) * limit
  let query = supabase
    .from('engagement_dossiers')
    .select(
      `
        id,
        engagement_type,
        engagement_category,
        engagement_status,
        start_date,
        end_date,
        location_en,
        location_ar,
        is_virtual,
        host_country_id,
        dossier:id (
          id,
          name_en,
          name_ar
        )
      `,
      { count: 'exact' },
    )
    .in('engagement_type', ENGAGEMENT_TYPE_BUCKETS[type])
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.search !== undefined && params.search.trim() !== '') {
    const pattern = quoteOrValue(`%${escapeLike(params.search)}%`)
    query = query.or(
      `location_en.ilike.${pattern},location_ar.ilike.${pattern},objectives_en.ilike.${pattern}`,
    )
  }

  const { data, count, error } = await query
  if (error != null) throw new Error(error.message)

  const total = count ?? 0
  return {
    data: ((data ?? []) as unknown as EngagementJoinedRow[]).map(toListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      has_more: offset + limit < total,
    },
  }
}

export function useEngagementsInfinite(
  params: EngagementsInfiniteParams = {},
): EngagementsInfiniteResult {
  const limit = params.limit ?? 20
  const search = params.search
  const type = params.type

  // Bucketed streams count inside fetchBucketedEngagementsPage (`count: 'exact'`
  // on the same filtered query), so the RPC head-count only serves the
  // unbucketed stream — where the edge function's total is unfiltered.
  const totalQuery = useQuery({
    queryKey: [ENGAGEMENTS_TOTAL_QUERY_KEY, { search }] as const,
    queryFn: () => countEngagements(search),
    enabled: type === undefined,
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
      return fetchBucketedEngagementsPage({ search, type }, page, limit)
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
    total:
      type !== undefined
        ? (infiniteQuery.data?.pages[0]?.pagination.total ?? 0)
        : (totalQuery.data ?? 0),
  }
}
