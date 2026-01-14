/**
 * Event Store Edge Function
 *
 * Comprehensive API for event sourcing operations:
 * - POST /event-store/events - Append a new event
 * - GET /event-store/events - Get events for an aggregate
 * - GET /event-store/events/correlated - Get events by correlation ID
 * - GET /event-store/state - Rebuild aggregate state
 * - GET /event-store/state/at-time - Get state at a specific point in time
 * - GET /event-store/history - Get aggregate history (timeline view)
 * - POST /event-store/snapshots - Create a snapshot
 * - GET /event-store/stats - Get event statistics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
type AggregateType =
  | 'person'
  | 'engagement'
  | 'organization'
  | 'country'
  | 'forum'
  | 'theme'
  | 'working_group'
  | 'relationship'
  | 'task'
  | 'commitment'
  | 'intake_ticket'
  | 'document'
  | 'mou';

type EventCategory =
  | 'lifecycle'
  | 'update'
  | 'relationship'
  | 'assignment'
  | 'status'
  | 'attachment'
  | 'workflow'
  | 'audit';

interface AppendEventRequest {
  event_type: string;
  event_category: EventCategory;
  aggregate_type: AggregateType;
  aggregate_id: string;
  payload: Record<string, unknown>;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  metadata?: Record<string, unknown>;
  correlation_id?: string;
  causation_id?: string;
  idempotency_key?: string;
  event_version?: number;
}

interface GetEventsParams {
  aggregate_type: AggregateType;
  aggregate_id: string;
  from_version?: number;
  to_version?: number;
  limit?: number;
}

interface CreateSnapshotRequest {
  aggregate_type: AggregateType;
  aggregate_id: string;
  state: Record<string, unknown>;
}

// Helper to create error response
function errorResponse(
  code: string,
  message_en: string,
  message_ar: string,
  status: number,
  details?: unknown
) {
  return new Response(
    JSON.stringify({
      error: { code, message_en, message_ar, details },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Helper to create success response
function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper to get authenticated user
async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid user session' };
  }

  return { user, error: null };
}

// Validation functions
function isValidAggregateType(type: string): type is AggregateType {
  const validTypes: AggregateType[] = [
    'person',
    'engagement',
    'organization',
    'country',
    'forum',
    'theme',
    'working_group',
    'relationship',
    'task',
    'commitment',
    'intake_ticket',
    'document',
    'mou',
  ];
  return validTypes.includes(type as AggregateType);
}

function isValidEventCategory(category: string): category is EventCategory {
  const validCategories: EventCategory[] = [
    'lifecycle',
    'update',
    'relationship',
    'assignment',
    'status',
    'attachment',
    'workflow',
    'audit',
  ];
  return validCategories.includes(category as EventCategory);
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Authenticate
    const { user, error: authError } = await getAuthUser(req, supabase);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', authError || 'Unauthorized', 'غير مصرح', 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const resource = pathParts[1]; // "events", "state", "history", "snapshots", "stats"
    const subResource = pathParts[2]; // "correlated", "at-time"

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /event-store/events - Get events for an aggregate
        if (resource === 'events' && !subResource) {
          const aggregateType = url.searchParams.get('aggregate_type');
          const aggregateId = url.searchParams.get('aggregate_id');
          const fromVersion = parseInt(url.searchParams.get('from_version') || '0');
          const toVersion = url.searchParams.get('to_version')
            ? parseInt(url.searchParams.get('to_version')!)
            : null;
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000'), 5000);

          if (!aggregateType || !isValidAggregateType(aggregateType)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!aggregateId || !isValidUUID(aggregateId)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('get_aggregate_events', {
            p_aggregate_type: aggregateType,
            p_aggregate_id: aggregateId,
            p_from_version: fromVersion,
            p_to_version: toVersion,
            p_limit: limit,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            events: data || [],
            total_count: data?.length || 0,
          });
        }

        // GET /event-store/events/correlated - Get events by correlation ID
        if (resource === 'events' && subResource === 'correlated') {
          const correlationId = url.searchParams.get('correlation_id');

          if (!correlationId || !isValidUUID(correlationId)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid correlation_id (UUID) is required',
              'معرف الارتباط مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('get_correlated_events', {
            p_correlation_id: correlationId,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            events: data || [],
            correlation_id: correlationId,
          });
        }

        // GET /event-store/state - Rebuild aggregate state
        if (resource === 'state' && !subResource) {
          const aggregateType = url.searchParams.get('aggregate_type');
          const aggregateId = url.searchParams.get('aggregate_id');
          const targetVersion = url.searchParams.get('target_version')
            ? parseInt(url.searchParams.get('target_version')!)
            : null;

          if (!aggregateType || !isValidAggregateType(aggregateType)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!aggregateId || !isValidUUID(aggregateId)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('rebuild_aggregate_state', {
            p_aggregate_type: aggregateType,
            p_aggregate_id: aggregateId,
            p_target_version: targetVersion,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            state: data || {},
            version: data?._version || 0,
            last_event_id: data?._last_event_id || null,
          });
        }

        // GET /event-store/state/at-time - Get state at a specific point in time
        if (resource === 'state' && subResource === 'at-time') {
          const aggregateType = url.searchParams.get('aggregate_type');
          const aggregateId = url.searchParams.get('aggregate_id');
          const timestamp = url.searchParams.get('timestamp');

          if (!aggregateType || !isValidAggregateType(aggregateType)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!aggregateId || !isValidUUID(aggregateId)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }
          if (!timestamp) {
            return errorResponse(
              'VALIDATION_ERROR',
              'timestamp is required (ISO 8601 format)',
              'الوقت مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('get_state_at_time', {
            p_aggregate_type: aggregateType,
            p_aggregate_id: aggregateId,
            p_timestamp: timestamp,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            state: data || null,
            as_of: timestamp,
          });
        }

        // GET /event-store/history - Get aggregate history (timeline view)
        if (resource === 'history') {
          const aggregateType = url.searchParams.get('aggregate_type');
          const aggregateId = url.searchParams.get('aggregate_id');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
          const offset = parseInt(url.searchParams.get('offset') || '0');

          if (!aggregateType || !isValidAggregateType(aggregateType)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!aggregateId || !isValidUUID(aggregateId)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('get_aggregate_history', {
            p_aggregate_type: aggregateType,
            p_aggregate_id: aggregateId,
            p_limit: limit,
            p_offset: offset,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          // Get total count
          const { count } = await supabase
            .from('events.domain_events')
            .select('*', { count: 'exact', head: true })
            .eq('aggregate_type', aggregateType)
            .eq('aggregate_id', aggregateId);

          return successResponse({
            history: data || [],
            total_count: count || 0,
            has_more: (data?.length || 0) === limit,
          });
        }

        // GET /event-store/stats - Get event statistics
        if (resource === 'stats') {
          const aggregateType = url.searchParams.get('aggregate_type');
          const aggregateId = url.searchParams.get('aggregate_id');

          if (aggregateType && aggregateId) {
            // Get stats for specific aggregate
            const { data, error } = await supabase
              .from('events.aggregate_stats')
              .select('*')
              .eq('aggregate_type', aggregateType)
              .eq('aggregate_id', aggregateId)
              .single();

            if (error && error.code !== 'PGRST116') {
              return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
            }

            return successResponse(data || null);
          }

          // Get event type distribution
          const { data, error } = await supabase
            .from('events.event_type_stats')
            .select('*')
            .order('event_count', { ascending: false })
            .limit(50);

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            event_types: data || [],
          });
        }

        return errorResponse('NOT_FOUND', 'Resource not found', 'المورد غير موجود', 404);
      }

      case 'POST': {
        // POST /event-store/events - Append a new event
        if (resource === 'events') {
          const body: AppendEventRequest = await req.json();

          // Validation
          if (!body.event_type || body.event_type.trim().length === 0) {
            return errorResponse(
              'VALIDATION_ERROR',
              'event_type is required',
              'نوع الحدث مطلوب',
              400
            );
          }
          if (!body.event_category || !isValidEventCategory(body.event_category)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid event_category is required',
              'فئة الحدث مطلوبة',
              400
            );
          }
          if (!body.aggregate_type || !isValidAggregateType(body.aggregate_type)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!body.aggregate_id || !isValidUUID(body.aggregate_id)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }
          if (!body.payload || typeof body.payload !== 'object') {
            return errorResponse(
              'VALIDATION_ERROR',
              'payload object is required',
              'بيانات الحدث مطلوبة',
              400
            );
          }

          // Validate UUID fields if provided
          if (body.correlation_id && !isValidUUID(body.correlation_id)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'correlation_id must be a valid UUID',
              'معرف الارتباط غير صالح',
              400
            );
          }
          if (body.causation_id && !isValidUUID(body.causation_id)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'causation_id must be a valid UUID',
              'معرف السبب غير صالح',
              400
            );
          }

          const { data, error } = await supabase.rpc('append_event', {
            p_event_type: body.event_type,
            p_event_category: body.event_category,
            p_aggregate_type: body.aggregate_type,
            p_aggregate_id: body.aggregate_id,
            p_payload: body.payload,
            p_changes: body.changes || null,
            p_metadata: body.metadata || {},
            p_correlation_id: body.correlation_id || null,
            p_causation_id: body.causation_id || null,
            p_idempotency_key: body.idempotency_key || null,
            p_event_version: body.event_version || 1,
          });

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في إضافة الحدث', 500, error);
          }

          return new Response(JSON.stringify({ event: data }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // POST /event-store/snapshots - Create a snapshot
        if (resource === 'snapshots') {
          const body: CreateSnapshotRequest = await req.json();

          // Validation
          if (!body.aggregate_type || !isValidAggregateType(body.aggregate_type)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_type is required',
              'نوع الكيان مطلوب',
              400
            );
          }
          if (!body.aggregate_id || !isValidUUID(body.aggregate_id)) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Valid aggregate_id (UUID) is required',
              'معرف الكيان مطلوب',
              400
            );
          }
          if (!body.state || typeof body.state !== 'object') {
            return errorResponse(
              'VALIDATION_ERROR',
              'state object is required',
              'حالة الكيان مطلوبة',
              400
            );
          }

          const { data, error } = await supabase.rpc('create_snapshot', {
            p_aggregate_type: body.aggregate_type,
            p_aggregate_id: body.aggregate_id,
            p_state: body.state,
          });

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في إنشاء اللقطة', 500, error);
          }

          return new Response(JSON.stringify({ snapshot: data }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return errorResponse('NOT_FOUND', 'Resource not found', 'المورد غير موجود', 404);
      }

      default:
        return errorResponse(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها',
          405
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500,
      { correlation_id: crypto.randomUUID() }
    );
  }
});
