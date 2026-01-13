import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEffect, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

// Types
export type NotificationCategory =
  | 'assignments'
  | 'intake'
  | 'calendar'
  | 'signals'
  | 'mentions'
  | 'deadlines'
  | 'system'
  | 'workflow'

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  category: NotificationCategory
  data: Record<string, unknown>
  read: boolean
  read_at: string | null
  priority: NotificationPriority
  action_url: string | null
  source_type: string | null
  source_id: string | null
  push_sent: boolean
  email_sent: boolean
  digest_included: boolean
  created_at: string
  expires_at: string | null
  updated_at: string
}

export interface NotificationCounts {
  total: number
  byCategory: Record<NotificationCategory, { total: number; unread: number }>
}

export interface CategoryPreference {
  id?: string
  user_id?: string
  category: NotificationCategory
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  sms_enabled: boolean
  sound_enabled: boolean
  priority_override?: NotificationPriority
  custom_sound?: string
}

export interface PushDevice {
  id: string
  device_token: string
  platform: 'ios' | 'android' | 'web'
  device_name: string | null
  provider: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface NotificationFilters {
  category?: NotificationCategory
  unreadOnly?: boolean
}

// Query keys
const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...NOTIFICATION_KEYS.lists(), filters] as const,
  counts: () => [...NOTIFICATION_KEYS.all, 'counts'] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, 'preferences'] as const,
  devices: () => [...NOTIFICATION_KEYS.all, 'devices'] as const,
}

// Hook for fetching paginated notifications
export function useNotifications(filters: NotificationFilters = {}) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.list(filters),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.unreadOnly) params.set('unreadOnly', 'true')
      if (pageParam) params.set('cursor', pageParam)
      params.set('limit', '20')

      const response = await supabase.functions.invoke('notifications-center', {
        body: null,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Fallback to direct query if Edge Function not available
      if (response.error) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .or('expires_at.is.null,expires_at.gt.now()')
          .order('created_at', { ascending: false })
          .limit(20)

        if (filters.category) {
          query = query.eq('category', filters.category)
        }

        if (filters.unreadOnly) {
          query = query.eq('read', false)
        }

        if (pageParam) {
          query = query.lt('created_at', pageParam)
        }

        const { data, error } = await query
        if (error) throw error

        const nextCursor = data && data.length === 20 ? data[data.length - 1].created_at : null

        return {
          notifications: data as Notification[],
          nextCursor,
          hasMore: data?.length === 20,
        }
      }

      return response.data as {
        notifications: Notification[]
        nextCursor: string | null
        hasMore: boolean
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
  })
}

// Hook for notification counts
export function useNotificationCounts() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.counts(),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try RPC function first
      const { data, error } = await supabase.rpc('get_notification_counts', {
        p_user_id: user.id,
      })

      if (error) {
        // Fallback to simple count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)
          .or('expires_at.is.null,expires_at.gt.now()')

        return {
          total: count || 0,
          byCategory: {} as Record<NotificationCategory, { total: number; unread: number }>,
        }
      }

      // Transform data
      const byCategory: Record<NotificationCategory, { total: number; unread: number }> = {} as any
      let total = 0

      for (const row of data || []) {
        byCategory[row.category as NotificationCategory] = {
          total: row.total_count,
          unread: row.unread_count,
        }
        total += row.unread_count
      }

      return { total, byCategory }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Hook for marking notifications as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      notificationIds?: string[]
      category?: NotificationCategory
      markAll?: boolean
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (params.markAll) {
        const { data, error } = await supabase.rpc('mark_category_as_read', {
          p_user_id: user.id,
          p_category: params.category || null,
        })

        if (error) throw error
        return { marked: data }
      }

      if (params.notificationIds && params.notificationIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('id', params.notificationIds)

        if (error) throw error
        return { marked: params.notificationIds.length }
      }

      throw new Error('No notifications specified')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

// Hook for deleting a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

// Hook for category preferences
export function useCategoryPreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('notification_category_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (error && error.code !== 'PGRST116') throw error
      return (data || []) as CategoryPreference[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (preferences: CategoryPreference[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const pref of preferences) {
        const { error } = await supabase.from('notification_category_preferences').upsert(
          {
            user_id: user.id,
            category: pref.category,
            email_enabled: pref.email_enabled,
            push_enabled: pref.push_enabled,
            in_app_enabled: pref.in_app_enabled,
            sms_enabled: pref.sms_enabled,
            sound_enabled: pref.sound_enabled,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,category',
          },
        )

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences() })
    },
  })

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}

// Hook for push device tokens
export function usePushDevices() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.devices(),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('push_device_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data as PushDevice[]
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (params: {
      deviceToken: string
      platform: 'ios' | 'android' | 'web'
      deviceName?: string
      provider?: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('push_device_tokens').upsert(
        {
          user_id: user.id,
          device_token: params.deviceToken,
          platform: params.platform,
          device_name: params.deviceName,
          provider: params.provider || 'expo',
          is_active: true,
          last_used_at: new Date().toISOString(),
          failed_attempts: 0,
          last_error: null,
        },
        {
          onConflict: 'user_id,device_token',
        },
      )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices() })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (deviceToken: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('push_device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('device_token', deviceToken)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices() })
    },
  })

  return {
    devices: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    registerDevice: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    removeDevice: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  }
}

// Hook for real-time notification updates
export function useNotificationRealtime(onNewNotification?: (notification: Notification) => void) {
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })

            // Call callback if provided
            if (onNewNotification && payload.new) {
              onNewNotification(payload.new as Notification)
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
          },
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [queryClient, onNewNotification])
}

// Combined hook for notification center
export function useNotificationCenter(filters: NotificationFilters = {}) {
  const notifications = useNotifications(filters)
  const counts = useNotificationCounts()
  const markAsRead = useMarkAsRead()
  const deleteNotification = useDeleteNotification()

  // Flatten paginated notifications
  const allNotifications = notifications.data?.pages.flatMap((page) => page.notifications) || []

  return {
    // Notifications data
    notifications: allNotifications,
    isLoading: notifications.isLoading,
    isError: notifications.isError,
    error: notifications.error,
    hasNextPage: notifications.hasNextPage,
    isFetchingNextPage: notifications.isFetchingNextPage,
    fetchNextPage: notifications.fetchNextPage,
    refetch: notifications.refetch,

    // Counts
    unreadCount: counts.data?.total || 0,
    countsByCategory: counts.data?.byCategory || {},

    // Actions
    markAsRead: markAsRead.mutate,
    isMarkingAsRead: markAsRead.isPending,
    deleteNotification: deleteNotification.mutate,
    isDeleting: deleteNotification.isPending,
  }
}
