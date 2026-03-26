/**
 * Audit Domain Types
 * @module domains/audit/types
 */

export interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string
  user_id: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  created_at: string
}

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  retention_days: number
  entity_type: string
  enabled: boolean
  created_at: string
}

export interface LegalHold {
  id: string
  name: string
  description: string
  status: 'active' | 'released'
  entity_type: string
  created_at: string
}
