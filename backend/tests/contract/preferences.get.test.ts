import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { UserPreference } from '../../../frontend/src/styles/themes/types';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

describe('GET /api/preferences/{userId} Contract Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user and get auth token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError) throw authError;
    
    testUserId = authData.user?.id || '';
    authToken = authData.session?.access_token || '';
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.from('user_preferences').delete().eq('user_id', testUserId);
      // Note: Cannot delete auth user via client SDK in tests
    }
  });

  beforeEach(async () => {
    // Clear any existing preferences
    await supabase.from('user_preferences').delete().eq('user_id', testUserId);
  });

  it('should return 200 with user preferences when preferences exist', async () => {
    // Arrange: Insert test preferences
    const testPreferences = {
      user_id: testUserId,
      theme: 'blueSky',
      color_mode: 'dark',
      language: 'ar',
    };

    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert(testPreferences);
    
    if (insertError) throw insertError;

    // Act: Make GET request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Check response
    expect(response.status).toBe(200);
    
    const data: UserPreference = await response.json();
    expect(data).toMatchObject({
      userId: testUserId,
      theme: 'blueSky',
      colorMode: 'dark',
      language: 'ar',
    });
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it('should return 404 when preferences do not exist', async () => {
    // Act: Make GET request for non-existent preferences
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Check response
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toMatchObject({
      error: 'PREFERENCES_NOT_FOUND',
      message: 'No preferences found for user',
      defaultsApplied: true,
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    // Act: Make GET request without auth token
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Assert: Check response
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });

  it('should return 403 when trying to access another user preferences', async () => {
    // Arrange: Create another user
    const anotherUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    // Act: Try to access another user's preferences
    const response = await fetch(`${API_BASE_URL}/preferences/${anotherUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Check response
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });

  it('should validate response schema matches OpenAPI contract', async () => {
    // Arrange: Insert test preferences
    const testPreferences = {
      user_id: testUserId,
      theme: 'gastat',
      color_mode: 'light',
      language: 'en',
    };

    await supabase.from('user_preferences').insert(testPreferences);

    // Act: Make GET request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Validate schema
    const data: UserPreference = await response.json();
    
    // Check all required fields exist and have correct types
    expect(typeof data.id).toBe('string');
    expect(typeof data.userId).toBe('string');
    expect(['gastat', 'blueSky']).toContain(data.theme);
    expect(['light', 'dark', 'system']).toContain(data.colorMode);
    expect(['en', 'ar']).toContain(data.language);
    expect(typeof data.createdAt).toBe('string');
    expect(typeof data.updatedAt).toBe('string');
    
    // Validate date formats
    expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
    expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
  });

  it('should handle invalid userId format gracefully', async () => {
    // Act: Make GET request with invalid UUID
    const response = await fetch(`${API_BASE_URL}/preferences/invalid-uuid`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Check response
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });
});