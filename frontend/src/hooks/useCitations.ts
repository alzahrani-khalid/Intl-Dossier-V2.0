/**
 * Citation Tracking Hooks
 * Feature: citation-tracking
 *
 * TanStack Query hooks for managing citations between dossiers, briefs, and external sources.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import type {
  Citation,
  CitationCreate,
  CitationUpdate,
  CitationListParams,
  CitationListResponse,
  EntityCitationsParams,
  EntityCitation,
  CitationNetworkParams,
  CitationNetworkGraph,
  DetectCitationsParams,
  CitationDetectionResponse,
  CitationAlertListParams,
  CitationAlertListResponse,
  CitationAlert,
} from '@/types/citation.types'

// ============================================================================
// Query Keys
// ============================================================================

export const citationKeys = {
  all: ['citations'] as const,
  lists: () => [...citationKeys.all, 'list'] as const,
  list: (params: CitationListParams) => [...citationKeys.lists(), params] as const,
  details: () => [...citationKeys.all, 'detail'] as const,
  detail: (id: string) => [...citationKeys.details(), id] as const,
  entity: (type: string, id: string) => [...citationKeys.all, 'entity', type, id] as const,
  network: (type: string, id: string) => [...citationKeys.all, 'network', type, id] as const,
  alerts: () => [...citationKeys.all, 'alerts'] as const,
  alertsList: (params: CitationAlertListParams) => [...citationKeys.alerts(), params] as const,
}

// ============================================================================
// API Functions
// ============================================================================

const EDGE_FUNCTION_URL = '/functions/v1/citation-tracking'

async function fetchCitations(params: CitationListParams): Promise<CitationListResponse> {
  const searchParams = new URLSearchParams()

  if (params.citing_type) searchParams.set('citing_type', params.citing_type)
  if (params.citing_id) searchParams.set('citing_id', params.citing_id)
  if (params.cited_type) searchParams.set('cited_type', params.cited_type)
  if (params.cited_id) searchParams.set('cited_id', params.cited_id)
  if (params.status) searchParams.set('status', params.status)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
    method: 'GET',
    body: null,
    headers: {},
  })

  // Since functions.invoke doesn't support query params well, use direct fetch
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}?${searchParams.toString()}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to fetch citations')
  }

  return response.json()
}

async function fetchCitation(id: string): Promise<Citation> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/${id}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to fetch citation')
  }

  return response.json()
}

async function fetchEntityCitations(params: EntityCitationsParams): Promise<EntityCitation[]> {
  const { data: session } = await supabase.auth.getSession()
  const searchParams = new URLSearchParams()

  if (params.direction) searchParams.set('direction', params.direction)
  if (params.include_external !== undefined)
    searchParams.set('include_external', String(params.include_external))
  if (params.limit) searchParams.set('limit', String(params.limit))

  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/entity/${params.entity_type}/${params.entity_id}?${searchParams.toString()}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to fetch entity citations')
  }

  const result = await response.json()
  return result.data || []
}

async function fetchCitationNetwork(params: CitationNetworkParams): Promise<CitationNetworkGraph> {
  const { data: session } = await supabase.auth.getSession()
  const searchParams = new URLSearchParams()

  if (params.depth) searchParams.set('depth', String(params.depth))
  if (params.max_nodes) searchParams.set('max_nodes', String(params.max_nodes))

  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/network/${params.entity_type}/${params.entity_id}?${searchParams.toString()}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to fetch citation network')
  }

  return response.json()
}

async function createCitation(citation: CitationCreate): Promise<Citation> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(citation),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to create citation')
  }

  return response.json()
}

async function updateCitation(id: string, updates: CitationUpdate): Promise<Citation> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/${id}`

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to update citation')
  }

  return response.json()
}

async function deleteCitation(id: string): Promise<{ success: boolean; id: string }> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/${id}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to delete citation')
  }

  return response.json()
}

async function detectCitations(params: DetectCitationsParams): Promise<CitationDetectionResponse> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/detect`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to detect citations')
  }

  return response.json()
}

async function fetchCitationAlerts(
  params: CitationAlertListParams,
): Promise<CitationAlertListResponse> {
  const { data: session } = await supabase.auth.getSession()
  const searchParams = new URLSearchParams()

  if (params.unread_only) searchParams.set('unread_only', 'true')
  if (params.unresolved_only !== undefined)
    searchParams.set('unresolved_only', String(params.unresolved_only))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))

  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/alerts?${searchParams.toString()}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to fetch citation alerts')
  }

  return response.json()
}

async function resolveAlert(alertId: string, resolutionNote?: string): Promise<CitationAlert> {
  const { data: session } = await supabase.auth.getSession()
  const url = `${supabase.supabaseUrl}${EDGE_FUNCTION_URL}/alerts/${alertId}/resolve`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolution_note: resolutionNote }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message_en || 'Failed to resolve alert')
  }

  return response.json()
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch list of citations with filters
 */
export function useCitations(params: CitationListParams = {}) {
  return useQuery({
    queryKey: citationKeys.list(params),
    queryFn: () => fetchCitations(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch a single citation by ID
 */
export function useCitation(id: string, enabled = true) {
  return useQuery({
    queryKey: citationKeys.detail(id),
    queryFn: () => fetchCitation(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch citations for a specific entity (incoming and/or outgoing)
 */
export function useEntityCitations(params: EntityCitationsParams, enabled = true) {
  return useQuery({
    queryKey: citationKeys.entity(params.entity_type, params.entity_id),
    queryFn: () => fetchEntityCitations(params),
    enabled: enabled && !!params.entity_type && !!params.entity_id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch citation network graph for visualization
 */
export function useCitationNetwork(params: CitationNetworkParams, enabled = true) {
  return useQuery({
    queryKey: citationKeys.network(params.entity_type, params.entity_id),
    queryFn: () => fetchCitationNetwork(params),
    enabled: enabled && !!params.entity_type && !!params.entity_id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch citation alerts
 */
export function useCitationAlerts(params: CitationAlertListParams = {}) {
  return useQuery({
    queryKey: citationKeys.alertsList(params),
    queryFn: () => fetchCitationAlerts(params),
    staleTime: 1000 * 60 * 2, // 2 minutes for alerts
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new citation
 */
export function useCreateCitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCitation,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: citationKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: citationKeys.entity(data.citing_entity_type, data.citing_entity_id),
      })
      if (data.cited_entity_id) {
        queryClient.invalidateQueries({
          queryKey: citationKeys.entity(data.cited_entity_type, data.cited_entity_id),
        })
      }
    },
  })
}

/**
 * Update an existing citation
 */
export function useUpdateCitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CitationUpdate }) =>
      updateCitation(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: citationKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: citationKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: citationKeys.entity(data.citing_entity_type, data.citing_entity_id),
      })
    },
  })
}

/**
 * Delete a citation
 */
export function useDeleteCitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCitation,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: citationKeys.lists() })
      // Also invalidate entity queries (we don't know which ones, so invalidate all)
      queryClient.invalidateQueries({ queryKey: citationKeys.all })
    },
  })
}

/**
 * Detect citations in text
 */
export function useDetectCitations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: detectCitations,
    onSuccess: (data) => {
      // If citations were auto-created, invalidate lists
      if (data.created && data.created.length > 0) {
        queryClient.invalidateQueries({ queryKey: citationKeys.lists() })
      }
    },
  })
}

/**
 * Resolve a citation alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, resolutionNote }: { alertId: string; resolutionNote?: string }) =>
      resolveAlert(alertId, resolutionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: citationKeys.alerts() })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get citation statistics for an entity
 */
export function useEntityCitationStats(entityType: string, entityId: string, enabled = true) {
  const { data: citations } = useEntityCitations(
    {
      entity_type: entityType as any,
      entity_id: entityId,
      direction: 'both',
    },
    enabled,
  )

  const stats = {
    outgoing: citations?.filter((c) => c.direction === 'outgoing').length || 0,
    incoming: citations?.filter((c) => c.direction === 'incoming').length || 0,
    total: citations?.length || 0,
    external: citations?.filter((c) => c.external_url).length || 0,
  }

  return stats
}

/**
 * Get unread alert count
 */
export function useUnreadAlertCount() {
  const { data } = useCitationAlerts({ unread_only: true, limit: 100 })
  return data?.data.length || 0
}
