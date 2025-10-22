/**
 * Contributors Add Edge Function
 * Part of: 025-unified-tasks-model implementation
 *
 * Add a contributor to a task:
 * - Handles UNIQUE constraint violations (contributor already exists)
 * - Restores soft-deleted contributors (set removed_at = NULL)
 * - Checks if user is task owner (assignee or creator) via RLS
 * - Auto-sets added_by and added_at
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface AddContributorRequest {
  task_id: string;
  user_id: string;
  role?: string;
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
    const body: AddContributorRequest = await req.json();

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
          error: 'Task not found or you do not have permission to add contributors',
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
          error: 'Only task owners (assignee or creator) can add contributors',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if contributor already exists (including soft-deleted)
    const { data: existing, error: existingError } = await supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', body.task_id)
      .eq('user_id', body.user_id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing contributor:', existingError);
      return new Response(
        JSON.stringify({ error: existingError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If contributor was previously removed, restore them
    if (existing && existing.removed_at) {
      const { data: restored, error: restoreError } = await supabase
        .from('task_contributors')
        .update({
          removed_at: null,
          removed_by: null,
          role: body.role || existing.role,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (restoreError) {
        console.error('Error restoring contributor:', restoreError);
        return new Response(
          JSON.stringify({ error: restoreError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          contributor: restored,
          message: 'Contributor restored successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If contributor is already active, return existing record
    if (existing && !existing.removed_at) {
      return new Response(
        JSON.stringify({
          contributor: existing,
          message: 'Contributor already exists',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Add new contributor
    const contributorData = {
      task_id: body.task_id,
      user_id: body.user_id,
      added_by: user.id,
      role: body.role || 'contributor',
    };

    const { data: contributor, error: insertError } = await supabase
      .from('task_contributors')
      .insert(contributorData)
      .select()
      .single();

    if (insertError) {
      console.error('Error adding contributor:', insertError);

      // Handle UNIQUE constraint violation (should be caught above, but just in case)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'Contributor already exists for this task',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return created contributor
    return new Response(
      JSON.stringify({
        contributor,
        message: 'Contributor added successfully',
      }),
      {
        status: 201,
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
