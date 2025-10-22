/**
 * Contributors Remove Edge Function
 * Part of: 025-unified-tasks-model implementation
 *
 * Remove a contributor from a task (soft delete):
 * - Sets removed_at timestamp and removed_by user ID
 * - Does NOT permanently delete (preserves audit trail)
 * - Checks if user is task owner (assignee or creator) via RLS
 * - Returns success even if contributor already removed (idempotent)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RemoveContributorRequest {
  task_id: string;
  user_id: string;
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

    // Parse request body
    const body: RemoveContributorRequest = await req.json();

    // Validate required fields
    if (!body.task_id) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!body.user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if task exists and user has permission (via RLS)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, assignee_id, created_by')
      .eq('id', body.task_id)
      .eq('is_deleted', false)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({
          error: 'Task not found or you do not have permission to remove contributors',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is task owner (assignee or creator)
    if (task.assignee_id !== user.id && task.created_by !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'Only task owners (assignee or creator) can remove contributors',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if contributor exists
    const { data: contributor, error: contributorError } = await supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', body.task_id)
      .eq('user_id', body.user_id)
      .maybeSingle();

    if (contributorError && contributorError.code !== 'PGRST116') {
      console.error('Error fetching contributor:', contributorError);
      return new Response(
        JSON.stringify({ error: contributorError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If contributor doesn't exist, return success (idempotent)
    if (!contributor) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contributor does not exist or was already removed',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If contributor is already removed, return success (idempotent)
    if (contributor.removed_at) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contributor was already removed',
          removed_at: contributor.removed_at,
          removed_by: contributor.removed_by,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete contributor (set removed_at and removed_by)
    const { data: removed, error: removeError } = await supabase
      .from('task_contributors')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('id', contributor.id)
      .select()
      .single();

    if (removeError) {
      console.error('Error removing contributor:', removeError);
      return new Response(
        JSON.stringify({ error: removeError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success with removed contributor details
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contributor removed successfully',
        contributor: removed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
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
