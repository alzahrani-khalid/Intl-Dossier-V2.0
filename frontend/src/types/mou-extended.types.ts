// Extended MoU types for multi-party support and lifecycle tracking
// These types extend the existing MoU functionality

// ============================================================================
// Lifecycle Stage Enum
// ============================================================================

export type MouLifecycleStage =
  | 'draft'
  | 'negotiation'
  | 'legal_review'
  | 'signed'
  | 'cabinet_pending'
  | 'cabinet_approved'
  | 'ratification'
  | 'ratified'
  | 'in_force'
  | 'expired'
  | 'terminated'
  | 'superseded'

// ============================================================================
// MoU Party Types
// ============================================================================

export type MouPartyType = 'country' | 'organization'

export type MouPartyRole = 'signatory' | 'witness' | 'guarantor' | 'observer' | 'implementing'

export type MouPartyStatus = 'pending' | 'signed' | 'ratified' | 'withdrawn'

export interface MouParty {
  id: string
  mou_id: string
  party_type: MouPartyType
  party_id: string
  role: MouPartyRole
  signed_at?: string | null
  signed_at_hijri?: string | null
  signed_by_person_id?: string | null
  signed_by_name?: string | null
  signed_by_title_en?: string | null
  signed_by_title_ar?: string | null
  party_status: MouPartyStatus
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface MouPartyWithEntity extends MouParty {
  entity_name_en?: string
  entity_name_ar?: string
}

export interface CreateMouPartyRequest {
  mou_id: string
  party_type: MouPartyType
  party_id: string
  role?: MouPartyRole
  signed_at?: string
  signed_at_hijri?: string
  signed_by_person_id?: string
  signed_by_name?: string
  signed_by_title_en?: string
  signed_by_title_ar?: string
  party_status?: MouPartyStatus
  notes?: string
}

export interface UpdateMouPartyRequest {
  role?: MouPartyRole
  signed_at?: string
  signed_at_hijri?: string
  signed_by_person_id?: string
  signed_by_name?: string
  signed_by_title_en?: string
  signed_by_title_ar?: string
  party_status?: MouPartyStatus
  notes?: string
}

// ============================================================================
// Government Decision Types
// ============================================================================

export type DecisionType =
  | 'cabinet_resolution'
  | 'royal_decree'
  | 'royal_order'
  | 'ministerial_order'
  | 'ministerial_circular'
  | 'council_decision'

export type DecisionStatus = 'draft' | 'active' | 'amended' | 'superseded' | 'revoked'

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'secret'

export type EffectType =
  | 'authorized'
  | 'implemented'
  | 'ratified'
  | 'amended'
  | 'terminated'
  | 'referenced'

export interface GovernmentDecision {
  id: string
  decision_type: DecisionType
  reference_number: string
  reference_number_ar?: string | null
  title_en: string
  title_ar: string
  decision_date: string
  decision_date_hijri?: string | null
  published_date?: string | null
  published_date_hijri?: string | null
  gazette_reference?: string | null
  summary_en?: string | null
  summary_ar?: string | null
  full_text_en?: string | null
  full_text_ar?: string | null
  related_mou_id?: string | null
  related_dossier_id?: string | null
  related_organization_id?: string | null
  document_url?: string | null
  document_url_ar?: string | null
  status: DecisionStatus
  sensitivity_level: SensitivityLevel
  superseded_by_id?: string | null
  amends_id?: string | null
  issuing_authority_en?: string | null
  issuing_authority_ar?: string | null
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by?: string | null
  deleted_at?: string | null
  _version: number
}

export interface DecisionAffectedEntity {
  id: string
  decision_id: string
  entity_type: 'country' | 'organization' | 'mou' | 'dossier' | 'person'
  entity_id: string
  effect_type?: EffectType
  notes?: string | null
  created_at: string
}

export interface CreateGovernmentDecisionRequest {
  decision_type: DecisionType
  reference_number: string
  reference_number_ar?: string
  title_en: string
  title_ar: string
  decision_date: string
  decision_date_hijri?: string
  published_date?: string
  published_date_hijri?: string
  gazette_reference?: string
  summary_en?: string
  summary_ar?: string
  full_text_en?: string
  full_text_ar?: string
  related_mou_id?: string
  related_dossier_id?: string
  related_organization_id?: string
  document_url?: string
  document_url_ar?: string
  status?: DecisionStatus
  sensitivity_level?: SensitivityLevel
  superseded_by_id?: string
  amends_id?: string
  issuing_authority_en?: string
  issuing_authority_ar?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateGovernmentDecisionRequest extends Partial<CreateGovernmentDecisionRequest> {}

// ============================================================================
// Extended MoU Fields
// ============================================================================

export interface MouExtendedFields {
  lifecycle_stage?: MouLifecycleStage
  cabinet_decision_ref?: string | null
  cabinet_decision_date?: string | null
  royal_decree_ref?: string | null
  royal_decree_date?: string | null
  royal_decree_date_hijri?: string | null
  superseded_by_id?: string | null
  supersedes_id?: string | null
}

export interface UpdateMouLifecycleRequest {
  new_stage: MouLifecycleStage
  cabinet_ref?: string
  cabinet_date?: string
  royal_ref?: string
  royal_date?: string
  royal_date_hijri?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface MouPartyListResponse {
  data: MouPartyWithEntity[]
  total: number
}

export interface GovernmentDecisionListResponse {
  data: GovernmentDecision[]
  total: number
  pagination: {
    page: number
    limit: number
    total_pages: number
  }
}

export interface DecisionChainItem {
  id: string
  decision_type: DecisionType
  reference_number: string
  title_en: string
  decision_date: string
  status: DecisionStatus
  chain_position: number
}

export interface DecisionAmendmentChain {
  decisions: DecisionChainItem[]
  current_decision_position: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface MouFilters {
  lifecycle_stage?: MouLifecycleStage
  party_id?: string
  party_type?: MouPartyType
  has_cabinet_approval?: boolean
  has_royal_decree?: boolean
}

export interface GovernmentDecisionFilters {
  decision_type?: DecisionType
  status?: DecisionStatus
  from_date?: string
  to_date?: string
  related_mou_id?: string
  related_dossier_id?: string
}
