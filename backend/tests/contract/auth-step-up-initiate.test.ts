/**
 * Contract Test: POST /auth-verify-step-up
 * Feature: 011-positions-talking-points
 * Task: T035
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /auth-verify-step-up', () => {
  let authToken: string;
  let testPositionId: string;

  beforeAll(async () => {
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

    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Step-Up Test',
        title_ar: 'اختبار التحقق المتقدم',
        status: 'under_review'
      })
      .select()
      .single();

    testPositionId = position!.id;
  });

  it('should initiate step-up challenge', async () => {
    const requestBody = {
      action: 'approve',
      position_id: testPositionId
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('challenge_id');
    expect(data).toHaveProperty('challenge_type');
    expect(data).toHaveProperty('expires_at');
    expect(['totp', 'sms', 'push']).toContain(data.challenge_type);

    // Validate challenge_id is UUID
    expect(data.challenge_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should set challenge expiry to 10 minutes', async () => {
    const requestBody = {
      action: 'approve',
      position_id: testPositionId
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    expect(diffMinutes).toBeGreaterThan(9);
    expect(diffMinutes).toBeLessThan(11);
  });

  it('should reject request without required fields', async () => {
    const requestBody = {
      action: 'approve'
      // Missing position_id
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(400);
  });

  it('should determine appropriate challenge_type based on user profile', async () => {
    const requestBody = {
      action: 'approve',
      position_id: testPositionId
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Challenge type should be one of the supported types
    expect(['totp', 'sms', 'push']).toContain(data.challenge_type);
  });
});
