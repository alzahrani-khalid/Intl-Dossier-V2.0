/**
 * Contract Test: Backup Codes Endpoints
 * Tests the /auth/mfa/backup-codes endpoints contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, validateBackupCodesResponse, validateErrorResponse } from '../test-utils';

describe('Backup Codes Contract Tests', () => {
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

  describe('GET /auth/mfa/backup-codes', () => {
    it('should successfully retrieve backup codes for enrolled user', async () => {
      const response = await apiClient.get('/auth/mfa/backup-codes', 200);
      
      expect(response.status).toBe(200);
      validateBackupCodesResponse(response.data);
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/auth/mfa/backup-codes', 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for user not enrolled in MFA', async () => {
      // Use a different user who hasn't enrolled in MFA
      const clientWithoutMFA = new ApiClient();
      clientWithoutMFA.setAuthToken('test-auth-token-no-mfa');
      
      const response = await clientWithoutMFA.get('/auth/mfa/backup-codes', 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MFA_NOT_ENROLLED');
    });

    it('should return codes in correct format', async () => {
      const response = await apiClient.get('/auth/mfa/backup-codes', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.codes).toBeDefined();
      expect(Array.isArray(response.data.codes)).toBe(true);
      expect(response.data.codes.length).toBeGreaterThan(0);
      
      // Each code should be 8 characters, alphanumeric, uppercase
      response.data.codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should return generated_at timestamp', async () => {
      const response = await apiClient.get('/auth/mfa/backup-codes', 200);
      
      expect(response.status).toBe(200);
      expect(response.data.generated_at).toBeDefined();
      expect(typeof response.data.generated_at).toBe('string');
      
      // Should be a valid ISO date string
      const date = new Date(response.data.generated_at);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/auth/mfa/backup-codes', 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.message_ar).toBe('string');
    });
  });

  describe('POST /auth/mfa/backup-codes', () => {
    it('should successfully generate new backup codes', async () => {
      const response = await apiClient.post('/auth/mfa/backup-codes', {}, 200);
      
      expect(response.status).toBe(200);
      validateBackupCodesResponse(response.data);
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.post('/auth/mfa/backup-codes', {}, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for user not enrolled in MFA', async () => {
      const clientWithoutMFA = new ApiClient();
      clientWithoutMFA.setAuthToken('test-auth-token-no-mfa');
      
      const response = await clientWithoutMFA.post('/auth/mfa/backup-codes', {}, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MFA_NOT_ENROLLED');
    });

    it('should invalidate old backup codes when generating new ones', async () => {
      // Get current codes
      const getResponse = await apiClient.get('/auth/mfa/backup-codes', 200);
      const oldCodes = getResponse.data.codes;
      
      // Generate new codes
      const postResponse = await apiClient.post('/auth/mfa/backup-codes', {}, 200);
      const newCodes = postResponse.data.codes;
      
      expect(postResponse.status).toBe(200);
      expect(newCodes).toBeDefined();
      expect(Array.isArray(newCodes)).toBe(true);
      
      // New codes should be different from old ones
      expect(newCodes).not.toEqual(oldCodes);
    });

    it('should generate correct number of backup codes', async () => {
      const response = await apiClient.post('/auth/mfa/backup-codes', {}, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.codes.length).toBe(10); // Standard number of backup codes
    });

    it('should generate unique backup codes', async () => {
      const response = await apiClient.post('/auth/mfa/backup-codes', {}, 200);
      
      expect(response.status).toBe(200);
      const codes = response.data.codes;
      
      // All codes should be unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should update generated_at timestamp', async () => {
      const response = await apiClient.post('/auth/mfa/backup-codes', {}, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.generated_at).toBeDefined();
      
      const generatedAt = new Date(response.data.generated_at);
      const now = new Date();
      
      // Should be recent (within last minute)
      expect(now.getTime() - generatedAt.getTime()).toBeLessThan(60000);
    });

    it('should handle rate limiting for code generation', async () => {
      // Make multiple rapid requests to generate codes
      const promises = Array(5).fill(null).map(() => 
        apiClient.post('/auth/mfa/backup-codes', {})
      );
      
      const responses = await Promise.allSettled(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.post('/auth/mfa/backup-codes', {}, 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.message_ar).toBe('string');
    });
  });
});