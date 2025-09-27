/**
 * Contract Test: MFA Enrollment Endpoint
 * Tests the /auth/mfa/enroll endpoint contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createMFAEnrollmentRequest, validateMFAEnrollmentResponse, validateErrorResponse } from '../test-utils';

describe('MFA Enrollment Contract Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    apiClient = new ApiClient();
    testUser = createTestUser();
    
    // Register test user and get auth token
    // This would normally be done through the auth service
    authToken = 'test-auth-token';
    apiClient.setAuthToken(authToken);
  });

  afterAll(async () => {
    // Cleanup test user
  });

  describe('POST /auth/mfa/enroll', () => {
    it('should successfully enroll user in MFA with valid request', async () => {
      const request = createMFAEnrollmentRequest();
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 200);
      
      expect(response.status).toBe(200);
      validateMFAEnrollmentResponse(response.data);
    });

    it('should return 400 for missing factor_type', async () => {
      const request = {};
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MISSING_FACTOR_TYPE');
    });

    it('should return 400 for invalid factor_type', async () => {
      const request = {
        factor_type: 'invalid'
      };
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_FACTOR_TYPE');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createMFAEnrollmentRequest();
      
      const response = await clientWithoutAuth.post('/auth/mfa/enroll', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 if user already enrolled in MFA', async () => {
      // First enrollment
      const request = createMFAEnrollmentRequest();
      await apiClient.post('/auth/mfa/enroll', request, 200);
      
      // Second enrollment should fail
      const response = await apiClient.post('/auth/mfa/enroll', request, 409);
      
      expect(response.status).toBe(409);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('MFA_ALREADY_ENROLLED');
    });

    it('should include backup codes in response', async () => {
      const request = createMFAEnrollmentRequest();
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('backup_codes');
      expect(Array.isArray(response.data.backup_codes)).toBe(true);
      expect(response.data.backup_codes.length).toBeGreaterThan(0);
      
      response.data.backup_codes.forEach((code: string) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should generate valid QR code data URL', async () => {
      const request = createMFAEnrollmentRequest();
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.qr_code).toMatch(/^data:image\/png;base64,/);
      
      // Verify QR code contains valid base64 data
      const base64Data = response.data.qr_code.split(',')[1];
      expect(base64Data).toBeDefined();
      expect(base64Data.length).toBeGreaterThan(0);
    });

    it('should return bilingual error messages', async () => {
      const request = {};
      
      const response = await apiClient.post('/auth/mfa/enroll', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.message_ar).toBe('string');
    });

    it('should handle rate limiting', async () => {
      const request = createMFAEnrollmentRequest();
      
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() => 
        apiClient.post('/auth/mfa/enroll', request)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });
  });
});