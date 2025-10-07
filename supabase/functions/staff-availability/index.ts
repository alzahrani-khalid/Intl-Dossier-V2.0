/**
 * T052: PUT /staff/availability
 * Update staff availability status and trigger reassignment if needed
 *
 * Request Body:
 * {
 *   "staff_id"?: string (optional, defaults to current user)
 *   "status": "available" | "on_leave" | "unavailable",
 *   "unavailable_until"?: string (ISO datetime),
 *   "reason"?: string
 * }
 *
 * Response 200:
 * {
 *   "updated": true,
 *   "status": string,
 *   "reassigned_items": [{
 *     "assignment_id": string,
 *     "work_item_id": string,
 *     "new_assignee_id": string,
 *     "new_assignee_name": string
 *   }],
 *   "flagged_for_review": [{
 *     "assignment_id": string,
 *     "work_item_id": string,
 *     "priority": string
 *   }]
 * }
 *
 * Dependencies:
 * - T004: staff_profiles table
 * - T007: assignments table
 * - T045: availability service
 * - FR-011a: Auto-reassign urgent/high items
 * - FR-011b: Flag normal/low items for review
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface AvailabilityUpdateRequest {
  staff_id?: string;
  status: 'available' | 'on_leave' | 'unavailable';
  unavailable_until?: string;
  reason?: string;
}

interface ReassignedItem {
  assignment_id: string;
  work_item_id: string;
  new_assignee_id: string;
  new_assignee_name: string;
}

interface FlaggedItem {
  assignment_id: string;
  work_item_id: string;
  priority: string;
}

interface AvailabilityUpdateResponse {
  updated: true;
  status: string;
  reassigned_items: ReassignedItem[];
  flagged_for_review: FlaggedItem[];
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

    // Parse request body
    const body: AvailabilityUpdateRequest = await req.json();

    // Validate request
    if (!body.status) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Missing required field: status',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Default to current user if staff_id not provided
    const targetStaffId = body.staff_id || user.id;

    // Get user's role for permission check
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

    // Permission check: users update own, supervisors update team, admins update any
    if (targetStaffId !== user.id) {
      if (userProfile.role === 'staff') {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You can only update your own availability',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // If supervisor, check if target is in their unit
      if (userProfile.role === 'supervisor') {
        const { data: targetProfile, error: targetError } = await supabaseClient
          .from('staff_profiles')
          .select('unit_id')
          .eq('user_id', targetStaffId)
          .single();

        if (targetError || !targetProfile) {
          return new Response(
            JSON.stringify({
              error: 'Not found',
              message: 'Target staff member not found',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (targetProfile.unit_id !== userProfile.unit_id) {
          return new Response(
            JSON.stringify({
              error: 'Forbidden',
              message: 'Supervisors can only update availability of their unit members',
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Validate unavailable_until if status is not available
    if (body.status !== 'available' && !body.unavailable_until) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'unavailable_until is required when status is not "available"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update staff availability
    const { error: updateError } = await supabaseClient
      .from('staff_profiles')
      .update({
        availability_status: body.status,
        unavailable_until: body.unavailable_until || null,
        unavailable_reason: body.reason || null,
        availability_source: 'manual',
      })
      .eq('user_id', targetStaffId);

    if (updateError) {
      throw updateError;
    }

    const reassignedItems: ReassignedItem[] = [];
    const flaggedItems: FlaggedItem[] = [];

    // If status changed to on_leave or unavailable, handle assignments
    if (body.status === 'on_leave' || body.status === 'unavailable') {
      // Get all active assignments for this staff member
      const { data: activeAssignments, error: assignmentsError } = await supabaseClient
        .from('assignments')
        .select('id, work_item_id, work_item_type, priority, required_skills')
        .eq('assignee_id', targetStaffId)
        .in('status', ['assigned', 'in_progress']);

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Process each assignment
      for (const assignment of activeAssignments || []) {
        // Auto-reassign urgent and high priority items
        if (assignment.priority === 'urgent' || assignment.priority === 'high') {
          // Find best available staff with matching skills
          const { data: availableStaff, error: staffError } = await supabaseClient
            .from('staff_profiles')
            .select('user_id, individual_wip_limit, current_assignment_count, skills')
            .eq('availability_status', 'available')
            .neq('user_id', targetStaffId)
            .lt('current_assignment_count', supabaseClient.raw('individual_wip_limit'))
            .limit(10);

          if (staffError) {
            console.error('Error finding available staff:', staffError);
            continue;
          }

          // Find staff with best skill match
          const matchedStaff = (availableStaff || [])
            .filter((staff) =>
              assignment.required_skills?.every((skill: string) => staff.skills.includes(skill))
            )
            .sort((a, b) => a.current_assignment_count - b.current_assignment_count)[0];

          if (matchedStaff) {
            // Reassign to new staff
            await supabaseClient
              .from('assignments')
              .update({
                assignee_id: matchedStaff.user_id,
                assigned_at: new Date().toISOString(),
                reassignment_reason: `Previous assignee on leave: ${body.reason || 'No reason provided'}`,
              })
              .eq('id', assignment.id);

            reassignedItems.push({
              assignment_id: assignment.id,
              work_item_id: assignment.work_item_id,
              new_assignee_id: matchedStaff.user_id,
              new_assignee_name: 'Staff Member', // Would need to join users table for actual name
            });
          } else {
            // No available staff, flag for manual review
            await supabaseClient
              .from('assignments')
              .update({
                needs_review: true,
                review_reason: `Original assignee on leave, no available staff with matching skills`,
              })
              .eq('id', assignment.id);

            flaggedItems.push({
              assignment_id: assignment.id,
              work_item_id: assignment.work_item_id,
              priority: assignment.priority,
            });
          }
        } else {
          // Normal and low priority: flag for manual review
          await supabaseClient
            .from('assignments')
            .update({
              needs_review: true,
              review_reason: `Assignee on leave (${body.reason || 'No reason provided'})`,
            })
            .eq('id', assignment.id);

          flaggedItems.push({
            assignment_id: assignment.id,
            work_item_id: assignment.work_item_id,
            priority: assignment.priority,
          });
        }
      }

      // Notify supervisor if items were flagged
      if (flaggedItems.length > 0) {
        // Get supervisor for notification
        const { data: staffProfile, error: staffProfileError } = await supabaseClient
          .from('staff_profiles')
          .select('unit_id')
          .eq('user_id', targetStaffId)
          .single();

        if (!staffProfileError && staffProfile) {
          const { data: supervisor, error: supervisorError } = await supabaseClient
            .from('staff_profiles')
            .select('user_id')
            .eq('unit_id', staffProfile.unit_id)
            .eq('role', 'supervisor')
            .limit(1)
            .single();

          if (!supervisorError && supervisor) {
            await supabaseClient.from('notifications').insert({
              user_id: supervisor.user_id,
              type: 'staff_leave_items_for_review',
              reference_type: 'staff_profile',
              reference_id: targetStaffId,
              title_en: 'Items Need Review',
              title_ar: 'عناصر تحتاج إلى مراجعة',
              message_en: `${flaggedItems.length} items need review due to staff leave`,
              message_ar: `${flaggedItems.length} عنصر يحتاج إلى مراجعة بسبب إجازة الموظف`,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    const response: AvailabilityUpdateResponse = {
      updated: true,
      status: body.status,
      reassigned_items: reassignedItems,
      flagged_for_review: flaggedItems,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating availability:', error);
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
