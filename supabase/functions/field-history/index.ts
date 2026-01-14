/**
 * Field History API
 *
 * Provides endpoints for:
 * - GET /field-history - List field history for an entity
 * - GET /field-history/grouped - Get field history grouped by field
 * - POST /field-history/rollback - Rollback a specific field change
 *
 * Features:
 * - Granular field-level change tracking
 * - Before/after comparisons
 * - Selective field rollback
 * - Pagination and filtering
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// =============================================
// TYPES
// =============================================

interface FieldHistoryQuery {
  entity_type: string;
  entity_id: string;
  field_name?: string;
  limit?: number;
  offset?: number;
}

interface RollbackRequest {
  field_history_id: string;
}

interface FieldHistoryEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  field_label_en: string | null;
  field_label_ar: string | null;
  field_category: string;
  old_value: unknown;
  new_value: unknown;
  change_type: string;
  changed_by: string;
  changed_by_email: string | null;
  changed_by_role: string | null;
  created_at: string;
  is_rollback: boolean;
  rollback_of_id: string | null;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
}

interface FieldHistoryGrouped {
  field_name: string;
  field_label_en: string | null;
  field_label_ar: string | null;
  field_category: string;
  current_value: unknown;
  change_count: number;
  first_change_at: string;
  last_change_at: string;
  last_changed_by_email: string | null;
}

// =============================================
// VALIDATION
// =============================================

const VALID_ENTITY_TYPES = [
  'person',
  'engagement',
  'commitment',
  'organization',
  'country',
  'forum',
  'mou',
  'position',
  'dossier',
  'task',
  'intake_ticket',
  'working_group',
  'theme',
];

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function validateQuery(params: FieldHistoryQuery): string | null {
  if (!params.entity_type) {
    return 'entity_type is required';
  }
  if (!VALID_ENTITY_TYPES.includes(params.entity_type)) {
    return `Invalid entity_type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`;
  }
  if (!params.entity_id) {
    return 'entity_id is required';
  }
  if (!isValidUUID(params.entity_id)) {
    return 'entity_id must be a valid UUID';
  }
  return null;
}

// =============================================
// REQUEST HANDLERS
// =============================================

async function handleGetFieldHistory(
  supabaseClient: ReturnType<typeof createClient>,
  params: FieldHistoryQuery
): Promise<Response> {
  // Validate parameters
  const validationError = validateQuery(params);
  if (validationError) {
    return new Response(JSON.stringify({ error: 'Bad Request', message: validationError }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  try {
    // Call the database function
    const { data, error } = await supabaseClient.rpc('get_field_history', {
      p_entity_type: params.entity_type,
      p_entity_id: params.entity_id,
      p_field_name: params.field_name || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error fetching field history:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseClient
      .from('field_history')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', params.entity_type)
      .eq('entity_id', params.entity_id);

    const totalCount = count || 0;

    // Enrich and format the response
    const entries: FieldHistoryEntry[] = (data || []).map((entry: FieldHistoryEntry) => ({
      id: entry.id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      field_name: entry.field_name,
      field_label: {
        en: entry.field_label_en,
        ar: entry.field_label_ar,
      },
      field_category: entry.field_category,
      old_value: entry.old_value,
      new_value: entry.new_value,
      change_type: entry.change_type,
      changed_by: {
        id: entry.changed_by,
        email: entry.changed_by_email,
        role: entry.changed_by_role,
      },
      created_at: entry.created_at,
      is_rollback: entry.is_rollback,
      rollback_of_id: entry.rollback_of_id,
      rolled_back_at: entry.rolled_back_at,
      rolled_back_by: entry.rolled_back_by,
      can_rollback: !entry.is_rollback && !entry.rolled_back_at && entry.change_type !== 'create',
    }));

    return new Response(
      JSON.stringify({
        data: entries,
        metadata: {
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          total: totalCount,
          limit,
          offset,
          has_more: offset + limit < totalCount,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Total-Count': totalCount.toString(),
        },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetFieldHistoryGrouped(
  supabaseClient: ReturnType<typeof createClient>,
  params: FieldHistoryQuery
): Promise<Response> {
  // Validate parameters
  const validationError = validateQuery(params);
  if (validationError) {
    return new Response(JSON.stringify({ error: 'Bad Request', message: validationError }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Call the database function
    const { data, error } = await supabaseClient.rpc('get_field_history_grouped', {
      p_entity_type: params.entity_type,
      p_entity_id: params.entity_id,
    });

    if (error) {
      console.error('Error fetching grouped field history:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response
    const fields: FieldHistoryGrouped[] = (data || []).map((field: FieldHistoryGrouped) => ({
      field_name: field.field_name,
      field_label: {
        en: field.field_label_en,
        ar: field.field_label_ar,
      },
      field_category: field.field_category,
      current_value: field.current_value,
      statistics: {
        change_count: field.change_count,
        first_change_at: field.first_change_at,
        last_change_at: field.last_change_at,
        last_changed_by_email: field.last_changed_by_email,
      },
    }));

    return new Response(
      JSON.stringify({
        data: fields,
        metadata: {
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          total_fields: fields.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleRollback(
  supabaseClient: ReturnType<typeof createClient>,
  body: RollbackRequest
): Promise<Response> {
  // Validate request
  if (!body.field_history_id) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'field_history_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!isValidUUID(body.field_history_id)) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'field_history_id must be a valid UUID' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Call the rollback function
    const { data, error } = await supabaseClient.rpc('rollback_field_change', {
      p_field_history_id: body.field_history_id,
    });

    if (error) {
      console.error('Error rolling back field:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if rollback was successful
    if (!data?.success) {
      return new Response(
        JSON.stringify({ error: 'Rollback Failed', message: data?.error || 'Unknown error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: data.message,
        data: {
          rollback_history_id: data.rollback_history_id,
          rolled_back_field: data.rolled_back_field,
          restored_value: data.restored_value,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error during rollback:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// =============================================
// MAIN HANDLER
// =============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Verify user
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid user session' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse URL and route request
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const action = pathSegments[pathSegments.length - 1];

  // Route based on method and action
  if (req.method === 'GET') {
    const params: FieldHistoryQuery = {
      entity_type: url.searchParams.get('entity_type') || '',
      entity_id: url.searchParams.get('entity_id') || '',
      field_name: url.searchParams.get('field_name') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    if (action === 'grouped') {
      return handleGetFieldHistoryGrouped(supabaseClient, params);
    }

    return handleGetFieldHistory(supabaseClient, params);
  }

  if (req.method === 'POST' && action === 'rollback') {
    let body: RollbackRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return handleRollback(supabaseClient, body);
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method Not Allowed', message: `${req.method} is not supported` }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
