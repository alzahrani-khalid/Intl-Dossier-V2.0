---
status: partial
phase: 17-seed-data-first-run
source:
  - 17-01-SUMMARY.md
  - 17-02-SUMMARY.md
  - 17-03-SUMMARY.md
  - 17-04-SUMMARY.md
  - 17-05-SUMMARY.md
started: 2026-04-08
updated: 2026-04-08
verified_by: claude (DB tests via supabase MCP) + human pending (UI + E2E bring-up)
---

## Current Test

number: 8
name: E2E seed accounts (admin/analyst/intake) for Phase 18
expected: |
auth.users contains admin@e2e.test, analyst@e2e.test, intake@e2e.test (or equivalent),
each linked to public.users + user_roles with correct role assignment.
awaiting: scope decision (Ph17 did not own this deliverable; Ph18 listed it as deferred blocker)

## Tests

### 1. is_seed_data tagging columns + partial indexes exist

source: 17-01
expected: All 10 canonical tables (dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, work_items, work_item_dossiers) carry `is_seed_data BOOLEAN NOT NULL DEFAULT false` + partial index `WHERE is_seed_data = true`.
result: partial
evidence: |
Verified on staging (project zkrcjzdemdmwhearhfgg):

- 9/10 tables pass: countries, dossiers, engagements, forums, organizations, persons, topics, work_item_dossiers, working_groups
- ❌ 1/10 fails: `work_items` — no `is_seed_data` column, no partial index
- ✓ Bonus: `tasks.is_seed_data` exists (per 17-03 reconciliation using `tasks` instead of `work_items`)
  diagnosis: |
  17-01 SUMMARY claims the canonical list includes `work_items`, but 17-03 SUMMARY and
  the actual check_first_run() function body probe `tasks` instead. 17-SCHEMA-RECONCILIATION.md §7
  excludes `work_items` and `elected_officials`. Net: 17-01 SUMMARY is stale w.r.t. the
  reconciliation that 17-02/17-03 adopted — the code is internally consistent (tasks is tagged,
  work_items is intentionally not), but the 17-01 SUMMARY document still lists `work_items`.
  severity: cosmetic (documentation drift, no functional gap)

### 2. populate_diplomatic_seed() + check_first_run() RPCs installed as SECURITY DEFINER

source: 17-02, 17-03
expected: Both functions exist in `public` schema with `prosecdef = true` and `search_path = 'public'`.
result: pass
evidence: |

- public.populate_diplomatic_seed exists, SECURITY DEFINER=true
- public.check_first_run exists, SECURITY DEFINER=true
- Function body confirms strict admin gate via `user_roles` (role IN admin/super_admin, is_active, not-expired)
- Probes 9 tables matching 17-03 reconciliation (dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, tasks)

### 3. check_first_run() returns correct {is_empty, can_seed} shape

source: 17-03
expected: JSON with `is_empty` boolean + `can_seed` boolean; is_empty=true when all 9 probed tables are empty; can_seed=true only if caller is active admin/super_admin.
result: pass
evidence: |
Direct SQL call (no auth.uid() context) returned:
{"is_empty": true, "can_seed": false}

- is_empty=true is correct — verified all 9 probed tables have count=0 on staging
- can_seed=false is correct — auth.uid() is NULL via service-role direct SQL, so the admin check short-circuits

### 4. populate_diplomatic_seed() produces GASTAT scenario when invoked by admin

source: 17-02
expected: Calling the RPC as an authenticated admin on an empty DB produces a full GASTAT scenario:

- 5-10 countries, organizations, forums, engagements (SEED-01)
- Dossier relationships across tiers (strategic/operational/informational) (SEED-02)
- Tasks with full enum coverage (≥10 of each status/priority/type/workflow_stage)
- All seeded rows carry is_seed_data=true
- Function is idempotent (second call returns already_seeded)
  result: blocked
  blocked_by: third-party
  reason: |
  Cannot be invoked end-to-end because no active admin user exists in auth.users + user_roles
  pair on staging. `auth.users` contains 6 disposable test-\*@example.com accounts from 2026-03-14
  (old ephemeral E2E artifacts); `public.users` has 0 rows; `user_roles` has 6 admin rows but
  they reference user_ids that no longer exist. There is no practical way to invoke the RPC
  under a real JWT without first manually creating an admin user in the Supabase dashboard.
  follow_up: |
  Requires human with Supabase dashboard access to (a) create a real admin user or
  (b) invoke populate_diplomatic_seed() via dashboard SQL editor with SET LOCAL role = '<admin-uuid>'
  pattern to bypass the gate. Result should be inspected for bilingual names, enum coverage, and
  is_seed_data=true on every inserted row.

### 5. FirstRunModal renders on /dashboard when DB is empty + user is admin

source: 17-04, 17-05
expected: First visit to /\_protected/dashboard when DB is empty and logged-in user is admin:

- Modal opens automatically (before dashboard chunk finishes loading)
- Modal shows "Populate sample data" CTA (admin variant)
- Success toast after populate with dossier/task/person counts
- TanStack Query invalidates `['tasks']`, dashboard re-fetches and populates
  result: blocked
  blocked_by: third-party
  reason: |
  Same blocker as Test 4 — requires an active admin user session. Additionally requires the
  frontend to be running against staging (pnpm dev or deployed build) with the user logged in.
  follow_up: Manual browser test by a human operator with admin credentials.

### 6. localStorage dismissal persists across sessions (non-admin variant)

source: 17-05
expected: Non-admin user on empty DB sees modal "Contact an admin to populate sample data"; clicking
Dismiss sets `intl-dossier:first-run-dismissed=true`; modal does not reappear on reload.
result: blocked
blocked_by: third-party
reason: Requires live frontend + non-admin user + browser devtools to inspect localStorage.
follow_up: Manual browser test.

### 7. Arabic RTL rendering of FirstRunModal

source: 17-04
expected: With language=ar, modal text renders RTL, logical Tailwind props (ms/me/ps/pe/text-start)
correctly flip, Tajawal font applied, no visual clipping on mobile (320px viewport).
result: blocked
blocked_by: third-party
reason: Visual/layout correctness requires a real browser with Arabic locale switched.
follow_up: Manual browser test in both desktop + mobile widths.

### 8. E2E seed accounts (admin/analyst/intake) for Phase 18 dependency

source: (not delivered by any Ph17 plan)
expected: auth.users + public.users + user_roles contain three stable E2E accounts:

- admin@e2e.test with role='admin'
- analyst@e2e.test with role='analyst'
- intake@e2e.test with role='intake'
  Each has a known password in GitHub Actions secrets (E2E_ADMIN_PASSWORD etc.)
  Phase 18's auth.setup.ts can log in as each role and store sessionState.
  result: issue
  reported: "Not delivered by Phase 17. No Ph17 plan mentions E2E account provisioning in its scope, deliverables, or summaries. SEED-01/02/03 only cover DB content, not auth fixtures. Phase 18's VERIFICATION.md explicitly flags this as a deferred blocker: 'Phase 17 E2E seed accounts (admin/analyst/intake roles) must be provisioned as part of Phase 17 seed script. Acknowledged as deferred blocker across all four phase 18 wave summaries.'"
  severity: blocker
  diagnosis: |
  Scope gap between phases. Phase 17 owned DB content; Phase 18 owned E2E tests. Neither phase
  owned the seed-account provisioning that Ph18 needs to run. This is not a Ph17 execution
  failure — it's a phase boundary misalignment that should be closed by a small follow-up phase
  (or carried as v5.0 tech debt).

## Summary

total: 8
passed: 2 # Tests 2, 3
partial: 1 # Test 1 (cosmetic doc drift only)
issues: 1 # Test 8 (scope gap for Ph18 dependency)
blocked: 4 # Tests 4, 5, 6, 7 (all need human + browser)

## Automated Coverage

Claude verified DB-level deliverables (is_seed_data columns, RPC installation, RPC shape & behavior)
via direct Supabase MCP queries against the staging project (zkrcjzdemdmwhearhfgg). All code artifacts
for SEED-01/02/03 are in place and internally consistent. No code-level bugs found.

## Gaps

- truth: "work_items table should carry is_seed_data column per 17-01 SUMMARY"
  status: partial
  reason: "Reconciled in 17-03 to use `tasks` instead of `work_items`. 17-01 SUMMARY text is stale; no functional gap."
  severity: cosmetic
  test: 1
  root_cause: "17-01 SUMMARY was not updated after 17-SCHEMA-RECONCILIATION.md §7 changes"
  artifacts: ["17-01-SUMMARY.md"]
  missing: ["documentation update"]
  fix: "Edit 17-01-SUMMARY.md canonical-table list OR add a note pointing to 17-SCHEMA-RECONCILIATION.md §7"

- truth: "populate_diplomatic_seed RPC can be invoked end-to-end and produces the GASTAT scenario"
  status: blocked
  reason: "No active admin user exists on staging to exercise the RPC under a real JWT"
  severity: major
  test: 4
  root_cause: "Staging has 0 rows in public.users; user_roles contains 6 dangling refs from before a wipe"
  artifacts: []
  missing: ["active admin user in auth.users + public.users + user_roles"]
  fix: "Create a stable admin user on staging (part of follow-up Ph20 / bring-up phase) OR manually in the Supabase dashboard"

- truth: "FirstRunModal UI behavior (render, dismiss, success toast, RTL) matches spec"
  status: blocked
  reason: "Requires human + live browser + admin session"
  severity: major
  test: [5, 6, 7]
  root_cause: "Not automatable without Playwright-MCP visual test (not installed in this session)"
  artifacts: []
  missing: ["human UAT pass"]
  fix: "Assign to manual UAT session when staging has an admin user"

- truth: "Phase 18 E2E suite can log in as admin/analyst/intake roles"
  status: failed
  reason: "Seed accounts were never provisioned — scope gap between Ph17 (DB content) and Ph18 (E2E tests)"
  severity: blocker
  test: 8
  root_cause: "Neither phase owned E2E auth fixture provisioning"
  artifacts: []
  missing:
  - "admin@e2e.test user with role=admin"
  - "analyst@e2e.test user with role=analyst"
  - "intake@e2e.test user with role=intake"
  - "GitHub Actions secrets: E2E_ADMIN_EMAIL/PASSWORD, E2E_ANALYST_EMAIL/PASSWORD, E2E_INTAKE_EMAIL/PASSWORD"
    fix: "Create follow-up phase (Ph20: Live Operations Bring-Up) that provisions E2E accounts + runs the full manual verification checklist for Ph14/15/16/17/18"
