import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get engagement ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const engagementId = pathParts[pathParts.indexOf('engagements') + 1];

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'Engagement ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const sortBy = url.searchParams.get('sort_by') || 'display_order';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Validate sort field
    const validSortFields = ['display_order', 'relevance_score', 'attached_at'];
    if (!validSortFields.includes(sortBy)) {
      return new Response(
        JSON.stringify({ error: 'Invalid sort_by parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify engagement exists and user has access
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagements')
      .select('id, dossier_id')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query engagement positions with RLS
    let query = supabaseClient
      .from('engagement_positions')
      .select(`
        id,
        position_id,
        engagement_id,
        attached_by,
        attached_at,
        attachment_reason,
        display_order,
        relevance_score,
        positions (
          id,
          title,
          content,
          type,
          status,
          language,
          created_at,
          updated_at
        )
      `)
      .eq('engagement_id', engagementId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: positions, error: positionsError, count } = await query;

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch positions', details: positionsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count
    const { count: totalCount } = await supabaseClient
      .from('engagement_positions')
      .select('*', { count: 'exact', head: true })
      .eq('engagement_id', engagementId);

    return new Response(
      JSON.stringify({
        positions: positions || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          total_pages: Math.ceil((totalCount || 0) / limit),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
