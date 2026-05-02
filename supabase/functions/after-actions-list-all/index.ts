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
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CR-02: guard missing Authorization header → return clean 401 instead
    // of forwarding the literal string "null" into the Supabase client.
    const authHeader = req.headers.get('Authorization');
    if (authHeader === null) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // CR-01: accept either GET (query string) or POST (JSON body) so the
    // function reachable both via direct HTTP and via supabase.functions.invoke,
    // which always issues a POST when `body` is provided.
    let status = 'published';
    let limit = 20;
    let offset = 0;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      status = typeof body.status === 'string' ? body.status : status;
      limit = typeof body.limit === 'number' ? body.limit : limit;
      offset = typeof body.offset === 'number' ? body.offset : offset;
    } else {
      const url = new URL(req.url);
      status = url.searchParams.get('status') ?? status;
      limit = parseInt(url.searchParams.get('limit') ?? String(limit));
      offset = parseInt(url.searchParams.get('offset') ?? String(offset));
    }

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
    // WR-09: catch binding is `unknown` in Deno; narrow before reading .message.
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
