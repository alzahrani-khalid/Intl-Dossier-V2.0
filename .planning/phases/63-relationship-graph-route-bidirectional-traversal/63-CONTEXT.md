# Phase 63: Relationship Graph Route & Bidirectional Traversal - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

A user on any dossier detail page clicks the mini-graph's "View Full Graph" button and lands on a working `/relationships/graph` page that renders the relationship graph for that dossier, shows relationships from BOTH directions (incoming + outgoing), and navigates to the correct per-type dossier route when either endpoint node is clicked. Covers: un-mounting the redirect (GRAPH-01), making the traversal RPC bidirectional (GRAPH-02), and per-type node navigation verified live (GRAPH-03). The "retire the page" alternative in the roadmap is REJECTED — the decision is to mount. Does NOT cover: new graph features, new entry points beyond the mini-graph button, graph editing, or the `graph-traversal-advanced` feature set.

</domain>

<decisions>
## Implementation Decisions

### Route fate (GRAPH-01 — decision recorded)

- **D-01:** **Mount, don't retire.** `routes/_protected/relationships/graph.tsx` stops redirecting to `/dossiers` and renders the existing `RelationshipGraphPage` (435 lines, already functional: edge-function fetch, degree/type controls, R17-02 node-click fix already applied). The roadmap's "formally retire" branch is closed.
- **D-02:** **No-dossier state is an actionable alert.** Landing on `/relationships/graph` without a `dossierId` search param keeps the honest "No dossier selected" alert but adds a button/link to `/dossiers` so it's not a dead end. No inline dossier picker — the contract is that the graph is reached FROM a dossier.

### Bidirectional traversal (GRAPH-02)

- **D-03:** **Fix `traverse_relationship_graph` in place.** Redefine the RPC itself (CREATE OR REPLACE) to walk both directions — anchor and recursion on `source_dossier_id = current` AND `target_dossier_id = current` — mirroring the logic already written in `traverse_relationship_graph_bidirectional` (migration `20260111200001_enhanced_graph_traversal.sql`). Every caller (the `graph-traversal` edge function and any other consumer) gets the fix with no client changes. Researcher must verify what is actually live on staging: whether the bidirectional migration is applied, which RPC version is deployed, and whether the `graph-traversal` edge function is deployed at all.
- **D-04:** **Directional arrows on edges.** Each edge renders its true source→target direction (e.g., "Saudi Arabia —member_of→ G20"). An incoming reference reads as an arrow pointing at the focused dossier. No undirected lines — who-references-whom is the point of this phase.
- **D-05:** **Keep existing controls as-is.** Degrees-of-separation selector stays with default 2; relationship-type filter stays. Verify they behave correctly with bidirectional data (node counts can grow at 2+ degrees — verify rendering holds with real staging volumes).

### Page design conformance (UI hint: yes)

- **D-06:** **DoD conformance pass, no layout redesign.** Run the page through the UI Definition-of-Done checklist: all colors via tokens (no raw hex / Tailwind color literals), borders `1px solid var(--line)`, no card shadows, logical properties (`ms-*`/`ps-*`/`text-start`), sentence-case copy with no marketing voice, verified at 1024px and 1400px. Fix violations found; do not rebuild the layout against the prototype.
- **D-07:** **Full RTL/Arabic verification.** Page chrome flips correctly with `dir="rtl"` (Tajawal applies, logical properties throughout); node labels render Arabic names (`name_ar`) in Arabic mode; controls, legend, and alerts read correctly in AR. The `graph` i18n namespace is already registered (quick 260605-u2z) — verify its AR strings actually cover this page's keys.

### Entry points & verification (GRAPH-01/03)

- **D-08:** **Mini-graph button is the sole entry point.** `MiniRelationshipGraph`'s existing "View Full Graph" button (already passes `?dossierId=`) becomes the contract entry point. No DossierShell action, no sidebar nav item — zero new UI surfaces.
- **D-09:** **Live verification covers every dossier type present in the graph.** On staging, seed/use relationships so the rendered graph contains nodes of every reachable dossier type, click each node type, and confirm the correct per-type route (`/dossiers/<segment>/$id`) loads. Matches the Phase 62 all-types verification precedent.

### Claude's Discretion

- Exact mechanics of the in-place RPC redefinition (new migration vs. consolidating with the `_bidirectional` variant; whether the `_bidirectional` function is then redundant and removable).
- Edge deduplication when both traversal directions surface the same row.
- Cleanup/disposition of the two unrouted duplicate components (`components/relationships/RelationshipGraph.tsx`, `components/dossiers/RelationshipGraph.tsx`) — assess whether either is dead code; don't delete pre-existing dead code beyond what this phase's changes orphan unless clearly safe.
- Empty-graph state (dossier with zero relationships) presentation, loading/error states, and arrow styling details.
- TanStack Router search-param validation (`validateSearch`) for `dossierId`.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase source & requirements

- `.planning/dossier-workflow-backlog-phases-2026-06-11.md` §Phase P2 — originating backlog item (R6/R7): evidence, scope, acceptance, touched files
- `.planning/REQUIREMENTS.md` §Relationship Graph — GRAPH-01, GRAPH-02, GRAPH-03 exact wording
- `reports/` round-2 relationships escalation #1/#4 + round-17 R17-02 note (`reports/dossier-workflows-round*-inspection-*.md`) — evidence trail for the dormant route and node-click history

### Code under change

- `frontend/src/routes/_protected/relationships/graph.tsx` — the 6-line redirect route to replace with a real mount
- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` — the 435-line page: edge-function fetch (`graph-traversal`), degree/type controls, `getDossierDetailPath` node-click (R17-02 fix at ~L156-164), no-dossier alert at ~L170
- `supabase/functions/graph-traversal/index.ts` — edge function calling RPC `traverse_relationship_graph` (~L101); transforms rows into nodes/edges
- `supabase/migrations/20251022000008_create_graph_functions.sql` — current outgoing-only `traverse_relationship_graph` (anchor `WHERE dr.source_dossier_id = start_dossier_id`)
- `supabase/migrations/20260111200001_enhanced_graph_traversal.sql` — already-written bidirectional logic (`traverse_relationship_graph_bidirectional`) to mirror in the in-place fix
- `frontend/src/components/dossier/MiniRelationshipGraph.tsx` — the already-correct helper: "View Full Graph" button (~L722-728), per-type navigation via `getDossierDetailPath`, bidirectional data via `getRelationshipsForDossier`

### Design conformance

- `frontend/design-system/inteldossier_handoff_design/README.md` + `colors_and_type.css` — token names, voice rules for the DoD pass
- `CLAUDE.md` §Definition of Done — UI checklist — the conformance checklist D-06 executes against

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `RelationshipGraphPage` is substantially complete — this phase is wiring + data fix + conformance, not a page build.
- `traverse_relationship_graph_bidirectional` in migrations is the reference implementation for the in-place RPC fix (D-03).
- `getDossierDetailPath` / `getDossierRouteSegment` already resolve per-type routes; both the page and the mini-graph use them.
- `getRelationshipsForDossier` (`frontend/src/services/relationship-api.ts` ~L348) is documented bidirectional — the mini-graph's data path needs no change.

### Established Patterns

- Edge functions deploy via Supabase CLI/MCP to staging `zkrcjzdemdmwhearhfgg`; migrations apply via Supabase MCP.
- Edge auth pattern: `@2` + `getUser(token)` (bare `getUser()` 401s — project memory). Verify `graph-traversal` follows it when touching/redeploying.
- i18n is static-bundled in `src/i18n/index.ts`; the `graph` namespace was registered in quick 260605-u2z (Group A orphan). Dot-vs-colon namespace separator trap applies if keys move.
- Token-mapped shadcn-style primitives (`PageHeader`, `Card`, `Select`, `Alert`) are on-brand; conformance issues are more likely in page-level classes (raw colors, physical margins, shadows).
- Dates/copy follow Bureau voice rules; no emoji, sentence case.

### Integration Points

- Entry: `MiniRelationshipGraph` "View Full Graph" button → `/relationships/graph?dossierId=<id>` (today dead-ends in the redirect — mounting the route completes the loop).
- Data: page → `graph-traversal` edge function → `traverse_relationship_graph` RPC → `dossier_relationships` table.
- Verification target: staging, live, all dossier types present in the graph (D-09).

</code_context>

<specifics>
## Specific Ideas

- An incoming reference should read naturally as an arrow pointing AT the focused dossier — direction display is the headline user-visible change of GRAPH-02 (D-04).
- The no-dossier state must not be a dead end: alert + a way back to `/dossiers` (D-02).

</specifics>

<deferred>
## Deferred Ideas

- **Inline dossier picker on the graph page** — would make `/relationships/graph` a standalone destination; rejected for this phase (D-02), could pair with a future sidebar-nav entry.
- **Additional entry points (DossierShell header action, sidebar navigation)** — explicitly out of scope (D-08); revisit if the graph proves popular.
- **Full Bureau re-skin of the graph page** — D-06 limits this phase to a conformance pass; a prototype-faithful rebuild is a future design task.
- **`graph-traversal-advanced` feature set** (shortest path, all paths, connected components) — separate edge function, untouched by this phase.

</deferred>

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Context gathered: 2026-06-11_
