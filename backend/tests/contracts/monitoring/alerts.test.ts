/**
 * Contract Test: Alerts CRUD Endpoints
 * Tests the /monitoring/alerts endpoints contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createAlertConfigRequest, validateAlertConfiguration, validateErrorResponse } from '../test-utils';

describe('Alerts Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;
  let createdAlertId: string;

  beforeAll(async () => {
    apiClient = new ApiClient();
    testUser = createTestUser();
    
    // Register test user and get auth token
    authToken = 'test-auth-token';
    apiClient.setAuthToken(authToken);
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdAlertId) {
      await apiClient.delete(`/monitoring/alerts/${createdAlertId}`);
    }
  });

  describe('GET /monitoring/alerts', () => {
    it('should successfully list alert configurations', async () => {
      const response = await apiClient.get('/monitoring/alerts', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter by severity', async () => {
      const response = await apiClient.get('/monitoring/alerts?severity=high', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned alerts should have high severity
      response.data.forEach((alert: any) => {
        expect(alert.severity).toBe('high');
      });
    });

    it('should filter by active status', async () => {
      const response = await apiClient.get('/monitoring/alerts?is_active=true', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned alerts should be active
      response.data.forEach((alert: any) => {
        expect(alert.is_active).toBe(true);
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/monitoring/alerts', 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/monitoring/alerts', 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });
  });

  describe('POST /monitoring/alerts', () => {
    it('should successfully create alert configuration', async () => {
      const request = createAlertConfigRequest();
      
      const response = await apiClient.post('/monitoring/alerts', request, 201);
      
      expect(response.status).toBe(201);
      validateAlertConfiguration(response.data);
      createdAlertId = response.data.id;
    });

    it('should return 400 for missing required fields', async () => {
      const request = {
        name: 'Test Alert'
        // Missing name_ar, condition, threshold, severity, channels
      };
      
      const response = await apiClient.post('/monitoring/alerts', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 for invalid severity', async () => {
      const request = {
        ...createAlertConfigRequest(),
        severity: 'invalid'
      };
      
      const response = await apiClient.post('/monitoring/alerts', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_SEVERITY');
    });

    it('should return 400 for invalid threshold', async () => {
      const request = {
        ...createAlertConfigRequest(),
        threshold: -1
      };
      
      const response = await apiClient.post('/monitoring/alerts', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_THRESHOLD');
    });

    it('should return 400 for empty channels array', async () => {
      const request = {
        ...createAlertConfigRequest(),
        channels: []
      };
      
      const response = await apiClient.post('/monitoring/alerts', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CHANNELS');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createAlertConfigRequest();
      
      const response = await clientWithoutAuth.post('/monitoring/alerts', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 for duplicate alert name', async () => {
      const request = createAlertConfigRequest();
      
      // Create first alert
      await apiClient.post('/monitoring/alerts', request, 201);
      
      // Try to create another with same name
      const response = await apiClient.post('/monitoring/alerts', request, 409);
      
      expect(response.status).toBe(409);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ALERT_NAME_EXISTS');
    });

    it('should set default duration if not provided', async () => {
      const request = {
        ...createAlertConfigRequest(),
        name: 'Test Alert Default Duration'
      };
      delete request.duration;
      
      const response = await apiClient.post('/monitoring/alerts', request, 201);
      
      expect(response.status).toBe(201);
      expect(response.data.duration).toBe('5 minutes');
    });

    it('should return bilingual error messages', async () => {
      const request = {};
      
      const response = await apiClient.post('/monitoring/alerts', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });
  });

  describe('PATCH /monitoring/alerts/{id}', () => {
    it('should successfully update alert configuration', async () => {
      const request = {
        threshold: 0.2,
        severity: 'critical'
      };
      
      const response = await apiClient.patch(`/monitoring/alerts/${createdAlertId}`, request, 200);
      
      expect(response.status).toBe(200);
      validateAlertConfiguration(response.data);
      expect(response.data.threshold).toBe(0.2);
      expect(response.data.severity).toBe('critical');
    });

    it('should return 400 for invalid update data', async () => {
      const request = {
        severity: 'invalid'
      };
      
      const response = await apiClient.patch(`/monitoring/alerts/${createdAlertId}`, request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_SEVERITY');
    });

    it('should return 404 for non-existent alert', async () => {
      const request = {
        threshold: 0.3
      };
      
      const response = await apiClient.patch('/monitoring/alerts/non-existent-id', request, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ALERT_NOT_FOUND');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = {
        threshold: 0.3
      };
      
      const response = await clientWithoutAuth.patch(`/monitoring/alerts/${createdAlertId}`, request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should update only provided fields', async () => {
      const originalResponse = await apiClient.get(`/monitoring/alerts/${createdAlertId}`, 200);
      const originalName = originalResponse.data.name;
      
      const request = {
        threshold: 0.5
      };
      
      const response = await apiClient.patch(`/monitoring/alerts/${createdAlertId}`, request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(originalName); // Should not change
      expect(response.data.threshold).toBe(0.5); // Should update
    });
  });

  describe('POST /monitoring/alerts/{id}/acknowledge', () => {
    it('should successfully acknowledge alert', async () => {
      const response = await apiClient.post(`/monitoring/alerts/${createdAlertId}/acknowledge`, {}, 200);
      
      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await apiClient.post('/monitoring/alerts/non-existent-id/acknowledge', {}, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ALERT_NOT_FOUND');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.post(`/monitoring/alerts/${createdAlertId}/acknowledge`, {}, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 for already acknowledged alert', async () => {
      // Acknowledge first time
      await apiClient.post(`/monitoring/alerts/${createdAlertId}/acknowledge`, {}, 200);
      
      // Try to acknowledge again
      const response = await apiClient.post(`/monitoring/alerts/${createdAlertId}/acknowledge`, {}, 409);
      
      expect(response.status).toBe(409);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ALERT_ALREADY_ACKNOWLEDGED');
    });
  });
});