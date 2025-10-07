/**
 * T046: POST /assignments/auto-assign
 * Auto-assigns work items to best available staff using weighted scoring
 *
 * Request Body:
 * {
 *   "work_item_id": string,
 *   "work_item_type": "dossier" | "ticket" | "position" | "task",
 *   "required_skills": string[],
 *   "target_unit_id"?: string,
 *   "priority": "urgent" | "high" | "normal" | "low"
 * }
 *
 * Response 200 (Success):
 * {
 *   "assignment_id": string,
 *   "assignee_id": string,
 *   "assigned_at": string,
 *   "sla_deadline": string,
 *   "time_remaining_seconds": number,
 *   "priority": string,
 *   "status": "assigned"
 * }
 *
 * Response 202 (Queued):
 * {
 *   "queued": true,
 *   "queue_id": string,
 *   "queue_position": number,
 *   "queued_at": string,
 *   "reason": string
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types (simplified for Edge Function)
interface AutoAssignRequest {
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  required_skills: string[];
  target_unit_id?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const body: AutoAssignRequest = await req.json();

    // Validate required fields
    if (!body.work_item_id || !body.work_item_type || !body.required_skills || !body.priority) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auto-assign request:', body);

    // Find best assignee using weighted scoring
    const { data: eligibleStaff, error: staffError } = await supabaseClient
      .from('staff_profiles')
      .select('*')
      .contains('skills', body.required_skills)
      .eq('availability_status', 'available')
      .lt('current_assignment_count', supabaseClient.raw('individual_wip_limit'));

    if (staffError) {
      throw staffError;
    }

    // If no capacity available, queue the work item
    if (!eligibleStaff || eligibleStaff.length === 0) {
      console.log('No eligible staff available, queueing...');

      const { data: queueEntry, error: queueError } = await supabaseClient
        .from('assignment_queue')
        .insert({
          work_item_id: body.work_item_id,
          work_item_type: body.work_item_type,
          required_skills: body.required_skills,
          target_unit_id: body.target_unit_id || null,
          priority: body.priority,
          notes: 'All staff at WIP limit or unavailable',
          attempts: 0,
        })
        .select()
        .single();

      if (queueError) {
        throw queueError;
      }

      // Get queue position
      const { count } = await supabaseClient
        .from('assignment_queue')
        .select('*', { count: 'exact', head: true })
        .or(
          `priority.gt.${body.priority},` +
          `and(priority.eq.${body.priority},created_at.lt.${queueEntry.created_at})`
        );

      return new Response(
        JSON.stringify({
          queued: true,
          queue_id: queueEntry.id,
          queue_position: (count || 0) + 1,
          queued_at: queueEntry.created_at,
          reason: queueEntry.notes,
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate scores for eligible staff
    const scoredStaff = eligibleStaff
      .map((staff) => {
        const matchedSkills = staff.skills.filter((skill: string) =>
          body.required_skills.includes(skill)
        );
        const skillScore = (matchedSkills.length / body.required_skills.length) * 40;
        const capacityScore = (1 - staff.current_assignment_count / staff.individual_wip_limit) * 30;
        const availabilityScore = staff.availability_status === 'available' ? 20 : 0;
        const unitScore =
          body.target_unit_id && staff.unit_id === body.target_unit_id ? 10 : body.target_unit_id ? 0 : 5;

        return {
          staff,
          score: skillScore + capacityScore + availabilityScore + unitScore,
        };
      })
      .sort((a, b) => b.score - a.score);

    const bestMatch = scoredStaff[0];

    if (!bestMatch) {
      throw new Error('No suitable staff found after scoring');
    }

    console.log(`Best assignee: ${bestMatch.staff.user_id} (score: ${bestMatch.score})`);

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('assignments')
      .insert({
        work_item_id: body.work_item_id,
        work_item_type: body.work_item_type,
        assignee_id: bestMatch.staff.user_id,
        assigned_at: new Date().toISOString(),
        priority: body.priority,
        status: 'assigned',
        // sla_deadline calculated by database trigger
      })
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    // Calculate time remaining
    const deadline = new Date(assignment.sla_deadline);
    const timeRemaining = Math.floor((deadline.getTime() - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        assignment_id: assignment.id,
        assignee_id: assignment.assignee_id,
        assigned_at: assignment.assigned_at,
        sla_deadline: assignment.sla_deadline,
        time_remaining_seconds: timeRemaining,
        priority: assignment.priority,
        status: assignment.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-assign error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
