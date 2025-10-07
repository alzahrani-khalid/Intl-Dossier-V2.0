import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get position ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const positionId = pathParts[pathParts.indexOf('positions') + 1];

    if (!positionId) {
      return new Response(
        JSON.stringify({ error: 'Position ID required' }),
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

    // Verify position exists
    const { data: position, error: positionError } = await supabaseClient
      .from('positions')
      .select('id, title')
      .eq('id', positionId)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({ error: 'Position not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create analytics record
    let { data: analytics, error: analyticsError } = await supabaseClient
      .from('position_usage_analytics')
      .select('*')
      .eq('position_id', positionId)
      .single();

    if (analyticsError || !analytics) {
      // Create analytics record if it doesn't exist
      const { data: newAnalytics } = await supabaseClient
        .from('position_usage_analytics')
        .insert({
          position_id: positionId,
          view_count: 0,
          attachment_count: 0,
          briefing_pack_count: 0,
        })
        .select()
        .single();

      analytics = newAnalytics || {
        position_id: positionId,
        view_count: 0,
        attachment_count: 0,
        briefing_pack_count: 0,
        trend_data: null,
      };
    }

    // Calculate popularity score (weighted formula)
    // Views: 1 point, Attachments: 5 points, Briefings: 10 points
    const popularityScore =
      (analytics.view_count || 0) * 1 +
      (analytics.attachment_count || 0) * 5 +
      (analytics.briefing_pack_count || 0) * 10;

    // Get usage rank (position among all positions by popularity)
    const { data: allAnalytics } = await supabaseClient
      .from('position_usage_analytics')
      .select('position_id, view_count, attachment_count, briefing_pack_count')
      .order('attachment_count', { ascending: false });

    const rankedAnalytics = (allAnalytics || []).map((a: any) => ({
      ...a,
      popularity: a.view_count * 1 + a.attachment_count * 5 + a.briefing_pack_count * 10,
    }))
    .sort((a, b) => b.popularity - a.popularity);

    const usageRank = rankedAnalytics.findIndex(a => a.position_id === positionId) + 1;

    return new Response(
      JSON.stringify({
        position_id: positionId,
        view_count: analytics.view_count || 0,
        attachment_count: analytics.attachment_count || 0,
        briefing_pack_count: analytics.briefing_pack_count || 0,
        last_viewed_at: analytics.last_viewed_at,
        last_attached_at: analytics.last_attached_at,
        trend_data: analytics.trend_data,
        popularity_score: popularityScore,
        usage_rank: usageRank,
        updated_at: analytics.updated_at,
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
