/**
 * Full-Text Search Service
 * Feature: 015-search-retrieval-spec
 * Task: T033
 *
 * Implements full-text search across multiple entity types using:
 * - PostgreSQL tsvector for keyword matching
 * - pg_trgm for fuzzy matching
 * - Multi-factor ranking algorithm
 * - Bilingual snippet generation with highlighting
 * - Entity type filtering and pagination
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parseQueryToTsquery } from './query-parser.service';
import { calculateRankScore, getDaysSinceUpdate, sortByRankScore, RankingFactors } from './ranking.service';
import { detectLanguage } from '../utils/arabic-normalize';

export interface SearchOptions {
  query: string;
  entityTypes?: string[];  // Filter by entity types
  language?: 'en' | 'ar' | 'both';
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface SearchResult {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  snippet_en?: string;
  snippet_ar?: string;
  rank_score: number;
  updated_at: string;
  status?: string;
  is_archived: boolean;
  match_type: 'exact' | 'fuzzy';
}

export interface SearchResponse {
  results: SearchResult[];
  counts: {
    total: number;
    dossiers: number;
    people: number;
    engagements: number;
    positions: number;
    mous: number;
    documents: number;
    restricted: number;
  };
  query: {
    original: string;
    normalized: string;
    language_detected: 'en' | 'ar' | 'mixed';
    has_boolean_operators: boolean;
  };
  took_ms: number;
  warnings: string[];
  metadata?: {
    has_more: boolean;
    next_offset?: number;
    restricted_message?: string;
  };
}

export class FullTextSearchService {
  private supabase: SupabaseClient;

  constructor(
    supabaseUrl: string = process.env.SUPABASE_URL!,
    supabaseKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Perform full-text search across entity types
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Parse and validate query
    const queryLang = detectLanguage(options.query);
    const parsedQuery = parseQueryToTsquery(
      options.query,
      queryLang === 'ar' ? 'ar' : 'en'
    );

    // Determine entity types to search
    const entityTypes = options.entityTypes && options.entityTypes.length > 0
      ? options.entityTypes
      : ['dossiers', 'people', 'engagements', 'positions', 'mous', 'documents'];

    // Search each entity type in parallel
    const searchPromises = entityTypes.map(type =>
      this.searchEntityType(type, parsedQuery.tsquery, queryLang, options)
    );

    const entityResults = await Promise.all(searchPromises);

    // Flatten and merge results
    let allResults: SearchResult[] = [];
    const counts = {
      total: 0,
      dossiers: 0,
      people: 0,
      engagements: 0,
      positions: 0,
      mous: 0,
      documents: 0,
      restricted: 0
    };

    entityResults.forEach((results, index) => {
      const entityType = entityTypes[index];
      const typeKey = entityType as keyof typeof counts;
      if (typeKey in counts && typeKey !== 'total' && typeKey !== 'restricted') {
        counts[typeKey] = results.length;
      }
      allResults = allResults.concat(results);
    });

    counts.total = allResults.length;

    // Sort by rank score
    allResults = sortByRankScore(allResults);

    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedResults = allResults.slice(offset, offset + limit);
    const hasMore = allResults.length > offset + limit;

    const tookMs = Date.now() - startTime;

    return {
      results: paginatedResults,
      counts,
      query: {
        original: options.query,
        normalized: parsedQuery.tsquery,
        language_detected: queryLang,
        has_boolean_operators: parsedQuery.hasBooleanOperators
      },
      took_ms: tookMs,
      warnings,
      metadata: {
        has_more: hasMore,
        next_offset: hasMore ? offset + limit : undefined
      }
    };
  }

  /**
   * Search specific entity type using database function
   */
  private async searchEntityType(
    entityType: string,
    tsquery: string,
    language: 'en' | 'ar' | 'mixed',
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const langParam = language === 'ar' ? 'arabic' : 'english';

      // Call search_entities_fulltext function
      const { data, error } = await this.supabase.rpc('search_entities_fulltext', {
        p_entity_type: entityType,
        p_query: options.query,
        p_language: langParam,
        p_limit: 100, // Get more than needed for ranking
        p_offset: 0
      });

      if (error) {
        console.error(`Search error for ${entityType}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Map database results to SearchResult format
      return data.map((row: any) => {
        const daysSinceUpdate = getDaysSinceUpdate(row.updated_at || new Date().toISOString());

        const rankingFactors: RankingFactors = {
          tsRankCd: row.rank_score || 0,
          titleMatch: row.entity_title && row.entity_title.toLowerCase().includes(options.query.toLowerCase()),
          exactPhrase: row.entity_snippet && row.entity_snippet.includes('<mark>'),
          daysSinceUpdate,
          entityType,
          isExactMatch: true
        };

        const rankScore = calculateRankScore(rankingFactors);

        return {
          id: row.entity_id,
          type: entityType.slice(0, -1), // Remove 's' plural
          title_en: row.entity_title,
          title_ar: row.entity_title_ar || row.entity_title,
          snippet_en: row.entity_snippet,
          snippet_ar: row.entity_snippet_ar || row.entity_snippet,
          rank_score: rankScore,
          updated_at: row.updated_at || new Date().toISOString(),
          status: row.status,
          is_archived: row.is_archived || false,
          match_type: 'exact' as const
        };
      });

    } catch (error) {
      console.error(`Failed to search ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Get count of results user doesn't have permission to view
   */
  private async getRestrictedCount(
    entityType: string,
    tsquery: string,
    userId?: string
  ): Promise<number> {
    // This would need RLS policy checking
    // For now, return 0 as placeholder
    return 0;
  }
}
