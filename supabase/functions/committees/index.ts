/**
 * Committees Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for committees (jury, steering, technical, advisory)
 *
 * Methods:
 * - GET: List committees or get single committee with members
 * - POST: Create new committee
 * - PATCH: Update committee
 * - DELETE: Soft delete committee
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface CommitteeRequest {
  forum_id?: string | null;
  committee_type?: 'jury' | 'steering' | 'technical' | 'advisory';
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  member_count?: number;
  term_start?: string;
  term_end?: string;
  is_active?: boolean;
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

    // GET - List or get single committee
    if (req.method === 'GET') {
      const committeeId = url.searchParams.get('id');
      const forumId = url.searchParams.get('forum_id');

      if (committeeId) {
        // Get single committee with members
        const { data: committee, error } = await supabase
          .from('committees')
          .select('*')
          .eq('id', committeeId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Get members
        const { data: members } = await supabase
          .from('committee_members')
          .select('*')
          .eq('committee_id', committeeId)
          .order('role', { ascending: true });

        // Enrich members with person names
        const enrichedMembers = await Promise.all(
          (members || []).map(async (member) => {
            if (member.person_id) {
              const { data: person } = await supabase
                .from('persons')
                .select('name_en, name_ar, photo_url')
                .eq('id', member.person_id)
                .single();

              return {
                ...member,
                member_name_en: person?.name_en,
                member_name_ar: person?.name_ar,
                photo_url: person?.photo_url,
              };
            }
            return {
              ...member,
              member_name_en: member.external_name_en,
              member_name_ar: member.external_name_ar,
            };
          })
        );

        // Get nominations
        const { data: nominations } = await supabase
          .from('committee_nominations')
          .select('*')
          .eq('committee_id', committeeId)
          .order('nomination_date', { ascending: false });

        // Get forum name if linked
        let forumName = null;
        if (committee.forum_id) {
          const { data: forum } = await supabase
            .from('forums')
            .select('name_en, name_ar')
            .eq('id', committee.forum_id)
            .single();

          forumName = forum;
        }

        return new Response(
          JSON.stringify({
            data: {
              ...committee,
              forum_name_en: forumName?.name_en,
              forum_name_ar: forumName?.name_ar,
              members: enrichedMembers,
              nominations: nominations || [],
              current_member_count: enrichedMembers.length,
            },
          }),
          { status: 200, headers }
        );
      }

      // List committees
      let query = supabase
        .from('committees')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('is_active', { ascending: false })
        .order('name_en', { ascending: true });

      // Optional filters
      const committeeType = url.searchParams.get('committee_type');
      const isActive = url.searchParams.get('is_active');

      if (forumId) {
        query = query.eq('forum_id', forumId);
      }
      if (committeeType) {
        query = query.eq('committee_type', committeeType);
      }
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Get member counts for each committee
      const enrichedData = await Promise.all(
        (data || []).map(async (committee) => {
          const { count: memberCount } = await supabase
            .from('committee_members')
            .select('*', { count: 'exact', head: true })
            .eq('committee_id', committee.id);

          return {
            ...committee,
            current_member_count: memberCount || 0,
          };
        })
      );

      return new Response(JSON.stringify({ data: enrichedData, total_count: count || 0 }), {
        status: 200,
        headers,
      });
    }

    // POST - Create committee
    if (req.method === 'POST') {
      const body: CommitteeRequest = await req.json();

      if (!body.committee_type || !body.name_en || !body.name_ar) {
        return new Response(
          JSON.stringify({ error: 'committee_type, name_en, and name_ar are required' }),
          { status: 400, headers }
        );
      }

      const { data, error } = await supabase
        .from('committees')
        .insert({
          forum_id: body.forum_id || null,
          committee_type: body.committee_type,
          name_en: body.name_en,
          name_ar: body.name_ar,
          description_en: body.description_en,
          description_ar: body.description_ar,
          member_count: body.member_count,
          term_start: body.term_start,
          term_end: body.term_end,
          is_active: body.is_active !== false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update committee
    if (req.method === 'PATCH') {
      const committeeId = url.searchParams.get('id');
      if (!committeeId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: CommitteeRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.forum_id !== undefined) updateData.forum_id = body.forum_id;
      if (body.committee_type !== undefined) updateData.committee_type = body.committee_type;
      if (body.name_en !== undefined) updateData.name_en = body.name_en;
      if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
      if (body.description_en !== undefined) updateData.description_en = body.description_en;
      if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
      if (body.member_count !== undefined) updateData.member_count = body.member_count;
      if (body.term_start !== undefined) updateData.term_start = body.term_start;
      if (body.term_end !== undefined) updateData.term_end = body.term_end;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;

      const { data, error } = await supabase
        .from('committees')
        .update(updateData)
        .eq('id', committeeId)
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

    // DELETE - Soft delete committee
    if (req.method === 'DELETE') {
      const committeeId = url.searchParams.get('id');
      if (!committeeId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('committees')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', committeeId);

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
