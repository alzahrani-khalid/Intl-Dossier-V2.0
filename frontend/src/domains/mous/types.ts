/**
 * MoU Domain Types
 * @module domains/mous/types
 *
 * Mirrors the deployed `mous` edge-fn contract (supabase/functions/mous/index.ts, v10).
 * The server resolves the caller's org, tenant, creator, and the MoU reference from
 * their profile — those fields are intentionally absent from the create payload.
 */

export type MouType = 'bilateral' | 'multilateral' | 'framework' | 'technical'

export type MouCategory = 'data_exchange' | 'capacity_building' | 'strategic' | 'technical'

export type MouLifecycleState =
  | 'draft'
  | 'negotiation'
  | 'pending_approval'
  | 'signed'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'terminated'

/** A party rendered by the `mous_frontend` view from the `parties` jsonb array. */
export interface MouParty {
  name_en: string
  name_ar: string
}

/** Request body for POST /mous. Server-resolved fields are deliberately omitted. */
export interface CreateMouPayload {
  title: string
  title_ar: string
  type: MouType
  mou_category: MouCategory
  lifecycle_state?: MouLifecycleState
  description?: string
  country_id?: string | null
  signatory_1_dossier_id?: string | null
  signatory_2_dossier_id?: string | null
  effective_date?: string | null
  expiry_date?: string | null
  dates?: Record<string, unknown>
  parties?: MouParty[]
}

/** Minimal MoU response shape returned by the create edge fn. */
export interface Mou {
  id: string
  title: string
  title_ar: string
  type: MouType
  mou_category: MouCategory
  lifecycle_state: MouLifecycleState
}
