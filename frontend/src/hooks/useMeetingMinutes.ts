/**
 * Meeting Minutes Hook
 * Feature: meeting-minutes-capture
 *
 * TanStack Query hooks for meeting minutes CRUD operations,
 * attendee management, action items, and AI features.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  MeetingMinutes,
  MeetingMinutesFull,
  MeetingMinutesFilters,
  MeetingMinutesListResponse,
  CreateMeetingMinutesInput,
  UpdateMeetingMinutesInput,
  AddAttendeeInput,
  AddActionItemInput,
  UpdateActionItemInput,
  MeetingAttendee,
  MeetingActionItem,
  meetingMinutesKeys,
} from '@/types/meeting-minutes.types'

const EDGE_FUNCTION_URL = 'meeting-minutes'

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch meeting minutes list with filters
 */
export function useMeetingMinutesList(filters?: MeetingMinutesFilters) {
  return useQuery({
    queryKey: ['meeting-minutes', 'list', filters],
    queryFn: async (): Promise<MeetingMinutesListResponse> => {
      const params = new URLSearchParams()
      params.append('endpoint', 'list')

      if (filters?.search) params.append('search', filters.search)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.dossier_id) params.append('dossier_id', filters.dossier_id)
      if (filters?.engagement_id) params.append('engagement_id', filters.engagement_id)
      if (filters?.from_date) params.append('from_date', filters.from_date)
      if (filters?.to_date) params.append('to_date', filters.to_date)
      if (filters?.created_by) params.append('created_by', filters.created_by)

      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      })

      // Workaround: Edge functions don't support GET with query params well
      // So we'll use direct RPC call
      const { data: rpcData, error: rpcError } = await supabase.rpc('search_meeting_minutes', {
        p_search_term: filters?.search || null,
        p_status: filters?.status || null,
        p_dossier_id: filters?.dossier_id || null,
        p_engagement_id: filters?.engagement_id || null,
        p_from_date: filters?.from_date || null,
        p_to_date: filters?.to_date || null,
        p_created_by: filters?.created_by || null,
        p_limit: 50,
        p_offset: 0,
      })

      if (rpcError) throw rpcError

      return {
        items: rpcData || [],
        hasMore: (rpcData?.length || 0) === 50,
        limit: 50,
        offset: 0,
      }
    },
  })
}

/**
 * Fetch single meeting minutes with full details
 */
export function useMeetingMinutesDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting-minutes', 'detail', id],
    queryFn: async (): Promise<MeetingMinutesFull | null> => {
      if (!id) return null

      const { data, error } = await supabase.rpc('get_meeting_minutes_full', {
        p_minutes_id: id,
      })

      if (error) throw error
      return data as MeetingMinutesFull
    },
    enabled: !!id,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new meeting minutes
 */
export function useCreateMeetingMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingMinutesInput): Promise<MeetingMinutes> => {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .insert({
          ...input,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as MeetingMinutes
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'list'] })
    },
  })
}

/**
 * Update meeting minutes
 */
export function useUpdateMeetingMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: UpdateMeetingMinutesInput
    }): Promise<MeetingMinutes> => {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MeetingMinutes
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'detail', data.id] })
    },
  })
}

/**
 * Delete meeting minutes (soft delete)
 */
export function useDeleteMeetingMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('meeting_minutes')
        .update({
          deleted_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'list'] })
    },
  })
}

/**
 * Approve meeting minutes
 */
export function useApproveMeetingMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<MeetingMinutes> => {
      const user = (await supabase.auth.getUser()).data.user
      const { data, error } = await supabase
        .from('meeting_minutes')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MeetingMinutes
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', 'detail', data.id] })
    },
  })
}

// ============================================
// Attendee Mutations
// ============================================

/**
 * Add attendee to meeting
 */
export function useAddAttendee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddAttendeeInput): Promise<MeetingAttendee> => {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as MeetingAttendee
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meeting_minutes_id],
      })
    },
  })
}

/**
 * Update attendee
 */
export function useUpdateAttendee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      meetingMinutesId,
      updates,
    }: {
      id: string
      meetingMinutesId: string
      updates: Partial<MeetingAttendee>
    }): Promise<MeetingAttendee> => {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MeetingAttendee
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meetingMinutesId],
      })
    },
  })
}

/**
 * Remove attendee
 */
export function useRemoveAttendee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      meetingMinutesId,
    }: {
      id: string
      meetingMinutesId: string
    }): Promise<void> => {
      const { error } = await supabase.from('meeting_attendees').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meetingMinutesId],
      })
    },
  })
}

// ============================================
// Action Item Mutations
// ============================================

/**
 * Add action item to meeting
 */
export function useAddActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddActionItemInput): Promise<MeetingActionItem> => {
      const { data, error } = await supabase
        .from('meeting_action_items')
        .insert({
          ...input,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as MeetingActionItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meeting_minutes_id],
      })
    },
  })
}

/**
 * Update action item
 */
export function useUpdateActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      meetingMinutesId,
      updates,
    }: {
      id: string
      meetingMinutesId: string
      updates: UpdateActionItemInput
    }): Promise<MeetingActionItem> => {
      const { data, error } = await supabase
        .from('meeting_action_items')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MeetingActionItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meetingMinutesId],
      })
    },
  })
}

/**
 * Remove action item
 */
export function useRemoveActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      meetingMinutesId,
    }: {
      id: string
      meetingMinutesId: string
    }): Promise<void> => {
      const { error } = await supabase.from('meeting_action_items').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meetingMinutesId],
      })
    },
  })
}

/**
 * Convert action item to commitment
 */
export function useConvertActionItemToCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      actionItemId,
      dossierId,
      meetingMinutesId,
    }: {
      actionItemId: string
      dossierId: string
      meetingMinutesId: string
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('create_commitment_from_action_item', {
        p_action_item_id: actionItemId,
        p_dossier_id: dossierId,
      })

      if (error) throw error
      return data as string
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.meetingMinutesId],
      })
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
    },
  })
}

// ============================================
// AI Feature Mutations
// ============================================

/**
 * Generate AI summary for meeting minutes
 */
export function useGenerateAISummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (minutesId: string): Promise<string> => {
      // Get meeting minutes data
      const { data: minutesData } = await supabase.rpc('get_meeting_minutes_full', {
        p_minutes_id: minutesId,
      })

      if (!minutesData) throw new Error('Meeting minutes not found')

      // Build context for summary
      const context = {
        title: minutesData.minutes.title_en,
        date: minutesData.minutes.meeting_date,
        attendees: minutesData.attendees
          ?.map((a: { name_en: string; role: string }) => `${a.name_en} (${a.role})`)
          .join(', '),
        summary: minutesData.minutes.summary_en,
        decisions: minutesData.minutes.decisions,
        actionItems: minutesData.action_items
          ?.map(
            (ai: { title_en: string; assignee_name_en: string }) =>
              `${ai.title_en} - ${ai.assignee_name_en || 'Unassigned'}`,
          )
          .join('; '),
      }

      // Generate summary (placeholder - replace with actual AI call)
      const aiSummary = `Meeting Summary: ${context.title}\n\nDate: ${new Date(context.date).toLocaleDateString()}\nAttendees: ${context.attendees || 'Not recorded'}\n\nKey Points:\n${context.summary || 'No summary provided'}\n\nAction Items: ${context.actionItems || 'None recorded'}`

      // Update with AI summary
      const { error } = await supabase
        .from('meeting_minutes')
        .update({
          ai_summary_en: aiSummary,
          ai_generated_at: new Date().toISOString(),
          ai_model_version: 'v1-placeholder',
          ai_confidence: 0.85,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', minutesId)

      if (error) throw error
      return aiSummary
    },
    onSuccess: (_, minutesId) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', minutesId],
      })
    },
  })
}

/**
 * Extract action items from text using AI
 */
export function useExtractActionItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      minutesId,
      text,
    }: {
      minutesId: string
      text: string
    }): Promise<{
      extracted_count: number
      items: Array<{ title_en: string; assignee_name_en?: string }>
    }> => {
      // Simple regex-based extraction (placeholder - replace with AI)
      const actionPatterns = [
        /(?:action|todo|task|follow[- ]?up):\s*(.+?)(?:\.|$)/gi,
        /(.+?)\s+(?:will|should|must|needs? to)\s+(.+?)(?:\.|$)/gi,
      ]

      const extractedItems: Array<{
        title_en: string
        assignee_name_en?: string
        ai_confidence: number
      }> = []

      for (const pattern of actionPatterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
          extractedItems.push({
            title_en: (match[2] || match[1]).trim(),
            assignee_name_en: match[1]?.includes('will') ? undefined : match[1]?.trim(),
            ai_confidence: 0.7,
          })
        }
      }

      // Insert extracted items
      if (extractedItems.length > 0) {
        const user = (await supabase.auth.getUser()).data.user
        const itemsToInsert = extractedItems.map((item, index) => ({
          meeting_minutes_id: minutesId,
          title_en: item.title_en,
          assignee_name_en: item.assignee_name_en,
          ai_extracted: true,
          ai_confidence: item.ai_confidence,
          source_text: text,
          sort_order: index,
          created_by: user?.id,
        }))

        await supabase.from('meeting_action_items').insert(itemsToInsert)
      }

      return {
        extracted_count: extractedItems.length,
        items: extractedItems,
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting-minutes', 'detail', variables.minutesId],
      })
    },
  })
}
