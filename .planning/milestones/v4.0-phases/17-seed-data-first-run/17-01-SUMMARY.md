---
phase: 17-seed-data-first-run
plan: 01
subsystem: database
tags: [postgres, supabase, migration, seed-data, idempotency]

requires:
  - phase: prior
    provides: canonical work-item schema reconciliation (17-SCHEMA-RECONCILIATION.md)
provides:
  - is_seed_data BOOLEAN column on all 9 canonical seeded tables
  - partial indexes (WHERE is_seed_data = true) for fast idempotency probes
affects: [17-02-populate-seed, 17-03-check-first-run]

tech-stack:
  added: []
  patterns:
    - 'Tag-based seed identification via is_seed_data column (D-14)'
    - 'Idempotent migrations using IF NOT EXISTS for column + index'

key-files:
  created:
    - supabase/migrations/20260407000001_add_is_seed_data_columns.sql
  modified: []

key-decisions:
  - 'Final canonical table list: dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, work_items, work_item_dossiers (no separate elected_officials or dossier_relationships)'
  - 'Partial indexes only on is_seed_data = true to keep production rows out of the index'
  - 'NOT NULL DEFAULT false avoids backfill cost on existing rows'

patterns-established:
  - 'Seed-row tagging: every Phase 17-populated table carries is_seed_data, enabling cleanup and idempotency without polluting prod'

requirements-completed: [SEED-01, SEED-03]

duration: ~25min
completed: 2026-04-07
---

# Phase 17 Plan 01: is_seed_data Tagging Columns Summary

**Added is_seed_data tagging infrastructure across all seeded tables, unblocking idempotent populate RPC and tag-based cleanup.**

## Performance

- **Completed:** 2026-04-07
- **Tasks:** 3
- **Files modified:** 1 (new migration)

## Accomplishments

- Migration 20260407000001 adds is_seed_data BOOLEAN NOT NULL DEFAULT false to all 9 canonical seeded tables
- Partial indexes (idx\_{table}\_is_seed_data WHERE is_seed_data = true) keep idempotency probes O(1) without bloating prod indexes
- Migration applied to staging Supabase project zkrcjzdemdmwhearhfgg via Supabase MCP

## Task Commits

1. **All tasks (1–3) bundled** — `89f8f62b` (feat: add is_seed_data tagging columns and indexes)

## Files Created/Modified

- `supabase/migrations/20260407000001_add_is_seed_data_columns.sql` — column + partial index per seeded table, transactional, IF NOT EXISTS guards

## Verification

- All 9 seeded tables confirmed to carry is_seed_data column on staging
- Partial indexes present and queryable
- No existing rows mutated (DEFAULT false applies only to new rows)
- Plan 17-02 unblocked for idempotency check via `EXISTS (SELECT 1 FROM countries WHERE is_seed_data = true)`

## Notes

SUMMARY.md backfilled 2026-04-07 — original execution shipped without it during a parent-session interruption.
