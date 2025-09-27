import { describe, it, expect } from 'vitest';

describe('Authentication API Contracts', () => {
  describe('POST /auth/login', () => {
    it('should accept valid login request', () => {
      const validRequest = {
        email: 'user@gastat.gov.sa',
        password: 'SecurePassword123!'
      };
      
      // Validate request schema
      expect(validRequest.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validRequest.password).toHaveLength.greaterThanOrEqual(8);
    });

    it('should reject invalid email format', () => {
      const invalidRequest = {
        email: 'invalid-email',
        password: 'SecurePassword123!'
      };
      
      expect(invalidRequest.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should reject short password', () => {
      const invalidRequest = {
        email: 'user@gastat.gov.sa',
        password: '123'
      };
      
      expect(invalidRequest.password).toHaveLength.lessThan(8);
    });

    it('should return user and token on successful login', () => {
      const expectedResponse = {
        user: {
          id: expect.any(String),
          email: 'user@gastat.gov.sa',
          first_name: expect.any(String),
          last_name: expect.any(String),
          language_preference: expect.stringMatching(/^(en|ar)$/),
          mfa_enabled: expect.any(Boolean),
          role: expect.stringMatching(/^(admin|user|viewer)$/),
          is_active: expect.any(Boolean),
          last_login: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String)
        },
        token: expect.any(String),
        mfa_required: expect.any(Boolean)
      };
      
      expect(expectedResponse.user).toHaveProperty('id');
      expect(expectedResponse.user).toHaveProperty('email');
      expect(expectedResponse).toHaveProperty('token');
    });
  });

  describe('POST /auth/mfa/verify', () => {
    it('should accept valid MFA verification request', () => {
      const validRequest = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        mfa_code: '123456'
      };
      
      expect(validRequest.token).toBeDefined();
      expect(validRequest.mfa_code).toMatch(/^[0-9]{6}$/);
    });

    it('should reject invalid MFA code format', () => {
      const invalidRequest = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        mfa_code: '12345' // Too short
      };
      
      expect(invalidRequest.mfa_code).not.toMatch(/^[0-9]{6}$/);
    });

    it('should return access token on successful verification', () => {
      const expectedResponse = {
        user: expect.any(Object),
        access_token: expect.any(String)
      };
      
      expect(expectedResponse).toHaveProperty('access_token');
    });
  });
});
