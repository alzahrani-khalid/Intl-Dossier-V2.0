---
plan: 20-03
phase: 20-live-operations-bring-up
title: Backup, Restore & Rollback Rehearsal
status: deferred
started: 2026-04-09
completed: null
reason: Depends on Plan 20-02 (domain + production deploy). Deferred until corporate infrastructure is provisioned.
---

## Deferred

Plan 20-03 is deferred — backup/restore/rollback rehearsal will be performed on corporate infrastructure once production deployment is established.

**What remains:**

- Redis backup cron on production host
- Supabase restore rehearsal against staging
- `deploy/rollback.sh` live exercise

## Self-Check: SKIPPED (deferred)
