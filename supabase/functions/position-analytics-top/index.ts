import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get query parameters
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'popularity';
    const timeRange = url.searchParams.get('time_range') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Validate metric
    const validMetrics = ['views', 'attachments', 'briefings', 'popularity'];
    if (!validMetrics.includes(metric)) {
      return new Response(
        JSON.stringify({ error: 'Invalid metric. Must be: views, attachments, briefings, or popularity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate time_range
    const validTimeRanges = ['7d', '30d', '90d', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return new Response(
        JSON.stringify({ error: 'Invalid time_range. Must be: 7d, 30d, 90d, or all' }),
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

    // Calculate time threshold
    let timeThreshold: string | null = null;
    if (timeRange !== 'all') {
      const daysMap: { [key: string]: number } = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };
      const daysAgo = daysMap[timeRange];
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      timeThreshold = date.toISOString();
    }

    // Build query
    let query = supabaseClient
      .from('position_usage_analytics')
      .select(`
        *,
        positions (
          id,
          title,
          type,
          status
        )
      `);

    // Apply time filter
    if (timeThreshold) {
      query = query.or(`last_viewed_at.gte.${timeThreshold},last_attached_at.gte.${timeThreshold}`);
    }

    const { data: analytics, error: analyticsError } = await query;

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics', details: analyticsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate popularity scores and sort
    const enrichedAnalytics = (analytics || []).map((a: any) => ({
      ...a,
      popularity_score: (a.view_count || 0) * 1 + (a.attachment_count || 0) * 5 + (a.briefing_pack_count || 0) * 10,
    }));

    // Sort by selected metric
    const sortField: { [key: string]: string } = {
      views: 'view_count',
      attachments: 'attachment_count',
      briefings: 'briefing_pack_count',
      popularity: 'popularity_score',
    };

    enrichedAnalytics.sort((a: any, b: any) => {
      const field = sortField[metric];
      return (b[field] || 0) - (a[field] || 0);
    });

    // Apply limit
    const topPositions = enrichedAnalytics.slice(0, limit);

    return new Response(
      JSON.stringify({
        positions: topPositions,
        metric,
        time_range: timeRange,
        total: topPositions.length,
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
