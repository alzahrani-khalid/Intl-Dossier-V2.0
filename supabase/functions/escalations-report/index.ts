import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * GET /escalations-report - T082
 * Provides escalation statistics and reporting data
 *
 * Query Parameters:
 * - start_date: ISO date string (default: 30 days ago)
 * - end_date: ISO date string (default: now)
 * - unit_id: Filter by organizational unit (optional)
 * - assignee_id: Filter by staff member (optional)
 * - work_item_type: Filter by work item type (optional)
 * - group_by: Grouping dimension (day|week|unit|assignee|work_type) default: day
 *
 * Response:
 * {
 *   summary: {
 *     total_escalations: number,
 *     avg_escalations_per_day: number,
 *     most_common_reason: string,
 *     affected_assignments: number
 *   },
 *   time_series: Array<{
 *     date: string,
 *     count: number,
 *     reason_breakdown: { [reason: string]: number }
 *   }>,
 *   by_unit: Array<{
 *     unit_id: string,
 *     unit_name: string,
 *     escalation_count: number,
 *     percentage: number
 *   }>,
 *   by_assignee: Array<{
 *     assignee_id: string,
 *     assignee_name: string,
 *     escalation_count: number,
 *     total_assignments: number,
 *     escalation_rate: number
 *   }>,
 *   by_work_type: Array<{
 *     work_item_type: string,
 *     escalation_count: number,
 *     percentage: number
 *   }>
 * }
 */

interface EscalationEvent {
  id: string;
  assignment_id: string;
  reason: string;
  escalated_at: string;
  created_at: string;
}

interface Assignment {
  id: string;
  work_item_type: string;
  assignee_id: string;
  organizational_unit_id: string;
  sla_status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const endDate = url.searchParams.get('end_date') || new Date().toISOString();
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const unitId = url.searchParams.get('unit_id');
    const assigneeId = url.searchParams.get('assignee_id');
    const workItemType = url.searchParams.get('work_item_type');
    const groupBy = url.searchParams.get('group_by') || 'day';

    // Build query for escalation events
    let escalationsQuery = supabase
      .from('escalation_events')
      .select(`
        id,
        assignment_id,
        reason,
        escalated_at,
        created_at,
        assignments!inner (
          id,
          work_item_type,
          assignee_id,
          organizational_unit_id,
          sla_status
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Apply filters via join
    if (unitId) {
      escalationsQuery = escalationsQuery.eq('assignments.organizational_unit_id', unitId);
    }
    if (assigneeId) {
      escalationsQuery = escalationsQuery.eq('assignments.assignee_id', assigneeId);
    }
    if (workItemType) {
      escalationsQuery = escalationsQuery.eq('assignments.work_item_type', workItemType);
    }

    const { data: escalations, error: escalationsError } = await escalationsQuery;

    if (escalationsError) {
      throw escalationsError;
    }

    // Calculate summary statistics
    const totalEscalations = escalations?.length || 0;
    const daysDiff = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000));
    const avgEscalationsPerDay = totalEscalations / daysDiff;

    // Count escalations by reason
    const reasonCounts: { [key: string]: number } = {};
    escalations?.forEach((esc: any) => {
      reasonCounts[esc.reason] = (reasonCounts[esc.reason] || 0) + 1;
    });

    const mostCommonReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    // Get unique affected assignments
    const affectedAssignments = new Set(escalations?.map((e: any) => e.assignment_id)).size;

    const summary = {
      total_escalations: totalEscalations,
      avg_escalations_per_day: Math.round(avgEscalationsPerDay * 100) / 100,
      most_common_reason: mostCommonReason,
      affected_assignments: affectedAssignments,
    };

    // Build time series data
    const timeSeries: { [key: string]: { count: number; reasons: { [key: string]: number } } } = {};

    escalations?.forEach((esc: any) => {
      const date = new Date(esc.created_at);
      let key: string;

      if (groupBy === 'week') {
        // Get start of week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Default to day
        key = date.toISOString().split('T')[0];
      }

      if (!timeSeries[key]) {
        timeSeries[key] = { count: 0, reasons: {} };
      }

      timeSeries[key].count++;
      timeSeries[key].reasons[esc.reason] = (timeSeries[key].reasons[esc.reason] || 0) + 1;
    });

    const timeSeriesArray = Object.entries(timeSeries)
      .map(([date, data]) => ({
        date,
        count: data.count,
        reason_breakdown: data.reasons,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Escalations by organizational unit
    const unitCounts: { [key: string]: number } = {};
    escalations?.forEach((esc: any) => {
      const unitId = esc.assignments?.organizational_unit_id;
      if (unitId) {
        unitCounts[unitId] = (unitCounts[unitId] || 0) + 1;
      }
    });

    // Fetch unit names
    const unitIds = Object.keys(unitCounts);
    const { data: units } = await supabase
      .from('organizational_units')
      .select('id, name')
      .in('id', unitIds);

    const unitMap = new Map(units?.map((u: any) => [u.id, u.name]) || []);

    const byUnit = Object.entries(unitCounts)
      .map(([unitId, count]) => ({
        unit_id: unitId,
        unit_name: unitMap.get(unitId) || 'Unknown',
        escalation_count: count,
        percentage: Math.round((count / totalEscalations) * 10000) / 100,
      }))
      .sort((a, b) => b.escalation_count - a.escalation_count);

    // Escalations by assignee
    const assigneeCounts: { [key: string]: number } = {};
    escalations?.forEach((esc: any) => {
      const assigneeId = esc.assignments?.assignee_id;
      if (assigneeId) {
        assigneeCounts[assigneeId] = (assigneeCounts[assigneeId] || 0) + 1;
      }
    });

    // Fetch assignee details and total assignment counts
    const assigneeIds = Object.keys(assigneeCounts);
    const { data: staffProfiles } = await supabase
      .from('staff_profiles')
      .select('user_id, full_name, current_assignment_count')
      .in('user_id', assigneeIds);

    const staffMap = new Map(staffProfiles?.map((s: any) => [s.user_id, s]) || []);

    const byAssignee = Object.entries(assigneeCounts)
      .map(([assigneeId, escalationCount]) => {
        const staff = staffMap.get(assigneeId);
        const totalAssignments = staff?.current_assignment_count || 0;
        const escalationRate = totalAssignments > 0
          ? Math.round((escalationCount / totalAssignments) * 10000) / 100
          : 0;

        return {
          assignee_id: assigneeId,
          assignee_name: staff?.full_name || 'Unknown',
          escalation_count: escalationCount,
          total_assignments: totalAssignments,
          escalation_rate: escalationRate,
        };
      })
      .sort((a, b) => b.escalation_count - a.escalation_count);

    // Escalations by work item type
    const workTypeCounts: { [key: string]: number } = {};
    escalations?.forEach((esc: any) => {
      const workType = esc.assignments?.work_item_type;
      if (workType) {
        workTypeCounts[workType] = (workTypeCounts[workType] || 0) + 1;
      }
    });

    const byWorkType = Object.entries(workTypeCounts)
      .map(([workItemType, count]) => ({
        work_item_type: workItemType,
        escalation_count: count,
        percentage: Math.round((count / totalEscalations) * 10000) / 100,
      }))
      .sort((a, b) => b.escalation_count - a.escalation_count);

    // Build response
    const response = {
      summary,
      time_series: timeSeriesArray,
      by_unit: byUnit,
      by_assignee: byAssignee,
      by_work_type: byWorkType,
      metadata: {
        start_date: startDate,
        end_date: endDate,
        filters: {
          unit_id: unitId,
          assignee_id: assigneeId,
          work_item_type: workItemType,
        },
        group_by: groupBy,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in escalations-report:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
