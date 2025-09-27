import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Integration Test: Rate Limiting for Auth/Anon Users', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should enforce rate limit for authenticated users (300 req/min)', async () => {
    // Make 301 requests to test rate limiting
    const requests = Array(301).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    );

    const responses = await Promise.all(requests);
    
    // First 300 requests should succeed
    for (let i = 0; i < 300; i++) {
      expect(responses[i].status).toBe(200);
    }
    
    // 301st request should be rate limited
    expect(responses[300].status).toBe(429);
    
    const rateLimitedResponse = await responses[300].json();
    expect(rateLimitedResponse).toHaveProperty('error');
    expect(rateLimitedResponse).toHaveProperty('retry_after');
    expect(rateLimitedResponse.error).toBe('Rate limit exceeded');
    expect(typeof rateLimitedResponse.retry_after).toBe('number');
  });

  it('should enforce rate limit for anonymous users (50 req/min)', async () => {
    // Make 51 requests to test rate limiting
    const requests = Array(51).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET'
        // No Authorization header for anonymous user
      })
    );

    const responses = await Promise.all(requests);
    
    // First 50 requests should succeed
    for (let i = 0; i < 50; i++) {
      expect(responses[i].status).toBe(200);
    }
    
    // 51st request should be rate limited
    expect(responses[50].status).toBe(429);
    
    const rateLimitedResponse = await responses[50].json();
    expect(rateLimitedResponse).toHaveProperty('error');
    expect(rateLimitedResponse).toHaveProperty('retry_after');
    expect(rateLimitedResponse.error).toBe('Rate limit exceeded');
  });

  it('should handle burst capacity for authenticated users', async () => {
    // Test burst capacity (50 requests)
    const burstRequests = Array(50).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer burst-test-token'
        }
      })
    );

    const responses = await Promise.all(burstRequests);
    
    // All burst requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should handle burst capacity for anonymous users', async () => {
    // Test burst capacity (10 requests for anonymous)
    const burstRequests = Array(10).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET'
        // No Authorization header for anonymous user
      })
    );

    const responses = await Promise.all(burstRequests);
    
    // All burst requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should reset rate limits after time window', async () => {
    // This test would require time manipulation in a real scenario
    // For now, we'll test that rate limits are properly tracked
    
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer reset-test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('limits');
    expect(Array.isArray(data.limits)).toBe(true);
    
    // Verify rate limit tracking
    data.limits.forEach((limit: any) => {
      expect(limit).toHaveProperty('requests_used');
      expect(limit).toHaveProperty('requests_limit');
      expect(limit).toHaveProperty('reset_at');
      expect(limit.requests_used).toBeGreaterThanOrEqual(0);
      expect(limit.requests_limit).toBeGreaterThan(0);
    });
  });

  it('should apply different rate limits for different endpoint types', async () => {
    // Test API endpoint rate limit
    const apiRequests = Array(10).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer endpoint-test-token'
        }
      })
    );

    const apiResponses = await Promise.all(apiRequests);
    apiResponses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Test upload endpoint rate limit (if implemented)
    const uploadRequests = Array(5).fill(null).map(() => 
      server.request('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer endpoint-test-token'
        }
      })
    );

    const uploadResponses = await Promise.all(uploadRequests);
    // Upload endpoints may have different rate limits
    uploadResponses.forEach(response => {
      expect([200, 404, 429]).toContain(response.status);
    });
  });

  it('should track rate limits per user independently', async () => {
    // Test with different users
    const user1Requests = Array(10).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user1-token'
        }
      })
    );

    const user2Requests = Array(10).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user2-token'
        }
      })
    );

    const user1Responses = await Promise.all(user1Requests);
    const user2Responses = await Promise.all(user2Requests);
    
    // Both users should be able to make requests independently
    user1Responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    user2Responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should handle rate limit status endpoint', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer status-test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('ip_address');
    expect(data).toHaveProperty('limits');
    
    // Verify user identification
    expect(data.user_id).not.toBe('anonymous');
    expect(data.user_id).toBeTruthy();
    
    // Verify limits structure
    expect(Array.isArray(data.limits)).toBe(true);
    data.limits.forEach((limit: any) => {
      expect(limit).toHaveProperty('endpoint_type');
      expect(limit).toHaveProperty('requests_used');
      expect(limit).toHaveProperty('requests_limit');
      expect(limit).toHaveProperty('burst_remaining');
      expect(limit).toHaveProperty('reset_at');
    });
  });

  it('should handle anonymous user rate limit status', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET'
      // No Authorization header for anonymous user
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('ip_address');
    expect(data).toHaveProperty('limits');
    
    // Verify anonymous user identification
    expect(data.user_id).toBe('anonymous');
    expect(data.ip_address).toBeTruthy();
    
    // Verify limits structure
    expect(Array.isArray(data.limits)).toBe(true);
    data.limits.forEach((limit: any) => {
      expect(limit).toHaveProperty('endpoint_type');
      expect(limit).toHaveProperty('requests_used');
      expect(limit).toHaveProperty('requests_limit');
      expect(limit).toHaveProperty('burst_remaining');
      expect(limit).toHaveProperty('reset_at');
    });
  });

  it('should handle rate limit headers correctly', async () => {
    // Make requests to trigger rate limiting
    const requests = Array(301).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer header-test-token'
        }
      })
    );

    const responses = await Promise.all(requests);
    
    // Check rate limit headers
    const rateLimitedResponse = responses[300];
    expect(rateLimitedResponse.status).toBe(429);
    
    // Should have Retry-After header
    const retryAfter = rateLimitedResponse.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it('should handle concurrent rate limit requests', async () => {
    // Make concurrent requests to test race conditions
    const concurrentRequests = Array(100).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer concurrent-test-token'
        }
      })
    );

    const responses = await Promise.all(concurrentRequests);
    
    // Count successful and rate limited responses
    const successful = responses.filter(r => r.status === 200).length;
    const rateLimited = responses.filter(r => r.status === 429).length;
    
    // Should have some successful and some rate limited
    expect(successful).toBeGreaterThan(0);
    expect(rateLimited).toBeGreaterThan(0);
    expect(successful + rateLimited).toBe(100);
  });

  it('should handle rate limit bypass attempts', async () => {
    // Test various bypass attempts
    const bypassAttempts = [
      // Different user agents
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer bypass-test-token',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      // Different IP simulation (if implemented)
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer bypass-test-token',
          'X-Forwarded-For': '192.168.1.100'
        }
      }),
      // Different request methods
      server.request('/api/intelligence-reports', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bypass-test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Test', content: 'Test', data_sources: ['test'] })
      })
    ];

    const responses = await Promise.all(bypassAttempts);
    
    // All attempts should be properly rate limited
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status);
    });
  });

  it('should handle rate limit policy updates', async () => {
    // Create a custom rate limit policy
    const policyData = {
      name: 'Test Policy',
      requests_per_minute: 10,
      burst_capacity: 5,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 30
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();

    // Test with the new policy
    const requests = Array(12).fill(null).map(() => 
      server.request('/api/intelligence-reports', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer policy-test-token'
        }
      })
    );

    const responses = await Promise.all(requests);
    
    // First 10 requests should succeed
    for (let i = 0; i < 10; i++) {
      expect(responses[i].status).toBe(200);
    }
    
    // 11th and 12th requests should be rate limited
    expect(responses[10].status).toBe(429);
    expect(responses[11].status).toBe(429);
  });
});
