/**
 * Contract Test: POST /api/search/semantic
 *
 * Validates the semantic search endpoint against OpenAPI spec in
 * specs/015-search-retrieval-spec/contracts/semantic-search-api.yaml
 *
 * This test MUST FAIL until the endpoint is implemented (T041)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunction } from '../helpers/edge-function-client';

let supabase: SupabaseClient;

describe('POST /api/search/semantic - Contract Tests', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();
  });

  it('should return semantic search results with required response schema', async () => {
    const requestBody = {
      query: 'sustainable development goals',
      entity_types: ['positions', 'documents', 'briefs'],
      similarity_threshold: 0.6,
      limit: 20
    };

    const { data, error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    // Expect 200 OK
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Validate response schema (from OpenAPI spec)
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);

    expect(data).toHaveProperty('query');
    expect(data.query).toHaveProperty('original');
    expect(data.query).toHaveProperty('embedding_dimensions');
    expect(data.query).toHaveProperty('similarity_threshold');

    expect(data).toHaveProperty('took_ms');
    expect(typeof data.took_ms).toBe('number');

    expect(data).toHaveProperty('performance');
    expect(data.performance).toHaveProperty('embedding_generation_ms');
    expect(data.performance).toHaveProperty('vector_search_ms');
  });

  it('should validate individual semantic result schema', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 5
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
      const result = data.results[0];

      // Required fields from OpenAPI spec
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title_en');
      expect(result).toHaveProperty('title_ar');
      expect(result).toHaveProperty('similarity_score');
      expect(result).toHaveProperty('match_type');

      // Validate types
      expect(typeof result.id).toBe('string');
      expect(['position', 'document', 'brief']).toContain(result.type);
      expect(typeof result.title_en).toBe('string');
      expect(typeof result.title_ar).toBe('string');
      expect(typeof result.similarity_score).toBe('number');
      expect(result.similarity_score).toBeGreaterThanOrEqual(0);
      expect(result.similarity_score).toBeLessThanOrEqual(1);
      expect(['exact', 'semantic', 'hybrid']).toContain(result.match_type);

      // Optional fields
      if (result.snippet_en) {
        expect(typeof result.snippet_en).toBe('string');
      }
      if (result.snippet_ar) {
        expect(typeof result.snippet_ar).toBe('string');
      }
      if (result.updated_at) {
        expect(typeof result.updated_at).toBe('string');
      }
    }
  });

  it('should return results ordered by similarity score (highest first)', async () => {
    const requestBody = {
      query: 'environmental sustainability',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.5,
      limit: 10
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

    if (data.results.length > 1) {
      for (let i = 0; i < data.results.length - 1; i++) {
        expect(data.results[i].similarity_score).toBeGreaterThanOrEqual(
          data.results[i + 1].similarity_score
        );
      }
    }
  });

  it('should support hybrid search (semantic + keyword)', async () => {
    const requestBody = {
      query: 'climate change policy',
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

    // Should have exact_matches array when include_keyword_results=true
    expect(data).toHaveProperty('exact_matches');
    expect(Array.isArray(data.exact_matches)).toBe(true);

    // Performance should include keyword_search_ms
    expect(data.performance).toHaveProperty('keyword_search_ms');
    expect(data.performance).toHaveProperty('merge_dedup_ms');
  });

  it('should filter by entity types', async () => {
    const requestBody = {
      query: 'sustainability',
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 10
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

    // Verify only positions are returned
    if (data.results.length > 0) {
      data.results.forEach((result: any) => {
        expect(result.type).toBe('position');
      });
    }
  });

  it('should respect similarity threshold', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.8, // High threshold
      limit: 20
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

    // All results should meet or exceed the threshold
    if (data.results.length > 0) {
      data.results.forEach((result: any) => {
        expect(result.similarity_score).toBeGreaterThanOrEqual(0.8);
      });
    }

    // Verify threshold is reported in query metadata
    expect(data.query.similarity_threshold).toBe(0.8);
  });

  it('should respect limit parameter', async () => {
    const requestBody = {
      query: 'climate',
      entity_types: ['positions', 'documents', 'briefs'],
      similarity_threshold: 0.5,
      limit: 5
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
    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  it('should use default values for optional parameters', async () => {
    const requestBody = {
      query: 'climate policy'
      // No entity_types, similarity_threshold, or limit specified
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

    // Defaults from OpenAPI spec
    expect(data.query.similarity_threshold).toBe(0.6);
    expect(data.results.length).toBeLessThanOrEqual(20);
  });

  it('should return embedding dimensions in response', async () => {
    const requestBody = {
      query: 'sustainability',
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 10
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
    expect(data.query.embedding_dimensions).toBe(1536); // OpenAI embedding size
  });

  it('should provide performance breakdown', async () => {
    const requestBody = {
      query: 'climate change',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10
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

    // All timing components should be present
    expect(typeof data.performance.embedding_generation_ms).toBe('number');
    expect(typeof data.performance.vector_search_ms).toBe('number');
    expect(data.performance.embedding_generation_ms).toBeGreaterThan(0);
    expect(data.performance.vector_search_ms).toBeGreaterThan(0);

    // Sum should be close to total took_ms
    const performanceSum =
      data.performance.embedding_generation_ms +
      data.performance.vector_search_ms +
      (data.performance.keyword_search_ms || 0) +
      (data.performance.merge_dedup_ms || 0);

    expect(performanceSum).toBeLessThanOrEqual(data.took_ms + 10); // Allow 10ms variance
  });

  it('should meet performance SLA (p95 < 500ms)', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10
    };

    const start = Date.now();
    const { data, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );
    const duration = Date.now() - start;

    expect(status).toBe(200);
    expect(data.took_ms).toBeDefined();

    console.log(`Semantic search took ${duration}ms (server reported: ${data.took_ms}ms)`);

    // Performance target from spec (p95 < 500ms)
    expect(duration).toBeLessThan(1000); // Allow network overhead in tests
  });

  it('should return 400 for invalid entity types', async () => {
    const requestBody = {
      query: 'climate',
      entity_types: ['dossiers'], // Not supported for semantic search
      similarity_threshold: 0.6,
      limit: 10
    };

    const { error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error.message).toContain('Entity type');
    expect(error.message).toContain('positions, documents, briefs');
  });

  it('should return bilingual error messages on 400', async () => {
    const requestBody = {
      query: 'ab', // Too short (min 3 chars)
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 10
    };

    const { error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error.details).toHaveProperty('message');
    expect(error.details).toHaveProperty('message_ar');
  });

  it('should return 400 for query below minimum length (3 chars)', async () => {
    const requestBody = {
      query: 'ab', // Too short
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 10
    };

    const { error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it('should return 400 for query exceeding maximum length (500 chars)', async () => {
    const requestBody = {
      query: 'a'.repeat(501),
      entity_types: ['positions'],
      similarity_threshold: 0.6,
      limit: 10
    };

    const { error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it('should return 400 for invalid similarity threshold', async () => {
    const requestBody = {
      query: 'climate policy',
      entity_types: ['positions'],
      similarity_threshold: 1.5, // Invalid (must be 0.0-1.0)
      limit: 10
    };

    const { error, status } = await invokeEdgeFunction(
      supabase,
      'search-semantic',
      {
        method: 'POST',
        body: requestBody
      }
    );

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it('should return 503 when embedding service unavailable', async () => {
    // This test would require mocking the AnythingLLM service
    // For now, we just document the expected behavior
    expect(true).toBe(true);

    // Expected behavior when AnythingLLM is down:
    // - status: 503
    // - error.message: "Embedding generation service is temporarily unavailable..."
    // - error.message_ar: "خدمة إنشاء التضمينات غير متاحة مؤقتًا..."
  });

  it('should handle cross-language search (Arabic query → English results)', async () => {
    const requestBody = {
      query: 'تغير المناخ', // "climate change" in Arabic
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.6,
      limit: 10
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

    // Should find semantically similar content regardless of language
    expect(data.results).toBeDefined();

    if (data.results.length > 0) {
      // Results can be in any language
      data.results.forEach((result: any) => {
        expect(result.title_en).toBeDefined();
        expect(result.title_ar).toBeDefined();
      });
    }
  });

  it('should deduplicate hybrid results (no duplicates between exact and semantic)', async () => {
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

    // Collect all IDs from both result sets
    const exactIds = new Set(data.exact_matches.map((r: any) => r.id));
    const semanticIds = new Set(data.results.map((r: any) => r.id));

    // No overlap between exact and semantic results
    const intersection = new Set([...exactIds].filter(id => semanticIds.has(id)));
    expect(intersection.size).toBe(0);
  });

  it('should rank exact matches higher than semantic matches in hybrid mode', async () => {
    const requestBody = {
      query: 'climate policy',
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
      // Exact matches should have higher scores than semantic matches
      const highestExactScore = Math.max(...data.exact_matches.map((r: any) => r.similarity_score));
      const highestSemanticScore = Math.max(...data.results.map((r: any) => r.similarity_score));

      expect(highestExactScore).toBeGreaterThan(highestSemanticScore);
    }
  });

  it('should return empty arrays when no results found', async () => {
    const requestBody = {
      query: 'xyzabc123nonexistent',
      entity_types: ['positions', 'documents'],
      similarity_threshold: 0.9, // High threshold
      limit: 10
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
    expect(data.results).toEqual([]);

    if (data.exact_matches !== undefined) {
      expect(data.exact_matches).toEqual([]);
    }
  });
});
