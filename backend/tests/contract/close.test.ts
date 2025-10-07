import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { CloseTicketRequest, TicketResponse } from '../../../specs/008-front-door-intake/contracts/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('POST /intake/tickets/{id}/close', () => {
  const mockTicketId = 'test-ticket-uuid';

  it('should close ticket with resolution', async () => {
    const closeRequest: CloseTicketRequest = {
      resolution: 'Issue resolved through standard support process',
      resolution_ar: 'تم حل المشكلة من خلال عملية الدعم القياسية'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.status).toBe('closed');
    expect(data.resolution).toBe(closeRequest.resolution);
    expect(data.resolution_ar).toBe(closeRequest.resolution_ar);
    expect(data.closed_at).toBeDefined();
  });

  it('should require resolution text', async () => {
    const closeRequest = {
      // Missing required resolution
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('resolution');
  });

  it('should require MFA for confidential tickets', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const closeRequest: CloseTicketRequest = {
      resolution: 'Confidential matter resolved'
      // Missing mfa_token
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...closeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('MFA required');
  });

  it('should verify MFA token for confidential tickets', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const closeRequest: CloseTicketRequest = {
      resolution: 'Confidential matter resolved securely',
      mfa_token: '123456'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...closeRequest }
    });

    expect(error).toBeNull();
    expect(data.status).toBe('closed');
  });

  it('should update SLA metrics on closure', async () => {
    const closeRequest: CloseTicketRequest = {
      resolution: 'Resolved within SLA'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    expect(error).toBeNull();
    
    // SLA should be finalized
    expect(data.sla_status).toBeDefined();
    expect(data.sla_status.resolution.elapsed_minutes).toBeDefined();
  });

  it('should prevent closing already closed tickets', async () => {
    const closedTicketId = 'already-closed-ticket';
    const closeRequest: CloseTicketRequest = {
      resolution: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: closedTicketId, ...closeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('already closed');
  });

  it('should prevent closing converted tickets', async () => {
    const convertedTicketId = 'converted-ticket-uuid';
    const closeRequest: CloseTicketRequest = {
      resolution: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: convertedTicketId, ...closeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('converted');
  });

  it('should validate resolution length', async () => {
    const closeRequest: CloseTicketRequest = {
      resolution: 'a'.repeat(2001), // Exceeds 2000 char limit
      resolution_ar: 'أ'.repeat(2001)
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('length');
  });

  it('should create audit log entry', async () => {
    const closeRequest: CloseTicketRequest = {
      resolution: 'Closed for audit test'
    };

    await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    // Verify audit log
    const { data: ticketData } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    const auditEntry = ticketData.audit_trail.find(
      (e: any) => e.action === 'close'
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry.changes.resolution).toBeDefined();
  });

  it('should create audit log with MFA flag', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const closeRequest: CloseTicketRequest = {
      resolution: 'Closed with MFA verification',
      mfa_token: '123456'
    };

    await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...closeRequest }
    });

    // Verify audit log
    const { data: ticketData } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: confidentialTicketId }
    });

    const auditEntry = ticketData.audit_trail.find(
      (e: any) => e.action === 'close'
    );
    expect(auditEntry.mfa_verified).toBe(true);
  });

  it('should allow closing tickets without conversion', async () => {
    const unconvertedTicketId = 'unconverted-ticket';
    const closeRequest: CloseTicketRequest = {
      resolution: 'No conversion needed - resolved directly'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: unconvertedTicketId, ...closeRequest }
    });

    expect(error).toBeNull();
    expect(data.status).toBe('closed');
    expect(data.converted_to_id).toBeNull();
  });

  it('should finalize any pending SLA events', async () => {
    const closeRequest: CloseTicketRequest = {
      resolution: 'Resolved and SLA finalized'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-close', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...closeRequest }
    });

    expect(error).toBeNull();

    // SLA events should be marked as completed or cancelled
    // This would be verified through a separate SLA events query
    expect(data.sla_status.resolution.is_breached).toBeDefined();
  });
});
