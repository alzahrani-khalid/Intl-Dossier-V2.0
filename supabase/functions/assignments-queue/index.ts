/**
 * T048: GET /assignments/queue
 * Get paginated assignment queue sorted by priority and creation time
 *
 * Query Parameters:
 * - priority?: "urgent" | "high" | "normal" | "low"
 * - work_item_type?: "dossier" | "ticket" | "position" | "task"
 * - unit_id?: string
 * - page?: number (default: 1)
 * - page_size?: number (default: 50, max: 100)
 *
 * Response 200:
 * {
 *   "items": [{
 *     "id": string,
 *     "work_item_id": string,
 *     "work_item_type": string,
 *     "required_skills": string[],
 *     "target_unit_id": string?,
 *     "priority": string,
 *     "created_at": string,
 *     "queue_position": number,
 *     "attempts": number,
 *     "last_attempt_at": string?,
 *     "notes": string?
 *   }],
 *   "total_count": number,
 *   "page": number,
 *   "page_size": number,
 *   "total_pages": number
 * }
 *
 * Dependencies:
 * - T008: assignment_queue table
 * - RLS: Supervisors see unit queue, admins see all
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface QueueItem {
  id: string;
  work_item_id: string;
  work_item_type: string;
  required_skills: string[];
  target_unit_id: string | null;
  priority: string;
  created_at: string;
  queue_position: number;
  attempts: number;
  last_attempt_at: string | null;
  notes: string | null;
}

interface QueueListResponse {
  items: QueueItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
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

    // Check user role
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

    // Parse query parameters
    const url = new URL(req.url);
    const priority = url.searchParams.get('priority');
    const work_item_type = url.searchParams.get('work_item_type');
    const unit_id = url.searchParams.get('unit_id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const page_size = Math.min(parseInt(url.searchParams.get('page_size') || '50', 10), 100);

    // Build query
    let query = supabaseClient
      .from('assignment_queue')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false }) // Urgent first
      .order('created_at', { ascending: true }); // FIFO within priority

    // Apply filters
    if (priority) {
      query = query.eq('priority', priority);
    }

    if (work_item_type) {
      query = query.eq('work_item_type', work_item_type);
    }

    // Permission-based filtering
    if (userProfile.role === 'supervisor') {
      // Supervisors see their unit's queue
      const filterUnitId = unit_id || userProfile.unit_id;
      query = query.eq('target_unit_id', filterUnitId);
    } else if (userProfile.role === 'staff') {
      // Regular staff cannot view queue
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Only supervisors and admins can view the assignment queue',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (unit_id && userProfile.role === 'admin') {
      // Admins can filter by unit
      query = query.eq('target_unit_id', unit_id);
    }

    // Pagination
    const offset = (page - 1) * page_size;
    query = query.range(offset, offset + page_size - 1);

    // Execute query
    const { data: queueItems, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    // Calculate queue positions
    const itemsWithPosition: QueueItem[] = (queueItems || []).map((item, index) => ({
      ...item,
      queue_position: offset + index + 1,
    }));

    const response: QueueListResponse = {
      items: itemsWithPosition,
      total_count: count || 0,
      page,
      page_size,
      total_pages: Math.ceil((count || 0) / page_size),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching assignment queue:', error);
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
