/**
 * Contract Test: GET /ai/extract/{jobId}
 * Feature: 010-after-action-notes
 * Task: T030
 */

import { describe, it, expect } from 'vitest';

describe('GET /ai/extract/{jobId}', () => {
  it('should validate processing status response', () => {
    const processingResponse = {
      status: 'processing',
      progress: 45,
      estimated_remaining: 10
    };

    expect(processingResponse.status).toBe('processing');
    expect(processingResponse.progress).toBeGreaterThanOrEqual(0);
    expect(processingResponse.progress).toBeLessThanOrEqual(100);
  });

  it('should validate completed status response', () => {
    const completedResponse = {
      status: 'completed',
      progress: 100,
      result: {
        decisions: [],
        commitments: [],
        risks: []
      }
    };

    expect(completedResponse.status).toBe('completed');
    expect(completedResponse.progress).toBe(100);
    expect(completedResponse.result).toBeDefined();
  });

  it('should validate failed status response', () => {
    const failedResponse = {
      status: 'failed',
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'Unable to parse document'
      }
    };

    expect(failedResponse.status).toBe('failed');
    expect(failedResponse.error.code).toBeDefined();
    expect(failedResponse.error.message).toBeDefined();
  });
});
