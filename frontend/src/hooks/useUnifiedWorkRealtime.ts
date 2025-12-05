// Feature 032: Unified Work Management Realtime Subscription Hook
import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unifiedWorkKeys, useInvalidateUnifiedWork } from './useUnifiedWork'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Debounce time to prevent excessive invalidations (300ms as per spec)
const DEBOUNCE_MS = 300

interface UseUnifiedWorkRealtimeOptions {
  /** User ID to filter events for */
  userId?: string
  /** Whether to enable the subscription */
  enabled?: boolean
  /** Custom debounce time in ms */
  debounceMs?: number
}

/**
 * Hook to subscribe to realtime updates for work items
 * Listens to changes on aa_commitments, tasks, and intake_tickets tables
 * and invalidates relevant queries with debouncing
 */
export function useUnifiedWorkRealtime({
  userId,
  enabled = true,
  debounceMs = DEBOUNCE_MS,
}: UseUnifiedWorkRealtimeOptions = {}) {
  const queryClient = useQueryClient()
  const { invalidateAll, invalidateSummary } = useInvalidateUnifiedWork()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingInvalidationsRef = useRef<Set<string>>(new Set())

  // Debounced invalidation handler
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const pending = pendingInvalidationsRef.current

      if (pending.has('all')) {
        invalidateAll()
      } else {
        if (pending.has('summary')) {
          invalidateSummary()
        }
        if (pending.has('items')) {
          queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.items() })
        }
      }

      pendingInvalidationsRef.current.clear()
    }, debounceMs)
  }, [debounceMs, invalidateAll, invalidateSummary, queryClient])

  // Queue an invalidation
  const queueInvalidation = useCallback(
    (type: 'all' | 'summary' | 'items') => {
      pendingInvalidationsRef.current.add(type)
      debouncedInvalidate()
    },
    [debouncedInvalidate],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Create a unique channel name
    const channelName = userId ? `unified-work:${userId}` : `unified-work:all`

    // Subscribe to realtime changes
    const channel = supabase
      .channel(channelName)
      // Listen to aa_commitments changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aa_commitments',
          ...(userId && { filter: `owner_user_id=eq.${userId}` }),
        },
        (_payload) => {
          queueInvalidation('all')
        },
      )
      // Listen to tasks changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          ...(userId && { filter: `assignee_id=eq.${userId}` }),
        },
        (_payload) => {
          queueInvalidation('all')
        },
      )
      // Listen to intake_tickets changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intake_tickets',
          ...(userId && { filter: `assigned_to=eq.${userId}` }),
        },
        (_payload) => {
          queueInvalidation('all')
        },
      )
      .subscribe((_status) => {
        // Subscription status changed
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, userId, queueInvalidation])

  return {
    /** Manually trigger an invalidation */
    forceInvalidate: () => {
      pendingInvalidationsRef.current.clear()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      invalidateAll()
    },
  }
}

/**
 * Hook to get the current user ID for realtime filtering
 * Uses state instead of ref to trigger re-renders and ensure
 * the subscription is created with the correct userId filter
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return userId
}
