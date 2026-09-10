---
phase: 100-security-posture
plan: 17
status: complete
completed: 2026-09-10
requirements: [DBSEC-03]
---

# P100-17: invoker-consumed materialized views

## Result

The five materialized views render only `postgres` and `service_role` as grantees (MAINTAIN included).
The six named consumers and the new RPC are `SECURITY DEFINER SET search_path = public`. `anon` cannot
execute any of the seven definer functions; `authenticated` can. The productivity RPC, the deployed
relationship-health list endpoint, and the rolled-back `entity_citations` write control all pass. The
two-identity fixture census (single rolled-back transaction) shows equal, non-zero owner counts and
non-owner counts that differ from the unscoped control on every surface.

## Planning-bound census

Live catalog census (unchanged by this repair — the consumer population it found is what this task converts):

```text
FUNCTION|aa_commitment_summary_by_dossier|refresh_aa_commitment_summary()|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_citation_network_graph(citation_source_type,uuid,integer,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_entity_citations(citation_source_type,uuid,text,boolean,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|refresh_citation_network_on_change()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_commitment_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_engagement_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|get_team_workload(uuid)|owner=postgres|secdef=true|config=search_path=public
FUNCTION|user_productivity_metrics|get_user_productivity_metrics(uuid)|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|refresh_user_productivity_metrics()|owner=postgres|secdef=true|config=<none>
VIEW|relationship_commitment_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
VIEW|relationship_engagement_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
TRIGGER|citation_network|trigger_refresh_citation_network|table=entity_citations|function=refresh_citation_network_on_change()
BACKEND_SWEEP
user_productivity_metrics backend/src hits=3
relationship_engagement_stats backend/src hits=6
relationship_commitment_stats backend/src hits=6
citation_network backend/src hits=3
aa_commitment_summary_by_dossier backend/src hits=2
control from('dossiers') backend/src hits=12
CENSUS_EXIT=0
```

## Which reads SECURITY DEFINER widens, and how each is re-scoped

Four of the seven functions return rows to callers, so converting them to definer widens their read of
the revoked matviews (and, inside `get_entity_citations` / `get_citation_network_graph`, the joined
base tables) from "whatever the caller's RLS admitted" to "whatever the function owner (postgres) can
see". Each is re-scoped inside the function body:

- `get_user_productivity_metrics(uuid)` — widened read: the whole `user_productivity_metrics` matview
  (one row per user). Re-scoped: `pm.user_id = p_user_id AND pm.user_id = auth.uid()` — the caller's
  own row only, no organization branch (an earlier revision carried a shared-organization branch that
  review found in none of the cited source-table policies; it was dropped — the criterion's first-listed
  re-scoping). At HEAD the invoker function filtered `pm.user_id = p_user_id` under the caller's own
  privileges; the added `auth.uid()` term reproduces that boundary under definer.
- `get_entity_citations(...)` — widened read: every `citation_network` row joined to `entity_citations`
  (including `ec.citation_context`, which the matview does not carry). Re-scoped: both CTE arms copy the
  `entity_citations` SELECT policy `Users can view citations in their organization` verbatim —
  `ec.organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id =
  auth.uid() AND om.left_at IS NULL)` — the same predicate the invoker-side RLS applied to that join at
  HEAD.
- `get_citation_network_graph(...)` — widened read: every `citation_network` edge, plus name resolution
  through owner-bypassed joins to `dossiers`/`briefs`/`ai_briefs`/`documents`/`positions`/`mous`/
  `engagements`. Re-scoped three ways: (1) every edge considered by the recursion carries the same
  active-organization predicate keyed on `cn.organization_id`; (2) the `edges` CTE carries it too, so no
  returned edge is outside the caller's organizations; (3) the caller-supplied start node is gated by the
  `entity_citations` organization predicate — the seed row survives only if the caller's active
  organizations hold a citation citing or citing-to that entity — so an inaccessible start UUID yields
  zero nodes and its title is never resolved by the definer joins (proven in the census:
  `get_citation_network_graph(high)|nodes=0|edges=NULL` for the non-owner).
- `get_relationship_health_summary()` (new) — widened read: the whole `relationship_health_summary`
  security_invoker view (i.e. `dossier_relationships` plus both stats matviews). Re-scoped: the live
  `dossier_relationships` SELECT policy `Users can view relationships within clearance` copied into the
  WHERE clause — both source and target dossier must satisfy `sensitivity_level <= (SELECT
  COALESCE(profiles.clearance_level, 1) FROM profiles WHERE profiles.user_id = auth.uid())`. The live
  policy's qual (dumped from `pg_policies` this attempt) already keys `profiles.user_id = auth.uid()`;
  the repo file 20251022000006 spells `profiles.id`, which the live `profiles` table has no column for
  (OVERSEER-RULING-P100-17 addendum 5: copying the defective spelling would scope nothing). The copy
  follows the live policy — `profiles.user_id` — per that ruling.

The three refresh helpers (`refresh_citation_network_on_change`, `refresh_relationship_health_stats`,
`refresh_aa_commitment_summary`) return no rows; their bodies stay refresh-only and byte-identical, and
only become definer+pinned.

## Pre-existing body defects fixed (disclosed)

The criterion permits the minimal fix, disclosed here, only where the HEAD body cannot execute:

1. `get_entity_citations` 11/12 column mismatch — each HEAD CTE arm selected 11 columns against the
   12-column `RETURNS TABLE` (missing `external_title`, position 7), which fails at
   `RETURN QUERY` execution. Minimal fix: both arms now select `ec.external_title` (position 7),
   preserving the stored value. The outgoing arm's original first six columns are untouched
   (`cn.external_url` stays); the incoming arm's position-6 `NULL::TEXT` (external_url, original) stays.
   An earlier revision used `NULL::TEXT` for the outgoing `external_title`; review correctly rejected
   that as silent data loss — this revision returns `ec.external_title`.
2. `get_citation_network_graph` two-arm recursion cannot execute — the HEAD body's
   `seed UNION <arm referencing citation_tree> UNION <arm referencing citation_tree>` fails at execution
   with the verbatim live error (captured this attempt when the restored two-arm body ran in the census):

   ```text
   ERROR:  recursive reference to query "citation_tree" must not appear within its non-recursive term
   CONTEXT:  PL/pgSQL function get_citation_network_graph(citation_source_type,uuid,integer,integer) line 4 at SQL statement
   ```

   PostgreSQL parses a left-deep UNION chain, so the second arm lands in the non-recursive term. CREATE
   succeeds (plpgsql only grammar-checks at CREATE; the rule fires at plan time), which is why the broken
   body sat live at HEAD with `secdef=false`. Minimal executable repair: the two arms merge into one
   recursive arm whose join covers both directions
   (`ON (source-match AND cn.target_id IS NOT NULL) OR target-match`) and whose three projection/
   cycle-prevention expressions use `CASE WHEN source-match THEN target ELSE source END` to pick the far
   side — preserving each original arm's traversal, `target_id IS NOT NULL` handling, and
   `NOT <far side> = ANY(ct.path)` cycle check. Keeping the verbatim two-arm text would leave the RPC
   permanently erroring, so the merge is the repair, disclosed here.

No other body text changed (verified by the before/after `pg_get_functiondef` diff below: the
productivity function gains exactly one predicate line; `get_entity_citations` gains the two policy
predicates and the two `ec.external_title` columns; the graph function gains the seed gate, the two
per-edge predicates, and the disclosed arm merge; the three refresh bodies are byte-identical apart from
the definer/pin attributes).

## Body evidence — pg_get_functiondef BEFORE and AFTER

BEFORE (HEAD) bodies: prior attempt applies had already replaced the live bodies, so the HEAD bodies
were restored verbatim from the repo migrations that created them (20260610000001 lines 334-355 for
`get_user_productivity_metrics`; 20260112800001 lines 140-158 and 160-179 for the citation functions)
inside ONE transaction that was ROLLED BACK, with the catalog flags reset to HEAD state
(SECURITY INVOKER, no proconfig) and the seventh function dropped to prove its HEAD absence. Command:
`psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -f /tmp/p100-17-bodies-before.sql` → exit 0, verbatim
output:

```text
=== BEFORE-BEGIN tx: HEAD bodies restored verbatim from repo migrations (20260610000001 / 20260112800001); transaction is ROLLED BACK at the end
=== HEAD get_user_productivity_metrics (source: 20260610000001_capture_unified_work_stack.sql lines 334-355)
=== HEAD get_entity_citations (source: 20260112800001_citation_tracking_system.sql lines 140-158)
=== HEAD get_citation_network_graph (source: 20260112800001_citation_tracking_system.sql lines 160-179)
=== HEAD flags for the three ALTER-only refresh helpers (bodies untouched by this task)
=== HEAD: the seventh function does not exist
HEAD_get_relationship_health_summary_to_regfunction=NULL
=== BEFORE pg_get_functiondef dumps
CREATE OR REPLACE FUNCTION public.get_user_productivity_metrics(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, completed_count_30d bigint, on_time_rate_30d numeric, avg_completion_hours_30d numeric, completed_count_all bigint, on_time_rate_all numeric, avg_completion_hours_all numeric, commitment_completed_30d bigint, task_completed_30d bigint, intake_completed_30d bigint, last_refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pm.user_id,
    pm.completed_count_30d,
    pm.on_time_rate_30d,
    pm.avg_completion_hours_30d,
    pm.completed_count_all,
    pm.on_time_rate_all,
    pm.avg_completion_hours_all,
    pm.commitment_completed_30d,
    pm.task_completed_30d,
    pm.intake_completed_30d,
    pm.last_refreshed_at
  FROM user_productivity_metrics pm
  WHERE pm.user_id = p_user_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text DEFAULT 'both'::text, p_include_external boolean DEFAULT true, p_limit integer DEFAULT 50)
 RETURNS TABLE(citation_id uuid, direction text, related_entity_type citation_source_type, related_entity_id uuid, related_entity_name text, external_url text, external_title text, status citation_status, relevance_score numeric, detection_method citation_detection_method, citation_context text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH outgoing AS (
        SELECT cn.citation_id, 'outgoing'::TEXT, cn.target_type, cn.target_id, cn.target_name, cn.external_url, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.source_type = p_entity_type AND cn.source_id = p_entity_id AND (p_include_external OR cn.target_id IS NOT NULL)
    ),
    incoming AS (
        SELECT cn.citation_id, 'incoming'::TEXT, cn.source_type, cn.source_id, cn.source_name, NULL::TEXT, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.target_type = p_entity_type AND cn.target_id = p_entity_id
    )
    SELECT o.* FROM outgoing o WHERE p_direction IN ('outgoing', 'both')
    UNION ALL SELECT i.* FROM incoming i WHERE p_direction IN ('incoming', 'both')
    ORDER BY created_at DESC LIMIT p_limit;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer DEFAULT 2, p_max_nodes integer DEFAULT 50)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE result JSON;
BEGIN
    WITH RECURSIVE citation_tree AS (
        SELECT p_start_entity_type AS entity_type, p_start_entity_id AS entity_id, 0 AS depth, ARRAY[p_start_entity_id] AS path
        UNION SELECT cn.target_type, cn.target_id, ct.depth + 1, ct.path || cn.target_id FROM citation_tree ct JOIN citation_network cn ON cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id WHERE ct.depth < p_depth AND cn.target_id IS NOT NULL AND NOT cn.target_id = ANY(ct.path)
        UNION SELECT cn.source_type, cn.source_id, ct.depth + 1, ct.path || cn.source_id FROM citation_tree ct JOIN citation_network cn ON cn.target_type = ct.entity_type AND cn.target_id = ct.entity_id WHERE ct.depth < p_depth AND NOT cn.source_id = ANY(ct.path)
    ),
    nodes AS (SELECT DISTINCT ON (entity_id) entity_type, entity_id, MIN(depth) AS depth FROM citation_tree GROUP BY entity_type, entity_id ORDER BY entity_id, depth LIMIT p_max_nodes),
    edges AS (SELECT DISTINCT cn.citation_id AS id, cn.source_type, cn.source_id, cn.target_type, cn.target_id, cn.status, cn.relevance_score FROM citation_network cn WHERE (cn.source_type, cn.source_id) IN (SELECT entity_type, entity_id FROM nodes) AND (cn.target_type, cn.target_id) IN (SELECT entity_type, entity_id FROM nodes))
    SELECT json_build_object(
        'nodes', (SELECT json_agg(json_build_object('id', n.entity_id, 'type', n.entity_type, 'depth', n.depth, 'name', COALESCE(d.name_en, b.title, ab.title, doc.title, p.title_en, m.title, e.location_en, n.entity_id::text), 'name_ar', COALESCE(d.name_ar, b.title, ab.title, doc.title, p.title_ar, m.title_ar, e.location_ar, n.entity_id::text)))
            FROM nodes n LEFT JOIN dossiers d ON n.entity_type = 'dossier' AND n.entity_id = d.id LEFT JOIN briefs b ON n.entity_type = 'brief' AND n.entity_id = b.id LEFT JOIN ai_briefs ab ON n.entity_type = 'ai_brief' AND n.entity_id = ab.id LEFT JOIN documents doc ON n.entity_type = 'document' AND n.entity_id = doc.id LEFT JOIN positions p ON n.entity_type = 'position' AND n.entity_id = p.id LEFT JOIN mous m ON n.entity_type = 'mou' AND n.entity_id = m.id LEFT JOIN engagements e ON n.entity_type = 'engagement' AND n.entity_id = e.id),
        'edges', (SELECT json_agg(json_build_object('id', ed.id, 'source', ed.source_id, 'target', ed.target_id, 'source_type', ed.source_type, 'target_type', ed.target_type, 'relevance_score', ed.relevance_score)) FROM edges ed),
        'start_node', p_start_entity_id, 'depth', p_depth, 'total_nodes', (SELECT COUNT(*) FROM nodes)
    ) INTO result;
    RETURN result;
END;
$function$

CREATE OR REPLACE FUNCTION public.refresh_citation_network_on_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY citation_network; RETURN NULL; END; $function$

CREATE OR REPLACE FUNCTION public.refresh_relationship_health_stats()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_commitment_stats;
END;
$function$

CREATE OR REPLACE FUNCTION public.refresh_aa_commitment_summary()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY aa_commitment_summary_by_dossier;
END;
$function$

=== BEFORE-END rolled back
```

AFTER bodies: live catalog, dumped after the final applies (APPLY15-17 below — the qualification-strip
revision). Command:

```text
CREATE OR REPLACE FUNCTION public.get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer DEFAULT 2, p_max_nodes integer DEFAULT 50)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result JSON;
BEGIN
    WITH RECURSIVE citation_tree AS (
        SELECT p_start_entity_type AS entity_type, p_start_entity_id AS entity_id, 0 AS depth, ARRAY[p_start_entity_id] AS path
        WHERE EXISTS (
            SELECT 1
            FROM entity_citations ec
            WHERE ec.organization_id IN (
                SELECT om.organization_id
                FROM organization_members om
                WHERE om.user_id = auth.uid()
                  AND om.left_at IS NULL
            )
            AND (
                (ec.citing_entity_type = p_start_entity_type AND ec.citing_entity_id = p_start_entity_id)
                OR (ec.cited_entity_type = p_start_entity_type AND ec.cited_entity_id = p_start_entity_id)
            )
        )
        UNION
        SELECT
          CASE WHEN cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id THEN cn.target_type ELSE cn.source_type END,
          CASE WHEN cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id THEN cn.target_id ELSE cn.source_id END,
          ct.depth + 1,
          ct.path || CASE WHEN cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id THEN cn.target_id ELSE cn.source_id END
        FROM citation_tree ct
        JOIN citation_network cn
          ON (cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id AND cn.target_id IS NOT NULL)
          OR (cn.target_type = ct.entity_type AND cn.target_id = ct.entity_id)
        WHERE ct.depth < p_depth
          AND NOT (CASE WHEN cn.source_type = ct.entity_type AND cn.source_id = ct.entity_id THEN cn.target_id ELSE cn.source_id END) = ANY(ct.path)
          AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.left_at IS NULL AND om.organization_id = cn.organization_id
          )
    ),
    nodes AS (SELECT DISTINCT ON (entity_id) entity_type, entity_id, MIN(depth) AS depth FROM citation_tree GROUP BY entity_type, entity_id ORDER BY entity_id, depth LIMIT p_max_nodes),
    edges AS (SELECT DISTINCT cn.citation_id AS id, cn.source_type, cn.source_id, cn.target_type, cn.target_id, cn.status, cn.relevance_score FROM citation_network cn WHERE (cn.source_type, cn.source_id) IN (SELECT entity_type, entity_id FROM nodes) AND (cn.target_type, cn.target_id) IN (SELECT entity_type, entity_id FROM nodes)
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.left_at IS NULL AND om.organization_id = cn.organization_id
        ))
    SELECT json_build_object(
        'nodes', (SELECT json_agg(json_build_object('id', n.entity_id, 'type', n.entity_type, 'depth', n.depth, 'name', COALESCE(d.name_en, b.title, ab.title, doc.title, p.title_en, m.title, e.location_en, n.entity_id::text), 'name_ar', COALESCE(d.name_ar, b.title, ab.title, doc.title, p.title_ar, m.title_ar, e.location_ar, n.entity_id::text)))
            FROM nodes n LEFT JOIN dossiers d ON n.entity_type = 'dossier' AND n.entity_id = d.id LEFT JOIN briefs b ON n.entity_type = 'brief' AND n.entity_id = b.id LEFT JOIN ai_briefs ab ON n.entity_type = 'ai_brief' AND n.entity_id = ab.id LEFT JOIN documents doc ON n.entity_type = 'document' AND n.entity_id = doc.id LEFT JOIN positions p ON n.entity_type = 'position' AND n.entity_id = p.id LEFT JOIN mous m ON n.entity_type = 'mou' AND n.entity_id = m.id LEFT JOIN engagements e ON n.entity_type = 'engagement' AND n.entity_id = e.id),
        'edges', (SELECT json_agg(json_build_object('id', ed.id, 'source', ed.source_id, 'target', ed.target_id, 'source_type', ed.source_type, 'target_type', ed.target_type, 'relevance_score', ed.relevance_score)) FROM edges ed),
        'start_node', p_start_entity_id, 'depth', p_depth, 'total_nodes', (SELECT COUNT(*) FROM nodes)
    ) INTO result;
    RETURN result;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text DEFAULT 'both'::text, p_include_external boolean DEFAULT true, p_limit integer DEFAULT 50)
 RETURNS TABLE(citation_id uuid, direction text, related_entity_type citation_source_type, related_entity_id uuid, related_entity_name text, external_url text, external_title text, status citation_status, relevance_score numeric, detection_method citation_detection_method, citation_context text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH outgoing AS (
        SELECT cn.citation_id, 'outgoing'::TEXT, cn.target_type, cn.target_id, cn.target_name, cn.external_url, ec.external_title, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.source_type = p_entity_type AND cn.source_id = p_entity_id AND (p_include_external OR cn.target_id IS NOT NULL)
          AND ec.organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid() AND om.left_at IS NULL)
    ),
    incoming AS (
        SELECT cn.citation_id, 'incoming'::TEXT, cn.source_type, cn.source_id, cn.source_name, NULL::TEXT, ec.external_title, ec.status, cn.relevance_score, cn.detection_method, ec.citation_context, cn.created_at
        FROM citation_network cn JOIN entity_citations ec ON ec.id = cn.citation_id
        WHERE cn.target_type = p_entity_type AND cn.target_id = p_entity_id
          AND ec.organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid() AND om.left_at IS NULL)
    )
    SELECT o.* FROM outgoing o WHERE p_direction IN ('outgoing', 'both')
    UNION ALL SELECT i.* FROM incoming i WHERE p_direction IN ('incoming', 'both')
    ORDER BY created_at DESC LIMIT p_limit;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_relationship_health_summary()
 RETURNS SETOF relationship_health_summary
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT rhs.*
  FROM public.relationship_health_summary rhs
  WHERE EXISTS (
    SELECT 1
    FROM public.dossiers source_dossier
    WHERE source_dossier.id = rhs.source_dossier_id
      AND source_dossier.sensitivity_level <= (SELECT COALESCE(p.clearance_level, 1) FROM public.profiles p WHERE p.user_id = auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.dossiers target_dossier
    WHERE target_dossier.id = rhs.target_dossier_id
      AND target_dossier.sensitivity_level <= (SELECT COALESCE(p.clearance_level, 1) FROM public.profiles p WHERE p.user_id = auth.uid())
  )
$function$

CREATE OR REPLACE FUNCTION public.get_user_productivity_metrics(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(user_id uuid, completed_count_30d bigint, on_time_rate_30d numeric, avg_completion_hours_30d numeric, completed_count_all bigint, on_time_rate_all numeric, avg_completion_hours_all numeric, commitment_completed_30d bigint, task_completed_30d bigint, intake_completed_30d bigint, last_refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pm.user_id,
    pm.completed_count_30d,
    pm.on_time_rate_30d,
    pm.avg_completion_hours_30d,
    pm.completed_count_all,
    pm.on_time_rate_all,
    pm.avg_completion_hours_all,
    pm.commitment_completed_30d,
    pm.task_completed_30d,
    pm.intake_completed_30d,
    pm.last_refreshed_at
  FROM user_productivity_metrics pm
  WHERE pm.user_id = p_user_id
    AND pm.user_id = auth.uid();
END;
$function$

CREATE OR REPLACE FUNCTION public.refresh_aa_commitment_summary()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY aa_commitment_summary_by_dossier;
END;
$function$

CREATE OR REPLACE FUNCTION public.refresh_citation_network_on_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY citation_network; RETURN NULL; END; $function$

CREATE OR REPLACE FUNCTION public.refresh_relationship_health_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY relationship_commitment_stats;
END;
$function$
```

### Final revision (attempt 9): schema-qualification strip

Review found the conversion bodies had gained `public.` qualifications on table references beyond the
permitted delta ("added schema qualification ... fails this criterion"). The final revision strips every
`public.` table qualification from the three converted read bodies (`get_user_productivity_metrics`,
`get_entity_citations`, `get_citation_network_graph`), restoring the base-commit body text verbatim
(121c86622: `20260610000001` lines 334-355, `20260112800001` lines 140-179). Resolution is unchanged —
the functions pin `search_path = public`, so unqualified references resolve to the same objects — and the
body diff is now purely: definer/pin clauses, the re-scoping predicates, the disclosed
`ec.external_title` column fix, and (graph only) the permitted recursion repair. The citation arms'
original single-line WHERE clauses are kept verbatim with the policy predicate appended as one line,
byte-matching the `entity_citations` SELECT policy subquery (`20260112800001:238`). The NEW RPC
`get_relationship_health_summary` keeps its `public.` references: it has no BEFORE body to diff against
and the plan's own template writes `public.relationship_health_summary` into it.

## Edge function change

`supabase/functions/relationship-health/index.ts`: JWT verification unchanged; ONLY the two GET reads of
`relationship_health_summary` (single and list) call `.rpc('get_relationship_health_summary')` with their
`.eq/.order/.range` filters preserved. The post-calculate fetch stays caller-scoped
(`.from('relationship_health_summary').select('*')`) per the criterion's "ONLY the two reads" bound.

FLAGGED FOR OVERSEER RULING (unchanged from prior revision): that caller-scoped post-calculate read
(index.ts:585-588) selects `relationship_health_summary`, whose invoker path touches
`relationship_engagement_stats` and `relationship_commitment_stats` — both now revoked from
`authenticated`. Once the pre-existing 42702 (`relationship_id is ambiguous`) inside
`calculate_relationship_health_scores` is fixed upstream, this read will fail with `permission denied
for materialized view`. The criterion pins this read caller-scoped and forbids moving it; the endpoint
is already red upstream today, so it is recorded for a ruling rather than edited.

## Deploy and migration applies

The deploy ran BEFORE the applies of every migration revision (convert → deploy → verify → revoke
ordering; the deployed bundle already matched the repo — "No change found" — because index.ts was last
deployed at 18:02:47Z with the same two-read RPC shape and is untouched by the final revision, which
changes only SQL):

```text
DEPLOY11_START_UTC=2026-09-10T19:23:16Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: relationship-health
No change found in Function: relationship-health
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-cli
DEPLOY11_EXIT=0
DEPLOY11_END_UTC=2026-09-10T19:23:21Z
```

DEPLOY12 (final revision — re-run before its applies; edge function unchanged, so again "No change
found"):

```text
DEPLOY12_START_UTC=2026-09-10T19:50:34Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: relationship-health
No change found in Function: relationship-health
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-cli
DEPLOY12_EXIT=0
DEPLOY12_END_UTC=2026-09-10T19:50:39Z
```

Penultimate revision applied twice (idempotency; the run between them that first proved the two-arm HEAD
body cannot execute is recorded under "Pre-existing body defects fixed"):

```text
APPLY13_START_UTC=2026-09-10T19:28:46Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY13_EXIT=0
APPLY13_END_UTC=2026-09-10T19:28:49Z
APPLY14_START_UTC=2026-09-10T19:28:49Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY14_EXIT=0
APPLY14_END_UTC=2026-09-10T19:28:51Z
```

FINAL revision (the qualification strip below) applied three times — APPLY15/16 with `psql -q` (silent;
exit 0 both), APPLY17 with command tags echoed to record the statement list. All after DEPLOY12:

```text
APPLY15_START_UTC=2026-09-10T19:50:44Z
APPLY15_EXIT=0
APPLY15_END_UTC=2026-09-10T19:50:47Z
APPLY16_START_UTC=2026-09-10T19:50:47Z
APPLY16_EXIT=0
APPLY16_END_UTC=2026-09-10T19:50:50Z
APPLY17_START_UTC=2026-09-10T19:51:01Z
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY17_EXIT=0
APPLY17_END_UTC=2026-09-10T19:51:03Z
```

Earlier attempt applies of predecessor revisions (all exit 0, twice each): APPLY7/8 at 17:45:20-26Z,
APPLY9/10 at 18:47:38-52Z, and APPLY11/12 at 19:23:26-31Z for the first revision of this attempt
(two-arm restore). No ledger row is written (D-13: idempotent migration applied with psql).

## Command oracles (verbatim, final state after APPLY17 — re-run after the qualification strip)

### Grants

```text
P100-17-GRANTS named=5 rendered=5 at_expected_full_state=5 expected rendered=5 at_expected_full_state=5
  GRANTS aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS citation_network | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_productivity_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
```

### Definer + pinned search_path

```text
P100-17-DEFINER functions=7 definer_and_pinned=7 expected 7 and 7
  FN get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer DEFAULT 2, p_max_nodes integer DEFAULT 50) secdef=true search_path=public
  FN get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text DEFAULT 'both'::text, p_include_external boolean DEFAULT true, p_limit integer DEFAULT 50) secdef=true search_path=public
  FN get_relationship_health_summary() secdef=true search_path=public
  FN get_user_productivity_metrics(p_user_id uuid DEFAULT auth.uid()) secdef=true search_path=public
  FN refresh_aa_commitment_summary() secdef=true search_path=public
  FN refresh_citation_network_on_change() secdef=true search_path=public
  FN refresh_relationship_health_stats() secdef=true search_path=public
PASS definer-pinned
```

### Anon execute denied

```text
P100-17-ANON functions=7 anon_denied=7 expected 7 and 7
  FN get_citation_network_graph anon=false authenticated=true
  FN get_entity_citations anon=false authenticated=true
  FN get_relationship_health_summary anon=false authenticated=true
  FN get_user_productivity_metrics anon=false authenticated=true
  FN refresh_aa_commitment_summary anon=false authenticated=true
  FN refresh_citation_network_on_change anon=false authenticated=true
  FN refresh_relationship_health_stats anon=false authenticated=true
PASS anon-execute
```

### Real-user controls

```text
P100-17 consumer controls: rpc_get_user_productivity_metrics=200 relationship-health=200 entity_citations_write=ok(rolled-back) expected 200 200 ok(rolled-back)
PASS consumer controls
```

Supplementary revoke proof — a direct matview read as `authenticated` (separate rolled-back
transaction) is refused, so the controls above can only be passing through the definer functions:

```text
ERROR:  permission denied for materialized view user_productivity_metrics
HINT:  Grant the required privileges to the current role with: GRANT SELECT ON public.user_productivity_metrics TO authenticated;
```

## Two-identity fixture census (one transaction, ROLLED BACK)

Staging's live populations are empty (`entity_citations=0`, `citation_network=0`,
`user_productivity_metrics=0`, `bilateral_active_rels=0`), so a discriminating fixture was inserted
inside the census transaction itself. The transaction, verbatim as run
(`psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -f /tmp/p100-17-census.sql`):

```sql
begin;
alter table public.profiles disable trigger trg_guard_profiles_clearance_change;
-- (clearance guard trigger disabled inside this tx only, so the fixture can lower the non-owner to clearance 1)
update public.profiles set clearance_level = 1 where user_id = 'a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772';
insert into public.dossiers (id, type, name_en, name_ar, sensitivity_level) values
 ('55555555-5555-5555-5555-555555555551','organization','P100-17 census org A','منظمة أ',1),
 ('55555555-5555-5555-5555-555555555552','organization','P100-17 census org B','منظمة ب',1);
insert into public.organizations (id, org_type) values ('55555555-5555-5555-5555-555555555551','government'), ('55555555-5555-5555-5555-555555555552','government');
insert into public.organization_members (organization_id, user_id, role, joined_at) values
 ('55555555-5555-5555-5555-555555555551','de2734cf-f962-4e05-bf62-bc9e92efff96','member', now()),
 ('55555555-5555-5555-5555-555555555552','de2734cf-f962-4e05-bf62-bc9e92efff96','member', now()),
 ('55555555-5555-5555-5555-555555555552','a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772','member', now());
insert into public.dossiers (id, type, name_en, name_ar, sensitivity_level) values
 ('44444444-4444-4444-4444-444444444441','country','P100-17 census low one',' تعداد منخفض واحد',1),
 ('44444444-4444-4444-4444-444444444442','country','P100-17 census low two',' تعداد منخفض اثنان',1),
 ('44444444-4444-4444-4444-444444444443','country','P100-17 census high',' عدد مرتفع',3);
insert into public.dossier_relationships (source_dossier_id, target_dossier_id, relationship_type, status, is_seed_data, created_by, created_at) values
 ('44444444-4444-4444-4444-444444444443','44444444-4444-4444-4444-444444444441','bilateral_relation','active',false,'de2734cf-f962-4e05-bf62-bc9e92efff96',now()),
 ('44444444-4444-4444-4444-444444444441','44444444-4444-4444-4444-444444444442','bilateral_relation','active',false,'de2734cf-f962-4e05-bf62-bc9e92efff96',now());
alter table public.entity_citations disable trigger trigger_refresh_citation_network;
-- (trigger disabled inside this tx only: refresh_citation_network_on_change runs REFRESH CONCURRENTLY, which cannot run inside a transaction block; the matview is refreshed manually below)
insert into public.entity_citations (organization_id, citing_entity_type, citing_entity_id, cited_entity_type, cited_entity_id, external_title, status, detection_method, created_by) values
 ('55555555-5555-5555-5555-555555555551','dossier','44444444-4444-4444-4444-444444444441','dossier','44444444-4444-4444-4444-444444444443','P100-17 hidden-org citation','active','manual','de2734cf-f962-4e05-bf62-bc9e92efff96'),
 ('55555555-5555-5555-5555-555555555552','dossier','44444444-4444-4444-4444-444444444442','dossier','44444444-4444-4444-4444-444444444441','P100-17 shared-org citation','active','manual','de2734cf-f962-4e05-bf62-bc9e92efff96');
insert into public.aa_commitments (title, description, dossier_id, priority, owner_type, owner_user_id, status, completed_at, due_date, tracking_mode, proof_required) values
 ('p100-17 census owner fixture','census fixture','44444444-4444-4444-4444-444444444441','medium','internal','de2734cf-f962-4e05-bf62-bc9e92efff96','completed',now(),now(),'automatic',false),
 ('p100-17 census nonowner fixture','census fixture','44444444-4444-4444-4444-444444444442','medium','internal','a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772','completed',now(),now(),'automatic',false);
refresh materialized view public.user_productivity_metrics;
refresh materialized view public.citation_network;
-- UNSCOPED counts (as postgres, RLS bypassed - the control the scoped counts must differ from for the non-owner)
select 'UNSCOPED|entity_citations='||count(*) from public.entity_citations;
select 'UNSCOPED|citation_network='||count(*) from public.citation_network;
select 'UNSCOPED|user_productivity_metrics='||count(*) from public.user_productivity_metrics;
select 'UNSCOPED|bilateral_active_rels='||count(*) from public.dossier_relationships where relationship_type='bilateral_relation' and status='active';
-- SCOPED equivalents for the matview-backed surfaces (as postgres; the matviews carry no RLS, so the invoker-equivalent scope is the HEAD filter / the org predicate)
select 'SCOPED_EQ|productivity|owner='||(select count(*) from public.user_productivity_metrics where user_id='de2734cf-f962-4e05-bf62-bc9e92efff96')||'|non_owner='||(select count(*) from public.user_productivity_metrics where user_id='a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772');
select 'SCOPED_EQ|citation_network_org_edges|owner='||(select count(*) from public.citation_network where organization_id in (select organization_id from public.organization_members where user_id='de2734cf-f962-4e05-bf62-bc9e92efff96' and left_at is null))||'|non_owner='||(select count(*) from public.citation_network where organization_id in (select organization_id from public.organization_members where user_id='a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772' and left_at is null));
-- IDENTITY owner (.env.test user kazahrani@stats.gov.sa, resolved as in 100-01)
set local role authenticated;
set local request.jwt.claims = '{"sub":"de2734cf-f962-4e05-bf62-bc9e92efff96","role":"authenticated"}';
select 'TWO_ID|owner|get_user_productivity_metrics(self)|definer='||count(*) from public.get_user_productivity_metrics('de2734cf-f962-4e05-bf62-bc9e92efff96');
select 'TWO_ID|owner|get_user_productivity_metrics(non_owner)|definer='||count(*) from public.get_user_productivity_metrics('a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772');
select 'TWO_ID|owner|get_entity_citations(low1)|definer='||count(*) from public.get_entity_citations('dossier','44444444-4444-4444-4444-444444444441');
select 'TWO_ID|owner|get_citation_network_graph(low1)|nodes='||coalesce(g->>'total_nodes','NULL')||'|edges='||coalesce(case when json_typeof(g->'edges')='array' then json_array_length(g->'edges')::text end,'NULL') from public.get_citation_network_graph('dossier','44444444-4444-4444-4444-444444444441',2,50) g;
select 'TWO_ID|owner|get_citation_network_graph(high)|nodes='||coalesce(g->>'total_nodes','NULL')||'|edges='||coalesce(case when json_typeof(g->'edges')='array' then json_array_length(g->'edges')::text end,'NULL') from public.get_citation_network_graph('dossier','44444444-4444-4444-4444-444444444443',2,50) g;
select 'TWO_ID|owner|get_relationship_health_summary|definer='||count(*) from public.get_relationship_health_summary();
select 'TWO_ID|owner|RLS_entity_citations|scoped='||count(*) from public.entity_citations;
select 'TWO_ID|owner|RLS_dossier_relationships_bilateral_active|scoped='||count(*) from public.dossier_relationships where relationship_type='bilateral_relation' and status='active';
reset role;
-- IDENTITY non_owner (test.user@gmail.com, no live org membership; org B is granted inside this tx)
set local role authenticated;
set local request.jwt.claims = '{"sub":"a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772","role":"authenticated"}';
select 'TWO_ID|non_owner|get_user_productivity_metrics(self)|definer='||count(*) from public.get_user_productivity_metrics('a2658b8f-1b5c-4f1b-b0f1-3a9cfb115772');
select 'TWO_ID|non_owner|get_user_productivity_metrics(owner)|definer='||count(*) from public.get_user_productivity_metrics('de2734cf-f962-4e05-bf62-bc9e92efff96');
select 'TWO_ID|non_owner|get_entity_citations(low1)|definer='||count(*) from public.get_entity_citations('dossier','44444444-4444-4444-4444-444444444441');
select 'TWO_ID|non_owner|get_citation_network_graph(low1)|nodes='||coalesce(g->>'total_nodes','NULL')||'|edges='||coalesce(case when json_typeof(g->'edges')='array' then json_array_length(g->'edges')::text end,'NULL') from public.get_citation_network_graph('dossier','44444444-4444-4444-4444-444444444441',2,50) g;
select 'TWO_ID|non_owner|get_citation_network_graph(high)|nodes='||coalesce(g->>'total_nodes','NULL')||'|edges='||coalesce(case when json_typeof(g->'edges')='array' then json_array_length(g->'edges')::text end,'NULL') from public.get_citation_network_graph('dossier','44444444-4444-4444-4444-444444444443',2,50) g;
select 'TWO_ID|non_owner|get_relationship_health_summary|definer='||count(*) from public.get_relationship_health_summary();
select 'TWO_ID|non_owner|RLS_entity_citations|scoped='||count(*) from public.entity_citations;
select 'TWO_ID|non_owner|RLS_dossier_relationships_bilateral_active|scoped='||count(*) from public.dossier_relationships where relationship_type='bilateral_relation' and status='active';
reset role;
rollback;
```

Verbatim output:

```text
=== CENSUS-BEGIN one transaction, ROLLED BACK at the end. Fixture: org A (owner only), org B (owner+non-owner); dossiers low1/low2 (sensitivity 1) and high (sensitivity 3); non-owner clearance lowered to 1; rel high-low1 (non-owner CANNOT read) and rel low1-low2 (both CAN); citation orgA-low1-high (non-owner CANNOT read) and citation orgB-low2-low1 (both CAN); one completed commitment each.
=== (clearance guard trigger disabled inside this tx only, so the fixture can lower the non-owner to clearance 1)
=== (trigger disabled inside this tx only: refresh_citation_network_on_change runs REFRESH CONCURRENTLY, which cannot run inside a transaction block; the matview is refreshed manually below)
=== UNSCOPED counts (as postgres, RLS bypassed - the control the scoped counts must differ from for the non-owner)
UNSCOPED|entity_citations=2
UNSCOPED|citation_network=2
UNSCOPED|user_productivity_metrics=2
UNSCOPED|bilateral_active_rels=2
=== SCOPED equivalents for the matview-backed surfaces (as postgres; the matviews carry no RLS, so the invoker-equivalent scope is the HEAD filter / the org predicate)
SCOPED_EQ|productivity|owner=1|non_owner=1
SCOPED_EQ|citation_network_org_edges|owner=2|non_owner=1
=== IDENTITY owner (.env.test user, resolved as in 100-01)
TWO_ID|owner|get_user_productivity_metrics(self)|definer=1
TWO_ID|owner|get_user_productivity_metrics(non_owner)|definer=0
TWO_ID|owner|get_entity_citations(low1)|definer=2
TWO_ID|owner|get_citation_network_graph(low1)|nodes=3|edges=2
TWO_ID|owner|get_citation_network_graph(high)|nodes=3|edges=2
TWO_ID|owner|get_relationship_health_summary|definer=2
TWO_ID|owner|RLS_entity_citations|scoped=2
TWO_ID|owner|RLS_dossier_relationships_bilateral_active|scoped=2
=== IDENTITY non_owner
TWO_ID|non_owner|get_user_productivity_metrics(self)|definer=1
TWO_ID|non_owner|get_user_productivity_metrics(owner)|definer=0
TWO_ID|non_owner|get_entity_citations(low1)|definer=1
TWO_ID|non_owner|get_citation_network_graph(low1)|nodes=2|edges=1
TWO_ID|non_owner|get_citation_network_graph(high)|nodes=0|edges=NULL
TWO_ID|non_owner|get_relationship_health_summary|definer=1
TWO_ID|non_owner|RLS_entity_citations|scoped=1
TWO_ID|non_owner|RLS_dossier_relationships_bilateral_active|scoped=1
=== CENSUS-END rolled back
```

Re-run: the same script was executed again after APPLY17 (the qualification-strip re-apply, finished
19:51:03Z; census re-run 19:51:18Z) and produced a byte-identical output (`diff` clean against the block
above), so the counts are the final-revision result as well.

Reading (owner = kazahrani@stats.gov.sa, clearance 3, orgs A+B; non-owner = test.user@gmail.com,
clearance lowered to 1 inside the tx, org B only):

- Owner: definer counts are non-zero and equal the scoped counts on every surface — productivity
  self = 1 = scoped-equivalent; `get_entity_citations(low1)` = 2 = RLS-scoped `entity_citations` = 2;
  `get_relationship_health_summary` = 2 = RLS-scoped bilateral-active relationships = 2; graph edges = 2
  = org-scoped `citation_network` edges = 2.
- Non-owner: definer counts equal the scoped counts and differ from the unscoped control on every
  surface — citations 1 vs 2 unscoped; relationship summary 1 vs 2; graph edges 1 vs 2; productivity
  self 1 vs 2 (and reading the OWNER's productivity row returns 0).
- Start-node gate: the non-owner starting from the high-sensitivity dossier (reachable only through
  org A's citation) gets `nodes=0|edges=NULL` — zero rows and no name — while the owner gets
  `nodes=3|edges=2`. The definer join does not echo the inaccessible start node's title.
- The `ec.citation_context` join is org-scoped in both arms, so the non-owner's incoming row count (1)
  is exactly the org-B citation the invoker-side RLS admitted at HEAD.

## Left for named later tasks

- P100-08 must re-derive its pinned-search_path digest; this task adds seven pinned definer functions
  to that population (and leaves the pre-existing unpinned definer `refresh_user_productivity_metrics`
  to that same sweep — it is outside this task's named conversion set).
- The caller-scoped post-calculate read flagged above needs an overseer ruling once the pre-existing
  42702 in `calculate_relationship_health_scores` is fixed (own task).
- The five views still carry no RLS; row-scoping beyond the re-scoping predicates copied here is a
  different phase's question.
