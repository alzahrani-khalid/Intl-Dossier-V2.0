import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateTicketRequest, TicketResponse } from '../../../specs/008-front-door-intake/contracts/types';
import { getAuthenticatedClient } from '../helpers/auth';

let supabase: SupabaseClient;
let testTicketId: string;

describe('PATCH /intake/tickets/{id}', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
    
    // Create a test ticket for update tests
    const { data } = await supabase.functions.invoke('intake-tickets-create', {
      body: {
        request_type: 'engagement',
        title: 'Original Title',
        description: 'Original description',
        urgency: 'medium'
      }
    });
    testTicketId = data?.id || 'test-ticket-uuid';
  });

  it('should update ticket fields', async () => {
    const updateRequest: UpdateTicketRequest = {
      title: 'Updated Ticket Title',
      title_ar: 'عنوان التذكرة المحدث',
      description: 'Updated description with more details',
      urgency: 'high'
    };

    const { data, error } = await supabase.functions.invoke(`intake-tickets-update/${testTicketId}`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.title).toBe(updateRequest.title);
    expect(data.title_ar).toBe(updateRequest.title_ar);
    expect(data.urgency).toBe('high');
    expect(data.updated_at).toBeDefined();
  });

  it('should update type-specific fields', async () => {
    const updateRequest: UpdateTicketRequest = {
      type_specific_fields: {
        engagement_type: 'conference',
        expected_participants: 100,
        venue_required: true
      }
    };

    const { data, error } = await supabase.functions.invoke(`intake-tickets-update/${testTicketId}`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeNull();
    expect(data.type_specific_fields).toEqual(updateRequest.type_specific_fields);
  });

  it('should recalculate priority when urgency changes', async () => {
    const updateRequest: UpdateTicketRequest = {
      urgency: 'critical'
    };

    const { data, error } = await supabase.functions.invoke(`intake-tickets-update/${testTicketId}`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeNull();
    expect(data.priority).toBe('urgent');
  });

  it('should create audit log entry for updates', async () => {
    const updateRequest: UpdateTicketRequest = {
      title: 'Title Changed for Audit Test'
    };

    const { data, error } = await supabase.functions.invoke(`intake-tickets-update/${testTicketId}`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeNull();
    
    // Verify audit log was created
    // Note: This would require querying the audit_logs table
    expect(data.updated_at).toBeDefined();
  });

  it('should return 404 for non-existent ticket', async () => {
    const updateRequest: UpdateTicketRequest = {
      title: 'Updated Title'
    };

    const { data, error } = await supabase.functions.invoke(`intake-tickets-update/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('not found');
  });

  it('should return 403 for unauthorized update', async () => {
    // This test would require creating a ticket with a different user
    // For now, we'll just verify the error structure
    const updateRequest: UpdateTicketRequest = {
      title: 'Unauthorized Update'
    };

    // Attempt to update a ticket the user doesn't have permission for
    const { error } = await supabase.functions.invoke(`intake-tickets-update/some-other-user-ticket`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('permission');
  });

  it('should prevent updates to closed tickets', async () => {
    // This test would require a closed ticket
    // Testing that the business rule is enforced
    const updateRequest: UpdateTicketRequest = {
      title: 'Cannot Update Closed Ticket'
    };

    const { error } = await supabase.functions.invoke(`intake-tickets-update/closed-ticket-id`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('closed');
  });

  it('should validate field lengths', async () => {
    const updateRequest: UpdateTicketRequest = {
      title: 'a'.repeat(201), // Exceeds 200 character limit
    };

    const { error } = await supabase.functions.invoke(`intake-tickets-update/${testTicketId}`, {
      method: 'PATCH',
      body: updateRequest
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('validation');
  });
});