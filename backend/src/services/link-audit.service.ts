/**
 * Link Audit Service - Handles audit logging for entity link operations
 * Feature: 024-intake-entity-linking
 */

import { supabaseAdmin } from '../config/supabase';
import type { LinkAuditLog } from '../types/intake-entity-links.types';

/**
 * Audit action types
 */
export type AuditAction = 'created' | 'updated' | 'deleted' | 'restored' | 'migrated' | 'reordered';

/**
 * Creates an audit log entry for entity link operations
 * These logs are immutable - no updates or deletes allowed
 *
 * @param linkId - The entity link ID
 * @param action - The action performed
 * @param userId - The user who performed the action
 * @param oldValues - Previous values (for updates)
 * @param newValues - New values (for updates)
 * @param ipAddress - User's IP address (optional)
 * @param userAgent - User's browser/client info (optional)
 * @returns Promise<void> - Fire-and-forget operation
 */
export async function createAuditLog(
  linkId: string,
  action: AuditAction,
  userId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Get link details for the audit log
    const { data: link, error: linkError } = await supabaseAdmin
      .from('intake_entity_links')
      .select('intake_id, entity_type, entity_id')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      console.error('Failed to fetch link for audit log:', linkError);
      // Don't throw - audit logging should not break the main operation
      return;
    }

    // Build details object based on action
    const details: Record<string, any> = {};

    if (action === 'updated' && oldValues && newValues) {
      details.old_values = oldValues;
      details.new_values = newValues;
      details.changed_fields = Object.keys(newValues);
    } else if (action === 'created' && newValues) {
      details.initial_values = newValues;
    } else if (action === 'deleted' || action === 'restored') {
      details.link_state = newValues || {};
    } else if (action === 'migrated') {
      details.migration_details = newValues || {};
    } else if (action === 'reordered') {
      details.reorder_details = newValues || {};
    }

    // Add request context if provided
    if (ipAddress) {
      details.ip_address = ipAddress;
    }
    if (userAgent) {
      details.user_agent = userAgent;
    }

    // Insert audit log entry
    const { error: auditError } = await supabaseAdmin
      .from('link_audit_logs')
      .insert({
        link_id: linkId,
        intake_id: link.intake_id,
        entity_type: link.entity_type,
        entity_id: link.entity_id,
        action: action,
        performed_by: userId,
        details: Object.keys(details).length > 0 ? details : null,
        timestamp: new Date().toISOString(),
      });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't throw - audit logging should not break the main operation
    }
  } catch (error) {
    console.error('Unexpected error in createAuditLog:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Gets audit logs for a specific link
 *
 * @param linkId - The entity link ID
 * @param limit - Maximum number of logs to return
 * @returns Array of LinkAuditLog entries
 */
export async function getAuditLogs(
  linkId: string,
  limit: number = 100
): Promise<LinkAuditLog[]> {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('link_audit_logs')
      .select('*')
      .eq('link_id', linkId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return (logs || []) as LinkAuditLog[];
  } catch (error) {
    console.error('Unexpected error in getAuditLogs:', error);
    return [];
  }
}

/**
 * Gets audit logs for an intake ticket
 *
 * @param intakeId - The intake ticket ID
 * @param limit - Maximum number of logs to return
 * @returns Array of LinkAuditLog entries
 */
export async function getIntakeAuditLogs(
  intakeId: string,
  limit: number = 100
): Promise<LinkAuditLog[]> {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('link_audit_logs')
      .select('*')
      .eq('intake_id', intakeId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch intake audit logs:', error);
      return [];
    }

    return (logs || []) as LinkAuditLog[];
  } catch (error) {
    console.error('Unexpected error in getIntakeAuditLogs:', error);
    return [];
  }
}

/**
 * Gets audit logs for a specific user
 *
 * @param userId - The user ID
 * @param limit - Maximum number of logs to return
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of LinkAuditLog entries
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
): Promise<LinkAuditLog[]> {
  try {
    let query = supabaseAdmin
      .from('link_audit_logs')
      .select('*')
      .eq('performed_by', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Failed to fetch user audit logs:', error);
      return [];
    }

    return (logs || []) as LinkAuditLog[];
  } catch (error) {
    console.error('Unexpected error in getUserAuditLogs:', error);
    return [];
  }
}

/**
 * Gets audit logs by action type
 *
 * @param action - The action type to filter by
 * @param limit - Maximum number of logs to return
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of LinkAuditLog entries
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 100,
  startDate?: Date,
  endDate?: Date
): Promise<LinkAuditLog[]> {
  try {
    let query = supabaseAdmin
      .from('link_audit_logs')
      .select('*')
      .eq('action', action)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs by action:', error);
      return [];
    }

    return (logs || []) as LinkAuditLog[];
  } catch (error) {
    console.error('Unexpected error in getAuditLogsByAction:', error);
    return [];
  }
}

/**
 * Creates a batch of audit logs for multiple operations
 * Used for bulk operations
 *
 * @param logs - Array of audit log entries to create
 * @returns Promise<void> - Fire-and-forget operation
 */
export async function createBatchAuditLogs(
  logs: Array<{
    linkId: string;
    action: AuditAction;
    userId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }>
): Promise<void> {
  try {
    // Get link details for all links
    const linkIds = logs.map(log => log.linkId);
    const { data: links, error: linksError } = await supabaseAdmin
      .from('intake_entity_links')
      .select('id, intake_id, entity_type, entity_id')
      .in('id', linkIds);

    if (linksError || !links) {
      console.error('Failed to fetch links for batch audit log:', linksError);
      return;
    }

    // Create a map for quick lookup
    const linkMap = new Map(links.map(link => [link.id, link]));

    // Build audit log entries
    const auditEntries = logs.map(log => {
      const link = linkMap.get(log.linkId);
      if (!link) {
        console.warn(`Link not found for audit log: ${log.linkId}`);
        return null;
      }

      // Build details object
      const details: Record<string, any> = {};

      if (log.action === 'updated' && log.oldValues && log.newValues) {
        details.old_values = log.oldValues;
        details.new_values = log.newValues;
        details.changed_fields = Object.keys(log.newValues);
      } else if (log.action === 'created' && log.newValues) {
        details.initial_values = log.newValues;
      } else if (log.action === 'deleted' || log.action === 'restored') {
        details.link_state = log.newValues || {};
      }

      if (log.ipAddress) {
        details.ip_address = log.ipAddress;
      }
      if (log.userAgent) {
        details.user_agent = log.userAgent;
      }

      return {
        link_id: log.linkId,
        intake_id: link.intake_id,
        entity_type: link.entity_type,
        entity_id: link.entity_id,
        action: log.action,
        performed_by: log.userId,
        details: Object.keys(details).length > 0 ? details : null,
        timestamp: new Date().toISOString(),
      };
    }).filter(entry => entry !== null);

    if (auditEntries.length === 0) {
      return;
    }

    // Insert all audit log entries
    const { error: auditError } = await supabaseAdmin
      .from('link_audit_logs')
      .insert(auditEntries);

    if (auditError) {
      console.error('Failed to create batch audit logs:', auditError);
    }
  } catch (error) {
    console.error('Unexpected error in createBatchAuditLogs:', error);
  }
}

/**
 * Gets statistics about link operations
 *
 * @param intakeId - Optional intake ID to filter by
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Statistics object
 */
export async function getAuditStatistics(
  intakeId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_operations: number;
  created: number;
  updated: number;
  deleted: number;
  restored: number;
  migrated: number;
  reordered: number;
  unique_users: number;
}> {
  try {
    let query = supabaseAdmin
      .from('link_audit_logs')
      .select('action, performed_by');

    if (intakeId) {
      query = query.eq('intake_id', intakeId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error || !logs) {
      console.error('Failed to fetch audit statistics:', error);
      return {
        total_operations: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        restored: 0,
        migrated: 0,
        reordered: 0,
        unique_users: 0,
      };
    }

    // Calculate statistics
    const stats = {
      total_operations: logs.length,
      created: logs.filter(log => log.action === 'created').length,
      updated: logs.filter(log => log.action === 'updated').length,
      deleted: logs.filter(log => log.action === 'deleted').length,
      restored: logs.filter(log => log.action === 'restored').length,
      migrated: logs.filter(log => log.action === 'migrated').length,
      reordered: logs.filter(log => log.action === 'reordered').length,
      unique_users: new Set(logs.map(log => log.performed_by)).size,
    };

    return stats;
  } catch (error) {
    console.error('Unexpected error in getAuditStatistics:', error);
    return {
      total_operations: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      restored: 0,
      migrated: 0,
      reordered: 0,
      unique_users: 0,
    };
  }
}