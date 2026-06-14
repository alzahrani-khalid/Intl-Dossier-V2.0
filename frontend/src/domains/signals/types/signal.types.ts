/**
 * Signal domain types — Phase 69.
 * Mirrors the intelligence_event extension columns and the read_signals RPC return shape.
 * @module domains/signals/types/signal.types
 */

export type SignalStatus = 'new' | 'acknowledged' | 'dismissed' | 'escalated'
export type SignalCategory = 'political' | 'economic' | 'security' | 'diplomatic' | 'other'
export type SignalSeverity = 'low' | 'medium' | 'high' | 'urgent'
export type SignalSourceType = 'human_entered' | 'ai_generated' | 'publication' | 'feed'

export interface Signal {
  id: string
  title: string
  content: string
  sensitivity_level: number // 1–4
  severity: SignalSeverity
  category: SignalCategory | null
  source_type: SignalSourceType
  source_ref: string | null
  ai_confidence: number | null // 0.00–1.00; null for human_entered
  status: SignalStatus
  occurred_at: string
  created_at: string
  created_by: string
  escalated_task_id: string | null
  organization_id: string
}

export interface SignalFilters {
  dossierId?: string
  status?: SignalStatus
  since?: string
  limit?: number
}

export type CreateSignalInput = {
  title: string
  body: string
  severity: SignalSeverity
  category: SignalCategory
  sensitivityLevel: number
  dossierIds: string[]
  // Maps dossier_id → dossier.type for the junction INSERT; optional to keep types minimal
  dossierTypes?: Record<string, string>
  // Defaults to 'human_entered'; pass 'ai_generated' for the AI write path (D-13)
  sourceType?: SignalSourceType
  // Required when sourceType='ai_generated'; null for human_entered
  aiConfidence?: number | null
}

export interface UpdateSignalStatusInput {
  id: string
  status: SignalStatus
}

export interface EscalateSignalInput {
  signalId: string
  title: string
  body: string
  priority: SignalSeverity
  assigneeId?: string
  slaDeadline?: string
  dossierIds: string[]
  dossierTypes?: Record<string, string>
}

export const signalKeys = {
  all: ['signals'] as const,
  lists: () => [...signalKeys.all, 'list'] as const,
  list: (filters: SignalFilters) => [...signalKeys.lists(), filters] as const,
  dossierLinks: (signalId: string) => [...signalKeys.all, 'dossier-links', signalId] as const,
}
