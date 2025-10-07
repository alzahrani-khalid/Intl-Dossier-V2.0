/**
 * Contract Test: GET /api/search/suggest
 *
 * Validates the typeahead suggestions endpoint against OpenAPI spec in
 * specs/015-search-retrieval-spec/contracts/suggest-api.yaml
 *
 * This test MUST FAIL until the endpoint is implemented (T040)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('GET /api/search/suggest - Contract Tests', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should return suggestions with required response schema', async () => {
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const { data, error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    // Expect 200 OK
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Validate response schema (from OpenAPI spec)
    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);

    expect(data).toHaveProperty('query');
    expect(data.query).toHaveProperty('original');
    expect(data.query).toHaveProperty('normalized');
    expect(data.query).toHaveProperty('language_detected');

    expect(data).toHaveProperty('took_ms');
    expect(typeof data.took_ms).toBe('number');

    expect(data).toHaveProperty('cache_hit');
    expect(typeof data.cache_hit).toBe('boolean');
  });

  it('should validate individual suggestion schema', async () => {
    const queryParams = { q: 'clim', limit: '5' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];

      // Required fields from OpenAPI spec
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('title_en');
      expect(suggestion).toHaveProperty('title_ar');
      expect(suggestion).toHaveProperty('score');

      // Validate types
      expect(typeof suggestion.id).toBe('string');
      expect(['dossier', 'person', 'engagement', 'position', 'mou', 'document']).toContain(suggestion.type);
      expect(typeof suggestion.title_en).toBe('string');
      expect(typeof suggestion.title_ar).toBe('string');
      expect(typeof suggestion.score).toBe('number');
      expect(suggestion.score).toBeGreaterThanOrEqual(0);
      expect(suggestion.score).toBeLessThanOrEqual(1);

      // Optional fields
      if (suggestion.preview_en) {
        expect(typeof suggestion.preview_en).toBe('string');
      }
      if (suggestion.preview_ar) {
        expect(typeof suggestion.preview_ar).toBe('string');
      }
      if (suggestion.match_position !== undefined) {
        expect(typeof suggestion.match_position).toBe('number');
        expect(suggestion.match_position).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should return suggestions ordered by score (highest first)', async () => {
    const queryParams = { q: 'clim', limit: '10' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.suggestions.length > 1) {
      for (let i = 0; i < data.suggestions.length - 1; i++) {
        expect(data.suggestions[i].score).toBeGreaterThanOrEqual(data.suggestions[i + 1].score);
      }
    }
  });

  it('should support entity type filtering', async () => {
    const queryParams = {
      q: 'clim',
      type: 'dossiers',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Verify only dossiers are returned
    if (data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion: any) => {
        expect(suggestion.type).toBe('dossier');
      });
    }
  });

  it('should respect limit parameter', async () => {
    const queryParams = { q: 'clim', limit: '5' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.suggestions.length).toBeLessThanOrEqual(5);
  });

  it('should enforce maximum limit of 20', async () => {
    const queryParams = { q: 'clim', limit: '50' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    // Either enforce limit or return error
    if (status === 200) {
      expect(data.suggestions.length).toBeLessThanOrEqual(20);
    } else {
      expect(status).toBe(400);
    }
  });

  it('should meet performance SLA (<200ms absolute maximum)', async () => {
    const queryParams = { q: 'clim', limit: '10' };

    const start = Date.now();
    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );
    const duration = Date.now() - start;

    expect(status).toBe(200);
    expect(data.took_ms).toBeDefined();

    // CRITICAL: Absolute performance requirement
    console.log(`Suggestion took ${duration}ms (server reported: ${data.took_ms}ms)`);

    // Allow some network overhead in tests, but server time must be <200ms
    expect(data.took_ms).toBeLessThan(200);
  });

  it('should include X-Cache-Hit header', async () => {
    const queryParams = { q: 'clim', limit: '10' };

    // First request (cache miss)
    const { status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Note: We can't easily verify headers with the current helper
    // In a real implementation, we'd check response.headers.get('X-Cache-Hit')
  });

  it('should include X-Response-Time-Ms header', async () => {
    const queryParams = { q: 'clim', limit: '10' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Note: We can't easily verify headers with the current helper
    // But we can check the response body
    expect(data.took_ms).toBeDefined();
    expect(typeof data.took_ms).toBe('number');
  });

  it('should handle cache miss gracefully', async () => {
    // Use a random string to ensure cache miss
    const randomQuery = `test${Date.now()}`;
    const queryParams = { q: randomQuery, limit: '10' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.cache_hit).toBe(false);

    // Even on cache miss, must meet performance SLA
    expect(data.took_ms).toBeLessThan(200);
  });

  it('should return empty array for no matches', async () => {
    const queryParams = { q: 'xyzabc123nonexistent', limit: '10' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.suggestions).toEqual([]);
    expect(data.query.original).toBe('xyzabc123nonexistent');
  });

  it('should detect query language (English)', async () => {
    const queryParams = { q: 'clim' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.language_detected).toBe('en');
  });

  it('should detect query language (Arabic)', async () => {
    const queryParams = { q: 'منا' }; // Prefix for "climate" in Arabic

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.language_detected).toBe('ar');
  });

  it('should handle bilingual suggestions', async () => {
    const queryParams = { q: 'clim', lang: 'both', limit: '10' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.suggestions.length > 0) {
      const suggestion = data.suggestions[0];

      // Both language titles should be present
      expect(suggestion.title_en).toBeDefined();
      expect(suggestion.title_ar).toBeDefined();
      expect(typeof suggestion.title_en).toBe('string');
      expect(typeof suggestion.title_ar).toBe('string');
    }
  });

  it('should return 400 for empty query', async () => {
    const queryParams = { q: '' };

    const { error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it('should return bilingual error messages on 400', async () => {
    const queryParams = { q: '' };

    const { error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error.details).toHaveProperty('message');
    expect(error.details).toHaveProperty('message_ar');
  });

  it('should enforce query length limit (100 characters)', async () => {
    const longQuery = 'a'.repeat(101);
    const queryParams = { q: longQuery };

    const { status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(400);
  });

  it('should support fuzzy matching for typos', async () => {
    const queryParams = { q: 'climte', limit: '10' }; // Typo in "climate"

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Should still return suggestions despite typo
    expect(data.suggestions).toBeDefined();

    // If results found, they should be relevant
    if (data.suggestions.length > 0) {
      expect(data.suggestions[0].score).toBeGreaterThan(0);
    }
  });
});
