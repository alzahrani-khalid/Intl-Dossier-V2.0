import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type DossierType = 'country' | 'organization' | 'forum' | 'engagement' | 'theme' | 'working_group' | 'person';
type DossierStatus = 'active' | 'inactive' | 'archived' | 'deleted';

interface SearchOptions {
  query: string;
  types?: DossierType[];
  status?: DossierStatus[];
  sensitivity_max?: number;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: DossierType;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status: DossierStatus;
  sensitivity_level: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  rank: number; // Search relevance score
  snippet?: string; // Highlighted search snippet
}

/**
 * UnifiedSearchService - Full-text search across all dossier types
 *
 * This service provides unified search capabilities across the 7 dossier types using PostgreSQL's
 * full-text search (tsvector). Features:
 * - Multilingual search (English + Arabic)
 * - Type filtering (search specific dossier types)
 * - Clearance-based filtering (RLS integration)
 * - Weighted ranking (exact match > relevance > status > alphabetical)
 * - Query transformation (term splitting, OR joining)
 *
 * @example
 * // Search across all types
 * const results = await searchService.search({
 *   query: 'climate policy',
 *   limit: 20
 * });
 *
 * @example
 * // Search specific types only
 * const results = await searchService.search({
 *   query: 'trade',
 *   types: ['country', 'organization', 'theme'],
 *   status: ['active']
 * });
 */
export class UnifiedSearchService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Search across all dossier types using full-text search
   * @param options - Search query and filter options
   * @returns Array of search results with relevance ranking
   */
  async search(options: SearchOptions): Promise<{
    data: SearchResult[];
    count: number;
    limit: number;
    offset: number;
  }> {
    const {
      query,
      types,
      status,
      sensitivity_max,
      limit = 50,
      offset = 0,
    } = options;

    // Transform query for full-text search
    const tsquery = this.transformQuery(query);

    // Build base query
    let dbQuery = this.supabase
      .from('dossiers')
      .select('*', { count: 'exact' })
      .textSearch('search_vector', tsquery, {
        type: 'websearch',
        config: 'simple',
      });

    // Apply filters
    if (types && types.length > 0) {
      dbQuery = dbQuery.in('type', types);
    }

    if (status && status.length > 0) {
      dbQuery = dbQuery.in('status', status);
    } else {
      // Default: exclude deleted items
      dbQuery = dbQuery.neq('status', 'deleted');
    }

    if (sensitivity_max !== undefined) {
      dbQuery = dbQuery.lte('sensitivity_level', sensitivity_max);
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    // Calculate ranking and format results
    const results: SearchResult[] = (data || []).map((dossier) => {
      const rank = this.calculateRank(dossier, query);
      const snippet = this.generateSnippet(dossier, query);

      return {
        id: dossier.id,
        type: dossier.type as DossierType,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        description_en: dossier.description_en || undefined,
        description_ar: dossier.description_ar || undefined,
        status: dossier.status as DossierStatus,
        sensitivity_level: dossier.sensitivity_level,
        tags: dossier.tags || [],
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
        rank,
        snippet,
      };
    });

    // Sort by rank (exact match > relevance > status > alphabetical)
    results.sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (a.status !== b.status) {
        const statusOrder: Record<DossierStatus, number> = { active: 0, inactive: 1, archived: 2, deleted: 3 };
        return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
      }
      return a.name_en.localeCompare(b.name_en);
    });

    return {
      data: results,
      count: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Transform user query for PostgreSQL full-text search
   * - Split terms by spaces
   * - Join with OR operator for broader results
   * - Handle special characters
   * @param query - Raw search query
   * @returns Transformed tsquery string
   */
  private transformQuery(query: string): string {
    // Remove special characters and split into terms
    const terms = query
      .replace(/[^\w\s\u0600-\u06FF]/gi, '') // Keep alphanumeric, spaces, and Arabic characters
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return '';

    // Join with OR for broader results, but keep phrase search option
    return terms.join(' | ');
  }

  /**
   * Calculate relevance rank for search result
   * Ranking algorithm:
   * - Exact name match (EN or AR): 100 points
   * - Partial name match: 80 points
   * - Description match: 60 points
   * - Tag match: 40 points
   * @param dossier - Dossier record
   * @param query - Search query
   * @returns Rank score (0-100)
   */
  private calculateRank(dossier: any, query: string): number {
    const lowerQuery = query.toLowerCase();
    const nameEn = (dossier.name_en || '').toLowerCase();
    const nameAr = (dossier.name_ar || '').toLowerCase();
    const descEn = (dossier.description_en || '').toLowerCase();
    const descAr = (dossier.description_ar || '').toLowerCase();
    const tags = (dossier.tags || []).map((t: string) => t.toLowerCase());

    let rank = 0;

    // Exact name match
    if (nameEn === lowerQuery || nameAr === lowerQuery) {
      rank = 100;
    }
    // Partial name match (starts with)
    else if (nameEn.startsWith(lowerQuery) || nameAr.startsWith(lowerQuery)) {
      rank = 90;
    }
    // Name contains query
    else if (nameEn.includes(lowerQuery) || nameAr.includes(lowerQuery)) {
      rank = 80;
    }
    // Description match
    else if (descEn.includes(lowerQuery) || descAr.includes(lowerQuery)) {
      rank = 60;
    }
    // Tag match
    else if (tags.some((tag: string) => tag.includes(lowerQuery))) {
      rank = 40;
    }
    // Default rank from tsquery (fallback)
    else {
      rank = 20;
    }

    return rank;
  }

  /**
   * Generate search snippet with highlighted match
   * @param dossier - Dossier record
   * @param query - Search query
   * @returns Snippet string with context around match
   */
  private generateSnippet(dossier: any, query: string): string {
    const lowerQuery = query.toLowerCase();

    // Check name fields first
    if ((dossier.name_en || '').toLowerCase().includes(lowerQuery)) {
      return dossier.name_en;
    }
    if ((dossier.name_ar || '').toLowerCase().includes(lowerQuery)) {
      return dossier.name_ar;
    }

    // Check description fields
    const descEn = dossier.description_en || '';
    const descAr = dossier.description_ar || '';

    if (descEn.toLowerCase().includes(lowerQuery)) {
      return this.extractSnippet(descEn, query, 150);
    }
    if (descAr.toLowerCase().includes(lowerQuery)) {
      return this.extractSnippet(descAr, query, 150);
    }

    // Fallback to first 150 chars of description
    return descEn.substring(0, 150) + (descEn.length > 150 ? '...' : '');
  }

  /**
   * Extract snippet around match with context
   * @param text - Full text
   * @param query - Search query
   * @param maxLength - Maximum snippet length
   * @returns Snippet with ellipsis
   */
  private extractSnippet(text: string, query: string, maxLength: number): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Calculate snippet window
    const halfWindow = Math.floor((maxLength - query.length) / 2);
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(text.length, index + query.length + halfWindow);

    let snippet = text.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get search suggestions/autocomplete based on partial query
   * @param partial - Partial search query (min 2 characters)
   * @param options - Filter options
   * @returns Array of suggested dossiers
   */
  async getSuggestions(
    partial: string,
    options: {
      types?: DossierType[];
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    if (partial.length < 2) return [];

    const { types, limit = 10 } = options;

    let query = this.supabase
      .from('dossiers')
      .select('*')
      .neq('status', 'deleted')
      .limit(limit);

    // Search by name prefix (case-insensitive)
    query = query.or(`name_en.ilike.${partial}%,name_ar.ilike.${partial}%`);

    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((dossier) => ({
      id: dossier.id,
      type: dossier.type as DossierType,
      name_en: dossier.name_en,
      name_ar: dossier.name_ar,
      description_en: dossier.description_en || undefined,
      description_ar: dossier.description_ar || undefined,
      status: dossier.status as DossierStatus,
      sensitivity_level: dossier.sensitivity_level,
      tags: dossier.tags || [],
      created_at: dossier.created_at,
      updated_at: dossier.updated_at,
      rank: 100, // All suggestions have equal rank
    }));
  }

  /**
   * Get search statistics (most searched types, recent searches, etc.)
   * This would typically integrate with an analytics service
   * @returns Search statistics
   */
  async getSearchStats() {
    // Get count by type
    const { data: typeCounts, error } = await this.supabase
      .from('dossiers')
      .select('type')
      .neq('status', 'deleted');

    if (error) throw error;

    const countsByType: Record<string, number> = {};
    typeCounts?.forEach((item) => {
      countsByType[item.type] = (countsByType[item.type] || 0) + 1;
    });

    return {
      total_dossiers: typeCounts?.length || 0,
      by_type: countsByType,
    };
  }

  /**
   * Advanced search with AND logic (all terms must match)
   * @param options - Search options with AND logic
   * @returns Search results matching ALL terms
   */
  async searchWithAndLogic(options: SearchOptions) {
    const { query, ...restOptions } = options;

    // Transform query to use AND instead of OR
    const terms = query
      .replace(/[^\w\s\u0600-\u06FF]/gi, '')
      .split(/\s+/)
      .filter(Boolean);

    const tsquery = terms.join(' & '); // AND operator

    return this.search({
      ...restOptions,
      query: tsquery,
    });
  }
}

export default UnifiedSearchService;
