/**
 * Contract Test: GET /positions/{id}
 * Feature: 011-positions-talking-points
 * Task: T019
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: GET /positions/{id}', () => {
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
        title_en: 'Test Position Detail',
        title_ar: 'تفاصيل موقف الاختبار',
        content_en: 'Detailed content',
        content_ar: 'محتوى مفصل',
        status: 'draft'
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

  it('should return position by ID with full schema', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-get?id=${testPositionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.id).toBe(testPositionId);
    expect(data).toHaveProperty('title_en');
    expect(data).toHaveProperty('title_ar');
    expect(data).toHaveProperty('content_en');
    expect(data).toHaveProperty('content_ar');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
  });

  it('should return 404 for non-existent position', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-get?id=${fakeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(404);
  });

  it('should return 403 for unauthorized access (RLS)', async () => {
    // Create position as different user that current user shouldn't access
    const { data: otherUserAuth } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_2_EMAIL || 'test2@example.com',
      password: process.env.TEST_USER_2_PASSWORD || 'testpassword456'
    });

    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: restrictedPosition } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Restricted Position',
        title_ar: 'موقف مقيد',
        status: 'draft'
      })
      .select()
      .single();

    // Try to access with original user token
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-get?id=${restrictedPosition!.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Should be 403 due to RLS policies
    expect([403, 404]).toContain(response.status);

    // Cleanup
    await supabase.from('positions').delete().eq('id', restrictedPosition!.id);
  });

  it('should include audience_groups in response', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-get?id=${testPositionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('audience_groups');
    expect(Array.isArray(data.audience_groups)).toBe(true);
  });
});
