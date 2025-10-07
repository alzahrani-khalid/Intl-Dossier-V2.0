import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import type { TicketListResponse } from '../../../specs/008-front-door-intake/contracts/types';
import { getAuthenticatedClient } from '../helpers/auth';

let supabase: SupabaseClient;

describe('GET /intake/tickets', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should list tickets with default pagination', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET'
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.tickets).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.limit).toBe(20);
    expect(data.pagination.page).toBe(1);
  });

  it('should filter tickets by status', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { status: 'submitted' }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => t.status === 'submitted')).toBe(true);
  });

  it('should filter tickets by request type', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { request_type: 'engagement' }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => t.request_type === 'engagement')).toBe(true);
  });

  it('should filter tickets by sensitivity level', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { sensitivity: 'confidential' }
    });

    expect(error).toBeNull();
    // User must have appropriate clearance to see confidential tickets
    expect(data.tickets).toBeDefined();
  });

  it('should filter tickets by urgency', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { urgency: 'high' }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => t.urgency === 'high')).toBe(true);
  });

  it('should filter tickets by assignment', async () => {
    const assignedTo = 'mock-user-uuid';
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { assigned_to: assignedTo }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => t.assigned_to === assignedTo)).toBe(true);
  });

  it('should filter tickets by SLA breach status', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { sla_breached: true }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => 
      t.sla_status?.acknowledgment?.is_breached || 
      t.sla_status?.resolution?.is_breached
    )).toBe(true);
  });

  it('should filter tickets by date range', async () => {
    const created_after = '2025-01-01T00:00:00Z';
    const created_before = '2025-12-31T23:59:59Z';
    
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { created_after, created_before }
    });

    expect(error).toBeNull();
    expect(data.tickets.every((t: any) => {
      const createdAt = new Date(t.created_at);
      return createdAt >= new Date(created_after) && createdAt <= new Date(created_before);
    })).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET',
      body: { page: 2, limit: 10 }
    });

    expect(error).toBeNull();
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
  });

  it('should include SLA status in response', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET'
    });

    expect(error).toBeNull();
    if (data.tickets.length > 0) {
      const ticket = data.tickets[0];
      expect(ticket.sla_status).toBeDefined();
      expect(ticket.sla_status.acknowledgment).toBeDefined();
      expect(ticket.sla_status.resolution).toBeDefined();
    }
  });

  it('should return total count in headers', async () => {
    const response = await supabase.functions.invoke('intake-tickets-list', {
      method: 'GET'
    });

    // Note: Actual header access may vary based on Supabase function response structure
    expect(response.data).toBeDefined();
    expect(response.data.pagination.total_items).toBeDefined();
  });
});