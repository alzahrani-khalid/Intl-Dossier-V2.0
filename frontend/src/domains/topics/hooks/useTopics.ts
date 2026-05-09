/**
 * Topic Hooks
 * @module domains/topics/hooks/useTopics
 *
 * TanStack Query hooks for topic-specific operations (subtopics, detail).
 * Routes through the topics repository.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import * as TopicsRepo from '../repositories/topics.repository'
import type { DossierWithExtension } from '@/services/dossier-api'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const topicKeys = {
  all: ['topics'] as const,
  detail: (id: string) => [...topicKeys.all, id] as const,
  subtopics: (id: string) => [...topicKeys.all, id, 'subtopics'] as const,
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTopicSubtopics(
  topicId: string,
  options?: Omit<UseQueryOptions<DossierWithExtension[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: topicKeys.subtopics(topicId),
    queryFn: () => TopicsRepo.getTopicSubtopics(topicId),
    enabled: !!topicId,
    staleTime: STALE_TIME.NORMAL,
    ...options,
  })
}
