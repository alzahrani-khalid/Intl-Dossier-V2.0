/**
 * Reset Password Edge Function
 *
 * Handles password reset completion with token validation,
 * TOTP verification for MFA users, and password strength enforcement.
 *
 * Feature: 019-user-management-access
 * Task: T020b
 *
 * @module edge-functions/reset-password
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Redis } from 'https://esm.sh/@upstash/redis@1'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
import * as OTPAuth from 'https://esm.sh/otpauth@9.1.4'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Redis
const redis = new Redis({
  url: Deno.env.get('REDIS_URL') ?? Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '',
  token: Deno.env.get('REDIS_TOKEN') ?? Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '',
})

/**
 * Request body interface
 */
interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
  totpCode?: string // Required for MFA users
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123']
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Verify a TOTP code against the user's stored MFA secret.
 *
 * The secret is the base32 TOTP secret stored in `public.users.mfa_secret`
 * (the canonical app users table — the same secret column the MFA setup flow
 * targets). Verification uses the `otpauth` library with a ±1 period window,
 * matching the verify-mfa-setup edge function.
 *
 * Fails closed: any lookup error, missing/empty secret, malformed secret, or
 * non-matching code returns `false`. There is no hardcoded/bypass code path.
 */
async function verifyTOTP(userId: string, totpCode: string): Promise<boolean> {
  if (!totpCode) {
    return false
  }

  // Read the user's TOTP secret from the canonical app users table.
  const { data: user, error } = await supabase
    .from('users')
    .select('mfa_secret')
    .eq('id', userId)
    .single()

  if (error || !user?.mfa_secret) {
    // No secret on file (or the lookup failed) — fail closed.
    return false
  }

  let totp: OTPAuth.TOTP
  try {
    totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.mfa_secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
  } catch {
    // Malformed/undecodable secret — fail closed.
    return false
  }

  // validate() returns the matching time-step delta, or null if the code is
  // invalid within the allowed window.
  const delta = totp.validate({ token: totpCode, window: 1 })

  return delta !== null
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  try {
    // Parse request body
    const body: ResetPasswordRequest = await req.json()
    const { resetToken, newPassword, totpCode } = body

    if (!resetToken || !newPassword) {
      return new Response(JSON.stringify({ error: 'Reset token and new password are required' }), {
        status: 400,
        headers,
      })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Weak password',
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors,
        }),
        { status: 400, headers },
      )
    }

    // Retrieve reset token data from Redis
    const tokenDataJson = await redis.get(`reset_token:${resetToken}`)
    if (!tokenDataJson) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired reset token',
          message: 'The reset link has expired or is invalid',
        }),
        { status: 400, headers },
      )
    }

    const tokenData = JSON.parse(tokenDataJson as string)
    const { userId, email, mfaEnabled } = tokenData

    // If MFA is enabled, verify TOTP code
    if (mfaEnabled) {
      if (!totpCode) {
        return new Response(
          JSON.stringify({
            error: 'MFA code required',
            message: 'TOTP code is required for MFA-enabled accounts',
          }),
          { status: 400, headers },
        )
      }

      const totpValid = await verifyTOTP(userId, totpCode)
      if (!totpValid) {
        return new Response(
          JSON.stringify({
            error: 'Invalid MFA code',
            message: 'The TOTP code is incorrect',
          }),
          { status: 400, headers },
        )
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword)

    // Update user password using Supabase Auth Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({
          error: 'Password update failed',
          message: updateError.message,
        }),
        { status: 500, headers },
      )
    }

    // Delete the reset token (one-time use)
    await redis.del(`reset_token:${resetToken}`)

    // Terminate all active sessions (force re-login)
    await supabase.from('user_sessions').delete().eq('user_id', userId)

    // Also invalidate sessions in Redis
    const sessionKeys = await redis.keys(`session:*`)
    for (const key of sessionKeys) {
      const sessionJson = await redis.get(key)
      if (sessionJson) {
        try {
          const session = JSON.parse(sessionJson as string)
          if (session.userId === userId) {
            await redis.del(key)
          }
        } catch {
          // Skip invalid session data
          continue
        }
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      event_type: 'password_reset_completed',
      user_id: userId,
      resource_type: 'user',
      resource_id: userId,
      action: 'update',
      metadata: {
        email,
        mfa_verified: mfaEnabled,
        sessions_terminated: true,
      },
      created_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        message: 'Password reset successful',
        success: true,
      }),
      { status: 200, headers },
    )
  } catch (error) {
    console.error('Password reset error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to reset password',
      }),
      { status: 500, headers },
    )
  }
})
