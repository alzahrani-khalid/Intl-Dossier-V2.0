# Phase 63: Relationship Graph Route & Bidirectional Traversal - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 9 (5 modified, 4 new)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File                                                                 | Role                    | Data Flow        | Closest Analog                                                                                                                                                                                                                                                | Match Quality                                                         |
| --------------------------------------------------------------------------------- | ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `frontend/src/routes/_protected/relationships/graph.tsx` (modify)                 | route                   | request-response | `frontend/src/routes/_protected/geographic-visualization.tsx`                                                                                                                                                                                                 | exact                                                                 |
| `frontend/src/pages/relationships/RelationshipGraphPage.tsx` (modify)             | component (page)        | request-response | itself + `frontend/src/components/dossier/MiniRelationshipGraph.tsx`                                                                                                                                                                                          | exact (self-modify; Mini supplies the correct i18n/nav/link patterns) |
| `frontend/src/components/relationships/GraphVisualization.tsx` (modify)           | component               | transform        | `frontend/src/components/dossier/MiniRelationshipGraph.tsx` L358-383                                                                                                                                                                                          | exact                                                                 |
| `supabase/migrations/<new>_bidirectional_traverse_in_place.sql` (new)             | migration               | CRUD (DDL)       | `supabase/migrations/20260508110346_phase46_fix_upcoming_events_rpc.sql` (DROP+CREATE+GRANT mechanics) + `20260111200001_enhanced_graph_traversal.sql` L13-127 (CTE logic) + `20251022000008_create_graph_functions.sql` L14-85 (signature/style to preserve) | exact                                                                 |
| `supabase/functions/graph-traversal/index.ts` (modify)                            | service (edge function) | request-response | itself (auth/CORS/validation stay; only edge-building L146-168 changes)                                                                                                                                                                                       | exact                                                                 |
| `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` (new) | test                    | —                | `frontend/src/routes/_protected/dossiers/countries/__tests__/CountriesListPage.test.tsx`                                                                                                                                                                      | exact                                                                 |
| `frontend/src/pages/relationships/__tests__/edge-orientation.test.ts` (new)       | test                    | —                | `frontend/src/lib/person-display.test.ts`                                                                                                                                                                                                                     | role-match (pure-function test)                                       |
| `frontend/src/lib/dossier-routes.test.ts` or extension (new)                      | test                    | —                | `frontend/src/lib/person-display.test.ts` (sibling file, same directory convention)                                                                                                                                                                           | exact                                                                 |
| `frontend/src/i18n/en/graph.json` + `ar/graph.json` (modify)                      | config (i18n)           | —                | already registered in `frontend/src/i18n/index.ts` L235-236 (imports), L375 (`graph: enGraph`) — value edits only                                                                                                                                             | exact                                                                 |

Out of band (no repo file): D-09 staging relationship seeding happens via Supabase MCP inserts, not a tracked file.

## Pattern Assignments

### `frontend/src/routes/_protected/relationships/graph.tsx` (route, request-response)

**Current state (the file being replaced)** — `graph.tsx` L1-7:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/relationships/graph')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers' })
  },
})
```

**Analog:** `frontend/src/routes/_protected/geographic-visualization.tsx` (the repo's `validateSearch` + page-mount pattern)

**Route mount + validateSearch pattern** (lines 6-39):

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { GeographicVisualizationPage } from '@/pages/geographic-visualization/GeographicVisualizationPage'

// Search params schema
interface GeoVisualizationSearchParams {
  timeRange?: TimeRange
  // ...
}

export const Route = createFileRoute('/_protected/geographic-visualization')({
  validateSearch: (search: Record<string, unknown>): GeoVisualizationSearchParams => {
    const timeRange = search.timeRange as string | undefined
    // ...
    return {
      timeRange: ['7d', '30d', '90d', '365d', 'custom'].includes(timeRange || '')
        ? (timeRange as TimeRange)
        : undefined,
      // ...
    }
  },
  component: GeographicVisualizationRoute,
})

function GeographicVisualizationRoute() {
  return <GeographicVisualizationPage />
}
```

Adaptation for this phase: single `dossierId?: string` search param (`typeof search.dossierId === 'string' && search.dossierId.length > 0 ? search.dossierId : undefined`). Note ESLint requires explicit return types — the analog's wrapper omits one (`function GeographicVisualizationRoute()`); new code should add `: ReactElement`. Once `validateSearch` exists, drop the `as any` on MiniRelationshipGraph's `Link search` (L724) and the page's `(search as any)?.dossierId` (page L112).

---

### `frontend/src/pages/relationships/RelationshipGraphPage.tsx` (component/page, request-response)

Self-modify; the patterns to copy come from `MiniRelationshipGraph.tsx` (the already-correct sibling surface).

**Bug 1 — i18n namespace** (page L107 today, the dot-vs-colon trap):

```tsx
// WRONG (page today, L107 + L177, L190, etc.): default NS resolves to common.json → English fallback in BOTH languages
const { t } = useTranslation()
...
t('graph.noDossier', 'No dossier selected. ...')
```

**Correct pattern** — `MiniRelationshipGraph.tsx` L495 + L726:

```tsx
const { t } = useTranslation('graph')
...
{t('miniGraph.viewFullGraph', 'View Full Graph')}   // bare key, namespace via hook arg
```

Fix = `useTranslation('graph')` + strip the `graph.` prefix from all 24 page keys (`title`, `description`, `noDossier`, `maxDegrees`, `degree`, `degrees`, `relationshipType`, `allTypes`, `refresh`, `complexity.*`, `basicMode`, `enhancedMode`, `advancedMode`, `nodes`, `edges`, `maxDegree`, `queryTime`, `error`, `graphView`, `listView`). All exist in `graph.json` EN+AR (verified: 125 = 125 keys).

**Bug 2 — filter Select vocabulary** (page L228-245 today): option values `partner`, `parent_org`, `participant`, `signatory` are not canonical and the labels `t('relationship.memberOf')` (camelCase) exist nowhere. Drive options from the canonical union — `frontend/src/types/relationship.types.ts` L18-36:

```ts
export type DossierRelationshipType =
  | 'member_of'
  | 'participates_in'
  | 'cooperates_with'
  | 'bilateral_relation'
  | 'partnership'
  | 'parent_of'
  | 'subsidiary_of'
  | 'related_to'
  | 'represents'
  | 'hosted_by'
  | 'sponsored_by'
  | 'involves'
  | 'discusses'
  | 'participant_in'
  | 'observer_of'
  | 'affiliate_of'
  | 'successor_of'
  | 'predecessor_of'
```

Labels: `graph.json` already has `relationship.member_of` … `relationship.predecessor_of` (all 18, snake_case, EN+AR) — with `useTranslation('graph')` the label call is `t(`relationship.${value}`)`.

**D-02 — actionable no-dossier alert** (page L170-184 today renders Alert only). Copy the `Button asChild + Link` pattern from `MiniRelationshipGraph.tsx` L723-728:

```tsx
<Button variant="outline" size="sm" className="w-full min-h-10" asChild>
  <Link to="/relationships/graph" search={{ dossierId: dossier.id } as any}>
    <Network className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
    {t('miniGraph.viewFullGraph', 'View Full Graph')}
    <ExternalLink className={cn('size-3', isRTL ? 'me-2' : 'ms-2')} />
  </Link>
</Button>
```

Adaptation: `<Button variant="outline" asChild><Link to="/dossiers">{t('browseDossiers', 'Browse dossiers')}</Link></Button>` under the existing Alert; add `browseDossiers` key to graph.json en (`Browse dossiers`) + ar (`تصفح الملفات`). Sentence case per Bureau voice.

**Node-click navigation (GRAPH-03 — already correct, do not change)** — page L156-164:

```tsx
const handleNodeSelect = (nodeId: string) => {
  // Navigate to the type-aware dossier detail route (R17-02). ...
  const node = deduplicatedNodes.find((n) => n.id === nodeId)
  const path = getDossierDetailPath(nodeId, node?.type)
  navigate({ to: path as '/dossiers' })
}
```

**DoD copy fixes:** inline default strings on the page are Title Case (`'Relationship Graph'` L190, `'Degrees of Separation'` L200, `'All Types'` L228, `'Graph View'` L385, `'List View'` L389, `'Max Degree'` L338, `'Query Time'` L344) — sentence-case them in lockstep with the graph.json EN values so defaults and bundle agree. Page styling already passes the token sweep (uses `me-2` L251, no raw hex) — copy changes only.

---

### `supabase/migrations/<new>_bidirectional_traverse_in_place.sql` (migration, DDL)

**Analog 1 — DROP + CREATE + GRANT mechanics:** `supabase/migrations/20260508110346_phase46_fix_upcoming_events_rpc.sql` L9-11 + L139 (the repo's "fix an RPC against live staging" precedent):

```sql
DROP FUNCTION IF EXISTS get_upcoming_events(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_user_id UUID DEFAULT NULL,
  ...
-- (L139)
GRANT EXECUTE ON FUNCTION get_upcoming_events(UUID, INTEGER) TO authenticated;
```

DROP is mandatory here (not optional hygiene): adding `direction_path` to RETURNS TABLE changes OUT parameters, which `CREATE OR REPLACE` refuses.

**Analog 2 — exact signature + security envelope to preserve:** `supabase/migrations/20251022000008_create_graph_functions.sql` L14-33 (the function being replaced):

```sql
CREATE OR REPLACE FUNCTION traverse_relationship_graph(
  start_dossier_id UUID,
  max_degrees INTEGER DEFAULT 2,
  relationship_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  dossier_id UUID, dossier_type TEXT, name_en TEXT, name_ar TEXT, status TEXT,
  degree INTEGER, path UUID[], relationship_path TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
```

Keep input parameter NAMES byte-identical (`start_dossier_id`, `max_degrees`, `relationship_type_filter TEXT` — singular TEXT, not TEXT[]): PostgREST dispatches by named args; live callers are `graph-traversal` (index.ts L102-107), `stakeholder-influence` (L413), `cqrs-queries` (L449). Output = the legacy 8 columns + `direction_path TEXT[]` appended.

**Analog 3 — clearance/filter clauses to copy faithfully** (same file L42-45 anchor filters, L74-80 final SELECT):

```sql
    WHERE dr.source_dossier_id = start_dossier_id
      AND dr.status = 'active'
      AND (dr.effective_to IS NULL OR dr.effective_to > now())
      AND (relationship_type_filter IS NULL OR dr.relationship_type = relationship_type_filter)
...
  WHERE d.status != 'deleted'
    -- RLS filtering: Only return dossiers within user's clearance
    AND d.sensitivity_level <= (
      SELECT COALESCE(clearance_level, 1)
      FROM profiles
      WHERE user_id = auth.uid()
    )
  ORDER BY d.id, rg.degree
```

**Analog 4 — the 4-branch bidirectional CTE body:** `supabase/migrations/20260111200001_enhanced_graph_traversal.sql` L45-123 (`traverse_relationship_graph_bidirectional`, live-proven on staging). The two incoming branches are the new logic to mirror — incoming anchor L62-72 and incoming recursion L94-106:

```sql
    -- Base case: Direct incoming relationships
    SELECT
      dr.source_dossier_id AS current_id,
      1 AS current_degree,
      ARRAY[start_dossier_id, dr.source_dossier_id] AS current_path,
      ARRAY[dr.relationship_type] AS rel_path,
      ARRAY['incoming'::TEXT] AS dir_path
    FROM dossier_relationships dr
    WHERE dr.target_dossier_id = start_dossier_id
      ...
    -- Recursive case: Follow incoming edges
    SELECT
      dr.source_dossier_id,
      rg.current_degree + 1,
      rg.current_path || dr.source_dossier_id,
      rg.rel_path || dr.relationship_type,
      rg.dir_path || 'incoming'::TEXT
    FROM relationship_graph rg
    JOIN dossier_relationships dr ON dr.target_dossier_id = rg.current_id
    WHERE rg.current_degree < max_degrees
      AND NOT (dr.source_dossier_id = ANY(rg.current_path))
      ...
```

Adaptations per RESEARCH Pattern 2: write it as `LANGUAGE sql` (Analog-2 style — the plpgsql wrapper in the reference only hoists clearance into a variable), use `UNION` not the reference's `UNION ALL` (mid-recursion dedup), keep the reference's `DISTINCT ON (d.id) ... ORDER BY d.id, rg.degree` final select (L108-123) with `direction_path` added. Do NOT drop or touch `traverse_relationship_graph_bidirectional` — `graph-traversal-advanced` (L229) and `get_graph_statistics` (migration L797) consume it. Apply via Supabase MCP to staging `zkrcjzdemdmwhearhfgg`.

---

### `supabase/functions/graph-traversal/index.ts` (service/edge function, request-response)

Self-modify. Everything except edge building stays — it is the project's reference auth implementation.

**Auth pattern to preserve (do not regress on redeploy)** — L5, L39-63:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
...
const token = authHeader.replace('Bearer ', '');
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
);
const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
if (userError || !user) { /* 401 */ }
```

(`@2` + `getUser(token)` — bare `getUser()` 401s on valid tokens; project memory + verified live.)

**RPC call (param names are the contract)** — L101-108:

```ts
const { data: graphData, error: graphError } = await supabaseClient.rpc(
  'traverse_relationship_graph',
  {
    start_dossier_id: startDossierId,
    max_degrees: maxDegrees,
    relationship_type_filter: relationshipType || null,
  },
)
```

**The block under change (D-04 — orientation bug)** — L146-168 today:

```ts
// Build edges from path
if (row.path && row.path.length > 1 && row.relationship_path) {
  for (let i = 0; i < row.path.length - 1; i++) {
    const sourceId = row.path[i] // WRONG after bidirectional rewrite:
    const targetId = row.path[i + 1] // assumes every hop is outgoing
    const relationshipType = row.relationship_path[i]
    const edgeExists = edges.some(
      (e) =>
        e.source_id === sourceId &&
        e.target_id === targetId &&
        e.relationship_type === relationshipType,
    )
    if (!edgeExists) {
      edges.push({ source_id: sourceId, target_id: targetId, relationship_type: relationshipType })
    }
  }
}
```

Replacement (RESEARCH Pattern 3 — guard with `?.` so deploy order degrades instead of crashing):

```ts
const isIncoming = row.direction_path?.[i] === 'incoming'
const sourceId = isIncoming ? row.path[i + 1] : row.path[i]
const targetId = isIncoming ? row.path[i] : row.path[i + 1]
// keep the existing edgeExists dedup — it also collapses the same physical row
// surfaced from both traversal directions
```

Deploy order: migration first, then redeploy the function (Supabase CLI/MCP). For the unit-testability gap, mirror this transform in a pure frontend helper (see edge-orientation test below) — the Deno function itself is not under Vitest.

---

### `frontend/src/components/relationships/GraphVisualization.tsx` (component, transform — Basic mode)

**Defect:** Basic-mode edges have NO arrow marker — L215-232 today:

```tsx
const edges: Edge[] = useMemo(() => {
  return filteredEdges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source_id,
    target: edge.target_id,
    type: 'smoothstep',
    animated: false,
    label: edge.relationship_type.replace(/_/g, ' '),
    style: { stroke: getEdgeColor(edge.relationship_type), strokeWidth: 2 },
    labelStyle: { fontSize: 12, fontWeight: 500 },
  }))
}, [filteredEdges])
```

**Analog:** `frontend/src/components/dossier/MiniRelationshipGraph.tsx` L358-383 (same edge shape with the marker; Enhanced L634-635 and Advanced L1341-1342 use the identical `markerEnd`):

```tsx
flowEdges.push({
  id: `edge-${index}`,
  source: edge.source_id,
  target: edge.target_id,
  type: 'smoothstep',
  style: { stroke: EDGE_COLORS[edge.relationship_type] || '#9ca3af', strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 10,
    height: 10,
    color: EDGE_COLORS[edge.relationship_type] || '#9ca3af',
  },
  label: edge.relationship_type.replace(/_/g, ' '),
  ...
})
```

Adaptation: add `markerEnd: { type: MarkerType.ArrowClosed, ... color: getEdgeColor(edge.relationship_type) }` to the Basic map and import `MarkerType` from `@xyflow/react` (Mini imports it at L27). Arrows are canvas semantics — no RTL flip, no `.reverse()`.

---

### `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` (test)

**Analog:** `frontend/src/routes/_protected/dossiers/countries/__tests__/CountriesListPage.test.tsx` (the repo's page-render test pattern)

**Mock-before-import structure + i18n mock** (lines 11-73):

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'

// --- Mocks (must be declared before importing the component under test) ---
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      const map: Record<string, string> = { 'countries:title': 'Countries' /* ... */ }
      if (map[k] !== undefined) return map[k]
      if (opts && 'defaultValue' in opts && typeof opts.defaultValue === 'string')
        return opts.defaultValue
      return k
    },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

const useCountriesMock = vi.fn()
vi.mock('@/hooks/useCountries', () => ({
  useCountries: (...args: unknown[]): unknown => useCountriesMock(...args),
}))

// Heavy child stub for test isolation
vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: ({ name }: { name: string }): ReactNode => (
    <span data-testid="dossier-glyph">{name}</span>
  ),
}))

import { CountriesListPage } from '../index'
```

**Assertion style + empty/loading states** (lines 86-148):

```tsx
describe('CountriesListPage', () => {
  beforeEach(() => { cleanup(); useCountriesMock.mockReset() })

  it('renders the title and a populated row with sensitivity chip', () => {
    useCountriesMock.mockReturnValue({ data: { data: [sampleRow], ... }, isLoading: false, isError: false })
    const { container } = render(<CountriesListPage page={1} search={undefined} onSearchChange={(): void => {}} />)
    expect(screen.getByRole('heading', { name: 'Countries' })).toBeTruthy()
    ...
  })

  it('renders empty state when adapter returns no rows', () => { ... })
  it('renders skeleton (no row content) while loading', () => { ... })
})
```

Adaptations for the graph page: additionally mock `@tanstack/react-router` (`useSearch` → `{ dossierId }` / `{}`, `useNavigate` → spy, `Link` → anchor stub) and stub the 4 heavy viz children (`GraphVisualization`, `EnhancedGraphVisualization`, `AdvancedGraphVisualization`, `RelationshipNavigator`) plus `@/lib/supabase`. The page uses TanStack Query (`useQuery`) — either wrap in a `QueryClientProvider` with `retry: false` or mock `@tanstack/react-query`'s `useQuery` like `useCountriesMock`. Cases per RESEARCH test map: (1) no-dossier alert + `/dossiers` link present, (2) graph renders with dossierId, (3) AR-strings case — for the AR regression guard, assert the page calls `useTranslation('graph')`-resolved keys (e.g., map `'noDossier'` under the graph namespace in the t-mock and assert the mapped string, proving bare-key + namespace form is in use).

---

### Edge-orientation test + per-type path test (tests, pure functions)

**Analog:** `frontend/src/lib/person-display.test.ts` (sibling pure-helper test, lines 5-22):

```ts
import { describe, it, expect } from 'vitest'
import { formatPersonLabel, isoToFlagEmoji, nationalityBadgeText } from './person-display'

describe('formatPersonLabel', () => {
  it('returns "first last" with no honorific (en)', () => {
    expect(formatPersonLabel({ first_name_en: 'Test', last_name_en: 'Person' }, 'en')).toBe('Test Person')
  })
  it('falls back to dossiers.name_ar for legacy rows (D-15, ar locale)', () => {
    expect(formatPersonLabel({ name_ar: 'اسم قديم' }, 'ar')).toBe('اسم قديم')
  })
  ...
})
```

**Edge-orientation test:** no existing extracted-transform helper exists (the logic lives only in the Deno edge fn) — create a pure helper mirroring the new edge-building loop (e.g., `buildGraphEdges(rows)` taking `{path, relationship_path, direction_path}` rows) and test it in this style: outgoing hop keeps `path[i] → path[i+1]`; `direction_path[i] === 'incoming'` swaps; missing `direction_path` (old RPC) degrades to all-outgoing; duplicate (source, target, type) dedups. AAA structure per repo testing rules.

**Per-type path test (GRAPH-03):** test `getDossierDetailPath` from `frontend/src/lib/dossier-routes.ts` L45-47 against all 8 entries of `DOSSIER_TYPE_TO_ROUTE` (L12-21: country→countries, organization→organizations, person→persons, engagement→engagements, forum→forums, working_group→working_groups, topic→topics, elected_official→elected-officials) plus the undefined-type fallback (`countries`). Place as `frontend/src/lib/dossier-routes.test.ts` (same directory convention as `person-display.test.ts` — note `lib/**` files are kebab-case per the ESLint filename rule; `__tests__/` under `pages/relationships/` also works for the page test, matching `CountriesListPage.test.tsx`).

---

### `frontend/src/i18n/en/graph.json` + `ar/graph.json` (config)

No structural pattern needed — the namespace is already imported and registered (`frontend/src/i18n/index.ts` L235-236 `import enGraph from './en/graph.json'` …, L375 `graph: enGraph`, AR mirrored ~L502). Changes are value-level:

- Sentence-case sweep on EN values consumed by the page + `miniGraph.viewFullGraph` (`Relationship Graph` → `Relationship graph`, `All Types` → `All types`, `Graph View` → `Graph view`, `View Full Graph` → `View full graph`, etc.). Leave deep viz-internal keys (`layout`, `pathFinding`, `timeAnimation`) untouched to limit diff surface.
- Add `browseDossiers` (EN: `Browse dossiers`, AR: `تصفح الملفات`) for the D-02 link.
- AR values verified present and idiomatic — top-level keys confirmed: `title, description, noDossier, maxDegrees, degree, degrees, relationshipType, allTypes, refresh, nodes, edges, maxDegree, queryTime, error, graphView, listView, complexity, miniGraph, relationship` (+ more); `relationship.*` has all 18 snake_case types.

## Shared Patterns

### i18n namespace form (apply to page + any new component code)

**Source:** `frontend/src/components/dossier/MiniRelationshipGraph.tsx` L495, L726

```tsx
const { t } = useTranslation('graph')
t('miniGraph.viewFullGraph', 'View Full Graph') // bare keys; namespace via hook arg
```

Never `t('graph.x')` against default NS, never mix `t('graph:x')` colon-form with the namespace-arg form.

### Per-type dossier navigation

**Source:** `frontend/src/lib/dossier-routes.ts` L45-47
**Apply to:** page node-click (already done, L156-164), per-type path test

```ts
export function getDossierDetailPath(dossierId: string, type: string | undefined | null): string {
  return `/dossiers/${getDossierRouteSegment(type)}/${dossierId}`
}
```

### Edge-function auth (do not regress on redeploy)

**Source:** `supabase/functions/graph-traversal/index.ts` L5, L39-63

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const {
  data: { user },
} = await supabaseClient.auth.getUser(token) // token explicit
```

### SECURITY DEFINER clearance envelope (any RPC touching dossiers)

**Source:** `supabase/migrations/20251022000008_create_graph_functions.sql` L29-32, L74-80

```sql
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
...
WHERE d.status != 'deleted'
  AND d.sensitivity_level <= (
    SELECT COALESCE(clearance_level, 1) FROM profiles WHERE user_id = auth.uid())
```

### Directed-edge marker (all React Flow edge builders)

**Source:** `MiniRelationshipGraph.tsx` L368-373 (same shape at `EnhancedGraphVisualization.tsx` L634-635, `AdvancedGraphVisualization.tsx` L1341-1342)

```tsx
markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: ... }
```

Apply to: Basic `GraphVisualization.tsx` (the one missing it). Never RTL-flip or `.reverse()` arrows.

## No Analog Found

| File | Role | Data Flow | Reason                                                                                                                                                                                                                |
| ---- | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | —    | —         | All files have repo analogs. The only partial gap: no existing pure "edge transform" helper to mirror for the orientation test — pattern is the helper-extraction itself; test style copies `person-display.test.ts`. |

## Metadata

**Analog search scope:** `frontend/src/routes/_protected/`, `frontend/src/pages/`, `frontend/src/components/{dossier,relationships}/`, `frontend/src/lib/`, `frontend/src/types/`, `frontend/src/i18n/`, `supabase/functions/graph-traversal/`, `supabase/migrations/`
**Files scanned:** ~20 (5 full reads, 8 targeted reads, 7 grep probes)
**Pattern extraction date:** 2026-06-12
