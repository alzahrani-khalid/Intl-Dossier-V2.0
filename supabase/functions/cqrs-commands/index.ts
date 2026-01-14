/**
 * CQRS Commands Edge Function
 *
 * Handles write operations (commands) in the CQRS pattern.
 * All mutations go through this function which:
 * 1. Validates the command
 * 2. Executes the write operation
 * 3. Emits domain events
 * 4. Returns the result
 *
 * The read models are updated asynchronously via triggers.
 *
 * Endpoints:
 * - POST /dossier/create - Create a new dossier
 * - POST /dossier/update - Update an existing dossier
 * - POST /dossier/archive - Archive a dossier
 * - POST /relationship/create - Create a relationship
 * - POST /relationship/delete - Delete a relationship
 * - POST /calendar/create - Create calendar entry
 * - POST /calendar/update - Update calendar entry
 * - POST /calendar/delete - Delete calendar entry
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Command types
interface BaseCommand {
  idempotency_key?: string;
  correlation_id?: string;
}

interface CreateDossierCommand extends BaseCommand {
  type: string;
  name_en: string;
  name_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  status?: string;
  visibility?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateDossierCommand extends BaseCommand {
  id: string;
  changes: Record<string, unknown>;
}

interface ArchiveDossierCommand extends BaseCommand {
  id: string;
  reason?: string;
}

interface CreateRelationshipCommand extends BaseCommand {
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: string;
  relationship_subtype?: string;
  strength?: number;
  is_bidirectional?: boolean;
  metadata?: Record<string, unknown>;
}

interface DeleteRelationshipCommand extends BaseCommand {
  id: string;
}

interface CreateCalendarCommand extends BaseCommand {
  dossier_id: string;
  entry_type: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  event_date: string;
  event_time?: string;
  duration_minutes?: number;
  all_day?: boolean;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  status?: string;
}

interface UpdateCalendarCommand extends BaseCommand {
  id: string;
  changes: Record<string, unknown>;
}

interface DeleteCalendarCommand extends BaseCommand {
  id: string;
}

// Command result
interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  event_id?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST for commands.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse URL path to determine command type
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionName = pathParts[0]; // 'cqrs-commands'
    const entity = pathParts[1]; // 'dossier', 'relationship', 'calendar'
    const action = pathParts[2]; // 'create', 'update', 'delete', 'archive'

    // Create Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse command body
    const command = await req.json();

    // Route to appropriate handler
    let result: CommandResult;

    switch (`${entity}/${action}`) {
      case 'dossier/create':
        result = await handleCreateDossier(supabaseClient, user.id, command);
        break;
      case 'dossier/update':
        result = await handleUpdateDossier(supabaseClient, user.id, command);
        break;
      case 'dossier/archive':
        result = await handleArchiveDossier(supabaseClient, user.id, command);
        break;
      case 'relationship/create':
        result = await handleCreateRelationship(supabaseClient, user.id, command);
        break;
      case 'relationship/delete':
        result = await handleDeleteRelationship(supabaseClient, user.id, command);
        break;
      case 'calendar/create':
        result = await handleCreateCalendar(supabaseClient, user.id, command);
        break;
      case 'calendar/update':
        result = await handleUpdateCalendar(supabaseClient, user.id, command);
        break;
      case 'calendar/delete':
        result = await handleDeleteCalendar(supabaseClient, user.id, command);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown command',
            available_commands: [
              'dossier/create',
              'dossier/update',
              'dossier/archive',
              'relationship/create',
              'relationship/delete',
              'calendar/create',
              'calendar/update',
              'calendar/delete',
            ],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Command error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// DOSSIER COMMANDS
// ============================================================================

async function handleCreateDossier(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: CreateDossierCommand
): Promise<CommandResult> {
  // Validate required fields
  if (!command.type || !command.name_en) {
    return { success: false, error: 'type and name_en are required' };
  }

  // Insert dossier
  const { data: dossier, error: insertError } = await supabase
    .from('dossiers')
    .insert({
      type: command.type,
      name_en: command.name_en,
      name_ar: command.name_ar,
      summary_en: command.summary_en,
      summary_ar: command.summary_ar,
      status: command.status || 'active',
      visibility: command.visibility || 'internal',
      created_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Emit domain event
  const { data: event, error: eventError } = await supabase.rpc('events.append_event', {
    p_event_type: `${capitalizeFirst(command.type)}Created`,
    p_event_category: 'lifecycle',
    p_aggregate_type: command.type.toLowerCase(),
    p_aggregate_id: dossier.id,
    p_payload: {
      name_en: dossier.name_en,
      name_ar: dossier.name_ar,
      status: dossier.status,
      type: dossier.type,
    },
    p_correlation_id: command.correlation_id || null,
    p_idempotency_key: command.idempotency_key || null,
  });

  return {
    success: true,
    data: dossier,
    event_id: event?.id,
  };
}

async function handleUpdateDossier(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: UpdateDossierCommand
): Promise<CommandResult> {
  if (!command.id || !command.changes) {
    return { success: false, error: 'id and changes are required' };
  }

  // Get current state for diff
  const { data: current, error: fetchError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', command.id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: 'Dossier not found' };
  }

  // Build changes diff
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(command.changes)) {
    if (current[key] !== value) {
      changes[key] = { old: current[key], new: value };
    }
  }

  if (Object.keys(changes).length === 0) {
    return { success: true, data: current }; // No changes
  }

  // Update dossier
  const { data: updated, error: updateError } = await supabase
    .from('dossiers')
    .update({
      ...command.changes,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', command.id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Emit domain event
  const { data: event } = await supabase.rpc('events.append_event', {
    p_event_type: `${capitalizeFirst(current.type)}Updated`,
    p_event_category: 'update',
    p_aggregate_type: current.type.toLowerCase(),
    p_aggregate_id: command.id,
    p_payload: command.changes,
    p_changes: changes,
    p_correlation_id: command.correlation_id || null,
    p_idempotency_key: command.idempotency_key || null,
  });

  return {
    success: true,
    data: updated,
    event_id: event?.id,
  };
}

async function handleArchiveDossier(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: ArchiveDossierCommand
): Promise<CommandResult> {
  if (!command.id) {
    return { success: false, error: 'id is required' };
  }

  // Get current state
  const { data: current, error: fetchError } = await supabase
    .from('dossiers')
    .select('type, status')
    .eq('id', command.id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: 'Dossier not found' };
  }

  // Archive dossier
  const { data: updated, error: updateError } = await supabase
    .from('dossiers')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: userId,
      archive_reason: command.reason,
    })
    .eq('id', command.id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Emit domain event
  const { data: event } = await supabase.rpc('events.append_event', {
    p_event_type: `${capitalizeFirst(current.type)}Archived`,
    p_event_category: 'lifecycle',
    p_aggregate_type: current.type.toLowerCase(),
    p_aggregate_id: command.id,
    p_payload: { reason: command.reason, previous_status: current.status },
    p_correlation_id: command.correlation_id || null,
    p_idempotency_key: command.idempotency_key || null,
  });

  return {
    success: true,
    data: updated,
    event_id: event?.id,
  };
}

// ============================================================================
// RELATIONSHIP COMMANDS
// ============================================================================

async function handleCreateRelationship(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: CreateRelationshipCommand
): Promise<CommandResult> {
  if (!command.source_dossier_id || !command.target_dossier_id || !command.relationship_type) {
    return {
      success: false,
      error: 'source_dossier_id, target_dossier_id, and relationship_type are required',
    };
  }

  // Insert relationship
  const { data: relationship, error: insertError } = await supabase
    .from('dossier_relationships')
    .insert({
      source_dossier_id: command.source_dossier_id,
      target_dossier_id: command.target_dossier_id,
      relationship_type: command.relationship_type,
      relationship_subtype: command.relationship_subtype,
      strength: command.strength || 50,
      is_bidirectional: command.is_bidirectional || false,
      metadata: command.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Emit domain event
  const { data: event } = await supabase.rpc('events.append_event', {
    p_event_type: 'RelationshipCreated',
    p_event_category: 'relationship',
    p_aggregate_type: 'relationship',
    p_aggregate_id: relationship.id,
    p_payload: {
      source_id: command.source_dossier_id,
      target_id: command.target_dossier_id,
      relationship_type: command.relationship_type,
      relationship_subtype: command.relationship_subtype,
      strength: relationship.strength,
      is_bidirectional: relationship.is_bidirectional,
    },
    p_correlation_id: command.correlation_id || null,
    p_idempotency_key: command.idempotency_key || null,
  });

  return {
    success: true,
    data: relationship,
    event_id: event?.id,
  };
}

async function handleDeleteRelationship(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: DeleteRelationshipCommand
): Promise<CommandResult> {
  if (!command.id) {
    return { success: false, error: 'id is required' };
  }

  // Get current state for event
  const { data: current, error: fetchError } = await supabase
    .from('dossier_relationships')
    .select('*')
    .eq('id', command.id)
    .single();

  if (fetchError || !current) {
    return { success: false, error: 'Relationship not found' };
  }

  // Delete relationship
  const { error: deleteError } = await supabase
    .from('dossier_relationships')
    .delete()
    .eq('id', command.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Emit domain event
  const { data: event } = await supabase.rpc('events.append_event', {
    p_event_type: 'RelationshipDeleted',
    p_event_category: 'relationship',
    p_aggregate_type: 'relationship',
    p_aggregate_id: command.id,
    p_payload: {
      source_id: current.source_dossier_id,
      target_id: current.target_dossier_id,
      relationship_type: current.relationship_type,
      deleted_by: userId,
    },
    p_correlation_id: command.correlation_id || null,
    p_idempotency_key: command.idempotency_key || null,
  });

  return {
    success: true,
    data: { deleted: true, id: command.id },
    event_id: event?.id,
  };
}

// ============================================================================
// CALENDAR COMMANDS
// ============================================================================

async function handleCreateCalendar(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: CreateCalendarCommand
): Promise<CommandResult> {
  if (!command.dossier_id || !command.entry_type || !command.title_en || !command.event_date) {
    return {
      success: false,
      error: 'dossier_id, entry_type, title_en, and event_date are required',
    };
  }

  // Insert calendar entry
  const { data: entry, error: insertError } = await supabase
    .from('calendar_entries')
    .insert({
      dossier_id: command.dossier_id,
      entry_type: command.entry_type,
      title_en: command.title_en,
      title_ar: command.title_ar,
      description_en: command.description_en,
      description_ar: command.description_ar,
      event_date: command.event_date,
      event_time: command.event_time,
      duration_minutes: command.duration_minutes,
      all_day: command.all_day ?? false,
      location: command.location,
      is_virtual: command.is_virtual ?? false,
      meeting_link: command.meeting_link,
      status: command.status || 'scheduled',
      created_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Note: Timeline sync happens automatically via trigger
  // No need to emit event manually - trigger handles it

  return {
    success: true,
    data: entry,
  };
}

async function handleUpdateCalendar(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: UpdateCalendarCommand
): Promise<CommandResult> {
  if (!command.id || !command.changes) {
    return { success: false, error: 'id and changes are required' };
  }

  // Update calendar entry
  const { data: updated, error: updateError } = await supabase
    .from('calendar_entries')
    .update({
      ...command.changes,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', command.id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Note: Timeline sync happens automatically via trigger

  return {
    success: true,
    data: updated,
  };
}

async function handleDeleteCalendar(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  command: DeleteCalendarCommand
): Promise<CommandResult> {
  if (!command.id) {
    return { success: false, error: 'id is required' };
  }

  // Delete calendar entry
  const { error: deleteError } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('id', command.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Note: Timeline sync happens automatically via trigger

  return {
    success: true,
    data: { deleted: true, id: command.id },
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
