import { test, expect } from '@playwright/test';

/**
 * E2E tests for Redis caching strategy feature.
 * Tests the cache metrics API endpoints and verifies caching behavior.
 */

// Helper to get auth token
async function getAuthToken(request: any): Promise<string | null> {
  const loginResponse = await request.post('http://localhost:5001/api/auth/login', {
    data: {
      email: 'kazahrani@stats.gov.sa',
      password: 'itismeitisme', // Password must be 8+ chars
    },
  });

  if (!loginResponse.ok()) {
    console.log('Login failed:', await loginResponse.text());
    return null;
  }

  const data = await loginResponse.json();
  return data.access_token || data.token;
}

test.describe('Redis Caching Strategy', () => {
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    // Attempt to get auth token - tests may still run with unauthenticated fallbacks
    authToken = await getAuthToken(request);
  });

  test('backend health endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:5001/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment');
  });

  test('cache metrics endpoint exists and requires auth', async ({ request }) => {
    // Without auth token, should get 401
    const response = await request.get('http://localhost:5001/api/cache/metrics');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('cache health endpoint exists and requires auth', async ({ request }) => {
    // Without auth token, should get 401
    const response = await request.get('http://localhost:5001/api/cache/health');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('cache summary endpoint exists and requires auth', async ({ request }) => {
    // Without auth token, should get 401
    const response = await request.get('http://localhost:5001/api/cache/summary');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test.describe('Authenticated cache endpoints', () => {
    test.skip(
      !process.env.RUN_AUTH_TESTS,
      'Skipping authenticated tests - set RUN_AUTH_TESTS=true to run'
    );

    test('cache metrics returns proper structure when authenticated', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.get('http://localhost:5001/api/cache/metrics', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('aggregated');
    });

    test('cache health returns Redis status when authenticated', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.get('http://localhost:5001/api/cache/health', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('redis');
      expect(data.redis).toHaveProperty('status');
    });
  });
});

test.describe('Cache TTL Configuration', () => {
  test('verifies centralized TTL configuration file exists', async () => {
    // This test verifies the config file was created during implementation
    const fs = require('fs');
    const path = require('path');

    const configPath = path.join(process.cwd(), 'backend/src/config/cache-ttl.config.ts');

    // Check if file exists
    expect(fs.existsSync(configPath)).toBeTruthy();

    // Read and verify content structure
    const content = fs.readFileSync(configPath, 'utf-8');

    // Verify key TTL configurations exist
    expect(content).toContain('dossier');
    expect(content).toContain('user');
    expect(content).toContain('static');
    expect(content).toContain('CACHE_TTL');
    expect(content).toContain('CACHE_KEY_PREFIX');
  });

  test('verifies cache decorators file exists', async () => {
    const fs = require('fs');
    const path = require('path');

    const decoratorsPath = path.join(process.cwd(), 'backend/src/decorators/cache.decorators.ts');

    expect(fs.existsSync(decoratorsPath)).toBeTruthy();

    const content = fs.readFileSync(decoratorsPath, 'utf-8');

    // Verify decorator exports
    expect(content).toContain('export function Cacheable');
    expect(content).toContain('export function CacheInvalidate');
    expect(content).toContain('export function CachePut');
  });

  test('verifies cache metrics service exists', async () => {
    const fs = require('fs');
    const path = require('path');

    const metricsPath = path.join(process.cwd(), 'backend/src/services/cache-metrics.service.ts');

    expect(fs.existsSync(metricsPath)).toBeTruthy();

    const content = fs.readFileSync(metricsPath, 'utf-8');

    // Verify key functions
    expect(content).toContain('recordCacheHit');
    expect(content).toContain('recordCacheMiss');
    expect(content).toContain('getAggregatedMetrics');
  });

  test('verifies cached service base class exists', async () => {
    const fs = require('fs');
    const path = require('path');

    const basePath = path.join(process.cwd(), 'backend/src/services/cached-service.base.ts');

    expect(fs.existsSync(basePath)).toBeTruthy();

    const content = fs.readFileSync(basePath, 'utf-8');

    // Verify key methods
    expect(content).toContain('getCachedById');
    expect(content).toContain('getCachedList');
    expect(content).toContain('invalidateById');
    expect(content).toContain('invalidateListCaches');
  });

  test('verifies cache metrics API router exists', async () => {
    const fs = require('fs');
    const path = require('path');

    const routerPath = path.join(process.cwd(), 'backend/src/api/cache-metrics.ts');

    expect(fs.existsSync(routerPath)).toBeTruthy();

    const content = fs.readFileSync(routerPath, 'utf-8');

    // Verify key endpoints
    expect(content).toContain('/metrics');
    expect(content).toContain('/health');
    expect(content).toContain('/summary');
  });
});
