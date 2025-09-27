/**
 * Contract Test: Accessibility Preferences Endpoints
 * Tests the /accessibility/preferences endpoints contract
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient, createTestUser, createAccessibilityPreferences, validateAccessibilityPreferences, validateErrorResponse } from '../test-utils';

describe('Accessibility Preferences Contract Tests', () => {
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

  describe('GET /accessibility/preferences', () => {
    it('should successfully retrieve accessibility preferences', async () => {
      const response = await apiClient.get('/accessibility/preferences', 200);
      
      expect(response.status).toBe(200);
      validateAccessibilityPreferences(response.data);
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/accessibility/preferences', 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should return default preferences for new user', async () => {
      const newUserClient = new ApiClient();
      newUserClient.setAuthToken('new-user-token');
      
      const response = await newUserClient.get('/accessibility/preferences', 200);
      
      expect(response.status).toBe(200);
      validateAccessibilityPreferences(response.data);
      
      // Should have default values
      expect(response.data.high_contrast).toBe(false);
      expect(response.data.large_text).toBe(false);
      expect(response.data.reduce_motion).toBe(false);
      expect(response.data.screen_reader).toBe(false);
      expect(response.data.keyboard_only).toBe(false);
      expect(response.data.focus_indicators).toBe('default');
    });

    it('should return bilingual error messages', async () => {
      const clientWithoutAuth = new ApiClient();
      
      const response = await clientWithoutAuth.get('/accessibility/preferences', 401);
      
      expect(response.status).toBe(401);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });
  });

  describe('PUT /accessibility/preferences', () => {
    it('should successfully update all accessibility preferences', async () => {
      const request = {
        high_contrast: true,
        large_text: true,
        reduce_motion: false,
        screen_reader: true,
        keyboard_only: false,
        focus_indicators: 'thick',
        color_blind_mode: 'protanopia',
        custom_css: '.custom { font-size: 16px; }'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      validateAccessibilityPreferences(response.data);
      expect(response.data.high_contrast).toBe(true);
      expect(response.data.large_text).toBe(true);
      expect(response.data.screen_reader).toBe(true);
      expect(response.data.focus_indicators).toBe('thick');
      expect(response.data.color_blind_mode).toBe('protanopia');
      expect(response.data.custom_css).toBe('.custom { font-size: 16px; }');
    });

    it('should successfully update partial preferences', async () => {
      const request = {
        high_contrast: true,
        large_text: false
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      validateAccessibilityPreferences(response.data);
      expect(response.data.high_contrast).toBe(true);
      expect(response.data.large_text).toBe(false);
    });

    it('should return 400 for invalid focus_indicators value', async () => {
      const request = {
        focus_indicators: 'invalid'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_FOCUS_INDICATORS');
    });

    it('should return 400 for invalid color_blind_mode value', async () => {
      const request = {
        color_blind_mode: 'invalid'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_COLOR_BLIND_MODE');
    });

    it('should return 400 for invalid boolean values', async () => {
      const request = {
        high_contrast: 'invalid'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_BOOLEAN_VALUE');
    });

    it('should return 400 for custom_css that is too long', async () => {
      const request = {
        custom_css: 'a'.repeat(10001) // Too long
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('CUSTOM_CSS_TOO_LONG');
    });

    it('should return 400 for invalid custom_css syntax', async () => {
      const request = {
        custom_css: 'invalid css syntax {'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('INVALID_CSS_SYNTAX');
    });

    it('should return 401 for unauthenticated request', async () => {
      const clientWithoutAuth = new ApiClient();
      const request = createAccessibilityPreferences();
      
      const response = await clientWithoutAuth.put('/accessibility/preferences', request, 401);
      
      expect(response.status).toBe(401);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    it('should accept all valid focus_indicators values', async () => {
      const validValues = ['default', 'thick', 'high-contrast'];
      
      for (const value of validValues) {
        const request = {
          focus_indicators: value
        };
        
        const response = await apiClient.put('/accessibility/preferences', request, 200);
        
        expect(response.status).toBe(200);
        expect(response.data.focus_indicators).toBe(value);
      }
    });

    it('should accept all valid color_blind_mode values', async () => {
      const validValues = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
      
      for (const value of validValues) {
        const request = {
          color_blind_mode: value
        };
        
        const response = await apiClient.put('/accessibility/preferences', request, 200);
        
        expect(response.status).toBe(200);
        expect(response.data.color_blind_mode).toBe(value);
      }
    });

    it('should accept null color_blind_mode', async () => {
      const request = {
        color_blind_mode: null
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.color_blind_mode).toBeNull();
    });

    it('should accept null custom_css', async () => {
      const request = {
        custom_css: null
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.custom_css).toBeNull();
    });

    it('should handle empty request body', async () => {
      const request = {};
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      validateAccessibilityPreferences(response.data);
    });

    it('should preserve existing values when updating partial preferences', async () => {
      // First, set some preferences
      const initialRequest = {
        high_contrast: true,
        large_text: true,
        screen_reader: true
      };
      await apiClient.put('/accessibility/preferences', initialRequest, 200);
      
      // Then update only one preference
      const updateRequest = {
        high_contrast: false
      };
      const response = await apiClient.put('/accessibility/preferences', updateRequest, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.high_contrast).toBe(false);
      expect(response.data.large_text).toBe(true); // Should be preserved
      expect(response.data.screen_reader).toBe(true); // Should be preserved
    });

    it('should return bilingual error messages', async () => {
      const request = {
        focus_indicators: 'invalid'
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      expect(response.data.message).toBeDefined();
      expect(response.data.message_ar).toBeDefined();
    });

    it('should handle concurrent preference updates', async () => {
      const request1 = {
        high_contrast: true
      };
      const request2 = {
        large_text: true
      };
      
      // Make concurrent requests
      const promises = [
        apiClient.put('/accessibility/preferences', request1),
        apiClient.put('/accessibility/preferences', request2)
      ];
      
      const responses = await Promise.allSettled(promises);
      
      // Both should succeed
      responses.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
          validateAccessibilityPreferences(result.value.data);
        }
      });
    });

    it('should validate custom CSS for security', async () => {
      const maliciousCSS = `
        .malicious {
          background: url('javascript:alert("xss")');
        }
      `;
      
      const request = {
        custom_css: maliciousCSS
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 400);
      
      expect(response.status).toBe(400);
      validateErrorResponse(response.data);
      expect(response.data.code).toBe('UNSAFE_CSS');
    });

    it('should allow safe custom CSS', async () => {
      const safeCSS = `
        .accessibility {
          font-size: 18px;
          line-height: 1.6;
          color: #000;
        }
      `;
      
      const request = {
        custom_css: safeCSS
      };
      
      const response = await apiClient.put('/accessibility/preferences', request, 200);
      
      expect(response.status).toBe(200);
      expect(response.data.custom_css).toBe(safeCSS);
    });
  });
});