/**
 * Lifecycle Engine Type Definitions
 * Feature: lifecycle-engine (Phase 09)
 *
 * Shared type contract for the engagement lifecycle system:
 * - 6-stage lifecycle (intake -> closed)
 * - Stage transitions with audit trail
 * - Intake ticket promotion to engagements
 * - Forum session creation
 */

// ============================================================================
// Core Lifecycle Types
// ============================================================================

/**
 * The 6 stages of an engagement lifecycle
 */
export type LifecycleStage =
  | 'intake'
  | 'preparation'
  | 'briefing'
  | 'execution'
  | 'follow_up'
  | 'closed'

/**
 * Ordered array of all lifecycle stages
 */
export const LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  'intake',
  'preparation',
  'briefing',
  'execution',
  'follow_up',
  'closed',
] as const

/**
 * Bilingual labels for lifecycle stages
 */
export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, { en: string; ar: string }> = {
  intake: { en: 'Intake', ar: '\u0627\u0644\u0627\u0633\u062a\u0642\u0628\u0627\u0644' },
  preparation: { en: 'Preparation', ar: '\u0627\u0644\u062a\u062d\u0636\u064a\u0631' },
  briefing: { en: 'Briefing', ar: '\u0627\u0644\u0625\u062d\u0627\u0637\u0629' },
  execution: { en: 'Execution', ar: '\u0627\u0644\u062a\u0646\u0641\u064a\u0630' },
  follow_up: { en: 'Follow-up', ar: '\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629' },
  closed: { en: 'Closed', ar: '\u0645\u063a\u0644\u0642' },
}

// ============================================================================
// Transition Types
// ============================================================================

/**
 * A recorded lifecycle stage transition
 */
export interface LifecycleTransition {
  id: string
  engagement_id: string
  from_stage: LifecycleStage | null
  to_stage: LifecycleStage
  user_id: string
  user_name?: string // joined from profiles
  note: string | null
  transitioned_at: string
  duration_in_stage_seconds: number | null
  created_at: string
}

/**
 * Request body for creating a lifecycle transition
 */
export interface LifecycleTransitionRequest {
  to_stage: LifecycleStage
  note?: string
}

// ============================================================================
// Intake Promotion Types
// ============================================================================

/**
 * Request body for promoting an intake ticket to an engagement
 */
export interface IntakePromotionRequest {
  ticket_id: string
  title_en: string
  title_ar: string
  objectives_en?: string
  objectives_ar?: string
  engagement_type: string // EngagementType from engagement.types.ts
  engagement_category: string // EngagementCategory
  dossier_links?: string[] // dossier IDs to link
}

/**
 * Response after successful intake promotion
 */
export interface IntakePromotionResponse {
  engagement_id: string
  dossier_id: string
}

// ============================================================================
// Forum Session Types
// ============================================================================

/**
 * Request body for creating a forum session engagement
 */
export interface ForumSessionCreateRequest {
  parent_forum_id: string
  title_en: string
  title_ar: string
  start_date: string
  end_date: string
  location_en?: string
  location_ar?: string
  description_en?: string
  description_ar?: string
}
