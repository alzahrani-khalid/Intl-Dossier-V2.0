/**
 * Meeting Agenda Hooks
 * @module hooks/useMeetingAgenda
 * @feature meeting-agenda-builder
 *
 * TanStack Query hooks for meeting agenda management with automatic caching,
 * cache invalidation, optimistic updates, and real-time timing synchronization.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing meeting agendas:
 * - Query hooks for fetching agendas, timing data, and templates
 * - Mutation hooks for CRUD operations on agendas and agenda items
 * - Meeting control hooks for starting/ending meetings and tracking items
 * - Participant management hooks for RSVP and attendance tracking
 * - Document linking hooks for meeting materials
 * - Real-time timing hooks with automatic refresh during active meetings
 * - Drag-and-drop utilities for agenda item reordering
 *
 * All hooks leverage TanStack Query's caching and the agendaKeys factory from
 * meeting-agenda.types for hierarchical cache invalidation.
 *
 * @example
 * // Fetch agenda list with filters
 * const { data } = useAgendas({ status: 'scheduled', limit: 20 });
 *
 * @example
 * // Fetch single agenda with details
 * const { data: agenda } = useAgenda('agenda-uuid');
 *
 * @example
 * // Create new agenda
 * const { mutate } = useCreateAgenda();
 * mutate({ title_en: 'Board Meeting', meeting_date: '2024-01-15', duration_minutes: 90 });
 *
 * @example
 * // Start meeting and track timing
 * const { mutate: startMeeting } = useStartMeeting();
 * const { data: timing } = useLiveMeetingTiming(agendaId, true);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AgendaFull,
  AgendaListItem,
  AgendaFilters,
  AgendaTiming,
  MeetingAgenda,
  AgendaItem,
  AgendaParticipant,
  AgendaDocument,
  CreateAgendaInput,
  UpdateAgendaInput,
  CreateAgendaItemInput,
  UpdateAgendaItemInput,
  AddParticipantInput,
  UpdateRsvpInput,
  AddDocumentInput,
  CompleteItemInput,
  ReorderItemsInput,
  CreateFromTemplateInput,
  agendaKeys,
} from '@/types/meeting-agenda.types'

// ============================================
// Helper Functions
// ============================================

/**
 * Helper function to call the meeting-agendas Edge Function
 *
 * @description
 * Generic helper that handles authentication, request formatting, and error handling
 * for all meeting agenda operations. Requires active Supabase session.
 *
 * @template T - The expected response type
 * @param action - The Edge Function action to perform (e.g., 'create', 'update', 'list')
 * @param payload - Optional payload data to send with the request
 * @returns Promise resolving to the typed response data
 * @throws Error if not authenticated or if the Edge Function returns an error
 *
 * @example
 * const agenda = await callAgendaFunction<MeetingAgenda>('get', { id: 'uuid-123' });
 *
 * @example
 * const result = await callAgendaFunction<{ success: boolean }>('delete', { id: 'uuid' });
 */
async function callAgendaFunction<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${supabase.supabaseUrl}/functions/v1/meeting-agendas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to ${action}`)
  }

  return response.json()
}

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to fetch list of agendas with optional filters
 *
 * @description
 * Fetches a paginated list of meeting agendas with optional filtering by status,
 * date range, and other criteria. Results are cached for 2 minutes to reduce
 * server load while maintaining reasonable freshness.
 *
 * @param filters - Optional filters for status, date range, search query, pagination
 * @returns TanStack Query result with items array and hasMore flag
 *
 * @example
 * // Fetch all agendas
 * const { data } = useAgendas();
 *
 * @example
 * // Fetch scheduled agendas with pagination
 * const { data } = useAgendas({
 *   status: 'scheduled',
 *   from_date: '2024-01-01',
 *   limit: 20,
 *   offset: 0
 * });
 */
export function useAgendas(filters?: AgendaFilters) {
  return useQuery({
    queryKey: agendaKeys.list(filters),
    queryFn: async () => {
      const result = await callAgendaFunction<{ items: AgendaListItem[]; hasMore: boolean }>(
        'list',
        { filters },
      )
      return result
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to fetch single agenda with full details
 *
 * @description
 * Fetches a complete agenda including items, participants, documents, and metadata.
 * Query is automatically disabled when id is undefined. Results are cached for 1 minute.
 * Use agendaKeys.detail(id) for manual cache invalidation.
 *
 * @param id - The unique identifier (UUID) of the agenda to fetch, or undefined to disable
 * @returns TanStack Query result with data typed as AgendaFull or null if id is undefined
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useAgenda('uuid-123');
 *
 * @example
 * // With conditional ID (query disabled until ID available)
 * const { data } = useAgenda(agendaId);
 * // data is null when agendaId is undefined
 */
export function useAgenda(id: string | undefined) {
  return useQuery({
    queryKey: agendaKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const result = await callAgendaFunction<AgendaFull>('get', { id })
      return result
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch agenda timing data with automatic refresh
 *
 * @description
 * Fetches timing metrics for an agenda including start/end times, current item,
 * and time tracking data. Automatically refetches every 30 seconds during active
 * meetings to keep timing displays up-to-date. Query is disabled when agendaId
 * is undefined.
 *
 * @param agendaId - The unique identifier of the agenda, or undefined to disable
 * @returns TanStack Query result with timing data or null if agendaId is undefined
 *
 * @example
 * // Fetch timing for active meeting
 * const { data: timing } = useAgendaTiming(agendaId);
 * // timing includes: started_at, current_item_id, elapsed_minutes, etc.
 *
 * @example
 * // Use with conditional rendering
 * const { data } = useAgendaTiming(agenda?.id);
 * if (data?.started_at && !data?.ended_at) {
 *   // Meeting is in progress
 * }
 */
export function useAgendaTiming(agendaId: string | undefined) {
  return useQuery({
    queryKey: agendaKeys.timing(agendaId || ''),
    queryFn: async () => {
      if (!agendaId) return null
      const result = await callAgendaFunction<AgendaTiming>('get_timing', { id: agendaId })
      return result
    },
    enabled: !!agendaId,
    refetchInterval: 30000, // Refetch every 30 seconds during meetings
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Hook to fetch agenda templates
 *
 * @description
 * Fetches all available meeting agenda templates for creating new agendas from
 * predefined structures. Templates include pre-configured items, durations, and
 * settings. Results are cached for 5 minutes as templates change infrequently.
 *
 * @returns TanStack Query result with array of template agendas
 *
 * @example
 * // Fetch all templates
 * const { data: templates } = useAgendaTemplates();
 *
 * @example
 * // Use in template selector
 * const { data } = useAgendaTemplates();
 * const templateOptions = data?.map(t => ({
 *   value: t.id,
 *   label: t.template_name
 * }));
 */
export function useAgendaTemplates() {
  return useQuery({
    queryKey: agendaKeys.templates(),
    queryFn: async () => {
      const result = await callAgendaFunction<MeetingAgenda[]>('list_templates')
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================
// Mutation Hooks - Agenda CRUD
// ============================================

/**
 * Hook to create a new agenda
 *
 * @description
 * Creates a new meeting agenda with automatic cache invalidation of list queries.
 * After successful creation, the new agenda is available in the cache and list
 * views are refreshed.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateAgendaInput
 *
 * @example
 * const { mutate, isPending } = useCreateAgenda();
 * mutate({
 *   title_en: 'Board Meeting',
 *   meeting_date: '2024-01-15T10:00:00Z',
 *   duration_minutes: 90,
 *   dossier_id: 'country-uuid'
 * });
 *
 * @example
 * // With async/await and error handling
 * const { mutateAsync } = useCreateAgenda();
 * try {
 *   const newAgenda = await mutateAsync(agendaData);
 *   navigate(`/agendas/${newAgenda.id}`);
 * } catch (error) {
 *   toast.error('Failed to create agenda');
 * }
 */
export function useCreateAgenda() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAgendaInput) => {
      const result = await callAgendaFunction<MeetingAgenda>('create', { data: input })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing agenda
 *
 * @description
 * Updates agenda metadata and settings with automatic cache invalidation of both
 * the detail view and list queries. Changes are immediately reflected in the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting id and data object
 *
 * @example
 * const { mutate } = useUpdateAgenda();
 * mutate({
 *   id: 'agenda-uuid',
 *   data: { title_en: 'Updated Title', duration_minutes: 120 }
 * });
 *
 * @example
 * // Update meeting status
 * const { mutate } = useUpdateAgenda();
 * mutate({
 *   id: agendaId,
 *   data: { status: 'completed' }
 * });
 */
export function useUpdateAgenda() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgendaInput }) => {
      const result = await callAgendaFunction<MeetingAgenda>('update', { id, data })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.lists() })
    },
  })
}

/**
 * Hook to delete an agenda (soft delete)
 *
 * @description
 * Soft deletes an agenda by marking it as deleted. The agenda is no longer visible
 * in list queries but remains in the database for audit purposes. Invalidates list
 * queries to remove the deleted agenda from UI.
 *
 * @returns TanStack Mutation result with mutate function accepting agenda ID
 *
 * @example
 * const { mutate, isPending } = useDeleteAgenda();
 * mutate('agenda-uuid-to-delete');
 *
 * @example
 * // With confirmation dialog
 * const { mutate } = useDeleteAgenda();
 * const handleDelete = () => {
 *   if (confirm('Delete this agenda?')) {
 *     mutate(agendaId);
 *   }
 * };
 */
export function useDeleteAgenda() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await callAgendaFunction<{ success: boolean }>('delete', { id })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.lists() })
    },
  })
}

/**
 * Hook to create agenda from template
 *
 * @description
 * Creates a new agenda by cloning an existing template, including all agenda items,
 * durations, and structure. Only the meeting date and metadata need to be provided.
 * Automatically invalidates list queries after creation.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateFromTemplateInput
 *
 * @example
 * const { mutate } = useCreateAgendaFromTemplate();
 * mutate({
 *   template_id: 'template-uuid',
 *   title_en: 'Q1 Board Meeting',
 *   meeting_date: '2024-01-15T10:00:00Z',
 *   dossier_id: 'country-uuid'
 * });
 *
 * @example
 * // Create from template and navigate
 * const { mutateAsync } = useCreateAgendaFromTemplate();
 * const agenda = await mutateAsync(templateData);
 * navigate(`/agendas/${agenda.id}`);
 */
export function useCreateAgendaFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFromTemplateInput) => {
      const result = await callAgendaFunction<AgendaFull>('create_from_template', { data: input })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.lists() })
    },
  })
}

/**
 * Hook to save agenda as template
 *
 * @description
 * Converts an existing agenda into a reusable template. The template preserves
 * the agenda structure, items, and durations but can be used to create new agendas
 * with different dates and metadata. Invalidates both the agenda detail and template
 * list queries.
 *
 * @returns TanStack Mutation result with mutate function accepting id and template metadata
 *
 * @example
 * const { mutate } = useSaveAsTemplate();
 * mutate({
 *   id: 'agenda-uuid',
 *   templateName: 'Standard Board Meeting',
 *   templateDescription: 'Template for monthly board meetings'
 * });
 *
 * @example
 * // Save and show success message
 * const { mutate, isPending } = useSaveAsTemplate();
 * mutate(
 *   { id: agendaId, templateName: name },
 *   { onSuccess: () => toast.success('Template saved') }
 * );
 */
export function useSaveAsTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      templateName,
      templateDescription,
    }: {
      id: string
      templateName: string
      templateDescription?: string
    }) => {
      const result = await callAgendaFunction<MeetingAgenda>('save_as_template', {
        id,
        data: { template_name: templateName, template_description: templateDescription },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.templates() })
    },
  })
}

// ============================================
// Mutation Hooks - Meeting Control
// ============================================

/**
 * Hook to start a meeting
 *
 * @description
 * Marks a meeting as started and begins time tracking. Records the start timestamp
 * and enables real-time timing queries. Invalidates both detail and timing queries
 * to reflect the active meeting state.
 *
 * @returns TanStack Mutation result with mutate function accepting agenda ID
 *
 * @example
 * const { mutate: startMeeting, isPending } = useStartMeeting();
 * startMeeting('agenda-uuid');
 *
 * @example
 * // Start meeting with callback
 * const { mutate } = useStartMeeting();
 * mutate(agendaId, {
 *   onSuccess: () => {
 *     toast.success('Meeting started');
 *     setActiveView('agenda');
 *   }
 * });
 */
export function useStartMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agendaId: string) => {
      const result = await callAgendaFunction<MeetingAgenda>('start_meeting', { id: agendaId })
      return result
    },
    onSuccess: (_, agendaId) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.timing(agendaId) })
    },
  })
}

/**
 * Hook to end a meeting
 *
 * @description
 * Marks a meeting as ended and stops time tracking. Records the end timestamp and
 * finalizes all timing data. Invalidates detail, timing, and list queries to reflect
 * the completed meeting state.
 *
 * @returns TanStack Mutation result with mutate function accepting agenda ID
 *
 * @example
 * const { mutate: endMeeting } = useEndMeeting();
 * endMeeting('agenda-uuid');
 *
 * @example
 * // End meeting with navigation
 * const { mutate } = useEndMeeting();
 * mutate(agendaId, {
 *   onSuccess: () => {
 *     toast.success('Meeting ended');
 *     navigate(`/agendas/${agendaId}/summary`);
 *   }
 * });
 */
export function useEndMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agendaId: string) => {
      const result = await callAgendaFunction<MeetingAgenda>('end_meeting', { id: agendaId })
      return result
    },
    onSuccess: (_, agendaId) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.timing(agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.lists() })
    },
  })
}

// ============================================
// Mutation Hooks - Agenda Items
// ============================================

/**
 * Hook to add an agenda item
 *
 * @description
 * Adds a new item to an agenda's agenda. Items are ordered by sort_order and can
 * include title, description, duration, and presenter information. Invalidates
 * both the detail query and items-specific queries.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateAgendaItemInput
 *
 * @example
 * const { mutate } = useAddAgendaItem();
 * mutate({
 *   agenda_id: 'agenda-uuid',
 *   title_en: 'Budget Review',
 *   duration_minutes: 30,
 *   presenter_id: 'user-uuid'
 * });
 *
 * @example
 * // Add item with description
 * const { mutate } = useAddAgendaItem();
 * mutate({
 *   agenda_id: agendaId,
 *   title_en: 'Q4 Report',
 *   description_en: 'Review quarterly performance metrics',
 *   duration_minutes: 20
 * });
 */
export function useAddAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAgendaItemInput) => {
      const result = await callAgendaFunction<AgendaItem>('add_item', {
        agenda_id: input.agenda_id,
        data: input,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agenda_id) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.items(variables.agenda_id) })
    },
  })
}

/**
 * Hook to update an agenda item
 *
 * @description
 * Updates an existing agenda item's properties including title, duration, description,
 * or presenter. Changes are immediately reflected in the agenda detail view.
 *
 * @returns TanStack Mutation result with mutate function accepting itemId, agendaId, and data
 *
 * @example
 * const { mutate } = useUpdateAgendaItem();
 * mutate({
 *   itemId: 'item-uuid',
 *   agendaId: 'agenda-uuid',
 *   data: { duration_minutes: 45 }
 * });
 *
 * @example
 * // Update item title and description
 * const { mutate } = useUpdateAgendaItem();
 * mutate({
 *   itemId: item.id,
 *   agendaId: agendaId,
 *   data: {
 *     title_en: 'Updated Title',
 *     description_en: 'New description'
 *   }
 * });
 */
export function useUpdateAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      agendaId,
      data,
    }: {
      itemId: string
      agendaId: string
      data: UpdateAgendaItemInput
    }) => {
      const result = await callAgendaFunction<AgendaItem>('update_item', {
        item_id: itemId,
        data,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

/**
 * Hook to delete an agenda item
 *
 * @description
 * Removes an agenda item from an agenda. The item is permanently deleted (not soft delete).
 * Invalidates the agenda detail query to remove the item from the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting itemId and agendaId
 *
 * @example
 * const { mutate } = useDeleteAgendaItem();
 * mutate({ itemId: 'item-uuid', agendaId: 'agenda-uuid' });
 *
 * @example
 * // With confirmation
 * const { mutate } = useDeleteAgendaItem();
 * const handleDelete = (itemId: string) => {
 *   if (confirm('Delete this item?')) {
 *     mutate({ itemId, agendaId });
 *   }
 * };
 */
export function useDeleteAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, agendaId }: { itemId: string; agendaId: string }) => {
      const result = await callAgendaFunction<{ success: boolean }>('delete_item', {
        item_id: itemId,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

/**
 * Hook to reorder agenda items
 *
 * @description
 * Updates the sort_order of multiple agenda items to reflect a new ordering.
 * Typically used after drag-and-drop operations. See useAgendaItemDragDrop for
 * a higher-level utility that handles the reordering logic.
 *
 * @returns TanStack Mutation result with mutate function accepting agendaId and itemOrders array
 *
 * @example
 * const { mutate } = useReorderAgendaItems();
 * mutate({
 *   agendaId: 'agenda-uuid',
 *   itemOrders: [
 *     { id: 'item-1', sort_order: 0 },
 *     { id: 'item-2', sort_order: 1 },
 *     { id: 'item-3', sort_order: 2 }
 *   ]
 * });
 *
 * @example
 * // Typically used via useAgendaItemDragDrop
 * const { handleDragEnd } = useAgendaItemDragDrop(agendaId);
 * // handleDragEnd internally uses this hook
 */
export function useReorderAgendaItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      agendaId,
      itemOrders,
    }: {
      agendaId: string
      itemOrders: ReorderItemsInput[]
    }) => {
      const result = await callAgendaFunction<{ success: boolean }>('reorder_items', {
        agenda_id: agendaId,
        data: { item_orders: itemOrders },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

/**
 * Hook to start an agenda item during a meeting
 *
 * @description
 * Marks an agenda item as started and begins tracking its timing. Records the start
 * timestamp and updates the current_item_id in the agenda. Invalidates both detail
 * and timing queries to reflect the active item state.
 *
 * @returns TanStack Mutation result with mutate function accepting itemId and agendaId
 *
 * @example
 * const { mutate: startItem } = useStartAgendaItem();
 * startItem({ itemId: 'item-uuid', agendaId: 'agenda-uuid' });
 *
 * @example
 * // Auto-start next item
 * const { mutate } = useStartAgendaItem();
 * const handleNext = () => {
 *   const nextItem = items[currentIndex + 1];
 *   if (nextItem) mutate({ itemId: nextItem.id, agendaId });
 * };
 */
export function useStartAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, agendaId }: { itemId: string; agendaId: string }) => {
      const result = await callAgendaFunction<AgendaItem>('start_item', { item_id: itemId })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.timing(variables.agendaId) })
    },
  })
}

/**
 * Hook to complete an agenda item during a meeting
 *
 * @description
 * Marks an agenda item as completed and stops timing tracking for that item. Records
 * the end timestamp and optionally captures completion notes or outcomes. Invalidates
 * detail and timing queries to update the UI.
 *
 * @returns TanStack Mutation result with mutate function accepting itemId, agendaId, and optional data
 *
 * @example
 * const { mutate: completeItem } = useCompleteAgendaItem();
 * completeItem({ itemId: 'item-uuid', agendaId: 'agenda-uuid' });
 *
 * @example
 * // Complete with notes
 * const { mutate } = useCompleteAgendaItem();
 * mutate({
 *   itemId: item.id,
 *   agendaId: agendaId,
 *   data: { outcome_notes: 'Approved with amendments' }
 * });
 */
export function useCompleteAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      agendaId,
      data,
    }: {
      itemId: string
      agendaId: string
      data?: CompleteItemInput
    }) => {
      const result = await callAgendaFunction<AgendaItem>('complete_item', {
        item_id: itemId,
        data: data || {},
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.timing(variables.agendaId) })
    },
  })
}

/**
 * Hook to skip an agenda item during a meeting
 *
 * @description
 * Marks an agenda item as skipped, optionally recording a reason. The item is not
 * discussed during the meeting but remains in the agenda for record-keeping.
 * Invalidates detail and timing queries.
 *
 * @returns TanStack Mutation result with mutate function accepting itemId, agendaId, and optional reason
 *
 * @example
 * const { mutate: skipItem } = useSkipAgendaItem();
 * skipItem({
 *   itemId: 'item-uuid',
 *   agendaId: 'agenda-uuid',
 *   reason: 'Deferred to next meeting'
 * });
 *
 * @example
 * // Skip without reason
 * const { mutate } = useSkipAgendaItem();
 * mutate({ itemId: item.id, agendaId: agendaId });
 */
export function useSkipAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      agendaId,
      reason,
    }: {
      itemId: string
      agendaId: string
      reason?: string
    }) => {
      const result = await callAgendaFunction<AgendaItem>('skip_item', {
        item_id: itemId,
        data: { reason },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.timing(variables.agendaId) })
    },
  })
}

// ============================================
// Mutation Hooks - Participants
// ============================================

/**
 * Hook to add a participant to an agenda
 *
 * @description
 * Adds a participant (user or contact) to an agenda with optional role and RSVP status.
 * Participants can be internal users or external contacts. Invalidates detail and
 * participants queries.
 *
 * @returns TanStack Mutation result with mutate function accepting AddParticipantInput
 *
 * @example
 * const { mutate } = useAddParticipant();
 * mutate({
 *   agenda_id: 'agenda-uuid',
 *   user_id: 'user-uuid',
 *   role: 'presenter',
 *   rsvp_status: 'accepted'
 * });
 *
 * @example
 * // Add external contact
 * const { mutate } = useAddParticipant();
 * mutate({
 *   agenda_id: agendaId,
 *   contact_id: contactId,
 *   role: 'attendee'
 * });
 */
export function useAddParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddParticipantInput) => {
      const result = await callAgendaFunction<AgendaParticipant>('add_participant', {
        agenda_id: input.agenda_id,
        data: input,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agenda_id) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.participants(variables.agenda_id) })
    },
  })
}

/**
 * Hook to update participant RSVP status
 *
 * @description
 * Updates a participant's RSVP status (accepted, declined, tentative, no_response)
 * and optionally adds a response note. Invalidates the agenda detail query to reflect
 * the updated attendance status.
 *
 * @returns TanStack Mutation result with mutate function accepting participantId, agendaId, and data
 *
 * @example
 * const { mutate } = useUpdateRsvp();
 * mutate({
 *   participantId: 'participant-uuid',
 *   agendaId: 'agenda-uuid',
 *   data: { rsvp_status: 'accepted' }
 * });
 *
 * @example
 * // Decline with note
 * const { mutate } = useUpdateRsvp();
 * mutate({
 *   participantId: participant.id,
 *   agendaId: agendaId,
 *   data: {
 *     rsvp_status: 'declined',
 *     response_note: 'Conflicting commitment'
 *   }
 * });
 */
export function useUpdateRsvp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      participantId,
      agendaId,
      data,
    }: {
      participantId: string
      agendaId: string
      data: UpdateRsvpInput
    }) => {
      const result = await callAgendaFunction<AgendaParticipant>('update_rsvp', {
        data: { participant_id: participantId, ...data },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

/**
 * Hook to remove a participant from an agenda
 *
 * @description
 * Removes a participant from the agenda's participant list. This is a hard delete
 * operation. Invalidates the agenda detail query to update the participant list.
 *
 * @returns TanStack Mutation result with mutate function accepting participantId and agendaId
 *
 * @example
 * const { mutate } = useRemoveParticipant();
 * mutate({ participantId: 'participant-uuid', agendaId: 'agenda-uuid' });
 *
 * @example
 * // With confirmation
 * const { mutate } = useRemoveParticipant();
 * const handleRemove = () => {
 *   if (confirm('Remove this participant?')) {
 *     mutate({ participantId: participant.id, agendaId });
 *   }
 * };
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      participantId,
      agendaId,
    }: {
      participantId: string
      agendaId: string
    }) => {
      const result = await callAgendaFunction<{ success: boolean }>('remove_participant', {
        data: { participant_id: participantId },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

// ============================================
// Mutation Hooks - Documents
// ============================================

/**
 * Hook to add a document to an agenda
 *
 * @description
 * Links a document to an agenda, making it available as meeting material. Documents
 * can be referenced by existing document IDs or uploaded files. Invalidates detail
 * and documents queries.
 *
 * @returns TanStack Mutation result with mutate function accepting AddDocumentInput
 *
 * @example
 * const { mutate } = useAddAgendaDocument();
 * mutate({
 *   agenda_id: 'agenda-uuid',
 *   document_id: 'doc-uuid',
 *   document_type: 'background_material'
 * });
 *
 * @example
 * // Add with custom label
 * const { mutate } = useAddAgendaDocument();
 * mutate({
 *   agenda_id: agendaId,
 *   document_id: docId,
 *   document_type: 'presentation',
 *   custom_label: 'Q4 Financial Report'
 * });
 */
export function useAddAgendaDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddDocumentInput) => {
      const result = await callAgendaFunction<AgendaDocument>('add_document', {
        agenda_id: input.agenda_id,
        data: input,
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agenda_id) })
      queryClient.invalidateQueries({ queryKey: agendaKeys.documents(variables.agenda_id) })
    },
  })
}

/**
 * Hook to remove a document from an agenda
 *
 * @description
 * Unlinks a document from an agenda's document list. The document itself is not
 * deleted, only the association. Invalidates the agenda detail query.
 *
 * @returns TanStack Mutation result with mutate function accepting documentId and agendaId
 *
 * @example
 * const { mutate } = useRemoveAgendaDocument();
 * mutate({ documentId: 'doc-uuid', agendaId: 'agenda-uuid' });
 *
 * @example
 * // With confirmation
 * const { mutate } = useRemoveAgendaDocument();
 * const handleRemove = (docId: string) => {
 *   if (confirm('Remove this document from agenda?')) {
 *     mutate({ documentId: docId, agendaId });
 *   }
 * };
 */
export function useRemoveAgendaDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, agendaId }: { documentId: string; agendaId: string }) => {
      const result = await callAgendaFunction<{ success: boolean }>('remove_document', {
        data: { document_id: documentId },
      })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(variables.agendaId) })
    },
  })
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Hook for managing agenda item drag-and-drop reordering
 *
 * @description
 * Higher-level utility hook that handles drag-and-drop logic for agenda items.
 * Provides optimistic updates and automatic rollback on error. Uses useReorderAgendaItems
 * internally but handles all the reordering logic and cache updates.
 *
 * @param agendaId - The ID of the agenda containing the items
 * @returns Object with handleDragEnd callback and isReordering flag
 *
 * @example
 * const { handleDragEnd, isReordering } = useAgendaItemDragDrop(agendaId);
 *
 * // Use with DnD library
 * <DragDropContext onDragEnd={(result) => {
 *   if (!result.destination) return;
 *   handleDragEnd(items, result.source.index, result.destination.index);
 * }}>
 *   {items.map(item => <AgendaItemCard key={item.id} item={item} />)}
 * </DragDropContext>
 *
 * @example
 * // Check reordering state
 * if (isReordering) {
 *   return <Spinner />;
 * }
 */
export function useAgendaItemDragDrop(agendaId: string) {
  const reorderMutation = useReorderAgendaItems()
  const queryClient = useQueryClient()

  const handleDragEnd = async (
    items: AgendaItem[],
    sourceIndex: number,
    destinationIndex: number,
  ) => {
    if (sourceIndex === destinationIndex) return

    // Optimistic update
    const reorderedItems = Array.from(items)
    const [removed] = reorderedItems.splice(sourceIndex, 1)
    reorderedItems.splice(destinationIndex, 0, removed)

    // Update sort_order for affected items
    const itemOrders: ReorderItemsInput[] = reorderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    // Optimistically update the cache
    queryClient.setQueryData<AgendaFull>(agendaKeys.detail(agendaId), (old) => {
      if (!old) return old
      return {
        ...old,
        items: reorderedItems.map((item, index) => ({ ...item, sort_order: index })),
      }
    })

    try {
      await reorderMutation.mutateAsync({ agendaId, itemOrders })
    } catch {
      // Revert on error by refetching
      queryClient.invalidateQueries({ queryKey: agendaKeys.detail(agendaId) })
    }
  }

  return {
    handleDragEnd,
    isReordering: reorderMutation.isPending,
  }
}

/**
 * Hook for real-time meeting timing with automatic refresh
 *
 * @description
 * Provides live timing data for an active meeting with automatic refresh every 10 seconds.
 * Only refetches when the meeting is in progress (inMeeting=true). Useful for displaying
 * live elapsed time, current item tracking, and meeting progress indicators.
 *
 * @param agendaId - The ID of the agenda, or undefined to disable
 * @param inMeeting - Whether the meeting is currently in progress (enables/disables auto-refresh)
 * @returns TanStack Query result with live timing data
 *
 * @example
 * const { data: timing } = useLiveMeetingTiming(agendaId, meetingStarted);
 * // timing updates every 10 seconds when meetingStarted=true
 *
 * @example
 * // Display live timer
 * const { data } = useLiveMeetingTiming(agendaId, agenda?.status === 'in_progress');
 * const elapsedMinutes = data?.elapsed_minutes || 0;
 * return <Timer minutes={elapsedMinutes} />;
 */
export function useLiveMeetingTiming(agendaId: string | undefined, inMeeting: boolean) {
  return useQuery({
    queryKey: [...agendaKeys.timing(agendaId || ''), 'live'],
    queryFn: async () => {
      if (!agendaId) return null
      const result = await callAgendaFunction<AgendaTiming>('get_timing', { id: agendaId })
      return result
    },
    enabled: !!agendaId && inMeeting,
    refetchInterval: inMeeting ? 10000 : false, // Every 10 seconds during meeting
    staleTime: 5000, // 5 seconds
  })
}
