/**
 * Integration Test: Entity Type Filtering
 *
 * From quickstart.md Step 2.4
 * This test MUST FAIL until search service is implemented (T033, T039)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Entity Type Filtering', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should filter by dossiers and positions only', async () => {
    const queryParams = {
      q: 'climate',
      type: 'dossiers,positions',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Verify only dossiers and positions are returned
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        expect(['dossier', 'position']).toContain(r.type);
      });
    }

    // Counts for filtered types should be zero
    expect(data.counts.people).toBe(0);
    expect(data.counts.engagements).toBe(0);
    expect(data.counts.mous).toBe(0);
    expect(data.counts.documents).toBe(0);
  });

  it('should filter by single entity type', async () => {
    const queryParams = {
      q: 'climate',
      type: 'dossiers',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        expect(r.type).toBe('dossier');
      });
    }

    // Only dossiers count should be non-zero
    expect(data.counts.people).toBe(0);
    expect(data.counts.engagements).toBe(0);
    expect(data.counts.positions).toBe(0);
    expect(data.counts.mous).toBe(0);
    expect(data.counts.documents).toBe(0);
  });

  it('should return all types when type=all', async () => {
    const queryParams = {
      q: 'climate',
      type: 'all',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Should have results from multiple types
    const types = new Set(data.results.map((r: any) => r.type));
    expect(types.size).toBeGreaterThan(1);
  });
});
