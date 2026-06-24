# Phase 71: Analytic Graph - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver clearance-aware **analytic graph queries** over the relationship/participation
graph as **both** an analyst surface (the existing Network panel + a per-dossier
"Analyze" affordance + Cmd+K) **and** an agent tool (`query_graph`), all under the
Phase 68 JWT keystone with `SECURITY INVOKER` analytic RPCs. Covers requirements
**GRAPH-01..04**.

In scope:

1. **Analytic query set** — the 3 roadmap-named queries as the v1 floor (GRAPH-01):
   - **who-sits-on-which-forum** (membership: given a person/org → forums & working
     groups they participate in; or given a forum → its members)
   - **shared committees** (intersection: given two entities → the committees /
     working groups both belong to)
   - **engagement chains over N days** (temporal: given an entity → its sequence of
     engagements over a window)
     PLUS, if the researcher confirms it is low-cost, a **4th "how are X and Y
     connected?" shortest-path query** promoting the existing `get_relationship_path`
     recursive CTE (D-01).
2. **Parameterized, entity-anchored launch** — each query is a template with typed
   inputs (1 entity, 2 entities, or entity + time-window N); launching from a dossier
   pre-fills the primary entity (D-02).
3. **Result presentation** — a structured result (list / table / timeline / path per
   query type) as the primary view, with a React Flow highlighted-subgraph "Graph
   view" available via the existing Graph/List tab pattern; Cmd+K shows a compact
   inline result (D-03, GRAPH-02).
4. **Surfacing** — one analytic experience anchored on the existing
   `/relationships/graph` Network panel ("Analyze" query picker), a per-dossier
   "Analyze" affordance, and Cmd+K "Analyze:" entries (D-04, GRAPH-01/02).
5. **Clearance gating** — every query returns a strictly reduced node/edge set for a
   lower-clearance caller; indistinguishable-empty on denial (GRAPH-03, carried-forward
   locks).
6. **`query_graph` agent tool** — a clearance-gated `SECURITY INVOKER` RPC (one
   multiplexed RPC or one-per-query — researcher's call) defined and **tested by direct
   invocation** in P71; the Mastra agent wraps it in P72 (D-06, GRAPH-04).

Out of scope (deferred — do NOT pull forward):

- **Mastra / CopilotKit agent that _calls_ `query_graph`** + any conversational graph
  Q&A → **Phase 72**. P71 ships the tool/RPC only (mirrors P69 `read_signals` / P70
  `generate_digest`).
- **Converting the existing DEFINER traversal functions** (`traverse_relationship_graph`,
  `get_bidirectional_relationships`, `get_relationship_path`) to INVOKER as a repo-wide
  hardening sweep → noted as a follow-up, not this phase (D-05). The one exception is the
  4th shortest-path query, which — if shipped — needs an INVOKER path (convert-in-place
  vs new INVOKER variant = researcher's call).
- **Count/window analytics beyond the named set**, custom query builder, saved/named
  analytic queries, graph export of analytic results → future.
- **Re-embedding / RAG / vLLM / TEI infra** → Phase 72 parallel track.

</domain>

<decisions>
## Implementation Decisions

### Query set & inputs

- **D-01:** **v1 query set = the 3 named + an optional 4th shortest-path.** The floor is
  the 3 roadmap-named queries (who-sits-on-which-forum, shared committees, engagement
  chains over N days — GRAPH-01 verbatim). **Promote the existing `get_relationship_path`
  recursive CTE to a 4th "how are entity X and Y connected?" analytic query IF the
  researcher confirms it is low-cost** (the CTE already exists; it needs an INVOKER path
  - surfacing). High analyst value, minimal new code. _(Claude's discretion — user said
    "you decide best for the project".)_
- **D-02:** **Entity-anchored parameterized templates.** Each query is a template with
  typed inputs: **1 entity** (forum-membership, engagement-chains), **2 entities**
  (shared-committees, shortest-path), and engagement-chains adds an **adjustable
  time-window N** (default = planner's call, e.g. 90 days). Launching from a dossier
  **pre-fills the primary entity** ("everything starts with a dossier" + the existing
  Network panel is already `?dossierId=` anchored). _(Claude's discretion.)_

### Result presentation

- **D-03:** **Structured result primary + a graph view.** The named queries produce
  precise answers (memberships, intersections, ordered chains, a path), so the **default
  view is a structured list / table / timeline / path** keyed to the query type. A flip
  to the **React Flow highlighted-subgraph "Graph view"** reuses the existing Graph/List
  tab pattern on `/relationships/graph`. **Cmd+K shows a compact inline result**
  (GRAPH-02 "results inline"); the full panel is the deep-link target. Clearance
  reduction (GRAPH-03) is verified as fewer rows/nodes, never a "filtered" message.

### Surface & launcher

- **D-04:** **One analytic experience, three entry points, anchored on the existing
  Network panel.** Add an **"Analyze" query-picker mode to `/relationships/graph`** (the
  canonical "Network panel" — `RelationshipGraphPage.tsx`), a **per-dossier "Analyze"
  affordance** that pre-fills the entity, and **Cmd+K "Analyze:" entries**
  (context-aware to the current dossier where applicable). **NOT a new `/intelligence`
  tab** — the graph experience already lives at `/relationships/graph`; the
  `/intelligence` hub stays scoped to Signals/Digests/Alerts/Reports.

### Data source & RPC reconciliation

- **D-05:** **New `SECURITY INVOKER` RPCs over the authoritative participation tables;
  existing DEFINER traversal left as-is.** The named queries need richer data than
  `dossier_relationships` edges (forum/WG membership, `engagement_participants`), so they
  ship as **new INVOKER analytic RPCs** (satisfies GRAPH-04 for everything this phase
  delivers). The 3 existing `SECURITY DEFINER` traversal functions
  (`traverse_relationship_graph`, `get_bidirectional_relationships`,
  `get_relationship_path`) — which already apply the clearance filter inline and are
  tested — are **left untouched**; their DEFINER status is recorded as a **separate
  repo-wide hardening follow-up**, not converted in P71 (avoids regressing the existing
  graph page; out of GRAPH-01..04 scope). _(Claude's discretion — user said "you
  decide"; researcher confirms the live data model and conversion cost — RF-1/RF-4.)_

### query_graph agent tool (GRAPH-04)

- **D-06:** **Define the tool now + test by direct invocation** (mirrors P69 D-14
  `read_signals` and P70 D-14 `generate_digest`). P71 builds the clearance-gated
  `query_graph` `SECURITY INVOKER` RPC covering the v1 queries, returning clearance-
  correct results under the **caller's JWT**; verification is by **direct RPC
  invocation** with a low-clearance account (success criterion #4). The **Mastra agent
  wraps the same RPC in P72**; conversational/generative-UI graph answers are P72/P73.
  Single multiplexed RPC (`query_type` arg) vs one RPC per query = researcher's call
  (RF-5).

### Claude's Discretion

- **v1 query set** (D-01) — chose the 3 named + optional 4th shortest-path (cost-gated).
- **Inputs / anchoring + time-window N** (D-02) — chose entity-anchored templates with a
  dossier-context pre-fill; default N is planner's call.
- **Data source + existing-traversal fate** (D-05) — chose new INVOKER RPCs over
  participation tables, leave the 3 DEFINER functions as-is (hardening follow-up).
- **RPC shape** (one multiplexed `query_graph` vs per-query), **engagement-chain
  definition**, **"committee" entity-type set**, and the **time-window default** =
  planner/researcher.

### Carried forward — locked from prior phases (do NOT re-litigate)

- **Clearance:** single integer `sensitivity_level <= profiles.clearance_level` (1–4);
  `profiles.clearance_level` is the sole per-user source (P68 D-01/D-02). RLS predicates
  key off **`profiles.user_id = auth.uid()`** — `profiles` has **no `id` column**; using
  `id = auth.uid()` silently binds to the outer table → NULL → blocks ALL reads (P69 EXEC
  landmine). The existing graph RPCs already use the correct `WHERE user_id = auth.uid()`
  form — match it.
- **Indistinguishable empty** on clearance denial — NO "filtered by clearance" messaging
  anywhere; a lower-clearance caller must not learn an above-clearance node/edge exists
  (P68 D-09). GRAPH-03's "strictly reduced result set" = fewer nodes/edges, silently.
- **New RPCs are `SECURITY INVOKER`**, never DEFINER (v7.0 locked; GRAPH-04 makes this
  explicit for analytic RPCs).
- **Agent-tool-now / agent-wraps-later** (P69 D-14, P70 D-14) — define + direct-invocation
  test in this phase; the Mastra runtime wraps it in P72.
- **Migrations via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`, committed as forward
  migrations. **Live UAT:** seed → observe → restore, EN+AR. RLS-denial verified via
  **CDP `Network.setBlockedURLs`** forced-error protocol (RLS denial returns empty
  `200`s — assert on `role="alert"`/empty-state and reduced counts, not HTTP status).
- **Static-bundled i18n** — every new namespace registered in `src/i18n/index.ts` (P68 CI
  guard). Note: `graph` + `graph-traversal` namespaces already exist (en+ar) — reuse /
  extend rather than create where possible.
- **Design tokens + RTL** — token-bound, logical properties, Tajawal/`dir="rtl"`,
  no raw hex, no card shadows; the Network panel is a desktop-primary analyst surface.

</decisions>

## Open Questions for Research (resolve before/during planning)

Factual gaps the researcher must close against **live staging** (`zkrcjzdemdmwhearhfgg`)
and the live code:

- **RF-1 — Where forum + working-group/committee membership actually lives (the #1
  blocker).** The named queries (forum-membership, shared-committees) need a definitive
  membership source. Map, on live staging: is forum/WG membership stored as **typed
  `dossier_relationships` edges** (`member_of` / `participates_in` / `participant_in` —
  these values exist in `RelationshipGraphPage.tsx`'s `RELATIONSHIP_TYPES`), as
  **dedicated participant tables**, or both? Confirm before writing the membership RPCs;
  the answer dictates whether analytic RPCs join `dossier_relationships` or domain tables.
- **RF-2 — Engagement-chain definition.** Define what constitutes a "chain": a
  time-ordered sequence of engagements an entity participated in over N days, linked via
  `engagement_participants` (persons/EOs) and/or `engagement_dossiers`
  (`host_country_id` / `host_organization_id`). Confirm the date field to order on and
  whether "chain" implies shared-participant linkage between consecutive engagements or
  simply a per-entity timeline. Reconcile against the canonical engagement tables (P67
  repointed off legacy `person_engagements` → `engagement_participants`).
- **RF-3 — "Shared committees" semantics + entity types.** Confirm what "committee"
  maps to (`working_group` dossiers? forums? both?) and which entity types the
  intersection accepts (person↔person, org↔org, mixed). Define the intersection query
  over the RF-1 membership source.
- **RF-4 — `get_relationship_path` promotion cost (gates D-01's 4th query).** Determine
  whether to convert the existing DEFINER `get_relationship_path` to INVOKER in place, or
  add a new INVOKER variant, and confirm it still returns correct clearance-filtered
  results under INVOKER RLS on `dossiers` + `dossier_relationships`. If non-trivial, the
  4th query is dropped from v1 (the 3 named remain the floor).
- **RF-5 — `query_graph` RPC signature(s).** Define the `SECURITY INVOKER` contract:
  one multiplexed RPC (`query_type` + a typed params payload) vs one RPC per query;
  inputs per query type (1/2 entities, window N); return shape that feeds both the
  structured result and the React Flow nodes/edges; confirm it runs under the caller JWT
  for the direct-invocation clearance test (success criterion #4).
- **RF-6 — Cmd+K integration.** Map how `CommandPalette.tsx` (1557 lines) registers
  parameterized, context-aware "Analyze:" actions and renders a **compact inline result**
  (GRAPH-02), including how it reads the current-dossier context to pre-fill the entity,
  and how it deep-links to the Network panel "Analyze" mode for the full result.
- **RF-7 — GRAPH-03 verification fixtures.** Define how to seed above-clearance
  participation data (members/engagements at sensitivity 3–4) and prove two
  clearance-level accounts get strictly different node/edge counts for the same query —
  live, EN+AR, via the CDP forced-error protocol.
- **RF-8 — Analytic RPC performance at scale.** STATE.md research flag: recursive CTEs /
  membership joins on 50K+ relationships. Confirm indexes on the membership/participation
  tables and the existing graph's `performance_warning` budget (the panel already surfaces
  `query_time_ms` + a complexity badge); set a query-time target.

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements (read first)

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — locked
  decisions §2 (platform-vs-feature: BOTH; analytic graph in Postgres recursive CTEs, no
  external graph DB), cross-cutting guarantees §5 (JWT keystone, INVOKER, on-prem)
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — architecture analysis
  (§2.5 JWT keystone; analytic graph stays in Postgres)
- `.planning/REQUIREMENTS.md` — **GRAPH-01..04** + "## Cross-Cutting Guarantees"
- `.planning/ROADMAP.md` → "### Phase 71: Analytic Graph" — goal + 4 success criteria
- `.planning/phases/68-ai-foundations-remediation/68-CONTEXT.md` — canonical clearance
  model (1–4, `profiles.clearance_level`), INVOKER-only rule, indistinguishable-empty (D-09)
- `.planning/phases/69-signals/69-CONTEXT.md` + `.planning/phases/70-digests-alerts/70-CONTEXT.md`
  — the agent-tool-now / agent-wraps-in-P72 precedent (read_signals, generate_digest)

### Existing graph layer (the reuse + extension surface)

- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` — **the "Network panel"**
  to extend with an "Analyze" mode (React Flow basic/enhanced/advanced + Graph/List tabs
  - complexity stats; `?dossierId=` anchored; calls the `graph-traversal` edge fn)
- `frontend/src/routes/_protected/relationships/graph.tsx` — the route (search-param schema)
- `frontend/src/components/relationships/{GraphVisualization,EnhancedGraphVisualization,AdvancedGraphVisualization,RelationshipNavigator}.tsx`
  — the React Flow render components (Graph view) + list navigator (List view) to reuse
  for the highlighted-subgraph result (D-03)
- `supabase/functions/graph-traversal/index.ts` + `supabase/functions/graph-traversal-advanced/index.ts`
  — existing edge-fn pattern for graph RPC invocation under the caller JWT
- `supabase/migrations/20251022000008_create_graph_functions.sql` — the 3 base graph
  functions (`traverse_relationship_graph`, `get_bidirectional_relationships`,
  `get_relationship_path`) — **all `SECURITY DEFINER` with inline clearance** (D-05
  leaves these as-is; `get_relationship_path` is the 4th-query candidate — RF-4)
- `supabase/migrations/20260612100000_bidirectional_traverse_in_place.sql` — Phase 63
  bidirectional `traverse_relationship_graph` (DEFINER; correct `WHERE user_id = auth.uid()`
  clearance form to mirror)
- `supabase/migrations/20260111200001_enhanced_graph_traversal.sql` +
  `supabase/migrations/20260111200002_fix_graph_traversal_recursive_cte.sql` — enhanced
  traversal + recursive-CTE fix precedent (cycle guards, performance shape)

### Participation / membership data (the analytic query content — RF-1/RF-2/RF-3)

- `engagement_participants` (P67 canonical participation table) + `engagement_dossiers`
  (`host_country_id` / `host_organization_id`) — engagement-chain source (RF-2)
- `dossier_relationships` (typed edges incl. `member_of` / `participates_in` /
  `participant_in`) — candidate forum/WG membership source (RF-1)
- `supabase/migrations/20260115400001_working_group_member_suggestions.sql` +
  `supabase/migrations/20260114100001_stakeholder_influence_analysis.sql` — existing
  membership/committee + influence-graph precedents to check for reusable membership joins
- `CLAUDE.md` → "Dossier Types (8 total)" + "Source-Specific Column Carve-Outs" — entity
  types + which tables back forum/working-group/engagement participation

### Clearance / RLS canonical pattern

- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (≈L102/L119) —
  canonical comparison `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE
user_id = auth.uid())` — apply to the new INVOKER analytic RPCs
- Phase 68 clearance compat shim (`get_user_clearance_level` rewritten to read
  `profiles.clearance_level`) — the canonical 1–4 source

### Cmd+K + i18n + conventions

- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` — the Cmd+K palette
  (1557 lines; existing "View Network" + nav actions) to add parameterized "Analyze:"
  entries + inline results to (RF-6)
- `frontend/src/i18n/index.ts` — static-bundled namespace registry; `graph` +
  `graph-traversal` namespaces already exist (en+ar) — reuse/extend (P68 CI guard)
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md` — backend service
  layering + `@xyflow/react v12.10.1` (React Flow) confirmation (available; read for context)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`/relationships/graph` Network panel** (`RelationshipGraphPage.tsx`) — React Flow
  (basic/enhanced/advanced modes), degrees/relationship-type filters, Graph/List tabs,
  complexity + `query_time_ms` stats. Add an "Analyze" query-picker mode here (D-04).
- **React Flow render components** (`GraphVisualization` / `Enhanced` / `Advanced` +
  `RelationshipNavigator`) — reuse for the highlighted-subgraph "Graph view" of an
  analytic result (D-03).
- **`graph-traversal` edge fn pattern** — invokes a graph RPC under the caller JWT; mirror
  for `query_graph` (D-06).
- **3 existing graph RPCs** (`20251022000008`) — recursive-CTE + inline-clearance pattern
  to mirror in the new INVOKER RPCs; `get_relationship_path` is the 4th-query candidate.
- **`CommandPalette.tsx`** — existing Cmd+K with a "View Network" action; extend with
  parameterized "Analyze:" commands (D-04, GRAPH-02).
- **`engagement_participants` / `engagement_dossiers`** (P67) — engagement-chain content.
- **`graph` + `graph-traversal` i18n namespaces** — already registered (en+ar); extend.

### Established Patterns

- **Analytic graph stays in Postgres** recursive CTEs / joins (no external graph DB — v7.0
  locked); the existing `WITH RECURSIVE relationship_graph` + cycle-guard is the template.
- **New RPCs `SECURITY INVOKER`**; clearance via `sensitivity_level <= profiles.clearance_level`
  keyed on `profiles.user_id = auth.uid()`.
- **Agent-tool-now / agent-wraps-later** (P69/P70) — direct-invocation test in P71.
- **Migrations via Supabase MCP**; live UAT seed→observe→restore EN+AR; CDP forced-error
  for RLS-denial / reduced-count verification.
- **Desktop-primary analyst workstation** — the Network panel targets 1280–1400px; design
  tokens + RTL.

### Integration Points

- `/relationships/graph` Network panel — new "Analyze" mode + result rendering (D-04).
- Dossier page — per-dossier "Analyze" affordance, entity pre-filled (D-04).
- `CommandPalette.tsx` — Cmd+K "Analyze:" entries + inline result (D-04, GRAPH-02).
- New INVOKER analytic RPCs ← participation/membership tables (RF-1/RF-2/RF-3).
- `query_graph` RPC ← the agent runtime in P72 (D-06).

</code_context>

<specifics>
## Specific Ideas

- **"Everything starts with a dossier"** — the per-dossier "Analyze" affordance pre-fills
  the primary entity, mirroring the existing `?dossierId=`-anchored Network panel (D-02/D-04).
- **One Network panel, not a new hub tab** — analytic queries live where the graph already
  lives (`/relationships/graph`), not in `/intelligence` (D-04).
- **Structured answer first, graph for context** — a membership list / intersection /
  ordered chain / path is the precise answer; the React Flow subgraph is the visual
  context, reachable via the existing Graph/List tabs (D-03).
- **Verification bar** (milestone cross-cutting guarantee): run an analytic query from the
  Network panel and from Cmd+K and get a result; run the SAME query from two
  different-clearance accounts and confirm strictly fewer nodes/edges for the lower one
  (indistinguishable-empty, no "filtered" message); invoke `query_graph` directly with a
  low-clearance account and confirm zero above-clearance nodes — all live on staging, EN+AR.

</specifics>

<deferred>
## Deferred Ideas

- **Mastra / CopilotKit agent wrapping `query_graph`** + conversational/generative-UI graph
  answers → **P72 / P73**. P71 ships the RPC/tool + direct-invocation test only (D-06).
- **Converting the 3 existing DEFINER traversal functions to INVOKER** as a repo-wide
  hardening sweep → separate follow-up; they already clearance-filter inline and are tested
  (D-05). (Exception: the 4th shortest-path query's INVOKER path, if that query ships — RF-4.)
- **Custom analytic query builder, saved/named queries, count/window analytics beyond the
  named set, analytic-result graph export** → future.
- **4th shortest-path query** is itself conditional on RF-4 cost confirmation; the 3 named
  queries are the guaranteed v1 floor.

### Reviewed Todos (not folded)

- `p68-followup-supabaseadmin-background-agents.md` — "Audit supabaseAdmin in
  brief-generator.ts + intake-linker.ts (REMED-03 follow-up)". **Reviewed and kept
  separate** (a keyword false-positive on "agents"; also reviewed-not-folded in P69 and
  P70). It is a Phase 68 security follow-up about background AI agents' service-role use —
  not analytic-graph work. The P71 analytic RPCs run `SECURITY INVOKER` under the caller
  JWT by design. Revisit as its own quick task or in P72 when the agent runtime lands.

</deferred>

---

_Phase: 71-Analytic Graph_
_Context gathered: 2026-06-17_
