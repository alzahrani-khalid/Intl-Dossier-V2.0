import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/app';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('PUT /api/preferences/{userId}', () => {
  const testUserId = 'test-user-789';
  
  beforeAll(async () => {
    // Clean up any existing test data
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', testUserId);
  });

  it('should create new preferences for a user', async () => {
    const newPreferences = {
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(newPreferences)
      .expect(200);

    expect(response.body).toMatchObject({
      userId: testUserId,
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar'
    });
    expect(response.body.updatedAt).toBeDefined();

    // Verify in database
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(data).toBeTruthy();
    expect(data.theme).toBe('blue-sky');
    expect(data.color_mode).toBe('dark');
    expect(data.language).toBe('ar');
  });

  it('should update existing preferences', async () => {
    // Create initial preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: testUserId,
        theme: 'gastat',
        color_mode: 'light',
        language: 'en'
      });

    const updatedPreferences = {
      theme: 'blue-sky',
      colorMode: 'dark',
      language: 'ar'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(updatedPreferences)
      .expect(200);

    expect(response.body.theme).toBe('blue-sky');
    expect(response.body.colorMode).toBe('dark');
    expect(response.body.language).toBe('ar');
  });

  it('should validate theme values', async () => {
    const invalidPreferences = {
      theme: 'invalid-theme',
      colorMode: 'light',
      language: 'en'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body.error).toContain('Invalid theme');
    expect(response.body.validThemes).toEqual(['gastat', 'blue-sky']);
  });

  it('should validate color mode values', async () => {
    const invalidPreferences = {
      theme: 'gastat',
      colorMode: 'invalid-mode',
      language: 'en'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body.error).toContain('Invalid color mode');
    expect(response.body.validModes).toEqual(['light', 'dark']);
  });

  it('should validate language values', async () => {
    const invalidPreferences = {
      theme: 'gastat',
      colorMode: 'light',
      language: 'invalid-lang'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(invalidPreferences)
      .expect(400);

    expect(response.body.error).toContain('Invalid language');
    expect(response.body.validLanguages).toEqual(['en', 'ar']);
  });

  it('should handle partial updates', async () => {
    // Set initial preferences
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: testUserId,
        theme: 'gastat',
        color_mode: 'light',
        language: 'en'
      });

    // Update only theme
    const partialUpdate = {
      theme: 'blue-sky'
    };

    const response = await request(app)
      .put(`/api/preferences/${testUserId}`)
      .send(partialUpdate)
      .expect(200);

    expect(response.body.theme).toBe('blue-sky');
    expect(response.body.colorMode).toBe('light'); // Unchanged
    expect(response.body.language).toBe('en'); // Unchanged
  });

  it('should validate userId format', async () => {
    const invalidUserId = '../../../etc/passwd';
    
    const response = await request(app)
      .put(`/api/preferences/${invalidUserId}`)
      .send({ theme: 'gastat' })
      .expect(400);

    expect(response.body.error).toContain('Invalid user ID format');
  });

  it('should handle concurrent updates correctly', async () => {
    // This test would simulate race conditions
    const promises = [
      request(app)
        .put(`/api/preferences/${testUserId}`)
        .send({ theme: 'gastat' }),
      request(app)
        .put(`/api/preferences/${testUserId}`)
        .send({ theme: 'blue-sky' })
    ];

    const responses = await Promise.all(promises);
    
    // Both should succeed, last write wins
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
});