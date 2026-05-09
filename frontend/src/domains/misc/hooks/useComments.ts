/**
 * Comments Hook
 * @module domains/misc/hooks/useComments
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getComments as getCommentsApi,
  createComment as createCommentApi,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  getCommentThread,
  reactToComment as reactToCommentApi,
  resolveComment as resolveCommentApi,
  mentionUsers as mentionUsersApi,
} from '../repositories/misc.repository'

export const commentKeys = {
  all: ['comments'] as const,
  list: (entityType: string, entityId: string) =>
    [...commentKeys.all, entityType, entityId] as const,
  thread: (commentId: string) => [...commentKeys.all, 'thread', commentId] as const,
}

export function useComments(
  entityType: string,
  entityId: string,
  params?: {
    page?: number
    limit?: number
    enabled?: boolean
  },
) {
  const searchParams = new URLSearchParams()
  searchParams.set('entity_type', entityType)
  searchParams.set('entity_id', entityId)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  return useQuery({
    queryKey: commentKeys.list(entityType, entityId),
    queryFn: () => getCommentsApi(searchParams),
    enabled: params?.enabled !== false && Boolean(entityType) && Boolean(entityId),
    staleTime: 30 * 1000,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createCommentApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateCommentApi(params.id, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCommentApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useCommentThread(commentId: string | null) {
  return useQuery({
    queryKey: commentId ? commentKeys.thread(commentId) : ['comments', 'thread', 'disabled'],
    queryFn: () => (commentId ? getCommentThread(commentId) : Promise.resolve(null)),
    enabled: Boolean(commentId),
  })
}

export function useReactToComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { commentId: string; data: Record<string, unknown> }) =>
      reactToCommentApi(params.commentId, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useResolveComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => resolveCommentApi(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useMentionUsers() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => mentionUsersApi(data),
  })
}

/* Stub hook – removed during refactoring, still imported by components */

export function useSearchUsersForMention(query?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...commentKeys.all, 'mention-search', query],
    queryFn: () => Promise.resolve([]),
    enabled:
      options?.enabled !== false && Boolean(query) && (query?.length ?? 0) > 0,
    staleTime: 30 * 1000,
  })
}

export function useToggleReaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (_params: { commentId: string; emoji: string }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}
