# Phase 71: Analytic Graph - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 9 new/modified surfaces
**Analogs found:** 9 / 9 (all exact or strong role-match)

> RESEARCH.md already named every analog with line refs and confidence HIGH. This map
> **verified each analog against the live file this session** and extracts the load-bearing
> excerpts the planner copies into plan actions. The data-model claims (working_group_members,
> engagement_dossiers/participants columns + indexes) and the clearance form were re-confirmed
> against migration source — no drift found.

## File Classification

| New/Modified File                                               | Role            | Data Flow                       | Closest Analog                                                                                                                                                                                    | Match Quality                                             |
| --------------------------------------------------------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `supabase/migrations/20260617_phase71_query_graph.sql`          | migration (RPC) | request-response / transform    | `generate_digest` in `supabase/migrations/20260615_phase70_digests_alerts.sql` (L333-449) + `get_relationship_path` in `supabase/migrations/20251022000008_create_graph_functions.sql` (L185-236) | exact (INVOKER+JSONB+inline clearance) / exact (path CTE) |
| `supabase/functions/analytic-graph/index.ts`                    | edge function   | request-response                | `supabase/functions/graph-traversal/index.ts` (whole file)                                                                                                                                        | exact (token→getUser→user-client→.rpc→shape)              |
| `frontend/src/hooks/useAnalyticGraph.ts`                        | hook            | request-response (server state) | `fetchGraphData` + `useQuery(['graph-traversal',…])` in `RelationshipGraphPage.tsx` (L93-154)                                                                                                     | exact (same edge-fn fetch + TanStack pattern)             |
| `frontend/src/routes/_protected/relationships/graph.tsx`        | route           | URL state                       | itself (L5-18 `GraphSearch`/`validateSearch`) — **extend in place**                                                                                                                               | exact                                                     |
| `frontend/src/pages/relationships/RelationshipGraphPage.tsx`    | page            | request-response                | itself — **extend with "Analyze" mode** (Tabs L395-445, stats L276-370)                                                                                                                           | exact                                                     |
| `frontend/src/components/relationships/AnalyticQueryPicker.tsx` | component       | event-driven (form)             | `PathFindingPanel` in `AdvancedGraphVisualization.tsx` (L593-606) + the Select controls block in `RelationshipGraphPage.tsx` (L224-265)                                                           | role-match (entity-select + typed inputs)                 |
| `frontend/src/components/relationships/AnalyticResultView.tsx`  | component       | transform (presentational)      | `RelationshipNavigator` (List tab) + stats grid in `RelationshipGraphPage.tsx` (L340-361)                                                                                                         | role-match (structured result rendering)                  |
| `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` | component       | event-driven                    | `cmd-generate-briefing` / `cmd-view-network` actions (L746-795) + `currentContext` (L429-437) — **extend with `cmd-analyze-*`**                                                                   | exact                                                     |
| `frontend/src/i18n/{en,ar}/graph.json`                          | config (i18n)   | n/a                             | itself — **extend `analyze.*` keys** (namespace already registered en+ar)                                                                                                                         | exact                                                     |

**Result-graph reuse (NOT a new file):** `AdvancedGraphVisualization` already accepts `nodes/edges/centerNodeId/onPathFind` (`AdvancedGraphVisualizationProps`, L144-152) and ships a built-in `PathFindingPanel` — the analytic result's "Graph view" feeds it directly; do NOT build a new React Flow integration.

---

## Pattern Assignments

### `supabase/migrations/20260617_phase71_query_graph.sql` (migration / RPC)

**Primary analog:** `generate_digest` — `supabase/migrations/20260615_phase70_digests_alerts.sql` (L333-449)
**Secondary analog:** `get_relationship_path` — `supabase/migrations/20251022000008_create_graph_functions.sql` (L185-236)

**Function-header + clearance pattern** (copy verbatim from `generate_digest`, L333-356) — this is the byte-for-byte INVOKER/JSONB/clearance shape `query_graph` must mirror:

```sql
CREATE OR REPLACE FUNCTION public.generate_digest(
  p_dossier_id UUID,
  p_period TEXT DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER          -- GRAPH-04: runs under caller JWT
STABLE
AS $$
DECLARE
  v_clearance INTEGER := 0;          -- default 0 = deny-all
  ...
BEGIN
  SELECT COALESCE((
    SELECT p.clearance_level
    FROM public.profiles p
    WHERE p.user_id = auth.uid()      -- CORRECT FORM — profiles has NO id column
  ), 0)
  INTO v_clearance;
```

For `query_graph`: signature is `query_graph(p_query_type TEXT, p_entity_id UUID, p_entity_id_2 UUID DEFAULT NULL, p_window_days INTEGER DEFAULT 90)` (RESEARCH.md Pattern 1).

**Inline-clearance per dossiers join** (the rule, from `generate_digest` L416/L439/L448): every `dossiers` reference carries `AND d.sensitivity_level <= v_clearance`. **Do NOT rely on `dossiers` SELECT RLS** — it is the broken-landmine policy set.

**Shortest-path 4th query — copy the CTE body** from `get_relationship_path` (L200-236), then add path-wide clearance (RESEARCH.md Pattern 4 — stricter than the DEFINER original; every hop must be in-clearance, not just endpoints):

```sql
WITH RECURSIVE path_search AS (
  SELECT ARRAY[source_dossier_id, dr.target_dossier_id] AS path,
         ARRAY[dr.relationship_type] AS relationship_path,
         1 AS path_length, dr.target_dossier_id AS current_dossier
  FROM dossier_relationships dr
  WHERE dr.source_dossier_id = source_dossier_id AND dr.status = 'active'
    AND (dr.effective_to IS NULL OR dr.effective_to > now())
  UNION
  SELECT ps.path || dr.target_dossier_id, ps.relationship_path || dr.relationship_type,
         ps.path_length + 1, dr.target_dossier_id
  FROM path_search ps
  JOIN dossier_relationships dr ON dr.source_dossier_id = ps.current_dossier
  WHERE ps.path_length < max_depth AND NOT (dr.target_dossier_id = ANY(ps.path))
    AND dr.status = 'active' AND ps.current_dossier != target_dossier_id
)
-- ... then SELECT shortest + AND NOT EXISTS (any path node with sensitivity > v_clearance)
```

**GRANT pattern** (from both analogs — `generate_digest` end + L85 of graph functions):

```sql
GRANT EXECUTE ON FUNCTION public.query_graph(TEXT, UUID, UUID, INTEGER) TO authenticated;
-- Threat model (RESEARCH.md Security): also REVOKE … FROM PUBLIC, anon;
```

**Membership/intersection/chain bodies** — verified column contracts (read this session):

- `working_group_members` (`20260110000006_working_groups_entity.sql` L37-76): `working_group_id → working_groups(id)=dossier id`, `member_type CHECK ('organization','person')`, `organization_id → organizations(id)`, `person_id` (NO FK), `status CHECK ('active','inactive','pending','suspended')`, `role`, `CONSTRAINT valid_member` enforces exactly one of org/person. Indexed on group/org/person/status/role. → join WG to `dossiers` on `working_group_id`, branch on `member_type`.
- `engagement_dossiers` (`20260110000006_create_engagement_dossiers.sql` L18-60): `start_date TIMESTAMPTZ NOT NULL`, `end_date TIMESTAMPTZ NOT NULL`, `host_country_id/host_organization_id → dossiers(id)`. Index `idx_engagement_dossiers_dates(start_date,end_date)`.
- `engagement_participants` (same file, L103-127): `engagement_id → engagement_dossiers(id)`, `participant_type CHECK`, `participant_dossier_id → dossiers(id)` (only non-`external` rows populate it), `role`. Index `idx_engagement_participants_dossier`. → order chain on `engagement_dossiers.start_date`, NOT `created_at`.

**Apply via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg` (executor lacks MCP — author SQL in-repo, orchestrator applies; 64-01/67-06 precedent).

---

### `supabase/functions/analytic-graph/index.ts` (edge function)

**Analog:** `supabase/functions/graph-traversal/index.ts` (whole file — the ONLY graph-RPC edge-fn pattern; no `digest-preview`/`read-signals` edge fn exists, so this is the canonical JWT-forwarding mirror)

**Imports + CORS** (L4-11):

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}
```

**JWT → RLS context (the load-bearing 4 lines)** (L47-81):

```ts
const authHeader = req.headers.get('Authorization');
if (!authHeader) return 401 'Missing authorization header';
const token = authHeader.replace('Bearer ', '');
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
);
const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
if (userError || !user) return 401 'Invalid user session';
```

**RPC call + perf budget** (adapt L119-126 + L204-223) — `query_graph` returns JSONB (unlike `traverse_relationship_graph` which returns TABLE rows), so shape the JSONB into `{nodes, edges, stats}`:

```ts
const { data, error } = await supabaseClient.rpc('query_graph', {
  p_query_type: queryType,
  p_entity_id: entityId,
  p_entity_id_2: entityId2 ?? null,
  p_window_days: windowDays ?? 90,
})
// stats budget (copy L204-223): query_time_ms, performance_warning = queryTime > 2000 ? '…' : null
```

**Validation pattern** (copy L89-102) — whitelist `queryType` against the fixed set, bound `windowDays` (1-365), require `entityId`; return generic errors (L227-234 catch).

**Deploy:** new edge fn via Supabase CLI/MCP (Runtime State Inventory: new deploy, not a reconfig). Reuses existing `SUPABASE_URL`/`SUPABASE_ANON_KEY` — no new secrets.

---

### `frontend/src/hooks/useAnalyticGraph.ts` (hook — NEW)

**Analog:** `fetchGraphData` + `useQuery` in `RelationshipGraphPage.tsx` (L93-154)

**Edge-fn fetch via session token** (copy L94-130):

```ts
const {
  data: { session },
} = await supabase.auth.getSession()
if (!session) throw new Error('Not authenticated')
const params = new URLSearchParams({ startDossierId, maxDegrees: maxDegrees.toString() })
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-traversal?${params}`,
  { headers: { Authorization: `Bearer ${session.access_token}` } },
)
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.error || '…')
}
return response.json()
```

For the analytic hook: target `/functions/v1/analytic-graph`, params `queryType`/`entityId`/`entityId2`/`windowDays`.

**TanStack Query wrapper** (copy L144-154):

```ts
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['analytic-graph', queryType, entityId, entityId2, windowDays],   // mirror ['graph-traversal',…]
  queryFn: () => fetchAnalyticGraph(...),
  enabled: !!entityId,
  staleTime: 30000,   // 30s cache — same precedent
})
```

**Explicit return type required** (ESLint `explicit-function-return-type`); no `console.log`.

---

### `frontend/src/routes/_protected/relationships/graph.tsx` (route — EXTEND in place)

**Analog:** itself (L5-18). Current schema only has `dossierId`. Extend `GraphSearch` + `validateSearch` to add `mode?`/`query?`/`entity2?`/`windowDays?` following the exact existing string-guard idiom:

```ts
interface GraphSearch {
  dossierId?: string
}
validateSearch: (search: Record<string, unknown>): GraphSearch => {
  const dossierId = search.dossierId
  return {
    dossierId: typeof dossierId === 'string' && dossierId.length > 0 ? dossierId : undefined,
  }
}
```

Add `mode: search.mode === 'analyze' ? 'analyze' : undefined`, `query` (whitelist the 4 query types), `entity2` (string-guard like dossierId), `windowDays` (`typeof === 'number'` bounded). Page reads via the existing `routeApi.useSearch()` (`RelationshipGraphPage.tsx` L33/L135).

---

### `frontend/src/pages/relationships/RelationshipGraphPage.tsx` (page — EXTEND with "Analyze" mode)

**Analog:** itself. Reuse its own structure:

- **Tabs (Graph/List) pattern** (L395-445) — the "Analyze" result also uses `<Tabs>` with a Graph view feeding `AdvancedGraphVisualization` (L408-416: `nodes/edges/centerNodeId/onNodeClick/height/showMiniMap`) and a structured view feeding the new `AnalyticResultView`.
- **Controls grid** (L221-273) — the query picker mounts in the same `<Card><CardContent>` controls region; mirror the `<Label>`+`<Select>` idiom (L224-265) for entity/query-type inputs.
- **Stats + perf-warning block** (L276-370) — reuse the complexity `<Badge>` (L285-299) and `query_time_ms` display (L355-360) for the analytic result's stats.
- **`handleNodeSelect`** (L179-187) — copy verbatim: resolves node type via `getDossierDetailPath` then `navigate`. Analytic node clicks must reuse this (the bare `/dossiers/$id` route does NOT exist — type-aware segment required).
- **Empty/error/loading states** (L193-210, L374-391) — mirror the `<Alert>`/`<Skeleton>` idiom.

Mode is driven off the extended search param (`mode === 'analyze'`), NOT new local state where the URL can carry it (URL-as-state, per project patterns).

---

### `frontend/src/components/relationships/AnalyticQueryPicker.tsx` (component — NEW)

**Analog:** `PathFindingPanel` in `AdvancedGraphVisualization.tsx` (L593-606) for the 2-entity select idiom; the controls `<Select>` block in `RelationshipGraphPage.tsx` (L224-265) for typed-input layout.

**PathFindingPanel signature + entity-select state** (L593-606) — the shape for "pick source/target entity":

```ts
interface PathFindingPanelProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onPathFound: (path: string[]) => void
  onClearPath: () => void
}
function PathFindingPanel({ nodes, edges, onPathFound, onClearPath }: PathFindingPanelProps) {
  const { t } = useTranslation('graph')           // <-- reuse the registered 'graph' namespace
  const { isRTL } = useDirection()
  const [sourceId, setSourceId] = useState<string>('')
  const [targetId, setTargetId] = useState<string>('')
  ...
```

The picker: query-type `<Select>` (4 templates), 1 or 2 entity inputs depending on type, plus a window-N input for `engagement_chain`. Dossier-context pre-fills the primary entity (D-02). Use `useTranslation('graph')` and `useDirection()` exactly as the analog. Typed props interface (named, no `React.FC`); explicit return type.

---

### `frontend/src/components/relationships/AnalyticResultView.tsx` (component — NEW)

**Analog:** `RelationshipNavigator` (the List-tab renderer, `RelationshipGraphPage.tsx` L438-444) + the stats grid (L340-361).

Renders the structured primary result keyed to query type (membership list / intersection table / engagement timeline / path). Mirror:

- List rendering + `onNodeSelect` callback contract from `RelationshipNavigator` (L439-443).
- Token-bound chrome: `var(--row-h)` row heights, `1px solid var(--line)` borders, NO card shadows, logical props (`ms-*`/`ps-*`/`text-start`), `dir`/Tajawal for AR (project CLAUDE.md UI rules — this is a desktop-primary analyst surface, 1280-1400px).
- **GRAPH-03 indistinguishable-empty:** empty/reduced result renders the SAME empty/short list — NO "filtered by clearance" copy anywhere.

---

### `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` (component — EXTEND with `cmd-analyze-*`)

**Analog:** itself — `cmd-generate-briefing` + `cmd-view-network` actions + `currentContext`.

**`QuickActionItem` shape** (L335-342) — every new action conforms:

```ts
interface QuickActionItem {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  shortcut?: string
  category?: string
}
```

**Current-dossier context via pathname regex (RF-6, the pre-fill mechanism)** — copy the `cmd-generate-briefing` idiom (L770-782); zero new state:

```ts
{
  id: 'cmd-generate-briefing',
  label: t('quickActions.generateBriefing', 'Generate Briefing'),
  icon: FileText,
  action: (): void => {
    const engagementMatch = /\/engagements\/([^/]+)/.exec(location.pathname)
    if (engagementMatch != null) {
      navigateTo(`/engagements/${engagementMatch[1]}/docs`)
    } else {
      navigateTo('/dossiers/engagements')
    }
  },
},
```

For `cmd-analyze-*`: match `location.pathname` against the dossier route segments (`frontend/src/lib/dossier-routes.ts` map) to extract the current dossier id, then deep-link to `/relationships/graph?dossierId=<id>&mode=analyze&query=<type>`. The `cmd-view-network` action (L746-757) is the existing "graph deep-link from pathname" precedent — model the navigate target on it.

**`currentContext` route-aware suggestions** (L429-437) — the `routeContexts` pattern that surfaces context-appropriate actions; register the analyze actions so they rank up on dossier routes:

```ts
const currentContext = useMemo((): RouteContext => {
  const pathname = location.pathname
  for (const ctx of routeContexts) {
    if (ctx.pattern != null && ctx.pattern.test(pathname)) return ctx
  }
  return { contextType: 'general', suggestedActions: [] }
}, [location.pathname])
```

**Compact inline result (GRAPH-02):** the Cmd+K result is a compact inline render; the full panel is the deep-link target (D-03). Actions live in the `quickActions` useMemo (L694-823, dep array `[t, formatShortcut, navigateTo, location.pathname]`). Use `useTranslation('keyboard-shortcuts')` for labels (L411).

---

### `frontend/src/i18n/{en,ar}/graph.json` (i18n — EXTEND)

**Analog:** itself — `graph` namespace already registered en+ar (`frontend/src/i18n/index.ts` L235-236 en, L515 ar). Add `analyze.*` keys to BOTH `en/graph.json` and `ar/graph.json`. Keyboard-shortcut labels go in the already-registered `keyboard-shortcuts` namespace (L317/L449).

**Do NOT create a new namespace** — unregistered namespaces fall back to English in BOTH languages (P68 CI guard catches it; MEMORY: static-bundle, no http-backend). Reuse `graph`/`graph-traversal`/`relationships`/`keyboard-shortcuts` (all confirmed registered en+ar this session).

---

## Shared Patterns

### Clearance read + inline filter (THE keystone — applies to the migration)

**Source:** `generate_digest` (`20260615_phase70_digests_alerts.sql` L350-356) + every graph fn (`20251022000008` L76-80)
**Apply to:** `query_graph` RPC — every query branch, every `dossiers` join

```sql
SELECT COALESCE((SELECT p.clearance_level FROM public.profiles p
                 WHERE p.user_id = auth.uid()), 0) INTO v_clearance;
-- then at EVERY dossiers reference:  AND d.sensitivity_level <= v_clearance
```

**LANDMINE (flag on every SQL review):** `profiles` has **NO `id` column**. `WHERE id = auth.uid()` silently binds to the OUTER table → NULL → blocks ALL reads (or `COALESCE(...,1)` → deny-all-above-1 for everyone, which _looks_ like GRAPH-03 passing on all-sensitivity-1 staging). Always `WHERE user_id = auth.uid()`. The new INVOKER RPC must NOT depend on `dossiers` SELECT RLS (live policy set = broken `id=auth.uid()` form OR-ed with a legacy string-comparison `view_dossiers_authenticated` policy). Plan-checker should grep new SQL for `profiles WHERE id = auth.uid()` and fail on a hit. (Carried-forward lock; P69 EXEC; documented in `20260610000002`.)

### JWT → RLS context in the API

**Source:** `graph-traversal/index.ts` L47-81
**Apply to:** `analytic-graph/index.ts`
`authHeader → token = replace('Bearer ','') → createClient(…, {global:{headers:{Authorization}}}) → getUser(token) → 401 if !user → .rpc('query_graph', …)`. Identical requirement; copy it.

### Result-graph rendering

**Source:** `AdvancedGraphVisualization` props (`AdvancedGraphVisualization.tsx` L144-152) + its built-in `PathFindingPanel` (L593+); usage in `RelationshipGraphPage.tsx` L408-416
**Apply to:** the "Graph view" tab of the analytic result
Pass `{nodes, edges, centerNodeId, onNodeClick, height, showMiniMap}`. Do NOT build a new React Flow integration.

### Edge → node/edge transform + perf budget

**Source:** `graph-traversal/index.ts` L133-223
**Apply to:** `analytic-graph/index.ts` stats block
`query_time_ms` + `performance_warning = queryTime > 2000 ? '…' : null` (2s budget; the panel already surfaces it, `RelationshipGraphPage.tsx` L355-368). RF-8 target: reuse this budget.

### Type-aware node navigation

**Source:** `handleNodeSelect` (`RelationshipGraphPage.tsx` L179-187) — `getDossierDetailPath(nodeId, node?.type)`
**Apply to:** every analytic node/row click (Graph view + AnalyticResultView). The bare `/dossiers/$id` route does NOT exist; the type-aware `/dossiers/<segment>/$id` is required (R17-02).

### Design tokens + RTL (all FE files)

**Source:** project CLAUDE.md UI rules + `RelationshipGraphPage.tsx` (uses `me-2` logical prop L269, token-bound `<Card>`/`<Badge>`/`<Alert>`)
**Apply to:** AnalyticQueryPicker, AnalyticResultView, the page mode, the Cmd+K inline result
`var(--row-h)`, `1px solid var(--line)`, no card shadows, no raw hex, logical props (`ms-*`/`ps-*`/`text-start`), `dir`/Tajawal for AR, no emoji, no marketing voice. Verify at 1024px + 1400px. `useDirection()`/`isRTL` (CommandPalette L416, PathFindingPanel L602).

---

## No Analog Found

None. Every Phase 71 surface has an exact or strong role-match analog in-repo. RESEARCH.md's "Key insight" holds: this phase is **assembly of existing, deployed primitives** — the only genuinely new SQL is the `query_graph` dispatcher, and even its sub-queries (membership edges, WG member table, canonical engagement plane, path CTE, clearance expression) all already exist and are index-served.

| File | Role | Data Flow | Reason                                       |
| ---- | ---- | --------- | -------------------------------------------- |
| —    | —    | —         | (all 9 surfaces mapped to a verified analog) |

## Metadata

**Analog search scope:**

- `supabase/migrations/` — `generate_digest` (P70), `get_relationship_path`/`traverse_relationship_graph`/`get_bidirectional_relationships` (graph fns), `working_group_members` + `engagement_dossiers`/`engagement_participants` schema, signals (P69)
- `supabase/functions/` — `graph-traversal` (confirmed: no `digest-preview`/`read-signals` edge fn exists; `graph-traversal` is the canonical JWT-forwarding mirror)
- `frontend/src/pages/relationships/`, `routes/_protected/relationships/`, `components/relationships/`, `components/keyboard-shortcuts/`, `hooks/`, `i18n/`

**Files scanned (read this session):** `20260615_phase70_digests_alerts.sql` (L325-459), `20251022000008_create_graph_functions.sql` (full), `graph-traversal/index.ts` (full), `RelationshipGraphPage.tsx` (full), `graph.tsx` route (full), `CommandPalette.tsx` (L335-454, L744-805 + grep map), `AdvancedGraphVisualization.tsx` (L118-152, L593-606 + grep map), `20260110000006_working_groups_entity.sql` (grep), `20260110000006_create_engagement_dossiers.sql` (grep), `i18n/index.ts` (grep)

**Pattern extraction date:** 2026-06-17
