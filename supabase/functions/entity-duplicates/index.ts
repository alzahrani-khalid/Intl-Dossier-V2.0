/**
 * Entity Duplicates Edge Function
 * Feature: entity-duplicate-detection
 *
 * API for detecting and managing duplicate persons and organizations:
 * - GET /entity-duplicates - List pending duplicate candidates
 * - GET /entity-duplicates/search/:entityId - Find duplicates for a specific entity
 * - GET /entity-duplicates/:id - Get duplicate candidate details
 * - POST /entity-duplicates/scan - Trigger duplicate scan for entity type
 * - POST /entity-duplicates/:id/merge - Merge duplicate entities
 * - POST /entity-duplicates/:id/dismiss - Dismiss duplicate candidate
 * - GET /entity-duplicates/history/:entityId - Get merge history for entity
 * - GET /entity-duplicates/settings - Get duplicate detection settings
 * - PATCH /entity-duplicates/settings/:entityType - Update settings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
type EntityType = 'person' | 'organization';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface DuplicateCandidate {
  id: string;
  source_entity_id: string;
  source_name_en: string;
  source_name_ar: string;
  target_entity_id: string;
  target_name_en: string;
  target_name_ar: string;
  entity_type: EntityType;
  overall_score: number;
  confidence_level: ConfidenceLevel;
  match_details: Record<string, unknown>;
  detected_at: string;
}

interface MergeRequest {
  primary_entity_id: string;
  duplicate_entity_id: string;
  field_resolutions?: Record<string, unknown>;
  reason?: string;
}

interface DismissRequest {
  reason?: string;
}

interface ScanRequest {
  entity_type: EntityType;
  days_back?: number;
  batch_size?: number;
}

interface SettingsUpdateRequest {
  auto_detect_threshold?: number;
  suggest_threshold?: number;
  name_weight?: number;
  name_ar_weight?: number;
  email_weight?: number;
  phone_weight?: number;
  organization_weight?: number;
  attribute_weight?: number;
  scan_recent_days?: number;
  max_candidates_per_entity?: number;
  is_enabled?: boolean;
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
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
    const subResource = pathParts[1]; // "search", "scan", "history", "settings", or candidate ID
    const entityIdOrType = pathParts[2]; // entity ID or entity type

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /entity-duplicates/settings - Get detection settings
        if (subResource === 'settings') {
          const { data, error } = await supabase
            .from('duplicate_detection_settings')
            .select('*')
            .order('entity_type');

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return new Response(JSON.stringify({ data }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // GET /entity-duplicates/search/:entityId - Find duplicates for specific entity
        if (subResource === 'search' && entityIdOrType) {
          const entityType = (url.searchParams.get('type') as EntityType) || 'person';
          const threshold = parseFloat(url.searchParams.get('threshold') || '0.60');
          const limit = parseInt(url.searchParams.get('limit') || '10');

          let data;
          let error;

          if (entityType === 'person') {
            ({ data, error } = await supabase.rpc('find_duplicate_persons', {
              p_person_id: entityIdOrType,
              p_threshold: threshold,
              p_limit: limit,
            }));
          } else {
            ({ data, error } = await supabase.rpc('find_duplicate_organizations', {
              p_org_id: entityIdOrType,
              p_threshold: threshold,
              p_limit: limit,
            }));
          }

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return new Response(
            JSON.stringify({
              entity_id: entityIdOrType,
              entity_type: entityType,
              candidates: data || [],
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // GET /entity-duplicates/history/:entityId - Get merge history
        if (subResource === 'history' && entityIdOrType) {
          const { data, error } = await supabase.rpc('get_entity_merge_history', {
            p_entity_id: entityIdOrType,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return new Response(JSON.stringify({ data: data || [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // GET /entity-duplicates/:id - Get specific duplicate candidate
        if (
          subResource &&
          subResource !== 'search' &&
          subResource !== 'history' &&
          subResource !== 'settings'
        ) {
          const { data, error } = await supabase
            .from('entity_duplicate_candidates')
            .select(
              `
              *,
              source_dossier:dossiers!source_entity_id(id, name_en, name_ar, type, status),
              target_dossier:dossiers!target_entity_id(id, name_en, name_ar, type, status)
            `
            )
            .eq('id', subResource)
            .single();

          if (error) {
            return errorResponse(
              'NOT_FOUND',
              'Duplicate candidate not found',
              'السجل غير موجود',
              404
            );
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // GET /entity-duplicates - List pending duplicates
        const entityTypeFilter = url.searchParams.get('entity_type') as EntityType | null;
        const confidenceFilter = url.searchParams.get('confidence_level') as ConfidenceLevel | null;
        const status = url.searchParams.get('status') || 'pending';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error } = await supabase.rpc('get_pending_duplicates', {
          p_entity_type: entityTypeFilter,
          p_confidence_level: confidenceFilter,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        // Get total count
        let countQuery = supabase
          .from('entity_duplicate_candidates')
          .select('*', { count: 'exact', head: true });

        if (status) {
          countQuery = countQuery.eq('status', status);
        }
        if (entityTypeFilter) {
          countQuery = countQuery.eq('entity_type', entityTypeFilter);
        }
        if (confidenceFilter) {
          countQuery = countQuery.eq('confidence_level', confidenceFilter);
        }

        const { count } = await countQuery;

        return new Response(
          JSON.stringify({
            data: data || [],
            pagination: {
              total: count || 0,
              limit,
              offset,
              has_more: (data?.length || 0) === limit,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'POST': {
        // POST /entity-duplicates/scan - Trigger duplicate scan
        if (subResource === 'scan') {
          const body: ScanRequest = await req.json();

          if (!body.entity_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'entity_type is required (person or organization)',
              'نوع الكيان مطلوب',
              400
            );
          }

          const { data, error } = await supabase.rpc('scan_for_duplicates', {
            p_entity_type: body.entity_type,
            p_days_back: body.days_back || 90,
            p_batch_size: body.batch_size || 100,
          });

          if (error) {
            return errorResponse('SCAN_ERROR', error.message, 'خطأ في المسح', 500, error);
          }

          return new Response(
            JSON.stringify({
              success: true,
              candidates_found: data || 0,
              entity_type: body.entity_type,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // POST /entity-duplicates/:id/merge - Merge duplicate entities
        if (subResource && entityIdOrType === 'merge') {
          const candidateId = subResource;
          const body: MergeRequest = await req.json();

          if (!body.primary_entity_id || !body.duplicate_entity_id) {
            return errorResponse(
              'VALIDATION_ERROR',
              'primary_entity_id and duplicate_entity_id are required',
              'معرفات الكيانات مطلوبة',
              400
            );
          }

          // Get candidate to determine entity type
          const { data: candidate, error: candError } = await supabase
            .from('entity_duplicate_candidates')
            .select('entity_type')
            .eq('id', candidateId)
            .single();

          if (candError) {
            // Try to merge without candidate (manual merge)
            // Determine entity type from source
            const { data: sourceEntity } = await supabase
              .from('dossiers')
              .select('type')
              .eq('id', body.primary_entity_id)
              .single();

            if (!sourceEntity) {
              return errorResponse('NOT_FOUND', 'Entity not found', 'الكيان غير موجود', 404);
            }

            if (sourceEntity.type !== 'person' && sourceEntity.type !== 'organization') {
              return errorResponse(
                'INVALID_TYPE',
                'Only person and organization entities can be merged',
                'يمكن دمج الأشخاص والمنظمات فقط',
                400
              );
            }

            // Perform merge based on entity type
            let mergeData;
            let mergeError;

            if (sourceEntity.type === 'person') {
              ({ data: mergeData, error: mergeError } = await supabase.rpc(
                'merge_duplicate_persons',
                {
                  p_primary_id: body.primary_entity_id,
                  p_duplicate_id: body.duplicate_entity_id,
                  p_user_id: user.id,
                  p_field_resolutions: body.field_resolutions || {},
                }
              ));
            } else {
              ({ data: mergeData, error: mergeError } = await supabase.rpc(
                'merge_duplicate_organizations',
                {
                  p_primary_id: body.primary_entity_id,
                  p_duplicate_id: body.duplicate_entity_id,
                  p_user_id: user.id,
                  p_field_resolutions: body.field_resolutions || {},
                }
              ));
            }

            if (mergeError) {
              return errorResponse(
                'MERGE_ERROR',
                mergeError.message,
                'خطأ في الدمج',
                500,
                mergeError
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                merge_id: mergeData,
                primary_entity_id: body.primary_entity_id,
                merged_entity_id: body.duplicate_entity_id,
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          // Perform merge based on entity type from candidate
          let mergeData;
          let mergeError;

          if (candidate.entity_type === 'person') {
            ({ data: mergeData, error: mergeError } = await supabase.rpc(
              'merge_duplicate_persons',
              {
                p_primary_id: body.primary_entity_id,
                p_duplicate_id: body.duplicate_entity_id,
                p_user_id: user.id,
                p_field_resolutions: body.field_resolutions || {},
              }
            ));
          } else {
            ({ data: mergeData, error: mergeError } = await supabase.rpc(
              'merge_duplicate_organizations',
              {
                p_primary_id: body.primary_entity_id,
                p_duplicate_id: body.duplicate_entity_id,
                p_user_id: user.id,
                p_field_resolutions: body.field_resolutions || {},
              }
            ));
          }

          if (mergeError) {
            return errorResponse(
              'MERGE_ERROR',
              mergeError.message,
              'خطأ في الدمج',
              500,
              mergeError
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              merge_id: mergeData,
              candidate_id: candidateId,
              primary_entity_id: body.primary_entity_id,
              merged_entity_id: body.duplicate_entity_id,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // POST /entity-duplicates/:id/dismiss - Dismiss duplicate candidate
        if (subResource && entityIdOrType === 'dismiss') {
          const candidateId = subResource;
          const body: DismissRequest = await req.json();

          const { data, error } = await supabase.rpc('dismiss_duplicate_candidate', {
            p_candidate_id: candidateId,
            p_user_id: user.id,
            p_reason: body.reason || null,
          });

          if (error) {
            return errorResponse('DISMISS_ERROR', error.message, 'خطأ في الرفض', 500, error);
          }

          if (!data) {
            return errorResponse(
              'NOT_FOUND',
              'Duplicate candidate not found or already resolved',
              'السجل غير موجود أو تم حله مسبقاً',
              404
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              candidate_id: candidateId,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return errorResponse('BAD_REQUEST', 'Invalid endpoint', 'نقطة نهاية غير صالحة', 400);
      }

      case 'PATCH': {
        // PATCH /entity-duplicates/settings/:entityType - Update settings
        if (subResource === 'settings' && entityIdOrType) {
          const body: SettingsUpdateRequest = await req.json();

          const updates: Record<string, unknown> = {};
          if (body.auto_detect_threshold !== undefined)
            updates.auto_detect_threshold = body.auto_detect_threshold;
          if (body.suggest_threshold !== undefined)
            updates.suggest_threshold = body.suggest_threshold;
          if (body.name_weight !== undefined) updates.name_weight = body.name_weight;
          if (body.name_ar_weight !== undefined) updates.name_ar_weight = body.name_ar_weight;
          if (body.email_weight !== undefined) updates.email_weight = body.email_weight;
          if (body.phone_weight !== undefined) updates.phone_weight = body.phone_weight;
          if (body.organization_weight !== undefined)
            updates.organization_weight = body.organization_weight;
          if (body.attribute_weight !== undefined) updates.attribute_weight = body.attribute_weight;
          if (body.scan_recent_days !== undefined) updates.scan_recent_days = body.scan_recent_days;
          if (body.max_candidates_per_entity !== undefined)
            updates.max_candidates_per_entity = body.max_candidates_per_entity;
          if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;

          updates.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from('duplicate_detection_settings')
            .update(updates)
            .eq('entity_type', entityIdOrType)
            .select()
            .single();

          if (error) {
            return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500, error);
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return errorResponse('BAD_REQUEST', 'Invalid endpoint', 'نقطة نهاية غير صالحة', 400);
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
