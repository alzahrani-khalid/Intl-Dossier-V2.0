# Dossier Workflows Round 16 Inspection - Cross-Dossier Entry and Navigation

Branch: `quick/260608-c9b`  
Date: 2026-06-10  
Mode: inspector, source read-only  
Live target: Supabase staging `zkrcjzdemdmwhearhfgg`

## Prior-State Guard

Read `reports/fanout-loop-state.json` before inspecting. Top-level status is ROUND 15 complete; the state says the safe unattended surface was exhausted after R15 and the remaining deferred work is phase-sized bucket B: R6-03 New Position contract, R14-02 engagement Positions tab, R13-02/R14-03 host-org/person-engagements, and legacy person/EO raw-key debt. I did not re-report those items.

Also treated `reports/search-workflow-inspection-2026-06-09.md` as prior coverage for the search result schema/RPC problems: `/search` shape mismatch, `dossier_first` absent, quickswitcher work-item schema mismatches, swallowed error state, and unused `quickswitcher_search_v2`.

## Live Verification Snapshot

- `quickswitcher-search` edge exists and returned HTTP 200 with envelope keys `dossiers`, `related_work`, `query`, `took_ms`, and `cache_hit`; known dossier-name probes returned zero results, which is prior search-edge coverage, not refiled here. Source edge returns those keys at `supabase/functions/quickswitcher-search/index.ts:466-476`.
- `/search` edge exists and returned HTTP 200 with envelope keys `results`, `counts`, `query`, `took_ms`, `warnings`, and `metadata`; known dossier-name probes returned zero results, already covered by the prior search report. Source edge result envelope is `supabase/functions/search/index.ts:485-492`.
- `quickswitcher_search_v2` RPC exists in generated types at `frontend/src/types/database.types.ts:37165-37168`; a live call returned PostgreSQL error `42703` for `p.dossier_id`. That RPC remains unused by the inspected global-search flow, which calls the quickswitcher edge at `frontend/src/domains/dossiers/repositories/dossiers.repository.ts:203-209`.
- Live `dossiers.type` values are exactly the seven DB types: `country`, `engagement`, `forum`, `organization`, `person`, `topic`, and `working_group`.
- Live create-edge validation accepts those seven type values and rejects `elected_official` with HTTP 400 `VALIDATION_ERROR`; edge type allow-list is `supabase/functions/dossiers-create/index.ts:6-16`.

## Findings

### R16-01 - Medium - Bucket A - Command-palette create actions route to inert list URLs

Evidence:

- Generic create command navigates to `/dossiers?action=create` at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:599-603`.
- Type-specific create commands navigate to list URLs with `?action=create` at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:621-667`.
- The real create entrypoint cards route to `/dossiers/${getDossierRouteSegment(type)}/create` at `frontend/src/pages/dossiers/CreateDossierHub.tsx:109-113`.

Broken contract:
Entry/navigation flows into dossier creation should open the new-dossier wizard. The command palette instead lands on list pages with an ignored query parameter, bypassing `CreateDossierHub` and the per-type create routes.

UI failure signature:
From Cmd+K, selecting "Create New Dossier" or "Create Country/Organization/..." closes the palette and opens a dossier list page. No create wizard appears, no type selector appears, and the URL carries inert `?action=create`.

Bucket:
Bucket A. This is route-string/navigation polish in one component; no edge, DB, migration, or product-contract decision is required.

### R16-02 - Medium - Bucket A - Elected-official create lands on generic person detail shell

Evidence:

- Elected-official create route explicitly exists at `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx:29-48`.
- Its comment says it submits to the persons endpoint with `DossierType='person'` and `person_subtype='elected_official'` at `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx:7-9`.
- The elected-official wizard config sets `type: 'person'` and subtype defaults at `frontend/src/components/dossier/wizard/config/person.config.ts:163-166` and `frontend/src/components/dossier/wizard/defaults/index.ts:68-77`.
- Shared create success routing uses the returned DB type, not the initiating wizard route, at `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts:118-123`.
- The elected-official detail shell is real and distinct, with EO-specific sections, at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:5-8` and `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:23-27`.

Broken contract:
The elected-official entry flow presents a dedicated EO wizard and route, but successful creation navigates with returned DB type `person`, producing `/dossiers/persons/:id` instead of `/dossiers/elected-officials/:id`.

UI failure signature:
Creating an elected official from `/dossiers/elected-officials/create` succeeds but opens the generic Person dossier shell. EO-specific navigation, including the elected-official route sections, is skipped until the user manually changes the URL.

Bucket:
Bucket A. The DB contract is correct: `elected_official` is not a DB dossier type, and the live create edge rejects it. The fix is a route override/on-success target for this wizard path, not a migration.

### R16-03 - Low - Bucket A - Breadcrumb nav accessibility label is hardcoded English

Evidence:

- The dossier breadcrumb nav uses `aria-label="Breadcrumb"` at `frontend/src/components/dossier/DossierShell.tsx:139-142`.
- The visible hub label is localized through `t('header.dossierHub')` at `frontend/src/components/dossier/DossierShell.tsx:150-155`, with English and Arabic keys at `frontend/src/i18n/en/dossier-shell.json:17` and `frontend/src/i18n/ar/dossier-shell.json:17`.
- RTL chevrons use `icon-flip` at `frontend/src/components/dossier/DossierShell.tsx:149` and `frontend/src/components/dossier/DossierShell.tsx:156`; the RTL flip rule exists at `frontend/src/styles/list-pages.css:863-865`.

Broken contract:
Breadcrumb labels should localize for EN/AR. The visible breadcrumb text localizes, but the screen-reader label remains English on Arabic pages.

UI failure signature:
In Arabic locale, assistive technology announces the breadcrumb landmark as "Breadcrumb" instead of an Arabic label, while the visible hub crumb correctly shows Arabic text.

Bucket:
Bucket A. This is a one-string localization fix.

## Surface Results

### 1. Global Search -> Dossier

No new finding for dossier-result routing.

Trace:

- Sidebar/top-bar search uses the localized placeholder `t('search.quickSearch')` and navigates submitted text to `/search?q=...` at `frontend/src/components/layout/SidebarSearch.tsx:123-143` and `frontend/src/components/layout/SidebarSearch.tsx:50-57`.
- The shell search placeholder is localized in English and Arabic at `frontend/src/i18n/en/common.json:1263-1266` and `frontend/src/i18n/ar/common.json:1263-1266`.
- Command palette search binds the query to `useQuickSwitcherSearch` at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:437-447` and `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:966-973`.
- Quick-switcher data flows through `useQuickSwitcherSearch` at `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts:143-152`, then to the repository edge call at `frontend/src/domains/dossiers/repositories/dossiers.repository.ts:203-209`.
- The quickswitcher edge searches seven DB dossier types at `supabase/functions/quickswitcher-search/index.ts:24-34` and returns dossier plus related-work groups at `supabase/functions/quickswitcher-search/index.ts:466-476`.
- Dossier result clicks call `handleDossierSelect` and navigate to the returned URL at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:885-899`.
- `handleDossierSelect` builds the detail URL with `getDossierDetailPath(dossier.id, dossier.type)` at `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts:183-196`; route segments are type-aware through `getDossierRouteSegment` at `frontend/src/lib/dossier-routes.ts:12-21` and `frontend/src/lib/dossier-routes.ts:30-46`.
- Empty state exists at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:982-988`; localized quickswitcher labels exist in `frontend/src/i18n/en/quickswitcher.json:1-54` and `frontend/src/i18n/ar/quickswitcher.json:1-54`.

Already covered, not refiled:
The edge/RPC result quality and error-state gaps are prior search-report findings.

### 2. Dashboard Drawer Deep-Link

No new finding.

Trace:

- `/dashboard?dossier=<id>&dossierType=<type>` search params are validated at `frontend/src/routes/_protected.tsx:14-38`; invalid or missing `dossierType` is stripped to `undefined`.
- The global drawer mount is inside the protected layout at `frontend/src/routes/_protected.tsx:94-99`.
- `useDossierDrawer` considers the drawer open when `dossier` exists and returns `dossierType` as `null` when missing after validation at `frontend/src/hooks/useDossierDrawer.ts:31-35` and `frontend/src/hooks/useDossierDrawer.ts:61-67`.
- `DossierDrawer` returns `null` for missing/invalid `dossierType`, so bad deep-links degrade to no drawer instead of a crash at `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx:78`.
- Drawer preview sections load by dossier id through fixed include sections at `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx:30-48`; `dossierType` controls navigation, not section fetching.
- Open-full-dossier uses `getDossierDetailPath(dossierId, dossierType)` at `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx:42-45`.

Already covered, not refiled:
Dashboard cards that lack reliable `dossierType` propagation, especially the Overdue Commitments fallback, are in the existing bucket-B dashboard backlog.

### 3. Create-Dossier Wizard Per Type

Findings: R16-01 and R16-02.

Trace:

- `DossierTypeSelector` defines the seven DB types only at `frontend/src/components/dossier/DossierTypeSelector.tsx:58-66`; runtime entry currently uses `CreateDossierHub`, whose type list includes the seven DB types plus the EO subtype route at `frontend/src/pages/dossiers/CreateDossierHub.tsx:41-64`.
- The hub links each card to the real per-type create route using `getDossierRouteSegment` at `frontend/src/pages/dossiers/CreateDossierHub.tsx:109-113`.
- Seven DB-type create routes submit the expected DB type through config: countries at `frontend/src/routes/_protected/dossiers/countries/create.tsx:24-42`, organizations at `frontend/src/routes/_protected/dossiers/organizations/create.tsx:24-42`, forums at `frontend/src/routes/_protected/dossiers/forums/create.tsx:24-42`, engagements at `frontend/src/routes/_protected/dossiers/engagements/create.tsx:26-45`, topics at `frontend/src/routes/_protected/dossiers/topics/create.tsx:23-40`, working groups at `frontend/src/routes/_protected/dossiers/working-groups/create.tsx:24-42`, and persons at `frontend/src/routes/_protected/dossiers/persons/create.tsx:24-42`.
- Shared submit sends `type: config.type` plus filtered extension data at `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts:80-91`.
- The create edge allow-list and required extension checks are at `supabase/functions/dossiers-create/index.ts:6-25` and `supabase/functions/dossiers-create/index.ts:137-161`.
- Edge extension-table mapping covers all seven DB types at `supabase/functions/dossiers-create/index.ts:293-304`.

Live edge verification confirms the seven DB types are accepted by type validation and `elected_official` is rejected as non-DB type. The elected-official wizard correctly submits `person + person_subtype`, but R16-02 covers its post-create route target.

### 4. Dossier Breadcrumb / Hub Navigation

Finding: R16-03 only.

Trace:

- Breadcrumb renders in every `DossierShell` route at `frontend/src/components/dossier/DossierShell.tsx:139-160`.
- The hub crumb targets `/dossiers` at `frontend/src/components/dossier/DossierShell.tsx:150-155`.
- `/dossiers` is a real protected route at `frontend/src/routes/_protected/dossiers/index.tsx:13-14`.
- Visible hub label is localized EN/AR at `frontend/src/i18n/en/dossier-shell.json:17` and `frontend/src/i18n/ar/dossier-shell.json:17`.
- Shell direction is derived from i18n and applied at `frontend/src/components/dossier/DossierShell.tsx:126-128`; breadcrumb chevrons use RTL flipping as noted in R16-03.

## Bucket Summary

New bucket A findings: R16-01, R16-02, R16-03.  
New bucket B findings: none.

The remaining pre-existing bucket-B backlog from the fanout state should be escalated into GSD phases after any desired small bucket-A navigation polish from this round.

---

## Round-16 Fix Outcomes (Claude, 2026-06-10)

All 3 bucket-A findings FIXED + live-verified (build green, lint clean). Fresh
cross-dossier ground validated the pivot — these are real navigation bugs the
per-type rounds never reached.

- **R16-01 FIXED + verified** — the command palette's 8 create-dossier actions
  navigated to `/dossiers[/<seg>]?action=create` (list pages with an ignored
  query param). Re-pointed: generic "Create New Dossier" → `/dossiers/create`
  (the type-selector hub); each type-specific → `/dossiers/<segment>/create`.
  Live-verified all three target routes render real wizards: hub shows the type
  selector, `/dossiers/countries/create` shows "New Country Dossier · Step 1 of
  3", `/dossiers/elected-officials/create` shows "Create Elected Official · Step
  1 of 4". (The non-dossier create commands — positions/commitments/intake — were
  left untouched; out of scope and not flagged.)
- **R16-02 FIXED** — added an optional `detailRouteSegment` to `WizardConfig`;
  `useCreateDossierWizard` navigates to `/dossiers/<detailRouteSegment>/<id>`
  when set (else derives from the returned DB type). Set
  `detailRouteSegment: 'elected-officials'` on `electedOfficialWizardConfig` so
  EO create (submitted as DB type `person`) lands on the EO shell, not the
  generic person detail. Plain-person config is unaffected (no override). Build-
  verified; the EO detail route is known-good (seeded EO renders there).
- **R16-03 FIXED + verified** — breadcrumb `nav aria-label="Breadcrumb"` was
  hardcoded English. Switched to `t('header.breadcrumb')`; added the key EN
  ("Breadcrumb") / AR ("مسار التنقل"). Live-verified: in Arabic the nav landmark
  now announces "مسار التنقل".

Surfaces 1 (global search → dossier) and 2 (dashboard drawer deep-link) traced
clean — invalid `dossierType` degrades gracefully, routing uses
`getDossierDetailPath`/`getDossierRouteSegment` per type. Search edge/RPC result
quality remains prior search-report coverage.

Deploys: none (frontend-only). No new bucket-B.
