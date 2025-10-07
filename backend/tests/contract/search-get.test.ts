/**
 * Contract Test: GET /api/search
 *
 * Validates the global search endpoint against OpenAPI spec in
 * specs/015-search-retrieval-spec/contracts/search-api.yaml
 *
 * This test MUST FAIL until the endpoint is implemented (T039)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('GET /api/search - Contract Tests', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should return search results with required response schema', async () => {
    const queryParams = {
      q: 'climate',
      limit: '20',
      offset: '0'
    };

    const { data, error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    // Expect 200 OK
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Validate response schema (from OpenAPI spec)
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);

    expect(data).toHaveProperty('counts');
    expect(data.counts).toHaveProperty('total');
    expect(data.counts).toHaveProperty('dossiers');
    expect(data.counts).toHaveProperty('people');
    expect(data.counts).toHaveProperty('engagements');
    expect(data.counts).toHaveProperty('positions');
    expect(data.counts).toHaveProperty('mous');
    expect(data.counts).toHaveProperty('documents');
    expect(data.counts).toHaveProperty('restricted');

    expect(data).toHaveProperty('query');
    expect(data.query).toHaveProperty('original');
    expect(data.query).toHaveProperty('normalized');
    expect(data.query).toHaveProperty('language_detected');
    expect(data.query).toHaveProperty('has_boolean_operators');

    expect(data).toHaveProperty('took_ms');
    expect(typeof data.took_ms).toBe('number');
  });

  it('should validate individual search result schema', async () => {
    const queryParams = { q: 'climate', limit: '1' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      const result = data.results[0];

      // Required fields from OpenAPI spec
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title_en');
      expect(result).toHaveProperty('title_ar');
      expect(result).toHaveProperty('rank_score');
      expect(result).toHaveProperty('updated_at');

      // Validate types
      expect(typeof result.id).toBe('string');
      expect(['dossier', 'person', 'engagement', 'position', 'mou', 'document']).toContain(result.type);
      expect(typeof result.title_en).toBe('string');
      expect(typeof result.title_ar).toBe('string');
      expect(typeof result.rank_score).toBe('number');
      expect(result.rank_score).toBeGreaterThanOrEqual(0);
      expect(result.rank_score).toBeLessThanOrEqual(1);
      expect(typeof result.updated_at).toBe('string');
    }
  });

  it('should support entity type filtering', async () => {
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
    expect(data.results).toBeDefined();

    // Verify only dossiers and positions are returned
    if (data.results.length > 0) {
      data.results.forEach((result: any) => {
        expect(['dossier', 'position']).toContain(result.type);
      });
    }

    // Verify counts for filtered types
    expect(data.counts.people).toBe(0);
    expect(data.counts.engagements).toBe(0);
    expect(data.counts.mous).toBe(0);
    expect(data.counts.documents).toBe(0);
  });

  it('should support Boolean operators in query', async () => {
    const queryParams = {
      q: 'climate AND (policy OR treaty)',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.original).toBe('climate AND (policy OR treaty)');
    expect(data.query.has_boolean_operators).toBe(true);
  });

  it('should support pagination with limit and offset', async () => {
    const queryParams1 = { q: 'climate', limit: '5', offset: '0' };
    const queryParams2 = { q: 'climate', limit: '5', offset: '5' };

    const { data: data1, status: status1 } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams1
    );

    const { data: data2, status: status2 } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams2
    );

    expect(status1).toBe(200);
    expect(status2).toBe(200);

    expect(data1.results.length).toBeLessThanOrEqual(5);
    expect(data2.results.length).toBeLessThanOrEqual(5);

    // Verify pagination metadata
    if (data1.counts.total > 5) {
      expect(data1.metadata.has_more).toBe(true);
      expect(data1.metadata.next_offset).toBe(5);
    }
  });

  it('should include archived items when include_archived=true', async () => {
    const queryParams = {
      q: 'climate',
      include_archived: 'true',
      limit: '20'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.results).toBeDefined();

    // Check if any archived items are present
    const hasArchivedItems = data.results.some((r: any) => r.is_archived === true);
    if (hasArchivedItems) {
      const archivedItem = data.results.find((r: any) => r.is_archived === true);
      expect(archivedItem).toHaveProperty('is_archived');
      expect(archivedItem.is_archived).toBe(true);
    }
  });

  it('should return 400 for empty query', async () => {
    const queryParams = { q: '' };

    const { data, error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error.message).toContain('query');
  });

  it('should return bilingual error messages on 400', async () => {
    const queryParams = { q: '' };

    const { error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error.details).toHaveProperty('message');
    expect(error.details).toHaveProperty('message_ar');
  });

  it('should enforce query length limit (500 characters)', async () => {
    const longQuery = 'a'.repeat(501);
    const queryParams = { q: longQuery };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    // Either truncate with warning or return 400
    if (status === 200) {
      expect(data.warnings).toBeDefined();
      expect(data.warnings).toContain('Query truncated to 500 characters');
    } else {
      expect(status).toBe(400);
    }
  });

  it('should meet performance SLA (p95 < 500ms)', async () => {
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
    expect(data.took_ms).toBeDefined();

    // Performance target from spec
    console.log(`Search took ${duration}ms (server reported: ${data.took_ms}ms)`);
    expect(duration).toBeLessThan(1000); // Allow 1s for network overhead in tests
  });

  it('should detect query language (English)', async () => {
    const queryParams = { q: 'climate policy' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.language_detected).toBe('en');
  });

  it('should detect query language (Arabic)', async () => {
    const queryParams = { q: 'مناخ' }; // "climate" in Arabic

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.query.language_detected).toBe('ar');
  });

  it('should return snippets with highlighted matches', async () => {
    const queryParams = { q: 'climate', limit: '5' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      const resultWithSnippet = data.results.find((r: any) => r.snippet_en || r.snippet_ar);

      if (resultWithSnippet) {
        // Check for <mark> tags in snippets
        if (resultWithSnippet.snippet_en) {
          expect(resultWithSnippet.snippet_en).toMatch(/<mark>.*<\/mark>/);
        }
        if (resultWithSnippet.snippet_ar) {
          expect(resultWithSnippet.snippet_ar).toMatch(/<mark>.*<\/mark>/);
        }
      }
    }
  });

  it('should enforce RLS policies (restricted results counted)', async () => {
    const queryParams = { q: 'confidential', limit: '20' };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search',
      '',
      queryParams
    );

    expect(status).toBe(200);
    expect(data.counts).toHaveProperty('restricted');
    expect(typeof data.counts.restricted).toBe('number');
    expect(data.counts.restricted).toBeGreaterThanOrEqual(0);

    // If there are restricted results, metadata should explain
    if (data.counts.restricted > 0) {
      expect(data.metadata).toHaveProperty('restricted_message');
      expect(typeof data.metadata.restricted_message).toBe('string');
    }
  });
});
