# Dossier Relationships / Network Graph Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end dossier relationship workflow on the live `DossierShell` path — `RelationshipSidebar`, `MiniRelationshipGraph`, `FullScreenGraphModal`, quick-link / add-relationship dialogs, `dossier-relationships` and `graph-traversal` edge functions, `dossier_relationships` schema, React Flow node/edge rendering, and relationship hooks.  
**Method:** Static code trace against `frontend/src`, `supabase/functions/`, `supabase/migrations/`, and `frontend/src/i18n/{en,ar}/*.json`. No live staging API or browser calls were executed.

---

## Workflow Map (Verified Live Path)

| Stage                                    | Entry                                  | Primary implementation                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detail shell                             | `/dossiers/{type}/$id/*`               | `DossierShell` → desktop `RelationshipSidebar` + mobile `BottomSheet`                                                                                                                          |
| List relationships                       | Sidebar / mini graph                   | `useRelationshipsForDossier` → `relationship-api.getRelationshipsForDossier` → edge fn `dossier-relationships` GET `/dossier-relationships/dossier/:id` (bidirectional `.or(source,target)`)   |
| Quick link                               | Sidebar popover                        | `useCreateRelationship` from `domains/relationships/hooks/useRelationships.ts` → POST `dossier-relationships` with `source_dossier_id`, `target_dossier_id`, `relationship_type: 'related_to'` |
| Unlink                                   | Sidebar remove confirm                 | `useDeleteRelationship` → DELETE `dossier-relationships/:id`                                                                                                                                   |
| Mini graph                               | Sidebar (desktop, expanded)            | `MiniRelationshipGraph` → same bidirectional list hook; local React Flow layout                                                                                                                |
| Full-screen map                          | Sidebar “Expand Graph”                 | Lazy `FullScreenGraphModal` → GET `graph-traversal` → RPC `traverse_relationship_graph` → `AdvancedGraphVisualization`                                                                         |
| Add relationship dialog                  | `DossierShell` → `AddToDossierDialogs` | `RelationshipDialog` → `useCreateRelationship` from `@/hooks/useCreateRelationship` → `createDossierRelationship` → POST `dossiers-relationships-create`                                       |
| Full-page graph (linked from mini graph) | `/relationships/graph?dossierId=`      | Route **redirects** to `/dossiers`; `RelationshipGraphPage` component is orphaned                                                                                                              |

**Superseded / not on `DossierShell` path:** `components/dossiers/RelationshipGraph.tsx` (used only from legacy `*DossierDetail.tsx` pages not wired to current country/org/forum routes), `RelationshipGraphPage` (no active route).

**DB contract (verified):** `dossier_relationships` columns `source_dossier_id`, `target_dossier_id`, `relationship_type` (TEXT, no DB enum), `notes_en` / `notes_ar`, `status` (`active` \| `historical` \| `terminated`), `no_self_reference` constraint. Edge fn `dossier-relationships` validates 17 canonical types (e.g. `member_of`, `partnership`, `related_to`); types like `collaborates_with`, `partner`, `monitors` are **not** accepted on create.

---

## Findings

### 1. CRITICAL — `/relationships/graph` route redirects; “View Full Graph” never opens a graph

**Location:**

- `frontend/src/routes/_protected/relationships/graph.tsx` lines 3–6 (`beforeLoad` → `redirect({ to: '/dossiers' })`)
- `frontend/src/components/dossier/MiniRelationshipGraph.tsx` lines 723–728 (`Link to="/relationships/graph"` with `search={{ dossierId }}`)

**Why it is a real bug:** The mini graph’s primary CTA navigates to a route that immediately redirects to the dossier hub list. Analysts cannot reach `RelationshipGraphPage` (or any full-page graph UI) from the sidebar workflow. The `RelationshipGraphPage` component (~430 lines) is effectively dead code behind a redirect.

**Recommended fix:** Restore the route to render `RelationshipGraphPage` (or redirect to a typed dossier graph tab) and align search params (`dossierId`). Alternatively, change the mini-graph link to open `FullScreenGraphModal` or a dedicated shell tab instead of `/relationships/graph`.

---

### 2. CRITICAL — `AddToDossierDialogs` relationship dialog uses a broken API contract and invalid relationship types

**Location:**

- `frontend/src/components/dossier/AddToDossierDialogs.tsx` lines 812–844, 888–900
- `frontend/src/domains/relationships/repositories/relationships.repository.ts` lines 35–53
- `supabase/functions/dossiers-relationships-create/index.ts` lines 35–55, 139–158

**Why it is a real bug:** The dialog posts `{ child_dossier_id, relationship_type }` to `dossiers-relationships-create?dossierId=…`, but the edge function requires `source_dossier_id`, `target_dossier_id`, and `relationship_type` in the JSON body and does not read `dossierId` from the query string. Default and selectable types include `collaborates_with`, `monitors`, and `hosts`, which are absent from `VALID_RELATIONSHIP_TYPES` in `dossier-relationships` and from the create edge function’s hierarchy logic. Submissions fail validation (400) or insert invalid `relationship_type` strings if unchecked. This is a separate code path from the working sidebar quick-add (which correctly calls `dossier-relationships` with `source_dossier_id` / `target_dossier_id`).

**Recommended fix:** Route the dialog through `relationship-api.createRelationship` (same as sidebar) with `source_dossier_id: dossierContext.dossier_id`, `target_dossier_id` from `DossierSelector`, and types from `DossierRelationshipType` / `RELATIONSHIP_TYPE_LABELS`. Remove or rewrite `createDossierRelationship` and the T064 hook payload.

---

### 3. CRITICAL — `domains/relationships` barrel exports two different `useCreateRelationship` hooks; the wrong one wins

**Location:**

- `frontend/src/domains/relationships/index.ts` lines 10–33 (exports `useCreateRelationship as useCreateRelationshipMutation` from `useRelationships.ts`, then exports `useCreateRelationship` from `useCreateRelationship.ts`)
- `frontend/src/hooks/useCreateRelationship.ts` lines 5–8 (re-exports from barrel)

**Why it is a real bug:** ES module exports cannot expose two bindings with the same name; the second export (`useCreateRelationship.ts` with `child_dossier_id` / invalid types) overrides the first. Any consumer importing from `@/hooks/useCreateRelationship` or `@/domains/relationships` gets the broken T064 hook—not the working mutation in `useRelationships.ts`. `RelationshipSidebar` avoids this by importing directly from `hooks/useRelationships.ts`; `AddToDossierDialogs` does not.

**Recommended fix:** Rename the T064 hook (e.g. `useCreateLegacyDossierRelationship`), export the working mutation as the sole `useCreateRelationship`, and update `AddToDossierDialogs` to use the canonical hook.

---

### 4. HIGH — Full-screen and N-degree graph traversal is outgoing-only; sidebar is bidirectional

**Location:**

- `supabase/migrations/20251022000008_create_graph_functions.sql` lines 34–61 (`traverse_relationship_graph` follows only `source_dossier_id → target_dossier_id`)
- `supabase/functions/graph-traversal/index.ts` lines 101–107 (calls `traverse_relationship_graph`)
- `supabase/functions/dossier-relationships/index.ts` lines 177–197 (sidebar list uses bidirectional `.or(source,target)`)
- `frontend/src/components/graph/FullScreenGraphModal.tsx` lines 84–119

**Why it is a real bug:** Relationships where the current dossier is the **target** (e.g. `Country A —member_of→ Organization B`, viewing B) appear in the sidebar and mini graph but are **missing** from the expanded full-screen map and any `graph-traversal` consumer. A bidirectional RPC `traverse_relationship_graph_bidirectional` exists (`20260111200002_fix_graph_traversal_recursive_cte.sql`) and is used by `graph-traversal-advanced`, but the modal calls the legacy outgoing-only function.

**Recommended fix:** Switch `graph-traversal` (or `FullScreenGraphModal`) to `traverse_relationship_graph_bidirectional`, or extend `traverse_relationship_graph` to walk edges in both directions consistently with `get_bidirectional_relationships`.

---

### 5. HIGH — Full-screen graph relationship-type filter uses invalid value `partner`

**Location:**

- `frontend/src/components/graph/FullScreenGraphModal.tsx` lines 210–219 (`SelectItem value="partner"`)
- `supabase/functions/graph-traversal/index.ts` lines 69, 106 (`relationshipType` passed to RPC filter)
- `supabase/functions/dossier-relationships/index.ts` lines 58–77 (`partnership` is valid; `partner` is not)

**Why it is a real bug:** Selecting “Partner” sends `relationshipType=partner` to the RPC, which filters `dr.relationship_type = 'partner'`. No seed or validator defines `partner`; stored values use `partnership`. The filter silently returns an empty graph while the sidebar still shows partnership edges.

**Recommended fix:** Change the select value to `partnership` and align labels with `RELATIONSHIP_TYPE_LABELS` / `dossier-shell` graph keys.

---

### 6. HIGH — `RelationshipSidebar` treats relationship fetch failures as an empty list

**Location:**

- `frontend/src/components/dossier/RelationshipSidebar.tsx` lines 158–159, 176–197, 307–323

**Why it is a real bug:** `useRelationshipsForDossier` exposes `isError` / `error`, but the sidebar only branches on `isLoading` and `linkedDossiers.length === 0`. A 401, 500, or PostgREST embed error surfaces as “No linked dossiers” with a call-to-action to link dossiers—misleading and hides actionable failures. `MiniRelationshipGraph` does handle `isError` (lines 614–633); the sidebar does not.

**Recommended fix:** Destructure `isError` / `error` and render an error state (reuse `dossier-shell` error copy or mini-graph pattern) with retry; do not fall through to the empty state on query failure.

---

### 7. HIGH — Sidebar can render linked rows with empty dossier id when embed is missing

**Location:**

- `frontend/src/components/dossier/RelationshipSidebar.tsx` lines 181–195, 369–371

**Why it is a real bug:** `linked` is taken from `rel.target_dossier` / `rel.source_dossier` and cast to `{}` when null. `id` becomes `''`, but the row still renders and `getDossierDetailPath('', type)` produces a broken navigation target. This can occur if the relationship row is visible under RLS but the joined dossier embed is null (deleted dossier, clearance, or embed failure).

**Recommended fix:** Filter out relationships where `linked?.id` is missing; show a muted “Restricted dossier” row without a link, or omit the row.

---

### 8. MEDIUM — Mutation toasts use missing i18n keys (`relationship.create.*`)

**Location:**

- `frontend/src/domains/relationships/hooks/useRelationships.ts` lines 114–132, 169–180, 216–227
- `frontend/src/i18n/index.ts` lines 255–256 (`translation` / `common` only; no `relationship` namespace)
- `frontend/src/i18n/en/relationships.json` lines 68–76 (`messages.created`, not `create.success`)

**Why it is a real bug:** Hooks call `useTranslation()` (default `translation` namespace) with keys `relationship.create.success`, `relationship.update.success`, etc. Those keys do not exist in `common.json` or any loaded namespace. English and Arabic users see raw key strings (or English fallback) on successful link/unlink from the sidebar, degrading bilingual UX.

**Recommended fix:** Use `useTranslation('relationships')` and `t('messages.created')` / `messages.deleted`, or add a `relationship` namespace mirroring `public/locales/en/relationship.json`.

---

### 9. MEDIUM — Sidebar tier labels, relationship types, and remove-dialog actions are hardcoded English

**Location:**

- `frontend/src/components/dossier/RelationshipSidebar.tsx` lines 109–113 (`TIER_LABELS` constant), 348, 376–378, 513–529

**Why it is a real bug:** Tier headers (“Strategic”, “Operational”, “Informational”) and relationship subtitles (`relationshipType.replace(/_/g, ' ')`) ignore `graph.relationship.*` / `relationships.types.*` Arabic strings. Remove dialog buttons are literal `"Cancel"` and `"Remove"` (lines 519, 528) while titles/bodies use `dossier-shell` keys that **do** exist in `ar/dossier-shell.json`. Arabic RTL users get a mixed English/Arabic sidebar.

**Recommended fix:** Move tier labels and relationship type labels to `dossier-shell` or `graph` namespaces; use `t('action.cancel')` / a `sidebar.removeConfirmAction` key for buttons; use `t(\`graph.relationship.${type}\`)` for subtitles.

---

### 10. MEDIUM — `useGraphData` references missing `graph.fetchError` key

**Location:**

- `frontend/src/domains/relationships/hooks/useRelationships.ts` lines 363–365
- `frontend/src/i18n/en/graph.json` line 18 (`"error"` exists; `"fetchError"` does not)

**Why it is a real bug:** Query `meta.errorMessage` uses `t('graph.fetchError', 'Failed to load graph data')`. The fallback always applies in production because the key is absent from both `en/graph.json` and `ar/graph.json`. Any consumer of `useGraphData` (outside the modal’s inline `useQuery`) will not show localized error metadata.

**Recommended fix:** Add `fetchError` to both graph locale files or change the hook to `t('error')`.

---

### 11. MEDIUM — `dossiers-relationships-create` hierarchy guard calls RPC with wrong parameter names

**Location:**

- `supabase/functions/dossiers-relationships-create/index.ts` lines 99–104

**Why it is a real bug:** Circular-hierarchy prevention calls `traverse_relationship_graph` with `{ start_dossier_id, max_depth: 10, filter_type: 'parent_of' }`. The function signature is `(start_dossier_id UUID, max_degrees INTEGER, relationship_type_filter TEXT)`. Wrong names mean the filter is ignored (`relationship_type_filter` defaults to NULL) and depth may not apply as intended, so circular `parent_of` / `subsidiary_of` links may slip through if this endpoint is fixed and used.

**Recommended fix:** Pass `max_degrees` and `relationship_type_filter: 'parent_of'`, or call `get_relationship_path` / bidirectional traversal for cycle detection.

---

### 12. LOW — Mini-graph edge arrows ignore relationship direction relative to center node

**Location:**

- `frontend/src/components/dossier/MiniRelationshipGraph.tsx` lines 357–384 (edges always `source_id` → `target_id` from DB)

**Why it is a real bug:** When the viewed dossier is `target_dossier_id`, the visual arrow still points source → target, which may point **away** from the center node. This does not break data but misstates relationship direction in the UI compared to the sidebar’s “linked entity” semantics.

**Recommended fix:** When building edges for the mini graph, orient edge source/target so one endpoint is always the center dossier (or use undirected edge styling).

---

### 13. LOW — Dead code: `RelationshipGraphPage` and legacy `RelationshipGraph` filter UI

**Location:**

- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` (full page; never mounted)
- `frontend/src/components/dossiers/RelationshipGraph.tsx` lines 67–69, 328–350 (`relationshipTypeFilter` state never filters `relationships` array)

**Why it is a real bug:** Not on the `DossierShell` path, but the filter dropdown remounts the graph via `graphKey` without filtering data, and filter options include non-canonical types (`collaborates_with`, `monitors`, etc.). If legacy dossier detail pages are re-enabled, the filter would mislead users.

**Recommended fix:** Delete or wire up with filtered `useRelationshipsByType`; align option values with `DossierRelationshipType`.

---

## Summary Table

| #   | Severity | Area               | Issue                                                            |
| --- | -------- | ------------------ | ---------------------------------------------------------------- |
| 1   | CRITICAL | Routing            | `/relationships/graph` redirects; mini-graph CTA broken          |
| 2   | CRITICAL | Add dialog         | Wrong payload + invalid types to `dossiers-relationships-create` |
| 3   | CRITICAL | Hooks              | Duplicate `useCreateRelationship` export; broken hook wins       |
| 4   | HIGH     | Graph RPC          | Outgoing-only traversal vs bidirectional sidebar                 |
| 5   | HIGH     | Full-screen filter | `partner` ≠ `partnership` → empty graph                          |
| 6   | HIGH     | Sidebar            | Fetch errors shown as empty state                                |
| 7   | HIGH     | Sidebar            | Rows with empty `id` still linkable                              |
| 8   | MEDIUM   | i18n               | Toast keys `relationship.create.*` missing                       |
| 9   | MEDIUM   | i18n / RTL         | English tier labels, types, Cancel/Remove in sidebar             |
| 10  | MEDIUM   | i18n               | `graph.fetchError` key missing                                   |
| 11  | MEDIUM   | Edge fn            | Wrong RPC params for circular hierarchy check                    |
| 12  | LOW      | Mini graph         | Edge arrow direction vs center node                              |
| 13  | LOW      | Dead code          | Orphan graph page + non-functional filter                        |

---

## Verified Non-Issues (within scope)

- **Sidebar quick-add** (`related_to`, `source`/`target` ids) matches `dossier-relationships` POST validation.
- **`dossier-relationships` GET embed** uses valid syntax `source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status)` aligned with DB columns.
- **`dossier-shell` and `graph` namespaces** for sidebar/modal chrome are registered in `i18n/index.ts` with Arabic parity for graph modal controls.
- **`MiniRelationshipGraph` / `AdvancedGraphVisualization`** wrap React Flow in `LtrIsolate` and use logical `start`/`end`/`ms`/`me` for overlays; no `ml`/`mr` violations found on the live shell path.
- **Self-link prevention** is enforced in `dossier-relationships` POST (lines 367–374) and DB `no_self_reference`.

---

## Suggested Fix Order

1. Unblock navigation: restore `/relationships/graph` or point mini-graph CTA at `FullScreenGraphModal`.
2. Unify create path: single `useCreateRelationship` → `dossier-relationships` with canonical types; fix `AddToDossierDialogs`.
3. Switch graph traversal to bidirectional RPC; fix `partnership` filter value.
4. Sidebar error handling + missing-embed guard; i18n for tiers, types, toasts, and dialog buttons.
