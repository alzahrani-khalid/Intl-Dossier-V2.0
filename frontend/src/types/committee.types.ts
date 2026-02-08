// Committee and nomination types for committee management and membership workflow
// These types support jury committees, advisory boards, and member nominations

// ============================================================================
// Committee Type Enums
// ============================================================================

export type CommitteeType =
  | 'jury'
  | 'steering'
  | 'technical'
  | 'advisory'
  | 'executive'
  | 'working'
  | 'drafting'
  | 'credentials'
  | 'budget'
  | 'nominations'
  | 'ethics'
  | 'audit'
  | 'other'

export type CommitteeStatus = 'forming' | 'active' | 'suspended' | 'dissolved' | 'reconstituting'

export type MeetingFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual'
  | 'ad_hoc'

export type MemberRole =
  | 'chair'
  | 'vice_chair'
  | 'member'
  | 'alternate'
  | 'observer'
  | 'secretary'
  | 'rapporteur'

export type NominationStatus =
  | 'pending'
  | 'under_review'
  | 'shortlisted'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired'

export type MemberStatus =
  | 'active'
  | 'on_leave'
  | 'suspended'
  | 'resigned'
  | 'removed'
  | 'term_ended'

// ============================================================================
// Committee Types
// ============================================================================

export interface CommitteeDocument {
  title: string
  url: string
  type: string
}

export interface Committee {
  id: string
  forum_id?: string | null
  organization_id?: string | null
  committee_type: CommitteeType
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  mandate_en?: string | null
  mandate_ar?: string | null
  member_count?: number | null
  current_member_count: number
  min_members?: number | null
  max_members?: number | null
  term_start?: string | null
  term_end?: string | null
  term_duration_months?: number | null
  is_renewable: boolean
  meeting_frequency?: MeetingFrequency | null
  next_meeting_date?: string | null
  status: CommitteeStatus
  charter_url?: string | null
  documents: CommitteeDocument[]
  secretariat_email?: string | null
  secretariat_contact?: string | null
  is_standing: boolean
  is_public: boolean
  tags: string[]
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface CommitteeWithStats extends Committee {
  pending_nominations_count?: number
  active_members?: CommitteeMember[]
}

export interface CreateCommitteeRequest {
  forum_id?: string
  organization_id?: string
  committee_type: CommitteeType
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  mandate_en?: string
  mandate_ar?: string
  member_count?: number
  min_members?: number
  max_members?: number
  term_start?: string
  term_end?: string
  term_duration_months?: number
  is_renewable?: boolean
  meeting_frequency?: MeetingFrequency
  next_meeting_date?: string
  charter_url?: string
  documents?: CommitteeDocument[]
  secretariat_email?: string
  secretariat_contact?: string
  is_standing?: boolean
  is_public?: boolean
  tags?: string[]
}

export interface UpdateCommitteeRequest extends Partial<CreateCommitteeRequest> {
  status?: CommitteeStatus
}

// ============================================================================
// Committee Nomination Types
// ============================================================================

export type NominatorType = 'organization' | 'country' | 'person' | 'self'

export interface NominationDocument {
  title: string
  url: string
  type: string
}

export interface CommitteeNomination {
  id: string
  committee_id: string
  nominated_person_id?: string | null
  nominee_name_en?: string | null
  nominee_name_ar?: string | null
  nominee_title_en?: string | null
  nominee_title_ar?: string | null
  nominee_bio_en?: string | null
  nominee_bio_ar?: string | null
  nominee_email?: string | null
  nominee_phone?: string | null
  nominated_by_type: NominatorType
  nominated_by_id?: string | null
  nominated_by_name_en?: string | null
  nominated_by_name_ar?: string | null
  nomination_date: string
  nomination_letter_url?: string | null
  justification_en?: string | null
  justification_ar?: string | null
  role: MemberRole
  requested_term_start?: string | null
  requested_term_end?: string | null
  status: NominationStatus
  status_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  membership_id?: string | null
  cv_url?: string | null
  supporting_documents: NominationDocument[]
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface NominationWithNames extends CommitteeNomination {
  committee_name_en?: string
  committee_name_ar?: string
}

export interface CreateNominationRequest {
  committee_id: string
  nominated_person_id?: string
  nominee_name_en?: string
  nominee_name_ar?: string
  nominee_title_en?: string
  nominee_title_ar?: string
  nominee_bio_en?: string
  nominee_bio_ar?: string
  nominee_email?: string
  nominee_phone?: string
  nominated_by_type: NominatorType
  nominated_by_id?: string
  nominated_by_name_en?: string
  nominated_by_name_ar?: string
  nomination_date: string
  nomination_letter_url?: string
  justification_en?: string
  justification_ar?: string
  role?: MemberRole
  requested_term_start?: string
  requested_term_end?: string
  cv_url?: string
  supporting_documents?: NominationDocument[]
}

export interface UpdateNominationRequest {
  status?: NominationStatus
  status_reason?: string
  role?: MemberRole
}

export interface ApproveNominationRequest {
  nomination_id: string
  term_start?: string
  term_end?: string
}

// ============================================================================
// Committee Member Types
// ============================================================================

export type RepresentingType = 'organization' | 'country' | 'self'

export interface CommitteeMember {
  id: string
  committee_id: string
  person_id?: string | null
  member_name_en: string
  member_name_ar: string
  member_title_en?: string | null
  member_title_ar?: string | null
  representing_type?: RepresentingType | null
  representing_id?: string | null
  representing_name_en?: string | null
  representing_name_ar?: string | null
  role: MemberRole
  term_start: string
  term_end?: string | null
  is_current: boolean
  nomination_id?: string | null
  meetings_attended: number
  meetings_total: number
  last_attendance?: string | null
  status: MemberStatus
  status_reason?: string | null
  status_effective_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface MemberWithDetails extends CommitteeMember {
  committee_name_en?: string
  committee_type?: CommitteeType
  photo_url?: string
  email?: string
}

export interface CreateMemberRequest {
  committee_id: string
  person_id?: string
  member_name_en: string
  member_name_ar: string
  member_title_en?: string
  member_title_ar?: string
  representing_type?: RepresentingType
  representing_id?: string
  representing_name_en?: string
  representing_name_ar?: string
  role?: MemberRole
  term_start: string
  term_end?: string
  nomination_id?: string
}

export interface UpdateMemberRequest {
  role?: MemberRole
  term_end?: string
  status?: MemberStatus
  status_reason?: string
  meetings_attended?: number
  meetings_total?: number
  last_attendance?: string
}

// ============================================================================
// Award Types (Related to Committee Juries)
// ============================================================================

export type AwardType =
  | 'excellence'
  | 'achievement'
  | 'innovation'
  | 'best_practice'
  | 'contribution'
  | 'lifetime'
  | 'recognition'
  | 'competition'
  | 'scholarship'
  | 'grant'
  | 'other'

export type AwardFrequency =
  | 'annual'
  | 'biennial'
  | 'triennial'
  | 'quadrennial'
  | 'one_time'
  | 'ongoing'

export type TrackCategory =
  | 'individual'
  | 'organization'
  | 'project'
  | 'research'
  | 'team'
  | 'startup'
  | 'government'
  | 'ngo'
  | 'private_sector'

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'finalist'
  | 'winner'
  | 'runner_up'
  | 'honorable_mention'
  | 'rejected'
  | 'withdrawn'
  | 'disqualified'

export type ReviewerRole = 'juror' | 'expert' | 'preliminary' | 'final'

export type ReviewRecommendation =
  | 'strongly_recommend'
  | 'recommend'
  | 'neutral'
  | 'not_recommend'
  | 'strongly_not_recommend'

// ============================================================================
// API Response Types
// ============================================================================

export interface CommitteeDetailsResponse {
  committee: Committee
  members: CommitteeMember[]
  pending_nominations: number
}

export interface NominationListResponse {
  data: NominationWithNames[]
  total: number
}

export interface MemberListResponse {
  data: MemberWithDetails[]
  total: number
}

export interface PersonMembershipsResponse {
  data: MemberWithDetails[]
  total: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CommitteeFilters {
  forum_id?: string
  organization_id?: string
  committee_type?: CommitteeType
  status?: CommitteeStatus
  is_public?: boolean
}

export interface NominationFilters {
  committee_id?: string
  status?: NominationStatus
  nominated_by_type?: NominatorType
  role?: MemberRole
}

export interface MemberFilters {
  committee_id?: string
  person_id?: string
  role?: MemberRole
  status?: MemberStatus
  is_current?: boolean
}
