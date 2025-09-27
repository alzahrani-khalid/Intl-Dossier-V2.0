import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: GET /api/intelligence-reports', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return list of intelligence reports with pagination', async () => {
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
    
    // Validate pagination structure
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('page_size');
    expect(data.pagination).toHaveProperty('total_pages');
    expect(data.pagination).toHaveProperty('total_items');
  });

  it('should filter by status parameter', async () => {
    const response = await server.request('/api/intelligence-reports?status=approved', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
    
    // All returned reports should have approved status
    data.data.forEach((report: any) => {
      expect(report.review_status).toBe('approved');
    });
  });

  it('should handle pagination parameters', async () => {
    const response = await server.request('/api/intelligence-reports?page=2&page_size=10', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.page_size).toBe(10);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // This test will fail initially as rate limiting is not implemented
    // It's here to define the expected behavior
    const response = await server.request('/api/intelligence-reports', {
      method: 'GET',
    });

    // Initially this will be 200, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
    expect(data.error).toBe('Rate limit exceeded');
  });

  it('should validate page_size enum values', async () => {
    const response = await server.request('/api/intelligence-reports?page_size=25', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.pagination.page_size).toBe(25);
  });

  it('should reject invalid page_size values', async () => {
    const response = await server.request('/api/intelligence-reports?page_size=99', {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });

  it('should validate status enum values', async () => {
    const response = await server.request('/api/intelligence-reports?status=invalid', {
      method: 'GET',
    });

    expect(response.status).toBe(400);
  });
});
