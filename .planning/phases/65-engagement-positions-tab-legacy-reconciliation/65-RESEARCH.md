# Phase 65: Engagement Positions Tab & Legacy Reconciliation - Research

**Researched:** 2026-06-12
**Domain:** TanStack Router workspace tabs, position_dossier_links canonical data plane, legacy-table reconciliation, inert-CTA wiring
**Confidence:** HIGH (all claims verified against the live codebase this session, or against the orchestrator's 2026-06-12 staging MCP facts; remaining live-DB unknowns are listed as Open Questions with diagnostic SQL)

> No CONTEXT.md exists for this phase yet — there are no locked user decisions. The ENGPOS-01 canonical-source decision below is a research recommendation the planner/discuss step should ratify.

## Summary

The engagement workspace (`/_protected/engagements/$engagementId` → `WorkspaceShell` → `WorkspaceTabNav` → routed lazy tabs) has no Positions tab. Everything needed to add one already exists and is live-verified from Phase 64: `engagementId` IS a `dossiers.id`, so the countries positions route (`dossiers/countries/$id/positions.tsx`) is a whole-file analog that lazy-loads `DossierPositionsTab` over `position_dossier_links`. The canonical-source decision (ENGPOS-01) is one-sided: legacy `engagement_positions` has 0 rows, write-deny RLS (SELECT-only policy), exists in **no migration file** (ad-hoc staging table; it appears only in 5 edge functions and generated types), and its `engagements-positions-*` edges validate against the legacy `engagements` table so they 404 for canonical workspace ids. `position_dossier_links` has data, a full clearance-gated policy set (migration 20260610000002), and the entire shipped UI stack.

The hard part of this phase is ENGPOS-03 (nine inert CTAs), because two of the re-enable candidates have a **render-surface mismatch**, not just a missing onClick: TasksTab's kanban reads the `assignments` table via `engagements-kanban-get`, which validates against legacy `engagements` (likely 404 → permanent empty board for canonical engagements) and would never display a task created through the canonical `tasks-create` + `work_item_dossiers` path; CalendarTab renders only _derived_ engagement dates (start/end/lifecycle) and fetches no `calendar_entries`, so an event created via the working EventDialog would persist but never render in-tab. Wiring those CTAs honestly requires either a small in-tab reader addition (calendar) / an explicit recorded caveat (tasks), or removal. Four CTAs (Transition Stage ×2, Link Dossier ×2) and the Docs Upload CTA should be removed outright — they duplicate a working surface or have no backend.

**Primary recommendation:** Canonical = `position_dossier_links` keyed by the engagement's `dossiers.id`. Copy the countries positions route into the workspace route tree, add one `WORKSPACE_TABS` entry + bilingual `tabs.positions` keys, reuse `DossierPositionsTab` with `dossierId={engagementId}`, wire Create Task (TaskDialog) and Add Event (EventDialog + a small `calendar_entries` in-tab reader), remove the six CTAs that cannot be honestly wired, and delete the three-file legacy frontend stack.

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                    | Research Support                                                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENGPOS-01 | Routed Positions tab on canonical tables (decision: `position_dossier_links` vs legacy `engagement_positions`) | Decision record (§Canonical Source Decision); route mounting contract (§Tab Mounting); legacy-table evidence (§State of the Art, Open Q4)                                                            |
| ENGPOS-02 | Attach a position to an engagement → persists, renders, invalidates                                            | `DossierPositionsTab` ships the live-verified R12-06 `onAttach` handler for free; RLS verified table-agnostic (§Architecture Patterns: Attach Path); live-verify protocol (§Validation Architecture) |
| ENGPOS-03 | Round-15-disabled CTAs re-enabled or removed — no inert buttons                                                | Full 9-CTA disposition matrix with wiring contracts and render-surface caveats (§CTA Disposition Matrix); legacy deletion risk map (§Legacy Reconciliation)                                          |

</phase_requirements>

## Architectural Responsibility Map

| Capability                      | Primary Tier                                                            | Secondary Tier                                                      | Rationale                                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Positions tab route + nav entry | Frontend (TanStack Router file routes + `WorkspaceTabNav`)              | —                                                                   | URL-driven tabs are the workspace standard; route file is the only mount point                                                             |
| Position-link reads             | Database (direct PostgREST + RLS)                                       | Frontend hook `useDossierPositionLinks`                             | The reader queries `position_dossier_links` directly via the supabase client (NOT an edge fn) — RLS SELECT policy is the enforcement point |
| Position-link writes            | API (edge `positions-dossiers-create`)                                  | Database RLS (clearance INSERT policy)                              | Phase 64 live-verified write path                                                                                                          |
| Task creation                   | API (edge `tasks-create`) + API (edge `work-item-dossiers` for linking) | Frontend `TaskDialog`                                               | Dialog orchestrates two writes; tasks data lives outside the kanban's `assignments` plane (see Pitfall 2)                                  |
| Event creation                  | API (edge `calendar-create` v11 → `calendar_entries.dossier_id`)        | Frontend `EventDialog`                                              | `linked_item_type='dossier'` maps to the `dossier_id` column at the edge                                                                   |
| Legacy reconciliation           | Frontend (delete 3 dead files) + Edge deprecation note                  | Database: **no migration needed** (0 rows, table not in migrations) | Nothing to migrate; undeploying edges is a Supabase CLI action, not code                                                                   |

## Standard Stack

**No new libraries.** Everything in this phase is existing-stack reuse:

### Core (already installed, already live-verified)

| Library/Surface                                                      | Version      | Purpose                                          | Why Standard                                                                                     |
| -------------------------------------------------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| @tanstack/react-router (file routes + `TanStackRouterVite` plugin)   | v5 (in repo) | New `positions.tsx` route under `$engagementId/` | All workspace tabs are routed files; plugin regenerates `routeTree.gen.ts` on dev/build          |
| @tanstack/react-query                                                | v5 (in repo) | Query invalidation contracts                     | Existing keys: `['dossier-position-links', id]`, `engagementKeys.*`, `['engagement-kanban', id]` |
| `DossierPositionsTab` + `AttachPositionDialog` + `NewPositionDialog` | Phase 64     | The entire ENGPOS-02 surface                     | Live-verified on staging 2026-06-12 (64-06 SUMMARY)                                              |
| `AddToDossierDialogs` (TaskDialog / EventDialog)                     | existing     | CTA wiring (ENGPOS-03)                           | Live dossier-page precedent; `DossierShell.tsx` L286-293 is the mounting analog                  |
| Vitest + @testing-library/react                                      | existing     | Unit tests                                       | `NewPositionDialog.test.tsx` is the test-pattern analog                                          |

### Alternatives Considered

| Instead of                                             | Could Use                                         | Tradeoff                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Reusing `DossierPositionsTab`                          | New `EngagementPositionsTab` component            | Pure duplication; the tab is already dossier-id-generic. Don't.                                           |
| `position_dossier_links`                               | Legacy `engagement_positions`                     | See Canonical Source Decision — legacy is unviable (deny-all writes, no migration provenance, dead edges) |
| Mounting `AddToDossierDialogs` (all 8 dialogs) per tab | Exporting `TaskDialog`/`EventDialog` individually | See CTA wiring contract — both are viable; individual exports are lighter                                 |

**Installation:** none.

## Package Legitimacy Audit

**No external packages are installed by this phase.** All work is in-repo reuse of already-installed dependencies. Audit table: empty by construction.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         /engagements/$engagementId  (layout route → WorkspaceShell)
                                      │
              ┌───────────────────────┼─────────────────────────────┐
              ▼                       ▼                             ▼
     WorkspaceTabNav          existing tab routes          NEW: …/positions.tsx
   (WORKSPACE_TABS entry)    (overview/context/tasks/      (lazy → DossierPositionsTab
              │               calendar/docs/audit)          dossierId = engagementId)
              │                                                     │
              │                          ┌──────────────────────────┼──────────────────────┐
              │                          ▼                          ▼                      ▼
              │              useDossierPositionLinks       AttachPositionDialog    NewPositionDialog
              │              (direct PostgREST SELECT      onAttach → repo →       (positions-create →
              │               position_dossier_links       positions-dossiers-      positions-dossiers-
              │               + RLS clearance gate)        create edge              create, applies_to)
              │                          │                          │                      │
              ▼                          ▼                          ▼                      ▼
   i18n workspace.json        ┌─────────────────────────────────────────────────────────────┐
   tabs.positions (en+ar)     │   position_dossier_links  (dossier_id = engagementId)       │
                              │   CANONICAL — full RLS policy set (20260610000002)          │
                              └─────────────────────────────────────────────────────────────┘
                                              ▲
        ███ LEGACY (delete/deprecate) ███     │ never touched by legacy stack
   useEngagementPositions → EngagementPositionsSection → EngagementDossierDetail (unrouted)
   engagements-positions-{attach,list,detach} edges → engagement_positions (0 rows, deny-all writes)
```

CTA wiring data flow (ENGPOS-03 re-enables):

```
OverviewTab / TasksTab "Create Task" ──► TaskDialog ──► tasks-create edge ──► tasks row
                                              │
                                              └──► useCreateWorkItemDossierLinks ──► work-item-dossiers edge
                                                        ──► work_item_dossiers (dossier_id = engagementId)
                                              ⚠ NOT visible on TasksTab kanban (reads `assignments` plane — Pitfall 2)

CalendarTab "Add Event" ──► EventDialog ──► calendar-create v11 ──► calendar_entries.dossier_id = engagementId
                                              ⚠ visible in-tab ONLY if CalendarTab gains a calendar_entries reader (Pitfall 3)
```

### Canonical Source Decision (ENGPOS-01) — `position_dossier_links`

**Recommendation: `position_dossier_links`, keyed by `dossier_id = engagementId`. Confidence: HIGH.**

Evidence (each item independently sufficient):

1. **Identity:** `engagementId` IS a `dossiers.id` — the `engagement-dossiers` edge writes `dossiers` with `type: 'engagement'` (verified at `supabase/functions/engagement-dossiers/index.ts` L445, L1175) plus the `engagement_dossiers` extension (PK `id REFERENCES dossiers(id)`, migration 20260110000006). `[VERIFIED: codebase]`
2. **Legacy table is inert:** `engagement_positions` has 0 rows and ONLY a SELECT policy (`engagement_positions_authenticated_read`) — INSERT/UPDATE/DELETE deny-all. (Orchestrator staging MCP, 2026-06-12 — ground truth.) `[VERIFIED: staging MCP]`
3. **Legacy table has no migration provenance:** `grep -rln engagement_positions supabase/migrations/` returns nothing — the table exists only on staging (ad-hoc), referenced by 5 edge functions and `backend/src/types/database.types.ts`. Choosing it would require authoring its DDL + policies from scratch. Same drift class as the ad-hoc persons RLS policies (project memory). `[VERIFIED: codebase grep]`
4. **Legacy edges reject canonical ids:** `engagements-positions-attach` validates `from('engagements')` (L64-68 verified this session) — canonical workspace ids 404. Zero frontend callers for all three `engagements-positions-*` edges. `[VERIFIED: codebase]`
5. **Canonical table is alive:** `position_dossier_links` has 2 rows on staging, full clearance-gated INSERT/SELECT + author-or-clearance-≥3 DELETE policies (migration `20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql`, read in full this session — policies are **dossier-type-agnostic**, gated only on `dossiers.sensitivity_level` vs `profiles.clearance_level`). Phase 64 live-verified create + attach + render on staging. `[VERIFIED: codebase + staging MCP + 64-06 SUMMARY]`
6. **Read-model coherence:** `dossier-overview.service.ts` and the dossier Positions tabs already read `position_dossier_links`. Writing engagement attaches anywhere else re-splits the read model the milestone is trying to unify.

**What "decision recorded" should look like** (success criterion 1 says "decision recorded and implemented"):

- A `key-decisions` entry in the plan frontmatter, e.g. `'ENGPOS-01: canonical source = position_dossier_links keyed by engagement dossiers.id; engagement_positions + engagements-positions-* edges declared legacy/deprecated'`.
- A file-header comment in the new route file (the next reader's first touchpoint): `// ENGPOS-01 decision: positions for an engagement are position_dossier_links rows with dossier_id = engagementId (engagementId IS a dossiers.id). The legacy engagement_positions table is deprecated — never read or write it.`
- The phase SUMMARY repeating the decision + the deprecation disposition for the three edges (undeploy now via Supabase CLI vs leave deployed-but-documented — planner choice; undeploy is safe given zero callers, but it is an environment action, so if taken it must be its own task with explicit verification).
- REQUIREMENTS.md ENGPOS-01 checkbox flip at phase close (traceability hygiene).

### Tab Mounting (ENGPOS-01 mechanics)

**Where tabs come from:** `WorkspaceTabNav.tsx` builds links from the module-const `WORKSPACE_TABS` (L26-33: overview, context, tasks, calendar, docs, audit) and renders `<Link to={'/engagements/$engagementId/' + tab.path}>` with `matchRoute(..., fuzzy: true)` for active state. Adding a tab = one array entry + one route file + two i18n keys. There is **no per-tab registry elsewhere** — `WorkspaceShell` renders `WorkspaceTabNav` unconditionally except on the after-action child route.

**Route tree:** engagement routes live under `frontend/src/routes/_protected/engagements/` — a **different path tree** from dossier type routes (`/_protected/dossiers/<type>/$id/...`). The layout is `$engagementId.tsx` (renders `WorkspaceShell` + `Outlet`); children live in the `$engagementId/` directory (`overview.tsx`, `context.tsx`, `tasks.tsx`, `calendar.tsx`, `docs.tsx`, `audit.tsx`, `after-action.tsx`, `index.tsx` which redirects to overview). New file: `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` with route id `'/_protected/engagements/$engagementId/positions'` and param `engagementId`.

**Route-tree regeneration:** the `TanStackRouterVite` plugin (`vite.config.ts` L32-37, `generatedRouteTree: './src/routeTree.gen.ts'`, `autoCodeSplitting: true`, test files ignored) regenerates `src/routeTree.gen.ts` (git-tracked, 221 KB) when `vite dev` or `vite build` runs. The pre-commit hook runs `pnpm build`, so the regenerated tree lands in the same commit **only if the executor stages it** — type-checking (`pnpm type-check`) against a stale tree fails with "route not found" on the new `to=` path. Sequence for the executor: create route file → run `pnpm build` (or have dev server running) → commit route file **and** `routeTree.gen.ts` together.

**Sibling-shape choice (planner decision, both proven):** (a) countries precedent — render `DossierPositionsTab` directly in the route file via `lazy()` + `Suspense` + `TabSkeleton` (minimal, exact analog at `dossiers/countries/$id/positions.tsx`); or (b) workspace convention — thin default-export page in `pages/engagements/workspace/PositionsTab.tsx` using `useParams({ from: '/_protected/engagements/$engagementId' })` + `dir={direction}` wrapper, lazy-loaded from the route file like `overview.tsx` does. Recommendation: (b) is more consistent with the six siblings and gives a place for the `dir` wrapper, but (a) is fine — `DossierPositionsTab` handles its own layout/RTL.

**i18n:** add `tabs.positions` to BOTH `src/i18n/en/workspace.json` ("Positions") and `src/i18n/ar/workspace.json` ("المواقف") — verified both files currently have identical `tabs` key sets without `positions`; a missing AR key silently falls back to English (project memory: static bundle, no http-backend). The tab body uses the `positions` namespace (`positions:dossier_tab.*`) — verified fully bilingual in both files (15 `dossier_tab` keys + all `attach.*` keys present in en and ar). Colon-form keys only.

### Attach Path (ENGPOS-02) — ships with the component

`DossierPositionsTab` (read in full this session) already contains the live-verified attach handler (L230-269): `Promise.allSettled` over `createPositionDossierLink(positionId, { dossier_id: dossierId })` → prefix invalidation of `['dossier-position-links', dossierId]` → honest partial-failure toast. Reuse with `dossierId={engagementId}` and ENGPOS-02's persist/render/invalidate criteria are satisfied by construction; only live verification remains.

Key facts verified this session:

- `useDossierPositionLinks` reads `position_dossier_links` via **direct PostgREST** (`supabase.from('position_dossier_links')`, hook L121-135) — so the RLS SELECT policy is the only gate, and it is dossier-type-agnostic (clearance vs `sensitivity_level`). Works for engagement dossiers if the test user's clearance covers the engagement dossier's sensitivity (Open Q3).
- `positions-dossiers-create` edge takes `dossier_id` + optional `link_type` (defaults `'related_to'`, L88). Phase 64's D-09 set `applies_to` for the create-new flow only; attach-existing intentionally stays default. Carry that posture unless discuss-phase overrides.
- `AttachPositionDialog`'s `engagementId`/`dossierId` props are vestigial (destructured out, never used — verified L43-48); persistence is 100% the caller's `onAttach`. It lists **published positions only** (`usePositions({ status: 'published' })`, L64-65) — live verification needs ≥1 published position on staging (Open Q2).
- `useDossier(engagementId)` → `dossiers-get` edge → base `dossiers` row works for engagement-type dossiers: the edge's extension map points `engagement` at the legacy `engagements` table but uses `.maybeSingle()` and silently skips a missing extension (verified L180-204) — the tab only needs `id/type/name_en/name_ar` from the base row. `dossiers.type` is `'engagement'` (a valid member of both `DossierType` unions), so the `DossierContextForAction` built at tab L60-68 is type-correct.

### CTA Disposition Matrix (ENGPOS-03)

`DossierContextForAction` (defined `src/hooks/useAddToDossierActions.tsx` L35-41) requires exactly: `dossier_id: string`, `dossier_type: DossierType` (includes `'engagement'`), `dossier_name_en: string`, `dossier_name_ar: string | null`, `inheritance_source: InheritanceSource`. Use `inheritance_source: 'direct'` — the workspace IS the engagement dossier's own page; the `'engagement'` member of `InheritanceSource` means "inherited from engagement → _another_ dossier", which is not this case. Build it from `useEngagement(engagementId)` (already cached by `WorkspaceShell`) — `profile.engagement.name_en/name_ar` exist on `EngagementDossier` (types L263+) — with `dossier_type: 'engagement'` hard-coded (do NOT use `profile.engagement.type`, whose TS literal is the stale `'engagement_dossier'` while the DB stores `'engagement'`).

| #   | File / CTA                                                                                     | Disposition                                                                                                            | Wiring contract / Rationale                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `WorkspaceShell.tsx` L92-99 "Transition Stage" (no onClick even when enabled)                  | **REMOVE**                                                                                                             | `LifecycleStepperBar` renders directly below the header (L120-124) and self-handles transitions via `useLifecycleTransition`. The button duplicates a working surface.                                           |
| 2   | `OverviewTab.tsx` L335-337 "Transition Stage" (disabled)                                       | **REMOVE**                                                                                                             | Same — the stepper is always visible above the tab content.                                                                                                                                                      |
| 3   | `OverviewTab.tsx` L343-346 "Create Task" (disabled)                                            | **RE-ENABLE** via TaskDialog                                                                                           | See wiring contract below.                                                                                                                                                                                       |
| 4   | `TasksTab.tsx` L131-134 empty-state "Create Task" (disabled)                                   | **RE-ENABLE** via TaskDialog, **with recorded caveat**                                                                 | New task will not render on the kanban (Pitfall 2). Empty-state copy should remain honest.                                                                                                                       |
| 5   | `TasksTab.tsx` L181-184 header "Create Task" (disabled)                                        | Same as #4                                                                                                             |                                                                                                                                                                                                                  |
| 6   | `CalendarTab.tsx` L168-171 empty-state "Add Event" (disabled)                                  | **RE-ENABLE** via EventDialog **only together with** an in-tab `calendar_entries` reader (Pitfall 3); otherwise REMOVE | Without the reader the created event never renders in-tab — the R15-02 bug class in a new costume.                                                                                                               |
| 7   | `CalendarTab.tsx` L198-201 header "Add Event" (disabled; TODO notes missing engagement filter) | Same as #6                                                                                                             | The TODO at L242-244 documents the historic blocker; `calendar-create` v11 + `calendar_entries.dossier_id` has since removed it (see reader contract).                                                           |
| 8   | `ContextTab.tsx` L196-199 + L224-227 "Link Dossier" (disabled, ×2)                             | **REMOVE** (both)                                                                                                      | Linked dossiers are _derived_ read-only data (host country/org + participant `dossier_info`, L100-143) — no writable link table or edit surface exists. Re-enabling needs net-new backend design — out of scope. |
| 9   | `DocsTab.tsx` L152-155 "Upload" (disabled)                                                     | **REMOVE**                                                                                                             | Attachment upload is a known backend P0 gap (`.planning/todos`, "honest not fixed" precedent from PR #35). Generate Briefing beside it is real and stays.                                                        |

**Create Task wiring contract (CTAs 3-5).** Two mounting options, both type-safe:

- **Option A (recommended — surgical):** add `export` to the module-private `TaskDialog` (and `EventDialog`) in `AddToDossierDialogs.tsx` — no signature change (`ActionDialogProps` stays). Each tab mounts only the dialog it needs with local `useState` open-state. The `dossier: Dossier` prop is ignored by both dialogs (`dossier: _dossier`) — pass the `useDossier(engagementId).data` row with the established cast precedent.
- **Option B (DossierShell mirror):** mount the whole `AddToDossierDialogs` + `useAddToDossierActions({ dossier })` once (per tab, or in `WorkspaceShell` with a small context to expose `openDialog`). Precedent: `DossierShell.tsx` L286-293 including the `dossier as Parameters<typeof AddToDossierDialogs>[0]['dossier']` cast. Heavier (mounts all 8 dialogs) and needs context plumbing if shell-mounted.

TaskDialog submit already does the right writes (L345-372): `useCreateTask` → `tasks-create` edge, then `useCreateWorkItemDossierLinks` with `buildDossierLinkPayload('task', id, ctx)` → `work_item_dossiers`, then invalidates `['dossier-tab','work_items', dossier_id]` + `workItemDossierKeys.timeline(dossier_id)`. Additions for the workspace: also invalidate `['engagement-kanban', engagementId]` (harmless if the board can't render it; correct if it ever can). **Never pass `engagement_id` in the `CreateTaskRequest`** — `tasks.engagement_id` FKs the LEGACY `engagements(id)` (migrations 20251019182300/20251019183000), so passing the canonical dossiers.id risks an FK violation (Pitfall 4). Known wart to accept, not fix: `useCreateTask` toasts internally (`useToast`) AND TaskDialog toasts (`sonner`) — pre-existing on dossier pages; do not add a third (Pitfall 6).

**Add Event wiring contract (CTAs 6-7).** EventDialog submit (L653-689) posts `{ entry_type, title_en, title_ar:'', start_datetime, linked_item_type:'dossier', linked_item_id: dossier_id }` to `calendar-create`. Verified at the edge (v11): `'dossier'` is not in `ALLOWED_LINKED_TYPES`, so the id lands in **`calendar_entries.dossier_id`** (edge L99-118). The in-tab reader is therefore: query `calendar_entries` where `dossier_id = engagementId` (direct PostgREST is fine — the SELECT RLS policy from quick 260604-lmy covers owner/attendee + dossier clearance), key it `['engagement-calendar-entries', engagementId]`, map rows into CalendarTab's existing `CalendarEvent` shape and merge into the existing Today/Upcoming/Past grouping. After create: invalidate that key (EventDialog only invalidates `['calendar-events']` + dossier-tab keys). This is a contained addition (~1 query hook + merge), and it converts CalendarTab from a placeholder into a real surface; if the planner judges it out of budget, the honest fallback is removing both Add Event buttons.

### Legacy Reconciliation — deletion risk map

Import graph re-verified this session (grep, excluding tests):

| Artifact                                                               | Importers found                                 | Action                                                                  | Risk                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/dossier/EngagementDossierDetail.tsx`                       | none                                            | DELETE                                                                  | None — unrouted dead code                                                                                                                                                               |
| `components/positions/EngagementPositionsSection.tsx`                  | only `EngagementDossierDetail`                  | DELETE                                                                  | None after the above                                                                                                                                                                    |
| `hooks/useEngagementPositions.ts`                                      | only `EngagementPositionsSection`               | DELETE                                                                  | None after the above; removes the `['engagement-positions', …]` key family                                                                                                              |
| `components/positions/PositionSuggestionsPanel.tsx`                    | only `EngagementPositionsSection`               | Becomes dead — planner decides delete vs keep                           | Its repository call `getPositionSuggestions` targets `/engagements/${id}/positions/suggestions` — an express-style path with no deployed flat edge; **do not** port it into the new tab |
| `components/positions/BriefingPackGenerator.tsx`                       | only `EngagementPositionsSection`               | Becomes dead — planner decides delete vs keep                           | Sits on the legacy id space                                                                                                                                                             |
| `pages/engagements/EngagementDetailPage.tsx`                           | unrouted (only `EngagementsListPage` is routed) | OUT OF SCOPE — mention, don't delete                                    | Karpathy surgical-changes rule; it is not touched by this phase's chain                                                                                                                 |
| `supabase/functions/engagements-positions-{attach,list,detach}`        | zero frontend callers                           | Mark deprecated in plan; undeploy = explicit Supabase CLI task or defer | Edge undeploy is an environment mutation — if deferred, record in SUMMARY                                                                                                               |
| i18n `positions.json` `engagement_section.*` (en+ar, verified present) | only the deleted section                        | Optional sweep                                                          | Orphaned keys are harmless; sweeping is cleanliness only                                                                                                                                |

**Scope-fence as NOT-this-phase (record, do not fix):**

- `briefing-packs-generate` edge reads `engagement_positions` (L126, verified) — it will see zero canonical attaches if briefing packs are ever resurrected. Cross-surface hazard; recording it in the SUMMARY is the deliverable.
- `positions-list` edge dossier filter joins `engagement_positions` (L103-105, verified) — latent stale path. Safe today because `AttachPositionDialog` calls `usePositions({ status:'published' })` without a dossier filter. Do not start passing one.
- `engagements-kanban-get` + `tasks/assignments.engagement_id` FKs → legacy `engagements` — the whole tasks/kanban plane straddles legacy ids (Pitfall 2). Canonicalizing it is its own phase-sized slice.
- `dossiers-get` extension map points `engagement` → legacy `engagements` table (harmless `.maybeSingle()` miss) — same drift family, same fence.

## Don't Hand-Roll

| Problem                      | Don't Build                                             | Use Instead                                                 | Why                                                                                                 |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Engagement positions surface | A new EngagementPositionsTab                            | `DossierPositionsTab` with `dossierId={engagementId}`       | It is dossier-id-generic, live-verified, and carries the attach/invalidate/partial-failure handling |
| Attach persistence           | Custom mutation in the dialog                           | The caller-`onAttach` pattern + `createPositionDossierLink` | `AttachPositionDialog` is intentionally persistence-free; R12-06 precedent                          |
| Task/Event creation forms    | New workspace forms                                     | `TaskDialog` / `EventDialog` from `AddToDossierDialogs`     | Both are the live dossier-page write paths incl. R12-04 invalidation lessons                        |
| Route + tab plumbing         | Local-state tabs (like the dead `EngagementDetailPage`) | Routed file + `WORKSPACE_TABS` entry                        | URL-driven tabs are the workspace standard; local-state tabs are an anti-pattern here               |
| Legacy table "fixing"        | INSERT policies / migrations for `engagement_positions` | Nothing — deprecate                                         | The table has no migration provenance and zero data; fixing it would resurrect the wrong plane      |

**Key insight:** every requirement in this phase has a shipped, live-verified analog. Net-new logic is limited to: one route file, one nav entry, two i18n keys, CTA handlers, and (optionally) one small calendar reader.

## Runtime State Inventory

(This is a reconciliation/deletion phase — inventory required.)

| Category            | Items Found                                                                                                                                             | Action Required                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Stored data         | `engagement_positions`: 0 rows on staging (orchestrator MCP ground truth) → **no data migration**. `position_dossier_links`: 2 existing rows untouched. | None — code-side only                                                          |
| Live service config | `engagements-positions-{attach,list,detach}` edges are deployed on staging but have zero callers; their deploy state lives in Supabase, not git.        | Planner decision: explicit undeploy task (Supabase CLI) or documented deferral |
| OS-registered state | None — verified: no schedulers/processes reference the deleted components                                                                               | None                                                                           |
| Secrets/env vars    | None — no secret references the legacy stack (verified grep)                                                                                            | None                                                                           |
| Build artifacts     | `frontend/src/routeTree.gen.ts` (git-tracked, generated) — stale until `vite build`/`dev` runs after the new route file lands                           | Regenerate + commit with the route file (Pitfall 1)                            |

## Common Pitfalls

### Pitfall 1: Stale `routeTree.gen.ts` after adding the route file

**What goes wrong:** `pnpm type-check` fails on the new `Link to='/engagements/$engagementId/positions'` or the route file's `createFileRoute(...)` id because the generated tree doesn't know the route yet.
**Why:** the tree only regenerates when the Vite plugin runs (dev/build), not on file save in CI.
**How to avoid:** run `cd frontend && pnpm build` (pre-commit does this) and stage `src/routeTree.gen.ts` in the same commit as the route file.
**Warning signs:** TS2345 on `to=` literals; `matchRoute` never matching.

### Pitfall 2: TasksTab kanban cannot render TaskDialog-created tasks (data-plane mismatch)

**What goes wrong:** "Create Task" gets wired, the task persists (toast says success), but the board never shows a card — looks exactly like the R15-02 bug it replaced.
**Why:** the board reads the **`assignments`** table via `engagements-kanban-get`, which (a) validates `from('engagements')` — the LEGACY table — so canonical workspace ids likely 404 (the hook's error leaves `columns` undefined → TasksTab renders the _empty state_, masking the 404), and (b) `tasks-create` writes `tasks` + `work_item_dossiers`, never `assignments`. Verified in `supabase/functions/engagements-kanban-get/index.ts` L57-70 + L140-152 and `tasks-create` (only `profiles` + `tasks` touched).
**How to avoid:** wire the CTA for the real write (task + dossier link — visible in /tasks and dossier work-item surfaces), invalidate `['engagement-kanban', engagementId]` anyway, and **record the kanban canonicalization as an explicit out-of-scope follow-up** in the SUMMARY. Do NOT try to "fix" the kanban edge inside this phase (its FK plane is legacy too). If the planner prefers zero perceived gaps, the alternative disposition for CTAs 4-5 is removal, keeping only Overview's Create Task (#3) where no board sits next to the button.
**Warning signs:** Open Q1 diagnostic returning 0 overlapping ids confirms the board is dead for canonical engagements.

### Pitfall 3: CalendarTab renders derived dates only — created events vanish

**What goes wrong:** Add Event wired via EventDialog persists a `calendar_entries` row, but the tab still shows only Engagement Start/Deadline/lifecycle rows.
**Why:** CalendarTab builds its list purely from `engagement.start_date/end_date` + lifecycle history (verified L54-104); it fetches no calendar entries.
**How to avoid:** ship the `['engagement-calendar-entries', engagementId]` reader (filter `calendar_entries.dossier_id = engagementId`) in the same plan item as the CTA re-enable, and invalidate that key after create. Re-enabling without the reader is a fail of success criterion 3's spirit.

### Pitfall 4: `tasks.engagement_id` / `assignments.engagement_id` FK the LEGACY `engagements` table

**What goes wrong:** passing `engagement_id: engagementId` to `tasks-create` throws an FK violation (23503) for canonical ids.
**How to avoid:** omit `engagement_id` entirely; the engagement linkage is the `work_item_dossiers` row (`dossier_id = engagementId`). TaskDialog already does this correctly — don't "improve" it.

### Pitfall 5: `useDossier(engagementId)` is a real network fetch in the workspace

**What goes wrong:** assuming the WR-03 comment in `DossierPositionsTab` ("cache hit, zero extra network") holds here.
**Why:** the workspace shell caches `engagementKeys.detail(id)` (engagement-dossiers edge), not `dossierKeys.detail(id)` (dossiers-get edge) — different keys, different fetchers.
**How to avoid:** accept the extra fetch; the create button stays disabled until it resolves (WR-03 guard, tab L106-113). Do not fake the cache or pre-seed `dossierKeys.detail` with an engagement-profile-shaped object (shapes differ).

### Pitfall 6: Double/triple toasts on task create

**What goes wrong:** `useCreateTask` toasts internally (`useToast`) and TaskDialog toasts (`sonner`). Adding a third toast in workspace wiring makes it worse.
**How to avoid:** wire CTAs to open the dialog only; let the dialog own feedback. (CommitmentDialog L510-516 documents this trap class.)

### Pitfall 7: i18n — `tabs.positions` missing from `ar/workspace.json`

**What goes wrong:** tab label silently renders English in Arabic mode (static bundle, no http-backend — recurring project bug class).
**How to avoid:** add the key to BOTH files in the same edit; verify in the AR live pass. All other needed keys (`positions:dossier_tab.*`, `attach.*`) are verified present bilingual.

### Pitfall 8: Re-enabling a CTA without a real handler, or "fixing" legacy surfaces

**What goes wrong:** the R15-02 bug class itself; or someone "fixes" `engagements-positions-attach` / adds INSERT policies to `engagement_positions` and resurrects the wrong plane.
**How to avoid:** every re-enabled button must have a verified write path AND a render path (this is the test for "functional" in success criterion 3); the legacy table/edges are deprecation targets, full stop.

### Pitfall 9: Attach-existing dialog lists published positions only

**What goes wrong:** live verification of ENGPOS-02's attach flow shows an empty dialog because staging has no published positions (Phase 64 cleaned up its draft test rows).
**How to avoid:** Open Q2 diagnostic before the UAT; if 0, publish a seed position via service role (and clean up after, 64-06 protocol).

## Code Examples

All verified from in-repo sources this session.

### New route file (countries analog, adapted)

```tsx
// frontend/src/routes/_protected/engagements/$engagementId/positions.tsx
// ENGPOS-01 decision: canonical positions source = position_dossier_links with
// dossier_id = engagementId (engagementId IS a dossiers.id). Legacy
// engagement_positions is deprecated — never read or write it.
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierPositionsTab = lazy(() =>
  import('@/components/positions/DossierPositionsTab').then((m) => ({
    default: m.DossierPositionsTab,
  })),
)

export const Route = createFileRoute('/_protected/engagements/$engagementId/positions')({
  component: EngagementPositionsRoute,
})

function EngagementPositionsRoute(): ReactElement {
  const { engagementId } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierPositionsTab dossierId={engagementId} />
    </Suspense>
  )
}
```

### Nav entry (WorkspaceTabNav.tsx L26-33)

```typescript
const WORKSPACE_TABS: WorkspaceTab[] = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'context', labelKey: 'tabs.context', path: 'context' },
  { key: 'positions', labelKey: 'tabs.positions', path: 'positions' }, // NEW — after context keeps intel surfaces together
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'calendar', labelKey: 'tabs.calendar', path: 'calendar' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]
```

### Engagement-typed DossierContextForAction (from the already-cached profile)

```typescript
// Source: useAddToDossierActions.tsx L35-41 (type) + WorkspaceShell useEngagement precedent
const { data: profile } = useEngagement(engagementId) // cache hit — shell already loaded it
const engagement = profile?.engagement
const dossierContext: DossierContextForAction | null = engagement
  ? {
      dossier_id: engagementId,
      dossier_type: 'engagement', // hard-code: DB stores 'engagement'; the TS literal on the profile type is stale
      dossier_name_en: engagement.name_en,
      dossier_name_ar: engagement.name_ar ?? null,
      inheritance_source: 'direct', // the workspace IS this dossier's own page
    }
  : null
```

### CTA → dialog wiring (Option A, surgical)

```tsx
// AddToDossierDialogs.tsx: change `function TaskDialog(` → `export function TaskDialog(`
// (same for EventDialog). No signature change. Then in OverviewTab/TasksTab:
const [taskDialogOpen, setTaskDialogOpen] = useState(false)
const { data: dossier } = useDossier(engagementId) // dialogs ignore it, but the prop is required
// ...
<Button variant="outline" className="min-h-11 min-w-11"
  disabled={dossierContext === null}                 // WR-03 guard, not a dead disabled
  onClick={() => setTaskDialogOpen(true)}>
  <Plus className="size-4" />
  {t('actions.createTask')}
</Button>
{dossierContext !== null && dossier !== undefined && (
  <TaskDialog
    isOpen={taskDialogOpen}
    onClose={() => setTaskDialogOpen(false)}
    dossier={dossier as Parameters<typeof TaskDialog>[0]['dossier']} // cast precedent: DossierShell.tsx L289
    dossierContext={dossierContext}
    isRTL={isRTL}
  />
)}
```

### CalendarTab entries reader (if Add Event is re-enabled)

```typescript
// New hook keyed ['engagement-calendar-entries', engagementId].
// calendar-create v11 maps linked_item_type='dossier' → calendar_entries.dossier_id (edge L99-118),
// and the SELECT RLS policy (quick 260604-lmy) covers owner/attendee + dossier clearance.
const { data: entries } = useQuery({
  queryKey: ['engagement-calendar-entries', engagementId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('calendar_entries')
      .select('id, title_en, title_ar, event_date, event_time, entry_type')
      .eq('dossier_id', engagementId)
      .order('event_date', { ascending: true })
    if (error) throw error
    return data
  },
  enabled: engagementId !== '',
})
// After EventDialog onClose-on-success: queryClient.invalidateQueries({ queryKey: ['engagement-calendar-entries', engagementId] })
```

## State of the Art

| Old Approach (legacy — never extend)                                                            | Current Approach (canonical)                                                                    | When Changed                                       | Impact                                                                                 |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `engagement_positions` junction + `engagements-positions-*` edges keyed on legacy `engagements` | `position_dossier_links.dossier_id = engagementId` via `positions-dossiers-create/-get/-delete` | Phase 64 / rounds 12-13 (attach chain fixed + RLS) | This phase implements the engagement side and deletes the dead legacy frontend stack   |
| `EngagementDossierDetail` local-state tabs (unrouted)                                           | `WorkspaceShell` + routed lazy tabs                                                             | Phase 11 (workspace replaced detail page)          | New tab MUST be a routed file, not local tab state                                     |
| `calendar_events` writes                                                                        | `calendar_entries` writes via calendar-create v11                                               | quick 260604-lmy                                   | EventDialog already canonical; the in-tab reader filters `calendar_entries.dossier_id` |
| `tasks/assignments.engagement_id` (FK → legacy `engagements`)                                   | `work_item_dossiers.dossier_id`                                                                 | unified work-item layer                            | Never pass `engagement_id` to tasks-create from the workspace                          |

**Deprecated/outdated:** `useEngagementPositions` + key family `['engagement-positions', …]`; `getPositionSuggestions` express-style path; `engagements-positions-*` edges; `engagement_positions` table.

## Assumptions Log

| #   | Claim                                                                                                                                                                              | Section                | Risk if Wrong                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | The 3 staging engagement-dossier ids do NOT exist in the legacy `engagements` table (so `engagements-kanban-get` 404s for them and the TasksTab board is currently silently empty) | Pitfall 2 / CTA matrix | If they DO overlap, the board renders assignments and the create-task render-gap argument weakens — CTAs 4-5 re-enable becomes safer but the gap (tasks vs assignments plane) still exists |
| A2  | The staging test user's clearance covers the chosen engagement dossier's `sensitivity_level` (RLS SELECT/INSERT on position_dossier_links passes)                                  | Attach Path            | Live verify shows an empty tab / denied attach — pick a lower-sensitivity engagement or raise clearance                                                                                    |
| A3  | `ar` translation "المواقف" matches the established positions terminology in the app's other AR surfaces                                                                            | Tab Mounting / i18n    | Trivially correctable at execution by checking `ar/positions.json` usage ("المواقف" is used there today)                                                                                   |
| A4  | Undeploying the three legacy edges has no hidden external caller (e.g., scripts, n8n-style automations)                                                                            | Legacy Reconciliation  | Leave deployed-but-deprecated if any doubt; zero in-repo callers is verified                                                                                                               |

## Open Questions (RESOLVED)

All require live staging access (Supabase MCP) — none block planning; Q1-Q3 should run as a Wave-0 diagnostic task.

1. **Does the legacy `engagements` table contain the canonical engagement-dossier ids?** (Decides whether the TasksTab kanban currently 404s — drives CTA 4-5 disposition.)
   ```sql
   SELECT ed.id, d.name_en,
          EXISTS (SELECT 1 FROM engagements e WHERE e.id = ed.id) AS in_legacy_engagements,
          (SELECT count(*) FROM assignments a WHERE a.engagement_id = ed.id) AS assignment_rows
   FROM engagement_dossiers ed JOIN dossiers d ON d.id = ed.id;
   ```
2. **Are there published positions to exercise the attach-existing flow live?**
   ```sql
   SELECT count(*) FROM positions WHERE status = 'published';
   ```
3. **Which engagement dossier should the UAT use, and does the test user's clearance cover it?**
   ```sql
   SELECT d.id, d.name_en, d.name_ar, d.sensitivity_level
   FROM dossiers d WHERE d.type = 'engagement' ORDER BY d.created_at DESC;
   SELECT p.clearance_level FROM profiles p
   JOIN auth.users u ON u.id = p.user_id WHERE u.email = 'kazahrani@stats.gov.sa';
   ```
4. **Confirm `engagement_positions` provenance/emptiness one more time at execution** (ground truth was 2026-06-12; cheap re-check before deletion commits):
   ```sql
   SELECT count(*) FROM engagement_positions;
   SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'engagement_positions'::regclass;
   ```

## Environment Availability

| Dependency                                  | Required By                                    | Available                                                              | Version                                | Fallback                      |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------- | ----------------------------- |
| pnpm + Vitest + tsc (frontend workspace)    | unit tests, type-check, build/route-tree regen | ✓ (in repo, used daily)                                                | Vitest per `frontend/vitest.config.ts` | —                             |
| Supabase MCP (staging zkrcjzdemdmwhearhfgg) | Wave-0 diagnostics + ENGPOS-02 DB verification | ✓ for orchestrator/executor (project norm; this researcher had no MCP) | —                                      | Supabase CLI with service key |
| agent-browser (live UAT on :5173 → staging) | live verification                              | ✓ (64-06 protocol precedent)                                           | —                                      | Playwright manual run         |
| Supabase CLI                                | optional legacy-edge undeploy                  | ✓ (used for edge deploys per memory)                                   | —                                      | defer undeploy, document      |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| Framework          | Vitest + @testing-library/react (jsdom, `setupFiles: ./tests/setup.ts`)                 |
| Config file        | `frontend/vitest.config.ts` (existing)                                                  |
| Quick run command  | `cd frontend && pnpm exec vitest run src/components/positions/__tests__/`               |
| Full suite command | `cd frontend && pnpm exec vitest run` (1,283 pass / 0 fail at Phase 64 close, ~3-5 min) |

### Phase Requirements → Test Map

| Req ID           | Behavior                                                                                                                                                                                            | Test Type                                                            | Automated Command                                                                         | File Exists? |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| ENGPOS-01        | New route renders `DossierPositionsTab` with `dossierId = engagementId`; `WORKSPACE_TABS` contains a `positions` entry with correct path                                                            | unit (RTL, mock `useDossierPositionLinks`/`useDossier`)              | `pnpm exec vitest run src/components/positions/__tests__/EngagementPositionsTab.test.tsx` | ❌ Wave 0    |
| ENGPOS-01        | `tabs.positions` key present in BOTH `en` and `ar` workspace.json (key-parity assertion)                                                                                                            | unit (JSON parity)                                                   | same file (or extend an existing i18n-parity test if one exists)                          | ❌ Wave 0    |
| ENGPOS-02        | `onAttach` persists via `createPositionDossierLink(positionId, { dossier_id: engagementId })`, invalidates `['dossier-position-links', engagementId]`, partial failure → error toast                | unit (mock repo, reject one promise, queryClient spy)                | same file                                                                                 | ❌ Wave 0    |
| ENGPOS-03        | Re-enabled CTAs open their dialog with an engagement-typed `DossierContextForAction` (`dossier_type:'engagement'`, `inheritance_source:'direct'`); removed CTAs are absent from the rendered output | unit per touched tab                                                 | `pnpm exec vitest run src/pages/engagements/workspace/__tests__/`                         | ❌ Wave 0    |
| ENGPOS-03        | TaskDialog submit posts task without `engagement_id` and links via `work_item_dossiers` payload                                                                                                     | unit (mock `useCreateTask` capture)                                  | same                                                                                      | ❌ Wave 0    |
| ENGPOS-02 (live) | Attach on staging → `position_dossier_links` row with `dossier_id = <engagement id>`; tab re-renders without reload                                                                                 | manual-only (live RLS + cache behavior; milestone norm per 62/63/64) | — (agent-browser + Supabase MCP protocol below)                                           | —            |

### Sampling Rate

- **Per task commit:** quick run command + `cd frontend && pnpm type-check`
- **Per wave merge:** full suite + `pnpm exec size-limit` (Bundle Size Check is a REQUIRED CI gate; budgets in `frontend/.size-limit.json` — the new lazy route chunk should be small, but verify no `exceeded` lines)
- **Phase gate:** full suite green + live staging verification before `/gsd:verify-work`

### Live verification protocol (mirrors 64-06)

1. Wave-0 diagnostics (Open Q1-Q3) pick the target engagement dossier id and confirm clearance + published-positions supply.
2. agent-browser: login (creds via `.env.test` env vars, never recorded) → `http://localhost:5173/engagements/<id>/positions` → tab visible in nav, list renders (count may be 0).
3. Attach-existing: select a published position → toast → card renders WITHOUT reload → MCP: `SELECT * FROM position_dossier_links WHERE dossier_id = '<id>' ORDER BY created_at DESC LIMIT 2;`
4. Create-new: NewPositionDialog flow → verify position row + `applies_to` link row (64-06 matrix shape).
5. CTA pass: every formerly-disabled button is either gone or performs its action (task row + `work_item_dossiers` row; `calendar_entries` row with `dossier_id = <id>` rendering in-tab).
6. AR/RTL pass: switch via topbar `ع` → tab label Arabic, `dir=rtl`, no horizontal overflow at 1280/1024.
7. Cleanup in dependency order (links → audience_groups → versions → positions; tasks/work_item_dossiers/calendar_entries test rows) → SELECT-count-0 confirmation.

### Wave 0 Gaps

- [ ] `frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx` — covers ENGPOS-01/-02 unit rows (mirror `NewPositionDialog.test.tsx` patterns: mutable mock state, colon-form `t` mock, decision-tagged test names)
- [ ] `frontend/src/pages/engagements/workspace/__tests__/` — CTA disposition tests for ENGPOS-03 (no tests exist today for any workspace tab)
- [ ] Staging diagnostics Q1-Q3 (drives CTA 4-5 disposition + UAT target selection)
- Framework install: none — existing Vitest infrastructure covers all phase requirements

## Security Domain

`security_enforcement` not set in config → enabled. This phase adds no new auth/crypto surface; the relevant controls are existing and must not be weakened:

### Applicable ASVS Categories

| ASVS Category         | Applies              | Standard Control                                                                                                                                                                                                                          |
| --------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no (no auth changes) | existing `_protected` route wrapper + Supabase Auth                                                                                                                                                                                       |
| V3 Session Management | no                   | existing                                                                                                                                                                                                                                  |
| V4 Access Control     | **yes**              | `position_dossier_links` clearance RLS (20260610000002) is the gate for both read (direct PostgREST) and write (edge + RLS). Do NOT bypass with service-role reads in frontend code; do NOT add INSERT policies to `engagement_positions` |
| V5 Input Validation   | yes                  | Existing edge-side validation (`positions-dossiers-create`, `tasks-create`, `calendar-create`); dialogs validate client-side; no new free-form inputs beyond existing dialogs                                                             |
| V6 Cryptography       | no                   | —                                                                                                                                                                                                                                         |

### Known Threat Patterns for this stack

| Pattern                                   | STRIDE                             | Standard Mitigation                                                                                                                                        |
| ----------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS-bypass via direct PostgREST reads     | Information Disclosure             | The tab's reader inherits the clearance SELECT policy — verified table-policy text this session; live verify with a non-cleared user is optional but cheap |
| Deny-all write drift (the phase-64 class) | Denial of Service (self-inflicted) | `engagement_positions` is the drift instance — resolved by NOT using it, not by widening it                                                                |
| Inert/false affordances masking failures  | Tampering w/ user trust            | ENGPOS-03 itself; the "functional = write path AND render path" test in Pitfall 8                                                                          |

## Project Constraints (from CLAUDE.md)

- GSD workflow only; no direct edits outside it.
- RTL: logical properties only (`ms-*`, `me-*`, `text-start`); `dir` from `useDirection`; no `.reverse()`; directional icons flipped. New tab nav entry inherits all of this from `WorkspaceTabNav`.
- Design tokens only (no raw hex / Tailwind color literals); `min-h-11` touch targets; no card shadows; `.btn-primary`/`.btn-ghost` semantics via existing `Button` variants.
- Work-item terminology: `assignee_id`/`deadline`/`priority(urgent)` at the unified layer; respect the verified carve-outs (`tasks.sla_deadline`, `workflow_stage`) — do not "normalize" them.
- ESLint: explicit return types (`ReactElement`), no `any`, no floating promises, `--max-warnings 0` repo-wide in CI; `components/**` PascalCase / `hooks/**` camelCase filenames.
- Migrations via Supabase MCP only (none expected this phase).
- Bilingual: every new user-visible string in en + ar in the same commit.
- Desktop-primary: verify 1280 then 1024; tabs scroll-snap on mobile (already handled by `WorkspaceTabNav`).

## Sources

### Primary (HIGH confidence — read in this session)

- `frontend/src/components/workspace/WorkspaceTabNav.tsx`, `WorkspaceShell.tsx`; routes `_protected/engagements/$engagementId{,.tsx,/index,/overview}.tsx`
- `frontend/src/pages/engagements/workspace/{OverviewTab,TasksTab,CalendarTab,ContextTab,DocsTab}.tsx` (all 9 CTA sites confirmed at the PATTERNS-cited lines)
- `frontend/src/components/positions/{DossierPositionsTab,AttachPositionDialog}.tsx`; `components/Dossier/{AddToDossierDialogs,DossierShell}.tsx`; `hooks/{useAddToDossierActions,useDossierPositionLinks,useTasks}.ts(x)`; `domains/engagements/hooks/{useEngagements,useEngagementKanban}.ts`; `domains/engagements/repositories/engagements.repository.ts`; `services/{tasks-api,dossier-api}.ts`; `domains/calendar/{hooks/useCreateCalendarEvent,repositories/calendar.repository}.ts`; `types/{dossier-context.types,engagement.types}.ts`; `lib/dossier-type-guards.ts`
- `supabase/functions/{engagements-kanban-get,tasks-create,calendar-create,dossiers-get,positions-dossiers-create,engagements-positions-attach,positions-list,briefing-packs-generate,engagement-dossiers}/index.ts`
- `supabase/migrations/{20260610000002_fix_position_dossier_links_rls…,20260110000006_create_engagement_dossiers,20251019182300_create_unified_tasks,20251003000_add_engagement_context_to_assignments}.sql`
- `frontend/vite.config.ts`, `vitest.config.ts`, `package.json`; `src/i18n/{index.ts,en/workspace.json,ar/workspace.json,en/positions.json,ar/positions.json}`
- Orchestrator's live staging MCP facts (2026-06-12): engagement_positions 0 rows / SELECT-only RLS; position_dossier_links 2 rows / full policies; engagement_dossiers 3 rows; legacy engagements 4 rows

### Secondary (MEDIUM confidence)

- `.planning/phases/65-…/65-PATTERNS.md` (upstream pattern map — line numbers spot-verified against current files, all matched)
- `.planning/phases/64-…/{64-06-SUMMARY,64-VALIDATION}.md`; `.planning/{REQUIREMENTS,STATE}.md`; `.planning/dossier-workflow-backlog-phases-2026-06-11.md`; project memory (calendar_entries canon, i18n static bundle, RLS drift classes)

### Tertiary (LOW confidence)

- None — no external/web sources were needed; this is a pure in-repo reconciliation phase.

## Metadata

**Confidence breakdown:**

- Canonical-source decision: HIGH — converging codebase + live-staging evidence; no viable counter-case
- Tab mounting / route mechanics: HIGH — exact in-repo analogs, plugin config read directly
- CTA dispositions: HIGH for removals and the wiring contracts; MEDIUM for the CTA 4-5 (TasksTab create) recommendation pending the Q1 staging diagnostic
- Legacy deletion safety: HIGH — import graph re-verified this session
- Live-verify protocol: HIGH — direct reuse of the 64-06 protocol

**Research date:** 2026-06-12
**Valid until:** ~2026-07-12 (in-repo facts are stable; re-check staging row counts before execution via Open Q4)

## Wave-0 Diagnostic Answers (orchestrator, Supabase MCP, 2026-06-12 22:45)

1. **Legacy `engagements` overlap:** ALL THREE canonical engagement-dossier ids exist in legacy `engagements` too (seed data dual-writes), each with **0 assignment rows**. The `engagements-kanban-get` edge therefore does NOT 404 for these ids — it returns an empty board. TasksTab CTA disposition: the kanban renders but will never show TaskDialog-created tasks (different plane); the recorded-caveat re-enable path stands, with "404" softened to "empty-board mismatch". New canonical engagements created WITHOUT a legacy twin would still 404 — the caveat must say so.
2. **Published positions:** 2 published (2 total) — attach-existing flow has live supply.
3. **UAT target:** `b0000002-0000-0000-0000-000000000001` "Bilateral consultation — ESCWA" (sensitivity 2); test user clearance_level = 3 ≥ 2 → clearance-gated position_dossier_links INSERT will pass. All four engagement dossiers are ≤ level 2, so any works.
4. **engagement_positions provenance:** confirmed earlier this session: 0 rows, SELECT-only policy (write-deny). Re-check cheaply before the deletion commit at execution time (SQL above).
