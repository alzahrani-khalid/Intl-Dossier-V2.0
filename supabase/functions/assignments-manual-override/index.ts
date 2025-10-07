/**
 * POST /assignments/manual-override
 * Manual assignment override by supervisors/admins
 *
 * Dependencies:
 * - T041: SLA service
 * - T044: Capacity service
 * - FR-007c: Bypasses WIP limit but logs capacity warning
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ManualOverrideRequest {
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  assignee_id: string;
  override_reason: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

interface ManualOverrideResponse {
  assignment_id: string;
  assignee_id: string;
  assigned_at: string;
  sla_deadline: string;
  capacity_warning?: string;
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

    // Check if user is supervisor or admin
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('staff_profiles')
      .select('role, unit_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (userProfile.role !== 'supervisor' && userProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Only supervisors and admins can manually override assignments',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: ManualOverrideRequest = await req.json();

    // Validate request
    if (!body.work_item_id || !body.assignee_id || !body.override_reason) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Missing required fields: work_item_id, assignee_id, override_reason',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (body.override_reason.length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'override_reason must be at least 10 characters',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If supervisor, verify assignee is in their unit
    if (userProfile.role === 'supervisor') {
      const { data: assigneeProfile, error: assigneeError } = await supabaseClient
        .from('staff_profiles')
        .select('unit_id')
        .eq('user_id', body.assignee_id)
        .single();

      if (assigneeError || !assigneeProfile) {
        return new Response(
          JSON.stringify({
            error: 'Not found',
            message: 'Assignee not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (assigneeProfile.unit_id !== userProfile.unit_id) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Supervisors can only override assignments within their unit',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if assignee is at or over WIP limit (warning, not blocking per FR-007c)
    const { data: assigneeCapacity, error: capacityError } = await supabaseClient
      .from('staff_profiles')
      .select('individual_wip_limit, current_assignment_count')
      .eq('user_id', body.assignee_id)
      .single();

    let capacityWarning: string | undefined;
    if (!capacityError && assigneeCapacity) {
      if (assigneeCapacity.current_assignment_count >= assigneeCapacity.individual_wip_limit) {
        capacityWarning = `Assignee is at or over WIP limit (${assigneeCapacity.current_assignment_count}/${assigneeCapacity.individual_wip_limit})`;
      }
    }

    // Get SLA config for deadline calculation
    const { data: slaConfig, error: slaError } = await supabaseClient
      .from('sla_configs')
      .select('deadline_hours')
      .eq('work_item_type', body.work_item_type)
      .eq('priority', body.priority)
      .single();

    if (slaError || !slaConfig) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: `No SLA config found for ${body.work_item_type} with priority ${body.priority}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate SLA deadline
    const assigned_at = new Date();
    const sla_deadline = new Date(
      assigned_at.getTime() + slaConfig.deadline_hours * 60 * 60 * 1000
    );

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('assignments')
      .insert({
        work_item_id: body.work_item_id,
        work_item_type: body.work_item_type,
        assignee_id: body.assignee_id,
        assigned_at: assigned_at.toISOString(),
        assigned_by: user.id,
        sla_deadline: sla_deadline.toISOString(),
        priority: body.priority,
        status: 'assigned',
        override_reason: body.override_reason,
        is_manual_override: true,
      })
      .select()
      .single();

    if (assignmentError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create assignment',
          message: assignmentError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log override in audit trail with capacity warning if applicable
    await supabaseClient.from('audit_logs').insert({
      action: 'assignment_manual_override',
      user_id: user.id,
      resource_type: 'assignment',
      resource_id: assignment.id,
      metadata: {
        work_item_id: body.work_item_id,
        assignee_id: body.assignee_id,
        override_reason: body.override_reason,
        capacity_warning: capacityWarning,
        wip_status: assigneeCapacity
          ? `${assigneeCapacity.current_assignment_count}/${assigneeCapacity.individual_wip_limit}`
          : 'unknown',
      },
      created_at: new Date().toISOString(),
    });

    const response: ManualOverrideResponse = {
      assignment_id: assignment.id,
      assignee_id: assignment.assignee_id,
      assigned_at: assignment.assigned_at,
      sla_deadline: assignment.sla_deadline,
    };

    if (capacityWarning) {
      response.capacity_warning = capacityWarning;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in manual override:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
