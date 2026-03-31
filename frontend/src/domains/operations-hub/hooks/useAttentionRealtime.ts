/**
 * Attention Zone Realtime Subscription
 * Phase 10: Operations Hub Dashboard
 *
 * Subscribes to Supabase Realtime postgres_changes on `tasks` and
 * `lifecycle_transitions` tables. When changes occur, debounces and
 * invalidates the attention query so the zone refreshes automatically.
 *
 * Pattern follows useUnifiedWorkRealtime.ts:
 * - Channel stored in useRef to avoid stale closures
 * - 1-second debounce to batch rapid changes (prevents re-render storms)
 * - Cleanup removes channel and clears debounce timeout
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { operationsHubKeys } from './useAttentionItems'

const DEBOUNCE_MS = 1000

export function useAttentionRealtime(userId?: string): void {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queueInvalidation = useCallback((): void => {
    if (debounceRef.current != null) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: operationsHubKeys.attention(userId),
      })
    }, DEBOUNCE_MS)
  }, [queryClient, userId])

  useEffect(() => {
    const channel = supabase
      .channel(`attention:${userId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          ...(userId != null ? { filter: `assignee_id=eq.${userId}` } : {}),
        },
        queueInvalidation,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lifecycle_transitions',
        },
        queueInvalidation,
      )
      .subscribe()

    channelRef.current = channel

    return (): void => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current)
      if (channelRef.current != null) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, queueInvalidation])
}
