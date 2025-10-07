/**
 * Contract Test: POST /auth-verify-step-up/complete
 * Feature: 011-positions-talking-points
 * Task: T036
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /auth-verify-step-up/complete', () => {
  let authToken: string;
  let challengeId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    authToken = authData.session?.access_token || '';

    // Initiate step-up to get challenge_id
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Complete Step-Up Test',
        title_ar: 'إكمال اختبار التحقق',
        status: 'under_review'
      })
      .select()
      .single();

    const initiateResponse = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'approve',
        position_id: position!.id
      })
    });

    const initiateData = await initiateResponse.json();
    challengeId = initiateData.challenge_id;
  });

  it('should complete step-up with valid verification code', async () => {
    const requestBody = {
      challenge_id: challengeId,
      verification_code: '123456' // Valid test code
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('elevated_token');
    expect(data).toHaveProperty('valid_until');
    expect(typeof data.elevated_token).toBe('string');
    expect(data.elevated_token.length).toBeGreaterThan(0);
  });

  it('should set elevated token validity to 5-10 minutes', async () => {
    const requestBody = {
      challenge_id: challengeId,
      verification_code: '123456'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    const validUntil = new Date(data.valid_until);
    const now = new Date();
    const diffMinutes = (validUntil.getTime() - now.getTime()) / (1000 * 60);

    expect(diffMinutes).toBeGreaterThanOrEqual(5);
    expect(diffMinutes).toBeLessThanOrEqual(10);
  });

  it('should return 401 for invalid verification code', async () => {
    const requestBody = {
      challenge_id: challengeId,
      verification_code: '000000' // Invalid code
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  it('should return 401 for expired challenge', async () => {
    // Use an old/expired challenge_id
    const expiredChallengeId = '00000000-0000-0000-0000-000000000000';

    const requestBody = {
      challenge_id: expiredChallengeId,
      verification_code: '123456'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(401);
  });

  it('should reject request without required fields', async () => {
    const requestBody = {
      challenge_id: challengeId
      // Missing verification_code
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-step-up-complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(400);
  });
});
