// Feature: analytics-dashboard
// Analytics Dashboard Edge Function - Get analytics metrics and trends
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface AnalyticsRequest {
  endpoint: 'summary' | 'engagements' | 'relationships' | 'commitments' | 'workload';
  startDate?: string;
  endDate?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'summary';
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    // Default to last 30 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    let result: Record<string, unknown> = {};

    switch (endpoint) {
      case 'summary': {
        const { data, error } = await supabaseClient.rpc('get_analytics_summary', {
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (error) throw error;

        const row = data?.[0] || {};
        result = {
          summary: {
            totalEngagements: row.total_engagements || 0,
            engagementsChange: row.engagements_change || 0,
            avgHealthScore: row.avg_health_score || 0,
            healthScoreChange: row.health_score_change || 0,
            fulfillmentRate: row.fulfillment_rate || 0,
            fulfillmentRateChange: row.fulfillment_rate_change || 0,
            totalActiveWork: row.total_active_work || 0,
            activeWorkChange: row.active_work_change || 0,
            criticalAlerts: row.critical_alerts || 0,
            overdueItems: row.overdue_items || 0,
            relationshipsNeedingAttention: row.relationships_needing_attention || 0,
          },
        };
        break;
      }

      case 'engagements': {
        const { data, error } = await supabaseClient.rpc('get_engagement_metrics', {
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (error) throw error;

        const row = data?.[0] || {};
        result = {
          engagements: {
            totalEngagements: row.total_engagements || 0,
            avgEngagementsPerWeek: row.avg_per_week || 0,
            engagementsByType: row.engagements_by_type || [],
            engagementsByOutcome: row.engagements_by_outcome || [],
            engagementTrend: row.engagement_trend || [],
            changeFromPrevious: row.change_from_previous || 0,
          },
        };
        break;
      }

      case 'relationships': {
        const { data, error } = await supabaseClient.rpc('get_relationship_health_trends', {
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (error) throw error;

        const row = data?.[0] || {};
        result = {
          relationships: {
            averageScore: row.avg_score || 0,
            previousAverageScore: row.previous_avg_score || 0,
            healthDistribution: row.health_distribution || {},
            byHealthLevel: row.by_health_level || [],
            byTrend: row.by_trend || [],
            scoreTrend: row.score_trend || [],
            criticalRelationships: row.critical_count || 0,
            improvingRelationships: row.improving_count || 0,
            decliningRelationships: row.declining_count || 0,
          },
        };
        break;
      }

      case 'commitments': {
        const { data, error } = await supabaseClient.rpc('get_commitment_fulfillment', {
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (error) throw error;

        const row = data?.[0] || {};
        result = {
          commitments: {
            totalCommitments: row.total_commitments || 0,
            completedOnTime: row.completed_on_time || 0,
            completedLate: row.completed_late || 0,
            overdue: row.overdue || 0,
            pending: row.pending || 0,
            fulfillmentRate: row.fulfillment_rate || 0,
            onTimeRate: row.on_time_rate || 0,
            avgCompletionDays: row.avg_completion_days || 0,
            fulfillmentTrend: row.fulfillment_trend || [],
            bySource: row.by_source || [],
            byTrackingType: row.by_tracking_type || [],
          },
        };
        break;
      }

      case 'workload': {
        const { data, error } = await supabaseClient.rpc('get_workload_distribution');

        if (error) throw error;

        const row = data?.[0] || {};
        result = {
          workload: {
            totalActiveItems: row.total_active_items || 0,
            avgItemsPerUser: row.avg_items_per_user || 0,
            maxItemsPerUser: row.max_items_per_user || 0,
            overloadedUsers: row.overloaded_users || 0,
            idleUsers: row.idle_users || 0,
            byUser: row.by_user || [],
            byPriority: row.by_priority || [],
            byStatus: row.by_status || [],
          },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_ENDPOINT', message: 'Invalid endpoint' },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          generatedAt: new Date().toISOString(),
          timeRange: {
            start: startDateStr,
            end: endDateStr,
            label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
