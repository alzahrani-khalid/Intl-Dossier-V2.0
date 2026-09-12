// Phase 42-01: Supabase Edge Function for GET /functions/v1/after-actions-list-all
// Returns RLS-gated after-action records across every dossier the caller's JWT
// can read. Mirrors `after-actions-list` minus the dossier_id requirement and
// adds engagement + dossier context.
//
// Phase 94-07 (WRITE-02 / D-12 as corrected by RULING-P94-04 §PARK-94-05): that
// context is composed IN CODE from two batched lookups, not by PostgREST embeds.
// `after_action_records` carries NO foreign key on `engagement_id` or
// `dossier_id` — the live catalog returns exactly five FKs, all
// `REFERENCES auth.users(id)` — so both embeds died at PostgREST relationship
// resolution (PGRST200) and this function returned 500 to every caller. There is
// no FK worth adding either: `public.engagements` does not carry
// `title_en` / `title_ar` / `engagement_date` at all. Titles live on
// `dossiers.name_en` / `name_ar`; the date lives on `engagement_dossiers.start_date`
// (the engagement extension table, keyed by the dossier id).
//
// D-13: a lookup that misses emits `engagement: null` / `dossier: null` and the
// row still ships. The old embeds used an inner join, which silently deleted such
// rows from a list the user is told is complete — the confident-empty class.
//
// T-94-12: both lookups run on the SAME JWT-scoped client as the base query, so
// RLS gates them identically. No service-role widening.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // D-08: the client never receives a server-originated message. Diagnostics go
  // to the function log; the caller gets a stable code it can translate.
  const internalError = (where: string, detail: string): Response => {
    console.error(`after-actions-list-all: ${where}: ${detail}`);
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  };

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
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

    // --- 1. base query — RLS gates rows automatically. -----------------------
    // No caller-supplied dossier filter is applied: accepting one would create a
    // path to escape RLS via crafted IDs (T-42-01-AA-1 / T-42-01-T-1).
    // The child embeds below DO resolve — `decisions`, `aa_commitments`,
    // `aa_risks` and `aa_follow_up_actions` each carry
    // `FOREIGN KEY (after_action_id) REFERENCES after_action_records(id)`.
    let query = supabaseClient
      .from('after_action_records')
      .select(
        `
        *,
        decisions (id),
        commitments:aa_commitments (id),
        risks:aa_risks (id),
        follow_up_actions:aa_follow_up_actions (id)
      `,
        { count: 'exact' }
      )
      .eq('publication_status', status);

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: records, error, count } = await query;

    if (error) {
      return internalError('base query', error.message);
    }

    const rows = records ?? [];

    // --- 2. batched context lookups -----------------------------------------
    const engagementIds = [
      ...new Set(rows.map((r) => r.engagement_id).filter((id) => typeof id === 'string')),
    ];
    const dossierIds = [
      ...new Set(rows.map((r) => r.dossier_id).filter((id) => typeof id === 'string')),
    ];
    // One round-trip covers both sets: an engagement IS a dossier row here.
    const lookupIds = [...new Set([...engagementIds, ...dossierIds])];

    const dossierById = new Map<string, { id: string; name_en: string; name_ar: string }>();
    const startDateById = new Map<string, string>();

    if (lookupIds.length > 0) {
      const { data: dossierRows, error: dossierError } = await supabaseClient
        .from('dossiers')
        .select('id, name_en, name_ar')
        .in('id', lookupIds);
      if (dossierError) {
        return internalError('dossiers lookup', dossierError.message);
      }
      for (const d of dossierRows ?? []) {
        dossierById.set(d.id, d);
      }
    }

    if (engagementIds.length > 0) {
      const { data: extensionRows, error: extensionError } = await supabaseClient
        .from('engagement_dossiers')
        .select('id, start_date')
        .in('id', engagementIds);
      if (extensionError) {
        return internalError('engagement_dossiers lookup', extensionError.message);
      }
      for (const e of extensionRows ?? []) {
        startDateById.set(e.id, e.start_date);
      }
    }

    // --- 3. compose ----------------------------------------------------------
    // A miss on either side is represented, never hidden (D-13). `engagement`
    // present with a null `engagement_date` is the narrower degraded case: the
    // dossier row exists but its engagement extension row does not.
    const data = rows.map((r) => {
      const engagementDossier = dossierById.get(r.engagement_id) ?? null;
      const ownerDossier = dossierById.get(r.dossier_id) ?? null;
      return {
        ...r,
        engagement:
          engagementDossier === null
            ? null
            : {
                id: engagementDossier.id,
                title_en: engagementDossier.name_en,
                title_ar: engagementDossier.name_ar,
                engagement_date: startDateById.get(r.engagement_id) ?? null,
              },
        dossier:
          ownerDossier === null
            ? null
            : {
                id: ownerDossier.id,
                name_en: ownerDossier.name_en,
                name_ar: ownerDossier.name_ar,
              },
      };
    });

    return new Response(
      JSON.stringify({
        data,
        total: count || 0,
        limit,
        offset,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // WR-09: catch binding is `unknown` in Deno; narrow before reading .message.
    return internalError('unhandled', error instanceof Error ? error.message : String(error));
  }
});
