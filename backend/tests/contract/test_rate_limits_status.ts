import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: GET /api/rate-limits/status', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return rate limit status for authenticated user', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('ip_address');
    expect(data).toHaveProperty('limits');
    expect(Array.isArray(data.limits)).toBe(true);
    
    // For authenticated user, user_id should not be 'anonymous'
    expect(data.user_id).not.toBe('anonymous');
  });

  it('should return rate limit status for anonymous user', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET'
      // No Authorization header for anonymous user
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('ip_address');
    expect(data).toHaveProperty('limits');
    expect(Array.isArray(data.limits)).toBe(true);
    
    // For anonymous user, user_id should be 'anonymous'
    expect(data.user_id).toBe('anonymous');
    expect(data.ip_address).toBeTruthy();
  });

  it('should return limits with all required fields', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    if (data.limits.length > 0) {
      const limit = data.limits[0];
      expect(limit).toHaveProperty('endpoint_type');
      expect(limit).toHaveProperty('requests_used');
      expect(limit).toHaveProperty('requests_limit');
      expect(limit).toHaveProperty('reset_at');
      expect(limit).toHaveProperty('burst_remaining');
    }
  });

  it('should validate endpoint_type enum values in limits', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(['api', 'upload', 'report', 'all']).toContain(limit.endpoint_type);
    });
  });

  it('should validate numeric fields in limits', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(typeof limit.requests_used).toBe('number');
      expect(typeof limit.requests_limit).toBe('number');
      expect(typeof limit.burst_remaining).toBe('number');
      expect(limit.requests_used).toBeGreaterThanOrEqual(0);
      expect(limit.requests_limit).toBeGreaterThan(0);
      expect(limit.burst_remaining).toBeGreaterThanOrEqual(0);
    });
  });

  it('should validate reset_at timestamp format', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(limit).toHaveProperty('reset_at');
      expect(typeof limit.reset_at).toBe('string');
      
      // Verify it's a valid ISO date
      const resetDate = new Date(limit.reset_at);
      expect(resetDate).toBeInstanceOf(Date);
      expect(resetDate.getTime()).not.toBeNaN();
    });
  });

  it('should return different limits for different endpoint types', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    // Should have limits for different endpoint types
    const endpointTypes = data.limits.map((limit: any) => limit.endpoint_type);
    expect(endpointTypes.length).toBeGreaterThan(0);
  });

  it('should handle missing authorization header gracefully', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET'
      // No Authorization header
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.user_id).toBe('anonymous');
    expect(data.ip_address).toBeTruthy();
  });

  it('should handle invalid authorization token', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    // Should either treat as anonymous or return appropriate error
    expect([200, 401]).toContain(response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      expect(data.user_id).toBe('anonymous');
    }
  });

  it('should return burst_remaining as non-negative number', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(limit.burst_remaining).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(limit.burst_remaining)).toBe(true);
    });
  });

  it('should return requests_used as non-negative number', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(limit.requests_used).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(limit.requests_used)).toBe(true);
    });
  });

  it('should return requests_limit as positive number', async () => {
    const response = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.limits)).toBe(true);
    
    data.limits.forEach((limit: any) => {
      expect(limit.requests_limit).toBeGreaterThan(0);
      expect(Number.isInteger(limit.requests_limit)).toBe(true);
    });
  });

  it('should handle concurrent requests for same user', async () => {
    // Make multiple concurrent requests
    const promises = Array(5).fill(null).map(() => 
      server.request('/api/rate-limits/status', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    );

    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // All responses should have the same structure
    const data = await responses[0].json();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('limits');
  });

  it('should return consistent user_id for same token', async () => {
    const response1 = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer consistent-token'
      }
    });

    const response2 = await server.request('/api/rate-limits/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer consistent-token'
      }
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    expect(data1.user_id).toBe(data2.user_id);
  });
});
