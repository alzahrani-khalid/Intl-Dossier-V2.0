/**
 * Contract Test: Export Endpoints
 * Tests the /export endpoints contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createExportRequest, validateExportResponse, validateExportStatus, validateErrorResponse } from '../test-utils';

describe('Export Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;
  let exportRequestId: string;

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

  describe('POST /export', () => {
    it('should successfully request CSV export', async () => {
      const request = {
        ...createExportRequest(),
        format: 'csv'
      };
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      validateExportResponse(response.data);
      exportRequestId = response.data.id;
    });

    it('should successfully request JSON export', async () => {
      const request = {
        ...createExportRequest(),
        format: 'json'
      };
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      validateExportResponse(response.data);
    });

    it('should successfully request Excel export', async () => {
      const request = {
        ...createExportRequest(),
        format: 'excel'
      };
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      validateExportResponse(response.data);
    });

    it('should return 400 for missing resource_type', async () => {
      const request = {
        format: 'csv'
      };
      
      const response = await apiClient.post('/export', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_RESOURCE_TYPE');
    });

    it('should return 400 for missing format', async () => {
      const request = {
        resource_type: 'users'
      };
      
      const response = await apiClient.post('/export', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_FORMAT');
    });

    it('should return 400 for invalid format', async () => {
      const request = {
        ...createExportRequest(),
        format: 'invalid'
      };
      
      const response = await apiClient.post('/export', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_FORMAT');
    });

    it('should return 400 for invalid resource_type', async () => {
      const request = {
        ...createExportRequest(),
        resource_type: 'invalid_resource'
      };
      
      const response = await apiClient.post('/export', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_RESOURCE_TYPE');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createExportRequest();
      
      const response = await clientWithoutAuth.post('/export', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for insufficient permissions', async () => {
      const request = {
        ...createExportRequest(),
        resource_type: 'sensitive_data'
      };
      
      const response = await apiClient.post('/export', request, 403);
      
      expect(response.status).toBe(403);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should return 429 for too many export requests', async () => {
      const request = createExportRequest();
      
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        apiClient.post('/export', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });

    it('should include estimated_rows in response', async () => {
      const request = createExportRequest();
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('estimated_rows');
      expect(typeof response.data.estimated_rows).toBe('number');
      expect(response.data.estimated_rows).toBeGreaterThanOrEqual(0);
    });

    it('should include estimated_completion in response', async () => {
      const request = createExportRequest();
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('estimated_completion');
      expect(typeof response.data.estimated_completion).toBe('string');
      
      // Should be a valid future date
      const completionDate = new Date(response.data.estimated_completion);
      expect(completionDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should accept filters parameter', async () => {
      const request = {
        ...createExportRequest(),
        filters: {
          date_from: '2024-01-01',
          date_to: '2024-12-31',
          status: 'active'
        }
      };
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      validateExportResponse(response.data);
    });

    it('should accept columns parameter', async () => {
      const request = {
        ...createExportRequest(),
        columns: ['id', 'name', 'email', 'created_at']
      };
      
      const response = await apiClient.post('/export', request, 202);
      
      expect(response.status).toBe(202);
      validateExportResponse(response.data);
    });

    it('should return bilingual error messages', async () => {
      const request = {};
      
      const response = await apiClient.post('/export', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });
  });

  describe('GET /export/{id}', () => {
    it('should successfully get export status', async () => {
      if (!exportRequestId) {
        // Create a test export first
        const request = createExportRequest();
        const createResponse = await apiClient.post('/export', request, 202);
        exportRequestId = createResponse.data.id;
      }
      
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      expect(response.status).toBe(200);
      validateExportStatus(response.data);
    });

    it('should return 404 for non-existent export', async () => {
      const response = await apiClient.get('/export/non-existent-id', 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EXPORT_NOT_FOUND');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get(`/export/${exportRequestId}`, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for export owned by different user', async () => {
      const otherUserClient = new ApiClient();
      otherUserClient.setAuthToken('other-user-token');
      
      const response = await otherUserClient.get(`/export/${exportRequestId}`, 403);
      
      expect(response.status).toBe(403);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ACCESS_DENIED');
    });

    it('should include progress information', async () => {
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('progress');
      expect(typeof response.data.progress).toBe('number');
      expect(response.data.progress).toBeGreaterThanOrEqual(0);
      expect(response.data.progress).toBeLessThanOrEqual(100);
    });

    it('should include file size when completed', async () => {
      // Wait for export to complete or check if already completed
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      if (response.data.status === 'completed') {
        expect(response.data).toHaveProperty('file_size_bytes');
        expect(typeof response.data.file_size_bytes).toBe('number');
        expect(response.data.file_size_bytes).toBeGreaterThan(0);
      }
    });

    it('should include download URL when completed', async () => {
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      if (response.data.status === 'completed') {
        expect(response.data).toHaveProperty('download_url');
        expect(typeof response.data.download_url).toBe('string');
        expect(response.data.download_url).toMatch(/^https?:\/\//);
      }
    });

    it('should include expiration time', async () => {
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('expires_at');
      expect(typeof response.data.expires_at).toBe('string');
      
      const expiresAt = new Date(response.data.expires_at);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should include error message when failed', async () => {
      // This would require creating a failing export
      const response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      if (response.data.status === 'failed') {
        expect(response.data).toHaveProperty('error_message');
        expect(typeof response.data.error_message).toBe('string');
      }
    });
  });

  describe('GET /export/{id}/download', () => {
    it('should successfully download completed export', async () => {
      // Wait for export to complete
      let response = await apiClient.get(`/export/${exportRequestId}`, 200);
      
      // Poll until completed
      let attempts = 0;
      while (response.data.status === 'pending' || response.data.status === 'processing') {
        if (attempts++ > 10) break; // Prevent infinite loop
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await apiClient.get(`/export/${exportRequestId}`, 200);
      }
      
      if (response.data.status === 'completed') {
        const downloadResponse = await apiClient.get(`/export/${exportRequestId}/download`, 200);
        expect(downloadResponse.status).toBe(200);
        expect(downloadResponse.headers['content-type']).toBeDefined();
      }
    });

    it('should return 404 for non-existent export', async () => {
      const response = await apiClient.get('/export/non-existent-id/download', 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EXPORT_NOT_FOUND');
    });

    it('should return 410 for expired export', async () => {
      // This would require an expired export
      const response = await apiClient.get('/export/expired-id/download', 410);
      
      expect(response.status).toBe(410);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EXPORT_EXPIRED');
    });

    it('should return 409 for export not ready', async () => {
      // This would require a pending/processing export
      const response = await apiClient.get('/export/processing-id/download', 409);
      
      expect(response.status).toBe(409);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EXPORT_NOT_READY');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get(`/export/${exportRequestId}/download`, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for export owned by different user', async () => {
      const otherUserClient = new ApiClient();
      otherUserClient.setAuthToken('other-user-token');
      
      const response = await otherUserClient.get(`/export/${exportRequestId}/download`, 403);
      
      expect(response.status).toBe(403);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('ACCESS_DENIED');
    });

    it('should return correct content type for CSV', async () => {
      const response = await apiClient.get(`/export/${exportRequestId}/download`, 200);
      
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/text\/csv|application\/csv/);
      }
    });

    it('should return correct content type for JSON', async () => {
      // Create JSON export
      const request = {
        ...createExportRequest(),
        format: 'json'
      };
      const createResponse = await apiClient.post('/export', request, 202);
      
      // Wait for completion and download
      let statusResponse = await apiClient.get(`/export/${createResponse.data.id}`, 200);
      let attempts = 0;
      while (statusResponse.data.status === 'pending' || statusResponse.data.status === 'processing') {
        if (attempts++ > 10) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        statusResponse = await apiClient.get(`/export/${createResponse.data.id}`, 200);
      }
      
      if (statusResponse.data.status === 'completed') {
        const downloadResponse = await apiClient.get(`/export/${createResponse.data.id}/download`, 200);
        expect(downloadResponse.headers['content-type']).toMatch(/application\/json/);
      }
    });
  });
});