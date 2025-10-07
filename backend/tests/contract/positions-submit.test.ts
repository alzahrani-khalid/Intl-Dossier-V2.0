/**
 * Contract Test: PUT /positions/{id}/submit
 * Feature: 011-positions-talking-points
 * Task: T021
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: PUT /positions/{id}/submit', () => {
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
        title_en: 'Submit Test Position',
        title_ar: 'إرسال موقف الاختبار',
        content_en: 'Complete English content for submission',
        content_ar: 'محتوى إنجليزي كامل للتقديم',
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

  it('should submit position with complete bilingual content', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-submit?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.position.status).toBe('under_review');
    expect(data.position.current_stage).toBe(1);
    expect(data).toHaveProperty('consistency_check');
    expect(data.consistency_check).toHaveProperty('consistency_score');
  });

  it('should reject submission without English content', async () => {
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: incompletePosition } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Incomplete Position',
        title_ar: 'موقف غير مكتمل',
        content_ar: 'محتوى عربي فقط',
        status: 'draft'
      })
      .select()
      .single();

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-submit?id=${incompletePosition!.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('content_en');

    // Cleanup
    await supabase.from('positions').delete().eq('id', incompletePosition!.id);
  });

  it('should reject submission without Arabic content', async () => {
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: incompletePosition } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Incomplete Position',
        title_ar: 'موقف غير مكتمل',
        content_en: 'English content only',
        status: 'draft'
      })
      .select()
      .single();

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-submit?id=${incompletePosition!.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('content_ar');

    // Cleanup
    await supabase.from('positions').delete().eq('id', incompletePosition!.id);
  });

  it('should include consistency check in response', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-submit?id=${testPositionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.consistency_check).toHaveProperty('consistency_score');
    expect(data.consistency_check).toHaveProperty('ai_service_available');
    expect(data.consistency_check).toHaveProperty('conflicts');
    expect(data.consistency_check.consistency_score).toBeGreaterThanOrEqual(0);
    expect(data.consistency_check.consistency_score).toBeLessThanOrEqual(100);
  });
});
