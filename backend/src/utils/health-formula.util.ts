/**
 * Health Score Formula Utilities
 * Feature: 030-health-commitment
 *
 * Implements the relationship health scoring algorithm per spec 009:
 * - Overall Score = (Engagement Frequency × 0.30) + (Commitment Fulfillment × 0.40) + (Recency × 0.30)
 * - All component scores are on a 0-100 scale
 * - Overall score is rounded to nearest integer
 *
 * Thresholds:
 * - Insufficient data: < 3 engagements in 365 days OR 0 commitments
 * - Recency bands: ≤30d=100, 30-90d=70, 90-180d=40, >180d=10
 */

/**
 * Calculate recency score based on days since last engagement
 *
 * @param latestEngagementDate - ISO timestamp of most recent engagement
 * @returns Recency score (10, 40, 70, or 100)
 */
export function calculateRecencyScore(latestEngagementDate: string | null): number {
  if (!latestEngagementDate) {
    return 10; // No engagement = oldest bucket
  }

  const daysSinceLastEngagement = Math.floor(
    (Date.now() - new Date(latestEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Spec 009 recency thresholds
  if (daysSinceLastEngagement <= 30) return 100;
  if (daysSinceLastEngagement <= 90) return 70;
  if (daysSinceLastEngagement <= 180) return 40;
  return 10;
}

/**
 * Calculate overall health score from component scores
 *
 * @param engagementFrequency - Engagement frequency score (0-100)
 * @param commitmentFulfillment - Commitment fulfillment rate (0-100)
 * @param recencyScore - Recency score (10, 40, 70, or 100)
 * @returns Overall health score (0-100), rounded to nearest integer
 */
export function calculateHealthScore(
  engagementFrequency: number,
  commitmentFulfillment: number,
  recencyScore: number
): number {
  // Spec 009 formula with weighted components
  const overallScore =
    (engagementFrequency * 0.30) +
    (commitmentFulfillment * 0.40) +
    (recencyScore * 0.30);

  return Math.round(overallScore);
}

/**
 * Check if dossier has sufficient data for health score calculation
 *
 * @param totalEngagements365d - Number of engagements in last 365 days
 * @param totalCommitments - Total non-cancelled commitments
 * @returns true if sufficient data (≥3 engagements AND ≥1 commitment), false otherwise
 */
export function hasSufficientData(
  totalEngagements365d: number,
  totalCommitments: number
): boolean {
  return totalEngagements365d >= 3 && totalCommitments > 0;
}

/**
 * Get reason message for insufficient data
 *
 * @param totalEngagements365d - Number of engagements in last 365 days
 * @param totalCommitments - Total non-cancelled commitments
 * @returns Human-readable reason for insufficient data, or null if sufficient
 */
export function getInsufficientDataReason(
  totalEngagements365d: number,
  totalCommitments: number
): string | null {
  if (totalEngagements365d < 3 && totalCommitments === 0) {
    return `Insufficient data: requires at least 3 engagements (currently ${totalEngagements365d}) and 1 commitment (currently 0)`;
  }

  if (totalEngagements365d < 3) {
    return `Insufficient data: requires at least 3 engagements in the last 365 days (currently ${totalEngagements365d})`;
  }

  if (totalCommitments === 0) {
    return "Insufficient data: requires at least 1 non-cancelled commitment";
  }

  return null;
}
