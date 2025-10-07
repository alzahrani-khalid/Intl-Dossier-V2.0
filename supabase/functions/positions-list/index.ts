import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge Function: positions-list
 * GET /positions
 *
 * Returns paginated list of positions with filtering
 * Query params:
 * - status: filter by status (draft, under_review, approved, published)
 * - thematic_category: filter by category
 * - author_id: filter by author
 * - limit: page size (default 20, max 100)
 * - offset: page offset (default 0)
 */

interface ListPositionsRequest {
  status?: 'draft' | 'under_review' | 'approved' | 'published';
  thematic_category?: string;
  author_id?: string;
  limit?: number;
  offset?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          error_ar: 'رأس التفويض مفقود'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token (RLS enforcement)
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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Invalid user session',
          error_ar: 'جلسة مستخدم غير صالحة'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const dossierId = url.searchParams.get('dossierId');
    const status = url.searchParams.get('status') as ListPositionsRequest['status'];
    const thematic_category = url.searchParams.get('thematic_category');
    const author_id = url.searchParams.get('author_id');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'updated_at';
    const order = url.searchParams.get('order') || 'desc';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query with filters - only select essential fields for list view
    let query = supabase
      .from('positions')
      .select(`
        id,
        title_en,
        title_ar,
        thematic_category,
        status,
        current_stage,
        created_at,
        updated_at,
        version,
        emergency_correction,
        author_id
      `, { count: 'exact' });

    // Apply filters
    if (dossierId) {
      // Filter by positions attached to the dossier via engagement_positions
      const { data: engagementPositions } = await supabase
        .from('engagement_positions')
        .select('position_id')
        .eq('engagement_id', dossierId);

      if (engagementPositions && engagementPositions.length > 0) {
        const positionIds = engagementPositions.map(ep => ep.position_id);
        query = query.in('id', positionIds);
      } else {
        // No positions for this dossier, return empty result
        return new Response(
          JSON.stringify({
            data: [],
            total: 0,
            limit,
            offset,
            has_more: false,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'private, max-age=30',
            },
          }
        );
      }
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (thematic_category) {
      query = query.eq('thematic_category', thematic_category);
    }
    if (author_id) {
      query = query.eq('author_id', author_id);
    }
    if (search && search.trim()) {
      // Search in title fields (bilingual)
      query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    const ascending = order === 'asc';
    query = query
      .order(sort, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching positions:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch positions',
          error_ar: 'فشل في جلب المواقف',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const positions = data;

    // Return paginated response
    return new Response(
      JSON.stringify({
        data: positions,
        total: count || 0,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        },
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        error_ar: 'خطأ داخلي في الخادم'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
