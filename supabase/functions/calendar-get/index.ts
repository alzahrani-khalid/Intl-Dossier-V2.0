// T046: GET /calendar Edge Function (Unified calendar aggregation)
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
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const entryType = url.searchParams.get('entry_type');
    const linkedItemType = url.searchParams.get('linked_item_type');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query for calendar_entries
    let query = supabaseClient
      .from('calendar_entries')
      .select('*')
      .order('event_date', { ascending: true });

    // Date range filter (using event_date instead of start_datetime/end_datetime)
    if (startDate && endDate) {
      query = query
        .gte('event_date', startDate)
        .lte('event_date', endDate);
    } else if (startDate) {
      query = query.gte('event_date', startDate);
    } else if (endDate) {
      query = query.lte('event_date', endDate);
    }

    // Entry type filter
    if (entryType) {
      query = query.eq('entry_type', entryType);
    }

    // Linked item type filter
    if (linkedItemType) {
      query = query.eq('linked_item_type', linkedItemType);
    }

    const { data: entries, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    return new Response(
      JSON.stringify({
        entries: entries || [],
        total_count: entries?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calendar-get:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
