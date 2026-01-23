/**
 * Unified Work Realtime Subscription Hook
 * @module hooks/useUnifiedWorkRealtime
 * @feature 032-unified-work-management
 *
 * Realtime subscription hooks for unified work management with:
 * - Automatic cache invalidation on data changes
 * - Debounced invalidation to prevent excessive refetches
 * - User-specific filtering
 * - Multi-table listening (tasks, commitments, intake tickets)
 *
 * @description
 * This module provides React hooks for subscribing to real-time updates across
 * all work item sources:
 * - Listens to Postgres changes on tasks, aa_commitments, and intake_tickets
 * - Automatically invalidates relevant queries with 300ms debouncing
 * - Supports user-specific filtering for personalized updates
 * - Provides manual invalidation trigger
 * - Includes helper hook for getting current user ID
 *
 * @example
 * // Subscribe to all work item changes for current user
 * const userId = useCurrentUserId();
 * useUnifiedWorkRealtime({ userId });
 *
 * @example
 * // Subscribe with custom debounce
 * useUnifiedWorkRealtime({ userId, debounceMs: 500 });
 *
 * @example
 * // Manual invalidation
 * const { forceInvalidate } = useUnifiedWorkRealtime({ userId });
 * // Later: forceInvalidate();
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unifiedWorkKeys, useInvalidateUnifiedWork } from './useUnifiedWork'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Default debounce time to prevent excessive invalidations (300ms as per spec)
 */
const DEBOUNCE_MS = 300

/**
 * Options for useUnifiedWorkRealtime hook
 */
interface UseUnifiedWorkRealtimeOptions {
  /** User ID to filter events for (optional, omit to listen to all events) */
  userId?: string
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean
  /** Custom debounce time in milliseconds (default: 300ms) */
  debounceMs?: number
}

/**
 * Hook to subscribe to realtime updates for work items
 *
 * @description
 * Subscribes to Postgres changes on tasks, aa_commitments, and intake_tickets tables
 * and automatically invalidates relevant TanStack Query caches. Uses debouncing to
 * prevent excessive refetches when multiple changes occur in rapid succession.
 *
 * @param options - Configuration options
 * @param options.userId - User ID to filter events for (optional)
 * @param options.enabled - Whether to enable the subscription (default: true)
 * @param options.debounceMs - Custom debounce time in ms (default: 300)
 * @returns Object with forceInvalidate method
 *
 * @example
 * // Basic usage - subscribe to all user's work items
 * const userId = useCurrentUserId();
 * useUnifiedWorkRealtime({ userId });
 *
 * @example
 * // Conditional subscription
 * useUnifiedWorkRealtime({
 *   userId,
 *   enabled: isOnline && shouldSync
 * });
 *
 * @example
 * // Force invalidation on demand
 * const { forceInvalidate } = useUnifiedWorkRealtime({ userId });
 * // Later: forceInvalidate();
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
 * Hook to get the current authenticated user ID
 *
 * @description
 * Fetches and tracks the current authenticated user's ID with automatic updates
 * on auth state changes. Uses state instead of ref to trigger re-renders and
 * ensure subscriptions are created with the correct userId filter.
 *
 * @returns The current user's ID or undefined if not authenticated
 *
 * @example
 * // Get current user ID for realtime filtering
 * const userId = useCurrentUserId();
 * useUnifiedWorkRealtime({ userId });
 *
 * @example
 * // Use for conditional rendering
 * const userId = useCurrentUserId();
 * if (!userId) return <LoginPrompt />;
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
