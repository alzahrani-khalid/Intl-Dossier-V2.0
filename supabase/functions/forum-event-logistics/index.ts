/**
 * Forum Event Logistics Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for event logistics (catering, AV, interpretation, etc.)
 *
 * Methods:
 * - GET: List logistics for an event
 * - POST: Create new logistics entry
 * - PATCH: Update logistics entry
 * - DELETE: Delete logistics entry
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface EventLogisticsRequest {
  event_id?: string;
  logistics_type?:
    | 'catering'
    | 'av_equipment'
    | 'interpretation'
    | 'security'
    | 'transportation'
    | 'accommodation';
  provider_name?: string;
  requirements_en?: string;
  requirements_ar?: string;
  estimated_cost?: number;
  currency?: string;
  status?: 'pending' | 'booked' | 'confirmed' | 'cancelled';
  notes?: string;
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

    // GET - List logistics for an event
    if (req.method === 'GET') {
      const logisticsId = url.searchParams.get('id');
      const eventId = url.searchParams.get('event_id');

      if (logisticsId) {
        // Get single logistics entry
        const { data, error } = await supabase
          .from('event_logistics')
          .select('*')
          .eq('id', logisticsId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      if (!eventId) {
        return new Response(JSON.stringify({ error: 'event_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List logistics for event
      let query = supabase
        .from('event_logistics')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)
        .order('logistics_type', { ascending: true });

      // Optional filters
      const logisticsType = url.searchParams.get('logistics_type');
      const status = url.searchParams.get('status');

      if (logisticsType) {
        query = query.eq('logistics_type', logisticsType);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Calculate total estimated cost
      const totalCost = (data || []).reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

      return new Response(
        JSON.stringify({
          data: data || [],
          total_count: count || 0,
          total_estimated_cost: totalCost,
        }),
        { status: 200, headers }
      );
    }

    // POST - Create logistics entry
    if (req.method === 'POST') {
      const body: EventLogisticsRequest = await req.json();

      if (!body.event_id || !body.logistics_type) {
        return new Response(JSON.stringify({ error: 'event_id and logistics_type are required' }), {
          status: 400,
          headers,
        });
      }

      const { data, error } = await supabase
        .from('event_logistics')
        .insert({
          event_id: body.event_id,
          logistics_type: body.logistics_type,
          provider_name: body.provider_name,
          requirements_en: body.requirements_en,
          requirements_ar: body.requirements_ar,
          estimated_cost: body.estimated_cost,
          currency: body.currency || 'SAR',
          status: body.status || 'pending',
          notes: body.notes,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update logistics entry
    if (req.method === 'PATCH') {
      const logisticsId = url.searchParams.get('id');
      if (!logisticsId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: EventLogisticsRequest = await req.json();

      const updateData: Record<string, unknown> = {};

      // Only include provided fields
      if (body.logistics_type !== undefined) updateData.logistics_type = body.logistics_type;
      if (body.provider_name !== undefined) updateData.provider_name = body.provider_name;
      if (body.requirements_en !== undefined) updateData.requirements_en = body.requirements_en;
      if (body.requirements_ar !== undefined) updateData.requirements_ar = body.requirements_ar;
      if (body.estimated_cost !== undefined) updateData.estimated_cost = body.estimated_cost;
      if (body.currency !== undefined) updateData.currency = body.currency;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.notes !== undefined) updateData.notes = body.notes;

      const { data, error } = await supabase
        .from('event_logistics')
        .update(updateData)
        .eq('id', logisticsId)
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

    // DELETE - Delete logistics entry
    if (req.method === 'DELETE') {
      const logisticsId = url.searchParams.get('id');
      if (!logisticsId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase.from('event_logistics').delete().eq('id', logisticsId);

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
