/**
 * useForums Hooks
 *
 * TanStack Query hooks for forum entity CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  Forum,
  ForumListResponse,
  ForumFilters,
  ForumCreateRequest,
  ForumExtension,
} from '@/types/forum.types'

const FORUMS_QUERY_KEY = 'forums'
const FORUM_QUERY_KEY = 'forum'

/**
 * Fetch paginated list of forums
 */
export function useForums(filters: ForumFilters = {}) {
  return useQuery<ForumListResponse, Error>({
    queryKey: [FORUMS_QUERY_KEY, filters],
    queryFn: async () => {
      const { search, status, page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit

      // Query base dossier table with forum type
      let query = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'forum')
        .neq('status', 'deleted')

      // Apply search filter
      if (search) {
        query = query.or(
          `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,description_en.ilike.%${search}%,description_ar.ilike.%${search}%`,
        )
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination and ordering
      query = query.order('name_en', { ascending: true }).range(offset, offset + limit - 1)

      const { data: dossiers, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get forum extension data for all dossiers
      const forumIds = (dossiers || []).map((d) => d.id)
      let extensions: Record<string, ForumExtension> = {}

      if (forumIds.length > 0) {
        const { data: forumExts } = await supabase.from('forums').select('*').in('id', forumIds)

        if (forumExts) {
          extensions = forumExts.reduce(
            (acc, ext) => {
              acc[ext.id] = ext
              return acc
            },
            {} as Record<string, ForumExtension>,
          )
        }
      }

      // Combine dossier and extension data
      const forums: Forum[] = (dossiers || []).map((d) => ({
        ...d,
        type: 'forum' as const,
        extension: extensions[d.id] || {},
      }))

      return {
        data: forums,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Create new forum
 */
export function useCreateForum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ForumCreateRequest) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Create base dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .insert({
          type: 'forum',
          name_en: data.name_en,
          name_ar: data.name_ar,
          description_en: data.description_en || null,
          description_ar: data.description_ar || null,
          status: data.status || 'active',
          sensitivity_level: data.sensitivity_level || 1,
          tags: data.tags || [],
          metadata: data.metadata || {},
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      // Create forum extension if provided
      if (data.extension) {
        const { error: extError } = await supabase.from('forums').insert({
          id: dossier.id,
          number_of_sessions: data.extension.number_of_sessions,
          keynote_speakers: data.extension.keynote_speakers || [],
          sponsors: data.extension.sponsors || [],
          registration_fee: data.extension.registration_fee,
          currency: data.extension.currency,
          agenda_url: data.extension.agenda_url,
          live_stream_url: data.extension.live_stream_url,
        })

        if (extError) {
          console.error('Error creating forum extension:', extError)
        }
      }

      return {
        ...dossier,
        type: 'forum' as const,
        extension: data.extension || {},
      } as Forum
    },
    onSuccess: (newForum) => {
      queryClient.invalidateQueries({ queryKey: [FORUMS_QUERY_KEY] })
      queryClient.setQueryData([FORUM_QUERY_KEY, newForum.id], newForum)
      toast.success('Forum created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create forum')
    },
  })
}

/**
 * Delete forum (soft delete by changing status)
 */
export function useDeleteForum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by updating status
      const { error } = await supabase
        .from('dossiers')
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('type', 'forum')

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: [FORUMS_QUERY_KEY] })
      queryClient.removeQueries({ queryKey: [FORUM_QUERY_KEY, deletedId] })
      toast.success('Forum deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete forum')
    },
  })
}
