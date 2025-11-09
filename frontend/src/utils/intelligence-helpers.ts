/**
 * Intelligence Utility Functions
 * 
 * Helper functions for working with intelligence reports
 */

/**
 * Convert numeric confidence score (0-100) to confidence level string
 * 
 * Mapping:
 * - 90-100: 'verified' (most reliable, multiple authoritative sources)
 * - 70-89: 'high' (reliable, good sources)
 * - 50-69: 'medium' (moderate reliability)
 * - 0-49: 'low' (limited reliability)
 */
export function getConfidenceLevel(
  confidenceScore: number
): 'verified' | 'high' | 'medium' | 'low' {
  if (confidenceScore >= 90) return 'verified';
  if (confidenceScore >= 70) return 'high';
  if (confidenceScore >= 50) return 'medium';
  return 'low';
}

/**
 * Type guard to check if a value is a valid confidence level
 */
export function isValidConfidenceLevel(
  value: unknown
): value is 'verified' | 'high' | 'medium' | 'low' {
  return (
    value === 'verified' ||
    value === 'high' ||
    value === 'medium' ||
    value === 'low'
  );
}

