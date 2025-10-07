import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { DuplicatesResponse } from '../../../specs/008-front-door-intake/contracts/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('GET /intake/tickets/{id}/duplicates', () => {
  const mockTicketId = 'test-ticket-uuid';

  it('should find duplicate candidates with default threshold', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.candidates).toBeInstanceOf(Array);
    expect(data.model_info).toBeDefined();
    expect(data.model_info.embedding_model).toBeDefined();
    expect(data.model_info.threshold_used).toBe(0.65);
  });

  it('should use custom similarity threshold', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId, threshold: 0.8 }
    });

    expect(error).toBeNull();
    expect(data.model_info.threshold_used).toBe(0.8);
    // Higher threshold should return fewer candidates
    data.candidates.forEach((candidate: any) => {
      expect(candidate.overall_score).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('should return candidates sorted by similarity score', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    
    // Verify descending order
    for (let i = 1; i < data.candidates.length; i++) {
      expect(data.candidates[i - 1].overall_score)
        .toBeGreaterThanOrEqual(data.candidates[i].overall_score);
    }
  });

  it('should mark high confidence duplicates', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    
    data.candidates.forEach((candidate: any) => {
      if (candidate.overall_score >= 0.82) {
        expect(candidate.is_high_confidence).toBe(true);
      } else {
        expect(candidate.is_high_confidence).toBe(false);
      }
    });
  });

  it('should include similarity breakdown', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    
    if (data.candidates.length > 0) {
      const candidate = data.candidates[0];
      expect(candidate.title_similarity).toBeDefined();
      expect(candidate.content_similarity).toBeDefined();
      expect(candidate.overall_score).toBeDefined();
      
      // Scores should be between 0 and 1
      expect(candidate.title_similarity).toBeGreaterThanOrEqual(0);
      expect(candidate.title_similarity).toBeLessThanOrEqual(1);
      expect(candidate.content_similarity).toBeGreaterThanOrEqual(0);
      expect(candidate.content_similarity).toBeLessThanOrEqual(1);
    }
  });

  it('should exclude already merged tickets', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    
    // No merged tickets should appear in candidates
    const mergedStatuses = ['merged', 'closed'];
    data.candidates.forEach((candidate: any) => {
      expect(mergedStatuses).not.toContain(candidate.status);
    });
  });

  it('should use vector similarity for content matching', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    expect(data.model_info.embedding_model).toBeDefined();
    expect(['bge-m3', 'text-embedding-ada-002'])
      .toContain(data.model_info.embedding_model);
  });

  it('should handle AI service unavailability with fallback', async () => {
    // Mock AI service down scenario
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates-fallback', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    // Should fallback to keyword-based matching
    if (data) {
      expect(data.candidates).toBeDefined();
      // Fallback results may be less accurate
    } else {
      expect(error?.message).toContain('temporarily unavailable');
    }
  });

  it('should return empty array for unique tickets', async () => {
    const uniqueTicketId = 'unique-ticket-uuid';
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: uniqueTicketId, threshold: 0.95 }
    });

    expect(error).toBeNull();
    expect(data.candidates).toEqual([]);
  });

  it('should return 404 for non-existent ticket', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: 'non-existent-uuid' }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('not found');
  });

  it('should validate threshold range', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId, threshold: 1.5 }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('threshold');
  });

  it('should include ticket metadata in candidates', async () => {
    const { data, error } = await supabase.functions.invoke('intake-tickets-duplicates', {
      method: 'GET',
      body: { ticketId: mockTicketId }
    });

    expect(error).toBeNull();
    
    if (data.candidates.length > 0) {
      const candidate = data.candidates[0];
      expect(candidate.ticket_id).toBeDefined();
      expect(candidate.ticket_number).toBeDefined();
      expect(candidate.title).toBeDefined();
    }
  });
});
