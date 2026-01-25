/**
 * Auth Step-Up Completion Endpoint
 * POST /auth/step-up/complete
 *
 * Purpose: Complete step-up MFA verification by validating TOTP code
 * Returns a step-up token valid for performing the authorized action
 *
 * Request Body:
 * {
 *   challenge_id: string,  // Challenge ID from initiation
 *   factor_id: string,     // MFA factor ID to use
 *   totp_code: string,     // 6-digit TOTP code
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   step_up_token: string,  // JWT token for step-up verification
 *   valid_until: string,    // Token expiration timestamp
 *   action: string,         // The authorized action
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface StepUpCompleteRequest {
  challenge_id: string;
  factor_id: string;
  totp_code: string;
}

// Maximum failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory failed attempts tracker (would use Redis in production)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST method is supported' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create service role client for managing challenges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid user session' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is locked out
    const lockoutKey = `lockout:${user.id}`;
    const lockoutInfo = failedAttempts.get(lockoutKey);
    if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
      const retryAfter = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Too many failed attempts. Please try again later.',
          message_ar: 'محاولات فاشلة كثيرة. يرجى المحاولة لاحقاً.',
          retry_after: retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Parse request body
    const body: StepUpCompleteRequest = await req.json();
    const { challenge_id, factor_id, totp_code } = body;

    // Validate required fields
    if (!challenge_id || !factor_id || !totp_code) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'challenge_id, factor_id, and totp_code are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate TOTP code format
    if (!/^\d{6}$/.test(totp_code)) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid TOTP code format. Expected 6 digits.',
          message_ar: 'رمز المصادقة غير صالح. يجب أن يكون 6 أرقام.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Look up challenge from database
    let challenge: {
      id: string;
      user_id: string;
      action: string;
      resource_id: string | null;
      expires_at: string;
      completed_at: string | null;
    } | null = null;

    const { data: challengeData, error: challengeError } = await supabaseAdmin
      .from('step_up_challenges')
      .select('*')
      .eq('id', challenge_id)
      .eq('user_id', user.id)
      .single();

    if (challengeError?.code !== '42P01') {
      // Table exists
      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({
            error: 'Not Found',
            message: 'Challenge not found or expired',
            message_ar: 'التحدي غير موجود أو منتهي الصلاحية',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      challenge = challengeData;
    }

    // Check if challenge has expired
    if (challenge && new Date(challenge.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: 'Gone',
          message: 'Challenge has expired. Please initiate a new step-up request.',
          message_ar: 'انتهت صلاحية التحدي. يرجى بدء طلب جديد.',
        }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if challenge was already completed
    if (challenge?.completed_at) {
      return new Response(
        JSON.stringify({
          error: 'Conflict',
          message: 'Challenge has already been completed',
          message_ar: 'تم إكمال التحدي بالفعل',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify TOTP code with Supabase Auth MFA
    const { data: challengeResponse, error: mfaChallengeError } =
      await supabaseClient.auth.mfa.challenge({ factorId: factor_id });

    if (mfaChallengeError || !challengeResponse) {
      console.error('MFA challenge error:', mfaChallengeError);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to create MFA challenge',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the TOTP code
    const { data: verifyData, error: verifyError } = await supabaseClient.auth.mfa.verify({
      factorId: factor_id,
      challengeId: challengeResponse.id,
      code: totp_code,
    });

    if (verifyError || !verifyData) {
      // Track failed attempt
      const currentAttempts = lockoutInfo?.count || 0;
      const newCount = currentAttempts + 1;

      if (newCount >= MAX_FAILED_ATTEMPTS) {
        failedAttempts.set(lockoutKey, {
          count: newCount,
          lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
        });
      } else {
        failedAttempts.set(lockoutKey, {
          count: newCount,
          lockedUntil: 0,
        });
      }

      // Record failed attempt in audit log
      await supabaseAdmin.from('audit_logs').insert({
        entity_type: 'user',
        entity_id: user.id,
        action: 'step_up_failed',
        user_id: user.id,
        user_role: 'user',
        ip_address: req.headers.get('X-Forwarded-For') || 'unknown',
        user_agent: req.headers.get('User-Agent') || 'unknown',
        required_mfa: true,
        mfa_verified: false,
        metadata: {
          challenge_id: challenge_id,
          factor_id: factor_id,
          attempt_count: newCount,
          error: verifyError?.message,
        },
      });

      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Invalid TOTP code. Please try again.',
          message_ar: 'رمز المصادقة غير صحيح. يرجى المحاولة مرة أخرى.',
          attempts_remaining: MAX_FAILED_ATTEMPTS - newCount,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clear failed attempts on success
    failedAttempts.delete(lockoutKey);

    // Mark challenge as completed
    if (challenge) {
      await supabaseAdmin
        .from('step_up_challenges')
        .update({
          completed_at: new Date().toISOString(),
          completed_factor_id: factor_id,
        })
        .eq('id', challenge_id);
    }

    // Generate step-up token (JWT-like structure)
    const validUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const stepUpToken = btoa(
      JSON.stringify({
        challenge_id: challenge_id,
        user_id: user.id,
        action: challenge?.action || 'unknown',
        resource_id: challenge?.resource_id,
        factor_id: factor_id,
        verified_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        nonce: crypto.randomUUID(),
      })
    );

    // Record successful verification in audit log
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'user',
      entity_id: user.id,
      action: 'step_up_completed',
      user_id: user.id,
      user_role: 'user',
      ip_address: req.headers.get('X-Forwarded-For') || 'unknown',
      user_agent: req.headers.get('User-Agent') || 'unknown',
      required_mfa: true,
      mfa_verified: true,
      mfa_method: 'totp',
      metadata: {
        challenge_id: challenge_id,
        factor_id: factor_id,
        action: challenge?.action,
        resource_id: challenge?.resource_id,
        valid_until: validUntil.toISOString(),
      },
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        step_up_token: stepUpToken,
        valid_until: validUntil.toISOString(),
        action: challenge?.action || 'unknown',
        message: 'Step-up verification successful',
        message_ar: 'تم التحقق بنجاح',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error during step-up completion:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
