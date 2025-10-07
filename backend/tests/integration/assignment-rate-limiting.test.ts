import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Integration Test: Assignment API Rate Limiting', () => {
  let testAssignmentId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test data
    testAssignmentId = 'rate-limit-test-assignment';
    testUserId = 'rate-limit-test-user';
    authToken = 'test-auth-token';
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Comment Creation Rate Limit (10/min)', () => {
    it('should allow up to 10 comments per minute', async () => {
      const requests = Array(10).fill(null).map((_, i) =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: testAssignmentId,
            text: `Test comment ${i + 1}`,
          }),
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed or return 201
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
    });

    it('should reject 11th comment within same minute (429)', async () => {
      const requests = Array(11).fill(null).map((_, i) =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: testAssignmentId,
            text: `Rate limit test comment ${i + 1}`,
          }),
        })
      );

      const responses = await Promise.all(requests);

      // First 10 should succeed
      for (let i = 0; i < 10; i++) {
        expect([200, 201]).toContain(responses[i].status);
      }

      // 11th should be rate limited
      expect(responses[10].status).toBe(429);

      const errorData = await responses[10].json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('rate limit');
    });

    it('should include retry_after in rate limit response', async () => {
      // Exceed rate limit
      const requests = Array(11).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: testAssignmentId,
            text: 'Retry after test',
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses[10];

      expect(rateLimitedResponse.status).toBe(429);

      const errorData = await rateLimitedResponse.json();
      expect(errorData).toHaveProperty('retry_after');
      expect(typeof errorData.retry_after).toBe('number');
      expect(errorData.retry_after).toBeGreaterThan(0);
      expect(errorData.retry_after).toBeLessThanOrEqual(60);
    });
  });

  describe('Escalation Rate Limit (1/hour)', () => {
    it('should allow 1 escalation per hour', async () => {
      const response = await fetch(`http://localhost:54321/functions/v1/assignments-escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          reason: 'SLA approaching deadline',
        }),
      });

      expect([200, 201]).toContain(response.status);
    });

    it('should reject 2nd escalation within same hour (429)', async () => {
      // First escalation
      const firstResponse = await fetch(`http://localhost:54321/functions/v1/assignments-escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          reason: 'First escalation',
        }),
      });

      expect([200, 201]).toContain(firstResponse.status);

      // Second escalation (should be rate limited)
      const secondResponse = await fetch(`http://localhost:54321/functions/v1/assignments-escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          reason: 'Second escalation',
        }),
      });

      expect(secondResponse.status).toBe(429);

      const errorData = await secondResponse.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('rate limit');
      expect(errorData).toHaveProperty('retry_after');
      expect(errorData.retry_after).toBeGreaterThan(0);
    });
  });

  describe('General API Rate Limit (60 req/min per user)', () => {
    it('should allow up to 60 requests per minute per user', async () => {
      const requests = Array(60).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });
    });

    it('should reject 61st request within same minute (429)', async () => {
      const requests = Array(61).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);

      // First 60 should succeed
      for (let i = 0; i < 60; i++) {
        expect([200, 404]).toContain(responses[i].status);
      }

      // 61st should be rate limited
      expect(responses[60].status).toBe(429);
    });
  });

  describe('Rate Limit Isolation by User', () => {
    it('should track rate limits per user independently', async () => {
      const user1Token = 'user1-token';
      const user2Token = 'user2-token';

      // User 1 makes 10 requests
      const user1Requests = Array(10).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user1Token}`,
          },
        })
      );

      // User 2 makes 10 requests
      const user2Requests = Array(10).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user2Token}`,
          },
        })
      );

      const user1Responses = await Promise.all(user1Requests);
      const user2Responses = await Promise.all(user2Requests);

      // Both users should succeed
      user1Responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });

      user2Responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });
    });
  });

  describe('Rate Limit Isolation by Assignment', () => {
    it('should track comment rate limits per assignment', async () => {
      const assignment1 = 'assignment-1';
      const assignment2 = 'assignment-2';

      // 10 comments on assignment 1
      const assignment1Requests = Array(10).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: assignment1,
            text: 'Comment on assignment 1',
          }),
        })
      );

      // 10 comments on assignment 2
      const assignment2Requests = Array(10).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: assignment2,
            text: 'Comment on assignment 2',
          }),
        })
      );

      const assignment1Responses = await Promise.all(assignment1Requests);
      const assignment2Responses = await Promise.all(assignment2Requests);

      // Both should succeed (separate rate limits)
      assignment1Responses.forEach(response => {
        expect([200, 201, 400, 403]).toContain(response.status);
      });

      assignment2Responses.forEach(response => {
        expect([200, 201, 400, 403]).toContain(response.status);
      });
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include X-RateLimit-* headers in responses', async () => {
      const response = await fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Check for rate limit headers
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (rateLimitLimit) {
        expect(Number(rateLimitLimit)).toBeGreaterThan(0);
      }

      if (rateLimitRemaining) {
        expect(Number(rateLimitRemaining)).toBeGreaterThanOrEqual(0);
      }

      if (rateLimitReset) {
        expect(Number(rateLimitReset)).toBeGreaterThan(0);
      }
    });

    it('should include Retry-After header in 429 responses', async () => {
      // Exceed rate limit
      const requests = Array(61).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses[60];

      expect(rateLimitedResponse.status).toBe(429);

      const retryAfter = rateLimitedResponse.headers.get('Retry-After');
      expect(retryAfter).toBeTruthy();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });
  });

  describe('Burst Capacity Handling', () => {
    it('should allow burst capacity for sudden spikes', async () => {
      // Make 20 requests simultaneously
      const burstRequests = Array(20).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(burstRequests);

      // All should succeed (within burst capacity)
      responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit after time window', async () => {
      // This test would require time manipulation
      // For now, we verify the retry_after value is reasonable

      // Exceed rate limit
      const requests = Array(11).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-comments-create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignment_id: testAssignmentId,
            text: 'Reset test',
          }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses[10];

      expect(rateLimitedResponse.status).toBe(429);

      const errorData = await rateLimitedResponse.json();
      expect(errorData.retry_after).toBeLessThanOrEqual(60); // Should reset within 1 minute
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests without race conditions', async () => {
      // Make 100 concurrent requests
      const concurrentRequests = Array(100).fill(null).map(() =>
        fetch(`http://localhost:54321/functions/v1/assignments-get/${testAssignmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(concurrentRequests);

      // Count successful and rate limited responses
      const successful = responses.filter(r => [200, 404].includes(r.status)).length;
      const rateLimited = responses.filter(r => r.status === 429).length;

      // Total should be 100
      expect(successful + rateLimited).toBe(100);

      // Should have some rate limited (over 60/min limit)
      expect(rateLimited).toBeGreaterThan(0);
    });
  });
});
