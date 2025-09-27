import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: PUT /api/rate-limits/policies/{id}', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should update existing rate limit policy', async () => {
    // First create a policy
    const createData = {
      name: 'Original Policy',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 60,
      enabled: true
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Now update the policy
    const updateData = {
      name: 'Updated Policy Name',
      requests_per_minute: 200,
      burst_capacity: 25,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 90,
      enabled: false
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(policyId);
    expect(data.name).toBe(updateData.name);
    expect(data.requests_per_minute).toBe(updateData.requests_per_minute);
    expect(data.burst_capacity).toBe(updateData.burst_capacity);
    expect(data.retry_after_seconds).toBe(updateData.retry_after_seconds);
    expect(data.enabled).toBe(updateData.enabled);
    expect(data).toHaveProperty('updated_at');
  });

  it('should update policy description', async () => {
    // First create a policy
    const createData = {
      name: 'Policy for Description Update',
      requests_per_minute: 150,
      burst_capacity: 15,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Update with description
    const updateData = {
      name: 'Policy for Description Update',
      description: 'Updated description for the policy',
      requests_per_minute: 150,
      burst_capacity: 15,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.description).toBe(updateData.description);
  });

  it('should update policy applies_to from authenticated to anonymous', async () => {
    // First create a policy for authenticated users
    const createData = {
      name: 'Policy to Change Applies To',
      requests_per_minute: 300,
      burst_capacity: 50,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Update to apply to anonymous users
    const updateData = {
      name: 'Policy to Change Applies To',
      requests_per_minute: 50,
      burst_capacity: 10,
      applies_to: 'anonymous',
      endpoint_type: 'api'
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.applies_to).toBe('anonymous');
    expect(data.requests_per_minute).toBe(50);
    expect(data.burst_capacity).toBe(10);
  });

  it('should update policy to apply to specific role', async () => {
    // First create a policy
    const createData = {
      name: 'Policy to Change to Role',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Update to apply to specific role
    const updateData = {
      name: 'Policy to Change to Role',
      requests_per_minute: 1000,
      burst_capacity: 100,
      applies_to: 'role',
      role_id: 'admin-role-id',
      endpoint_type: 'all'
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.applies_to).toBe('role');
    expect(data.role_id).toBe(updateData.role_id);
    expect(data.endpoint_type).toBe('all');
  });

  it('should return 404 for non-existent policy ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const updateData = {
      name: 'Non-existent Policy',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request(`/api/rate-limits/policies/${nonExistentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Resource not found');
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'invalid-uuid';
    const updateData = {
      name: 'Invalid ID Policy',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request(`/api/rate-limits/policies/${invalidId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate required fields on update', async () => {
    // First create a policy
    const createData = {
      name: 'Policy for Validation Test',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Try to update with missing required fields
    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });

  it('should validate field ranges on update', async () => {
    // First create a policy
    const createData = {
      name: 'Policy for Range Validation',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Try to update with invalid values
    const updateData = {
      name: 'Policy for Range Validation',
      requests_per_minute: 0, // Invalid: should be >= 1
      burst_capacity: -1, // Invalid: should be >= 0
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 5000 // Invalid: should be 1-3600
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate enum values on update', async () => {
    // First create a policy
    const createData = {
      name: 'Policy for Enum Validation',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Try to update with invalid enum values
    const updateData = {
      name: 'Policy for Enum Validation',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'invalid', // Invalid enum
      endpoint_type: 'invalid' // Invalid enum
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(400);
  });

  it('should update only provided fields (partial update)', async () => {
    // First create a policy
    const createData = {
      name: 'Original Policy Name',
      description: 'Original description',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api',
      retry_after_seconds: 60,
      enabled: true
    };

    const createResponse = await server.request('/api/rate-limits/policies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    });

    expect(createResponse.status).toBe(201);
    const createdPolicy = await createResponse.json();
    const policyId = createdPolicy.id;

    // Update only the name
    const updateData = {
      name: 'Updated Policy Name Only',
      requests_per_minute: 100,
      burst_capacity: 10,
      applies_to: 'authenticated',
      endpoint_type: 'api'
    };

    const response = await server.request(`/api/rate-limits/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.name).toBe(updateData.name);
    expect(data.description).toBe(createData.description); // Should remain unchanged
    expect(data.retry_after_seconds).toBe(createData.retry_after_seconds); // Should remain unchanged
    expect(data.enabled).toBe(createData.enabled); // Should remain unchanged
  });
});
