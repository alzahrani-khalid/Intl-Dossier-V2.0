/**
 * Relationship API Client
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Typed API client for dossier relationship operations using universal relationship model.
 * Handles bidirectional relationships between any dossier types for graph traversal.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '../../../backend/src/types/database.types';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

type DossierRelationship = Database['public']['Tables']['dossier_relationships']['Row'];
type DossierRelationshipInsert = Database['public']['Tables']['dossier_relationships']['Insert'];

/**
 * Relationship Types
 */
export type RelationshipType =
  | 'bilateral_relation'
  | 'membership'
  | 'parent_child'
  | 'participation'
  | 'affiliation'
  | 'dependency'
  | 'collaboration';

/**
 * API Request types
 */
export interface CreateRelationshipRequest {
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: RelationshipType;
  description_en?: string;
  description_ar?: string;
  metadata?: Record<string, unknown>;
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateRelationshipRequest {
  relationship_type?: RelationshipType;
  description_en?: string;
  description_ar?: string;
  metadata?: Record<string, unknown>;
  effective_from?: string;
  effective_until?: string;
}

export interface RelationshipFilters {
  source_dossier_id?: string;
  target_dossier_id?: string;
  relationship_type?: RelationshipType;
  page?: number;
  page_size?: number;
}

export interface RelationshipWithDossiers extends DossierRelationship {
  source_dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    status: string;
  };
  target_dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
    status: string;
  };
}

export interface RelationshipsListResponse {
  relationships: RelationshipWithDossiers[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * API Error class
 */
export class RelationshipAPIError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'RelationshipAPIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper function to get auth headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new RelationshipAPIError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: any;
    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText };
    }

    throw new RelationshipAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details
    );
  }

  return response.json();
}

/**
 * Create a new relationship
 */
export async function createRelationship(
  request: CreateRelationshipRequest
): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-relationships-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<RelationshipWithDossiers>(response);
}

/**
 * Get a relationship by ID
 */
export async function getRelationship(id: string): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/relationships/${id}`, {
    method: 'GET',
    headers,
  });

  return handleResponse<RelationshipWithDossiers>(response);
}

/**
 * Update a relationship
 */
export async function updateRelationship(
  id: string,
  request: UpdateRelationshipRequest
): Promise<RelationshipWithDossiers> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/relationships/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<RelationshipWithDossiers>(response);
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-relationships-delete?id=${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new RelationshipAPIError(
      error.message || 'Failed to delete relationship',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details
    );
  }
}

/**
 * List relationships with filters
 */
export async function listRelationships(
  filters?: RelationshipFilters
): Promise<RelationshipsListResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Map source_dossier_id to dossierId for the Edge Function
        const paramKey = key === 'source_dossier_id' ? 'dossierId' : key;
        params.append(paramKey, String(value));
      }
    });
  }

  const url = `${supabaseUrl}/functions/v1/dossiers-relationships-get${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<RelationshipsListResponse>(response);
}

/**
 * Get all relationships for a dossier (bidirectional)
 */
export async function getRelationshipsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number
): Promise<RelationshipsListResponse> {
  return listRelationships({
    source_dossier_id: dossierId,
    page,
    page_size,
  });
}

/**
 * Get relationships by type
 */
export async function getRelationshipsByType(
  dossierId: string,
  relationshipType: RelationshipType,
  page?: number,
  page_size?: number
): Promise<RelationshipsListResponse> {
  return listRelationships({
    source_dossier_id: dossierId,
    relationship_type: relationshipType,
    page,
    page_size,
  });
}
