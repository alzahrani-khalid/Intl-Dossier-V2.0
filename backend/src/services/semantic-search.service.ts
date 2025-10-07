/**
 * Semantic Search Service
 * Feature: 015-search-retrieval-spec
 * Task: T035
 *
 * Implements semantic search using vector embeddings:
 * - Generates query embeddings via AnythingLLM
 * - Searches using pgvector similarity
 * - Hybrid mode: combines exact matches + semantic results
 * - Deduplication by entity ID
 * - Performance tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VectorService } from './vector.service';
import { FullTextSearchService, SearchResult } from './fulltext-search.service';

export interface SemanticSearchOptions {
  query: string;
  entityTypes?: string[];  // Only supports: positions, documents, briefs
  similarityThreshold?: number;  // Default: 0.6
  limit?: number;
  includeKeywordResults?: boolean;  // Hybrid search mode
}

export interface SemanticSearchResult {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  similarity_score: number;
  match_type: 'semantic' | 'exact';
  updated_at: string;
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];  // Semantic matches
  exact_matches?: SearchResult[];   // Keyword matches (if hybrid mode)
  query: {
    original: string;
    embedding_generated: boolean;
  };
  performance: {
    embedding_generation_ms: number;
    vector_search_ms: number;
    keyword_search_ms?: number;
    total_ms: number;
  };
  warnings: string[];
}

export class SemanticSearchService {
  private supabase: SupabaseClient;
  private vectorService: VectorService;
  private fullTextService: FullTextSearchService;

  constructor(
    supabaseUrl: string = process.env.SUPABASE_URL!,
    supabaseKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.vectorService = new VectorService(supabaseUrl, supabaseKey);
    this.fullTextService = new FullTextSearchService(supabaseUrl, supabaseKey);
  }

  /**
   * Perform semantic search using vector embeddings
   */
  async search(options: SemanticSearchOptions): Promise<SemanticSearchResponse> {
    const totalStartTime = Date.now();
    const warnings: string[] = [];
    const performance = {
      embedding_generation_ms: 0,
      vector_search_ms: 0,
      keyword_search_ms: undefined as number | undefined,
      total_ms: 0
    };

    // Validate entity types
    const validEntityTypes = ['positions', 'documents', 'briefs'];
    const entityTypes = options.entityTypes && options.entityTypes.length > 0
      ? options.entityTypes.filter(type => validEntityTypes.includes(type))
      : validEntityTypes;

    if (entityTypes.length === 0) {
      warnings.push('No valid entity types for semantic search. Valid types: positions, documents, briefs');
      return {
        results: [],
        query: {
          original: options.query,
          embedding_generated: false
        },
        performance: {
          ...performance,
          total_ms: Date.now() - totalStartTime
        },
        warnings
      };
    }

    // Step 1: Generate query embedding
    const embeddingStartTime = Date.now();
    const queryEmbedding = await this.vectorService.generateEmbeddingFromText(options.query);
    performance.embedding_generation_ms = Date.now() - embeddingStartTime;

    if (!queryEmbedding) {
      warnings.push('AnythingLLM unavailable. Semantic search requires embedding service.');

      // If hybrid mode requested, fallback to keyword-only search
      if (options.includeKeywordResults) {
        const keywordStartTime = Date.now();
        const keywordResults = await this.fullTextService.search({
          query: options.query,
          entityTypes,
          limit: options.limit || 20
        });
        performance.keyword_search_ms = Date.now() - keywordStartTime;
        performance.total_ms = Date.now() - totalStartTime;

        return {
          results: [],
          exact_matches: keywordResults.results,
          query: {
            original: options.query,
            embedding_generated: false
          },
          performance,
          warnings
        };
      }

      // No results if embedding failed and hybrid mode not enabled
      performance.total_ms = Date.now() - totalStartTime;
      return {
        results: [],
        query: {
          original: options.query,
          embedding_generated: false
        },
        performance,
        warnings
      };
    }

    // Step 2: Perform vector search (parallel for all entity types)
    const vectorSearchStartTime = Date.now();
    const searchPromises = entityTypes.map(type =>
      this.searchEntityByVector(type, queryEmbedding, options.similarityThreshold || 0.6, options.limit || 20)
    );

    const entityResults = await Promise.all(searchPromises);
    performance.vector_search_ms = Date.now() - vectorSearchStartTime;

    // Flatten and merge semantic results
    let semanticResults = entityResults.flat();

    // Deduplicate by entity ID (in case of cross-table matches)
    const seenIds = new Set<string>();
    semanticResults = semanticResults.filter(result => {
      if (seenIds.has(result.id)) {
        return false;
      }
      seenIds.add(result.id);
      return true;
    });

    // Sort by similarity score descending
    semanticResults.sort((a, b) => b.similarity_score - a.similarity_score);

    // Step 3: If hybrid mode, get exact keyword matches
    let exactMatches: SearchResult[] | undefined;
    if (options.includeKeywordResults) {
      const keywordStartTime = Date.now();
      const keywordResults = await this.fullTextService.search({
        query: options.query,
        entityTypes,
        limit: options.limit || 20
      });
      performance.keyword_search_ms = Date.now() - keywordStartTime;
      exactMatches = keywordResults.results;

      // Remove semantic results that are already in exact matches (dedupe)
      const exactIds = new Set(exactMatches.map(r => r.id));
      semanticResults = semanticResults.filter(r => !exactIds.has(r.id));
    }

    performance.total_ms = Date.now() - totalStartTime;

    return {
      results: semanticResults,
      exact_matches: exactMatches,
      query: {
        original: options.query,
        embedding_generated: true
      },
      performance,
      warnings
    };
  }

  /**
   * Search single entity type using vector similarity
   */
  private async searchEntityByVector(
    entityType: string,
    queryEmbedding: number[],
    similarityThreshold: number,
    limit: number
  ): Promise<SemanticSearchResult[]> {
    try {
      // Call search_entities_semantic database function
      const { data, error } = await this.supabase.rpc('search_entities_semantic', {
        p_entity_type: entityType,
        p_query_embedding: queryEmbedding,
        p_similarity_threshold: similarityThreshold,
        p_limit: limit
      });

      if (error) {
        console.error(`Semantic search error for ${entityType}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Map database results to SemanticSearchResult format
      return data.map((row: any) => ({
        id: row.entity_id,
        type: entityType.slice(0, -1), // Remove 's' plural
        title_en: row.entity_title,
        title_ar: row.entity_title_ar || row.entity_title,
        description_en: row.description_en,
        description_ar: row.description_ar,
        similarity_score: row.similarity_score,
        match_type: 'semantic' as const,
        updated_at: row.updated_at || new Date().toISOString()
      }));

    } catch (error) {
      console.error(`Failed to search ${entityType} by vector:`, error);
      return [];
    }
  }

  /**
   * Check if AnythingLLM service is available
   */
  async isSemanticSearchAvailable(): Promise<boolean> {
    return await this.vectorService.checkAnythingLLMStatus();
  }
}
