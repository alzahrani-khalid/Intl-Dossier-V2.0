// T048: PATCH /calendar/{entryId} Edge Function (Update calendar entry)
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
      location,
      participants,
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
    const updates: Record<string, any> = {};
    if (entry_type !== undefined) {
      updates.event_type = entry_type === 'internal_meeting' ? 'main_event' : 'session';
    }
    if (title_en !== undefined) updates.title_en = title_en;
    if (title_ar !== undefined) updates.title_ar = title_ar;
    if (description_en !== undefined) updates.description_en = description_en;
    if (description_ar !== undefined) updates.description_ar = description_ar;
    if (start_datetime !== undefined) updates.start_datetime = start_datetime;
    if (end_datetime !== undefined) updates.end_datetime = end_datetime;
    if (location !== undefined) {
      updates.location_en = location;
      updates.location_ar = location;
    }

    if (Object.keys(updates).length === 0 && !participants) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update calendar event
    const { data: event, error: updateError } = await supabaseClient
      .from('calendar_events')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      // Check if it's a permission error
      if (updateError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to update this calendar event' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Check if entry not found
      if (updateError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Calendar event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw updateError;
    }

    // Update participants if provided
    if (participants !== undefined) {
      // Delete existing participants
      await supabaseClient
        .from('event_participants')
        .delete()
        .eq('event_id', entryId);

      // Add new participants
      if (participants.length > 0) {
        const participantInserts = participants.map((p: any) => ({
          event_id: entryId,
          participant_type: p.participant_type,
          participant_id: p.participant_id,
          role: 'attendee',
          attendance_status: 'invited',
        }));

        const { error: participantsError } = await supabaseClient
          .from('event_participants')
          .insert(participantInserts);

        if (participantsError) {
          console.error('Failed to update participants:', participantsError);
        }
      }
    }

    return new Response(
      JSON.stringify(event),
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
