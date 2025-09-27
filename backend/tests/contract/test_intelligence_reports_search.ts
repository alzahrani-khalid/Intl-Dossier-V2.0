import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../setup';
import type { TestServer } from '../setup';

describe('Contract Test: POST /api/intelligence-reports/search', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should search reports with basic query', async () => {
    const searchData = {
      query: 'security threat analysis',
      similarity_threshold: 0.8,
      timeout_ms: 2000
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('partial_results');
    expect(data).toHaveProperty('failed_filters');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.partial_results).toBe('boolean');
    expect(Array.isArray(data.failed_filters)).toBe(true);
  });

  it('should search with filters', async () => {
    const searchData = {
      query: 'terrorism threat',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        status: ['approved'],
        priority: ['high', 'critical'],
        custom_tags: ['urgent', 'verified'],
        filter_logic: 'AND'
      },
      similarity_threshold: 0.7,
      timeout_ms: 1500
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle partial results when timeout occurs', async () => {
    const searchData = {
      query: 'complex search query',
      filters: {
        date_range: {
          from: '2020-01-01',
          to: '2025-12-31'
        },
        status: ['approved', 'pending'],
        priority: ['high', 'medium', 'low'],
        custom_tags: ['urgent', 'verified', 'reviewed'],
        filter_logic: 'OR'
      },
      similarity_threshold: 0.6,
      timeout_ms: 100 // Very short timeout to trigger partial results
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('partial_results');
    expect(data).toHaveProperty('failed_filters');
    
    // When partial results occur, some filters should be in failed_filters
    if (data.partial_results) {
      expect(data.failed_filters.length).toBeGreaterThan(0);
    }
  });

  it('should return 503 when AnythingLLM is unavailable (fallback mode)', async () => {
    // This test simulates fallback behavior when vector search is unavailable
    const searchData = {
      query: 'fallback search test',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Initially this will be 200, but should be 503 when fallback is implemented
    expect(response.status).toBe(503);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('fallback_mode');
    expect(['keyword_search', 'cached_results']).toContain(data.fallback_mode);
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should validate similarity_threshold range', async () => {
    const searchData = {
      query: 'test query',
      similarity_threshold: 1.5 // Invalid: should be 0-1
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(400);
  });

  it('should validate timeout_ms maximum', async () => {
    const searchData = {
      query: 'test query',
      timeout_ms: 50000 // Invalid: should be max 30000
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(400);
  });

  it('should handle empty query', async () => {
    const searchData = {
      query: '',
      filters: {
        status: ['approved']
      }
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Empty query should either be rejected or return all results
    expect([200, 400]).toContain(response.status);
  });

  it('should handle search with only filters (no query)', async () => {
    const searchData = {
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        status: ['approved']
      }
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle Arabic search query', async () => {
    const searchData = {
      query: 'تقرير الأمن',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should handle complex filter combinations', async () => {
    const searchData = {
      query: 'security analysis',
      filters: {
        date_range: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        status: ['approved', 'pending'],
        priority: ['high'],
        custom_tags: ['urgent'],
        filter_logic: 'AND'
      },
      similarity_threshold: 0.75,
      timeout_ms: 3000
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // This test will fail initially as rate limiting is not implemented
    const searchData = {
      query: 'rate limit test',
      similarity_threshold: 0.8
    };

    const response = await server.request('/api/intelligence-reports/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    // Initially this will be 200, but should be 429 when rate limiting is implemented
    expect(response.status).toBe(429);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('retry_after');
  });
});
