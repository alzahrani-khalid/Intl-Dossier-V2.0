/**
 * Saved Search Templates Hook
 * Feature: advanced-search-filters
 * Description: TanStack Query hooks for managing search templates and presets
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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

// API base URL
const getApiUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-templates`

// Get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.session.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// Fetch templates list
async function fetchTemplates(params: {
  category?: TemplateCategory
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: string
}): Promise<TemplateListResponse> {
  const headers = await getAuthHeaders()
  const url = new URL(getApiUrl())

  if (params.category) url.searchParams.set('category', params.category)
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.offset) url.searchParams.set('offset', params.offset.toString())
  if (params.sortBy) url.searchParams.set('sort_by', params.sortBy)
  if (params.sortOrder) url.searchParams.set('sort_order', params.sortOrder)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch templates')
  }

  return response.json()
}

// Fetch single template
async function fetchTemplate(id: string): Promise<{ data: SearchTemplate }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${id}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch template')
  }

  return response.json()
}

// Create template
async function createTemplate(data: CreateTemplateRequest): Promise<{ data: SearchTemplate }> {
  const headers = await getAuthHeaders()
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create template')
  }

  return response.json()
}

// Update template
async function updateTemplate(params: {
  id: string
  data: UpdateTemplateRequest
}): Promise<{ data: SearchTemplate }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(params.data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update template')
  }

  return response.json()
}

// Delete template
async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete template')
  }

  return response.json()
}

// Hook: List templates
export function useSearchTemplates(params?: {
  category?: TemplateCategory
  limit?: number
  offset?: number
  enabled?: boolean
}) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook: Get popular templates
export function usePopularTemplates(limit = 5) {
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

// Hook: Get recent templates (user's recent)
export function useRecentTemplates(limit = 5) {
  return useQuery({
    queryKey: templateKeys.recent(),
    queryFn: () =>
      fetchTemplates({
        category: 'recent',
        limit,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      }),
    staleTime: 60 * 1000, // 1 minute (more dynamic)
  })
}

// Hook: Get system templates (quick access)
export function useSystemTemplates() {
  return useQuery({
    queryKey: templateKeys.system(),
    queryFn: () =>
      fetchTemplates({
        category: 'system',
        limit: 20,
      }),
    staleTime: 30 * 60 * 1000, // 30 minutes (system templates rarely change)
  })
}

// Hook: Get quick templates (quick category for fast access)
export function useQuickTemplates() {
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
export function useSearchTemplate(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: id ? templateKeys.detail(id) : ['search-templates', 'disabled'],
    queryFn: () => (id ? fetchTemplate(id) : Promise.resolve(null)),
    enabled: options?.enabled !== false && id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

// Mutation: Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      // Invalidate all template lists to refresh
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })

      // Add the new template to cache
      queryClient.setQueryData(templateKeys.detail(data.data.id), data)
    },
  })
}

// Mutation: Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data, variables) => {
      // Update the cached template
      queryClient.setQueryData(templateKeys.detail(variables.id), data)

      // Invalidate lists to refresh ordering
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })
}

// Mutation: Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: templateKeys.detail(id) })

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })
}

// Hook: Prefetch template for hover state
export function usePrefetchTemplate() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
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
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-200 dark:border-pink-800',
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      hover: 'hover:bg-teal-100 dark:hover:bg-teal-900',
    },
  }

  return colorMap[color] || colorMap.gray
}

// Helper: Get icon component name for template
export function getTemplateIconName(icon: string): string {
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
