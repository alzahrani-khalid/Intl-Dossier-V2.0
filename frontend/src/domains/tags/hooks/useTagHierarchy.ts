/**
 * Tag Hierarchy Hook
 * @module domains/tags/hooks/useTagHierarchy
 *
 * Hooks for tag hierarchy management.
 * API calls delegated to tags.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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

export interface TagMergeHistoryEntry {
  id: string
  source_tag_name_en: string
  source_tag_name_ar: string
  target_tag_id: string
  merged_at: string
  assignments_transferred: number
  merge_reason?: string
}

export interface TagRenameHistoryEntry {
  id: string
  old_name_en: string
  old_name_ar: string
  new_name_en: string
  new_name_ar: string
  renamed_at: string
  rename_reason?: string
}

export function useTagMergeHistory() {
  return useQuery<TagMergeHistoryEntry[]>({
    queryKey: [...tagKeys.all, 'mergeHistory'] as const,
    queryFn: () => Promise.resolve<TagMergeHistoryEntry[]>([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTagRenameHistory() {
  return useQuery<TagRenameHistoryEntry[]>({
    queryKey: [...tagKeys.all, 'renameHistory'] as const,
    queryFn: () => Promise.resolve<TagRenameHistoryEntry[]>([]),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTagSearch(query: string, enabled = true) {
  return useTagHierarchy({ search: query, enabled: enabled && query.length > 0 })
}

import type { EntityTagAssignment, TagSuggestion } from '@/types/tag-hierarchy.types'

export interface EntityTaggingState {
  tags: EntityTagAssignment[]
  suggestions: TagSuggestion[]
  isLoadingTags: boolean
  assignTag: (tagId: string, opts?: { is_auto_assigned?: boolean }) => Promise<unknown>
  unassignTag: (tagId: string) => Promise<unknown>
  isAssigning: boolean
  isUnassigning: boolean
}

const NOOP_TAG_ASYNC = (): Promise<unknown> => Promise.resolve()

export function useEntityTagging(): EntityTaggingState {
  return {
    tags: [],
    suggestions: [],
    isLoadingTags: false,
    assignTag: NOOP_TAG_ASYNC,
    unassignTag: NOOP_TAG_ASYNC,
    isAssigning: false,
    isUnassigning: false,
  }
}

/** The `tag-hierarchy/analytics` envelope. `data` rows are `mv_tag_usage_analytics` verbatim. */
export interface TagAnalyticsEnvelope {
  data: Array<Record<string, unknown>>
  total: number
  last_refreshed: string
}

/**
 * D-25: this was a refactor stub that resolved a hardcoded zero-object and never touched the
 * network. It always SUCCEEDED with a shape the component could not read, so the component's
 * `!stats` branch painted "Failed to load tags" over a success: an error rendered over a
 * success, the inverse of this phase's defect and the same class of lie.
 *
 * `mv_tag_usage_analytics` (read by supabase/functions/tag-hierarchy/index.ts:239-252) already
 * matches TagAnalytics.tsx's row type column-for-column, so this repoints rather than inventing
 * a shape. A rejection now reaches `isError` and renders the shared error state.
 */
export function useTagAnalytics() {
  return useQuery<TagAnalyticsEnvelope>({
    queryKey: [...tagKeys.all, 'analytics'] as const,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('tag-hierarchy/analytics', {
        method: 'GET',
      })
      if (error) throw error
      return data as TagAnalyticsEnvelope
    },
    staleTime: 5 * 60 * 1000,
    // An invoke rejection carries no numeric status, so query-client.ts's 4xx short-circuit never
    // fires and the default ladder would run all four attempts. Cap at 2 (UI-SPEC retry policy).
    retry: 2,
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
