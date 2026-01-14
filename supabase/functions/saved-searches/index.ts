/**
 * Supabase Edge Function: Saved Searches
 * Feature: saved-searches-feature
 * Description: CRUD operations for saved searches with team sharing and alerts
 *
 * Routes:
 * GET /saved-searches - List all accessible saved searches
 * GET /saved-searches/:id - Get a specific saved search
 * POST /saved-searches - Create a new saved search
 * PUT /saved-searches/:id - Update a saved search
 * DELETE /saved-searches/:id - Delete a saved search
 * POST /saved-searches/:id/execute - Execute a saved search
 * POST /saved-searches/:id/share - Share a saved search
 * DELETE /saved-searches/:id/share/:shareId - Remove a share
 * POST /saved-searches/:id/alert - Configure alert for a saved search
 * PUT /saved-searches/:id/alert - Update alert configuration
 * DELETE /saved-searches/:id/alert - Delete alert
 * GET /saved-searches/smart-filters - Get predefined smart filters
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SavedSearch {
  id: string;
  user_id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  icon: string;
  color: string;
  search_definition: SearchDefinition;
  category: string;
  tags: string[];
  is_pinned: boolean;
  pin_order: number;
  use_count: number;
  last_used_at: string | null;
  last_result_count: number | null;
  created_at: string;
  updated_at: string;
}

interface SearchDefinition {
  query?: string;
  entity_types?: string[];
  conditions?: FilterCondition[];
  condition_groups?: FilterGroup[];
  relationships?: RelationshipQuery[];
  date_range?: DateRange;
  status?: string[];
  tags?: string[];
  filter_logic?: 'AND' | 'OR';
  include_archived?: boolean;
  sort_by?: 'relevance' | 'date' | 'title';
  sort_order?: 'asc' | 'desc';
}

interface FilterCondition {
  field_name: string;
  operator: string;
  value: unknown;
  is_negated?: boolean;
}

interface FilterGroup {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface RelationshipQuery {
  source_entity_type: string;
  target_entity_type: string;
  relationship_type: string;
  target_conditions?: FilterCondition[];
  include_depth?: number;
}

interface DateRange {
  from?: string;
  to?: string;
  preset?: string;
}

interface CreateSavedSearchRequest {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  search_definition: SearchDefinition;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
}

interface UpdateSavedSearchRequest {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  search_definition?: SearchDefinition;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
  pin_order?: number;
}

interface ShareRequest {
  share_type: 'user' | 'team' | 'organization' | 'public';
  shared_with_user_id?: string;
  shared_with_team_id?: string;
  permission?: 'view' | 'edit' | 'admin';
  message?: string;
  expires_at?: string;
}

interface AlertConfigRequest {
  is_enabled?: boolean;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  notify_in_app?: boolean;
  notify_email?: boolean;
  notify_push?: boolean;
  trigger_on?: 'new_results' | 'result_changes' | 'threshold_reached';
  threshold_count?: number;
}

const VALID_COLORS = [
  'blue',
  'green',
  'red',
  'purple',
  'orange',
  'yellow',
  'gray',
  'pink',
  'indigo',
  'teal',
];

const VALID_CATEGORIES = ['personal', 'team', 'organization', 'smart', 'recent'];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(
        {
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        },
        401
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse(
        {
          error: 'unauthorized',
          message: 'Invalid or expired token',
          message_ar: 'رمز غير صالح أو منتهي الصلاحية',
        },
        401
      );
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const baseIndex = pathParts.findIndex((p) => p === 'saved-searches');
    const searchId =
      pathParts[baseIndex + 1] && pathParts[baseIndex + 1] !== 'smart-filters'
        ? pathParts[baseIndex + 1]
        : null;
    const action = pathParts[baseIndex + 2] || null;
    const subId = pathParts[baseIndex + 3] || null;

    // Route handling
    switch (req.method) {
      case 'GET':
        if (pathParts.includes('smart-filters')) {
          return await getSmartFilters(supabase);
        }
        if (searchId && searchId !== 'saved-searches') {
          return await getSavedSearch(supabase, searchId, user.id);
        }
        return await listSavedSearches(supabase, url, user.id);

      case 'POST':
        if (action === 'execute' && searchId) {
          return await executeSavedSearch(supabase, searchId, user.id);
        }
        if (action === 'share' && searchId) {
          return await shareSavedSearch(supabase, searchId, req, user.id);
        }
        if (action === 'alert' && searchId) {
          return await createAlert(supabase, searchId, req, user.id);
        }
        if (!searchId || searchId === 'saved-searches') {
          return await createSavedSearch(supabase, req, user.id);
        }
        return jsonResponse({ error: 'not_found', message: 'Route not found' }, 404);

      case 'PUT':
        if (action === 'alert' && searchId) {
          return await updateAlert(supabase, searchId, req, user.id);
        }
        if (searchId) {
          return await updateSavedSearch(supabase, searchId, req, user.id);
        }
        return jsonResponse({ error: 'bad_request', message: 'Search ID required' }, 400);

      case 'DELETE':
        if (action === 'share' && searchId && subId) {
          return await deleteShare(supabase, searchId, subId, user.id);
        }
        if (action === 'alert' && searchId) {
          return await deleteAlert(supabase, searchId, user.id);
        }
        if (searchId) {
          return await deleteSavedSearch(supabase, searchId, user.id);
        }
        return jsonResponse({ error: 'bad_request', message: 'Search ID required' }, 400);

      default:
        return jsonResponse({ error: 'method_not_allowed', message: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Saved searches error:', error);
    return jsonResponse(
      {
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      },
      500
    );
  }
});

// Helper: JSON response
function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// GET: List saved searches
async function listSavedSearches(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  userId: string
) {
  const category = url.searchParams.get('category');
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50')), 100);
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
  const includeShared = url.searchParams.get('include_shared') !== 'false';
  const pinnedOnly = url.searchParams.get('pinned_only') === 'true';

  const { data, error } = await supabase.rpc('get_accessible_saved_searches', {
    p_user_id: userId,
    p_category: category,
    p_include_shared: includeShared,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('List saved searches error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  let filteredData = data || [];
  if (pinnedOnly) {
    filteredData = filteredData.filter((s: SavedSearch) => s.is_pinned);
  }

  return jsonResponse({
    data: filteredData,
    count: filteredData.length,
    limit,
    offset,
    metadata: {
      has_more: (data?.length || 0) === limit,
      next_offset: (data?.length || 0) === limit ? offset + limit : null,
    },
  });
}

// GET: Get single saved search
async function getSavedSearch(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  userId: string
) {
  // Check access
  const { data: access } = await supabase.rpc('can_access_saved_search', {
    p_user_id: userId,
    p_search_id: searchId,
  });

  if (!access?.[0]?.can_access) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found or access denied',
        message_ar: 'البحث المحفوظ غير موجود أو الوصول مرفوض',
      },
      404
    );
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .select(
      `
      *,
      shares:saved_search_shares(
        id,
        share_type,
        shared_with_user_id,
        shared_with_team_id,
        permission,
        message,
        expires_at,
        created_at
      ),
      alert:saved_search_alerts(
        id,
        is_enabled,
        frequency,
        notify_in_app,
        notify_email,
        notify_push,
        trigger_on,
        threshold_count,
        last_check_at,
        last_alert_at,
        alert_count
      )
    `
    )
    .eq('id', searchId)
    .single();

  if (error) {
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({
    data: {
      ...data,
      permission: access[0].permission,
      alert: data.alert?.[0] || null,
    },
  });
}

// POST: Create saved search
async function createSavedSearch(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string
) {
  const body: CreateSavedSearchRequest = await req.json();

  // Validate required fields
  if (!body.name_en || !body.name_ar) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: 'name_en and name_ar are required',
        message_ar: 'name_en و name_ar مطلوبان',
      },
      400
    );
  }

  if (!body.search_definition) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: 'search_definition is required',
        message_ar: 'search_definition مطلوب',
      },
      400
    );
  }

  // Validate color
  const color = body.color || 'blue';
  if (!VALID_COLORS.includes(color)) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: `Invalid color. Valid colors: ${VALID_COLORS.join(', ')}`,
        message_ar: 'لون غير صالح',
      },
      400
    );
  }

  // Validate category
  const category = body.category || 'personal';
  if (!VALID_CATEGORIES.includes(category)) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        message_ar: 'فئة غير صالحة',
      },
      400
    );
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en || null,
      description_ar: body.description_ar || null,
      icon: body.icon || 'search',
      color,
      search_definition: body.search_definition,
      category,
      tags: body.tags || [],
      is_pinned: body.is_pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Create saved search error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ data }, 201);
}

// PUT: Update saved search
async function updateSavedSearch(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  req: Request,
  userId: string
) {
  // Check access
  const { data: access } = await supabase.rpc('can_access_saved_search', {
    p_user_id: userId,
    p_search_id: searchId,
  });

  if (!access?.[0]?.can_access) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  if (access[0].permission === 'view') {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You do not have permission to edit this search',
        message_ar: 'ليس لديك إذن لتعديل هذا البحث',
      },
      403
    );
  }

  const body: UpdateSavedSearchRequest = await req.json();

  // Validate color if provided
  if (body.color && !VALID_COLORS.includes(body.color)) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: `Invalid color. Valid colors: ${VALID_COLORS.join(', ')}`,
        message_ar: 'لون غير صالح',
      },
      400
    );
  }

  // Validate category if provided
  if (body.category && !VALID_CATEGORIES.includes(body.category)) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        message_ar: 'فئة غير صالحة',
      },
      400
    );
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (body.name_en !== undefined) updates.name_en = body.name_en;
  if (body.name_ar !== undefined) updates.name_ar = body.name_ar;
  if (body.description_en !== undefined) updates.description_en = body.description_en;
  if (body.description_ar !== undefined) updates.description_ar = body.description_ar;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.color !== undefined) updates.color = body.color;
  if (body.search_definition !== undefined) updates.search_definition = body.search_definition;
  if (body.category !== undefined) updates.category = body.category;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;
  if (body.pin_order !== undefined) updates.pin_order = body.pin_order;

  const { data, error } = await supabase
    .from('saved_searches')
    .update(updates)
    .eq('id', searchId)
    .select()
    .single();

  if (error) {
    console.error('Update saved search error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ data });
}

// DELETE: Delete saved search
async function deleteSavedSearch(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  userId: string
) {
  // Check if user owns the search
  const { data: existing } = await supabase
    .from('saved_searches')
    .select('user_id')
    .eq('id', searchId)
    .single();

  if (!existing) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  if (existing.user_id !== userId) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only delete your own saved searches',
        message_ar: 'يمكنك حذف عمليات البحث المحفوظة الخاصة بك فقط',
      },
      403
    );
  }

  const { error } = await supabase.from('saved_searches').delete().eq('id', searchId);

  if (error) {
    console.error('Delete saved search error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ success: true });
}

// POST: Execute saved search
async function executeSavedSearch(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  userId: string
) {
  // Check access
  const { data: access } = await supabase.rpc('can_access_saved_search', {
    p_user_id: userId,
    p_search_id: searchId,
  });

  if (!access?.[0]?.can_access) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  // Get search definition
  const { data: search, error: fetchError } = await supabase
    .from('saved_searches')
    .select('search_definition')
    .eq('id', searchId)
    .single();

  if (fetchError || !search) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  const def = search.search_definition as SearchDefinition;

  // Execute the search using the advanced search function
  const { data: results, error: searchError } = await supabase.rpc('execute_advanced_search', {
    p_query: def.query || null,
    p_entity_types: def.entity_types || ['dossier'],
    p_conditions: JSON.stringify(def.conditions || []),
    p_relationships: JSON.stringify(def.relationships || []),
    p_date_from: def.date_range?.from || null,
    p_date_to: def.date_range?.to || null,
    p_status: def.status || null,
    p_tags: def.tags || null,
    p_filter_logic: def.filter_logic || 'AND',
    p_include_archived: def.include_archived || false,
    p_limit: 50,
    p_offset: 0,
    p_sort_by: def.sort_by || 'relevance',
    p_sort_order: def.sort_order || 'desc',
  });

  if (searchError) {
    console.error('Execute search error:', searchError);
    return jsonResponse(
      {
        error: 'search_error',
        message: searchError.message,
        message_ar: 'حدث خطأ في البحث',
      },
      500
    );
  }

  // Increment use count
  await supabase.rpc('increment_saved_search_use_count', {
    p_search_id: searchId,
    p_result_count: results?.length || 0,
  });

  return jsonResponse({
    data: results || [],
    count: results?.length || 0,
    search_id: searchId,
  });
}

// POST: Share saved search
async function shareSavedSearch(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  req: Request,
  userId: string
) {
  // Check if user owns the search
  const { data: existing } = await supabase
    .from('saved_searches')
    .select('user_id')
    .eq('id', searchId)
    .single();

  if (!existing) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  if (existing.user_id !== userId) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only share your own saved searches',
        message_ar: 'يمكنك مشاركة عمليات البحث المحفوظة الخاصة بك فقط',
      },
      403
    );
  }

  const body: ShareRequest = await req.json();

  // Validate share type
  if (!['user', 'team', 'organization', 'public'].includes(body.share_type)) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: 'Invalid share_type',
        message_ar: 'نوع المشاركة غير صالح',
      },
      400
    );
  }

  // Validate share target
  if (body.share_type === 'user' && !body.shared_with_user_id) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: 'shared_with_user_id is required for user shares',
        message_ar: 'مطلوب معرف المستخدم المشارك معه',
      },
      400
    );
  }

  if (body.share_type === 'team' && !body.shared_with_team_id) {
    return jsonResponse(
      {
        error: 'bad_request',
        message: 'shared_with_team_id is required for team shares',
        message_ar: 'مطلوب معرف الفريق المشارك معه',
      },
      400
    );
  }

  const { data, error } = await supabase
    .from('saved_search_shares')
    .insert({
      saved_search_id: searchId,
      share_type: body.share_type,
      shared_with_user_id: body.shared_with_user_id || null,
      shared_with_team_id: body.shared_with_team_id || null,
      permission: body.permission || 'view',
      shared_by: userId,
      message: body.message || null,
      expires_at: body.expires_at || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return jsonResponse(
        {
          error: 'conflict',
          message: 'This search is already shared with this user',
          message_ar: 'تم مشاركة هذا البحث مع هذا المستخدم بالفعل',
        },
        409
      );
    }
    console.error('Share saved search error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ data }, 201);
}

// DELETE: Remove share
async function deleteShare(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  shareId: string,
  userId: string
) {
  // Check if user owns the search
  const { data: existing } = await supabase
    .from('saved_searches')
    .select('user_id')
    .eq('id', searchId)
    .single();

  if (!existing || existing.user_id !== userId) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only manage shares for your own searches',
        message_ar: 'يمكنك إدارة المشاركات لعمليات البحث الخاصة بك فقط',
      },
      403
    );
  }

  const { error } = await supabase
    .from('saved_search_shares')
    .delete()
    .eq('id', shareId)
    .eq('saved_search_id', searchId);

  if (error) {
    console.error('Delete share error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ success: true });
}

// POST: Create alert
async function createAlert(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  req: Request,
  userId: string
) {
  // Check access
  const { data: access } = await supabase.rpc('can_access_saved_search', {
    p_user_id: userId,
    p_search_id: searchId,
  });

  if (!access?.[0]?.can_access) {
    return jsonResponse(
      {
        error: 'not_found',
        message: 'Saved search not found',
        message_ar: 'البحث المحفوظ غير موجود',
      },
      404
    );
  }

  const body: AlertConfigRequest = await req.json();

  const { data, error } = await supabase
    .from('saved_search_alerts')
    .insert({
      saved_search_id: searchId,
      user_id: userId,
      is_enabled: body.is_enabled ?? true,
      frequency: body.frequency || 'daily',
      notify_in_app: body.notify_in_app ?? true,
      notify_email: body.notify_email ?? false,
      notify_push: body.notify_push ?? false,
      trigger_on: body.trigger_on || 'new_results',
      threshold_count: body.threshold_count || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return jsonResponse(
        {
          error: 'conflict',
          message: 'An alert already exists for this search',
          message_ar: 'يوجد تنبيه بالفعل لهذا البحث',
        },
        409
      );
    }
    console.error('Create alert error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ data }, 201);
}

// PUT: Update alert
async function updateAlert(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  req: Request,
  userId: string
) {
  const body: AlertConfigRequest = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.is_enabled !== undefined) updates.is_enabled = body.is_enabled;
  if (body.frequency !== undefined) updates.frequency = body.frequency;
  if (body.notify_in_app !== undefined) updates.notify_in_app = body.notify_in_app;
  if (body.notify_email !== undefined) updates.notify_email = body.notify_email;
  if (body.notify_push !== undefined) updates.notify_push = body.notify_push;
  if (body.trigger_on !== undefined) updates.trigger_on = body.trigger_on;
  if (body.threshold_count !== undefined) updates.threshold_count = body.threshold_count;

  const { data, error } = await supabase
    .from('saved_search_alerts')
    .update(updates)
    .eq('saved_search_id', searchId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse(
        {
          error: 'not_found',
          message: 'Alert not found',
          message_ar: 'التنبيه غير موجود',
        },
        404
      );
    }
    console.error('Update alert error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ data });
}

// DELETE: Delete alert
async function deleteAlert(
  supabase: ReturnType<typeof createClient>,
  searchId: string,
  userId: string
) {
  const { error } = await supabase
    .from('saved_search_alerts')
    .delete()
    .eq('saved_search_id', searchId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete alert error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({ success: true });
}

// GET: Get smart filters (predefined system templates)
async function getSmartFilters(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('search_templates')
    .select('*')
    .eq('is_system', true)
    .eq('is_public', true)
    .order('use_count', { ascending: false });

  if (error) {
    console.error('Get smart filters error:', error);
    return jsonResponse(
      {
        error: 'database_error',
        message: error.message,
        message_ar: 'حدث خطأ في قاعدة البيانات',
      },
      500
    );
  }

  return jsonResponse({
    data: data || [],
    count: data?.length || 0,
  });
}
