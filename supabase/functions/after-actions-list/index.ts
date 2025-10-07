// T045: Supabase Edge Function for GET /dossiers/{dossierId}/after-actions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const dossierId = pathSegments[pathSegments.indexOf('dossiers') + 1];

    if (!dossierId) {
      return new Response(
        JSON.stringify({ error: 'Dossier ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate status filter
    if (status && !['draft', 'published', 'edit_requested', 'edit_approved'].includes(status)) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Invalid status filter. Must be one of: draft, published, edit_requested, edit_approved'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Limit must be between 1 and 100'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query with filters
    let query = supabaseClient
      .from('after_action_records')
      .select(`
        *,
        decisions (*),
        commitments:aa_commitments (*),
        risks:aa_risks (*),
        follow_up_actions:aa_follow_up_actions (*)
      `, { count: 'exact' })
      .eq('dossier_id', dossierId);

    // Apply status filter if provided
    if (status) {
      query = query.eq('publication_status', status);
    }

    // Apply pagination and sorting
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RLS policies will automatically enforce access control
    // If user doesn't have access to dossier, the query will return empty results

    return new Response(
      JSON.stringify({
        data: data || [],
        total: count || 0,
        limit,
        offset
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});