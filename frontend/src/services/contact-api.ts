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
