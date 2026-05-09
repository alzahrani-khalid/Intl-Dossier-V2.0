/**
 * Tag Hierarchy Hook
 * @module domains/tags/hooks/useTagHierarchy
 *
 * Hooks for tag hierarchy management.
 * API calls delegated to tags.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTagHierarchy as getTagHierarchyApi,
  createTag as createTagApi,
  updateTag as updateTagApi,
  deleteTag as deleteTagApi,
} from '../repositories/tags.repository'

export const tagKeys = {
  all: ['tags'] as const,
  hierarchy: (params?: Record<string, unknown>) => [...tagKeys.all, 'hierarchy', params] as const,
}

export function useTagHierarchy(params?: {
  search?: string
  parentId?: string
  enabled?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.parentId) searchParams.set('parent_id', params.parentId)

  return useQuery({
    queryKey: tagKeys.hierarchy(params),
    queryFn: () => getTagHierarchyApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTagApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateTagApi(params.id, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTagApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useTagHierarchyTree() {
  return useTagHierarchy()
}

export function useTagsFlat(enabled = true) {
  return useTagHierarchy({ enabled })
}

export function useTagMergeHistory() {
  return useQuery({
    queryKey: [...tagKeys.all, 'mergeHistory'] as const,
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTagRenameHistory() {
  return useQuery({
    queryKey: [...tagKeys.all, 'renameHistory'] as const,
    queryFn: () => Promise.resolve([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTagSearch(query: string, enabled = true) {
  return useTagHierarchy({ search: query, enabled: enabled && query.length > 0 })
}

export function useEntityTagging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => Promise.resolve(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useTagAnalytics() {
  return useQuery({
    queryKey: [...tagKeys.all, 'analytics'] as const,
    queryFn: () => Promise.resolve({ totalTags: 0, categories: [], usage: [] }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRefreshTagAnalytics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...tagKeys.all, 'analytics'] })
    },
  })
}

export function useMergeTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { sourceId: string; targetId: string }) => Promise.resolve(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}
