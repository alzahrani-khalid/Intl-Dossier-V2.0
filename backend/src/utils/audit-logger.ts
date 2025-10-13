/**
 * Audit Logging Utility
 *
 * Provides functions to log user management actions to immutable audit trail.
 * All audit logs are partitioned by year and retained for 7 years for compliance.
 *
 * Feature: 019-user-management-access
 * Task: T018
 *
 * @module utils/audit-logger
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from './logger';

// Initialize Supabase client for audit logging
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Audit log event types
 */
export enum AuditEventType {
  USER_CREATED = 'user_created',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_REACTIVATED = 'user_reactivated',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_APPROVAL_REQUESTED = 'role_approval_requested',
  ROLE_APPROVED = 'role_approved',
  ROLE_REJECTED = 'role_rejected',
  DELEGATION_CREATED = 'delegation_created',
  DELEGATION_REVOKED = 'delegation_revoked',
  DELEGATION_EXPIRED = 'delegation_expired',
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  ACCESS_REVIEW_CREATED = 'access_review_created',
  ACCESS_REVIEW_COMPLETED = 'access_review_completed',
  ACCESS_CERTIFIED = 'access_certified',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  PASSWORD_RESET_INITIATED = 'password_reset_initiated',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
}

/**
 * Audit log action types
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  REVOKE = 'revoke',
  CERTIFY = 'certify',
}

/**
 * Audit log resource types
 */
export enum AuditResourceType {
  USER = 'user',
  ROLE = 'role',
  DELEGATION = 'delegation',
  SESSION = 'session',
  APPROVAL = 'approval',
  REVIEW = 'review',
  CERTIFICATION = 'certification',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  targetUserId?: string;
  resourceType: AuditResourceType;
  resourceId?: string;
  action: AuditAction;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 *
 * Writes an immutable audit log entry to the database.
 * Logs are partitioned by year and retained for 7 years.
 *
 * @param entry - Audit log entry
 * @returns Audit log ID
 *
 * @example
 * ```typescript
 * await logAuditEvent({
 *   eventType: AuditEventType.USER_CREATED,
 *   userId: adminId,
 *   targetUserId: newUserId,
 *   resourceType: AuditResourceType.USER,
 *   resourceId: newUserId,
 *   action: AuditAction.CREATE,
 *   changes: {
 *     after: { email: 'user@example.com', role: 'viewer' }
 *   },
 *   metadata: { source: 'admin_portal' },
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 * ```
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: entry.eventType,
        user_id: entry.userId,
        target_user_id: entry.targetUserId,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        action: entry.action,
        changes: entry.changes,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      logError('Audit log write failed', error);
      return null;
    }

    logInfo('Audit log created', {
      auditId: data.id,
      eventType: entry.eventType,
      action: entry.action
    });

    return data.id;
  } catch (error) {
    logError('Audit logging error', error);
    return null;
  }
}

/**
 * Log user creation event
 */
export async function logUserCreation(
  adminId: string,
  newUserId: string,
  userData: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.USER_CREATED,
    userId: adminId,
    targetUserId: newUserId,
    resourceType: AuditResourceType.USER,
    resourceId: newUserId,
    action: AuditAction.CREATE,
    changes: {
      after: userData,
    },
    metadata: {
      source: 'user_management',
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log role assignment event
 */
export async function logRoleAssignment(
  adminId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.ROLE_ASSIGNED,
    userId: adminId,
    targetUserId,
    resourceType: AuditResourceType.ROLE,
    resourceId: targetUserId,
    action: AuditAction.UPDATE,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    metadata: {
      reason,
      requiresApproval: ['admin', 'super_admin'].includes(newRole),
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log delegation creation event
 */
export async function logDelegationCreation(
  grantorId: string,
  granteeId: string,
  delegationId: string,
  permissions: string[],
  expiresAt: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.DELEGATION_CREATED,
    userId: grantorId,
    targetUserId: granteeId,
    resourceType: AuditResourceType.DELEGATION,
    resourceId: delegationId,
    action: AuditAction.CREATE,
    changes: {
      after: {
        permissions,
        expiresAt,
      },
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log delegation revocation event
 */
export async function logDelegationRevocation(
  revokerId: string,
  delegationId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.DELEGATION_REVOKED,
    userId: revokerId,
    resourceType: AuditResourceType.DELEGATION,
    resourceId: delegationId,
    action: AuditAction.REVOKE,
    metadata: {
      reason,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log user deactivation event
 */
export async function logUserDeactivation(
  adminId: string,
  targetUserId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.USER_DEACTIVATED,
    userId: adminId,
    targetUserId,
    resourceType: AuditResourceType.USER,
    resourceId: targetUserId,
    action: AuditAction.UPDATE,
    changes: {
      before: { status: 'active' },
      after: { status: 'deactivated' },
    },
    metadata: {
      reason,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log session termination event
 */
export async function logSessionTermination(
  userId: string,
  sessionId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.SESSION_TERMINATED,
    userId,
    resourceType: AuditResourceType.SESSION,
    resourceId: sessionId,
    action: AuditAction.DELETE,
    metadata: {
      reason,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log access review creation event
 */
export async function logAccessReviewCreation(
  reviewerId: string,
  reviewId: string,
  scope: string,
  scopeValue?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.ACCESS_REVIEW_CREATED,
    userId: reviewerId,
    resourceType: AuditResourceType.REVIEW,
    resourceId: reviewId,
    action: AuditAction.CREATE,
    metadata: {
      scope,
      scopeValue,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log access certification event
 */
export async function logAccessCertification(
  certifierId: string,
  targetUserId: string,
  certificationId: string,
  status: string,
  changeRequests?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  return logAuditEvent({
    eventType: AuditEventType.ACCESS_CERTIFIED,
    userId: certifierId,
    targetUserId,
    resourceType: AuditResourceType.CERTIFICATION,
    resourceId: certificationId,
    action: AuditAction.CERTIFY,
    changes: {
      after: {
        status,
        changeRequests,
      },
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Query audit logs
 *
 * Retrieves audit logs with filtering options.
 * Note: This is for read-only purposes. Audit logs are immutable.
 *
 * @param filters - Query filters
 * @returns Audit log entries
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  targetUserId?: string;
  eventType?: AuditEventType;
  resourceType?: AuditResourceType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<unknown[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.targetUserId) {
      query = query.eq('target_user_id', filters.targetUserId);
    }

    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logError('Audit log query failed', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logError('Audit log query error', error);
    return [];
  }
}
