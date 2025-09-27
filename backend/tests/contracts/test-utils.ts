/**
 * Contract Test Utilities
 * Shared utilities for API contract testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:3001',
  supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
  timeout: 10000,
};

// Create test client
export const createTestClient = () => {
  return createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
};

// HTTP client for API testing
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = TEST_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  async request<T>(
    method: string,
    path: string,
    body?: any,
    expectedStatus?: number
  ): Promise<{ status: number; data: T; headers: Record<string, string> }> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    
    if (expectedStatus && response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`
      );
    }

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async get<T>(path: string, expectedStatus?: number) {
    return this.request<T>('GET', path, undefined, expectedStatus);
  }

  async post<T>(path: string, body: any, expectedStatus?: number) {
    return this.request<T>('POST', path, body, expectedStatus);
  }

  async patch<T>(path: string, body: any, expectedStatus?: number) {
    return this.request<T>('PATCH', path, body, expectedStatus);
  }

  async delete<T>(path: string, expectedStatus?: number) {
    return this.request<T>('DELETE', path, undefined, expectedStatus);
  }
}

// Test data factories
export const createTestUser = () => ({
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
});

export const createMFAEnrollmentRequest = () => ({
  factor_type: 'totp' as const,
});

export const createMFAVerificationRequest = (code: string = '123456') => ({
  code,
  factor_id: 'test-factor-id',
});

export const createBackupCodeRequest = () => ({
  backup_code: 'ABCD1234',
});

export const createAlertConfigRequest = () => ({
  name: 'Test Alert',
  name_ar: 'تنبيه تجريبي',
  condition: 'rate(auth_failures[5m]) > 0.1',
  threshold: 0.1,
  severity: 'high' as const,
  channels: ['email'],
});

export const createExportRequest = () => ({
  resource_type: 'users',
  format: 'csv' as const,
  filters: {},
});

export const createClusteringRequest = () => ({
  dataset_id: 'test-dataset',
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  cluster_count: 3,
  auto_optimize: true,
});

export const createAccessibilityPreferences = () => ({
  high_contrast: false,
  large_text: false,
  reduce_motion: false,
  screen_reader: false,
  keyboard_only: false,
  focus_indicators: 'default' as const,
});

// Contract validation helpers
export const validateErrorResponse = (data: any) => {
  expect(data).toHaveProperty('code');
  expect(data).toHaveProperty('message');
  expect(data).toHaveProperty('message_ar');
  expect(typeof data.code).toBe('string');
  expect(typeof data.message).toBe('string');
  expect(typeof data.message_ar).toBe('string');
};

export const validateMFAEnrollmentResponse = (data: any) => {
  expect(data).toHaveProperty('factor_id');
  expect(data).toHaveProperty('secret');
  expect(data).toHaveProperty('qr_code');
  expect(typeof data.factor_id).toBe('string');
  expect(typeof data.secret).toBe('string');
  expect(typeof data.qr_code).toBe('string');
  expect(data.qr_code).toMatch(/^data:image\/png;base64,/);
};

export const validateMFAVerificationResponse = (data: any) => {
  expect(data).toHaveProperty('verified');
  expect(data).toHaveProperty('access_token');
  expect(typeof data.verified).toBe('boolean');
  expect(typeof data.access_token).toBe('string');
};

export const validateBackupCodesResponse = (data: any) => {
  expect(data).toHaveProperty('codes');
  expect(Array.isArray(data.codes)).toBe(true);
  expect(data.codes.length).toBeGreaterThan(0);
  data.codes.forEach((code: string) => {
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });
};

export const validateAlertConfiguration = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('name');
  expect(data).toHaveProperty('name_ar');
  expect(data).toHaveProperty('condition');
  expect(data).toHaveProperty('threshold');
  expect(data).toHaveProperty('severity');
  expect(data).toHaveProperty('channels');
  expect(data).toHaveProperty('is_active');
  expect(typeof data.id).toBe('string');
  expect(typeof data.name).toBe('string');
  expect(typeof data.name_ar).toBe('string');
  expect(typeof data.condition).toBe('string');
  expect(typeof data.threshold).toBe('number');
  expect(['low', 'medium', 'high', 'critical']).toContain(data.severity);
  expect(Array.isArray(data.channels)).toBe(true);
  expect(typeof data.is_active).toBe('boolean');
};

export const validateAnomalyPattern = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('entity_type');
  expect(data).toHaveProperty('entity_id');
  expect(data).toHaveProperty('anomaly_score');
  expect(data).toHaveProperty('sensitivity_level');
  expect(data).toHaveProperty('detected_at');
  expect(typeof data.id).toBe('string');
  expect(['user', 'system', 'api']).toContain(data.entity_type);
  expect(typeof data.entity_id).toBe('string');
  expect(typeof data.anomaly_score).toBe('number');
  expect(data.anomaly_score).toBeGreaterThanOrEqual(0);
  expect(data.anomaly_score).toBeLessThanOrEqual(1);
  expect(['low', 'medium', 'high', 'custom']).toContain(data.sensitivity_level);
  expect(typeof data.detected_at).toBe('string');
};

export const validateHealthStatus = (data: any) => {
  expect(data).toHaveProperty('status');
  expect(data).toHaveProperty('services');
  expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  expect(typeof data.services).toBe('object');
};

export const validateExportResponse = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('status');
  expect(typeof data.id).toBe('string');
  expect(['pending', 'processing', 'completed', 'failed']).toContain(data.status);
};

export const validateExportStatus = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('status');
  expect(data).toHaveProperty('created_at');
  expect(typeof data.id).toBe('string');
  expect(['pending', 'processing', 'completed', 'failed']).toContain(data.status);
  expect(typeof data.created_at).toBe('string');
};

export const validateClusteringResult = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('cluster_count');
  expect(data).toHaveProperty('silhouette_score');
  expect(data).toHaveProperty('labels');
  expect(typeof data.id).toBe('string');
  expect(typeof data.cluster_count).toBe('number');
  expect(data.cluster_count).toBeGreaterThanOrEqual(3);
  expect(data.cluster_count).toBeLessThanOrEqual(10);
  expect(typeof data.silhouette_score).toBe('number');
  expect(data.silhouette_score).toBeGreaterThanOrEqual(-1);
  expect(data.silhouette_score).toBeLessThanOrEqual(1);
  expect(Array.isArray(data.labels)).toBe(true);
};

export const validateAccessibilityPreferences = (data: any) => {
  expect(data).toHaveProperty('high_contrast');
  expect(data).toHaveProperty('large_text');
  expect(data).toHaveProperty('reduce_motion');
  expect(data).toHaveProperty('screen_reader');
  expect(data).toHaveProperty('keyboard_only');
  expect(data).toHaveProperty('focus_indicators');
  expect(typeof data.high_contrast).toBe('boolean');
  expect(typeof data.large_text).toBe('boolean');
  expect(typeof data.reduce_motion).toBe('boolean');
  expect(typeof data.screen_reader).toBe('boolean');
  expect(typeof data.keyboard_only).toBe('boolean');
  expect(['default', 'thick', 'high-contrast']).toContain(data.focus_indicators);
};

export const validateAuditLog = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('event_type');
  expect(data).toHaveProperty('severity');
  expect(data).toHaveProperty('action');
  expect(data).toHaveProperty('result');
  expect(data).toHaveProperty('created_at');
  expect(typeof data.id).toBe('string');
  expect(typeof data.event_type).toBe('string');
  expect(['info', 'warning', 'critical']).toContain(data.severity);
  expect(typeof data.action).toBe('string');
  expect(['success', 'failure', 'blocked']).toContain(data.result);
  expect(typeof data.created_at).toBe('string');
};

// Test setup helpers
export const setupTestEnvironment = async () => {
  // Initialize test database if needed
  // Set up test data
  // Configure test environment
};

export const cleanupTestEnvironment = async () => {
  // Clean up test data
  // Reset test environment
};