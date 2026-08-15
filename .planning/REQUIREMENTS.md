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
- [ ] **AUTH-02**: Edge functions validate the caller's JWT. The 133 `index.ts` files pinning `supabase-js@2.3x` are migrated to `@supabase/supabase-js@2` and pass the caller's token explicitly — `getUser(token)` — so a valid session is not rejected. Verify by re-deriving the population, never by re-quoting the count: `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l` → `0`. **[V]**
  > **Wording corrected 2026-08-15** (Phase 92 planning, `RULING-P92-02`). This read "the 133 of 303 functions pinning `supabase-js@2.3x` **with** bare `getUser()`". That conjunction is false: 133 `index.ts` files pin `2.3x`, 163 files call bare `auth.getUser()`, and only **53** are both — no single set satisfied the sentence as written. The 133 came from the audit's own pin-only command (`audits/live-audit-2026-08-15/adminops.md:97`); the `with bare getUser()` clause was introduced when `INDEX.md` consolidated the six lanes. Scope decided by the operator: migrate all 133.
- [ ] **AUTH-03**: Session invalidation redirects the open tab. An `onAuthStateChange` subscription at the app root forces `/login` on `SIGNED_OUT`, instead of the page decaying into a "Member/Member" ghost state with the admin nav silently removed.
- [ ] **AUTH-04**: `/delegations` reports auth failure as failure. The `my-delegations` calls authenticate, and a rejected query renders an error state rather than "You haven't granted any delegations."
- [ ] **AUTH-05**: `/settings` is reachable from navigation and exposes the sign-out control.

### TRUST — Failure is visible, never rendered as emptiness

- [ ] **TRUST-01**: The data layer distinguishes a rejected query from an empty result. Repositories stop catching-and-returning `{ data: null }` (e.g. `analytics.repository.ts`), so the `isError` branches that already exist in the pages stop being dead code.
- [ ] **TRUST-02**: Every audited surface that currently shows a confident empty state over a failed request renders an error instead — at minimum `/admin/field-permissions` (shows "0 Permissions" while the DB holds **19 rules** **[V]**), `/admin/data-retention`, Tag Analytics (renders "Failed to load tags" for a query that _succeeded_), and position attachments (CORS-blocked → "No attachments yet").
- [ ] **TRUST-03**: A well-formed but nonexistent record ID renders a page-level not-found state, not "Check your connection and try again" after 24 skeletons — covering dossier detail, engagement detail, and report builder.
- [ ] **TRUST-04**: An engagement dossier whose extension row is missing renders a named, degraded state instead of a full chrome shell with no title. Server errors never leak internals to users (`/tasks/queue` currently shows the raw supabase-js string).

### UNMASKED — data-layer defects Phase 92 made observable by fixing the 401

> Filed 2026-08-15 during Phase 92 execution (`RULING-P92-46`), each reproduced against staging
> `zkrcjzdemdmwhearhfgg` by a second seat rather than carried from a worker report. **None was
> caused by the AUTH-02 migration** — that migration changed only the import specifier and the
> `getUser` argument, and the header-injected-client count is unchanged from `phase-92-base`. The
> 401 previously short-circuited every request before the handler ran, so these are pre-existing
> defects that became visible for the first time. Only `DELEG-01` is the failure-as-emptiness class;
> the other two fail loudly.

- [ ] **DELEG-01**: **`my-delegations` reads a relation that does not exist, and renders the failure as emptiness.** `supabase/functions/my-delegations/index.ts:129,150` query `.from("delegations")`; `public.delegations` does not exist (`42P01`). The handler swallows the PostgREST error to `console.error` at `:197`/`:233` and falls through to empty arrays, so deployed staging returns a confident `200` with `{"granted":[],"received":[],"total":0}` — the exact anti-pattern this milestone exists to kill, on an AUTH-04 surface. Repointing requires a product decision between `public.permission_delegations` (14 cols: `grantor_id, grantee_id, resource_type, resource_id, permissions, revoked, …`) and `public.position_delegations` (8 cols: `position_id, delegator_id, delegate_id, …`), then a column-by-column rewrite: the handler filters on `is_active` (**neither table has it** — `permission_delegations` has `revoked`) and selects a `source` column that exists on neither. Phase 92 closed AUTH-04's **error** half only and named this open.
- [ ] **DR-42501**: **`data-retention` is auth-closed but not surface-closed.** Its 401 is gone (migrated + deployed in Phase 92), but `index.ts:112` does `supabase.from('users').select('role')` through the correctly RLS-scoped client, and the `authenticated` role has no grant/policy for that read — Postgres returns `42501 permission denied for table users` before the `data_retention_policies` query at `:233` ever runs, so the function 500s with a well-formed bilingual error body. **The defect is the role-lookup design, not the scoping** — the scoped client is behaving correctly. Refines `TRUST-02`, which already names `/admin/data-retention`: the surface's blocker is now identified rather than assumed. Phase 93 must not inherit "data-retention works".
- [ ] **PIN-2390-01**: **Six deployed functions still bundle a `2.39.0` client, because the AUTH-02 derivation only greps `index.ts`.** Found during Phase 92 execution verification (2026-08-15), not by any gate. Criterion 2's own closing command is `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts'` → `0`, and that is true. But two **non-`index.ts`** files under `supabase/functions` still pin `2.3x`, and both are imported by migrated, deployed `index.ts` files, so the deployed bundles re-fetch the deprecated specifier: (a) `_shared/ai-interaction-logger.ts:12` imports **`createClient` as a value** from `esm.sh/@supabase/supabase-js@2.39.0` and **constructs a client with it at `:149`** — imported by 5 in-population functions (`ai-interaction-logs`, `ai-summary-generate`, `dossier-field-assist`, `positions-consistency-check`, `translate-content`); (b) `dossier-stats/dashboard-aggregations.ts:1` imports `SupabaseClient` from `esm.sh/…@2.39.0`, used as a type annotation only at `:32`, imported by `dossier-stats/index.ts:4`. **Not an auth regression** — (a) builds a _service-role_ client, and every `getUser` auth path runs through the migrated `index.ts` on `@2`, which is why all 6 probe non-401. The gap is that criterion 2's population was defined as `index.ts` files, so a helper carrying the pin is invisible to the closing derivation. Fix: bump both helpers and redeploy the 6 importers; widen the derivation to `--include='*.ts'`.
- [ ] **AUDIT-42703**: **`audit-logs-viewer` queries a column shape and a relation that do not exist.** Two distinct defects: (a) `index.ts:51,192,209,285` select `table_name, operation, row_id, old_data, new_data, changed_fields, user_email, user_role` from `public.audit_log`, whose real columns are `id, tenant_id, entity_type, entity_id, action, user_id, timestamp, old_values, new_values, ip_address, user_agent, session_id, additional_context` — Postgres `42703`. Note `audit_log` **holds 75 rows**, so this is a live table the surface cannot read; the sibling `public.audit_logs` (16 cols, 0 rows) is closer in spirit but still lacks `table_name`, `row_id`, `changed_fields`, `user_email`. (b) `index.ts:277` queries `public.audit_statistics`, which **does not exist at all**. Fails loudly (500 with a diagnostic body), so it is not the `TRUST` emptiness class — but the surface is non-functional.

### WRITE — Advertised write paths actually write

- [ ] **WRITE-01**: An after-action record can be created and published from the UI. `AfterActionForm.tsx:131`'s `if (!initialData) return` no longer pins `isDirty` false in create mode, and the engagement route passes `canPublish` + `onPublish`. **[V]**
- [ ] **WRITE-02**: `/after-actions` lists records (PostgREST embed targets the table that holds the FK) and detail pages resolve `afterActions.loadError` through `t()` instead of printing the key.
- [ ] **WRITE-03**: `/intake/new` submits. The dossier picker writes to the RHF field the schema reads, so the form cannot simultaneously show "Linked to: OECD" and "At least one dossier is required".
- [ ] **WRITE-04**: Kanban accepts commitment drags. Board stage is mapped to `aa_commitments`' own lifecycle (`pending`/`in_progress`/`completed`/`cancelled`) at the mutation layer; failures surface the real message, never "Operation completed successfully" on a no-op.
- [ ] **WRITE-05**: Every `/settings` tab saves. The `users` write uses `.update().eq('id',…)` rather than an `.upsert()` that omits the NOT NULL `email`, and the notification-bridge step actually runs. **[V]**
- [ ] **WRITE-06**: Report generation works and scheduled reports can be created — the client/function field-name contract agrees (`type` vs `template`), and the mutually recursive `custom_reports` ↔ `report_shares` SELECT policies no longer raise `42P17`. **[V]**
- [ ] **AUDIT-DROP-01**: **Security audit events are silently discarded by the backend.** Filed 2026-08-15 from Phase 93 planning (`RULING-P93-01` D-54 addendum), found while discharging `AUDIT-42703`'s live-relation condition. `backend/src/services/auth.service.ts:847` (`logSecurityEvent`) does `supabaseAdmin.from('audit_log').insert({ user_id, action, resource_type, details, timestamp })`. **`resource_type` and `details` are not columns of `public.audit_log`** — its real columns are `id, tenant_id, entity_type, entity_id, action, user_id, timestamp, old_values, new_values, ip_address, user_agent, session_id, additional_context` — so every such insert fails, and the call is wrapped in a `try/catch` that only calls `logError`. The failure is therefore invisible to the caller and no security event has ever been recorded through this path. Same class as `TRUST-01` (a failure rendered as success), on a security path, and **not** covered by any Phase 93 criterion — which is why it is filed here rather than folded. Fix: map to the real columns (`entity_type: 'security'`, `additional_context: details`), and stop swallowing the insert error. **[V]** — column list and the code site both re-derived against live staging `zkrcjzdemdmwhearhfgg`, 2026-08-15.
- [ ] **AUDIT-ZERO-01**: **20 edge functions write an audit-log shape that `public.audit_logs` has never had, and drop the failures silently.** Filed 2026-08-15 from Phase 93 planning, same ruling. `audit_logs` holds **0 rows** despite 32 files inserting into it. Cause is **column mismatch, not dead code and not RLS**: 20 of the 32 insert an `event_type` / `resource_type` / `changes` / `metadata` / `target_user_id` shape, and **none of those five is a column** of `audit_logs` (real columns: `id, entity_type, entity_id, action, old_values, new_values, user_id, user_role, ip_address, user_agent, required_mfa, mfa_verified, mfa_method, correlation_id, session_id, created_at`). An `INSERT` naming a nonexistent column cannot succeed (`42703` / PostgREST `PGRST204`), and most sites `await` the insert without destructuring `error`, so the drop is silent. Representative: `supabase/functions/assign-role/index.ts:244`. Several of the remaining 12 also carry non-column keys (`actor_id`, `details`, `metadata`); the genuinely schema-correct writers are the `intake-tickets-*` family (6 files) plus `intake-classification`, whose absence of rows is explained by those flows never having been exercised on staging rather than by any defect. **Population definition:** files under `supabase/functions` containing `from('audit_logs').insert`; top-level payload keys compared against `information_schema.columns`. **Outside it:** nested-object keys were not individually validated, `.upsert()` and RPC-mediated writes were not searched, and the backend Express tree was searched separately (see `AUDIT-DROP-01`). Fix: one audit-write helper with the real column set, error surfaced not swallowed. **[V]**

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
  > **Unreachable _module_ filed here during Phase 92 planning, 2026-08-15** (`RULING-P92-06`), since
  > this is the requirement that resolves things nothing can reach. `frontend/src/services/auth.ts`
  > is imported by **zero files** (`grep -rn "services/auth'" frontend/src | grep -v '^frontend/src/services/auth.ts'`).
  > It is not merely dead: at `:624` it persists a **second zustand store under the same
  > `'auth-storage'` key** as the live `store/authStore.ts:253`, and it registers its own
  > module-level `onAuthStateChange` at `:635`. Both are inert only because nothing imports it —
  > any future import silently gives the app two stores fighting over one persist key. Resolve it
  > the way this requirement resolves a dead route: delete it, or give it an owner and record why.
  > **Phase 92 deliberately did not touch it** — it verified the module is dead (which is why
  > AUTH-03 fixes `authStore` instead) and filed it rather than widening its own scope.

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
- [ ] **AR-04**: A missing Arabic key cannot silently render English in both languages. **This is two
      independent fixes with separate acceptance — neither implies the other, and they must not be
      collapsed back into one clause.**
  - [ ] **AR-04a — remove the MASK, without creating a visible regression.** No `t()` call passes an
        English default as its second argument. The second argument is what makes the gap invisible:
        when a key is missing, `t('some.key', 'English default')` renders plausible English instead of
        leaking a raw key, so nothing looks broken in either locale and no one notices. **This is the
        clause that closes Phase 99's criterion 4.**

        **Acceptance is a CONJUNCTION — both, never the first alone:**

        ```bash
        # (a) no masks remain
        grep -rhoE "t\(\s*'[^']+'\s*,\s*'[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l   # -> 0
        # (b) AND every referenced key resolves in BOTH locales (en and ar), namespace-aware
        #     — see the audit script referenced in the note below; must report 0 unresolved
        ```

        **Required ORDER — authoring first, deletion last:**
        1. Author the missing keys in `en` **and** `ar`.
        2. Verify every referenced key resolves in both locales.
        3. **Only then** drop the second arguments.

        > **This clause is a translation-authoring task, not a mechanical sweep.** Scoping Phase 99
        > as a find-and-replace will under-resource it by the size of the authoring work.

  - [ ] **AR-04b — fix namespace RESOLUTION.** Keys resolve through explicit colon namespaces rather
        than dot form, so a key lands in the namespace it names. Acceptance:

        ```bash
        grep -rhoE "t\(\s*'[^']*\.[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l  # dot-form
        grep -rhoE "t\(\s*'[^']*:[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l   # colon-form
        ```

  > **AR-04a is destructively satisfiable if you only run check (a) — measured, 2026-08-15,
  > `RULING-P92-08`.** A large fraction of mask sites reference keys that **do not resolve in the EN
  > locale at all**; they render today _only_ because of the English default. Running
  > "two-arg grep -> 0" naively converts those sites from plausible-English into **raw key strings in
  > EN and AR alike** — trading an invisible defect for a visible regression, while passing the
  > acceptance command. That is why acceptance is a conjunction and why the order is fixed.
  >
  > Reproduce with `node scripts/i18n-mask-audit.mjs` (committed for Phase 99). Two independent
  > derivations, 2026-08-15:
  >
  > | derivation                                | total 2-arg sites | unresolved in EN | distinct keys |     share |
  > | ----------------------------------------- | ----------------: | ---------------: | ------------: | --------: |
  > | first pass, namespace-unaware (corrected) |              1800 |              472 |           407 |     26.2% |
  > | **namespace-aware** (operative)           |              1800 |          **516** |       **444** | **28.7%** |
  >
  > **Two independent instruments agree on the denominator to the site: 1800.** The first pass
  > initially reported 1826; that +26 was a regex artefact — `t\(` without a word boundary also
  > matches the tail of any identifier ending in `t`, e.g. `formatDayFirst('2026-04-28T12:00:00')`
  > in `lib/__tests__/format-date.test.ts`. Corrected, the two totals coincide exactly. Recorded so
  > it is not rediscovered: **there is no date-string-passed-as-a-translation-key bug** in this
  > codebase — that finding was the same artefact.
  >
  > The namespace-aware derivation models what the first did not — the per-file default namespace
  > from `useTranslation('ns')` and colon-form explicit namespaces — and the figure went **up**, not
  > down. (Ignoring namespaces entirely reports 1611 / 89.5%, so the modelling matters a great deal;
  > it just does not rescue the finding.) Roughly **440+ distinct keys must be authored in two
  > locales** before a single default is dropped.
  >
  > **Why the split (Phase 92 planning, 2026-08-15, `RULING-P92-07`).** This requirement previously
  > read "dot-form `t()` keys with English defaults are eliminated in favour of colon namespaces" —
  > one sentence fusing two orthogonal fixes. **Masking and resolution are independent:**
  > `t('common:logout', 'Logout')` is fully colon-form and **still renders "Logout"** when the key
  > misses. As written, a planner could convert every key to colon form, pass AR-04, and leave every
  > mask standing — closing the requirement without closing the defect.
  >
  > **The populations differ, so the two clauses cannot share a check.** Derived 2026-08-15 with the
  > commands above: **1716 mask sites across 179 files**; dot-form **8003** vs colon-form **992**.
  > Do not quote these as the target — they move as the codebase moves; re-derive. (An earlier
  > cross-check reported 1683 / 3587 / 391 from a narrower regex containing a bad backreference;
  > those figures are superseded, not an equally-valid second reading.)
  >
  > **Known instance already fixed:** Phase 92 repoints `navigation.logout` -> `common.logout` at
  > `nav-user.tsx:94` **and drops the second argument** — AUTH-01's sign-out label, which rendered
  > English under `dir="rtl"`. It deliberately keeps the **dot** form to match surrounding code, so it
  > satisfies AR-04a while remaining inside AR-04b's population; Phase 99 sweeps that line with the
  > rest rather than treating it as an exception.

### DATA — Staging data is plausible, not test residue

- [ ] **DATA-01**: `/users` shows real staff — the ~415 fixture accounts (`*@example.com`, `*@gastat.test`) are purged and the E2E suite cleans up after itself.
- [ ] **DATA-02**: No record visible in the UI names an internal artifact — "Phase 70 staging verification digest", "Phase 52 Kanban Fixture Engagement", "E2E MoU 1783364705954", "UAT round-11 commitment" are removed or replaced with plausible diplomatic data.
- [ ] **SEED-DELEG-01**: **`/delegations` has no rows to render anywhere this project deploys.** Filed 2026-08-15 (Phase 92 execution, `RULING-P92-46`); measured on staging `zkrcjzdemdmwhearhfgg`: `permission_delegations` = **0 rows**, `position_delegations` = **0 rows**. Even after `DELEG-01` repoints the handler at the correct table, the happy path renders the empty state — so AUTH-04 criterion 4's second half ("renders real delegations when they are not rejected") is not demonstrable by code alone and additionally needs seed data. Phase 92's e2e oracle deliberately accepts either real cards **or** the legitimate empty state, so it does not go red on this; it also does not prove the happy path.
- [ ] **DELEG-02**: **Decide which relation `my-delegations` reads, and repoint it.** Filed 2026-08-15 from Phase 93 planning (`RULING-P93-01` §02). Phase 93 closes `DELEG-01` as **visibility only** — the handler stops swallowing the `42P01` on the nonexistent `public.delegations` and `/delegations` renders an honest error state — and deliberately does **not** choose a table, because the choice is a product decision and both candidates hold 0 rows, so a repoint would buy an identical empty screen. This requirement lands here rather than in Phase 93 because **seeding forces the choice**: the phase that seeds is the phase that decides, and that is this one (see `SEED-DELEG-01`). Candidates, columns re-derived 2026-08-15: `permission_delegations` (14 cols — `id, grantor_id, grantee_id, resource_type, resource_id, permissions, reason, valid_from, valid_until, revoked, revoked_at, revoked_by, created_at, updated_at`) vs `position_delegations` (8 cols — `id, position_id, delegator_id, delegate_id, reason, expires_at, status, created_at`). The handler filters on `is_active` and selects `source`; **neither column exists on either table** (`permission_delegations` expresses the idea as `revoked`, `position_delegations` as `status`), so whichever is chosen needs a column-by-column rewrite of the select, the filter, and the `grantor:auth.users!…` embeds. **Until this lands, `/delegations` visibly errors — that is Phase 93's intended outcome, not a regression.** Full evidence: `.tickmarkr/overseer/PARK-P93.md` §PARK-P93-02.

### DBSEC — Database security posture

- [ ] **DBSEC-01**: The `SECURITY DEFINER` views reachable from the client are resolved. 207 frontend files query Supabase directly with RLS as the only authorization boundary; 33 views bypass it, including `unified_work_items` (queried from 10 frontend files). Each is converted to `security_invoker`, restricted, or explicitly justified in writing.
- [ ] **DBSEC-02**: No view exposes `auth.users` to `anon`/`authenticated` — `upcoming_milestones` and `entity_comments_with_details` (the latter queried from the frontend).
- [ ] **DBSEC-03**: The 12 materialized views selectable by `anon`/`authenticated` are revoked or moved behind a gated RPC.
- [ ] **DBSEC-04**: Tables with RLS enabled and no policies are resolved — `intelligence_email_queue` and `events.idempotency_keys` currently deny everything.
- [ ] **DBSEC-05**: Leaked-password protection is enabled and the 548 functions with mutable `search_path` are pinned.
- [ ] **RLS-AUTHUSERS-01**: **11 RLS policies gate access on a subquery against `auth.users`, which no client role may read — so they raise `42501` instead of deciding.** Filed 2026-08-15 from Phase 93 planning (`RULING-P93-01` order 2/3), which fixes the 4 policies its own criteria exercise and leaves these. **Population definition:** every `pg_policy` on a table in schema `public` whose `USING` or `WITH CHECK` expression text matches `auth\.users`, derived from the live catalog on staging `zkrcjzdemdmwhearhfgg` — **15 policies across 13 tables**, of which Phase 93 fixes 4 (`data_retention_policies` ×1, `tag_categories` ×2, `entity_tag_assignments` ×1) and **11 remain**: `content_expiration_rules`, `duplicate_detection_settings`, `entity_content_translations`, `entity_retention_status`, `invitation_message_templates`, `legal_holds`, `position_consistency`, `position_consistency_checks` (×3), `retention_execution_log`. **Outside the population, unsearched:** policies that reach `auth.users` indirectly through a `SECURITY DEFINER` function or a view, and non-`public` schemas — **15 is a lower bound, not a total.** Fix each by replacing the predicate with the project's unified authz read (`public.users.role` keyed on `auth.uid()`), deleting the `raw_*_meta_data` reads rather than keeping them alongside.

  > **DO NOT `GRANT SELECT ON auth.users TO authenticated` — and the database will tell you to.** Every one of these failures ends with `HINT: Grant the required privileges to the current role with: GRANT SELECT ON auth.users TO authenticated;`. Taking that hint makes the `42501` vanish and, in the same statement, converts **8 fail-closed policies into a live self-service privilege escalation**: they gate admin access on `raw_user_meta_data->>'role'`, which any session can set on itself via `auth.updateUser({ data })`. Six of the 8 are `ALL` (read + write) and one (`duplicate_detection_settings`) is granted to `public`, i.e. reachable by `anon`. **Measured 2026-08-15: they are latent, not live** — `SELECT` on `auth.users` is granted to exactly one grantee (`postgres`, which owns the tables and is not subject to their RLS; `relforcerowsecurity = false` on all 8), so no role is simultaneously subject to these policies and able to evaluate them. The safety is the bug. Verify with `select grantee from information_schema.table_privileges where table_schema='auth' and table_name='users' and privilege_type='SELECT';` — expect exactly one row, `postgres`. Full derivation and both fail-closed probes: `.tickmarkr/overseer/PARK-P93.md` §PARK-P93-01.

### CLIENTSEC — Client-side security posture

> Distinct from DBSEC on purpose: DBSEC is the database boundary, this is what the _browser_
> retains. Filing client-side findings under DBSEC hides them inside a database-shaped scope.

- [ ] **CLIENTSEC-01**: **Sign-out clears client-side residue.** Signing out leaves the previous user's
      data on the machine: `localStorage` is never wiped, so on a shared analyst workstation the next
      user inherits it — in a product whose access model is `sensitivity_level <= clearance`.
      Verified 2026-08-15 (Phase 92 planning); **nothing wipes any of this on logout**:
      persisted zustand stores `auth-storage` (`store/authStore.ts:253`), a duplicate `auth-storage` in
      the dead module (`services/auth.ts:624`, see NAV-04), `entity-history-storage`
      (`store/entityHistoryStore.ts:114`), `ui-storage` (`store/uiStore.ts:139`),
      `pinned-entities-storage` (`store/pinnedEntitiesStore.ts:132`), `dossier-store`
      (`store/dossierStore.ts:501`); raw writers `advanced-search-history`
      (`domains/search/hooks/useAdvancedSearch.ts:67`) and `quickswitcher_recent_items`
      (`domains/dossiers/hooks/useQuickSwitcherSearch.ts:19`).
      **The sensitive part is not settings — it is history.** Entity history, recent items and search
      history record _which dossiers the previous analyst opened and what they searched for_;
      `entityHistoryStore`'s own docstring states it "persists the last 10 entities viewed", so the
      retention is the store's **stated purpose**, not an accident.
      **Lead:** `utils/storage/preference-storage.ts:15` already defines `WIPE_GUARD_KEY`
      (`id.legacy-wipe.v1`, used `:24`/`:28`) — check its semantics before writing a new wipe.
      **Relationship to Phase 92:** that phase adds `queryClient.clear()` at the single sign-out seam
      because it would otherwise _introduce_ an in-memory cache regression on three new soft-navigating
      paths. This requirement is the **pre-existing, persisted** half and was deliberately not swept
      there. Phase 92's "query cache empty after sign-out" criterion establishes the in-memory cache and
      says nothing about `localStorage`.

### E2ESTALE — shipped specs failing before Phase 93 touched anything

- [ ] **E2ESTALE-01**: **Six shipped e2e assertions were already red before Phase 93, and were isolated (not fixed) during it.** Filed 2026-08-16 from Phase 93 execution (`RULING-P93-04` — "isolation is not a disposition"). Each was measured in BOTH directions — at `phase-93-base` and at the post-change HEAD — so the attribution is evidence, not inference.
  - **`frontend/tests/e2e/pull-to-refresh.spec.ts` — 5 tests** (`:92` sync status bar, `:140` pull-to-refresh components, `:170` RTL layout, `:193` mobile viewport, `:250` TanStack Query). Identical result at `phase-93-base` and at HEAD: **5 failed / 8 passed both runs**, so plan `93-07` caused none of them. Root cause is a **loose locator**, not a product defect: `expect(locator('h1')).toBeVisible()` raises `strict mode violation: resolved to 44 elements` because the dossiers list renders an `h1` per card. The page loads correctly with real data. Fix is to scope the locator (e.g. `getByRole('heading', { name: 'All Dossiers' })`), not to change the page.
  - **`frontend/tests/e2e/analytics-dashboard.spec.ts:153`** (`should have refresh button that triggers data reload`) — failed in both the swallow-present and swallow-deleted runs recorded by `93-06`. Distinct from the 3 tests that plan legitimately inverted.
  - **Population definition:** shipped specs under any of this repo's **four** test roots (`./tests`, `./frontend/tests`, `./backend/tests`, `./e2e/tests`) that are coupled to a file Phase 93 modified, per the corrected `GATE-STANDARD.md` C9b derivation (11 coupled files). **Outside it:** specs coupled by DOM shape alone rather than by identifier — no grep can see those; the residual defence is running the shipped suite. And specs unrelated to Phase 93's 40 changed files were never run, so this is **not** a claim about total suite health.
  - **Owner: Phase 101 — CI Gates Green**, alongside the other CI-green work. Phase 93 deliberately did not fix them: they are outside its criteria, and repairing unrelated red tests mid-phase is how a phase's own evidence stops being interpretable.

### SEEDFIX — a broken seed row that only became visible once the app stopped hiding it

- [ ] **P52FIXTURE-01**: **Seed the missing `engagement_dossiers` row for `00000000-0000-0052-0000-000000000001`.** Filed 2026-08-16 from Phase 93 execution (plan `93-12`, raised in its BLOCKED section to the orchestrator). That id is an engagement dossier with **no extension row** — a broken seed. Before Phase 93 the app painted a titleless shell over it; `93-12` made the surface render the degraded state instead, which is the correct behaviour and the phase's entire point.
  - **Consequence, measured in both directions on one command** (`cd frontend && pnpm exec playwright test tests/e2e/_phase52-mid-drag-capture.spec.ts --project=chromium --reporter=list`): **before** `1 passed` (TasksTab mid-drag) `· 1 failed` (EngagementKanbanDialog, already red); **after** `1 failed` — the Tasks tab click times out because the degraded state suppresses that region by contract (UI-SPEC §3). So the flip is attributable and expected, not an unexplained red.
  - **The fix is DATA, not code.** Repair the seed row. **Do not** weaken the degraded state to keep a screenshot-capture harness green — that spec is self-labelled "NOT a regression spec", and its second test was already red before Phase 93 touched anything.
  - **Why no grep found it:** the coupling is by **data**, not by filename or symbol — the spec's `FIXTURE_ID` merely defaults to that uuid. `GATE-STANDARD.md` C9b is an identifier sweep and is structurally blind to this class; it surfaced only because `93-12` ran the shipped suite.
  - **Owner: Phase 102 — Staging Data & Debt Tail**, with the other seed work (`SEED-DELEG-01`).

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

### E2ECRED — E2E credential provisioning

> Filed separately from CARRY-01/CARRY-05 on purpose: those rotate credentials that EXIST. This is
> six keys that are **absent**, which is why rotating the two that exist would not fix it.

- [ ] **E2ECRED-01**: **The Playwright `setup` project cannot authenticate, so every dependent E2E
      project is blocked — not just Phase 92's specs.** `tests/e2e/support/auth.setup.ts:17-22` throws
      unless all six of `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_ANALYST_EMAIL`,
      `E2E_ANALYST_PASSWORD`, `E2E_INTAKE_EMAIL`, `E2E_INTAKE_PASSWORD` are set. Verified 2026-08-15
      (Phase 92 planning): `.env.test` carries **none** of them — it has only
      `PHASE_52_FIXTURE_ENGAGEMENT_ID`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `SUPABASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (key names only; no value was read).
      `playwright.config.ts:36` gives `chromium-en` `dependencies: ['setup']`, and `--grep` does not
      exempt a dependency project, so **any** non-`--no-deps` run of a `chromium-en` spec fails at
      setup with `3 failed / N did not run` before reaching its subject.
      The `--no-deps` escape is **degraded, and possibly also closed — this is measured only in
      part.** The saved state at `tests/e2e/support/storage/admin.json` holds an ACCESS token with
      `expires_at: 1780606280` = **2026-06-04**, 72 days stale. What was NOT measured: the same file
      holds a `refresh_token`, and Supabase refresh tokens carry no absolute expiry by default, so a
      refresh at app load may still mint a valid session. **The accurate claim is "the access token
      is 72 days stale", not "the stored session is dead"** — the latter was an overclaim, corrected
      2026-08-15 per `RULING-P92-39`, and no plan or requirement should be built on it. Settling it
      takes one run of a `--no-deps` spec against staging.
      Either way the recovery the specs themselves prescribe ("re-run the `setup` project first")
      is circular, because that is the route the six missing keys close.
      **Suspected contributor to `main` being chronically red on E2E** — the condition has held since
      at least June, which predates every Phase 92 change.
      Phase 92 does NOT fix this. It routes around it for one spec only (92-01 T2 authenticates
      inline from `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`, preserving D-15 so the phase's before/after
      evidence does not wait on an operator act — `RULING-P92-36`). Routing around it is not fixing
      it: the other ~40 specs and all three roles remain blocked.
      Scope if taken up: provision the three staging accounts (admin / analyst / intake), populate
      the six keys in `.env.test` **and** the GitHub Actions secret store, then regenerate the
      storage state and confirm a login smoke passes. Evidence trail:
      `.tickmarkr/overseer/PARK-P92-R3.md`, `.tickmarkr/overseer/P92-PLAN-CHECK-4.md` (F2, F3).

## Deferred / Not in v1

### Filed from Phase 92 planning, 2026-08-15

- **Session eviction (`scope: 'others'`) does not exist in this product — and a control has been
  claiming it does.** `DataPrivacySettingsSection.tsx` shipped a button labelled en
  "Sign Out All Other Sessions" / ar "تسجيل الخروج من جميع الجلسات الأخرى" whose handler
  (`:164-178`) calls `supabase.auth.signOut({ scope: 'global' })` — which ends **every** session
  including the caller's. Phase 92 relabels it to match the behaviour (`RULING-P92-11`), which is
  correct and removes nothing: **the advertised capability never worked.**
  But the label implies a real user need — _evict a session I believe is compromised while keeping
  my own_ — and after the relabel the product will have **no** way to do that. Implementing it is
  **new work**, not a correctness fix, so it is out of scope for v10.0 and is filed here rather than
  left as a sentence inside a phase decision nobody reads again.
  Scope if taken up: `supabase.auth.signOut({ scope: 'others' })`, a session list so the user can see
  what they are evicting, and copy that distinguishes the three scopes (`local` / `others` /
  `global`). Evidence trail: `.tickmarkr/overseer/PARK-P92-R2.md` → PARK-R2-1 (a).

- Entry-bundle _diagnosis_ beyond the diet (which specific commits added 17.71 kB) — CARRY-07 covers the outcome, not the archaeology.
- Non-audited surfaces: nothing outside the 190 routes the audit covered is in scope.

## Traceability

Every v1 requirement maps to exactly one phase. **This table is the single source of truth for the
requirement count — derive it, do not restate it elsewhere.**

```bash
# total v1 requirements (both derivations agree)
grep -cE '^- \[[ x]\] \*\*[A-Z]+-[0-9]+\*\*' .planning/REQUIREMENTS.md   # requirement bullets
grep -cE '^\| [A-Z]+-[0-9]+ \| ' .planning/REQUIREMENTS.md                  # traceability rows
```

0 orphaned, 0 duplicated.

> **Why a command and not a number** (`RULING-P92-19`, 2026-08-15): the count was previously written
> out in three live documents and went stale the moment `CLIENTSEC-01` was added — it read 58 when the
> file held 59. This is the third instance of that class in one session: `ROADMAP.md:285`'s "133",
> `AR-04`'s 1683-vs-1716, and this. Copies of a number are the defect; the fix is one place plus a
> derivation, not three careful edits.

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
| AUDIT-DROP-01 | Phase 94 — Write Paths | Pending |
| AUDIT-ZERO-01 | Phase 94 — Write Paths | Pending |
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
| DELEG-01 | Phase 93 — Failure Visibility | Pending |
| PIN-2390-01 | Phase 93 — Failure Visibility | Pending |
| DR-42501 | Phase 93 — Failure Visibility | Pending |
| AUDIT-42703 | Phase 93 — Failure Visibility | Pending |
| DATA-01 | Phase 102 — Staging Data & Debt Tail | Pending |
| DATA-02 | Phase 102 — Staging Data & Debt Tail | Pending |
| SEED-DELEG-01 | Phase 102 — Staging Data & Debt Tail | Pending |
| P52FIXTURE-01 | Phase 102 — Staging Data & Debt Tail | Pending |
| DELEG-02 | Phase 102 — Staging Data & Debt Tail | Pending |
| DBSEC-01 | Phase 100 — Security Posture (database + client) | Pending |
| DBSEC-02 | Phase 100 — Security Posture (database + client) | Pending |
| DBSEC-03 | Phase 100 — Security Posture (database + client) | Pending |
| DBSEC-04 | Phase 100 — Security Posture (database + client) | Pending |
| DBSEC-05 | Phase 100 — Security Posture (database + client) | Pending |
| RLS-AUTHUSERS-01 | Phase 100 — Security Posture (database + client) | Pending |
| CLIENTSEC-01 | Phase 100 — Security Posture (database + client) | Pending |
| E2ECRED-01 | Phase 101 — CI Gates Green | Pending |
| E2ESTALE-01 | Phase 101 — CI Gates Green | Pending |
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

> **LIVE-01/02/03 (Phase 104) are hardware-gated** on an on-prem GPU host that has not been chosen. Phase 104 is terminal and depends on no other phase; the recommendation recorded in the roadmap is to ship v10.0 with **LIVE-01/02/03 carried to v11.0** — i.e. every v1 requirement except those three — if the host is still undecided when Phase 103 closes.
