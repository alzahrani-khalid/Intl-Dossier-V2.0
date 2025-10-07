/**
 * Cache Warming Job
 * Feature: 015-search-retrieval-spec
 * Task: T053
 *
 * Cron job (runs every 3 minutes) to pre-populate Redis cache
 * with top 100 popular search prefixes.
 *
 * Queries search_queries table for most common queries and
 * calls SuggestionService for each prefix to warm cache.
 */

import { createClient } from '@supabase/supabase-js';
import { RedisCacheService } from '../services/redis-cache.service';
import { SuggestionService } from '../services/suggestion.service';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const cacheService = new RedisCacheService();
const suggestionService = new SuggestionService();

interface PopularQuery {
  query_text_normalized: string;
  search_count: number;
}

/**
 * Get top N popular search queries from the last 7 days
 */
async function getPopularQueries(limit: number = 100): Promise<PopularQuery[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('search_queries')
    .select('query_text_normalized')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000); // Get more to analyze

  if (error) {
    console.error('Failed to fetch popular queries:', error);
    return [];
  }

  if (!data) return [];

  // Count occurrences and get top N
  const queryCounts: Record<string, number> = {};
  for (const row of data) {
    const normalized = row.query_text_normalized;
    queryCounts[normalized] = (queryCounts[normalized] || 0) + 1;
  }

  // Sort by count and return top N
  return Object.entries(queryCounts)
    .map(([query, count]) => ({
      query_text_normalized: query,
      search_count: count,
    }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, limit);
}

/**
 * Extract prefixes from a query for warming
 * e.g., "climate" → ["c", "cl", "cli", "clim", "clima", "climate"]
 */
function extractPrefixes(query: string): string[] {
  const prefixes: string[] = [];
  const minPrefixLength = 2; // Don't warm single-character prefixes
  const maxPrefixLength = Math.min(query.length, 15); // Don't warm very long prefixes

  for (let i = minPrefixLength; i <= maxPrefixLength; i++) {
    prefixes.push(query.substring(0, i));
  }

  return prefixes;
}

/**
 * Warm cache for a single prefix
 */
async function warmCacheForPrefix(
  prefix: string,
  entityType: string = 'all'
): Promise<boolean> {
  try {
    // Call suggestion service which will cache results
    await suggestionService.getSuggestions(prefix, entityType, 10);
    return true;
  } catch (error) {
    console.error(`Failed to warm cache for prefix "${prefix}":`, error);
    return false;
  }
}

/**
 * Main cache warming function
 */
export async function warmSearchCache(): Promise<{
  prefixesWarmed: number;
  queriesProcessed: number;
  errors: number;
}> {
  const startTime = Date.now();
  console.log('[Cache Warming] Starting cache warming job...');

  let prefixesWarmed = 0;
  let errors = 0;

  try {
    // Get popular queries
    const popularQueries = await getPopularQueries(100);
    console.log(`[Cache Warming] Found ${popularQueries.length} popular queries`);

    // Extract all prefixes
    const allPrefixes = new Set<string>();
    for (const { query_text_normalized } of popularQueries) {
      const prefixes = extractPrefixes(query_text_normalized);
      prefixes.forEach((p) => allPrefixes.add(p));
    }

    console.log(`[Cache Warming] Warming ${allPrefixes.size} unique prefixes...`);

    // Entity types to warm
    const entityTypes = ['all', 'dossiers', 'positions', 'documents'];

    // Warm cache for each prefix-entityType combination
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    const prefixArray = Array.from(allPrefixes);

    for (let i = 0; i < prefixArray.length; i += batchSize) {
      const batch = prefixArray.slice(i, i + batchSize);

      await Promise.all(
        batch.flatMap((prefix) =>
          entityTypes.map(async (entityType) => {
            const success = await warmCacheForPrefix(prefix, entityType);
            if (success) {
              prefixesWarmed++;
            } else {
              errors++;
            }
          })
        )
      );

      // Small delay between batches
      if (i + batchSize < prefixArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Cache Warming] Completed in ${duration}ms. ` +
        `Warmed ${prefixesWarmed} prefixes, ${errors} errors`
    );

    return {
      prefixesWarmed,
      queriesProcessed: popularQueries.length,
      errors,
    };
  } catch (error) {
    console.error('[Cache Warming] Critical error:', error);
    throw error;
  }
}

/**
 * Setup cron job (runs every 3 minutes)
 */
export function setupCacheWarmingJob() {
  const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

  console.log(`[Cache Warming] Starting periodic cache warming (every 3 minutes)`);

  // Run immediately on startup
  warmSearchCache().catch((error) => {
    console.error('[Cache Warming] Initial run failed:', error);
  });

  // Then run periodically
  setInterval(async () => {
    try {
      await warmSearchCache();
    } catch (error) {
      console.error('[Cache Warming] Scheduled run failed:', error);
    }
  }, INTERVAL_MS);
}

/**
 * Run cache warming manually (for testing)
 */
if (require.main === module) {
  warmSearchCache()
    .then((result) => {
      console.log('Cache warming result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cache warming failed:', error);
      process.exit(1);
    });
}
