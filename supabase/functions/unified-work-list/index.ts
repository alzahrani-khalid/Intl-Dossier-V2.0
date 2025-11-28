// Feature 032: Unified Work Management - Get paginated work items
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface WorkListRequest {
  sources?: ('commitment' | 'task' | 'intake')[];
  trackingTypes?: ('delivery' | 'follow_up' | 'sla')[];
  statuses?: string[];
  priorities?: string[];
  isOverdue?: boolean;
  dossierId?: string;
  searchQuery?: string;
  cursorDeadline?: string;
  cursorId?: string;
  limit?: number;
  sortBy?: 'deadline' | 'created_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
  // Additional endpoints
  endpoint?: 'list' | 'summary' | 'metrics' | 'team';
}

serve(async (req) => {
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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET requests with query params
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const endpoint = url.searchParams.get('endpoint') || 'list';

      switch (endpoint) {
        case 'summary': {
          // Get user work summary
          const { data, error } = await supabaseClient
            .rpc('get_user_work_summary', { p_user_id: user.id });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(data?.[0] || {
              user_id: user.id,
              total_active: 0,
              overdue_count: 0,
              due_today: 0,
              due_this_week: 0,
              commitment_count: 0,
              task_count: 0,
              intake_count: 0,
              delivery_count: 0,
              follow_up_count: 0,
              sla_count: 0,
              high_priority_count: 0
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'metrics': {
          // Get user productivity metrics
          const { data, error } = await supabaseClient
            .rpc('get_user_productivity_metrics', { p_user_id: user.id });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(data?.[0] || {
              user_id: user.id,
              completed_count_30d: 0,
              on_time_rate_30d: 0,
              avg_completion_hours_30d: 0,
              completed_count_all: 0,
              on_time_rate_all: 0,
              avg_completion_hours_all: 0,
              commitment_completed_30d: 0,
              task_completed_30d: 0,
              intake_completed_30d: 0
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'team': {
          // Get team workload (managers only)
          const { data, error } = await supabaseClient
            .rpc('get_team_workload', { requesting_user_id: user.id });

          if (error) {
            // Check if unauthorized
            if (error.message.includes('Unauthorized')) {
              return new Response(
                JSON.stringify({ error: 'Forbidden', message: 'Only team managers can access team workload' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ team_members: data || [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'list':
        default: {
          // Parse query parameters for list endpoint
          const params: Record<string, any> = {
            p_user_id: user.id,
            p_limit: parseInt(url.searchParams.get('limit') || '50', 10),
            p_sort_by: url.searchParams.get('sortBy') || 'deadline',
            p_sort_order: url.searchParams.get('sortOrder') || 'asc'
          };

          // Optional filters
          const sources = url.searchParams.get('sources');
          if (sources) {
            params.p_sources = sources.split(',');
          }

          const trackingTypes = url.searchParams.get('trackingTypes');
          if (trackingTypes) {
            params.p_tracking_types = trackingTypes.split(',');
          }

          const statuses = url.searchParams.get('statuses');
          if (statuses) {
            params.p_statuses = statuses.split(',');
          }

          const priorities = url.searchParams.get('priorities');
          if (priorities) {
            params.p_priorities = priorities.split(',');
          }

          const isOverdue = url.searchParams.get('isOverdue');
          if (isOverdue !== null) {
            params.p_is_overdue = isOverdue === 'true';
          }

          const dossierId = url.searchParams.get('dossierId');
          if (dossierId) {
            params.p_dossier_id = dossierId;
          }

          const searchQuery = url.searchParams.get('search');
          if (searchQuery) {
            params.p_search_query = searchQuery;
          }

          const cursorDeadline = url.searchParams.get('cursorDeadline');
          if (cursorDeadline) {
            params.p_cursor_deadline = cursorDeadline;
          }

          const cursorId = url.searchParams.get('cursorId');
          if (cursorId) {
            params.p_cursor_id = cursorId;
          }

          // Call RPC function
          const { data, error } = await supabaseClient
            .rpc('get_unified_work_items', params);

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Determine if there are more results
          const items = data || [];
          const hasMore = items.length > 0 && items[items.length - 1]?.has_more === true;

          // Get next cursor from last item
          const lastItem = items[items.length - 1];
          const nextCursor = hasMore ? {
            deadline: lastItem?.deadline,
            id: lastItem?.id
          } : null;

          return new Response(
            JSON.stringify({
              items: items.map((item: any) => {
                // Remove has_more from individual items
                const { has_more, ...rest } = item;
                return rest;
              }),
              hasMore,
              nextCursor
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // POST for bulk operations or complex queries
    if (req.method === 'POST') {
      const body: WorkListRequest = await req.json();

      const params: Record<string, any> = {
        p_user_id: user.id,
        p_limit: body.limit || 50,
        p_sort_by: body.sortBy || 'deadline',
        p_sort_order: body.sortOrder || 'asc'
      };

      if (body.sources) params.p_sources = body.sources;
      if (body.trackingTypes) params.p_tracking_types = body.trackingTypes;
      if (body.statuses) params.p_statuses = body.statuses;
      if (body.priorities) params.p_priorities = body.priorities;
      if (body.isOverdue !== undefined) params.p_is_overdue = body.isOverdue;
      if (body.dossierId) params.p_dossier_id = body.dossierId;
      if (body.searchQuery) params.p_search_query = body.searchQuery;
      if (body.cursorDeadline) params.p_cursor_deadline = body.cursorDeadline;
      if (body.cursorId) params.p_cursor_id = body.cursorId;

      const { data, error } = await supabaseClient
        .rpc('get_unified_work_items', params);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const items = data || [];
      const hasMore = items.length > 0 && items[items.length - 1]?.has_more === true;
      const lastItem = items[items.length - 1];

      return new Response(
        JSON.stringify({
          items: items.map((item: any) => {
            const { has_more, ...rest } = item;
            return rest;
          }),
          hasMore,
          nextCursor: hasMore ? {
            deadline: lastItem?.deadline,
            id: lastItem?.id
          } : null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unified work list error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
