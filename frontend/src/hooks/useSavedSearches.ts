/**
 * Saved Searches Hook
 * Feature: saved-searches-feature
 * Description: TanStack Query hooks for saved searches with sharing and alerts
 */

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  SavedSearch,
  SavedSearchListResponse,
  SavedSearchResponse,
  SavedSearchListParams,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  ShareSavedSearchRequest,
  ShareResponse,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertResponse,
  ExecuteSearchResponse,
  SmartFilter,
  SavedSearchCategory,
} from '@/types/saved-search.types'

// Query key factory
export const savedSearchKeys = {
  all: ['saved-searches'] as const,
  lists: () => [...savedSearchKeys.all, 'list'] as const,
  list: (params: SavedSearchListParams) => [...savedSearchKeys.lists(), params] as const,
  pinned: () => [...savedSearchKeys.all, 'pinned'] as const,
  details: () => [...savedSearchKeys.all, 'detail'] as const,
  detail: (id: string) => [...savedSearchKeys.details(), id] as const,
  smartFilters: () => [...savedSearchKeys.all, 'smart-filters'] as const,
  executions: () => [...savedSearchKeys.all, 'executions'] as const,
  execution: (id: string) => [...savedSearchKeys.executions(), id] as const,
}

// API base URL
const getApiUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saved-searches`

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

// Fetch saved searches list
async function fetchSavedSearches(params: SavedSearchListParams): Promise<SavedSearchListResponse> {
  const headers = await getAuthHeaders()
  const url = new URL(getApiUrl())

  if (params.category) url.searchParams.set('category', params.category)
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.offset) url.searchParams.set('offset', params.offset.toString())
  if (params.include_shared !== undefined)
    url.searchParams.set('include_shared', params.include_shared.toString())
  if (params.pinned_only) url.searchParams.set('pinned_only', 'true')

  const response = await fetch(url.toString(), { method: 'GET', headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch saved searches')
  }
  return response.json()
}

// Fetch single saved search
async function fetchSavedSearch(id: string): Promise<SavedSearchResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${id}`, { method: 'GET', headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch saved search')
  }
  return response.json()
}

// Create saved search
async function createSavedSearch(data: CreateSavedSearchRequest): Promise<SavedSearchResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create saved search')
  }
  return response.json()
}

// Update saved search
async function updateSavedSearch(params: {
  id: string
  data: UpdateSavedSearchRequest
}): Promise<SavedSearchResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(params.data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update saved search')
  }
  return response.json()
}

// Delete saved search
async function deleteSavedSearch(id: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${id}`, { method: 'DELETE', headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete saved search')
  }
  return response.json()
}

// Execute saved search
async function executeSavedSearch(id: string): Promise<ExecuteSearchResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${id}/execute`, {
    method: 'POST',
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to execute saved search')
  }
  return response.json()
}

// Share saved search
async function shareSavedSearch(params: {
  id: string
  data: ShareSavedSearchRequest
}): Promise<ShareResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.id}/share`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params.data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to share saved search')
  }
  return response.json()
}

// Delete share
async function deleteShare(params: {
  searchId: string
  shareId: string
}): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.searchId}/share/${params.shareId}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete share')
  }
  return response.json()
}

// Create alert
async function createAlert(params: {
  searchId: string
  data: CreateAlertRequest
}): Promise<AlertResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.searchId}/alert`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params.data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create alert')
  }
  return response.json()
}

// Update alert
async function updateAlert(params: {
  searchId: string
  data: UpdateAlertRequest
}): Promise<AlertResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${params.searchId}/alert`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(params.data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update alert')
  }
  return response.json()
}

// Delete alert
async function deleteAlert(searchId: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/${searchId}/alert`, { method: 'DELETE', headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete alert')
  }
  return response.json()
}

// Fetch smart filters
async function fetchSmartFilters(): Promise<{ data: SmartFilter[]; count: number }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${getApiUrl()}/smart-filters`, { method: 'GET', headers })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch smart filters')
  }
  return response.json()
}

// ============================================================================
// HOOKS
// ============================================================================

// Hook: List saved searches
export function useSavedSearches(params?: SavedSearchListParams) {
  return useQuery({
    queryKey: savedSearchKeys.list(params || {}),
    queryFn: () =>
      fetchSavedSearches({
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        include_shared: params?.include_shared ?? true,
        ...params,
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook: List saved searches with infinite scroll
export function useSavedSearchesInfinite(params?: Omit<SavedSearchListParams, 'offset'>) {
  return useInfiniteQuery({
    queryKey: savedSearchKeys.list(params || {}),
    queryFn: ({ pageParam = 0 }) =>
      fetchSavedSearches({
        limit: params?.limit ?? 20,
        offset: pageParam,
        include_shared: params?.include_shared ?? true,
        ...params,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.metadata.next_offset,
    staleTime: 2 * 60 * 1000,
  })
}

// Hook: Get pinned saved searches
export function usePinnedSearches() {
  return useQuery({
    queryKey: savedSearchKeys.pinned(),
    queryFn: () => fetchSavedSearches({ pinned_only: true, limit: 10 }),
    staleTime: 2 * 60 * 1000,
  })
}

// Hook: Get saved searches by category
export function useSavedSearchesByCategory(category: SavedSearchCategory) {
  return useQuery({
    queryKey: savedSearchKeys.list({ category }),
    queryFn: () => fetchSavedSearches({ category, limit: 50 }),
    staleTime: 2 * 60 * 1000,
  })
}

// Hook: Get single saved search
export function useSavedSearch(id: string | null) {
  return useQuery({
    queryKey: id ? savedSearchKeys.detail(id) : ['saved-searches', 'disabled'],
    queryFn: () => (id ? fetchSavedSearch(id) : Promise.resolve(null)),
    enabled: id !== null,
    staleTime: 2 * 60 * 1000,
  })
}

// Hook: Get smart filters
export function useSmartFilters() {
  return useQuery({
    queryKey: savedSearchKeys.smartFilters(),
    queryFn: fetchSmartFilters,
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely change)
  })
}

// Mutation: Create saved search
export function useCreateSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSavedSearch,
    onSuccess: (data) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.pinned() })
      // Add to cache
      queryClient.setQueryData(savedSearchKeys.detail(data.data.id), data)
    },
  })
}

// Mutation: Update saved search
export function useUpdateSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSavedSearch,
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(savedSearchKeys.detail(variables.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.pinned() })
    },
  })
}

// Mutation: Delete saved search
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: savedSearchKeys.detail(id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.pinned() })
    },
  })
}

// Mutation: Execute saved search
export function useExecuteSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: executeSavedSearch,
    onSuccess: (data, id) => {
      // Cache execution results
      queryClient.setQueryData(savedSearchKeys.execution(id), data)
      // Update use count in cached data
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(id) })
    },
  })
}

// Mutation: Toggle pin
export function useToggleSearchPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      return updateSavedSearch({ id, data: { is_pinned } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.pinned() })
    },
  })
}

// Mutation: Share saved search
export function useShareSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: shareSavedSearch,
    onSuccess: (_, variables) => {
      // Invalidate the search detail to refresh shares
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(variables.id) })
    },
  })
}

// Mutation: Delete share
export function useDeleteShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteShare,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(variables.searchId) })
    },
  })
}

// Mutation: Create alert
export function useCreateSearchAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAlert,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(variables.searchId) })
    },
  })
}

// Mutation: Update alert
export function useUpdateSearchAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAlert,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(variables.searchId) })
    },
  })
}

// Mutation: Delete alert
export function useDeleteSearchAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: (searchId) => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.detail(searchId) })
    },
  })
}

// Hook: Prefetch saved search
export function usePrefetchSavedSearch() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: savedSearchKeys.detail(id),
      queryFn: () => fetchSavedSearch(id),
      staleTime: 2 * 60 * 1000,
    })
  }
}

// Helper: Get color classes for saved search
export function getSavedSearchColorClasses(color: string): {
  bg: string
  text: string
  border: string
  hover: string
  ring: string
} {
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; hover: string; ring: string }
  > = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
      ring: 'ring-blue-500',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900',
      ring: 'ring-green-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900',
      ring: 'ring-red-500',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900',
      ring: 'ring-purple-500',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
      ring: 'ring-orange-500',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900',
      ring: 'ring-yellow-500',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      ring: 'ring-gray-500',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-200 dark:border-pink-800',
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900',
      ring: 'ring-pink-500',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
      ring: 'ring-indigo-500',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      hover: 'hover:bg-teal-100 dark:hover:bg-teal-900',
      ring: 'ring-teal-500',
    },
  }

  return colorMap[color] || colorMap.gray
}
