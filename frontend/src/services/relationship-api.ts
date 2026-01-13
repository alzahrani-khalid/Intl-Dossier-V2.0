/**
 * Relationship API Client
 * Part of: 026-unified-dossier-architecture implementation
 * Updated for: universal-relationship-crud feature
 *
 * Typed API client for dossier relationship operations using universal relationship model.
 * Handles bidirectional relationships between any dossier types for graph traversal.
 */

import { supabase } from '@/lib/supabase'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

/**
 * Relationship Types - Comprehensive list for all dossier types
 */
export type RelationshipType =
  | 'member_of'
  | 'participates_in'
  | 'cooperates_with'
  | 'bilateral_relation'
  | 'partnership'
  | 'parent_of'
  | 'subsidiary_of'
  | 'related_to'
  | 'represents'
  | 'hosted_by'
  | 'sponsored_by'
  | 'involves'
  | 'discusses'
  | 'participant_in'
  | 'observer_of'
  | 'affiliate_of'
  | 'successor_of'
  | 'predecessor_of'
  // Legacy types for backward compatibility
  | 'membership'
  | 'parent_child'
  | 'participation'
  | 'affiliation'
  | 'dependency'
  | 'collaboration'

/**
 * Relationship Status
 */
export type RelationshipStatus = 'active' | 'historical' | 'terminated'

/**
 * Dossier Reference in relationship context
 */
export interface DossierReference {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
}

/**
 * API Request types
 */
export interface CreateRelationshipRequest {
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: RelationshipType
  relationship_metadata?: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: RelationshipStatus
  // Legacy field mappings
  description_en?: string
  description_ar?: string
  metadata?: Record<string, unknown>
  effective_until?: string
}

export interface UpdateRelationshipRequest {
  relationship_type?: RelationshipType
  relationship_metadata?: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: RelationshipStatus
  // Legacy field mappings
  description_en?: string
  description_ar?: string
  metadata?: Record<string, unknown>
  effective_until?: string
}

export interface RelationshipFilters {
  source_dossier_id?: string
  target_dossier_id?: string
  dossier_id?: string
  relationship_type?: RelationshipType
  status?: RelationshipStatus
  page?: number
  page_size?: number
  limit?: number
  offset?: number
}

export interface RelationshipWithDossiers {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: RelationshipType
  relationship_metadata: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status: RelationshipStatus
  created_at: string
  created_by?: string
  source_dossier?: DossierReference
  target_dossier?: DossierReference
}

export interface RelationshipsListResponse {
  data: RelationshipWithDossiers[]
  pagination: {
    total?: number
    limit: number
    offset: number
    has_more: boolean
  }
  // Legacy format for backward compatibility
  relationships?: RelationshipWithDossiers[]
  total_count?: number
  page?: number
  page_size?: number
}

/**
 * API Error class
 */
export class RelationshipAPIError extends Error {
  code: string
  status: number
  details?: any

  constructor(message: string, status: number, code: string, details?: any) {
    super(message)
    this.name = 'RelationshipAPIError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Helper function to get auth headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new RelationshipAPIError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: any
    try {
      error = await response.json()
    } catch {
      error = { message: response.statusText }
    }

    throw new RelationshipAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details,
    )
  }

  return response.json()
}

/**
 * Helper to normalize request for new API format
 */
function normalizeRequest(
  request: CreateRelationshipRequest | UpdateRelationshipRequest,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...request }

  // Map legacy fields to new fields
  if ('description_en' in request && !('notes_en' in request)) {
    normalized.notes_en = request.description_en
  }
  if ('description_ar' in request && !('notes_ar' in request)) {
    normalized.notes_ar = request.description_ar
  }
  if ('metadata' in request && !('relationship_metadata' in request)) {
    normalized.relationship_metadata = request.metadata
  }
  if ('effective_until' in request && !('effective_to' in request)) {
    normalized.effective_to = request.effective_until
  }

  // Remove legacy fields
  delete normalized.description_en
  delete normalized.description_ar
  delete normalized.metadata
  delete normalized.effective_until

  return normalized
}

/**
 * Create a new relationship
 */
export async function createRelationship(
  request: CreateRelationshipRequest,
): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders()
  const normalizedRequest = normalizeRequest(request)

  const response = await fetch(`${supabaseUrl}/functions/v1/dossier-relationships`, {
    method: 'POST',
    headers,
    body: JSON.stringify(normalizedRequest),
  })

  return handleResponse<RelationshipWithDossiers>(response)
}

/**
 * Get a relationship by ID
 */
export async function getRelationship(id: string): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${supabaseUrl}/functions/v1/dossier-relationships/${id}`, {
    method: 'GET',
    headers,
  })

  return handleResponse<RelationshipWithDossiers>(response)
}

/**
 * Update a relationship
 */
export async function updateRelationship(
  id: string,
  request: UpdateRelationshipRequest,
): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders()
  const normalizedRequest = normalizeRequest(request)

  const response = await fetch(`${supabaseUrl}/functions/v1/dossier-relationships/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(normalizedRequest),
  })

  return handleResponse<RelationshipWithDossiers>(response)
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(id: string): Promise<{ success: boolean; id: string }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${supabaseUrl}/functions/v1/dossier-relationships/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new RelationshipAPIError(
      error.message || 'Failed to delete relationship',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details,
    )
  }

  return response.json()
}

/**
 * List relationships with filters
 */
export async function listRelationships(
  filters?: RelationshipFilters,
): Promise<RelationshipsListResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (filters) {
    // Map pagination params
    if (filters.page !== undefined && filters.page_size !== undefined) {
      params.append('offset', String(filters.page * filters.page_size))
      params.append('limit', String(filters.page_size))
    }
    if (filters.limit !== undefined) params.append('limit', String(filters.limit))
    if (filters.offset !== undefined) params.append('offset', String(filters.offset))

    // Map filter params
    if (filters.source_dossier_id) params.append('source_dossier_id', filters.source_dossier_id)
    if (filters.target_dossier_id) params.append('target_dossier_id', filters.target_dossier_id)
    if (filters.dossier_id) params.append('dossier_id', filters.dossier_id)
    if (filters.relationship_type) params.append('relationship_type', filters.relationship_type)
    if (filters.status) params.append('status', filters.status)
  }

  const url = `${supabaseUrl}/functions/v1/dossier-relationships${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleResponse<RelationshipsListResponse>(response)
}

/**
 * Get all relationships for a dossier (bidirectional)
 */
export async function getRelationshipsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number,
): Promise<RelationshipsListResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (page !== undefined && page_size !== undefined) {
    params.append('offset', String(page * page_size))
    params.append('limit', String(page_size))
  }

  const url = `${supabaseUrl}/functions/v1/dossier-relationships/dossier/${dossierId}${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleResponse<RelationshipsListResponse>(response)
}

/**
 * Get relationships by type
 */
export async function getRelationshipsByType(
  dossierId: string,
  relationshipType: RelationshipType,
  page?: number,
  page_size?: number,
): Promise<RelationshipsListResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  params.append('relationship_type', relationshipType)
  if (page !== undefined && page_size !== undefined) {
    params.append('offset', String(page * page_size))
    params.append('limit', String(page_size))
  }

  const url = `${supabaseUrl}/functions/v1/dossier-relationships/dossier/${dossierId}?${params.toString()}`
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleResponse<RelationshipsListResponse>(response)
}
