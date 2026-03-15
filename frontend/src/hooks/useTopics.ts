/**
 * Topic Hooks
 * TanStack Query hooks for topic-specific operations (subtopics, detail).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DossierWithExtension } from '@/services/dossier-api'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Query Keys Factory
 */
export const topicKeys = {
  all: ['topics'] as const,
  detail: (id: string) => [...topicKeys.all, id] as const,
  subtopics: (id: string) => [...topicKeys.all, id, 'subtopics'] as const,
}

/**
 * Fetch subtopics for a topic
 */
async function fetchTopicSubtopics(topicId: string): Promise<DossierWithExtension[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/topics/${topicId}/subtopics`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error?.error?.message_en || 'Failed to fetch subtopics')
  }

  const result = await response.json()
  return result.data || []
}

/**
 * Hook to fetch subtopics for a topic dossier
 */
export function useTopicSubtopics(
  topicId: string,
  options?: Omit<UseQueryOptions<DossierWithExtension[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: topicKeys.subtopics(topicId),
    queryFn: () => fetchTopicSubtopics(topicId),
    enabled: !!topicId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
