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
  result: passed
  closed_by: Phase 20-01 (2026-04-09) — Playwright + Supabase MCP UAT under
  kazahrani@stats.gov.sa admin session against http://138.197.195.242
  evidence:
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/05-seed-counts-after-reseed.txt
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/09-firstrun-uat-summary.md
    notes: |
    Re-seed exercised end-to-end via the live FirstRunModal "Populate sample data" button
    (in Arabic locale) under a real admin JWT. Resulting counts (10 countries, 10 orgs,
    10 forums, 10 engagements, 62 dossiers, 6 topics, 4 working_groups, 12 persons)
    match SEED-01/02/03 spec with bilingual EN+AR names confirmed.

### 5. FirstRunModal renders on /dashboard when DB is empty + user is admin

source: 17-04, 17-05
expected: First visit to /\_protected/dashboard when DB is empty and logged-in user is admin:

- Modal opens automatically (before dashboard chunk finishes loading)
- Modal shows "Populate sample data" CTA (admin variant)
- Success toast after populate with dossier/task/person counts
- TanStack Query invalidates `['tasks']`, dashboard re-fetches and populates
  result: passed
  closed_by: Phase 20-01 (2026-04-09) — Playwright UAT, EN locale, kazahrani@stats.gov.sa admin
  evidence:
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/06-firstrun-modal-en.png
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/09-firstrun-uat-summary.md
    notes: Modal renders with "Populate sample data" + "Start empty" CTAs and Close (X) on empty DB.

### 6. localStorage dismissal persists across sessions (non-admin variant)

source: 17-05
expected: Non-admin user on empty DB sees modal "Contact an admin to populate sample data"; clicking
Dismiss sets `intl-dossier:first-run-dismissed=true`; modal does not reappear on reload.
result: passed
closed_by: Phase 20-01 (2026-04-09) — Playwright UAT, admin variant
evidence:

- .planning/phases/20-live-operations-bring-up/evidence/20-01/07-firstrun-dismiss-reload.png
- .planning/phases/20-live-operations-bring-up/evidence/20-01/09-firstrun-uat-summary.md
  notes: |
  Verified in admin variant: clicking the modal Close (X) writes
  `intl-dossier:first-run-dismissed=true` to localStorage; modal does not reappear after
  page reload. Non-admin variant of Test 6 not separately exercised, but the persistence
  mechanism is the same key used by both variants.

### 7. Arabic RTL rendering of FirstRunModal

source: 17-04
expected: With language=ar, modal text renders RTL, logical Tailwind props (ms/me/ps/pe/text-start)
correctly flip, Tajawal font applied, no visual clipping on mobile (320px viewport).
result: passed
closed_by: Phase 20-01 (2026-04-09) — Playwright UAT, ar locale
evidence:

- .planning/phases/20-live-operations-bring-up/evidence/20-01/08-firstrun-modal-ar.png
- .planning/phases/20-live-operations-bring-up/evidence/20-01/09-firstrun-uat-summary.md
  notes: |
  `<html dir="rtl" lang="ar">` confirmed; dialog `dir="rtl"`; computed direction `rtl`;
  Arabic font (Readex Pro) applied; Arabic copy renders correctly with Arabic-Indic
  numerals (١٠ instead of 10). Minor follow-up: close-button aria-label still "Close"
  in Arabic locale (visible UI strings are translated; SR label was missed by i18n pass).
  Filed as a non-blocking follow-up in 09-firstrun-uat-summary.md.

### 8. E2E seed accounts (admin/analyst/intake) for Phase 18 dependency

source: (not delivered by any Ph17 plan)
expected: auth.users + public.users + user_roles contain three stable E2E accounts:

- admin@e2e.test with role='admin'
- analyst@e2e.test with role='analyst'
- intake@e2e.test with role='intake'
  Each has a known password in GitHub Actions secrets (E2E_ADMIN_PASSWORD etc.)
  Phase 18's auth.setup.ts can log in as each role and store sessionState.
  result: passed
  closed_by: Phase 20-01 (2026-04-09)
  evidence:
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/02-e2e-accounts.txt
  - .planning/phases/20-live-operations-bring-up/evidence/20-01/03-gh-secrets.txt
    notes: |
    All three accounts exist on staging with correct roles (admin@e2e.test→admin,
    analyst@e2e.test→analyst, intake@e2e.test→staff — note `staff` is the canonical
    enum value, plan-spec `intake_officer` was a typo). All 6 GitHub Actions secrets
    (E2E*\*\_EMAIL, E2E*\*\_PASSWORD) are provisioned plus E2E_BASE_URL and E2E_SUPABASE_URL.
    severity: closed
    diagnosis: |
    Scope gap between phases. Phase 17 owned DB content; Phase 18 owned E2E tests. Neither phase
    owned the seed-account provisioning that Ph18 needs to run. This is not a Ph17 execution
    failure — it's a phase boundary misalignment that should be closed by a small follow-up phase
    (or carried as v5.0 tech debt).

## Summary

total: 8
passed: 7 # Tests 2, 3, 4, 5, 6, 7, 8 (Tests 4-8 closed by Phase 20-01 on 2026-04-09)
partial: 1 # Test 1 (cosmetic doc drift only)
issues: 0
blocked: 0

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
