---
phase: 260610-fkn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql
  - supabase/functions/briefing-books/index.ts
  - frontend/src/components/export/ExportDialog.tsx
  - frontend/src/lib/auth/requireAdmin.ts
  - frontend/src/store/authStore.ts
  - frontend/src/routes/_protected/admin/approvals.tsx
  - frontend/src/routes/_protected/admin/preview-layouts.tsx
  - frontend/src/routes/_protected/admin/ai-settings.tsx
  - frontend/src/routes/_protected/admin/ai-usage.tsx
  - frontend/src/routes/_protected/admin/field-permissions.tsx
  - frontend/src/routes/_protected/admin/data-retention.tsx
  - frontend/src/routes/_protected/admin/system.tsx
  - frontend/src/routes/_protected/audit-logs.tsx
  - frontend/src/routes/_protected/users.tsx
  - supabase/functions/audit-logs-viewer/index.ts
autonomous: false
requirements:
  - P2-SEC-ACTIVITY-RLS
  - P2-SEC-BRIEFING-XSS
  - P2-SEC-EXPORT-ORPHAN
  - P2-SEC-ROLE-SOURCE

user_setup: []

must_haves:
  truths:
    - 'A direct authenticated client can no longer INSERT an activity_stream row with a forged actor_id (WITH CHECK actor_id = auth.uid()).'
    - 'The log_activity SECURITY DEFINER RPC and service-role/seed writers continue to insert activity successfully (not broken by the new policy).'
    - "Exactly one admin exists in public.users.role after backfill; the 7 metadata 'user' rows are NOT promoted."
    - 'briefing-books HTML output escapes every DB/user-supplied string interpolation (XSS sink closed) and the redeployed edge fn returns a 200 on a valid generate request.'
    - 'The orphan frontend/src/components/export/ExportDialog.tsx (hard-coded Bearer test-auth-token) no longer exists.'
    - 'Role for authorization is read only from public.users.role everywhere; no frontend guard reads user_metadata.role or app_metadata.role.'
    - 'Visiting /users or /audit-logs as a non-admin is blocked by a beforeLoad guard; the audit-logs-viewer edge fn returns 403 for non-admin roles.'
  artifacts:
    - path: 'supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql'
      provides: 'actor-binding INSERT RLS policy + targeted role backfill + REVOKE anon'
      contains: 'actor_id = auth.uid()'
    - path: 'frontend/src/lib/auth/requireAdmin.ts'
      provides: 'shared beforeLoad admin guard reading public.users.role'
      exports: ['requireAdmin']
    - path: 'supabase/functions/briefing-books/index.ts'
      provides: 'escapeHtml helper wrapping all untrusted interpolations'
      contains: 'function escapeHtml'
  key_links:
    - from: 'frontend/src/routes/_protected/admin/*.tsx'
      to: 'frontend/src/lib/auth/requireAdmin.ts'
      via: 'beforeLoad: requireAdmin'
      pattern: 'requireAdmin'
    - from: 'frontend/src/store/authStore.ts'
      to: 'public.users.role'
      via: 'profile.role with no metadata fallback'
      pattern: "profile\\?\\.role"
    - from: 'supabase/functions/briefing-books/index.ts generateHTMLDocument'
      to: 'escapeHtml'
      via: 'wrapped interpolation'
      pattern: "escapeHtml\\("
---

<objective>
P2 security pass (Phase 61 scope). Four independent, surgical hardening items, all
verified against repo source + live staging facts in
`260610-fkn-RESEARCH.md` (treat that file's live-DB facts as ground truth):

1. **activity_stream RLS** — replace the spoofable `WITH CHECK (auth.role() = 'authenticated')`
   INSERT policy with actor binding (`actor_id = auth.uid()`). Same migration backfills the
   single known admin (and, only if the live taxonomy allows, the supervisor) into
   `public.users.role` — no admin exists in the truth table today (all 393 = 'viewer').
2. **briefing-books XSS** — add a local `escapeHtml` and wrap every DB/user-string
   interpolation in `generateHTMLDocument`; redeploy the edge fn.
3. **orphan ExportDialog** — delete the dead `frontend/src/components/export/ExportDialog.tsx`
   (hard-coded `Bearer test-auth-token`, zero importers).
4. **role-source unification** — make `public.users.role` the single authorization truth:
   drop the two `|| user_metadata.role` fallbacks in authStore, route the 7 admin guards
   through one shared `requireAdmin` helper, gate `/users` + `/audit-logs`, narrow the
   `audit-logs-viewer` edge fn to `admin`.

Purpose: close four confirmed authz/XSS/dead-code liabilities before v7.0 builds on them.
Output: one migration (committed + applied), one redeployed edge fn (briefing-books),
optionally a second redeployed edge fn (audit-logs-viewer), and a frontend role-source
unification.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260610-fkn-p2-security-pass-activity-stream-rls-act/260610-fkn-RESEARCH.md
@CLAUDE.md

<facts>
Verified by the planner against repo + migration history this session — use directly, do NOT re-derive:

- **activity_stream migration** `supabase/migrations/20260110100000_activity_feed_enhanced.sql`:
  - INSERT policy name to DROP: `"activity_stream_insert_authenticated"` (line ~173), currently `WITH CHECK (auth.role() = 'authenticated')`.
  - SELECT policy `"activity_stream_select_public"` (line ~169): `USING (is_public = true OR actor_id = auth.uid() OR target_user_id = auth.uid())` — leave as-is for this pass.
  - `actor_id UUID NOT NULL REFERENCES auth.users(id)`.
- **A2 confirmed (no direct-client INSERT producers):** repo grep for `activity_stream` returns only SELECT reads —
  `frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts:127` (`getRecentActivity`, a `.select(...)`) and
  `supabase/functions/activity-feed/index.ts:167` (`handleGetActivities`, a `.select(...)`). NO `.insert(`/`INSERT INTO activity_stream`.
  The only writer is `log_activity()` (SECURITY DEFINER, sets `actor_id := auth.uid()` internally) + the service-role seed.
  The actor-binding INSERT policy therefore breaks no current writer.
- **user_role taxonomy is AMBIGUOUS in migration history** — three conflicting definitions exist:
  `001_create_users.sql` → enum `('admin','user','viewer')`; `001_users.sql` → TEXT CHECK `('admin','editor','viewer')`;
  `20251011214939_create_user_enums.sql` → enum `('super_admin','admin','manager','analyst','viewer')`.
  **`'supervisor'` is NOT in any of them.** => The live column type/constraint MUST be queried before writing the backfill (Task 1 blocking probe). Resolve A1 conservatively: backfill the 1 admin → `'admin'`; the 1 supervisor → ONLY if the live taxonomy accepts `'supervisor'`, else leave 'viewer' and document.
- **briefing-books** `supabase/functions/briefing-books/index.ts`: `generateHTMLDocument` starts at line ~97; no `escapeHtml` exists yet. Untrusted interpolation sites (wrap each):
  - `:187` `${title}`; `:188` `${config.description_ar/_en}`; `:190` `${e.name_ar/_en}` (cover entity badges)
  - `:214/:215`, `:231/:232 (${e.type})/:233` `${e.name_*}` / `${e.summary_*}` (exec summary + entity overview)
  - `:267-270` `${c.name}/${c.role}/${c.email}/${c.phone}` (contacts)
  - `:304` `${eng.title}`, `:306` `${eng.description}` (engagements)
  - `:339` `${pos.title}`, `:340` `${pos.type}`, `:341` `${pos.content}` (positions)
  - `:382` `${m.title}`, `:383` `${m.status}` (MoUs)
  - `:426` `${c.title}`, `:428` `${c.status}` (commitments)
  - `:451` `${section.customContent.ar/en}` (custom block)
    Dates via `toLocaleDateString` and static `l.*`/`sectionTitle` labels are safe (don't wrap). `sectionTitle` is from `section.title_*` config — wrap it too if it can carry user input; conservative = wrap.
- **ExportDialog orphan:** `frontend/src/components/export/ExportDialog.tsx` is the ONLY file in `frontend/src/components/export/`. Deleting it empties the dir → remove the dir too. Do NOT touch `frontend/src/components/export-import/ExportDialog.tsx` (the real, imported one).
- **authStore** `frontend/src/store/authStore.ts`: the `|| session.user.user_metadata?.role` fallback is on the `role:` field at `:148` (checkAuth) and `const userRole = profile?.role || session.user.user_metadata?.role` at `:214` (handleAuthStateChange). The `login` path `:64` already uses `profile?.role || 'viewer'` — mirror that. KEEP the `name`/`avatar` metadata fallbacks; remove ONLY the `role` one.
- **Admin guards** (all use `beforeLoad` reading `session.user.user_metadata?.role === 'admin' || ...app_metadata?.role === 'admin'`):
  `approvals.tsx`, `preview-layouts.tsx`, `ai-settings.tsx`, `ai-usage.tsx`, `field-permissions.tsx`, `data-retention.tsx`, `system.tsx` (7 files). Existing pattern throws `new Error('Admin access required')` when not admin.
  `audit-logs.tsx` + `users.tsx` have NO guard (only the `_protected` session wrapper) — add one.
  Sidebar `:63` accepts `admin` OR `super_admin` — the shared helper must accept both for parity.
- **audit-logs-viewer edge fn** `supabase/functions/audit-logs-viewer/index.ts:~404`: `['admin', 'editor', 'supervisor'].includes(userData.role)` — narrow to `['admin']`.
- **Staging default-ACL gotcha (Phase 60):** any new GRANT auto-grants anon → pair new grants with explicit `REVOKE ALL ... FROM anon`. (This migration only changes a policy + does a backfill UPDATE; if it issues no new GRANT, no REVOKE is needed — but include a defensive `REVOKE ALL ON public.activity_stream FROM anon;` to be safe and document it.)
  </facts>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: activity_stream actor-binding RLS migration + targeted role backfill (BLOCKING apply + probe)</name>
  <files>supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql</files>
  <read_first>
    - `.planning/quick/260610-fkn-p2-security-pass-activity-stream-rls-act/260610-fkn-RESEARCH.md` (Item 1 + Item 4 backfill SQL + Assumptions A1/A2)
    - `<facts>` block above (policy name, A2 confirmation, user_role taxonomy ambiguity, REVOKE gotcha)
    - `supabase/migrations/20260110100000_activity_feed_enhanced.sql` lines ~169-176 (current policies)
  </read_first>
  <action>
    FIRST — resolve A1 + A2 on the LIVE DB before writing the migration body (this is the blocking probe; the migration must NOT be written blind because `'supervisor'` is not in any historical taxonomy):

    1. Via Supabase MCP `execute_sql` (project `zkrcjzdemdmwhearhfgg`), query the live `public.users.role` column: its `atttypid::regtype`, any CHECK constraint def, and (if it's an enum) the enum labels. Also query the backfill targets: `SELECT id, raw_user_meta_data->>'role' AS meta_role FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin','supervisor');` to confirm exactly 1 admin + 1 supervisor id. Also run the A2 confirmation grep (already done by planner: zero `activity_stream` inserts) — re-grep `grep -rn "activity_stream" backend/src frontend/src supabase/functions | grep -iE "insert|\.insert\("` and confirm ZERO insert matches before applying the policy.

    Then write the migration file with:

    2. **RLS policy swap** — `DROP POLICY IF EXISTS "activity_stream_insert_authenticated" ON public.activity_stream;` then `CREATE POLICY "activity_stream_insert_own_actor" ON public.activity_stream FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());`. Leave the SELECT policy untouched. Add a header comment that log_activity (DEFINER) + service-role seed are exempt and remain the supported producers (per A2). Closes P2-SEC-ACTIVITY-RLS.

    3. **Targeted role backfill (A1, conservative)** — promote ONLY the 1 admin into `public.users.role`:
       `UPDATE public.users u SET role = 'admin' FROM auth.users au WHERE u.id = au.id AND au.raw_user_meta_data->>'role' = 'admin';`
       For the supervisor: ONLY if the live taxonomy probe in step 1 shows `'supervisor'` is a valid value, add a sibling `UPDATE ... = 'supervisor' WHERE ... ->>'role' = 'supervisor';`. If `'supervisor'` is NOT valid (expected, per taxonomy ambiguity), DO NOT write it — instead add a SQL comment documenting that the supervisor account stays 'viewer' pending a product decision on role mapping (and note this in the SUMMARY). Do NOT mass-promote the 7 metadata-'user' rows. Cast `->>'role'` to the column type if the column is an enum (e.g. `::user_role`).

    4. **Defensive anon hardening** — add `REVOKE ALL ON public.activity_stream FROM anon;` with a comment referencing the Phase 60 default-ACL finding. (No new GRANT is issued, so this is belt-and-suspenders.)

    Make the whole migration idempotent (`DROP POLICY IF EXISTS`, guarded UPDATEs). Then APPLY it via Supabase MCP `apply_migration` (project `zkrcjzdemdmwhearhfgg`) — [BLOCKING]. Then PROBE via MCP `execute_sql`: (a) `SELECT polname, pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid) FROM pg_policy WHERE polrelid = 'public.activity_stream'::regclass;` must show the new `activity_stream_insert_own_actor` WITH CHECK `actor_id = auth.uid()` and NO `activity_stream_insert_authenticated`; (b) `SELECT count(*) FROM public.users WHERE role = 'admin';` must be exactly 1 (or 2 if supervisor was validly promotable AND mapped to admin-equivalent — but conservative target is 1 admin).

  </action>
  <verify>
    <automated>grep -q "actor_id = auth.uid()" supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql && grep -q "DROP POLICY IF EXISTS \"activity_stream_insert_authenticated\"" supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql && grep -q "REVOKE ALL ON public.activity_stream FROM anon" supabase/migrations/20260610120000_activity_stream_actor_binding_and_role_backfill.sql && echo "MIGRATION_FILE_OK"</automated>
    <manual>Supabase MCP pg_policy probe shows `activity_stream_insert_own_actor` with WITH CHECK `actor_id = auth.uid()` and no `activity_stream_insert_authenticated`; `SELECT count(*) FROM public.users WHERE role='admin'` returns exactly 1.</manual>
  </verify>
  <acceptance_criteria>
    - Migration file committed to `supabase/migrations/` AND applied to staging via MCP `apply_migration`.
    - pg_policy probe confirms actor-binding INSERT policy live; old `_authenticated` policy gone.
    - Exactly 1 admin in `public.users.role`; the 7 'user' metadata rows untouched; supervisor either validly promoted (if taxonomy allows) or left 'viewer' + documented.
    - A2 re-grep returns zero `activity_stream` inserts (non-breaking change confirmed).
    - Defensive `REVOKE ALL ... FROM anon` present.
  </acceptance_criteria>
  <done>activity_stream INSERT is actor-bound on staging, one admin exists in the truth table, no current writer broken, change committed + applied + probed.</done>
</task>

<task type="auto">
  <name>Task 2: briefing-books escapeHtml all interpolations + redeploy (BLOCKING deploy) + delete orphan ExportDialog</name>
  <files>supabase/functions/briefing-books/index.ts, frontend/src/components/export/ExportDialog.tsx</files>
  <read_first>
    - `260610-fkn-RESEARCH.md` Item 2 (escapeHtml helper + interpolation table) + Item 3 (orphan deletion)
    - `<facts>` block: full enumerated interpolation site list (`:187`..`:451`) + the "only file in dir" note
    - `supabase/functions/briefing-books/index.ts` `generateHTMLDocument` (line ~97 to ~470)
  </read_first>
  <action>
    Part A — briefing-books XSS (closes P2-SEC-BRIEFING-XSS):
    1. Add a local `escapeHtml(s: unknown): string` helper near the top of the module (Deno edge fn, no new deps) that String-coerces nullish to `''` and replaces `&`,`<`,`>`,`"`,`'` with their HTML entities — exactly the helper in RESEARCH Item 2.
    2. Wrap EVERY untrusted interpolation listed in `<facts>` with `escapeHtml(...)`: cover page (`:187 title`, `:188 description`, `:190 entity name`), exec summary + entity overview (`e.name_*`, `e.summary_*`, `e.type`), contacts (`c.name/role/email/phone`), engagements (`eng.title`, `eng.description`), positions (`pos.title/type/content`), MoUs (`m.title/m.status`), commitments (`c.title/c.status`), custom block (`section.customContent.*`), and `sectionTitle` (conservative). Do NOT wrap `toLocaleDateString` dates or static `l.*` labels. Do not change HTML structure, classes, or logic — only wrap values.
    3. Redeploy — [BLOCKING]: `supabase functions deploy briefing-books --project-ref zkrcjzdemdmwhearhfgg`. The sink fix is INERT until this succeeds. Capture the deploy output (version bump) for the SUMMARY.

    Part B — orphan deletion (closes P2-SEC-EXPORT-ORPHAN):
    4. `git rm frontend/src/components/export/ExportDialog.tsx`. Confirm `frontend/src/components/export/` is now empty and remove the dir (`rmdir frontend/src/components/export` or let git drop it). Do NOT touch `frontend/src/components/export-import/ExportDialog.tsx`.
    5. Grep-confirm zero importers of the deleted path before/after: `grep -rn "components/export/ExportDialog" frontend/src` must return nothing.

    Commit both parts as `fix(260610-fkn): ...`. After commit run `pnpm --filter intake-frontend build` (the pre-commit hook does NOT block on build failure — verify the exit yourself). Do NOT stage `frontend/src/routeTree.gen.ts`.

  </action>
  <verify>
    <automated>grep -q "function escapeHtml" supabase/functions/briefing-books/index.ts && test "$(grep -c "escapeHtml(" supabase/functions/briefing-books/index.ts)" -ge 15 && test ! -e frontend/src/components/export/ExportDialog.tsx && test -z "$(grep -rn "components/export/ExportDialog" frontend/src)" && echo "TASK2_OK"</automated>
    <manual>`supabase functions deploy briefing-books --project-ref zkrcjzdemdmwhearhfgg` reports a successful deploy (new version). `pnpm --filter intake-frontend build` exits 0.</manual>
  </verify>
  <acceptance_criteria>
    - `escapeHtml` exists and wraps >=15 interpolation sites (all enumerated untrusted values).
    - briefing-books edge fn redeployed to staging (deploy is blocking; inert otherwise).
    - `frontend/src/components/export/ExportDialog.tsx` deleted; dir removed; zero importers.
    - `frontend/src/components/export-import/ExportDialog.tsx` untouched.
    - Build green; routeTree.gen.ts not staged.
  </acceptance_criteria>
  <done>The briefing-books HTML sink escapes all DB/user strings and is redeployed; the dead hard-coded-token ExportDialog is gone with no broken imports.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: role-source unification — users.role single truth, shared guard, gate /users + /audit-logs, narrow audit-logs-viewer</name>
  <files>frontend/src/lib/auth/requireAdmin.ts, frontend/src/store/authStore.ts, frontend/src/routes/_protected/admin/approvals.tsx, frontend/src/routes/_protected/admin/preview-layouts.tsx, frontend/src/routes/_protected/admin/ai-settings.tsx, frontend/src/routes/_protected/admin/ai-usage.tsx, frontend/src/routes/_protected/admin/field-permissions.tsx, frontend/src/routes/_protected/admin/data-retention.tsx, frontend/src/routes/_protected/admin/system.tsx, frontend/src/routes/_protected/audit-logs.tsx, frontend/src/routes/_protected/users.tsx, supabase/functions/audit-logs-viewer/index.ts</files>
  <read_first>
    - `260610-fkn-RESEARCH.md` Item 4 (full R1-R18 inventory + recommended canonical pattern + verdict)
    - `<facts>` block: exact authStore lines (`:148`, `:214`), the 7 guard files, the Sidebar admin||super_admin parity, the audit-logs-viewer role array
    - `frontend/src/routes/_protected/admin/approvals.tsx` lines 35-50 (the existing beforeLoad pattern to replace)
    - `frontend/src/store/authStore.ts` lines 129-235 (checkAuth + handleAuthStateChange)
  </read_first>
  <action>
    Per the research verdict — `public.users.role` is the single authorization truth; remove every `user_metadata`/`app_metadata` role read. Closes P2-SEC-ROLE-SOURCE.

    1. **authStore (R3, R4):** in `checkAuth` (`:148`) change the `role:` field from `profile?.role || session.user.user_metadata?.role` to `profile?.role ?? 'viewer'`. In `handleAuthStateChange` (`:214`) change `const userRole = profile?.role || session.user.user_metadata?.role` to `const userRole = profile?.role ?? 'viewer'`. KEEP the `name`/`avatar` metadata fallbacks — touch ONLY the `role` field. Mirrors the existing `login` path (`:64`).

    2. **Shared guard** — create `frontend/src/lib/auth/requireAdmin.ts` exporting an async `requireAdmin` suitable for a TanStack `beforeLoad`. It must read the role from `public.users.role` (NOT metadata): get the session via `supabase.auth.getSession()`, then `supabase.from('users').select('role').eq('id', session.user.id).single()`, and throw `new Error('Admin access required')` (matching the existing guard error string) unless `role === 'admin' || role === 'super_admin'` (Sidebar parity). Explicit return type. No `any`. This queries the DB inside beforeLoad because the Zustand store is not reliably populated at route-resolution time and metadata is untrusted.

    3. **Route the 7 admin guards (R5-R11)** — in `approvals.tsx`, `preview-layouts.tsx`, `ai-settings.tsx`, `ai-usage.tsx`, `field-permissions.tsx`, `data-retention.tsx`, `system.tsx`: replace each inline `beforeLoad` metadata check with `beforeLoad: requireAdmin` (import from `@/lib/auth/requireAdmin`). Remove the now-dead inline session/metadata logic in each. In `ai-settings.tsx`, do NOT remove the separate `user_metadata.organization_id` reads (`:130`,`:167`) — out of scope.

    4. **Add missing guards (R12, R13)** — add `beforeLoad: requireAdmin` to `audit-logs.tsx` and `users.tsx` Route definitions.

    5. **Narrow audit-logs-viewer edge fn (R14)** — in `supabase/functions/audit-logs-viewer/index.ts` (~line 404) change `['admin', 'editor', 'supervisor'].includes(userData.role)` to `['admin'].includes(userData.role)`. If edited, redeploy — [BLOCKING]: `supabase functions deploy audit-logs-viewer --project-ref zkrcjzdemdmwhearhfgg` (inert otherwise).

    No new user-visible strings are introduced (the guard reuses the existing English error path / route-level fallback), so no new i18n keys are required. If any user-visible copy IS added, add EN+AR per CLAUDE.md.

    Commit as `fix(260610-fkn): ...`. After commit run `pnpm --filter intake-frontend build` (verify exit yourself — hook does not block). Use `pnpm exec`, not npx; no `timeout` command. Stay on branch `quick/260608-c9b-country-dossier-workflow-fixes`. Do NOT stage `frontend/src/routeTree.gen.ts`.

  </action>
  <what-built>
    Role authorization unified on `public.users.role`: authStore metadata-role fallbacks removed (R3/R4); a shared `requireAdmin` beforeLoad guard reading the DB; 7 admin routes + newly-gated `/users` and `/audit-logs` all routed through it; audit-logs-viewer edge fn narrowed to `admin` (redeployed).
  </what-built>
  <how-to-verify>
    1. `grep -rn "user_metadata?.role\|user_metadata\.role\|app_metadata?.role\|app_metadata\.role" frontend/src/routes/_protected/admin/*.tsx frontend/src/routes/_protected/audit-logs.tsx frontend/src/routes/_protected/users.tsx frontend/src/store/authStore.ts` returns ZERO matches (the org_id reads in ai-settings are `user_metadata.organization_id`, not role — those are allowed).
    2. `grep -rn "requireAdmin" frontend/src/routes/_protected` shows all 9 routes (7 admin + audit-logs + users) importing/using it.
    3. `grep -n "\['admin'\].includes(userData.role)" supabase/functions/audit-logs-viewer/index.ts` matches (supervisor/editor dropped).
    4. As the now-promoted admin (after Task 1 backfill): admin nav appears in Sidebar; `/users` and `/audit-logs` load. As a 'viewer': both routes throw the admin gate. Confirm in the browser at 1024px and 1400px, LTR and AR (`dir="rtl"`).
    5. `pnpm --filter intake-frontend build` exits 0; `pnpm --filter intake-frontend typecheck` clean on touched files.
  </how-to-verify>
  <resume-signal>Type "approved" once admin-gating behaves correctly for admin vs viewer in both LTR and RTL, or describe what regressed.</resume-signal>
  <acceptance_criteria>
    - Zero `user_metadata.role`/`app_metadata.role` reads remain in authStore or any guard.
    - `requireAdmin` reads `public.users.role` and accepts `admin`+`super_admin`; used by all 9 routes.
    - `/users` and `/audit-logs` are admin-gated.
    - audit-logs-viewer narrowed to `['admin']` and redeployed (if edited).
    - Build + typecheck green; routeTree.gen.ts not staged; branch unchanged.
  </acceptance_criteria>
  <done>Authorization reads only from public.users.role everywhere; admin-only surfaces (including /users and /audit-logs and the audit edge fn) are correctly gated, verified for admin and viewer in LTR + RTL.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                      | Description                                                     |
| --------------------------------------------- | --------------------------------------------------------------- |
| authenticated client → activity_stream INSERT | Client could forge `actor_id` (spoof feed authorship)           |
| DB/user strings → briefing-books HTML output  | Untrusted strings interpolated into HTML (stored XSS sink)      |
| client → admin routes / admin edge fns        | Authorization decision based on a role signal                   |
| client-writable `user_metadata.role` → authz  | Privilege escalation: `supabase.auth.updateUser()` can set role |

## STRIDE Threat Register

| Threat ID | Category               | Component                                             | Disposition | Mitigation Plan                                                                                                                               |
| --------- | ---------------------- | ----------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| T-fkn-01  | Spoofing               | activity_stream INSERT policy                         | mitigate    | `WITH CHECK (actor_id = auth.uid())`; log_activity (DEFINER) + seed (service-role) exempt; verified no direct-client producer (A2)            |
| T-fkn-02  | Elevation of Privilege | admin route guards + authStore                        | mitigate    | Remove all `user_metadata`/`app_metadata` role reads; authorize only off `public.users.role` (service-role-written) via shared `requireAdmin` |
| T-fkn-03  | Tampering (XSS)        | briefing-books generateHTMLDocument                   | mitigate    | Local `escapeHtml` wrapping every DB/user interpolation; redeploy (sink inert until deployed)                                                 |
| T-fkn-04  | Information Disclosure | /users, /audit-logs, audit-logs-viewer                | mitigate    | beforeLoad admin gate on both routes; narrow edge fn to `['admin']` so nav (admin-only) and backend agree                                     |
| T-fkn-05  | Repudiation            | dead ExportDialog hard-coded `Bearer test-auth-token` | mitigate    | Delete the orphan (dead-code liability, zero importers)                                                                                       |
| T-fkn-06  | Tampering              | role backfill UPDATE (wrong rows = real admin grant)  | mitigate    | Backfill ONLY the 1 metadata-admin; supervisor only if live taxonomy allows; never the 7 'user' rows; pg probe asserts count=1                |
| T-fkn-SC  | Tampering              | npm/pip/cargo installs                                | mitigate    | N/A — no package installs in this plan (Deno-local escapeHtml, no new deps); no legitimacy gate required                                      |

</threat_model>

<verification>
- Migration committed to `supabase/migrations/` AND applied via MCP; pg_policy probe shows actor-binding INSERT, old policy gone; `SELECT count(*) FROM public.users WHERE role='admin'` = 1.
- A2 re-grep: zero `activity_stream` inserts in app code (non-breaking confirmed).
- briefing-books: `escapeHtml` present, >=15 wrapped sites, edge fn redeployed (version bump captured).
- orphan ExportDialog deleted, dir removed, zero importers, export-import twin untouched.
- Zero `user_metadata.role`/`app_metadata.role` reads remain; `requireAdmin` used by 9 routes; audit-logs-viewer narrowed to `['admin']` + redeployed.
- After each commit: `pnpm --filter intake-frontend build` exits 0 (hook does not block — verify manually). `routeTree.gen.ts` never staged. Branch stays `quick/260608-c9b-country-dossier-workflow-fixes`.
- Browser check (Task 3): admin sees gated routes; viewer blocked; verified 1024px + 1400px, LTR + RTL.
</verification>

<success_criteria>

- activity_stream INSERT is actor-bound on staging; no current writer broken; 1 admin in users.role.
- briefing-books XSS sink closed and redeployed; orphan token-bearing ExportDialog removed.
- Authorization reads exclusively from public.users.role; /users, /audit-logs, and audit-logs-viewer correctly admin-gated.
- All commits `fix(260610-fkn): ...`, no AI attribution; build green after each; routeTree.gen.ts unstaged.
  </success_criteria>

<output>
Create `.planning/quick/260610-fkn-p2-security-pass-activity-stream-rls-act/260610-fkn-SUMMARY.md` when done.
Record: live `users.role` taxonomy as probed, whether the supervisor was promotable (and to what), the briefing-books deploy version, whether audit-logs-viewer was redeployed, and the A2 re-grep result.
</output>
