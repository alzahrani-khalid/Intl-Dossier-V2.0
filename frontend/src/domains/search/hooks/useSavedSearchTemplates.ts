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
// Phase 58-W6 (D-05/D-07/D-08/D-09): user-selected color labels alias to semantic tokens.
// D-07 collision: blue (accent) coexists with purple/pink/indigo (all → secondary, no
// per-family semantic exists). orange and yellow both → warning. teal → info.
export function getTemplateColorClasses(color: string): {
  bg: string
  text: string
  border: string
  hover: string
} {
  const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: {
      bg: 'bg-accent/5 dark:bg-accent/20',
      text: 'text-accent',
      border: 'border-accent/20 dark:border-accent/70',
      hover: 'hover:bg-accent/10 dark:hover:bg-accent/30',
    },
    green: {
      bg: 'bg-success/5 dark:bg-success/20',
      text: 'text-success',
      border: 'border-success/20 dark:border-success/70',
      hover: 'hover:bg-success/10 dark:hover:bg-success/30',
    },
    red: {
      bg: 'bg-danger/5 dark:bg-danger/20',
      text: 'text-danger',
      border: 'border-danger/20 dark:border-danger/70',
      hover: 'hover:bg-danger/10 dark:hover:bg-danger/30',
    },
    purple: {
      bg: 'bg-secondary/5 dark:bg-secondary/20',
      text: 'text-secondary',
      border: 'border-secondary/20 dark:border-secondary/70',
      hover: 'hover:bg-secondary/10 dark:hover:bg-secondary/30',
    },
    orange: {
      bg: 'bg-warning/5 dark:bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/20 dark:border-warning/70',
      hover: 'hover:bg-warning/10 dark:hover:bg-warning/30',
    },
    yellow: {
      bg: 'bg-warning/5 dark:bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/20 dark:border-warning/70',
      hover: 'hover:bg-warning/10 dark:hover:bg-warning/30',
    },
    gray: {
      bg: 'bg-muted/5 dark:bg-muted/20',
      text: 'text-muted-foreground',
      border: 'border-muted/20 dark:border-muted/70',
      hover: 'hover:bg-muted/10 dark:hover:bg-muted/30',
    },
    pink: {
      bg: 'bg-secondary/5 dark:bg-secondary/20',
      text: 'text-secondary',
      border: 'border-secondary/20 dark:border-secondary/70',
      hover: 'hover:bg-secondary/10 dark:hover:bg-secondary/30',
    },
    indigo: {
      bg: 'bg-secondary/5 dark:bg-secondary/20',
      text: 'text-secondary',
      border: 'border-secondary/20 dark:border-secondary/70',
      hover: 'hover:bg-secondary/10 dark:hover:bg-secondary/30',
    },
    teal: {
      bg: 'bg-info/5 dark:bg-info/20',
      text: 'text-info',
      border: 'border-info/20 dark:border-info/70',
      hover: 'hover:bg-info/10 dark:hover:bg-info/30',
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
