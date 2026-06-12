# Phase 63: Relationship Graph Route & Bidirectional Traversal - Research

**Researched:** 2026-06-12
**Domain:** TanStack Router route mounting, PostgreSQL recursive CTE traversal, Supabase edge functions, React Flow (@xyflow/react) directed graphs, i18n namespace repair
**Confidence:** HIGH (all critical claims verified by direct code inspection or live staging probes)

## Summary

This phase is wiring + a data-layer fix + conformance — not a build. `RelationshipGraphPage` (435 lines, zero current importers) is fully written and only dead because `routes/_protected/relationships/graph.tsx` is a 7-line redirect to `/dossiers`. Live staging probes (run 2026-06-12 with a real user JWT) confirm: the `graph-traversal` edge function IS deployed and follows the correct auth pattern; the live `traverse_relationship_graph` RPC IS the outgoing-only legacy version (proven: traversal from an incoming-only dossier returns `[]`); and `traverse_relationship_graph_bidirectional` IS already applied on staging and returns the incoming edge with a `direction_path` column.

Two findings change the planning picture versus CONTEXT.md's hopes. First, D-03's "every caller gets the fix with no client changes" is **false for D-04**: the edge function builds edges by assuming `path[i] → path[i+1]` is always source→target. After the bidirectional rewrite, incoming hops would render with the arrow pointing the WRONG way unless the edge function consumes direction info. The RPC redefinition must add a `direction_path` column (mirroring the `_bidirectional` reference), which in PostgreSQL **requires `DROP FUNCTION` + `CREATE`** (CREATE OR REPLACE cannot change a function's return columns) plus a re-`GRANT`, and the edge function must be updated + redeployed to orient edges. Second, the page's i18n is broken today in Arabic: it calls `t('graph.X', 'inline default')` against the **default namespace** (aliased to `common.json`, which has no `graph` key), so every string falls back to inline English in BOTH languages — even though `graph.json` (125 keys, EN+AR complete) already contains every key the page needs. The fix is `useTranslation('graph')` + prefix-stripping, the project's known dot-vs-colon trap.

Staging has effectively **no relationship data**: exactly 1 active row (`working_group —cooperates_with→ country`). D-09's all-types live verification requires seeding relationships first. Also, the page's relationship-type filter values (`partner`, `parent_org`, `participant`, `signatory`) do not match the canonical `DossierRelationshipType` vocabulary (18 snake_case values, all with existing EN+AR labels in `graph.json` under `relationship.*`) — the filter list must be realigned.

**Primary recommendation:** Mount the route with `validateSearch`, redefine the RPC in a new migration as `DROP + CREATE` with the legacy input signature (`start_dossier_id UUID, max_degrees INTEGER, relationship_type_filter TEXT` — exact names, or PostgREST named-arg dispatch breaks) returning the legacy 8 columns + `direction_path TEXT[]`, update the edge function to orient edges by direction and redeploy, fix the page's i18n namespace, realign filter values, run the DoD/sentence-case pass, and seed staging relationships covering all 7 reachable dossier types for live click-through verification.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Route fate (GRAPH-01 — decision recorded)**

- **D-01:** **Mount, don't retire.** `routes/_protected/relationships/graph.tsx` stops redirecting to `/dossiers` and renders the existing `RelationshipGraphPage` (435 lines, already functional: edge-function fetch, degree/type controls, R17-02 node-click fix already applied). The roadmap's "formally retire" branch is closed.
- **D-02:** **No-dossier state is an actionable alert.** Landing on `/relationships/graph` without a `dossierId` search param keeps the honest "No dossier selected" alert but adds a button/link to `/dossiers` so it's not a dead end. No inline dossier picker — the contract is that the graph is reached FROM a dossier.

**Bidirectional traversal (GRAPH-02)**

- **D-03:** **Fix `traverse_relationship_graph` in place.** Redefine the RPC itself (CREATE OR REPLACE) to walk both directions — anchor and recursion on `source_dossier_id = current` AND `target_dossier_id = current` — mirroring the logic already written in `traverse_relationship_graph_bidirectional` (migration `20260111200001_enhanced_graph_traversal.sql`). Every caller (the `graph-traversal` edge function and any other consumer) gets the fix with no client changes. Researcher must verify what is actually live on staging: whether the bidirectional migration is applied, which RPC version is deployed, and whether the `graph-traversal` edge function is deployed at all.
- **D-04:** **Directional arrows on edges.** Each edge renders its true source→target direction (e.g., "Saudi Arabia —member_of→ G20"). An incoming reference reads as an arrow pointing at the focused dossier. No undirected lines — who-references-whom is the point of this phase.
- **D-05:** **Keep existing controls as-is.** Degrees-of-separation selector stays with default 2; relationship-type filter stays. Verify they behave correctly with bidirectional data (node counts can grow at 2+ degrees — verify rendering holds with real staging volumes).

**Page design conformance (UI hint: yes)**

- **D-06:** **DoD conformance pass, no layout redesign.** Run the page through the UI Definition-of-Done checklist: all colors via tokens (no raw hex / Tailwind color literals), borders `1px solid var(--line)`, no card shadows, logical properties (`ms-*`/`ps-*`/`text-start`), sentence-case copy with no marketing voice, verified at 1024px and 1400px. Fix violations found; do not rebuild the layout against the prototype.
- **D-07:** **Full RTL/Arabic verification.** Page chrome flips correctly with `dir="rtl"` (Tajawal applies, logical properties throughout); node labels render Arabic names (`name_ar`) in Arabic mode; controls, legend, and alerts read correctly in AR. The `graph` i18n namespace is already registered (quick 260605-u2z) — verify its AR strings actually cover this page's keys.

**Entry points & verification (GRAPH-01/03)**

- **D-08:** **Mini-graph button is the sole entry point.** `MiniRelationshipGraph`'s existing "View Full Graph" button (already passes `?dossierId=`) becomes the contract entry point. No DossierShell action, no sidebar nav item — zero new UI surfaces.
- **D-09:** **Live verification covers every dossier type present in the graph.** On staging, seed/use relationships so the rendered graph contains nodes of every reachable dossier type, click each node type, and confirm the correct per-type route (`/dossiers/<segment>/$id`) loads. Matches the Phase 62 all-types verification precedent.

### Claude's Discretion

- Exact mechanics of the in-place RPC redefinition (new migration vs. consolidating with the `_bidirectional` variant; whether the `_bidirectional` function is then redundant and removable).
- Edge deduplication when both traversal directions surface the same row.
- Cleanup/disposition of the two unrouted duplicate components (`components/relationships/RelationshipGraph.tsx`, `components/dossiers/RelationshipGraph.tsx`) — assess whether either is dead code; don't delete pre-existing dead code beyond what this phase's changes orphan unless clearly safe.
- Empty-graph state (dossier with zero relationships) presentation, loading/error states, and arrow styling details.
- TanStack Router search-param validation (`validateSearch`) for `dossierId`.

### Deferred Ideas (OUT OF SCOPE)

- **Inline dossier picker on the graph page** — would make `/relationships/graph` a standalone destination; rejected for this phase (D-02), could pair with a future sidebar-nav entry.
- **Additional entry points (DossierShell header action, sidebar navigation)** — explicitly out of scope (D-08); revisit if the graph proves popular.
- **Full Bureau re-skin of the graph page** — D-06 limits this phase to a conformance pass; a prototype-faithful rebuild is a future design task.
- **`graph-traversal-advanced` feature set** (shortest path, all paths, connected components) — separate edge function, untouched by this phase.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                         | Research Support                                                                                                                                                                                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRAPH-01 | User can reach a relationship graph page from a dossier (route mounted, no redirect to `/dossiers`) | Route file confirmed as 7-line redirect; `RelationshipGraphPage` confirmed complete with zero importers; `validateSearch` pattern verified in `geographic-visualization.tsx` and `countries/index.tsx`; mini-graph button confirmed emitting `/relationships/graph?dossierId=<id>` (MiniRelationshipGraph.tsx L724); route already registered in `routeTree.gen.ts` |
| GRAPH-02 | Graph traversal returns both incoming and outgoing relationships                                    | Live-proven outgoing-only RPC on staging (incoming-only dossier returns `[]`); `_bidirectional` reference implementation confirmed applied and working live (returns `direction_path: ["incoming"]`); DROP+CREATE migration mechanics documented; edge-function orientation fix specified                                                                           |
| GRAPH-03 | Clicking either endpoint node navigates to the correct per-type dossier route                       | `handleNodeSelect` already uses `getDossierDetailPath` (R17-02 fix confirmed at page L156-164); `DOSSIER_TYPE_TO_ROUTE` maps all 8 types; all 8 route segments exist on disk under `routes/_protected/dossiers/`; staging dossier-type inventory captured for D-09 seeding                                                                                          |

</phase_requirements>

## Live Staging Verification (D-03 mandated facts)

All probes run 2026-06-12 against `https://zkrcjzdemdmwhearhfgg.supabase.co` using a real user JWT obtained via password grant with `.env.test` credentials (so `auth.uid()` resolves inside SECURITY DEFINER clearance subqueries — service-role probes would return empty rows because the clearance subquery yields NULL for a non-user). [VERIFIED: live curl probes]

| Question (from D-03)                                                              | Answer                                                                                                                                                   | Evidence                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is migration `20260111200001` (bidirectional) applied on staging?                 | **YES**                                                                                                                                                  | `POST /rest/v1/rpc/traverse_relationship_graph_bidirectional` → HTTP 200 with rows; returns `direction_path` column                                                                                                                                                                                  |
| Which `traverse_relationship_graph` is live?                                      | **Outgoing-only legacy** (`20251022000008`)                                                                                                              | From source dossier `a0000000-…-404`: 1 row (the target). From incoming-only dossier `b0000001-…-001`: `[]`. Bidirectional RPC from the same dossier: 1 row with `direction_path: ["incoming"]`                                                                                                      |
| Is the `graph-traversal` edge function deployed? Does it follow the auth pattern? | **YES, deployed; YES, correct pattern**                                                                                                                  | `GET /functions/v1/graph-traversal` (no params, valid JWT) → HTTP 400 `{"error":"Missing startDossierId parameter"}` (the deployed code's own validation — auth passed). Repo code uses `esm.sh/@supabase/supabase-js@2` + `auth.getUser(token)` (index.ts L5, L52) — the project's required pattern |
| Live end-to-end behavior                                                          | Incoming edges invisible today                                                                                                                           | Edge fn from source A: 2 nodes / 1 edge. Edge fn from target B: **1 node / 0 edges** — GRAPH-02's bug reproduced live through the full stack                                                                                                                                                         |
| `dossier_relationships` volume                                                    | **1 active row total**                                                                                                                                   | `a0000000-…-404` (working_group "Test Working Group D") —`cooperates_with`→ `b0000001-…-001` (country "Indonesia", sensitivity_level 2)                                                                                                                                                              |
| Dossier types on staging (status ≠ deleted)                                       | person 12, working_group 6, country 4, engagement 4, forum 4, organization 4, topic 1 — **no `elected_official`-type dossiers** (EO is a person_subtype) | REST count query                                                                                                                                                                                                                                                                                     |
| Edge fn timing                                                                    | First call 1945 ms, second 849 ms (2-node graph)                                                                                                         | Live `stats.query_time_ms` — the 2 s `performance_warning` threshold can fire spuriously on cold starts                                                                                                                                                                                              |

**CORS note:** the deployed/repo edge function hard-codes `Access-Control-Allow-Origin: *` — it does NOT use the `ALLOWED_ORIGINS` secret pattern. Redeploying as-is changes nothing; tightening CORS is optional hygiene, not required for this phase. [VERIFIED: code inspection L7-11]

## Architectural Responsibility Map

| Capability                                    | Primary Tier                               | Secondary Tier                           | Rationale                                                                                                      |
| --------------------------------------------- | ------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Route mount + search-param validation         | Browser/Client (TanStack Router)           | —                                        | File-based route with `validateSearch`; `autoCodeSplitting: true` chunks it                                    |
| Bidirectional traversal + clearance filtering | Database (SECURITY DEFINER RPC)            | —                                        | Recursive CTE with sensitivity-level filtering must stay in the DB; never re-implement clearance in the client |
| Edge orientation (true source→target)         | API (graph-traversal edge function)        | Database (RPC supplies `direction_path`) | The edge fn transforms path rows into nodes/edges; it is the only place that knows how to orient each hop      |
| Graph rendering + directional arrows          | Browser/Client (@xyflow/react 12)          | —                                        | `markerEnd: MarkerType.ArrowClosed` already in Enhanced/Advanced modes; Basic mode needs it added              |
| Per-type node navigation                      | Browser/Client (`getDossierDetailPath`)    | —                                        | Already correct (R17-02); mirror of MiniRelationshipGraph                                                      |
| i18n (EN/AR strings)                          | Browser/Client (static-bundled i18next)    | —                                        | `graph` namespace registered; page must actually consume it                                                    |
| Seed data for D-09 verification               | Database (staging `dossier_relationships`) | —                                        | Insert via Supabase MCP; free-text `relationship_type` (no CHECK constraint) but must use canonical vocabulary |

## Standard Stack

### Core (all already installed — no new packages)

| Library                  | Version              | Purpose                                           | Why Standard                                                                                                                                  |
| ------------------------ | -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@xyflow/react`          | ^12.10.2             | Graph canvas, nodes, edges, arrow markers         | Already powers MiniRelationshipGraph + all 3 page viz modes [VERIFIED: frontend/package.json L83]                                             |
| `@tanstack/react-router` | v5 (workspace)       | Route mount, `validateSearch`                     | Project standard; `autoCodeSplitting: true` in vite.config [VERIFIED: vite.config.ts L34]                                                     |
| `@tanstack/react-query`  | v5                   | Graph data fetch/cache                            | Page already uses it (`staleTime: 30000`)                                                                                                     |
| `framer-motion`          | ^12.40.0             | AdvancedGraphVisualization `m`/`AnimatePresence`  | `LazyMotion features={domAnimation}` already wraps App root (App.tsx L46) — `m` components will work when the page finally renders [VERIFIED] |
| i18next (static bundle)  | workspace            | `graph` namespace (125 keys, EN+AR both complete) | Registered in `src/i18n/index.ts` L375/L502 [VERIFIED]                                                                                        |
| PostgreSQL recursive CTE | PG 17 (staging 17.6) | Bidirectional traversal                           | `_bidirectional` reference implementation already proven live                                                                                 |

### Alternatives Considered

| Instead of                                                              | Could Use                                                                                                                                                     | Tradeoff                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path-derived edges oriented by `direction_path` (Option A, recommended) | Induced-subgraph edge query in the edge fn (query `dossier_relationships` where both endpoints ∈ node set — the approach `get_graph_statistics` already uses) | Option B avoids the DROP+CREATE (return shape unchanged → plain CREATE OR REPLACE) and shows ALL relationships among visible nodes with exact direction, but adds a second query and changes edge semantics from traversal-tree to induced subgraph. Option A mirrors the locked reference implementation exactly |
| Keeping `_bidirectional` function                                       | Dropping it as redundant                                                                                                                                      | **Do NOT drop**: `graph-traversal-advanced/index.ts` calls it (L229) and `get_graph_statistics` calls it internally (migration L797) [VERIFIED: grep]                                                                                                                                                             |

**Installation:** none — no new packages.

## Package Legitimacy Audit

**This phase installs no external packages.** All dependencies (`@xyflow/react`, `framer-motion`, TanStack, i18next) are already in `frontend/package.json` and in production use. slopcheck not run — not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
MiniRelationshipGraph "View Full Graph" button (sole entry, D-08)
        │  Link to=/relationships/graph search={dossierId}
        ▼
routes/_protected/relationships/graph.tsx          ← TODAY: redirect to /dossiers (the bug)
        │  validateSearch({dossierId}) → component   AFTER: mounts RelationshipGraphPage
        ▼
RelationshipGraphPage (useQuery, enabled: !!dossierId)
        │  GET /functions/v1/graph-traversal?startDossierId&maxDegrees[&relationshipType]
        │  Authorization: Bearer <session JWT>
        ▼
graph-traversal edge fn  (deployed; @2 + getUser(token) ✓)
        │  1. RLS-checked dossiers fetch (start dossier, 404 if denied)
        │  2. rpc traverse_relationship_graph(start_dossier_id, max_degrees, relationship_type_filter)
        ▼
traverse_relationship_graph  (SECURITY DEFINER, clearance-filtered)
        │  TODAY: anchors + recurses ONLY on source_dossier_id = current   ← GRAPH-02 bug
        │  AFTER: 4-branch CTE (out+in anchors, out+in recursion) + direction_path TEXT[]
        ▼
edge fn transform: rows → nodes map + edges from (path[i], path[i+1])
        │  TODAY: assumes path order = edge direction                      ← D-04 bug
        │  AFTER: orient by direction_path[i] (incoming → swap source/target)
        ▼
Page render: Advanced (default) / Enhanced / Basic viz  +  RelationshipNavigator list view
        │  markerEnd ArrowClosed in Advanced+Enhanced; Basic MISSING it (add for D-04)
        ▼
onNodeClick → getDossierDetailPath(id, type) → /dossiers/<segment>/$id   (R17-02, correct)
```

### Recommended File Touch List

```
frontend/src/routes/_protected/relationships/graph.tsx     # redirect → mount + validateSearch
frontend/src/pages/relationships/RelationshipGraphPage.tsx # i18n ns fix, filter values, D-02 link, search typing
frontend/src/components/relationships/GraphVisualization.tsx # add markerEnd (basic mode, D-04)
frontend/src/i18n/en/graph.json + ar/graph.json            # sentence-case sweep (EN), any missing keys
supabase/migrations/<new>_bidirectional_traverse_in_place.sql # DROP + CREATE + GRANT (apply via Supabase MCP)
supabase/functions/graph-traversal/index.ts                # direction-aware edge building (redeploy)
```

### Pattern 1: Route mount with validateSearch (GRAPH-01, discretion item answered)

Copy the established repo pattern (`geographic-visualization.tsx`, `countries/index.tsx`):

```tsx
// Source: repo pattern frontend/src/routes/_protected/geographic-visualization.tsx
import { createFileRoute } from '@tanstack/react-router'
import { RelationshipGraphPage } from '@/pages/relationships/RelationshipGraphPage'

interface GraphSearch {
  dossierId?: string
}

export const Route = createFileRoute('/_protected/relationships/graph')({
  validateSearch: (search: Record<string, unknown>): GraphSearch => ({
    dossierId:
      typeof search.dossierId === 'string' && search.dossierId.length > 0
        ? search.dossierId
        : undefined,
  }),
  component: RelationshipGraphRoute,
})

function RelationshipGraphRoute(): ReactElement {
  return <RelationshipGraphPage />
}
```

Notes: `routeTree.gen.ts` already registers `/relationships/graph` (L648) — regenerates on dev/build. Once `validateSearch` exists, the `as any` cast on MiniRelationshipGraph's `Link search={{ dossierId }}` (L724) becomes properly typed and can be dropped, and the page's `(search as any)?.dossierId` (page L112) should switch to typed search. ESLint requires explicit return types (`ReactElement`).

### Pattern 2: In-place bidirectional RPC (D-03 mechanics — discretion item answered)

**Recommended: Option A — new migration, DROP + CREATE, legacy input signature + `direction_path` output.**

Critical constraints, in order:

1. **Input parameter NAMES must not change.** PostgREST dispatches RPCs by named arguments. Live callers pass `{start_dossier_id, max_degrees, relationship_type_filter}` — keep exactly these (and keep `relationship_type_filter TEXT`, not `TEXT[]`). [VERIFIED: graph-traversal L102-107, cqrs-queries L449, stakeholder-influence L413]
2. **Adding `direction_path` to RETURNS TABLE requires DROP first.** PostgreSQL: "CREATE OR REPLACE FUNCTION will not let you change the return type of an existing function… you must drop and recreate" — RETURNS TABLE columns are OUT parameters. [CITED: postgresql.org/docs/current/sql-createfunction.html]
3. **Re-GRANT after recreate** (`GRANT EXECUTE … TO authenticated`) — DROP discards grants.
4. **Preserve security semantics byte-for-byte in spirit:** `SECURITY DEFINER`, `SET search_path = public`, `d.status != 'deleted'`, `d.sensitivity_level <= clearance(auth.uid())`, `dr.status = 'active'`, `effective_to` window.

```sql
-- Source: mirrors supabase/migrations/20260111200001 traverse_relationship_graph_bidirectional
DROP FUNCTION IF EXISTS traverse_relationship_graph(UUID, INTEGER, TEXT);

CREATE FUNCTION traverse_relationship_graph(
  start_dossier_id UUID,
  max_degrees INTEGER DEFAULT 2,
  relationship_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  dossier_id UUID, dossier_type TEXT, name_en TEXT, name_ar TEXT, status TEXT,
  degree INTEGER, path UUID[], relationship_path TEXT[],
  direction_path TEXT[]                -- NEW: 'outgoing' | 'incoming' per hop
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH RECURSIVE relationship_graph AS (
    -- anchor: outgoing
    SELECT dr.target_dossier_id AS node_id, 1 AS degree,
           ARRAY[start_dossier_id, dr.target_dossier_id] AS path,
           ARRAY[dr.relationship_type] AS relationship_path,
           ARRAY['outgoing'::TEXT] AS direction_path
    FROM dossier_relationships dr
    WHERE dr.source_dossier_id = start_dossier_id
      AND dr.status = 'active' AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
    UNION
    -- anchor: incoming
    SELECT dr.source_dossier_id, 1,
           ARRAY[start_dossier_id, dr.source_dossier_id],
           ARRAY[dr.relationship_type], ARRAY['incoming'::TEXT]
    FROM dossier_relationships dr
    WHERE dr.target_dossier_id = start_dossier_id
      AND dr.status = 'active' AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
    UNION
    -- recurse: outgoing
    SELECT dr.target_dossier_id, rg.degree + 1,
           rg.path || dr.target_dossier_id,
           rg.relationship_path || dr.relationship_type,
           rg.direction_path || 'outgoing'::TEXT
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.source_dossier_id = rg.node_id
    WHERE rg.degree < max_degrees
      AND NOT (dr.target_dossier_id = ANY(rg.path))
      AND dr.status = 'active' AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
    UNION
    -- recurse: incoming
    SELECT dr.source_dossier_id, rg.degree + 1,
           rg.path || dr.source_dossier_id,
           rg.relationship_path || dr.relationship_type,
           rg.direction_path || 'incoming'::TEXT
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.target_dossier_id = rg.node_id
    WHERE rg.degree < max_degrees
      AND NOT (dr.source_dossier_id = ANY(rg.path))
      AND dr.status = 'active' AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
  )
  SELECT DISTINCT ON (d.id)
    d.id, d.type, d.name_en, d.name_ar, d.status,
    rg.degree, rg.path, rg.relationship_path, rg.direction_path
  FROM relationship_graph rg
  JOIN dossiers d ON d.id = rg.node_id
  WHERE d.status != 'deleted'
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1) FROM profiles WHERE user_id = auth.uid())
  ORDER BY d.id, rg.degree
$$;

GRANT EXECUTE ON FUNCTION traverse_relationship_graph(UUID, INTEGER, TEXT) TO authenticated;
```

Pure SQL works (the `_bidirectional` variant only used plpgsql to hoist clearance into a variable). Using `UNION` (not the reference's `UNION ALL`) dedups identical rows during recursion and limits combinatorial blow-up; per-path cycle prevention (`NOT … = ANY(path)`) stops back-edges. Apply via **Supabase MCP** (project `zkrcjzdemdmwhearhfgg`) per project rules; MCP-applied DDL triggers PostgREST schema-cache reload automatically.

**Consolidation (discretion):** keep `traverse_relationship_graph_bidirectional` untouched — `graph-traversal-advanced` and `get_graph_statistics` depend on it. Do not consolidate or drop in this phase.

### Pattern 3: Direction-aware edge building in the edge function (D-04, the hidden client change)

D-03's "no client changes" claim does NOT hold for the graph-traversal edge fn — today (index.ts L146-168) it emits `{source_id: path[i], target_id: path[i+1]}` for every hop. After the bidirectional rewrite, an incoming hop reverses the true direction. Required change:

```ts
// Source: derived from supabase/functions/graph-traversal/index.ts L146-168
if (row.path && row.path.length > 1 && row.relationship_path) {
  for (let i = 0; i < row.path.length - 1; i++) {
    const isIncoming = row.direction_path?.[i] === 'incoming'
    const sourceId = isIncoming ? row.path[i + 1] : row.path[i]   // true relationship source
    const targetId = isIncoming ? row.path[i] : row.path[i + 1]   // true relationship target
    const relationshipType = row.relationship_path[i]
    // existing edgeExists dedup on (source,target,type) now also collapses the same
    // physical row surfaced from both directions (discretion item: answered)
    ...
  }
}
```

Result for the headline D-04 case: incoming reference `X →rel→ focused` yields node X with `path [focused, X]`, `direction_path ['incoming']` → edge `{source: X, target: focused}` → React Flow arrow points AT the focused dossier. Redeploy via Supabase CLI/MCP after the migration is applied (deploy order: migration first — the old edge fn tolerates the extra column; the new edge fn tolerates a missing `direction_path` only if guarded with `?.`, so guard it).

**Arrow rendering:** Advanced + Enhanced modes already set `markerEnd: MarkerType.ArrowClosed` (AdvancedGraphVisualization L1341, EnhancedGraphVisualization L634). **Basic mode (`GraphVisualization.tsx` L216-232) has NO markerEnd** — add it, or D-04's "no undirected lines" fails when the user selects Basic. Arrows are canvas-coordinate semantics — no RTL flip needed; node labels already render `name_ar` in RTL (Advanced viz uses `useDirection`, L287/L638).

### Pattern 4: i18n namespace repair (D-07 — page is broken in Arabic TODAY)

- Page uses `const { t } = useTranslation()` (no namespace) + dot-form keys `t('graph.title', 'Relationship Graph')`. defaultNS resolves to `translation`, aliased to `common.json` (i18n/index.ts L258/L385), which has **no** `graph` or `relationship` keys → every string falls back to the inline English default in BOTH languages. [VERIFIED: code + JSON inspection]
- Fix: `useTranslation('graph')` + strip the `graph.` prefix. All 24 page keys (`title`, `description`, `noDossier`, `maxDegrees`, `degree`, `degrees`, `relationshipType`, `allTypes`, `refresh`, `complexity.*`, `basicMode`, `enhancedMode`, `advancedMode`, `nodes`, `edges`, `maxDegree`, `queryTime`, `error`, `graphView`, `listView`) already exist in `graph.json` EN and AR (125 = 125 keys). [VERIFIED]
- The filter labels `t('relationship.memberOf')` etc. (camelCase) do NOT exist anywhere; `graph.json` has the snake_case canonical set `relationship.member_of`, `relationship.cooperates_with`, … matching `DossierRelationshipType` (18 values, `frontend/src/types/relationship.types.ts` L18-36). Realign the Select's values AND labels to that vocabulary — the current option values `partner`, `parent_org`, `participant`, `signatory` are not canonical types and would filter to zero rows (live data uses `cooperates_with`; `dossier_relationships.relationship_type` is free TEXT with no CHECK constraint [VERIFIED: migration 20251022000003 L11]).
- The viz components themselves already use `useTranslation('graph')` correctly (e.g., MiniRelationshipGraph L495) — only the page is broken.

### Pattern 5: D-06 conformance — what the audit actually found

A regex sweep of the page + all 4 viz components found **zero raw hex, zero physical margin/padding classes, zero `text-left/right`** [VERIFIED: grep]. Colors flow through `semantic-colors.ts` token vars (`var(--heroui-*)`, `var(--color-secondary)`). Remaining DoD issues are **copy voice**: graph.json EN values are Title Case — `Relationship Graph`, `Degrees of Separation`, `Relationship Type`, `All Types`, `Graph View`, `List View`, `Max Degree`, `Query Time`, `View Full Graph` → sentence case per Bureau voice (`Relationship graph`, `Degrees of separation`, `All types`, `Graph view`, `List view`, `Max degree`, `Query time`, `View full graph`). Inline defaults in the page must be updated to match. AR strings are present and idiomatic (`مخطط العلاقات`). Verify at 1024 px and 1400 px per DoD.

### Anti-Patterns to Avoid

- **Renaming RPC input params** (`max_degrees` → `max_depth`): breaks PostgREST named-arg dispatch for every caller. (This exact bug already exists in `dossiers-relationships-create` L100-104 — it calls with `max_depth`/`filter_type`, gets PGRST202, and its circular-hierarchy check is silently inert. Pre-existing, out of scope; do not "fix" it in passing — a functional bidirectional cycle-check would false-positive on legitimate hierarchies.)
- **Manual `.reverse()` or RTL-flipping edge arrows** — direction is semantic, the canvas handles layout.
- **`t('graph:key')` colon-form mixed with `useTranslation('graph')`** — pick the namespace-arg form and bare keys; the repo's documented trap is dot-form against defaultNS.
- **Dropping `traverse_relationship_graph_bidirectional`** — two live consumers.
- **Seeding relationships with invented type strings** — use `DossierRelationshipType` values so `graph.json` labels resolve.

## Don't Hand-Roll

| Problem                 | Don't Build           | Use Instead                                                                 | Why                                                                           |
| ----------------------- | --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Directed-edge arrows    | Custom SVG markers    | `markerEnd: { type: MarkerType.ArrowClosed }` (@xyflow/react)               | Already used in 2 of 3 viz modes; handles zoom/scale                          |
| Bidirectional CTE logic | New traversal design  | Mirror `traverse_relationship_graph_bidirectional` (proven live on staging) | Reference implementation already handles cycles, clearance, effective windows |
| Per-type navigation     | Route string building | `getDossierDetailPath` (`lib/dossier-routes.ts` L45)                        | The R17-02-verified helper both graph surfaces already share                  |
| Search-param validation | Ad-hoc parsing        | TanStack `validateSearch` (repo pattern)                                    | Typed search params; kills the `as any` casts                                 |
| AR/EN label switching   | Conditional rendering | Existing `useDirection` + `name_ar`/`name_en` props in viz components       | Already implemented in Advanced viz                                           |

**Key insight:** every building block this phase needs already exists in the repo and is live-verified somewhere else; the work is connecting them and correcting the two contracts (RPC direction, i18n namespace) that were silently wrong.

## Common Pitfalls

### Pitfall 1: CREATE OR REPLACE cannot add the `direction_path` column

**What goes wrong:** Migration fails with `ERROR: cannot change return type of existing function`.
**Why:** RETURNS TABLE columns are OUT parameters; PostgreSQL forbids changing them via OR REPLACE. [CITED: postgresql.org/docs/current/sql-createfunction.html]
**How to avoid:** `DROP FUNCTION IF EXISTS traverse_relationship_graph(UUID, INTEGER, TEXT);` then CREATE, then re-GRANT, in one migration.
**Warning signs:** migration applies locally with a fresh DB (no existing function) but fails on staging.

### Pitfall 2: Edge direction silently wrong for incoming hops

**What goes wrong:** Bidirectional RPC ships, but arrows on incoming references point AWAY from the focused dossier — D-04 inverted.
**Why:** Edge fn assumes `path[i] → path[i+1]` is the relationship direction; true for outgoing-only traversal, false after the rewrite.
**How to avoid:** Consume `direction_path[i]` and swap source/target on `'incoming'` (Pattern 3). Verify live with the existing staging pair: focused = Indonesia (`b0000001-…-001`) must show an arrow FROM "Test Working Group D" pointing at it.
**Warning signs:** edge labels read backwards ("Indonesia cooperates_with Working Group" instead of the reverse).

### Pitfall 3: Deploy-order race between migration and edge function

**What goes wrong:** New edge fn deployed before the migration → `row.direction_path` is `undefined` → all edges treated as outgoing (or a crash if unguarded).
**How to avoid:** apply the migration first; guard with `row.direction_path?.[i]` so either order degrades to current behavior instead of crashing.

### Pitfall 4: The dot-vs-colon i18n trap (project-documented)

**What goes wrong:** Page looks fine in English, stays English in Arabic; raw keys can leak.
**Why:** `t('graph.X')` with default `useTranslation()` resolves against `common.json`, not `graph.json`.
**How to avoid:** `useTranslation('graph')` + bare keys. Test by switching to AR via the topbar `ع` button (language persists under localStorage `id.locale`, not `i18nextLng`).
**Warning signs:** AR mode shows "Relationship Graph" instead of "مخطط العلاقات".

### Pitfall 5: Stale filter values filter to zero

**What goes wrong:** User selects "Partner" → empty graph despite visible relationships.
**Why:** Option values (`partner`, `parent_org`, `participant`, `signatory`) aren't in the canonical vocabulary; live data uses `cooperates_with` etc. No DB CHECK constraint will catch this.
**How to avoid:** drive Select options from `DossierRelationshipType` and label via `graph:relationship.<value>`.

### Pitfall 6: D-09 verification blocked by empty staging data

**What goes wrong:** Live click-through cannot cover "every dossier type present in the graph" — only 1 relationship row exists.
**How to avoid:** plan a seed task: insert `dossier_relationships` rows (via Supabase MCP, idempotent, clearly-named test rows or reuse existing `a0000000/b0000001` test dossiers) connecting all 7 reachable types (country, organization, forum, engagement, topic, working_group, person — no `elected_official` dossiers exist on staging; EO is a person subtype). Mind `sensitivity_level` vs the test user's clearance (Indonesia is level 2 and visible to the test user — verified live).
**Warning signs:** graph renders < 7 node types during verification.

### Pitfall 7: Bundle-size budget (REQUIRED CI check)

**What goes wrong:** PR fails the Bundle Size Check. `RelationshipGraphPage` + 3 viz components + `RelationshipNavigator` are currently dead code (zero importers) — mounting the route adds a new route chunk counting toward "Total JS" (2.55 MB limit, bumped to its current value in PR #54; `signature-visuals/d3-geospatial` is already at 54.15/55 KB).
**How to avoid:** `@xyflow/react` and `framer-motion` are already bundled (MiniRelationshipGraph, App root), so the increment is component code only — but run `pnpm exec size-limit` locally in `frontend/` before the PR and grep for ALL `exceeded` lines.

### Pitfall 8: Spurious performance warnings during verification

**What goes wrong:** `performance_warning: "Query exceeded 2s"` appears on a 2-node graph and gets misread as a regression of the bidirectional rewrite.
**Why:** the edge fn measures total request time including cold start (live: 1945 ms first call, 849 ms second).
**How to avoid:** warm the function before measuring; compare second-call timings pre/post change.

### Pitfall 9: UNION ALL recursion blow-up at high degrees

**What goes wrong:** Degree-5 traversal on a denser future graph multiplies duplicate paths (the `_bidirectional` reference uses UNION ALL).
**How to avoid:** use `UNION` in the rewrite (dedups identical rows mid-recursion); edge fn caps `maxDegrees` at 5; `DISTINCT ON (d.id)` bounds output. Current staging volume (1 row) makes this theoretical, but D-05 requires verifying rendering at 2+ degrees after seeding.

## Code Examples

### D-02: actionable no-dossier alert

```tsx
// Page L170-184 today renders Alert only; add the way back (Bureau voice: sentence case)
import { Link } from '@tanstack/react-router'
...
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{t('noDossier')}</AlertDescription>
</Alert>
<Button variant="outline" asChild>
  <Link to="/dossiers">{t('browseDossiers', 'Browse dossiers')}</Link>
</Button>
// add graph.json en/ar key: browseDossiers / تصفح الملفات
```

### Live verification probes (reusable as phase-gate checks)

```bash
# token: password grant with .env.test TEST_USER_EMAIL/TEST_USER_PASSWORD against staging
# GRAPH-02 gate: traversal FROM the incoming-only dossier must now return the working group
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/traverse_relationship_graph" \
  -H "apikey: $ANON" -H "Authorization: Bearer $USER_JWT" -H "Content-Type: application/json" \
  -d '{"start_dossier_id":"b0000001-0000-0000-0000-000000000001","max_degrees":2,"relationship_type_filter":null}'
# expect: ≥1 row including a0000000-…-404 with direction_path ["incoming"]

# end-to-end gate: edge fn from the same dossier must report ≥1 edge with
# source_id = a0000000-…-404 (arrow pointing AT the focused dossier)
curl -s "$SUPABASE_URL/functions/v1/graph-traversal?startDossierId=b0000001-0000-0000-0000-000000000001&maxDegrees=2" \
  -H "Authorization: Bearer $USER_JWT" -H "apikey: $ANON"
```

### Affected RPC consumers (D-03 blast radius — all verified by grep)

| Consumer                                            | Call site      | Effect of in-place bidirectional change                                                                                                                             |
| --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graph-traversal` edge fn                           | L102           | Intended target; needs Pattern-3 update + redeploy                                                                                                                  |
| `stakeholder-influence` edge fn (`/network`)        | L413           | Gets bidirectional data + ignored extra column — richer network view; routed live at `/stakeholder-influence`; smoke-check it renders post-change                   |
| `cqrs-queries` edge fn (`handleGraphFallback`)      | L449           | No frontend callers found [VERIFIED: grep]; dormant; extra column harmless; its path-derived edges would share the orientation issue if ever revived — out of scope |
| `dossiers-relationships-create` (cycle check)       | L100           | Already inert (wrong param names `max_depth`/`filter_type` → PGRST202 swallowed). Behavior unchanged. Do not fix here                                               |
| `database.types.ts` (frontend + backend, generated) | type defs only | `Returns` for the RPC gains `direction_path`; regen via Supabase MCP `generate_typescript_types` is optional (no typed direct callers) but keeps types honest       |

### Component disposition (discretion item answered)

| Component                                        | Importers                                                                           | Verdict                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `components/relationships/RelationshipGraph.tsx` | `pages/contacts/ContactDetails.tsx` (routed at `/contacts/$contactId`)              | **LIVE — do not touch**                                                                                                           |
| `components/dossiers/RelationshipGraph.tsx`      | Only the 3 unrouted legacy `*DossierDetail` components (Country/Organization/Forum) | Dead-by-association, but disposition of `*DossierDetail` is **Phase 67 (PERENG-03)** territory — leave untouched, note in summary |

## State of the Art

| Old Approach                       | Current Approach                          | When Changed             | Impact                                                          |
| ---------------------------------- | ----------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| `reactflow` v11 package            | `@xyflow/react` v12 (repo: 12.10.2)       | 2024 rename              | Repo already on v12; docs/examples must target `@xyflow/react`  |
| Outgoing-only traversal everywhere | `_bidirectional` family (applied 2026-01) | migration 20260111200001 | The fix is consolidation, not invention                         |
| `/dossiers/$id` generic node-click | `getDossierDetailPath` per-type (R17-02)  | round-17 fix             | GRAPH-03 already solved in code; only live verification remains |

**Deprecated/outdated within this phase's scope:**

- The page's camelCase `relationship.memberOf`-style keys and the stale filter values — replaced by the canonical `DossierRelationshipType` + `graph:relationship.*` snake_case pairs.

## Assumptions Log

| #   | Claim                                                                                                                                                            | Section                   | Risk if Wrong                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| A1  | The deployed `graph-traversal` edge fn binary matches the repo code (inferred from matching live error/auth behavior; no management-API version check performed) | Live Staging Verification | Low — the phase redeploys it anyway                                                 |
| A2  | MCP-applied DDL triggers PostgREST schema-cache reload on Supabase staging (standard Supabase behavior)                                                          | Pattern 2                 | RPC briefly 404s until cache reload; retry resolves                                 |
| A3  | Test-user clearance ≥ 2 covers all seeded verification dossiers (Indonesia at sensitivity 2 was visible live; new seeds should use level ≤ 2)                    | Pitfall 6                 | Seeded nodes invisible during D-09 click-through                                    |
| A4  | `pnpm exec size-limit` headroom exists for the new route chunk (~component code only; libs already bundled)                                                      | Pitfall 7                 | PR blocked by required Bundle Size Check; mitigate by trimming or budget discussion |

## Open Questions

1. **Should the i18n sentence-case sweep extend to `graph.json` keys consumed by the viz components and mini-graph (e.g., `View Full Graph`)?**
   - What we know: D-06 scopes the conformance pass to the page; the mini-graph button is the contract entry point and shows Title Case today.
   - Recommendation: include `miniGraph.viewFullGraph` and the page-consumed keys in the sweep (same JSON file, trivial); leave deep viz-internal keys (layout/pathFinding/timeAnimation) as-is to limit diff surface.
2. **Does D-05's "verify rendering holds with real staging volumes" need more than the D-09 seed set?**
   - What we know: staging has 1 relationship; after seeding ~8-12 rows across 7 types, 2-degree bidirectional graphs stay small.
   - Recommendation: treat the D-09 seed as the volume test; verify complexity badge and layout at degrees 2 and 3.

## Environment Availability

| Dependency                                        | Required By                                  | Available                                | Version           | Fallback     |
| ------------------------------------------------- | -------------------------------------------- | ---------------------------------------- | ----------------- | ------------ |
| Staging Supabase (zkrcjzdemdmwhearhfgg)           | migration, edge deploy, live verify          | ✓ (probed live)                          | PG 17.6           | —            |
| `.env.test` creds (anon, service-role, test user) | live verification                            | ✓ (used in this research)                | —                 | —            |
| Supabase MCP                                      | apply migration, deploy edge fn, regen types | ✓ (project rule: migrations via MCP)     | —                 | Supabase CLI |
| pnpm workspace / Vitest / Playwright              | tests, build                                 | ✓ (`frontend/vitest.config.ts`, scripts) | pnpm 10.29.1      | —            |
| `@xyflow/react`, `framer-motion`, i18next         | page render                                  | ✓ installed + bundled                    | 12.10.2 / 12.40.0 | —            |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| Framework          | Vitest (jsdom, `setupFiles: ./tests/setup.ts`, include `**/*.test.{ts,tsx}`) |
| Config file        | `frontend/vitest.config.ts`                                                  |
| Quick run command  | `cd frontend && pnpm vitest run src/pages/relationships`                     |
| Full suite command | `cd frontend && pnpm vitest run` (plus `pnpm type-check`)                    |

### Phase Requirements → Test Map

| Req ID          | Behavior                                                                       | Test Type                                                                                                                    | Automated Command                                                                                 | File Exists? |
| --------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| GRAPH-01        | Route renders page (no redirect); no-dossier alert has a `/dossiers` link      | unit (component render)                                                                                                      | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` | ❌ Wave 0    |
| GRAPH-01        | AR mode renders `graph.json` AR strings (namespace fix regression guard)       | unit                                                                                                                         | same file, `i18n.changeLanguage('ar')` case                                                       | ❌ Wave 0    |
| GRAPH-02        | RPC returns incoming + outgoing                                                | live staging probe (SQL function not unit-testable in jsdom)                                                                 | curl probe documented in Code Examples (manual-only, justified: requires live DB)                 | n/a          |
| GRAPH-02 / D-04 | Edge orientation: `direction_path 'incoming'` swaps source/target              | unit on extracted transform (extract edge-building into a testable pure helper, or mirror the logic in a frontend util test) | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts`       | ❌ Wave 0    |
| GRAPH-03        | `handleNodeSelect` produces `/dossiers/<segment>/<id>` for each of the 8 types | unit (via `getDossierDetailPath`)                                                                                            | `cd frontend && pnpm vitest run src/lib` (extend existing or add)                                 | ❌ Wave 0    |
| D-09            | All-types live click-through on staging                                        | manual-only (justified: live data + visual navigation, Phase 62 precedent)                                                   | browser walkthrough checklist                                                                     | n/a          |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run src/pages/relationships && pnpm type-check` (pre-commit hook also runs `pnpm build`)
- **Per wave merge:** full `pnpm vitest run` + `pnpm exec size-limit` in `frontend/`
- **Phase gate:** full suite green + the two staging curl probes return bidirectional results + D-09 click-through before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` — covers GRAPH-01 (render, no-dossier link, AR strings)
- [ ] Edge-orientation unit test (pure transform mirroring the edge-fn logic) — covers GRAPH-02/D-04 client side
- [ ] Per-type path test for node-click — covers GRAPH-03
- Framework install: none needed (Vitest configured; `CountriesListPage.test.tsx` is the existing page-test pattern to copy)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies            | Standard Control                                                                                                                                                                                                                                        |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes                | Edge fn `@2` + `getUser(token)` — verified live and in code; do not regress when redeploying                                                                                                                                                            |
| V3 Session Management | no                 | Supabase session handled upstream                                                                                                                                                                                                                       |
| V4 Access Control     | **yes — critical** | SECURITY DEFINER RPC must preserve `sensitivity_level <= clearance(auth.uid())`, `status != 'deleted'`, `SET search_path = public`, and active/effective relationship filters in the rewrite. The bidirectional reference already does; copy faithfully |
| V5 Input Validation   | yes                | Edge fn validates `startDossierId` presence + `maxDegrees` 1-5 (keep); add `validateSearch` on the route; seeding scripts use parameterized inserts                                                                                                     |
| V6 Cryptography       | no                 | —                                                                                                                                                                                                                                                       |

### Known Threat Patterns for this stack

| Pattern                                                                    | STRIDE                  | Standard Mitigation                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clearance bypass via traversal (graph leaks a dossier the user can't open) | Information Disclosure  | Clearance filter inside the DEFINER function (both node SELECT and — inherently — edge endpoints, since edges are derived from returned nodes' paths); verify a low-clearance user cannot see sensitivity-3 nodes post-rewrite |
| Recursive CTE resource exhaustion                                          | Denial of Service       | `max_degrees` capped at 5 by the edge fn; cycle prevention; `UNION` dedup; `STABLE` function                                                                                                                                   |
| SECURITY DEFINER search-path hijack                                        | Elevation of Privilege  | `SET search_path = public` retained in the recreated function                                                                                                                                                                  |
| Open CORS on edge fn (`*`)                                                 | Tampering/CSRF-adjacent | Pre-existing; GET-only + JWT-required limits exposure; optional tightening to `ALLOWED_ORIGINS` pattern, not required by this phase                                                                                            |

## Project Constraints (from CLAUDE.md)

- Migrations apply via **Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`; no direct DB access changes.
- Tech stack frozen (React 19, TanStack v5, Tailwind v4, Supabase); no new component libraries (Aceternity/Kibo banned; HeroUI→Radix→build cascade for primitives only).
- Design tokens only: no raw hex, no Tailwind color literals; borders `1px solid var(--line)`; no card shadows; radii via `--radius-*`; row heights via `--row-h`.
- Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`); `dir={isRTL ? 'rtl' : 'ltr'}`; flip directional icons in RTL.
- Bureau voice: sentence case for titles/buttons; no emoji; no marketing voice; dates `Tue 28 Apr`.
- Desktop-primary: build for 1280, verify 1024 + 1400 (D-06 echoes this); below 768 read-only.
- ESLint: explicit function return types, no `any` (page currently has two `as any` casts that `validateSearch` typing removes), no floating promises; semicolons off, single quotes, 100-char lines.
- `components/**` new files PascalCase; pre-commit runs `pnpm build` (does NOT block on failure — verify output); main is PR-only with 8 required checks incl. Bundle Size Check.
- 80% coverage target / TDD workflow per user global rules; AAA test structure.
- GSD workflow: execution via `/gsd:execute-phase`.

## Sources

### Primary (HIGH confidence)

- Live staging probes (curl, 2026-06-12): RPC existence/behavior, edge-fn deployment/auth, `dossier_relationships` inventory, dossier-type counts
- Direct code inspection: `routes/_protected/relationships/graph.tsx`, `RelationshipGraphPage.tsx`, `supabase/functions/graph-traversal/index.ts`, migrations `20251022000003/20251022000008/20260111200001`, `MiniRelationshipGraph.tsx`, `GraphVisualization/Enhanced/Advanced`, `lib/dossier-routes.ts`, `types/relationship.types.ts`, `i18n/index.ts` + `graph.json` (en/ar), `vite.config.ts`, `.size-limit.json`, `vitest.config.ts`, `App.tsx` (LazyMotion)
- PostgreSQL docs — CREATE FUNCTION return-type rule: https://www.postgresql.org/docs/current/sql-createfunction.html

### Secondary (MEDIUM confidence)

- Project memory (verified where load-bearing): edge auth pattern (re-verified in code + live), i18n dot-vs-colon trap (re-verified against `common.json`/init config), bundle-budget history (PR #54)

### Tertiary (LOW confidence)

- None — no WebSearch-only claims in this document.

## Metadata

**Confidence breakdown:**

- Staging state (D-03 questions): HIGH — live-probed with real user JWT, exact HTTP codes and rows captured
- RPC rewrite mechanics: HIGH — reference implementation live-proven; DROP+CREATE rule cited from PostgreSQL docs
- i18n diagnosis: HIGH — namespace alias + key inventory verified byte-level
- Frontend wiring/conformance: HIGH — direct inspection; DoD regex sweep clean
- Bundle-size headroom: MEDIUM — increment estimated, not measured (A4)

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (stable stack; staging data may drift — re-run probes before execution if delayed)
