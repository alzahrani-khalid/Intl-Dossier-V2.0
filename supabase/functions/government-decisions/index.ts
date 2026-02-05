/**
 * Government Decisions Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * CRUD operations for government decisions (cabinet resolutions, royal decrees, ministerial orders)
 *
 * Methods:
 * - GET: List decisions or get single decision
 * - POST: Create new decision
 * - PATCH: Update decision
 * - DELETE: Soft delete decision
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface GovernmentDecisionRequest {
  decision_type?: 'cabinet_resolution' | 'royal_decree' | 'ministerial_order';
  reference_number?: string;
  title_en?: string;
  title_ar?: string;
  decision_date?: string;
  decision_date_hijri?: string;
  summary_en?: string;
  summary_ar?: string;
  related_mou_id?: string | null;
  related_dossier_id?: string | null;
  document_url?: string;
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

    // GET - List or get single decision
    if (req.method === 'GET') {
      const decisionId = url.searchParams.get('id');
      const mouId = url.searchParams.get('mou_id');
      const dossierId = url.searchParams.get('dossier_id');

      if (decisionId) {
        // Get single decision
        const { data, error } = await supabase
          .from('government_decisions')
          .select('*')
          .eq('id', decisionId)
          .is('deleted_at', null)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.code === 'PGRST116' ? 404 : 500,
            headers,
          });
        }

        // Enrich with MoU title if linked
        if (data.related_mou_id) {
          const { data: mou } = await supabase
            .from('mous')
            .select('title_en, title_ar')
            .eq('id', data.related_mou_id)
            .single();

          if (mou) {
            data.mou_title_en = mou.title_en;
            data.mou_title_ar = mou.title_ar;
          }
        }

        // Enrich with dossier title if linked
        if (data.related_dossier_id) {
          const { data: dossier } = await supabase
            .from('dossiers')
            .select('title_en, title_ar')
            .eq('id', data.related_dossier_id)
            .single();

          if (dossier) {
            data.dossier_title_en = dossier.title_en;
            data.dossier_title_ar = dossier.title_ar;
          }
        }

        return new Response(JSON.stringify({ data }), { status: 200, headers });
      }

      // List decisions
      let query = supabase
        .from('government_decisions')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('decision_date', { ascending: false });

      // Optional filters
      const decisionType = url.searchParams.get('decision_type');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');
      const searchQuery = url.searchParams.get('search');

      if (mouId) {
        query = query.eq('related_mou_id', mouId);
      }
      if (dossierId) {
        query = query.eq('related_dossier_id', dossierId);
      }
      if (decisionType) {
        query = query.eq('decision_type', decisionType);
      }
      if (dateFrom) {
        query = query.gte('decision_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('decision_date', dateTo);
      }
      if (searchQuery) {
        query = query.or(
          `title_en.ilike.%${searchQuery}%,title_ar.ilike.%${searchQuery}%,reference_number.ilike.%${searchQuery}%`
        );
      }

      // Pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('page_size') || '20');
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(
        JSON.stringify({
          data: data || [],
          total_count: count || 0,
          page,
          page_size: pageSize,
        }),
        { status: 200, headers }
      );
    }

    // POST - Create decision
    if (req.method === 'POST') {
      const body: GovernmentDecisionRequest = await req.json();

      if (
        !body.decision_type ||
        !body.reference_number ||
        !body.title_en ||
        !body.title_ar ||
        !body.decision_date
      ) {
        return new Response(
          JSON.stringify({
            error:
              'decision_type, reference_number, title_en, title_ar, and decision_date are required',
          }),
          { status: 400, headers }
        );
      }

      // Check for duplicate reference number
      const { data: existing } = await supabase
        .from('government_decisions')
        .select('id')
        .eq('reference_number', body.reference_number)
        .eq('decision_type', body.decision_type)
        .is('deleted_at', null)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'A decision with this reference number already exists' }),
          { status: 409, headers }
        );
      }

      const { data, error } = await supabase
        .from('government_decisions')
        .insert({
          decision_type: body.decision_type,
          reference_number: body.reference_number,
          title_en: body.title_en,
          title_ar: body.title_ar,
          decision_date: body.decision_date,
          decision_date_hijri: body.decision_date_hijri,
          summary_en: body.summary_en,
          summary_ar: body.summary_ar,
          related_mou_id: body.related_mou_id || null,
          related_dossier_id: body.related_dossier_id || null,
          document_url: body.document_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // If linked to MoU, update MoU with decision reference
      if (body.related_mou_id && body.decision_type === 'cabinet_resolution') {
        await supabase
          .from('mous')
          .update({ cabinet_decision_ref: body.reference_number })
          .eq('id', body.related_mou_id);
      } else if (body.related_mou_id && body.decision_type === 'royal_decree') {
        await supabase
          .from('mous')
          .update({ royal_decree_ref: body.reference_number })
          .eq('id', body.related_mou_id);
      }

      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PATCH - Update decision
    if (req.method === 'PATCH') {
      const decisionId = url.searchParams.get('id');
      if (!decisionId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const body: GovernmentDecisionRequest = await req.json();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields
      if (body.decision_type !== undefined) updateData.decision_type = body.decision_type;
      if (body.reference_number !== undefined) updateData.reference_number = body.reference_number;
      if (body.title_en !== undefined) updateData.title_en = body.title_en;
      if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
      if (body.decision_date !== undefined) updateData.decision_date = body.decision_date;
      if (body.decision_date_hijri !== undefined)
        updateData.decision_date_hijri = body.decision_date_hijri;
      if (body.summary_en !== undefined) updateData.summary_en = body.summary_en;
      if (body.summary_ar !== undefined) updateData.summary_ar = body.summary_ar;
      if (body.related_mou_id !== undefined) updateData.related_mou_id = body.related_mou_id;
      if (body.related_dossier_id !== undefined)
        updateData.related_dossier_id = body.related_dossier_id;
      if (body.document_url !== undefined) updateData.document_url = body.document_url;

      const { data, error } = await supabase
        .from('government_decisions')
        .update(updateData)
        .eq('id', decisionId)
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

    // DELETE - Soft delete decision
    if (req.method === 'DELETE') {
      const decisionId = url.searchParams.get('id');
      if (!decisionId) {
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers });
      }

      const { error } = await supabase
        .from('government_decisions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', decisionId);

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
