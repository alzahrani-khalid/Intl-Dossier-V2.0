/**
 * Integration Test: Simple Keyword Search (English)
 *
 * From quickstart.md Step 2.1
 * This test MUST FAIL until search service is implemented (T033, T039)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Simple Keyword Search (English)', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should find results for simple English keyword "climate"', async () => {
    const queryParams = {
      q: 'climate',
      limit: '10'
    };

    const { data, error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    // Must succeed
    expect(status).toBe(200);
    expect(error).toBeNull();

    // Should have results
    expect(data.counts.total).toBeGreaterThan(0);

    // Results should contain "climate" in title or snippet
    const hasClimate = data.results.some((r: any) =>
      r.title_en?.toLowerCase().includes('climate') ||
      r.snippet_en?.toLowerCase().includes('climate')
    );
    expect(hasClimate).toBe(true);
  });

  it('should order results by rank_score DESC', async () => {
    const queryParams = { q: 'climate', limit: '20' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 1) {
      // Verify descending order
      for (let i = 0; i < data.results.length - 1; i++) {
        expect(data.results[i].rank_score).toBeGreaterThanOrEqual(
          data.results[i + 1].rank_score
        );
      }
    }
  });

  it('should meet performance target (<500ms)', async () => {
    const queryParams = { q: 'climate', limit: '20' };

    const start = Date.now();
    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );
    const duration = Date.now() - start;

    expect(status).toBe(200);

    console.log(`Search duration: ${duration}ms (server: ${data.took_ms}ms)`);
    expect(duration).toBeLessThan(1000); // Allow network overhead
  });
});
