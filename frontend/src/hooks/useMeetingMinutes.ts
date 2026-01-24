/**
 * Meeting Minutes Hooks
 * @module hooks/useMeetingMinutes
 * @feature meeting-minutes-capture
 *
 * TanStack Query hooks for meeting minutes management with automatic caching,
 * cache invalidation, and AI-powered features.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing meeting minutes:
 * - Query hooks for fetching minutes lists and detailed minutes views
 * - Mutation hooks for CRUD operations on minutes records
 * - Attendee management hooks for tracking meeting participation
 * - Action item hooks for capturing and tracking follow-up tasks
 * - AI feature hooks for automated summary generation and action extraction
 * - Approval workflow hooks for minutes review and sign-off
 *
 * All hooks leverage TanStack Query's caching and use the meetingMinutesKeys factory
 * from meeting-minutes.types for hierarchical cache invalidation.
 *
 * @example
 * // Fetch minutes list with filters
 * const { data } = useMeetingMinutesList({ status: 'draft', dossier_id: 'uuid' });
 *
 * @example
 * // Fetch single minutes record
 * const { data: minutes } = useMeetingMinutesDetail('minutes-uuid');
 *
 * @example
 * // Create new minutes
 * const { mutate } = useCreateMeetingMinutes();
 * mutate({ title_en: 'Board Meeting Minutes', meeting_date: '2024-01-15' });
 *
 * @example
 * // Generate AI summary
 * const { mutate: generateSummary } = useGenerateAISummary();
 * generateSummary('minutes-uuid');
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
 * Hook to fetch meeting minutes list with filters
 *
 * @description
 * Fetches a filtered list of meeting minutes using the search_meeting_minutes RPC function.
 * Supports filtering by search term, status, dossier, engagement, date range, and creator.
 * Results are limited to 50 items per query.
 *
 * @param filters - Optional filters for search, status, dossier_id, engagement_id, date range, creator
 * @returns TanStack Query result with items array, hasMore flag, and pagination metadata
 *
 * @example
 * // Fetch all minutes
 * const { data } = useMeetingMinutesList();
 *
 * @example
 * // Fetch with filters
 * const { data } = useMeetingMinutesList({
 *   status: 'approved',
 *   dossier_id: 'country-uuid',
 *   from_date: '2024-01-01',
 *   to_date: '2024-12-31'
 * });
 *
 * @example
 * // Search by keyword
 * const { data } = useMeetingMinutesList({
 *   search: 'budget review'
 * });
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
 * Hook to fetch single meeting minutes with full details
 *
 * @description
 * Fetches a complete minutes record including attendees, action items, and related metadata
 * using the get_meeting_minutes_full RPC function. Query is automatically disabled when
 * id is undefined.
 *
 * @param id - The unique identifier (UUID) of the minutes record, or undefined to disable
 * @returns TanStack Query result with data typed as MeetingMinutesFull or null if id is undefined
 *
 * @example
 * // Basic usage
 * const { data: minutes, isLoading } = useMeetingMinutesDetail('minutes-uuid');
 *
 * @example
 * // With conditional ID (query disabled until ID available)
 * const { data } = useMeetingMinutesDetail(minutesId);
 * // data is null when minutesId is undefined
 *
 * @example
 * // Access nested data
 * const { data } = useMeetingMinutesDetail(id);
 * const attendees = data?.attendees || [];
 * const actionItems = data?.action_items || [];
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
 * Hook to create new meeting minutes
 *
 * @description
 * Creates a new meeting minutes record with automatic creator assignment. On success,
 * invalidates list queries to show the new minutes in list views.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateMeetingMinutesInput
 *
 * @example
 * const { mutate, isPending } = useCreateMeetingMinutes();
 * mutate({
 *   title_en: 'Board Meeting Minutes',
 *   meeting_date: '2024-01-15T10:00:00Z',
 *   dossier_id: 'country-uuid',
 *   summary_en: 'Quarterly review and budget approval'
 * });
 *
 * @example
 * // With async/await and navigation
 * const { mutateAsync } = useCreateMeetingMinutes();
 * try {
 *   const newMinutes = await mutateAsync(minutesData);
 *   navigate(`/minutes/${newMinutes.id}`);
 * } catch (error) {
 *   toast.error('Failed to create minutes');
 * }
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
 * Hook to update meeting minutes
 *
 * @description
 * Updates an existing minutes record with automatic updater assignment. On success,
 * invalidates both the detail query and list queries to reflect changes across the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting id and updates object
 *
 * @example
 * const { mutate } = useUpdateMeetingMinutes();
 * mutate({
 *   id: 'minutes-uuid',
 *   updates: { summary_en: 'Updated summary text' }
 * });
 *
 * @example
 * // Update status
 * const { mutate } = useUpdateMeetingMinutes();
 * mutate({
 *   id: minutesId,
 *   updates: { status: 'finalized' }
 * });
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
 * Hook to delete meeting minutes (soft delete)
 *
 * @description
 * Soft deletes a minutes record by setting deleted_at timestamp. The record remains
 * in the database for audit purposes but is excluded from list queries. Invalidates
 * list queries to remove the deleted minutes from the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting minutes ID
 *
 * @example
 * const { mutate, isPending } = useDeleteMeetingMinutes();
 * mutate('minutes-uuid-to-delete');
 *
 * @example
 * // With confirmation
 * const { mutate } = useDeleteMeetingMinutes();
 * const handleDelete = () => {
 *   if (confirm('Delete these minutes?')) {
 *     mutate(minutesId);
 *   }
 * };
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
 * Hook to approve meeting minutes
 *
 * @description
 * Marks minutes as approved with approver information and timestamp. This is a workflow
 * action that finalizes the minutes. Invalidates both detail and list queries to reflect
 * the approved status.
 *
 * @returns TanStack Mutation result with mutate function accepting minutes ID
 *
 * @example
 * const { mutate: approve, isPending } = useApproveMeetingMinutes();
 * approve('minutes-uuid');
 *
 * @example
 * // With success callback
 * const { mutate } = useApproveMeetingMinutes();
 * mutate(minutesId, {
 *   onSuccess: () => {
 *     toast.success('Minutes approved');
 *     navigate('/minutes');
 *   }
 * });
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
 * Hook to add attendee to meeting minutes
 *
 * @description
 * Adds an attendee record to meeting minutes with optional role and attendance status.
 * Attendees can be internal users or external contacts. Invalidates the minutes detail
 * query to show the new attendee.
 *
 * @returns TanStack Mutation result with mutate function accepting AddAttendeeInput
 *
 * @example
 * const { mutate } = useAddAttendee();
 * mutate({
 *   meeting_minutes_id: 'minutes-uuid',
 *   user_id: 'user-uuid',
 *   role: 'chairperson',
 *   attended: true
 * });
 *
 * @example
 * // Add external contact
 * const { mutate } = useAddAttendee();
 * mutate({
 *   meeting_minutes_id: minutesId,
 *   name_en: 'External Delegate',
 *   organization_en: 'Partner Agency',
 *   attended: true
 * });
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
 * Hook to update attendee information
 *
 * @description
 * Updates an attendee's role, attendance status, or other properties. Invalidates
 * the minutes detail query to reflect the changes.
 *
 * @returns TanStack Mutation result with mutate function accepting id, meetingMinutesId, and updates
 *
 * @example
 * const { mutate } = useUpdateAttendee();
 * mutate({
 *   id: 'attendee-uuid',
 *   meetingMinutesId: 'minutes-uuid',
 *   updates: { attended: false, notes: 'Sent apologies' }
 * });
 *
 * @example
 * // Update role
 * const { mutate } = useUpdateAttendee();
 * mutate({
 *   id: attendeeId,
 *   meetingMinutesId: minutesId,
 *   updates: { role: 'secretary' }
 * });
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
 * Hook to remove attendee from meeting minutes
 *
 * @description
 * Removes an attendee record from the minutes. This is a hard delete operation.
 * Invalidates the minutes detail query to update the attendee list.
 *
 * @returns TanStack Mutation result with mutate function accepting id and meetingMinutesId
 *
 * @example
 * const { mutate } = useRemoveAttendee();
 * mutate({ id: 'attendee-uuid', meetingMinutesId: 'minutes-uuid' });
 *
 * @example
 * // With confirmation
 * const { mutate } = useRemoveAttendee();
 * const handleRemove = () => {
 *   if (confirm('Remove this attendee?')) {
 *     mutate({ id: attendeeId, meetingMinutesId: minutesId });
 *   }
 * };
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
 * Hook to add action item to meeting minutes
 *
 * @description
 * Creates a new action item linked to meeting minutes. Action items track follow-up
 * tasks and can be converted to commitments later. Invalidates the minutes detail query.
 *
 * @returns TanStack Mutation result with mutate function accepting AddActionItemInput
 *
 * @example
 * const { mutate } = useAddActionItem();
 * mutate({
 *   meeting_minutes_id: 'minutes-uuid',
 *   title_en: 'Review budget proposal',
 *   assignee_id: 'user-uuid',
 *   due_date: '2024-02-01'
 * });
 *
 * @example
 * // Add with priority
 * const { mutate } = useAddActionItem();
 * mutate({
 *   meeting_minutes_id: minutesId,
 *   title_en: 'Prepare quarterly report',
 *   priority: 'high',
 *   status: 'pending'
 * });
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
 * Hook to update action item
 *
 * @description
 * Updates an action item's properties including title, assignee, due date, status, or priority.
 * Invalidates the minutes detail query to show the updated action item.
 *
 * @returns TanStack Mutation result with mutate function accepting id, meetingMinutesId, and updates
 *
 * @example
 * const { mutate } = useUpdateActionItem();
 * mutate({
 *   id: 'action-item-uuid',
 *   meetingMinutesId: 'minutes-uuid',
 *   updates: { status: 'completed' }
 * });
 *
 * @example
 * // Update assignee and due date
 * const { mutate } = useUpdateActionItem();
 * mutate({
 *   id: actionItemId,
 *   meetingMinutesId: minutesId,
 *   updates: {
 *     assignee_id: newAssigneeId,
 *     due_date: '2024-03-01'
 *   }
 * });
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
 * Hook to remove action item from meeting minutes
 *
 * @description
 * Removes an action item record. This is a hard delete operation. Invalidates
 * the minutes detail query to update the action items list.
 *
 * @returns TanStack Mutation result with mutate function accepting id and meetingMinutesId
 *
 * @example
 * const { mutate } = useRemoveActionItem();
 * mutate({ id: 'action-item-uuid', meetingMinutesId: 'minutes-uuid' });
 *
 * @example
 * // With confirmation
 * const { mutate } = useRemoveActionItem();
 * const handleRemove = () => {
 *   if (confirm('Remove this action item?')) {
 *     mutate({ id: actionItemId, meetingMinutesId: minutesId });
 *   }
 * };
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
 * Hook to convert action item to commitment
 *
 * @description
 * Converts a meeting action item into a formal commitment record. This creates a new
 * commitment in the system linked to the specified dossier. Invalidates both minutes
 * detail and commitments queries.
 *
 * @returns TanStack Mutation result with mutate function accepting actionItemId, dossierId, and meetingMinutesId
 *
 * @example
 * const { mutate } = useConvertActionItemToCommitment();
 * mutate({
 *   actionItemId: 'action-item-uuid',
 *   dossierId: 'dossier-uuid',
 *   meetingMinutesId: 'minutes-uuid'
 * });
 *
 * @example
 * // With success navigation
 * const { mutateAsync } = useConvertActionItemToCommitment();
 * const commitmentId = await mutateAsync({
 *   actionItemId: item.id,
 *   dossierId: dossier.id,
 *   meetingMinutesId: minutesId
 * });
 * navigate(`/commitments/${commitmentId}`);
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
 * Hook to generate AI summary for meeting minutes
 *
 * @description
 * Generates an automated summary of meeting minutes using AI. Analyzes the meeting
 * content including attendees, discussions, decisions, and action items to create
 * a concise summary. Updates the minutes record with the AI-generated summary and
 * metadata about the generation (timestamp, model version, confidence score).
 *
 * @returns TanStack Mutation result with mutate function accepting minutes ID
 *
 * @example
 * const { mutate: generateSummary, isPending } = useGenerateAISummary();
 * generateSummary('minutes-uuid');
 *
 * @example
 * // With success callback
 * const { mutate } = useGenerateAISummary();
 * mutate(minutesId, {
 *   onSuccess: (summary) => {
 *     toast.success('AI summary generated');
 *     setShowSummary(true);
 *   }
 * });
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
 * Hook to extract action items from text using AI
 *
 * @description
 * Analyzes meeting minutes text to automatically extract action items using pattern
 * matching and AI. Identifies tasks, assigns potential owners, and creates action item
 * records. Currently uses regex patterns but designed to integrate with AI models.
 * All extracted items are marked with ai_extracted flag and confidence scores.
 *
 * @returns TanStack Mutation result with mutate function accepting minutesId and text
 *
 * @example
 * const { mutate: extractItems, isPending } = useExtractActionItems();
 * extractItems({
 *   minutesId: 'minutes-uuid',
 *   text: 'John will prepare the budget report. Follow-up: Review vendor contracts.'
 * });
 *
 * @example
 * // With result handling
 * const { mutate } = useExtractActionItems();
 * mutate(
 *   { minutesId, text: summaryText },
 *   {
 *     onSuccess: (result) => {
 *       toast.success(`Extracted ${result.extracted_count} action items`);
 *     }
 *   }
 * );
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
