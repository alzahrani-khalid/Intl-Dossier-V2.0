// Push Device Register - Register device tokens for FCM/APNS push notifications
// Supports Expo, FCM (Android), and APNS (iOS) tokens
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ===================================
// TYPES
// ===================================

type Platform = 'ios' | 'android';
type Provider = 'expo' | 'fcm' | 'apns';

interface RegisterDeviceRequest {
  device_token: string;
  device_id: string;
  platform: Platform;
  provider?: Provider;
  device_name?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
  locale?: string;
}

interface RegisterDeviceResponse {
  success: boolean;
  token_id: string;
  is_new: boolean;
  message: string;
}

// ===================================
// VALIDATION
// ===================================

/**
 * Validate device token format based on provider
 */
function validateDeviceToken(
  token: string,
  platform: Platform,
  provider: Provider
): { valid: boolean; error?: string } {
  if (!token || token.length === 0) {
    return { valid: false, error: 'Device token is required' };
  }

  switch (provider) {
    case 'expo':
      // Expo push tokens: ExponentPushToken[...]
      if (!token.startsWith('ExponentPushToken[') || !token.endsWith(']')) {
        return {
          valid: false,
          error: 'Invalid Expo push token format. Expected ExponentPushToken[...]',
        };
      }
      return { valid: true };

    case 'fcm':
      // FCM tokens are typically 152-163 characters
      if (token.length < 100 || token.length > 200) {
        return { valid: false, error: 'Invalid FCM token length. Expected 100-200 characters' };
      }
      return { valid: true };

    case 'apns':
      // APNS tokens are 64 hex characters (or may include spaces)
      const cleanToken = token.replace(/\s/g, '');
      if (!/^[a-fA-F0-9]{64}$/.test(cleanToken)) {
        return { valid: false, error: 'Invalid APNS token format. Expected 64 hex characters' };
      }
      return { valid: true };

    default:
      // For unknown providers, just check non-empty
      return { valid: true };
  }
}

/**
 * Detect provider from token format
 */
function detectProvider(token: string, platform: Platform): Provider {
  if (token.startsWith('ExponentPushToken[')) {
    return 'expo';
  }

  // FCM tokens are typically longer and contain alphanumeric + special chars
  if (platform === 'android' && token.length >= 100 && token.length <= 200) {
    return 'fcm';
  }

  // APNS tokens are 64 hex characters
  if (platform === 'ios' && /^[a-fA-F0-9]{64}$/.test(token.replace(/\s/g, ''))) {
    return 'apns';
  }

  // Default to expo for cross-platform compatibility
  return 'expo';
}

// ===================================
// MAIN HANDLER
// ===================================

serve(async (req: Request): Promise<Response> => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), {
        status: 401,
        headers,
      });
    }

    // Parse request body
    const body: RegisterDeviceRequest = await req.json();

    // Validate required fields
    if (!body.device_token) {
      return new Response(JSON.stringify({ success: false, message: 'device_token is required' }), {
        status: 400,
        headers,
      });
    }

    if (!body.device_id) {
      return new Response(JSON.stringify({ success: false, message: 'device_id is required' }), {
        status: 400,
        headers,
      });
    }

    if (!body.platform || !['ios', 'android'].includes(body.platform)) {
      return new Response(
        JSON.stringify({ success: false, message: 'platform must be "ios" or "android"' }),
        { status: 400, headers }
      );
    }

    // Detect provider if not specified
    const provider = body.provider || detectProvider(body.device_token, body.platform);

    // Validate token format
    const validation = validateDeviceToken(body.device_token, body.platform, provider);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, message: validation.error }), {
        status: 400,
        headers,
      });
    }

    console.log(`[push-device-register] Registering device for user ${user.id}:`, {
      platform: body.platform,
      provider,
      device_id: body.device_id,
    });

    // Register device token using database function
    const { data: result, error: registerError } = await supabase.rpc('register_device_token', {
      p_user_id: user.id,
      p_device_token: body.device_token,
      p_device_id: body.device_id,
      p_platform: body.platform,
      p_provider: provider,
      p_device_name: body.device_name || null,
      p_device_model: body.device_model || null,
      p_os_version: body.os_version || null,
      p_app_version: body.app_version || null,
      p_locale: body.locale || 'en',
    });

    if (registerError) {
      console.error('[push-device-register] Registration error:', registerError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to register device: ${registerError.message}`,
        }),
        { status: 500, headers }
      );
    }

    const tokenId = result?.[0]?.token_id;
    const isNew = result?.[0]?.is_new;

    // Create audit log entry
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: isNew ? 'device_registered' : 'device_updated',
        entity_type: 'push_device_token',
        entity_id: tokenId,
        details: {
          platform: body.platform,
          provider,
          device_id: body.device_id,
          device_name: body.device_name,
          app_version: body.app_version,
        },
        created_at: new Date().toISOString(),
      })
      .catch((err) => {
        console.warn('[push-device-register] Failed to create audit log:', err);
      });

    const response: RegisterDeviceResponse = {
      success: true,
      token_id: tokenId,
      is_new: isNew,
      message: isNew ? 'Device registered successfully' : 'Device token updated successfully',
    };

    console.log(`[push-device-register] ${response.message}:`, {
      token_id: tokenId,
      is_new: isNew,
    });

    return new Response(JSON.stringify(response), {
      status: isNew ? 201 : 200,
      headers,
    });
  } catch (error) {
    console.error('[push-device-register] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Registration failed: ${error.message}`,
      }),
      { status: 500, headers }
    );
  }
});
