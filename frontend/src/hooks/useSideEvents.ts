/**
 * useSideEvents Hooks
 *
 * TanStack Query hooks for side event CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  SideEvent,
  SideEventWithStats,
  CreateSideEventRequest,
  UpdateSideEventRequest,
  SideEventFilters,
  SessionSideEventsResponse,
  EventLogistics,
  CreateLogisticsRequest,
  UpdateLogisticsRequest,
  SideEventAttendee,
} from '@/types/forum-extended.types'

// Query keys
export const sideEventKeys = {
  all: ['side-events'] as const,
  lists: () => [...sideEventKeys.all, 'list'] as const,
  list: (sessionId: string, filters?: Partial<SideEventFilters>) =>
    [...sideEventKeys.lists(), sessionId, filters] as const,
  details: () => [...sideEventKeys.all, 'detail'] as const,
  detail: (id: string) => [...sideEventKeys.details(), id] as const,
  logistics: (eventId: string) => [...sideEventKeys.all, 'logistics', eventId] as const,
  attendees: (eventId: string) => [...sideEventKeys.all, 'attendees', eventId] as const,
}

/**
 * Fetch side events for a session
 */
export function useSideEvents(sessionId: string, filters: Partial<SideEventFilters> = {}) {
  return useQuery<SessionSideEventsResponse, Error>({
    queryKey: sideEventKeys.list(sessionId, filters),
    queryFn: async () => {
      let query = supabase
        .from('side_events')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .is('deleted_at', null)

      // Apply filters
      if (filters.date) {
        query = query.eq('scheduled_date', filters.date)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      // Order by date and time
      query = query
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get logistics stats for each event
      const eventIds = (data || []).map((e) => e.id)
      let logisticsStats: Record<string, { total: number; pending: number; confirmed: number }> = {}

      if (eventIds.length > 0) {
        const { data: logistics } = await supabase
          .from('event_logistics')
          .select('event_id, status')
          .in('event_id', eventIds)

        if (logistics) {
          logistics.forEach((l) => {
            if (!logisticsStats[l.event_id]) {
              logisticsStats[l.event_id] = { total: 0, pending: 0, confirmed: 0 }
            }
            logisticsStats[l.event_id]!.total++
            if (l.status === 'pending' || l.status === 'requested') {
              logisticsStats[l.event_id]!.pending++
            } else if (l.status === 'confirmed' || l.status === 'completed') {
              logisticsStats[l.event_id]!.confirmed++
            }
          })
        }
      }

      const events: SideEventWithStats[] = (data || []).map((e) => ({
        ...e,
        logistics_status: logisticsStats[e.id] || { total: 0, pending: 0, confirmed: 0 },
      }))

      return {
        data: events,
        session_id: sessionId,
      }
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single side event
 */
export function useSideEvent(id: string | undefined) {
  return useQuery<SideEventWithStats | null, Error>({
    queryKey: sideEventKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase.from('side_events').select('*').eq('id', id).single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create side event
 */
export function useCreateSideEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSideEventRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: event, error } = await supabase
        .from('side_events')
        .insert({
          ...data,
          status: 'planned',
          participants: data.participants || [],
          materials: data.materials || [],
          priority: data.priority || 'normal',
          is_public: data.is_public ?? true,
          all_day: data.all_day ?? false,
          is_offsite: data.is_offsite ?? false,
          registration_required: data.registration_required ?? false,
          invitation_only: data.invitation_only ?? false,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return event as SideEvent
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: sideEventKeys.lists() })
      queryClient.setQueryData(sideEventKeys.detail(event.id), event)
      toast.success('Side event created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create side event')
    },
  })
}

/**
 * Update side event
 */
export function useUpdateSideEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSideEventRequest }) => {
      const { data: event, error } = await supabase
        .from('side_events')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return event as SideEvent
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: sideEventKeys.lists() })
      queryClient.setQueryData(sideEventKeys.detail(event.id), event)
      toast.success('Side event updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update side event')
    },
  })
}

/**
 * Delete side event (soft delete)
 */
export function useDeleteSideEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('side_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: sideEventKeys.lists() })
      queryClient.removeQueries({ queryKey: sideEventKeys.detail(id) })
      toast.success('Side event deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete side event')
    },
  })
}

// ============================================================================
// Event Logistics Hooks
// ============================================================================

/**
 * Fetch logistics for an event
 */
export function useEventLogistics(eventId: string) {
  return useQuery<EventLogistics[], Error>({
    queryKey: sideEventKeys.logistics(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logistics')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create logistics item
 */
export function useCreateEventLogistics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLogisticsRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: logistics, error } = await supabase
        .from('event_logistics')
        .insert({
          ...data,
          specifications: data.specifications || {},
          currency: data.currency || 'SAR',
          status: 'pending',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return logistics as EventLogistics
    },
    onSuccess: (logistics) => {
      queryClient.invalidateQueries({ queryKey: sideEventKeys.logistics(logistics.event_id) })
      queryClient.invalidateQueries({ queryKey: sideEventKeys.lists() })
      toast.success('Logistics item added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add logistics item')
    },
  })
}

/**
 * Update logistics item
 */
export function useUpdateEventLogistics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      data,
    }: {
      id: string
      eventId: string
      data: UpdateLogisticsRequest
    }) => {
      const { data: logistics, error } = await supabase
        .from('event_logistics')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return { logistics: logistics as EventLogistics, eventId }
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: sideEventKeys.logistics(eventId) })
      queryClient.invalidateQueries({ queryKey: sideEventKeys.lists() })
      toast.success('Logistics item updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update logistics item')
    },
  })
}

// ============================================================================
// Event Attendees Hooks
// ============================================================================

/**
 * Fetch attendees for an event
 */
export function useSideEventAttendees(eventId: string) {
  return useQuery<SideEventAttendee[], Error>({
    queryKey: sideEventKeys.attendees(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('side_event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  })
}
