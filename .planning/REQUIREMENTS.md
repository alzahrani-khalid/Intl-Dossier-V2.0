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
- [ ] **WRITE-02**: `/after-actions` lists records and detail pages resolve `afterActions.loadError` through `t()` instead of printing the key.
  - **Mechanism corrected 2026-08-16 against the live catalog (`RULING-P94-04` §PARK-94-05, cross-cutting order 1).** This entry previously read "(PostgREST embed targets the table that holds the FK)". **No table holds the FK.** Derivation, run against staging `zkrcjzdemdmwhearhfgg`: `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.after_action_records'::regclass and contype = 'f'` returns exactly **5** rows, **all** `REFERENCES auth.users(id)` (`created_by`, `updated_by`, `published_by`, `edit_requested_by`, `edit_approved_by`). There is **no FK on `engagement_id` and none on `dossier_id`** — both are bare `uuid NOT NULL` columns. So there was no table to repoint at, and both embeds in `supabase/functions/after-actions-list-all/index.ts` died at PostgREST relationship resolution: reproduced live as **`PGRST200` — "Could not find a relationship between 'after_action_records' and 'engagements' in the schema cache"**, which the handler turned into a 500 for every caller. `public.engagements` would not have served the embed anyway: its columns are `id, engagement_type, engagement_category, location_en, location_ar, is_seed_data` — it carries no `title_en`, `title_ar` or `engagement_date`.
  - **Fix: a two-query rewrite inside the function, not a repoint and not a new FK.** Query `after_action_records` alone (child embeds `decisions` / `aa_commitments` / `aa_risks` / `aa_follow_up_actions` resolve — each carries a real `after_action_id` FK), then batch-fetch context with `.in('id', ids)` on `dossiers` (titles: `name_en`/`name_ar`) and on `engagement_dossiers` (date: `start_date`, the engagement extension table keyed by the dossier id), and compose in code. **No schema change** — the `42P17` report-policy migration remains the phase's only one. The batched lookups run on the same JWT-scoped client as the base query, so RLS gates them identically.
  - **A miss emits `null`, never a dropped row (D-13).** The old embeds were inner joins, so any after-action whose join missed vanished from a list the user is told is complete. The composed rows carry `engagement: null` / `dossier: null` on a miss and the client renders a named degraded state. The narrower live case is already on staging: record `905b6a3a…` has an `engagement_id` present in `dossiers` but **no `engagement_dossiers` row**, so it ships with `engagement_date: null` rather than being hidden.
- [ ] **WRITE-03**: `/intake/new` submits with any live staging dossier, and the form cannot simultaneously show "Linked to: OECD" and "At least one dossier is required".
  - **Mechanism corrected 2026-08-16 against the installed zod (`RULING-P94-04` cross-cutting order 1).** This entry previously read "the dossier picker writes to the RHF field the schema reads", asserting a field-name mismatch. That mechanism is **measured FALSE**: the picker writes `dossierId` (`IntakeForm.tsx:82`) and the schema reads `dossierId` (`:53`) — the same field on both sides. Nothing was ever misnamed.
  - **The real cause is `z.string().uuid()` under zod 4.3.6**, which enforces the RFC-9562 version/variant bits. **35 of 44** live staging dossiers carry non-RFC seed ids (version nibble `0`), so the schema rejected the ids the picker legitimately supplies: OECD's `b0000001-0000-0000-0000-000000000005` is proven FAIL against the installed zod, while an RFC-shaped id such as `7c0d830b…` passes. The rejection message is `dossier-context:validation.dossier_required` = "At least one dossier is required", rendered at `IntakeForm.tsx:370`, while the badge at `:373-389` renders from the separate `selectedDossiers` React state — which is exactly the coexistence the audit reported.
  - **Fix:** `z.string().min(1, …)` — requiredness kept, RFC check removed — plus `{ shouldValidate: true }` on both `setValue('dossierId', …)` sites (`:82`, `:85`), so a stale required-dossier error clears the moment a dossier is picked instead of surviving until the next submit. Server-side validation in `intake-tickets-create` is unchanged; the relaxation is client-side only. Standing project law, restated: **never `.uuid()` a dossier id** (Phase 86).
- [ ] **WRITE-04**: Kanban accepts commitment drags. Board stage is mapped to `aa_commitments`' own lifecycle at the mutation layer; failures surface the real message, never "Operation completed successfully" on a no-op.
  - **Lifecycle corrected 2026-08-16 by live catalog query (`RULING-P94-01` order 2).** This entry previously read `pending`/`in_progress`/`completed`/`cancelled` — **four** values. The live constraint `aa_commitments_status_check` on staging `zkrcjzdemdmwhearhfgg` is `status IN ('pending','in_progress','completed','cancelled','overdue')` — **five**. `review` is absent either way, so the filed defect stands; `overdue` is a live status no board column maps to. The same four-value understatement is in `CLAUDE.md` §Source-Specific Column Carve-Outs and was corrected there in the same commit.
  - **The mapping is one cell, not four.** Measured at `WorkBoard.tsx:67,78-84`: `todo`→`pending`, `in_progress`→`in_progress`, `done`→`completed` already write valid commitment statuses today. Only the `review` column writes a value the constraint rejects.
  - **The reverse mapping is part of the requirement**, not a bonus: WRITE-04's closing derivation must state where every one of the five live statuses renders, or exclude it explicitly with what falls outside. `resolveBoardStage` (`WorkBoard.tsx:92-106`) routes `overdue` through its `default` branch into the **`todo`** column, where a late commitment is indistinguishable from one nobody has started.
- [ ] **WRITE-05**: Every `/settings` tab saves. The `users` write uses `.update().eq('id',…)` rather than an `.upsert()` that omits the NOT NULL `email`, and the notification-bridge step actually runs. **[V]**
- [ ] **WRITE-06**: Report generation works and scheduled reports can be created — the client/function field-name contract agrees (`type` vs `template`), and the mutually recursive `custom_reports` ↔ `report_shares` SELECT policies no longer raise `42P17`. **[V]**
- [ ] **AUDIT-DROP-01**: **Security audit events are silently discarded by the backend.** Filed 2026-08-15 from Phase 93 planning (`RULING-P93-01` D-54 addendum), found while discharging `AUDIT-42703`'s live-relation condition. `backend/src/services/auth.service.ts:847` (`logSecurityEvent`) does `supabaseAdmin.from('audit_log').insert({ user_id, action, resource_type, details, timestamp })`. **`resource_type` and `details` are not columns of `public.audit_log`** — its real columns are `id, tenant_id, entity_type, entity_id, action, user_id, timestamp, old_values, new_values, ip_address, user_agent, session_id, additional_context` — so every such insert fails, and the call is wrapped in a `try/catch` that only calls `logError`. The failure is therefore invisible to the caller and no security event has ever been recorded through this path. Same class as `TRUST-01` (a failure rendered as success), on a security path, and **not** covered by any Phase 93 criterion — which is why it is filed here rather than folded. Fix: map to the real columns (`entity_type: 'security'`, `additional_context: details`), and stop swallowing the insert error. **[V]** — column list and the code site both re-derived against live staging `zkrcjzdemdmwhearhfgg`, 2026-08-15.
  - **CORRECTED 2026-08-16 (plan 94-10, `RULING-P94-04` cross-cutting order 1): the filed fix above is INCOMPLETE and would still have written zero rows.** Mapping `resource_type→entity_type` and `details→additional_context` leaves the insert failing on **`tenant_id` and `entity_id`**, which are both **NOT NULL with no default**. Derivation, run live against staging `zkrcjzdemdmwhearhfgg` 2026-08-16:
    ```sql
    SELECT column_name, is_nullable, column_default FROM information_schema.columns
    WHERE table_schema='public' AND table_name='audit_log' AND is_nullable='NO';
    ```
    → `id` (default `gen_random_uuid()`), `timestamp` (default `now()`), and `tenant_id`, `entity_type`, `entity_id`, `action`, `user_id` — the last five with **no default**. The only writers that have ever succeeded against this table are the DB triggers (`audit_trigger_function`, attached to 11 tables), which take `NEW.tenant_id` from the audited row. A security event has no audited row, and there is no tenant column anywhere on the user side: `public.users` has only `default_organization_id` and `public.profiles` only `organization_id`.
  - **A3 resolution (`RULING-P94-04`), as implemented by plan 94-06:** tenant is DERIVED, never invented — `COALESCE(profiles.organization_id, users.default_organization_id)`, queried by `profiles.user_id = <uid>` because `profiles` has **no `id` column**. **No sentinel tenant.** If neither resolves, the insert is **SKIPPED** and the skip is logged at ERROR level naming the user — an unwritable audit row is recorded as a loud absence, never as a fabricated one. `entity_id` is honestly the subject user's id (the signature carries one id, who is both actor and subject).
- [ ] **AUDIT-ZERO-01**: **20 edge functions write an audit-log shape that `public.audit_logs` has never had, and drop the failures silently.** Filed 2026-08-15 from Phase 93 planning, same ruling. `audit_logs` holds **0 rows** despite 32 files inserting into it. Cause is **column mismatch, not dead code and not RLS**: 20 of the 32 insert an `event_type` / `resource_type` / `changes` / `metadata` / `target_user_id` shape, and **none of those five is a column** of `audit_logs` (real columns: `id, entity_type, entity_id, action, old_values, new_values, user_id, user_role, ip_address, user_agent, required_mfa, mfa_verified, mfa_method, correlation_id, session_id, created_at`). An `INSERT` naming a nonexistent column cannot succeed (`42703` / PostgREST `PGRST204`), and most sites `await` the insert without destructuring `error`, so the drop is silent. Representative: `supabase/functions/assign-role/index.ts:244`. Several of the remaining 12 also carry non-column keys (`actor_id`, `details`, `metadata`); the genuinely schema-correct writers are the `intake-tickets-*` family (6 files) plus `intake-classification`, whose absence of rows is explained by those flows never having been exercised on staging rather than by any defect. **Population definition:** files under `supabase/functions` containing `from('audit_logs').insert`; top-level payload keys compared against `information_schema.columns`. **Outside it:** nested-object keys were not individually validated, `.upsert()` and RPC-mediated writes were not searched, and the backend Express tree was searched separately (see `AUDIT-DROP-01`). Fix: one audit-write helper with the real column set, error surfaced not swallowed. **[V]**
  - **POPULATION CORRECTED 2026-08-16 (plan 94-10, D-20 / `RULING-P94-04` cross-cutting order 1). The filed "20 of 32" is WRONG, and it is wrong because of a live instrument bias, not a miscount: the filed derivation matched only the SINGLE-quote form `from('audit_logs')`.** The corrected population rule matches **both quote styles** — files under `supabase/functions` whose source matches `from('audit_logs')` **OR** `from("audit_logs")`, with an `.insert(` / `.upsert(` chained within 900 characters, top-level object-literal keys diffed against the live column set. Re-derived under that rule: **38 files** match, of which **36 are writers — 27 broken, 9 clean — and 2 are read-only** (`dossier-export-pack` timeline select, `intake-audit-logs`). The 9 clean are `auth-verify-step-up`, `delegate-permissions`, `intake-classification`, `intake-tickets-assign`, `intake-tickets-create`, `intake-tickets-get`, `intake-tickets-triage`, `intake-tickets-update`, `revoke-delegation`. Bad-key classes across the 27: the filed `event_type`/`resource_type`/`resource_id`/`target_user_id`/`metadata`/`changes`/`after` class, plus `details` (5 files), `actor_id` (2), `changed_by`, and `assignee_id`/`override_reason`/`wip_status`/`capacity_warning` (`assignments-manual-override`).
  - **A writer OUTSIDE BOTH filed populations**, found by the 94-RESEARCH sweep and repaired by plan 94-06: **`backend/src/services/mou.service.ts:636`** (`logStateTransition`) writes `audit_logs` (plural) **from the backend**, with the non-column key `changes` and no `user_role` (NOT NULL), awaited without destructuring `error` — the same silent-drop class. It fell between the two entries because `AUDIT-ZERO-01` searched only `supabase/functions` and `AUDIT-DROP-01` searched the backend only for the singular `audit_log`.
  - **Blind spots CARRIED FORWARD, not closed** (stating them is part of the requirement — an unstated population boundary is how "20 of 32" survived): (i) payloads assembled as variables and spread (`.insert(payload)` with the keys built elsewhere) are **outside** the literal-object scan and remain unmeasured; (ii) RPC-mediated audit writes were **searched** this time (`rpc(…audit`) — **none found**; (iii) `.upsert()` was **included** in the scan — **zero** upsert sites found; (iv) nested-key validation remains moot, since the nested targets are `jsonb` columns.

### DEAD — No dead or lying surfaces

- [ ] **DEAD-01**: `/search` returns results for every query, including its own suggestion chips (no `Cannot read properties of undefined (reading 'forEach')`).
- [ ] **DEAD-02**: `/tasks/queue` renders its page; `assignments-queue` is deployed.
- [ ] **DEAD-03**: `/scenario-sandbox` either loads or shows an error — a backend 500 is never pixel-identical to "still loading".
- [ ] **DEAD-04**: `/monitoring` renders the SPA route (the Vite proxy no longer claims the whole prefix) or the route is deleted.
- [ ] **DEAD-05**: `/analytics` shows real data or is honestly disabled — no fabricated sparklines, donuts, or "Insights you'll gain" over a backend endpoint that does not exist.
- [ ] **DEAD-06**: `/custom-dashboard` queries columns that exist (`calendar_entries.event_date`, not `start_datetime` **[V]**), renders its chart, and computes real trend deltas instead of "0.0%" from aborted requests.
- [ ] **DEAD-07**: `/calendar` renders a grid (empty or not), `/calendar/new` mounts the create form, `/events` pads the month by the real weekday offset with month navigation, and `/word-assistant`'s status badge reflects a real probe.
- [ ] **DEAD-08**: Route-tree conflicts resolved — `positions/$id.tsx` vs `$positionId.tsx`, and `legislation.tsx` renders an `<Outlet/>` so its detail page is reachable. Positions `approvals`/`versions` child routes drive tab state.
- [ ] **DEAD-09**: **The `reports` edge function's POST handler is a MOCK — no report is ever generated.** `supabase/functions/reports/index.ts:266-285` mints a `job_id`, schedules a `setTimeout` whose body only `console.log`s `Processing report job ${jobId}`, and answers `202 { job_id, status: 'pending', message, check_status_url }`. **No `url` is ever returned and no work is ever done.** Filed 2026-08-16 from Phase 94 execution (plan `94-09`). Phase 94 renamed the client's body field (`template` → `type`, the name the server's own guard at `:258` requires) **PAIRED with an explicit unavailable terminal state**, per `RULING-P94-04` §`PARK-94-06` — the rename never ships alone, because converting a visible 400 into an invisible fabricated success is the forbidden shape. The surface is therefore now **honest but DEAD**: the client can no longer render a `completed` entry whose url was never returned (`frontend/src/pages/reports/generate-entry.ts`, pinned by `frontend/src/pages/reports/__tests__/generate-entry.test.ts`), and it says so in both locales (`report-builder:generate.unavailable`). What remains is the generation itself — a real execution path. Candidates found during Phase 94 research: the custom-reports function flow, or the Express `/report-builder/generate` path at `backend/src/.../misc.repository.ts:125`. **Owner: Phase 95 — Routes That Don't Render**, whose goal is that every surface either works or says why it can't; this one now says why it can't, and Phase 95 owns making it work. Flagged **approve-as-placed** (the D-73 pattern).
  - **Scope note, so the filing is not read wider than it is:** `WRITE-06`'s REAL surfaces — custom-reports CRUD and scheduled-report creation — are closed by plan `94-05` (the `42P17` migration and its probe). Only the mock generate path is dead.

### COUNT — Every surface counts the same work the same way

- [ ] **COUNT-01**: One source of truth for work-item counts. The dashboard KPI, `/my-work` badge/footer/rows, `/commitments` tabs, and the kanban board agree — no screen shows badge 18 / footer 21 / 11 rendered rows.
- [ ] **COUNT-02**: Type-list queries left-join their extension tables (or the counters use the same join), so a dossier without an extension row is never dropped from the list while the hub still counts it (persons 16 vs 15 **[V]**, engagements 5 vs 3).
- [ ] **COUNT-03**: Completion is consistent — `status` and `workflow_stage` stay in sync, so completed tasks leave the dashboard's "Overdue" widget and the kanban Done column can fill.
  - **VERIFY, do not build — for `tasks`, the database already enforces this.** Found by the `RULING-P94-03` order-4 trigger sweep during Phase 94 planning (`.tickmarkr/overseer/P94-TRIGGER-SWEEP.md`, filed in `a28a7114c`; the `CASE` was independently reproduced by catalog query by the overseer). `trg_sync_task_status` → `sync_task_status_from_workflow_stage` is a `BEFORE UPDATE` trigger on `tasks` that derives `status` from `workflow_stage` whenever the stage changes: `todo→pending`, `in_progress→in_progress`, `review→review`, `done→completed`, `cancelled→cancelled`. **Its `done` branch also stamps `completed_at := NOW()` when that column is null — a side effect the client-side map has no equivalent for**, so the two halves are not interchangeable even where their status mappings agree. Phase 96's work here is to confirm the invariant holds and to find the surfaces that break it, not to write a sync that exists.
  - **The drift seam this exposes is Phase 94's to state and Phase 96's to inherit.** `frontend/src/pages/WorkBoard/WorkBoard.tsx:78-84`'s `STAGE_TO_STATUS` is a second, independent copy of that same `CASE`, in TypeScript. **They agree today cell for cell — by authorship, not by construction.** Nothing fails if one changes; there is no test, type, or generator binding them. Phase 94 carries a parity oracle for the seam (client map vs the live `CASE`) per overseer decision `D-82`; Phase 96 owns whatever the oracle reveals about the surfaces downstream.
  - **`commitment_status_history` is not evidence of user intent, and no oracle here may treat it as such.** `BEFORE` row triggers on one table fire in alphabetical name order, so on `aa_commitments` the `commitment_overdue_check` rewrite lands before `commitment_status_audit` reads `NEW.status`. The history row therefore records what the database decided, not what the user asked for.

- [ ] **COUNT-04**: **The board holds two notions of "overdue" for one fact, and they can disagree.** Filed 2026-08-16 from Phase 94 planning (`RULING-P94-02` order 1; `PARK-94-03` ruled state-only there, handling filed here). Two signals:
  - `aa_commitments.status = 'overdue'` — a **stored** status, maintained by the `BEFORE UPDATE` trigger `commitment_overdue_check` (`check_commitment_overdue()`: `IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending','in_progress') THEN NEW.status := 'overdue'`).
  - `it.is_overdue` — a **computed** flag the board counts for its overdue chip at `frontend/src/pages/WorkBoard/WorkBoard.tsx:232-235`.

  They are derived from the same underlying fact by different mechanisms at different times, so they can disagree — and the stored one is stale by construction, because the trigger is `BEFORE UPDATE` **only** and never fires on `INSERT`. **The open question `RULING-P94-02` raised is CLOSED, and it did not shrink the stake:** the value is written by a live trigger, and on staging `zkrcjzdemdmwhearhfgg` (2026-08-16) **8 of 10 commitments already carry `status = 'overdue'`** while the remaining 2 are past-due `pending` rows the trigger has never touched. The disagreement is the dominant state, not a corner case.

  **The behavioural stake, so this phase inherits the mechanism and not just the symptom:** `resolveBoardStage` (`WorkBoard.tsx:92-106`) has no `overdue` branch, so every one of those 8 rows renders in the **Todo** column, indistinguishable from work nobody has started. And a drag of a past-due card to In-progress writes `in_progress`, the trigger rewrites it to `overdue`, and the card **snaps back to Todo after a success toast** — proven by a rolled-back transaction against live staging, recorded in `.tickmarkr/overseer/PARK-P94.md` §`PARK-94-04`. **Whether the trigger or the board is the wrong one is a separate open park (`PARK-94-04`) that blocks Phase 94's `WRITE-04` criterion wording**; this entry owns the _count_ half — one fact, one signal, agreeing across the board chip, the card, and the column it sits in.

  **Owner: Phase 96 — Real Numbers**, whose goal sentence is exactly this: every count and trend comes from real data and agrees with every other surface. Id `COUNT-04` chosen per the register's section-prefix convention; flagged approve-as-placed.

  **The split, per `RULING-P94-03` (`PARK-94-04` ruled (a), SPLIT) — Phase 96 inherits the mechanism AND the boundary, not just the symptom.** The trigger is correct and stays: `overdue` is genuinely derived state, the trigger is bidirectional (its `ELSIF` reverts `overdue → in_progress` when the due date is extended), and the client already treats it as auto-applied. **Phase 94 owns** the criterion wording and the honest interaction only — its droppable predicate and mutation-layer guard refuse a drag the trigger would coerce, _before_ the write, with a bilingual `role="alert"` reason; the predicate mirrors the trigger's own condition so client and DB cannot drift. **Phase 96 owns** everything left: rendering `overdue` expressively (badge or column), unifying the two signals, **the INSERT gap** — the trigger is `BEFORE UPDATE` only and never fires on `INSERT`, which is why two past-due rows sit at `pending` — and revisiting whether refusal is still the right interaction once `overdue` is renderable, which `RULING-P94-03` explicitly leaves open. Related, from the `RULING-P94-03` order-4 sweep (`.tickmarkr/overseer/P94-TRIGGER-SWEEP.md`): `COUNT-03`'s "`status` and `workflow_stage` stay in sync" is **already enforced for `tasks`** by the `trg_sync_task_status` BEFORE UPDATE trigger, which derives `status` from `workflow_stage` — Phase 96 should verify that rather than build it. Note also that `commitment_status_history` records the **coerced** status, not the requested one (trigger firing order is alphabetical, so the overdue rewrite lands before the audit reads it), so it cannot serve as evidence of user intent.

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
- [ ] **COPY-06**: **The global mutation success toast is a hardcoded English literal that fires for every mutation in the application.** `frontend/src/lib/query-client.ts:71` — `toast.success('Operation completed successfully')`, with no `t()` and no per-mutation specificity, as the TanStack Query `mutations.onSuccess` default. Every successful write in the app announces itself in English with copy that names neither what was saved nor where. Filed 2026-08-16 from Phase 94 planning: `WRITE-04`'s text names this exact string, and `RULING-P94-01` decided the narrow reading — Phase 94 fixes only the no-op that makes it fire spuriously, and does **not** edit an app-wide handler no Phase 94 oracle watches. **Owner: Phase 98 — Copy Truth**, whose criterion 4 (project voice: sentence case, no dev-facing copy) and criterion 2 (no raw key / no untranslated copy) both cover it; its blast radius is every mutation, so it wants a phase whose oracles span the app rather than five write paths.
  - **Filed per `RULING-P94-01` order 3, which suggested the id `TOAST-01`.** Placed as `COPY-06` because every id in this register is section-prefixed and the owner phase is 98 — flagged for approve-as-placed (D-73 pattern). The suggested id is recorded here so the ruling stays traceable.
  - **Why tracked rather than noted:** it was first written down as a CONTEXT "deferred idea", and an audit line is not a queue. Nothing fails if a deferred idea is never read.

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

  > **Count correction, 2026-08-16 — the TABLE number is one too high; the POLICY numbers are exact.** Measured at Phase 93 close by `93-15` against the live catalog: **11 residual policies over 9 distinct tables**, plus the 4 fixed over 3 tables = **15 policies over 12 distinct tables**, not 13. Policies reconcile exactly (11 + 4 = 15 ✓); only "13 tables" is wrong. Root cause: the source enumeration in the planning park renders **13 markdown rows over 12 distinct tables** — `tag_categories` carries two policies and therefore appears twice. **The header counted rows in a document, not tables in a database** — the phase's own class, in its own filing. Both sets themselves are exactly right and no remediation scope changes. The sentence above is left as filed pending the overseer's ruling on the wording, per the `AUTH-02` precedent that a requirement's text is corrected by ruling, not silently.

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

  - **Two MORE stale specs added 2026-08-16 from Phase 94 planning (`RULING-P94-06` B6), and this pair is a different failure than the original six.** `frontend/tests/e2e/after-action-create.spec.ts` navigates to **`/after-action/create`** (`:249`) and awaits a 201 on the same path (`:181`). **That route does not exist.** The tree carries `/after-actions/` (plural — list at `index.tsx`, detail at `$afterActionId.tsx`) and `/engagements/$engagementId/after-action`; verified by listing `frontend/src/routes/**/*after-action*`. `ai-extraction.spec.ts` shares the same nominated flow and inherits the doubt (not individually re-derived — stated).
  - **Why it matters beyond one red:** `94-VALIDATION.md` nominated that spec as `WRITE-01`'s behavioural oracle, and Phase 94's plan set nominated it too. A spec pointed at a nonexistent route cannot fail _for its subject_ — it yields an uninformative red — so criterion 1's publish half would have been "covered" by an oracle incapable of covering it. Phase 94 replaced it with a read-back probe (`scripts/probe-after-action-publish.mjs`). **Phase 101 inherits the spec itself:** repoint it at the real route or retire it, but do not leave it nominated anywhere.

### LEAK — the independent verifier's SC5 gap

- [x] **LEAK-ATTACH-01** — **RESOLVED-IN-PHASE (`283f9eff`, `RULING-P93-06` order 1). Kept, not deleted: the record of the miss is the valuable part.**: **`frontend/src/components/positions/AttachmentUploader.tsx` renders raw `error.message` to the user in two places, on a criterion-2 named surface that Phase 93 touched.** Found 2026-08-16 by `gsd-verifier` (`93-VERIFICATION-INDEPENDENT.md`, `status: gaps_found`, SC5 partial) and **reproduced independently by the orchestrator before filing**.
  - **The two sites:** `:117` sets `error: error.message || t('common:errors.generic')` in the upload catch, rendered verbatim at `:462-465` as `{attachmentFile.error}`; `:198` `alert(error.message || t('common:errors.generic'))` in the delete catch. Both are present at `phase-93-base` (`:108`/`:189`) — **pre-existing, not introduced** — but the file **is** in `git diff --name-only phase-93-base..HEAD` (touched by `93-10`) and **is** one of criterion 2's four named surfaces.
  - **The `||` fallback does not save it.** A `FunctionsHttpError` message ("Failed to send a request to the Edge Function" — the exact string `93-14_g3` observed in its own RED snapshot) is non-empty, so the generic fallback never fires and the internal string reaches the user.
  - **Why every Phase 93 instrument missed it:** both sites are **mutation-origin** (upload / delete), so they fell outside `D-22`'s bucket-(a) read enumeration; and the closing register classified the 71-line/44-file superset they live in as "an upper bound on remaining **READS**, emphatically not a residual bucket-(a) count" — a classification that is **wrong for this file**, because both sites are **renders**. They appear in no plan population, no exclusion list, no SUMMARY, and no filed requirement. The gap was reachable only by a seat whose derivations shared no ancestry with the work.
  - **The repair is the one-line treatment `93-14` Task 2 already applied to 22 files:** drop the `error.message` operand and keep the translated message.
  - ~~**Owner: Phase 94 — Write Paths**~~ — **superseded.** `RULING-P93-06` order 1 ruled the repair IN-PHASE: mechanical, already-proven treatment, owned file, no product guess, and condition 7 is one of this acceptance's own pre-committed conditions, so the honest state is TRUE rather than disclosed-false.
  - **Resolution, verified by the orchestrator in both directions:** the verifier's own filter chain over the file returns **2 at `phase-93-base`** and **0 at HEAD**. `:117` → `error: t('common:errors.generic')`, `:198` → `alert(t('common:errors.generic'))`; both `catch (error: any)` bindings dropped to bare `catch {` (the `TS6133` trap `93-14` paid for six times). `pnpm type-check` clean; `93-10_g1`, `93-10_g2`, `93-14_g2` re-run verbatim and green **as regression guards, not as a manufactured red**. Recorded by addendum in `93-10-SUMMARY.md` (`80feaaa0`).
  - **The lesson outlives the fix:** a population partitioned by **origin** (query vs mutation) leaks at the seams, and every in-phase instrument inherited that partition — so their agreement was not evidence. Only a seat with no shared ancestry found it.

### CLOSEOUT — findings the closing plan raised that had no owner

> Filed 2026-08-16 by the Phase 93 orchestrator at close-out, from `93-15-SUMMARY.md` §"Findings
> raised" and from this seat's review of `93-VERIFICATION.md` §9. Each is on the tracked surface
> because a finding that lives only in a SUMMARY or a code comment helps the phase that found it and
> ships the defect to everyone after.

- [ ] **NOTFOUND-COMPONENT-01**: **A bare `notFound()` thrown from a COMPONENT never reaches the root 404 page in `@tanstack/react-router@1.170.8`** — it reaches the router's `defaultErrorComponent` ("Something went wrong"), because the throw is attributed to the nearest route and no `notFoundComponent` exists there. Traced and worked around by `93-12`; raised to the orchestrator, and — until now — filed nowhere.
  - **State at Phase 93 close, re-derived: 0 `notFound()` throw sites at `phase-93-base`, 3 at HEAD.** Two are component throws and both carry the required `{ routeId: rootRouteId }` (`DossierShell.tsx:144`, `WorkspaceShell.tsx`), each behaviourally proven. The third is a bare `notFound()` in a route **loader** (`reports/$reportId.tsx:54`), where the mechanism does not apply and the bare form is correct. **No live instance remains.**
  - **Why it is still open:** nothing enforces it. The next component-thrown `notFound()` written without `routeId` regresses silently, and its symptom — a generic error page instead of a 404 — reads as a product bug rather than a router-API misuse. The knowledge exists only in call-site comments.
  - **Owner: Phase 95 — Routes That Don't Render**, whose goal ("every route either renders its page or says why it can't") is exactly this. **Retire it explicitly if that phase decides a lint/gate is not worth it** — a silent drop is what this entry exists to prevent.
- [ ] **ARMA-01**: **`TRUST-03`'s report-builder 404 path has no persisting test, and the only instruction that would give it one lives in a code comment.** `tests/e2e/93-report-notfound.spec.ts` asserts `404 OR query-error-state`; its arm A (404) has **never fired in any natural run**, because `custom_reports`/`report_shares` carry mutually recursive SELECT policies (`42P17`) and the by-id read rejects for every id. Every observed run took arm B.
  - **The mechanism HAS been observed once**: `93-13` drove the real loader in a real browser with the network stubbed to `[]` and saw the root 404 (`93-13-SUMMARY.md:105-116`). **That control spec was deleted and never committed**, so the evidence is prose in a SUMMARY, not coverage in the tree.
  - **The action:** when `WRITE-06` fixes the policy recursion, **delete arm (b)** and assert the 404 arm alone — the spec's own header says so. Leaving the disjunction in place after `WRITE-06` converts a rejection into a pass and makes the green permanent and false. **Nothing currently fails if this is ignored.**
  - **Owner: Phase 94 — Write Paths**, alongside `WRITE-06`, which is the event that unblocks it.
- [ ] **ORACLECAP-01**: **Phase 93's oracle set has an unquantified capacity limit and reds at the auth wall on re-run.** The 18 tests each perform an inline sign-in (forced by `E2ECRED-01`: no shared `storageState` is usable). Two full runs inside the provider's rate-limit window red the suite with `Request rate limit reached` — measured by `93-15`, page snapshot on the record.
  - **Per `GATE-STANDARD.md` C2 that outcome is `UNABLE TO MEASURE`, not a valid red.** Anyone re-running this phase's evidence back-to-back will see what looks like a Phase 93 regression and is not one. Space the runs, or fix the root cause.
  - **Owner: Phase 101 — CI Gates Green**, with `E2ECRED-01` — a shared `storageState` removes the 18 sign-ins and the limit with them.

### RETENTION — two defects `93-09` measured but could not repair inside its files

> Both filed 2026-08-16 from Phase 93 execution, plan `93-09`, which raised them in its BLOCKED
> section for the orchestrator to assign owners. Each was **measured**, not inferred, and each is
> worked around or asserted rather than left silent — so neither blocked that plan's close.

- [ ] **RETENTION-CAST-01**: **`frontend/src/domains/audit/hooks/useRetentionPolicies.ts` casts a `{data:[...]}` envelope as if it were a bare array — six times.** The route crashes outright on the real payload; `93-09` repaired it at the **consumption point** in `data-retention.tsx` (`asRows`, commit `b71ad62b`) because the hook file was outside its `files_modified`. **The six false casts remain.**
  - **Do not "fix" it as `Array.isArray(x) ? x : []`.** That fallback renders "No Policies" over rows the server did send — precisely the confident-lie class this milestone exists to kill. `93-09` recorded that as a pattern decision.
  - **Owner: Phase 95 — Routes That Don't Render.** Placed there because the observed symptom is a route that does not render at all; move it if a later seat reads the class differently.
- [ ] **DR-SUBPATH-01**: **`supabase/functions/data-retention/index.ts:120-123` derives `resource` from the second-to-last path segment, so every `/data-retention/<sub>` route except `policies` is mis-read.** `legal-holds` is parsed as a POLICY ID and looked up in `data_retention_policies`, answering `404 "Policy not found"`. Probed against deployed staging 2026-08-16 (`scripts/probe-edge-auth.sh` plus a throwaway body probe; no credential echoed).
  - **Population, measured not inferred: FIVE of the surface's SIX regions 404 — only `policies` survives.** The single-region framing this was first reported under understates it; the parse is wrong for every `/data-retention/<sub>` shape and right only for `/data-retention/policies/<id>`.
  - **This is the OUTER of two stacked causes on `/admin/data-retention`'s legal-holds region** — the inner is `RLS-AUTHUSERS-01`'s residual `legal_holds` policy (Phase 100). **Fixing the RLS alone will not close that surface**; this parse fires first. Whoever closes `RLS-AUTHUSERS-01` must close this too or the region stays red for a new reason.
  - **MEMBER OF THE `EDGEPATH-01` CLASS, annotated here in the same commit that filed the class.** This entry was written as a single-function defect; it is now the **one PROVEN member of the length-offset subset** of a class spanning at least 61 edge functions. Read it as an instance, not an isolate — the fix must be the class's, not a one-off, or the next `/x/<sub>` surface fails the same way.
  - **Owner: Phase 100 — Security Posture (database + client)**, alongside `RLS-AUTHUSERS-01`, for that coupling rather than for any security property of its own.

- [ ] **EDGEPATH-01**: **Edge functions derive record ids from the request URL's path structure, but `functions.invoke('<slug>')` produces `/functions/v1/<slug>` — a path carrying none of the segments the code looks for. Where the read is unguarded the function does not fail; it fails OPEN.** Filed 2026-08-16 from Phase 94 execution (`PARK-EXEC-03`, `RULING-P94-10`, `D-113`), after `PARK-EXEC-01` / `RULING-P94-09` repaired one instance — `after-actions-publish`, deployed **v13**, proven both directions including the `400` guard's first observed fire in that function's history.
  - **The mechanism, proven on the repaired instance:** `pathSegments[pathSegments.indexOf('after-actions') + 1]`. When the segment is absent `indexOf` returns `-1`, so the expression yields `pathSegments[0]` = `'functions'` — **truthy** — so the "id required" guard is bypassed and a bogus id reaches the query, surfacing as a misleading `404 "record not found"` instead of an honest `400`.
  - **The discriminator is GUARDED vs UNGUARDED, not which literal is searched.** Unguarded reads fail OPEN. Reads behind `if (… && pathSegments.includes(X))` fail CLOSED — the branch is skipped. Guarded functions are cleared **of this defect only**; whether their branches are reachable at all is a separate, unopened question.
  - **Three-subset structure — 61 is a SCOPE, never a defect count:**
    - **7 — mechanism proven, unguarded**: `after-actions-request-edit` (live caller `useEditWorkflow.ts:20`), `after-actions-versions` (live caller `useAfterAction.ts:380`), `after-actions-approve-edit`, `after-actions-reject-edit`, `after-actions-list`, `commitments-update-status`, `engagements`. The first two are **strongly suspected live**; the other five have no `invoke(` caller located — unreachable-or-unproven, **not safe**.
    - **2 — cleared of THIS defect only, fail closed**: `attachments`, `compliance`.
    - **52 — ENTIRELY UNASSESSED**: the length-offset form `pathParts[pathParts.length - n]`, invisible to the sweep that found the other nine. `DR-SUBPATH-01` is its **one proven-defective member**, which establishes that the subset contains real defects and establishes **nothing** about the other 51. A `[len - 1]` read always resolves to _something_, so it cannot be judged without its caller.
  - **NOTHING WAS PROBED AT RUNTIME.** No function in any subset except the repaired one was invoked — invoking them mutates staging records and was outside Phase 94's authorization. Every row is a source-and-caller derivation.
  - **THE POPULATION IS OPEN-ENDED BY CONSTRUCTION — do not inherit 61 as a total.** Three successive enumerations were each scoped by _syntactic form_ and each under-counted: (1) a literal-vs-slug test returned a uniform 9/9 and was discarded as a crude discriminator; (2) an `indexOf`/`findIndex` sweep missed the guarded/unguarded distinction; (3) the corrected sweep still could not see the length-offset form, and therefore scored `DR-SUBPATH-01` — an already-filed member of this very class — as **zero**. **The owner phase must derive the population from BEHAVIOUR — every id or resource derived from a request URL, however expressed — with its own instrument, instrument-tested both directions. The 61 here is a FLOOR.**
  - **The durable lesson:** _a form-scoped population silently under-counts a behaviour-defined class._ And the meta-lesson, recorded because it is the uncomfortable one: **the lesson did not transfer between passes even while it was being written down.** Form-scoping is a reflex that survives its own diagnosis; only a behavioural instrument removes it, not vigilance.
  - **Not a Phase 94 regression, and not in the intended-broken register.** Phase 94's criterion 1 closes **for publish specifically** (`RULING-P94-10`). `94-10` was firewalled from `commitments-update-status`'s parse — its scope there is the audit write only.
  - **Owner: Phase 100 — Security Posture (database + client)**, co-located with `DR-SUBPATH-01` so one owner holds one class, beside `RLS-AUTHUSERS-01` with which `DR-SUBPATH-01` is already stacked. Placed on that coupling, not on any security property of the parse itself; move it if a later seat reads the class differently.

- [ ] **FUNC-GRANT-01**: **`SECURITY DEFINER` functions in schema `public` ship with PostgreSQL's default `PUBLIC EXECUTE` grant, so `anon` can call them via `/rest/v1/rpc/<name>`.** Filed 2026-08-16 from Phase 94 execution (`PARK-EXEC-02`, `RULING-P94-09`). Raised by the `94-05` executor against the function that phase added, `public.is_report_owner(p_report_id uuid)`, and **deliberately not repaired there** — a second schema change is a park, not a file.
  - **Population: 334 functions** — the new `is_report_owner` plus the **333** already carrying Supabase's identical advisor WARN (`is_platform_admin`, `auth_has_role`, …). Repairing 1 of 334 is cosmetic surgery on a class, which is why it is filed rather than patched.
  - **Impact, measured not asserted:** for `anon`, `auth.uid()` is NULL, so the function returns NULL whether or not the row exists — **no information leaks**. For an authenticated caller it distinguishes `false` (row exists, not yours) from `null` (no such row) — **an existence oracle on a 122-bit random id**. That is the residual, accepted knowingly.
  - **Outside the population, unmeasured:** functions in non-`public` schemas, and any whose grants were already tightened by hand. **The 334 is the ADVISOR's WARN set, not a `pg_proc` / `pg_default_acl` derivation** — do not inherit it as catalog truth.
  - **Owner: Phase 100 — Security Posture (database + client).**

### GATESTD — a defect in the shipped gate standard itself

- [ ] **GATESTD-01**: **`GATE-STANDARD.md`'s C9b escape step has never executed successfully on this machine.** Filed 2026-08-16 from Phase 93 execution. The line `id=$(printf '%s' "$id" | sed -E 's/[][.*+?^${}()|\\]/\\&/g')` is rejected outright by BSD/macOS sed: `sed: 1: "s/[][.*+?^${}()|\\]/\\&/g": unbalanced brackets ([])`.
  - **Why it is worse than a broken line:** sed writes the error to **stderr** and exits non-zero, but the command substitution still assigns — so `id` becomes **empty**, the pattern becomes `\b\b`, and **every changed file reports as coupled to every spec**. Observed: 1.8 MB of output claiming ~49 changed files couple to the whole corpus. It fails **open**, in the exact "implausibly total" shape the clause's own amendment note warns about — in prose, with nothing in the code enforcing it.
  - **Provenance — this is the corrective artifact failing, not the original clause.** The line was introduced by `57aaf1cc` ("C9b — escape regex metachars in the derived identifier"), the fix for C9b defect #2. The fix was never observed to run. That makes this the **third** defect inside C9b's own derivation and the second that makes it measure the wrong set.
  - **Suggested repair (verified locally, not applied to the standard):** drop the escape entirely and **reject** an unsafe id instead — `case "$id" in *[^A-Za-z0-9_-]*) echo "UNSAFE ID (triage by hand): $f -> '$id'"; continue;; esac`. Fails closed and loud, needs no escaping, and on Phase 93's changed set it surfaced four ids the broken form silently mangled: `QueryErrorState.test`, `analytics.repository`, `common.json` ×2. Phase 93 used this form locally to derive its own C9b register and recorded the deviation rather than editing the standard.
  - **Population: the one derivation script in `GATE-STANDARD.md` §C9b.** **Outside it:** every other command in that document was not audited for portability — this was found by running C9b, not by a sweep of the standard. A portability pass over the whole file is not claimed.
  - **Owner: Phase 102 — Staging Data & Debt Tail.** **Note for the ruling seat:** both prior C9b defects (`1f0ac741`, `57aaf1cc`) were repaired by a direct same-day commit to the standard rather than carried forward. Carrying this one to P102 leaves every phase between here and there deriving consumer sets with an instrument that fails open.

- [ ] **GATESTD-02**: **A config-enabled workflow step was skipped in Phase 93 and its own STOP did not fire — the failure mode was silence.** Filed 2026-08-16 from Phase 94 planning. `.planning/config.json` sets `workflow.nyquist_validation: true`. `plan-phase.md` §5.5 greps `*-RESEARCH.md` for `## Validation Architecture`, and **on a hit** must write `{PHASE}-VALIDATION.md`, then: "If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6."
  - **Measured:** `93-RESEARCH.md` contains that heading (`grep -c` → 1). `92-RESEARCH.md` also contains it and `92-VALIDATION.md` exists. **`93-VALIDATION.md` does not exist.** So Phase 93's precondition was met, the artifact was never created, the STOP never fired, and the phase planned, executed and closed with a configured step silently absent. Nothing failed. Nothing said anything.
  - **Why this is filed next to `GATESTD-01` rather than as its own class.** `GATESTD-01` is a broken instrument whose breakage is invisible because `sed` writes to stderr and the assignment still happens. This is a skipped step whose absence is invisible because nothing asserts the artifact exists. **Same failure mode — silence — at a different layer**, which is why the section is the right neighbourhood even though its header names the gate standard specifically. Placement is `approve-as-placed`.
  - **Population: workflow steps gated on a `workflow.*` config flag that produce a named artifact.** Derived from `.planning/config.json`, which currently enables `research`, `plan_check`, `verifier`, `nyquist_validation`, `node_repair`, `ui_phase`, `ui_safety_gate`. **Outside it:** steps with no artifact (banners, prompts), steps not gated on config, and every phase before 92 — I checked 92 and 93 only, so the true incidence across the milestone is unmeasured.
  - **The generalized fix, which is the durable part:** a config-enabled step must leave **an artifact on disk or an explicit waiver**, and the check must enumerate the expected set **from `config.json`**, never from memory. **Enumerating from the file is necessary but NOT sufficient — the enumeration must read each key's POLARITY.** Demonstrated live while filing this entry: a first derivation selected "keys whose value is `true`" and reported 7 enabled steps. The true count is **8** — `skip_discuss: false` enables discuss, so a negative-sense key is invisible to a truth-value filter. A correct command over the wrong set, in the very script written to prove the set was derived rather than remembered. Handle `skip_*` inversion explicitly, and segregate non-boolean keys (`node_repair_budget: 2`, `discuss_mode: "discuss"`) instead of letting them fall through a boolean test. Cross-check where two fields encode one fact: `discuss_mode: "discuss"` and `skip_discuss: false` agree, which is the only reason either is trustworthy. Phase 94 adopts this as practice immediately (it creates `94-VALIDATION.md` and verifies existence before continuing rather than trusting the step ran); `ACCEPTANCE-P94-EXEC` generalizes it to every config-enabled step.
  - **Owner: Phase 102 — Staging Data & Debt Tail**, with `GATESTD-01`. Same class, same owner, one seat repairing the instruments rather than two phases each fixing half.

- [ ] **GATESTD-03**: **The decision-coverage gate silently DROPS any sub-lettered decision id — it is not merely miscounted, it is never extracted.** Filed 2026-08-16 from Phase 94 planning. `scripts/decision-coverage.mjs:43` extracts decisions with `line.match(/\*\*(D-\d{2})[:*]/)` — exactly two digits, immediately followed by `:` or `*`. A `**D-03a:` line matches `D-03` and then requires `[:*]`, finds `a`, and fails. The decision therefore never enters the tracked set, is never reported uncovered, and **no plan is ever required to cite it**.
  - **Measured, not read:** with five sub-lettered decisions present, the extractor reported `total: 29` and an id list of `D-01`…`D-29` with `D-03a`–`D-03e` absent. Five decisions — including the phase's most load-bearing one, a ruled trigger split — sat outside the gate while it reported green.
  - **Why this is the more dangerous half of a known defect.** Phase 93 recorded that the _coverage_ matcher `\bD-NN\b` reads `D-06a` as `D-06` (so `D-06a` "cannot appear as a distinct id"). That is a miscount with a visible symptom: the total is one lower than the author expects. **This is the extraction end of the same regex family, and it has no symptom at all** — the author sees green, the id simply does not exist to the instrument. Same class, two instruments, and the silent one went unfiled for a phase.
  - **Population: decision ids in a phase `*-CONTEXT.md` `<decisions>` block.** Derived by running the extractor and diffing its id list against the `**D-` lines actually present. **Outside it:** the `[informational]` exclusion and the `### Claude's Discretion` cut-off (both deliberate), the real GSD gate's 6-word soft-phrase match (this script implements the stricter token match only, by its own header), and every phase before 94 — I checked 94's own context file, so prior phases' true tracked counts are **unmeasured**.
  - **Workaround adopted, not a fix:** Phase 94 relabelled its five ids by **appending** (`D-30`–`D-34`), never renumbering, so ids already cited elsewhere stayed valid. `GATESTD-01`'s standing note applies — work around the shipped instrument, do not repair it mid-phase without a ruling.
  - **Owner: Phase 102 — Staging Data & Debt Tail**, with `GATESTD-01` and `GATESTD-02`. Three instrument defects, one seat, one pass.

### ROOTALIAS — the root vitest project cannot resolve the app it tests

- [ ] **ROOTALIAS-01**: **Root `vitest.config.ts:37` aliases `@` → `<repo-root>/src`, a directory that does not exist.** Filed 2026-08-16 from Phase 93 execution while building the C9b mock-vs-real register (`D-71`). The app's source is `frontend/src`, so any spec under `./tests` that pulls in a `frontend/src` module fails at import-analysis the moment that module uses `@/…` internally.
  - **Observed:** `pnpm exec vitest run tests/unit/components/ErrorBoundary.test.tsx` → `Failed to resolve import "@/lib/sentry" from "frontend/src/components/error-boundary/ErrorBoundary.tsx"`, `Test Files 1 failed (1) · Tests no tests`. The target `frontend/src/lib/sentry.ts` exists; only the alias is wrong.
  - **Pre-existing, not Phase 93:** the `@/lib/sentry` import is present at `phase-93-base`, and `git diff --name-only phase-93-base..HEAD` matches no vite/vitest/tsconfig file.
  - **Population: 15 specs under `./tests` import `frontend/src` by relative path** and are exposed to this. **Outside it:** the other 114 of `./tests`' 129 spec files, which do not reach into the app; and `frontend/tests` (217 specs), which runs under the frontend project's own correct alias.
  - **Why it matters beyond a red:** it silently converts real oracles into non-oracles. `tests/unit/components/ErrorBoundary.test.tsx` is the only **non-mocking** vitest consumer of any file Phase 93 changed, and it cannot run — so a verdict a reader would take as coverage is simply unavailable.
  - **Owner: Phase 101 — CI Gates Green.**

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
| DEAD-09 | Phase 95 — Routes That Don't Render | Pending |
| COUNT-01 | Phase 96 — Real Numbers | Pending |
| COUNT-02 | Phase 96 — Real Numbers | Pending |
| COUNT-03 | Phase 96 — Real Numbers | Pending |
| COUNT-04 | Phase 96 — Real Numbers | Pending |
| NAV-01 | Phase 97 — Reachability | Pending |
| NAV-02 | Phase 97 — Reachability | Pending |
| NAV-03 | Phase 97 — Reachability | Pending |
| NAV-04 | Phase 97 — Reachability | Pending |
| COPY-01 | Phase 98 — Copy Truth | Pending |
| COPY-02 | Phase 98 — Copy Truth | Pending |
| COPY-03 | Phase 98 — Copy Truth | Pending |
| COPY-04 | Phase 98 — Copy Truth | Pending |
| COPY-05 | Phase 98 — Copy Truth | Pending |
| COPY-06 | Phase 98 — Copy Truth | Pending |
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
| NOTFOUND-COMPONENT-01 | Phase 95 — Routes That Don't Render | Pending |
| LEAK-ATTACH-01 | Phase 93 — Failure Visibility | **RESOLVED-IN-PHASE** (`283f9eff`) |
| ARMA-01 | Phase 94 — Write Paths | Pending |
| ORACLECAP-01 | Phase 101 — CI Gates Green | Pending |
| RETENTION-CAST-01 | Phase 95 — Routes That Don't Render | Pending |
| DR-SUBPATH-01 | Phase 100 — Security Posture (database + client) | Pending |
| EDGEPATH-01 | Phase 100 — Security Posture (database + client) | Pending |
| FUNC-GRANT-01 | Phase 100 — Security Posture (database + client) | Pending |
| GATESTD-01 | Phase 102 — Staging Data & Debt Tail | Pending |
| GATESTD-02 | Phase 102 — Staging Data & Debt Tail | Pending |
| GATESTD-03 | Phase 102 — Staging Data & Debt Tail | Pending |
| ROOTALIAS-01 | Phase 101 — CI Gates Green | Pending |
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
