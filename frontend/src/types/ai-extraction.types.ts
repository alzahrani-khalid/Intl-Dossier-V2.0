/**
 * Shared AI Extraction Types
 *
 * Single source of truth for AI extraction result types
 * Used by: use-ai-extraction.ts, AIExtractionButton.tsx, AIExtractionStatus.tsx
 */

export interface ExtractionResultDecision {
  description: string
  rationale: string | null
  decision_maker: string
  confidence_score: number
}

export interface ExtractionResultCommitment {
  description: string
  owner_name: string
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  confidence_score: number
}

export interface ExtractionResultRisk {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation_strategy?: string
  confidence_score: number
}

export interface ExtractionResultFollowUp {
  description: string
  assigned_to?: string
  target_date?: Date
  confidence_score?: number
}

/** Full extraction result from AI service */
export interface ExtractionResult {
  extraction_id?: string
  decisions: ExtractionResultDecision[]
  commitments: ExtractionResultCommitment[]
  risks: ExtractionResultRisk[]
  follow_up_actions: ExtractionResultFollowUp[]
  processing_time_ms?: number
}

/** Simplified extraction result for form pre-filling */
export interface FormExtractionResult {
  decisions?: Array<{
    description: string
    rationale?: string | null
    decision_maker?: string
  }>
  commitments?: Array<{
    description: string
    owner_name?: string
    due_date?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }>
  risks?: Array<{
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    likelihood?: 'unlikely' | 'possible' | 'likely' | 'certain'
    mitigation_strategy?: string
  }>
  follow_ups?: Array<{
    description: string
    assigned_to?: string
    target_date?: Date
  }>
}
