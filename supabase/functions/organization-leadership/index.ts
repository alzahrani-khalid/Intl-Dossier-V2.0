/**
 * Organization Leadership Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for organization leadership tracking
 *
 * Methods:
 * - GET: List leadership for an organization or get single record
 * - POST: Create new leadership record
 * - PATCH: Update leadership record
 * - DELETE: Soft delete leadership record
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface LeadershipRequest {
  organization_id?: string;
  person_id?: string | null;
  external_name_en?: string;
  external_name_ar?: string;
  position_title_en?: string;
  position_title_ar?: string;
  position_level?: 'head' | 'deputy' | 'director' | 'manager' | 'board_member';
  start_date?: string;
  end_date?: string | null;
  is_current?: boolean;
  achievements?: string[];
  notes_en?: string;
  notes_ar?: string;
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

    // GET - List or get single leadership record
    if (req.method === 'GET') {
      const leadershipId = url.searchParams.get('id');
      const organizationId = url.searchParams.get('organization_id');
      const changesOnly = url.searchParams.get('changes') === 'true';
      const days = parseInt(url.searchParams.get('days') || '30');

      // Get recent leadership changes across organizations
      if (changesOnly) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Get recently appointed leaders
        const { data: newLeaders, error: newError } = await supabase
          .from('organization_leadership')
          .select('*')
          .gte('start_date', cutoffDate.toISOString())
          .is('deleted_at', null)
          .order('start_date', { ascending: false });

        if (newError) {
          return new Response(JSON.stringify({ error: newError.message }), {
            status: 500,
            headers,
          });
        }

        // Get recently departed leaders
        const { data: endedLeaders, error: endError } = await supabase
          .from('organization_leadership')
          .select('*')
          .gte('end_date', cutoffDate.toISOString())
          .is('deleted_at', null)
          .order('end_date', { ascending: false });

        if (endError) {
          return new Response(JSON.stringify({ error: endError.message }), {
            status: 500,
            headers,
          });
        }

        return new Response(
          JSON.stringify({
            appointed: newLeaders || [],
            departed: endedLeaders || [],
          }),
          { status: 200, headers }
        );
      }

      if (leadershipId) {
        // Get single leadership record
        const { data, error } = await supabase
          .from('organization_leadership')
          .select('*')
          .eq('id', leadershipId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Enrich with person data if linked
        if (data.person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar, photo_url')
            .eq('id', data.person_id)
            .single();

          if (person) {
            data.leader_name_en = person.name_en;
            data.leader_name_ar = person.name_ar;
            data.photo_url = person.photo_url;
          }
        } else {
          data.leader_name_en = data.external_name_en;
          data.leader_name_ar = data.external_name_ar;
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      if (!organizationId) {
        return new Response(JSON.stringify({ error: 'organization_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List leadership for organization
      let query = supabase
        .from('organization_leadership')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false });

      // Optional filters
      const currentOnly = url.searchParams.get('current_only') === 'true';
      const positionLevel = url.searchParams.get('position_level');

      if (currentOnly) {
        query = query.eq('is_current', true);
      }
      if (positionLevel) {
        query = query.eq('position_level', positionLevel);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich with person names
      const enrichedData = await Promise.all(
        (data || []).map(async (leader) => {
          if (leader.person_id) {
            const { data: person } = await supabase
              .from('persons')
              .select('name_en, name_ar, photo_url')
              .eq('id', leader.person_id)
              .single();

            if (person) {
              return {
                ...leader,
                leader_name_en: person.name_en,
                leader_name_ar: person.name_ar,
                photo_url: person.photo_url,
              };
            }
          }
          return {
            ...leader,
            leader_name_en: leader.external_name_en,
            leader_name_ar: leader.external_name_ar,
          };
        })
      );

      return new Response(JSON.stringify({ data: enrichedData, total_count: count || 0 }), {
        status: 200,
        headers,
      });
    }

    // POST - Create leadership record
    if (req.method === 'POST') {
      const body: LeadershipRequest = await req.json();

      if (
        !body.organization_id ||
        !body.position_title_en ||
        !body.position_title_ar ||
        !body.start_date
      ) {
        return new Response(
          JSON.stringify({
            error:
              'organization_id, position_title_en, position_title_ar, and start_date are required',
          }),
          { status: 400, headers }
        );
      }

      // Validate that either person_id or external_name is provided
      if (!body.person_id && !body.external_name_en) {
        return new Response(
          JSON.stringify({ error: 'Either person_id or external_name_en is required' }),
          { status: 400, headers }
        );
      }

      // If this is a current leader, mark existing current leaders at same level as not current
      const isCurrent = !body.end_date;
      if (isCurrent) {
        await supabase
          .from('organization_leadership')
          .update({
            is_current: false,
            end_date: new Date().toISOString(),
          })
          .eq('organization_id', body.organization_id)
          .eq('position_level', body.position_level || 'head')
          .eq('is_current', true);
      }

      const { data, error } = await supabase
        .from('organization_leadership')
        .insert({
          organization_id: body.organization_id,
          person_id: body.person_id || null,
          external_name_en: body.external_name_en,
          external_name_ar: body.external_name_ar,
          position_title_en: body.position_title_en,
          position_title_ar: body.position_title_ar,
          position_level: body.position_level || 'head',
          start_date: body.start_date,
          end_date: body.end_date || null,
          is_current: isCurrent,
          achievements: body.achievements || [],
          notes_en: body.notes_en,
          notes_ar: body.notes_ar,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update leadership record
    if (req.method === 'PATCH') {
      const leadershipId = url.searchParams.get('id');
      if (!leadershipId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: LeadershipRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.person_id !== undefined) updateData.person_id = body.person_id;
      if (body.external_name_en !== undefined) updateData.external_name_en = body.external_name_en;
      if (body.external_name_ar !== undefined) updateData.external_name_ar = body.external_name_ar;
      if (body.position_title_en !== undefined)
        updateData.position_title_en = body.position_title_en;
      if (body.position_title_ar !== undefined)
        updateData.position_title_ar = body.position_title_ar;
      if (body.position_level !== undefined) updateData.position_level = body.position_level;
      if (body.start_date !== undefined) updateData.start_date = body.start_date;
      if (body.end_date !== undefined) {
        updateData.end_date = body.end_date;
        updateData.is_current = body.end_date === null;
      }
      if (body.is_current !== undefined) updateData.is_current = body.is_current;
      if (body.achievements !== undefined) updateData.achievements = body.achievements;
      if (body.notes_en !== undefined) updateData.notes_en = body.notes_en;
      if (body.notes_ar !== undefined) updateData.notes_ar = body.notes_ar;

      const { data, error } = await supabase
        .from('organization_leadership')
        .update(updateData)
        .eq('id', leadershipId)
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

    // DELETE - Soft delete leadership record
    if (req.method === 'DELETE') {
      const leadershipId = url.searchParams.get('id');
      if (!leadershipId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('organization_leadership')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', leadershipId);

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
