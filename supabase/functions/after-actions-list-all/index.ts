// Phase 42-01: Supabase Edge Function for GET /functions/v1/after-actions-list-all
// Returns RLS-gated published after-action records across every dossier the
// caller's JWT can read. Mirrors `after-actions-list` minus the dossier_id
// requirement and adds engagement + dossier joins (RESEARCH Blocker 2 + R-04).
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

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? 'published';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate status filter (T-42-01-S-1 mitigation)
    if (status && !['draft', 'published', 'edit_requested', 'edit_approved'].includes(status)) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message:
            'Invalid status filter. Must be one of: draft, published, edit_requested, edit_approved',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate limit (T-42-01-D-1 mitigation)
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Limit must be between 1 and 100',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query — RLS gates rows by dossier_acl automatically.
    // No caller-supplied dossier filter is applied: accepting one would
    // create a path to escape RLS via crafted IDs (T-42-01-AA-1 / T-42-01-T-1).
    let query = supabaseClient
      .from('after_action_records')
      .select(
        `
        *,
        engagement:engagements!inner (id, title_en, title_ar, engagement_date),
        dossier:dossiers!inner (id, name_en, name_ar),
        decisions (id),
        commitments:aa_commitments (id),
        risks:aa_risks (id),
        follow_up_actions:aa_follow_up_actions (id)
      `,
        { count: 'exact' }
      )
      .eq('publication_status', status);

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RLS policies enforce access control. If the caller has no access to a
    // dossier, the inner join filters that record out and the row never ships.

    return new Response(
      JSON.stringify({
        data: data || [],
        total: count || 0,
        limit,
        offset,
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
