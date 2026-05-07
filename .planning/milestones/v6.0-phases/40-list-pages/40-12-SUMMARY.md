---
phase: 40-list-pages
plan: 12
subsystem: list-pages-gap-closure
tags: [seed-data, working-groups, gap-G6, supabase-staging]
requires:
  - 'staging Supabase project zkrcjzdemdmwhearhfgg'
  - 'public.dossiers table'
  - 'public.working_groups extension table'
  - 'RPC search_working_groups (INNER JOIN dossiers ↔ working_groups)'
provides:
  - 'Seed migration: 6 working_group dossiers + 6 working_groups extension rows'
  - '/dossiers/working_groups list page now renders ≥5 bilingual rows'
affects:
  - 'supabase/migrations/20260426120000_seed_working_groups_test_data.sql'
  - 'staging Supabase: dossiers + working_groups tables'
tech-stack:
  added: []
  patterns:
    - 'ON CONFLICT (id) DO NOTHING idempotency for seed migrations'
    - 'Stable test UUID range (a0000000-…-04xx) for working-groups fixtures'
key-files:
  created:
    - 'supabase/migrations/20260426120000_seed_working_groups_test_data.sql'
  modified: []
decisions:
  - 'Insert into BOTH dossiers AND working_groups extension table — RPC `search_working_groups` does INNER JOIN, so dossier-only rows would NOT appear on the list page (plan was silent on extension table)'
  - 'Plan-spec status values (`completed`, `planned`, `cancelled`) violate dossiers.status CHECK constraint (only `active`, `inactive`, `archived`, `deleted`). Used valid values: 5×`active` + 1×`inactive`. Chip variety target reduced from 4 → 2.'
  - 'Used dossiers.updated_at as the recency signal — table has no `last_touch` column; spread updated_at across 2..28 days for visual rhythm.'
  - 'Used sensitivity_level (INT 1..4) — column is not named `sensitivity` as plan stated; 1=low for most, 2 for digital/energy.'
  - 'is_seed_data=true on every row so cleanup scripts can target test fixtures.'
metrics:
  duration: '~15 min'
  completed: '2026-04-26'
  tasks: 2
  files: 1
  rows_seeded: 6
  idempotent: true
---

# Phase 40 Plan 12: Seed working_groups test fixtures (G6)

Closed Phase 40 gap **G6**: `/dossiers/working_groups` was empty in staging, blocking the visual baseline (17 KB vs the ~140 KB parity target).

## What Changed

### `supabase/migrations/20260426120000_seed_working_groups_test_data.sql` (NEW)

- Inserts 6 `dossiers` rows of `type='working_group'` with bilingual EN+AR fixtures (clearly fake — names start with "Test Working Group A/B/C/D/E/F" and Arabic equivalents).
- Inserts 6 matching `working_groups` extension rows so the `search_working_groups` RPC INNER JOIN returns them.
- Stable UUIDs `a0000000-0000-0000-0000-0000000004{01..06}` — re-runs idempotent via `ON CONFLICT (id) DO NOTHING`.
- `wg_type` variety: committee × 2, task_force, technical_group, advisory_board, steering_committee.
- `wg_status` variety: active × 4, suspended × 1, disbanded × 1 (extension-table secondary status).
- `dossiers.status` variety: active × 5, inactive × 1.
- `meeting_frequency` variety: monthly × 2, biweekly, quarterly × 2, as_needed.
- `established_date` spread 25–180 days back; `updated_at` spread 2–28 days back for visual rhythm.

### Staging Supabase (project `zkrcjzdemdmwhearhfgg`)

- Migration applied via Supabase MCP `apply_migration` (name `seed_working_groups_test_data`, `success: true`).
- Pre-migration: 0 working_group dossiers. Post-migration: 6.
- Verified RPC `search_working_groups(NULL, NULL, NULL, NULL, NULL, 50, 0)` returns all 6 rows with EN+AR names.
- Idempotency probe (re-running INSERT) leaves count at 6 — no duplicates.

## Acceptance Criteria

| Criterion                                          | Target                       | Result                                  |
| -------------------------------------------------- | ---------------------------- | --------------------------------------- |
| Migration file exists with ≥5 INSERTs              | `INSERT INTO dossiers` count | 1 multi-row INSERT covering 6 rows ✅   |
| Bilingual fixtures (`name_en` + `name_ar` per row) | 100 %                        | 6 / 6 ✅                                |
| Idempotent (`ON CONFLICT … DO NOTHING`)            | yes                          | yes ✅                                  |
| Staging REST/RPC returns ≥5 working_group rows     | ≥5                           | 6 ✅                                    |
| Status-chip variety covers ≥2 distinct values      | ≥2                           | active + inactive (2) — see Deviation 1 |

## Deviations from Plan

### [Rule 1 — Bug] Plan-spec status values violate the actual `dossiers.status` CHECK constraint

- **Found during:** Pre-flight schema check via Supabase MCP `execute_sql`.
- **Issue:** Plan asks for status values `active`, `completed`, `planned`, `cancelled` to cover 4 chip mappings. The real constraint is `dossiers.status = ANY (ARRAY['active','inactive','archived','deleted'])`. The page's chip map (`active→ok`, `completed→info`, `on_hold→warn`) is therefore ALSO disconnected from the DB enum — only `active` ever produces a non-default chip without schema changes.
- **Fix:** Used valid `dossiers.status` values: 5 × `active` + 1 × `inactive`. Logged this as a known limitation; expanding chip variety belongs in a follow-up plan that either updates the chip map to read from `wg_status` or extends the `dossiers.status` CHECK.
- **Impact on G6:** Visual baseline parity (≥5 bilingual rows) is achieved. "All 4 status chip mappings" must-have is unmet (covers 2 dossiers.status values; chip map sees 1 distinct chip class).
- **Files modified:** `supabase/migrations/20260426120000_seed_working_groups_test_data.sql`

### [Rule 1 — Bug] Plan referenced columns that do not exist on `dossiers`

- **Found during:** Schema check.
- **Issue:** Plan SQL referenced `last_touch` and `sensitivity` columns. Actual columns are `updated_at` (timestamp) and `sensitivity_level` (int 1..4).
- **Fix:** Used `updated_at` with day-offsets to spread recency, and `sensitivity_level=1` (low) for most rows, `2` (medium) for two.
- **Files modified:** `supabase/migrations/20260426120000_seed_working_groups_test_data.sql`

### [Rule 1 — Blocker] Plan did not seed the `working_groups` extension table

- **Found during:** Inspecting `search_working_groups` RPC.
- **Issue:** The RPC INNER JOINs `working_groups wg ON d.id = wg.id`. Dossier-only seed rows would not surface on the list page.
- **Fix:** Added a second `INSERT INTO working_groups` block with valid `wg_type` and `wg_status` values (extension-table CHECK constraints validated on the fly).
- **Files modified:** `supabase/migrations/20260426120000_seed_working_groups_test_data.sql`

## Self-Check: PASSED

- File `supabase/migrations/20260426120000_seed_working_groups_test_data.sql` exists — FOUND
- Migration applied to staging Supabase — `success: true`
- Verification SQL: `SELECT count(*) FROM dossiers WHERE type='working_group'` → 6 (was 0)
- RPC `search_working_groups` returns all 6 rows
- Idempotency probe (duplicate INSERT with ON CONFLICT) leaves count at 6

## Recommended Follow-Up (out of scope for G6)

- Decide whether the working_groups list-page chip should map `wg_status` (active/suspended/disbanded) instead of `dossiers.status`. If yes, update `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` `WG_STATUS_TONE` map and the `statusKey` source. This would make the seeded `wg_status` variety (4 active / 1 suspended / 1 disbanded) visible as 3 distinct chip classes.
