import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ListDossiersQuery {
  type?: string;
  status?: string | string[]; // Single or multiple statuses
  sensitivity?: string;
  owner_id?: string;
  tags?: string[];
  search?: string;
  is_active?: boolean;
  cursor?: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user using the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      console.error('User:', user);
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid user session',
            message_ar: 'جلسة مستخدم غير صالحة',
            debug: userError?.message,
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const isActiveParam = url.searchParams.get('is_active');
    const statusParam = url.searchParams.get('status');

    // Parse status: can be a single value or a JSON array
    let parsedStatus: string | null = null;
    let parsedStatusArray: string[] | null = null;
    if (statusParam) {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(statusParam);
        if (Array.isArray(parsed)) {
          parsedStatusArray = parsed;
        } else {
          parsedStatus = statusParam;
        }
      } catch {
        // If not JSON, treat as single value
        parsedStatus = statusParam;
      }
    }

    const params: ListDossiersQuery = {
      type: url.searchParams.get('type') || undefined,
      status: parsedStatus || parsedStatusArray || undefined,
      sensitivity: url.searchParams.get('sensitivity') || undefined,
      owner_id: url.searchParams.get('owner_id') || undefined,
      tags: url.searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      search: url.searchParams.get('search') || undefined,
      is_active: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
      limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
    };

    // Use optimized RPC function that leverages the materialized view
    // This eliminates the N+1 query pattern by pre-joining all extension tables
    const { data: rpcResult, error: rpcError } = await supabaseClient.rpc(
      'list_dossiers_optimized',
      {
        p_type: params.type || null,
        p_status: parsedStatus,
        p_status_array: parsedStatusArray,
        p_sensitivity: params.sensitivity || null,
        p_tags: params.tags || null,
        p_search: params.search || null,
        p_is_active: params.is_active ?? null,
        p_cursor: params.cursor || null,
        p_limit: params.limit || 50,
      }
    );

    if (rpcError) {
      console.error('RPC error, falling back to direct query:', rpcError);

      // Fallback to direct query if RPC fails (e.g., materialized view not yet created)
      return await handleFallbackQuery(supabaseClient, params, corsHeaders);
    }

    // RPC returns the complete response structure
    const response = {
      data: rpcResult?.data || [],
      pagination: rpcResult?.pagination || {
        next_cursor: null,
        has_more: false,
        total_count: 0,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // 5-minute CDN cache, 1-minute browser cache
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message_en: 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Fallback to direct query if optimized RPC is not available
 * This maintains backwards compatibility during migration
 */
async function handleFallbackQuery(
  supabaseClient: ReturnType<typeof createClient>,
  params: ListDossiersQuery,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Build query with RLS
  let query = supabaseClient
    .from('dossiers')
    .select('*', { count: 'exact' })
    .neq('status', 'archived');

  // Apply filters
  if (params.type) {
    query = query.eq('type', params.type);
  }
  if (params.status) {
    // Handle single status or multiple statuses
    if (Array.isArray(params.status)) {
      query = query.in('status', params.status);
    } else {
      query = query.eq('status', params.status);
    }
  }
  if (params.sensitivity) {
    query = query.eq('sensitivity_level', params.sensitivity);
  }
  if (params.owner_id) {
    // Filter by owner using join
    query = query.in(
      'id',
      supabaseClient.from('dossier_owners').select('dossier_id').eq('user_id', params.owner_id)
    );
  }
  if (params.tags && params.tags.length > 0) {
    query = query.overlaps('tags', params.tags);
  }
  if (params.search && params.search.trim().length > 0) {
    // Full-text search using search_vector (only if non-empty after trimming)
    query = query.textSearch('search_vector', params.search.trim());
  }
  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }

  // Cursor-based pagination
  if (params.cursor) {
    // Decode cursor: base64 encoded "id"
    try {
      const cursorId = atob(params.cursor);
      query = query.lt('id', cursorId);
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_CURSOR',
            message_en: 'Invalid pagination cursor',
            message_ar: 'مؤشر صفحة غير صالح',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Order and limit
  const limit = params.limit || 50;
  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  // Execute query (RLS policies automatically applied)
  const { data: dossiers, error: queryError, count } = await query;

  if (queryError) {
    console.error('Error fetching dossiers:', queryError);
    return new Response(
      JSON.stringify({
        error: {
          code: 'QUERY_ERROR',
          message_en: 'Failed to fetch dossiers',
          message_ar: 'فشل في جلب الملفات',
          details: queryError,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Calculate next cursor
  let nextCursor: string | null = null;
  if (dossiers && dossiers.length === limit) {
    const lastDossier = dossiers[dossiers.length - 1];
    nextCursor = btoa(lastDossier.id);
  }

  const response = {
    data: dossiers || [],
    pagination: {
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
      total_count: count || 0,
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
