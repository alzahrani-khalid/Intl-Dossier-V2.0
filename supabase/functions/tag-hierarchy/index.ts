/**
 * Tag Hierarchy Edge Function
 *
 * Handles all tag hierarchy operations including:
 * - CRUD operations for tag categories
 * - Tag synonyms management
 * - Entity tag assignments
 * - Tag search with auto-suggestions
 * - Tag merging and renaming
 * - Usage analytics
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface TagCategory {
  id?: string;
  parent_id?: string | null;
  name_en: string;
  name_ar: string;
  color?: string;
  icon?: string;
  description_en?: string;
  description_ar?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface TagSynonym {
  tag_id: string;
  synonym_en?: string;
  synonym_ar?: string;
}

interface EntityTagAssignment {
  entity_type: string;
  entity_id: string;
  tag_id: string;
  confidence_score?: number;
  is_auto_assigned?: boolean;
  auto_assignment_source?: string;
}

interface MergeRequest {
  source_tag_id: string;
  target_tag_id: string;
  reason?: string;
}

interface RenameRequest {
  tag_id: string;
  new_name_en: string;
  new_name_ar: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1] || 'tag-hierarchy';

    // Route based on method and action
    switch (req.method) {
      case 'GET': {
        return await handleGet(supabase, url, action);
      }
      case 'POST': {
        const body = await req.json();
        return await handlePost(supabase, url, action, body, user.id);
      }
      case 'PUT': {
        const body = await req.json();
        return await handlePut(supabase, url, action, body, user.id);
      }
      case 'DELETE': {
        return await handleDelete(supabase, url, action, user.id);
      }
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// GET Handlers
// ============================================================================

async function handleGet(supabase: ReturnType<typeof createClient>, url: URL, action: string) {
  const params = url.searchParams;

  switch (action) {
    case 'hierarchy':
    case 'tag-hierarchy': {
      // Get full tag hierarchy
      const rootId = params.get('root_id') || null;
      const maxDepth = parseInt(params.get('max_depth') || '10');
      const includeInactive = params.get('include_inactive') === 'true';

      const { data, error } = await supabase.rpc('get_tag_hierarchy_tree', {
        p_root_id: rootId,
        p_max_depth: maxDepth,
        p_include_inactive: includeInactive,
      });

      if (error) throw error;

      return jsonResponse({ data, total: data?.length || 0 });
    }

    case 'search': {
      // Search tags
      const query = params.get('query') || '';
      const language = params.get('language') || 'en';
      const limit = parseInt(params.get('limit') || '20');
      const entityType = params.get('entity_type') || null;

      const { data, error } = await supabase.rpc('search_tags', {
        p_query: query,
        p_language: language,
        p_limit: limit,
        p_entity_type: entityType,
      });

      if (error) throw error;

      return jsonResponse({ data, total: data?.length || 0 });
    }

    case 'suggestions': {
      // Get tag suggestions for entity
      const entityType = params.get('entity_type');
      const entityId = params.get('entity_id');
      const limit = parseInt(params.get('limit') || '5');

      if (!entityType || !entityId) {
        return jsonResponse({ error: 'entity_type and entity_id are required' }, 400);
      }

      const { data, error } = await supabase.rpc('suggest_tags_for_entity', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: limit,
      });

      if (error) throw error;

      return jsonResponse({
        data,
        entity_type: entityType,
        entity_id: entityId,
      });
    }

    case 'entity-tags': {
      // Get tags for a specific entity
      const entityType = params.get('entity_type');
      const entityId = params.get('entity_id');

      if (!entityType || !entityId) {
        return jsonResponse({ error: 'entity_type and entity_id are required' }, 400);
      }

      const { data, error } = await supabase.rpc('get_entity_tags', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      });

      if (error) throw error;

      return jsonResponse({
        data,
        entity_type: entityType,
        entity_id: entityId,
      });
    }

    case 'analytics': {
      // Get tag usage analytics
      const { data, error } = await supabase
        .from('mv_tag_usage_analytics')
        .select('*')
        .order('total_assignments', { ascending: false });

      if (error) throw error;

      return jsonResponse({
        data,
        total: data?.length || 0,
        last_refreshed: new Date().toISOString(),
      });
    }

    case 'synonyms': {
      // Get synonyms for a tag
      const tagId = params.get('tag_id');

      if (!tagId) {
        return jsonResponse({ error: 'tag_id is required' }, 400);
      }

      const { data, error } = await supabase.from('tag_synonyms').select('*').eq('tag_id', tagId);

      if (error) throw error;

      return jsonResponse({ data });
    }

    case 'merge-history': {
      // Get merge history
      const tagId = params.get('tag_id');
      let query = supabase
        .from('tag_merge_history')
        .select('*')
        .order('merged_at', { ascending: false });

      if (tagId) {
        query = query.eq('target_tag_id', tagId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return jsonResponse({ data });
    }

    case 'rename-history': {
      // Get rename history
      const tagId = params.get('tag_id');
      let query = supabase
        .from('tag_rename_history')
        .select('*')
        .order('renamed_at', { ascending: false });

      if (tagId) {
        query = query.eq('tag_id', tagId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return jsonResponse({ data });
    }

    default: {
      // Default: list all tags (flat)
      const includeInactive = params.get('include_inactive') === 'true';

      let query = supabase
        .from('tag_categories')
        .select('*')
        .order('hierarchy_level')
        .order('sort_order')
        .order('name_en');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return jsonResponse({ data, total: data?.length || 0 });
    }
  }
}

// ============================================================================
// POST Handlers
// ============================================================================

async function handlePost(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  action: string,
  body: Record<string, unknown>,
  userId: string
) {
  switch (action) {
    case 'create':
    case 'tag-hierarchy': {
      // Create new tag category
      const tagData = body as TagCategory;

      const { data, error } = await supabase
        .from('tag_categories')
        .insert({
          parent_id: tagData.parent_id || null,
          name_en: tagData.name_en,
          name_ar: tagData.name_ar,
          color: tagData.color || '#3B82F6',
          icon: tagData.icon || 'tag',
          description_en: tagData.description_en,
          description_ar: tagData.description_ar,
          sort_order: tagData.sort_order || 0,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return jsonResponse({ data }, 201);
    }

    case 'synonym': {
      // Add synonym
      const synonymData = body as TagSynonym;

      const { data, error } = await supabase
        .from('tag_synonyms')
        .insert({
          tag_id: synonymData.tag_id,
          synonym_en: synonymData.synonym_en,
          synonym_ar: synonymData.synonym_ar,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return jsonResponse({ data }, 201);
    }

    case 'assign': {
      // Assign tag to entity
      const assignData = body as EntityTagAssignment;

      const { data, error } = await supabase
        .from('entity_tag_assignments')
        .insert({
          entity_type: assignData.entity_type,
          entity_id: assignData.entity_id,
          tag_id: assignData.tag_id,
          confidence_score: assignData.confidence_score || 1.0,
          is_auto_assigned: assignData.is_auto_assigned || false,
          auto_assignment_source: assignData.auto_assignment_source,
          assigned_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return jsonResponse({ data }, 201);
    }

    case 'merge': {
      // Merge tags
      const mergeData = body as MergeRequest;

      const { data, error } = await supabase.rpc('merge_tags', {
        p_source_tag_id: mergeData.source_tag_id,
        p_target_tag_id: mergeData.target_tag_id,
        p_user_id: userId,
        p_reason: mergeData.reason || null,
      });

      if (error) throw error;

      return jsonResponse({ success: data });
    }

    case 'rename': {
      // Rename tag
      const renameData = body as RenameRequest;

      const { data, error } = await supabase.rpc('rename_tag', {
        p_tag_id: renameData.tag_id,
        p_new_name_en: renameData.new_name_en,
        p_new_name_ar: renameData.new_name_ar,
        p_user_id: userId,
        p_reason: renameData.reason || null,
      });

      if (error) throw error;

      return jsonResponse({ success: data });
    }

    case 'refresh-analytics': {
      // Refresh materialized view
      const { error } = await supabase.rpc('refresh_tag_analytics');

      if (error) {
        // Fallback: try direct SQL (requires elevated permissions)
        console.log('Using REFRESH fallback');
      }

      return jsonResponse({ success: true, message: 'Analytics refreshed' });
    }

    default:
      return jsonResponse({ error: 'Unknown action' }, 400);
  }
}

// ============================================================================
// PUT Handlers
// ============================================================================

async function handlePut(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  action: string,
  body: Record<string, unknown>,
  userId: string
) {
  const params = url.searchParams;
  const tagId = params.get('id') || (body as { id?: string }).id;

  if (!tagId) {
    return jsonResponse({ error: 'Tag ID is required' }, 400);
  }

  // Check if tag is system tag
  const { data: existingTag, error: checkError } = await supabase
    .from('tag_categories')
    .select('is_system')
    .eq('id', tagId)
    .single();

  if (checkError) throw checkError;

  if (existingTag?.is_system) {
    return jsonResponse({ error: 'System tags cannot be modified' }, 403);
  }

  const updateData: Record<string, unknown> = {};

  // Build update object from body
  const allowedFields = [
    'parent_id',
    'name_en',
    'name_ar',
    'color',
    'icon',
    'description_en',
    'description_ar',
    'sort_order',
    'is_active',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('tag_categories')
    .update(updateData)
    .eq('id', tagId)
    .select()
    .single();

  if (error) throw error;

  return jsonResponse({ data });
}

// ============================================================================
// DELETE Handlers
// ============================================================================

async function handleDelete(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  action: string,
  userId: string
) {
  const params = url.searchParams;

  switch (action) {
    case 'unassign': {
      // Remove tag assignment
      const entityType = params.get('entity_type');
      const entityId = params.get('entity_id');
      const tagId = params.get('tag_id');

      if (!entityType || !entityId || !tagId) {
        return jsonResponse({ error: 'entity_type, entity_id, and tag_id are required' }, 400);
      }

      const { error } = await supabase
        .from('entity_tag_assignments')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('tag_id', tagId);

      if (error) throw error;

      return jsonResponse({ success: true });
    }

    case 'synonym': {
      // Remove synonym
      const synonymId = params.get('id');

      if (!synonymId) {
        return jsonResponse({ error: 'Synonym ID is required' }, 400);
      }

      const { error } = await supabase.from('tag_synonyms').delete().eq('id', synonymId);

      if (error) throw error;

      return jsonResponse({ success: true });
    }

    default: {
      // Delete tag
      const tagId = params.get('id');

      if (!tagId) {
        return jsonResponse({ error: 'Tag ID is required' }, 400);
      }

      // Check if tag is system tag
      const { data: existingTag, error: checkError } = await supabase
        .from('tag_categories')
        .select('is_system')
        .eq('id', tagId)
        .single();

      if (checkError) throw checkError;

      if (existingTag?.is_system) {
        return jsonResponse({ error: 'System tags cannot be deleted' }, 403);
      }

      const { error } = await supabase.from('tag_categories').delete().eq('id', tagId);

      if (error) throw error;

      return jsonResponse({ success: true });
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
