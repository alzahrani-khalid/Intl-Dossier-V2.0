# Requirements: Intl-Dossier v10.0 Trust & Correctness

**Defined:** 2026-08-15
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

**Scope input:** `.planning/audits/live-audit-2026-08-15/INDEX.md` — a six-lane live-app audit
(190 route/tab URLs, EN + AR, 370 screenshots, 144 findings, 19 ship-blockers). Findings marked
**[V]** there were independently re-verified against source or the live database.

**Milestone goal:** Close the gap between what the app appears to do and what it actually does —
every failure admits it failed, every advertised write path works, and every surface tells the
truth about its data.

**Out of scope — verified already correct, do not re-open:** dossier overview tabs (all 8 types
render type-specific sections), demo routes (`/responsive-demo`, `/modern-nav-standalone` are
correctly `devModeGuard`-gated; `/dashboard/project-management` is an intentional redirect),
design-token discipline (zero raw hex, zero color literals, zero card shadows, zero gradients),
and RTL layout infrastructure (`dir="rtl"`, Tajawal, mirroring, zero horizontal overflow all
verified sound across six lanes).

## v1 Requirements

### AUTH — Authentication & session integrity

- [ ] **AUTH-01**: A user can sign out from the running app. The sidebar user card (or an equivalent shell control) exposes a working logout; `NavUser` — which already implements it and is imported nowhere — is mounted or its `logout()` path is wired to the live shell. **[V]**
- [ ] **AUTH-02**: Edge functions validate the caller's JWT. The 133 of 303 functions pinning `supabase-js@2.3x` with bare `getUser()` are migrated to `@supabase/supabase-js@2` + `getUser(token)`, so a valid session is not rejected. **[V]**
- [ ] **AUTH-03**: Session invalidation redirects the open tab. An `onAuthStateChange` subscription at the app root forces `/login` on `SIGNED_OUT`, instead of the page decaying into a "Member/Member" ghost state with the admin nav silently removed.
- [ ] **AUTH-04**: `/delegations` reports auth failure as failure. The `my-delegations` calls authenticate, and a rejected query renders an error state rather than "You haven't granted any delegations."
- [ ] **AUTH-05**: `/settings` is reachable from navigation and exposes the sign-out control.

### TRUST — Failure is visible, never rendered as emptiness

- [ ] **TRUST-01**: The data layer distinguishes a rejected query from an empty result. Repositories stop catching-and-returning `{ data: null }` (e.g. `analytics.repository.ts`), so the `isError` branches that already exist in the pages stop being dead code.
- [ ] **TRUST-02**: Every audited surface that currently shows a confident empty state over a failed request renders an error instead — at minimum `/admin/field-permissions` (shows "0 Permissions" while the DB holds **19 rules** **[V]**), `/admin/data-retention`, Tag Analytics (renders "Failed to load tags" for a query that _succeeded_), and position attachments (CORS-blocked → "No attachments yet").
- [ ] **TRUST-03**: A well-formed but nonexistent record ID renders a page-level not-found state, not "Check your connection and try again" after 24 skeletons — covering dossier detail, engagement detail, and report builder.
- [ ] **TRUST-04**: An engagement dossier whose extension row is missing renders a named, degraded state instead of a full chrome shell with no title. Server errors never leak internals to users (`/tasks/queue` currently shows the raw supabase-js string).

### WRITE — Advertised write paths actually write

- [ ] **WRITE-01**: An after-action record can be created and published from the UI. `AfterActionForm.tsx:131`'s `if (!initialData) return` no longer pins `isDirty` false in create mode, and the engagement route passes `canPublish` + `onPublish`. **[V]**
- [ ] **WRITE-02**: `/after-actions` lists records (PostgREST embed targets the table that holds the FK) and detail pages resolve `afterActions.loadError` through `t()` instead of printing the key.
- [ ] **WRITE-03**: `/intake/new` submits. The dossier picker writes to the RHF field the schema reads, so the form cannot simultaneously show "Linked to: OECD" and "At least one dossier is required".
- [ ] **WRITE-04**: Kanban accepts commitment drags. Board stage is mapped to `aa_commitments`' own lifecycle (`pending`/`in_progress`/`completed`/`cancelled`) at the mutation layer; failures surface the real message, never "Operation completed successfully" on a no-op.
- [ ] **WRITE-05**: Every `/settings` tab saves. The `users` write uses `.update().eq('id',…)` rather than an `.upsert()` that omits the NOT NULL `email`, and the notification-bridge step actually runs. **[V]**
- [ ] **WRITE-06**: Report generation works and scheduled reports can be created — the client/function field-name contract agrees (`type` vs `template`), and the mutually recursive `custom_reports` ↔ `report_shares` SELECT policies no longer raise `42P17`. **[V]**

### DEAD — No dead or lying surfaces

- [ ] **DEAD-01**: `/search` returns results for every query, including its own suggestion chips (no `Cannot read properties of undefined (reading 'forEach')`).
- [ ] **DEAD-02**: `/tasks/queue` renders its page; `assignments-queue` is deployed.
- [ ] **DEAD-03**: `/scenario-sandbox` either loads or shows an error — a backend 500 is never pixel-identical to "still loading".
- [ ] **DEAD-04**: `/monitoring` renders the SPA route (the Vite proxy no longer claims the whole prefix) or the route is deleted.
- [ ] **DEAD-05**: `/analytics` shows real data or is honestly disabled — no fabricated sparklines, donuts, or "Insights you'll gain" over a backend endpoint that does not exist.
- [ ] **DEAD-06**: `/custom-dashboard` queries columns that exist (`calendar_entries.event_date`, not `start_datetime` **[V]**), renders its chart, and computes real trend deltas instead of "0.0%" from aborted requests.
- [ ] **DEAD-07**: `/calendar` renders a grid (empty or not), `/calendar/new` mounts the create form, `/events` pads the month by the real weekday offset with month navigation, and `/word-assistant`'s status badge reflects a real probe.
- [ ] **DEAD-08**: Route-tree conflicts resolved — `positions/$id.tsx` vs `$positionId.tsx`, and `legislation.tsx` renders an `<Outlet/>` so its detail page is reachable. Positions `approvals`/`versions` child routes drive tab state.

### COUNT — Every surface counts the same work the same way

- [ ] **COUNT-01**: One source of truth for work-item counts. The dashboard KPI, `/my-work` badge/footer/rows, `/commitments` tabs, and the kanban board agree — no screen shows badge 18 / footer 21 / 11 rendered rows.
- [ ] **COUNT-02**: Type-list queries left-join their extension tables (or the counters use the same join), so a dossier without an extension row is never dropped from the list while the hub still counts it (persons 16 vs 15 **[V]**, engagements 5 vs 3).
- [ ] **COUNT-03**: Completion is consistent — `status` and `workflow_stage` stay in sync, so completed tasks leave the dashboard's "Overdue" widget and the kanban Done column can fill.

### NAV — Nothing built is unreachable

- [ ] **NAV-01**: Elected Officials is reachable — sidebar, dossier hub type cards, `/dossiers/create`, and `/compare` expose all 8 declared dossier types, not 7.
- [ ] **NAV-02**: The `/settings/*` subtree renders navigation. The prefix check that hides the global sidebar and the exact-match check that renders the settings nav no longer disagree.
- [ ] **NAV-03**: The engagement Digests tab appears in the tab bar; list pages expose a create affordance (7 of 8 currently have none).
- [ ] **NAV-04**: Every route with no inbound link is resolved — 9 admin routes plus `/monitoring` are each given a nav entry or deleted, with the decision recorded.

### COPY — The UI speaks to users, not to developers

- [ ] **COPY-01**: No database value is shown as user copy — `in_progress`, `action_item`, `follow_up`, `email`, `human_entered`, `WEEK OF 2026-W27` are mapped through display labels.
- [ ] **COPY-02**: No raw i18n key reaches the screen — `regions.Europe`, `afterActions.loadError`, `CALENDAR.RECURRENCE.TITLE`, `common.loading`, and the five `entityLinks.*` keys resolve.
- [ ] **COPY-03**: No seed or test instruction ships as user copy — the 4 strings in `dashboard-widgets.json` (both locales) that tell users to apply the dashboard seed or check the test data are rewritten. **[V]**
- [ ] **COPY-04**: Copy obeys the project's own voice rules — sentence case (Title Case is currently de-facto), no exclamation marks (46 strings), no first-person plural (8 strings), no `"Deadline / Due Date"` chip shipping a retired term.
- [ ] **COPY-05**: One date formatter. All surfaces render `Tue 28 Apr` / `14:30 GST`; the seven competing formats (`Jul 4, 2026`, `4/30/2026, 12:37:38 PM`, `9 months ago`, …) are gone, and dev-facing affordances like "Fill with Mock Data" are gated out of production builds.

### AR — Arabic translation coverage (layout infrastructure is already sound)

- [ ] **AR-01**: One Arabic glossary for core objects, applied across all namespaces — dossier is one term (not دوسيه / ملف / دوسييه), and a nav label always matches the title of the page it opens (currently الارتباطات → المشاركات, البلدان → الدول).
- [ ] **AR-02**: Dates and times localize in Arabic — no English weekday/month names inside Arabic sentences. (Latin digits remain the deliberate project policy.)
- [ ] **AR-03**: No English string renders under `dir="rtl"` on an otherwise-Arabic screen — including the 404 page, the intake queue header and its primary button, the position read-only banner, and search suggestion chips.
- [ ] **AR-04**: Dot-form `t()` keys with English defaults are eliminated in favour of colon namespaces, so a missing Arabic key cannot silently render English in both languages.

### DATA — Staging data is plausible, not test residue

- [ ] **DATA-01**: `/users` shows real staff — the ~415 fixture accounts (`*@example.com`, `*@gastat.test`) are purged and the E2E suite cleans up after itself.
- [ ] **DATA-02**: No record visible in the UI names an internal artifact — "Phase 70 staging verification digest", "Phase 52 Kanban Fixture Engagement", "E2E MoU 1783364705954", "UAT round-11 commitment" are removed or replaced with plausible diplomatic data.

### DBSEC — Database security posture

- [ ] **DBSEC-01**: The `SECURITY DEFINER` views reachable from the client are resolved. 207 frontend files query Supabase directly with RLS as the only authorization boundary; 33 views bypass it, including `unified_work_items` (queried from 10 frontend files). Each is converted to `security_invoker`, restricted, or explicitly justified in writing.
- [ ] **DBSEC-02**: No view exposes `auth.users` to `anon`/`authenticated` — `upcoming_milestones` and `entity_comments_with_details` (the latter queried from the frontend).
- [ ] **DBSEC-03**: The 12 materialized views selectable by `anon`/`authenticated` are revoked or moved behind a gated RPC.
- [ ] **DBSEC-04**: Tables with RLS enabled and no policies are resolved — `intelligence_email_queue` and `events.idempotency_keys` currently deny everything.
- [ ] **DBSEC-05**: Leaked-password protection is enabled and the 548 functions with mutable `search_path` are pinned.

### CARRY — v9.0 carry-forward (see `.planning/STATE.md` → "v9.0 Carried Forward")

- [ ] **CARRY-01**: P88-02 — credential rotation completed (operator-only act; gates CARRY-02 and CARRY-05).
- [ ] **CARRY-02**: CI-01 — E2E suite green against the deployed app, or honestly quarantined with a tracked reason per spec.
- [ ] **CARRY-03**: CI-02 — integration suite green; decision D-3 resolved.
- [ ] **CARRY-04**: ORCH-2 — at least one a11y spec **proven to PASS**. No a11y spec has ever been shown green; the debt was closed as annotated skips.
- [ ] **CARRY-05**: CI-05 — `test-rtl-smokes` promoted to a required branch-protection context.
- [ ] **CARRY-06**: VISUAL-DEBT-01 — the frozen-clock vs server-`NOW()` divergence removed so dashboard snapshots stop rotting daily. Regenerating baselines is explicitly _not_ a fix.
- [ ] **CARRY-07**: Entry-chunk budget lowered back toward 476 KB (raised to 500 KB at v9.0 close; actual 493.71 kB gzipped). The growth is app code, not vendor.
- [ ] **CARRY-08**: The 3 data-entry quick tasks (`260530-w2/w3/w4`) are completed or formally retired with SUMMARYs.
- [ ] **CARRY-09**: `main` is green on the currently-red non-required suites — E2E, integration, Accessibility (RTL + WCAG AA), RTL Portal + Component Smokes, RTL + Responsive, Docker Build — or each is honestly quarantined.

### LIVE — v7.0 live verification (HARDWARE-GATED, unchanged from v9.0)

- [ ] **LIVE-01**: vLLM (Gemma-4-12B) + TEI (BGE-M3) serving with passing health checks, reachable by the agent-runtime (:4100).
- [ ] **LIVE-02**: The v7.0 eval harness runs against live inference and meets its CI thresholds (EVAL-01/02/03).
- [ ] **LIVE-03**: The copilot reads and HITL-writes under the caller's JWT against the live stack, with the clearance ceiling verified end-to-end (an L1 caller's results a strict subset of an L3 caller's).

> **LIVE is gated on an undecided on-prem GPU host.** It blocked v9.0 for 40 days without starting.
> Plan-phase must confirm a target environment before committing, or the group should be parked.

## Deferred / Not in v1

- Entry-bundle _diagnosis_ beyond the diet (which specific commits added 17.71 kB) — CARRY-07 covers the outcome, not the archaeology.
- Non-audited surfaces: nothing outside the 190 routes the audit covered is in scope.

## Traceability

Every v1 requirement maps to exactly one phase. 58/58 mapped, 0 orphaned, 0 duplicated.

<!-- prettier-ignore -->
| Requirement | Phase | Status |
| ----------- | ----- | ------ |
| AUTH-01 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| AUTH-02 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| AUTH-03 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| AUTH-04 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| AUTH-05 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| TRUST-01 | Phase 93 — Failure Visibility | Pending |
| TRUST-02 | Phase 93 — Failure Visibility | Pending |
| TRUST-03 | Phase 93 — Failure Visibility | Pending |
| TRUST-04 | Phase 93 — Failure Visibility | Pending |
| WRITE-01 | Phase 94 — Write Paths | Pending |
| WRITE-02 | Phase 94 — Write Paths | Pending |
| WRITE-03 | Phase 94 — Write Paths | Pending |
| WRITE-04 | Phase 94 — Write Paths | Pending |
| WRITE-05 | Phase 94 — Write Paths | Pending |
| WRITE-06 | Phase 94 — Write Paths | Pending |
| DEAD-01 | Phase 95 — Routes That Don't Render | Pending |
| DEAD-02 | Phase 95 — Routes That Don't Render | Pending |
| DEAD-03 | Phase 95 — Routes That Don't Render | Pending |
| DEAD-04 | Phase 95 — Routes That Don't Render | Pending |
| DEAD-05 | Phase 96 — Real Numbers | Pending |
| DEAD-06 | Phase 96 — Real Numbers | Pending |
| DEAD-07 | Phase 96 — Real Numbers | Pending |
| DEAD-08 | Phase 95 — Routes That Don't Render | Pending |
| COUNT-01 | Phase 96 — Real Numbers | Pending |
| COUNT-02 | Phase 96 — Real Numbers | Pending |
| COUNT-03 | Phase 96 — Real Numbers | Pending |
| NAV-01 | Phase 97 — Reachability | Pending |
| NAV-02 | Phase 97 — Reachability | Pending |
| NAV-03 | Phase 97 — Reachability | Pending |
| NAV-04 | Phase 97 — Reachability | Pending |
| COPY-01 | Phase 98 — Copy Truth | Pending |
| COPY-02 | Phase 98 — Copy Truth | Pending |
| COPY-03 | Phase 98 — Copy Truth | Pending |
| COPY-04 | Phase 98 — Copy Truth | Pending |
| COPY-05 | Phase 98 — Copy Truth | Pending |
| AR-01 | Phase 99 — Arabic Coverage | Pending |
| AR-02 | Phase 99 — Arabic Coverage | Pending |
| AR-03 | Phase 99 — Arabic Coverage | Pending |
| AR-04 | Phase 99 — Arabic Coverage | Pending |
| DATA-01 | Phase 102 — Staging Data & Debt Tail | Pending |
| DATA-02 | Phase 102 — Staging Data & Debt Tail | Pending |
| DBSEC-01 | Phase 100 — Database Security Posture | Pending |
| DBSEC-02 | Phase 100 — Database Security Posture | Pending |
| DBSEC-03 | Phase 100 — Database Security Posture | Pending |
| DBSEC-04 | Phase 100 — Database Security Posture | Pending |
| DBSEC-05 | Phase 100 — Database Security Posture | Pending |
| CARRY-01 | Phase 92 — Session Integrity & Edge-Function Auth | Pending |
| CARRY-02 | Phase 101 — CI Gates Green | Pending |
| CARRY-03 | Phase 101 — CI Gates Green | Pending |
| CARRY-04 | Phase 101 — CI Gates Green | Pending |
| CARRY-05 | Phase 101 — CI Gates Green | Pending |
| CARRY-06 | Phase 102 — Staging Data & Debt Tail | Pending |
| CARRY-07 | Phase 102 — Staging Data & Debt Tail | Pending |
| CARRY-08 | Phase 102 — Staging Data & Debt Tail | Pending |
| CARRY-09 | Phase 101 — CI Gates Green | Pending |
| LIVE-01 | Phase 104 — v7.0 Live Verification (HARDWARE-GATED) | Pending |
| LIVE-02 | Phase 104 — v7.0 Live Verification (HARDWARE-GATED) | Pending |
| LIVE-03 | Phase 104 — v7.0 Live Verification (HARDWARE-GATED) | Pending |

> **LIVE-01/02/03 (Phase 104) are hardware-gated** on an on-prem GPU host that has not been chosen. Phase 104 is terminal and depends on no other phase; the recommendation recorded in the roadmap is to ship v10.0 at 55/58 and carry LIVE to v11.0 if the host is still undecided when Phase 103 closes.
