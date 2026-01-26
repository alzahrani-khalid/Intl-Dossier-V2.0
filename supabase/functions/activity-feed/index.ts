/**
 * Activity Feed Edge Function
 *
 * Provides API for:
 * - GET /activity-feed - List activities with filters
 * - GET /activity-feed/followed - Get activities for followed entities
 * - POST /activity-feed/follow - Follow an entity
 * - DELETE /activity-feed/follow - Unfollow an entity
 * - GET /activity-feed/following - Get list of followed entities
 * - GET /activity-feed/preferences - Get user preferences
 * - PUT /activity-feed/preferences - Update user preferences
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Response helpers
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Types
interface ActivityFilters {
  entity_types?: string[];
  action_types?: string[];
  actor_id?: string;
  date_from?: string;
  date_to?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  search?: string;
  followed_only?: boolean;
}

interface PaginationParams {
  cursor?: string;
  limit?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    // Create Supabase client with user's JWT (matching dossier-dashboard pattern)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse URL and method
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Route handling
    switch (req.method) {
      case 'GET':
        if (action === 'followed') {
          return handleGetFollowedActivities(supabase, user.id, url.searchParams);
        } else if (action === 'following') {
          return handleGetFollowing(supabase, user.id, url.searchParams);
        } else if (action === 'preferences') {
          return handleGetPreferences(supabase, user.id);
        } else {
          return handleGetActivities(supabase, user.id, url.searchParams);
        }

      case 'POST':
        if (action === 'follow') {
          const body = await req.json();
          return handleFollowEntity(supabase, user.id, body);
        }
        return errorResponse('Invalid endpoint', 404);

      case 'PUT':
        if (action === 'preferences') {
          const body = await req.json();
          return handleUpdatePreferences(supabase, user.id, body);
        }
        return errorResponse('Invalid endpoint', 404);

      case 'DELETE':
        if (action === 'follow') {
          return handleUnfollowEntity(supabase, user.id, url.searchParams);
        }
        return errorResponse('Invalid endpoint', 404);

      default:
        return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Activity feed error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});

/**
 * Get activities with filters and pagination
 */
async function handleGetActivities(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  // Parse filters
  const filters: ActivityFilters = {
    entity_types: params.get('entity_types')?.split(',').filter(Boolean),
    action_types: params.get('action_types')?.split(',').filter(Boolean),
    actor_id: params.get('actor_id') || undefined,
    date_from: params.get('date_from') || undefined,
    date_to: params.get('date_to') || undefined,
    related_entity_type: params.get('related_entity_type') || undefined,
    related_entity_id: params.get('related_entity_id') || undefined,
    search: params.get('search') || undefined,
    followed_only: params.get('followed_only') === 'true',
  };

  // Parse pagination
  const pagination: PaginationParams = {
    cursor: params.get('cursor') || undefined,
    limit: Math.min(parseInt(params.get('limit') || '20'), 100),
  };

  // Build query
  let query = supabase
    .from('activity_stream')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(pagination.limit! + 1); // Fetch one extra for cursor

  // Apply cursor pagination
  if (pagination.cursor) {
    query = query.lt('created_at', pagination.cursor);
  }

  // Apply filters
  if (filters.entity_types && filters.entity_types.length > 0) {
    query = query.in('entity_type', filters.entity_types);
  }

  if (filters.action_types && filters.action_types.length > 0) {
    query = query.in('action_type', filters.action_types);
  }

  if (filters.actor_id) {
    query = query.eq('actor_id', filters.actor_id);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.related_entity_type) {
    query = query.eq('related_entity_type', filters.related_entity_type);
  }

  if (filters.related_entity_id) {
    query = query.eq('related_entity_id', filters.related_entity_id);
  }

  if (filters.search) {
    query = query.or(
      `entity_name_en.ilike.%${filters.search}%,entity_name_ar.ilike.%${filters.search}%,description_en.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%,actor_name.ilike.%${filters.search}%`
    );
  }

  // If followed_only, filter by followed entities
  if (filters.followed_only) {
    const { data: followedEntities } = await supabase
      .from('entity_follows')
      .select('entity_type, entity_id')
      .eq('user_id', userId);

    if (followedEntities && followedEntities.length > 0) {
      // Build OR conditions for followed entities
      const followConditions = followedEntities
        .map((f) => `and(entity_type.eq.${f.entity_type},entity_id.eq.${f.entity_id})`)
        .join(',');

      query = query.or(followConditions);
    } else {
      // No followed entities, return empty
      return jsonResponse({
        activities: [],
        next_cursor: null,
        has_more: false,
        total_count: 0,
      });
    }
  }

  const { data: activities, error, count } = await query;

  if (error) {
    console.error('Query error:', error);
    return errorResponse(error.message, 500);
  }

  // Check if there are more results
  const hasMore = activities.length > pagination.limit!;
  if (hasMore) {
    activities.pop(); // Remove the extra item
  }

  // Get next cursor
  const nextCursor =
    hasMore && activities.length > 0 ? activities[activities.length - 1].created_at : null;

  return jsonResponse({
    activities,
    next_cursor: nextCursor,
    has_more: hasMore,
    total_count: count,
  });
}

/**
 * Get activities for followed entities only
 */
async function handleGetFollowedActivities(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  // Get followed entities
  const { data: followedEntities, error: followError } = await supabase
    .from('entity_follows')
    .select('entity_type, entity_id')
    .eq('user_id', userId);

  if (followError) {
    return errorResponse(followError.message, 500);
  }

  if (!followedEntities || followedEntities.length === 0) {
    return jsonResponse({
      activities: [],
      next_cursor: null,
      has_more: false,
      total_count: 0,
    });
  }

  // Add followed_only filter
  params.set('followed_only', 'true');

  return handleGetActivities(supabase, userId, params);
}

/**
 * Get list of entities user is following
 */
async function handleGetFollowing(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const entityType = params.get('entity_type');

  let query = supabase
    .from('entity_follows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ following: data });
}

/**
 * Follow an entity
 */
async function handleFollowEntity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: {
    entity_type: string;
    entity_id: string;
    entity_name_en: string;
    entity_name_ar?: string;
    follow_reason?: string;
  }
) {
  if (!body.entity_type || !body.entity_id || !body.entity_name_en) {
    return errorResponse('Missing required fields: entity_type, entity_id, entity_name_en');
  }

  const { data, error } = await supabase
    .from('entity_follows')
    .upsert(
      {
        user_id: userId,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        entity_name_en: body.entity_name_en,
        entity_name_ar: body.entity_name_ar,
        follow_reason: body.follow_reason || 'manual',
      },
      {
        onConflict: 'user_id,entity_type,entity_id',
      }
    )
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({
    follow: data,
    message_en: 'Successfully followed entity',
    message_ar: 'تم متابعة العنصر بنجاح',
  });
}

/**
 * Unfollow an entity
 */
async function handleUnfollowEntity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  params: URLSearchParams
) {
  const entityType = params.get('entity_type');
  const entityId = params.get('entity_id');

  if (!entityType || !entityId) {
    return errorResponse('Missing required params: entity_type, entity_id');
  }

  const { error } = await supabase
    .from('entity_follows')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({
    message_en: 'Successfully unfollowed entity',
    message_ar: 'تم إلغاء متابعة العنصر بنجاح',
  });
}

/**
 * Get user activity feed preferences
 */
async function handleGetPreferences(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('activity_feed_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows
    return errorResponse(error.message, 500);
  }

  // Return defaults if no preferences exist
  const preferences = data || {
    user_id: userId,
    default_entity_types: [],
    default_action_types: [],
    items_per_page: 20,
    show_own_activities: true,
    compact_view: false,
    email_digest_frequency: 'daily',
    push_notifications_enabled: true,
  };

  return jsonResponse({ preferences });
}

/**
 * Update user activity feed preferences
 */
async function handleUpdatePreferences(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: {
    default_entity_types?: string[];
    default_action_types?: string[];
    items_per_page?: number;
    show_own_activities?: boolean;
    compact_view?: boolean;
    email_digest_frequency?: string;
    push_notifications_enabled?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('activity_feed_preferences')
    .upsert(
      {
        user_id: userId,
        ...body,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({
    preferences: data,
    message_en: 'Preferences updated successfully',
    message_ar: 'تم تحديث التفضيلات بنجاح',
  });
}
