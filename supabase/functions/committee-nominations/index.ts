/**
 * Committee Nominations Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for committee nominations with approval workflow
 *
 * Methods:
 * - GET: List nominations for a committee or get single nomination
 * - POST: Create new nomination
 * - PATCH: Update nomination (including approve/reject)
 * - DELETE: Delete nomination
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface NominationRequest {
  committee_id?: string;
  nominated_person_id?: string | null;
  external_name_en?: string;
  external_name_ar?: string;
  nominated_by_org_id?: string;
  nomination_date?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  term_start?: string;
  term_end?: string;
  role?: 'chair' | 'vice_chair' | 'member' | 'observer';
  justification_en?: string;
  justification_ar?: string;
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

    // GET - List nominations
    if (req.method === 'GET') {
      const nominationId = url.searchParams.get('id');
      const committeeId = url.searchParams.get('committee_id');

      if (nominationId) {
        // Get single nomination
        const { data, error } = await supabase
          .from('committee_nominations')
          .select('*')
          .eq('id', nominationId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Enrich with person name
        if (data.nominated_person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar, photo_url')
            .eq('id', data.nominated_person_id)
            .single();

          if (person) {
            data.nominee_name_en = person.name_en;
            data.nominee_name_ar = person.name_ar;
            data.nominee_photo_url = person.photo_url;
          }
        } else {
          data.nominee_name_en = data.external_name_en;
          data.nominee_name_ar = data.external_name_ar;
        }

        // Enrich with organization name
        if (data.nominated_by_org_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name_en, name_ar')
            .eq('id', data.nominated_by_org_id)
            .single();

          if (org) {
            data.nominating_org_name_en = org.name_en;
            data.nominating_org_name_ar = org.name_ar;
          }
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      if (!committeeId) {
        return new Response(JSON.stringify({ error: 'committee_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List nominations for committee
      let query = supabase
        .from('committee_nominations')
        .select('*', { count: 'exact' })
        .eq('committee_id', committeeId)
        .order('nomination_date', { ascending: false });

      // Optional filters
      const status = url.searchParams.get('status');
      const role = url.searchParams.get('role');

      if (status) {
        query = query.eq('status', status);
      }
      if (role) {
        query = query.eq('role', role);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich with names
      const enrichedData = await Promise.all(
        (data || []).map(async (nomination) => {
          let nomineeInfo = {};
          let orgInfo = {};

          if (nomination.nominated_person_id) {
            const { data: person } = await supabase
              .from('persons')
              .select('name_en, name_ar, photo_url')
              .eq('id', nomination.nominated_person_id)
              .single();

            if (person) {
              nomineeInfo = {
                nominee_name_en: person.name_en,
                nominee_name_ar: person.name_ar,
                nominee_photo_url: person.photo_url,
              };
            }
          } else {
            nomineeInfo = {
              nominee_name_en: nomination.external_name_en,
              nominee_name_ar: nomination.external_name_ar,
            };
          }

          if (nomination.nominated_by_org_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name_en, name_ar')
              .eq('id', nomination.nominated_by_org_id)
              .single();

            if (org) {
              orgInfo = {
                nominating_org_name_en: org.name_en,
                nominating_org_name_ar: org.name_ar,
              };
            }
          }

          return { ...nomination, ...nomineeInfo, ...orgInfo };
        })
      );

      // Calculate summary statistics
      const statusCounts = {
        pending: enrichedData.filter((n) => n.status === 'pending').length,
        approved: enrichedData.filter((n) => n.status === 'approved').length,
        rejected: enrichedData.filter((n) => n.status === 'rejected').length,
        withdrawn: enrichedData.filter((n) => n.status === 'withdrawn').length,
      };

      return new Response(
        JSON.stringify({
          data: enrichedData,
          total_count: count || 0,
          status_summary: statusCounts,
        }),
        { status: 200, headers }
      );
    }

    // POST - Create nomination
    if (req.method === 'POST') {
      const body: NominationRequest = await req.json();

      if (!body.committee_id || !body.nomination_date) {
        return new Response(
          JSON.stringify({ error: 'committee_id and nomination_date are required' }),
          { status: 400, headers }
        );
      }

      // Validate that either person_id or external_name is provided
      if (!body.nominated_person_id && !body.external_name_en) {
        return new Response(
          JSON.stringify({ error: 'Either nominated_person_id or external_name_en is required' }),
          { status: 400, headers }
        );
      }

      // Check if this person is already nominated for this committee
      if (body.nominated_person_id) {
        const { data: existing } = await supabase
          .from('committee_nominations')
          .select('id')
          .eq('committee_id', body.committee_id)
          .eq('nominated_person_id', body.nominated_person_id)
          .not('status', 'in', '(rejected,withdrawn)')
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'This person is already nominated for this committee' }),
            { status: 409, headers }
          );
        }
      }

      const { data, error } = await supabase
        .from('committee_nominations')
        .insert({
          committee_id: body.committee_id,
          nominated_person_id: body.nominated_person_id || null,
          external_name_en: body.external_name_en,
          external_name_ar: body.external_name_ar,
          nominated_by_org_id: body.nominated_by_org_id,
          nomination_date: body.nomination_date,
          status: body.status || 'pending',
          term_start: body.term_start,
          term_end: body.term_end,
          role: body.role || 'member',
          justification_en: body.justification_en,
          justification_ar: body.justification_ar,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update nomination (including approve/reject)
    if (req.method === 'PATCH') {
      const nominationId = url.searchParams.get('id');
      if (!nominationId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: NominationRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.nominated_person_id !== undefined)
        updateData.nominated_person_id = body.nominated_person_id;
      if (body.external_name_en !== undefined) updateData.external_name_en = body.external_name_en;
      if (body.external_name_ar !== undefined) updateData.external_name_ar = body.external_name_ar;
      if (body.nominated_by_org_id !== undefined)
        updateData.nominated_by_org_id = body.nominated_by_org_id;
      if (body.nomination_date !== undefined) updateData.nomination_date = body.nomination_date;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.term_start !== undefined) updateData.term_start = body.term_start;
      if (body.term_end !== undefined) updateData.term_end = body.term_end;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.justification_en !== undefined) updateData.justification_en = body.justification_en;
      if (body.justification_ar !== undefined) updateData.justification_ar = body.justification_ar;

      // Get current nomination
      const { data: current, error: fetchError } = await supabase
        .from('committee_nominations')
        .select('committee_id, nominated_person_id, external_name_en, external_name_ar')
        .eq('id', nominationId)
        .single();

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: fetchError.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      const { data, error } = await supabase
        .from('committee_nominations')
        .update(updateData)
        .eq('id', nominationId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // If approved, create committee member
      if (body.status === 'approved' && current) {
        await supabase.from('committee_members').insert({
          committee_id: current.committee_id,
          person_id: current.nominated_person_id,
          external_name_en: current.external_name_en,
          external_name_ar: current.external_name_ar,
          role: body.role || 'member',
          term_start: body.term_start,
          term_end: body.term_end,
          nomination_id: nominationId,
          joined_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({ data }), { status: 200, headers });
    }

    // DELETE - Delete nomination
    if (req.method === 'DELETE') {
      const nominationId = url.searchParams.get('id');
      if (!nominationId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('committee_nominations')
        .delete()
        .eq('id', nominationId);

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
