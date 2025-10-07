/**
 * Integration Test: Semantic Search with Hybrid Results
 *
 * From quickstart.md Step 4.2
 * This test MUST FAIL until semantic search is implemented (T035, T041)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunction } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('Integration: Semantic Search with Hybrid Results', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should return both exact and semantic matches in hybrid mode', async () => {
    const requestBody = {
      query: 'climate change policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    // Should have both result arrays
    expect(data).toHaveProperty('exact_matches');
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.exact_matches)).toBe(true);
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should rank exact matches higher than semantic matches', async () => {
    const requestBody = {
      query: 'climate change policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.5,
      limit: 20,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    if (data.exact_matches.length > 0 && data.results.length > 0) {
      // Highest exact match score should be higher than highest semantic match
      const maxExactScore = Math.max(...data.exact_matches.map((r: any) => r.similarity_score));
      const maxSemanticScore = Math.max(...data.results.map((r: any) => r.similarity_score));

      expect(maxExactScore).toBeGreaterThan(maxSemanticScore);
    }
  });

  it('should not duplicate results between exact and semantic', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 20,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    // Collect all IDs
    const exactIds = new Set(data.exact_matches.map((r: any) => r.id));
    const semanticIds = new Set(data.results.map((r: any) => r.id));

    // No overlap
    const intersection = new Set([...exactIds].filter(id => semanticIds.has(id)));
    expect(intersection.size).toBe(0);
  });

  it('should include performance breakdown for hybrid search', async () => {
    const requestBody = {
      query: 'sustainable development',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    // Should have all performance metrics for hybrid search
    expect(data.performance).toHaveProperty('embedding_generation_ms');
    expect(data.performance).toHaveProperty('vector_search_ms');
    expect(data.performance).toHaveProperty('keyword_search_ms');
    expect(data.performance).toHaveProperty('merge_dedup_ms');
  });

  it('should respect similarity threshold for semantic results', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.7,
      limit: 20,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    // All semantic results must meet threshold
    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        expect(r.similarity_score).toBeGreaterThanOrEqual(0.7);
      });
    }
  });

  it('should mark exact matches with match_type "exact"', async () => {
    const requestBody = {
      query: 'climate change',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10,
      include_keyword_results: true
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    if (data.exact_matches.length > 0) {
      data.exact_matches.forEach((r: any) => {
        expect(r.match_type).toBe('exact');
      });
    }
  });

  it('should mark semantic matches with match_type "semantic"', async () => {
    const requestBody = {
      query: 'environmental sustainability',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10,
      include_keyword_results: false
    };

    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(200);

    if (data.results.length > 0) {
      data.results.forEach((r: any) => {
        expect(r.match_type).toBe('semantic');
      });
    }
  });
});
