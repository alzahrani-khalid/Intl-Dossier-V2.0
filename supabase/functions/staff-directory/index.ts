/**
 * Staff Directory Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for staff contacts and directory management
 *
 * Methods:
 * - GET: List staff, search by department/specialization, get single staff
 * - POST: Create new staff entry
 * - PATCH: Update staff entry
 * - DELETE: Soft delete staff entry
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface StaffRequest {
  department_id?: string;
  user_id?: string | null;
  name_en?: string;
  name_ar?: string;
  title_en?: string;
  title_ar?: string;
  email?: string;
  phone?: string;
  extension?: string;
  is_active?: boolean;
  specializations?: string[];
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

    // GET - List, search, or get single staff
    if (req.method === 'GET') {
      const staffId = url.searchParams.get('id');
      const departmentId = url.searchParams.get('department_id');
      const searchQuery = url.searchParams.get('search');

      // Search staff by name or specialization
      if (searchQuery && searchQuery.length >= 2) {
        const { data, error } = await supabase
          .from('staff_contacts')
          .select('*')
          .eq('is_active', true)
          .or(
            `name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,specializations.cs.{${searchQuery}}`
          )
          .limit(20);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }

        // Enrich with department names
        const enrichedData = await Promise.all(
          (data || []).map(async (staff) => {
            const { data: dept } = await supabase
              .from('departments')
              .select('name_en, name_ar')
              .eq('id', staff.department_id)
              .single();

            return {
              ...staff,
              department_name_en: dept?.name_en,
              department_name_ar: dept?.name_ar,
            };
          })
        );

        return new Response(JSON.stringify({ data: enrichedData }), { status: 200, headers });
      }

      if (staffId) {
        // Get single staff entry
        const { data, error } = await supabase
          .from('staff_contacts')
          .select('*')
          .eq('id', staffId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Get department name
        const { data: dept } = await supabase
          .from('departments')
          .select('name_en, name_ar')
          .eq('id', data.department_id)
          .single();

        // Get active delegations
        const { data: delegations } = await supabase
          .from('permission_delegations')
          .select('*')
          .eq('delegate_id', data.user_id)
          .gte('expires_at', new Date().toISOString())
          .eq('is_revoked', false);

        // Get topic assignments
        const { data: topics } = await supabase
          .from('staff_topic_assignments')
          .select('*, topics(name_en, name_ar)')
          .eq('staff_id', staffId);

        return new Response(
          JSON.stringify({
            data: {
              ...data,
              department_name_en: dept?.name_en,
              department_name_ar: dept?.name_ar,
              active_delegations: delegations || [],
              topic_assignments: topics || [],
            },
          }),
          { status: 200, headers }
        );
      }

      // List staff by department
      let query = supabase
        .from('staff_contacts')
        .select('*', { count: 'exact' })
        .order('name_en', { ascending: true });

      // Optional filters
      const isActive = url.searchParams.get('is_active');
      const specialization = url.searchParams.get('specialization');

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      } else {
        query = query.eq('is_active', true); // Default to active only
      }
      if (specialization) {
        query = query.contains('specializations', [specialization]);
      }

      // Pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('page_size') || '50');
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Enrich with department names
      const enrichedData = await Promise.all(
        (data || []).map(async (staff) => {
          const { data: dept } = await supabase
            .from('departments')
            .select('name_en, name_ar')
            .eq('id', staff.department_id)
            .single();

          return {
            ...staff,
            department_name_en: dept?.name_en,
            department_name_ar: dept?.name_ar,
          };
        })
      );

      return new Response(
        JSON.stringify({
          data: enrichedData,
          total_count: count || 0,
          page,
          page_size: pageSize,
        }),
        { status: 200, headers }
      );
    }

    // POST - Create staff entry
    if (req.method === 'POST') {
      const body: StaffRequest = await req.json();

      if (!body.department_id || !body.name_en || !body.name_ar || !body.email) {
        return new Response(
          JSON.stringify({ error: 'department_id, name_en, name_ar, and email are required' }),
          { status: 400, headers }
        );
      }

      // Check for duplicate email
      const { data: existing } = await supabase
        .from('staff_contacts')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A staff entry with this email already exists' }),
          { status: 409, headers }
        );
      }

      const { data, error } = await supabase
        .from('staff_contacts')
        .insert({
          department_id: body.department_id,
          user_id: body.user_id || null,
          name_en: body.name_en,
          name_ar: body.name_ar,
          title_en: body.title_en,
          title_ar: body.title_ar,
          email: body.email,
          phone: body.phone,
          extension: body.extension,
          is_active: body.is_active !== false,
          specializations: body.specializations || [],
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update staff entry
    if (req.method === 'PATCH') {
      const staffId = url.searchParams.get('id');
      if (!staffId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: StaffRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.department_id !== undefined) updateData.department_id = body.department_id;
      if (body.user_id !== undefined) updateData.user_id = body.user_id;
      if (body.name_en !== undefined) updateData.name_en = body.name_en;
      if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
      if (body.title_en !== undefined) updateData.title_en = body.title_en;
      if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.extension !== undefined) updateData.extension = body.extension;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.specializations !== undefined) updateData.specializations = body.specializations;

      const { data, error } = await supabase
        .from('staff_contacts')
        .update(updateData)
        .eq('id', staffId)
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

    // DELETE - Soft delete staff entry
    if (req.method === 'DELETE') {
      const staffId = url.searchParams.get('id');
      if (!staffId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('staff_contacts')
        .update({ is_active: false })
        .eq('id', staffId);

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
