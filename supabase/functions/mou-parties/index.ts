/**
 * MoU Parties Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for MoU parties (signatories, witnesses, guarantors)
 *
 * Methods:
 * - GET: List parties for an MoU
 * - POST: Add party to MoU
 * - PATCH: Update party (e.g., mark as signed)
 * - DELETE: Remove party from MoU
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface MouPartyRequest {
  mou_id?: string;
  party_type?: 'country' | 'organization';
  party_id?: string;
  role?: 'signatory' | 'witness' | 'guarantor';
  signed_at?: string | null;
  signed_by?: string | null;
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

    // GET - List parties for an MoU
    if (req.method === 'GET') {
      const partyId = url.searchParams.get('id');
      const mouId = url.searchParams.get('mou_id');

      if (partyId) {
        // Get single party
        const { data, error } = await supabase
          .from('mou_parties')
          .select('*')
          .eq('id', partyId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Enrich with party name
        if (data.party_type === 'country') {
          const { data: country } = await supabase
            .from('countries')
            .select('name_en, name_ar, flag_url')
            .eq('id', data.party_id)
            .single();

          if (country) {
            data.party_name_en = country.name_en;
            data.party_name_ar = country.name_ar;
            data.party_flag_url = country.flag_url;
          }
        } else {
          const { data: org } = await supabase
            .from('organizations')
            .select('name_en, name_ar, logo_url')
            .eq('id', data.party_id)
            .single();

          if (org) {
            data.party_name_en = org.name_en;
            data.party_name_ar = org.name_ar;
            data.party_logo_url = org.logo_url;
          }
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      if (!mouId) {
        return new Response(JSON.stringify({ error: 'mou_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List parties for MoU
      let query = supabase
        .from('mou_parties')
        .select('*', { count: 'exact' })
        .eq('mou_id', mouId)
        .order('role', { ascending: true });

      // Optional filters
      const role = url.searchParams.get('role');
      const partyType = url.searchParams.get('party_type');

      if (role) {
        query = query.eq('role', role);
      }
      if (partyType) {
        query = query.eq('party_type', partyType);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich with party names
      const enrichedData = await Promise.all(
        (data || []).map(async (party) => {
          if (party.party_type === 'country') {
            const { data: country } = await supabase
              .from('countries')
              .select('name_en, name_ar, flag_url')
              .eq('id', party.party_id)
              .single();

            return {
              ...party,
              party_name_en: country?.name_en,
              party_name_ar: country?.name_ar,
              party_flag_url: country?.flag_url,
            };
          } else {
            const { data: org } = await supabase
              .from('organizations')
              .select('name_en, name_ar, logo_url')
              .eq('id', party.party_id)
              .single();

            return {
              ...party,
              party_name_en: org?.name_en,
              party_name_ar: org?.name_ar,
              party_logo_url: org?.logo_url,
            };
          }
        })
      );

      // Calculate signature status
      const signatories = enrichedData.filter((p) => p.role === 'signatory');
      const signedCount = signatories.filter((p) => p.signed_at).length;

      return new Response(
        JSON.stringify({
          data: enrichedData,
          total_count: count || 0,
          signature_status: {
            total_signatories: signatories.length,
            signed: signedCount,
            pending: signatories.length - signedCount,
            all_signed: signedCount === signatories.length && signatories.length > 0,
          },
        }),
        { status: 200, headers }
      );
    }

    // POST - Add party to MoU
    if (req.method === 'POST') {
      const body: MouPartyRequest = await req.json();

      if (!body.mou_id || !body.party_type || !body.party_id) {
        return new Response(
          JSON.stringify({ error: 'mou_id, party_type, and party_id are required' }),
          { status: 400, headers }
        );
      }

      // Check if party already exists for this MoU
      const { data: existing } = await supabase
        .from('mou_parties')
        .select('id')
        .eq('mou_id', body.mou_id)
        .eq('party_type', body.party_type)
        .eq('party_id', body.party_id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This party is already associated with the MoU' }),
          { status: 409, headers }
        );
      }

      const { data, error } = await supabase
        .from('mou_parties')
        .insert({
          mou_id: body.mou_id,
          party_type: body.party_type,
          party_id: body.party_id,
          role: body.role || 'signatory',
          signed_at: body.signed_at || null,
          signed_by: body.signed_by || null,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update party (e.g., record signature)
    if (req.method === 'PATCH') {
      const partyId = url.searchParams.get('id');
      if (!partyId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: MouPartyRequest = await req.json();

      const updateData: Record<string, unknown> = {};

      // Only include provided fields
      if (body.role !== undefined) updateData.role = body.role;
      if (body.signed_at !== undefined) updateData.signed_at = body.signed_at;
      if (body.signed_by !== undefined) updateData.signed_by = body.signed_by;

      const { data, error } = await supabase
        .from('mou_parties')
        .update(updateData)
        .eq('id', partyId)
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

    // DELETE - Remove party from MoU
    if (req.method === 'DELETE') {
      const partyId = url.searchParams.get('id');
      if (!partyId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase.from('mou_parties').delete().eq('id', partyId);

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
