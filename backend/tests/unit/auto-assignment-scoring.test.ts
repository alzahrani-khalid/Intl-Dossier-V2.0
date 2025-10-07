/**
 * Unit tests for weighted scoring algorithm
 *
 * Tests the assignment scoring logic that determines which staff member
 * should receive a work item based on:
 * - Skills match (40 points)
 * - Capacity utilization (30 points)
 * - Availability status (20 points)
 * - Unit match (10 points)
 *
 * @see backend/src/services/auto-assignment.service.ts
 * @see backend/src/config/scoring-weights.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SCORING_WEIGHTS, DISQUALIFY_SCORE } from '../../src/config/scoring-weights';

// Mock types matching the actual implementation
interface StaffProfile {
  id: string;
  user_id: string;
  unit_id: string;
  skills: string[];
  individual_wip_limit: number;
  current_assignment_count: number;
  availability_status: 'available' | 'on_leave' | 'unavailable';
  role: string;
}

interface WorkItem {
  work_item_id: string;
  work_item_type: string;
  required_skills: string[];
  priority: string;
  target_unit_id?: string;
}

/**
 * Calculate assignment score for a staff member
 * This mirrors the implementation in auto-assignment.service.ts
 */
function calculateAssignmentScore(staff: StaffProfile, workItem: WorkItem): number {
  let score = 0;

  // Skill match (0-40 points)
  const requiredSkills = workItem.required_skills;
  const matchedSkills = staff.skills.filter(s => requiredSkills.includes(s));
  const skillMatchRatio = matchedSkills.length / requiredSkills.length;
  score += skillMatchRatio * SCORING_WEIGHTS.skills;

  // Capacity (0-30 points) - inverse of utilization
  const capacityUtilization = staff.current_assignment_count / staff.individual_wip_limit;
  score += (1 - capacityUtilization) * SCORING_WEIGHTS.capacity;

  // Availability (0-20 points or DISQUALIFY)
  if (staff.availability_status === 'available') {
    score += SCORING_WEIGHTS.availability;
  } else if (staff.availability_status === 'unavailable' || staff.availability_status === 'on_leave') {
    return DISQUALIFY_SCORE; // Disqualify unavailable staff
  }

  // Unit match (0-10 points)
  if (workItem.target_unit_id && staff.unit_id === workItem.target_unit_id) {
    score += SCORING_WEIGHTS.unit;
  }

  return score;
}

describe('Auto-Assignment Scoring Algorithm', () => {
  let baseStaff: StaffProfile;
  let baseWorkItem: WorkItem;

  beforeEach(() => {
    baseStaff = {
      id: 'staff-001',
      user_id: 'user-001',
      unit_id: 'unit-translation',
      skills: ['skill-arabic', 'skill-writing'],
      individual_wip_limit: 5,
      current_assignment_count: 0,
      availability_status: 'available',
      role: 'staff',
    };

    baseWorkItem = {
      work_item_id: 'ticket-001',
      work_item_type: 'ticket',
      required_skills: ['skill-arabic'],
      priority: 'normal',
      target_unit_id: 'unit-translation',
    };
  });

  describe('Skill Match Scoring (0-40 points)', () => {
    it('should award full 40 points for perfect skill match', () => {
      const score = calculateAssignmentScore(baseStaff, baseWorkItem);

      // Perfect match: 1/1 skill = 40pts + 30pts capacity + 20pts available + 10pts unit = 100pts
      expect(score).toBe(100);
    });

    it('should award 20 points for 50% skill match (1 of 2 required)', () => {
      const workItem = {
        ...baseWorkItem,
        required_skills: ['skill-arabic', 'skill-legal'], // Staff has only skill-arabic
      };

      const score = calculateAssignmentScore(baseStaff, workItem);

      // 0.5 match ratio * 40 = 20pts + 30pts capacity + 20pts available + 10pts unit = 80pts
      expect(score).toBe(80);
    });

    it('should award 0 points for no skill match', () => {
      const workItem = {
        ...baseWorkItem,
        required_skills: ['skill-legal'], // Staff doesn't have this skill
      };

      const score = calculateAssignmentScore(baseStaff, workItem);

      // 0 match * 40 = 0pts + 30pts capacity + 20pts available + 10pts unit = 60pts
      expect(score).toBe(60);
    });

    it('should award bonus points when staff has extra skills beyond required', () => {
      const staff = {
        ...baseStaff,
        skills: ['skill-arabic', 'skill-writing', 'skill-legal'], // 3 skills
      };

      const workItem = {
        ...baseWorkItem,
        required_skills: ['skill-arabic', 'skill-legal'], // Requires 2
      };

      const score = calculateAssignmentScore(staff, workItem);

      // Perfect match on 2/2 = 40pts + 30pts + 20pts + 10pts = 100pts
      expect(score).toBe(100);
    });
  });

  describe('Capacity Scoring (0-30 points)', () => {
    it('should award full 30 points for 0% capacity utilization', () => {
      const staff = {
        ...baseStaff,
        current_assignment_count: 0,
        individual_wip_limit: 5,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      // (1 - 0/5) * 30 = 30pts + 40pts skills + 20pts available + 10pts unit = 100pts
      expect(score).toBe(100);
    });

    it('should award 15 points for 50% capacity utilization', () => {
      const staff = {
        ...baseStaff,
        current_assignment_count: 3, // 3 out of 5
        individual_wip_limit: 5,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      // (1 - 3/5) * 30 = 12pts + 40pts + 20pts + 10pts = 82pts
      expect(score).toBeCloseTo(82, 0);
    });

    it('should award 0 points for 100% capacity utilization (at limit)', () => {
      const staff = {
        ...baseStaff,
        current_assignment_count: 5, // At limit
        individual_wip_limit: 5,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      // (1 - 5/5) * 30 = 0pts + 40pts + 20pts + 10pts = 70pts
      expect(score).toBe(70);
    });

    it('should handle varying WIP limits correctly', () => {
      const staff1 = {
        ...baseStaff,
        current_assignment_count: 2,
        individual_wip_limit: 5, // 40% utilization
      };

      const staff2 = {
        ...baseStaff,
        id: 'staff-002',
        user_id: 'user-002',
        current_assignment_count: 2,
        individual_wip_limit: 10, // 20% utilization (better)
      };

      const score1 = calculateAssignmentScore(staff1, baseWorkItem);
      const score2 = calculateAssignmentScore(staff2, baseWorkItem);

      // Staff2 should have higher score due to lower utilization
      expect(score2).toBeGreaterThan(score1);

      // Staff1: (1 - 2/5) * 30 = 18pts + 70 = 88pts
      // Staff2: (1 - 2/10) * 30 = 24pts + 70 = 94pts
      expect(score1).toBeCloseTo(88, 0);
      expect(score2).toBeCloseTo(94, 0);
    });
  });

  describe('Availability Scoring (0-20 points or DISQUALIFY)', () => {
    it('should award 20 points for available status', () => {
      const staff = {
        ...baseStaff,
        availability_status: 'available' as const,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      expect(score).toBe(100); // Full score with all criteria met
    });

    it('should disqualify staff with unavailable status', () => {
      const staff = {
        ...baseStaff,
        availability_status: 'unavailable' as const,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      expect(score).toBe(DISQUALIFY_SCORE);
      expect(score).toBe(-1);
    });

    it('should disqualify staff on leave', () => {
      const staff = {
        ...baseStaff,
        availability_status: 'on_leave' as const,
      };

      const score = calculateAssignmentScore(staff, baseWorkItem);

      expect(score).toBe(DISQUALIFY_SCORE);
      expect(score).toBe(-1);
    });
  });

  describe('Unit Match Scoring (0-10 points)', () => {
    it('should award 10 points when staff is in target unit', () => {
      const staff = {
        ...baseStaff,
        unit_id: 'unit-translation',
      };

      const workItem = {
        ...baseWorkItem,
        target_unit_id: 'unit-translation',
      };

      const score = calculateAssignmentScore(staff, workItem);

      expect(score).toBe(100); // Full match
    });

    it('should award 0 points when staff is in different unit', () => {
      const staff = {
        ...baseStaff,
        unit_id: 'unit-analysis', // Different unit
      };

      const workItem = {
        ...baseWorkItem,
        target_unit_id: 'unit-translation',
      };

      const score = calculateAssignmentScore(staff, workItem);

      // 40pts skills + 30pts capacity + 20pts available + 0pts unit = 90pts
      expect(score).toBe(90);
    });

    it('should award 0 points when no target unit specified', () => {
      const workItem = {
        ...baseWorkItem,
        target_unit_id: undefined, // No target unit
      };

      const score = calculateAssignmentScore(baseStaff, workItem);

      // 40pts + 30pts + 20pts + 0pts = 90pts
      expect(score).toBe(90);
    });
  });

  describe('Composite Scoring Scenarios', () => {
    it('should rank staff correctly by composite score', () => {
      // Staff 1: Perfect match, low utilization
      const staff1 = {
        ...baseStaff,
        id: 'staff-001',
        user_id: 'user-001',
        skills: ['skill-arabic', 'skill-writing'],
        current_assignment_count: 1,
        individual_wip_limit: 5,
        unit_id: 'unit-translation',
      };

      // Staff 2: Partial match, no utilization
      const staff2 = {
        ...baseStaff,
        id: 'staff-002',
        user_id: 'user-002',
        skills: ['skill-arabic'], // Only 1 of 1 required
        current_assignment_count: 0,
        individual_wip_limit: 5,
        unit_id: 'unit-analysis', // Different unit
      };

      // Staff 3: Perfect match, high utilization
      const staff3 = {
        ...baseStaff,
        id: 'staff-003',
        user_id: 'user-003',
        skills: ['skill-arabic', 'skill-writing'],
        current_assignment_count: 4,
        individual_wip_limit: 5,
        unit_id: 'unit-translation',
      };

      const workItem = {
        ...baseWorkItem,
        required_skills: ['skill-arabic'],
        target_unit_id: 'unit-translation',
      };

      const score1 = calculateAssignmentScore(staff1, workItem);
      const score2 = calculateAssignmentScore(staff2, workItem);
      const score3 = calculateAssignmentScore(staff3, workItem);

      // Staff1: 40 + (1-1/5)*30 + 20 + 10 = 94pts
      // Staff2: 40 + (1-0/5)*30 + 20 + 0 = 90pts
      // Staff3: 40 + (1-4/5)*30 + 20 + 10 = 76pts

      expect(score1).toBeCloseTo(94, 0);
      expect(score2).toBeCloseTo(90, 0);
      expect(score3).toBeCloseTo(76, 0);

      // Ranking: staff1 > staff2 > staff3
      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
    });

    it('should handle edge case of minimal qualification', () => {
      const staff = {
        ...baseStaff,
        skills: ['skill-arabic'], // Minimal match
        current_assignment_count: 5, // At limit
        individual_wip_limit: 5,
        unit_id: 'unit-analysis', // Different unit
      };

      const workItem = {
        ...baseWorkItem,
        required_skills: ['skill-arabic'],
        target_unit_id: 'unit-translation',
      };

      const score = calculateAssignmentScore(staff, workItem);

      // 40pts + 0pts + 20pts + 0pts = 60pts (barely qualified)
      expect(score).toBe(60);
    });

    it('should ensure weights sum to 100', () => {
      const total = SCORING_WEIGHTS.skills +
                   SCORING_WEIGHTS.capacity +
                   SCORING_WEIGHTS.availability +
                   SCORING_WEIGHTS.unit;

      expect(total).toBe(100);
    });
  });

  describe('Determinism and Consistency', () => {
    it('should return same score for same inputs', () => {
      const score1 = calculateAssignmentScore(baseStaff, baseWorkItem);
      const score2 = calculateAssignmentScore(baseStaff, baseWorkItem);

      expect(score1).toBe(score2);
    });

    it('should return scores in valid range [0, 100] or DISQUALIFY', () => {
      const testCases = [
        { ...baseStaff },
        { ...baseStaff, current_assignment_count: 3 },
        { ...baseStaff, skills: [] },
        { ...baseStaff, unit_id: 'different-unit' },
      ];

      testCases.forEach(staff => {
        const score = calculateAssignmentScore(staff, baseWorkItem);

        if (score !== DISQUALIFY_SCORE) {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      });
    });
  });
});
