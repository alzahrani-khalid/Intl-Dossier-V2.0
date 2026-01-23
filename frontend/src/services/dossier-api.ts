/**
 * Dossier API Client
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Typed API client for unified dossier operations using Class Table Inheritance pattern.
 * Handles authentication, error handling, and response parsing for all 7 dossier types:
 * country, organization, forum, engagement, topic, working_group, person
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '../../../backend/src/types/database.types'
import type { ApiErrorDetails } from '@/types/common.types'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

type Dossier = Database['public']['Tables']['dossiers']['Row']

/**
 * Dossier Types
 */
export type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'
export type DossierStatus = 'active' | 'inactive' | 'archived' | 'deleted'

/**
 * Extension Data Interfaces (type-specific fields)
 */
export interface CountryExtension {
  iso_code_2?: string
  iso_code_3?: string
  capital_en?: string
  capital_ar?: string
  region?: string
  subregion?: string
  population?: number
  area_sq_km?: number
  flag_url?: string
}

export interface OrganizationExtension {
  org_code?: string
  org_type?: 'government' | 'ngo' | 'private' | 'international' | 'academic'
  headquarters_country_id?: string
  parent_org_id?: string
  website?: string
  email?: string
  phone?: string
  address_en?: string
  address_ar?: string
  logo_url?: string
  established_date?: string
}

export interface ForumExtension {
  number_of_sessions?: number
  keynote_speakers?: Array<{ name: string; title: string; org: string }>
  sponsors?: Array<unknown>
  registration_fee?: number
  currency?: string
  agenda_url?: string
  live_stream_url?: string
}

export interface EngagementExtension {
  engagement_type?:
    | 'meeting'
    | 'consultation'
    | 'coordination'
    | 'workshop'
    | 'conference'
    | 'site_visit'
    | 'ceremony'
  engagement_category?: 'bilateral' | 'multilateral' | 'regional' | 'internal'
  location_en?: string
  location_ar?: string
}

export interface TopicExtension {
  topic_category?: 'policy' | 'technical' | 'strategic' | 'operational'
  parent_topic_id?: string
}

export interface WorkingGroupExtension {
  mandate_en?: string
  mandate_ar?: string
  lead_org_id?: string
  wg_status?: 'active' | 'suspended' | 'disbanded'
  established_date?: string
  disbandment_date?: string
}

export interface PersonExtension {
  title_en?: string
  title_ar?: string
  organization_id?: string
  nationality_country_id?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
}

/**
 * Office types for elected officials
 */
export type OfficeType =
  | 'head_of_state'
  | 'head_of_government'
  | 'cabinet_minister'
  | 'legislature_upper'
  | 'legislature_lower'
  | 'regional_executive'
  | 'regional_legislature'
  | 'local_executive'
  | 'local_legislature'
  | 'judiciary'
  | 'ambassador'
  | 'international_org'
  | 'other'

/**
 * Party ideology classification
 */
export type PartyIdeology =
  | 'conservative'
  | 'liberal'
  | 'centrist'
  | 'socialist'
  | 'green'
  | 'nationalist'
  | 'libertarian'
  | 'independent'
  | 'other'

/**
 * Committee assignment structure
 */
export interface CommitteeAssignment {
  name_en: string
  name_ar?: string
  role: 'chair' | 'vice_chair' | 'member'
  is_active: boolean
}

/**
 * Staff contact structure
 */
export interface StaffContact {
  name: string
  role: 'chief_of_staff' | 'scheduler' | 'policy_advisor' | 'press_secretary' | 'other'
  email?: string
  phone?: string
  notes?: string
}

/**
 * Contact preferences structure
 */
export interface ContactPreferences {
  preferred_channel?: 'email' | 'phone' | 'in_person' | 'formal_letter'
  best_time?: 'morning' | 'afternoon' | 'evening'
  scheduling_notes_en?: string
  scheduling_notes_ar?: string
  protocol_notes_en?: string
  protocol_notes_ar?: string
}

/**
 * Social media handles
 */
export interface SocialMedia {
  twitter?: string
  linkedin?: string
  facebook?: string
  instagram?: string
  youtube?: string
  [key: string]: string | undefined
}

/**
 * Elected Official Extension
 */
export interface ElectedOfficialExtension {
  // Personal & Professional Info
  title_en?: string
  title_ar?: string
  photo_url?: string

  // Office Information
  office_name_en: string
  office_name_ar?: string
  office_type: OfficeType

  // District/Constituency
  district_en?: string
  district_ar?: string

  // Political Affiliation
  party_en?: string
  party_ar?: string
  party_abbreviation?: string
  party_ideology?: PartyIdeology

  // Term Information
  term_start?: string
  term_end?: string
  is_current_term?: boolean
  term_number?: number

  // Committee Assignments
  committee_assignments?: CommitteeAssignment[]

  // Contact Preferences
  contact_preferences?: ContactPreferences

  // Contact Information
  email_official?: string
  email_personal?: string
  phone_office?: string
  phone_mobile?: string
  address_office_en?: string
  address_office_ar?: string
  website_official?: string
  website_campaign?: string

  // Social Media
  social_media?: SocialMedia

  // Staff Contacts
  staff_contacts?: StaffContact[]

  // Linked Entities
  country_id?: string
  organization_id?: string

  // Background & Notes
  biography_en?: string
  biography_ar?: string
  policy_priorities?: string[]
  notes_en?: string
  notes_ar?: string

  // Data Source Information
  data_source?: 'official_website' | 'api_gov' | 'manual'
  data_source_url?: string
  last_verified_at?: string
  last_refresh_at?: string
  refresh_frequency_days?: number

  // Importance Level
  importance_level?: 1 | 2 | 3 | 4 | 5
}

export type DossierExtensionData =
  | CountryExtension
  | OrganizationExtension
  | ForumExtension
  | EngagementExtension
  | TopicExtension
  | WorkingGroupExtension
  | PersonExtension
  | ElectedOfficialExtension

/**
 * API Request types
 */
export interface CreateDossierRequest {
  type: DossierType
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extensionData?: DossierExtensionData
}

export interface UpdateDossierRequest {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extensionData?: DossierExtensionData
}

export interface DossierFilters {
  type?: DossierType
  status?: DossierStatus | DossierStatus[] // Single or multiple statuses
  sensitivity_level?: number
  tags?: string[]
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'updated_at' | 'name_en' | 'name_ar'
  sort_order?: 'asc' | 'desc'
}

export interface DossierWithExtension extends Dossier {
  extension?: DossierExtensionData
}

export interface DossiersListResponse {
  dossiers: DossierWithExtension[]
  total_count: number
  page: number
  page_size: number
}

/**
 * API Error class
 */
export class DossierAPIError extends Error {
  code: string
  status: number
  details?: ApiErrorDetails

  constructor(message: string, status: number, code: string, details?: ApiErrorDetails) {
    super(message)
    this.name = 'DossierAPIError'
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
    throw new DossierAPIError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Helper function to handle API responses
 */
interface ApiErrorResponse {
  message?: string
  code?: string
  details?: ApiErrorDetails
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: ApiErrorResponse
    try {
      error = (await response.json()) as ApiErrorResponse
    } catch {
      error = { message: response.statusText }
    }

    throw new DossierAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details,
    )
  }

  return response.json()
}

/**
 * Create a new dossier
 */
export async function createDossier(request: CreateDossierRequest): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  return handleResponse<DossierWithExtension>(response)
}

/**
 * Get a dossier by ID with extension data
 */
export async function getDossier(id: string, include?: string[]): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders()
  const includeParam = include && include.length > 0 ? `&include=${include.join(',')}` : ''
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-get?id=${id}${includeParam}`, {
    method: 'GET',
    headers,
  })

  return handleResponse<DossierWithExtension>(response)
}

/**
 * Update a dossier
 */
export async function updateDossier(
  id: string,
  request: UpdateDossierRequest,
): Promise<DossierWithExtension> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, ...request }),
  })

  return handleResponse<DossierWithExtension>(response)
}

/**
 * Delete a dossier (archives it)
 */
export async function deleteDossier(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${supabaseUrl}/functions/v1/dossiers-archive`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new DossierAPIError(
      error.message || 'Failed to delete dossier',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details,
    )
  }
}

/**
 * List dossiers with filters
 */
export async function listDossiers(filters?: DossierFilters): Promise<DossiersListResponse> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, JSON.stringify(value))
        } else {
          params.append(key, String(value))
        }
      }
    })
  }

  const url = `${supabaseUrl}/functions/v1/dossiers-list${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleResponse<DossiersListResponse>(response)
}

/**
 * Get dossiers by type (convenience method)
 */
export async function getDossiersByType(
  type: DossierType,
  page?: number,
  page_size?: number,
): Promise<DossiersListResponse> {
  return listDossiers({ type, page, page_size })
}

/**
 * Linked Document Interface
 */
export interface LinkedDocument {
  id: string
  title: string
  type: 'position' | 'mou' | 'brief'
  created_at: string
  updated_at?: string
  clearance_level?: number
}

/**
 * Get documents linked to a dossier
 */
export async function getDocumentsForDossier(dossierId: string): Promise<LinkedDocument[]> {
  const headers = await getAuthHeaders()
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleResponse<LinkedDocument[]>(response)
}

/**
 * Link a document to a dossier
 */
export async function linkDocumentToDossier(
  dossierId: string,
  documentId: string,
  documentType: 'position' | 'mou' | 'brief',
): Promise<void> {
  const headers = await getAuthHeaders()
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents`

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ documentId, documentType }),
  })

  return handleResponse<void>(response)
}

/**
 * Unlink a document from a dossier
 */
export async function unlinkDocumentFromDossier(
  dossierId: string,
  documentId: string,
  documentType: 'position' | 'mou' | 'brief',
): Promise<void> {
  const headers = await getAuthHeaders()
  const url = `${supabaseUrl}/functions/v1/dossiers/${dossierId}/documents/${documentId}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ documentType }),
  })

  return handleResponse<void>(response)
}

/**
 * Type Count with Status Breakdown Interface
 */
export interface DossierTypeCount {
  type: DossierType
  total: number
  active: number
  inactive: number
  archived: number
}

/**
 * Get dossier counts by type with status breakdown
 * More efficient than fetching counts separately for each type and status
 */
export async function getDossierCountsByType(): Promise<Record<DossierType, DossierTypeCount>> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('type, status')
    .not('status', 'eq', 'deleted') // Exclude deleted dossiers from counts

  if (error) {
    throw new DossierAPIError(
      error.message || 'Failed to fetch dossier counts',
      500,
      'COUNTS_FETCH_FAILED',
      { code: error.code, message: error.message, details: error.details },
    )
  }

  // Initialize counts object
  const types: DossierType[] = [
    'country',
    'organization',
    'forum',
    'engagement',
    'topic',
    'working_group',
    'person',
    'elected_official',
  ]
  const counts = {} as Record<DossierType, DossierTypeCount>

  types.forEach((type) => {
    counts[type] = {
      type,
      total: 0,
      active: 0,
      inactive: 0,
      archived: 0,
    }
  })

  // Aggregate counts
  data?.forEach((row) => {
    const type = row.type as DossierType
    const status = row.status as DossierStatus

    if (counts[type]) {
      counts[type].total++

      if (status === 'active') {
        counts[type].active++
      } else if (status === 'inactive') {
        counts[type].inactive++
      } else if (status === 'archived') {
        counts[type].archived++
      }
    }
  })

  return counts
}
