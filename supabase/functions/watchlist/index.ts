// Watchlist Edge Function
// Handles CRUD operations for user's personal watchlist
// Feature: personal-watchlist

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Types
type EntityType =
  | 'person'
  | 'engagement'
  | 'commitment'
  | 'dossier'
  | 'organization'
  | 'forum'
  | 'position'
  | 'mou'
  | 'working_group';

interface WatchlistItem {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  custom_label?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  notify_on_modification: boolean;
  notify_on_relationship_change: boolean;
  notify_on_deadline: boolean;
  notify_on_status_change: boolean;
  notify_on_comment: boolean;
  notify_on_document: boolean;
  deadline_reminder_days: number[];
  created_at: string;
  updated_at: string;
}

interface AddToWatchlistRequest {
  entity_type: EntityType;
  entity_id: string;
  custom_label?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notify_on_modification?: boolean;
  notify_on_relationship_change?: boolean;
  notify_on_deadline?: boolean;
  notify_on_status_change?: boolean;
  notify_on_comment?: boolean;
  notify_on_document?: boolean;
  deadline_reminder_days?: number[];
}

interface BulkAddRequest {
  entities: AddToWatchlistRequest[];
}

interface BulkRemoveRequest {
  watch_ids: string[];
}

interface UpdateWatchRequest {
  custom_label?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_active?: boolean;
  notify_on_modification?: boolean;
  notify_on_relationship_change?: boolean;
  notify_on_deadline?: boolean;
  notify_on_status_change?: boolean;
  notify_on_comment?: boolean;
  notify_on_document?: boolean;
  deadline_reminder_days?: number[];
}

interface EntityDetails {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  deadline?: string;
  [key: string]: unknown;
}

// Entity table mappings
const entityTableMap: Record<EntityType, string> = {
  person: 'persons',
  engagement: 'engagements',
  commitment: 'commitments',
  dossier: 'dossiers',
  organization: 'organizations',
  forum: 'forums',
  position: 'positions',
  mou: 'mous',
  working_group: 'working_groups',
};

// Entity name field mappings
const entityNameFieldMap: Record<EntityType, string> = {
  person: 'full_name',
  engagement: 'title',
  commitment: 'description',
  dossier: 'title',
  organization: 'name_en',
  forum: 'name_en',
  position: 'title',
  mou: 'title',
  working_group: 'name_en',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from JWT
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const path = pathParts[pathParts.length - 1];

    // Route based on path and method
    switch (req.method) {
      case 'GET':
        if (path === 'watchlist' || path === 'list') {
          return await getWatchlist(supabaseClient, user.id, url.searchParams);
        } else if (path === 'summary') {
          return await getWatchlistSummary(supabaseClient, user.id);
        } else if (path === 'templates') {
          return await getTemplates(supabaseClient, user.id);
        } else if (path === 'check') {
          const entityType = url.searchParams.get('entity_type') as EntityType;
          const entityId = url.searchParams.get('entity_id');
          if (entityType && entityId) {
            return await checkIfWatched(supabaseClient, user.id, entityType, entityId);
          }
        } else if (path === 'events') {
          const watchId = url.searchParams.get('watch_id');
          if (watchId) {
            return await getWatchEvents(supabaseClient, user.id, watchId, url.searchParams);
          }
        }
        // Default: return full watchlist
        return await getWatchlist(supabaseClient, user.id, url.searchParams);

      case 'POST':
        const body = await req.json();
        if (path === 'add' || path === 'watchlist') {
          return await addToWatchlist(supabaseClient, user.id, body as AddToWatchlistRequest);
        } else if (path === 'bulk-add') {
          return await bulkAddToWatchlist(supabaseClient, user.id, body as BulkAddRequest);
        } else if (path === 'bulk-remove') {
          return await bulkRemoveFromWatchlist(supabaseClient, user.id, body as BulkRemoveRequest);
        } else if (path === 'apply-template') {
          return await applyTemplate(supabaseClient, user.id, body.template_id, body.auto_sync);
        } else if (path === 'toggle-active') {
          return await toggleWatchActive(supabaseClient, user.id, body.watch_id);
        }
        break;

      case 'PATCH':
        const patchBody = await req.json();
        const watchId = url.searchParams.get('id') || patchBody.id;
        if (watchId) {
          return await updateWatch(
            supabaseClient,
            user.id,
            watchId,
            patchBody as UpdateWatchRequest
          );
        }
        break;

      case 'DELETE':
        const deleteParams = url.searchParams;
        const entityType = deleteParams.get('entity_type') as EntityType;
        const entityId = deleteParams.get('entity_id');
        const watchIdToDelete = deleteParams.get('id');

        if (watchIdToDelete) {
          return await removeFromWatchlistById(supabaseClient, user.id, watchIdToDelete);
        } else if (entityType && entityId) {
          return await removeFromWatchlist(supabaseClient, user.id, entityType, entityId);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Get user's watchlist with optional filtering and pagination
async function getWatchlist(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const entityType = params.get('entity_type') as EntityType | null;
  const priority = params.get('priority');
  const activeOnly = params.get('active_only') !== 'false';
  const cursor = params.get('cursor');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 100);
  const includeDetails = params.get('include_details') !== 'false';

  // Build query
  let query = supabase
    .from('user_watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: watchlist, error } = await query;

  if (error) {
    console.error('Error fetching watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Optionally enrich with entity details
  let enrichedWatchlist = watchlist;
  if (includeDetails && watchlist && watchlist.length > 0) {
    enrichedWatchlist = await enrichWatchlistWithDetails(supabase, watchlist);
  }

  // Get next cursor
  const nextCursor =
    watchlist && watchlist.length === limit ? watchlist[watchlist.length - 1].created_at : null;

  return new Response(
    JSON.stringify({
      watchlist: enrichedWatchlist,
      nextCursor,
      hasMore: watchlist?.length === limit,
      total: watchlist?.length || 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Enrich watchlist items with entity details
async function enrichWatchlistWithDetails(
  supabase: ReturnType<typeof createClient>,
  watchlist: WatchlistItem[]
): Promise<(WatchlistItem & { entity_details?: EntityDetails })[]> {
  // Group by entity type for efficient fetching
  const groupedByType: Record<string, string[]> = {};
  for (const item of watchlist) {
    if (!groupedByType[item.entity_type]) {
      groupedByType[item.entity_type] = [];
    }
    groupedByType[item.entity_type].push(item.entity_id);
  }

  // Fetch details for each entity type
  const detailsMap: Record<string, EntityDetails> = {};

  for (const [entityType, entityIds] of Object.entries(groupedByType)) {
    const tableName = entityTableMap[entityType as EntityType];
    const nameField = entityNameFieldMap[entityType as EntityType];

    if (tableName) {
      const { data: entities } = await supabase
        .from(tableName)
        .select(`id, ${nameField}, status, updated_at`)
        .in('id', entityIds);

      if (entities) {
        for (const entity of entities) {
          detailsMap[entity.id] = {
            id: entity.id,
            name: entity[nameField],
            status: entity.status,
            updated_at: entity.updated_at,
          };
        }
      }
    }
  }

  // Merge details into watchlist
  return watchlist.map((item) => ({
    ...item,
    entity_details: detailsMap[item.entity_id] || null,
  }));
}

// Get watchlist summary
async function getWatchlistSummary(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase.rpc('get_watchlist_summary');

  if (error) {
    console.error('Error fetching summary:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch summary' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Also get total counts
  const { count: totalCount } = await supabase
    .from('user_watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: activeCount } = await supabase
    .from('user_watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  return new Response(
    JSON.stringify({
      summary: data || [],
      totals: {
        total: totalCount || 0,
        active: activeCount || 0,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Add entity to watchlist
async function addToWatchlist(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: AddToWatchlistRequest
) {
  const { data, error } = await supabase.rpc('add_to_watchlist', {
    p_entity_type: request.entity_type,
    p_entity_id: request.entity_id,
    p_custom_label: request.custom_label || null,
    p_notes: request.notes || null,
    p_priority: request.priority || 'medium',
    p_notify_modification: request.notify_on_modification ?? true,
    p_notify_relationship: request.notify_on_relationship_change ?? true,
    p_notify_deadline: request.notify_on_deadline ?? true,
    p_notify_status: request.notify_on_status_change ?? true,
    p_deadline_reminder_days: request.deadline_reminder_days || [7, 3, 1],
  });

  if (error) {
    console.error('Error adding to watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to add to watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      watch_id: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Bulk add to watchlist
async function bulkAddToWatchlist(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: BulkAddRequest
) {
  const { data, error } = await supabase.rpc('bulk_add_to_watchlist', {
    p_entities: JSON.stringify(request.entities),
  });

  if (error) {
    console.error('Error bulk adding to watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to bulk add to watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      added_count: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Remove entity from watchlist by type and id
async function removeFromWatchlist(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entityType: EntityType,
  entityId: string
) {
  const { data, error } = await supabase.rpc('remove_from_watchlist', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    console.error('Error removing from watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove from watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      removed: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Remove from watchlist by watch ID
async function removeFromWatchlistById(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  watchId: string
) {
  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('id', watchId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing from watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove from watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Bulk remove from watchlist
async function bulkRemoveFromWatchlist(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  request: BulkRemoveRequest
) {
  const { data, error } = await supabase.rpc('bulk_remove_from_watchlist', {
    p_watch_ids: request.watch_ids,
  });

  if (error) {
    console.error('Error bulk removing from watchlist:', error);
    return new Response(JSON.stringify({ error: 'Failed to bulk remove from watchlist' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      removed_count: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update watch settings
async function updateWatch(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  watchId: string,
  request: UpdateWatchRequest
) {
  const updates: Record<string, unknown> = {};

  if (request.custom_label !== undefined) updates.custom_label = request.custom_label;
  if (request.notes !== undefined) updates.notes = request.notes;
  if (request.priority !== undefined) updates.priority = request.priority;
  if (request.is_active !== undefined) updates.is_active = request.is_active;
  if (request.notify_on_modification !== undefined)
    updates.notify_on_modification = request.notify_on_modification;
  if (request.notify_on_relationship_change !== undefined)
    updates.notify_on_relationship_change = request.notify_on_relationship_change;
  if (request.notify_on_deadline !== undefined)
    updates.notify_on_deadline = request.notify_on_deadline;
  if (request.notify_on_status_change !== undefined)
    updates.notify_on_status_change = request.notify_on_status_change;
  if (request.notify_on_comment !== undefined)
    updates.notify_on_comment = request.notify_on_comment;
  if (request.notify_on_document !== undefined)
    updates.notify_on_document = request.notify_on_document;
  if (request.deadline_reminder_days !== undefined)
    updates.deadline_reminder_days = request.deadline_reminder_days;

  const { data, error } = await supabase
    .from('user_watchlist')
    .update(updates)
    .eq('id', watchId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating watch:', error);
    return new Response(JSON.stringify({ error: 'Failed to update watch' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      watch: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Toggle watch active status
async function toggleWatchActive(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  watchId: string
) {
  const { data, error } = await supabase.rpc('toggle_watch_active', {
    p_watch_id: watchId,
  });

  if (error) {
    console.error('Error toggling watch:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle watch' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      is_active: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check if entity is watched
async function checkIfWatched(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entityType: EntityType,
  entityId: string
) {
  const { data, error } = await supabase.rpc('is_entity_watched', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    console.error('Error checking watch status:', error);
    return new Response(JSON.stringify({ error: 'Failed to check watch status' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Also get watch details if watched
  let watchDetails = null;
  if (data) {
    const { data: watch } = await supabase
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();
    watchDetails = watch;
  }

  return new Response(
    JSON.stringify({
      is_watched: data,
      watch: watchDetails,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get watchlist templates
async function getTemplates(supabase: ReturnType<typeof createClient>, userId: string) {
  // Get user's role
  const { data: userData } = await supabase.from('users').select('role').eq('id', userId).single();

  const userRole = userData?.role || 'user';

  // Get templates applicable to user's role
  const { data: templates, error } = await supabase
    .from('watchlist_templates')
    .select('*')
    .or(`applicable_roles.cs.{${userRole}},created_by.eq.${userId}`)
    .order('is_system_template', { ascending: false })
    .order('name_en');

  if (error) {
    console.error('Error fetching templates:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch templates' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get user's applied templates
  const { data: appliedTemplates } = await supabase
    .from('user_watchlist_templates')
    .select('template_id, auto_sync, applied_at')
    .eq('user_id', userId);

  const appliedTemplateIds = new Set(appliedTemplates?.map((t) => t.template_id) || []);

  // Mark which templates are applied
  const templatesWithStatus = templates?.map((t) => ({
    ...t,
    is_applied: appliedTemplateIds.has(t.id),
    applied_info: appliedTemplates?.find((at) => at.template_id === t.id) || null,
  }));

  return new Response(
    JSON.stringify({
      templates: templatesWithStatus || [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Apply template to user's watchlist
async function applyTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  templateId: string,
  autoSync: boolean = true
) {
  const { data, error } = await supabase.rpc('apply_watchlist_template', {
    p_template_id: templateId,
    p_auto_sync: autoSync,
  });

  if (error) {
    console.error('Error applying template:', error);
    return new Response(JSON.stringify({ error: 'Failed to apply template' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      added_count: data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get watch events
async function getWatchEvents(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  watchId: string,
  params: URLSearchParams
) {
  const limit = Math.min(parseInt(params.get('limit') || '20'), 50);
  const cursor = params.get('cursor');

  // Verify watch belongs to user
  const { data: watch } = await supabase
    .from('user_watchlist')
    .select('id')
    .eq('id', watchId)
    .eq('user_id', userId)
    .single();

  if (!watch) {
    return new Response(JSON.stringify({ error: 'Watch not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let query = supabase
    .from('watchlist_events')
    .select('*')
    .eq('watch_id', watchId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const nextCursor =
    events && events.length === limit ? events[events.length - 1].created_at : null;

  return new Response(
    JSON.stringify({
      events,
      nextCursor,
      hasMore: events?.length === limit,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
