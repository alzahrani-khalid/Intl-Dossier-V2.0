// T143 - Biometric setup Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { validateJWT, createServiceClient } from '../_shared/auth.ts'
import {
  errorResponse,
  successResponse,
  parseBody,
  validateRequiredFields,
  log,
  checkRateLimit,
  createHandler
} from '../_shared/utils.ts'

interface BiometricSetupRequest {
  device_id: string
  device_name: string
  platform: 'ios' | 'android'
  biometric_type: 'fingerprint' | 'face' | 'iris'
  public_key: string
  device_model?: string
  os_version?: string
}

interface BiometricSetupResponse {
  credential_id: string
  device_id: string
  status: 'active' | 'pending'
  expires_at: string
  verification_required: boolean
}

/**
 * Store biometric credentials for a device
 */
async function storeBiometricCredentials(
  supabase: any,
  userId: string,
  request: BiometricSetupRequest
): Promise<string> {
  try {
    // Check if device already has biometric credentials
    const { data: existing } = await supabase
      .from('biometric_credentials')
      .select('id, status')
      .eq('user_id', userId)
      .eq('device_id', request.device_id)
      .single()

    if (existing && existing.status === 'active') {
      // Update existing credentials
      const { data: updated, error } = await supabase
        .from('biometric_credentials')
        .update({
          public_key: request.public_key,
          biometric_type: request.biometric_type,
          device_model: request.device_model,
          os_version: request.os_version,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return updated.id
    }

    // Create new biometric credentials
    const { data: credential, error } = await supabase
      .from('biometric_credentials')
      .insert({
        user_id: userId,
        device_id: request.device_id,
        device_name: request.device_name,
        platform: request.platform,
        biometric_type: request.biometric_type,
        public_key: request.public_key,
        device_model: request.device_model,
        os_version: request.os_version,
        status: 'pending',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return credential.id

  } catch (error) {
    log('error', 'Failed to store biometric credentials', {
      userId,
      deviceId: request.device_id,
      error: error.message
    })
    throw error
  }
}

/**
 * Associate biometric credentials with user account
 */
async function associateWithAccount(
  supabase: any,
  userId: string,
  credentialId: string
): Promise<void> {
  try {
    // Update user profile to indicate biometric setup
    const { error: profileError } = await supabase
      .from('users')
      .update({
        has_biometric_auth: true,
        biometric_setup_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      log('warn', 'Failed to update user profile for biometric', {
        userId,
        error: profileError.message
      })
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'biometric_setup',
        entity_type: 'biometric_credential',
        entity_id: credentialId,
        details: {
          credential_id: credentialId,
          setup_type: 'initial'
        },
        created_at: new Date().toISOString()
      })

    if (auditError) {
      log('warn', 'Failed to create audit log', {
        userId,
        error: auditError.message
      })
    }

  } catch (error) {
    log('error', 'Failed to associate biometric with account', {
      userId,
      credentialId,
      error: error.message
    })
    // Non-critical error, don't throw
  }
}

/**
 * Validate existing session
 */
async function validateSession(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('id, expires_at, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !session) {
      return false
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    return expiresAt > new Date()

  } catch (error) {
    log('error', 'Session validation failed', {
      userId,
      error: error.message
    })
    return false
  }
}

const handler = createHandler(async (req: Request): Promise<Response> => {
  try {
    // Validate JWT
    const authHeader = req.headers.get('authorization')
    const user = await validateJWT(authHeader)

    // Rate limiting - stricter for security operations
    if (!checkRateLimit(user.id, 10, 60000)) {
      return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // Parse request body
    const body = await parseBody<BiometricSetupRequest>(req)
    validateRequiredFields(body, [
      'device_id',
      'device_name',
      'platform',
      'biometric_type',
      'public_key'
    ])

    log('info', 'Biometric setup request', {
      userId: user.id,
      deviceId: body.device_id,
      platform: body.platform,
      biometricType: body.biometric_type
    })

    // Create Supabase client
    const supabase = createServiceClient()

    // Validate existing session
    const hasValidSession = await validateSession(supabase, user.id)
    if (!hasValidSession) {
      return errorResponse(
        'Valid session required for biometric setup',
        401,
        'SESSION_REQUIRED'
      )
    }

    // Validate public key format (basic check)
    if (!body.public_key || body.public_key.length < 100) {
      return errorResponse(
        'Invalid public key format',
        400,
        'INVALID_PUBLIC_KEY'
      )
    }

    // Store biometric credentials
    const credentialId = await storeBiometricCredentials(supabase, user.id, body)

    // Associate with user account
    await associateWithAccount(supabase, user.id, credentialId)

    // Get credential details for response
    const { data: credential, error } = await supabase
      .from('biometric_credentials')
      .select('*')
      .eq('id', credentialId)
      .single()

    if (error || !credential) {
      throw new Error('Failed to retrieve stored credentials')
    }

    const response: BiometricSetupResponse = {
      credential_id: credentialId,
      device_id: credential.device_id,
      status: credential.status,
      expires_at: credential.expires_at,
      verification_required: credential.status === 'pending'
    }

    log('info', 'Biometric setup completed', {
      userId: user.id,
      credentialId,
      status: credential.status
    })

    return successResponse(
      response,
      201,
      'Biometric credentials registered successfully'
    )

  } catch (error) {
    log('error', 'Biometric setup failed', { error: error.message })

    if (error.message.includes('JWT')) {
      return errorResponse(error.message, 401, 'UNAUTHORIZED')
    }

    if (error.message.includes('unique constraint')) {
      return errorResponse(
        'Device already registered',
        409,
        'DEVICE_ALREADY_REGISTERED'
      )
    }

    return errorResponse(
      'Failed to setup biometric authentication',
      500,
      'BIOMETRIC_SETUP_FAILED',
      { error: error.message }
    )
  }
})

serve(handler)