/**
 * Shared Kernel - Audit Types
 *
 * Standard audit trail types for tracking entity changes
 * across all bounded contexts.
 */

/**
 * Standard audit fields present on all auditable entities
 */
export interface AuditInfo {
  /** Creation timestamp (ISO 8601) */
  created_at: string
  /** Last update timestamp (ISO 8601) */
  updated_at: string
  /** ID of user who created the entity */
  created_by?: string
  /** ID of user who last updated the entity */
  updated_by?: string
}

/**
 * Extended audit info with user details
 */
export interface AuditInfoWithUser extends AuditInfo {
  /** Name of user who created the entity */
  created_by_name?: string
  /** Name of user who last updated the entity */
  updated_by_name?: string
}

/**
 * Audit log entry for tracking changes
 */
export interface AuditLogEntry {
  /** Unique audit log ID */
  id: string
  /** Entity type that was changed */
  entity_type: string
  /** Entity ID that was changed */
  entity_id: string
  /** Type of action performed */
  action: 'create' | 'update' | 'delete' | 'archive' | 'restore'
  /** Previous values (for updates) */
  old_values?: Record<string, unknown>
  /** New values (for updates and creates) */
  new_values?: Record<string, unknown>
  /** ID of user who made the change */
  user_id: string
  /** Name of user who made the change */
  user_name?: string
  /** Timestamp of the change */
  timestamp: string
  /** Optional reason for the change */
  reason?: string
  /** Additional context metadata */
  metadata?: Record<string, unknown>
}

/**
 * Mixin type to add audit fields to any entity
 */
export type Auditable<T> = T & AuditInfo

/**
 * Create fresh audit info for new entities
 */
export function createAuditInfo(userId?: string): AuditInfo {
  const now = new Date().toISOString()
  return {
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId,
  }
}

/**
 * Update audit info for modified entities
 */
export function updateAuditInfo(existing: AuditInfo, userId?: string): AuditInfo {
  return {
    ...existing,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }
}

/**
 * Type guard for AuditInfo
 */
export function hasAuditInfo(value: unknown): value is AuditInfo {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj.created_at === 'string' && typeof obj.updated_at === 'string'
}
