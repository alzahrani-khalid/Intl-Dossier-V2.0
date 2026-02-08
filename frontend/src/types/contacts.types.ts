// Contact types for organization leadership, contacts, and staff directory
// These types support the contact directory and leadership tracking features

// ============================================================================
// Organization Leadership Types
// ============================================================================

export type PositionLevel = 'head' | 'deputy' | 'executive' | 'director' | 'manager' | 'coordinator'

export type AppointmentType =
  | 'permanent'
  | 'acting'
  | 'interim'
  | 'elected'
  | 'appointed'
  | 'designated'

export interface OrganizationLeadership {
  id: string
  organization_id: string
  person_id?: string | null
  external_name_en?: string | null
  external_name_ar?: string | null
  position_title_en: string
  position_title_ar: string
  position_level: PositionLevel
  start_date: string
  end_date?: string | null
  is_current: boolean
  appointment_type?: AppointmentType | null
  appointment_date?: string | null
  appointment_authority_en?: string | null
  appointment_authority_ar?: string | null
  appointment_reference?: string | null
  announcement_date?: string | null
  announcement_source?: string | null
  announcement_url?: string | null
  notes_en?: string | null
  notes_ar?: string | null
  achievements: string[]
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface LeadershipWithDetails extends OrganizationLeadership {
  leader_name_en?: string
  leader_name_ar?: string
  photo_url?: string
  organization_name_en?: string
  organization_name_ar?: string
  tenure_days?: number
}

export interface CreateLeadershipRequest {
  organization_id: string
  person_id?: string
  external_name_en?: string
  external_name_ar?: string
  position_title_en: string
  position_title_ar: string
  position_level?: PositionLevel
  start_date: string
  end_date?: string
  appointment_type?: AppointmentType
  appointment_date?: string
  appointment_authority_en?: string
  appointment_authority_ar?: string
  appointment_reference?: string
  announcement_date?: string
  announcement_source?: string
  announcement_url?: string
  notes_en?: string
  notes_ar?: string
  achievements?: string[]
}

export interface UpdateLeadershipRequest extends Partial<CreateLeadershipRequest> {
  is_current?: boolean
}

// ============================================================================
// Organization Contact Types
// ============================================================================

export type ContactType =
  | 'focal_point'
  | 'general'
  | 'protocol'
  | 'technical'
  | 'administrative'
  | 'media'
  | 'legal'
  | 'financial'
  | 'emergency'

export interface OrganizationContact {
  id: string
  organization_id: string
  contact_type: ContactType
  person_id?: string | null
  name_en: string
  name_ar: string
  title_en?: string | null
  title_ar?: string | null
  department_en?: string | null
  department_ar?: string | null
  email?: string | null
  email_secondary?: string | null
  phone?: string | null
  phone_secondary?: string | null
  mobile?: string | null
  fax?: string | null
  address_en?: string | null
  address_ar?: string | null
  is_primary: boolean
  is_public: boolean
  available_hours?: string | null
  languages: string[]
  expertise_areas: string[]
  topics: string[]
  valid_from?: string | null
  valid_until?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface ContactWithOrganization extends OrganizationContact {
  organization_name_en?: string
  organization_name_ar?: string
}

export interface CreateContactRequest {
  organization_id: string
  contact_type: ContactType
  person_id?: string
  name_en: string
  name_ar: string
  title_en?: string
  title_ar?: string
  department_en?: string
  department_ar?: string
  email?: string
  email_secondary?: string
  phone?: string
  phone_secondary?: string
  mobile?: string
  fax?: string
  address_en?: string
  address_ar?: string
  is_primary?: boolean
  is_public?: boolean
  available_hours?: string
  languages?: string[]
  expertise_areas?: string[]
  topics?: string[]
  valid_from?: string
  valid_until?: string
  notes?: string
}

export interface UpdateContactRequest
  extends Partial<Omit<CreateContactRequest, 'organization_id'>> {
  is_active?: boolean
}

// ============================================================================
// Staff Contact Types
// ============================================================================

export type StaffPositionLevel =
  | 'head'
  | 'deputy'
  | 'director'
  | 'manager'
  | 'supervisor'
  | 'senior'
  | 'staff'
  | 'assistant'
  | 'intern'

export interface Department {
  id: string
  code: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  parent_department_id?: string | null
  level: number
  head_person_id?: string | null
  head_name_en?: string | null
  head_name_ar?: string | null
  head_title_en?: string | null
  head_title_ar?: string | null
  email?: string | null
  phone?: string | null
  extension?: string | null
  location_en?: string | null
  location_ar?: string | null
  is_active: boolean
  responsibilities_en?: string | null
  responsibilities_ar?: string | null
  specializations: string[]
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface StaffContact {
  id: string
  department_id: string
  user_id?: string | null
  name_en: string
  name_ar: string
  title_en?: string | null
  title_ar?: string | null
  position_level: StaffPositionLevel
  email: string
  email_secondary?: string | null
  phone?: string | null
  phone_secondary?: string | null
  mobile?: string | null
  extension?: string | null
  fax?: string | null
  building_en?: string | null
  building_ar?: string | null
  floor?: string | null
  office_number?: string | null
  working_hours_en?: string | null
  working_hours_ar?: string | null
  timezone: string
  is_available: boolean
  availability_notes?: string | null
  specializations: string[]
  languages: string[]
  expertise_areas: string[]
  delegates_to_id?: string | null
  delegation_start?: string | null
  delegation_end?: string | null
  delegation_reason?: string | null
  photo_url?: string | null
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  linkedin_url?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface StaffContactWithDepartment extends StaffContact {
  department_name_en?: string
  department_name_ar?: string
  delegates_to_name?: string
  is_delegating?: boolean
}

export interface CreateStaffContactRequest {
  department_id: string
  user_id?: string
  name_en: string
  name_ar: string
  title_en?: string
  title_ar?: string
  position_level?: StaffPositionLevel
  email: string
  email_secondary?: string
  phone?: string
  phone_secondary?: string
  mobile?: string
  extension?: string
  fax?: string
  building_en?: string
  building_ar?: string
  floor?: string
  office_number?: string
  working_hours_en?: string
  working_hours_ar?: string
  timezone?: string
  specializations?: string[]
  languages?: string[]
  expertise_areas?: string[]
  photo_url?: string
  start_date?: string
  notes?: string
  linkedin_url?: string
}

export interface UpdateStaffContactRequest
  extends Partial<Omit<CreateStaffContactRequest, 'department_id'>> {
  is_available?: boolean
  is_active?: boolean
  delegates_to_id?: string | null
  delegation_start?: string
  delegation_end?: string
  delegation_reason?: string
  end_date?: string
}

// ============================================================================
// Staff Topic Assignment Types
// ============================================================================

export type StaffAssignmentType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'topic'
  | 'dossier'
  | 'mou'
  | 'correspondence'
  | 'other'

export type StaffAssignmentRole = 'primary' | 'secondary' | 'backup' | 'expert' | 'coordinator'

export interface StaffTopicAssignment {
  id: string
  staff_id: string
  assignment_type: StaffAssignmentType
  reference_id?: string | null
  reference_name_en: string
  reference_name_ar: string
  role: StaffAssignmentRole
  assigned_from?: string | null
  assigned_until?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export interface CreateTopicAssignmentRequest {
  staff_id: string
  assignment_type: StaffAssignmentType
  reference_id?: string
  reference_name_en: string
  reference_name_ar: string
  role?: StaffAssignmentRole
  assigned_from?: string
  assigned_until?: string
  notes?: string
}

export interface UpdateTopicAssignmentRequest {
  role?: StaffAssignmentRole
  assigned_until?: string
  is_active?: boolean
  notes?: string
}

// ============================================================================
// Leadership Change Types
// ============================================================================

export type ChangeType = 'appointed' | 'departed'

export interface LeadershipChange {
  leadership_id: string
  organization_id: string
  organization_name_en: string
  organization_name_ar: string
  leader_name_en: string
  leader_name_ar: string
  position_title_en: string
  position_level: PositionLevel
  change_type: ChangeType
  change_date: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface LeadershipListResponse {
  data: LeadershipWithDetails[]
  total: number
}

export interface ContactListResponse {
  data: ContactWithOrganization[]
  total: number
}

export interface StaffDirectoryResponse {
  data: StaffContactWithDepartment[]
  total: number
}

export interface DepartmentStaffResponse {
  department: Department
  staff: StaffContactWithDepartment[]
}

export interface TopicContactResponse {
  staff_id: string
  name_en: string
  name_ar: string
  title_en?: string
  email: string
  phone?: string
  department_name_en: string
  role: StaffAssignmentRole
  effective_contact_id: string
  effective_contact_name: string
  is_delegated: boolean
}

export interface FocalPointMatch {
  id: string
  name_en: string
  name_ar: string
  title_en?: string
  email?: string
  phone?: string
  expertise_areas: string[]
  match_score: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface LeadershipFilters {
  organization_id?: string
  position_level?: PositionLevel
  is_current?: boolean
  include_past?: boolean
}

export interface ContactFilters {
  organization_id?: string
  contact_type?: ContactType
  is_active?: boolean
  is_public?: boolean
}

export interface StaffFilters {
  department_id?: string
  position_level?: StaffPositionLevel
  is_active?: boolean
  is_available?: boolean
  search?: string
}

export interface TopicAssignmentFilters {
  staff_id?: string
  assignment_type?: StaffAssignmentType
  role?: StaffAssignmentRole
  is_active?: boolean
}
