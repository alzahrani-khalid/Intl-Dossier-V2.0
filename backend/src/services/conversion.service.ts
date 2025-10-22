import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ConversionOptions {
  ticketId: string;
  targetType: 'engagement' | 'position' | 'mou_action' | 'foresight';
  additionalData?: Record<string, any>;
  userId: string;
  mfaVerified?: boolean;
}

interface ConversionResult {
  success: boolean;
  artifactType: string;
  artifactId: string;
  artifactUrl: string;
  correlationId: string;
  error?: string;
}

/**
 * Conversion Service
 * Handles converting intake tickets to working artifacts with transaction rollback support
 */
export class ConversionService {
  /**
   * Convert an intake ticket to a target artifact type
   * Uses database transactions to ensure atomicity
   */
  async convertTicket(options: ConversionOptions): Promise<ConversionResult> {
    const correlationId = this.generateCorrelationId();

    logger.info('Starting ticket conversion', {
      ticketId: options.ticketId,
      targetType: options.targetType,
      userId: options.userId,
      correlationId,
    });

    try {
      // Step 1: Validate ticket exists and can be converted
      const ticket = await this.validateTicket(options.ticketId);

      // Step 2: Check MFA requirement for confidential+ tickets
      if (this.requiresMFA(ticket.sensitivity) && !options.mfaVerified) {
        throw new Error('MFA verification required for confidential tickets');
      }

      // Step 3: Start transaction and create artifact
      const artifactId = await this.createArtifactTransaction(
        ticket,
        options,
        correlationId
      );

      // Step 4: Generate artifact URL
      const artifactUrl = this.generateArtifactUrl(options.targetType, artifactId);

      logger.info('Ticket conversion completed successfully', {
        ticketId: options.ticketId,
        artifactId,
        correlationId,
      });

      return {
        success: true,
        artifactType: options.targetType,
        artifactId,
        artifactUrl,
        correlationId,
      };
    } catch (error) {
      logger.error('Ticket conversion failed', {
        ticketId: options.ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });

      return {
        success: false,
        artifactType: options.targetType,
        artifactId: '',
        artifactUrl: '',
        correlationId,
        error: error instanceof Error ? error.message : 'Conversion failed',
      };
    }
  }

  /**
   * Validate that the ticket exists and is in a convertible state
   */
  private async validateTicket(ticketId: string) {
    const { data: ticket, error } = await supabase
      .from('intake_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    // Check if ticket is in a valid state for conversion
    const validStatuses = ['triaged', 'assigned', 'in_progress'];
    if (!validStatuses.includes(ticket.status)) {
      throw new Error(
        `Ticket cannot be converted from status: ${ticket.status}`
      );
    }

    // Check if already converted
    if (ticket.converted_to_id) {
      throw new Error('Ticket has already been converted');
    }

    return ticket;
  }

  /**
   * Check if MFA is required based on sensitivity level
   */
  private requiresMFA(sensitivity: string): boolean {
    const mfaRequired = ['confidential', 'secret'];
    return mfaRequired.includes(sensitivity);
  }

  /**
   * Create artifact in target table using transaction with rollback support
   */
  private async createArtifactTransaction(
    ticket: any,
    options: ConversionOptions,
    correlationId: string
  ): Promise<string> {
    // Use Postgres transaction via RPC function for atomicity
    const { data, error } = await supabase.rpc('convert_ticket_to_artifact', {
      p_ticket_id: options.ticketId,
      p_target_type: options.targetType,
      p_additional_data: options.additionalData || {},
      p_user_id: options.userId,
      p_correlation_id: correlationId,
      p_mfa_verified: options.mfaVerified || false,
    });

    if (error) {
      logger.error('Transaction failed during conversion', {
        ticketId: options.ticketId,
        error: error.message,
        correlationId,
      });
      throw new Error(`Conversion transaction failed: ${error.message}`);
    }

    if (!data || !data.artifact_id) {
      throw new Error('No artifact ID returned from transaction');
    }

    // Create audit log entry
    await this.createAuditLog({
      ticketId: options.ticketId,
      artifactId: data.artifact_id,
      artifactType: options.targetType,
      userId: options.userId,
      mfaVerified: options.mfaVerified || false,
      correlationId,
    });

    return data.artifact_id;
  }

  /**
   * Create audit log for conversion
   */
  private async createAuditLog(params: {
    ticketId: string;
    artifactId: string;
    artifactType: string;
    userId: string;
    mfaVerified: boolean;
    correlationId: string;
  }) {
    await supabase.from('audit_logs').insert({
      entity_type: 'intake_ticket',
      entity_id: params.ticketId,
      action: 'convert',
      new_values: {
        converted_to_type: params.artifactType,
        converted_to_id: params.artifactId,
      },
      user_id: params.userId,
      user_role: 'system', // Will be replaced by actual role from JWT
      required_mfa: this.requiresMFA('confidential'), // Simplified check
      mfa_verified: params.mfaVerified,
      correlation_id: params.correlationId,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Generate artifact URL based on type
   */
  private generateArtifactUrl(type: string, artifactId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const paths: Record<string, string> = {
      engagement: '/engagements',
      position: '/positions',
      mou_action: '/mou/actions',
      foresight: '/foresight',
    };

    return `${baseUrl}${paths[type]}/${artifactId}`;
  }

  /**
   * Generate unique correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Rollback conversion (manual intervention)
   */
  async rollbackConversion(ticketId: string, userId: string): Promise<boolean> {
    const correlationId = this.generateCorrelationId();

    logger.warn('Initiating conversion rollback', {
      ticketId,
      userId,
      correlationId,
    });

    try {
      // Call rollback RPC function
      const { error } = await supabase.rpc('rollback_ticket_conversion', {
        p_ticket_id: ticketId,
        p_user_id: userId,
        p_correlation_id: correlationId,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create audit log for rollback
      await supabase.from('audit_logs').insert({
        entity_type: 'intake_ticket',
        entity_id: ticketId,
        action: 'rollback_conversion',
        user_id: userId,
        user_role: 'system',
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      });

      logger.info('Conversion rollback successful', {
        ticketId,
        correlationId,
      });

      return true;
    } catch (error) {
      logger.error('Rollback failed', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      return false;
    }
  }
}

export const conversionService = new ConversionService();