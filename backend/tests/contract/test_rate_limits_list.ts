import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: GET /api/rate-limits/policies', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return list of rate limit policies', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should filter policies by applies_to parameter', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=authenticated', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned policies should apply to authenticated users
    data.data.forEach((policy: any) => {
      expect(policy.applies_to).toBe('authenticated');
    });
  });

  it('should filter policies by anonymous applies_to', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=anonymous', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned policies should apply to anonymous users
    data.data.forEach((policy: any) => {
      expect(policy.applies_to).toBe('anonymous');
    });
  });

  it('should filter policies by role applies_to', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=role', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned policies should apply to roles
    data.data.forEach((policy: any) => {
      expect(policy.applies_to).toBe('role');
    });
  });

  it('should validate applies_to enum values', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=invalid', {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });

  it('should return policies with all required fields', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    if (data.data.length > 0) {
      const policy = data.data[0];
      expect(policy).toHaveProperty('id');
      expect(policy).toHaveProperty('name');
      expect(policy).toHaveProperty('requests_per_minute');
      expect(policy).toHaveProperty('burst_capacity');
      expect(policy).toHaveProperty('applies_to');
      expect(policy).toHaveProperty('endpoint_type');
      expect(policy).toHaveProperty('retry_after_seconds');
      expect(policy).toHaveProperty('enabled');
      expect(policy).toHaveProperty('created_at');
      expect(policy).toHaveProperty('updated_at');
    }
  });

  it('should validate applies_to enum values in response', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((policy: any) => {
      expect(['authenticated', 'anonymous', 'role']).toContain(policy.applies_to);
    });
  });

  it('should validate endpoint_type enum values in response', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((policy: any) => {
      expect(['api', 'upload', 'report', 'all']).toContain(policy.endpoint_type);
    });
  });

  it('should validate numeric field ranges', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((policy: any) => {
      expect(policy.requests_per_minute).toBeGreaterThan(0);
      expect(policy.burst_capacity).toBeGreaterThanOrEqual(0);
      expect(policy.retry_after_seconds).toBeGreaterThanOrEqual(1);
      expect(policy.retry_after_seconds).toBeLessThanOrEqual(3600);
    });
  });

  it('should handle empty policy list', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    // Empty array is valid
  });

  it('should return policies with role_id when applies_to is role', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=role', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((policy: any) => {
      if (policy.applies_to === 'role') {
        expect(policy).toHaveProperty('role_id');
        expect(policy.role_id).toBeTruthy();
      }
    });
  });

  it('should not return role_id for non-role policies', async () => {
    const response = await server.request('/api/rate-limits/policies?applies_to=authenticated', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    data.data.forEach((policy: any) => {
      if (policy.applies_to !== 'role') {
        expect(policy.role_id).toBeUndefined();
      }
    });
  });
});
