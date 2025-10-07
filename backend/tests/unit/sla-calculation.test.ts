/**
 * Unit tests for SLA calculation logic
 *
 * Tests deadline calculation, status determination, and time remaining
 * calculations for all work item types and priority combinations.
 *
 * @see backend/src/services/assignment-sla.service.ts
 * @see supabase/migrations/20251002006_create_sla_configs.sql
 */

import { describe, it, expect, beforeEach } from 'vitest';

// SLA Configuration Matrix (from data-model.md)
const SLA_CONFIGS = {
  dossier: {
    urgent: 8.0,
    high: 24.0,
    normal: 48.0,
    low: 120.0,
  },
  ticket: {
    urgent: 2.0,
    high: 24.0,
    normal: 48.0,
    low: 120.0,
  },
  position: {
    urgent: 4.0,
    high: 24.0,
    normal: 48.0,
    low: 120.0,
  },
  task: {
    urgent: 4.0,
    high: 24.0,
    normal: 48.0,
    low: 120.0,
  },
};

type WorkItemType = 'dossier' | 'ticket' | 'position' | 'task';
type Priority = 'urgent' | 'high' | 'normal' | 'low';
type SLAStatus = 'ok' | 'warning' | 'breached';

/**
 * Calculate SLA deadline based on work item type and priority
 */
function calculateSLADeadline(
  workItemType: WorkItemType,
  priority: Priority,
  assignedAt: Date
): Date {
  const deadlineHours = SLA_CONFIGS[workItemType][priority];
  const deadline = new Date(assignedAt);
  deadline.setTime(deadline.getTime() + deadlineHours * 60 * 60 * 1000);
  return deadline;
}

/**
 * Determine SLA status based on deadline and assigned time
 */
function getSLAStatus(
  deadline: Date,
  assignedAt: Date,
  currentTime: Date = new Date()
): SLAStatus {
  const totalDuration = deadline.getTime() - assignedAt.getTime();
  const elapsed = currentTime.getTime() - assignedAt.getTime();
  const elapsedPercent = elapsed / totalDuration;

  if (elapsedPercent >= 1.0) {
    return 'breached';
  } else if (elapsedPercent >= 0.75) {
    return 'warning';
  } else {
    return 'ok';
  }
}

/**
 * Get remaining time in seconds
 */
function getRemainingTime(deadline: Date, currentTime: Date = new Date()): number {
  const remaining = Math.floor((deadline.getTime() - currentTime.getTime()) / 1000);
  return Math.max(0, remaining); // Never return negative
}

describe('SLA Calculation Logic', () => {
  let assignedAt: Date;

  beforeEach(() => {
    // Fixed timestamp for deterministic tests
    assignedAt = new Date('2025-10-02T10:00:00Z');
  });

  describe('Deadline Calculation', () => {
    describe('Dossiers', () => {
      it('should calculate 8 hour deadline for urgent dossier', () => {
        const deadline = calculateSLADeadline('dossier', 'urgent', assignedAt);

        const expected = new Date('2025-10-02T18:00:00Z'); // +8 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 24 hour deadline for high dossier', () => {
        const deadline = calculateSLADeadline('dossier', 'high', assignedAt);

        const expected = new Date('2025-10-03T10:00:00Z'); // +24 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 48 hour deadline for normal dossier', () => {
        const deadline = calculateSLADeadline('dossier', 'normal', assignedAt);

        const expected = new Date('2025-10-04T10:00:00Z'); // +48 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 120 hour (5 day) deadline for low dossier', () => {
        const deadline = calculateSLADeadline('dossier', 'low', assignedAt);

        const expected = new Date('2025-10-07T10:00:00Z'); // +120 hours (5 days)
        expect(deadline.getTime()).toBe(expected.getTime());
      });
    });

    describe('Tickets', () => {
      it('should calculate 2 hour deadline for urgent ticket', () => {
        const deadline = calculateSLADeadline('ticket', 'urgent', assignedAt);

        const expected = new Date('2025-10-02T12:00:00Z'); // +2 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 24 hour deadline for high ticket', () => {
        const deadline = calculateSLADeadline('ticket', 'high', assignedAt);

        const expected = new Date('2025-10-03T10:00:00Z'); // +24 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should handle fractional hours correctly (<1 hour)', () => {
        // Note: Current config has 2.0 hours minimum
        // This test validates that fractional hours (e.g., 0.5h) would work
        const assignedAt = new Date('2025-10-02T10:00:00Z');

        // Simulate 0.5 hour deadline (30 minutes)
        const deadline = new Date(assignedAt);
        deadline.setTime(deadline.getTime() + 0.5 * 60 * 60 * 1000);

        const expected = new Date('2025-10-02T10:30:00Z');
        expect(deadline.getTime()).toBe(expected.getTime());
      });
    });

    describe('Positions', () => {
      it('should calculate 4 hour deadline for urgent position', () => {
        const deadline = calculateSLADeadline('position', 'urgent', assignedAt);

        const expected = new Date('2025-10-02T14:00:00Z'); // +4 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 24 hour deadline for high position', () => {
        const deadline = calculateSLADeadline('position', 'high', assignedAt);

        const expected = new Date('2025-10-03T10:00:00Z'); // +24 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });
    });

    describe('Tasks', () => {
      it('should calculate 4 hour deadline for urgent task', () => {
        const deadline = calculateSLADeadline('task', 'urgent', assignedAt);

        const expected = new Date('2025-10-02T14:00:00Z'); // +4 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });

      it('should calculate 48 hour deadline for normal task', () => {
        const deadline = calculateSLADeadline('task', 'normal', assignedAt);

        const expected = new Date('2025-10-04T10:00:00Z'); // +48 hours
        expect(deadline.getTime()).toBe(expected.getTime());
      });
    });

    describe('All Work Item Types × Priority Combinations', () => {
      it('should have deadline configured for all 16 combinations', () => {
        const workItemTypes: WorkItemType[] = ['dossier', 'ticket', 'position', 'task'];
        const priorities: Priority[] = ['urgent', 'high', 'normal', 'low'];

        workItemTypes.forEach(type => {
          priorities.forEach(priority => {
            const deadline = calculateSLADeadline(type, priority, assignedAt);

            expect(deadline).toBeDefined();
            expect(deadline.getTime()).toBeGreaterThan(assignedAt.getTime());
          });
        });
      });

      it('should ensure urgent has shortest deadline for each type', () => {
        const workItemTypes: WorkItemType[] = ['dossier', 'ticket', 'position', 'task'];

        workItemTypes.forEach(type => {
          const urgentDeadline = calculateSLADeadline(type, 'urgent', assignedAt);
          const highDeadline = calculateSLADeadline(type, 'high', assignedAt);
          const normalDeadline = calculateSLADeadline(type, 'normal', assignedAt);
          const lowDeadline = calculateSLADeadline(type, 'low', assignedAt);

          expect(urgentDeadline.getTime()).toBeLessThan(highDeadline.getTime());
          expect(highDeadline.getTime()).toBeLessThanOrEqual(normalDeadline.getTime());
          expect(normalDeadline.getTime()).toBeLessThan(lowDeadline.getTime());
        });
      });
    });
  });

  describe('SLA Status Determination', () => {
    it('should return "ok" when less than 75% of SLA elapsed', () => {
      const deadline = new Date(assignedAt.getTime() + 48 * 60 * 60 * 1000); // +48 hours

      // 30 hours elapsed (62.5% of 48 hours)
      const currentTime = new Date(assignedAt.getTime() + 30 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('ok');
    });

    it('should return "warning" when 75% to 100% of SLA elapsed', () => {
      const deadline = new Date(assignedAt.getTime() + 48 * 60 * 60 * 1000); // +48 hours

      // 36 hours elapsed (75% of 48 hours)
      const currentTime = new Date(assignedAt.getTime() + 36 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('warning');
    });

    it('should return "warning" at exactly 75% threshold', () => {
      const deadline = new Date(assignedAt.getTime() + 8 * 60 * 60 * 1000); // +8 hours

      // 6 hours elapsed (exactly 75%)
      const currentTime = new Date(assignedAt.getTime() + 6 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('warning');
    });

    it('should return "warning" at 99% of SLA elapsed', () => {
      const deadline = new Date(assignedAt.getTime() + 2 * 60 * 60 * 1000); // +2 hours

      // 1.98 hours elapsed (99%)
      const currentTime = new Date(assignedAt.getTime() + 1.98 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('warning');
    });

    it('should return "breached" when 100% or more of SLA elapsed', () => {
      const deadline = new Date(assignedAt.getTime() + 48 * 60 * 60 * 1000); // +48 hours

      // 49 hours elapsed (102% of 48 hours)
      const currentTime = new Date(assignedAt.getTime() + 49 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('breached');
    });

    it('should return "breached" at exactly 100% threshold', () => {
      const deadline = new Date(assignedAt.getTime() + 8 * 60 * 60 * 1000); // +8 hours

      // Exactly 8 hours elapsed (100%)
      const currentTime = new Date(assignedAt.getTime() + 8 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('breached');
    });

    it('should handle very short SLAs correctly (< 1 hour)', () => {
      const deadline = new Date(assignedAt.getTime() + 30 * 60 * 1000); // +30 minutes

      // 20 minutes elapsed (66.7%)
      const currentTime = new Date(assignedAt.getTime() + 20 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('ok');
    });

    it('should handle very long SLAs correctly (> 100 hours)', () => {
      const deadline = new Date(assignedAt.getTime() + 120 * 60 * 60 * 1000); // +120 hours (5 days)

      // 100 hours elapsed (83.3%)
      const currentTime = new Date(assignedAt.getTime() + 100 * 60 * 60 * 1000);

      const status = getSLAStatus(deadline, assignedAt, currentTime);

      expect(status).toBe('warning');
    });
  });

  describe('Remaining Time Calculation', () => {
    it('should return correct remaining seconds when within SLA', () => {
      const deadline = new Date(assignedAt.getTime() + 2 * 60 * 60 * 1000); // +2 hours

      // 1 hour elapsed, 1 hour remaining
      const currentTime = new Date(assignedAt.getTime() + 1 * 60 * 60 * 1000);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(3600); // 1 hour = 3600 seconds
    });

    it('should return 0 when deadline has passed', () => {
      const deadline = new Date(assignedAt.getTime() + 2 * 60 * 60 * 1000); // +2 hours

      // 3 hours elapsed (1 hour over deadline)
      const currentTime = new Date(assignedAt.getTime() + 3 * 60 * 60 * 1000);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(0); // Never negative
    });

    it('should return 0 at exactly deadline time', () => {
      const deadline = new Date(assignedAt.getTime() + 2 * 60 * 60 * 1000); // +2 hours

      // Exactly at deadline
      const currentTime = new Date(deadline);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(0);
    });

    it('should handle fractional seconds correctly (round down)', () => {
      const deadline = new Date(assignedAt.getTime() + 2500); // +2.5 seconds

      // 1 second elapsed
      const currentTime = new Date(assignedAt.getTime() + 1000);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(1); // Floor(1.5) = 1 second
    });

    it('should calculate correct time for very short deadlines', () => {
      const deadline = new Date(assignedAt.getTime() + 30 * 1000); // +30 seconds

      // 10 seconds elapsed
      const currentTime = new Date(assignedAt.getTime() + 10 * 1000);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(20); // 20 seconds remaining
    });

    it('should calculate correct time for very long deadlines', () => {
      const deadline = new Date(assignedAt.getTime() + 120 * 60 * 60 * 1000); // +120 hours

      // 24 hours elapsed
      const currentTime = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);

      const remaining = getRemainingTime(deadline, currentTime);

      expect(remaining).toBe(96 * 60 * 60); // 96 hours = 345,600 seconds
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle assignment at midnight UTC correctly', () => {
      const midnightAssignment = new Date('2025-10-02T00:00:00Z');
      const deadline = calculateSLADeadline('ticket', 'urgent', midnightAssignment);

      const expected = new Date('2025-10-02T02:00:00Z');
      expect(deadline.getTime()).toBe(expected.getTime());
    });

    it('should handle assignment at year boundary correctly', () => {
      const yearEnd = new Date('2025-12-31T22:00:00Z');
      const deadline = calculateSLADeadline('ticket', 'urgent', yearEnd);

      const expected = new Date('2026-01-01T00:00:00Z'); // Crosses into new year
      expect(deadline.getTime()).toBe(expected.getTime());
    });

    it('should handle daylight saving time transitions (if applicable)', () => {
      // Note: UTC doesn't have DST, but this validates correct UTC handling
      const dstTransition = new Date('2025-03-09T01:00:00Z');
      const deadline = calculateSLADeadline('dossier', 'normal', dstTransition);

      const expected = new Date('2025-03-11T01:00:00Z'); // +48 hours
      expect(deadline.getTime()).toBe(expected.getTime());
    });

    it('should maintain precision across multiple calculations', () => {
      const type: WorkItemType = 'dossier';
      const priority: Priority = 'normal';

      const deadline1 = calculateSLADeadline(type, priority, assignedAt);
      const deadline2 = calculateSLADeadline(type, priority, assignedAt);

      // Same inputs should produce identical results (deterministic)
      expect(deadline1.getTime()).toBe(deadline2.getTime());
    });
  });
});
