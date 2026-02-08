/**
 * Correspondence Participants Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for tracking multi-party correspondence chains
 *
 * Methods:
 * - GET: List participants for a correspondence
 * - POST: Add participant to correspondence
 * - DELETE: Remove participant from correspondence
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ParticipantRequest {
  correspondence_id?: string;
  participant_type?: 'sender' | 'recipient' | 'cc' | 'bcc';
  entity_type?: 'organization' | 'person' | 'department';
  entity_id?: string;
  role_en?: string;
  role_ar?: string;
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

    // GET - List participants for a correspondence
    if (req.method === 'GET') {
      const participantId = url.searchParams.get('id');
      const correspondenceId = url.searchParams.get('correspondence_id');

      if (participantId) {
        // Get single participant
        const { data, error } = await supabase
          .from('correspondence_participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Enrich with entity name
        const enrichedData = await enrichParticipant(supabase, data);

        return new Response(JSON.stringify({ data: enrichedData }), { status: 200, headers });
      }

      if (!correspondenceId) {
        return new Response(JSON.stringify({ error: 'correspondence_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List participants for correspondence
      let query = supabase
        .from('correspondence_participants')
        .select('*', { count: 'exact' })
        .eq('correspondence_id', correspondenceId)
        .order('participant_type', { ascending: true });

      // Optional filter by participant type
      const participantType = url.searchParams.get('participant_type');
      if (participantType) {
        query = query.eq('participant_type', participantType);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich all participants with entity names
      const enrichedData = await Promise.all(
        (data || []).map((p) => enrichParticipant(supabase, p))
      );

      // Group by participant type
      const grouped = {
        sender: enrichedData.filter((p) => p.participant_type === 'sender'),
        recipients: enrichedData.filter((p) => p.participant_type === 'recipient'),
        cc: enrichedData.filter((p) => p.participant_type === 'cc'),
        bcc: enrichedData.filter((p) => p.participant_type === 'bcc'),
      };

      return new Response(
        JSON.stringify({
          data: enrichedData,
          grouped,
          total_count: count || 0,
        }),
        { status: 200, headers }
      );
    }

    // POST - Add participant to correspondence
    if (req.method === 'POST') {
      const body: ParticipantRequest = await req.json();

      if (
        !body.correspondence_id ||
        !body.participant_type ||
        !body.entity_type ||
        !body.entity_id
      ) {
        return new Response(
          JSON.stringify({
            error: 'correspondence_id, participant_type, entity_type, and entity_id are required',
          }),
          { status: 400, headers }
        );
      }

      // Check if this participant already exists
      const { data: existing } = await supabase
        .from('correspondence_participants')
        .select('id')
        .eq('correspondence_id', body.correspondence_id)
        .eq('entity_type', body.entity_type)
        .eq('entity_id', body.entity_id)
        .eq('participant_type', body.participant_type)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This participant is already added to the correspondence' }),
          { status: 409, headers }
        );
      }

      const { data, error } = await supabase
        .from('correspondence_participants')
        .insert({
          correspondence_id: body.correspondence_id,
          participant_type: body.participant_type,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          role_en: body.role_en,
          role_ar: body.role_ar,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich with entity name
      const enrichedData = await enrichParticipant(supabase, data);

      return new Response(JSON.stringify({ data: enrichedData }), { status: 201, headers });
    }

    // PATCH - Update participant
    if (req.method === 'PATCH') {
      const participantId = url.searchParams.get('id');
      if (!participantId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: ParticipantRequest = await req.json();

      const updateData: Record<string, unknown> = {};

      // Only include provided fields
      if (body.participant_type !== undefined) updateData.participant_type = body.participant_type;
      if (body.role_en !== undefined) updateData.role_en = body.role_en;
      if (body.role_ar !== undefined) updateData.role_ar = body.role_ar;

      const { data, error } = await supabase
        .from('correspondence_participants')
        .update(updateData)
        .eq('id', participantId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      const enrichedData = await enrichParticipant(supabase, data);

      return new Response(JSON.stringify({ data: enrichedData }), { status: 200, headers });
    }

    // DELETE - Remove participant from correspondence
    if (req.method === 'DELETE') {
      const participantId = url.searchParams.get('id');
      if (!participantId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('correspondence_participants')
        .delete()
        .eq('id', participantId);

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

// Helper function to enrich participant with entity name
async function enrichParticipant(supabase: any, participant: any) {
  const result = { ...participant };

  switch (participant.entity_type) {
    case 'organization': {
      const { data: org } = await supabase
        .from('organizations')
        .select('name_en, name_ar, logo_url')
        .eq('id', participant.entity_id)
        .single();

      if (org) {
        result.entity_name_en = org.name_en;
        result.entity_name_ar = org.name_ar;
        result.entity_logo_url = org.logo_url;
      }
      break;
    }
    case 'person': {
      const { data: person } = await supabase
        .from('persons')
        .select('name_en, name_ar, photo_url')
        .eq('id', participant.entity_id)
        .single();

      if (person) {
        result.entity_name_en = person.name_en;
        result.entity_name_ar = person.name_ar;
        result.entity_photo_url = person.photo_url;
      }
      break;
    }
    case 'department': {
      const { data: dept } = await supabase
        .from('departments')
        .select('name_en, name_ar')
        .eq('id', participant.entity_id)
        .single();

      if (dept) {
        result.entity_name_en = dept.name_en;
        result.entity_name_ar = dept.name_ar;
      }
      break;
    }
  }

  return result;
}
