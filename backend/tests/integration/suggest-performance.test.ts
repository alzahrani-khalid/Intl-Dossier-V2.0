/**
 * Integration Test: Typeahead Performance (<200ms)
 *
 * From quickstart.md Step 3.1
 * This test MUST FAIL until suggestion service is implemented (T032, T034, T040)
 *
 * CRITICAL: This test validates the absolute performance requirement (<200ms)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Typeahead Performance', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should return suggestions in <200ms (CRITICAL SLA)', async () => {
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const start = Date.now();
    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );
    const duration = Date.now() - start;

    expect(status).toBe(200);

    // ABSOLUTE REQUIREMENT: Must be < 200ms
    console.log(`Suggestion took: ${data.took_ms}ms (with network: ${duration}ms)`);
    expect(data.took_ms).toBeLessThan(200);
  });

  it('should return 10 suggestions ordered by score', async () => {
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.suggestions.length).toBeLessThanOrEqual(10);

    // Verify descending order by score
    if (data.suggestions.length > 1) {
      for (let i = 0; i < data.suggestions.length - 1; i++) {
        expect(data.suggestions[i].score).toBeGreaterThanOrEqual(
          data.suggestions[i + 1].score
        );
      }
    }
  });

  it('should indicate cache miss on first request', async () => {
    // Use random prefix to ensure cache miss
    const randomPrefix = `test${Date.now()}`;
    const queryParams = {
      q: randomPrefix,
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.cache_hit).toBe(false);

    // Even cache miss must meet performance SLA
    expect(data.took_ms).toBeLessThan(200);
  });

  it('should be faster on cache hit', async () => {
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    // First request (potential cache miss)
    await invokeEdgeFunctionGet(supabase, 'search-suggest', '', queryParams);

    // Second request (should be cache hit)
    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.cache_hit) {
      // Cache hits should be very fast
      console.log(`Cache hit took: ${data.took_ms}ms`);
      expect(data.took_ms).toBeLessThan(50);
    }
  });

  it('should handle concurrent suggestion requests', async () => {
    const queryParams = { q: 'clim', limit: '10' };

    // Fire 10 concurrent requests
    const promises = Array.from({ length: 10 }, () =>
      invokeEdgeFunctionGet(supabase, 'search-suggest', '', queryParams)
    );

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach((result) => {
      expect(result.status).toBe(200);
      expect(result.data.took_ms).toBeLessThan(200);
    });
  });
});
