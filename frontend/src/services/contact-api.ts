/**
 * Contact API Service
 * Part of: 027-contact-directory implementation
 *
 * Types and API functions for the contact directory feature.
 */

import { supabase } from '@/lib/supabase'

/**
 * Contact response from the API - includes joined organization data
 */
export interface ContactResponse {
  id: string
  first_name: string
  last_name: string
  first_name_ar?: string | null
  last_name_ar?: string | null
  email_addresses?: string[]
  phone_numbers?: string[]
  organization_id?: string | null
  position_title?: string | null
  position_title_ar?: string | null
  department?: string | null
  department_ar?: string | null
  tags?: string[]
  notes?: string | null
  status?: string
  created_at?: string
  updated_at?: string
  organization?: {
    id: string
    name: string
    name_ar?: string | null
  } | null
}

/**
 * Search parameters for filtering contacts
 */
export interface ContactSearchParams {
  query?: string
  organization_id?: string
  tags?: string[]
  sort_by?: 'name' | 'organization' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

/**
 * Duplicate warning returned when creating contacts
 */
export interface DuplicateWarning {
  contact_id: string
  first_name: string
  last_name: string
  full_name: string
  organization_name?: string
  email?: string
  similarity_score: number
  match_score: number
  match_fields: string[]
  match_reasons: string[]
}

/**
 * Contact list response with pagination
 */
export interface ContactListResponse {
  contacts: ContactResponse[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * Contact create input
 */
export interface ContactCreateInput {
  first_name: string
  last_name: string
  first_name_ar?: string
  last_name_ar?: string
  email_addresses?: string[]
  phone_numbers?: string[]
  organization_id?: string
  position_title?: string
  position_title_ar?: string
  department?: string
  department_ar?: string
  tags?: string[]
  notes?: string
}

/**
 * Search contacts with filters
 */
async function searchContacts(params: ContactSearchParams): Promise<ContactListResponse> {
  const {
    query,
    organization_id,
    tags,
    sort_by = 'name',
    sort_order = 'asc',
    page = 1,
    per_page = 20,
  } = params

  let queryBuilder = supabase
    .from('contacts')
    .select('*, organization:organizations!organization_id(id, name, name_ar)', {
      count: 'exact',
    })

  if (query) {
    queryBuilder = queryBuilder.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email_addresses.cs.{${query}}`,
    )
  }

  if (organization_id) {
    queryBuilder = queryBuilder.eq('organization_id', organization_id)
  }

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.overlaps('tags', tags)
  }

  const sortColumn = sort_by === 'name' ? 'first_name' : sort_by
  queryBuilder = queryBuilder
    .order(sortColumn, { ascending: sort_order === 'asc' })
    .range((page - 1) * per_page, page * per_page - 1)

  const { data, error, count } = await queryBuilder

  if (error) throw error

  return {
    contacts: (data || []) as unknown as ContactResponse[],
    total: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  }
}

/**
 * Check for duplicate contacts before creating
 */
export async function checkDuplicates(input: ContactCreateInput): Promise<DuplicateWarning[]> {
  const { data, error } = await supabase.rpc('check_contact_duplicates', {
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_email: input.email_addresses?.[0] || null,
  })

  if (error) throw error
  return (data || []) as DuplicateWarning[]
}

/**
 * Create a new contact
 */
export async function createContact(input: ContactCreateInput): Promise<ContactResponse> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(input)
    .select('*, organization:organizations!organization_id(id, name, name_ar)')
    .single()

  if (error) throw error
  return data as unknown as ContactResponse
}
