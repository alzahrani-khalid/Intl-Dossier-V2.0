/**
 * Embedding Queue Status Hook
 * Feature: ai-features-reenablement
 *
 * Monitors the async embedding generation queue status.
 * Useful for showing users when their content is being processed.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useEmbeddingQueueStats();
 *
 * if (data?.total_pending > 0) {
 *   return <Badge>Processing {data.total_pending} items</Badge>;
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'

// Types
export interface EmbeddingQueueStats {
  total_pending: number
  by_entity_type: Record<string, number>
  failed: number
  avg_retry_count: number
}

export interface EmbeddingQueueItem {
  id: string
  entity_type: string
  entity_id: string
  priority: number
  created_at: string
  retry_count: number
  error_message?: string
}

// Query keys
export const EMBEDDING_QUEUE_STATS_KEY = ['embedding-queue', 'stats'] as const
export const EMBEDDING_QUEUE_ITEMS_KEY = ['embedding-queue', 'items'] as const

/**
 * Fetch embedding queue statistics from Edge Function
 */
async function fetchQueueStats(): Promise<EmbeddingQueueStats> {
  const { data: session } = await supabase.auth.getSession()

  if (!session.session) {
    throw new Error('Not authenticated')
  }

  const response = await supabase.functions.invoke('embeddings-generate/queue/stats', {
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
    },
  })

  if (response.error) {
    throw response.error
  }

  return response.data
}

/**
 * Fetch pending embedding queue items
 */
async function fetchQueueItems(options: {
  limit?: number
  entityType?: string
}): Promise<EmbeddingQueueItem[]> {
  const { limit = 50, entityType } = options

  let query = supabase
    .from('embedding_update_queue')
    .select('*')
    .is('processed_at', null)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Hook to get embedding queue statistics
 *
 * @param options.enabled - Whether to enable the query
 * @param options.refetchInterval - How often to refetch (default: 10 seconds)
 */
export function useEmbeddingQueueStats(options?: { enabled?: boolean; refetchInterval?: number }) {
  const { enabled = true, refetchInterval = 10000 } = options || {}

  return useQuery({
    queryKey: EMBEDDING_QUEUE_STATS_KEY,
    queryFn: fetchQueueStats,
    enabled,
    refetchInterval,
    staleTime: 5000, // Consider stale after 5 seconds
    retry: 1,
  })
}

/**
 * Hook to get pending embedding queue items
 *
 * @param options.limit - Maximum items to fetch
 * @param options.entityType - Filter by entity type
 * @param options.enabled - Whether to enable the query
 */
export function useEmbeddingQueueItems(options?: {
  limit?: number
  entityType?: string
  enabled?: boolean
}) {
  const { limit = 50, entityType, enabled = true } = options || {}

  return useQuery({
    queryKey: [...EMBEDDING_QUEUE_ITEMS_KEY, { limit, entityType }],
    queryFn: () => fetchQueueItems({ limit, entityType }),
    enabled,
    staleTime: 5000,
  })
}

/**
 * Hook to check if a specific entity is in the embedding queue
 *
 * @param entityType - Type of entity (positions, briefs, etc.)
 * @param entityId - UUID of the entity
 */
export function useIsEntityInEmbeddingQueue(
  entityType: string,
  entityId: string,
): { inQueue: boolean; item?: EmbeddingQueueItem; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: [...EMBEDDING_QUEUE_ITEMS_KEY, entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embedding_update_queue')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('processed_at', null)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data
    },
    enabled: !!entityType && !!entityId,
    staleTime: 5000,
  })

  return {
    inQueue: !!data,
    item: data || undefined,
    isLoading,
  }
}

/**
 * Hook to manually trigger embedding queue processing
 * (calls the Edge Function batch endpoint)
 */
export function useTriggerEmbeddingBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options?: { limit?: number; entityTypes?: string[] }) => {
      const { data: session } = await supabase.auth.getSession()

      if (!session.session) {
        throw new Error('Not authenticated')
      }

      const response = await supabase.functions.invoke('embeddings-generate/batch', {
        body: {
          limit: options?.limit || 50,
          entity_types: options?.entityTypes,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      })

      if (response.error) {
        throw response.error
      }

      return response.data
    },
    onSuccess: () => {
      // Invalidate queue stats after processing
      queryClient.invalidateQueries({ queryKey: EMBEDDING_QUEUE_STATS_KEY })
      queryClient.invalidateQueries({ queryKey: EMBEDDING_QUEUE_ITEMS_KEY })
    },
  })
}

/**
 * Hook to subscribe to embedding queue changes via Supabase Realtime
 * Returns the callback to unsubscribe
 */
export function useEmbeddingQueueSubscription(
  onUpdate: (payload: { entity_type: string; entity_id: string }) => void,
) {
  const queryClient = useQueryClient()

  // Subscribe to the pg_notify channel
  const channel = supabase
    .channel('embedding_queue_updates')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'embedding_update_queue',
      },
      (payload) => {
        onUpdate({
          entity_type: payload.new.entity_type,
          entity_id: payload.new.entity_id,
        })
        // Invalidate stats when new items are added
        queryClient.invalidateQueries({ queryKey: EMBEDDING_QUEUE_STATS_KEY })
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'embedding_update_queue',
      },
      () => {
        // Invalidate stats when items are processed
        queryClient.invalidateQueries({ queryKey: EMBEDDING_QUEUE_STATS_KEY })
      },
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

export default useEmbeddingQueueStats
