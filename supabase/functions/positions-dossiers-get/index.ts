// T040: GET /positions/{positionId}/dossiers Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const positionId = url.searchParams.get('positionId');
    const linkType = url.searchParams.get('link_type');

    if (!positionId) {
      return new Response(JSON.stringify({ error: 'Missing positionId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
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

    // Build query
    let query = supabaseClient
      .from('position_dossier_links')
      .select(
        `
        *,
        dossier:dossiers!dossier_id(
          id,
          name_en,
          name_ar,
          type,
          status,
          description_en,
          description_ar
        )
      `
      )
      .eq('position_id', positionId)
      .order('created_at', { ascending: false });

    // Filter by link_type if provided
    if (linkType) {
      query = query.eq('link_type', linkType);
    }

    const { data: links, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    return new Response(
      JSON.stringify({
        links: links || [],
        total_count: links?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in positions-dossiers-get:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
