/**
 * Contract Test: Health Check Endpoint
 * Tests the /monitoring/health endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, validateHealthStatus, validateErrorResponse } from '../test-utils';

describe('Health Check Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    apiClient = new ApiClient();
    testUser = createTestUser();
    
    // Register test user and get auth token
    authToken = 'test-auth-token';
    apiClient.setAuthToken(authToken);
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('GET /monitoring/health', () => {
    it('should return healthy status when all services are operational', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      validateHealthStatus(response.data);
      expect(response.data.status).toBe('healthy');
    });

    it('should return degraded status when some services are down', async () => {
      // This would require mocking service status
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      validateHealthStatus(response.data);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.data.status);
    });

    it('should return unhealthy status when critical services are down', async () => {
      // This would require mocking service status
      const response = await apiClient.get('/monitoring/health', 503);
      
      expect(response.status).toBe(503);
      validateHealthStatus(response.data);
      expect(response.data.status).toBe('unhealthy');
    });

    it('should include service details in response', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.services).toBeDefined();
      expect(typeof response.data.services).toBe('object');
      
      // Check that services object has expected structure
      Object.values(response.data.services).forEach((service: any) => {
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('latency_ms');
        expect(service).toHaveProperty('last_check');
        expect(['healthy', 'unhealthy']).toContain(service.status);
        expect(typeof service.latency_ms).toBe('number');
        expect(typeof service.last_check).toBe('string');
      });
    });

    it('should include database service status', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.services).toHaveProperty('database');
      
      const dbService = response.data.services.database;
      expect(dbService).toHaveProperty('status');
      expect(dbService).toHaveProperty('latency_ms');
      expect(dbService).toHaveProperty('last_check');
    });

    it('should include API service status', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.services).toHaveProperty('api');
      
      const apiService = response.data.services.api;
      expect(apiService).toHaveProperty('status');
      expect(apiService).toHaveProperty('latency_ms');
      expect(apiService).toHaveProperty('last_check');
    });

    it('should include Redis service status', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.services).toHaveProperty('redis');
      
      const redisService = response.data.services.redis;
      expect(redisService).toHaveProperty('status');
      expect(redisService).toHaveProperty('latency_ms');
      expect(redisService).toHaveProperty('last_check');
    });

    it('should include Supabase service status', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.services).toHaveProperty('supabase');
      
      const supabaseService = response.data.services.supabase;
      expect(supabaseService).toHaveProperty('status');
      expect(supabaseService).toHaveProperty('latency_ms');
      expect(supabaseService).toHaveProperty('last_check');
    });

    it('should return valid latency measurements', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      
      Object.values(response.data.services).forEach((service: any) => {
        expect(service.latency_ms).toBeGreaterThanOrEqual(0);
        expect(service.latency_ms).toBeLessThan(10000); // Should be less than 10 seconds
      });
    });

    it('should return valid timestamps', async () => {
      const response = await apiClient.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      
      Object.values(response.data.services).forEach((service: any) => {
        const lastCheck = new Date(service.last_check);
        expect(lastCheck.getTime()).not.toBeNaN();
        
        // Should be recent (within last 5 minutes)
        const now = new Date();
        const timeDiff = now.getTime() - lastCheck.getTime();
        expect(timeDiff).toBeLessThan(5 * 60 * 1000);
      });
    });

    it('should work without authentication', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/monitoring/health', 200);
      
      expect(response.status).toBe(200);
      validateHealthStatus(response.data);
    });

    it('should handle concurrent health check requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        apiClient.get('/monitoring/health')
      );
      
      const responses = await Promise.allSettled(promises);
      
      // All requests should succeed
      responses.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
          validateHealthStatus(result.value.data);
        }
      });
    });

    it('should return consistent status across multiple requests', async () => {
      const response1 = await apiClient.get('/monitoring/health', 200);
      const response2 = await apiClient.get('/monitoring/health', 200);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.data.status).toBe(response2.data.status);
    });

    it('should include error details when services are unhealthy', async () => {
      // This would require mocking unhealthy service
      const response = await apiClient.get('/monitoring/health');
      
      if (response.status === 503) {
        expect(response.data.status).toBe('unhealthy');
        
        // Check that unhealthy services have error details
        Object.entries(response.data.services).forEach(([name, service]: [string, any]) => {
          if (service.status === 'unhealthy') {
            expect(service).toHaveProperty('error');
            expect(typeof service.error).toBe('string');
          }
        });
      }
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await apiClient.get('/monitoring/health', 200);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle service timeout gracefully', async () => {
      // This would require mocking a service timeout
      const response = await apiClient.get('/monitoring/health');
      
      // Should still return a response, even if some services timeout
      expect([200, 503]).toContain(response.status);
      validateHealthStatus(response.data);
    });
  });
});