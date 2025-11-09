/**
 * Edge Function: intelligence-batch-update
 * Feature: 029-dynamic-country-intelligence
 *
 * Background job for automatic intelligence refresh based on TTL expiration.
 * Processes expired intelligence items in batches to maintain fresh cache.
 * Requires service role authentication (typically called by cron scheduler).
 *
 * @endpoint POST /intelligence-batch-update
 * @body BatchUpdateRequest
 * @auth Service Role Key required
 *
 * @returns Batch operation statistics and failure details
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/auth.ts';
import {
  BatchUpdateRequestSchema,
  BatchUpdateResponseSchema,
  parseRequestBody,
  createErrorResponse,
  validateIntelligenceTypes,
  type BatchUpdateRequest,
  type BatchUpdateResponse,
  type IntelligenceType,
} from '../_shared/validation-schemas.ts';

// AnythingLLM configuration
const ANYTHINGLLM_URL = Deno.env.get('ANYTHINGLLM_URL') || 'http://localhost:3001';
const ANYTHINGLLM_API_KEY = Deno.env.get('ANYTHINGLLM_API_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse(
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      'الطريقة غير مسموح بها',
      undefined,
      405
    );
  }

  try {
    // Validate service role authentication
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Service role authentication required',
        'مطلوب مصادقة دور الخدمة',
        undefined,
        401
      );
    }

    // Create service client
    const serviceClient = createServiceClient();

    // Parse and validate request body
    let requestBody: BatchUpdateRequest;

    try {
      requestBody = await parseRequestBody(BatchUpdateRequestSchema, req);
    } catch (error) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid request body: ${error.message}`,
        `نص الطلب غير صالح: ${error.message}`,
        { validation_errors: error.errors },
        400
      );
    }

    const { limit, intelligence_types, dry_run } = requestBody;

    // Validate intelligence types or use all types
    const typesToProcess = intelligence_types
      ? validateIntelligenceTypes(intelligence_types)
      : ['economic', 'political', 'security', 'bilateral', 'general'];

    const batchId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    console.log(
      `[Batch ${batchId}] Starting intelligence batch update at ${startedAt}`
    );
    console.log(`[Batch ${batchId}] Processing types: ${typesToProcess.join(', ')}`);
    console.log(`[Batch ${batchId}] Limit: ${limit}, Dry run: ${dry_run}`);

    // Find expired intelligence items
    const { data: expiredIntelligence, error: queryError } = await serviceClient
      .from('intelligence_reports')
      .select('id, entity_id, entity_type, intelligence_type, cache_expires_at, last_refreshed_at')
      .in('intelligence_type', typesToProcess)
      .is('deleted_at', null)
      .or('cache_expires_at.lt.now(),refresh_status.in.(stale,error,expired)')
      .neq('refresh_status', 'refreshing')
      .order('cache_expires_at', { ascending: true })
      .limit(limit);

    if (queryError) {
      console.error(`[Batch ${batchId}] Query error:`, queryError);
      return createErrorResponse(
        'QUERY_ERROR',
        'Failed to fetch expired intelligence items',
        'فشل في جلب عناصر المعلومات الاستخباراتية المنتهية الصلاحية',
        { database_error: queryError.message },
        500
      );
    }

    if (!expiredIntelligence || expiredIntelligence.length === 0) {
      console.log(`[Batch ${batchId}] No expired intelligence found`);

      const response: BatchUpdateResponse = {
        success: true,
        data: {
          batch_id: batchId,
          processed_count: 0,
          success_count: 0,
          failure_count: 0,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          failures: [],
        },
        message_en: 'No expired intelligence items to process',
        message_ar: 'لا توجد عناصر معلومات استخباراتية منتهية الصلاحية للمعالجة',
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[Batch ${batchId}] Found ${expiredIntelligence.length} expired intelligence items`
    );

    // Dry run: return without processing
    if (dry_run) {
      const response: BatchUpdateResponse = {
        success: true,
        data: {
          batch_id: batchId,
          processed_count: expiredIntelligence.length,
          success_count: 0,
          failure_count: 0,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          failures: [],
        },
        message_en: `Dry run completed. Would process ${expiredIntelligence.length} items.`,
        message_ar: `تم إكمال التشغيل التجريبي. سيتم معالجة ${expiredIntelligence.length} عنصرًا.`,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process expired intelligence items
    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{
      entity_id: string;
      intelligence_type: string;
      error_code: string;
      error_message: string;
    }> = [];

    // Process items sequentially to avoid overwhelming AnythingLLM
    for (const item of expiredIntelligence) {
      try {
        console.log(
          `[Batch ${batchId}] Processing ${item.intelligence_type} for entity ${item.entity_id}`
        );

        // Acquire lock
        const { data: lockAcquired } = await serviceClient.rpc(
          'lock_intelligence_for_refresh',
          {
            p_entity_id: item.entity_id,
            p_intelligence_type: item.intelligence_type,
            p_user_id: null, // System user for automatic refresh
            p_trigger_type: 'automatic',
          }
        );

        if (!lockAcquired) {
          console.warn(
            `[Batch ${batchId}] Failed to acquire lock for ${item.intelligence_type} on entity ${item.entity_id}`
          );
          failureCount++;
          failures.push({
            entity_id: item.entity_id,
            intelligence_type: item.intelligence_type,
            error_code: 'LOCK_FAILED',
            error_message: 'Failed to acquire lock (concurrent refresh in progress)',
          });
          continue;
        }

        // Fetch entity name for AnythingLLM query
        const { data: entity } = await serviceClient
          .from('dossiers')
          .select('name_en, type')
          .eq('id', item.entity_id)
          .single();

        if (!entity) {
          throw new Error('Entity not found');
        }

        // Refresh intelligence
        const refreshStartTime = Date.now();
        const intelligenceData = await fetchIntelligenceFromAnythingLLM(
          item.entity_id,
          entity.name_en,
          item.intelligence_type as IntelligenceType
        );
        const refreshDuration = Date.now() - refreshStartTime;

        // Update database
        const { error: updateError } = await serviceClient
          .from('intelligence_reports')
          .update({
            title: intelligenceData.title,
            title_ar: intelligenceData.title_ar,
            content: intelligenceData.content,
            content_ar: intelligenceData.content_ar,
            confidence_score: intelligenceData.confidence_score,
            refresh_status: 'fresh',
            last_refreshed_at: new Date().toISOString(),
            refresh_trigger_type: 'automatic',
            refresh_duration_ms: refreshDuration,
            refresh_error_message: null,
            data_sources_metadata: intelligenceData.data_sources_metadata,
            anythingllm_workspace_id: intelligenceData.workspace_id,
            anythingllm_query: intelligenceData.query,
            anythingllm_response_metadata: intelligenceData.response_metadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        successCount++;
        console.log(
          `[Batch ${batchId}] Successfully refreshed ${item.intelligence_type} for entity ${item.entity_id} in ${refreshDuration}ms`
        );
      } catch (error) {
        console.error(
          `[Batch ${batchId}] Failed to refresh ${item.intelligence_type} for entity ${item.entity_id}:`,
          error
        );

        failureCount++;
        failures.push({
          entity_id: item.entity_id,
          intelligence_type: item.intelligence_type,
          error_code: 'REFRESH_FAILED',
          error_message: error.message,
        });

        // Mark as error state
        await serviceClient
          .from('intelligence_reports')
          .update({
            refresh_status: 'error',
            refresh_error_message: error.message,
            last_refreshed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }

      // Add delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const completedAt = new Date().toISOString();
    const duration = Date.now() - startTime;

    console.log(`[Batch ${batchId}] Batch update completed at ${completedAt}`);
    console.log(
      `[Batch ${batchId}] Results: ${successCount} success, ${failureCount} failures, ${duration}ms duration`
    );

    // Build response
    const response: BatchUpdateResponse = {
      success: true,
      data: {
        batch_id: batchId,
        processed_count: expiredIntelligence.length,
        success_count: successCount,
        failure_count: failureCount,
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: duration,
        failures: failures.length > 0 ? failures : undefined,
      },
      message_en: `Batch intelligence refresh completed. ${successCount} successful, ${failureCount} failed.`,
      message_ar: `تم إكمال تحديث المعلومات الاستخباراتية بالدفعة. ${successCount} ناجح، ${failureCount} فاشل.`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Unexpected error in intelligence-batch-update:', error);

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      {
        error_message: error.message,
        error_stack: Deno.env.get('ENVIRONMENT') === 'development' ? error.stack : undefined,
      },
      500
    );
  }
});

/**
 * Fetches intelligence from AnythingLLM using RAG
 * (Duplicated from intelligence-refresh for now - should be extracted to shared utility)
 */
async function fetchIntelligenceFromAnythingLLM(
  entityId: string,
  entityName: string,
  intelligenceType: IntelligenceType
): Promise<{
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  confidence_score: number;
  data_sources_metadata: any[];
  workspace_id: string;
  query: string;
  response_metadata: any;
}> {
  // Check if AnythingLLM service is available
  try {
    const healthCheck = await fetch(`${ANYTHINGLLM_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!healthCheck.ok) {
      throw new Error('AnythingLLM service unavailable');
    }
  } catch (error) {
    throw new Error(`AnythingLLM service unavailable: ${error.message}`);
  }

  // Construct workspace slug
  const workspaceSlug = `country-${entityName.toLowerCase().replace(/\s+/g, '-')}`;

  // Build query based on intelligence type
  const queries: Record<IntelligenceType, string> = {
    economic: `Analyze current economic indicators for ${entityName} including GDP growth, inflation rate, trade balance, and major economic policies. Provide quantitative data with sources.`,
    political: `Summarize recent political events and diplomatic developments for ${entityName}. Include leadership changes, policy shifts, and international relations updates.`,
    security: `Assess current security situation and risk factors for ${entityName}. Include travel advisories, geopolitical tensions, and internal stability indicators.`,
    bilateral: `Analyze bilateral relationship between ${entityName} and Saudi Arabia. Include trade agreements, diplomatic ties, cultural exchanges, and areas of cooperation.`,
    general: `Provide general intelligence overview for ${entityName} covering key recent developments across economic, political, and security domains.`,
  };

  const query = queries[intelligenceType];

  // Call AnythingLLM API
  const response = await fetch(
    `${ANYTHINGLLM_URL}/api/v1/workspace/${workspaceSlug}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
      },
      body: JSON.stringify({
        message: query,
        mode: 'query',
        include_sources: true,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `AnythingLLM API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const content = data.textResponse || data.message || '';
  const sources = data.sources || [];
  const content_ar = `[محتوى عربي لـ ${intelligenceType}]`;
  const confidenceScore = Math.min(100, 50 + sources.length * 10);

  const dataSources = [
    {
      source: 'anythingllm',
      endpoint: `/api/v1/workspace/${workspaceSlug}/chat`,
      retrieved_at: new Date().toISOString(),
      confidence: confidenceScore,
    },
    ...sources.map((source: any) => ({
      source: source.title || 'Unknown',
      endpoint: source.link || '',
      retrieved_at: new Date().toISOString(),
      confidence: 90,
    })),
  ];

  return {
    title: `${entityName} - ${intelligenceType.charAt(0).toUpperCase() + intelligenceType.slice(1)} Intelligence`,
    title_ar: `${entityName} - معلومات استخباراتية ${intelligenceType}`,
    content,
    content_ar,
    confidence_score: confidenceScore,
    data_sources_metadata: dataSources,
    workspace_id: workspaceSlug,
    query,
    response_metadata: {
      model: data.model || 'unknown',
      tokens_used: data.tokens || 0,
      sources_cited: sources.map((s: any) => s.title || 'Unknown'),
    },
  };
}
