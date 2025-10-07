import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SLAStatus {
  acknowledgment: {
    target_minutes: number;
    elapsed_minutes: number;
    remaining_minutes: number;
    is_breached: boolean;
    target_time: string;
  };
  resolution: {
    target_minutes: number;
    elapsed_minutes: number;
    remaining_minutes: number;
    is_breached: boolean;
    target_time: string;
  };
}

interface SLAConfig {
  acknowledgment_target: number; // minutes
  resolution_target: number; // minutes
  business_hours_only: boolean;
  timezone: string;
}

/**
 * SLA Tracking Service
 * Monitors and tracks SLA compliance with Supabase Realtime integration
 */
export class SLAService {
  private readonly DEFAULT_ACK_MINUTES = 30;
  private readonly DEFAULT_RESOLUTION_MINUTES = 480; // 8 hours
  private readonly TIMEZONE = 'Asia/Riyadh';

  /**
   * Start SLA tracking for a ticket
   */
  async startSLATracking(ticketId: string, priority: string): Promise<boolean> {
    try {
      logger.info('Starting SLA tracking', { ticketId, priority });

      // Get applicable SLA policy
      const policy = await this.getSLAPolicy(priority);

      // Create initial SLA event
      await this.createSLAEvent({
        ticketId,
        policyId: policy.id,
        eventType: 'started',
        elapsedMinutes: 0,
        remainingMinutes: policy.acknowledgment_target,
      });

      // Set up triggers for breach notifications (handled by database triggers)
      await this.scheduleBreachCheck(ticketId, policy);

      logger.info('SLA tracking started successfully', { ticketId });
      return true;
    } catch (error) {
      logger.error('Failed to start SLA tracking', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get SLA policy for a given priority
   */
  private async getSLAPolicy(priority: string): Promise<any> {
    const { data, error } = await supabase
      .from('sla_policies')
      .select('*')
      .eq('priority', priority)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Return default policy
      return {
        id: 'default',
        acknowledgment_target: this.DEFAULT_ACK_MINUTES,
        resolution_target: this.DEFAULT_RESOLUTION_MINUTES,
        business_hours_only: false,
        timezone: this.TIMEZONE,
      };
    }

    return data;
  }

  /**
   * Get current SLA status for a ticket
   */
  async getSLAStatus(ticketId: string): Promise<SLAStatus | null> {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('intake_tickets')
        .select('created_at, submitted_at, priority, status')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        return null;
      }

      // Get SLA policy
      const policy = await this.getSLAPolicy(ticket.priority);

      // Calculate elapsed time since submission
      const startTime = new Date(ticket.submitted_at || ticket.created_at);
      const now = new Date();
      const elapsedMinutes = Math.floor(
        (now.getTime() - startTime.getTime()) / (1000 * 60)
      );

      // Calculate acknowledgment SLA
      const ackTargetTime = new Date(
        startTime.getTime() + policy.acknowledgment_target * 60 * 1000
      );
      const ackRemaining = Math.max(
        0,
        Math.floor((ackTargetTime.getTime() - now.getTime()) / (1000 * 60))
      );

      // Calculate resolution SLA
      const resolutionTargetTime = new Date(
        startTime.getTime() + policy.resolution_target * 60 * 1000
      );
      const resolutionRemaining = Math.max(
        0,
        Math.floor((resolutionTargetTime.getTime() - now.getTime()) / (1000 * 60))
      );

      return {
        acknowledgment: {
          target_minutes: policy.acknowledgment_target,
          elapsed_minutes: elapsedMinutes,
          remaining_minutes: ackRemaining,
          is_breached: ackRemaining === 0 && ticket.status === 'submitted',
          target_time: ackTargetTime.toISOString(),
        },
        resolution: {
          target_minutes: policy.resolution_target,
          elapsed_minutes: elapsedMinutes,
          remaining_minutes: resolutionRemaining,
          is_breached: resolutionRemaining === 0 && ticket.status !== 'closed',
          target_time: resolutionTargetTime.toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to get SLA status', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Pause SLA tracking (for business hours)
   */
  async pauseSLA(ticketId: string, reason: string): Promise<boolean> {
    try {
      // Get current SLA status
      const status = await this.getSLAStatus(ticketId);
      if (!status) {
        return false;
      }

      // Create pause event
      await this.createSLAEvent({
        ticketId,
        policyId: 'active-policy',
        eventType: 'paused',
        elapsedMinutes: status.resolution.elapsed_minutes,
        remainingMinutes: status.resolution.remaining_minutes,
        reason,
      });

      logger.info('SLA paused', { ticketId, reason });
      return true;
    } catch (error) {
      logger.error('Failed to pause SLA', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Resume SLA tracking
   */
  async resumeSLA(ticketId: string): Promise<boolean> {
    try {
      const status = await this.getSLAStatus(ticketId);
      if (!status) {
        return false;
      }

      await this.createSLAEvent({
        ticketId,
        policyId: 'active-policy',
        eventType: 'resumed',
        elapsedMinutes: status.resolution.elapsed_minutes,
        remainingMinutes: status.resolution.remaining_minutes,
      });

      logger.info('SLA resumed', { ticketId });
      return true;
    } catch (error) {
      logger.error('Failed to resume SLA', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Mark SLA as met
   */
  async markSLAMet(ticketId: string, slaType: 'acknowledgment' | 'resolution'): Promise<boolean> {
    try {
      const status = await this.getSLAStatus(ticketId);
      if (!status) {
        return false;
      }

      const targetStatus = status[slaType];

      await this.createSLAEvent({
        ticketId,
        policyId: 'active-policy',
        eventType: 'met',
        elapsedMinutes: targetStatus.elapsed_minutes,
        remainingMinutes: targetStatus.remaining_minutes,
        reason: `${slaType} SLA met`,
      });

      logger.info('SLA met', { ticketId, slaType });
      return true;
    } catch (error) {
      logger.error('Failed to mark SLA met', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Cancel SLA tracking (ticket closed/merged)
   */
  async cancelSLA(ticketId: string, reason: string): Promise<boolean> {
    try {
      const status = await this.getSLAStatus(ticketId);
      if (!status) {
        return false;
      }

      await this.createSLAEvent({
        ticketId,
        policyId: 'active-policy',
        eventType: 'cancelled',
        elapsedMinutes: status.resolution.elapsed_minutes,
        remainingMinutes: status.resolution.remaining_minutes,
        reason,
      });

      logger.info('SLA cancelled', { ticketId, reason });
      return true;
    } catch (error) {
      logger.error('Failed to cancel SLA', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Create SLA event in database
   */
  private async createSLAEvent(params: {
    ticketId: string;
    policyId: string;
    eventType: 'started' | 'paused' | 'resumed' | 'met' | 'breached' | 'cancelled';
    elapsedMinutes: number;
    remainingMinutes: number;
    reason?: string;
  }): Promise<void> {
    await supabase.from('sla_events').insert({
      ticket_id: params.ticketId,
      policy_id: params.policyId,
      event_type: params.eventType,
      event_timestamp: new Date().toISOString(),
      elapsed_minutes: params.elapsedMinutes,
      remaining_minutes: params.remainingMinutes,
      is_breached: params.remainingMinutes === 0,
      created_by: 'system',
      reason: params.reason,
    });

    // Trigger Realtime update (happens automatically via Supabase)
  }

  /**
   * Schedule breach check (using database triggers)
   */
  private async scheduleBreachCheck(ticketId: string, policy: any): Promise<void> {
    // This would typically be handled by a database trigger or scheduled job
    // For now, we rely on the real-time status calculation
    logger.debug('Breach check scheduled', { ticketId, policy: policy.id });
  }

  /**
   * Get SLA history for a ticket
   */
  async getSLAHistory(ticketId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sla_events')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('event_timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get SLA history', {
        ticketId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get all tickets with breached SLAs
   */
  async getBreachedTickets(): Promise<any[]> {
    try {
      // This would typically use a materialized view or cached query
      const { data, error } = await supabase.rpc('get_sla_breached_tickets');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get breached tickets', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}

export const slaService = new SLAService();