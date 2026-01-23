/**
 * MoU Notifications Hook
 *
 * Manages MoU notification preferences, queue, and history.
 * Provides methods for:
 * - Getting/updating notification preferences
 * - Viewing queued and sent notifications
 * - Getting notification summary statistics
 *
 * Feature: mou-notification-hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types
export type MouNotificationType =
  | 'deliverable_due_soon'
  | 'deliverable_overdue'
  | 'deliverable_completed'
  | 'milestone_completed'
  | 'expiration_warning'
  | 'mou_expired'
  | 'renewal_initiated'
  | 'renewal_approved'
  | 'renewal_completed'
  | 'workflow_state_change'
  | 'health_score_drop'
  | 'assignment_change'

export type BatchFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly'

export interface MouNotificationPreferences {
  id: string
  user_id: string

  // Global toggle
  mou_notifications_enabled: boolean

  // Deliverable notifications
  deliverable_due_soon_enabled: boolean
  deliverable_due_soon_days: number[]
  deliverable_overdue_enabled: boolean
  deliverable_completed_enabled: boolean

  // Milestone notifications
  milestone_completed_enabled: boolean

  // Expiration notifications
  expiration_warning_enabled: boolean
  expiration_warning_days: number[]
  mou_expired_enabled: boolean

  // Renewal notifications
  renewal_initiated_enabled: boolean
  renewal_approved_enabled: boolean
  renewal_completed_enabled: boolean

  // Workflow notifications
  workflow_state_change_enabled: boolean

  // Health notifications
  health_score_drop_enabled: boolean
  health_score_drop_threshold: number

  // Assignment notifications
  assignment_change_enabled: boolean

  // Channel preferences
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean

  // Batching preferences
  batch_notifications: boolean
  batch_frequency: BatchFrequency
  batch_delivery_time: string
  batch_delivery_day: number

  // Quiet hours
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string

  // Timestamps
  created_at: string
  updated_at: string
}

export interface QueuedNotification {
  id: string
  user_id: string
  notification_type: MouNotificationType
  mou_id: string | null
  deliverable_id: string | null
  milestone_id: string | null
  renewal_id: string | null
  title_en: string
  title_ar: string
  message_en: string
  message_ar: string
  data: Record<string, unknown>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url: string | null
  status: 'pending' | 'batched' | 'sent' | 'failed' | 'cancelled'
  scheduled_for: string
  sent_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

export interface NotificationLogEntry {
  id: string
  queue_id: string | null
  user_id: string
  notification_type: MouNotificationType
  mou_id: string | null
  deliverable_id: string | null
  sent_via_email: boolean
  sent_via_push: boolean
  sent_via_in_app: boolean
  email_opened: boolean
  email_clicked: boolean
  push_clicked: boolean
  in_app_read: boolean
  in_app_read_at: string | null
  sent_at: string
}

export interface NotificationSummary {
  pending_notifications: number
  unread_notifications: number
  notifications_today: number
  notifications_this_week: number
  deliverables_due_soon: number
  overdue_deliverables: number
}

export interface PreferencesUpdateInput {
  mou_notifications_enabled?: boolean
  deliverable_due_soon_enabled?: boolean
  deliverable_due_soon_days?: number[]
  deliverable_overdue_enabled?: boolean
  deliverable_completed_enabled?: boolean
  milestone_completed_enabled?: boolean
  expiration_warning_enabled?: boolean
  expiration_warning_days?: number[]
  mou_expired_enabled?: boolean
  renewal_initiated_enabled?: boolean
  renewal_approved_enabled?: boolean
  renewal_completed_enabled?: boolean
  workflow_state_change_enabled?: boolean
  health_score_drop_enabled?: boolean
  health_score_drop_threshold?: number
  assignment_change_enabled?: boolean
  email_enabled?: boolean
  push_enabled?: boolean
  in_app_enabled?: boolean
  batch_notifications?: boolean
  batch_frequency?: BatchFrequency
  batch_delivery_time?: string
  batch_delivery_day?: number
  quiet_hours_enabled?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

// Query keys
const MOU_NOTIFICATION_KEYS = {
  all: ['mou-notifications'] as const,
  preferences: () => [...MOU_NOTIFICATION_KEYS.all, 'preferences'] as const,
  summary: () => [...MOU_NOTIFICATION_KEYS.all, 'summary'] as const,
  queue: (status?: string) => [...MOU_NOTIFICATION_KEYS.all, 'queue', status] as const,
  history: (filters?: Record<string, string>) =>
    [...MOU_NOTIFICATION_KEYS.all, 'history', filters] as const,
}

/**
 * Hook for fetching MoU notification preferences
 */
export function useMouNotificationPreferences() {
  return useQuery({
    queryKey: MOU_NOTIFICATION_KEYS.preferences(),
    queryFn: async (): Promise<MouNotificationPreferences> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First try Edge Function
      const response = await supabase.functions.invoke('mou-notifications/preferences', {
        method: 'GET',
      })

      if (response.data?.preferences) {
        return response.data.preferences
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from('mou_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Create default preferences if not exists
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('mou_notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (insertError) throw insertError
        return newPrefs as MouNotificationPreferences
      }

      return data as MouNotificationPreferences
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for updating MoU notification preferences
 */
export function useUpdateMouNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PreferencesUpdateInput): Promise<MouNotificationPreferences> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate inputs
      if (input.health_score_drop_threshold !== undefined) {
        if (input.health_score_drop_threshold < 5 || input.health_score_drop_threshold > 50) {
          throw new Error('health_score_drop_threshold must be between 5 and 50')
        }
      }

      if (input.batch_delivery_day !== undefined) {
        if (input.batch_delivery_day < 0 || input.batch_delivery_day > 6) {
          throw new Error('batch_delivery_day must be between 0 (Sunday) and 6 (Saturday)')
        }
      }

      // Try Edge Function first
      const response = await supabase.functions.invoke('mou-notifications/preferences', {
        method: 'PATCH',
        body: input,
      })

      if (response.data?.preferences) {
        return response.data.preferences
      }

      // Fallback to direct upsert
      const { data, error } = await supabase
        .from('mou_notification_preferences')
        .upsert(
          {
            user_id: user.id,
            ...input,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          },
        )
        .select()
        .single()

      if (error) throw error
      return data as MouNotificationPreferences
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOU_NOTIFICATION_KEYS.preferences() })
    },
  })
}

/**
 * Hook for fetching notification summary
 */
export function useMouNotificationSummary() {
  return useQuery({
    queryKey: MOU_NOTIFICATION_KEYS.summary(),
    queryFn: async (): Promise<NotificationSummary> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try Edge Function first
      const response = await supabase.functions.invoke('mou-notifications/summary', {
        method: 'GET',
      })

      if (response.data?.summary) {
        return response.data.summary
      }

      // Fallback to RPC
      const { data, error } = await supabase.rpc('get_user_mou_notification_summary', {
        p_user_id: user.id,
      })

      if (error) throw error

      return (
        data?.[0] || {
          pending_notifications: 0,
          unread_notifications: 0,
          notifications_today: 0,
          notifications_this_week: 0,
          deliverables_due_soon: 0,
          overdue_deliverables: 0,
        }
      )
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Hook for fetching queued notifications
 */
export function useMouNotificationQueue(
  options: {
    status?: 'pending' | 'batched' | 'sent' | 'failed' | 'all'
    limit?: number
    offset?: number
    enabled?: boolean
  } = {},
) {
  const { status = 'pending', limit = 20, offset = 0, enabled = true } = options

  return useQuery({
    queryKey: MOU_NOTIFICATION_KEYS.queue(status),
    queryFn: async (): Promise<{ notifications: QueuedNotification[]; total: number }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try Edge Function first
      const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset) })
      const response = await supabase.functions.invoke(`mou-notifications/queue?${params}`, {
        method: 'GET',
      })

      if (response.data?.notifications) {
        return {
          notifications: response.data.notifications,
          total: response.data.total,
        }
      }

      // Fallback to direct query
      let query = supabase
        .from('mou_notification_queue')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true })
        .range(offset, offset + limit - 1)

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        notifications: data as QueuedNotification[],
        total: count || 0,
      }
    },
    enabled,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook for fetching notification history
 */
export function useMouNotificationHistory(
  options: {
    type?: MouNotificationType
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
    enabled?: boolean
  } = {},
) {
  const { type, startDate, endDate, limit = 20, offset = 0, enabled = true } = options

  return useQuery({
    queryKey: MOU_NOTIFICATION_KEYS.history({ type, startDate, endDate }),
    queryFn: async (): Promise<{ notifications: NotificationLogEntry[]; total: number }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Build query
      let query = supabase
        .from('mou_notification_log')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type) {
        query = query.eq('notification_type', type)
      }

      if (startDate) {
        query = query.gte('sent_at', startDate)
      }

      if (endDate) {
        query = query.lte('sent_at', endDate)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        notifications: data as NotificationLogEntry[],
        total: count || 0,
      }
    },
    enabled,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Combined hook for MoU notification management
 */
export function useMouNotifications() {
  const preferences = useMouNotificationPreferences()
  const summary = useMouNotificationSummary()
  const updatePreferences = useUpdateMouNotificationPreferences()

  return {
    // Preferences
    preferences: preferences.data,
    isLoadingPreferences: preferences.isLoading,
    preferencesError: preferences.error,

    // Summary
    summary: summary.data,
    isLoadingSummary: summary.isLoading,
    summaryError: summary.error,

    // Actions
    updatePreferences: updatePreferences.mutate,
    updatePreferencesAsync: updatePreferences.mutateAsync,
    isUpdatingPreferences: updatePreferences.isPending,

    // Utilities
    refetchPreferences: preferences.refetch,
    refetchSummary: summary.refetch,
  }
}

// Default export
export default useMouNotifications
