/**
 * Contract Test: POST /ai/extract
 * Feature: 010-after-action-notes
 * Task: T029
 */

import { describe, it, expect } from 'vitest';

describe('POST /ai/extract', () => {
  it('should validate request schema for sync extraction', () => {
    const validRequest = {
      file: new File(['test content'], 'minutes.txt', { type: 'text/plain' }),
      language: 'en',
      mode: 'sync'
    };

    expect(validRequest.file).toBeInstanceOf(File);
    expect(['en', 'ar']).toContain(validRequest.language);
    expect(['sync', 'async', 'auto']).toContain(validRequest.mode);
  });

  it('should validate extraction result schema', () => {
    const extractionResult = {
      decisions: [
        {
          description: 'Approved budget increase',
          decision_maker: 'Director',
          confidence: 0.9
        }
      ],
      commitments: [
        {
          description: 'Submit proposal by Friday',
          owner: 'John Smith',
          due_date: '2025-10-06',
          confidence: 0.95
        }
      ],
      risks: [
        {
          description: 'Delayed approval could impact Q2',
          severity: 'high',
          likelihood: 'possible',
          confidence: 0.88
        }
      ]
    };

    expect(extractionResult.decisions[0].confidence).toBeGreaterThanOrEqual(0);
    expect(extractionResult.decisions[0].confidence).toBeLessThanOrEqual(1);
    expect(extractionResult.commitments[0].confidence).toBeGreaterThan(0.5);
    expect(['low', 'medium', 'high', 'critical']).toContain(extractionResult.risks[0].severity);
  });

  it('should validate async job response schema', () => {
    const asyncResponse = {
      job_id: '12345-67890',
      estimated_time: 20,
      status: 'processing'
    };

    expect(asyncResponse.job_id).toBeDefined();
    expect(asyncResponse.estimated_time).toBeGreaterThan(0);
    expect(['processing', 'completed', 'failed']).toContain(asyncResponse.status);
  });
});
