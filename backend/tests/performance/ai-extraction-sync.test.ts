import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

/**
 * Performance Test: AI Extraction (Sync Mode)
 * Reference: quickstart.md lines 796-800
 * Target: <5 sec for 50KB plain text
 */

describe('Performance: AI Extraction (Sync)', () => {
  const API_URL = process.env.SUPABASE_URL || 'http://localhost:54321';

  // Create 50KB test content
  const testContent = `Q1 Meeting Notes\n${'Decision: Approved X\n'.repeat(500)}`;
  const testFile = new Blob([testContent], { type: 'text/plain' });

  it('should extract from 50KB file in <5 seconds', async () => {
    const formData = new FormData();
    formData.append('file', testFile, 'meeting-notes.txt');
    formData.append('language', 'en');
    formData.append('mode', 'sync');

    const startTime = performance.now();

    const response = await fetch(`${API_URL}/functions/v1/ai-extract`, {
      method: 'POST',
      body: formData
    });

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    console.log(`AI Extraction Duration: ${duration.toFixed(2)}s`);

    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(5);

    const result = await response.json();
    expect(result.decisions).toBeDefined();
    expect(result.commitments).toBeDefined();
  }, 10000);
});
