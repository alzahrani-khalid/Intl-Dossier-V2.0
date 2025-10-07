/**
 * Search Analytics Service
 * Feature: 015-search-retrieval-spec
 * Task: T054
 *
 * Tracks search queries and click events for analytics.
 * Includes:
 * - Query tracking
 * - Click tracking
 * - User anonymization after 90 days
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export interface SearchQueryData {
  userId?: string;
  queryText: string;
  languageDetected?: 'en' | 'ar' | 'mixed';
  filters?: Record<string, any>;
  resultsCount: number;
}

export interface SearchClickData {
  queryText: string;
  clickedResultId: string;
  clickedResultType: string;
  clickedRank: number;
}

export class SearchAnalyticsService {
  constructor(private supabaseClient: SupabaseClient = supabase) {}

  /**
   * Track a search query
   */
  async trackSearchQuery(data: SearchQueryData): Promise<void> {
    try {
      const normalized = this.normalizeQueryText(data.queryText);

      const { error } = await this.supabaseClient.from('search_queries').insert({
        user_id: data.userId || null,
        query_text: data.queryText,
        query_text_normalized: normalized,
        language_detected: data.languageDetected || this.detectLanguage(data.queryText),
        filters: data.filters || null,
        results_count: data.resultsCount,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to track search query:', error);
        // Don't throw - analytics failures shouldn't break search
      }
    } catch (error) {
      console.error('Error tracking search query:', error);
    }
  }

  /**
   * Track a click on a search result
   */
  async trackSearchClick(data: SearchClickData): Promise<void> {
    try {
      const normalized = this.normalizeQueryText(data.queryText);

      // Find the most recent query matching this text
      const { data: queries, error: queryError } = await this.supabaseClient
        .from('search_queries')
        .select('id')
        .eq('query_text_normalized', normalized)
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError || !queries || queries.length === 0) {
        console.warn('Could not find query to track click:', queryError);
        return;
      }

      // Update the query with click data
      const { error: updateError } = await this.supabaseClient
        .from('search_queries')
        .update({
          clicked_result_id: data.clickedResultId,
          clicked_result_type: data.clickedResultType,
          clicked_rank: data.clickedRank,
        })
        .eq('id', queries[0].id);

      if (updateError) {
        console.error('Failed to track search click:', updateError);
      }
    } catch (error) {
      console.error('Error tracking search click:', error);
    }
  }

  /**
   * Normalize query text for consistent tracking
   */
  private normalizeQueryText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u064B-\u065F]/g, ''); // Remove Arabic diacritics
  }

  /**
   * Detect language of query text
   */
  private detectLanguage(text: string): 'en' | 'ar' | 'mixed' {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

    if (arabicChars > 0 && englishChars > 0) {
      return 'mixed';
    }

    if (arabicChars > 0) {
      return 'ar';
    }

    return 'en';
  }

  /**
   * Get popular search queries (for analytics dashboard)
   */
  async getPopularQueries(limit: number = 100): Promise<
    Array<{
      query: string;
      count: number;
      language: string;
      avgResultsCount: number;
    }>
  > {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await this.supabaseClient
        .from('search_queries')
        .select('query_text_normalized, language_detected, results_count')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error || !data) {
        console.error('Failed to get popular queries:', error);
        return [];
      }

      // Aggregate data
      const queryStats: Record<
        string,
        { count: number; language: string; totalResults: number }
      > = {};

      for (const row of data) {
        const query = row.query_text_normalized;
        if (!queryStats[query]) {
          queryStats[query] = {
            count: 0,
            language: row.language_detected || 'en',
            totalResults: 0,
          };
        }
        queryStats[query].count++;
        queryStats[query].totalResults += row.results_count || 0;
      }

      // Convert to array and sort
      return Object.entries(queryStats)
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          language: stats.language,
          avgResultsCount: Math.round(stats.totalResults / stats.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting popular queries:', error);
      return [];
    }
  }

  /**
   * Anonymize old user data (GDPR compliance)
   * Should be run as a daily cron job
   */
  async anonymizeOldQueries(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await this.supabaseClient
        .from('search_queries')
        .update({ user_id: null })
        .lt('created_at', ninetyDaysAgo.toISOString())
        .not('user_id', 'is', null)
        .select('id');

      if (error) {
        console.error('Failed to anonymize queries:', error);
        return 0;
      }

      const anonymizedCount = data?.length || 0;
      console.log(`[Search Analytics] Anonymized ${anonymizedCount} queries older than 90 days`);
      return anonymizedCount;
    } catch (error) {
      console.error('Error anonymizing queries:', error);
      return 0;
    }
  }
}

/**
 * Setup anonymization cron job (runs daily)
 */
export function setupAnonymizationJob() {
  const analyticsService = new SearchAnalyticsService();
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  console.log('[Search Analytics] Starting daily anonymization job');

  // Run immediately on startup
  analyticsService.anonymizeOldQueries().catch((error) => {
    console.error('[Search Analytics] Initial anonymization failed:', error);
  });

  // Then run daily
  setInterval(async () => {
    try {
      await analyticsService.anonymizeOldQueries();
    } catch (error) {
      console.error('[Search Analytics] Scheduled anonymization failed:', error);
    }
  }, INTERVAL_MS);
}
