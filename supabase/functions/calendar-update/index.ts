// T048: PATCH /calendar/{entryId} Edge Function (Update calendar entry)
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
      all_day,
      location,
      recurrence_pattern,
      linked_item_type,
      linked_item_id,
      attendee_ids,
      reminder_minutes,
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
    if (entry_type !== undefined) updates.entry_type = entry_type;
    if (title_en !== undefined) updates.title_en = title_en;
    if (title_ar !== undefined) updates.title_ar = title_ar;
    if (description_en !== undefined) updates.description_en = description_en;
    if (description_ar !== undefined) updates.description_ar = description_ar;
    if (start_datetime !== undefined) updates.start_datetime = start_datetime;
    if (end_datetime !== undefined) updates.end_datetime = end_datetime;
    if (all_day !== undefined) updates.all_day = all_day;
    if (location !== undefined) updates.location = location;
    if (recurrence_pattern !== undefined) updates.recurrence_pattern = recurrence_pattern;
    if (linked_item_type !== undefined) updates.linked_item_type = linked_item_type;
    if (linked_item_id !== undefined) updates.linked_item_id = linked_item_id;
    if (attendee_ids !== undefined) updates.attendee_ids = attendee_ids;
    if (reminder_minutes !== undefined) updates.reminder_minutes = reminder_minutes;

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
      // Check if it's a permission error
      if (updateError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to update this calendar entry' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Check if entry not found
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
