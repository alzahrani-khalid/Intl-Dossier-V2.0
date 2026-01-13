/**
 * Webhooks Edge Function
 * Feature: webhook-integration
 *
 * Comprehensive webhook management including:
 * - CRUD operations for webhook configurations
 * - List webhooks with filtering
 * - Test webhook endpoint connectivity
 * - Get delivery logs and statistics
 * - Get webhook templates
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface WebhookCreate {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  url: string;
  http_method?: 'POST' | 'PUT' | 'PATCH';
  auth_type?: 'none' | 'hmac_sha256' | 'bearer_token' | 'basic_auth';
  auth_secret?: string;
  auth_username?: string;
  auth_password?: string;
  subscribed_events: string[];
  payload_template?: Record<string, unknown>;
  include_full_payload?: boolean;
  custom_headers?: Record<string, string>;
  max_retries?: number;
  retry_delay_seconds?: number;
  timeout_seconds?: number;
  is_active?: boolean;
  auto_disable_threshold?: number;
}

interface WebhookUpdate extends Partial<WebhookCreate> {
  id: string;
}

interface WebhookListParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
  event_type?: string;
  search?: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL to determine action
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Route based on method and path
    switch (req.method) {
      case 'GET': {
        if (action === 'templates') {
          return await handleGetTemplates(supabaseClient);
        }
        if (action === 'deliveries') {
          const webhookId = url.searchParams.get('webhook_id');
          if (!webhookId) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 'BAD_REQUEST',
                  message_en: 'Missing webhook_id parameter',
                  message_ar: 'معرف الويب هوك مفقود',
                },
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return await handleGetDeliveries(supabaseClient, webhookId, url.searchParams);
        }
        if (action === 'stats') {
          const webhookId = url.searchParams.get('webhook_id');
          if (!webhookId) {
            return new Response(
              JSON.stringify({
                error: {
                  code: 'BAD_REQUEST',
                  message_en: 'Missing webhook_id parameter',
                  message_ar: 'معرف الويب هوك مفقود',
                },
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return await handleGetStats(supabaseClient, webhookId, url.searchParams);
        }

        // Check if getting a specific webhook by ID
        const webhookId = url.searchParams.get('id');
        if (webhookId) {
          return await handleGetWebhook(supabaseClient, webhookId);
        }

        // List webhooks
        return await handleListWebhooks(supabaseClient, url.searchParams, user.id);
      }

      case 'POST': {
        if (action === 'test') {
          const body = await req.json();
          return await handleTestWebhook(supabaseClient, body, user.id);
        }

        // Create webhook
        const body: WebhookCreate = await req.json();
        return await handleCreateWebhook(supabaseClient, body, user.id);
      }

      case 'PATCH': {
        const body: WebhookUpdate = await req.json();
        if (!body.id) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'BAD_REQUEST',
                message_en: 'Missing webhook ID',
                message_ar: 'معرف الويب هوك مفقود',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await handleUpdateWebhook(supabaseClient, body, user.id);
      }

      case 'DELETE': {
        const webhookId = url.searchParams.get('id');
        if (!webhookId) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'BAD_REQUEST',
                message_en: 'Missing webhook ID',
                message_ar: 'معرف الويب هوك مفقود',
              },
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await handleDeleteWebhook(supabaseClient, webhookId);
      }

      default:
        return new Response(
          JSON.stringify({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message_en: 'Method not allowed',
              message_ar: 'الطريقة غير مسموح بها',
            },
          }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Handlers
// ============================================================================

async function handleListWebhooks(
  supabase: ReturnType<typeof createClient>,
  params: URLSearchParams,
  userId: string
) {
  const page = parseInt(params.get('page') || '1');
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
  const isActive = params.get('is_active');
  const eventType = params.get('event_type');
  const search = params.get('search');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('webhooks')
    .select('*', { count: 'exact' })
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  if (eventType) {
    query = query.contains('subscribed_events', [eventType]);
  }

  if (search) {
    query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%,url.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing webhooks:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to list webhooks',
          message_ar: 'فشل في جلب قائمة الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Remove sensitive fields from response
  const sanitizedData = data?.map((webhook) => ({
    ...webhook,
    auth_secret: webhook.auth_secret ? '********' : null,
    auth_password: webhook.auth_password ? '********' : null,
  }));

  return new Response(
    JSON.stringify({
      data: sanitizedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetWebhook(supabase: ReturnType<typeof createClient>, webhookId: string) {
  const { data, error } = await supabase.from('webhooks').select('*').eq('id', webhookId).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Webhook not found',
            message_ar: 'الويب هوك غير موجود',
          },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.error('Error getting webhook:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to get webhook',
          message_ar: 'فشل في جلب الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Remove sensitive fields
  const sanitizedData = {
    ...data,
    auth_secret: data.auth_secret ? '********' : null,
    auth_password: data.auth_password ? '********' : null,
  };

  return new Response(JSON.stringify(sanitizedData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleCreateWebhook(
  supabase: ReturnType<typeof createClient>,
  body: WebhookCreate,
  userId: string
) {
  // Validate required fields
  if (!body.name_en || !body.name_ar || !body.url || !body.subscribed_events?.length) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'Missing required fields: name_en, name_ar, url, subscribed_events',
          message_ar:
            'الحقول المطلوبة مفقودة: الاسم بالإنجليزية، الاسم بالعربية، الرابط، الأحداث المشترك فيها',
        },
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate URL format
  try {
    const urlObj = new URL(body.url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message_en: 'Invalid URL format. Must be a valid HTTP or HTTPS URL.',
          message_ar: 'صيغة الرابط غير صالحة. يجب أن يكون رابط HTTP أو HTTPS صالح.',
        },
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create webhook
  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      created_by: userId,
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en,
      description_ar: body.description_ar,
      url: body.url,
      http_method: body.http_method || 'POST',
      auth_type: body.auth_type || 'hmac_sha256',
      auth_secret: body.auth_secret,
      auth_username: body.auth_username,
      auth_password: body.auth_password,
      subscribed_events: body.subscribed_events,
      payload_template: body.payload_template,
      include_full_payload: body.include_full_payload ?? true,
      custom_headers: body.custom_headers || {},
      max_retries: body.max_retries ?? 3,
      retry_delay_seconds: body.retry_delay_seconds ?? 60,
      timeout_seconds: body.timeout_seconds ?? 30,
      is_active: body.is_active ?? true,
      auto_disable_threshold: body.auto_disable_threshold ?? 10,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating webhook:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to create webhook',
          message_ar: 'فشل في إنشاء الويب هوك',
          details: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Remove sensitive fields from response
  const sanitizedData = {
    ...data,
    auth_secret: data.auth_secret ? '********' : null,
    auth_password: data.auth_password ? '********' : null,
  };

  return new Response(JSON.stringify(sanitizedData), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleUpdateWebhook(
  supabase: ReturnType<typeof createClient>,
  body: WebhookUpdate,
  userId: string
) {
  const { id, ...updates } = body;

  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = {};

  if (updates.name_en !== undefined) updateData.name_en = updates.name_en;
  if (updates.name_ar !== undefined) updateData.name_ar = updates.name_ar;
  if (updates.description_en !== undefined) updateData.description_en = updates.description_en;
  if (updates.description_ar !== undefined) updateData.description_ar = updates.description_ar;
  if (updates.url !== undefined) {
    // Validate URL format
    try {
      const urlObj = new URL(updates.url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      updateData.url = updates.url;
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message_en: 'Invalid URL format',
            message_ar: 'صيغة الرابط غير صالحة',
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  if (updates.http_method !== undefined) updateData.http_method = updates.http_method;
  if (updates.auth_type !== undefined) updateData.auth_type = updates.auth_type;
  if (updates.auth_secret !== undefined) updateData.auth_secret = updates.auth_secret;
  if (updates.auth_username !== undefined) updateData.auth_username = updates.auth_username;
  if (updates.auth_password !== undefined) updateData.auth_password = updates.auth_password;
  if (updates.subscribed_events !== undefined)
    updateData.subscribed_events = updates.subscribed_events;
  if (updates.payload_template !== undefined)
    updateData.payload_template = updates.payload_template;
  if (updates.include_full_payload !== undefined)
    updateData.include_full_payload = updates.include_full_payload;
  if (updates.custom_headers !== undefined) updateData.custom_headers = updates.custom_headers;
  if (updates.max_retries !== undefined) updateData.max_retries = updates.max_retries;
  if (updates.retry_delay_seconds !== undefined)
    updateData.retry_delay_seconds = updates.retry_delay_seconds;
  if (updates.timeout_seconds !== undefined) updateData.timeout_seconds = updates.timeout_seconds;
  if (updates.is_active !== undefined) {
    updateData.is_active = updates.is_active;
    // Clear auto-disabled state when re-enabling
    if (updates.is_active) {
      updateData.auto_disabled_at = null;
      updateData.failure_count = 0;
    }
  }
  if (updates.auto_disable_threshold !== undefined)
    updateData.auto_disable_threshold = updates.auto_disable_threshold;

  const { data, error } = await supabase
    .from('webhooks')
    .update(updateData)
    .eq('id', id)
    .eq('created_by', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Webhook not found or access denied',
            message_ar: 'الويب هوك غير موجود أو الوصول مرفوض',
          },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.error('Error updating webhook:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to update webhook',
          message_ar: 'فشل في تحديث الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Remove sensitive fields
  const sanitizedData = {
    ...data,
    auth_secret: data.auth_secret ? '********' : null,
    auth_password: data.auth_password ? '********' : null,
  };

  return new Response(JSON.stringify(sanitizedData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDeleteWebhook(supabase: ReturnType<typeof createClient>, webhookId: string) {
  const { error } = await supabase.from('webhooks').delete().eq('id', webhookId);

  if (error) {
    console.error('Error deleting webhook:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to delete webhook',
          message_ar: 'فشل في حذف الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleTestWebhook(
  supabase: ReturnType<typeof createClient>,
  body: { webhook_id?: string; url?: string; auth_type?: string; auth_secret?: string },
  userId: string
) {
  let testUrl: string;
  let authType: string;
  let authSecret: string | null = null;

  if (body.webhook_id) {
    // Test existing webhook
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('url, auth_type, auth_secret')
      .eq('id', body.webhook_id)
      .eq('created_by', userId)
      .single();

    if (error || !webhook) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message_en: 'Webhook not found',
            message_ar: 'الويب هوك غير موجود',
          },
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    testUrl = webhook.url;
    authType = webhook.auth_type;
    authSecret = webhook.auth_secret;
  } else if (body.url) {
    // Test URL directly
    testUrl = body.url;
    authType = body.auth_type || 'none';
    authSecret = body.auth_secret || null;
  } else {
    return new Response(
      JSON.stringify({
        error: {
          code: 'BAD_REQUEST',
          message_en: 'Either webhook_id or url is required',
          message_ar: 'معرف الويب هوك أو الرابط مطلوب',
        },
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create test payload
  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    message_en: 'This is a test webhook delivery from Intl-Dossier',
    message_ar: 'هذا اختبار لتسليم الويب هوك من Intl-Dossier',
    test: true,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Intl-Dossier-Webhook/1.0',
    'X-Webhook-Test': 'true',
  };

  // Add signature if HMAC
  if (authType === 'hmac_sha256' && authSecret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(authSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(JSON.stringify(testPayload))
    );
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    headers['X-Webhook-Signature'] = `sha256=${signatureHex}`;
  }

  // Send test request
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(testUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    return new Response(
      JSON.stringify({
        success: response.ok,
        status_code: response.status,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 1000), // Truncate long responses
        headers_sent: headers,
        payload_sent: testPayload,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error_message: errorMessage,
        response_time_ms: responseTime,
        headers_sent: headers,
        payload_sent: testPayload,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetDeliveries(
  supabase: ReturnType<typeof createClient>,
  webhookId: string,
  params: URLSearchParams
) {
  const page = parseInt(params.get('page') || '1');
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
  const status = params.get('status');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('webhook_deliveries')
    .select('*', { count: 'exact' })
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error getting deliveries:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to get delivery logs',
          message_ar: 'فشل في جلب سجلات التسليم',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetStats(
  supabase: ReturnType<typeof createClient>,
  webhookId: string,
  params: URLSearchParams
) {
  const days = parseInt(params.get('days') || '30');

  const { data, error } = await supabase.rpc('get_webhook_stats', {
    p_webhook_id: webhookId,
    p_days: days,
  });

  if (error) {
    console.error('Error getting stats:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to get webhook statistics',
          message_ar: 'فشل في جلب إحصائيات الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetTemplates(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('webhook_templates')
    .select('*')
    .eq('is_active', true)
    .order('name_en');

  if (error) {
    console.error('Error getting templates:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message_en: 'Failed to get webhook templates',
          message_ar: 'فشل في جلب قوالب الويب هوك',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
