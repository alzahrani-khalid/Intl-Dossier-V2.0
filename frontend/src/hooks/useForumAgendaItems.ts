/**
 * useForumAgendaItems Hooks
 *
 * TanStack Query hooks for forum agenda item CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  ForumAgendaItem,
  ForumAgendaItemWithStats,
  CreateAgendaItemRequest,
  UpdateAgendaItemRequest,
  AgendaFilters,
  SessionAgendaResponse,
} from '@/types/forum-extended.types'

// Query keys
export const forumAgendaKeys = {
  all: ['forum-agenda'] as const,
  lists: () => [...forumAgendaKeys.all, 'list'] as const,
  list: (sessionId: string, filters?: Partial<AgendaFilters>) =>
    [...forumAgendaKeys.lists(), sessionId, filters] as const,
  details: () => [...forumAgendaKeys.all, 'detail'] as const,
  detail: (id: string) => [...forumAgendaKeys.details(), id] as const,
}

/**
 * Fetch agenda items for a session
 */
export function useForumAgendaItems(sessionId: string, filters: Partial<AgendaFilters> = {}) {
  return useQuery<SessionAgendaResponse, Error>({
    queryKey: forumAgendaKeys.list(sessionId, filters),
    queryFn: async () => {
      let query = supabase
        .from('forum_agenda_items')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .is('deleted_at', null)

      // Apply filters
      if (filters.item_type) {
        query = query.eq('item_type', filters.item_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }

      // Order by sequence
      query = query.order('sequence_order', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Build hierarchical structure
      const items = data as ForumAgendaItemWithStats[]
      const rootItems = items.filter((item) => !item.parent_item_id)
      const childItems = items.filter((item) => item.parent_item_id)

      // Attach children to parents
      rootItems.forEach((parent) => {
        parent.children = childItems.filter((child) => child.parent_item_id === parent.id)
      })

      return {
        data: rootItems,
        session_id: sessionId,
      }
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single agenda item
 */
export function useForumAgendaItem(id: string | undefined) {
  return useQuery<ForumAgendaItem | null, Error>({
    queryKey: forumAgendaKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('forum_agenda_items')
        .select('*')
        .eq('id', id)
        .single()

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
 * Create agenda item
 */
export function useCreateForumAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAgendaItemRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Calculate level based on parent
      let level = 1
      if (data.parent_item_id) {
        const { data: parent } = await supabase
          .from('forum_agenda_items')
          .select('level')
          .eq('id', data.parent_item_id)
          .single()
        if (parent) {
          level = parent.level + 1
        }
      }

      const { data: item, error } = await supabase
        .from('forum_agenda_items')
        .insert({
          ...data,
          level,
          status: 'pending',
          documents: data.documents || [],
          speakers: data.speakers || [],
          tags: data.tags || [],
          priority: data.priority || 'normal',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return item as ForumAgendaItem
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: forumAgendaKeys.lists() })
      queryClient.setQueryData(forumAgendaKeys.detail(item.id), item)
      toast.success('Agenda item created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create agenda item')
    },
  })
}

/**
 * Update agenda item
 */
export function useUpdateForumAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgendaItemRequest }) => {
      const { data: item, error } = await supabase
        .from('forum_agenda_items')
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

      return item as ForumAgendaItem
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: forumAgendaKeys.lists() })
      queryClient.setQueryData(forumAgendaKeys.detail(item.id), item)
      toast.success('Agenda item updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update agenda item')
    },
  })
}

/**
 * Delete agenda item (soft delete)
 */
export function useDeleteForumAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('forum_agenda_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: forumAgendaKeys.lists() })
      queryClient.removeQueries({ queryKey: forumAgendaKeys.detail(id) })
      toast.success('Agenda item deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete agenda item')
    },
  })
}
