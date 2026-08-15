# Phase 93: Failure Visibility - Research

**Researched:** 2026-08-15
**Domain:** Frontend error propagation (TanStack Query v5 / React 19), TanStack Router not-found, Supabase Edge Function error contracts, Postgres RLS policy rewrites
**Confidence:** HIGH (all claims re-derived against the working tree at `milestone/v10.0-trust` HEAD `5c940ac6` or cited from the live-staging evidence in `PARK-P93.md` / `RULING-P93-01-PARKS.md`)

Every count in this document states its **population definition** (search root, glob, matching rule)
and **what falls outside it**. A count without its definition is a finding, not a fact (D-18).

---

<user_constraints>

## User Constraints (from 93-CONTEXT.md)

### Locked Decisions (D-01..D-20 — normative sentences verbatim; full text + tables in `93-CONTEXT.md`)

- **D-01:** Repositories propagate rejections by DELETING the swallow, not by introducing a result
  union. Logging may stay; the `return` must go.
- **D-02:** The `TRUST-01` population is defined as — every `catch` block on the frontend data path
  that converts a rejected request into a plausible SUCCESS value. **`6` is the count of the defect;
  `12` is the count of the shape.** The scan matched `catch (…) {` blocks only. Research must widen
  it and restate the number; `6` is a floor. (Widened below — §TRUST-01.)
- **D-03:** One shared query-error component, reused across every surface this phase touches — not
  bespoke error markup per page.
- **D-04:** The error state is bilingual, announced (`role="alert"`), and internal-string-free.
  Visual specification lives in `93-UI-SPEC.md`.
- **D-05:** A failed request and an absent record are different states with different renders. They
  must not share a component.
- **D-06:** Not-found reuses TanStack Router's `notFound()`. (Precedent claim corrected below —
  §Criterion 3 — the DECISION stands.)
- **D-07:** `TRUST-04`'s degraded state is NAMED, not blank. The engagement extension table is
  `engagement_dossiers`; a missing row there is the condition to detect.
- **D-08:** No server-originated `error.message` reaches the user; the 37-site population is NOT the
  defect count — research must partition it and state both halves. (Partitioned below — §Criterion 5.)
- **D-09:** `DR-42501`'s filed diagnosis is WRONG and the corrected one governs: the real cause is
  the `data_retention_policies` RLS policy evaluating `EXISTS (SELECT 1 FROM auth.users …)`. **The
  fix is a policy rewrite, not a handler change.**
- **D-10:** Scope of the policy fix — the 4 policies this phase's criteria exercise
  (`data_retention_policies` ×1, `tag_categories` ×2, `entity_tag_assignments` ×1), each replacing
  the whole predicate with the project's unified authz read — `public.users.role` keyed on
  `auth.uid()` — with the `raw_*_meta_data` reads DELETED. Migrations via `apply_migration` only.
- **D-11:** The class is 15 policies over 13 tables; the residual 11 are `RLS-AUTHUSERS-01` →
  Phase 100. 15 is a lower bound (SECURITY DEFINER / view indirection unsearched).
- **D-12:** `GRANT SELECT ON auth.users` is REFUSED, and a gate enforces the refusal: assert
  `SELECT` on `auth.users` is granted to no role beyond `postgres`.
- **D-13:** `DELEG-01` is closed as VISIBILITY ONLY; the repoint is `DELEG-02` → Phase 102. After
  this phase `/delegations` visibly ERRORS until Phase 102 lands — the intended outcome.
- **D-14:** `AUDIT-42703` targets `public.audit_log` (75 rows, live trigger writers — the ruling's
  condition is DISCHARGED). Handler remapped onto the real columns; `user_email`/`user_role` joined
  from `public.users` or dropped; `audit_statistics` replaced by an aggregate over `audit_log`.
- **D-15:** The `audit-logs-viewer` internal-string leak is fixed unconditionally.
- **D-16:** `PIN-2390-01` — bump both helpers and redeploy the six importers; the closing derivation
  widens from `--include='index.ts'` to `--include='*.ts'`.
- **D-17:** `GATE-STANDARD.md` C1–C10 including C9a governs every gate, from authoring. Both
  directions observed per gate via `scripts/gate-drill.mjs`.
- **D-18:** Every closing derivation states its POPULATION DEFINITION and what falls outside it.
- **D-19:** Behavioural criteria carry behavioural oracles; producers are ordered before consumers
  (C9a positive controls for cross-plan artifacts).
- **D-20:** No oracle may depend on the e2e `setup` project. Playwright `--no-deps` plus inline auth.

### Claude's Discretion (verbatim)

Plan decomposition and task ordering; the internal shape of the shared error component; whether the
`audit_log` remap lands as one task or two; how the gate-drill evidence table is laid out. Visual
design of the error/not-found/degraded states belongs to `93-UI-SPEC.md`, not to discretion.

### Deferred Ideas (OUT OF SCOPE — verbatim summary)

- **`RLS-AUTHUSERS-01` → Phase 100** — the residual 11 `auth.users`-referencing RLS policies, with
  the full enumeration, exclusions, fail-closed finding, and the explicit grant refusal.
- **`DELEG-02` → Phase 102** — which relation `my-delegations` reads, decided beside `SEED-DELEG-01`.
- **`backend/src/services/auth.service.ts:847` (`logSecurityEvent`)** — filed as `AUDIT-DROP-01`
  (Phase 94 in the traceability table), NOT folded into this phase unless a ruling folds it in.
- **Production verification** — staging only; the droplet is untouched.
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID          | Description                                                                                                 | Research Support                                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRUST-01    | Data layer distinguishes rejected query from empty result; repositories stop catch-and-returning            | §TRUST-01: widened population (6 defect sites confirmed, plus 3 non-catch swallow classes the scan cannot see), per-site consumer blast radius, per-transport fix shape                         |
| TRUST-02    | Four audited surfaces render error instead of confident emptiness                                           | §Criterion 2: per-surface break diagnosis (field-permissions `= []` mask; data-retention 6-hook mask over a policy-42501 500; Tag Analytics stub-shape inverse defect; attachments `= []` mask) |
| TRUST-03    | Well-formed-but-absent ID renders page-level not-found on dossier detail, engagement detail, report builder | §Criterion 3: loader/hook per route, `notFound()` mechanics verified against TanStack Router docs, seam recommendation per route                                                                |
| TRUST-04    | Engagement missing its extension row renders a named degraded state; no internal strings leak               | §Criterion 4: detection mechanism (`get_engagement_full` collapses the case into 404 today), WorkspaceShell render seam; §Criterion 5 for the leak rule                                         |
| DELEG-01    | `my-delegations` stops swallowing 42P01; `/delegations` renders error state                                 | §DELEG-01: exact swallow sites (`index.ts:197,233` region), fix shape, existing Phase-92 UI error state + spec reused as oracle                                                                 |
| DR-42501    | `data-retention` surface unblocked by policy rewrite                                                        | §DR-42501: migration shape for the 4 policies, recursion analysis (verified-safe precedent), anti-grant gate mechanics                                                                          |
| AUDIT-42703 | `audit-logs-viewer` reads real columns; statistics from `audit_log` aggregate; leak fixed                   | §AUDIT-42703: column-by-column field map, RLS note, aggregate replacement, leak site                                                                                                            |
| PIN-2390-01 | Both 2.39.0 helpers bumped; six importers redeployed; derivation widened                                    | §PIN-2390-01: both sites re-verified in tree, importer list re-derived (5+1), widened closing command                                                                                           |

</phase_requirements>

---

## Summary

This phase is **deletion, one shared component, three edge-function repairs, one 4-policy migration,
and two helper bumps** — almost nothing new is built. The transport layer already throws
(`lib/api-client.ts:101-106` `handleResponse` → `toApiError`; `ApiError` carries `.status` at
`lib/api-client.ts:34-44`), TanStack Query already routes rejections to `isError`, the `/delegations`
error state already shipped in Phase 92 (`pages/delegations/DelegationManagementPage.tsx:215-217`,
`role="alert"`, em-dash stat figures), and a working live oracle (`scripts/probe-edge-auth.sh`) and a
forced-error Playwright template (`tests/e2e/92-delegations-error.spec.ts` — inline auth, `--no-deps`,
CDP `Network.setBlockedURLs`, 15s retry-ladder budget) already exist.

The dangerous part of this phase is not the code; it is three traps this research pins precisely:
(1) **deleting a swallow can move the lie one layer up, not remove it** — `DossierListPage` renders
seven zero-cards from `typeStatsMap?.[type] ?? {count: 0…}` when the counts query rejects, and
`useWidgetDashboard`'s `widgetData` aggregation discards `isError` entirely, so widget rejections
(which ALREADY happen today — the KPI/chart/events fetchers already throw) still render zeros;
(2) **two of the six swallows sit over supabase-js, which never throws** — deleting the `catch` in
`fetchStatsSummary` changes nothing unless each result's `.error` is checked and thrown; and
(3) **the database itself proposes the exploit** for DR-42501 (`HINT: GRANT SELECT ON auth.users…`) —
the anti-grant gate is mandatory per `RULING-P93-01 ADDENDUM 1`.

**Primary recommendation:** land the shared `QueryErrorState` + i18n keys first (Wave 0, every other
surface consumes it), fix each criterion-2 surface by pairing the swallow-deletion with the consumer's
error branch **in the same task** (never split them across plans without a C9a control), use the
`is_platform_admin(auth.uid())` SECURITY DEFINER helper (or the byte-identical inline
`EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role …)` precedent already live on
`field_permissions`) for the policy rewrites, and close every render-state criterion with an
inline-auth `--no-deps` Playwright spec plus `scripts/probe-edge-auth.sh` for the three edge functions.

---

## Architectural Responsibility Map

| Capability                             | Primary Tier                                                                          | Secondary Tier                                           | Rationale                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Rejection propagation (TRUST-01)       | Frontend data layer (repositories/hooks)                                              | —                                                        | The swallow lives in `queryFn` bodies; transport already throws                                  |
| Error-state render (TRUST-02, D-03)    | Frontend components (`components/error-states/`)                                      | Frontend routes/pages (wiring `isError`)                 | One shared component; pages own which variant where                                              |
| Not-found (TRUST-03)                   | Frontend routing (TanStack Router `notFound()` + root `notFoundComponent`)            | Data layer (404 status must survive to the router seam)  | Absence is a routing concern, not a component style                                              |
| Degraded record (TRUST-04)             | Edge function (`engagement-dossiers` must stop collapsing missing-extension into 404) | Frontend `WorkspaceShell` (renders identity + callout)   | Detection needs the base `dossiers` row, which only the server can distinguish from true absence |
| Internal-string rule (criterion 5)     | Frontend render sites (JSX)                                                           | Edge functions (stop shipping `details` in bodies)       | Both halves needed; neither alone closes it (C9a coherence obligation per CONTEXT)               |
| DELEG-01 / AUDIT-42703 error contracts | Edge functions                                                                        | Frontend (renders the D-03 state)                        | Server must emit real status + bilingual body; client must render i18n copy                      |
| DR-42501                               | Database (RLS policy migration via `apply_migration`)                                 | Edge function untouched; surface observes via live probe | Policy predicate is the defect (D-09); effect observable four layers up                          |
| PIN-2390-01                            | Edge function deploy pipeline (helper bump + 6 redeploys)                             | —                                                        | Deployed bundles re-fetch the deprecated specifier; source fix requires redeploy to matter       |

---

## Project Constraints (from CLAUDE.md)

Directives that bind this phase's plans (root `/CLAUDE.md` + `frontend/CLAUDE.md` + `~/.claude/rules/core.md`):

- **GSD is the sole workflow layer**; migrations only via Supabase MCP `apply_migration`, never ad-hoc
  DDL through `execute_sql`. RLS on every table exposed to end-user clients.
- **User-facing errors never leak internals** (stack traces, SQL, keys); diagnostics go to logs. This
  is criterion 5 restated as a standing project rule.
- **Result-union rule does NOT apply here** — its own second clause ("never mix exceptions and result
  unions within one API") is why D-01 deletes the swallow instead of grafting a union (CONTEXT D-01).
- **Design**: all colors via `var(--*)` tokens / `@theme` utilities; `1px solid var(--line)` borders;
  no card shadows/gradients; radii 6/8/12; `.btn-primary`/`.btn-ghost` only; row heights `var(--row-h)`;
  read `frontend/DESIGN.md` → `frontend/src/design-system/CLAUDE.md` → closest component, in that order.
  `93-UI-SPEC.md` already instantiates all of this for the three states — treat it as the visual contract.
- **RTL**: logical properties only (`ms-*`, `ps-*`, `text-start`); ESLint errors on physical classes.
  `AlertCircle`/`AlertTriangle` are symmetric — no flip cases in the new states (UI-SPEC).
- **i18n**: statically bundled (`src/i18n/index.ts`); `public/locales` is DEAD; colon namespace form
  (`t('common:errors.retry')`); en + ar keys land in the SAME commit; `pnpm lint` runs
  `scripts/check-i18n-namespaces.mjs`.
- **No emoji, sentence case, no marketing voice, no exclamation marks** in any new copy.
- **Copy rule for `t()` second arguments (AR-04a interplay):** new keys authored this phase should be
  added to BOTH locales and referenced WITHOUT English-default second arguments — adding new two-arg
  masks grows Phase 99's population.
- **ESLint filename case**: `components/error-states/` → PascalCase files, kebab-case folder (matches
  UI-SPEC's `components/error-states/QueryErrorState.tsx`); explicit return types; no floating promises.
- **Naming**: no new sequential migrations; `YYYYMMDDHHMMSS_description.sql` or `YYYYMMDD_phase93_description.sql`.
- **Karpathy rules**: surgical changes — do not reformat adjacent code while deleting swallows.

Project skills that bind: `.claude/skills/supabase-migration-safety/SKILL.md` (idempotent DDL,
`DROP POLICY IF EXISTS` before `CREATE POLICY`, verify against live catalog after apply, RLS cannot be
verified through the service-role MCP connection — exercise as an authenticated user) and
`.claude/skills/edge-function-add/SKILL.md` (auth shapes, origin-validated CORS via `_shared/cors.ts`,
deploy via CLI/MCP, `verify_jwt` default true).

---

## TRUST-01 — the widened population and the repair's blast radius

### The widened D-02 scan — method stated

**Population definition:** brace-matched `catch` blocks (regex `catch\s*(\([^)]*\))?\s*\{` +
brace-depth matching, so multiline bodies are read whole) whose body contains `return` and no `throw`,
over `frontend/src/{domains,hooks,services,lib,components,routes,pages}`, `*.ts`/`*.tsx`, excluding
`__tests__` and `*.test.*`. **This adds the `pages` directory, which D-02's original scan did not
list**, and reads whole bodies instead of line-matching. Also scanned, separately: expression-bodied
`.catch(…=>…)` sites; `catch` blocks that assign a fallback without returning; `throwOnError` (0
occurrences repo-wide); `select: (` callbacks containing `catch` (0 of them do); `placeholderData`
(2 sites). [VERIFIED: repo scan, scanner script run 2026-08-15]

**Result: 45 catch-and-return sites (the shape). The defect class remains exactly the 6 sites D-02
names.** Every one of the 33 sites beyond D-02's 12 was triaged OUT, by category:

| Category (OUT — with representative)                                                                                                                                                                                                                                              | Count | Why out                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- |
| localStorage/IndexedDB/sessionStorage reads (`useAdvancedSearch.ts:102`, `SettingsPage.tsx:122`, `AppShell.tsx:109`, `useAutoSaveForm.ts:68,214`, `TourContext.tsx:227,244,261`, `OnboardingTourTrigger.tsx:40,62`, `StepGuidanceBanner.tsx:43`, `CommandPalette.tsx:418`)        | 12    | Not requests; fallback is the correct contract for absent storage |
| JSON-parse / body-parse fallbacks (`useAfterAction.ts:292`, `UserCreatePage.tsx:84`, `DigestCard.tsx:49`, `GenericToolResultCard.tsx:36`, `IntelligencePage.tsx:199`)                                                                                                             | 5     | Parsing a value already in hand, not converting a rejection       |
| Date/value-format fallbacks (`AutoSaveIndicator.tsx:42`, `FormDraftBanner.tsx:46`, `AssignmentDetailsModal.tsx:87`, `ElectedOfficialOfficeCard.tsx:58`, `OverviewTab.tsx:60,74`, `EntityComparisonTable.tsx:116`)                                                                 | 7     | Rendering fallback for a formatting error                         |
| Error surfaced BEFORE return (toast/form-error/validation-stop): `NewPositionDialog.tsx:283,313,327`, `AddToDossierDialogs.tsx:358,373`, `after-actions/$afterActionId.tsx:101`, `engagements/$engagementId/after-action.tsx:95`, `UserCreatePage.tsx:130`, `form-wizard.tsx:206` | 9     | The opposite of the defect — failure is announced                 |
| Explicit failure results / non-render callers: `useBulkActions.ts:271,343`, `usePushSubscription.ts:64`, `push-subscription.ts:96`, `useNotificationCenter.ts:210` (URL-safety guard)                                                                                             | 5     | Caller receives a failure signal or never renders                 |

Expression-bodied `.catch` sites (4): `usePeekPaging.ts:61` (returns `null` → peek paging no-ops and
clears the dedup entry so a later attempt retries — a navigation no-op, not a confident render; OUT,
noted), `BotIntegrationsSettings.tsx:154` (toasts — but toasts `error.message`, see §Criterion 5),
`GlobeLoader.tsx:125` and `realtime.ts:270` (visual loader / reconnect path). Catch-and-assign sites
(7): all are error-body parse fallbacks that still throw, or `status = 'error'` setters. [VERIFIED: repo scan]

**The 6 defect sites (unchanged, re-verified in tree):**

| #   | Site                                                                         | Transport                                                                                                                 | Fakes                              |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1–3 | `domains/analytics/repositories/analytics.repository.ts:13,25,37`            | `apiGet(..., { baseUrl: 'express' })` — throws `ApiError`                                                                 | `{ data: null }`                   |
| 4   | `domains/dossiers/hooks/useDossier.ts:683` (`useDossierCounts` queryFn)      | `services/dossier-api.ts:686` `getDossierCountsByType` — supabase-js but **checks `.error` and throws `DossierAPIError`** | `emptyCounts` (all zeros, 6 types) |
| 5   | `domains/dossiers/hooks/useDossier.ts:738` (`useDossierCountByType` queryFn) | `getDossiersByType` — fetch-based, throws                                                                                 | `0`                                |
| 6   | `hooks/useWidgetDashboard.ts:726` (`fetchStatsSummary`)                      | **raw supabase-js — NEVER THROWS** (PostgREST builders resolve `{data,error,count}`)                                      | zero-filled stats object           |

### What the catch-scan CANNOT see — three swallow classes found by widening, all live today

1. **supabase-js results with unchecked `.error` (no catch anywhere).** `fetchStatsSummary`'s four
   sub-queries read `activeDossiers.count || 0` etc. without destructuring `error`
   (`useWidgetDashboard.ts:697-742`). **Deleting the `catch` at `:726` fixes nothing here** — an
   RLS-denied or failed query resolves with `count: null` and renders `0`. The fix shape for site 6 is
   therefore: destructure `error` from each of the four results, `if (error) throw error`, THEN delete
   the outer catch. (The sibling fetchers in the same file already do this — `if (error) throw error`
   at `:597,628,656,685`, and `fetchKpiData`/`fetchChartData` catch-and-RETHROW at `:292,582` — the
   file's own convention proves the pattern.) [VERIFIED: repo read]
2. **Lossy aggregation discarding `isError`.** `useWidgetDashboard.ts` `widgetData` useMemo
   (`~:856-864`) maps `widgetQueries[index]?.data` into a record and drops error state entirely; the
   consumer `pages/custom-dashboard/CustomDashboardPage.tsx` receives only `widgetData`. Since the
   KPI/chart/events/tasks fetchers **already throw today**, widget rejections already render as
   zeros/empty through this seam. The repair must surface per-widget `isError` to the grid (UI-SPEC
   variant B per widget). [VERIFIED: repo read]
3. **Default-`[]` destructuring masks: `data: x = []` with no `isError` consumed.** Population:
   `grep -rnE "data: [A-Za-z]+ = \[\]" frontend/src/{routes,pages,components,hooks,domains} --include='*.ts*'`
   excluding tests → **26 sites**. This is the criterion-2 mechanism (all four surfaces are instances —
   see §Criterion 2). Outside this population: `= {}`/`= 0` defaults, and masks via `?? []` at use
   sites — unsearched; 26 is a floor for the shape, and NOT all 26 are defects (many sit beside an
   `isError` branch or feed non-primary UI). This phase fixes the criterion-named instances only; the
   shape is recorded so the closing derivation can state what it did not sweep. [VERIFIED: repo grep]

Also stated: `throwOnError` — 0 occurrences; `select`-absorbed errors — 0 (no `select:` callback
contains a catch); `placeholderData` — 2 sites (`useDossierFirstSearch.ts:91`,
`useQuickSwitcherSearch.ts:163`, both `(prev) => prev` keep-previous style; on a failed refetch they
retain stale data alongside `isError: true` — OUT of the TRUST-01 population, recorded). A fourth
class — **stub hooks that fabricate success without touching the network** — is the Tag Analytics
mechanism (§Criterion 2) and also `useBenchmarkPreview` (`domains/analytics/hooks/useOrganizationBenchmarks.ts:54-60`,
resolves `{shouldShowPreview: false}` so `BenchmarkPreview` always renders null — inert, no action
this phase) and `useReportBuilderState` (§Criterion 3). [VERIFIED: repo read]

### Per-site consumer blast radius — what breaks when the rejection is allowed through

**Sites 1–3 (analytics repository).** Consumers:

- `pages/analytics/AnalyticsDashboardPage.tsx` — **HAS an `isError` branch (`:269`)**… which renders
  `{error?.message || t('errors.networkError')}` at `:275` — a criterion-5 leak. The D-01 deletion and
  the D-08 fix for this page must land together, or criterion 1's fix creates a criterion 5 violation.
- `pages/Dashboard/components/AnalyticsWidget.tsx` — HAS `isError` (`:33`), renders `t('analytics.error')`. Safe.
- `components/dashboard-widgets/BenchmarkPreview.tsx` — consumes only the `useBenchmarkPreview` stub;
  unaffected.
- Note: these endpoints are Express-backed (`baseUrl: 'express'`, `/analytics-dashboard`,
  `/organization-benchmarks`); the repository comment says "endpoint not available". After D-01 the
  page will honestly error where it fabricated before — `DEAD-05` (Phase 96) owns making the data real.
  That is the intended division of labor. [VERIFIED: repo read]

**Site 4 (`useDossierCounts`).** Consumer: `pages/dossiers/DossierListPage.tsx:244` destructures
`{ data: counts, isLoading: countsLoading, refetch }` — **no `isError`**. On rejection:
`countsLoading` false → `typeStatsMap` null → the type-overview grid renders
`typeStatsMap?.[type] ?? { count: 0, … }` — **seven confident zero-cards** (`:537-541`), plus
`totalDossiersUnfiltered` goes undefined. **Deleting the swallow alone reproduces the identical lie
one layer up.** The task must add the counts error branch on this page (UI-SPEC: variant B for the
region; em-dash for count chrome with `aria-label` `common:errors.countUnavailable`). [VERIFIED: repo read]

**Site 5 (`useDossierCountByType`).** Only exported consumers found: `domains/dossiers/index.ts`
barrel and `DossierListPage` (via the same file). No page consumes it directly beyond the list page
population above — low radius. [VERIFIED: repo grep]

**Site 6 (`fetchStatsSummary`).** Consumer: `CustomDashboardPage` via the `widgetData` aggregation
(class 2 above). Fix = `.error` checks + aggregation surfaces `isError` per widget + widget grid
renders variant B for failed widgets, siblings render normally (UI-SPEC "which variant where").

**TanStack Query options that would re-swallow (checked):** no `throwOnError: false` anywhere (the
v5 default for `useQuery` is already not-throwing; `isError` is the contract); no error-absorbing
`select`; global retry (`lib/query-client.ts:29-40`) short-circuits 4xx via `error.status` — both
`ApiError` (`api-client.ts:35`) and `DossierAPIError` (`services/dossier-api.ts:431`) carry `.status`,
so 404s reject in ONE round-trip (matters for criterion 3's skeleton-time). **`FunctionsHttpError` /
`FunctionsFetchError` from `supabase.functions.invoke` carry NO numeric `status` property, so those
queries run the full 3-retry exponential ladder (~7s) before `isError`** — measured and documented in
`tests/e2e/92-delegations-error.spec.ts` (its `RETRY_BACKOFF_TIMEOUT = 15_000`). Oracles on
invoke-backed surfaces must budget for this; UI-SPEC's loading-transition contract asks for
per-surface retry caps (≤2 for 5xx/network) on this phase's surfaces. [VERIFIED: repo read + Phase 92 spec comment]

---

## Criterion 2 — the four surfaces, individually

### 1. `/admin/field-permissions` — the break is the `= []` mask, not the function

Live today: the function returns 200 (probe fact) and the DB holds 19 rules. The page
(`routes/_protected/admin/field-permissions.tsx:118-126`) destructures
`data: permissions = []` / `data: definitions = []` / `data: auditData` from three hooks with **no
`isError` anywhere in the file** — stats cards compute `permissions.length` (`:163-167`), so ANY
rejection renders "0 Permissions" confidently. At audit time the rejection was the pre-Phase-92 401;
the mask is intact for every future failure (and the audit tab, whose fetch requires admin, 403s for
non-admins → silently empty audit list).

The data path: `hooks/useFieldPermissions.ts` `fetchFieldPermissions` →
`supabase.functions.invoke('field-permissions', { method: 'GET', … })` → `return data.data`. The edge
function's list branch returns `{ data, pagination }` with `Content-Type: application/json`
(`supabase/functions/field-permissions/index.ts:130-135, 341-347`), and its RLS
(`field_permissions_select_policy`, migration `20260115500001`) reads `public.users` with
`id = auth.uid() AND role IN ('super_admin','admin','manager')` — the unified pattern, evaluable by
`authenticated` — so an admin session lists all 19. **Fix: wire `isError` → D-03 page-level state;
verify the 19 render live (positive half of the criterion).**
Noted, out of scope (flag, don't fix): `fetchFieldPermissions` builds `searchParams` from its params
and never appends them to the invoke URL — the page's entity/scope filters are silently dead
(`useFieldPermissions.ts:41-52`). An erroring page beats a lying page; dead filters are neither — file it.
[VERIFIED: repo read; probe fact CITED: PARK-P93/CONTEXT]

### 2. `/admin/data-retention` — six masked hooks over a 500 that D-10's migration turns off

`routes/_protected/admin/data-retention.tsx:143-155` destructures SIX hooks
(`useRetentionPolicies`, `useRetentionStatistics`, `usePendingActions`, `useExpiringRecords`,
`useExecutionLog`, `useLegalHolds`) — every one `data: x = []`, **zero `isError`**. Transport:
`domains/audit/repositories/audit.repository.ts:72-100` → `apiGet('/data-retention/policies', …)`
etc. — edge base URL → the `data-retention` function, which 500s today with the 42501 body (D-09).
So the page currently shows six confident empty regions over a 500.

Two halves, both needed: **(a)** the D-10 migration makes the function 200 (probe flips); **(b)** the
page gains error branches (D-03) so the NEXT failure renders honestly. Note `useLegalHolds` reads
`legal_holds`, whose only policy is in the residual-11 class (Phase 100, fail-closed 42501) — after
the migration fixes `data_retention_policies`, **the legal-holds region will still error**; that is
correct behavior for this phase (an erroring region beats a lying one) and must not be "fixed" by
widening the migration beyond D-10's four policies. State this expected residual in the plan so the
oracle asserts it rather than trips on it. [VERIFIED: repo read + PARK-P93 policy enumeration]

### 3. Tag Analytics — the inverse defect: an error state over a query that SUCCEEDED

Mechanism, pinned: `domains/tags/hooks/useTagHierarchy.ts:144-150` — `useTagAnalytics` is a
**refactor stub**: `queryFn: () => Promise.resolve({ totalTags: 0, categories: [], usage: [] })`. It
always succeeds without touching the network. The consumer
`components/tags/TagAnalytics.tsx` (mounted from `routes/_protected/tags.tsx` analytics tab) shims the
result as `{ data: TagAnalyticsRow[] }` (`:65-67`), computes `stats` from `analytics?.data` — the
stub has no `data` property → `stats` = null → `if (error || !stats)` (`:167`) renders
`t('errors.loadFailed')` = **"Failed to load tags"**. An error render over a success: the mirror image
of the phase's defect, and the same class of lie.

**The real endpoint exists and matches the component's expected shape almost column-for-column:**
`supabase/functions/tag-hierarchy/index.ts:239-242` `GET tag-hierarchy/analytics` reads
`mv_tag_usage_analytics`, whose columns (`tag_id, name_en, name_ar, parent_id, hierarchy_level,
color, is_active, total_assignments, dossier_count, document_count, brief_count, engagement_count,
auto_assigned_count, avg_confidence, last_assigned_at, children_count` — migration
`20260111700001:150-170`) are exactly the `TagAnalyticsRow` interface (`TagAnalytics.tsx:46-63`).
**Recommendation: repoint `useTagAnalytics`'s `queryFn` at `tag-hierarchy/analytics` (invoke, throw on
error)** — a one-queryFn diff that restores BOTH truths at once: success renders data (or genuine
emptiness), rejection renders the D-03 error state. The alternative (keep the stub, render an honest
empty/"unavailable" state) leaves a permanently-stubbed surface pretending to be a feature; the
repoint is the smaller total diff because the component already speaks the MV's shape. Caveat to
verify at execution: `mv_tag_usage_analytics` is a materialized view (staleness = last `REFRESH`;
`refresh_tag_analytics()` exists in the same migration) and is in DBSEC-03's MV-exposure class —
Phase 100's business, not this one's. [VERIFIED: repo read; recommendation]

Also in this criterion's scope per D-10/`RULING-P93-01`: the three tag policies are **UPDATE/DELETE**
policies (`tag_categories` "Tag creators or admins can update" UPDATE, "Only non-system tags can be
deleted by creators" DELETE, `entity_tag_assignments` "Authenticated users can remove tag assignments"
DELETE — migration text at `20260111700001:656-700`; live texts per PARK-P93). They gate tag
**mutations**, not the analytics read — their 42501 fires on update/delete attempts from the tags
surface. Their oracle is therefore a mutation-path probe (or role-switched SQL per PARK-P93's §(d)),
not the analytics render. See §DR-42501 for the rewrite shape (same migration).

### 4. Position attachments — the `= []` mask over an invoke rejection

`components/positions/AttachmentUploader.tsx:43` — `data: existingAttachments = [], isLoading` from
`usePositionAttachments` (`hooks/usePositionAttachments.ts:29-47`, invoke
`positions/${id}/attachments` GET, throws on error). No `isError` → any rejection (the audit's CORS
block, a 4xx/5xx, network) renders `t('positions:attachments_uploader.noAttachments')` ("No
attachments yet", `:492`). **Fix: `isError` → UI-SPEC variant B inline state in the attachments
section** (the section, not the page, owns the query). The underlying CORS condition on the
`positions` function's attachments subpath is not re-diagnosed here — criterion 2 requires the honest
error render, not the working feature; if the CORS failure persists after Phase 90/92, the inline
error IS the phase-correct outcome, and the remaining break files forward. Its oracle must therefore
use the forced-error protocol (CDP block on `*positions*attachments*`… note the block URL pattern must
not also block the position detail fetch — pattern `*/attachments*` scoped tighter) rather than
depending on the live CORS state. [VERIFIED: repo read]

---

## Criterion 3 — not-found mechanism, per route

### Correction to D-06/UI-SPEC's premise (decision unchanged)

**No file under `frontend/src` calls TanStack Router's `notFound()` today.** Population: grep
`notFound(` over `frontend/src` `*.ts/tsx` → 0 call sites; the only router-level pieces are
`routes/__root.tsx:72` `notFoundComponent: NotFoundPage` and `router/index.tsx:88`
`defaultNotFoundComponent`. The three routes D-06 cites as precedent render **in-component not-found
cards** (`positions/$id.tsx:56`, `after-actions/$afterActionId.tsx:77`,
`engagements/$engagementId/after-action.tsx:69` — i18n keys, no throw). The DECISION (adopt
`notFound()`) is locked and correct; the planner just must not instruct executors to "copy the throw
from positions/$id" — there is nothing to copy. This phase introduces the first throws. [VERIFIED: repo grep]

### Mechanics (verified against TanStack Router docs, v1.170.7 installed)

`notFound()` may be thrown in `loader`/`beforeLoad` (recommended — no flicker, typed loader data) or
**inside a component during render** (supported; caught per `notFoundMode: 'fuzzy'` default by the
nearest route with a `notFoundComponent`, else the root's; `CatchNotFound` exists for component-level
catches). [CITED: tanstack.com/router/latest/docs/framework/react/guide/not-found-errors]
Both boundaries here are root-level (`__root.tsx:72` and the router's `defaultNotFoundComponent`), so
a thrown `notFound()` anywhere under `_protected` renders the existing 404 page. The router context
carries only `auth` (`router/index.tsx:57-67`) — but `queryClient` is a module singleton
(`lib/query-client.ts:88`, imported by `App.tsx`), so **loaders can `import { queryClient }` directly;
no router-context change is needed** for a loader-based shape.

### Per-route seams

| Route                                                                                                                                                                                                        | Current load                                                                                                                                                                                                                                                                   | 404 signal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Recommended seam |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Dossier detail** — 7 typed layouts (`routes/_protected/dossiers/{countries,organizations,forums,persons,elected-officials,topics,working_groups}/$id.tsx`) all mount `components/dossier/DossierShell.tsx` | `DossierShell.tsx:84` `useDossier(dossierId)` → `services/dossier-api.ts` `getDossier` → `dossiers-get` fn, which returns **404 `NOT_FOUND`** for an absent id (`dossiers-get/index.ts:143-149`); `DossierAPIError.status` carries it; global retry skips 4xx → one round-trip | **One edit in `DossierShell`**: destructure `isError, error`; `if (isError && error.status === 404) throw notFound()` (component-throw; root boundary catches); non-404 rejection → D-03 page-level error state. One seam covers all 7 layouts — a per-route loader would be 7 edits guarding the same fetch. `DossierShell` today has NO isError branch at all (titleless chrome on any failure), so this edit is also the D-05 error-state wiring for dossier detail.                                                                                                                                                                                                                                                                                     |
| **Engagement detail** — `routes/_protected/engagements/$engagementId.tsx` mounts `components/workspace/WorkspaceShell.tsx`                                                                                   | `WorkspaceShell.tsx:44` `useEngagement(engagementId)` → `apiGet('/engagement-dossiers/${id}')` → fn 404s when `get_engagement_full` yields no engagement (`engagement-dossiers/index.ts:400-401`)                                                                              | Same component-throw shape in `WorkspaceShell` — **but only after the TRUST-04 change teaches the server to distinguish absent-ID from missing-extension** (§Criterion 4); until then a 404 is ambiguous between the two. Order: TRUST-04's server half first, then this.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Report builder** — `routes/_protected/reports/$reportId.tsx`                                                                                                                                               | **NO FETCH EXISTS.** `useReportBuilderState` is a stub that ignores `initialReportId` entirely (`domains/misc/hooks/useReportBuilder.ts:120-127`) — `/reports/<any-id>` silently renders a fresh empty builder (a lie of a different flavor: it looks like the report).        | The route needs a minimal by-id fetch to have a not-found to throw: a `loader` on `$reportId.tsx` (import the `queryClient` singleton, `ensureQueryData` a `custom_reports` by-id query via the existing supabase client pattern in `hooks/useScheduledReports.ts:225`) → no row → `throw notFound()`; fetch error → let it reject to the route `errorComponent`/D-03 state. **Known hazard:** `custom_reports` ↔ `report_shares` SELECT policies are mutually recursive (`42P17`, WRITE-06, Phase 94) — the by-id read may REJECT for all ids until Phase 94 fixes it. That renders the ERROR state, not not-found — which is the honest render for this phase and must be stated in the plan as the expected pre-Phase-94 behavior, not treated as a red. |

"24 skeletons": the skeleton-bounding + loading→error transition contract is already specified in
`93-UI-SPEC.md` (skeleton only while `isLoading`; ≤1 composed skeleton per region; retry caps).

---

## Criterion 4 — degraded engagement detection

**Data shape:** `engagement_dossiers.id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE`
(migration `20260110000006:18-19`) — a 1:1 extension keyed by the dossier id. The degraded condition:
a `dossiers` row with `type = 'engagement'` exists and no `engagement_dossiers` row shares its id.
The audit's COUNT-02 finding (engagements hub 5 vs list 3) implies **live staging holds ~2 such rows
today** — the state is observable without fixtures, though a synthetic row (service-role insert of a
`dossiers` type='engagement' row with no extension) is the constructible done-state for gate drills
(C1). [VERIFIED: repo read; COUNT-02 CITED: REQUIREMENTS.md]

**Where the collapse happens today:** `get_engagement_full` selects from `engagement_dossiers` by id
(`20260110000006:373-382`); missing extension → `data.engagement` null → the function returns **the
same 404 as a truly absent id** (`engagement-dossiers/index.ts:400-401`). The frontend cannot
distinguish the two from a 404 alone.

**Recommended repair shape (server half + client half, same plan or C9a-controlled):**

1. **Server:** in the fn's GET-single branch, when `!data?.engagement`, run one follow-up query on
   `dossiers` (`id = :id AND type = 'engagement'`): row exists → return **200 with
   `{ engagement: null, dossier: { id, name_en, name_ar, type, status } }`** (identity from the base
   row); no row → keep the 404. This keeps absent-ID semantics intact for the criterion-3 seam.
2. **Client:** `WorkspaceShell` — `profile.engagement == null && profile.dossier` → render identity
   (name from base row) + the UI-SPEC degraded callout (`role="status"`, `--warn`, "Incomplete
   record"), suppress dependent sections. Today's behavior on this path is the titleless chrome:
   `displayName` falls to `''` (`WorkspaceShell.tsx:56-59`) under an `<h1>` that renders regardless.

Alternative considered: client-side double-fetch (on 404, query `dossiers` by id) — rejected: two
round-trips on every miss, and it spreads the distinction logic to every future consumer. The RPC/fn
owns the join; let it own the distinction. [Recommendation; shapes VERIFIED against repo]

---

## Criterion 5 — the D-08 partition

**Population definition:** `grep -rnE "error(\?)?\.message|err\.message"` over
`frontend/src/{routes,pages,components}` `*.tsx`, excluding tests, excluding lines that are
`console.*`/`throw`/`toast.*`/`new Error`/log-calls/comments, keeping lines with JSX-render shapes
(`{…}` interpolation or `title=`/`description=`/`error=`/`label=` props) → **39 sites** (CONTEXT's 37
was a sibling method over the same dirs; the delta is method noise, not drift — both are floors).
[VERIFIED: repo grep, file:line list held in scan output]

**Partition:**

| Bucket                                                                | Count  | Sites                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Verdict                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a) Query/transport-origin — THE criterion-5 defect**               | **25** | `pages/AssignmentQueue.tsx:48` (exemplar, `/tasks/queue` via `routes/_protected/tasks/queue.tsx`; hook invokes `assignments-queue`), `pages/Countries.tsx:90`, `pages/MyAssignments.tsx:47`, `pages/TaskDetailPage.tsx:67`, `pages/WorkingGroupsPage.tsx:243`, `pages/analytics/AnalyticsDashboardPage.tsx:275`, `pages/audit-logs/AuditLogsPage.tsx:251`, `pages/dossiers/DossierListPage.tsx:817`, `pages/forums/ForumsPage.tsx:310`, `pages/my-work/components/WorkItemList.tsx:108`, `routes/_protected/positions.tsx:297`, `routes/_protected/positions/$positionId.tsx:84`, `routes/_protected/scenario-sandbox.tsx:318`, `routes/_protected/tasks/$id.tsx:22`, `components/activity-feed/EnhancedActivityFeed.tsx:496`, `components/commitments/CommitmentsList.tsx:229`, `components/contacts/InteractionTimeline.tsx:291`, `components/dossier/tabs/DossierDocumentsTab.tsx:41`, `components/dossiers/DossierMoUsTab.tsx:123`, `components/elected-officials/ElectedOfficialListTable.tsx:147`, `components/geographic-visualization/WorldMapVisualization.tsx:127`, `components/positions/DossierPositionsTab.tsx:211`, `components/report-builder/ReportBuilder.tsx:414`, `components/version-comparison/VersionComparison.tsx:275`, `components/workflow-automation/WorkflowTestDialog.tsx:196` | Fix: drop the `error.message` operand, keep/add the i18n fallback (most already have one: `{error.message \|\| t('queue.error')}` → `{t('queue.error')}`). The UI-SPEC's one structured exception applies: a body carrying the project's bilingual envelope (`message_en`/`message_ar`) MAY render by language; `message`, `details`, `code` never reach JSX. |
| **(b) Exception-boundary renders**                                    | 7      | `components/app-error-boundary/ErrorBoundary.tsx:164`, `components/error-boundary/ErrorBoundary.tsx:196`, `components/error-boundary/ApiErrorBoundary.tsx:31,143,157`, `components/dossier/DossierErrorBoundary.tsx:128`, `components/theme-error-boundary/ThemeErrorBoundary.tsx:107`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | A sub-class the planner must rule on: boundaries render caught exception `.message` (internal by nature). Minimum for criterion 5's letter: the named surface (`/tasks/queue`) plus bucket (a). Recommended: sweep the boundary fallbacks to generic i18n copy in the same pass — small diff, same rule. NOT silently expanding scope: flag as a scope call.  |
| **(c) Author-written / false positives — CORRECT, out of the defect** | 7      | `components/forms/FormInput.tsx:79`, `FormSelect.tsx:87`, `FormErrorDisplay.tsx:302,319` (RHF field messages), `components/intake-form/IntakeForm.tsx:437` (`t('error.message')` — an i18n KEY literally named that), `components/actionable-errors/ActionableErrorMessage.tsx:243` (`t(error.messageKey)` — i18n-keyed by design), `components/validation/validation-badge.tsx:101` (validation results)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | No change.                                                                                                                                                                                                                                                                                                                                                    |

**Outside this population, stated:** (i) `router/index.tsx:69-86` — the router's
`defaultErrorComponent` renders `error?.name` and `error?.message` raw, full-page; it lives outside
the scanned dirs and WILL be the surface any loader-thrown non-404 error hits once criterion-3
loaders exist — recommend including it in bucket (a)'s fix; (ii) **toast sites**:
`lib/query-client.ts:62-75` global mutation `onError` toasts raw `error.message` (and `onSuccess`
toasts "Operation completed successfully" — that half is WRITE-04/Phase 94), and
`components/settings/BotIntegrationsSettings.tsx:154` toasts `error.message` — toasts are user-facing;
criterion 5's sentence ("No user-facing error contains an internal string") plainly covers them, D-08's
JSX population does not. Planner call; recommend fixing the global `onError` fallback copy since it is
one site covering every mutation; (iii) multiline/template-string renders the single-line grep cannot
see — the number is a floor. [VERIFIED: repo grep + reads]

**Server half of criterion 5 (same coherence obligation):** `audit-logs-viewer` ships
`details: error` in its 500 bodies (leaks `column audit_log.table_name does not exist` — D-15);
`data-retention` ships `details: error` at `index.ts:281` (leaks the 42501 text — the envelope is
right, the `details` passthrough is the leak); `my-delegations` will gain an error body — author it
without PostgREST passthrough. Pattern to copy: bilingual envelope (`message_en`/`message_ar` + a
stable `code`), diagnostics to `console.error` only. [VERIFIED: repo read + PARK-P93 live bodies]

---

## The four inherited defects — concrete edits

### DR-42501 — the 4-policy migration

**Migration shape** (one file, `YYYYMMDDHHMMSS_phase93_rewrite_auth_users_policies.sql`, applied via
`mcp__supabase__apply_migration`, idempotent per the migration-safety skill):

```sql
-- DR-42501 / RULING-P93-01: replace auth.users-evaluating predicates with the
-- unified authz read. raw_*_meta_data reads DELETED, not preserved (D-10).
-- NEVER 'GRANT SELECT ON auth.users' — the DB's own 42501 HINT proposes it; taking
-- it arms 8 fail-closed metadata-role policies (see RLS-AUTHUSERS-01).

DROP POLICY IF EXISTS "Admin can manage retention policies" ON public.data_retention_policies;
CREATE POLICY "Admin can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Tag creators or admins can update" ON public.tag_categories;
CREATE POLICY "Tag creators or admins can update"
  ON public.tag_categories FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Only non-system tags can be deleted by creators" ON public.tag_categories;
CREATE POLICY "Only non-system tags can be deleted by creators"
  ON public.tag_categories FOR DELETE TO authenticated
  USING (is_system = FALSE AND (created_by = auth.uid() OR public.is_platform_admin(auth.uid())));

DROP POLICY IF EXISTS "Authenticated users can remove tag assignments" ON public.entity_tag_assignments;
CREATE POLICY "Authenticated users can remove tag assignments"
  ON public.entity_tag_assignments FOR DELETE TO authenticated
  USING (assigned_by = auth.uid() OR public.is_platform_admin(auth.uid()));
```

**Why `is_platform_admin` and not an inline EXISTS:** `public.is_platform_admin(uid)` already exists
(`20260627000001_sec_helper_is_platform_admin.sql:22-46`) — SECURITY DEFINER, `STABLE`, locked
`search_path`, granted to `authenticated`, reads `public.users.role = 'admin'` OR an active
`public.user_roles` admin row, and was created for EXACTLY this defect class (SEC-BE-01 swept a batch
of metadata-role policies onto it in `20260627000002`). It IS "the unified authz read — public.users.role
keyed on auth.uid()" in D-10's words, packaged. Being SECURITY DEFINER it is also immune to any future
tightening of `public.users`' own RLS. [VERIFIED: migrations read]

**Recursion analysis (the question asked):** a rewritten predicate that reads `public.users` triggers
`public.users`' own SELECT policies during evaluation. `users_select_active_authenticated` is
`auth.role() = 'authenticated' AND is_active = true` (PARK-P93 §01 — no subquery, no reference back to
any policy-bearing table), and `users_select_self` is a self-row check — **neither can recurse
(42P17 requires a policy chain that revisits its own table)**. Two live proofs: (1) the inline shape
`EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN (…))` already evaluates
successfully through PostgREST on `field_permissions` (the fn returns 200 through a JWT-scoped
client); (2) `is_platform_admin` sidesteps users-RLS entirely via SECURITY DEFINER, making the
question moot for the recommended shape. [VERIFIED: PARK-P93 + repo; live-probe fact CITED]

**Semantics check:** the `data-retention` handler gates admin actions on
`userRecord?.role === 'admin'` exactly (`data-retention/index.ts:112-116`) — `is_platform_admin`'s
`role = 'admin'` matches; no super_admin/manager mismatch on this surface. The tag policies preserve
their stated intent (creator OR admin) — the current live predicates' `EXISTS (SELECT 1 FROM
auth.users WHERE id = auth.uid())` arm is a role-less tautology that happens to fail closed;
"admins" per the policy NAME is restored, not invented. Flag for the planner: if the operator wants
`role IN ('admin','super_admin')` instead of the helper on the tag policies, that is a one-token
variant with the `field_permissions` precedent — either satisfies D-10.

**Post-apply verification (skill-mandated):** re-query `pg_policies` for the 4 rows; run
`mcp__supabase__get_advisors`; behavioural oracle is the live probe (`data-retention -> 200`), NOT a
service-role SQL read (service-role bypasses RLS — skill rule).

**The anti-grant gate (D-12, REQUIRED):** assertion —
`select grantee from information_schema.table_privileges where table_schema='auth' and table_name='users' and privilege_type='SELECT'`
returns exactly one row, `postgres`. Mechanics problem, stated honestly: gates run bash;
`information_schema` is not reachable through PostgREST, `.env.test` carries no `SUPABASE_DB_URL`
(E2ECRED-01's key list), and `psql` availability is moot without a DSN. Options for the planner:
(a) operator adds `SUPABASE_DB_URL` to `.env.test` → gate is `psql "$SUPABASE_DB_URL" -tAc "…"`
diffed against `postgres` (preferred; drillable both directions — the RED construction is a scratch
`GRANT` on a shadow DB, or `CANNOT CONSTRUCT` honestly recorded);
(b) the gate runs via `mcp__supabase__execute_sql` during the drill with output pasted as evidence —
weaker (not `gate-drill.mjs`-runnable) but honest if labeled;
(c) a read-only SECURITY DEFINER RPC created by the same migration exposing exactly this one
catalog fact to the service key — drillable via curl, but adds surface. Recommend (a) with (b) as
the recorded fallback. This is an Open Question for the planner, not a research failure — the
assertion text itself is fixed by the ruling.

### AUDIT-42703 — field map + aggregate

Client is JWT-scoped (`audit-logs-viewer/index.ts:371-377`), so RLS on `audit_log` applies:
migration-visible SELECT policies admit admin/editor via `public.users` (`010_audit.sql:334-342`,
`013_rls_policies_content.sql:284-290` — the latter also self-rows via `user_id = auth.uid()`).
The probe user (admin) passes. Live catalog may differ from migration files — the live probe is the
oracle either way. [VERIFIED: migrations; live behavior to be confirmed by probe at execution]

**Column map (handler expected → `audit_log` real):**

| Handler selects (`index.ts:51-68,192-194,209-211`)               | `audit_log` real column               | Action                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `table_name`                                                     | `entity_type`                         | rename in select + filters (`:73-74`) + search `or(...)` (`:106-107`) + CSV fields (`:125,140`)                                                                                                                                                                                                                       |
| `operation`                                                      | `action`                              | rename                                                                                                                                                                                                                                                                                                                |
| `row_id`                                                         | `entity_id`                           | rename                                                                                                                                                                                                                                                                                                                |
| `old_data` / `new_data`                                          | `old_values` / `new_values`           | rename                                                                                                                                                                                                                                                                                                                |
| `changed_fields`                                                 | — (none)                              | derive client/fn-side from `old_values`/`new_values` key diff, or drop from UI + CSV; recommend drop (smallest honest diff)                                                                                                                                                                                           |
| `user_email` / `user_role`                                       | —                                     | join `public.users` (`email` is varchar — cast `::text` if surfaced through any `RETURNS TABLE` RPC, per the 42804 skill note) or drop; recommend a second query keyed on the page's distinct `user_id`s (PostgREST embed from `audit_log` to `users` needs a declared FK — verify live before choosing embed syntax) |
| `timestamp`, `session_id`, `ip_address`, `user_agent`, `user_id` | same                                  | keep                                                                                                                                                                                                                                                                                                                  |
| `request_id`                                                     | — (`additional_context` jsonb exists) | drop or read from `additional_context`                                                                                                                                                                                                                                                                                |
| `audit_statistics` relation (`:277-280`)                         | **does not exist**                    | replace with the aggregate: the fallback block ALREADY WRITTEN at `:284-300` (groups `audit_log` rows by `action` over the date range) is the aggregate D-14 asks for — promote it to the only path and delete the `audit_statistics` query                                                                           |
| 500 bodies with `details: error` (`:167,204,239` et al.)         | —                                     | D-15: strip `details` from client-facing bodies; bilingual envelope + code; log server-side                                                                                                                                                                                                                           |

Note the sibling `audit_logs` (0 rows) and `AUDIT-ZERO-01`/`AUDIT-DROP-01` are Phase 94's — do not
"helpfully" touch the writers here.

### DELEG-01 — visibility only

Swallow sites re-verified: `my-delegations/index.ts` — both query results handled as
`if (error) { console.error(…) } else if (data) { … }` (granted at ~`:197`, received at ~`:233`),
falling through to `200 {granted:[],received:[],total:0}`. Fix: on either `error`, return a real
error status (500, `code: 'QUERY_FAILED'`-style) with the bilingual envelope and **no PostgREST
passthrough** (the 42P01 text names the missing relation — an internal string). Do NOT repoint the
table (D-13). The handler queries via `supabaseAdmin` (service-role) — unchanged; the 42P01 fires
regardless of client. Frontend: `/delegations` already renders a distinct error state with
`role="alert"` and em-dash stats (Phase 92-03, `DelegationManagementPage.tsx:57-217`) — after the fn
change, the natural (unforced) visit errors honestly. Record in the plan: **`/delegations` erroring
is the phase's intended outcome until Phase 102** (D-13, verbatim requirement in DELEG-02's text).

### PIN-2390-01 — two helpers, six importers, widened derivation

Re-verified in tree 2026-08-15:

- `supabase/functions/_shared/ai-interaction-logger.ts:12` —
  `import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'`;
  constructs a service-role client at `:149`. Importers (grep `ai-interaction-logger` under
  `supabase/functions --include='*.ts'`, minus `_shared`): `ai-interaction-logs`,
  `ai-summary-generate`, `dossier-field-assist`, `positions-consistency-check`, `translate-content` — 5.
- `supabase/functions/dossier-stats/dashboard-aggregations.ts:1` —
  `import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"` (type-only usage).
  Importer: `dossier-stats/index.ts` — 1.

Edit: bump both specifiers to `https://esm.sh/@supabase/supabase-js@2` (matching the AUTH-02
migration convention for esm.sh imports; `jsr:@supabase/supabase-js@2` is the new-function template
but changing the import SOURCE style is beyond the pin fix — keep esm.sh, change only the version
tag). Redeploy all six via CLI/MCP (`supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg`),
appending rows to the deploy-ledger convention if the plan adopts one (C9a: gate the ledger format).

**Widened closing derivation (the whole point of this defect):**

```bash
grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='*.ts' | wc -l   # -> 0
```

Population: every `*.ts` under `supabase/functions` (today: exactly the 2 files above match).
**Outside it:** non-`.ts` files (none plausible), dynamic version resolution (none present), and —
the un-greppable residue — **already-deployed bundles**, which only a redeploy refreshes; hence the
deploy step is part of the fix, and the probe (all six `-> non-401`, unchanged) plus the ledger are
the deployed-artifact evidence. [VERIFIED: repo grep]

---

## Standard Stack

**No new packages. Zero installs.** This phase composes entirely from shipped dependencies:

### Core (already installed — versions from `frontend/package.json` / root `package.json`)

| Library                                                                             | Version   | Purpose                                                     | Why                                    |
| ----------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------- | -------------------------------------- |
| `@tanstack/react-query`                                                             | ^5.100.14 | `isError`/retry semantics; the seam D-01 reconnects         | already the data layer                 |
| `@tanstack/react-router`                                                            | ^1.170.7  | `notFound()` + root `notFoundComponent`                     | already the router; mechanism verified |
| `@playwright/test`                                                                  | ^1.60.0   | behavioural oracles (inline auth, `--no-deps`, CDP)         | Phase 92 template exists               |
| `vitest`                                                                            | ^4.1.7    | unit oracles where useful                                   | already the unit runner                |
| `lucide-react`, `components/ui/alert.tsx`, `components/empty-states/EmptyState.tsx` | shipped   | D-03 substrate (`alert.tsx:26` has `role="alert"` built in) | UI-SPEC contract                       |
| supabase-js (frontend)                                                              | ^2.100.1  | `functions.invoke` GET supported                            | already installed                      |

### Alternatives Considered

| Instead of                                                | Could Use                                         | Tradeoff                                                                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component-throw `notFound()` in DossierShell              | per-route `loader` + `ensureQueryData`            | loader avoids render-flicker (docs-recommended) but costs 7 route edits duplicating one fetch guard; DossierShell is the single seam. Report builder gets the loader shape (it has no component fetch to reuse). |
| `is_platform_admin(auth.uid())`                           | inline `EXISTS (… public.users … role IN (…))`    | inline matches `field_permissions` precedent and allows super_admin; helper matches the SEC-BE-01 precedent, is SECURITY DEFINER (recursion-proof), and is one call. Either satisfies D-10.                      |
| repointing `useTagAnalytics` at `tag-hierarchy/analytics` | honest "feature unavailable" render over the stub | repoint is a one-queryFn diff to an endpoint whose MV matches the component's types; the stub-render keeps a dead surface pretending.                                                                            |

## Package Legitimacy Audit

**No packages are installed by this phase.** The only dependency-adjacent edit is a version-tag bump
inside two existing esm.sh import URLs (`@supabase/supabase-js@2.39.0` → `@2`), to the same package
the rest of the tree already imports. slopcheck not applicable; nothing to audit.
**Packages removed due to slopcheck [SLOP] verdict:** none. **Packages flagged [SUS]:** none.

---

## Don't Hand-Roll

| Problem                | Don't Build                                | Use Instead                                                                    | Why                                                                                                               |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Error-state chrome     | a new alert primitive / new button variant | `components/ui/alert.tsx` + `.btn-primary`/`.btn-ghost` recipes per UI-SPEC    | alert already carries `role="alert"` and token-correct destructive variant                                        |
| Not-found page         | a per-route 404 component                  | `throw notFound()` → root `NotFoundPage` (`__root.tsx:12-72`)                  | the boundary + copy keys already exist in both locales                                                            |
| Result unions          | `{ ok }` wrappers on repositories          | deletion of the swallow (D-01)                                                 | transport already throws; CLAUDE.md forbids mixing                                                                |
| Admin predicate SQL    | fresh role-check SQL per policy            | `public.is_platform_admin(auth.uid())`                                         | audited SECURITY DEFINER helper, precedent across 10+ policies                                                    |
| Live edge-fn oracle    | new probe tooling                          | `scripts/probe-edge-auth.sh <fn>…`                                             | proven in Phase 92; never echoes credentials                                                                      |
| Forced-error UI oracle | response-mocking fixtures                  | CDP `Network.setBlockedURLs` per `92-delegations-error.spec.ts`                | project-documented protocol; an RLS denial can present as an empty 200, so DOM state is the only honest assertion |
| Audit statistics       | a new `audit_statistics` relation          | the aggregate fallback already written at `audit-logs-viewer/index.ts:284-300` | D-14; smallest diff is promotion, not creation                                                                    |

---

## Common Pitfalls

### Pitfall 1: Deleting the swallow moves the lie up one layer

**What goes wrong:** rejection reaches a page with no `isError` branch → blank region or zero-cards.
**Where, concretely:** `DossierListPage` counts strip (7 zero-cards via `?? {count: 0…}`);
`useWidgetDashboard` `widgetData` aggregation (drops `isError`); every `data: x = []` mask.
**How to avoid:** pair every swallow-deletion with its consumer's error branch in the same task;
gate on the rendered state, not the deletion.

### Pitfall 2: supabase-js never throws

**What goes wrong:** deleting a `catch` over PostgREST builders changes nothing — errors ride in
`{ error }`, and `count` arrives null → `|| 0` renders zero.
**How to avoid:** for site 6 (and any supabase-direct query touched), destructure and throw `.error`
first; the same file's other fetchers are the precedent (`useWidgetDashboard.ts:597,628,656,685`).

### Pitfall 3: The DB's own HINT is the exploit

**What goes wrong:** any 42501 in this class prints `HINT: GRANT SELECT ON auth.users TO authenticated;`
— taking it arms 8 fail-closed metadata policies (6 read/write, 1 anon-reachable).
**How to avoid:** the anti-grant gate (D-12) plus the refusal written into the migration comment.

### Pitfall 4: invoke errors have no `.status` → 7-second retry ladder

**What goes wrong:** oracles on invoke-backed surfaces time out at Playwright's default 5s while
TanStack retries (1s+2s+4s); a CORRECT implementation fails a default-timeout assertion.
**How to avoid:** 15s expect budgets (the 92 spec's `RETRY_BACKOFF_TIMEOUT`), and/or the UI-SPEC's
per-surface retry caps.

### Pitfall 5: i18n silent English fallback + dot-form keys

**What goes wrong:** an unregistered namespace or missing `ar` key renders English in BOTH locales,
invisibly; dot-form `t('common.errors.retry')` leaks the raw key.
**How to avoid:** extend the existing `common` `errors` object (already registered; existing keys
`networkError`, `unknownError`, `generic` confirmed in `i18n/en/common.json`); colon-form addressing;
en + ar in the same commit; `scripts/check-i18n-namespaces.mjs` runs in `pnpm lint`. Do not add
English-default second arguments (grows AR-04a's mask population).

### Pitfall 6: 404 is ambiguous on engagements until the server distinguishes

**What goes wrong:** throwing `notFound()` on any engagement 404 renders "Page not found" for a
record that EXISTS but is incomplete (TRUST-04's case), re-collapsing D-05/D-07's distinction.
**How to avoid:** land the `engagement-dossiers` server change (200 + `engagement: null` + base
identity) before or with the WorkspaceShell notFound throw; order producers before consumers (D-19).

### Pitfall 7: Playwright dependency-project semantics

**What goes wrong:** any non-`--no-deps` run of a `chromium-en` spec fails in `setup` (six absent
E2E\_\* keys, E2ECRED-01); `--list`/`--grep` do NOT exempt the dependency project, so test-count
assertions inflate.
**How to avoid:** every oracle and every count runs `--no-deps` (D-20; GATE-STANDARD C6).

### Pitfall 8: Gates that cannot pass when the work is done

**What goes wrong:** the eight Phase-92 instances (wc-padding, vacuous roots, `git diff HEAD`, …).
**How to avoid:** author to C1–C10 from the start; anchor scope diffs to `phase-93-base` (create the
tag at phase start — the tag convention resumed in Phase 92; signing per CLAUDE.md §Tag signing);
`scripts/gate-drill.mjs` runs the mechanical half; the done-state construction stays per-gate.

### Pitfall 9: Legal-holds region still errors after the migration — by design

**What goes wrong:** an executor "fixes" the `/admin/data-retention` legal-holds region by widening
the migration to `legal_holds` (residual-11, Phase 100), breaking the ruling's scope.
**How to avoid:** the plan states the expected residual error and the oracle asserts the error STATE
renders there (which is the phase's actual promise).

---

## Code Examples

### D-01 deletion shape (site 1; sites 2–3 identical)

```typescript
// domains/analytics/repositories/analytics.repository.ts — AFTER
export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
}
// The try/catch + console.warn + `return { data: null }` are deleted whole (D-01: logging MAY stay,
// but with nothing left to log locally the wrapper collapses to the call).
```

### Site 6 fix shape (supabase-js does not throw)

```typescript
// hooks/useWidgetDashboard.ts fetchStatsSummary — each result checked, outer catch deleted
const [activeDossiers, openWorkItems, completedThisMonth, overdueItems] = await Promise.all([...])
for (const r of [activeDossiers, openWorkItems, completedThisMonth, overdueItems]) {
  if (r.error) throw r.error
}
return {
  activeDossiers: activeDossiers.count ?? 0,  // null now impossible on success path
  ...
}
```

### Component-throw notFound (DossierShell seam)

```typescript
// components/dossier/DossierShell.tsx
import { notFound } from '@tanstack/react-router'
const { data: dossier, isLoading, isError, error } = useDossier(dossierId)
if (isError) {
  if (error instanceof DossierAPIError && error.status === 404) throw notFound()
  return <QueryErrorState variant="page" onRetry={refetch} />
}
// Source for component-throw support: tanstack.com/router …/guide/not-found-errors
// ("CatchNotFound … can be used to catch not-found errors in components"; loaders preferred,
// component-throw accepted — root notFoundComponent catches under default fuzzy mode).
```

### Edge-function error body (bilingual, leak-free — the shape all three fns converge on)

```typescript
return new Response(
  JSON.stringify({
    error: {
      code: 'QUERY_FAILED',
      message_en: 'Failed to load delegations',
      message_ar: 'فشل في تحميل التفويضات',
    },
  }),
  { status: 500, headers },
) // details/PostgREST text -> console.error ONLY (D-15 / criterion 5)
```

---

## Environment Availability

| Dependency                                                                  | Required By                              | Available                       | Version/Evidence                            | Fallback                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `scripts/probe-edge-auth.sh` + `.env.test` (URL, anon key, TEST_USER creds) | edge-fn oracles                          | ✓                               | script verified in tree; guards its own env | —                                                                                            |
| Playwright + Chromium                                                       | render oracles                           | ✓                               | ^1.60.0; Phase 92 specs ran 3/3             | —                                                                                            |
| Supabase MCP (`apply_migration`, `execute_sql`, `get_advisors`)             | DR-42501 migration + verification        | ✓ (session tooling)             | house rule                                  | Supabase CLI                                                                                 |
| Supabase CLI (`supabase functions deploy`)                                  | 3 fn fixes + 6 PIN redeploys             | ✓ (used for 139 deploys in P92) | —                                           | MCP `deploy_edge_function`                                                                   |
| `SUPABASE_DB_URL` / psql DSN                                                | anti-grant gate as a drillable bash gate | ✗ (not in `.env.test` key list) | —                                           | MCP `execute_sql` with pasted evidence (labeled), or operator adds the DSN — Open Question 1 |
| e2e `setup` credentials (six E2E\_\* keys)                                  | NOT ALLOWED as a dependency (D-20)       | ✗ (E2ECRED-01)                  | —                                           | inline auth + `--no-deps` (mandated)                                                         |
| `pnpm` (10.29.1 pin), node                                                  | builds/tests                             | ✓                               | repo toolchain                              | — (avoid `npx`/`timeout` — broken on this machine per project memory; use `pnpm exec`)       |

**Missing with no fallback:** none that blocks a criterion. The anti-grant gate's bash-runnability is
the only degraded item (fallback documented).

---

## Validation Architecture

### Test Framework

| Property                  | Value                                                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frameworks                | Vitest ^4.1.7 (unit — `frontend/vitest.config.ts` + root `vitest.config.ts`); Playwright ^1.60.0 (e2e — root `playwright.config.ts`, projects `setup`/`chromium-en`/`chromium-ar-smoke`/`chromium-mobile`) |
| Config files              | present (paths above) — no Wave-0 framework install needed                                                                                                                                                 |
| Quick run (unit)          | `cd frontend && pnpm exec vitest run <file>`                                                                                                                                                               |
| Quick run (e2e, one spec) | `pnpm exec playwright test tests/e2e/<spec>.spec.ts --project=chromium-en --no-deps` (webServer auto-starts vite unless `E2E_BASE_URL` set)                                                                |
| Full suite                | `pnpm test` (turbo) / `pnpm exec playwright test --project=chromium-en --no-deps` — **every Playwright invocation in this phase carries `--no-deps` (D-20/C6), including `--list` counts**                 |
| Live edge oracle          | `scripts/probe-edge-auth.sh data-retention audit-logs-viewer my-delegations field-permissions dossier-stats …` → `<fn> -> <status>` lines                                                                  |

### Phase Requirements → Test Map

| Req         | Behavior                                                | Test Type                 | Oracle (all `--no-deps`, inline auth)                                                                                                                                                                                                                                                                                                                | Exists?        |
| ----------- | ------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| TRUST-01    | 6 swallow sites deleted; rejections reach `isError`     | static + behavioural      | static: re-run the widened catch-scan over the 6 named files → 0 in-class sites (population stated); behavioural: covered by the TRUST-02 forced-error specs (the rejection must RENDER)                                                                                                                                                             | ❌ Wave 0 spec |
| TRUST-02    | 4 surfaces error-on-failure; field-permissions shows 19 | Playwright ×2 per surface | happy: `/admin/field-permissions` renders >0 rows and NOT "0" stat (admin inline auth); forced: CDP block `*field-permissions*` → `[data-testid="query-error-state"]`. Same pattern per surface (`*data-retention*`, `*tag-hierarchy*`, `*/attachments*`). Tag Analytics adds the inverse assertion: unblocked visit does NOT show `loadFailed` copy | ❌ Wave 0      |
| TRUST-03    | absent well-formed ID → 404 page on 3 routes            | Playwright                | `/dossiers/countries/<random-uuid>` (+ engagement, + report) → root 404 numeral visible, no skeleton persistence, no "Check your connection"                                                                                                                                                                                                         | ❌ Wave 0      |
| TRUST-04    | missing extension row → named degraded state            | Playwright + fixture      | construct: service-role insert of a `dossiers` type='engagement' row w/o extension (C1 done-state; live staging likely already has 2 per COUNT-02); visit → identity + `role="status"` callout; teardown deletes the row                                                                                                                             | ❌ Wave 0      |
| criterion 5 | no internal strings                                     | Playwright + static       | forced-error visits assert rendered text matches i18n copy and NOT `/42501\|42703\|42P01\|supabase\|permission denied/i` (UI-SPEC oracle); static: bucket-(a) grep → 0 over its stated population                                                                                                                                                    | ❌ Wave 0      |
| DELEG-01    | fn returns real error; page errors                      | probe + existing spec     | probe `my-delegations -> 5xx` with body lacking `42P01`/`delegations` internals; `tests/e2e/92-delegations-error.spec.ts` (EXISTS ✅) re-run green                                                                                                                                                                                                   | partly ✅      |
| DR-42501    | policies rewritten; surface unblocked                   | probe + SQL + gate        | probe `data-retention -> 200`; `pg_policies` re-query shows 4 rewritten predicates (no `auth.users`, no `raw_*_meta_data`); **anti-grant gate** (Open Question 1 mechanics)                                                                                                                                                                          | ❌             |
| AUDIT-42703 | viewer reads real columns; stats aggregate; no leak     | probe                     | probe `audit-logs-viewer -> 200` AND response contains rows (75 live); `…/statistics -> 200`; error-path body carries no column names                                                                                                                                                                                                                | ❌             |
| PIN-2390-01 | helpers bumped; six redeployed                          | static + deploy evidence  | widened grep (`--include='*.ts'`) → 0; deploy ledger rows for the 6; probe all six non-401 (unchanged from P92 baseline)                                                                                                                                                                                                                             | ❌             |

### Sampling Rate

- **Per task commit:** the task's own oracle (spec or probe) + `cd frontend && pnpm lint && pnpm type-check` (lint carries the i18n-namespace check).
- **Per wave merge:** all Phase-93 specs `--no-deps`; probe run over the 5 touched functions.
- **Phase gate:** full `gate-drill.mjs` pass (C1 both directions per gate), full spec set, probe, and the closing derivations re-run with populations stated.

### Wave 0 Gaps

- [ ] `tests/e2e/93-trust02-surfaces.spec.ts` — forced-error + happy-path per criterion-2 surface (clone the 92-delegations pattern: inline auth, CDP, 15s budgets)
- [ ] `tests/e2e/93-notfound.spec.ts` — three absent-ID routes
- [ ] `tests/e2e/93-degraded-engagement.spec.ts` — fixture + `role="status"` assertion
- [ ] `components/error-states/QueryErrorState.tsx` + `common:errors.*` keys (en + ar, same commit) — the producer every spec consumes; C9a: positive-control the `data-testid` contract (`query-error-state` / `query-error-inline`) in the spec BEFORE surface plans consume the component
- [ ] anti-grant gate script (mechanics per Open Question 1)
- [ ] `phase-93-base` tag (C7 anchor; signed per CLAUDE.md)

Framework install: none needed.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category               | Applies                                                    | Standard Control                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V4 Access Control           | **yes** — the 4-policy rewrite IS an access-control change | `is_platform_admin(auth.uid())` / `public.users.role`; anti-grant gate on `auth.users`; RLS verified as an authenticated user, never via service-role (skill rule) |
| V5 Input Validation         | marginal                                                   | no new inputs; existing express-validator/Zod untouched                                                                                                            |
| V7 Error Handling & Logging | **yes — the phase's core**                                 | bilingual envelope, no `details` passthrough, diagnostics server-side only; frontend renders i18n copy only                                                        |
| V2/V3 Auth/Session          | no (Phase 92 closed)                                       | probe re-verifies non-401 as a side effect                                                                                                                         |
| V6 Cryptography             | no                                                         | —                                                                                                                                                                  |

### Known Threat Patterns for this stack

| Pattern                                                          | STRIDE                 | Standard Mitigation                                                                                          |
| ---------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Self-service role escalation via `raw_user_meta_data`            | Elevation of privilege | DELETE metadata reads (D-10); anti-grant gate (D-12); refusal text in migration comment                      |
| Error-body information disclosure (PostgREST codes/column names) | Information disclosure | D-15 envelope rule; UI-SPEC copy-rule oracle regex                                                           |
| Fail-open policy rewrite (predicate typo → USING true)           | Elevation              | post-apply `pg_policies` re-query + behavioural probe as a non-admin where constructible; `get_advisors` run |
| Credential leakage in oracles                                    | Information disclosure | probe script passes creds via stdin, never argv; specs read env, never literals                              |

---

## Assumptions Log

| #   | Claim                                                                                                                                                                 | Section            | Risk if Wrong                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `mv_tag_usage_analytics` is populated/refreshable on staging and readable by the JWT-scoped client (RLS/grants on the MV not verified live)                           | Criterion 2.3      | Tag Analytics repoint renders empty or errors; fallback is the honest-state variant — criterion still closable                        |
| A2  | `audit_log` embed/join to `public.users` for `user_email` requires a declared FK for PostgREST embed syntax; whether one exists was not verified live                 | AUDIT-42703        | use a second keyed query instead of an embed — same outcome, different syntax                                                         |
| A3  | Live `pg_policies` texts for the 3 tag policies match the migration file text (PARK-P93 confirms membership in the class, not the verbatim predicates)                | DR-42501           | rewrite target names still correct (PARK lists them); only the "current predicate" narration would differ                             |
| A4  | `custom_reports` by-id SELECT currently rejects with 42P17 for at least some sessions (inferred from WRITE-06 + the `useScheduledReports.ts:142` comment; not probed) | Criterion 3        | if it works, the report-builder loader lands cleanly now; if it rejects, the error state is the expected pre-P94 render — both honest |
| A5  | Staging still holds ≥1 engagement dossier with a missing extension row (COUNT-02 audit, 2026-08-15)                                                                   | Criterion 4 oracle | the synthetic-fixture path (service-role insert) is the constructible fallback either way                                             |
| A6  | `supabase.functions.invoke(..., { method: 'GET' })` behaves as a GET on supabase-js ^2.100 (installed)                                                                | Criterion 2        | field-permissions/tag hooks would need explicit fetch; the 200-with-19 probe fact suggests requests do reach the fn                   |

All other claims are [VERIFIED] against the tree or [CITED] from PARK-P93/RULING-P93-01/live-probe facts.

---

## Open Questions

1. **Anti-grant gate mechanics (D-12 — REQUIRED gate, mechanics unresolved).**
   What we know: assertion text is fixed (exactly one grantee, `postgres`); gates run bash; no DSN in
   `.env.test`; `information_schema` unreachable via PostgREST.
   Recommendation: operator adds `SUPABASE_DB_URL` → psql one-liner gate; fallback: MCP
   `execute_sql` evidence pasted into the drill table, labeled as not-mechanically-drillable.
2. **D-08 bucket (b) and toast sites — in or out of criterion 5's fix?**
   What we know: 7 boundary renders + 2 toast sites + `router/index.tsx` defaultErrorComponent render
   internals; D-08's population is JSX `error.message`, criterion 5's sentence is broader.
   Recommendation: fix bucket (a) + the router defaultErrorComponent + the global mutation `onError`
   fallback (3 seams, small diffs); leave per-boundary sweeps out unless the planner scopes them in.
3. **Tag policy predicate variant** — `is_platform_admin(auth.uid())` (recommended) vs inline
   `role IN ('admin','super_admin')` (field_permissions precedent). One-token decision; either
   satisfies D-10. Note `is_platform_admin` excludes `super_admin` unless that value also exists in
   `user_roles` — verify whether any staging user carries `role='super_admin'` before choosing.
4. **`AUDIT-DROP-01` fold-in** — CONTEXT records an overseer ruling pending on whether
   `auth.service.ts:847` attaches to the AUDIT-42703 plan. Planning proceeds FILED-not-folded; the
   plan should note where it would attach if the ruling lands mid-phase.

---

## Sources

### Primary (HIGH confidence)

- Working tree at `5c940ac6` (`milestone/v10.0-trust`) — every `file:line` in this document read directly
- `.tickmarkr/overseer/PARK-P93.md` + `RULING-P93-01-PARKS.md` (+ADDENDUM 1) — live-staging derivations, policy enumeration, verdicts
- `.planning/phases/93-failure-visibility/93-CONTEXT.md`, `93-UI-SPEC.md`; `.planning/GATE-STANDARD.md`; `.planning/REQUIREMENTS.md`; `.planning/ROADMAP.md` §93; `.planning/STATE.md`
- `supabase/migrations/{20260111700001,20260115500001,20260110000006,20260627000001,20260627000002,010_audit,013_rls_policies_content}*.sql`
- tanstack.com/router/latest/docs/framework/react/guide/not-found-errors — component-throw + fuzzy-mode propagation [CITED]

### Secondary (MEDIUM confidence)

- Project memory (auto-memory index): probe/CDP protocols, `pnpm exec` over `npx`, decision-coverage frontmatter-truth requirement — each re-verified against the tree where load-bearing

### Tertiary

- none (no WebSearch used; no external packages researched)

---

## Metadata

**Confidence breakdown:**

- TRUST-01 population + blast radius: HIGH — scanner + per-consumer reads
- Criterion 2 diagnoses: HIGH (field-permissions, data-retention, attachments — code-derived; Tag Analytics — stub + MV shape both read); the _live render today_ of each surface is inferred from code + audit, to be confirmed by the specs themselves
- Criterion 3/4 mechanics: HIGH for seams and API semantics; MEDIUM for TanStack component-throw edge behavior under React 19 concurrent rendering (docs-supported, not yet exercised in this tree)
- Inherited defects: HIGH — all four re-verified in tree; live claims cited from same-day PARK evidence
- Oracles: HIGH — template spec + probe both exist and ran in Phase 92

**Research date:** 2026-08-15
**Valid until:** ~2026-09-15 for code seams (single active branch); live-staging claims decay with any deploy/migration — re-probe before closing

RESEARCH-END
