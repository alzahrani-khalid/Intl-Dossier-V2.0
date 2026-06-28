// T047: POST /calendar Edge Function (Create calendar entry)
// Writes calendar_entries — the canonical operational calendar table that the
// grid (calendar-get) and Week Ahead (get_upcoming_events) both read. The
// richer calendar_events table is a separate, currently-unused forum-agenda
// model (event_type = main_event/session/…); writing there made created events
// invisible. See .planning/quick/260604-lmy-calendar-write-to-entries.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// calendar_entries.linked_item_type CHECK — anything else (incl. 'dossier') is
// recorded via the dedicated dossier_id column instead.
const ALLOWED_LINKED_TYPES = ['assignment', 'position', 'mou', 'commitment', 'forum'];

// Split a datetime-local / ISO string into the naive date + time that
// calendar_entries stores. No timezone math: the entry shows the time the user
// typed (the columns are date + time without time zone).
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

    const body = await req.json();
    const {
      entry_type,
      title_en,
      title_ar,
      description_en,
      description_ar,
      start_datetime,
      end_datetime,
      all_day = false,
      location,
      linked_item_type,
      linked_item_id,
    } = body;

    // Validate required fields. title_en is NOT NULL in calendar_entries; require a
    // title in at least one language (the Arabic title is used as the fallback below).
    if (!entry_type || !start_datetime || (!title_en && !title_ar)) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: entry_type, start_datetime, and a title (title_en or title_ar)',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Map start/end into the entries' naive date + time + duration model.
    const { date: event_date, time: event_time } = splitDateTime(start_datetime);
    let duration_minutes: number | null = null;
    if (!all_day) {
      if (end_datetime) {
        const diff = Math.round(
          (new Date(end_datetime).getTime() - new Date(start_datetime).getTime()) / 60000
        );
        duration_minutes = diff > 0 ? diff : 60;
      } else {
        duration_minutes = 60;
      }
    }

    // An operational calendar entry may optionally be anchored to a dossier
    // (e.g. "Training" has none). The form sends linked_item_type='dossier' for a
    // standalone dossier link; real enum link types map to linked_item_*.
    let dossier_id: string | null = null;
    let li_type: string | null = null;
    let li_id: string | null = null;
    if (linked_item_type && ALLOWED_LINKED_TYPES.includes(linked_item_type) && linked_item_id) {
      li_type = linked_item_type;
      li_id = linked_item_id;
    } else if (linked_item_id) {
      dossier_id = linked_item_id;
    }

    // Create calendar entry. NOTE: form "participants" (person/org dossiers) are
    // not persisted here — attendee_ids is a user-id array, a semantic mismatch.
    // Persisting participants on operational entries needs a dedicated table
    // (tracked as out-of-scope in the quick task plan).
    const { data: entry, error: insertError } = await supabaseClient
      .from('calendar_entries')
      .insert({
        dossier_id,
        // title_en is NOT NULL; fall back to the Arabic title for Arabic-first entries.
        title_en: title_en || title_ar,
        title_ar,
        description_en,
        description_ar,
        entry_type,
        event_date,
        event_time: all_day ? null : event_time,
        duration_minutes,
        all_day,
        location: location ?? null,
        is_virtual: false,
        linked_item_type: li_type,
        linked_item_id: li_id,
        organizer_id: user.id,
        attendee_ids: [],
        status: 'scheduled',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to create calendar entries' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify(entry),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calendar-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
