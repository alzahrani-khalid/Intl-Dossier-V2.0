/**
 * @deprecated Import from '@/domains/topics' instead.
 * This file is a backward-compatibility re-export plus list-shim used by
 * the topics list page (Phase 40 LIST-03).
 */

import { useDossiersByType } from '@/domains/dossiers'
import type { UseQueryResult } from '@tanstack/react-query'

export { topicKeys, useTopicSubtopics } from '@/domains/topics'

export interface UseTopicsParams {
  page?: number
  limit?: number
  search?: string
}

/**
 * Topics list adapter — wraps `useDossiersByType('topic')` so the list page
 * can import a domain-specific hook. Return shape mirrors useForums for parity:
 * `{ data: { data: Topic[], pagination }, isLoading, isError }`.
 */
export function useTopics(
  params: UseTopicsParams = {},
): UseQueryResult<{ data: Array<Record<string, unknown>>; total?: number }, Error> {
  const { page = 1, limit = 20 } = params
  // Cast via `unknown`: useDossiersByType returns
  // UseQueryResult<DossiersListResponse, DossierAPIError>; consumers of useTopics
  // expect a generic shape with `data: Record<string, unknown>[]`. The runtime
  // value is identical — only the static type differs.
  return useDossiersByType('topic', page, limit) as unknown as UseQueryResult<
    { data: Array<Record<string, unknown>>; total?: number },
    Error
  >
}
