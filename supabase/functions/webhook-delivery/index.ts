/**
 * Webhook Delivery Edge Function
 * Feature: webhook-integration
 *
 * Processes webhook event queue and delivers payloads to configured endpoints:
 * - Fetches pending events from queue
 * - Finds matching webhooks for each event type
 * - Delivers payload with signature verification
 * - Implements exponential backoff retry logic
 * - Updates delivery status and statistics
 *
 * This function should be called by a scheduled cron job or Supabase trigger.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface WebhookEvent {
  id: string;
  event_type: string;
  event_id: string;
  event_entity_type: string;
  event_payload: Record<string, unknown>;
  event_metadata: Record<string, unknown>;
  is_processed: boolean;
  retry_count: number;
}

interface Webhook {
  id: string;
  url: string;
  http_method: string;
  auth_type: string;
  auth_secret: string | null;
  auth_username: string | null;
  auth_password: string | null;
  subscribed_events: string[];
  payload_template: Record<string, unknown> | null;
  include_full_payload: boolean;
  custom_headers: Record<string, string>;
  max_retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  is_active: boolean;
}

interface DeliveryResult {
  webhook_id: string;
  success: boolean;
  status_code?: number;
  response_time_ms: number;
  error_message?: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST (for manual trigger) or scheduled invocation
  if (req.method !== 'POST') {
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

  try {
    // Create Supabase client with service role for full access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body for options
    let batchSize = 50;
    let processRetries = true;

    try {
      const body = await req.json();
      if (body.batch_size) batchSize = Math.min(body.batch_size, 100);
      if (body.process_retries !== undefined) processRetries = body.process_retries;
    } catch {
      // Use defaults if no body
    }

    // Process pending events
    const pendingResults = await processEventQueue(supabaseClient, batchSize);

    // Process retries if enabled
    let retryResults: { processed: number; succeeded: number; failed: number } = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    if (processRetries) {
      retryResults = await processRetryQueue(supabaseClient, batchSize);
    }

    // Clean up old processed events
    const cleanedUp = await cleanupOldEvents(supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        pending_events: pendingResults,
        retried_deliveries: retryResults,
        cleaned_up_events: cleanedUp,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook delivery error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'Webhook delivery processing failed',
          message_ar: 'فشلت معالجة تسليم الويب هوك',
          correlation_id: crypto.randomUUID(),
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Event Queue Processing
// ============================================================================

async function processEventQueue(
  supabase: ReturnType<typeof createClient>,
  batchSize: number
): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Fetch pending events
  const { data: events, error: fetchError } = await supabase
    .from('webhook_event_queue')
    .select('*')
    .eq('is_processed', false)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    console.error('Failed to fetch events:', fetchError);
    throw fetchError;
  }

  if (!events || events.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const event of events as WebhookEvent[]) {
    try {
      // Get all active webhooks subscribed to this event type
      const { data: webhooks, error: webhookError } = await supabase.rpc('get_webhooks_for_event', {
        p_event_type: event.event_type,
      });

      if (webhookError) {
        console.error(`Failed to get webhooks for event ${event.id}:`, webhookError);
        continue;
      }

      if (!webhooks || webhooks.length === 0) {
        // No webhooks subscribed - mark as processed
        await markEventProcessed(supabase, event.id);
        succeeded++;
        continue;
      }

      // Deliver to each webhook
      const deliveryPromises = (webhooks as Webhook[]).map((webhook) =>
        deliverToWebhook(supabase, webhook, event)
      );

      const results = await Promise.all(deliveryPromises);

      // Count successes
      const allSucceeded = results.every((r) => r.success);
      if (allSucceeded) {
        await markEventProcessed(supabase, event.id);
        succeeded++;
      } else {
        // Some failed - increment retry count
        await supabase
          .from('webhook_event_queue')
          .update({ retry_count: event.retry_count + 1 })
          .eq('id', event.id);
        failed++;
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      failed++;
    }
  }

  return { processed: events.length, succeeded, failed };
}

// ============================================================================
// Retry Queue Processing
// ============================================================================

async function processRetryQueue(
  supabase: ReturnType<typeof createClient>,
  batchSize: number
): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Fetch deliveries that need retry
  const { data: deliveries, error: fetchError } = await supabase
    .from('webhook_deliveries')
    .select('*, webhooks!inner(*)')
    .eq('status', 'retrying')
    .lte('next_retry_at', new Date().toISOString())
    .limit(batchSize);

  if (fetchError) {
    console.error('Failed to fetch retry queue:', fetchError);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (!deliveries || deliveries.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const webhook = delivery.webhooks as Webhook;

    if (!webhook.is_active) {
      // Webhook was disabled - mark as failed
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          error_message: 'Webhook disabled',
        })
        .eq('id', delivery.id);
      failed++;
      continue;
    }

    // Retry delivery
    const result = await executeDelivery(supabase, webhook, delivery.request_payload, delivery.id);

    if (result.success) {
      succeeded++;
    } else {
      // Check if we should retry again
      if (delivery.attempt_count >= webhook.max_retries) {
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: result.error_message || 'Max retries exceeded',
          })
          .eq('id', delivery.id);

        // Increment webhook failure count
        await supabase.rpc('increment_webhook_failure', { webhook_id: webhook.id });
      }
      failed++;
    }
  }

  return { processed: deliveries.length, succeeded, failed };
}

// ============================================================================
// Webhook Delivery
// ============================================================================

async function deliverToWebhook(
  supabase: ReturnType<typeof createClient>,
  webhook: Webhook,
  event: WebhookEvent
): Promise<DeliveryResult> {
  // Build payload
  const payload = buildPayload(webhook, event);

  // Create delivery record
  const { data: delivery, error: insertError } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: webhook.id,
      event_type: event.event_type,
      event_id: event.event_id,
      event_entity_type: event.event_entity_type,
      status: 'pending',
      request_url: webhook.url,
      request_method: webhook.http_method,
      request_payload: payload,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create delivery record:', insertError);
    return {
      webhook_id: webhook.id,
      success: false,
      response_time_ms: 0,
      error_message: 'Failed to create delivery record',
    };
  }

  // Execute delivery
  return await executeDelivery(supabase, webhook, payload, delivery.id);
}

async function executeDelivery(
  supabase: ReturnType<typeof createClient>,
  webhook: Webhook,
  payload: Record<string, unknown>,
  deliveryId: string
): Promise<DeliveryResult> {
  const startTime = Date.now();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Intl-Dossier-Webhook/1.0',
    'X-Webhook-Delivery-ID': deliveryId,
    ...webhook.custom_headers,
  };

  // Add authentication
  const payloadString = JSON.stringify(payload);

  if (webhook.auth_type === 'hmac_sha256' && webhook.auth_secret) {
    const signature = await generateHmacSignature(payloadString, webhook.auth_secret);
    headers['X-Webhook-Signature'] = `sha256=${signature}`;
  } else if (webhook.auth_type === 'bearer_token' && webhook.auth_secret) {
    headers['Authorization'] = `Bearer ${webhook.auth_secret}`;
  } else if (webhook.auth_type === 'basic_auth' && webhook.auth_username && webhook.auth_password) {
    const credentials = btoa(`${webhook.auth_username}:${webhook.auth_password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_seconds * 1000);

    const response = await fetch(webhook.url, {
      method: webhook.http_method,
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    const success = response.ok;

    // Update delivery record
    await supabase
      .from('webhook_deliveries')
      .update({
        status: success ? 'delivered' : 'retrying',
        response_status_code: response.status,
        response_headers: Object.fromEntries(response.headers.entries()),
        response_body: responseBody.substring(0, 5000), // Truncate
        response_time_ms: responseTime,
        delivered_at: success ? new Date().toISOString() : null,
        attempt_count: supabase.rpc('increment', { x: 1 }),
        next_retry_at: success ? null : calculateNextRetry(webhook.retry_delay_seconds, 1),
        signature_header: headers['X-Webhook-Signature'] || null,
      })
      .eq('id', deliveryId);

    // Update webhook statistics
    if (success) {
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          success_count: supabase.rpc('increment', { x: 1 }),
        })
        .eq('id', webhook.id);
    }

    return {
      webhook_id: webhook.id,
      success,
      status_code: response.status,
      response_time_ms: responseTime,
      error_message: success ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update delivery record with error
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'retrying',
        error_message: errorMessage,
        error_code:
          error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'CONNECTION_ERROR',
        response_time_ms: responseTime,
        attempt_count: supabase.rpc('increment', { x: 1 }),
        next_retry_at: calculateNextRetry(webhook.retry_delay_seconds, 1),
      })
      .eq('id', deliveryId);

    // Update webhook failure timestamp
    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_failure_at: new Date().toISOString(),
        failure_count: supabase.rpc('increment', { x: 1 }),
      })
      .eq('id', webhook.id);

    return {
      webhook_id: webhook.id,
      success: false,
      response_time_ms: responseTime,
      error_message: errorMessage,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildPayload(webhook: Webhook, event: WebhookEvent): Record<string, unknown> {
  const timestamp = new Date().toISOString();

  // Base payload
  const basePayload: Record<string, unknown> = {
    event: event.event_type,
    entity_type: event.event_entity_type,
    entity_id: event.event_id,
    timestamp,
  };

  // Add full payload if enabled
  if (webhook.include_full_payload) {
    basePayload.data = event.event_payload;
    basePayload.metadata = event.event_metadata;
  }

  // Apply template if configured
  if (webhook.payload_template) {
    return applyPayloadTemplate(webhook.payload_template, {
      ...basePayload,
      payload: event.event_payload,
    });
  }

  return basePayload;
}

function applyPayloadTemplate(
  template: Record<string, unknown>,
  data: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string') {
      // Replace template variables
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        const val = data[varName];
        return typeof val === 'string' ? val : JSON.stringify(val);
      });
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'object'
            ? applyPayloadTemplate(item as Record<string, unknown>, data)
            : item
        );
      } else {
        result[key] = applyPayloadTemplate(value as Record<string, unknown>, data);
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function calculateNextRetry(baseDelay: number, attemptCount: number): string {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, attemptCount - 1);
  const jitter = delay * 0.1 * Math.random();
  const totalDelay = Math.min(delay + jitter, 3600); // Max 1 hour

  return new Date(Date.now() + totalDelay * 1000).toISOString();
}

async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string
): Promise<void> {
  await supabase
    .from('webhook_event_queue')
    .update({
      is_processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId);
}

async function cleanupOldEvents(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_webhook_events');

  if (error) {
    console.error('Failed to cleanup events:', error);
    return 0;
  }

  return data || 0;
}
