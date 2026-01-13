/**
 * Engagement Recommendations Edge Function
 * Feature: predictive-engagement-recommendations
 *
 * REST API for AI-driven engagement recommendations:
 * - GET /engagement-recommendations - List recommendations with filters
 * - GET /engagement-recommendations/:id - Get specific recommendation details
 * - GET /engagement-recommendations/stats - Get recommendation statistics
 * - POST /engagement-recommendations/generate - Trigger recommendation generation
 * - PATCH /engagement-recommendations/:id - Update recommendation status
 * - POST /engagement-recommendations/:id/feedback - Add feedback on a recommendation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface RecommendationResponse {
  id: string;
  relationship_id: string;
  target_dossier_id: string;
  recommendation_type: string;
  priority: number;
  confidence_score: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  suggested_action_en: string;
  suggested_action_ar: string;
  suggested_engagement_type: string | null;
  suggested_format: string | null;
  optimal_date_start: string | null;
  optimal_date_end: string | null;
  optimal_timing_reason_en: string | null;
  optimal_timing_reason_ar: string | null;
  urgency: string;
  reasoning: Record<string, unknown>;
  related_commitment_ids: string[];
  related_calendar_event_ids: string[];
  status: string;
  viewed_at: string | null;
  actioned_at: string | null;
  action_notes: string | null;
  resulting_engagement_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Enriched data
  target_dossier_name_en?: string;
  target_dossier_name_ar?: string;
  target_dossier_type?: string;
  source_dossier_name_en?: string;
  source_dossier_name_ar?: string;
  source_dossier_type?: string;
  relationship_health_score?: number;
  relationship_health_trend?: string;
}

interface StatsResponse {
  total_pending: number;
  total_viewed: number;
  high_priority_count: number;
  critical_urgency_count: number;
  by_type: Record<string, number>;
  by_urgency: Record<string, number>;
  acceptance_rate: number;
  average_confidence: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

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

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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

function parseArrayParam(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ============================================================================
// Main Handler
// ============================================================================

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
    // pathParts[0] = "engagement-recommendations"
    const secondPart = pathParts[1]; // Could be ID, "generate", "stats"
    const thirdPart = pathParts[2]; // Could be "feedback"

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /engagement-recommendations/stats - Get statistics
        if (secondPart === 'stats') {
          // Get counts by status
          const { data: pendingData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');

          const { data: viewedData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'viewed');

          const { data: highPriorityData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .gte('priority', 4)
            .in('status', ['pending', 'viewed']);

          const { data: criticalData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .eq('urgency', 'critical')
            .in('status', ['pending', 'viewed']);

          // Get counts by type
          const { data: typeData } = await supabase
            .from('engagement_recommendations')
            .select('recommendation_type')
            .in('status', ['pending', 'viewed']);

          const byType: Record<string, number> = {};
          (typeData || []).forEach((r) => {
            byType[r.recommendation_type] = (byType[r.recommendation_type] || 0) + 1;
          });

          // Get counts by urgency
          const { data: urgencyData } = await supabase
            .from('engagement_recommendations')
            .select('urgency')
            .in('status', ['pending', 'viewed']);

          const byUrgency: Record<string, number> = {};
          (urgencyData || []).forEach((r) => {
            byUrgency[r.urgency] = (byUrgency[r.urgency] || 0) + 1;
          });

          // Calculate acceptance rate
          const { data: acceptedData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'accepted');

          const { data: actionedData } = await supabase
            .from('engagement_recommendations')
            .select('id', { count: 'exact', head: true })
            .in('status', ['accepted', 'dismissed']);

          const acceptanceRate =
            actionedData && (actionedData as unknown as { count: number }).count > 0
              ? (((acceptedData as unknown as { count: number })?.count || 0) /
                  (actionedData as unknown as { count: number }).count) *
                100
              : 0;

          // Calculate average confidence
          const { data: confidenceData } = await supabase
            .from('engagement_recommendations')
            .select('confidence_score')
            .in('status', ['pending', 'viewed']);

          const avgConfidence =
            confidenceData && confidenceData.length > 0
              ? confidenceData.reduce((sum, r) => sum + r.confidence_score, 0) /
                confidenceData.length
              : 0;

          const stats: StatsResponse = {
            total_pending: (pendingData as unknown as { count: number })?.count || 0,
            total_viewed: (viewedData as unknown as { count: number })?.count || 0,
            high_priority_count: (highPriorityData as unknown as { count: number })?.count || 0,
            critical_urgency_count: (criticalData as unknown as { count: number })?.count || 0,
            by_type: byType,
            by_urgency: byUrgency,
            acceptance_rate: Math.round(acceptanceRate * 100) / 100,
            average_confidence: Math.round(avgConfidence * 100) / 100,
          };

          return successResponse(stats);
        }

        // GET /engagement-recommendations/:id - Get specific recommendation
        if (secondPart && secondPart !== 'generate' && secondPart !== 'stats') {
          const recommendationId = secondPart;

          const { data, error } = await supabase
            .from('engagement_recommendations_summary')
            .select('*')
            .eq('id', recommendationId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse(
                'NOT_FOUND',
                'Recommendation not found',
                'التوصية غير موجودة',
                404
              );
            }
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          // Mark as viewed if pending
          if (data.status === 'pending') {
            await supabase
              .from('engagement_recommendations')
              .update({
                status: 'viewed',
                viewed_at: new Date().toISOString(),
                viewed_by: user.id,
              })
              .eq('id', recommendationId);

            data.status = 'viewed';
            data.viewed_at = new Date().toISOString();
          }

          return successResponse(data);
        }

        // GET /engagement-recommendations - List recommendations
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const statusFilter = parseArrayParam(url.searchParams.get('status'));
        const typeFilter = parseArrayParam(url.searchParams.get('recommendation_type'));
        const urgencyFilter = parseArrayParam(url.searchParams.get('urgency'));
        const minPriority = url.searchParams.get('min_priority');
        const minConfidence = url.searchParams.get('min_confidence');
        const targetDossierId = url.searchParams.get('target_dossier_id');
        const relationshipId = url.searchParams.get('relationship_id');
        const includeExpired = url.searchParams.get('include_expired') === 'true';
        const sortBy = url.searchParams.get('sort_by') || 'priority';
        const sortOrder = url.searchParams.get('sort_order') || 'desc';

        let query = supabase.from('engagement_recommendations_summary').select('*');

        // Apply filters
        if (statusFilter && statusFilter.length > 0) {
          query = query.in('status', statusFilter);
        } else if (!includeExpired) {
          query = query.not('status', 'in', '(expired,superseded)');
        }

        if (typeFilter && typeFilter.length > 0) {
          query = query.in('recommendation_type', typeFilter);
        }

        if (urgencyFilter && urgencyFilter.length > 0) {
          query = query.in('urgency', urgencyFilter);
        }

        if (minPriority) {
          query = query.gte('priority', parseInt(minPriority));
        }

        if (minConfidence) {
          query = query.gte('confidence_score', parseFloat(minConfidence));
        }

        if (targetDossierId) {
          query = query.eq('target_dossier_id', targetDossierId);
        }

        if (relationshipId) {
          query = query.eq('relationship_id', relationshipId);
        }

        // Apply sorting
        const validSortColumns = [
          'priority',
          'confidence_score',
          'created_at',
          'optimal_date_start',
          'urgency',
        ];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'priority';

        // Map urgency to sortable value
        if (sortColumn === 'urgency') {
          // Urgency order: critical > high > normal > low
          query = query.order('urgency', {
            ascending: sortOrder === 'asc',
            nullsFirst: false,
          });
        } else {
          query = query.order(sortColumn, {
            ascending: sortOrder === 'asc',
            nullsFirst: false,
          });
        }

        // Secondary sort by priority for consistency
        if (sortColumn !== 'priority') {
          query = query.order('priority', { ascending: false });
        }

        const { data, error } = await query.range(offset, offset + limit - 1);

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        return successResponse({
          data: data || [],
          pagination: {
            limit,
            offset,
            has_more: (data?.length || 0) === limit,
          },
        });
      }

      case 'POST': {
        // POST /engagement-recommendations/:id/feedback - Add feedback
        if (secondPart && thirdPart === 'feedback') {
          const recommendationId = secondPart;
          const body = await req.json();

          if (!body.feedback_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'feedback_type is required',
              'نوع التعليق مطلوب',
              400
            );
          }

          const validFeedbackTypes = [
            'helpful',
            'not_helpful',
            'timing_wrong',
            'already_planned',
            'not_relevant',
            'too_early',
            'too_late',
          ];

          if (!validFeedbackTypes.includes(body.feedback_type)) {
            return errorResponse(
              'VALIDATION_ERROR',
              `Invalid feedback_type. Must be one of: ${validFeedbackTypes.join(', ')}`,
              'نوع التعليق غير صالح',
              400
            );
          }

          // Verify recommendation exists
          const { data: recommendation } = await supabase
            .from('engagement_recommendations')
            .select('id')
            .eq('id', recommendationId)
            .single();

          if (!recommendation) {
            return errorResponse(
              'NOT_FOUND',
              'Recommendation not found',
              'التوصية غير موجودة',
              404
            );
          }

          const { data, error } = await supabase
            .from('engagement_recommendation_feedback')
            .insert({
              recommendation_id: recommendationId,
              feedback_type: body.feedback_type,
              feedback_text: body.feedback_text || null,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في إضافة التعليق', 500, error);
          }

          return successResponse(data, 201);
        }

        // POST /engagement-recommendations/generate - Trigger generation
        if (secondPart === 'generate') {
          const body = await req.json().catch(() => ({}));

          // Use service role client for generation
          const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          const { data, error } = await serviceClient.rpc('generate_engagement_recommendations', {
            p_relationship_ids: body.relationship_ids || null,
            p_force_regenerate: body.force_regenerate || false,
          });

          if (error) {
            return errorResponse(
              'GENERATION_ERROR',
              error.message,
              'خطأ في توليد التوصيات',
              500,
              error
            );
          }

          const result = data?.[0] || { recommendations_generated: 0, batch_id: null };

          return successResponse({
            message_en: `Successfully generated ${result.recommendations_generated} recommendation(s)`,
            message_ar: `تم توليد ${result.recommendations_generated} توصية(ات) بنجاح`,
            recommendations_generated: result.recommendations_generated,
            batch_id: result.batch_id,
          });
        }

        return errorResponse('NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
      }

      case 'PATCH': {
        // PATCH /engagement-recommendations/:id - Update recommendation
        if (secondPart && secondPart !== 'generate' && secondPart !== 'stats') {
          const recommendationId = secondPart;
          const body = await req.json();

          const updates: Record<string, unknown> = {};

          // Validate status if provided
          if (body.status) {
            const validStatuses = ['viewed', 'accepted', 'dismissed'];
            if (!validStatuses.includes(body.status)) {
              return errorResponse(
                'VALIDATION_ERROR',
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                'الحالة غير صالحة',
                400
              );
            }
            updates.status = body.status;

            if (body.status === 'viewed') {
              updates.viewed_at = new Date().toISOString();
              updates.viewed_by = user.id;
            } else if (body.status === 'accepted' || body.status === 'dismissed') {
              updates.actioned_at = new Date().toISOString();
              updates.actioned_by = user.id;
            }
          }

          if (body.action_notes !== undefined) {
            updates.action_notes = body.action_notes;
          }

          if (body.resulting_engagement_id) {
            updates.resulting_engagement_id = body.resulting_engagement_id;
          }

          if (Object.keys(updates).length === 0) {
            return errorResponse(
              'VALIDATION_ERROR',
              'No valid fields to update',
              'لا توجد حقول صالحة للتحديث',
              400
            );
          }

          const { data, error } = await supabase
            .from('engagement_recommendations')
            .update(updates)
            .eq('id', recommendationId)
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse(
                'NOT_FOUND',
                'Recommendation not found',
                'التوصية غير موجودة',
                404
              );
            }
            return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500, error);
          }

          return successResponse(data);
        }

        return errorResponse('NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
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
