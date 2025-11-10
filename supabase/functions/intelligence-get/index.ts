/**
 * Edge Function: intelligence-get
 * Feature: 029-dynamic-country-intelligence
 *
 * Fetches cached intelligence for an entity with TTL status and data source metadata.
 * Supports filtering by intelligence type for selective data retrieval.
 *
 * @endpoint GET /intelligence-get
 * @query entity_id - UUID of the dossier entity (required)
 * @query intelligence_type - Filter by specific type (optional)
 * @query include_stale - Include stale/expired intelligence (optional, default: true)
 * @query language - Preferred language: en or ar (optional, default: en)
 *
 * @returns IntelligenceReport[] with freshness indicators and metadata
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { validateJWT, createUserClient } from '../_shared/auth.ts';
import {
  GetIntelligenceQuerySchema,
  GetIntelligenceResponseSchema,
  parseQueryParams,
  createErrorResponse,
  calculateTimeUntilExpiry,
  isCacheExpired,
  type GetIntelligenceResponse,
  type IntelligenceReport,
} from '../_shared/validation-schemas.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return createErrorResponse(
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      'الطريقة غير مسموح بها',
      undefined,
      405
    );
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Missing authorization header',
        'رأس التفويض مفقود',
        undefined,
        401
      );
    }

    const user = await validateJWT(authHeader);
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user context
    const supabaseClient = createUserClient(token);

    // Parse and validate query parameters
    const url = new URL(req.url);
    let queryParams;

    try {
      queryParams = parseQueryParams(GetIntelligenceQuerySchema, url.searchParams);
    } catch (error) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid query parameters: ${error.message}`,
        `معلمات الاستعلام غير صالحة: ${error.message}`,
        { validation_errors: error.errors },
        400
      );
    }

    const {
      entity_id,
      intelligence_type,
      include_stale,
      language,
    } = queryParams;

    // Build query with filters
    let query = supabaseClient
      .from('intelligence_reports')
      .select('*')
      .eq('entity_id', entity_id)
      .is('deleted_at', null)
      .order('last_refreshed_at', { ascending: false });

    // Apply intelligence type filter if specified
    if (intelligence_type) {
      query = query.eq('intelligence_type', intelligence_type);
    }

    // Apply staleness filter
    if (!include_stale) {
      query = query.eq('refresh_status', 'fresh');
    }

    // Execute query
    const { data: intelligenceReports, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return createErrorResponse(
        'QUERY_ERROR',
        'Failed to fetch intelligence data',
        'فشل في جلب بيانات المعلومات الاستخباراتية',
        { database_error: queryError.message },
        500
      );
    }

    // Handle not found case
    if (!intelligenceReports || intelligenceReports.length === 0) {
      return createErrorResponse(
        'NOT_FOUND',
        'No intelligence data found for the specified entity',
        'لم يتم العثور على بيانات استخباراتية للكيان المحدد',
        { entity_id, intelligence_type },
        404
      );
    }

    // Enrich intelligence reports with computed fields
    const enrichedReports: IntelligenceReport[] = intelligenceReports.map((report) => {
      const isExpired = isCacheExpired(report.cache_expires_at);
      const timeUntilExpiry = calculateTimeUntilExpiry(report.cache_expires_at);

      // Convert confidence_level (string) to confidence_score (number) for frontend compatibility
      const confidenceLevelToScore = (level: string): number => {
        switch (level?.toLowerCase()) {
          case 'verified': return 95;
          case 'high': return 80;
          case 'medium': return 65;
          case 'low': return 40;
          default: return 50;
        }
      };

      const confidenceScore = report.confidence_score || confidenceLevelToScore(report.confidence_level);

      return {
        id: report.id,
        entity_id: report.entity_id,
        entity_type: report.entity_type,
        intelligence_type: report.intelligence_type,
        title: language === 'ar' ? report.title_ar || report.title : report.title,
        title_ar: report.title_ar,
        content: language === 'ar' ? report.content_ar || report.content : report.content,
        content_ar: report.content_ar,
        confidence_level: report.confidence_level,
        confidence_score: confidenceScore, // Add numeric score for frontend
        refresh_status: report.refresh_status,
        cache_expires_at: report.cache_expires_at,
        cache_created_at: report.cache_created_at,
        last_refreshed_at: report.last_refreshed_at,
        is_expired: isExpired,
        time_until_expiry_hours: timeUntilExpiry,
        data_sources_metadata: report.data_sources_metadata || [],
        metrics: report.metrics || null,
        anythingllm_workspace_id: report.anythingllm_workspace_id,
        anythingllm_query: report.anythingllm_query,
        anythingllm_response_metadata: report.anythingllm_response_metadata || {},
        version: report.version,
        created_at: report.created_at,
        updated_at: report.updated_at,
      };
    });

    // Calculate metadata
    const freshCount = enrichedReports.filter((r) => r.refresh_status === 'fresh').length;
    const staleCount = enrichedReports.filter((r) => r.refresh_status === 'stale' || r.is_expired).length;

    // Build response
    const response: GetIntelligenceResponse = {
      success: true,
      data: enrichedReports,
      meta: {
        total_count: enrichedReports.length,
        fresh_count: freshCount,
        stale_count: staleCount,
      },
    };

    // Validate response schema (development only)
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      try {
        GetIntelligenceResponseSchema.parse(response);
      } catch (validationError) {
        console.error('Response validation error:', validationError);
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=120',
      },
    });
  } catch (error) {
    console.error('Unexpected error in intelligence-get:', error);

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
