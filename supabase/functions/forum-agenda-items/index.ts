/**
 * Forum Agenda Items Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for forum agenda items with hierarchical structure support
 *
 * Methods:
 * - GET: List agenda items for a session or get single item
 * - POST: Create new agenda item
 * - PATCH: Update agenda item
 * - DELETE: Soft delete agenda item
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface AgendaItemRequest {
  session_id?: string;
  item_number?: string;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  item_type?: 'discussion' | 'decision' | 'information' | 'election';
  parent_item_id?: string | null;
  sequence_order?: number;
  time_allocation_minutes?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'deferred';
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

    // GET - List or get single agenda item
    if (req.method === 'GET') {
      const itemId = url.searchParams.get('id');
      const sessionId = url.searchParams.get('session_id');

      if (itemId) {
        // Get single agenda item
        const { data, error } = await supabase
          .from('forum_agenda_items')
          .select('*')
          .eq('id', itemId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'session_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List agenda items for session
      let query = supabase
        .from('forum_agenda_items')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId)
        .is('deleted_at', null)
        .order('sequence_order', { ascending: true });

      // Optional filters
      const status = url.searchParams.get('status');
      const itemType = url.searchParams.get('item_type');
      const parentOnly = url.searchParams.get('parent_only') === 'true';

      if (status) {
        query = query.eq('status', status);
      }
      if (itemType) {
        query = query.eq('item_type', itemType);
      }
      if (parentOnly) {
        query = query.is('parent_item_id', null);
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

    // POST - Create agenda item
    if (req.method === 'POST') {
      const body: AgendaItemRequest = await req.json();

      if (!body.session_id || !body.title_en || !body.title_ar || !body.item_number) {
        return new Response(
          JSON.stringify({ error: 'session_id, item_number, title_en, and title_ar are required' }),
          { status: 400, headers }
        );
      }

      // Get max sequence_order for the session if not provided
      if (body.sequence_order === undefined) {
        const { data: maxSeq } = await supabase
          .from('forum_agenda_items')
          .select('sequence_order')
          .eq('session_id', body.session_id)
          .is('deleted_at', null)
          .order('sequence_order', { ascending: false })
          .limit(1)
          .single();

        body.sequence_order = (maxSeq?.sequence_order || 0) + 1;
      }

      const { data, error } = await supabase
        .from('forum_agenda_items')
        .insert({
          session_id: body.session_id,
          item_number: body.item_number,
          title_en: body.title_en,
          title_ar: body.title_ar,
          description_en: body.description_en,
          description_ar: body.description_ar,
          item_type: body.item_type || 'discussion',
          parent_item_id: body.parent_item_id || null,
          sequence_order: body.sequence_order,
          time_allocation_minutes: body.time_allocation_minutes,
          status: body.status || 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update agenda item
    if (req.method === 'PATCH') {
      const itemId = url.searchParams.get('id');
      if (!itemId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: AgendaItemRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.item_number !== undefined) updateData.item_number = body.item_number;
      if (body.title_en !== undefined) updateData.title_en = body.title_en;
      if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
      if (body.description_en !== undefined) updateData.description_en = body.description_en;
      if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
      if (body.item_type !== undefined) updateData.item_type = body.item_type;
      if (body.parent_item_id !== undefined) updateData.parent_item_id = body.parent_item_id;
      if (body.sequence_order !== undefined) updateData.sequence_order = body.sequence_order;
      if (body.time_allocation_minutes !== undefined)
        updateData.time_allocation_minutes = body.time_allocation_minutes;
      if (body.status !== undefined) updateData.status = body.status;

      const { data, error } = await supabase
        .from('forum_agenda_items')
        .update(updateData)
        .eq('id', itemId)
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

    // DELETE - Soft delete agenda item
    if (req.method === 'DELETE') {
      const itemId = url.searchParams.get('id');
      if (!itemId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('forum_agenda_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId);

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
