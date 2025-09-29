import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import app from '../../src/app';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('GET /api/preferences/{userId}', () => {
  const testUserId = 'test-user-123';
  
  beforeAll(async () => {
    // Clean up any existing test data
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', testUserId);
  });

  it('should return 404 when preferences not found for user', async () => {
    const response = await request(app)
      .get(`/api/preferences/${testUserId}`)
      .expect(404);

    expect(response.body).toEqual({
      error: 'Preferences not found',
      userId: testUserId
    });
  });

  it('should return user preferences when they exist', async () => {
    // Insert test preferences
    const testPreferences = {
      user_id: testUserId,
      theme: 'gastat',
      color_mode: 'light',
      language: 'en',
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('user_preferences')
      .insert(testPreferences);

    const response = await request(app)
      .get(`/api/preferences/${testUserId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      userId: testUserId,
      theme: 'gastat',
      colorMode: 'light',
      language: 'en'
    });
    expect(response.body.updatedAt).toBeDefined();
  });

  it('should validate userId format', async () => {
    const invalidUserId = '../../etc/passwd';
    
    const response = await request(app)
      .get(`/api/preferences/${invalidUserId}`)
      .expect(400);

    expect(response.body).toEqual({
      error: 'Invalid user ID format'
    });
  });

  it('should return default preferences for new users', async () => {
    const newUserId = 'new-user-456';
    
    const response = await request(app)
      .get(`/api/preferences/${newUserId}`)
      .expect(200);

    expect(response.body).toEqual({
      userId: newUserId,
      theme: 'gastat',
      colorMode: 'light',
      language: 'en',
      isDefault: true
    });
  });

  it('should handle database connection errors gracefully', async () => {
    // This test would mock a database failure
    // Implementation depends on your error handling strategy
  });
});