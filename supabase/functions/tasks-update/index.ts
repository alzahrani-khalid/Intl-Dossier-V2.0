/**
 * Tasks Update Edge Function
 * Part of: 025-unified-tasks-model implementation
 *
 * Update a task with optimistic locking:
 * - Checks updated_at timestamp against last_known_updated_at
 * - Returns 409 Conflict if timestamps don't match
 * - Includes current state in conflict response for auto-retry
 * - Auto-sets updated_by and updated_at
 * - Supports partial updates
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignee_id?: string;
  engagement_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  sla_deadline?: string;
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic';
  work_item_id?: string;
  source?: Record<string, any>;
  completed_by?: string;
  completed_at?: string;
  last_known_updated_at?: string; // For optimistic locking
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

    // Get task ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: UpdateTaskRequest = await req.json();

    // Validate title length if provided
    if (body.title && body.title.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Title cannot exceed 500 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch current task for optimistic locking check
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !currentTask) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Optimistic locking check (if last_known_updated_at provided)
    if (body.last_known_updated_at) {
      const clientTimestamp = new Date(body.last_known_updated_at).getTime();
      const serverTimestamp = new Date(currentTask.updated_at).getTime();
      const CLOCK_SKEW_MS = 100;

      if (Math.abs(serverTimestamp - clientTimestamp) > CLOCK_SKEW_MS) {
        // Timestamps don't match - return 409 Conflict with current state
        return new Response(
          JSON.stringify({
            error: 'optimistic_lock_conflict',
            message: 'Task was modified by another user. Please refresh and try again.',
            current_state: currentTask,
            client_timestamp: body.last_known_updated_at,
            server_timestamp: currentTask.updated_at,
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_by: user.id,
      last_modified_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Apply partial updates
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.assignee_id !== undefined) updateData.assignee_id = body.assignee_id;
    if (body.engagement_id !== undefined) updateData.engagement_id = body.engagement_id || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.workflow_stage !== undefined) updateData.workflow_stage = body.workflow_stage;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.sla_deadline !== undefined) updateData.sla_deadline = body.sla_deadline || null;
    if (body.work_item_type !== undefined) updateData.work_item_type = body.work_item_type || null;
    if (body.work_item_id !== undefined) updateData.work_item_id = body.work_item_id || null;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.completed_by !== undefined) updateData.completed_by = body.completed_by || null;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at || null;

    // Auto-set completed_at if status changes to completed
    if (body.status === 'completed' && !body.completed_at) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return updated task
    return new Response(
      JSON.stringify({ task: updatedTask }),
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
