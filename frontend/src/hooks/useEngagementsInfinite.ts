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
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { engagementsRepo } from '@/domains/engagements'
import type { EngagementListResponse } from '@/types/engagement.types'

export interface EngagementsInfiniteParams {
  search?: string
  limit?: number
}

const ENGAGEMENTS_INFINITE_QUERY_KEY = 'engagements-infinite'

export function useEngagementsInfinite(
  params: EngagementsInfiniteParams = {},
): UseInfiniteQueryResult<InfiniteData<EngagementListResponse, number>, Error> {
  const limit = params.limit ?? 20
  const search = params.search

  return useInfiniteQuery<
    EngagementListResponse,
    Error,
    InfiniteData<EngagementListResponse, number>,
    readonly [string, { search: string | undefined; limit: number }],
    number
  >({
    queryKey: [ENGAGEMENTS_INFINITE_QUERY_KEY, { search, limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam }): Promise<EngagementListResponse> => {
      const page = typeof pageParam === 'number' ? pageParam : 1
      return engagementsRepo.getEngagements({ page, limit, search })
    },
    getNextPageParam: (lastPage, allPages): number | undefined => {
      if (lastPage.data.length < limit) {
        return undefined
      }
      return allPages.length + 1
    },
    staleTime: 1000 * 30,
  })
}
