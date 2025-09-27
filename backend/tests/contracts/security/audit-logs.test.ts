/**
 * Contract Test: Audit Logs Endpoint
 * Tests the /audit/logs endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, validateAuditLog, validateErrorResponse } from '../test-utils';

describe('Audit Logs Contract Tests', () => {
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

  describe('GET /audit/logs', () => {
    it('should successfully retrieve audit logs with required parameters', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return 400 for missing from parameter', async () => {
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?to=${to}`, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_FROM_PARAMETER');
    });

    it('should return 400 for missing to parameter', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}`, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_TO_PARAMETER');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await apiClient.get('/audit/logs?from=invalid-date&to=invalid-date', 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_DATE_FORMAT');
    });

    it('should filter by event_type', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}&event_type=login`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((log: any) => {
        expect(log.event_type).toBe('login');
      });
    });

    it('should filter by severity', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}&severity=critical`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((log: any) => {
        expect(log.severity).toBe('critical');
      });
    });

    it('should filter by user_id', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}&user_id=${testUser.id}`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((log: any) => {
        expect(log.user_id).toBe(testUser.id);
      });
    });

    it('should respect limit parameter', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}&limit=10`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });

    it('should return 400 for invalid limit', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}&limit=2000`, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_LIMIT');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await clientWithoutAuth.get(`/audit/logs?from=${from}&to=${to}`, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for insufficient permissions', async () => {
      const regularUserClient = new ApiClient();
      regularUserClient.setAuthToken('regular-user-token');
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await regularUserClient.get(`/audit/logs?from=${from}&to=${to}`, 403);
      
      expect(response.status).toBe(403);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate audit log data structure', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      
      response.data.forEach((log: any) => {
        validateAuditLog(log);
      });
    });

    it('should return logs in chronological order', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      
      if (response.data.length > 1) {
        for (let i = 1; i < response.data.length; i++) {
          const prevTime = new Date(response.data[i - 1].created_at).getTime();
          const currTime = new Date(response.data[i].created_at).getTime();
          expect(currTime).toBeGreaterThanOrEqual(prevTime);
        }
      }
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/audit/logs', 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });

    it('should handle large date ranges', async () => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should handle empty result set', async () => {
      const from = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Future date
      const to = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      const response = await apiClient.get(`/audit/logs?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });
  });
});