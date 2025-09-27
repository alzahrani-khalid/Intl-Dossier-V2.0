/**
 * Contract Test: Anomaly Detection Endpoints
 * Tests the /monitoring/anomalies endpoints contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, validateAnomalyPattern, validateErrorResponse } from '../test-utils';

describe('Anomalies Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;
  let testAnomalyId: string;

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

  describe('GET /monitoring/anomalies', () => {
    it('should successfully list anomalies', async () => {
      const response = await apiClient.get('/monitoring/anomalies', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter by entity_type', async () => {
      const response = await apiClient.get('/monitoring/anomalies?entity_type=user', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned anomalies should be user type
      response.data.forEach((anomaly: any) => {
        expect(anomaly.entity_type).toBe('user');
      });
    });

    it('should filter by min_score', async () => {
      const response = await apiClient.get('/monitoring/anomalies?min_score=0.5', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned anomalies should have score >= 0.5
      response.data.forEach((anomaly: any) => {
        expect(anomaly.anomaly_score).toBeGreaterThanOrEqual(0.5);
      });
    });

    it('should filter by unreviewed_only', async () => {
      const response = await apiClient.get('/monitoring/anomalies?unreviewed_only=true', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned anomalies should be unreviewed
      response.data.forEach((anomaly: any) => {
        expect(anomaly.reviewed_at).toBeNull();
      });
    });

    it('should filter by date range', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      
      const response = await apiClient.get(`/monitoring/anomalies?from=${from}&to=${to}`, 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned anomalies should be within date range
      response.data.forEach((anomaly: any) => {
        const detectedAt = new Date(anomaly.detected_at);
        const fromDate = new Date(from);
        const toDate = new Date(to);
        expect(detectedAt.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
        expect(detectedAt.getTime()).toBeLessThanOrEqual(toDate.getTime());
      });
    });

    it('should return 400 for invalid min_score', async () => {
      const response = await apiClient.get('/monitoring/anomalies?min_score=1.5', 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_MIN_SCORE');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await apiClient.get('/monitoring/anomalies?from=invalid-date', 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_DATE_FORMAT');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/monitoring/anomalies', 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/monitoring/anomalies', 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });

    it('should validate anomaly data structure', async () => {
      const response = await apiClient.get('/monitoring/anomalies', 200);
      
      expect(response.status).toBe(200);
      
      response.data.forEach((anomaly: any) => {
        validateAnomalyPattern(anomaly);
      });
    });

    it('should support pagination', async () => {
      const response = await apiClient.get('/monitoring/anomalies?limit=10&offset=0', 200);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /monitoring/anomalies/{id}/review', () => {
    beforeAll(async () => {
      // Create a test anomaly for review
      const anomaliesResponse = await apiClient.get('/monitoring/anomalies?limit=1', 200);
      if (anomaliesResponse.data.length > 0) {
        testAnomalyId = anomaliesResponse.data[0].id;
      }
    });

    it('should successfully review anomaly', async () => {
      if (!testAnomalyId) {
        // Skip if no test anomaly available
        return;
      }

      const request = {
        classification: 'legitimate',
        false_positive: false
      };
      
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 200);
      
      expect(response.status).toBe(200);
    });

    it('should return 400 for missing classification', async () => {
      if (!testAnomalyId) {
        return;
      }

      const request = {
        false_positive: false
      };
      
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_CLASSIFICATION');
    });

    it('should return 400 for missing false_positive flag', async () => {
      if (!testAnomalyId) {
        return;
      }

      const request = {
        classification: 'legitimate'
      };
      
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_FALSE_POSITIVE_FLAG');
    });

    it('should return 400 for invalid classification', async () => {
      if (!testAnomalyId) {
        return;
      }

      const request = {
        classification: 'invalid',
        false_positive: false
      };
      
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CLASSIFICATION');
    });

    it('should return 404 for non-existent anomaly', async () => {
      const request = {
        classification: 'legitimate',
        false_positive: false
      };
      
      const response = await apiClient.post('/monitoring/anomalies/non-existent-id/review', request, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ANOMALY_NOT_FOUND');
    });

    it('should return 401 for unauthenticated request', async () => {
      if (!testAnomalyId) {
        return;
      }

      const clientWithoutAuth = new ApiClient();
      const request = {
        classification: 'legitimate',
        false_positive: false
      };
      
      const response = await clientWithoutAuth.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 for already reviewed anomaly', async () => {
      if (!testAnomalyId) {
        return;
      }

      const request = {
        classification: 'legitimate',
        false_positive: false
      };
      
      // First review
      await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 200);
      
      // Second review should fail
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 409);
      
      expect(response.status).toBe(409);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ANOMALY_ALREADY_REVIEWED');
    });

    it('should accept all valid classifications', async () => {
      if (!testAnomalyId) {
        return;
      }

      const classifications = ['legitimate', 'suspicious', 'malicious'];
      
      for (const classification of classifications) {
        const request = {
          classification,
          false_positive: false
        };
        
        // Use a different anomaly for each test
        const anomaliesResponse = await apiClient.get('/monitoring/anomalies?limit=1', 200);
        if (anomaliesResponse.data.length > 0) {
          const response = await apiClient.post(`/monitoring/anomalies/${anomaliesResponse.data[0].id}/review`, request, 200);
          expect(response.status).toBe(200);
        }
      }
    });

    it('should return bilingual error messages', async () => {
      if (!testAnomalyId) {
        return;
      }

      const request = {};
      
      const response = await apiClient.post(`/monitoring/anomalies/${testAnomalyId}/review`, request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });
  });
});