/**
 * Meeting Agenda Hooks
 * Feature: meeting-agenda-builder
 *
 * TanStack Query hooks for meeting agenda management including:
 * - CRUD operations for agendas, items, participants, documents
 * - Meeting timing control (start, end, item tracking)
 * - Template management
 * - Real-time timing updates
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
 * Fetch list of agendas with optional filters
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
 * Fetch single agenda with full details
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
 * Fetch agenda timing data
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
 * Fetch agenda templates
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
 * Create a new agenda
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
 * Update an existing agenda
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
 * Delete an agenda (soft delete)
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
 * Create agenda from template
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
 * Save agenda as template
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
 * Start a meeting
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
 * End a meeting
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
 * Add an agenda item
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
 * Update an agenda item
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
 * Delete an agenda item
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
 * Reorder agenda items
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
 * Start an agenda item
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
 * Complete an agenda item
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
 * Skip an agenda item
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
 * Add a participant
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
 * Update participant RSVP
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
 * Remove a participant
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
 * Add a document to agenda
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
 * Remove a document from agenda
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
 * Hook for managing agenda item drag-and-drop reorder
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
 * Hook for real-time meeting timing
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
