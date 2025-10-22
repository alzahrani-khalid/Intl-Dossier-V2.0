/**
 * Tasks Get Edge Function
 * Part of: 025-unified-tasks-model implementation
 *
 * Query unified tasks table with filtering:
 * - assigned: Tasks assigned to user (assignee_id)
 * - contributed: Tasks where user is a contributor
 * - created: Tasks created by user (created_by)
 * - all: All accessible tasks (combines assigned, contributed, created)
 *
 * Supports pagination, sorting, and work item filtering
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface TasksGetRequest {
  filter?: 'assigned' | 'contributed' | 'created' | 'all';
  assignee_id?: string;
  engagement_id?: string;
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic';
  work_item_id?: string;
  sla_deadline_before?: string;
  is_overdue?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'sla_deadline' | 'priority';
  sort_order?: 'asc' | 'desc';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const params: TasksGetRequest = {
      filter: (url.searchParams.get('filter') as any) || 'all',
      assignee_id: url.searchParams.get('assignee_id') || undefined,
      engagement_id: url.searchParams.get('engagement_id') || undefined,
      workflow_stage: (url.searchParams.get('workflow_stage') as any) || undefined,
      status: (url.searchParams.get('status') as any) || undefined,
      work_item_type: (url.searchParams.get('work_item_type') as any) || undefined,
      work_item_id: url.searchParams.get('work_item_id') || undefined,
      sla_deadline_before: url.searchParams.get('sla_deadline_before') || undefined,
      is_overdue: url.searchParams.get('is_overdue') === 'true',
      page: parseInt(url.searchParams.get('page') || '1'),
      page_size: parseInt(url.searchParams.get('page_size') || '50'),
      sort_by: (url.searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (url.searchParams.get('sort_order') as any) || 'desc',
    };

    // Start building the query
    let query = supabase
      .from('tasks')
      .select('*, task_contributors(user_id)', { count: 'exact' })
      .eq('is_deleted', false);

    // Apply filter-based access control
    if (params.filter === 'assigned') {
      query = query.eq('assignee_id', user.id);
    } else if (params.filter === 'created') {
      query = query.eq('created_by', user.id);
    } else if (params.filter === 'contributed') {
      // Tasks where user is a contributor (RLS handles this via task_contributors join)
      query = query.not('id', 'is', null); // RLS will filter
    } else if (params.filter === 'all') {
      // All accessible tasks (assignee, creator, or contributor - RLS handles this)
      query = query.not('id', 'is', null);
    }

    // Apply additional filters
    if (params.assignee_id) {
      query = query.eq('assignee_id', params.assignee_id);
    }
    if (params.engagement_id) {
      query = query.eq('engagement_id', params.engagement_id);
    }
    if (params.workflow_stage) {
      query = query.eq('workflow_stage', params.workflow_stage);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.work_item_type) {
      query = query.eq('work_item_type', params.work_item_type);
    }
    if (params.work_item_id) {
      query = query.eq('work_item_id', params.work_item_id);
    }
    if (params.sla_deadline_before) {
      query = query.lt('sla_deadline', params.sla_deadline_before);
    }
    if (params.is_overdue) {
      query = query.lt('sla_deadline', new Date().toISOString());
      query = query.not('status', 'in', '(completed,cancelled)');
    }

    // Apply sorting
    query = query.order(params.sort_by!, {
      ascending: params.sort_order === 'asc',
    });

    // Apply pagination
    const from = ((params.page || 1) - 1) * (params.page_size || 50);
    const to = from + (params.page_size || 50) - 1;
    query = query.range(from, to);

    // Execute query
    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return results
    return new Response(
      JSON.stringify({
        tasks: tasks || [],
        total_count: count || 0,
        page: params.page || 1,
        page_size: params.page_size || 50,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
