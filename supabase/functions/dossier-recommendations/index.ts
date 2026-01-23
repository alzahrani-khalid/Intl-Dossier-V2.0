/**
 * Dossier Recommendations Edge Function
 * Feature: ai-dossier-recommendations
 *
 * REST API for proactive dossier recommendations using pgvector similarity search:
 * - GET /dossier-recommendations?source_dossier_id=:id - Get recommendations for a dossier
 * - GET /dossier-recommendations/:id - Get specific recommendation details
 * - POST /dossier-recommendations/generate - Generate recommendations for a dossier
 * - PATCH /dossier-recommendations/:id - Update recommendation status
 * - POST /dossier-recommendations/:id/interaction - Track user interaction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface DossierRecommendation {
  id: string;
  source_dossier_id: string;
  recommended_dossier_id: string;
  similarity_score: number;
  confidence_score: number;
  primary_reason: string;
  reason_breakdown: ReasonBreakdown[];
  explanation_en: string;
  explanation_ar: string;
  status: string;
  priority: number;
  expires_at: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  viewed_at: string | null;
  actioned_at: string | null;
  // Enriched data from joins
  recommended_dossier?: {
    id: string;
    name_en: string;
    name_ar: string;
    type: string;
    description_en: string | null;
    description_ar: string | null;
  };
}

interface ReasonBreakdown {
  reason: string;
  weight: number;
  details: string;
}

interface RecommendationListResponse {
  data: DossierRecommendation[];
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
    total?: number;
  };
}

interface InteractionPayload {
  interaction_type:
    | 'viewed'
    | 'expanded'
    | 'clicked'
    | 'dismissed'
    | 'feedback_positive'
    | 'feedback_negative';
  feedback_text?: string;
  context?: Record<string, unknown>;
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

async function getUserClearanceLevel(
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  const { data } = await supabase
    .from('staff_profiles')
    .select('clearance_level')
    .eq('user_id', userId)
    .single();

  return data?.clearance_level ?? 0;
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

    // Get user's clearance level
    const userClearance = await getUserClearanceLevel(user.id, supabase);

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // pathParts[0] = "dossier-recommendations"
    const secondPart = pathParts[1]; // Could be ID or "generate"
    const thirdPart = pathParts[2]; // Could be "interaction"

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /dossier-recommendations/:id - Get specific recommendation
        if (secondPart && secondPart !== 'generate') {
          const recommendationId = secondPart;

          const { data, error } = await supabase
            .from('dossier_recommendations')
            .select(
              `
              *,
              recommended_dossier:dossiers!recommended_dossier_id (
                id,
                name_en,
                name_ar,
                type,
                description_en,
                description_ar
              ),
              source_dossier:dossiers!source_dossier_id (
                id,
                name_en,
                name_ar,
                type
              )
            `
            )
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
            await supabase.rpc('mark_recommendation_viewed', {
              p_recommendation_id: recommendationId,
              p_user_id: user.id,
            });
            data.status = 'viewed';
            data.viewed_at = new Date().toISOString();
          }

          return successResponse(data);
        }

        // GET /dossier-recommendations - List recommendations for a source dossier
        const sourceDossierId = url.searchParams.get('source_dossier_id');

        if (!sourceDossierId) {
          return errorResponse(
            'VALIDATION_ERROR',
            'source_dossier_id is required',
            'معرف الملف المصدر مطلوب',
            400
          );
        }

        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const statusFilter = parseArrayParam(url.searchParams.get('status'));
        const minSimilarity = parseFloat(url.searchParams.get('min_similarity') || '0.7');
        const includeExpired = url.searchParams.get('include_expired') === 'true';

        let query = supabase
          .from('dossier_recommendations')
          .select(
            `
            *,
            recommended_dossier:dossiers!recommended_dossier_id (
              id,
              name_en,
              name_ar,
              type,
              description_en,
              description_ar
            )
          `
          )
          .eq('source_dossier_id', sourceDossierId)
          .gte('similarity_score', minSimilarity);

        // Apply filters
        if (statusFilter && statusFilter.length > 0) {
          query = query.in('status', statusFilter);
        } else if (!includeExpired) {
          query = query.not('status', 'eq', 'expired');
        }

        // Order by priority and similarity
        query = query
          .order('priority', { ascending: false })
          .order('similarity_score', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        // Get total count for pagination
        const { count } = await supabase
          .from('dossier_recommendations')
          .select('id', { count: 'exact', head: true })
          .eq('source_dossier_id', sourceDossierId)
          .not('status', 'eq', 'expired');

        const response: RecommendationListResponse = {
          data: data || [],
          pagination: {
            limit,
            offset,
            has_more: (data?.length || 0) === limit,
            total: count || undefined,
          },
        };

        return successResponse(response);
      }

      case 'POST': {
        // POST /dossier-recommendations/:id/interaction - Track interaction
        if (secondPart && thirdPart === 'interaction') {
          const recommendationId = secondPart;
          const body: InteractionPayload = await req.json();

          if (!body.interaction_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'interaction_type is required',
              'نوع التفاعل مطلوب',
              400
            );
          }

          const validTypes = [
            'viewed',
            'expanded',
            'clicked',
            'dismissed',
            'feedback_positive',
            'feedback_negative',
          ];
          if (!validTypes.includes(body.interaction_type)) {
            return errorResponse(
              'VALIDATION_ERROR',
              `Invalid interaction_type. Must be one of: ${validTypes.join(', ')}`,
              'نوع التفاعل غير صالح',
              400
            );
          }

          // Update recommendation status based on interaction
          if (body.interaction_type === 'clicked') {
            await supabase.rpc('accept_recommendation', {
              p_recommendation_id: recommendationId,
              p_user_id: user.id,
            });
          } else if (body.interaction_type === 'dismissed') {
            await supabase.rpc('dismiss_recommendation', {
              p_recommendation_id: recommendationId,
              p_user_id: user.id,
              p_feedback_text: body.feedback_text || null,
            });
          } else {
            // Log other interactions
            const { error } = await supabase.from('dossier_recommendation_interactions').insert({
              recommendation_id: recommendationId,
              user_id: user.id,
              interaction_type: body.interaction_type,
              feedback_text: body.feedback_text || null,
              context: body.context || {},
            });

            if (error) {
              return errorResponse(
                'INSERT_ERROR',
                error.message,
                'خطأ في تسجيل التفاعل',
                500,
                error
              );
            }
          }

          return successResponse({
            message_en: 'Interaction recorded',
            message_ar: 'تم تسجيل التفاعل',
          });
        }

        // POST /dossier-recommendations/generate - Generate recommendations
        if (secondPart === 'generate') {
          const body = await req.json().catch(() => ({}));

          if (!body.source_dossier_id) {
            return errorResponse(
              'VALIDATION_ERROR',
              'source_dossier_id is required',
              'معرف الملف المصدر مطلوب',
              400
            );
          }

          // Use service role client for generation
          const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          const { data, error } = await serviceClient.rpc('generate_dossier_recommendations', {
            p_source_dossier_id: body.source_dossier_id,
            p_user_id: user.id,
            p_user_clearance: userClearance,
            p_max_recommendations: body.max_recommendations || 5,
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

          const recommendations = data || [];

          return successResponse({
            message_en: `Generated ${recommendations.length} recommendation(s)`,
            message_ar: `تم توليد ${recommendations.length} توصية(ات)`,
            recommendations_generated: recommendations.length,
            recommendations: recommendations,
          });
        }

        return errorResponse('NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
      }

      case 'PATCH': {
        // PATCH /dossier-recommendations/:id - Update recommendation status
        if (secondPart && secondPart !== 'generate') {
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
            } else if (body.status === 'accepted' || body.status === 'dismissed') {
              updates.actioned_at = new Date().toISOString();
            }
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
            .from('dossier_recommendations')
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
