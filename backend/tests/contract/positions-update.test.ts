/**
 * Contract Test: PUT /positions/{id}
 * Feature: 011-positions-talking-points
 * Task: T020
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 * Tests optimistic locking with version field
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: PUT /positions/{id}', () => {
  let authToken: string;
  let testPositionId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    authToken = authData.session?.access_token || '';

    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Update Test Position',
        title_ar: 'تحديث موقف الاختبار',
        content_en: 'Original content',
        content_ar: 'المحتوى الأصلي',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    testPositionId = position!.id;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should update position with correct version', async () => {
    const requestBody = {
      content_en: 'Updated content',
      content_ar: 'محتوى محدث',
      version: 1
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-update?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.content_en).toBe('Updated content');
    expect(data.version).toBe(2); // Version should increment
  });

  it('should return 409 on concurrent modification (version conflict)', async () => {
    const requestBody = {
      content_en: 'Conflicting update',
      version: 1 // Old version number
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-update?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(409);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('concurrent modification');
  });

  it('should create new version record on update', async () => {
    // Get current version
    const { data: currentPosition } = await supabase
      .from('positions')
      .select('version')
      .eq('id', testPositionId)
      .single();

    const requestBody = {
      content_en: 'Version tracking test',
      version: currentPosition!.version
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-update?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);

    // Verify new version record created
    const { data: versions } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', testPositionId)
      .order('version_number', { ascending: false });

    expect(versions!.length).toBeGreaterThan(1);
  });

  it('should reject update if missing required version field', async () => {
    const requestBody = {
      content_en: 'Updated without version'
      // Missing version field
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-update?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(400);
  });
});
