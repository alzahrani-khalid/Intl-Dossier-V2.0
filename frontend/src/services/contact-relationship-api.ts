/**
 * Contact Relationship API Client
 * Part of: 027-contact-directory Phase 6
 *
 * API client for contact relationship operations using Supabase Edge Functions.
 * Handles creating, fetching, and deleting relationships between contacts.
 */

import { supabase } from '@/lib/supabase'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

/**
 * Relationship Type enum matching database values
 */
export type RelationshipType =
  | 'reports_to'
  | 'collaborates_with'
  | 'partner'
  | 'colleague'
  | 'other'

/**
 * Base contact relationship fields matching the database row
 */
export interface ContactRelationship {
  id: string
  from_contact_id: string
  to_contact_id: string
  relationship_type: RelationshipType
  notes?: string | null
  start_date?: string | null
  end_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

/**
 * Relationship Response with expanded contact information
 */
export interface RelationshipResponse extends ContactRelationship {
  from_contact?: {
    id: string
    full_name: string
    position?: string | null
    organization_id?: string | null
  }
  to_contact?: {
    id: string
    full_name: string
    position?: string | null
    organization_id?: string | null
  }
}

/**
 * Create Relationship Input
 */
export interface CreateRelationshipInput {
  from_contact_id: string
  to_contact_id: string
  relationship_type: RelationshipType
  notes?: string
  start_date?: string
  end_date?: string
}

/**
 * API Error
 */
export class RelationshipAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'RelationshipAPIError'
  }
}

/**
 * Get authorization headers with current user's JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new RelationshipAPIError('Not authenticated', 401)
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Handle Edge Function responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // Ignore JSON parse errors
    }
    throw new RelationshipAPIError(errorMessage, response.status)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new RelationshipAPIError('Failed to parse response', response.status, error)
  }
}

/**
 * Create a new relationship between contacts
 */
export async function createRelationship(
  input: CreateRelationshipInput,
): Promise<RelationshipResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${supabaseUrl}/functions/v1/relationships-manage`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  return handleResponse<RelationshipResponse>(response)
}

/**
 * Get all relationships for a specific contact
 * Returns both outgoing (from_contact_id) and incoming (to_contact_id) relationships
 */
export async function getRelationshipsForContact(
  contactId: string,
): Promise<RelationshipResponse[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${supabaseUrl}/functions/v1/relationships-manage?contact_id=${contactId}`,
    {
      method: 'GET',
      headers,
    },
  )

  const data = await handleResponse<{ relationships: RelationshipResponse[] }>(response)
  return data.relationships
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(relationshipId: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${supabaseUrl}/functions/v1/relationships-manage?relationship_id=${relationshipId}`,
    {
      method: 'DELETE',
      headers,
    },
  )

  await handleResponse<{ success: boolean }>(response)
}

/**
 * Get relationship statistics for a contact
 * Returns count by relationship type
 */
export interface RelationshipStats {
  total: number
  by_type: Record<RelationshipType, number>
}

export async function getRelationshipStats(contactId: string): Promise<RelationshipStats> {
  const relationships = await getRelationshipsForContact(contactId)

  const stats: RelationshipStats = {
    total: relationships.length,
    by_type: {
      reports_to: 0,
      collaborates_with: 0,
      partner: 0,
      colleague: 0,
      other: 0,
    },
  }

  relationships.forEach((rel) => {
    stats.by_type[rel.relationship_type as RelationshipType]++
  })

  return stats
}
