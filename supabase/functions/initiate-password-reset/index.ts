/**
 * Initiate Password Reset Edge Function
 *
 * Handles password reset initiation with MFA challenge for MFA-enabled users,
 * email reset link for non-MFA users, and rate limiting protection.
 *
 * Feature: 019-user-management-access
 * Task: T020a
 *
 * @module edge-functions/initiate-password-reset
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Redis } from 'https://esm.sh/@upstash/redis@1';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Redis for rate limiting
const redis = new Redis({
  url: Deno.env.get('REDIS_URL') ?? Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '',
  token: Deno.env.get('REDIS_TOKEN') ?? Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '',
});

const RATE_LIMIT_WINDOW = 5 * 60; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 3;
const RESET_TOKEN_TTL = 60 * 60; // 1 hour

/**
 * Request body interface
 */
interface ResetRequest {
  email: string;
}

/**
 * Rate limiting check
 */
async function checkRateLimit(email: string): Promise<boolean> {
  const key = `password_reset:${email}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // First request, set expiry
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }

  return count <= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Generate secure reset token
 */
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Send password reset email
 */
async function sendResetEmail(
  email: string,
  fullName: string,
  resetToken: string,
  language: 'ar' | 'en'
): Promise<void> {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  // For now, we'll log the reset link
  const resetLink = `${Deno.env.get('APP_URL')}/reset-password?token=${resetToken}`;

  console.log(`Password reset email for ${email}:`);
  console.log(`Reset link: ${resetLink}`);
  console.log(`Language: ${language}`);

  // TODO: Implement actual email sending
  // await sendEmail({
  //   to: email,
  //   subject: language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Your Password',
  //   template: 'password-reset',
  //   data: { fullName, resetLink, language }
  // });
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Parse request body
    const body: ResetRequest = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers }
      );
    }

    // Check rate limit (3 requests per 5 minutes)
    const withinRateLimit = await checkRateLimit(email);
    if (!withinRateLimit) {
      return new Response(
        JSON.stringify({
          error: 'Too many password reset requests',
          message: 'Please wait 5 minutes before trying again',
        }),
        { status: 429, headers }
      );
    }

    // Look up user by email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, full_name, mfa_enabled, preferences')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    // Don't reveal if email exists (security best practice)
    if (userError || !user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return new Response(
        JSON.stringify({
          message: 'If an account with that email exists, a password reset link has been sent.',
        }),
        { status: 200, headers }
      );
    }

    const language = user.preferences?.language || 'en';

    // Generate reset token
    const resetToken = generateResetToken();

    // Store reset token in Redis with TTL
    await redis.setex(
      `reset_token:${resetToken}`,
      RESET_TOKEN_TTL,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        mfaEnabled: user.mfa_enabled,
        createdAt: new Date().toISOString(),
      })
    );

    // If MFA is enabled, require MFA challenge
    if (user.mfa_enabled) {
      // Return token that requires MFA verification
      return new Response(
        JSON.stringify({
          message: 'MFA verification required',
          requiresMfa: true,
          resetToken: resetToken, // Client will need this for the next step
        }),
        { status: 200, headers }
      );
    }

    // For non-MFA users, send reset email directly
    await sendResetEmail(
      user.email,
      user.full_name || email,
      resetToken,
      language
    );

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        event_type: 'password_reset_initiated',
        user_id: user.id,
        resource_type: 'user',
        resource_id: user.id,
        action: 'update',
        metadata: {
          email: user.email,
          mfa_required: false,
        },
        created_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        message: 'If an account with that email exists, a password reset link has been sent.',
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Password reset initiation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to initiate password reset',
      }),
      { status: 500, headers }
    );
  }
});
