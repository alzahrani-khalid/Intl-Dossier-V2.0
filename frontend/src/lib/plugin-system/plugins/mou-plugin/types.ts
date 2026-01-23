/**
 * MoU Plugin - Type Definitions
 *
 * Entity plugin for Memoranda of Understanding (MoU).
 * MoUs represent formal agreements between organizations with workflow management.
 */

import type { BaseDossier } from '../../types/plugin.types'

// ============================================================================
// Enums
// ============================================================================

/**
 * MoU workflow state types
 */
export type MouWorkflowState =
  | 'draft'
  | 'internal_review'
  | 'external_review'
  | 'negotiation'
  | 'signed'
  | 'active'
  | 'renewed'
  | 'expired'

// ============================================================================
// Extension Type
// ============================================================================

/**
 * MoU-specific extension fields
 */
export interface MouExtension {
  /** Unique reference number (auto-generated) */
  reference_number: string
  /** MoU workflow state */
  workflow_state: MouWorkflowState
  /** Primary party organization ID */
  primary_party_id: string
  /** Secondary party organization ID */
  secondary_party_id: string
  /** Document URL */
  document_url?: string
  /** Document version number */
  document_version?: number
  /** Date the MoU was signed */
  signing_date?: string
  /** Date the MoU becomes effective */
  effective_date?: string
  /** Date the MoU expires */
  expiry_date?: string
  /** Whether the MoU automatically renews */
  auto_renewal?: boolean
  /** Renewal period in months */
  renewal_period_months?: number
  /** Owner user ID */
  owner_id: string
}

/**
 * Full MoU type (base + extension)
 */
export type Mou = BaseDossier & MouExtension

// ============================================================================
// Labels
// ============================================================================

export const MOU_WORKFLOW_STATE_LABELS: Record<MouWorkflowState, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  internal_review: { en: 'Internal Review', ar: 'مراجعة داخلية' },
  external_review: { en: 'External Review', ar: 'مراجعة خارجية' },
  negotiation: { en: 'Negotiation', ar: 'تفاوض' },
  signed: { en: 'Signed', ar: 'موقع' },
  active: { en: 'Active', ar: 'نشط' },
  renewed: { en: 'Renewed', ar: 'مجدد' },
  expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
}
