/**
 * Elected Official Types
 * @module domains/elected-officials/types
 *
 * CRITICAL: Elected officials are rows in the `persons` table with
 * `person_subtype = 'elected_official'`. The dossier type is `'person'`,
 * NOT `'elected_official'`. There is NO `elected_officials` table.
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

export interface CommitteeAssignment {
  name_en: string
  name_ar: string
  role: 'chair' | 'vice_chair' | 'member'
  is_active: boolean
}

export interface ElectedOfficial {
  // Dossier fields (from dossiers table, type = 'person')
  id: string
  name_en: string
  name_ar: string | null
  description_en: string | null
  description_ar: string | null
  type: 'person' // NOT 'elected_official' -- dossier type is always 'person'
  status: string
  created_at: string
  updated_at: string

  // Person base fields
  person_subtype: 'elected_official'
  title_en: string | null
  title_ar: string | null
  photo_url: string | null
  organization_id: string | null
  nationality_country_id: string | null
  importance_level: number | null
  biography_en: string | null
  biography_ar: string | null

  // Elected official specific fields (on persons table)
  office_name_en: string
  office_name_ar: string | null
  office_type: OfficeType | null
  district_en: string | null
  district_ar: string | null
  party_en: string | null
  party_ar: string | null
  party_abbreviation: string | null
  party_ideology: PartyIdeology | null
  term_start: string | null
  term_end: string | null
  is_current_term: boolean
  term_number: number | null
  committee_assignments: CommitteeAssignment[]
  country_id: string | null

  // Contact fields
  email_official: string | null
  email_personal: string | null
  phone_office: string | null
  phone_mobile: string | null
  website_official: string | null
  website_campaign: string | null

  // Data management
  data_source: string | null
  last_verified_at: string | null
  last_refresh_at: string | null
}

export interface ElectedOfficialListItem {
  // Subset returned by search_persons_advanced RPC
  id: string
  name_en: string
  name_ar: string | null
  title_en: string | null
  title_ar: string | null
  photo_url: string | null
  organization_id: string | null
  organization_name: string | null
  person_subtype: 'elected_official'
  office_name_en: string | null
  office_type: OfficeType | null
  party_en: string | null
  district_en: string | null
  country_name_en: string | null
  is_current_term: boolean | null
}

export interface ElectedOfficialListResponse {
  data: ElectedOfficialListItem[]
  total: number
  page: number
  limit: number
}

export interface ElectedOfficialFilters {
  party?: string
  office_type?: OfficeType
  is_current_term?: boolean
  country_id?: string
  search?: string
  page?: number
  limit?: number
}
