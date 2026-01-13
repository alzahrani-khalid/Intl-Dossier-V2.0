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
  ForumUpdateRequest,
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
 * Fetch single forum by ID
 */
export function useForum(id: string | undefined) {
  return useQuery<Forum | null, Error>({
    queryKey: [FORUM_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null

      // Get base dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .eq('type', 'forum')
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      if (!dossier) return null

      // Get forum extension data
      const { data: forumExt } = await supabase.from('forums').select('*').eq('id', id).single()

      return {
        ...dossier,
        type: 'forum' as const,
        extension: forumExt || {},
      }
    },
    enabled: !!id,
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
 * Update existing forum
 */
export function useUpdateForum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ForumUpdateRequest }) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Update base dossier fields
      const dossierUpdate: Record<string, unknown> = {}
      if (data.name_en !== undefined) dossierUpdate.name_en = data.name_en
      if (data.name_ar !== undefined) dossierUpdate.name_ar = data.name_ar
      if (data.description_en !== undefined) dossierUpdate.description_en = data.description_en
      if (data.description_ar !== undefined) dossierUpdate.description_ar = data.description_ar
      if (data.status !== undefined) dossierUpdate.status = data.status
      if (data.sensitivity_level !== undefined)
        dossierUpdate.sensitivity_level = data.sensitivity_level
      if (data.tags !== undefined) dossierUpdate.tags = data.tags
      if (data.metadata !== undefined) dossierUpdate.metadata = data.metadata
      dossierUpdate.updated_by = user?.id

      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .update(dossierUpdate)
        .eq('id', id)
        .eq('type', 'forum')
        .select()
        .single()

      if (dossierError) {
        throw new Error(dossierError.message)
      }

      // Update forum extension if provided
      let forumExt = null
      if (data.extension) {
        // Check if extension exists
        const { data: existingExt } = await supabase
          .from('forums')
          .select('id')
          .eq('id', id)
          .single()

        if (existingExt) {
          // Update existing
          const { data: updatedExt, error: extError } = await supabase
            .from('forums')
            .update({
              number_of_sessions: data.extension.number_of_sessions,
              keynote_speakers: data.extension.keynote_speakers,
              sponsors: data.extension.sponsors,
              registration_fee: data.extension.registration_fee,
              currency: data.extension.currency,
              agenda_url: data.extension.agenda_url,
              live_stream_url: data.extension.live_stream_url,
            })
            .eq('id', id)
            .select()
            .single()

          if (!extError) forumExt = updatedExt
        } else {
          // Create new
          const { data: newExt, error: extError } = await supabase
            .from('forums')
            .insert({
              id: id,
              number_of_sessions: data.extension.number_of_sessions,
              keynote_speakers: data.extension.keynote_speakers || [],
              sponsors: data.extension.sponsors || [],
              registration_fee: data.extension.registration_fee,
              currency: data.extension.currency,
              agenda_url: data.extension.agenda_url,
              live_stream_url: data.extension.live_stream_url,
            })
            .select()
            .single()

          if (!extError) forumExt = newExt
        }
      } else {
        // Fetch existing extension
        const { data: existingExt } = await supabase
          .from('forums')
          .select('*')
          .eq('id', id)
          .single()
        forumExt = existingExt
      }

      return {
        ...dossier,
        type: 'forum' as const,
        extension: forumExt || {},
      } as Forum
    },
    onSuccess: (updatedForum) => {
      queryClient.invalidateQueries({ queryKey: [FORUMS_QUERY_KEY] })
      queryClient.setQueryData([FORUM_QUERY_KEY, updatedForum.id], updatedForum)
      toast.success('Forum updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update forum')
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
