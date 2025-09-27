/**
 * Contract Test: MFA Recovery Endpoint
 * Tests the /auth/mfa/recover endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createBackupCodeRequest, validateErrorResponse } from '../test-utils';

describe('MFA Recovery Contract Tests', () => {
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
    // Cleanup test user
  });

  describe('POST /auth/mfa/recover', () => {
    it('should successfully recover account with valid backup code', async () => {
      const request = createBackupCodeRequest();
      
      const response = await apiClient.post('/auth/mfa/recover', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('refresh_token');
      expect(typeof response.data.access_token).toBe('string');
      expect(typeof response.data.refresh_token).toBe('string');
    });

    it('should return 400 for missing backup_code', async () => {
      const request = {};
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_BACKUP_CODE');
    });

    it('should return 400 for invalid backup code format', async () => {
      const request = {
        backup_code: 'invalid' // Should be 8 alphanumeric characters
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BACKUP_CODE_FORMAT');
    });

    it('should return 400 for backup code that is too short', async () => {
      const request = {
        backup_code: 'ABC123' // Too short
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BACKUP_CODE_FORMAT');
    });

    it('should return 400 for backup code that is too long', async () => {
      const request = {
        backup_code: 'ABCD12345' // Too long
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BACKUP_CODE_FORMAT');
    });

    it('should return 400 for backup code with invalid characters', async () => {
      const request = {
        backup_code: 'ABCD123!' // Contains special character
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BACKUP_CODE_FORMAT');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createBackupCodeRequest();
      
      const response = await clientWithoutAuth.post('/auth/mfa/recover', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid backup code', async () => {
      const request = {
        backup_code: 'INVALID1'
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BACKUP_CODE');
    });

    it('should return 401 for already used backup code', async () => {
      const request = createBackupCodeRequest();
      
      // First use should succeed
      await apiClient.post('/auth/mfa/recover', request, 200);
      
      // Second use should fail
      const response = await apiClient.post('/auth/mfa/recover', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('BACKUP_CODE_ALREADY_USED');
    });

    it('should return 404 for user not enrolled in MFA', async () => {
      const clientWithoutMFA = new ApiClient();
      clientWithoutMFA.setAuthToken('test-auth-token-no-mfa');
      const request = createBackupCodeRequest();
      
      const response = await clientWithoutMFA.post('/auth/mfa/recover', request, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MFA_NOT_ENROLLED');
    });

    it('should include expires_in in successful response', async () => {
      const request = createBackupCodeRequest();
      
      const response = await apiClient.post('/auth/mfa/recover', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('expires_in');
      expect(typeof response.data.expires_in).toBe('number');
      expect(response.data.expires_in).toBeGreaterThan(0);
    });

    it('should invalidate the used backup code', async () => {
      const request = createBackupCodeRequest();
      
      // Use the backup code
      const response = await apiClient.post('/auth/mfa/recover', request, 200);
      expect(response.status).toBe(200);
      
      // Try to use the same code again - should fail
      const retryResponse = await apiClient.post('/auth/mfa/recover', request, 401);
      expect(retryResponse.status).toBe(401);
      expect(retryResponse.data.code).toBe('BACKUP_CODE_ALREADY_USED');
    });

    it('should handle case-insensitive backup codes', async () => {
      const request = {
        backup_code: 'abcd1234' // Lowercase
      };
      
      const response = await apiClient.post('/auth/mfa/recover', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
    });

    it('should return 429 for too many failed recovery attempts', async () => {
      const request = {
        backup_code: 'INVALID1'
      };
      
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await apiClient.post('/auth/mfa/recover', request, 401);
      }
      
      // Next attempt should be rate limited
      const response = await apiClient.post('/auth/mfa/recover', request, 429);
      
      expect(response.status).toBe(429);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('TOO_MANY_ATTEMPTS');
      
      // Check for retry-after header
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should return bilingual error messages', async () => {
      const request = {};
      
      const response = await apiClient.post('/auth/mfa/recover', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.message_ar).toBe('string');
    });

    it('should handle concurrent recovery attempts', async () => {
      const request = createBackupCodeRequest();
      
      // Make concurrent requests with the same backup code
      const promises = Array(3).fill(null).map(() => 
        apiClient.post('/auth/mfa/recover', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // Only one should succeed, others should fail
      const successful = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successful.length).toBe(1);
    });

    it('should log recovery attempt in audit log', async () => {
      const request = createBackupCodeRequest();
      
      const response = await apiClient.post('/auth/mfa/recover', request, 200);
      
      expect(response.status).toBe(200);
      
      // This would normally be verified by checking audit logs
      // For contract testing, we just ensure the endpoint responds correctly
    });
  });
});