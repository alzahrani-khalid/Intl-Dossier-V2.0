/**
 * Tasks Create Edge Function
 * Part of: 025-unified-tasks-model implementation
 *
 * Create a new task with validation:
 * - Required fields: title, assignee_id
 * - Optional: engagement_id, work_item linking, SLA deadline, priority
 * - Auto-set: created_by, tenant_id, timestamps
 * - Returns created task with all fields
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateTaskRequest {
  title: string;
  description?: string;
  assignee_id: string;
  engagement_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  sla_deadline?: string;
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic';
  work_item_id?: string;
  source?: Record<string, any>;
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
    const body: CreateTaskRequest = await req.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Title is required and cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!body.assignee_id) {
      return new Response(
        JSON.stringify({ error: 'Assignee ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate title length
    if (body.title.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Title cannot exceed 500 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate work item linking (must have both type and id, or neither)
    if ((body.work_item_type && !body.work_item_id) || (!body.work_item_type && body.work_item_id)) {
      return new Response(
        JSON.stringify({
          error: 'Both work_item_type and work_item_id must be provided together',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate source JSONB structure for multiple work items
    if (body.source && typeof body.source === 'object') {
      const { dossier_ids, position_ids, ticket_ids } = body.source;

      // Validate array types
      if (dossier_ids && !Array.isArray(dossier_ids)) {
        return new Response(
          JSON.stringify({ error: 'source.dossier_ids must be an array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (position_ids && !Array.isArray(position_ids)) {
        return new Response(
          JSON.stringify({ error: 'source.position_ids must be an array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (ticket_ids && !Array.isArray(ticket_ids)) {
        return new Response(
          JSON.stringify({ error: 'source.ticket_ids must be an array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Prevent conflicting work_item_id when source is used for multiple items
      const hasMultipleWorkItems = (
        (dossier_ids && dossier_ids.length > 0) ||
        (position_ids && position_ids.length > 0) ||
        (ticket_ids && ticket_ids.length > 0)
      );

      if (hasMultipleWorkItems && body.work_item_id) {
        return new Response(
          JSON.stringify({
            error: 'Cannot specify both work_item_id and source with multiple work items. Use source field for multiple items or work_item_id for single item.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get user's tenant_id from profile or metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, organization_id')
      .eq('id', user.id)
      .single();

    const tenantId = profile?.tenant_id || profile?.organization_id || user.id;

    // Prepare task data
    const taskData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      assignee_id: body.assignee_id,
      engagement_id: body.engagement_id || null,
      priority: body.priority || 'medium',
      workflow_stage: body.workflow_stage || 'todo',
      status: 'pending',
      sla_deadline: body.sla_deadline || null,
      work_item_type: body.work_item_type || null,
      work_item_id: body.work_item_id || null,
      source: body.source || {},
      assignment: {}, // Legacy field for backward compatibility
      timeline: { created_at: new Date().toISOString() },
      created_by: user.id,
      last_modified_by: user.id,
      updated_by: user.id,
      tenant_id: tenantId,
      type: 'regular', // Default task type
      version: 1,
    };

    // Insert task
    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating task:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return created task
    return new Response(
      JSON.stringify({ task }),
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
