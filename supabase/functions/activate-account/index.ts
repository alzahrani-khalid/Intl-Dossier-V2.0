/**
 * Activate Account Edge Function
 *
 * Handles user account activation with token validation and password setup.
 * Public endpoint - no authorization required, validates via activation token.
 *
 * Feature: 019-user-management-access
 * Task: T022
 *
 * @module edge-functions/activate-account
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Redis } from 'https://esm.sh/@upstash/redis@1';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Redis for rate limiting and token storage
const redis = new Redis({
  url: Deno.env.get('REDIS_URL') ?? Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '',
  token: Deno.env.get('REDIS_TOKEN') ?? Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '',
});

const RATE_LIMIT_WINDOW = 5 * 60; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 3;

/**
 * Request body interface
 */
interface ActivateAccountRequest {
  activation_token: string;
  password: string;
}

/**
 * Stored activation token data
 */
interface ActivationTokenData {
  userId: string;
  email: string;
  createdAt: string;
}

/**
 * Rate limiting check
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `activate_account:${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // First request, set expiry
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }

  return count <= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Validate password strength
 * Requirements:
 * - Min 12 characters (as per contract spec line 157)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common or predictable');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate activation token format (should be UUID or secure token)
 */
function isValidTokenFormat(token: string): boolean {
  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Or a hex string of at least 32 characters (from generateResetToken pattern)
  const hexRegex = /^[0-9a-f]{32,}$/i;

  return uuidRegex.test(token) || hexRegex.test(token);
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers }
    );
  }

  try {
    // Get client IP for rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Check rate limit (3 requests per 5 minutes per IP)
    const withinRateLimit = await checkRateLimit(ipAddress);
    if (!withinRateLimit) {
      return new Response(
        JSON.stringify({
          error: 'Too many activation attempts',
          message: 'Please wait 5 minutes before trying again',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': '300'
          }
        }
      );
    }

    // Parse request body
    const body: ActivateAccountRequest = await req.json();
    const { activation_token, password } = body;

    // Validate required fields
    if (!activation_token) {
      return new Response(
        JSON.stringify({
          error: 'Activation token is required',
          code: 'MISSING_TOKEN'
        }),
        { status: 400, headers }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
        }),
        { status: 400, headers }
      );
    }

    // Validate token format
    if (!isValidTokenFormat(activation_token)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid activation token format',
          code: 'INVALID_TOKEN_FORMAT',
        }),
        { status: 400, headers }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Password does not meet security requirements',
          code: 'WEAK_PASSWORD',
          details: passwordValidation.errors,
        }),
        { status: 400, headers }
      );
    }

    // Retrieve and validate activation token from Redis
    const tokenKey = `activation_token:${activation_token}`;
    const tokenDataJson = await redis.get(tokenKey);

    if (!tokenDataJson) {
      return new Response(
        JSON.stringify({
          error: 'Activation token expired (valid for 48 hours)',
          code: 'TOKEN_EXPIRED',
          message: 'The activation link has expired. Please request a new activation email.',
        }),
        { status: 400, headers }
      );
    }

    const tokenData = JSON.parse(tokenDataJson as string) as ActivationTokenData;
    const { userId, email, createdAt } = tokenData;

    // Additional expiry check (48 hours = 172800000 ms)
    const tokenAge = Date.now() - new Date(createdAt).getTime();
    const TOKEN_EXPIRY = 48 * 60 * 60 * 1000; // 48 hours

    if (tokenAge > TOKEN_EXPIRY) {
      // Delete expired token
      await redis.del(tokenKey);

      return new Response(
        JSON.stringify({
          error: 'Activation token expired (valid for 48 hours)',
          code: 'TOKEN_EXPIRED',
          message: 'The activation link has expired. Please request a new activation email.',
        }),
        { status: 400, headers }
      );
    }

    // Check if user exists and is in pending status
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return new Response(
        JSON.stringify({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        }),
        { status: 400, headers }
      );
    }

    // Check if already activated
    if (user.status === 'active') {
      // Delete the token since it's no longer needed
      await redis.del(tokenKey);

      return new Response(
        JSON.stringify({
          error: 'Account already activated',
          code: 'ALREADY_ACTIVATED',
          message: 'This account has already been activated. Please log in.',
        }),
        { status: 400, headers }
      );
    }

    // Update user password using Supabase Auth Admin API
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (passwordError) {
      console.error('Password update error:', passwordError);
      return new Response(
        JSON.stringify({
          error: 'Failed to set password',
          code: 'PASSWORD_UPDATE_FAILED',
          message: passwordError.message,
        }),
        { status: 500, headers }
      );
    }

    // Update user status to 'active'
    const { error: updateError } = await supabase
      .from('auth.users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('User status update error:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to activate account',
          code: 'ACTIVATION_FAILED',
          message: updateError.message,
        }),
        { status: 500, headers }
      );
    }

    // Invalidate activation token (one-time use)
    await redis.del(tokenKey);

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        event_type: 'user_activated',
        user_id: userId,
        target_user_id: userId,
        resource_type: 'user',
        resource_id: userId,
        action: 'update',
        metadata: {
          email,
          activation_method: 'token',
        },
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      });

    console.log(`Account activated successfully for user: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account activated. You can now log in.',
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Account activation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to activate account. Please try again later.',
      }),
      { status: 500, headers }
    );
  }
});
