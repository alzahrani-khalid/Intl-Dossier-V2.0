/**
 * useComments Hook
 *
 * TanStack Query hooks for the entity comments system with:
 * - Comment listing with infinite scroll
 * - Thread fetching
 * - Create/Update/Delete mutations
 * - Reaction toggling
 * - User search for @mentions
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  CommentableEntityType,
  CommentWithDetails,
  CommentReactionEmoji,
  CommentVisibility,
  GetCommentsParams,
  GetCommentsResponse,
  GetCommentResponse,
  GetThreadResponse,
  CreateCommentResponse,
  UpdateCommentResponse,
  DeleteCommentResponse,
  ToggleReactionResponse,
  SearchUsersResponse,
  MentionUser,
  commentKeys,
} from '@/types/comment.types'

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || ''

// Auth header helper
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// Query key factory
export const commentQueryKeys = {
  all: ['comments'] as const,
  lists: () => [...commentQueryKeys.all, 'list'] as const,
  list: (params: GetCommentsParams) => [...commentQueryKeys.lists(), params] as const,
  details: () => [...commentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentQueryKeys.details(), id] as const,
  threads: () => [...commentQueryKeys.all, 'thread'] as const,
  thread: (rootId: string) => [...commentQueryKeys.threads(), rootId] as const,
  userSearch: (query: string) => [...commentQueryKeys.all, 'users', query] as const,
}

/**
 * Fetch comments for an entity with infinite scroll support
 */
export function useComments(
  entityType: CommentableEntityType,
  entityId: string,
  options?: {
    pageSize?: number
    includeReplies?: boolean
    enabled?: boolean
  },
) {
  const { pageSize = 20, includeReplies = true, enabled = true } = options || {}

  return useInfiniteQuery({
    queryKey: commentQueryKeys.list({ entity_type: entityType, entity_id: entityId }),
    queryFn: async ({ pageParam = 0 }) => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({
        entity_type: entityType,
        entity_id: entityId,
        limit: String(pageSize),
        offset: String(pageParam),
        include_replies: String(includeReplies),
      })

      const response = await fetch(`${API_BASE_URL}/functions/v1/entity-comments?${params}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch comments')
      }

      return response.json() as Promise<GetCommentsResponse>
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_more) {
        return lastPage.pagination.offset + lastPage.pagination.limit
      }
      return undefined
    },
    initialPageParam: 0,
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

/**
 * Fetch a single comment by ID
 */
export function useComment(commentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: commentQueryKeys.detail(commentId),
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/functions/v1/entity-comments/${commentId}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch comment')
      }

      const data = (await response.json()) as GetCommentResponse
      return data.comment
    },
    enabled: options?.enabled !== false && !!commentId,
    staleTime: 60_000,
  })
}

/**
 * Fetch thread replies for a comment
 */
export function useCommentThread(
  threadRootId: string,
  options?: { maxDepth?: number; enabled?: boolean },
) {
  const { maxDepth = 5, enabled = true } = options || {}

  return useQuery({
    queryKey: commentQueryKeys.thread(threadRootId),
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({ max_depth: String(maxDepth) })

      const response = await fetch(
        `${API_BASE_URL}/functions/v1/entity-comments/${threadRootId}/thread?${params}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch thread')
      }

      const data = (await response.json()) as GetThreadResponse
      return data.thread
    },
    enabled: enabled && !!threadRootId,
    staleTime: 30_000,
  })
}

/**
 * Search users for @mention autocomplete
 */
export function useSearchUsersForMention(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: commentQueryKeys.userSearch(query),
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({ q: query, limit: '10' })

      const response = await fetch(
        `${API_BASE_URL}/functions/v1/entity-comments/users/search?${params}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to search users')
      }

      const data = (await response.json()) as SearchUsersResponse
      return data.users
    },
    enabled: options?.enabled !== false && query.length >= 1,
    staleTime: 60_000,
    placeholderData: [],
  })
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('comments')

  return useMutation({
    mutationFn: async (data: {
      entityType: CommentableEntityType
      entityId: string
      content: string
      parentId?: string
      visibility?: CommentVisibility
    }) => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/functions/v1/entity-comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity_type: data.entityType,
          entity_id: data.entityId,
          content: data.content,
          parent_id: data.parentId,
          visibility: data.visibility || 'public',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to create comment')
      }

      const result = (await response.json()) as CreateCommentResponse
      return result.comment
    },
    onSuccess: (comment) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list({
          entity_type: comment.entity_type,
          entity_id: comment.entity_id,
        }),
      })

      // If it's a reply, invalidate the thread
      if (comment.thread_root_id) {
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.thread(comment.thread_root_id),
        })
      }

      toast.success(t('messages.created', 'Comment posted successfully'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.createError', 'Failed to post comment: {{error}}', { error: error.message }),
      )
    },
  })
}

/**
 * Update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('comments')

  return useMutation({
    mutationFn: async (data: {
      commentId: string
      content: string
      visibility?: CommentVisibility
    }) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/functions/v1/entity-comments/${data.commentId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            content: data.content,
            visibility: data.visibility,
          }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to update comment')
      }

      const result = (await response.json()) as UpdateCommentResponse
      return result.comment
    },
    onSuccess: (comment) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list({
          entity_type: comment.entity_type,
          entity_id: comment.entity_id,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.detail(comment.id),
      })

      toast.success(t('messages.updated', 'Comment updated'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.updateError', 'Failed to update comment: {{error}}', { error: error.message }),
      )
    },
  })
}

/**
 * Delete a comment (soft delete)
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('comments')

  return useMutation({
    mutationFn: async (data: {
      commentId: string
      entityType: CommentableEntityType
      entityId: string
    }) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/functions/v1/entity-comments/${data.commentId}`,
        { method: 'DELETE', headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to delete comment')
      }

      return response.json() as Promise<DeleteCommentResponse>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list({
          entity_type: variables.entityType,
          entity_id: variables.entityId,
        }),
      })

      toast.success(t('messages.deleted', 'Comment deleted'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.deleteError', 'Failed to delete comment: {{error}}', { error: error.message }),
      )
    },
  })
}

/**
 * Toggle a reaction on a comment
 */
export function useToggleReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      commentId: string
      emoji: CommentReactionEmoji
      entityType: CommentableEntityType
      entityId: string
    }) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/functions/v1/entity-comments/${data.commentId}/reactions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ emoji: data.emoji }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to toggle reaction')
      }

      return response.json() as Promise<ToggleReactionResponse>
    },
    onSuccess: (result, variables) => {
      // Optimistically update the cache
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.list({
          entity_type: variables.entityType,
          entity_id: variables.entityId,
        }),
      })
    },
  })
}

/**
 * Hook to get the current user's reactions for optimistic UI updates
 */
export function useUserReactionsForComment(
  commentId: string,
  currentReactions: Record<string, number>,
): CommentReactionEmoji[] {
  // In a real implementation, you'd track this in state or fetch from API
  // For now, return empty array - the API would need to return user's reactions
  return []
}

/**
 * Invalidate all comments for an entity (useful after bulk operations)
 */
export function useInvalidateComments() {
  const queryClient = useQueryClient()

  return (entityType: CommentableEntityType, entityId: string) => {
    queryClient.invalidateQueries({
      queryKey: commentQueryKeys.list({ entity_type: entityType, entity_id: entityId }),
    })
  }
}
