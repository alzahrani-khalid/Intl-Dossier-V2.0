/**
 * Activity Feed Hooks
 *
 * TanStack Query hooks for:
 * - Fetching activity feed with filters and pagination
 * - Following/unfollowing entities
 * - Managing user preferences
 *
 * Uses supabase.functions.invoke() for automatic auth handling
 */

import { useCallback, useState, useEffect } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ActivityItem,
  ActivityFilters,
  ActivityFeedResponse,
  EntityFollow,
  FollowEntityRequest,
  UnfollowEntityRequest,
  FollowingResponse,
  ActivityFeedPreferences,
  UpdatePreferencesRequest,
  UseActivityFeedReturn,
  UseEntityFollowReturn,
  UseActivityPreferencesReturn,
  ActivityEntityType,
} from '@/types/activity-feed.types'

// Hook to track if user is authenticated (for enabling queries)
function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return isAuthenticated
}

/**
 * Helper to build query string from params object
 */
function buildQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value)
    }
  }
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// =============================================
// ACTIVITY FEED HOOK
// =============================================

export function useActivityFeed(initialFilters?: ActivityFilters): UseActivityFeedReturn {
  const isAuthenticated = useIsAuthenticated()
  const [filters, setFiltersState] = useState<ActivityFilters>(initialFilters || {})

  const queryKey = ['activity-feed', filters]

  const { data, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useInfiniteQuery<ActivityFeedResponse, Error>({
      queryKey,
      queryFn: async ({ pageParam }) => {
        // Build query params
        const queryParams = buildQueryString({
          cursor: pageParam as string | undefined,
          limit: '20',
          entity_types: filters.entity_types?.join(','),
          action_types: filters.action_types?.join(','),
          actor_id: filters.actor_id,
          date_from: filters.date_from,
          date_to: filters.date_to,
          search: filters.search,
          followed_only: filters.followed_only ? 'true' : undefined,
          related_entity_type: filters.related_entity_type,
          related_entity_id: filters.related_entity_id,
        })

        // Use supabase.functions.invoke for automatic auth handling
        const { data, error } = await supabase.functions.invoke<ActivityFeedResponse>(
          `activity-feed${queryParams}`,
          { method: 'GET' },
        )

        if (error) {
          throw new Error(error.message || 'Failed to fetch activities')
        }

        return data as ActivityFeedResponse
      },
      getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
      initialPageParam: undefined,
      enabled: isAuthenticated === true, // Only run when authenticated
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
    })

  const setFilters = useCallback((newFilters: ActivityFilters) => {
    setFiltersState(newFilters)
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  // Flatten pages into single activities array
  const activities: ActivityItem[] = data?.pages.flatMap((page) => page.activities) || []

  return {
    activities,
    isLoading: isLoading || isAuthenticated === null,
    isFetchingNextPage,
    hasNextPage: hasNextPage || false,
    error: error || null,
    fetchNextPage,
    refetch,
    filters,
    setFilters,
    clearFilters,
  }
}

// =============================================
// ENTITY FOLLOW HOOK
// =============================================

export function useEntityFollow(): UseEntityFollowReturn {
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()

  // Query for followed entities
  const {
    data: followingData,
    isLoading,
    error,
  } = useQuery<FollowingResponse, Error>({
    queryKey: ['entity-following'],
    queryFn: async () => {
      // Use supabase.functions.invoke for automatic auth handling
      const { data, error } = await supabase.functions.invoke<FollowingResponse>(
        'activity-feed/following',
        { method: 'GET' },
      )

      if (error) {
        throw new Error(error.message || 'Failed to fetch following')
      }

      return data as FollowingResponse
    },
    enabled: isAuthenticated === true, // Only run when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (request: FollowEntityRequest) => {
      const { data, error } = await supabase.functions.invoke('activity-feed/follow', {
        method: 'POST',
        body: request,
      })

      if (error) {
        throw new Error(error.message || 'Failed to follow entity')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-following'] })
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (request: UnfollowEntityRequest) => {
      const queryParams = buildQueryString({
        entity_type: request.entity_type,
        entity_id: request.entity_id,
      })

      const { data, error } = await supabase.functions.invoke(
        `activity-feed/follow${queryParams}`,
        { method: 'DELETE' },
      )

      if (error) {
        throw new Error(error.message || 'Failed to unfollow entity')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-following'] })
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })

  const following: EntityFollow[] = followingData?.following || []

  const isFollowing = useCallback(
    (entityType: ActivityEntityType, entityId: string): boolean => {
      return following.some((f) => f.entity_type === entityType && f.entity_id === entityId)
    },
    [following],
  )

  return {
    following,
    isLoading: isLoading || isAuthenticated === null,
    error: error || null,
    followEntity: followMutation.mutateAsync,
    unfollowEntity: unfollowMutation.mutateAsync,
    isFollowing,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
  }
}

// =============================================
// ACTIVITY PREFERENCES HOOK
// =============================================

export function useActivityPreferences(): UseActivityPreferencesReturn {
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()

  // Query for preferences
  const {
    data: preferencesData,
    isLoading,
    error,
  } = useQuery<{ preferences: ActivityFeedPreferences }, Error>({
    queryKey: ['activity-preferences'],
    queryFn: async () => {
      // Use supabase.functions.invoke for automatic auth handling
      const { data, error } = await supabase.functions.invoke<{
        preferences: ActivityFeedPreferences
      }>('activity-feed/preferences', { method: 'GET' })

      if (error) {
        throw new Error(error.message || 'Failed to fetch preferences')
      }

      return data as { preferences: ActivityFeedPreferences }
    },
    enabled: isAuthenticated === true, // Only run when authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (request: UpdatePreferencesRequest) => {
      const { data, error } = await supabase.functions.invoke('activity-feed/preferences', {
        method: 'PUT',
        body: request,
      })

      if (error) {
        throw new Error(error.message || 'Failed to update preferences')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-preferences'] })
    },
  })

  return {
    preferences: preferencesData?.preferences || null,
    isLoading: isLoading || isAuthenticated === null,
    error: error || null,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

// =============================================
// FOLLOWED ACTIVITIES HOOK
// =============================================

export function useFollowedActivities(): UseActivityFeedReturn {
  return useActivityFeed({ followed_only: true })
}
