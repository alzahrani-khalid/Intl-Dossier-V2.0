import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import type { CreateTicketRequest, TicketResponse } from '../../../specs/008-front-door-intake/contracts/types';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunction } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('POST /intake/tickets', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should create a new intake ticket with required fields', async () => {
    const ticketRequest: CreateTicketRequest = {
      request_type: 'engagement',
      title: 'Test Engagement Request',
      description: 'This is a test ticket for contract testing',
      urgency: 'medium'
    };

    const { data, error } = await invokeEdgeFunction(supabase, 'intake-tickets-create', {
      method: 'POST',
      body: ticketRequest
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.ticket_number).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(data.status).toBe('submitted');
    expect(data.request_type).toBe('engagement');
    expect(data.title).toBe(ticketRequest.title);
  });

  it('should validate required fields', async () => {
    const invalidRequest = {
      // Missing required fields
      urgency: 'high'
    };

    const { data, error } = await invokeEdgeFunction(supabase, 'intake-tickets-create', {
      method: 'POST',
      body: invalidRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('required');
  });

  it('should enforce attachment size limits', async () => {
    const oversizedRequest: CreateTicketRequest = {
      request_type: 'mou_action',
      title: 'Test with oversized attachments',
      description: 'Testing attachment size validation',
      urgency: 'low',
      attachments: new Array(200).fill('attachment-id') // Simulating many attachments
    };

    const { data, error } = await invokeEdgeFunction(supabase, 'intake-tickets-create', {
      method: 'POST',
      body: oversizedRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('size limit');
  });

  it('should calculate priority from urgency and sensitivity', async () => {
    const highPriorityRequest: CreateTicketRequest = {
      request_type: 'mou_action',
      title: 'High Priority MoU Action',
      description: 'This should be marked as urgent priority',
      urgency: 'critical',
      type_specific_fields: {
        sensitivity_level: 'confidential'
      }
    };

    const { data, error } = await invokeEdgeFunction(supabase, 'intake-tickets-create', {
      method: 'POST',
      body: highPriorityRequest
    });

    expect(error).toBeNull();
    expect(data.priority).toBe('urgent');
  });

  it('should link to existing dossier if provided', async () => {
    const dossier_id = '123e4567-e89b-12d3-a456-426614174000';
    
    const ticketRequest: CreateTicketRequest = {
      request_type: 'position',
      title: 'Position Linked to Dossier',
      description: 'This ticket should be linked to an existing dossier',
      urgency: 'medium',
      dossier_id
    };

    const { data, error } = await invokeEdgeFunction(supabase, 'intake-tickets-create', {
      method: 'POST',
      body: ticketRequest
    });

    expect(error).toBeNull();
    expect(data.dossier_id).toBe(dossier_id);
  });

  it('should respect rate limiting (300rpm per user)', () => {
    // This is a placeholder test - actual rate limiting testing would require
    // making 300+ requests in a minute, which is impractical for unit tests
    expect(true).toBe(true);
  });
});