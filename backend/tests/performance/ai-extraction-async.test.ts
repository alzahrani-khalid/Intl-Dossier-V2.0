import { describe, it, expect } from 'vitest';

/**
 * Performance Test: AI Extraction (Async Mode)
 * Reference: quickstart.md lines 802-806
 * Target: <30 sec for 2MB scanned PDF
 */

describe('Performance: AI Extraction (Async)', () => {
  const API_URL = process.env.SUPABASE_URL || 'http://localhost:54321';

  // Create 2MB test PDF mock
  const largePdfContent = Buffer.alloc(2 * 1024 * 1024, 'PDF');
  const testFile = new Blob([largePdfContent], { type: 'application/pdf' });

  it('should extract from 2MB PDF in <30 seconds', async () => {
    const formData = new FormData();
    formData.append('file', testFile, 'large-document.pdf');
    formData.append('language', 'en');
    formData.append('mode', 'async');

    const startTime = Date.now();

    // Submit extraction job
    const submitResponse = await fetch(`${API_URL}/functions/v1/ai-extract`, {
      method: 'POST',
      body: formData
    });

    expect(submitResponse.status).toBe(202); // Async mode returns 202
    const { job_id } = await submitResponse.json();
    expect(job_id).toBeDefined();

    // Poll for completion
    let completed = false;
    let result;

    while (!completed && (Date.now() - startTime) < 35000) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 sec

      const statusResponse = await fetch(`${API_URL}/functions/v1/ai-extract-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id })
      });

      result = await statusResponse.json();

      if (result.status === 'completed' || result.status === 'failed') {
        completed = true;
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Async AI Extraction Duration: ${duration.toFixed(2)}s`);

    expect(duration).toBeLessThan(30);
    expect(result.status).toBe('completed');
  }, 40000);
});
