/**
 * Escalation Service
 * Handles SLA breach escalations and escalation chain resolution
 *
 * Dependencies:
 * - T009: escalation_events table
 * - T016: get_escalation_recipient function
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface EscalationEvent {
  id: string;
  assignment_id: string;
  escalated_from_id: string;
  escalated_to_id: string;
  reason: 'sla_breach' | 'manual' | 'capacity_exhaustion';
  escalated_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notes: string | null;
}

export interface EscalationResponse {
  escalation_id: string;
  escalated_to_id: string;
  escalated_to_name_ar: string;
  escalated_to_name_en: string;
  escalated_at: string;
}

export interface StaffProfile {
  user_id: string;
  full_name_ar?: string;
  full_name_en?: string;
  email?: string;
}

export class EscalationService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Escalate an assignment to the next person in the chain
   * Creates escalation_event record and returns recipient details
   */
  async escalateAssignment(
    assignmentId: string,
    reason: 'sla_breach' | 'manual' | 'capacity_exhaustion',
    notes?: string
  ): Promise<EscalationResponse> {
    // Get assignment details
    const { data: assignment, error: assignmentError } = await this.supabase
      .from('assignments')
      .select('assignee_id, work_item_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    // Get escalation recipient using database function
    const recipient = await this.getEscalationRecipient(assignment.assignee_id);

    // Create escalation event
    const { data: escalationEvent, error: escalationError } = await this.supabase
      .from('escalation_events')
      .insert({
        assignment_id: assignmentId,
        escalated_from_id: assignment.assignee_id,
        escalated_to_id: recipient.user_id,
        reason,
        notes,
        escalated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (escalationError || !escalationEvent) {
      throw new Error(`Failed to create escalation event: ${escalationError?.message}`);
    }

    // Update assignment with escalation details
    const { error: updateError } = await this.supabase
      .from('assignments')
      .update({
        escalated_at: new Date().toISOString(),
        escalation_recipient_id: recipient.user_id,
      })
      .eq('id', assignmentId);

    if (updateError) {
      throw new Error(`Failed to update assignment: ${updateError.message}`);
    }

    // Send notifications to both parties
    await this.sendEscalationNotifications(escalationEvent);

    return {
      escalation_id: escalationEvent.id,
      escalated_to_id: recipient.user_id,
      escalated_to_name_ar: recipient.full_name_ar || 'غير محدد',
      escalated_to_name_en: recipient.full_name_en || 'Not specified',
      escalated_at: escalationEvent.escalated_at,
    };
  }

  /**
   * Get escalation recipient using database function (T016)
   * Falls back: explicit chain → unit supervisor → admin
   */
  async getEscalationRecipient(staffId: string): Promise<StaffProfile> {
    const { data, error } = await this.supabase.rpc('get_escalation_recipient', {
      staff_id: staffId,
    });

    if (error || !data) {
      throw new Error(`Failed to get escalation recipient: ${error?.message}`);
    }

    // Get recipient profile details
    const { data: profile, error: profileError } = await this.supabase
      .from('staff_profiles')
      .select('user_id, full_name_ar, full_name_en')
      .eq('user_id', data)
      .single();

    if (profileError || !profile) {
      throw new Error(`Escalation recipient profile not found: ${data}`);
    }

    return profile;
  }

  /**
   * Send notifications to both assignee and escalation recipient
   * Uses Supabase Auth triggers for email delivery
   */
  async sendEscalationNotifications(escalationEvent: EscalationEvent): Promise<void> {
    const notifications = [
      {
        user_id: escalationEvent.escalated_from_id,
        type: 'sla_escalation_assignee',
        reference_id: escalationEvent.assignment_id,
        reference_type: 'assignment',
        message_ar: `تم تصعيد المهمة إلى المشرف بسبب: ${this.getReasonTextAr(escalationEvent.reason)}`,
        message_en: `Assignment escalated to supervisor due to: ${this.getReasonTextEn(escalationEvent.reason)}`,
        read_at: null,
        created_at: new Date().toISOString(),
      },
      {
        user_id: escalationEvent.escalated_to_id,
        type: 'sla_escalation_recipient',
        reference_id: escalationEvent.assignment_id,
        reference_type: 'assignment',
        message_ar: `تم تصعيد مهمة إليك بسبب: ${this.getReasonTextAr(escalationEvent.reason)}`,
        message_en: `An assignment has been escalated to you due to: ${this.getReasonTextEn(escalationEvent.reason)}`,
        read_at: null,
        created_at: new Date().toISOString(),
      },
    ];

    const { error } = await this.supabase.from('notifications').insert(notifications);

    if (error) {
      console.error('Failed to create escalation notifications:', error);
      // Don't throw - notifications are not critical to escalation workflow
    }
  }

  /**
   * Get Arabic reason text for escalation
   */
  private getReasonTextAr(reason: string): string {
    const reasons: Record<string, string> = {
      sla_breach: 'تجاوز الموعد النهائي لاتفاقية مستوى الخدمة',
      manual: 'تصعيد يدوي',
      capacity_exhaustion: 'استنفاد السعة',
    };
    return reasons[reason] || reason;
  }

  /**
   * Get English reason text for escalation
   */
  private getReasonTextEn(reason: string): string {
    const reasons: Record<string, string> = {
      sla_breach: 'SLA deadline exceeded',
      manual: 'Manual escalation',
      capacity_exhaustion: 'Capacity exhausted',
    };
    return reasons[reason] || reason;
  }

  /**
   * Acknowledge an escalation event
   * Updates acknowledged_at timestamp
   */
  async acknowledgeEscalation(escalationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('escalation_events')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', escalationId)
      .eq('escalated_to_id', userId); // Ensure user is the recipient

    if (error) {
      throw new Error(`Failed to acknowledge escalation: ${error.message}`);
    }
  }

  /**
   * Resolve an escalation event
   * Updates resolved_at timestamp and optional notes
   */
  async resolveEscalation(
    escalationId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const updateData: Partial<EscalationEvent> = {
      resolved_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { error } = await this.supabase
      .from('escalation_events')
      .update(updateData)
      .eq('id', escalationId)
      .eq('escalated_to_id', userId); // Ensure user is the recipient

    if (error) {
      throw new Error(`Failed to resolve escalation: ${error.message}`);
    }
  }

  /**
   * Get escalation history for an assignment
   * Returns all escalation events in chronological order
   */
  async getEscalationHistory(assignmentId: string): Promise<EscalationEvent[]> {
    const { data, error } = await this.supabase
      .from('escalation_events')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('escalated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get escalation history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending escalations for a staff member
   * Returns all unacknowledged escalations where user is recipient
   */
  async getPendingEscalations(userId: string): Promise<EscalationEvent[]> {
    const { data, error } = await this.supabase
      .from('escalation_events')
      .select('*')
      .eq('escalated_to_id', userId)
      .is('acknowledged_at', null)
      .order('escalated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending escalations: ${error.message}`);
    }

    return data || [];
  }
}
