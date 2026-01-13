/**
 * Activity Feed Hooks
 *
 * TanStack Query hooks for:
 * - Fetching activity feed with filters and pagination
 * - Following/unfollowing entities
 * - Managing user preferences
 */

import { useCallback, useState } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
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

// API Base URL
const getApiUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/functions/v1/activity-feed`
}

// =============================================
// ACTIVITY FEED HOOK
// =============================================

export function useActivityFeed(initialFilters?: ActivityFilters): UseActivityFeedReturn {
  const supabase = createClient()
  const [filters, setFiltersState] = useState<ActivityFilters>(initialFilters || {})

  const queryKey = ['activity-feed', filters]

  const { data, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useInfiniteQuery<ActivityFeedResponse, Error>({
      queryKey,
      queryFn: async ({ pageParam }) => {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }

        // Build query params
        const params = new URLSearchParams()

        if (pageParam) {
          params.set('cursor', pageParam as string)
        }

        params.set('limit', '20')

        if (filters.entity_types?.length) {
          params.set('entity_types', filters.entity_types.join(','))
        }

        if (filters.action_types?.length) {
          params.set('action_types', filters.action_types.join(','))
        }

        if (filters.actor_id) {
          params.set('actor_id', filters.actor_id)
        }

        if (filters.date_from) {
          params.set('date_from', filters.date_from)
        }

        if (filters.date_to) {
          params.set('date_to', filters.date_to)
        }

        if (filters.search) {
          params.set('search', filters.search)
        }

        if (filters.followed_only) {
          params.set('followed_only', 'true')
        }

        if (filters.related_entity_type) {
          params.set('related_entity_type', filters.related_entity_type)
        }

        if (filters.related_entity_id) {
          params.set('related_entity_id', filters.related_entity_id)
        }

        const response = await fetch(`${getApiUrl()}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch activities')
        }

        return response.json()
      },
      getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
      initialPageParam: undefined,
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
    isLoading,
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
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Query for followed entities
  const {
    data: followingData,
    isLoading,
    error,
  } = useQuery<FollowingResponse, Error>({
    queryKey: ['entity-following'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/following`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch following')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (request: FollowEntityRequest) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to follow entity')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-following'] })
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (request: UnfollowEntityRequest) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams({
        entity_type: request.entity_type,
        entity_id: request.entity_id,
      })

      const response = await fetch(`${getApiUrl()}/follow?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unfollow entity')
      }

      return response.json()
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
    isLoading,
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
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Query for preferences
  const {
    data: preferencesData,
    isLoading,
    error,
  } = useQuery<{ preferences: ActivityFeedPreferences }, Error>({
    queryKey: ['activity-preferences'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/preferences`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch preferences')
      }

      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (request: UpdatePreferencesRequest) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${getApiUrl()}/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update preferences')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-preferences'] })
    },
  })

  return {
    preferences: preferencesData?.preferences || null,
    isLoading,
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
