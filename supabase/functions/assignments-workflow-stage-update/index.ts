import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Inline types and utilities for Deno Edge Function
type WorkflowStage = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
type UserRole = 'staff' | 'manager' | 'admin';

interface TransitionValidation {
  allowed: boolean;
  errorMessage?: string;
}

function canTransitionStage(
  userRole: UserRole,
  fromStage: WorkflowStage,
  toStage: WorkflowStage
): TransitionValidation {
  if (toStage === 'cancelled') {
    return { allowed: true };
  }

  if (fromStage === 'done' || fromStage === 'cancelled') {
    return {
      allowed: false,
      errorMessage: `Cannot move assignments from '${fromStage}' stage`
    };
  }

  if (userRole === 'manager' || userRole === 'admin') {
    return { allowed: true };
  }

  const sequentialTransitions: Record<WorkflowStage, WorkflowStage[]> = {
    'todo': ['in_progress'],
    'in_progress': ['review'],
    'review': ['done'],
    'done': [],
    'cancelled': []
  };

  const allowedNextStages = sequentialTransitions[fromStage] || [];

  if (!allowedNextStages.includes(toStage)) {
    return {
      allowed: false,
      errorMessage: `Staff members must move assignments through stages sequentially. Cannot skip from '${fromStage}' to '${toStage}'.`
    };
  }

  return { allowed: true };
}

function calculateStageSLADeadline(stage: WorkflowStage): Date | null {
  const slaHours: Record<WorkflowStage, number | null> = {
    'todo': 24,
    'in_progress': 48,
    'review': 12,
    'done': null,
    'cancelled': null
  };

  const hours = slaHours[stage];
  if (hours === null) return null;

  return new Date(Date.now() + hours * 3600000);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { assignment_id, workflow_stage, triggered_by_user_id } = body;

    if (!assignment_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assignment ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!workflow_stage || !triggered_by_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: workflow_stage and triggered_by_user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user JWT
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch current assignment and user role
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, workflow_stage, engagement_id')
      .eq('id', assignment_id)
      .single();

    if (fetchError || !assignment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('staff_profiles')
      .select('role')
      .eq('user_id', triggered_by_user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role-based transition
    const validation = canTransitionStage(
      user.role as UserRole,
      assignment.workflow_stage as WorkflowStage,
      workflow_stage as WorkflowStage
    );

    if (!validation.allowed) {
      return new Response(
        JSON.stringify({ success: false, validation_error: validation.errorMessage }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new stage SLA deadline
    const newSLADeadline = calculateStageSLADeadline(workflow_stage as WorkflowStage);

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        workflow_stage: workflow_stage,
        current_stage_sla_deadline: newSLADeadline?.toISOString() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment_id)
      .select('id, workflow_stage, current_stage_sla_deadline, updated_at')
      .single();

    if (updateError) throw updateError;

    // Insert stage history record
    await supabase.from('assignment_stage_history').insert({
      assignment_id: assignment_id,
      from_stage: assignment.workflow_stage as WorkflowStage,
      to_stage: workflow_stage as WorkflowStage,
      transitioned_by: triggered_by_user_id
    });

    // Broadcast real-time update
    const channel = supabase.channel(`engagement:${assignment.engagement_id}:kanban`);
    await channel.send({
      type: 'broadcast',
      event: 'assignment:moved',
      payload: {
        assignment_id: assignment_id,
        from_stage: assignment.workflow_stage,
        to_stage: workflow_stage,
        moved_by_user_id: triggered_by_user_id,
        moved_at: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        assignment: {
          id: updatedAssignment.id,
          workflow_stage: updatedAssignment.workflow_stage,
          current_stage_sla_deadline: updatedAssignment.current_stage_sla_deadline,
          updated_at: updatedAssignment.updated_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in assignments-workflow-stage-update:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
