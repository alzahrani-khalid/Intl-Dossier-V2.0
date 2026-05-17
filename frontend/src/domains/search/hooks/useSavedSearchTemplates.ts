/**
 * Saved Search Templates Hook
 * @module domains/search/hooks/useSavedSearchTemplates
 *
 * TanStack Query hooks for managing search templates and presets.
 * API calls delegated to search.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type {
  SearchTemplate,
  TemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateCategory,
} from '@/types/advanced-search.types'

// Query key factory
export const templateKeys = {
  all: ['search-templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: { category?: TemplateCategory; limit?: number; offset?: number }) =>
    [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  popular: () => [...templateKeys.all, 'popular'] as const,
  recent: () => [...templateKeys.all, 'recent'] as const,
  system: () => [...templateKeys.all, 'system'] as const,
}

// ============================================================================
// Repository functions (using apiClient)
// ============================================================================

async function fetchTemplates(params: {
  category?: TemplateCategory
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: string
}): Promise<TemplateListResponse> {
  const searchParams = new URLSearchParams()
  if (params.category) searchParams.set('category', params.category)
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  if (params.sortBy) searchParams.set('sort_by', params.sortBy)
  if (params.sortOrder) searchParams.set('sort_order', params.sortOrder)
  const query = searchParams.toString()
  return apiGet<TemplateListResponse>(`/search-templates${query ? `?${query}` : ''}`)
}

async function fetchTemplate(id: string): Promise<{ data: SearchTemplate }> {
  return apiGet<{ data: SearchTemplate }>(`/search-templates/${id}`)
}

async function createTemplate(data: CreateTemplateRequest): Promise<{ data: SearchTemplate }> {
  return apiPost<{ data: SearchTemplate }>('/search-templates', data)
}

async function updateTemplate(params: {
  id: string
  data: UpdateTemplateRequest
}): Promise<{ data: SearchTemplate }> {
  return apiPut<{ data: SearchTemplate }>(`/search-templates/${params.id}`, params.data)
}

async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/search-templates/${id}`)
}

// ============================================================================
// Hooks
// ============================================================================

// Hook: List templates
function useSearchTemplates(params?: {
  category?: TemplateCategory
  limit?: number
  offset?: number
  enabled?: boolean
}): ReturnType<typeof useQuery<TemplateListResponse>> {
  return useQuery({
    queryKey: templateKeys.list({
      category: params?.category,
      limit: params?.limit,
      offset: params?.offset,
    }),
    queryFn: () =>
      fetchTemplates({
        category: params?.category,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      }),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook: Get popular templates
export function usePopularTemplates(limit = 5): ReturnType<typeof useQuery<TemplateListResponse>> {
  return useQuery({
    queryKey: templateKeys.popular(),
    queryFn: () =>
      fetchTemplates({
        limit,
        sortBy: 'use_count',
        sortOrder: 'desc',
      }),
    staleTime: 5 * 60 * 1000,
  })
}

// Hook: Get recent templates
function useRecentTemplates(limit = 5): ReturnType<typeof useQuery<TemplateListResponse>> {
  return useQuery({
    queryKey: templateKeys.recent(),
    queryFn: () =>
      fetchTemplates({
        category: 'recent',
        limit,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      }),
    staleTime: 60 * 1000,
  })
}

// Hook: Get system templates
function useSystemTemplates(): ReturnType<typeof useQuery<TemplateListResponse>> {
  return useQuery({
    queryKey: templateKeys.system(),
    queryFn: () =>
      fetchTemplates({
        category: 'system',
        limit: 20,
      }),
    staleTime: 30 * 60 * 1000,
  })
}

// Hook: Get quick templates
export function useQuickTemplates(): ReturnType<typeof useQuery<TemplateListResponse>> {
  return useQuery({
    queryKey: templateKeys.list({ category: 'quick' }),
    queryFn: () =>
      fetchTemplates({
        category: 'quick',
        limit: 10,
      }),
    staleTime: 5 * 60 * 1000,
  })
}

// Hook: Get single template
function useSearchTemplate(
  id: string | null,
  options?: { enabled?: boolean },
): ReturnType<typeof useQuery<{ data: SearchTemplate } | null>> {
  return useQuery({
    queryKey: id ? templateKeys.detail(id) : ['search-templates', 'disabled'],
    queryFn: () => (id ? fetchTemplate(id) : Promise.resolve(null)),
    enabled: options?.enabled !== false && id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

// Mutation: Create template
export function useCreateTemplate(): ReturnType<
  typeof useMutation<{ data: SearchTemplate }, Error, CreateTemplateRequest>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.setQueryData(templateKeys.detail(data.data.id), data)
    },
  })
}

// Mutation: Update template
function useUpdateTemplate(): ReturnType<
  typeof useMutation<{ data: SearchTemplate }, Error, { id: string; data: UpdateTemplateRequest }>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(templateKeys.detail(variables.id), data)
      void queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })
}

// Mutation: Delete template
export function useDeleteTemplate(): ReturnType<
  typeof useMutation<{ success: boolean }, Error, string>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: templateKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })
}

// Hook: Prefetch template for hover state
function usePrefetchTemplate(): (id: string) => void {
  const queryClient = useQueryClient()

  return (id: string): void => {
    void queryClient.prefetchQuery({
      queryKey: templateKeys.detail(id),
      queryFn: () => fetchTemplate(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// Helper: Get template color classes
export function getTemplateColorClasses(color: string): {
  bg: string
  text: string
  border: string
  hover: string
} {
  const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-blue-50 dark:bg-blue-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-blue-700 dark:text-blue-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-blue-200 dark:border-blue-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
    },
    green: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-green-50 dark:bg-green-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-green-700 dark:text-green-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-green-200 dark:border-green-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
    },
    red: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-red-50 dark:bg-red-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-red-700 dark:text-red-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-red-200 dark:border-red-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
    },
    purple: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-purple-50 dark:bg-purple-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-purple-700 dark:text-purple-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-purple-200 dark:border-purple-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900',
    },
    orange: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-orange-50 dark:bg-orange-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-orange-700 dark:text-orange-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-orange-200 dark:border-orange-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
    },
    yellow: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-yellow-700 dark:text-yellow-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-yellow-200 dark:border-yellow-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900',
    },
    gray: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-gray-50 dark:bg-gray-900',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-gray-700 dark:text-gray-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-gray-200 dark:border-gray-700',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    },
    pink: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-pink-50 dark:bg-pink-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-pink-700 dark:text-pink-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-pink-200 dark:border-pink-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900',
    },
    indigo: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-indigo-700 dark:text-indigo-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-indigo-200 dark:border-indigo-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
    },
    teal: {
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      bg: 'bg-teal-50 dark:bg-teal-950',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      text: 'text-teal-700 dark:text-teal-300',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      border: 'border-teal-200 dark:border-teal-800',
      // eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#useSavedSearchTemplates
      hover: 'hover:bg-teal-100 dark:hover:bg-teal-900',
    },
  }

  return (colorMap[color] || colorMap.gray)!
}

function getTemplateIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    search: 'Search',
    'file-text': 'FileText',
    'folder-open': 'FolderOpen',
    shield: 'Shield',
    calendar: 'Calendar',
    history: 'History',
    file: 'File',
    folder: 'Folder',
    users: 'Users',
    user: 'User',
    globe: 'Globe',
    building: 'Building',
    tag: 'Tag',
    star: 'Star',
    bookmark: 'Bookmark',
    filter: 'Filter',
    clock: 'Clock',
  }

  return iconMap[icon] || 'Search'
}

export {
  useSearchTemplates,
  useRecentTemplates,
  useSystemTemplates,
  useSearchTemplate,
  useUpdateTemplate,
  usePrefetchTemplate,
  getTemplateIconName,
}
