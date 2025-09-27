/**
 * Contract Test: MFA Verification Endpoint
 * Tests the /auth/mfa/verify endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createMFAVerificationRequest, validateMFAVerificationResponse, validateErrorResponse } from '../test-utils';

describe('MFA Verification Contract Tests', () => {
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

  describe('POST /auth/mfa/verify', () => {
    it('should successfully verify valid MFA code', async () => {
      const request = createMFAVerificationRequest('123456');
      
      const response = await apiClient.post('/auth/mfa/verify', request, 200);
      
      expect(response.status).toBe(200);
      validateMFAVerificationResponse(response.data);
      expect(response.data.verified).toBe(true);
    });

    it('should return 400 for missing code', async () => {
      const request = {
        factor_id: 'test-factor-id'
      };
      
      const response = await apiClient.post('/auth/mfa/verify', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_CODE');
    });

    it('should return 400 for invalid code format', async () => {
      const request = {
        code: '12345', // Too short
        factor_id: 'test-factor-id'
      };
      
      const response = await apiClient.post('/auth/mfa/verify', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CODE_FORMAT');
    });

    it('should return 400 for non-numeric code', async () => {
      const request = {
        code: 'abcdef',
        factor_id: 'test-factor-id'
      };
      
      const response = await apiClient.post('/auth/mfa/verify', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CODE_FORMAT');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createMFAVerificationRequest('123456');
      
      const response = await clientWithoutAuth.post('/auth/mfa/verify', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid MFA code', async () => {
      const request = createMFAVerificationRequest('000000');
      
      const response = await apiClient.post('/auth/mfa/verify', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_MFA_CODE');
    });

    it('should return 401 for expired MFA code', async () => {
      const request = createMFAVerificationRequest('123456');
      
      // Simulate expired code by waiting or using old code
      const response = await apiClient.post('/auth/mfa/verify', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('EXPIRED_MFA_CODE');
    });

    it('should return 404 for non-existent factor_id', async () => {
      const request = {
        code: '123456',
        factor_id: 'non-existent-factor'
      };
      
      const response = await apiClient.post('/auth/mfa/verify', request, 404);
      
      expect(response.status).toBe(404);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('FACTOR_NOT_FOUND');
    });

    it('should return 429 for too many failed attempts', async () => {
      const request = createMFAVerificationRequest('000000');
      
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await apiClient.post('/auth/mfa/verify', request, 401);
      }
      
      // Next attempt should be rate limited
      const response = await apiClient.post('/auth/mfa/verify', request, 429);
      
      expect(response.status).toBe(429);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('TOO_MANY_ATTEMPTS');
      
      // Check for retry-after header
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should include refresh token in successful response', async () => {
      const request = createMFAVerificationRequest('123456');
      
      const response = await apiClient.post('/auth/mfa/verify', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('refresh_token');
      expect(typeof response.data.refresh_token).toBe('string');
    });

    it('should return bilingual error messages', async () => {
      const request = {
        code: 'invalid'
      };
      
      const response = await apiClient.post('/auth/mfa/verify', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.message_ar).toBe('string');
    });

    it('should handle concurrent verification attempts', async () => {
      const request = createMFAVerificationRequest('123456');
      
      // Make concurrent requests
      const promises = Array(3).fill(null).map(() => 
        apiClient.post('/auth/mfa/verify', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // At least one should succeed
      const successful = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successful).toBe(true);
    });
  });
});