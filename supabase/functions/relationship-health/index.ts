/**
 * Relationship Health Scoring Edge Function
 * Feature: relationship-health-scoring
 *
 * Comprehensive REST API for relationship health scoring:
 * - GET /relationship-health - List all relationship health scores
 * - GET /relationship-health/:relationshipId - Get health score for specific relationship
 * - GET /relationship-health/:relationshipId/history - Get historical scores for trend analysis
 * - GET /relationship-health/:relationshipId/alerts - Get alerts for a relationship
 * - POST /relationship-health/calculate - Trigger health score calculation
 * - POST /relationship-health/calculate/:relationshipId - Calculate for specific relationship
 * - PATCH /relationship-health/alerts/:alertId - Update alert (mark read/dismissed)
 *
 * Scoring Components:
 * - Engagement Frequency (25%): Based on interaction count per year
 * - Commitment Compliance (35%): Based on on-time fulfillment rate
 * - Reciprocity (15%): Balance of engagement from both parties
 * - Interaction Quality (10%): Based on engagement outcomes
 * - Recency (15%): Days since last engagement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface HealthScoreResponse {
  relationship_id: string;
  source_dossier: {
    id: string;
    name_en: string;
    name_ar: string;
    type: string;
  };
  target_dossier: {
    id: string;
    name_en: string;
    name_ar: string;
    type: string;
  };
  overall_score: number | null;
  trend: 'improving' | 'stable' | 'declining';
  previous_score: number | null;
  components: {
    engagement_frequency: number;
    commitment_compliance: number;
    reciprocity: number;
    interaction_quality: number;
    recency: number;
  };
  breakdown: {
    engagements_365d: number;
    engagements_90d: number;
    engagements_30d: number;
    days_since_engagement: number;
    commitments_total: number;
    commitments_completed: number;
    commitments_overdue: number;
    latest_engagement_date: string | null;
  };
  calculated_at: string;
  period_start: string;
  period_end: string;
}

interface AlertResponse {
  id: string;
  relationship_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_read: boolean;
  is_dismissed: boolean;
  alert_data: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

interface HistoryResponse {
  id: string;
  relationship_id: string;
  overall_score: number;
  components: {
    engagement_frequency: number;
    commitment_compliance: number;
    reciprocity: number;
    interaction_quality: number;
    recency: number;
  };
  period_start: string;
  period_end: string;
  calculated_at: string;
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

function getHealthLevel(score: number | null): string {
  if (score === null) return 'unknown';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

async function generateAlerts(
  supabase: ReturnType<typeof createClient>,
  relationshipId: string,
  healthData: HealthScoreResponse
) {
  const alerts: {
    relationship_id: string;
    alert_type: string;
    severity: string;
    title_en: string;
    title_ar: string;
    description_en: string;
    description_ar: string;
    alert_data: Record<string, unknown>;
    expires_at: string | null;
  }[] = [];

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Critical score alert
  if (healthData.overall_score !== null && healthData.overall_score < 30) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'score_critical',
      severity: 'critical',
      title_en: 'Critical Relationship Health',
      title_ar: 'صحة العلاقة حرجة',
      description_en: `The relationship health score has dropped to ${healthData.overall_score}. Immediate attention required.`,
      description_ar: `انخفضت نقاط صحة العلاقة إلى ${healthData.overall_score}. يتطلب اهتمامًا فوريًا.`,
      alert_data: { score: healthData.overall_score },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Declining score alert
  if (
    healthData.trend === 'declining' &&
    healthData.previous_score !== null &&
    healthData.overall_score !== null &&
    healthData.previous_score - healthData.overall_score >= 20
  ) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'score_declining',
      severity: 'high',
      title_en: 'Significant Score Decline',
      title_ar: 'انخفاض كبير في النقاط',
      description_en: `The relationship health score has dropped by ${healthData.previous_score - healthData.overall_score} points.`,
      description_ar: `انخفضت نقاط صحة العلاقة بمقدار ${healthData.previous_score - healthData.overall_score} نقطة.`,
      alert_data: {
        previous_score: healthData.previous_score,
        current_score: healthData.overall_score,
        drop: healthData.previous_score - healthData.overall_score,
      },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Engagement gap alert
  if (healthData.breakdown.days_since_engagement >= 60) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'engagement_gap',
      severity: healthData.breakdown.days_since_engagement >= 90 ? 'high' : 'medium',
      title_en: 'Engagement Gap Detected',
      title_ar: 'تم اكتشاف فجوة في التفاعل',
      description_en: `No engagement with this relationship for ${healthData.breakdown.days_since_engagement} days.`,
      description_ar: `لا يوجد تفاعل مع هذه العلاقة منذ ${healthData.breakdown.days_since_engagement} يومًا.`,
      alert_data: { days: healthData.breakdown.days_since_engagement },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Overdue commitments alert
  if (healthData.breakdown.commitments_overdue >= 2) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'commitment_overdue',
      severity: healthData.breakdown.commitments_overdue >= 5 ? 'high' : 'medium',
      title_en: 'Multiple Overdue Commitments',
      title_ar: 'التزامات متعددة متأخرة',
      description_en: `${healthData.breakdown.commitments_overdue} commitments are overdue for this relationship.`,
      description_ar: `${healthData.breakdown.commitments_overdue} التزامات متأخرة لهذه العلاقة.`,
      alert_data: { overdue_count: healthData.breakdown.commitments_overdue },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Reciprocity imbalance alert
  if (healthData.components.reciprocity < 40) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'reciprocity_imbalance',
      severity: 'medium',
      title_en: 'Reciprocity Imbalance',
      title_ar: 'عدم توازن في المعاملة بالمثل',
      description_en: 'Engagement in this relationship is significantly one-sided.',
      description_ar: 'التفاعل في هذه العلاقة أحادي الجانب بشكل ملحوظ.',
      alert_data: { reciprocity_score: healthData.components.reciprocity },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Positive alert: significant improvement
  if (
    healthData.trend === 'improving' &&
    healthData.previous_score !== null &&
    healthData.overall_score !== null &&
    healthData.overall_score - healthData.previous_score >= 15
  ) {
    alerts.push({
      relationship_id: relationshipId,
      alert_type: 'score_improving',
      severity: 'low',
      title_en: 'Relationship Health Improving',
      title_ar: 'تحسن في صحة العلاقة',
      description_en: `Great news! The relationship health score has improved by ${healthData.overall_score - healthData.previous_score} points.`,
      description_ar: `أخبار رائعة! تحسنت نقاط صحة العلاقة بمقدار ${healthData.overall_score - healthData.previous_score} نقطة.`,
      alert_data: {
        previous_score: healthData.previous_score,
        current_score: healthData.overall_score,
        improvement: healthData.overall_score - healthData.previous_score,
      },
      expires_at: expiresAt.toISOString(),
    });
  }

  // Insert alerts (only if they don't exist recently)
  if (alerts.length > 0) {
    // Get service role client for inserting alerts
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const alert of alerts) {
      // Check if similar alert exists within last 24 hours
      const { data: existingAlert } = await serviceClient
        .from('relationship_health_alerts')
        .select('id')
        .eq('relationship_id', alert.relationship_id)
        .eq('alert_type', alert.alert_type)
        .eq('is_dismissed', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (!existingAlert) {
        await serviceClient.from('relationship_health_alerts').insert(alert);
      }
    }
  }

  return alerts.length;
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
    // pathParts[0] = "relationship-health"
    const secondPart = pathParts[1]; // Could be relationship ID, "calculate", or "alerts"
    const thirdPart = pathParts[2]; // Could be "history", "alerts", or relationship ID

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /relationship-health/:relationshipId/history
        if (secondPart && thirdPart === 'history') {
          const relationshipId = secondPart;
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const { data, error } = await supabase
            .from('relationship_health_history')
            .select('*')
            .eq('relationship_id', relationshipId)
            .order('calculated_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          // Transform to response format
          const history: HistoryResponse[] = (data || []).map((h) => ({
            id: h.id,
            relationship_id: h.relationship_id,
            overall_score: h.overall_score,
            components: {
              engagement_frequency: h.engagement_frequency_score,
              commitment_compliance: h.commitment_compliance_score,
              reciprocity: h.reciprocity_score,
              interaction_quality: h.interaction_quality_score,
              recency: h.recency_score,
            },
            period_start: h.period_start,
            period_end: h.period_end,
            calculated_at: h.calculated_at,
          }));

          return successResponse({
            data: history,
            pagination: { limit, offset, has_more: (data?.length || 0) === limit },
          });
        }

        // GET /relationship-health/:relationshipId/alerts
        if (secondPart && thirdPart === 'alerts') {
          const relationshipId = secondPart;
          const includeRead = url.searchParams.get('include_read') === 'true';
          const includeDismissed = url.searchParams.get('include_dismissed') === 'true';

          let query = supabase
            .from('relationship_health_alerts')
            .select('*')
            .eq('relationship_id', relationshipId);

          if (!includeRead) {
            query = query.eq('is_read', false);
          }
          if (!includeDismissed) {
            query = query.eq('is_dismissed', false);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({ data: data || [] });
        }

        // GET /relationship-health/:relationshipId - Get specific relationship health
        if (secondPart && secondPart !== 'calculate' && secondPart !== 'alerts') {
          const relationshipId = secondPart;

          const { data, error } = await supabase
            .from('relationship_health_summary')
            .select('*')
            .eq('relationship_id', relationshipId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse(
                'NOT_FOUND',
                'Relationship not found or is not a bilateral relationship',
                'العلاقة غير موجودة أو ليست علاقة ثنائية',
                404
              );
            }
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          const response: HealthScoreResponse = {
            relationship_id: data.relationship_id,
            source_dossier: {
              id: data.source_dossier_id,
              name_en: data.source_name_en,
              name_ar: data.source_name_ar,
              type: data.source_type,
            },
            target_dossier: {
              id: data.target_dossier_id,
              name_en: data.target_name_en,
              name_ar: data.target_name_ar,
              type: data.target_type,
            },
            overall_score: data.overall_health_score,
            trend: data.trend || 'stable',
            previous_score: data.previous_score,
            components: {
              engagement_frequency: data.engagement_frequency_score,
              commitment_compliance: data.commitment_compliance_score,
              reciprocity: data.reciprocity_score,
              interaction_quality: data.interaction_quality_score,
              recency: data.recency_score,
            },
            breakdown: {
              engagements_365d: data.total_engagements_365d,
              engagements_90d: data.recent_engagements_90d,
              engagements_30d: data.recent_engagements_30d,
              days_since_engagement: data.days_since_last_engagement,
              commitments_total: data.total_commitments,
              commitments_completed: data.completed_commitments,
              commitments_overdue: data.overdue_commitments,
              latest_engagement_date: data.latest_engagement_date,
            },
            calculated_at: data.score_calculated_at || new Date().toISOString(),
            period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            period_end: new Date().toISOString(),
          };

          return successResponse({
            ...response,
            health_level: getHealthLevel(response.overall_score),
          });
        }

        // GET /relationship-health - List all relationship health scores
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const trendFilter = url.searchParams.get('trend');
        const minScore = url.searchParams.get('min_score');
        const maxScore = url.searchParams.get('max_score');
        const sortBy = url.searchParams.get('sort_by') || 'overall_score';
        const sortOrder = url.searchParams.get('sort_order') || 'desc';

        let query = supabase.from('relationship_health_summary').select('*');

        if (trendFilter) {
          query = query.eq('trend', trendFilter);
        }
        if (minScore) {
          query = query.gte('overall_health_score', parseInt(minScore));
        }
        if (maxScore) {
          query = query.lte('overall_health_score', parseInt(maxScore));
        }

        // Apply sorting
        const validSortColumns = [
          'overall_health_score',
          'engagement_frequency_score',
          'commitment_compliance_score',
          'reciprocity_score',
          'days_since_last_engagement',
        ];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'overall_health_score';

        const { data, error } = await query
          .order(sortColumn, { ascending: sortOrder === 'asc', nullsFirst: false })
          .range(offset, offset + limit - 1);

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        // Transform to response format
        const relationships = (data || []).map((d) => ({
          relationship_id: d.relationship_id,
          source_dossier: {
            id: d.source_dossier_id,
            name_en: d.source_name_en,
            name_ar: d.source_name_ar,
            type: d.source_type,
          },
          target_dossier: {
            id: d.target_dossier_id,
            name_en: d.target_name_en,
            name_ar: d.target_name_ar,
            type: d.target_type,
          },
          overall_score: d.overall_health_score,
          trend: d.trend || 'stable',
          health_level: getHealthLevel(d.overall_health_score),
          components: {
            engagement_frequency: d.engagement_frequency_score,
            commitment_compliance: d.commitment_compliance_score,
            reciprocity: d.reciprocity_score,
            interaction_quality: d.interaction_quality_score,
            recency: d.recency_score,
          },
          days_since_engagement: d.days_since_last_engagement,
          overdue_commitments: d.overdue_commitments,
        }));

        return successResponse({
          data: relationships,
          pagination: { limit, offset, has_more: (data?.length || 0) === limit },
        });
      }

      case 'POST': {
        // POST /relationship-health/calculate/:relationshipId - Calculate for specific relationship
        if (secondPart === 'calculate' && thirdPart) {
          const relationshipId = thirdPart;

          // Use service role client for calculation
          const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // Trigger calculation
          const { data, error } = await serviceClient.rpc('calculate_relationship_health_scores', {
            p_relationship_ids: [relationshipId],
          });

          if (error) {
            return errorResponse('CALCULATION_ERROR', error.message, 'خطأ في الحساب', 500, error);
          }

          // Get updated score
          const { data: healthData, error: fetchError } = await supabase
            .from('relationship_health_summary')
            .select('*')
            .eq('relationship_id', relationshipId)
            .single();

          if (fetchError) {
            return errorResponse(
              'FETCH_ERROR',
              fetchError.message,
              'خطأ في جلب البيانات',
              500,
              fetchError
            );
          }

          const response: HealthScoreResponse = {
            relationship_id: healthData.relationship_id,
            source_dossier: {
              id: healthData.source_dossier_id,
              name_en: healthData.source_name_en,
              name_ar: healthData.source_name_ar,
              type: healthData.source_type,
            },
            target_dossier: {
              id: healthData.target_dossier_id,
              name_en: healthData.target_name_en,
              name_ar: healthData.target_name_ar,
              type: healthData.target_type,
            },
            overall_score: healthData.overall_health_score,
            trend: healthData.trend || 'stable',
            previous_score: healthData.previous_score,
            components: {
              engagement_frequency: healthData.engagement_frequency_score,
              commitment_compliance: healthData.commitment_compliance_score,
              reciprocity: healthData.reciprocity_score,
              interaction_quality: healthData.interaction_quality_score,
              recency: healthData.recency_score,
            },
            breakdown: {
              engagements_365d: healthData.total_engagements_365d,
              engagements_90d: healthData.recent_engagements_90d,
              engagements_30d: healthData.recent_engagements_30d,
              days_since_engagement: healthData.days_since_last_engagement,
              commitments_total: healthData.total_commitments,
              commitments_completed: healthData.completed_commitments,
              commitments_overdue: healthData.overdue_commitments,
              latest_engagement_date: healthData.latest_engagement_date,
            },
            calculated_at: new Date().toISOString(),
            period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            period_end: new Date().toISOString(),
          };

          // Generate alerts
          await generateAlerts(serviceClient, relationshipId, response);

          // Store history
          await serviceClient.from('relationship_health_history').insert({
            relationship_id: relationshipId,
            overall_score: response.overall_score,
            engagement_frequency_score: response.components.engagement_frequency,
            commitment_compliance_score: response.components.commitment_compliance,
            reciprocity_score: response.components.reciprocity,
            interaction_quality_score: response.components.interaction_quality,
            recency_score: response.components.recency,
            period_start: response.period_start,
            period_end: response.period_end,
          });

          return successResponse({
            ...response,
            health_level: getHealthLevel(response.overall_score),
          });
        }

        // POST /relationship-health/calculate - Calculate all relationship health scores
        if (secondPart === 'calculate') {
          // Use service role client for calculation
          const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // Trigger calculation for all relationships
          const { data, error } = await serviceClient.rpc('calculate_relationship_health_scores');

          if (error) {
            return errorResponse('CALCULATION_ERROR', error.message, 'خطأ في الحساب', 500, error);
          }

          return successResponse({
            message_en: 'Health scores calculated successfully',
            message_ar: 'تم حساب نقاط الصحة بنجاح',
            relationships_updated: data?.length || 0,
          });
        }

        return errorResponse('NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
      }

      case 'PATCH': {
        // PATCH /relationship-health/alerts/:alertId - Update alert
        if (secondPart === 'alerts' && thirdPart) {
          const alertId = thirdPart;
          const body = await req.json();

          const updates: Record<string, unknown> = {};
          if (body.is_read !== undefined) updates.is_read = body.is_read;
          if (body.is_dismissed !== undefined) updates.is_dismissed = body.is_dismissed;

          if (Object.keys(updates).length === 0) {
            return errorResponse(
              'VALIDATION_ERROR',
              'No fields to update. Provide is_read or is_dismissed.',
              'لا توجد حقول للتحديث. قدم is_read أو is_dismissed.',
              400
            );
          }

          const { data, error } = await supabase
            .from('relationship_health_alerts')
            .update(updates)
            .eq('id', alertId)
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse('NOT_FOUND', 'Alert not found', 'التنبيه غير موجود', 404);
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
