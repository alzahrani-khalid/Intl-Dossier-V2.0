/**
 * Contract Test: GET /positions
 * Feature: 011-positions-talking-points
 * Task: T017
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: GET /positions', () => {
  let testPositionId: string;
  let authToken: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    authToken = authData.session?.access_token || '';

    // Create test position
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    if (positionType) {
      const { data: position } = await supabase
        .from('positions')
        .insert({
          position_type_id: positionType.id,
          title_en: 'Test Position for List',
          title_ar: 'موقف اختبار للقائمة',
          content_en: 'Test content',
          content_ar: 'محتوى اختبار',
          thematic_category: 'Trade Policy',
          status: 'draft'
        })
        .select()
        .single();

      testPositionId = position?.id || '';
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should list positions with pagination', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-list?limit=20&offset=0`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('offset');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.limit).toBe(20);
    expect(data.offset).toBe(0);
  });

  it('should filter positions by status', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-list?status=draft`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data.data)).toBe(true);
    // All returned positions should have status='draft'
    data.data.forEach((position: any) => {
      expect(position.status).toBe('draft');
    });
  });

  it('should filter positions by thematic_category', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-list?thematic_category=Trade Policy`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should validate Position schema in response', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-list`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    if (data.data.length > 0) {
      const position = data.data[0];
      expect(position).toHaveProperty('id');
      expect(position).toHaveProperty('title_en');
      expect(position).toHaveProperty('title_ar');
      expect(position).toHaveProperty('status');
      expect(position).toHaveProperty('created_at');
    }
  });
});
