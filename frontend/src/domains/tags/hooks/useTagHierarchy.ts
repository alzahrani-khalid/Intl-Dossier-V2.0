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
}): ReturnType<typeof useQuery> {
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

export function useCreateTag(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTagApi(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tagKeys.all }) },
  })
}

export function useUpdateTag(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateTagApi(params.id, params.data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tagKeys.all }) },
  })
}

export function useDeleteTag(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTagApi(id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tagKeys.all }) },
  })
}
