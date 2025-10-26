/**
 * Dossier API Client
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Typed API client for unified dossier operations using Class Table Inheritance pattern.
 * Handles authentication, error handling, and response parsing for all 7 dossier types:
 * country, organization, forum, engagement, theme, working_group, person
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '../../../backend/src/types/database.types';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

type Dossier = Database['public']['Tables']['dossiers']['Row'];
type DossierInsert = Database['public']['Tables']['dossiers']['Insert'];
type DossierUpdate = Database['public']['Tables']['dossiers']['Update'];

/**
 * Dossier Types
 */
export type DossierType = 'country' | 'organization' | 'forum' | 'engagement' | 'theme' | 'working_group' | 'person';
export type DossierStatus = 'active' | 'inactive' | 'archived' | 'deleted';

/**
 * Extension Data Interfaces (type-specific fields)
 */
export interface CountryExtension {
  iso_code_2?: string;
  iso_code_3?: string;
  capital_en?: string;
  capital_ar?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area_sq_km?: number;
  flag_url?: string;
}

export interface OrganizationExtension {
  org_code?: string;
  org_type?: 'government' | 'ngo' | 'private' | 'international' | 'academic';
  headquarters_country_id?: string;
  parent_org_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  address_en?: string;
  address_ar?: string;
  logo_url?: string;
  established_date?: string;
}

export interface ForumExtension {
  number_of_sessions?: number;
  keynote_speakers?: Array<{ name: string; title: string; org: string }>;
  sponsors?: Array<unknown>;
  registration_fee?: number;
  currency?: string;
  agenda_url?: string;
  live_stream_url?: string;
}

export interface EngagementExtension {
  engagement_type?: 'meeting' | 'consultation' | 'coordination' | 'workshop' | 'conference' | 'site_visit' | 'ceremony';
  engagement_category?: 'bilateral' | 'multilateral' | 'regional' | 'internal';
  location_en?: string;
  location_ar?: string;
}

export interface ThemeExtension {
  theme_category?: 'policy' | 'technical' | 'strategic' | 'operational';
  parent_theme_id?: string;
}

export interface WorkingGroupExtension {
  mandate_en?: string;
  mandate_ar?: string;
  lead_org_id?: string;
  wg_status?: 'active' | 'suspended' | 'disbanded';
  established_date?: string;
  disbandment_date?: string;
}

export interface PersonExtension {
  title_en?: string;
  title_ar?: string;
  organization_id?: string;
  nationality_country_id?: string;
  biography_en?: string;
  biography_ar?: string;
  photo_url?: string;
}

export type DossierExtensionData =
  | CountryExtension
  | OrganizationExtension
  | ForumExtension
  | EngagementExtension
  | ThemeExtension
  | WorkingGroupExtension
  | PersonExtension;

/**
 * API Request types
 */
export interface CreateDossierRequest {
  type: DossierType;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status?: DossierStatus;
  sensitivity_level?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  extensionData?: DossierExtensionData;
}

export interface UpdateDossierRequest {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  status?: DossierStatus;
  sensitivity_level?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  extensionData?: DossierExtensionData;
}

export interface DossierFilters {
  type?: DossierType;
  status?: DossierStatus;
  sensitivity_level?: number;
  tags?: string[];
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'name_en' | 'name_ar';
  sort_order?: 'asc' | 'desc';
}

export interface DossierWithExtension extends Dossier {
  extension?: DossierExtensionData;
}

export interface DossiersListResponse {
  dossiers: DossierWithExtension[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * API Error class
 */
export class DossierAPIError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'DossierAPIError';
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
    throw new DossierAPIError('Not authenticated', 401, 'AUTH_REQUIRED');
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

    throw new DossierAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details
    );
  }

  return response.json();
}

/**
 * Create a new dossier
 */
export async function createDossier(
  request: CreateDossierRequest
): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<DossierWithExtension>(response);
}

/**
 * Get a dossier by ID with extension data
 */
export async function getDossier(id: string): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-get?id=${id}`, {
    method: 'GET',
    headers,
  });

  return handleResponse<DossierWithExtension>(response);
}

/**
 * Update a dossier
 */
export async function updateDossier(
  id: string,
  request: UpdateDossierRequest
): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, ...request }),
  });

  return handleResponse<DossierWithExtension>(response);
}

/**
 * Delete a dossier (archives it)
 */
export async function deleteDossier(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-archive`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new DossierAPIError(
      error.message || 'Failed to delete dossier',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details
    );
  }
}

/**
 * List dossiers with filters
 */
export async function listDossiers(
  filters?: DossierFilters
): Promise<DossiersListResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }

  const url = `${supabaseUrl}/functions/v1/dossiers-list${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<DossiersListResponse>(response);
}

/**
 * Get dossiers by type (convenience method)
 */
export async function getDossiersByType(
  type: DossierType,
  page?: number,
  page_size?: number
): Promise<DossiersListResponse> {
  return listDossiers({ type, page, page_size });
}

/**
 * Linked Document Interface
 */
export interface LinkedDocument {
  id: string;
  title: string;
  type: 'position' | 'mou' | 'brief';
  created_at: string;
  updated_at?: string;
  clearance_level?: number;
}

/**
 * Get documents linked to a dossier
 */
export async function getDocumentsForDossier(dossierId: string): Promise<LinkedDocument[]> {
  const headers = await getAuthHeaders();
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<LinkedDocument[]>(response);
}

/**
 * Link a document to a dossier
 */
export async function linkDocumentToDossier(
  dossierId: string,
  documentId: string,
  documentType: 'position' | 'mou' | 'brief'
): Promise<void> {
  const headers = await getAuthHeaders();
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ documentId, documentType }),
  });

  return handleResponse<void>(response);
}

/**
 * Unlink a document from a dossier
 */
export async function unlinkDocumentFromDossier(
  dossierId: string,
  documentId: string,
  documentType: 'position' | 'mou' | 'brief'
): Promise<void> {
  const headers = await getAuthHeaders();
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents/${documentId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ documentType }),
  });

  return handleResponse<void>(response);
}
