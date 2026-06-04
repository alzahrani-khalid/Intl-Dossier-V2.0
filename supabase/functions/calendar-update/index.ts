// T048: PATCH /calendar/{entryId} Edge Function (Update calendar entry)
// Updates calendar_entries — the canonical operational calendar table read by
// calendar-get and get_upcoming_events. See calendar-create and
// .planning/quick/260604-lmy-calendar-write-to-entries.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Split a datetime-local / ISO string into the naive date + time that
// calendar_entries stores (no timezone math).
function splitDateTime(value: string): { date: string; time: string } {
  const [datePart, timePartRaw = '00:00'] = String(value).split('T');
  const stripped = timePartRaw.replace(/(Z|[+-]\d{2}:?\d{2})$/, '').split('.')[0];
  const time = stripped.length === 5 ? `${stripped}:00` : stripped.slice(0, 8) || '00:00:00';
  return { date: datePart, time };
}

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
    const entryId = url.searchParams.get('entryId');

    if (!entryId) {
      return new Response(
        JSON.stringify({ error: 'Missing entryId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      entry_type,
      title_en,
      title_ar,
      description_en,
      description_ar,
      start_datetime,
      end_datetime,
      all_day,
      location,
    } = body;

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

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (entry_type !== undefined) updates.entry_type = entry_type;
    if (title_en !== undefined) updates.title_en = title_en;
    if (title_ar !== undefined) updates.title_ar = title_ar;
    if (description_en !== undefined) updates.description_en = description_en;
    if (description_ar !== undefined) updates.description_ar = description_ar;
    if (all_day !== undefined) updates.all_day = all_day;
    if (location !== undefined) updates.location = location;
    if (start_datetime !== undefined) {
      const { date, time } = splitDateTime(start_datetime);
      updates.event_date = date;
      updates.event_time = all_day ? null : time;
      if (end_datetime) {
        const diff = Math.round(
          (new Date(end_datetime).getTime() - new Date(start_datetime).getTime()) / 60000
        );
        updates.duration_minutes = diff > 0 ? diff : 60;
      }
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update calendar entry
    const { data: entry, error: updateError } = await supabaseClient
      .from('calendar_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to update this calendar entry' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (updateError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Calendar entry not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw updateError;
    }

    return new Response(
      JSON.stringify(entry),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calendar-update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
