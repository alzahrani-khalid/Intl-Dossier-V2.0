/**
 * T049: GET /assignments/my-assignments
 * Get authenticated user's assignments with SLA countdown
 *
 * Query Parameters:
 * - status?: "pending" | "assigned" | "in_progress" | "completed" | "cancelled"
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
      .from('assignments')
      .select('*')
      .eq('assignee_id', user.id)
      .order('sla_deadline', { ascending: true }); // Most urgent first

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    } else if (!includeCompleted) {
      // Default: exclude completed and cancelled
      query = query.in('status', ['pending', 'assigned', 'in_progress']);
    }

    // Execute query
    const { data: assignments, error: queryError } = await query;

    if (queryError) {
      throw queryError;
    }

    // Calculate time remaining for each assignment
    const now = Date.now();
    const assignmentsWithTimeRemaining: Assignment[] = (assignments || []).map((assignment) => {
      const deadline = new Date(assignment.sla_deadline).getTime();
      const timeRemaining = Math.floor((deadline - now) / 1000);

      return {
        id: assignment.id,
        work_item_id: assignment.work_item_id,
        work_item_type: assignment.work_item_type,
        assigned_at: assignment.assigned_at,
        sla_deadline: assignment.sla_deadline,
        time_remaining_seconds: timeRemaining,
        priority: assignment.priority,
        status: assignment.status,
        warning_sent_at: assignment.warning_sent_at,
        escalated_at: assignment.escalated_at,
        escalation_recipient_id: assignment.escalation_recipient_id,
      };
    });

    const response: MyAssignmentsResponse = {
      assignments: assignmentsWithTimeRemaining,
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
