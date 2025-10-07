import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

/**
 * Performance Test: PDF Generation
 * Reference: quickstart.md lines 808-812
 * Target: <3 sec for typical after-action (5 decisions, 8 commitments, 3 risks)
 */

describe('Performance: PDF Generation', () => {
  const API_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  const TEST_AFTER_ACTION_ID = '33333333-3333-3333-3333-333333333333';

  it('should generate PDF in <3 seconds', async () => {
    const startTime = performance.now();

    const response = await fetch(`${API_URL}/functions/v1/pdf-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        after_action_id: TEST_AFTER_ACTION_ID,
        language: 'both'
      })
    });

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`PDF Generation Duration: ${duration.toFixed(2)}s`);

    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(3);

    const result = await response.json();
    expect(result.pdf_url).toBeDefined();
    expect(result.pdf_url).toMatch(/\.pdf/);
  }, 10000);
});
