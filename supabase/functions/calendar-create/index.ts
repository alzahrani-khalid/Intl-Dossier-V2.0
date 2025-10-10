// T047: POST /calendar Edge Function (Create calendar entry)
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
      all_day,
      location,
      recurrence_pattern,
      linked_item_type,
      linked_item_id,
      attendee_ids,
      reminder_minutes,
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

    // Create calendar entry
    const { data: entry, error: insertError } = await supabaseClient
      .from('calendar_entries')
      .insert({
        entry_type,
        title_en,
        title_ar,
        description_en,
        description_ar,
        start_datetime,
        end_datetime,
        all_day: all_day || false,
        location,
        recurrence_pattern,
        linked_item_type,
        linked_item_id,
        attendee_ids: attendee_ids || [],
        reminder_minutes: reminder_minutes || 15,
        organizer_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a permission error
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
