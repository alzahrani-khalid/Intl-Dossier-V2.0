/**
 * T041a: Assignment Scoring Configuration
 * Weighted scoring algorithm for auto-assignment
 *
 * Scoring breakdown:
 * - Skills match: 40 points
 * - Capacity available: 30 points
 * - Availability status: 20 points
 * - Unit match: 10 points
 * Total: 100 points
 */

export const SCORING_WEIGHTS = {
  skills: 40,
  capacity: 30,
  availability: 20,
  unit: 10,
} as const;

export const DISQUALIFY_SCORE = -1;

// Runtime validation: Ensure weights sum to 100
const totalWeight = Object.values(SCORING_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (totalWeight !== 100) {
  throw new Error(
    `Invalid scoring weights: sum is ${totalWeight}, expected 100. ` +
    `Weights: ${JSON.stringify(SCORING_WEIGHTS)}`
  );
}

/**
 * Type for assignment scoring result
 */
export interface AssignmentScore {
  staffId: string;
  score: number;
  breakdown: {
    skillsScore: number;
    capacityScore: number;
    availabilityScore: number;
    unitScore: number;
  };
}

/**
 * Validate scoring weights on module load
 */
console.log('✓ Assignment scoring weights validated:', SCORING_WEIGHTS);
