/**
 * T049: GET /assignments/my-assignments
 * Get authenticated user's assignments with SLA countdown
 *
 * Query Parameters:
 * - status?: "pending" | "in_progress" | "completed" | "cancelled"
 * - include_completed?: boolean (default: false)
 *
 * Response 200:
 * {
 *   "assignments": [{
 *     "id": string,
 *     "work_item_id": string,
 *     "work_item_type": string,
 *     "assigned_at": string,
 *     "sla_deadline": string,
 *     "time_remaining_seconds": number,
 *     "priority": string,
 *     "status": string,
 *     "warning_sent_at": string?,
 *     "escalated_at": string?,
 *     "escalation_recipient_id": string?
 *   }]
 * }
 *
 * Dependencies:
 * - T007: assignments table
 * - T041: SLA service (for time_remaining calculation)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: string;
  work_item_title?: string;
  assigned_at: string;
  sla_deadline: string;
  time_remaining_seconds: number;
  priority: string;
  status: string;
  warning_sent_at: string | null;
  escalated_at: string | null;
  escalation_recipient_id: string | null;
}

interface MyAssignmentsResponse {
  assignments: Assignment[];
  total_count: number;
  summary: {
    active_count: number;
    at_risk_count: number;
    breached_count: number;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const includeCompleted = url.searchParams.get('include_completed') === 'true';

    // Build query
    let query = supabaseClient
      .from('tasks')
      .select('id, title, description, work_item_type, work_item_id, assignee_id, created_at, sla_deadline, priority, status, workflow_stage, assignment, escalation')
      .eq('assignee_id', user.id)
      .order('sla_deadline', { ascending: true }); // Most urgent first

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    } else if (!includeCompleted) {
      // Default: exclude completed and cancelled
      query = query.in('status', ['pending', 'in_progress']);
    }

    // Execute query
    const { data: assignments, error: queryError } = await query;

    if (queryError) {
      throw queryError;
    }

    // Calculate time remaining for each task and format the response
    const now = Date.now();
    const assignmentsWithTimeRemaining: Assignment[] = (assignments || []).map((task) => {
      const deadline = new Date(task.sla_deadline).getTime();
      const timeRemaining = Math.floor((deadline - now) / 1000);

      // Use the task's own title, or fallback to description or 'Untitled Task'
      const workItemTitle = task.title || task.description || 'Untitled Task';

      // Extract values from JSONB fields
      const assignment = task.assignment || {};
      const escalation = task.escalation || {};
      const assignedAt = assignment.assigned_at || task.created_at;

      return {
        id: task.id,
        work_item_id: task.work_item_id || task.id,
        work_item_type: task.work_item_type,
        work_item_title: workItemTitle,
        assigned_at: assignedAt,
        sla_deadline: task.sla_deadline,
        time_remaining_seconds: timeRemaining,
        priority: task.priority,
        status: task.status,
        warning_sent_at: assignment.warning_sent_at || null,
        escalated_at: escalation.escalated_at || null,
        escalation_recipient_id: escalation.recipient_id || null,
      };
    });

    // Calculate summary statistics
    const activeAssignments = assignmentsWithTimeRemaining.filter(
      (a) => a.status !== 'completed' && a.status !== 'cancelled'
    );

    const atRiskAssignments = assignmentsWithTimeRemaining.filter((a) => {
      if (a.status === 'completed' || a.status === 'cancelled') return false;
      const deadline = new Date(a.sla_deadline).getTime();
      const assignedAt = new Date(a.assigned_at).getTime();
      const totalDuration = deadline - assignedAt;
      const elapsed = now - assignedAt;
      const percentageElapsed = (elapsed / totalDuration) * 100;
      return percentageElapsed >= 75 && percentageElapsed < 100;
    });

    const breachedAssignments = assignmentsWithTimeRemaining.filter(
      (a) => a.time_remaining_seconds < 0 && a.status !== 'completed' && a.status !== 'cancelled'
    );

    const response: MyAssignmentsResponse = {
      assignments: assignmentsWithTimeRemaining,
      total_count: assignmentsWithTimeRemaining.length,
      summary: {
        active_count: activeAssignments.length,
        at_risk_count: atRiskAssignments.length,
        breached_count: breachedAssignments.length,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching my assignments:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
