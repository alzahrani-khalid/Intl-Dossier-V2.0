// T047: POST /calendar Edge Function (Create calendar entry)
// Updated for 026-unified-dossier-architecture: Uses calendar_events and event_participants
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

    const body = await req.json();
    const {
      entry_type,
      title_en,
      title_ar,
      description_en,
      description_ar,
      start_datetime,
      end_datetime,
      location,
      linked_item_type,
      linked_item_id,
      participants = [],
    } = body;

    // Validate required fields
    if (!entry_type || !start_datetime) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: entry_type, start_datetime',
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

    // Calendar events must be anchored to a dossier. calendar_events.dossier_id
    // is NOT NULL and the event's clearance is derived entirely from the linked
    // dossier's sensitivity_level via RLS — an event with no dossier has no
    // clearance basis (US4: every work item links to a dossier). The previous
    // implementation fabricated a `type: 'other'` dossier here, which violates
    // the dossiers type CHECK and 500'd every unlinked create.
    const dossier_id = linked_item_id;

    if (!dossier_id) {
      return new Response(
        JSON.stringify({
          error: 'A linked dossier is required to create a calendar event',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate end_datetime if not provided (default to 1 hour)
    const finalEndDatetime = end_datetime || new Date(new Date(start_datetime).getTime() + 60 * 60 * 1000).toISOString();

    // Create calendar event
    const { data: event, error: insertError } = await supabaseClient
      .from('calendar_events')
      .insert({
        dossier_id,
        event_type: entry_type === 'internal_meeting' ? 'main_event' : 'session',
        title_en,
        title_ar,
        description_en,
        description_ar,
        start_datetime,
        end_datetime: finalEndDatetime,
        location_en: location,
        location_ar: location,
        status: 'planned',
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to create calendar events' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    // Add participants to event_participants table
    if (participants.length > 0) {
      const participantInserts = participants.map((p: any) => ({
        event_id: event.id,
        participant_type: p.participant_type,
        participant_id: p.participant_id,
        role: 'attendee',
        attendance_status: 'invited',
      }));

      const { error: participantsError } = await supabaseClient
        .from('event_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error('Failed to add participants:', participantsError);
        // Don't fail the whole request, just log the error
      }
    }

    return new Response(
      JSON.stringify(event),
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
