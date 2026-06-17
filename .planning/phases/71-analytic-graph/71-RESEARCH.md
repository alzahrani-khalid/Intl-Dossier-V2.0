# Phase 71: Analytic Graph - Research

**Researched:** 2026-06-17
**Domain:** Clearance-aware analytic graph queries (Postgres recursive CTEs + participation-table joins) surfaced via the Network panel, a per-dossier "Analyze" affordance, Cmd+K, and a `query_graph` `SECURITY INVOKER` agent RPC.
**Confidence:** HIGH (data model, RPC contract, clearance pattern all verified against migration source); MEDIUM on two items requiring live-DB introspection (effective `dossiers` SELECT policy set; RF-7 high-sensitivity seed inventory) — both flagged with the exact SQL to run.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — v1 query set = the 3 named + an optional 4th shortest-path.** Floor = who-sits-on-which-forum, shared committees, engagement chains over N days (GRAPH-01 verbatim). Promote the existing `get_relationship_path` recursive CTE to a 4th "how are X and Y connected?" query **IF the researcher confirms it is low-cost** (RF-4). _(Claude's discretion.)_
- **D-02 — Entity-anchored parameterized templates.** Typed inputs: 1 entity (forum-membership, engagement-chains), 2 entities (shared-committees, shortest-path), engagement-chains adds an adjustable time-window N (default = planner's call, e.g. 90 days). Launching from a dossier pre-fills the primary entity. _(Claude's discretion.)_
- **D-03 — Structured result primary + a graph view.** Default view = structured list/table/timeline/path keyed to query type; flip to React Flow highlighted-subgraph reuses the Graph/List tabs. Cmd+K shows a compact inline result; the full panel is the deep-link target. Clearance reduction (GRAPH-03) = fewer rows/nodes, never a "filtered" message.
- **D-04 — One analytic experience, three entry points, anchored on the Network panel.** Add an "Analyze" query-picker mode to `/relationships/graph` (`RelationshipGraphPage.tsx`), a per-dossier "Analyze" affordance, and Cmd+K "Analyze:" entries. **NOT a new `/intelligence` tab.**
- **D-05 — New `SECURITY INVOKER` RPCs over the authoritative participation tables; existing DEFINER traversal left as-is.** Named queries ship as new INVOKER analytic RPCs. The 3 existing `SECURITY DEFINER` traversal functions are left untouched (DEFINER status = separate repo-wide hardening follow-up). Exception: the 4th shortest-path query's INVOKER path if it ships.
- **D-06 — Define `query_graph` now + test by direct invocation** (mirrors P69 `read_signals`, P70 `generate_digest`). Clearance-gated `SECURITY INVOKER`, returns clearance-correct results under the caller's JWT; verified by direct RPC invocation with a low-clearance account (success criterion #4). Mastra wraps the same RPC in P72. Single multiplexed RPC vs one-per-query = researcher's call (RF-5).

### Claude's Discretion

- v1 query set (D-01) — 3 named + optional 4th shortest-path (cost-gated).
- Inputs/anchoring + time-window N (D-02) — entity-anchored templates with dossier-context pre-fill; default N is planner's call.
- Data source + existing-traversal fate (D-05) — new INVOKER RPCs over participation tables, leave the 3 DEFINER functions as-is.
- RPC shape (one multiplexed `query_graph` vs per-query), engagement-chain definition, "committee" entity-type set, time-window default = planner/researcher.

### Deferred Ideas (OUT OF SCOPE)

- Mastra/CopilotKit agent that **calls** `query_graph` + conversational graph Q&A → Phase 72. P71 ships the RPC/tool only.
- Converting the 3 existing DEFINER traversal functions to INVOKER as a repo-wide sweep → separate follow-up (D-05). Exception: the 4th shortest-path query's INVOKER path if it ships.
- Custom query builder, saved/named analytic queries, count/window analytics beyond the named set, analytic-result graph export → future.
- Re-embedding/RAG/vLLM/TEI infra → Phase 72 parallel track.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                   | Research Support                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRAPH-01 | Run analytic graph queries (who-sits-on-which-forum, shared committees, engagement chains over N days) from the Network panel | Membership source = `dossier_relationships` typed edges (`member_of`/`participates_in`) for org/forum membership + dedicated `working_group_members` table for WG/committee membership (RF-1); engagement chains = `engagement_participants ⋈ engagement_dossiers` ordered by `start_date` (RF-2); shared committees = `working_group_members` self-intersection (RF-3). All shippable as new INVOKER RPCs over these tables. |
| GRAPH-02 | Launch an analytic graph query from Cmd+K                                                                                     | `CommandPalette.tsx` registers parameterized actions via `quickActions`/`createActions` arrays; current-dossier context read via `location.pathname` regex (existing `cmd-generate-briefing` precedent); compact inline result + deep-link to Network panel "Analyze" mode (RF-6).                                                                                                                                            |
| GRAPH-03 | Analytic graph results are clearance-gated — only within-clearance nodes/edges                                                | INVOKER RPC reads `clearance_level` into a local via `profiles.user_id = auth.uid()` and applies `sensitivity_level <= v_clearance` INLINE at every `dossiers` join (the `generate_digest` pattern), NOT relying on `dossiers` RLS (which has the broken `id = auth.uid()` landmine across multiple migrations — RF-5/RF-7). Indistinguishable-empty by construction (fewer rows).                                            |
| GRAPH-04 | Agent runs analytic graph queries via a clearance-gated `query_graph` tool                                                    | `query_graph` = single multiplexed `SECURITY INVOKER plpgsql RETURNS JSONB` RPC (mirrors `generate_digest`), invoked under the caller JWT via the `graph-traversal` edge-fn pattern (`getUser(token)` → user-context client → `.rpc()`). Direct-invocation test with a low-clearance account (RF-5, success criterion #4).                                                                                                    |

</phase_requirements>

## Summary

The analytic graph has a **fully sufficient, already-deployed data model** — no new tables are required for the 3 named queries. Membership lives in **two** places that the analytic RPCs must union/branch over: (1) **`dossier_relationships`** typed edges (`member_of`, `participates_in`, `participant_in`) for country/org→forum/org membership, and (2) a **dedicated `working_group_members` table** (`member_type`, `organization_id`, `person_id`, `role`, `status`) for working-group/committee membership. There is **no `forum_members`/`forum_participants` table** — forum membership is expressed as `dossier_relationships` edges only. Engagement chains have a single canonical source: `engagement_participants ⋈ engagement_dossiers ⋈ dossiers`, ordered by `engagement_dossiers.start_date` (P67-canonical; the `get_person_full` wrapper already does exactly this).

The decisive architectural finding concerns **clearance enforcement**. The canonical `dossiers` SELECT RLS policy (`20251022000006`) and the `dossier_relationships` SELECT policy both use the **broken landmine form `WHERE id = auth.uid()`** — `profiles` has no `id` column, so the subquery never matches and `COALESCE(...,1)` makes every user see only sensitivity-1 rows. A documented fix migration (`20260610000002` for `position_dossier_links`) confirms this exact bug class and the correct form (`profiles.user_id = auth.uid()`). On top of that, a legacy `99999999999999_fix_dossier_rls.sql` creates a competing `view_dossiers_authenticated` policy comparing the now-INTEGER `sensitivity_level` to string literals `'low'/'medium'`. **Conclusion: the new INVOKER analytic RPCs must NOT rely on `dossiers` RLS for clearance.** They must read `clearance_level` into a local variable via the verified-correct `profiles.user_id = auth.uid()` form and apply `sensitivity_level <= v_clearance` **inline at every `dossiers` reference** — exactly the pattern `generate_digest` (P70) and the existing DEFINER graph functions already use. This is correct under INVOKER regardless of the live `dossiers` policy soup and directly satisfies GRAPH-03/GRAPH-04.

**Primary recommendation:** Ship **one multiplexed `query_graph(p_query_type TEXT, p_entity_id UUID, p_entity_id_2 UUID DEFAULT NULL, p_window_days INTEGER DEFAULT 90)` `SECURITY INVOKER plpgsql RETURNS JSONB` RPC** that mirrors `generate_digest` byte-for-byte on the clearance pattern; back the analyst surface with the **same RPC** via a new `analytic-graph` edge function (or a direct `supabase.rpc`); add an "Analyze" mode to `RelationshipGraphPage.tsx` and `cmd-analyze-*` entries to `CommandPalette.tsx`. Promote `get_relationship_path` to a 4th query type **inside the same INVOKER RPC** (re-implement the recursive CTE in the RPC body with inline clearance — do NOT mutate the existing DEFINER function), which is low-cost and satisfies D-01. All migrations applied via Supabase MCP to staging `zkrcjzdemdmwhearhfgg`.

## Architectural Responsibility Map

| Capability                                                | Primary Tier                                                      | Secondary Tier                 | Rationale                                                                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Clearance enforcement                                     | Database (INVOKER RPC, inline `sensitivity_level <= v_clearance`) | —                              | RLS keystone; MUST run under caller JWT. `dossiers` RLS is unreliable (landmine) → enforce inline. Single source of truth. |
| Analytic query logic (membership/intersection/chain/path) | Database (Postgres CTEs + participation joins)                    | —                              | v7.0 locked: analytic graph stays in Postgres, no external graph DB.                                                       |
| `query_graph` agent tool                                  | Database RPC (`SECURITY INVOKER`)                                 | API (edge fn under caller JWT) | Tool = the RPC; the edge fn / Mastra (P72) only forwards the JWT.                                                          |
| Result → nodes/edges transform                            | API (edge function)                                               | Frontend                       | Mirror `graph-traversal/index.ts`: RPC returns rows/JSONB; edge fn shapes `{nodes, edges, stats}`.                         |
| Query picker, structured result, inline Cmd+K result      | Frontend (React)                                                  | —                              | Presentation only; reuses existing React Flow components + tabs.                                                           |
| Current-dossier context pre-fill                          | Frontend (`location.pathname` regex)                              | —                              | Mirrors existing `cmd-generate-briefing` pattern; no new context plumbing.                                                 |

## Standard Stack

No new packages. Everything required is already in the repo.

### Core

| Library                      | Version          | Purpose                                                                         | Why Standard                                                                                                                |
| ---------------------------- | ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL (Supabase)        | 17.6.1 (staging) | Recursive CTEs + participation joins for all analytic queries                   | v7.0 locked — analytic graph stays in Postgres, no Neo4j [CITED: REQUIREMENTS.md "Out of Scope" / spec §2]                  |
| `@supabase/supabase-js`      | 2.x              | RPC invocation under caller JWT (FE + edge fn)                                  | Existing `graph-traversal` edge fn + `RelationshipGraphPage` pattern [VERIFIED: codebase]                                   |
| `@xyflow/react` (React Flow) | 12.10.1          | Highlighted-subgraph "Graph view" of analytic results                           | Already powering `AdvancedGraphVisualization`/`Enhanced`/`GraphVisualization` [CITED: CONTEXT.md canonical_refs / STACK.md] |
| TanStack Query               | v5               | Result caching (`staleTime: 30000` precedent)                                   | Existing `useQuery(['graph-traversal', ...])` pattern [VERIFIED: codebase]                                                  |
| i18next (static-bundled)     | —                | `graph` / `graph-traversal` / `relationships` namespaces (all registered en+ar) | Reuse/extend; P68 CI guard [VERIFIED: `frontend/src/i18n/index.ts` L297/L383/L417/L515]                                     |

### Supporting

| Library                | Version | Purpose                                                  | When to Use                                                                                                                                        |
| ---------------------- | ------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno std `http/server` | 0.168.0 | Edge-fn runtime for an optional `analytic-graph` edge fn | If wrapping `query_graph` in an edge fn (recommended for parity with `graph-traversal`); or call `supabase.rpc('query_graph', …)` directly from FE |

### Alternatives Considered

| Instead of                        | Could Use                                           | Tradeoff                                                                                                                                                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One multiplexed `query_graph` RPC | One RPC per query type                              | Per-query is cleaner typing but multiplies migration surface, GRANTs, and the agent tool count; the multiplexed JSONB shape is the established `generate_digest`/`read_signals` precedent and is what P72's single `query_graph` tool expects (GRAPH-04 names ONE tool). **Recommend multiplexed.** |
| New `analytic-graph` edge fn      | Direct `supabase.rpc('query_graph', …)` from the FE | Edge fn matches `graph-traversal` (shapes nodes/edges, central perf-warning) and is the same artifact P72 reuses; direct `.rpc` is fewer moving parts but duplicates the row→graph transform in the client. **Recommend a thin edge fn** mirroring `graph-traversal/index.ts`.                      |
| Inline clearance in RPC body      | Rely on `dossiers` RLS                              | `dossiers` RLS is broken/ambiguous (landmine + competing policies — see RF-5/RF-7). Inline is correct under INVOKER unconditionally. **Recommend inline (mandatory).**                                                                                                                              |

**Installation:** None.

**Version verification:** No package installs in this phase → no registry verification required. (Per the Package Legitimacy Gate, the audit section below records "no external packages installed.")

## Package Legitimacy Audit

**No external packages are installed in Phase 71.** All work is SQL migrations (applied via Supabase MCP), one optional Deno edge function (uses already-pinned `std@0.168.0` + `esm.sh/@supabase/supabase-js@2`, identical to the existing `graph-traversal` function), and React/TS changes using libraries already in `package.json` (`@xyflow/react@12.10.1`, `@supabase/supabase-js@2`, TanStack Query v5, i18next). slopcheck/registry verification is N/A — zero new dependencies.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                          ┌─────────────────────────────────────────────┐
   ANALYST SURFACE        │             AGENT SURFACE (P72)             │
                          │                                             │
  Cmd+K "Analyze:"        │   Mastra query_graph tool (NOT this phase)  │
  (CommandPalette.tsx)    │                  │                          │
        │                 └──────────────────┼──────────────────────────┘
        │  pathname regex →                  │
        │  pre-fill entity                   │
        ▼                                     ▼
  /relationships/graph?dossierId=X&mode=analyze&query=<type>
  (RelationshipGraphPage.tsx — "Analyze" picker mode, D-04)
        │
        │  POST/GET with Authorization: Bearer <caller JWT>
        ▼
  ┌──────────────────────────────────────────────┐
  │  edge fn  analytic-graph/index.ts             │   ← mirrors graph-traversal/index.ts
  │  1. token = authHeader.replace('Bearer ','')  │
  │  2. supabaseClient = createClient(..., {       │
  │       global:{headers:{Authorization}}})       │
  │  3. await supabaseClient.auth.getUser(token)   │   ← RLS context established
  │  4. supabaseClient.rpc('query_graph', {...})   │
  │  5. shape rows/JSONB → {nodes, edges, stats}   │
  └───────────────────────┬──────────────────────┘
                          │  runs under CALLER JWT
                          ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  query_graph(p_query_type, p_entity_id, p_entity_id_2, p_window) │
  │  SECURITY INVOKER · plpgsql · RETURNS JSONB                      │
  │                                                                  │
  │  v_clearance := SELECT clearance_level FROM profiles            │
  │                 WHERE user_id = auth.uid()  ── CORRECT FORM      │
  │                                                                  │
  │  CASE p_query_type                                               │
  │   'forum_membership'  → dossier_relationships (member_of /       │
  │                          participates_in) ⋈ dossiers             │
  │   'shared_committees' → working_group_members self-INTERSECT     │
  │                          ⋈ dossiers (the two entities' WGs)      │
  │   'engagement_chain'  → engagement_participants ⋈                │
  │                          engagement_dossiers ⋈ dossiers          │
  │                          ORDER BY start_date, window N days      │
  │   'shortest_path'(D-01)→ WITH RECURSIVE over dossier_relationships│
  │                          (re-impl get_relationship_path inline)  │
  │  END                                                             │
  │  ── EVERY dossiers join carries: AND d.sensitivity_level         │
  │     <= v_clearance   (inline clearance, NOT dossiers RLS)        │
  └────────────────────────────────────────────────────────────────┘
                          │
                          ▼  clearance-filtered rows only
            dossier_relationships · working_group_members ·
            engagement_participants · engagement_dossiers · dossiers
```

The reader traces the primary use case (forum membership from a country dossier) thus: user opens `/dossiers/countries/<id>`, hits Cmd+K → "Analyze: who-sits-on-which-forum" (entity pre-filled from pathname) → deep-links to `/relationships/graph?dossierId=<id>&mode=analyze&query=forum_membership` → edge fn forwards the JWT → `query_graph('forum_membership', <id>)` joins `dossier_relationships` (where `relationship_type IN ('member_of','participates_in','participant_in')`) to `dossiers` with `sensitivity_level <= v_clearance` → returns the forums/orgs the country belongs to, clearance-filtered.

### Recommended Project Structure

```
supabase/migrations/
└── 20260617_phase71_query_graph.sql   # query_graph multiplexed INVOKER RPC + perf indexes
supabase/functions/
└── analytic-graph/index.ts            # thin edge fn (mirror of graph-traversal/index.ts)
frontend/src/
├── pages/relationships/
│   └── RelationshipGraphPage.tsx       # + "Analyze" picker mode (search-param driven, D-04)
├── routes/_protected/relationships/
│   └── graph.tsx                       # + validateSearch: mode?/query?/entity2?/windowDays?
├── components/relationships/
│   ├── AnalyticQueryPicker.tsx         # NEW — query template selector + typed inputs (D-02)
│   └── AnalyticResultView.tsx          # NEW — structured list/table/timeline/path (D-03)
├── components/keyboard-shortcuts/
│   └── CommandPalette.tsx              # + cmd-analyze-* actions + compact inline result (RF-6)
├── hooks/
│   └── useAnalyticGraph.ts             # NEW — useQuery wrapper for query_graph
└── i18n/{en,ar}/graph.json             # extend (analyze.* keys); namespace already registered
```

### Pattern 1: Multiplexed `SECURITY INVOKER` JSONB RPC with inline clearance

**What:** A single plpgsql RPC dispatching on `p_query_type`, returning `jsonb_build_object(...)`, reading clearance into a local and filtering every `dossiers` join inline.
**When to use:** This is THE pattern for `query_graph` (GRAPH-04) and the analyst RPC (GRAPH-01/03). It is the verbatim `generate_digest` shape.
**Example:**

```sql
-- Source: supabase/migrations/20260615_phase70_digests_alerts.sql (generate_digest, L333-449) — VERIFIED
CREATE OR REPLACE FUNCTION public.query_graph(
  p_query_type   TEXT,                    -- 'forum_membership'|'shared_committees'|'engagement_chain'|'shortest_path'
  p_entity_id    UUID,
  p_entity_id_2  UUID DEFAULT NULL,       -- required for shared_committees, shortest_path
  p_window_days  INTEGER DEFAULT 90       -- engagement_chain only
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER          -- GRAPH-04: runs under caller JWT
STABLE
AS $$
DECLARE
  v_clearance INTEGER := 0;               -- default 0 = deny-all (matches generate_digest)
  v_result    JSONB;
BEGIN
  -- CORRECT clearance form (profiles has NO id column — user_id = auth.uid())
  SELECT COALESCE((SELECT p.clearance_level FROM public.profiles p
                   WHERE p.user_id = auth.uid()), 0)
  INTO v_clearance;

  IF p_query_type = 'forum_membership' THEN
    SELECT jsonb_build_object(
      'query_type', p_query_type,
      'entity_id',  p_entity_id,
      'nodes', COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
                 'id', d.id, 'type', d.type,
                 'name_en', d.name_en, 'name_ar', d.name_ar,
                 'relationship_type', dr.relationship_type)), '[]'::jsonb)
    ) INTO v_result
    FROM public.dossier_relationships dr
    JOIN public.dossiers d
      ON d.id = CASE WHEN dr.source_dossier_id = p_entity_id
                     THEN dr.target_dossier_id ELSE dr.source_dossier_id END
    WHERE (dr.source_dossier_id = p_entity_id OR dr.target_dossier_id = p_entity_id)
      AND dr.relationship_type IN ('member_of','participates_in','participant_in')
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND d.status <> 'archived'
      AND d.sensitivity_level <= v_clearance;          -- INLINE clearance, NOT dossiers RLS
  -- ELSIF p_query_type = 'shared_committees' THEN ...  (see Pattern 2)
  -- ELSIF p_query_type = 'engagement_chain'  THEN ...  (see Pattern 3)
  -- ELSIF p_query_type = 'shortest_path'     THEN ...  (see Pattern 4)
  END IF;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.query_graph(TEXT, UUID, UUID, INTEGER) TO authenticated;
```

### Pattern 2: Shared committees = `working_group_members` self-intersection

**What:** Both entities' active WG memberships, intersected on `working_group_id`, joined to the WG dossier for clearance.

```sql
-- working_group_members: member_type ∈ {organization, person}; organization_id→organizations(id)=dossier id;
-- person_id (no FK) = a person dossier id; working_group_id→working_groups(id)=dossier id. [VERIFIED: 20260110000006]
SELECT jsonb_agg(DISTINCT jsonb_build_object(
         'working_group_id', wg_d.id, 'name_en', wg_d.name_en, 'name_ar', wg_d.name_ar))
FROM working_group_members m1
JOIN working_group_members m2
  ON m2.working_group_id = m1.working_group_id
JOIN dossiers wg_d ON wg_d.id = m1.working_group_id      -- the WG IS a dossier
WHERE (m1.organization_id = p_entity_id OR m1.person_id = p_entity_id)
  AND (m2.organization_id = p_entity_id_2 OR m2.person_id = p_entity_id_2)
  AND m1.status = 'active' AND m2.status = 'active'
  AND wg_d.status <> 'archived'
  AND wg_d.sensitivity_level <= v_clearance;             -- INLINE clearance
```

### Pattern 3: Engagement chain = canonical participation timeline over N days

**What:** Time-ordered engagements an entity participated in, within N days. Single canonical source (RF-2).

```sql
-- Canonical plane (P67): engagement_participants ⋈ engagement_dossiers ⋈ dossiers.
-- Mirrors get_person_full recent_engagements (20260613100000). Order on engagement_dossiers.start_date.
SELECT jsonb_agg(jsonb_build_object(
         'engagement_id', ed.id, 'name_en', d.name_en, 'name_ar', d.name_ar,
         'engagement_type', ed.engagement_type, 'start_date', ed.start_date, 'end_date', ed.end_date
       ) ORDER BY ed.start_date DESC)
FROM engagement_participants ep
JOIN engagement_dossiers ed ON ed.id = ep.engagement_id
JOIN dossiers d            ON d.id  = ed.id
WHERE ep.participant_dossier_id = p_entity_id
  AND ed.start_date >= now() - make_interval(days => p_window_days)
  AND d.status <> 'archived'
  AND d.sensitivity_level <= v_clearance;                -- INLINE clearance
```

**Engagement-chain definition decision (resolves RF-2):** "chain" = a **per-entity time-ordered timeline** of the engagements the anchor entity participated in within N days (ordered on `engagement_dossiers.start_date`, which is `TIMESTAMPTZ NOT NULL`). This is the simplest correct reading, matches the existing `get_person_full` wrapper, and is index-served. Shared-participant linkage _between consecutive engagements_ (i.e., "who else was in both") is an OPTIONAL enrichment the planner may add as an edge set, but is NOT required for GRAPH-01.

### Pattern 4: Shortest path (D-01, 4th query) — re-impl the recursive CTE inline under INVOKER

**What:** Promote `get_relationship_path` semantics into the `query_graph` body (do NOT mutate the existing DEFINER function — D-05).
**Cost (resolves RF-4): LOW.** The CTE already exists verbatim in `20251022000008` (L185-236). Copying its `WITH RECURSIVE path_search` body into the `query_graph` plpgsql branch and appending `AND d.sensitivity_level <= v_clearance` at the final `dossiers` join makes it INVOKER-correct without touching the DEFINER original. **Ship the 4th query.**

```sql
-- Source: get_relationship_path (20251022000008 L200-236) — copy body, add inline clearance on the path's dossiers.
WITH RECURSIVE path_search AS (
  SELECT ARRAY[p_entity_id, dr.target_dossier_id] AS path,
         ARRAY[dr.relationship_type] AS rel_path, 1 AS len, dr.target_dossier_id AS cur
  FROM dossier_relationships dr
  WHERE dr.source_dossier_id = p_entity_id AND dr.status = 'active'
    AND (dr.effective_to IS NULL OR dr.effective_to > now())
  UNION
  SELECT ps.path || dr.target_dossier_id, ps.rel_path || dr.relationship_type, ps.len + 1, dr.target_dossier_id
  FROM path_search ps
  JOIN dossier_relationships dr ON dr.source_dossier_id = ps.cur
  WHERE ps.len < 5 AND NOT (dr.target_dossier_id = ANY(ps.path))
    AND dr.status = 'active' AND ps.cur <> p_entity_id_2
)
SELECT jsonb_build_object('path', ps.path, 'relationship_path', ps.rel_path, 'path_length', ps.len)
FROM path_search ps
WHERE ps.cur = p_entity_id_2
  -- clearance: every dossier on the path must be within clearance, else the path is "invisible"
  AND NOT EXISTS (SELECT 1 FROM unnest(ps.path) pid
                  JOIN dossiers d ON d.id = pid
                  WHERE d.sensitivity_level > v_clearance)
ORDER BY ps.len LIMIT 1;
```

> Note: the inline-clearance NOT-EXISTS on the path is _stricter_ than the existing DEFINER function (which only clears the endpoint set in `traverse_relationship_graph`, not every hop in `get_relationship_path`). This is the GRAPH-03-correct behavior: a path that _passes through_ an above-clearance node must not be revealed.

### Edge-function pattern (mirror `graph-traversal/index.ts`)

```ts
// Source: supabase/functions/graph-traversal/index.ts (L56-126) — VERIFIED
const token = authHeader.replace('Bearer ', '')
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
})
const {
  data: { user },
} = await supabaseClient.auth.getUser(token) // establishes RLS ctx
if (!user) return 401
const { data, error } = await supabaseClient.rpc('query_graph', {
  p_query_type: queryType,
  p_entity_id: entityId,
  p_entity_id_2: entityId2 ?? null,
  p_window_days: windowDays ?? 90,
})
// then shape data → { nodes, edges, stats:{ node_count, edge_count, query_time_ms, performance_warning } }
```

### Anti-Patterns to Avoid

- **Relying on `dossiers` RLS for clearance in the INVOKER RPC.** The live `dossiers` SELECT policy set is broken/ambiguous (RF-5/RF-7). Always inline `sensitivity_level <= v_clearance`.
- **Using `WHERE id = auth.uid()` for the clearance subquery.** `profiles` has NO `id` column → silently binds to the outer table → NULL → blocks all reads (P69 EXEC landmine; documented in `20260610000002`). Always `WHERE user_id = auth.uid()`.
- **Mutating the 3 existing DEFINER functions.** D-05 leaves them as-is; re-implement the path CTE inside `query_graph`.
- **Joining `working_group_members` straight to `dossiers` on `member_type`.** It has separate `organization_id`/`person_id` columns (a CHECK enforces exactly one); branch on `member_type` or `COALESCE(organization_id, person_id)`.
- **Ordering engagement chains on `created_at`/`updated_at`.** Order on `engagement_dossiers.start_date` (the domain date; `TIMESTAMPTZ NOT NULL`).
- **Treating `dossier_relationships` as having `parent_dossier_id`/`child_dossier_id`.** That was a pre-Oct-2025 schema; `20251022000003` DROPped and recreated it with `source_dossier_id`/`target_dossier_id`. (One legacy seed still references the old columns — it is dead.)

## Don't Hand-Roll

| Problem                       | Don't Build                             | Use Instead                                                                                                                                   | Why                                            |
| ----------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Clearance read + filter       | A new clearance helper or per-query RLS | The `generate_digest` inline pattern (`SELECT clearance_level FROM profiles WHERE user_id = auth.uid()` + `sensitivity_level <= v_clearance`) | Proven correct live (P70); avoids the landmine |
| JWT→RLS context in the API    | A custom auth shim                      | `graph-traversal/index.ts` token→`getUser`→user-client→`.rpc`                                                                                 | Identical requirement; copy it                 |
| Result graph rendering        | A new React Flow integration            | `AdvancedGraphVisualization` (accepts `nodes/edges/centerNodeId`, has a built-in `PathFindingPanel`)                                          | Already the Network panel's renderer           |
| Shortest-path CTE             | A new pathfinding algorithm             | The existing `get_relationship_path` CTE body (copy into `query_graph`)                                                                       | Tested recursive CTE with cycle guards         |
| Cmd+K context pre-fill        | New route-context plumbing              | `location.pathname` regex (`cmd-generate-briefing` precedent)                                                                                 | Zero new state; matches the codebase           |
| Membership/intersection joins | New junction tables                     | `dossier_relationships` (edges) + `working_group_members` (WG)                                                                                | Both already deployed + indexed                |

**Key insight:** This phase is overwhelmingly **assembly of existing, deployed primitives**. The only genuinely new SQL is the `query_graph` dispatcher; everything it calls (the membership edges, the WG member table, the canonical engagement plane, the path CTE, the clearance expression) already exists and is index-served.

## Runtime State Inventory

Phase 71 is **additive** (new RPC + new edge fn + new FE surfaces). It is not a rename/refactor/migration of existing runtime state. Per-category:

| Category            | Items Found                                                                                                                                                                                                                        | Action Required                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Stored data         | None renamed. New high-sensitivity fixture rows seeded for RF-7 verification (sensitivity 3–4 in `dossiers` + `working_group_members`/`engagement_participants`/`dossier_relationships`) are TEST data to be seed→observe→restore. | Seed + restore during UAT only |
| Live service config | None. The `analytic-graph` edge fn is a new deploy (Supabase CLI/MCP), not a reconfig of an existing one.                                                                                                                          | Deploy new edge fn             |
| OS-registered state | None — verified by absence of any cron/scheduler/task references in scope (analytic queries are request-driven, unlike P70 digests).                                                                                               | None                           |
| Secrets/env vars    | None — reuses existing `SUPABASE_URL`/`SUPABASE_ANON_KEY` (already present for `graph-traversal`).                                                                                                                                 | None                           |
| Build artifacts     | None — no package renames; no egg-info/compiled-binary analogues.                                                                                                                                                                  | None                           |

**Nothing found in OS-registered state / secrets / build artifacts** — verified by grepping scope for cron/scheduler (none) and confirming no new env keys or package renames.

## Common Pitfalls

### Pitfall 1: Clearance landmine (`id` vs `user_id`)

**What goes wrong:** Using `WHERE id = auth.uid()` in the clearance subquery returns NULL (profiles has no `id` col) → `COALESCE(...,1)` → every caller sees only sensitivity-1 rows; GRAPH-03 "appears" to pass on the all-sensitivity-1 staging data but is actually deny-all-above-1 for everyone.
**Why it happens:** Three live migrations (`20251022000006` dossiers, `dossier_relationships` policy, and the original `position_dossier_links`) shipped this bug; it is the single most repeated defect in this codebase.
**How to avoid:** `WHERE user_id = auth.uid()` always. Plan-checker should grep every new RPC/migration for `profiles WHERE id = auth.uid()` and fail on a hit.
**Warning signs:** Two different-clearance accounts return IDENTICAL node counts on a query that includes a sensitivity-3 fixture.

### Pitfall 2: GRAPH-03 unprovable on current staging data

**What goes wrong:** Staging is ~all sensitivity-1 (P68: L1=388, L3=5 _profiles_; dossier sensitivity is overwhelmingly 1). A clearance-reduction test produces identical counts not because clearance works, but because there's nothing above clearance to hide.
**Why it happens:** No seeded above-clearance _participation_ data exists (RF-7).
**How to avoid:** Seed a fixture set: a forum/WG at `sensitivity_level = 3` with a member, and an engagement at `sensitivity_level = 4` with a participant, all linked to a low-sensitivity anchor entity. Run the query as clearance-1 vs clearance-3 vs clearance-4 accounts; assert strictly increasing node/edge counts. Restore after.
**Warning signs:** "Strictly reduced" can't be demonstrated because both accounts see the same rows.

### Pitfall 3: Competing `dossiers` SELECT policies bypassing clearance

**What goes wrong:** Permissive SELECT policies are OR-ed in Postgres. If `view_dossiers_authenticated` (legacy, `99999999999999`) is live alongside the clearance policy, a relied-upon RLS gate could leak. (Mitigated entirely by inline clearance — but matters if anyone is tempted to drop the inline filter.)
**Why it happens:** Migration drift — multiple `dossiers` SELECT policies created across `20250930002`, `20251022000006`, `99999999999999`, none cleanly superseding the others by filename order.
**How to avoid:** Inline clearance in the RPC (does not depend on which policies are active). Optionally, the planner adds a _verification-only_ step to enumerate live `dossiers` policies (SQL below) and a follow-up to consolidate them (out of GRAPH scope).
**Warning signs:** `pg_policies` shows >1 permissive SELECT policy on `dossiers`.

### Pitfall 4: `working_group_members.person_id` has no FK

**What goes wrong:** `person_id` references a person _dossier_ id but carries no FK constraint; a naive `JOIN persons p ON p.id = m.person_id` is fine, but assuming referential integrity (or that `person_id` always resolves to a live dossier) can drop rows or error.
**How to avoid:** Join to `dossiers` (the CTI root) not `persons`, and tolerate nulls via the `member_type` branch.

### Pitfall 5: i18n silent-English fallback

**What goes wrong:** New `analyze.*` keys added under an unregistered namespace fall back to English in BOTH languages.
**How to avoid:** Extend the **already-registered** `graph` namespace (en+ar) rather than creating a new one. P68 CI guard catches unregistered namespaces.

## Code Examples

### Verify the live `dossiers` SELECT policy set (run via Supabase MCP before planning the clearance approach)

```sql
-- RF-5 / RF-7: enumerate ALL permissive SELECT policies on dossiers to confirm the inline-clearance decision.
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy
WHERE polrelid = 'public.dossiers'::regclass AND polcmd IN ('r','*');
-- Also confirm sensitivity_level is integer (it is, per 20251022000001):
SELECT data_type FROM information_schema.columns
WHERE table_name='dossiers' AND column_name='sensitivity_level';   -- expect 'integer'
```

### RF-1 membership reality check (run live to confirm where membership data actually sits)

```sql
-- How much forum/org membership is in dossier_relationships?
SELECT relationship_type, count(*) FROM dossier_relationships
WHERE status='active' GROUP BY 1 ORDER BY 2 DESC;
-- How much WG membership is in the dedicated table?
SELECT member_type, status, count(*) FROM working_group_members GROUP BY 1,2;
-- Engagement participation volume (chain source):
SELECT count(*) FROM engagement_participants;
```

### RF-7 seed (high-sensitivity fixture — illustrative; finalize entity ids during execution)

```sql
-- Seed a sensitivity-3 forum + member edge from a low-sensitivity country anchor, and a
-- sensitivity-4 engagement + participant, so clearance-1 vs clearance-3/4 produce strictly different counts.
-- (Wrap in a transaction; capture ids; DELETE on restore.)
INSERT INTO dossiers (name_en,name_ar,type,status,sensitivity_level)
  VALUES ('TEST Secret Forum','منتدى سري للاختبار','forum','active',3) RETURNING id;  -- → :forum
INSERT INTO forums (id) VALUES (:forum);
INSERT INTO dossier_relationships (source_dossier_id,target_dossier_id,relationship_type,status)
  VALUES (:anchor_country, :forum, 'member_of','active');
-- … analogous sensitivity-4 engagement_dossiers + engagement_participants row.
```

## State of the Art

| Old Approach                                                                                | Current Approach                                                     | When Changed                        | Impact                                                                                          |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `dossier_relationships` with `parent_dossier_id`/`child_dossier_id`/`relationship_strength` | `source_dossier_id`/`target_dossier_id`/`status`/`effective_from/to` | `20251022000003` (DROP+CREATE)      | Analytic RPCs MUST use source/target; the old seed (`20250107014`) is dead                      |
| `person_engagements` (legacy participation)                                                 | `engagement_participants ⋈ engagement_dossiers` (P67 canonical)      | P67 (`20260613100000` wrapper)      | Engagement chains read the canonical plane only; `person_engagements` is fenced off (ENGPOS-01) |
| Role-derived clearance (1–3, `user_roles`)                                                  | `profiles.clearance_level` (1–4) via `get_user_clearance_level` shim | P68 (`20260614000001`)              | Single canonical scale; inline RPC clearance reads `profiles.clearance_level`                   |
| `sensitivity_level` string (`low/medium/high`)                                              | INTEGER 1–4                                                          | unified dossiers (`20251022000001`) | `99999999999999` legacy string-comparison policy is non-functional on the integer column        |

**Deprecated/outdated:**

- `generate_forum_member_suggestions` and siblings (`20260115400001`) reference **`person_engagements`** (legacy) and assume a forum-member set derived from engagements — do NOT reuse their membership logic; they predate the P67 canonical plane. (Their `working_group_members`/`working_group_member_suggestions` joins ARE current.)
- The `99999999999999_fix_dossier_rls.sql` policy is legacy (string comparison; references a non-existent `user_roles` path).

## Assumptions Log

| #   | Claim                                                                                                                                                                    | Section            | Risk if Wrong                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | The live `dossiers` SELECT RLS is effectively the broken/ambiguous set described (landmine `id=auth.uid()` + competing legacy policy), so inline clearance is mandatory. | RF-5/RF-7, Summary | LOW — inline clearance is correct _regardless_ of the live policy set; this only affects whether a consolidation follow-up is also warranted. Verify with the `pg_policy` SQL above.                                                                      |
| A2  | Forum membership on live staging is represented (where present) as `dossier_relationships` edges, NOT a dedicated table (none exists in migrations).                     | RF-1               | MEDIUM — if a forum-participants table was added ad-hoc (not in migrations, like the persons org-isolation policies were), the forum-membership branch would miss it. Run the RF-1 membership-volume SQL to confirm row distribution.                     |
| A3  | Staging has effectively no sensitivity 3–4 participation data, so RF-7 requires fresh seeding.                                                                           | RF-7, Pitfall 2    | LOW — worst case some high-sensitivity data already exists and the seed is redundant; the seed→observe→restore protocol is safe either way.                                                                                                               |
| A4  | `engagement_participants.participant_dossier_id` is populated for person participants (the chain anchor).                                                                | RF-2, Pattern 3    | MEDIUM — if most participants are `external` (name-only, null `participant_dossier_id`), chains from a person entity may be sparse; the query is still correct. Confirm with `SELECT participant_type, count(*) FROM engagement_participants GROUP BY 1`. |
| A5  | The 4th shortest-path query is low-cost (copy existing CTE + inline clearance).                                                                                          | RF-4, Pattern 4    | LOW — the CTE is verified present and tested; the only addition is the path-wide clearance NOT-EXISTS.                                                                                                                                                    |

## Open Questions (RESOLVED)

> All three were closed before planning proceeded — architecturally (inline clearance) or operationally (the plan 71-01 seed fixture). Each carries an inline `RESOLVED` marker below; live introspection SQL remains as a non-blocking verification step in execution.

1. **Effective `dossiers` SELECT policy set on live staging (RF-5/RF-7).**
   - What we know: ≥3 competing policies exist in migrations; the canonical one uses the broken `id=auth.uid()` form; the legacy one compares an integer to strings.
   - What's unclear: which policies are _actually present_ on `zkrcjzdemdmwhearhfgg`, and whether the landmine policy was fixed post-P68.
   - Recommendation: Inline clearance in `query_graph` (decouples us from this). Add a verification-only step running the `pg_policy` SQL; if >1 permissive SELECT policy or a broken predicate is found, file a consolidation follow-up (out of GRAPH-01..04 scope).
   - **RESOLVED:** `query_graph` applies clearance INLINE at every `dossiers` join and does NOT rely on `dossiers` SELECT RLS, so correctness is independent of the live policy set (Pitfall 3 + Summary). The `pg_policy` enumeration is retained as a non-blocking verification step; any consolidation is an out-of-scope follow-up. No planning dependency remains.

2. **Forum-membership data volume + shape (RF-1).**
   - What we know: no `forum_members` table; `dossier_relationships` carries `member_of`/`participates_in`/`participant_in`.
   - What's unclear: how many active forum/org membership edges actually exist live (seed coverage is thin; the canonical relationships seed is `20251022000007`, but Saudi's edges were authored against the dead parent/child schema).
   - Recommendation: Run the RF-1 membership-volume SQL during planning; if forum membership edges are sparse, seed a small forum-membership fixture alongside the RF-7 high-sensitivity fixture so the "who-sits-on-which-forum" demo returns a non-empty result.
   - **RESOLVED:** Plan 71-01 seeds a forum-membership fixture as part of the RF-7 seed/restore module, so the "who-sits-on-which-forum" demo returns a non-empty result regardless of live edge volume. The membership-volume SQL is a non-blocking verification step. No planning dependency remains.

3. **Engagement participant identity coverage (RF-2/A4).**
   - What we know: `engagement_participants` distinguishes `person/organization/country/external`; only non-`external` rows carry `participant_dossier_id`.
   - What's unclear: the live ratio of resolvable participants.
   - Recommendation: Confirm with the participant-type count SQL; seed at least one person↔engagement chain for the UAT demo if sparse.
   - **RESOLVED:** Plan 71-01 seeds at least one person↔engagement chain (resolvable `participant_dossier_id`) in the RF-7 fixture, so the engagement-chain demo is non-empty even if live participants are mostly `external`. The participant-type count SQL is a non-blocking verification step. No planning dependency remains.

## Environment Availability

| Dependency                                                    | Required By                                  | Available                           | Version                         | Fallback                                                         |
| ------------------------------------------------------------- | -------------------------------------------- | ----------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| PostgreSQL (Supabase staging)                                 | All analytic RPCs                            | ✓                                   | 17.6.1 (`zkrcjzdemdmwhearhfgg`) | —                                                                |
| Supabase MCP (migration apply)                                | Applying `query_graph` migration + RF-7 seed | ✓ (orchestrator; executor lacks it) | —                               | Author SQL in-repo, orchestrator applies (64-01/67-06 precedent) |
| `@xyflow/react`                                               | Result graph view                            | ✓                                   | 12.10.1                         | —                                                                |
| `graph` / `graph-traversal` / `relationships` i18n namespaces | Analyze UI copy                              | ✓                                   | registered en+ar                | —                                                                |
| Supabase Edge Functions runtime (Deno)                        | `analytic-graph` edge fn                     | ✓                                   | std@0.168.0                     | Call `supabase.rpc('query_graph')` directly from FE (no edge fn) |
| Mastra agent runtime                                          | `query_graph` _wrapping_                     | ✗ (P72)                             | —                               | Out of scope — P71 tests by DIRECT RPC invocation (D-06)         |

**Missing dependencies with no fallback:** none block P71.
**Missing dependencies with fallback:** Mastra runtime is absent but explicitly out of scope (P72); P71's GRAPH-04 acceptance is direct RPC invocation, which needs no runtime.

## Validation Architecture

> Nyquist validation is ENABLED (`workflow.nyquist_validation: true`).

### Test Framework

| Property           | Value                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Framework          | Vitest (unit/integration) + Playwright (E2E) + axe-core (a11y)                                  |
| Config file        | `frontend/vitest.config.ts`; backend integration under `backend/tests/`                         |
| Quick run command  | `pnpm --filter intake-frontend test -- --run src/hooks/__tests__/useAnalyticGraph.test.ts`      |
| Full suite command | `pnpm test` (Vitest) + targeted `pnpm --filter backend test -- query-graph.integration.test.ts` |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                                                         | Test Type                           | Automated Command                                                         | File Exists?                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| GRAPH-01 | `query_graph('forum_membership'/'shared_committees'/'engagement_chain', …)` returns expected rows on seeded data | integration (RPC)                   | `pnpm --filter backend test -- query-graph.integration.test.ts`           | ❌ Wave 0 (model on `generate-digest.integration.test.ts`) |
| GRAPH-01 | "Analyze" picker renders + runs from Network panel                                                               | unit + E2E                          | `pnpm --filter intake-frontend test -- AnalyticQueryPicker.test.tsx`      | ❌ Wave 0                                                  |
| GRAPH-02 | Cmd+K "Analyze:" entry pre-fills entity from current dossier + shows inline result                               | unit                                | `pnpm --filter intake-frontend test -- CommandPalette.analyze.test.tsx`   | ❌ Wave 0                                                  |
| GRAPH-03 | Two clearance levels → strictly different node/edge counts for the same query                                    | integration (RLS, dual-account)     | `pnpm --filter backend test -- query-graph.clearance.integration.test.ts` | ❌ Wave 0 + live UAT                                       |
| GRAPH-04 | `query_graph` under a low-clearance JWT returns zero above-clearance nodes                                       | integration (direct RPC invocation) | `pnpm --filter backend test -- query-graph.invoker.integration.test.ts`   | ❌ Wave 0 + live UAT                                       |

### Sampling Rate

- **Per task commit:** the relevant single test file (`--run` Vitest, <30s).
- **Per wave merge:** full Vitest suite + the `query-graph.*.integration.test.ts` set.
- **Phase gate:** full suite green + the live UAT below before `/gsd:verify-work`.

### Live UAT (the load-bearing verification — mirrors the milestone cross-cutting bar)

1. **Criterion #1/#2 (run + Cmd+K):** From a seeded country/org dossier, run "who-sits-on-which-forum" from the Network panel AND launch the same via Cmd+K ("Analyze: …") → both return a non-empty result. EN + AR.
2. **Criterion #3 (clearance reduction — the proof):** Seed a sensitivity-3 forum-membership edge and a sensitivity-4 engagement off a low-sensitivity anchor. Log in as a clearance-1 account and a clearance-3 (and clearance-4) account; run the **identical** query from each; record node/edge counts; assert **strictly increasing** counts with clearance. **No "filtered by clearance" message anywhere** (indistinguishable-empty). Verify the RLS-denied path via **CDP `Network.setBlockedURLs`** (RLS denial returns empty `200`s — assert on `role="alert"`/empty-state and reduced counts, not HTTP status). Restore.
3. **Criterion #4 (agent-tool direct invocation):** Invoke `query_graph` directly (REST `/rest/v1/rpc/query_graph` or `supabase.rpc`) under a **low-clearance** JWT against a query whose full result includes an above-clearance node; assert the returned JSONB contains **zero** above-clearance nodes. Repeat under a high-clearance JWT to confirm the node appears (proves the gate is real, not just empty data).

### Wave 0 Gaps

- [ ] `backend/tests/intelligence/query-graph.integration.test.ts` — covers GRAPH-01 (model on `generate-digest.integration.test.ts`)
- [ ] `backend/tests/intelligence/query-graph.clearance.integration.test.ts` — covers GRAPH-03 (dual-account; needs two clearance-level service tokens / impersonation)
- [ ] `backend/tests/intelligence/query-graph.invoker.integration.test.ts` — covers GRAPH-04 (direct RPC under caller JWT)
- [ ] `frontend/src/components/relationships/__tests__/AnalyticQueryPicker.test.tsx`, `AnalyticResultView.test.tsx`
- [ ] `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.analyze.test.tsx`
- [ ] RF-7 seed/restore fixture (high-sensitivity forum + engagement + WG member) — shared by the clearance tests and live UAT

## Security Domain

> `security_enforcement` is absent in config → treated as ENABLED.

### Applicable ASVS Categories

| ASVS Category       | Applies | Standard Control                                                                                                                            |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| V1 Architecture     | yes     | INVOKER + RLS keystone (analytic RPC runs under caller JWT)                                                                                 |
| V4 Access Control   | yes     | `sensitivity_level <= clearance_level` enforced INLINE in every `dossiers` join; `query_graph` GRANT to `authenticated` only                |
| V5 Input Validation | yes     | `p_query_type` validated against the fixed set (else return null/empty); entity ids are UUIDs (typed); `p_window_days` bounded (e.g. 1–365) |
| V6 Cryptography     | no      | No new crypto; JWT handled by Supabase                                                                                                      |
| V7 Error Handling   | yes     | Indistinguishable-empty on clearance denial (no "filtered" leak); edge fn returns generic errors (mirror `graph-traversal`)                 |
| V8 Data Protection  | yes     | No classified content in deep-links/logs; result payloads already clearance-filtered                                                        |

### Known Threat Patterns for {Postgres INVOKER RPC + edge fn under JWT}

| Pattern                                                                     | STRIDE                                          | Standard Mitigation                                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Clearance bypass via broken `id=auth.uid()` subquery                        | Elevation of Privilege / Information Disclosure | Use `profiles.user_id = auth.uid()`; inline `<= v_clearance`; plan-checker greps for the bad form                  |
| Path traversal reveals an above-clearance intermediary node (shortest_path) | Information Disclosure                          | Path-wide clearance NOT-EXISTS (every hop within clearance), not just endpoints                                    |
| Reliance on `dossiers` RLS that is OR-ed with a permissive legacy policy    | Information Disclosure                          | Inline clearance in the RPC (independent of RLS); verification step enumerates live policies                       |
| `query_graph` reachable by `anon`                                           | Elevation of Privilege                          | `REVOKE … FROM PUBLIC, anon; GRANT … TO authenticated` (mirror `get_person_full` hardening)                        |
| `query_type` injection / unbounded window → perf DoS                        | Denial of Service                               | Whitelist `p_query_type`; bound `p_window_days`; reuse the `performance_warning`/`query_time_ms` budget (>2s warn) |
| Enumeration via differential errors (exists vs denied)                      | Information Disclosure                          | Same empty result for "no data" and "above clearance" (indistinguishable)                                          |

## Sources

### Primary (HIGH confidence — read directly this session)

- `supabase/migrations/20251022000008_create_graph_functions.sql` — the 3 DEFINER graph functions; `get_relationship_path` CTE (4th-query source); inline clearance form (`WHERE user_id = auth.uid()`, L76-80).
- `supabase/migrations/20251022000003_create_relationships.sql` — canonical `dossier_relationships` (source/target/status/effective\_\*); DROP+CREATE supersedes the parent/child seed.
- `supabase/migrations/20251022000002_create_extension_tables.sql` — CTI model: all 7 extension tables `id REFERENCES dossiers(id)`; `working_groups.lead_org_id`, `persons.organization_id`.
- `supabase/migrations/20260110000006_working_groups_entity.sql` — `working_group_members` table (`member_type`/`organization_id`/`person_id`/`role`/`status`) + indexes (RF-1/RF-3 membership source).
- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` — `engagement_dossiers` (start*date/end_date/host*\*) + `engagement_participants` (participant_dossier_id/role) + indexes (RF-2 chain source).
- `supabase/migrations/20260613100000_get_person_full_recent_engagements_canonical.sql` — canonical engagement-chain plane (`engagement_participants ⋈ engagement_dossiers ⋈ dossiers` ORDER BY start_date); P67 fence over legacy `person_engagements`.
- `supabase/migrations/20260615_phase70_digests_alerts.sql` (L333-449) — `generate_digest` = the verbatim INVOKER+JSONB+inline-clearance pattern for `query_graph` (RF-5).
- `supabase/migrations/20260614_phase69_signals_extend.sql` — `read_signals` INVOKER RPC precedent; documents the `user_id` (not `id`) clearance rule (L46-50).
- `supabase/migrations/20251022000006_update_rls_policies.sql` (L13-59) — canonical `dossiers`/`dossier_relationships` SELECT policies with the BROKEN `id = auth.uid()` form.
- `supabase/migrations/20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql` — documents the landmine + the correct `profiles.user_id = auth.uid()` fix.
- `supabase/migrations/99999999999999_fix_dossier_rls.sql` — legacy competing `view_dossiers_authenticated` policy (string-vs-integer; references nonexistent `user_roles`).
- `supabase/migrations/20251022000001_create_unified_dossiers.sql` — `sensitivity_level INTEGER 1–4`; `status` enum incl. `archived`.
- `supabase/functions/graph-traversal/index.ts` — edge-fn pattern (token→getUser→user-client→.rpc→shape {nodes,edges,stats}).
- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` — Network panel contract (`?dossierId=`, Graph/List tabs, stats, perf-warning) to extend with "Analyze" mode.
- `frontend/src/routes/_protected/relationships/graph.tsx` — `validateSearch` schema to extend (mode/query/entity2/windowDays).
- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` — `quickActions`/`createActions` + `location.pathname` regex context (RF-6).
- `frontend/src/components/relationships/AdvancedGraphVisualization.tsx` — `nodes/edges/centerNodeId` props + built-in `PathFindingPanel`.
- `frontend/src/i18n/index.ts` — `graph`/`graph-traversal`/`relationships` registered en+ar.
- `frontend/src/types/relationship.types.ts` — `DossierRelationshipType` union (incl. `member_of`/`participates_in`/`participant_in`).
- `frontend/src/lib/dossier-routes.ts` — `/dossiers/{segment}/{id}` route map (Cmd+K analyze regex).
- `.planning/config.json` — `nyquist_validation: true`.

### Secondary (MEDIUM — referenced, not the primary source)

- `supabase/migrations/20260115400001_working_group_member_suggestions.sql` — `working_group_members` join patterns (current) BUT membership-from-`person_engagements` logic is legacy (do not reuse).
- `supabase/migrations/20260111200001_enhanced_graph_traversal.sql` — `dossier_relationships` composite indexes (RF-8) + recursive-CTE perf precedent.

### Tertiary (LOW — needs live introspection)

- Live `pg_policy` state for `dossiers` SELECT (RF-5/RF-7); live row distributions for `dossier_relationships`/`engagement_participants`/`working_group_members` (RF-1/RF-2/RF-7). SQL provided in Code Examples.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — zero new packages; all primitives verified in-repo.
- Architecture (RPC shape, clearance, edge fn): HIGH — direct precedent in `generate_digest`/`graph-traversal`, read this session.
- Data model (RF-1/RF-2/RF-3): HIGH — all tables + columns + indexes read from migration source.
- 4th-query cost (RF-4): HIGH — CTE verified present; promotion is a copy + one clearance clause.
- Clearance correctness (RF-5/GRAPH-03/04): HIGH on the pattern (inline, `user_id`); MEDIUM on the _live_ `dossiers` policy set (introspection step provided — but inline clearance makes us independent of it).
- RF-7 fixtures: MEDIUM — staging is ~all sensitivity-1; fresh high-sensitivity seed required; seed→observe→restore protocol is established.
- RF-8 performance: HIGH — membership/participation/relationship indexes all present; existing `performance_warning`/`query_time_ms` budget (2s) reused.

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable — schema is frozen by the v7.0 milestone; re-verify the live `dossiers` policy set if P68/P69 follow-ups land first)
