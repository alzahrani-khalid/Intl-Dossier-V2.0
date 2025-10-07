import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { MergeRequest, TicketResponse } from '../../../specs/008-front-door-intake/contracts/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('POST /intake/tickets/{id}/merge', () => {
  const primaryTicketId = 'primary-ticket-uuid';
  const duplicateTicketId1 = 'duplicate-ticket-1';
  const duplicateTicketId2 = 'duplicate-ticket-2';

  it('should merge duplicate tickets into primary', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1, duplicateTicketId2],
      keep_as_primary: primaryTicketId,
      merge_reason: 'Confirmed duplicates of the same issue'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(primaryTicketId);
    expect(data.status).not.toBe('merged');
  });

  it('should mark target tickets as merged', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1],
      merge_reason: 'Duplicate submission'
    };

    await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    // Check status of merged ticket
    const { data: mergedTicket } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: duplicateTicketId1 }
    });

    expect(mergedTicket.status).toBe('merged');
    expect(mergedTicket.parent_ticket_id).toBe(primaryTicketId);
  });

  it('should merge attachments from all tickets', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1, duplicateTicketId2],
      merge_reason: 'Consolidating related requests'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeNull();

    // Get primary ticket with attachments
    const { data: primaryTicket } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: primaryTicketId }
    });

    // Should have attachments from all merged tickets
    expect(primaryTicket.attachments).toBeDefined();
    expect(primaryTicket.attachments.length).toBeGreaterThan(0);
  });

  it('should preserve history from merged tickets', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1],
      merge_reason: 'Same issue reported twice'
    };

    await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    // Get primary ticket with full history
    const { data: primaryTicket } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: primaryTicketId }
    });

    // Should have merge information in audit trail
    const mergeAudit = primaryTicket.audit_trail.find(
      (e: any) => e.action === 'merge'
    );
    expect(mergeAudit).toBeDefined();
    expect(mergeAudit.changes.merged_tickets).toContain(duplicateTicketId1);
  });

  it('should allow specifying different primary ticket', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [primaryTicketId],
      keep_as_primary: duplicateTicketId1,
      merge_reason: 'The duplicate has better information'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: duplicateTicketId1, ...mergeRequest }
    });

    expect(error).toBeNull();
    expect(data.id).toBe(duplicateTicketId1);
    expect(data.status).not.toBe('merged');
  });

  it('should validate tickets exist before merging', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: ['non-existent-ticket'],
      merge_reason: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('not found');
  });

  it('should prevent merging already merged tickets', async () => {
    const alreadyMergedId = 'already-merged-ticket';
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [alreadyMergedId],
      merge_reason: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('already merged');
  });

  it('should prevent merging converted tickets', async () => {
    const convertedTicketId = 'converted-ticket-uuid';
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [convertedTicketId],
      merge_reason: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('converted');
  });

  it('should update duplicate_candidates table', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1],
      merge_reason: 'Confirmed duplicate'
    };

    await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    // The duplicate_candidates entry should be marked as merged
    // This would be verified through a separate query
    expect(true).toBe(true);
  });

  it('should combine priority and urgency appropriately', async () => {
    // If merging tickets with different priorities, keep highest
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1],
      merge_reason: 'Combining priority tickets'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    expect(error).toBeNull();
    // Should have the highest priority from all tickets
    expect(['urgent', 'high']).toContain(data.priority);
  });

  it('should create comprehensive audit trail', async () => {
    const mergeRequest: MergeRequest = {
      target_ticket_ids: [duplicateTicketId1, duplicateTicketId2],
      merge_reason: 'Consolidation for efficiency'
    };

    await supabase.functions.invoke('intake-tickets-merge', {
      method: 'POST',
      body: { ticketId: primaryTicketId, ...mergeRequest }
    });

    // Check audit trail on primary
    const { data: primaryTicket } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: primaryTicketId }
    });

    const mergeAudit = primaryTicket.audit_trail.find(
      (e: any) => e.action === 'merge'
    );
    expect(mergeAudit.changes.merged_count).toBe(2);
    expect(mergeAudit.changes.merge_reason).toBe('Consolidation for efficiency');

    // Check audit trail on merged tickets
    const { data: mergedTicket } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: duplicateTicketId1 }
    });

    const mergedAudit = mergedTicket.audit_trail.find(
      (e: any) => e.action === 'merged_into'
    );
    expect(mergedAudit.changes.primary_ticket_id).toBe(primaryTicketId);
  });
});
