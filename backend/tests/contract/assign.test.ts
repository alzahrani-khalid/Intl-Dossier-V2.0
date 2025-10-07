import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { AssignTicketRequest, TicketResponse } from '../../../specs/008-front-door-intake/contracts/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('POST /intake/tickets/{id}/assign', () => {
  const mockTicketId = 'test-ticket-uuid';

  it('should assign ticket to user', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'user-uuid',
      assigned_unit: 'operations-unit',
      reason: 'User has expertise in this area'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.assigned_to).toBe('user-uuid');
    expect(data.assigned_unit).toBe('operations-unit');
    expect(data.status).toBe('assigned');
    expect(data.assigned_at).toBeDefined();
  });

  it('should assign ticket to unit only', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_unit: 'strategic-planning',
      reason: 'Unit assignment for queue distribution'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeNull();
    expect(data.assigned_unit).toBe('strategic-planning');
    expect(data.assigned_to).toBeNull();
  });

  it('should reassign already assigned ticket', async () => {
    // First assignment
    await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { 
        ticketId: mockTicketId, 
        assigned_to: 'user1-uuid',
        reason: 'Initial assignment' 
      }
    });

    // Reassignment
    const reassignRequest: AssignTicketRequest = {
      assigned_to: 'user2-uuid',
      assigned_unit: 'different-unit',
      reason: 'Reassigning due to workload'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...reassignRequest }
    });

    expect(error).toBeNull();
    expect(data.assigned_to).toBe('user2-uuid');
    expect(data.assigned_unit).toBe('different-unit');
  });

  it('should validate user exists and is active', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'non-existent-user',
      reason: 'Invalid assignment'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('user not found');
  });

  it('should validate unit exists', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_unit: 'non-existent-unit',
      reason: 'Invalid unit'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('unit not found');
  });

  it('should check user permissions for unit', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'user-uuid',
      assigned_unit: 'restricted-unit',
      reason: 'User not in this unit'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('not authorized for unit');
  });

  it('should create audit log entry', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'user-uuid',
      reason: 'Assignment for audit test'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeNull();

    // Verify audit log
    const { data: ticketData } = await supabase.functions.invoke('intake-tickets-get', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    const auditEntry = ticketData.audit_trail.find(
      (e: any) => e.action === 'assign'
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry.changes.assigned_to).toBe('user-uuid');
  });

  it('should trigger SLA timer on first assignment', async () => {
    const newTicketId = 'new-unassigned-ticket';
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'user-uuid',
      reason: 'First assignment'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: newTicketId, ...assignRequest }
    });

    expect(error).toBeNull();
    expect(data.sla_status).toBeDefined();
    expect(data.sla_status.acknowledgment.elapsed_minutes).toBeGreaterThan(0);
  });

  it('should not allow assignment of closed tickets', async () => {
    const closedTicketId = 'closed-ticket-uuid';
    const assignRequest: AssignTicketRequest = {
      assigned_to: 'user-uuid',
      reason: 'Should fail'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: closedTicketId, ...assignRequest }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('closed');
  });

  it('should handle workload balancing', async () => {
    const assignRequest: AssignTicketRequest = {
      assigned_unit: 'busy-unit',
      reason: 'Auto-assignment to unit'
    };

    const { data, error } = await supabase.functions.invoke('intake-tickets-assign', {
      method: 'POST',
      body: { ticketId: mockTicketId, ...assignRequest }
    });

    expect(error).toBeNull();
    // Should auto-assign to least busy member of unit
    expect(data.assigned_to).toBeDefined();
  });
});
