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
    const language = url.searchParams.get('language') || 'all';

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
      .select('id')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabaseClient
      .from('briefing_packs')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('generated_at', { ascending: false });

    // Apply language filter
    if (language !== 'all') {
      query = query.eq('language', language);
    }

    const { data: briefingPacks, error: packsError } = await query;

    if (packsError) {
      console.error('Error fetching briefing packs:', packsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch briefing packs', details: packsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        briefing_packs: briefing_packs || [],
        total: briefingPacks?.length || 0,
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
