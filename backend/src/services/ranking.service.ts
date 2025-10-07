/**
 * Search Result Ranking Service
 * Feature: 015-search-retrieval-spec
 * Task: T031
 *
 * Implements multi-factor scoring algorithm for search results:
 * - PostgreSQL ts_rank_cd for text match quality
 * - Title match boost
 * - Exact phrase boost
 * - Recency boost (log decay)
 * - Entity type preferences
 *
 * Exact matches always score > 100, semantic matches < 100
 */

export interface RankingFactors {
  tsRankCd: number;          // PostgreSQL cover density ranking (0.0 - 1.0)
  titleMatch: boolean;        // Match found in title
  exactPhrase: boolean;       // Exact phrase match
  daysSinceUpdate: number;    // Days since last update
  entityType: string;         // Entity type for type-specific boosts
  isExactMatch: boolean;      // Keyword exact match vs semantic match
}

export interface RankedResult {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  rank_score: number;
  match_type: 'exact' | 'semantic' | 'fuzzy';
  updated_at: string;
}

/**
 * Calculate final rank score for a search result
 *
 * @param factors - Ranking factors
 * @returns Final rank score (0-200, exact matches > 100, semantic < 100)
 */
export function calculateRankScore(factors: RankingFactors): number {
  if (factors.isExactMatch) {
    return calculateExactMatchScore(factors);
  } else {
    return calculateSemanticMatchScore(factors);
  }
}

/**
 * Calculate score for exact keyword matches
 *
 * Formula: Base 100 + (tsRank * 40) + (titleBoost * 30) + (phraseBoost * 20) + (recencyBoost * 10)
 * Result range: 100-200
 */
function calculateExactMatchScore(factors: RankingFactors): number {
  const baseScore = 100;

  // PostgreSQL ts_rank_cd weighted by position (A=1.0, B=0.4, C=0.2)
  const tsRankComponent = factors.tsRankCd * 40;

  // Title match gets significant boost
  const titleBoost = factors.titleMatch ? 30 : 0;

  // Exact phrase match gets additional boost
  const exactPhraseBoost = factors.exactPhrase ? 20 : 0;

  // Recency boost (logarithmic decay)
  const recencyBoost = calculateRecencyBoost(factors.daysSinceUpdate) * 10;

  const finalScore = baseScore + tsRankComponent + titleBoost + exactPhraseBoost + recencyBoost;

  // Clamp to ensure exact matches are always > 100
  return Math.max(100, Math.min(200, finalScore));
}

/**
 * Calculate score for semantic vector matches
 *
 * Formula: (vectorSimilarity * 60) + (recencyBoost * 10) + (entityTypeBoost * 30)
 * Result range: 0-100
 */
function calculateSemanticMatchScore(factors: RankingFactors): number {
  // Vector similarity should be passed in tsRankCd field (0.6-1.0)
  const vectorSimilarity = factors.tsRankCd;
  const similarityComponent = vectorSimilarity * 60;

  // Recency boost
  const recencyBoost = calculateRecencyBoost(factors.daysSinceUpdate) * 10;

  // Entity type preference
  const entityTypeBoost = getEntityTypeBoost(factors.entityType) * 30;

  const finalScore = similarityComponent + recencyBoost + entityTypeBoost;

  // Clamp to ensure semantic matches are always < 100
  return Math.max(0, Math.min(99, finalScore));
}

/**
 * Calculate recency boost using logarithmic decay
 *
 * @param daysSinceUpdate - Days since entity was last updated
 * @returns Boost factor (0.0 - 1.0)
 *
 * Recent updates get higher boost:
 * - 0 days: 1.0
 * - 7 days: 0.7
 * - 30 days: 0.5
 * - 365 days: 0.25
 */
export function calculateRecencyBoost(daysSinceUpdate: number): number {
  if (daysSinceUpdate < 0) return 1.0;

  // Logarithmic decay: boost = 1 - log10(days + 1) / log10(365 + 1)
  const maxAge = 365; // One year
  const boost = Math.max(0, 1 - Math.log10(daysSinceUpdate + 1) / Math.log10(maxAge + 1));

  return boost;
}

/**
 * Get entity type preference boost
 *
 * @param entityType - Type of entity
 * @returns Boost factor (0.0 - 1.0)
 */
function getEntityTypeBoost(entityType: string): number {
  const boosts: Record<string, number> = {
    dossier: 0.8,     // Highest priority
    position: 0.7,    // High priority
    engagement: 0.6,  // Medium-high
    document: 0.5,    // Medium
    person: 0.4,      // Medium-low
    mou: 0.3          // Lower priority
  };

  return boosts[entityType] || 0.5; // Default to medium
}

/**
 * Sort results by rank score (descending)
 *
 * @param results - Array of ranked results
 * @returns Sorted array
 */
export function sortByRankScore<T extends { rank_score: number }>(results: T[]): T[] {
  return results.sort((a, b) => b.rank_score - a.rank_score);
}

/**
 * Separate exact and semantic matches into sections
 *
 * @param results - Mixed results
 * @returns Object with exactMatches and semanticMatches arrays
 */
export function separateMatchTypes<T extends { rank_score: number; match_type?: string }>(
  results: T[]
): { exactMatches: T[]; semanticMatches: T[] } {
  const exactMatches = results.filter(r => r.rank_score >= 100);
  const semanticMatches = results.filter(r => r.rank_score < 100);

  return {
    exactMatches: sortByRankScore(exactMatches),
    semanticMatches: sortByRankScore(semanticMatches)
  };
}

/**
 * Calculate days since update from ISO timestamp
 *
 * @param updatedAt - ISO 8601 timestamp
 * @returns Number of days since update
 */
export function getDaysSinceUpdate(updatedAt: string): number {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Normalize PostgreSQL ts_rank_cd to 0-1 scale
 *
 * ts_rank_cd returns values typically between 0 and 1, but can exceed 1
 * for very high-quality matches. Normalize to ensure consistent scoring.
 *
 * @param tsRank - Raw ts_rank_cd value
 * @returns Normalized rank (0.0 - 1.0)
 */
export function normalizeTsRank(tsRank: number): number {
  return Math.min(1.0, Math.max(0.0, tsRank));
}
