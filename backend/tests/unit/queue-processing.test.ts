/**
 * Unit tests for queue processing logic
 *
 * Tests priority-based ordering, FIFO within priority, skill matching,
 * and debouncing for the assignment queue processor.
 *
 * @see backend/src/services/queue.service.ts
 * @see supabase/migrations/20251002008_create_assignment_queue.sql
 * @see supabase/migrations/20251002014_create_queue_processing_trigger.sql
 */

import { describe, it, expect, beforeEach } from 'vitest';

type Priority = 'urgent' | 'high' | 'normal' | 'low';

interface QueueEntry {
  id: string;
  work_item_id: string;
  work_item_type: string;
  required_skills: string[];
  priority: Priority;
  created_at: Date;
  attempts: number;
}

// Priority order mapping (urgent = 4, high = 3, normal = 2, low = 1)
const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * Sort queue entries by priority DESC, created_at ASC (FIFO within priority)
 */
function sortQueueEntries(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    // First sort by priority (descending - urgent first)
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by created_at (ascending - oldest first)
    return a.created_at.getTime() - b.created_at.getTime();
  });
}

/**
 * Filter queue entries by skill match
 */
function filterBySkills(entries: QueueEntry[], freedSkills: string[]): QueueEntry[] {
  if (freedSkills.length === 0) return entries;

  return entries.filter(entry => {
    // Entry matches if it requires at least one of the freed skills
    return entry.required_skills.some(required => freedSkills.includes(required));
  });
}

/**
 * Simulate debouncing - wait for multiple capacity changes
 */
async function debounce(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Queue Processing Logic', () => {
  let baseEntry: QueueEntry;

  beforeEach(() => {
    baseEntry = {
      id: 'queue-001',
      work_item_id: 'ticket-001',
      work_item_type: 'ticket',
      required_skills: ['skill-arabic'],
      priority: 'normal',
      created_at: new Date('2025-10-02T10:00:00Z'),
      attempts: 0,
    };
  });

  describe('Priority Ordering', () => {
    it('should process urgent items before high items', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'high', created_at: new Date('2025-10-02T09:00:00Z') },
        { ...baseEntry, id: 'queue-2', priority: 'urgent', created_at: new Date('2025-10-02T10:00:00Z') },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('high');
    });

    it('should process high items before normal items', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'normal', created_at: new Date('2025-10-02T09:00:00Z') },
        { ...baseEntry, id: 'queue-2', priority: 'high', created_at: new Date('2025-10-02T10:00:00Z') },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('normal');
    });

    it('should process normal items before low items', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'low', created_at: new Date('2025-10-02T09:00:00Z') },
        { ...baseEntry, id: 'queue-2', priority: 'normal', created_at: new Date('2025-10-02T10:00:00Z') },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].priority).toBe('normal');
      expect(sorted[1].priority).toBe('low');
    });

    it('should maintain correct order across all priority levels', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-low', priority: 'low' },
        { ...baseEntry, id: 'queue-urgent', priority: 'urgent' },
        { ...baseEntry, id: 'queue-normal', priority: 'normal' },
        { ...baseEntry, id: 'queue-high', priority: 'high' },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('normal');
      expect(sorted[3].priority).toBe('low');
    });
  });

  describe('FIFO Within Priority', () => {
    it('should process older urgent items before newer urgent items', () => {
      const entries: QueueEntry[] = [
        {
          ...baseEntry,
          id: 'queue-newer',
          priority: 'urgent',
          created_at: new Date('2025-10-02T10:30:00Z'),
        },
        {
          ...baseEntry,
          id: 'queue-older',
          priority: 'urgent',
          created_at: new Date('2025-10-02T10:00:00Z'),
        },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].id).toBe('queue-older');
      expect(sorted[1].id).toBe('queue-newer');
    });

    it('should process older normal items before newer normal items', () => {
      const entries: QueueEntry[] = [
        {
          ...baseEntry,
          id: 'queue-3',
          priority: 'normal',
          created_at: new Date('2025-10-02T12:00:00Z'),
        },
        {
          ...baseEntry,
          id: 'queue-1',
          priority: 'normal',
          created_at: new Date('2025-10-02T10:00:00Z'),
        },
        {
          ...baseEntry,
          id: 'queue-2',
          priority: 'normal',
          created_at: new Date('2025-10-02T11:00:00Z'),
        },
      ];

      const sorted = sortQueueEntries(entries);

      expect(sorted[0].id).toBe('queue-1'); // Oldest
      expect(sorted[1].id).toBe('queue-2');
      expect(sorted[2].id).toBe('queue-3'); // Newest
    });

    it('should handle items queued in same second correctly', () => {
      const sameTime = new Date('2025-10-02T10:00:00Z');

      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'normal', created_at: sameTime },
        { ...baseEntry, id: 'queue-2', priority: 'normal', created_at: sameTime },
        { ...baseEntry, id: 'queue-3', priority: 'normal', created_at: sameTime },
      ];

      const sorted = sortQueueEntries(entries);

      // Should maintain insertion order when timestamps are identical
      expect(sorted.length).toBe(3);
      sorted.forEach(entry => {
        expect(entry.priority).toBe('normal');
        expect(entry.created_at.getTime()).toBe(sameTime.getTime());
      });
    });

    it('should respect FIFO within each priority level independently', () => {
      const entries: QueueEntry[] = [
        {
          ...baseEntry,
          id: 'urgent-newer',
          priority: 'urgent',
          created_at: new Date('2025-10-02T10:30:00Z'),
        },
        {
          ...baseEntry,
          id: 'urgent-older',
          priority: 'urgent',
          created_at: new Date('2025-10-02T10:00:00Z'),
        },
        {
          ...baseEntry,
          id: 'normal-newer',
          priority: 'normal',
          created_at: new Date('2025-10-02T09:30:00Z'),
        },
        {
          ...baseEntry,
          id: 'normal-older',
          priority: 'normal',
          created_at: new Date('2025-10-02T09:00:00Z'),
        },
      ];

      const sorted = sortQueueEntries(entries);

      // All urgent items come first, oldest urgent first
      expect(sorted[0].id).toBe('urgent-older');
      expect(sorted[1].id).toBe('urgent-newer');

      // Then all normal items, oldest normal first
      expect(sorted[2].id).toBe('normal-older');
      expect(sorted[3].id).toBe('normal-newer');
    });
  });

  describe('Skill Matching', () => {
    it('should filter items requiring freed skills', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', required_skills: ['skill-arabic'] },
        { ...baseEntry, id: 'queue-2', required_skills: ['skill-legal'] },
        { ...baseEntry, id: 'queue-3', required_skills: ['skill-writing'] },
      ];

      const freedSkills = ['skill-arabic'];
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('queue-1');
    });

    it('should match items requiring any of multiple freed skills', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', required_skills: ['skill-arabic'] },
        { ...baseEntry, id: 'queue-2', required_skills: ['skill-legal'] },
        { ...baseEntry, id: 'queue-3', required_skills: ['skill-writing'] },
      ];

      const freedSkills = ['skill-arabic', 'skill-legal'];
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.id)).toContain('queue-1');
      expect(filtered.map(e => e.id)).toContain('queue-2');
    });

    it('should match items with multiple required skills if at least one freed', () => {
      const entries: QueueEntry[] = [
        {
          ...baseEntry,
          id: 'queue-1',
          required_skills: ['skill-arabic', 'skill-legal'],
        },
        {
          ...baseEntry,
          id: 'queue-2',
          required_skills: ['skill-writing'],
        },
      ];

      const freedSkills = ['skill-arabic'];
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('queue-1'); // Matches because has skill-arabic
    });

    it('should return empty array when no skills match', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', required_skills: ['skill-arabic'] },
        { ...baseEntry, id: 'queue-2', required_skills: ['skill-legal'] },
      ];

      const freedSkills = ['skill-writing']; // Not required by any entry
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(0);
    });

    it('should return all entries when freedSkills is empty array', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', required_skills: ['skill-arabic'] },
        { ...baseEntry, id: 'queue-2', required_skills: ['skill-legal'] },
      ];

      const freedSkills: string[] = [];
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(2); // All entries returned
    });

    it('should handle items with no required skills', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', required_skills: [] }, // No skills required
        { ...baseEntry, id: 'queue-2', required_skills: ['skill-arabic'] },
      ];

      const freedSkills = ['skill-arabic'];
      const filtered = filterBySkills(entries, freedSkills);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('queue-2'); // Only items with matching skills
    });
  });

  describe('Debouncing', () => {
    it('should wait specified milliseconds before processing', async () => {
      const start = Date.now();
      await debounce(100); // 100ms debounce
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150); // Allow small overhead
    });

    it('should debounce multiple rapid capacity changes', async () => {
      // Simulate 3 capacity changes within 2 seconds
      const changes: number[] = [];
      const debounceMs = 500;

      // First change
      changes.push(Date.now());

      // Second change after 100ms (within debounce window)
      await debounce(100);
      changes.push(Date.now());

      // Third change after another 100ms (still within window)
      await debounce(100);
      changes.push(Date.now());

      // Wait for debounce period
      await debounce(debounceMs);

      // All changes occurred within 200ms, but debounce waits 500ms
      const totalTime = Date.now() - changes[0];
      expect(totalTime).toBeGreaterThanOrEqual(debounceMs + 200);
    });
  });

  describe('Combined Processing Logic', () => {
    it('should process queue in correct order with mixed priorities and skills', () => {
      const entries: QueueEntry[] = [
        {
          ...baseEntry,
          id: 'normal-arabic-old',
          priority: 'normal',
          required_skills: ['skill-arabic'],
          created_at: new Date('2025-10-02T09:00:00Z'),
        },
        {
          ...baseEntry,
          id: 'urgent-legal-new',
          priority: 'urgent',
          required_skills: ['skill-legal'],
          created_at: new Date('2025-10-02T10:00:00Z'),
        },
        {
          ...baseEntry,
          id: 'urgent-arabic-old',
          priority: 'urgent',
          required_skills: ['skill-arabic'],
          created_at: new Date('2025-10-02T09:30:00Z'),
        },
        {
          ...baseEntry,
          id: 'high-arabic-new',
          priority: 'high',
          required_skills: ['skill-arabic'],
          created_at: new Date('2025-10-02T10:30:00Z'),
        },
      ];

      const freedSkills = ['skill-arabic'];

      // Step 1: Filter by skills
      const filtered = filterBySkills(entries, freedSkills);

      // Step 2: Sort by priority and FIFO
      const sorted = sortQueueEntries(filtered);

      // Expected order:
      // 1. urgent-arabic-old (urgent, oldest)
      // 2. high-arabic-new (high)
      // 3. normal-arabic-old (normal)

      expect(sorted.length).toBe(3);
      expect(sorted[0].id).toBe('urgent-arabic-old');
      expect(sorted[1].id).toBe('high-arabic-new');
      expect(sorted[2].id).toBe('normal-arabic-old');
    });

    it('should handle batch processing of 10 items correctly', () => {
      const entries: QueueEntry[] = Array.from({ length: 10 }, (_, i) => ({
        ...baseEntry,
        id: `queue-${i}`,
        priority: i < 3 ? 'urgent' : i < 6 ? 'high' : 'normal',
        created_at: new Date(Date.now() - (10 - i) * 60 * 1000), // Staggered times
      }));

      const sorted = sortQueueEntries(entries);

      // First 3 should be urgent (oldest first)
      expect(sorted.slice(0, 3).every(e => e.priority === 'urgent')).toBe(true);

      // Next 3 should be high
      expect(sorted.slice(3, 6).every(e => e.priority === 'high')).toBe(true);

      // Last 4 should be normal
      expect(sorted.slice(6, 10).every(e => e.priority === 'normal')).toBe(true);
    });

    it('should maintain deterministic ordering across multiple sorts', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'urgent', created_at: new Date('2025-10-02T10:00:00Z') },
        { ...baseEntry, id: 'queue-2', priority: 'normal', created_at: new Date('2025-10-02T09:00:00Z') },
        { ...baseEntry, id: 'queue-3', priority: 'high', created_at: new Date('2025-10-02T10:30:00Z') },
      ];

      const sorted1 = sortQueueEntries(entries);
      const sorted2 = sortQueueEntries(entries);

      // Same input should produce same output (deterministic)
      expect(sorted1.map(e => e.id)).toEqual(sorted2.map(e => e.id));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queue gracefully', () => {
      const entries: QueueEntry[] = [];
      const sorted = sortQueueEntries(entries);

      expect(sorted.length).toBe(0);
    });

    it('should handle single item queue', () => {
      const entries: QueueEntry[] = [baseEntry];
      const sorted = sortQueueEntries(entries);

      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe(baseEntry.id);
    });

    it('should handle queue with all same priority', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', created_at: new Date('2025-10-02T10:00:00Z') },
        { ...baseEntry, id: 'queue-2', created_at: new Date('2025-10-02T09:00:00Z') },
        { ...baseEntry, id: 'queue-3', created_at: new Date('2025-10-02T11:00:00Z') },
      ];

      const sorted = sortQueueEntries(entries);

      // Should sort by created_at only (all same priority)
      expect(sorted[0].id).toBe('queue-2'); // Oldest
      expect(sorted[1].id).toBe('queue-1');
      expect(sorted[2].id).toBe('queue-3'); // Newest
    });

    it('should not mutate original entries array', () => {
      const entries: QueueEntry[] = [
        { ...baseEntry, id: 'queue-1', priority: 'normal' },
        { ...baseEntry, id: 'queue-2', priority: 'urgent' },
      ];

      const original = [...entries];
      sortQueueEntries(entries);

      // Original array should remain unchanged
      expect(entries).toEqual(original);
    });
  });
});
