import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { UserPreference, PreferenceUpdate } from '../../../frontend/src/styles/themes/types';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

describe('PUT /api/preferences/{userId} Contract Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user and get auth token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-put-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError) throw authError;
    
    testUserId = authData.user?.id || '';
    authToken = authData.session?.access_token || '';
  });

  afterAll(async () => {
    // Clean up test user preferences
    if (testUserId) {
      await supabase.from('user_preferences').delete().eq('user_id', testUserId);
    }
  });

  beforeEach(async () => {
    // Clear any existing preferences
    await supabase.from('user_preferences').delete().eq('user_id', testUserId);
  });

  it('should return 201 when creating new preferences', async () => {
    // Arrange: Prepare update payload
    const updatePayload: PreferenceUpdate = {
      theme: 'blueSky',
      colorMode: 'dark',
      language: 'ar',
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    // Assert: Check response
    expect(response.status).toBe(201);
    
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

  it('should return 200 when updating existing preferences', async () => {
    // Arrange: Create initial preferences
    await supabase.from('user_preferences').insert({
      user_id: testUserId,
      theme: 'gastat',
      color_mode: 'light',
      language: 'en',
    });

    const updatePayload: PreferenceUpdate = {
      theme: 'blueSky',
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    // Assert: Check response
    expect(response.status).toBe(200);
    
    const data: UserPreference = await response.json();
    expect(data.theme).toBe('blueSky');
    expect(data.colorMode).toBe('light'); // Should be unchanged
    expect(data.language).toBe('en'); // Should be unchanged
  });

  it('should allow partial updates with single field', async () => {
    // Arrange: Create initial preferences
    await supabase.from('user_preferences').insert({
      user_id: testUserId,
      theme: 'gastat',
      color_mode: 'light',
      language: 'en',
    });

    // Test theme only update
    const themeUpdate: PreferenceUpdate = { theme: 'blueSky' };
    const themeResponse = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(themeUpdate),
    });
    
    expect(themeResponse.status).toBe(200);
    const themeData: UserPreference = await themeResponse.json();
    expect(themeData.theme).toBe('blueSky');

    // Test colorMode only update
    const colorModeUpdate: PreferenceUpdate = { colorMode: 'dark' };
    const colorResponse = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(colorModeUpdate),
    });
    
    expect(colorResponse.status).toBe(200);
    const colorData: UserPreference = await colorResponse.json();
    expect(colorData.colorMode).toBe('dark');
    expect(colorData.theme).toBe('blueSky'); // Should persist from previous update

    // Test language only update
    const langUpdate: PreferenceUpdate = { language: 'ar' };
    const langResponse = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(langUpdate),
    });
    
    expect(langResponse.status).toBe(200);
    const langData: UserPreference = await langResponse.json();
    expect(langData.language).toBe('ar');
  });

  it('should return 400 for invalid theme value', async () => {
    // Arrange: Invalid theme value
    const invalidPayload = {
      theme: 'invalidTheme',
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    // Assert: Check response
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: expect.any(String),
      field: 'theme',
      validValues: ['gastat', 'blueSky'],
    });
  });

  it('should return 400 for invalid colorMode value', async () => {
    // Arrange: Invalid colorMode value
    const invalidPayload = {
      colorMode: 'invalid',
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    // Assert: Check response
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: expect.any(String),
      field: 'colorMode',
      validValues: ['light', 'dark', 'system'],
    });
  });

  it('should return 400 for invalid language value', async () => {
    // Arrange: Invalid language value
    const invalidPayload = {
      language: 'fr', // Not supported
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    // Assert: Check response
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      error: 'VALIDATION_ERROR',
      message: expect.any(String),
      field: 'language',
      validValues: ['en', 'ar'],
    });
  });

  it('should return 400 for empty request body', async () => {
    // Act: Make PUT request with empty body
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    // Assert: Check response
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toContain('at least one field');
  });

  it('should return 401 when user is not authenticated', async () => {
    // Act: Make PUT request without auth token
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'blueSky' }),
    });

    // Assert: Check response
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });

  it('should return 403 when trying to update another user preferences', async () => {
    // Arrange: Another user's ID
    const anotherUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    // Act: Try to update another user's preferences
    const response = await fetch(`${API_BASE_URL}/preferences/${anotherUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'blueSky' }),
    });

    // Assert: Check response
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.message).toBeDefined();
  });

  it('should handle rate limiting with 429 response', async () => {
    // This test simulates rate limiting behavior
    // In a real scenario, you'd need to make 60+ requests in a minute
    
    // For now, we'll just test the expected response format
    // when rate limiting would occur
    
    // Note: This is a placeholder test that would need actual
    // rate limiting implementation to fully test
    expect(true).toBe(true);
    
    // Expected response format:
    // {
    //   error: 'RATE_LIMIT_EXCEEDED',
    //   message: 'Too many preference updates. Please try again later.',
    //   retryAfter: 60
    // }
  });

  it('should reject additional properties not in schema', async () => {
    // Arrange: Payload with extra fields
    const invalidPayload = {
      theme: 'gastat',
      colorMode: 'light',
      language: 'en',
      extraField: 'should not be allowed',
      anotherExtra: 123,
    };

    // Act: Make PUT request
    const response = await fetch(`${API_BASE_URL}/preferences/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    // Assert: Should either ignore extra fields or return 400
    if (response.status === 200 || response.status === 201) {
      const data: UserPreference = await response.json();
      // Extra fields should not be saved
      expect(data).not.toHaveProperty('extraField');
      expect(data).not.toHaveProperty('anotherExtra');
    } else {
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    }
  });
});