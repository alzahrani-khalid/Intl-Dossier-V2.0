/**
 * Organization Contacts Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for organization contacts and focal points
 *
 * Methods:
 * - GET: List contacts for an organization or search focal points
 * - POST: Create new contact
 * - PATCH: Update contact
 * - DELETE: Soft delete contact
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ContactRequest {
  organization_id?: string;
  contact_type?: 'focal_point' | 'general' | 'protocol' | 'technical';
  name_en?: string;
  name_ar?: string;
  title_en?: string;
  title_ar?: string;
  email?: string;
  phone?: string;
  fax?: string;
  is_primary?: boolean;
  is_active?: boolean;
  is_public?: boolean;
  languages?: string[];
  expertise_areas?: string[];
  topics?: string[];
  valid_from?: string;
  valid_until?: string;
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

    // GET - List contacts or search focal points
    if (req.method === 'GET') {
      const contactId = url.searchParams.get('id');
      const organizationId = url.searchParams.get('organization_id');
      const searchQuery = url.searchParams.get('search');

      // Search focal points by expertise
      if (searchQuery && searchQuery.length >= 2) {
        const { data, error } = await supabase
          .from('organization_contacts')
          .select('*')
          .eq('contact_type', 'focal_point')
          .eq('is_active', true)
          .is('deleted_at', null)
          .or(
            `name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,expertise_areas.cs.{${searchQuery}},topics.cs.{${searchQuery}}`
          )
          .limit(20);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }

        // Calculate match scores
        const matches = (data || [])
          .map((c) => {
            let score = 0;
            const queryLower = searchQuery.toLowerCase();

            if (c.name_en?.toLowerCase().includes(queryLower)) score += 10;
            if (c.name_ar?.includes(searchQuery)) score += 10;
            if (c.expertise_areas?.some((e: string) => e.toLowerCase().includes(queryLower)))
              score += 15;
            if (c.topics?.some((t: string) => t.toLowerCase().includes(queryLower))) score += 15;

            return { ...c, match_score: score };
          })
          .sort((a, b) => b.match_score - a.match_score);

        return new Response(JSON.stringify({ data: matches }), { status: 200, headers });
      }

      if (contactId) {
        // Get single contact
        const { data, error } = await supabase
          .from('organization_contacts')
          .select('*')
          .eq('id', contactId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name_en, name_ar')
          .eq('id', data.organization_id)
          .single();

        return new Response(
          JSON.stringify({
            data: {
              ...data,
              organization_name_en: org?.name_en,
              organization_name_ar: org?.name_ar,
            },
          }),
          { status: 200, headers }
        );
      }

      if (!organizationId) {
        return new Response(JSON.stringify({ error: 'organization_id is required' }), {
          status: 400,
          headers,
        });
      }

      // List contacts for organization
      let query = supabase
        .from('organization_contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('is_primary', { ascending: false })
        .order('contact_type', { ascending: true })
        .order('name_en', { ascending: true });

      // Optional filters
      const contactType = url.searchParams.get('contact_type');
      const isActive = url.searchParams.get('is_active');
      const isPublic = url.searchParams.get('is_public');

      if (contactType) {
        query = query.eq('contact_type', contactType);
      }
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }
      if (isPublic !== null) {
        query = query.eq('is_public', isPublic === 'true');
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name_en, name_ar')
        .eq('id', organizationId)
        .single();

      const enrichedData = (data || []).map((c) => ({
        ...c,
        organization_name_en: org?.name_en,
        organization_name_ar: org?.name_ar,
      }));

      return new Response(JSON.stringify({ data: enrichedData, total_count: count || 0 }), {
        status: 200,
        headers,
      });
    }

    // POST - Create contact
    if (req.method === 'POST') {
      const body: ContactRequest = await req.json();

      if (!body.organization_id || !body.name_en || !body.name_ar || !body.contact_type) {
        return new Response(
          JSON.stringify({
            error: 'organization_id, contact_type, name_en, and name_ar are required',
          }),
          { status: 400, headers }
        );
      }

      // If setting as primary, unset existing primary of same type
      if (body.is_primary) {
        await supabase
          .from('organization_contacts')
          .update({ is_primary: false })
          .eq('organization_id', body.organization_id)
          .eq('contact_type', body.contact_type)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('organization_contacts')
        .insert({
          organization_id: body.organization_id,
          contact_type: body.contact_type,
          name_en: body.name_en,
          name_ar: body.name_ar,
          title_en: body.title_en,
          title_ar: body.title_ar,
          email: body.email,
          phone: body.phone,
          fax: body.fax,
          is_primary: body.is_primary || false,
          is_active: body.is_active !== false,
          is_public: body.is_public !== false,
          languages: body.languages || [],
          expertise_areas: body.expertise_areas || [],
          topics: body.topics || [],
          valid_from: body.valid_from,
          valid_until: body.valid_until,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update contact
    if (req.method === 'PATCH') {
      const contactId = url.searchParams.get('id');
      if (!contactId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: ContactRequest = await req.json();

      // If setting as primary, unset existing primary of same type
      if (body.is_primary) {
        // Get current contact to know organization and type
        const { data: current } = await supabase
          .from('organization_contacts')
          .select('organization_id, contact_type')
          .eq('id', contactId)
          .single();

        if (current) {
          await supabase
            .from('organization_contacts')
            .update({ is_primary: false })
            .eq('organization_id', current.organization_id)
            .eq('contact_type', current.contact_type)
            .eq('is_primary', true)
            .neq('id', contactId);
        }
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.contact_type !== undefined) updateData.contact_type = body.contact_type;
      if (body.name_en !== undefined) updateData.name_en = body.name_en;
      if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
      if (body.title_en !== undefined) updateData.title_en = body.title_en;
      if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.fax !== undefined) updateData.fax = body.fax;
      if (body.is_primary !== undefined) updateData.is_primary = body.is_primary;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.is_public !== undefined) updateData.is_public = body.is_public;
      if (body.languages !== undefined) updateData.languages = body.languages;
      if (body.expertise_areas !== undefined) updateData.expertise_areas = body.expertise_areas;
      if (body.topics !== undefined) updateData.topics = body.topics;
      if (body.valid_from !== undefined) updateData.valid_from = body.valid_from;
      if (body.valid_until !== undefined) updateData.valid_until = body.valid_until;

      const { data, error } = await supabase
        .from('organization_contacts')
        .update(updateData)
        .eq('id', contactId)
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

    // DELETE - Soft delete contact
    if (req.method === 'DELETE') {
      const contactId = url.searchParams.get('id');
      if (!contactId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('organization_contacts')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', contactId);

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
