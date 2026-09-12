# Phase 97: Reachability - Research

**Researched:** 2026-08-17
**Domain:** Frontend navigation topology — TanStack Router v5 file-based routes, two competing nav data sources, dossier-type exposure surfaces, per-route ownership
**Confidence:** HIGH (every claim below was derived from the tree at HEAD `9c32c4db1` this session, with file:line anchors; the only MEDIUM items are flagged in the Assumptions Log)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: The phase closes 4 requirements** — `NAV-01..04`, each mapped in plan frontmatter to
  the success criterion it serves, re-derivable by command against the register
  (`.planning/REQUIREMENTS.md` rows 543–546; definition lines 132–135). The ROADMAP line
  matches the register this phase — first time in four phases; the coverage derivation still
  runs by command and states the match rather than assuming it. **NAV-04's filed sub-item is IN
  SCOPE by name:** `frontend/src/services/auth.ts` (see D-07). A silent drop of any requirement,
  the sub-item, or a route is a REJECT (`ACCEPTANCE-P97-PLAN.md` condition 1, Branches).
- **D-02: Out-of-phase surfaces are named, not assumed** — the exclusion list in the Phase
  Boundary is the record. Source: ORCH-BRIEF §3 OUT-of-scope + `ACCEPTANCE-P97-PLAN.md`
  condition 8 (intended-broken exclusions). OUT: COPY-\* incl. the global English toast (P98);
  Arabic naturalness / pixel RTL (P99 + operator parks); RLS/residue (P100); CI (P101);
  `/delegations`, GATESTD-01, WRITER-ROUTE-01, INSERT-SYNC-01 (P102). EXCLUDED from deletion
  decisions: `/delegations` (P102) and the legal-holds region (P100) — rows record
  "owned elsewhere, untouched". Intentional shapes a sweep must NOT "fix": the `/engagements`
  double-mount, `scenario-sandbox`, `responsive-demo`, demos removed / contacts retired.
- **D-03: All 8 declared dossier types — Elected Officials included — appear in the sidebar,
  the dossier hub type cards, `/dossiers/create`, and `/compare`** (criterion 1; current state
  7-of-8). EO is represented as `person_subtype` — the type exists in data, the nav never
  surfaces it. RESEARCH resolves how the 8th type is represented end-to-end before the planner
  fixes the mechanism per surface. New nav labels land in BOTH locales same-commit, colon-form
  keys (condition 9) [inherited — P93 D-04, P94 D-10]. **No new nav entry points at a
  known-broken surface without that surface's state named in the entry's decision row**
  (condition 8) — the EO create path is verified working (or its state recorded) before
  `/dossiers/create` exposes it.
- **D-04: The two disagreeing checks unify to ONE source of truth — never a second synced
  copy** (the STAGE_TO_STATUS agree-by-authorship lesson; condition 8). Anchors:
  `frontend/src/components/layout/AppShell.tsx:125` (prefix) vs
  `frontend/src/routes/_protected/settings.tsx:11-17` (exact match). One shared route-match
  predicate consumed by both sites; where it lives is planner discretion. The whole tree is
  swept for further consumers of either predicate before the edit [inherited — P95 D-07].
- **D-05: The engagement Digests tab appears in the tab bar, and every list page exposes a
  create affordance** (criterion 3). The population is **the 8 list pages** — the plan
  enumerates all 8 and names which one already has the affordance (currently 7 of 8 have
  none; ORCH-BRIEF §3). Affordances follow the `.btn-primary` / `.btn-ghost` recipes and the
  closest-existing-component law (condition 9; `frontend/DESIGN.md`); no new button variants.
  A create affordance whose target create flow is known-broken names that state in the
  decision record rather than silently linking to it (condition 8).
- **D-06: Every route with no inbound link is resolved — the 9 admin routes + `/monitoring`
  each get a nav entry or are deleted, with the decision RECORDED PER ROUTE in a SINGLE-WRITER
  table** in the closing plan's own file; decision + why per row; NOT-CHECKED beats silence
  (condition 6). `/monitoring`'s route KEEP is already ruled (`RULING-P95-01` via
  `95-DEAD-04-DECISION.md`); its row decides ONLY the nav entry. Per-route decisions are made
  in-plan against derived evidence; genuinely underdetermined routes are PARKED, not guessed.
  The register counts 9 admin routes — the plan derives the population mechanically from
  `routeTree.gen.ts` and reconciles, stating any delta.
- **D-07: `frontend/src/services/auth.ts` resolves DELETE-or-OWN with the why recorded**
  (condition 1). Filed basis: `RULING-P92-06` — dead module, ZERO importers, a SECOND zustand
  store on the live `'auth-storage'` key plus a module-level `onAuthStateChange`. **Deletion
  happens only after the zero-importer derivation is RE-RUN at execution and instrument-tested
  against a known-imported control** (condition 8; `grep` here is a ugrep wrapper honoring
  .gitignore — instrument-test every zero [inherited — project memory]).
- **D-08: Route-count-anchored gates survive legitimate deletions** — any gate pinning a route
  count derives it at run time or states the expected delta; a frozen count is the
  moving-number class (condition 3). Deletions regenerate `routeTree.gen.ts` — P95's 202 route
  count is expected to shift, and the gates say so.
- **D-09: Two populations rule this phase, each per closing derivation** (condition 4): the
  ROUTE population (mechanical from `frontend/src/routeTree.gen.ts`, blind spots stated) and
  the **INBOUND-LINK population** — an instrument over the link/navigation vocabulary
  (`Link to=`, `navigate(`, nav-data structures, redirects, sidebar/menu configs), blind spots
  STATED (computed/template hrefs, runtime-built paths), residual HAND-CLASSIFIED as part of
  the deliverable. "No inbound link" is a ZERO claim — every such zero is instrument-tested
  against a known-linked control. The TRIGSWEEP lesson binds: the instrument is the union of
  known forms plus a suspect list, and its count is a FLOOR [inherited — P96 TRIGSWEEP-01].
- **D-10: Reachability criteria are click-through claims** — a nav entry OBSERVED to reach its
  page (browser-harness CDP / e2e), not merely present in a data structure; each of the four
  criteria says how it is observed; execution-blocked oracles labelled with
  producer-before-consumer ordering; Playwright spec paths are FILTERS — assert existence
  first, hardcode counts (condition 7) [inherited — project memory].
- **D-11: Every gate meets `GATE-STANDARD-P92.md` via `scripts/gate-drill.mjs` in BOTH
  directions or is UNPROVEN-labelled**; zero vacuous guards; post-close mutations name which
  closed gates' subjects they change (condition 3, standing law). C9a swept; C9b mock-vs-real
  via `scripts/c9b-sweep.sh` ONLY (condition 5).
- **D-12:** New nav labels in BOTH locales same-commit, colon-form; chrome via design tokens
  with the closest-existing-component law (sidebar patterns); **NO visual baselines
  committed**; no plan waits on E2ECRED-01; single-instance behavioural testing —
  single-origin CORS, `:5173` only (condition 9) [inherited — P95/P96].
- **D-13:** Every plan carries at least one citation truth (`truths:`) so the mechanical
  decision-coverage gate passes with `uncovered: []` and a falsification drill lands on disk
  (condition 2) [inherited — project memory: the gate scans plan truths only].

### Claude's Discretion

- Where the shared `/settings` route-match predicate lives and its exact API.
- The NAV-01 mechanism per surface, once research resolves the EO representation.
- The per-route decision table's column layout (decision + why + owner are mandatory content).
- Which nav section/group the surviving admin routes join, subject to the design rules.
- Plan/wave decomposition.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. (Out-of-scope surfaces are recorded in the
Phase Boundary exclusion list, each with its owning phase.)
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                              | Research Support                                                                                                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-01 | Elected Officials reachable — sidebar, dossier hub type cards, `/dossiers/create`, `/compare` expose all 8 declared dossier types, not 7 | §NAV-01 findings: EO = `person_subtype`, per-surface current state derived (sidebar 7/8, hub cards 7/8, create hub **already 8/8**, compare 7/8), local-widening precedent, per-surface mechanism                                           |
| NAV-02 | `/settings/*` subtree renders navigation; prefix check and exact-match check no longer disagree                                          | §NAV-02 findings: both sites anchored, full consumer sweep (2 live match consumers, 1 dead, 1 demo-only, 10 benign targets), predicate home recommendation                                                                                  |
| NAV-03 | Engagement Digests tab in the tab bar; list pages expose a create affordance (7 of 8 have none)                                          | §NAV-03 findings: `WORKSPACE_TABS` at WorkspaceTabNav.tsx:26 lacks `digests` while the route exists; the 8-list-page population derived and reconciled with audit F9; EO list is the 1-of-8 with the affordance                             |
| NAV-04 | Every route with no inbound link resolved — 9 admin routes + `/monitoring` get a nav entry or are deleted, decision recorded             | §NAV-04 findings: mechanical admin population = 8 (delta −1 vs register, stated), live-vs-demo nav split discovered, per-route inbound-link state, `/monitoring` prod-degraded state named, `services/auth.ts` zero re-derived with control |

</phase_requirements>

## Summary

This phase is pure codebase-topology work — no new packages, no schema changes, no backend
work. The research resolved all seven planner unknowns with file:line evidence. Three findings
change the phase's shape materially:

1. **The app has TWO nav data sources, and the one P95 anchored is the dead one.** The LIVE
   sidebar is `components/layout/Sidebar.tsx` (mounted by `AppShell.tsx:92,196,252`), fed by
   `components/layout/navigation-config.ts`. The `components/modern-nav/` tree
   (`navigationData.ts`, `IconRail`, `NavigationShell`) is mounted **only** by
   `routes/modern-nav-standalone.tsx` — a standalone demo route. P95's "sole `/monitoring`
   inbound link" at `navigationData.ts:262` therefore **never renders in the live shell**;
   `/monitoring` has NO live nav entry today. Every NAV-04 nav-entry decision lands in
   `navigation-config.ts`, and the INBOUND-LINK instrument must classify `navigationData.ts`
   hits as non-rendered.
2. **Elected Officials is `person_subtype`, not a dossier type — and one of the four NAV-01
   surfaces is already done.** DB truth: `dossiers.type` CHECK = 7 values (migration
   `20260202000001` removed `elected_official`); EO = `persons.person_subtype =
'elected_official'`. The EO pseudo-type has full routes (`/dossiers/elected-officials/`
   list + `$id` + `create`), its own domain and wizard. `/dossiers/create` (CreateDossierHub)
   already renders **8** cards including EO (landed 2026-04-18, commit `70e773a3b`) — the
   2026-08-15 audit's F8 claim of 7 cards is stale for that surface. Remaining: sidebar (7/8,
   missing only EO), hub type cards (7/8), compare (7/8). The established mechanism is
   **local type-widening per surface** (CreateDossierHub's `HubCardType` pattern) — never
   widen the canonical `DossierType`.
3. **The register's counts reconcile once the right populations are used.** "7 of 8" list
   pages without a create affordance = audit F9's behavioural finding over the 8 dossier-type
   list pages (elected-officials is the one WITH; the other pages' `onCreate` handlers wire
   only into empty-state CTAs). "9 admin routes" vs the mechanical 8 under
   `/_protected/admin/` is a −1 delta the plan states rather than absorbs.

**Primary recommendation:** Plan four requirement-scoped lanes (NAV-01 per-surface widening,
NAV-02 single predicate + settings nav column, NAV-03 tab entry + shared create-affordance
slot, NAV-04 decision table + `navigation-config.ts` entries/deletions), all edits converging
on `navigation-config.ts` as the single live nav registration surface, with click-through
Playwright oracles in the P95 inline-login `--no-deps` pattern.

## Architectural Responsibility Map

| Capability                                | Primary Tier                                                      | Secondary Tier          | Rationale                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar / nav entries (NAV-01, NAV-04)    | Browser/Client — `navigation-config.ts` + `Sidebar.tsx`           | —                       | Nav is client-rendered config; no server involvement                                                                              |
| Settings route-match predicate (NAV-02)   | Browser/Client — shared lib consumed by AppShell + SettingsLayout | —                       | Pure pathname predicate over TanStack Router state                                                                                |
| Digests tab + create affordances (NAV-03) | Browser/Client — `WorkspaceTabNav`, list-page shells              | —                       | Tab bars and toolbars are client components; the Digests route/feature already exists                                             |
| Route deletions (NAV-04)                  | Browser/Client — route files + regenerated `routeTree.gen.ts`     | —                       | File-based routing; deletion regenerates the tree on build                                                                        |
| EO hub-card count (NAV-01 hub surface)    | Browser/Client                                                    | Database/Storage (read) | Hub cards read `getDossierCountsByType()`; an EO bucket needs a subtype-filtered count from the existing counts source            |
| Admin-route authorization                 | API/Backend + RLS (NOT this phase)                                | —                       | `adminOnly` nav gating is UI-only; adding nav entries changes discoverability, not authz — decision rows must not claim otherwise |

## Standard Stack

**No new packages.** Every mechanism this phase needs exists in the installed stack:

| Library                 | Version                                    | Purpose                                                            | Why Standard                                                                                                                 |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| @tanstack/react-router  | v1 (file-based, `router-plugin ^1.168.10`) | Routes, redirects, `useMatches`/`useRouterState` for the predicate | Already the router; `routeTree.gen.ts` regenerates on dev/build `[VERIFIED: frontend/vite.config.ts per 95-RESEARCH.md:234]` |
| react-i18next / i18next | installed                                  | New nav/tab labels, colon-form                                     | Static bundle in `src/i18n/index.ts`; unregistered ns falls back EN in BOTH locales `[VERIFIED: frontend/CLAUDE.md]`         |
| @playwright/test        | installed (root `playwright.config.ts`)    | Click-through oracles                                              | The P92–P96 spec family is the house pattern `[VERIFIED: tests/e2e/]`                                                        |
| Vitest                  | v4                                         | Unit oracles (e.g., hub-card count test already exists)            | `--reporter=basic` is dead in Vitest 4 [inherited — P96 memory]                                                              |
| lucide-react            | installed                                  | Icons for new nav/tab entries (`Crown` already used for EO)        | `[VERIFIED: elected-officials/index.tsx:17]`                                                                                 |

**Installation:** none.

## Package Legitimacy Audit

**No external packages are installed by this phase.** Slopcheck not run — nothing to check.
All work is edits to existing first-party files. If a plan later introduces a dependency, it
must run the Package Legitimacy Gate before the install task.

## Findings by Requirement

### NAV-01 — Elected Officials end-to-end representation `[VERIFIED: repo + migrations this session]`

**Representation (the D-03 research question, answered):**

- **DB:** `dossiers.type` CHECK constraint = 7 values — `country, organization, forum,
engagement, topic, working_group, person` — since migration
  `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:192-204`, which
  DROPPED the earlier 8-value check (`20260118000001` had added `elected_official`) and moved
  EO to `persons.person_subtype IN ('standard','elected_official')` (same migration, line 15).
  `20260202000002` dropped the `elected_officials` extension table. EO office/term/party
  fields live ON `persons` (office_name_en/ar, office_type, district, party, term_number…).
  Generated types agree: `persons.person_subtype` at `frontend/src/types/database.types.ts:21214`.
  **Execution re-derives live** via
  `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.dossiers'::regclass AND conname='dossiers_type_check';`
  (staging `zkrcjzdemdmwhearhfgg`) — the repo-migration derivation is authoritative-at-HEAD
  but the live check is the phase's own standing rule.
- **Frontend canonical type:** `DossierType` union = the same 7
  (`frontend/src/lib/dossier-type-guards.ts:~35`), plus `PersonSubtype = 'standard' |
'elected_official'`. **Divergence to know about:** `frontend/src/lib/dossier-routes.ts`
  `DOSSIER_TYPE_TO_ROUTE` has **8 keys** including `elected_official: 'elected-officials'`,
  so `getDossierRouteSegment('elected_official')` → `elected-officials` and
  `dossier-routes.ts`' own `isValidDossierType('elected_official')` returns TRUE while the
  type-guards module's union excludes it. This is the plumbing that makes the EO pseudo-type
  routable.
- **Routes that exist today:** `/dossiers/elected-officials/` (list, WITH create button),
  `$id.tsx` + `$id/` children (incl. `digests.tsx`), `create.tsx` (4-step wizard). Domain:
  `frontend/src/domains/elected-officials/` (types, hooks, keys).
- **The established widening pattern:** `CreateDossierHub.tsx:38-64` defines a LOCAL
  `HubCardType` = canonical 7 + `'elected_official'` with the comment "widen locally rather
  than touching the canonical domain type" — this is the precedent each remaining surface
  should copy. **Do not add `elected_official` to the canonical `DossierType`.**

**Per-surface current state (the four criterion-1 surfaces):**

| Surface                                                                 | Data source                                                                                                                                                                             | Current                                                                       | Delta                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar (LIVE = `navigation-config.ts`)                                 | Dossiers group `:122-163` has countries, organizations, persons, forums, topics, working_groups (paths `/dossiers/{seg}`); engagements sits in Operations `:79-80` (`/engagements`)     | **7 of 8** — missing ONLY elected-officials (this is the register's "7-of-8") | Add one item, path `/dossiers/elected-officials`; label key `navigation.electedOfficials` ALREADY EXISTS in both locales (`i18n/en/common.json:147`, `i18n/ar/common.json:147` "المسؤولون المنتخبون")            |
| Dossier hub type cards (`/dossiers` → `DossierListPage.tsx:75-83`)      | `DOSSIER_TYPES: DossierType[]` = 7; cards driven by `useDossierCounts()` → `getDossierCountsByType()` (`domains/dossiers/hooks/useDossier.ts:652-685`)                                  | 7 of 8                                                                        | Local widening + an EO bucket in the counts source (persons where subtype='elected_official') + click-to-filter semantics for the pseudo-type                                                                    |
| `/dossiers/create` (`CreateDossierHub.tsx:55-64`)                       | 8 cards incl. `elected_official`, hub-card hrefs via `getDossierRouteSegment`                                                                                                           | **ALREADY 8 of 8** (since `70e773a3b`, 2026-04-18; unit test pins 8 + order)  | NONE code-wise; the plan's oracle observes it click-through and records that audit F8 is stale for this surface                                                                                                  |
| `/compare` (`compare.tsx:15-24` + `EntityComparisonSelector.tsx:64-72`) | `VALID_DOSSIER_TYPES` = 7; `ENTITY_TYPE_OPTIONS` = 7; fetch validates `e.type === entityType` (`hooks/useEntityComparison.ts:567`) and keys a per-type extension-field registry (`:95`) | 7 of 8                                                                        | Local widening in BOTH the route's search validator and the selector, an EO fetch arm (type='person' + subtype filter), and an EO field config (office/term/party fields from `domains/elected-officials/types`) |

**EO create path working-state (condition 8 input):** the wizard exists and is wired —
`elected-officials/create.tsx` composes 4 steps via `electedOfficialWizardConfig`
(`person.config.ts:162-…`), submits DB type `'person'` + `person_subtype` via
`filterExtensionData`, and lands on the `elected-officials` detail shell
(`detailRouteSegment: 'elected-officials'`, R16-02). The 2026-08-15 audit graded all 8 create
pages "all render; HOLLOW-adjacent (F9 unreachable, F15, F18, F19, F24)" — render confirmed,
**submit success not confirmed by any artifact found this session**. The plan MUST verify an
EO create submit behaviourally (e2e create → detail lands) before/with the nav exposure, or
name the unverified state in the decision row — exactly what D-03's last sentence requires.

### NAV-02 — the `/settings` predicate consumer sweep `[VERIFIED: command-grep sweep this session]`

**The two disagreeing sites (anchored, confirmed at HEAD):**

- `AppShell.tsx:125` — `const isSettingsRoute = pathname.startsWith('/settings')` → gates BOTH
  Sidebar mounts (desktop `:196`, mobile drawer `:252`) off. Its own comment (F18/D-85-03)
  claims "SettingsLayout renders its own 240px nav column" — **that claim is false for child
  routes**, which is the bug.
- `routes/_protected/settings.tsx:11-17` — `useMatches()` last-match `pathname === '/settings'`
  → exact match renders `SettingsPage` (which mounts the settings nav via
  `components/settings/SettingsLayout.tsx` + `SettingsNavigation.tsx`); NON-exact renders bare
  `<Outlet/>`. Result: `/settings/{webhooks,integrations,notifications,email-digest,calendar-sync,calendar/callback}`
  render with NO navigation at all (global sidebar suppressed + no settings nav).

**Full consumer sweep** (patterns `'/settings`, `"/settings`, `` `/settings ``, tree-wide,
excl. routeTree.gen + tests; run with `command grep` because plain `grep` is a
.gitignore-honoring ugrep wrapper):

| Site                                                                             | Form                                               | Classification                                                                                                                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/layout/AppShell.tsx:125`                                             | `startsWith('/settings')`                          | **LIVE match consumer #1** — must consume the shared predicate                                                                                                   |
| `routes/_protected/settings.tsx:14`                                              | exact `=== '/settings'`                            | **LIVE match consumer #2** — must consume the shared predicate (restructured: nav column for the whole subtree, page content only at index)                      |
| `hooks/useContextAwareFAB.ts:428-430`                                            | `hiddenRoutes.some(startsWith)` incl. `/settings`  | **DEAD-code match consumer** — `context-aware-fab.tsx` (its only real consumer) is mounted by ZERO files; classify NON-RENDERED in the sweep record, do not wire |
| `components/modern-nav/IconRail/IconRail.tsx:269`                                | `navigate({to:'/settings'})`                       | Demo-only tree (see NAV-04); navigation TARGET, benign                                                                                                           |
| `components/modern-nav/navigationData.ts:286,300`                                | nav data path                                      | Demo-only tree; benign                                                                                                                                           |
| `keyboard-shortcuts/CommandPalette.tsx:787`, `hooks/useKeyboardShortcuts.ts:380` | `navigateTo('/settings')`                          | Navigation TARGETS, benign                                                                                                                                       |
| `NotificationPanel.tsx:115`, `NotificationsPage.tsx:155`                         | `navigate({to:'/settings/notifications'})`         | Targets, benign                                                                                                                                                  |
| `layout/nav-user.tsx:92,98`                                                      | `<Link to="/settings">`                            | Targets, benign                                                                                                                                                  |
| `settings/calendar/callback.tsx:92,130`                                          | `navigate({to:'/settings/calendar-sync'})`         | Targets, benign                                                                                                                                                  |
| `settings/BotIntegrationsSettings.tsx:152,169,174`                               | `history.replaceState(…,'/settings/integrations')` | URL write, benign (note as instrument blind-spot exemplar)                                                                                                       |

**Live match-consumer set = exactly 2** (+1 dead). The predicate's semantics both sites need:
"is the current location inside the `/settings` subtree" plus "is it the subtree index".
Recommended home (planner discretion stands): a tiny module in `frontend/src/lib/` (kebab-case
per ESLint, e.g. `settings-route.ts`) exporting `isSettingsPath(pathname: string): boolean`
(subtree) — AppShell consumes it with `useRouterState` pathname; SettingsLayout consumes the
same function and derives index-ness from its existing `useMatches()` tail. One authored
predicate, zero synced copies (D-04). The `/settings/calendar/callback` route (OAuth landing)
must be checked in the click-through oracle — it's the deepest child and previously
double-hidden.

### NAV-03 — Digests tab + the 8 list pages `[VERIFIED: file reads this session]`

**(a) Digests tab:** the route `routes/_protected/engagements/$engagementId/digests.tsx`
exists and lazy-loads `components/intelligence/DigestsTab.tsx` (exists; P70 feature). The tab
bar is `components/workspace/WorkspaceTabNav.tsx:26-35` — `WORKSPACE_TABS` has 8 entries
(overview, context, positions, signals, tasks, calendar, docs, audit) and **no `digests`**.
Note the same drift exists for the routed-but-untabbed `positions.tsx`/`signals.tsx` siblings'
pattern predecessor: `$engagementId.tsx:5`'s doc comment lists only 6 tabs — comments are not
population evidence; the mechanical source is `WORKSPACE_TABS` vs the `$engagementId/` route
directory (11 route files incl. index/after-action). Fix: add
`{ key: 'digests', labelKey: 'tabs.digests', path: 'digests' }` + `tabs.digests` key in
`i18n/{en,ar}/workspace.json` same-commit (key does NOT exist yet in either locale —
verified). Where in the order it sits is planner discretion; after `signals` matches the
intelligence grouping.

**(b) The 8 list pages — population derived, register count reconciled:** the population is
the 8 dossier-type list pages `routes/_protected/dossiers/{countries,organizations,persons,
forums,topics,working_groups,elected-officials,engagements}/index.tsx` — exactly the set the
audit's F9 graded (`.planning/audits/live-audit-2026-08-15/dossiers.md:217-228`: "Seven of
eight type list pages have no way to create anything… `/dossiers/elected-officials` renders a
'Add Elected Official' CTA"). **elected-officials is the 1-of-8 WITH the affordance**
(`elected-officials/index.tsx:199-208` — `PageHeader` `actions` slot, `<Button asChild>`
wrapping `<Link to="/dossiers/elected-officials/create">` + `Plus` icon). The other seven have
`onCreate` handlers wired ONLY to empty-state CTAs (e.g. `countries/index.tsx:209-211` +
`ListEmptyState` at `:253-259` — "F26 empty states: rich create CTA when truly empty"), so
with data present there is no create path — the audit's behavioural grading and the code
agree.

**Heterogeneity the plan must respect (no single shared edit closes all 7):**

| Page                                             | Shell                                                                                                              | Where the affordance goes                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| countries, forums, organizations, working_groups | `components/list-page/ListPageShell` (props: title/subtitle/toolbar/…, NO actions slot — `ListPageShell.tsx:4-12`) | Either add an optional `actions?: ReactNode` prop to ListPageShell (one edit, four consumers) or append a `.btn-primary` Link to each `toolbar` |
| engagements                                      | delegates to `EngagementsListPage` component (`index.tsx:103-113`, `onCreate` already passed)                      | Surface the already-plumbed `onCreate` as a visible header/toolbar button inside `EngagementsListPage`                                          |
| persons, topics                                  | colocated page components (`-TopicsListPage.tsx`; persons likewise shell-less)                                     | Same pattern as their own headers; closest existing component = the EO `PageHeader actions` recipe                                              |
| elected-officials                                | `PageHeader` + actions                                                                                             | Already done — the model to copy                                                                                                                |

All targets' create routes exist (`dossiers/*/create.tsx` — all 8 verified on disk). Condition
8: the audit graded all create pages as rendering; submit-path state per type is NOT verified
— rows for pages whose create flow has known findings (audit F15/F18/F19/F24 are cosmetic/a11y,
not broken-submit) should cite the audit grade rather than assert "working".

### NAV-04 — route population, inbound links, per-route evidence `[VERIFIED: routeTree.gen + sweeps this session]`

**THE STRUCTURAL FINDING — two nav sources, one live:**

- LIVE: `components/layout/navigation-config.ts` (Phase 36 shell-chrome) → consumed by
  `layout/Sidebar.tsx` (mounted at `AppShell.tsx:196,252`), `layout/nav-main.tsx`,
  `keyboard-shortcuts/CommandPalette.tsx:104,522`, `hooks/useRecentNavigation.ts`. Three
  groups: operations, dossiers, administration (admin group emitted only when
  `isAdmin === true`, `navigation-config.ts:3-5`).
- DEMO-ONLY: `components/modern-nav/` (`navigationData.ts` + `IconRail` + `NavigationShell` +
  `ExpandedPanel`) — mounted ONLY by `routes/modern-nav-standalone.tsx`. **Nothing in the live
  `_protected` shell renders it.** Consequence: `navigationData.ts:262`'s `/monitoring` entry
  (P95's residual-population single hit, D-06's named anchor) is a link that never renders in
  the product shell. The D-06 row for `/monitoring` should record this refinement explicitly:
  the ruled input said "already links it"; the derived truth is "links it in a nav tree only
  reachable via the standalone demo route". The live nav has NO monitoring entry
  (`command grep -n monitoring navigation-config.ts` → 0 hits; instrument control: the same
  sweep finds `/admin/ai-settings` at `:178`).

**Admin-route population, mechanically derived:** `routeTree.gen.ts` contains exactly **8**
`/_protected/admin/*` paths: `/'` (index → pure redirect to `/admin/ai-settings`,
`admin/index.tsx`), `ai-settings`, `ai-usage`, `approvals`, `data-retention`,
`field-permissions`, `preview-layouts`, `system`. **Register says 9 → delta −1, stated not
absorbed** (the audit's own coverage table, `adminops.md:21-28`, also lists 8). The
per-route decision table = 8 admin rows + `/monitoring` = 9 rows.

**Per-route inbound-link + render state (plan-time evidence; execution re-derives):**

| Route                      | Live nav entry                                                                           | Renders (audit 2026-08-15 + later phases)                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin` (index)           | none directly (redirect target of URL entry only)                                        | 302 → ai-settings                                                                                                                        |
| `/admin/ai-settings`       | YES — `navigation-config.ts:178`                                                         | OK (save verified)                                                                                                                       |
| `/admin/ai-usage`          | **NONE**                                                                                 | OK, no data seeded                                                                                                                       |
| `/admin/approvals`         | **NONE** (nav `approvals` at `:214` points at top-level `/approvals`, a DIFFERENT route) | OK, no data; audit calls it "orphan route"                                                                                               |
| `/admin/data-retention`    | YES — `:208`                                                                             | audit: BROKEN 401s — since repaired territory of P92/P93 (93-admin-surfaces-error spec exists); row cites current behaviour at execution |
| `/admin/field-permissions` | YES — `:196`                                                                             | audit: BROKEN 401s hiding 19 rows — same note                                                                                            |
| `/admin/preview-layouts`   | **NONE**                                                                                 | OK; audit "orphan route"                                                                                                                 |
| `/admin/system`            | YES — `:184`                                                                             | OK (invisible icon F17)                                                                                                                  |
| `/monitoring`              | **NONE live** (demo-only `navigationData.ts:262`)                                        | Renders since P95 (KEEP ruled, `RULING-P95-01`); **production caveat below**                                                             |

**The `/monitoring` condition-8 fact its decision row must name:** the Dashboard's API was
moved under `/api/monitoring` INSIDE the backend's `NODE_ENV === 'development' || 'test'`
guard (`95-DEAD-04-DECISION.md` §Mechanism item 1) — **in production the endpoints 404 and
both widgets settle to their inline `QueryErrorState`s** (testIds `monitoring-health-error`,
`monitoring-alerts-error`). A live nav entry therefore points at a page that renders honestly
but is data-degraded in production. That is exactly the "known-broken surface state named in
the entry's decision row" case — name it, don't hide it, don't widen scope to fix the guard.

**CommandPalette propagation wrinkle (name in decision rows):** `CommandPalette.tsx:522` calls
`createNavigationGroups({tasks:0,approvals:0,engagements:0}, true)` — **isAdmin hardcoded
`true`**, so every admin-group nav entry (including any this phase adds) becomes a palette
navigation command for ALL users. Pre-existing behaviour; adding entries widens its surface.
Record it per affected row; fixing the palette's role-awareness is not NAV-04 scope unless the
planner rules it in as part of "nav entry" correctness.

**`services/auth.ts` (D-07) — zero re-derived this session:**
`command grep -rn "services/auth'" frontend/src --include='*.ts' --include='*.tsx' | grep -v '^…/services/auth.ts'`
→ empty, raw exit 1; instrument control: same grep for `store/authStore'` → multiple hits
(first: `domains/operations-hub/hooks/useRolePreference.ts`). The module (18,404 bytes) is
what the filing says: a full second `useAuthStore` zustand store persisted under
`name: 'auth-storage'` (`services/auth.ts:624` — colliding with the live
`store/authStore.ts` key) plus module-level `supabase.auth.onAuthStateChange` at `:635`, and
`export { supabase }` / default-export store. Recommendation: **DELETE** (dead + latent
dual-store hazard; owning it has no consumer to serve). Execution re-runs the derivation with
the control per D-07. **Trap for the gate author:** piping the grep through `head`/`wc`
destroys its exit semantics ($? becomes the last pipe stage) — the gate must read the
unpiped grep exit code AND the control's non-empty output (watchers fail closed: condition
AND exit code).

## INBOUND-LINK instrument — vocabulary survey (D-09 input) `[VERIFIED: counts this session]`

Known-forms union with file counts at HEAD (frontend/src, excl. routeTree.gen + tests; all
sweeps via `command grep`, never bare `grep`):

| Form                           | Files | Notes                                                                                                     |
| ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------- |
| `<Link to=` (TanStack)         | 31    | includes template-literal `to={`…`}` variants — those are the blind spot, not this count                  |
| `navigate({ to:`               | 69    | `useNavigate`                                                                                             |
| `redirect({ to:`               | 8     | `beforeLoad` redirects (e.g. all top-level dossier aliases, `admin/index.tsx`)                            |
| `router.navigate`              | 1     |                                                                                                           |
| Nav data structures            | 2     | `navigation-config.ts` (LIVE), `modern-nav/navigationData.ts` (DEMO-ONLY — classify hits as non-rendered) |
| Palette/shortcut `navigateTo(` | 2     | `CommandPalette.tsx`, `useKeyboardShortcuts.ts`                                                           |
| `<a href`                      | 7     |                                                                                                           |
| `window.location`              | 20    | assignments + reads mixed — hand-classify                                                                 |
| `window.open`                  | 11    |                                                                                                           |
| `history.replaceState`         | 1     | `BotIntegrationsSettings.tsx`                                                                             |

**Suspect list / stated blind spots (the FLOOR declaration):** computed paths via
`getDossierDetailPath`/`getDossierRouteSegment` (33 files) and template-literal `to=` props;
runtime-built strings passed to `navigate` via variables; `useRecentNavigation` (replays
visited paths — derivative, not an origin); redirects held in server data; e2e-only
`page.goto` (not product links). Residual hand-classification is part of the deliverable.
**Instrument control:** every zero-inbound claim is tested against `/admin/ai-settings`
(known-linked at `navigation-config.ts:178`) — the sweep that says "ai-usage has no inbound
link" must find ai-settings' link in the same run.

**ROUTE population instrument:** P95's precedent (95-RESEARCH.md:679) —
`sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts | command grep -c "':"`
→ **203 at HEAD** (P95 pinned 202; `/calendar` landed in P96 — the drift proves D-08's point).
Gates derive this at run time; no frozen 203 anywhere.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌──────────────────────────────────────────────────────┐
                    │ _protected.tsx (auth gate) → AppShell                │
                    │                                                      │
 user click ──────► │  Sidebar.tsx ◄── navigation-config.ts  ◄─ EDIT HERE  │
                    │  (suppressed when isSettingsPath(pathname))          │
                    │        │ Link/navigate                               │
                    │        ▼                                             │
                    │  TanStack Router (routeTree.gen.ts, 203 routes)      │
                    │        │                                             │
                    │        ├── /settings → SettingsLayout                │
                    │        │     ├─ isSettingsPath (SAME predicate)      │
                    │        │     ├─ index → SettingsPage (+ its nav)     │
                    │        │     └─ child → settings nav col + <Outlet/> │
                    │        ├── /engagements/$id → WorkspaceShell         │
                    │        │     └─ WorkspaceTabNav (WORKSPACE_TABS      │
                    │        │        + digests) → …/$id/digests           │
                    │        ├── /dossiers/* (8 pseudo-type segments)      │
                    │        └── /admin/* + /monitoring (per-row decision) │
                    └──────────────────────────────────────────────────────┘
 DEMO ONLY: /modern-nav-standalone → NavigationShell/IconRail ◄─ navigationData.ts
            (never rendered in the live shell — classify, don't edit for reachability)
```

### Recommended Project Structure (files this phase touches)

```
frontend/src/
├── lib/settings-route.ts            # NEW (name = planner discretion): the ONE predicate
├── components/layout/
│   ├── navigation-config.ts         # ALL live nav entry additions (EO, monitoring, admin)
│   └── AppShell.tsx                 # :125 consumes shared predicate
├── routes/_protected/settings.tsx   # subtree nav column + predicate
├── components/workspace/WorkspaceTabNav.tsx   # + digests entry
├── components/list-page/ListPageShell.tsx     # optional actions slot (NAV-03)
├── routes/_protected/dossiers/*/index.tsx     # create affordances (7 pages)
├── pages/dossiers/DossierListPage.tsx         # hub cards local widening
├── routes/_protected/compare.tsx + components/entity-comparison/*  # compare widening
├── i18n/{en,ar}/{common,workspace,…}.json     # same-commit label keys
└── services/auth.ts                 # DELETE (after re-derived zero + control)
```

### Pattern 1: Local type-widening per surface (NAV-01)

**What:** Each surface that must show the EO pseudo-type defines a local union
`DossierType | 'elected_official'` instead of widening the canonical type.
**When to use:** every NAV-01 surface edit.
**Example (the in-repo precedent):**

```typescript
// Source: frontend/src/pages/dossiers/CreateDossierHub.tsx:38-64
type HubCardType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'
// routes resolve via getDossierRouteSegment(type) → 'elected-officials'
```

### Pattern 2: One predicate, two consumers (NAV-02)

```typescript
// NEW shared module (home = planner discretion), consumed by AppShell.tsx:125
// and routes/_protected/settings.tsx — never a second copy.
export function isSettingsPath(pathname: string): boolean {
  return pathname === '/settings' || pathname.startsWith('/settings/')
}
```

Note the exact-boundary form: bare `startsWith('/settings')` would also match a hypothetical
`/settingsFoo` route — the shared predicate should close that latent hole while unifying.

### Pattern 3: Nav entry + label (NAV-01/NAV-04)

```typescript
// Source shape: frontend/src/components/layout/navigation-config.ts:151-160
{
  id: 'elected-officials',
  label: 'navigation.electedOfficials',   // EXISTS in en+ar common.json:147 already
  path: '/dossiers/elected-officials',
  icon: Crown,                            // lucide, matches EO list page
}
```

### Pattern 4: Click-through oracle (D-10) — the P95 house pattern

```typescript
// Source: tests/e2e/95-monitoring-mounts.spec.ts (inline auth, natural network)
// - '// @covers NAV-0X' header
// - inline sign-in from TEST_USER_EMAIL/TEST_USER_PASSWORD (no storageState; E2ECRED-01)
// - run with --no-deps so the broken `setup` project never gates it
// - click the REAL nav entry, assert the destination's own content testid settles
// - Playwright paths are FILTERS: a gate first asserts the spec FILE exists, then
//   hardcodes the expected pass count (never derives it from a file listing)
```

### Anti-Patterns to Avoid

- **Editing `navigationData.ts` to satisfy a reachability criterion** — it never renders in
  the live shell; a green built on it is a data-structure claim, precisely what condition 7
  forbids.
- **Second synced predicate copy** (NAV-02) — the STAGE_TO_STATUS lesson; one authored site.
- **Widening canonical `DossierType`** — breaks the discriminated-union guards and the DB
  contract; the codebase's own comments forbid it (`CreateDossierHub.tsx:14-17`).
- **Frozen route counts in gates** — 202 already drifted to 203 between P95 and today.
- **Trusting the audit for current state** — F8's create-hub half was already stale 2 days
  after filing; every audit claim used in a decision row gets re-derived at execution.

## Don't Hand-Roll

| Problem                  | Don't Build                    | Use Instead                                                                                           | Why                                                                                                 |
| ------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Route-segment for EO     | a per-surface path map         | `getDossierRouteSegment` (`lib/dossier-routes.ts`, already has the 8th key)                           | single existing source; hub already uses it                                                         |
| Settings subtree nav UI  | a new nav column               | `components/settings/SettingsLayout.tsx` + `SettingsNavigation.tsx`                                   | the 240px column already exists; it's mounted in the wrong place (inside SettingsPage), not missing |
| Create-affordance chrome | new button variants            | `.btn-primary` recipe via the EO `PageHeader actions` pattern (`elected-officials/index.tsx:199-208`) | D-05 / condition 9 mandate closest-existing-component                                               |
| Nav labels               | new i18n keys where keys exist | `navigation.electedOfficials/monitoring/aiUsage/adminApprovals` already in en+ar `common.json`        | only `tabs.digests` (workspace ns) and possibly `navigation.previewLayouts` are genuinely missing   |
| Route population count   | hand-listed routes             | the P95 sed/grep instrument over `FileRoutesByFullPath`                                               | deletion-safe, run-time derivable                                                                   |
| E2e auth                 | storageState fixtures          | inline `LoginPage` sign-in + `--no-deps`                                                              | setup project throws without six E2E\_\* keys (E2ECRED-01, P101); D-12 forbids waiting on it        |

**Key insight:** this phase is wiring, not building — every mechanism (routes, wizard, nav
column, tab component, i18n keys, oracle pattern) already exists in-tree; the work is
registering things in the ONE live source per surface and recording decisions.

## Runtime State Inventory

(Phase deletes routes/modules — checked the five categories for deletion fallout.)

| Category            | Items Found                                                                                                                                                                                                                                                      | Action Required                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Stored data         | None — no DB rows key on route paths or on `services/auth.ts`. EO data already lives as `persons.person_subtype` rows; NAV-01 only exposes it                                                                                                                    | none                                |
| Live service config | None — nginx confs carry no `/monitoring` or `/admin/*` locations (re-derived by P95: `location /api/` only)                                                                                                                                                     | none                                |
| OS-registered state | None                                                                                                                                                                                                                                                             | none                                |
| Secrets/env vars    | `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` in `.env.test` consumed by oracles — unchanged. Deleting `services/auth.ts` does NOT touch the localStorage `'auth-storage'` entry (the live `store/authStore.ts` owns that key; the dead module never runs)              | none                                |
| Build artifacts     | `routeTree.gen.ts` regenerates on dev/build and is committed — any route deletion commits the regenerated tree in the same change (P95 precedent); `.size-limit.json` Bundle Size Check is a required CI gate — deletions only shrink, nav additions are trivial | commit regenerated tree same-commit |

## Common Pitfalls

### Pitfall 1: Fixing reachability in the dead nav

**What goes wrong:** entries added to `modern-nav/navigationData.ts` pass a grep-based gate
and render nowhere. **Why:** two nav sources; only `navigation-config.ts` is mounted.
**Avoid:** every nav-entry edit lands in `navigation-config.ts`; every criterion oracle is
click-through (D-10). **Warning sign:** a diff touching `components/modern-nav/` for anything
other than classification records.

### Pitfall 2: The audit as current-state evidence

**What goes wrong:** decision rows citing F8/F9/F1/F2 as live truth. F8's `/dossiers/create`
half was already false at HEAD (8 cards since April); F1/F2's 401s predate the P92/P93
repairs. **Avoid:** audit findings anchor the register's counts; rows cite fresh derivations.

### Pitfall 3: grep wrapper + pipe exit codes on zero-claims

**What goes wrong:** `grep` here is a ugrep wrapper honoring .gitignore (blind to ignored
trees), and piping grep into `head`/`wc` makes `$?` the pipe tail's exit. A false zero closes
D-07 wrongly. **Avoid:** `command grep`, unpiped for exit semantics, positive control in the
same gate, absolute paths (cwd resets between calls).

### Pitfall 4: Empty-state-only create ≠ create affordance

**What goes wrong:** a sweep greps `onCreate` and declares 8/8 done. Seven pages wire it only
into `ListEmptyState`; with rows present nothing renders. **Avoid:** the NAV-03 oracle asserts
the affordance with DATA PRESENT (the audit's own grading condition).

### Pitfall 5: Playwright paths are filters

**What goes wrong:** ≥2 spec paths where one doesn't match silently drops the rest, exit 0.
**Avoid:** gates assert spec-file existence first and hardcode expected counts [inherited —
project memory].

### Pitfall 6: Route deletion vs. gates that counted routes

**What goes wrong:** any gate that froze 203 (or P95's 202) goes red on a legitimate deletion,
or worse stays green by accident. **Avoid:** D-08 — run-time derivation or stated delta;
post-close mutations name the gates whose subjects they change (D-11).

### Pitfall 7: New admin nav entries leak into the palette for non-admins

**What goes wrong:** `CommandPalette.tsx:522` hardcodes `isAdmin=true`; entries added to the
administration group become palette commands for everyone. **Avoid:** name it in the affected
decision rows; whether to fix the hardcode is a planner ruling, not a silent drive-by.

## State of the Art (in-repo)

| Old Approach                                                     | Current Approach                                                      | When Changed                  | Impact                                                                                                                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EO as first-class `dossiers.type` + extension table              | `persons.person_subtype='elected_official'`                           | migrations `20260202000001/2` | all NAV-01 mechanisms filter persons by subtype                                                                                                                            |
| Legacy `Sidebar`/nav via modern-nav concept                      | `navigation-config.ts` + `layout/Sidebar.tsx` (Phase 36 shell-chrome) | Phase 36                      | modern-nav is demo-only; do not resurrect                                                                                                                                  |
| `/dossiers/create` single-form + `DossierTypeSelector` (7 types) | `CreateDossierHub` 8-card grid → per-type wizards                     | `70e773a3b` (2026-04-18)      | NAV-01 create surface already done; `DossierTypeSelector.tsx` (7 types) is now a NON-surface for criterion 1 — verify it has no live create-path consumer before citing it |
| `/monitoring` proxied away by Vite                               | KEEP + API moved to `/api/monitoring` (dev/test-guarded)              | P95 `RULING-P95-01`           | nav-entry decision inherits a prod-degraded data path                                                                                                                      |

## Validation Architecture

> **CORRECTED 2026-08-17 (`RULING-P97-11`), two occurrences.** Classified per occurrence by the
> ruling's test — _does this sentence HAND someone a command, or RECORD one that was observed?_
> **Both are PRESCRIPTIONS**: the "Quick run command" row and the "Per task commit" sampling
> line each hand a command to a downstream reader (this section is what `97-VALIDATION.md` was
> derived from, so the wrong literal propagated once already). Neither records an observation,
> so neither is protected as evidence.
> Both said `--filter frontend`, which matches **no package** (`intake-frontend`) and exits **0
> for any input**. The typecheck form took a second fix: `intake-frontend` has **no `typecheck`
> script** — it is `type-check` — so correcting only the package name would have produced
> `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`.

### Test Framework

| Property           | Value                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4 (unit, `frontend/`) + Playwright (`@playwright/test`, root)                                                                                                 |
| Config file        | `playwright.config.ts` (root; baseURL `http://localhost:5173`, storageState projects blocked by E2ECRED-01 → use `--no-deps`), frontend Vitest config in `frontend/` |
| Quick run command  | `pnpm --filter intake-frontend exec vitest run src/pages/dossiers/__tests__/CreateDossierHub.test.tsx` (existing 8-card pin)                                         |
| Full suite command | `pnpm exec playwright test tests/e2e/97-*.spec.ts --project=chromium-en --no-deps` (after specs exist)                                                               |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                                                                                                                                | Test Type                          | Automated Command                                                                                                                                                               | File Exists? |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| NAV-01 | EO entry in live sidebar clicks through to `/dossiers/elected-officials`; hub card + compare option + create hub card each reach their page; EO create SUBMITS to a detail page         | e2e (inline auth, natural network) | `pnpm exec playwright test tests/e2e/97-elected-officials-reachable.spec.ts --project=chromium-en --no-deps`                                                                    | ❌ Wave 0    |
| NAV-02 | Each `/settings/*` child renders BOTH a nav affordance and its content; `/settings` index still renders SettingsPage; global sidebar absent throughout subtree                          | e2e + unit (predicate)             | `pnpm exec playwright test tests/e2e/97-settings-nav.spec.ts --project=chromium-en --no-deps`                                                                                   | ❌ Wave 0    |
| NAV-03 | Digests tab visible in engagement workspace and clicking it mounts DigestsTab; each of the 8 list pages shows a create affordance WITH rows present, and it reaches the create route    | e2e                                | `pnpm exec playwright test tests/e2e/97-digests-tab.spec.ts tests/e2e/97-list-create-affordances.spec.ts --project=chromium-en --no-deps` (gate asserts both files exist FIRST) | ❌ Wave 0    |
| NAV-04 | Every KEEP row's nav entry clicks through to a rendering page; every DELETE row's path is absent from regenerated `routeTree.gen.ts`; `services/auth.ts` absent + typecheck/build green | e2e + script gate                  | e2e spec + `command grep` derivations with controls, unpiped exit codes                                                                                                         | ❌ Wave 0    |

Manual-only: none required; RTL/pixel verification stays an operator park (D-12 — no visual
baselines committed).

### Sampling Rate

- **Per task commit:** `pnpm --filter intake-frontend type-check` + the touched unit spec.
- **Per wave merge:** the wave's 97-\* Playwright specs against the running dev stack (`pnpm dev`, frontend :5173, backend PORT=5001).
- **Phase gate:** all 97-\* specs green from a drilled-red baseline (both-direction drill per D-11), full `pnpm lint` (i18n namespace check + bootstrap parity run there).

### Wave 0 Gaps

- [ ] `tests/e2e/97-elected-officials-reachable.spec.ts` — NAV-01 (incl. the EO create-submit leg)
- [ ] `tests/e2e/97-settings-nav.spec.ts` — NAV-02 (iterate the 6 child routes; hardcode 6)
- [ ] `tests/e2e/97-digests-tab.spec.ts` + `tests/e2e/97-list-create-affordances.spec.ts` — NAV-03 (hardcode 8 pages; data-present precondition)
- [ ] `tests/e2e/97-nav04-rows.spec.ts` — NAV-04 click-throughs for KEEP rows
- Framework install: none (all present).

## Security Domain

| ASVS Category         | Applies                                                                              | Standard Control                                                                                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no (no auth changes; `services/auth.ts` deletion REMOVES a latent dual-store hazard) | —                                                                                                                                                                                                                                                                                                                               |
| V3 Session Management | no                                                                                   | —                                                                                                                                                                                                                                                                                                                               |
| V4 Access Control     | **yes — as a documentation duty**                                                    | Nav visibility is NOT authorization: `adminOnly`/isAdmin gating is client-side; admin ROUTES remain URL-reachable regardless of nav entries, and `CommandPalette.tsx:522` hardcodes isAdmin=true. Decision rows must not claim a nav entry (or its absence) provides access control. Server-side authz is P100's RLS territory. |
| V5 Input Validation   | yes (existing)                                                                       | compare/search params already validated via TanStack `validateSearch`; widened unions keep the whitelist shape (`compare.tsx:38-45`)                                                                                                                                                                                            |
| V6 Cryptography       | no                                                                                   | —                                                                                                                                                                                                                                                                                                                               |

Known threat patterns: none introduced — no new data paths, no new inputs beyond a whitelisted
enum value. User-facing errors on newly exposed surfaces reuse the P93 query-error/empty
family (no internals leaked — the `INTERNAL_STRING` regex pattern from
`95-monitoring-mounts.spec.ts` is the reusable leak oracle).

## Project Constraints (from CLAUDE.md)

- Design: tokens only (`var(--*)`/mapped utilities), no raw hex, no Tailwind palette literals;
  borders `1px solid var(--line)`; no card shadows; no gradients; radii 6/8/12; `.btn-primary`/
  `.btn-ghost` only; row heights `var(--row-h)`; read order `frontend/DESIGN.md` →
  `design-system/CLAUDE.md` → closest component.
- RTL: logical properties only (`ms-*`, `ps-*`, `text-start`); flip directional icons via
  `isRTL ? 'rotate-180' : ''`; ESLint errors on physical classes.
- i18n: static bundle; colon-form keys; new/changed keys in BOTH `src/i18n/{en,ar}` same
  commit; `public/locales` is DEAD; unregistered ns falls back EN in both languages.
- No emoji, no marketing voice, sentence case.
- Code style: no semicolons, single quotes, explicit return types, no `any`, strict booleans;
  per-directory filename case (components PascalCase, `ui/**` + `lib/**` kebab-case,
  hooks camelCase).
- `routeTree.gen.ts` is generated — never hand-edit; commit regenerated same-commit.
- GSD is the sole workflow layer; migrations only via Supabase MCP (none needed this phase).
- Environment: zsh no-word-split; no `timeout` binary; absolute paths in commands; pre-commit
  build hook (`.planning/`-only commits skip it); Bundle Size Check required in CI.

## Environment Availability

| Dependency                                                               | Required By                                                | Available                                               | Version | Fallback                                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Node ≥ 22 / pnpm 10.29.1                                                 | build, tests                                               | ✓ (project baseline)                                    | —       | —                                                                                   |
| Dev stack `:5173` (+ backend `:5001`)                                    | click-through oracles                                      | start per plan (`pnpm dev`; PORT=5001 to dodge AirPlay) | —       | —                                                                                   |
| `.env.test` TEST_USER_EMAIL/PASSWORD                                     | inline e2e auth                                            | ✓ (P95/P96 specs consume it)                            | —       | none — but E2ECRED-01 storage-state remains parked and MUST NOT be waited on (D-12) |
| Playwright browsers                                                      | e2e                                                        | ✓ (P92–P96 ran)                                         | —       | —                                                                                   |
| Supabase staging `zkrcjzdemdmwhearhfgg`                                  | live `dossiers_type_check` re-derivation, EO create submit | ✓                                                       | PG 17   | repo-migration derivation already done here                                         |
| `scripts/gate-drill.mjs`, `scripts/c9b-sweep.sh`, `GATE-STANDARD-P92.md` | D-11                                                       | ✓ all on disk                                           | —       | —                                                                                   |

**Missing with no fallback:** none.

## Assumptions Log

| #   | Claim                                                                                                                                                                             | Section | Risk if Wrong                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| A1  | The EO create wizard SUBMIT works end-to-end today (render verified; submit success has no artifact)                                                                              | NAV-01  | Nav exposure would point at a broken flow — condition 8 REJECT territory; mitigated by the Wave-0 e2e submit leg |
| A2  | `/admin/data-retention` + `/admin/field-permissions` 401s are repaired by P92/P93 (spec `93-admin-surfaces-error.spec.ts` exists; not re-run this session)                        | NAV-04  | KEEP rows would link degraded pages without naming it; rows cite execution-time behaviour                        |
| A3  | `EngagementsListPage`/persons/topics page components expose no visible create button with data present (audit F9 says so; component internals not read line-by-line this session) | NAV-03  | Affordance count off by one; the data-present oracle catches it either way                                       |
| A4  | The staging DB's live `dossiers_type_check` matches the repo migration chain (7 values)                                                                                           | NAV-01  | An 8-value live check would permit a first-class EO row path; execution re-derives via `pg_get_constraintdef`    |

## Open Questions

1. **Where does the `/monitoring` nav entry live in the live nav's 3-group taxonomy?**
   Known: groups are operations/dossiers/administration; monitoring is admin-flavoured but its
   audience is ambiguous. Recommendation: administration group (adminOnly), decision row names
   the prod-degraded data state and the palette-propagation wrinkle. Planner discretion (D-06).
2. **DELETE vs nav-entry for `ai-usage`, `preview-layouts`, `/admin/approvals`.** Evidence
   gathered (render OK, zero inbound, `/admin/approvals` shadowed by the DIFFERENT top-level
   `/approvals` nav target) supports either branch per route; genuinely underdetermined rows
   are PARKED per policy, not guessed here. Note `preview-layouts` is referenced by name in
   the EO-era plans (Phase 30-32 tooling) — check for a developer-tool ownership claim before
   deleting.
3. **Does NAV-03's affordance land as a shared `ListPageShell.actions` prop or per-page
   `PageHeader actions`?** Both are one-edit-per-page either way given the shell
   heterogeneity; the EO PageHeader pattern is the closest existing component. Planner call.

## Sources

### Primary (HIGH confidence — derived from the tree at HEAD `9c32c4db1` this session)

- `frontend/src/components/layout/navigation-config.ts`, `Sidebar.tsx`, `AppShell.tsx` — live nav chain
- `frontend/src/components/modern-nav/*` + `routes/modern-nav-standalone.tsx` — demo-only proof (consumer sweep)
- `frontend/src/lib/dossier-routes.ts`, `dossier-type-guards.ts`, `pages/dossiers/CreateDossierHub.tsx` (+ its test), `DossierListPage.tsx`, `routes/_protected/compare.tsx`, `components/entity-comparison/EntityComparisonSelector.tsx`, `hooks/useEntityComparison.ts` — NAV-01 surfaces
- `supabase/migrations/20260118000001`, `20260202000001/2`, `20260417000001` — EO schema history
- `frontend/src/routes/_protected/settings.tsx`, `pages/settings/SettingsPage.tsx`, `components/settings/SettingsLayout.tsx` — NAV-02
- `frontend/src/components/workspace/WorkspaceTabNav.tsx`, `routes/_protected/engagements/$engagementId/*` — NAV-03
- `frontend/src/routeTree.gen.ts` (8 admin paths; 203-route count via the P95 instrument), `routes/_protected/admin/*` — NAV-04
- `frontend/src/services/auth.ts` + unpiped zero-importer derivation with positive control
- `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md`, `95-RESEARCH.md:679` — `/monitoring` record + route-count instrument
- `tests/e2e/95-monitoring-mounts.spec.ts`, `playwright.config.ts` — oracle pattern

### Secondary (MEDIUM confidence)

- `.planning/audits/live-audit-2026-08-15/dossiers.md` (F8/F9), `adminops.md` — register-count anchors; **known partially stale** (F8 create-hub half disproven at HEAD)

### Tertiary

- none (no WebSearch used; no external docs needed — zero new dependencies)

## Metadata

**Confidence breakdown:**

- NAV-01 representation + surfaces: HIGH — schema chain + generated types + per-surface reads
- NAV-02 consumer set: HIGH — three quote-form sweeps + liveness checks on every candidate
- NAV-03 population: HIGH — audit F9 cross-checked against code (empty-state-only wiring confirmed)
- NAV-04 nav-source split: HIGH — consumer sweeps both directions; MEDIUM only on current render state of the two audit-BROKEN admin pages (A2)

**Research date:** 2026-08-17
**Valid until:** phase execution (same milestone; the tree moves — re-derive zeros and counts at execution per D-07/D-08/D-09)
