/**
 * T051: GET /capacity/check
 * Check staff or unit capacity utilization
 *
 * Query Parameters:
 * - staff_id?: string (check individual capacity)
 * - unit_id?: string (check unit capacity)
 *
 * Note: Either staff_id OR unit_id must be provided, not both
 *
 * Response 200:
 * {
 *   "type": "staff" | "unit",
 *   "id": string,
 *   "current_count": number,
 *   "limit": number,
 *   "utilization_pct": number,
 *   "status": "available" | "near_limit" | "at_limit",
 *   "available_capacity": number
 * }
 *
 * Dependencies:
 * - T004: staff_profiles table
 * - T002: organizational_units table
 * - T044: capacity service
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CapacityResponse {
  type: 'staff' | 'unit';
  id: string;
  current_count: number;
  limit: number;
  utilization_pct: number;
  status: 'available' | 'near_limit' | 'at_limit';
  available_capacity: number;
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
    const staff_id = url.searchParams.get('staff_id');
    const unit_id = url.searchParams.get('unit_id');

    // Validate: exactly one parameter must be provided
    if (!staff_id && !unit_id) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Either staff_id or unit_id must be provided',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (staff_id && unit_id) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Cannot provide both staff_id and unit_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's role and unit for permission checks
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

    let response: CapacityResponse;

    if (staff_id) {
      // Check staff capacity
      // Permission: users can check own, supervisors check unit, admins check any
      if (
        staff_id !== user.id &&
        userProfile.role === 'staff'
      ) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You can only check your own capacity',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: staffProfile, error: staffError } = await supabaseClient
        .from('staff_profiles')
        .select('user_id, unit_id, individual_wip_limit, current_assignment_count')
        .eq('user_id', staff_id)
        .single();

      if (staffError || !staffProfile) {
        return new Response(
          JSON.stringify({
            error: 'Not found',
            message: 'Staff member not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Supervisor can only check their unit members
      if (
        userProfile.role === 'supervisor' &&
        staffProfile.unit_id !== userProfile.unit_id
      ) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Supervisors can only check capacity of their unit members',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const utilizationPct =
        (staffProfile.current_assignment_count / staffProfile.individual_wip_limit) * 100;
      const availableCapacity =
        staffProfile.individual_wip_limit - staffProfile.current_assignment_count;

      let status: 'available' | 'near_limit' | 'at_limit';
      if (utilizationPct >= 100) {
        status = 'at_limit';
      } else if (utilizationPct >= 75) {
        status = 'near_limit';
      } else {
        status = 'available';
      }

      response = {
        type: 'staff',
        id: staff_id,
        current_count: staffProfile.current_assignment_count,
        limit: staffProfile.individual_wip_limit,
        utilization_pct: Math.round(utilizationPct * 100) / 100,
        status,
        available_capacity: Math.max(0, availableCapacity),
      };
    } else {
      // Check unit capacity
      // Permission: supervisors check own unit, admins check any
      if (userProfile.role === 'staff') {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Only supervisors and admins can check unit capacity',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (userProfile.role === 'supervisor' && unit_id !== userProfile.unit_id) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Supervisors can only check their own unit capacity',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get unit details
      const { data: unit, error: unitError } = await supabaseClient
        .from('organizational_units')
        .select('id, unit_wip_limit')
        .eq('id', unit_id)
        .single();

      if (unitError || !unit) {
        return new Response(
          JSON.stringify({
            error: 'Not found',
            message: 'Unit not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate unit capacity (sum of all staff assignments in unit)
      const { data: staffInUnit, error: staffError } = await supabaseClient
        .from('staff_profiles')
        .select('current_assignment_count')
        .eq('unit_id', unit_id)
        .eq('availability_status', 'available');

      if (staffError) {
        throw staffError;
      }

      const currentCount = (staffInUnit || []).reduce(
        (sum, staff) => sum + staff.current_assignment_count,
        0
      );

      const utilizationPct = (currentCount / unit.unit_wip_limit) * 100;
      const availableCapacity = unit.unit_wip_limit - currentCount;

      let status: 'available' | 'near_limit' | 'at_limit';
      if (utilizationPct >= 100) {
        status = 'at_limit';
      } else if (utilizationPct >= 75) {
        status = 'near_limit';
      } else {
        status = 'available';
      }

      response = {
        type: 'unit',
        id: unit_id!,
        current_count: currentCount,
        limit: unit.unit_wip_limit,
        utilization_pct: Math.round(utilizationPct * 100) / 100,
        status,
        available_capacity: Math.max(0, availableCapacity),
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking capacity:', error);
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
