/**
 * View Preferences Edge Function
 *
 * Handles CRUD operations for user view preferences and saved views.
 *
 * Endpoints:
 * - GET /?entity_type=<type> - Get preferences and saved views for entity type
 * - POST /preferences - Upsert default preferences
 * - POST /saved-views - Create a saved view
 * - PUT /saved-views/:id - Update a saved view
 * - DELETE /saved-views/:id - Delete a saved view
 * - POST /saved-views/:id/set-default - Set view as default
 * - POST /saved-views/:id/toggle-pin - Toggle pinned status
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
type EntityViewType =
  | 'dossiers'
  | 'engagements'
  | 'my_work'
  | 'persons'
  | 'forums'
  | 'working_groups'
  | 'calendar'
  | 'analytics';

interface ViewConfig {
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  columns?: Array<{
    id: string;
    visible: boolean;
    width?: number;
    order?: number;
  }>;
  pagination?: {
    pageSize: number;
    defaultPage?: number;
  };
  density?: 'compact' | 'normal' | 'comfortable';
  layout?: 'grid' | 'list' | 'table' | 'kanban' | 'calendar';
  searchQuery?: string;
  customSettings?: Record<string, unknown>;
}

// Valid entity types
const VALID_ENTITY_TYPES: EntityViewType[] = [
  'dossiers',
  'engagements',
  'my_work',
  'persons',
  'forums',
  'working_groups',
  'calendar',
  'analytics',
];

function isValidEntityType(type: string): type is EntityViewType {
  return VALID_ENTITY_TYPES.includes(type as EntityViewType);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/view-preferences', '');

    // Route handling
    if (req.method === 'GET' && (path === '' || path === '/')) {
      // GET /?entity_type=<type> - Get preferences and saved views
      return await handleGetPreferences(supabase, user.id, url);
    }

    if (req.method === 'POST' && path === '/preferences') {
      // POST /preferences - Upsert default preferences
      return await handleUpsertPreferences(supabase, user.id, req);
    }

    if (req.method === 'POST' && path === '/saved-views') {
      // POST /saved-views - Create saved view
      return await handleCreateSavedView(supabase, user.id, req);
    }

    if (req.method === 'PUT' && path.startsWith('/saved-views/')) {
      // PUT /saved-views/:id - Update saved view
      const id = path.replace('/saved-views/', '');
      return await handleUpdateSavedView(supabase, user.id, id, req);
    }

    if (req.method === 'DELETE' && path.startsWith('/saved-views/')) {
      // DELETE /saved-views/:id - Delete saved view
      const id = path.replace('/saved-views/', '');
      return await handleDeleteSavedView(supabase, user.id, id);
    }

    if (req.method === 'POST' && path.match(/\/saved-views\/[^/]+\/set-default$/)) {
      // POST /saved-views/:id/set-default - Set as default
      const id = path.replace('/saved-views/', '').replace('/set-default', '');
      return await handleSetDefault(supabase, user.id, id);
    }

    if (req.method === 'POST' && path.match(/\/saved-views\/[^/]+\/toggle-pin$/)) {
      // POST /saved-views/:id/toggle-pin - Toggle pinned
      const id = path.replace('/saved-views/', '').replace('/toggle-pin', '');
      return await handleTogglePin(supabase, user.id, id);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('View preferences error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler: Get preferences and saved views
async function handleGetPreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  url: URL
) {
  const entityType = url.searchParams.get('entity_type');

  if (!entityType || !isValidEntityType(entityType)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing entity_type parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch default preferences
  const { data: preferences, error: prefError } = await supabase
    .from('user_view_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .single();

  if (prefError && prefError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (OK, user has no preferences yet)
    console.error('Error fetching preferences:', prefError);
  }

  // Fetch saved views
  const { data: savedViews, error: viewsError } = await supabase
    .from('user_saved_views')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .order('is_pinned', { ascending: false })
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (viewsError) {
    console.error('Error fetching saved views:', viewsError);
    return new Response(JSON.stringify({ error: 'Failed to fetch saved views' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      preferences: preferences || null,
      saved_views: savedViews || [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler: Upsert default preferences
async function handleUpsertPreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  req: Request
) {
  const body = await req.json();
  const { entity_type, default_preferences } = body;

  if (!entity_type || !isValidEntityType(entity_type)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing entity_type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('user_view_preferences')
    .upsert(
      {
        user_id: userId,
        entity_type,
        default_preferences: default_preferences || {},
      },
      { onConflict: 'user_id,entity_type' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting preferences:', error);
    return new Response(JSON.stringify({ error: 'Failed to save preferences' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Create saved view
async function handleCreateSavedView(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  req: Request
) {
  const body = await req.json();
  const { entity_type, name, description, is_default, is_pinned, view_config } = body;

  if (!entity_type || !isValidEntityType(entity_type)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing entity_type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('user_saved_views')
    .insert({
      user_id: userId,
      entity_type,
      name: name.trim(),
      description: description?.trim() || null,
      is_default: is_default || false,
      is_pinned: is_pinned || false,
      view_config: view_config || {},
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'A view with this name already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error creating saved view:', error);
    return new Response(JSON.stringify({ error: 'Failed to create saved view' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Update saved view
async function handleUpdateSavedView(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  id: string,
  req: Request
) {
  const body = await req.json();
  const { name, description, is_default, is_pinned, view_config } = body;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (is_default !== undefined) updateData.is_default = is_default;
  if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
  if (view_config !== undefined) updateData.view_config = view_config;

  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('user_saved_views')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Saved view not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (error.code === '23505') {
      return new Response(JSON.stringify({ error: 'A view with this name already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error updating saved view:', error);
    return new Response(JSON.stringify({ error: 'Failed to update saved view' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Delete saved view
async function handleDeleteSavedView(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from('user_saved_views')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting saved view:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete saved view' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Set view as default
async function handleSetDefault(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  id: string
) {
  // The trigger will automatically unset other defaults
  const { data, error } = await supabase
    .from('user_saved_views')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Saved view not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error setting default view:', error);
    return new Response(JSON.stringify({ error: 'Failed to set default view' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Toggle pinned status
async function handleTogglePin(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  id: string
) {
  // First get current pinned status
  const { data: current, error: fetchError } = await supabase
    .from('user_saved_views')
    .select('is_pinned')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Saved view not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('Error fetching view for toggle:', fetchError);
    return new Response(JSON.stringify({ error: 'Failed to toggle pin status' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Toggle the pinned status
  const { data, error } = await supabase
    .from('user_saved_views')
    .update({ is_pinned: !current.is_pinned })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling pin status:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle pin status' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
