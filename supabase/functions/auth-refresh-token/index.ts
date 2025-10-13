// T144 - Refresh token Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createServiceClient } from '../_shared/auth.ts'
import {
  errorResponse,
  successResponse,
  parseBody,
  validateRequiredFields,
  log,
  checkRateLimit,
  createHandler
} from '../_shared/utils.ts'
import jwt from 'https://esm.sh/jsonwebtoken@9.0.2'

interface RefreshTokenRequest {
  refresh_token: string
  device_id?: string
}

interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: {
    id: string
    email: string
    role: string
  }
}

/**
 * Validate refresh token
 */
async function validateRefreshToken(
  supabase: any,
  refreshToken: string
): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    // Decode refresh token (without verification for claims extraction)
    const jwtSecret = Deno.env.get('JWT_SECRET')
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    let decoded: any
    try {
      decoded = jwt.verify(refreshToken, jwtSecret) as any
    } catch (error) {
      log('warn', 'Invalid refresh token', { error: error.message })
      return null
    }

    // Check token type
    if (decoded.type !== 'refresh') {
      log('warn', 'Token is not a refresh token', { type: decoded.type })
      return null
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      log('warn', 'Refresh token expired', { exp: decoded.exp, now })
      return null
    }

    // Validate against stored refresh tokens
    const { data: storedToken, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', hashToken(refreshToken))
      .eq('user_id', decoded.sub)
      .eq('is_active', true)
      .single()

    if (error || !storedToken) {
      log('warn', 'Refresh token not found in database', {
        userId: decoded.sub,
        error: error?.message
      })
      return null
    }

    // Check if token is expired in database
    if (new Date(storedToken.expires_at) < new Date()) {
      log('warn', 'Refresh token expired in database', {
        userId: decoded.sub,
        expiresAt: storedToken.expires_at
      })
      return null
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.sub)
      .single()

    if (userError || !user || !user.is_active) {
      log('warn', 'User not found or inactive', {
        userId: decoded.sub,
        error: userError?.message
      })
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role
    }

  } catch (error) {
    log('error', 'Refresh token validation failed', { error: error.message })
    return null
  }
}

/**
 * Generate new access token
 */
function generateAccessToken(
  userId: string,
  email: string,
  role: string
): string {
  const jwtSecret = Deno.env.get('JWT_SECRET')
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured')
  }

  const payload = {
    sub: userId,
    email,
    role,
    type: 'access',
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  }

  return jwt.sign(payload, jwtSecret)
}

/**
 * Generate new refresh token
 */
function generateRefreshToken(userId: string): string {
  const jwtSecret = Deno.env.get('JWT_SECRET')
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured')
  }

  const payload = {
    sub: userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }

  return jwt.sign(payload, jwtSecret)
}

/**
 * Hash token for storage
 */
function hashToken(token: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  // Simple hash for demo - in production use proper crypto hash
  return btoa(String.fromCharCode(...data)).substring(0, 64)
}

/**
 * Store refresh token
 */
async function storeRefreshToken(
  supabase: any,
  userId: string,
  token: string,
  deviceId?: string
): Promise<void> {
  try {
    // Invalidate old tokens for this device
    if (deviceId) {
      await supabase
        .from('refresh_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_id', deviceId)
    }

    // Store new token
    const { error } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token_hash: hashToken(token),
        device_id: deviceId,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString()
      })

    if (error) {
      log('error', 'Failed to store refresh token', {
        userId,
        error: error.message
      })
    }

  } catch (error) {
    log('error', 'Failed to store refresh token', {
      userId,
      error: error.message
    })
  }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(
  supabase: any,
  userId: string,
  deviceId?: string
): Promise<void> {
  try {
    // Update user last login
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        last_login_device: deviceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'token_refresh',
        entity_type: 'auth',
        entity_id: userId,
        details: {
          device_id: deviceId,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

  } catch (error) {
    log('error', 'Failed to update last login', {
      userId,
      error: error.message
    })
    // Non-critical, don't throw
  }
}

const handler = createHandler(async (req: Request): Promise<Response> => {
  try {
    // Parse request body
    const body = await parseBody<RefreshTokenRequest>(req)
    validateRequiredFields(body, ['refresh_token'])

    // Rate limiting by IP (no user ID yet)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp, 20, 60000)) {
      return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    log('info', 'Token refresh request', {
      deviceId: body.device_id,
      ip: clientIp
    })

    // Create Supabase client
    const supabase = createServiceClient()

    // Validate refresh token
    const tokenData = await validateRefreshToken(supabase, body.refresh_token)

    if (!tokenData) {
      return errorResponse(
        'Invalid or expired refresh token',
        401,
        'INVALID_REFRESH_TOKEN'
      )
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(
      tokenData.userId,
      tokenData.email,
      tokenData.role
    )
    const newRefreshToken = generateRefreshToken(tokenData.userId)

    // Store new refresh token
    await storeRefreshToken(
      supabase,
      tokenData.userId,
      newRefreshToken,
      body.device_id
    )

    // Update last login
    await updateLastLogin(supabase, tokenData.userId, body.device_id)

    const response: RefreshTokenResponse = {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600, // 1 hour in seconds
      token_type: 'Bearer',
      user: {
        id: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role
      }
    }

    log('info', 'Token refreshed successfully', {
      userId: tokenData.userId,
      deviceId: body.device_id
    })

    return successResponse(response, 200, 'Token refreshed successfully')

  } catch (error) {
    log('error', 'Token refresh failed', { error: error.message })

    if (error.message.includes('JWT_SECRET')) {
      return errorResponse(
        'Server configuration error',
        500,
        'CONFIG_ERROR'
      )
    }

    return errorResponse(
      'Failed to refresh token',
      500,
      'TOKEN_REFRESH_FAILED',
      { error: error.message }
    )
  }
})

serve(handler)