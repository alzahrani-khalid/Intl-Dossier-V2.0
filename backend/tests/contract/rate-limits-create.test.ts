import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/rate-limits/policies', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create rate limit policy with required fields', async () => {
    const policyData = {
      name: 'Test Rate Limit Policy',
      requests_per_minute: 300,
      burst_capacity: 50,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 60,
      enabled: true
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(policyData.name);
    expect(data.requests_per_minute).toBe(policyData.requests_per_minute);
    expect(data.burst_capacity).toBe(policyData.burst_capacity);
    expect(data.applies_to).toBe(policyData.applies_to);
    expect(data.endpoint_type).toBe(policyData.endpoint_type);
    expect(data.retry_after_seconds).toBe(policyData.retry_after_seconds);
    expect(data.enabled).toBe(policyData.enabled);
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
  });

  it('should create policy for anonymous users', async () => {
    const policyData = {
      name: 'Anonymous Rate Limit',
      requests_per_minute: 50,
      burst_capacity: 10,
      applies_to: 'anonymous',
      endpoint_type: 'api',
      retry_after_seconds: 120
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.applies_to).toBe('anonymous');
    expect(data.requests_per_minute).toBe(50);
    expect(data.burst_capacity).toBe(10);
  });

  it('should create policy for specific role', async () => {
    const policyData = {
      name: 'Admin Rate Limit',
      requests_per_minute: 1000,
      burst_capacity: 100,
      applies_to: 'role',
      role_id: 'admin-role-id',
      endpoint_type: 'all',
      retry_after_seconds: 30
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.applies_to).toBe('role');
    expect(data.role_id).toBe(policyData.role_id);
    expect(data.endpoint_type).toBe('all');
  });

  it('should create policy with description', async () => {
    const policyData = {
      name: 'Policy with Description',
      description: 'This is a test policy with description',
      requests_per_minute: 200,
      burst_capacity: 25,
      applies_to: 'authenticated',
      endpoint_type: 'upload',
      retry_after_seconds: 90
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.description).toBe(policyData.description);
    expect(data.endpoint_type).toBe('upload');
  });

  it('should use default values for optional fields', async () => {
    const policyData = {
      name: 'Policy with Defaults',
      requests_per_minute: 100,
      burst_capacity: 20,
      applies_to: 'authenticated',
      endpoint_type: 'api'
      // retry_after_seconds and enabled should use defaults
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.retry_after_seconds).toBe(60); // Default value
    expect(data.enabled).toBe(true); // Default value
  });

  it('should validate required fields', async () => {
    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('details');
  });

  it('should validate requests_per_minute minimum value', async () => {
    const policyData = {
      name: 'Invalid Policy',
      requests_per_minute: 0, // Invalid: should be >= 1
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate burst_capacity minimum value', async () => {
    const policyData = {
      name: 'Invalid Burst Policy',
      requests_per_minute: 100,
      burst_capacity: -1, // Invalid: should be >= 0
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate applies_to enum values', async () => {
    const policyData = {
      name: 'Invalid Applies To',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'invalid', // Invalid enum value
      endpoint_type: 'api'
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate endpoint_type enum values', async () => {
    const policyData = {
      name: 'Invalid Endpoint Type',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'invalid' // Invalid enum value
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate retry_after_seconds range', async () => {
    const policyData = {
      name: 'Invalid Retry After',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 5000 // Invalid: should be 1-3600
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate role_id is required when applies_to is role', async () => {
    const policyData = {
      name: 'Role Policy Without Role ID',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'role',
      endpoint_type: 'api'
      // Missing role_id
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(400);
  });

  it('should handle special characters in policy name', async () => {
    const policyData = {
      name: 'Policy with Special Chars: !@#$%^&*()',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.name).toBe(policyData.name);
  });

  it('should handle very long policy names', async () => {
    const longName = 'A'.repeat(1000); // Very long name
    const policyData = {
      name: longName,
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData),
    });

    // Should either succeed or fail with appropriate error
    expect([201, 400]).toContain(response.status);
  });
});
