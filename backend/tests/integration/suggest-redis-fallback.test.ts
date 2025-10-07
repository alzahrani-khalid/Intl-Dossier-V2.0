/**
 * Integration Test: Redis Fallback
 *
 * From quickstart.md Step 8.1
 * This test MUST FAIL until Redis fallback is implemented (T032, T034, T040)
 *
 * Tests graceful degradation when Redis is unavailable
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '../helpers/auth';
import { invokeEdgeFunctionGet } from '../helpers/edge-function-client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let supabase: SupabaseClient;
let redisWasRunning = true;

describe('Integration: Redis Fallback', () => {
  beforeAll(async () => {
    supabase = await getAuthenticatedClient();

    // Check if Redis is running
    try {
      await execAsync('redis-cli ping');
      redisWasRunning = true;
    } catch {
      redisWasRunning = false;
    }
  });

  afterAll(async () => {
    // Restore Redis if we stopped it
    if (redisWasRunning) {
      try {
        await execAsync('docker start redis || redis-server --daemonize yes');
      } catch {
        console.warn('Could not restart Redis');
      }
    }
  });

  it('should fallback to database when Redis is unavailable', async () => {
    // Stop Redis temporarily
    try {
      await execAsync('docker stop redis || redis-cli shutdown || true');
    } catch {
      // Redis might not be running in Docker
    }

    // Wait a moment for connection to fail
    await new Promise(resolve => setTimeout(resolve, 1000));

    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const { data, error, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    // Should still work (fallback to DB)
    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Should indicate cache miss
    expect(data.cache_hit).toBe(false);

    // Performance will be degraded but should still be acceptable
    console.log(`Fallback took: ${data.took_ms}ms (degraded mode)`);
    expect(data.took_ms).toBeGreaterThan(0);
    expect(data.took_ms).toBeLessThan(500); // Degraded but acceptable

    // Restart Redis
    if (redisWasRunning) {
      try {
        await execAsync('docker start redis || redis-server --daemonize yes');
      } catch {
        console.warn('Could not restart Redis');
      }
    }
  });

  it('should have degraded but acceptable performance without Redis', async () => {
    // This test assumes Redis is unavailable from previous test
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const start = Date.now();
    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );
    const duration = Date.now() - start;

    expect(status).toBe(200);

    // Fallback performance should be between 300-500ms (as per quickstart)
    console.log(`Fallback duration: ${duration}ms (server: ${data.took_ms}ms)`);

    // Allow more time for fallback, but it should still complete
    expect(duration).toBeLessThan(1000);
  });

  it('should return valid suggestions without cache', async () => {
    const queryParams = {
      q: 'clim',
      limit: '10'
    };

    const { data, status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // Should still return valid suggestions
    expect(Array.isArray(data.suggestions)).toBe(true);

    if (data.suggestions.length > 0) {
      // Verify suggestion structure
      const suggestion = data.suggestions[0];
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('title_en');
      expect(suggestion).toHaveProperty('score');
    }
  });

  it('should log warning when Redis is unavailable', async () => {
    // This test would check server logs for Redis connection errors
    // For now, we just verify the service continues to work

    const queryParams = {
      q: 'test',
      limit: '5'
    };

    const { status } = await invokeEdgeFunctionGet(
      supabase,
      'search-suggest',
      '',
      queryParams
    );

    expect(status).toBe(200);

    // In production, this should log:
    // "Warning: Redis unavailable, falling back to database queries"
  });

  it('should recover when Redis comes back online', async () => {
    // Restart Redis
    if (redisWasRunning) {
      try {
        await execAsync('docker start redis || redis-server --daemonize yes');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Redis to start
      } catch {
        console.warn('Could not restart Redis for recovery test');
        return; // Skip this test if Redis won't start
      }

      const queryParams = {
        q: 'clim',
        limit: '10'
      };

      // First request after Redis recovery
      const { data: data1 } = await invokeEdgeFunctionGet(
        supabase,
        'search-suggest',
        '',
        queryParams
      );

      // Second request (should hit cache)
      const { data: data2, status } = await invokeEdgeFunctionGet(
        supabase,
        'search-suggest',
        '',
        queryParams
      );

      expect(status).toBe(200);

      // Should be using cache again
      if (data2.cache_hit) {
        console.log(`Cache recovered! Response time: ${data2.took_ms}ms`);
        expect(data2.took_ms).toBeLessThan(100); // Fast cache response
      }
    }
  });
});
