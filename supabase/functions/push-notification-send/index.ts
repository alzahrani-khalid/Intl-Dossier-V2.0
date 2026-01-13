// Push Notification Send - Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNS)
// Handles real push notification delivery to mobile devices with priority levels and deep linking
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ===================================
// TYPES
// ===================================

type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';
type NotificationCategory =
  | 'assignments'
  | 'intake'
  | 'calendar'
  | 'signals'
  | 'mentions'
  | 'deadlines'
  | 'system'
  | 'workflow';
type Platform = 'ios' | 'android';
type Provider = 'expo' | 'fcm' | 'apns';

interface PushNotificationPayload {
  // Target recipients (at least one required)
  user_ids?: string[];
  device_tokens?: string[];

  // Notification content
  notification: {
    title: string;
    title_ar?: string; // Arabic title for RTL users
    body: string;
    body_ar?: string; // Arabic body for RTL users

    // Categorization
    category: NotificationCategory;
    priority: NotificationPriority;

    // Deep linking
    deep_link?: string; // e.g., "dossier/123" or "intake/456"
    entity_type?: string; // dossier, intake, calendar, etc.
    entity_id?: string;

    // Visual customization
    badge?: number;
    sound?: string | boolean; // 'default' or custom sound name
    image_url?: string; // Rich notification image

    // Grouping
    thread_id?: string; // For notification grouping
    collapse_key?: string; // For collapsible notifications

    // Data payload for app processing
    data?: Record<string, any>;
  };

  // Delivery options
  options?: {
    ttl?: number; // Time to live in seconds (default: 86400 = 24h)
    dry_run?: boolean; // Test without sending
    analytics_label?: string; // For tracking
  };
}

interface SendResult {
  device_id: string;
  platform: Platform;
  provider: Provider;
  status: 'success' | 'failed' | 'skipped';
  message_id?: string;
  error?: string;
  error_code?: string;
}

interface PushNotificationResponse {
  success: boolean;
  message: string;
  results: SendResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  notification_id?: string;
}

interface DeviceToken {
  id: string;
  user_id: string;
  device_token: string;
  platform: Platform;
  provider: Provider;
  device_name?: string;
  is_active: boolean;
  notification_preferences?: Record<string, boolean>;
  locale?: string;
}

// ===================================
// FIREBASE CLOUD MESSAGING (FCM)
// ===================================

/**
 * Get Firebase access token using service account credentials
 * Uses Google OAuth2 for server-to-server authentication
 */
async function getFirebaseAccessToken(): Promise<string> {
  const serviceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
  }

  try {
    const credentials = JSON.parse(serviceAccount);

    // Create JWT for Google OAuth2
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Encode JWT parts
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const encodedClaim = btoa(JSON.stringify(claim))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Sign JWT with private key
    const signData = `${encodedHeader}.${encodedClaim}`;

    // Import private key for signing
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(credentials.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signData)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${encodedHeader}.${encodedClaim}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get Firebase token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Firebase auth error:', error);
    throw new Error(`Firebase authentication failed: ${error.message}`);
  }
}

/**
 * Convert PEM private key to ArrayBuffer for WebCrypto
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Send notification via Firebase Cloud Messaging (FCM) HTTP v1 API
 */
async function sendFCMNotification(
  token: DeviceToken,
  payload: PushNotificationPayload['notification'],
  options?: PushNotificationPayload['options']
): Promise<SendResult> {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');

  if (!projectId) {
    return {
      device_id: token.id,
      platform: 'android',
      provider: 'fcm',
      status: 'failed',
      error: 'FIREBASE_PROJECT_ID not configured',
      error_code: 'CONFIG_ERROR',
    };
  }

  try {
    const accessToken = await getFirebaseAccessToken();

    // Determine title/body based on device locale
    const isArabic = token.locale?.startsWith('ar');
    const title = isArabic && payload.title_ar ? payload.title_ar : payload.title;
    const body = isArabic && payload.body_ar ? payload.body_ar : payload.body;

    // Build FCM message payload
    const fcmMessage = {
      message: {
        token: token.device_token,
        notification: {
          title,
          body,
          ...(payload.image_url && { image: payload.image_url }),
        },
        data: {
          // Always include notification metadata for app handling
          category: payload.category,
          priority: payload.priority,
          ...(payload.deep_link && { deep_link: payload.deep_link }),
          ...(payload.entity_type && { entity_type: payload.entity_type }),
          ...(payload.entity_id && { entity_id: payload.entity_id }),
          ...(payload.thread_id && { thread_id: payload.thread_id }),
          // Include custom data
          ...(payload.data &&
            Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]))),
        },
        android: {
          priority:
            payload.priority === 'urgent' || payload.priority === 'high' ? 'high' : 'normal',
          ttl: `${options?.ttl || 86400}s`,
          ...(payload.collapse_key && { collapse_key: payload.collapse_key }),
          notification: {
            channel_id: getAndroidChannel(payload.category, payload.priority),
            sound: payload.sound === false ? '' : 'default',
            ...(payload.badge !== undefined && { notification_count: payload.badge }),
            ...(payload.thread_id && { tag: payload.thread_id }),
            priority: getAndroidPriority(payload.priority),
          },
        },
        ...(options?.analytics_label && {
          fcm_options: { analytics_label: options.analytics_label },
        }),
      },
    };

    // Send to FCM HTTP v1 API
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmMessage),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorCode = errorData.error?.details?.[0]?.errorCode || 'UNKNOWN';

      return {
        device_id: token.id,
        platform: 'android',
        provider: 'fcm',
        status: 'failed',
        error: errorData.error?.message || 'FCM send failed',
        error_code: errorCode,
      };
    }

    const result = await response.json();

    return {
      device_id: token.id,
      platform: 'android',
      provider: 'fcm',
      status: 'success',
      message_id: result.name,
    };
  } catch (error) {
    return {
      device_id: token.id,
      platform: 'android',
      provider: 'fcm',
      status: 'failed',
      error: error.message,
      error_code: 'SEND_ERROR',
    };
  }
}

/**
 * Get Android notification channel based on category and priority
 */
function getAndroidChannel(category: NotificationCategory, priority: NotificationPriority): string {
  // High priority channels
  if (priority === 'urgent') return 'urgent_notifications';
  if (priority === 'high') return 'high_priority_notifications';

  // Category-specific channels
  const channelMap: Record<NotificationCategory, string> = {
    assignments: 'assignments_channel',
    intake: 'intake_channel',
    calendar: 'calendar_channel',
    signals: 'signals_channel',
    mentions: 'mentions_channel',
    deadlines: 'deadlines_channel',
    system: 'system_channel',
    workflow: 'workflow_channel',
  };

  return channelMap[category] || 'default_channel';
}

/**
 * Map priority to Android notification priority
 */
function getAndroidPriority(priority: NotificationPriority): string {
  const priorityMap: Record<NotificationPriority, string> = {
    urgent: 'PRIORITY_MAX',
    high: 'PRIORITY_HIGH',
    normal: 'PRIORITY_DEFAULT',
    low: 'PRIORITY_LOW',
  };
  return priorityMap[priority];
}

// ===================================
// APPLE PUSH NOTIFICATION SERVICE (APNS)
// ===================================

/**
 * Send notification via Apple Push Notification Service (APNS) HTTP/2 API
 */
async function sendAPNSNotification(
  token: DeviceToken,
  payload: PushNotificationPayload['notification'],
  options?: PushNotificationPayload['options']
): Promise<SendResult> {
  const apnsKey = Deno.env.get('APNS_AUTH_KEY');
  const apnsKeyId = Deno.env.get('APNS_KEY_ID');
  const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
  const bundleId = Deno.env.get('IOS_BUNDLE_ID') || 'com.gastat.dossier';
  const isProduction = Deno.env.get('APNS_PRODUCTION') === 'true';

  if (!apnsKey || !apnsKeyId || !apnsTeamId) {
    return {
      device_id: token.id,
      platform: 'ios',
      provider: 'apns',
      status: 'failed',
      error: 'APNS credentials not configured',
      error_code: 'CONFIG_ERROR',
    };
  }

  try {
    // Generate JWT for APNS authentication
    const apnsJwt = await generateAPNSJWT(apnsKey, apnsKeyId, apnsTeamId);

    // Determine title/body based on device locale
    const isArabic = token.locale?.startsWith('ar');
    const title = isArabic && payload.title_ar ? payload.title_ar : payload.title;
    const body = isArabic && payload.body_ar ? payload.body_ar : payload.body;

    // Build APNS payload
    const apnsPayload = {
      aps: {
        alert: {
          title,
          body,
          ...(payload.thread_id && { 'thread-id': payload.thread_id }),
        },
        ...(payload.badge !== undefined && { badge: payload.badge }),
        sound: payload.sound === false ? '' : payload.sound || 'default',
        'mutable-content': 1, // Allow notification service extension to modify
        'content-available': 1, // Enable background updates
        category: payload.category, // For notification actions
      },
      // Custom data
      category: payload.category,
      priority: payload.priority,
      ...(payload.deep_link && { deep_link: payload.deep_link }),
      ...(payload.entity_type && { entity_type: payload.entity_type }),
      ...(payload.entity_id && { entity_id: payload.entity_id }),
      ...(payload.data && payload.data),
    };

    // APNS endpoint
    const apnsHost = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

    // Map priority to APNS priority (10 = immediate, 5 = power considerations)
    const apnsPriority = payload.priority === 'urgent' || payload.priority === 'high' ? '10' : '5';

    // Send to APNS
    const response = await fetch(`https://${apnsHost}/3/device/${token.device_token}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${apnsJwt}`,
        'apns-topic': bundleId,
        'apns-priority': apnsPriority,
        'apns-push-type': 'alert',
        ...(options?.ttl && {
          'apns-expiration': String(Math.floor(Date.now() / 1000) + options.ttl),
        }),
        ...(payload.collapse_key && { 'apns-collapse-id': payload.collapse_key }),
      },
      body: JSON.stringify(apnsPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      return {
        device_id: token.id,
        platform: 'ios',
        provider: 'apns',
        status: 'failed',
        error: errorData.reason || `APNS error: ${response.status}`,
        error_code: errorData.reason || String(response.status),
      };
    }

    // APNS returns message ID in header
    const apnsId = response.headers.get('apns-id');

    return {
      device_id: token.id,
      platform: 'ios',
      provider: 'apns',
      status: 'success',
      message_id: apnsId || undefined,
    };
  } catch (error) {
    return {
      device_id: token.id,
      platform: 'ios',
      provider: 'apns',
      status: 'failed',
      error: error.message,
      error_code: 'SEND_ERROR',
    };
  }
}

/**
 * Generate JWT for APNS authentication
 */
async function generateAPNSJWT(privateKey: string, keyId: string, teamId: string): Promise<string> {
  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: teamId,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const encodedClaims = btoa(JSON.stringify(claims))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Import ES256 private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signData = `${encodedHeader}.${encodedClaims}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signData)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedClaims}.${encodedSignature}`;
}

// ===================================
// EXPO PUSH NOTIFICATIONS (Fallback)
// ===================================

/**
 * Send notification via Expo Push Notification Service
 * Used as fallback when FCM/APNS credentials are not configured
 */
async function sendExpoNotification(
  token: DeviceToken,
  payload: PushNotificationPayload['notification'],
  options?: PushNotificationPayload['options']
): Promise<SendResult> {
  // Expo push tokens start with "ExponentPushToken["
  if (!token.device_token.startsWith('ExponentPushToken[')) {
    return {
      device_id: token.id,
      platform: token.platform,
      provider: 'expo',
      status: 'failed',
      error: 'Invalid Expo push token format',
      error_code: 'INVALID_TOKEN',
    };
  }

  try {
    // Determine title/body based on device locale
    const isArabic = token.locale?.startsWith('ar');
    const title = isArabic && payload.title_ar ? payload.title_ar : payload.title;
    const body = isArabic && payload.body_ar ? payload.body_ar : payload.body;

    // Build Expo notification payload
    const expoPayload = {
      to: token.device_token,
      title,
      body,
      sound: payload.sound === false ? null : 'default',
      ...(payload.badge !== undefined && { badge: payload.badge }),
      priority: payload.priority === 'urgent' ? 'high' : 'default',
      ...(payload.thread_id && { channelId: payload.thread_id }),
      ...(options?.ttl && { ttl: options.ttl }),
      data: {
        category: payload.category,
        priority: payload.priority,
        ...(payload.deep_link && { deep_link: payload.deep_link }),
        ...(payload.entity_type && { entity_type: payload.entity_type }),
        ...(payload.entity_id && { entity_id: payload.entity_id }),
        ...(payload.data && payload.data),
      },
    };

    // Send to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPayload),
    });

    if (!response.ok) {
      return {
        device_id: token.id,
        platform: token.platform,
        provider: 'expo',
        status: 'failed',
        error: `Expo API error: ${response.status}`,
        error_code: String(response.status),
      };
    }

    const result = await response.json();

    if (result.data?.status === 'error') {
      return {
        device_id: token.id,
        platform: token.platform,
        provider: 'expo',
        status: 'failed',
        error: result.data.message,
        error_code: result.data.details?.error || 'EXPO_ERROR',
      };
    }

    return {
      device_id: token.id,
      platform: token.platform,
      provider: 'expo',
      status: 'success',
      message_id: result.data?.id,
    };
  } catch (error) {
    return {
      device_id: token.id,
      platform: token.platform,
      provider: 'expo',
      status: 'failed',
      error: error.message,
      error_code: 'SEND_ERROR',
    };
  }
}

// ===================================
// NOTIFICATION ROUTING & DELIVERY
// ===================================

/**
 * Send notification to a device using appropriate provider
 */
async function sendToDevice(
  token: DeviceToken,
  payload: PushNotificationPayload['notification'],
  options?: PushNotificationPayload['options']
): Promise<SendResult> {
  // Check if notifications are enabled for this category
  if (token.notification_preferences) {
    const categoryKey = getCategoryPreferenceKey(payload.category);
    if (token.notification_preferences[categoryKey] === false) {
      return {
        device_id: token.id,
        platform: token.platform,
        provider: token.provider || 'expo',
        status: 'skipped',
        error: 'Notifications disabled for this category',
      };
    }
  }

  // Dry run mode
  if (options?.dry_run) {
    return {
      device_id: token.id,
      platform: token.platform,
      provider: token.provider || 'expo',
      status: 'success',
      message_id: `dry-run-${Date.now()}`,
    };
  }

  // Route to appropriate provider
  const provider = token.provider || 'expo';

  switch (provider) {
    case 'fcm':
      return sendFCMNotification(token, payload, options);
    case 'apns':
      return sendAPNSNotification(token, payload, options);
    case 'expo':
    default:
      return sendExpoNotification(token, payload, options);
  }
}

/**
 * Get preference key for notification category
 */
function getCategoryPreferenceKey(category: NotificationCategory): string {
  const mapping: Record<NotificationCategory, string> = {
    assignments: 'assignments',
    intake: 'intake_updates',
    calendar: 'calendar_reminders',
    signals: 'signals',
    mentions: 'mentions',
    deadlines: 'deadlines',
    system: 'system_alerts',
    workflow: 'workflow_updates',
  };
  return mapping[category] || 'system_alerts';
}

// ===================================
// DATABASE OPERATIONS
// ===================================

/**
 * Get device tokens for specified users or device IDs
 */
async function getDeviceTokens(
  supabase: any,
  userIds?: string[],
  deviceTokens?: string[]
): Promise<DeviceToken[]> {
  let query = supabase
    .from('push_device_tokens')
    .select(
      `
      id,
      user_id,
      device_token,
      platform,
      provider,
      device_name,
      is_active,
      users!inner(locale)
    `
    )
    .eq('is_active', true);

  if (userIds && userIds.length > 0) {
    query = query.in('user_id', userIds);
  }

  if (deviceTokens && deviceTokens.length > 0) {
    query = query.in('device_token', deviceTokens);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching device tokens:', error);
    return [];
  }

  // Get notification preferences for each user
  const userPrefs = await getUserNotificationPreferences(
    supabase,
    (data || []).map((d: any) => d.user_id)
  );

  return (data || []).map((d: any) => ({
    ...d,
    locale: d.users?.locale || 'en',
    notification_preferences: userPrefs[d.user_id] || {},
  }));
}

/**
 * Get notification preferences for users
 */
async function getUserNotificationPreferences(
  supabase: any,
  userIds: string[]
): Promise<Record<string, Record<string, boolean>>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from('notification_category_preferences')
    .select('user_id, category, push_enabled')
    .in('user_id', userIds);

  if (error || !data) return {};

  const prefs: Record<string, Record<string, boolean>> = {};

  for (const row of data) {
    if (!prefs[row.user_id]) {
      prefs[row.user_id] = {};
    }
    prefs[row.user_id][row.category] = row.push_enabled;
  }

  return prefs;
}

/**
 * Store notification in history for tracking
 */
async function storeNotificationHistory(
  supabase: any,
  payload: PushNotificationPayload['notification'],
  results: SendResult[],
  requesterId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('notification_history')
      .insert({
        title: payload.title,
        body: payload.body,
        category: payload.category,
        priority: payload.priority,
        deep_link: payload.deep_link,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        data: payload.data,
        sent_count: results.filter((r) => r.status === 'success').length,
        failed_count: results.filter((r) => r.status === 'failed').length,
        skipped_count: results.filter((r) => r.status === 'skipped').length,
        delivery_results: results,
        created_by: requesterId,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to store notification history:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Error storing notification history:', error);
    return null;
  }
}

/**
 * Update device token status based on send result
 */
async function updateDeviceTokenStatus(supabase: any, result: SendResult): Promise<void> {
  // Handle invalid tokens
  const invalidErrorCodes = [
    'UNREGISTERED',
    'InvalidToken',
    'DeviceNotRegistered',
    'InvalidProviderToken',
  ];

  if (
    result.status === 'failed' &&
    result.error_code &&
    invalidErrorCodes.includes(result.error_code)
  ) {
    // Deactivate invalid token
    await supabase
      .from('push_device_tokens')
      .update({
        is_active: false,
        last_error: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.device_id);

    console.log(`Deactivated invalid device token: ${result.device_id}`);
  } else if (result.status === 'failed') {
    // Increment failed attempts for retry logic
    await supabase.rpc('increment_device_token_failed_attempts', { token_id: result.device_id });
  } else if (result.status === 'success') {
    // Update last used timestamp
    await supabase
      .from('push_device_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        failed_attempts: 0,
      })
      .eq('id', result.device_id);
  }
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
    const body: PushNotificationPayload = await req.json();

    // Validate required fields
    if (
      !body.notification?.title ||
      !body.notification?.body ||
      !body.notification?.category ||
      !body.notification?.priority
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Missing required fields: notification.title, notification.body, notification.category, notification.priority',
        }),
        { status: 400, headers }
      );
    }

    // Validate recipients
    if (
      (!body.user_ids || body.user_ids.length === 0) &&
      (!body.device_tokens || body.device_tokens.length === 0)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Must specify user_ids or device_tokens',
        }),
        { status: 400, headers }
      );
    }

    console.log(`Push notification request from user ${user.id}:`, {
      category: body.notification.category,
      priority: body.notification.priority,
      userCount: body.user_ids?.length || 0,
      tokenCount: body.device_tokens?.length || 0,
    });

    // Get device tokens
    const deviceTokens = await getDeviceTokens(supabase, body.user_ids, body.device_tokens);

    if (deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No active devices found for specified recipients',
        }),
        { status: 404, headers }
      );
    }

    // Send notifications to all devices
    const results: SendResult[] = [];

    for (const deviceToken of deviceTokens) {
      const result = await sendToDevice(deviceToken, body.notification, body.options);
      results.push(result);

      // Update device token status based on result
      await updateDeviceTokenStatus(supabase, result);
    }

    // Calculate summary
    const summary = {
      total: results.length,
      sent: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    };

    // Store notification history
    const notificationId = await storeNotificationHistory(
      supabase,
      body.notification,
      results,
      user.id
    );

    console.log(`Push notifications sent:`, summary);

    const response: PushNotificationResponse = {
      success: summary.sent > 0,
      message:
        summary.failed > 0
          ? `Sent ${summary.sent}/${summary.total} notifications (${summary.failed} failed, ${summary.skipped} skipped)`
          : `All ${summary.sent} notifications sent successfully`,
      results,
      summary,
      notification_id: notificationId || undefined,
    };

    const statusCode = summary.failed > 0 ? 207 : 200;

    return new Response(JSON.stringify(response), { status: statusCode, headers });
  } catch (error) {
    console.error('Push notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to send push notifications: ${error.message}`,
      }),
      { status: 500, headers }
    );
  }
});
