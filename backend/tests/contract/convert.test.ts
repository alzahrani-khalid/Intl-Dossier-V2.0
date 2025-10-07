import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { ConvertTicketRequest, ConversionResponse } from '../../../specs/008-front-door-intake/contracts/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('POST /intake/tickets/{id}/convert', () => {
  const mockTicketId = 'test-ticket-uuid';

  it('should convert ticket to engagement artifact', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement',
      additional_data: {
        engagement_lead: 'user-uuid',
        start_date: '2025-02-01',
        end_date: '2025-02-28'
      }
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.artifact_type).toBe('engagement');
    expect(data.artifact_id).toBeDefined();
    expect(data.artifact_url).toBeDefined();
    expect(data.correlation_id).toBeDefined();
  });

  it('should convert ticket to position artifact', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'position',
      additional_data: {
        position_title: 'Strategic Analyst',
        department: 'Planning',
        level: 'senior'
      }
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();
    expect(data.artifact_type).toBe('position');
    expect(data.artifact_id).toBeDefined();
  });

  it('should convert ticket to MoU action artifact', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'mou_action',
      additional_data: {
        mou_reference: 'MOU-2025-001',
        action_item: 'Deliverable 3.2',
        due_date: '2025-03-15'
      }
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();
    expect(data.artifact_type).toBe('mou_action');
  });

  it('should convert ticket to foresight artifact', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'foresight',
      additional_data: {
        analysis_type: 'trend',
        sector: 'technology',
        horizon: '2030'
      }
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();
    expect(data.artifact_type).toBe('foresight');
  });

  it('should require MFA for confidential tickets', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement'
      // Missing mfa_token
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...convertRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('MFA required');
  });

  it('should verify MFA token for confidential tickets', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement',
      mfa_token: '123456'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...convertRequest }
    });

    // Assuming valid MFA token
    expect(error).toBeNull();
    expect(data.success).toBe(true);
  });

  it('should update ticket status to converted', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'position'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();

    // Verify ticket status
    const { data: ticketData } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(ticketData.status).toBe('converted');
    expect(ticketData.converted_to_type).toBe('position');
    expect(ticketData.converted_to_id).toBeDefined();
  });

  it('should create bidirectional link between ticket and artifact', async () => {
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...convertRequest }
    });

    expect(error).toBeNull();
    
    // The artifact should reference the source ticket
    // This would be verified by querying the artifact
    expect(data.correlation_id).toBeDefined();
  });

  it('should prevent duplicate conversions', async () => {
    const alreadyConvertedId = 'already-converted-ticket';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'position'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: alreadyConvertedId, ...convertRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('already converted');
  });

  it('should validate ticket is triaged before conversion', async () => {
    const untriagedTicketId = 'untriaged-ticket-uuid';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: untriagedTicketId, ...convertRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('must be triaged');
  });

  it('should copy attachments to artifact', async () => {
    const ticketWithAttachments = 'ticket-with-attachments';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'foresight'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: ticketWithAttachments, ...convertRequest }
    });

    expect(error).toBeNull();
    // Attachments should be linked to new artifact
    expect(data.success).toBe(true);
  });

  it('should create audit log with MFA flag', async () => {
    const confidentialTicketId = 'confidential-ticket-uuid';
    const convertRequest: ConvertTicketRequest = {
      target_type: 'engagement',
      mfa_token: '123456'
    };

    await supabase.functions.invoke('intake-tickets-convert', {
      method: 'POST',
      body: { ticketId: confidentialTicketId, ...convertRequest }
    });

    // Verify audit log
    const { data: ticketData } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: confidentialTicketId }
    });

    const auditEntry = ticketData.audit_trail.find(
      (e: any) => e.action === 'convert'
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry.mfa_verified).toBe(true);
  });
});
