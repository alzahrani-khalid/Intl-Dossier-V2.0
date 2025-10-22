import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MergeOptions {
  sourceTicketId: string; // Primary ticket (kept)
  targetTicketIds: string[]; // Tickets to merge into primary
  mergeReason?: string;
  userId: string;
}

interface MergeResult {
  success: boolean;
  primaryTicketId: string;
  mergedTicketIds: string[];
  historyPreserved: boolean;
  error?: string;
}

/**
 * Merge Service
 * Handles merging duplicate tickets while preserving complete history
 */
export class MergeService {
  /**
   * Merge multiple tickets into a primary ticket
   * Preserves all history and relationships
   */
  async mergeTickets(options: MergeOptions): Promise<MergeResult> {
    const correlationId = this.generateCorrelationId();

    logger.info('Starting ticket merge operation', {
      sourceTicketId: options.sourceTicketId,
      targetTicketIds: options.targetTicketIds,
      userId: options.userId,
      correlationId,
    });

    try {
      // Validate all tickets exist and can be merged
      await this.validateTicketsForMerge(
        options.sourceTicketId,
        options.targetTicketIds
      );

      // Perform merge transaction
      const result = await this.performMergeTransaction(options, correlationId);

      logger.info('Ticket merge completed successfully', {
        primaryTicketId: options.sourceTicketId,
        mergedCount: options.targetTicketIds.length,
        correlationId,
      });

      return {
        success: true,
        primaryTicketId: options.sourceTicketId,
        mergedTicketIds: options.targetTicketIds,
        historyPreserved: true,
      };
    } catch (error) {
      logger.error('Ticket merge failed', {
        sourceTicketId: options.sourceTicketId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });

      return {
        success: false,
        primaryTicketId: options.sourceTicketId,
        mergedTicketIds: [],
        historyPreserved: false,
        error: error instanceof Error ? error.message : 'Merge failed',
      };
    }
  }

  /**
   * Validate tickets can be merged
   */
  private async validateTicketsForMerge(
    sourceId: string,
    targetIds: string[]
  ): Promise<void> {
    // Check source ticket
    const { data: sourceTicket, error: sourceError } = await supabase
      .from('intake_tickets')
      .select('id, status')
      .eq('id', sourceId)
      .single();

    if (sourceError || !sourceTicket) {
      throw new Error(`Source ticket not found: ${sourceId}`);
    }

    if (sourceTicket.status === 'merged') {
      throw new Error('Source ticket is already merged');
    }

    // Check all target tickets
    for (const targetId of targetIds) {
      const { data: targetTicket, error: targetError } = await supabase
        .from('intake_tickets')
        .select('id, status')
        .eq('id', targetId)
        .single();

      if (targetError || !targetTicket) {
        throw new Error(`Target ticket not found: ${targetId}`);
      }

      if (targetTicket.status === 'merged') {
        throw new Error(`Target ticket ${targetId} is already merged`);
      }

      if (targetId === sourceId) {
        throw new Error('Cannot merge ticket with itself');
      }
    }
  }

  /**
   * Perform merge transaction using database function
   */
  private async performMergeTransaction(
    options: MergeOptions,
    correlationId: string
  ): Promise<void> {
    // Call merge RPC function
    const { error } = await supabase.rpc('merge_tickets', {
      p_primary_ticket_id: options.sourceTicketId,
      p_ticket_ids_to_merge: options.targetTicketIds,
      p_merge_reason: options.mergeReason || 'Duplicate tickets',
      p_user_id: options.userId,
      p_correlation_id: correlationId,
    });

    if (error) {
      throw new Error(`Merge transaction failed: ${error.message}`);
    }

    // Create audit logs for the merge
    await this.createMergeAuditLogs(options, correlationId);
  }

  /**
   * Create audit logs for merge operation
   */
  private async createMergeAuditLogs(
    options: MergeOptions,
    correlationId: string
  ): Promise<void> {
    const auditEntries = [
      // Primary ticket audit
      {
        entity_type: 'intake_ticket',
        entity_id: options.sourceTicketId,
        action: 'merge_primary',
        new_values: {
          merged_ticket_ids: options.targetTicketIds,
          merge_reason: options.mergeReason,
        },
        user_id: options.userId,
        user_role: 'system',
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      },
      // Secondary tickets audits
      ...options.targetTicketIds.map((ticketId) => ({
        entity_type: 'intake_ticket',
        entity_id: ticketId,
        action: 'merge_secondary',
        new_values: {
          merged_into: options.sourceTicketId,
          merge_reason: options.mergeReason,
        },
        user_id: options.userId,
        user_role: 'system',
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      })),
    ];

    await supabase.from('audit_logs').insert(auditEntries);
  }

  /**
   * Get merge history for a ticket
   */
  async getMergeHistory(ticketId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', 'intake_ticket')
        .eq('entity_id', ticketId)
        .in('action', ['merge_primary', 'merge_secondary'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get merge history', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get all tickets merged into a primary ticket
   */
  async getMergedTickets(primaryTicketId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('intake_tickets')
        .select('id, ticket_number, title, status, parent_ticket_id')
        .eq('parent_ticket_id', primaryTicketId)
        .eq('status', 'merged');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get merged tickets', {
        primaryTicketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Unmerge tickets (restore merged tickets)
   */
  async unmergeTickets(
    primaryTicketId: string,
    ticketIdsToUnmerge: string[],
    userId: string
  ): Promise<boolean> {
    const correlationId = this.generateCorrelationId();

    logger.warn('Unmerging tickets', {
      primaryTicketId,
      ticketIdsToUnmerge,
      userId,
      correlationId,
    });

    try {
      // Update merged tickets back to their previous status
      const { error } = await supabase
        .from('intake_tickets')
        .update({
          status: 'submitted', // Reset to submitted for re-triage
          parent_ticket_id: null,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .in('id', ticketIdsToUnmerge)
        .eq('parent_ticket_id', primaryTicketId);

      if (error) {
        throw error;
      }

      // Create audit logs
      const auditEntries = ticketIdsToUnmerge.map((ticketId) => ({
        entity_type: 'intake_ticket',
        entity_id: ticketId,
        action: 'unmerge',
        old_values: {
          parent_ticket_id: primaryTicketId,
          status: 'merged',
        },
        new_values: {
          parent_ticket_id: null,
          status: 'submitted',
        },
        user_id: userId,
        user_role: 'system',
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('audit_logs').insert(auditEntries);

      logger.info('Tickets unmerged successfully', {
        primaryTicketId,
        unmergedCount: ticketIdsToUnmerge.length,
        correlationId,
      });

      return true;
    } catch (error) {
      logger.error('Unmerge failed', {
        primaryTicketId,
        ticketIdsToUnmerge,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      return false;
    }
  }

  /**
   * Generate unique correlation ID
   */
  private generateCorrelationId(): string {
    return `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const mergeService = new MergeService();