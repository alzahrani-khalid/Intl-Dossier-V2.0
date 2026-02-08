/**
 * Forum Side Events Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for forum side events (bilateral meetings, receptions, etc.)
 *
 * Methods:
 * - GET: List side events for a session or get single event
 * - POST: Create new side event
 * - PATCH: Update side event
 * - DELETE: Soft delete side event
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface SideEventRequest {
  session_id?: string;
  event_type?: 'bilateral_meeting' | 'reception' | 'exhibition' | 'workshop' | 'press_conference';
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  venue_en?: string;
  venue_ar?: string;
  capacity?: number;
  status?: 'planned' | 'confirmed' | 'cancelled';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers,
      });
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const url = new URL(req.url);

    // GET - List or get single side event
    if (req.method === 'GET') {
      const eventId = url.searchParams.get('id');
      const sessionId = url.searchParams.get('session_id');

      if (eventId) {
        // Get single side event with logistics
        const { data: event, error } = await supabase
          .from('side_events')
          .select('*')
          .eq('id', eventId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Get logistics for this event
        const { data: logistics } = await supabase
          .from('event_logistics')
          .select('*')
          .eq('event_id', eventId);

        // Get attendees for this event
        const { data: attendees } = await supabase
          .from('event_attendees')
          .select('*')
          .eq('event_id', eventId);

        return new Response(
          JSON.stringify({
            data: {
              ...event,
              logistics: logistics || [],
              attendees: attendees || [],
            },
          }),
          { status: 200, headers }
        );
      }

      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'session_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List side events for session
      let query = supabase
        .from('side_events')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .is('deleted_at', null)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Optional filters
      const status = url.searchParams.get('status');
      const eventType = url.searchParams.get('event_type');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');

      if (status) {
        query = query.eq('status', status);
      }
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      if (dateFrom) {
        query = query.gte('scheduled_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('scheduled_date', dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data: data || [], total_count: count || 0 }), {
        status: 200,
        headers,
      });
    }

    // POST - Create side event
    if (req.method === 'POST') {
      const body: SideEventRequest = await req.json();

      if (
        !body.session_id ||
        !body.title_en ||
        !body.title_ar ||
        !body.event_type ||
        !body.scheduled_date
      ) {
        return new Response(
          JSON.stringify({
            error: 'session_id, event_type, scheduled_date, title_en, and title_ar are required',
          }),
          { status: 400, headers }
        );
      }

      const { data, error } = await supabase
        .from('side_events')
        .insert({
          session_id: body.session_id,
          event_type: body.event_type,
          title_en: body.title_en,
          title_ar: body.title_ar,
          description_en: body.description_en,
          description_ar: body.description_ar,
          scheduled_date: body.scheduled_date,
          start_time: body.start_time,
          end_time: body.end_time,
          venue_en: body.venue_en,
          venue_ar: body.venue_ar,
          capacity: body.capacity,
          status: body.status || 'planned',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update side event
    if (req.method === 'PATCH') {
      const eventId = url.searchParams.get('id');
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: SideEventRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.event_type !== undefined) updateData.event_type = body.event_type;
      if (body.title_en !== undefined) updateData.title_en = body.title_en;
      if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
      if (body.description_en !== undefined) updateData.description_en = body.description_en;
      if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
      if (body.scheduled_date !== undefined) updateData.scheduled_date = body.scheduled_date;
      if (body.start_time !== undefined) updateData.start_time = body.start_time;
      if (body.end_time !== undefined) updateData.end_time = body.end_time;
      if (body.venue_en !== undefined) updateData.venue_en = body.venue_en;
      if (body.venue_ar !== undefined) updateData.venue_ar = body.venue_ar;
      if (body.capacity !== undefined) updateData.capacity = body.capacity;
      if (body.status !== undefined) updateData.status = body.status;

      const { data, error } = await supabase
        .from('side_events')
        .update(updateData)
        .eq('id', eventId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      return new Response(JSON.stringify({ data }), { status: 200, headers });
    }

    // DELETE - Soft delete side event
    if (req.method === 'DELETE') {
      const eventId = url.searchParams.get('id');
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('side_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
});
