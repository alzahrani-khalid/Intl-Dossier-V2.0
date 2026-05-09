import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types
export interface EmailNotificationPreferences {
  id: string
  user_id: string
  email_notifications_enabled: boolean
  preferred_language: 'en' | 'ar'
  ticket_created: boolean
  ticket_updated: boolean
  ticket_assigned: boolean
  ticket_resolved: boolean
  ticket_closed: boolean
  comment_added: boolean
  comment_mention: boolean
  status_change: boolean
  priority_change: boolean
  sla_warning: boolean
  sla_breach: boolean
  daily_digest_enabled: boolean
  daily_digest_time: string
  weekly_digest_enabled: boolean
  weekly_digest_day: number
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  quiet_hours_timezone: string
  channel_preferences: Record<string, string[]>
  created_at: string
  updated_at: string
}

export interface EmailThread {
  id: string
  thread_id: string
  subject: string
  ticket_id: string | null
  from_email: string
  from_name: string | null
  to_emails: string[]
  cc_emails: string[]
  message_count: number
  last_message_at: string
  last_message_direction: 'inbound' | 'outbound'
  auto_reply_sent: boolean
  auto_reply_sent_at: string | null
  is_processed: boolean
  processing_error: string | null
  created_at: string
  updated_at: string
  messages?: EmailMessage[]
}

export interface EmailMessage {
  id: string
  thread_id: string
  message_id: string
  in_reply_to: string | null
  references_ids: string[]
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked'
  subject: string
  body_text: string | null
  body_html: string | null
  from_email: string
  from_name: string | null
  to_emails: string[]
  cc_emails: string[]
  bcc_emails: string[]
  reply_to: string | null
  attachment_ids: string[]
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  bounce_reason: string | null
  retry_count: number
  next_retry_at: string | null
  last_error: string | null
  headers: Record<string, string>
  raw_email: string | null
  created_at: string
  updated_at: string
}

export interface EmailTemplate {
  id: string
  template_type: string
  name: string
  description: string | null
  subject_en: string
  body_html_en: string
  body_text_en: string | null
  subject_ar: string
  body_html_ar: string
  body_text_ar: string | null
  available_variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Hook for email notification preferences
export function useEmailPreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['emailPreferences'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('email_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no preferences exist, return defaults
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as EmailNotificationPreferences
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (preferences: Partial<EmailNotificationPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('email_notification_preferences').upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailPreferences'] })
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

// Hook for email threads by ticket
// Hook for a single email thread
// Hook for email templates
// Hook for sending emails
// Hook for ticket comments
export interface TicketComment {
  id: string
  ticket_id: string
  user_id: string | null
  external_email: string | null
  external_name: string | null
  content: string
  content_ar: string | null
  source: 'web' | 'email' | 'api' | 'system'
  email_message_id: string | null
  is_internal: boolean
  is_system: boolean
  mentioned_user_ids: string[]
  attachment_ids: string[]
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    raw_user_meta_data: Record<string, any>
  }
}

// Hook to unsubscribe using token
