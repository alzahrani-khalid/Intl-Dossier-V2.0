// T145 - Register device for push notifications
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

interface RegisterDeviceRequest {
  device_token: string
  device_id: string
  platform: 'ios' | 'android'
  device_name?: string
  device_model?: string
  os_version?: string
  app_version?: string
  notification_preferences?: {
    assignments: boolean
    intake_updates: boolean
    role_changes: boolean
    kanban_updates: boolean
    task_reminders: boolean
    system_alerts: boolean
  }
}

interface RegisterDeviceResponse {
  device_id: string
  registration_id: string
  status: 'active' | 'pending'
  platform: 'ios' | 'android'
  notification_types: string[]
  created_at: string
}

/**
 * Validate device token format
 */
function validateDeviceToken(token: string, platform: 'ios' | 'android'): boolean {
  if (!token || token.length === 0) {
    return false
  }

  // Basic validation for token format
  if (platform === 'ios') {
    // iOS APNS tokens are typically 64 hex characters
    return /^[a-fA-F0-9]{64}$/.test(token.replace(/\s/g, ''))
  } else if (platform === 'android') {
    // Android FCM tokens are typically 152-163 characters
    return token.length >= 100 && token.length <= 200
  }

  return false
}

/**
 * Register or update device token
 */
async function registerDevice(
  supabase: any,
  userId: string,
  request: RegisterDeviceRequest
): Promise<string> {
  try {
    // Check if device already registered
    const { data: existing } = await supabase
      .from('device_tokens')
      .select('id, status')
      .eq('user_id', userId)
      .eq('device_id', request.device_id)
      .single()

    const deviceData = {
      user_id: userId,
      device_id: request.device_id,
      device_token: request.device_token,
      platform: request.platform,
      device_name: request.device_name || `${request.platform} Device`,
      device_model: request.device_model,
      os_version: request.os_version,
      app_version: request.app_version,
      notification_preferences: request.notification_preferences || {
        assignments: true,
        intake_updates: true,
        role_changes: true,
        kanban_updates: true,
        task_reminders: true,
        system_alerts: true
      },
      status: 'active',
      updated_at: new Date().toISOString()
    }

    if (existing) {
      // Update existing registration
      const { data: updated, error } = await supabase
        .from('device_tokens')
        .update(deviceData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      log('info', 'Device token updated', {
        userId,
        deviceId: request.device_id,
        registrationId: existing.id
      })

      return existing.id
    } else {
      // Create new registration
      const { data: created, error } = await supabase
        .from('device_tokens')
        .insert({
          ...deviceData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      log('info', 'Device token registered', {
        userId,
        deviceId: request.device_id,
        registrationId: created.id
      })

      return created.id
    }

  } catch (error) {
    log('error', 'Failed to register device', {
      userId,
      deviceId: request.device_id,
      error: error.message
    })
    throw error
  }
}

/**
 * Update existing tokens for the same device
 */
async function updateExistingTokens(
  supabase: any,
  userId: string,
  deviceId: string,
  newToken: string
): Promise<void> {
  try {
    // Deactivate old tokens for the same device
    const { error } = await supabase
      .from('device_tokens')
      .update({
        status: 'inactive',
        deactivated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .neq('device_token', newToken)

    if (error) {
      log('warn', 'Failed to deactivate old tokens', {
        userId,
        deviceId,
        error: error.message
      })
    }

    // Clean up very old inactive tokens (older than 90 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)

    const { error: cleanupError } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'inactive')
      .lt('deactivated_at', cutoffDate.toISOString())

    if (cleanupError) {
      log('warn', 'Failed to clean up old tokens', {
        userId,
        error: cleanupError.message
      })
    }

  } catch (error) {
    log('error', 'Failed to update existing tokens', {
      userId,
      deviceId,
      error: error.message
    })
    // Non-critical, don't throw
  }
}

/**
 * Create audit log for device registration
 */
async function createAuditLog(
  supabase: any,
  userId: string,
  deviceId: string,
  platform: string,
  action: 'registered' | 'updated'
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: `device_${action}`,
        entity_type: 'device_token',
        entity_id: deviceId,
        details: {
          platform,
          action,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

  } catch (error) {
    log('error', 'Failed to create audit log', {
      userId,
      deviceId,
      error: error.message
    })
    // Non-critical, don't throw
  }
}

const handler = createHandler(async (req: Request): Promise<Response> => {
  try {
    // Validate JWT
    const authHeader = req.headers.get('authorization')
    const user = await validateJWT(authHeader)

    // Rate limiting
    if (!checkRateLimit(user.id, 10, 60000)) {
      return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // Parse request body
    const body = await parseBody<RegisterDeviceRequest>(req)
    validateRequiredFields(body, [
      'device_token',
      'device_id',
      'platform'
    ])

    // Validate platform
    if (!['ios', 'android'].includes(body.platform)) {
      return errorResponse(
        'Invalid platform. Must be "ios" or "android"',
        400,
        'INVALID_PLATFORM'
      )
    }

    // Validate device token format
    if (!validateDeviceToken(body.device_token, body.platform)) {
      return errorResponse(
        'Invalid device token format',
        400,
        'INVALID_TOKEN_FORMAT'
      )
    }

    log('info', 'Device registration request', {
      userId: user.id,
      deviceId: body.device_id,
      platform: body.platform
    })

    // Create Supabase client
    const supabase = createServiceClient()

    // Check if this is an update
    const { data: existingDevice } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', body.device_id)
      .single()

    const isUpdate = !!existingDevice

    // Register or update device
    const registrationId = await registerDevice(supabase, user.id, body)

    // Update existing tokens for the same device
    await updateExistingTokens(supabase, user.id, body.device_id, body.device_token)

    // Create audit log
    await createAuditLog(
      supabase,
      user.id,
      body.device_id,
      body.platform,
      isUpdate ? 'updated' : 'registered'
    )

    // Get registered device details
    const { data: device, error } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (error || !device) {
      throw new Error('Failed to retrieve device registration')
    }

    // Extract enabled notification types
    const notificationTypes = Object.entries(device.notification_preferences || {})
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type)

    const response: RegisterDeviceResponse = {
      device_id: device.device_id,
      registration_id: registrationId,
      status: device.status,
      platform: device.platform,
      notification_types: notificationTypes,
      created_at: device.created_at
    }

    log('info', 'Device registered successfully', {
      userId: user.id,
      deviceId: body.device_id,
      registrationId
    })

    return successResponse(
      response,
      isUpdate ? 200 : 201,
      `Device ${isUpdate ? 'updated' : 'registered'} successfully`
    )

  } catch (error) {
    log('error', 'Device registration failed', { error: error.message })

    if (error.message.includes('JWT')) {
      return errorResponse(error.message, 401, 'UNAUTHORIZED')
    }

    if (error.message.includes('unique constraint')) {
      return errorResponse(
        'Device token already registered',
        409,
        'TOKEN_ALREADY_REGISTERED'
      )
    }

    return errorResponse(
      'Failed to register device',
      500,
      'DEVICE_REGISTRATION_FAILED',
      { error: error.message }
    )
  }
})

serve(handler)