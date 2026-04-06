---
phase: 14-production-deployment
plan: 03
subsystem: ops
tags: [monitoring, backup, redis, supabase, rollback, runbook]
dependency_graph:
  requires: [14-01, 14-02]
  provides: [redis-backup-automation, backup-restore-runbook, rollback-test-script]
  affects: [deploy/]
tech_stack:
  added: []
  patterns:
    - "Redis BGSAVE + docker cp for off-host RDB backup with 7-day retention"
    - "Cron-based backup scheduling on droplet host"
key_files:
  created:
    - deploy/backup-redis.sh
    - deploy/BACKUP_RESTORE.md
    - deploy/test-rollback.sh
  modified: []
decisions:
  - "Redis backup via docker exec BGSAVE + docker cp to host filesystem -- simple, no external storage dependency"
  - "7-day retention via find -mtime +7 -delete -- matches requirement without complexity"
  - "Supabase restore documented as manual procedure via dashboard -- no programmatic restore API available"
patterns-established:
  - "Operational runbook pattern: Overview table, per-component sections, known risks, step-by-step procedures"
requirements-completed: [DEPLOY-03, DEPLOY-04]
metrics:
  duration: 2m
  completed: 2026-04-06
  tasks_completed: 1
  tasks_total: 2
  files_changed: 3
---

# Phase 14 Plan 03: Monitoring, Backups & Restore Summary

Redis RDB backup script with 7-day retention, comprehensive Supabase/Redis restore runbook documenting known risks, and rollback verification script

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-06T08:44:43Z
- **Completed:** 2026-04-06T08:46:06Z
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint)
- **Files created:** 3

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Redis backup script and backup/restore documentation | c8133b40 | deploy/backup-redis.sh, deploy/BACKUP_RESTORE.md, deploy/test-rollback.sh |

## What Was Done

### Task 1: Redis Backup Script and Backup/Restore Documentation

**deploy/backup-redis.sh** -- Automated Redis RDB backup script:
- Triggers BGSAVE via `docker exec intl-dossier-redis redis-cli BGSAVE`
- Waits for completion, verifies LASTSAVE timestamp
- Copies dump.rdb from container to dated backup on host filesystem
- Validates backup file size (non-zero check)
- Removes backups older than 7 days via `find -mtime +7 -delete`
- Designed for cron: `0 2 * * * /opt/intl-dossier/deploy/backup-redis.sh`

**deploy/BACKUP_RESTORE.md** -- Comprehensive backup/restore runbook:
- Overview table with backup method, frequency, retention per component
- Supabase PostgreSQL restore procedure with 6 steps
- Known risks documented: role passwords not preserved, Storage objects excluded, pg_net/pg_cron extension hazards, extension version conflicts
- Redis restore from RDB backup (stop, copy, restart, verify)
- Cron setup instructions for Redis backup automation
- References staging project zkrcjzdemdmwhearhfgg

**deploy/test-rollback.sh** -- Rollback verification script:
- Checks rollback images exist (intl-dossier-frontend:rollback, intl-dossier-backend:rollback)
- Pre-rollback health checks on /health and /api/health
- Executes rollback.sh (created in 14-02) and reports results

### Task 2: Human Verification Checkpoint (PENDING)

Requires human to:
1. Configure external uptime monitor (UptimeRobot/Betterstack)
2. Install Redis backup cron on droplet
3. Test Supabase restore against staging

## Decisions Made

1. Redis backup uses docker exec BGSAVE + docker cp to host filesystem -- simple approach with no external storage dependency needed for current scale
2. 7-day retention via find -mtime +7 -delete -- matches DEPLOY-04 requirement
3. Supabase restore documented as manual dashboard procedure -- no programmatic API for managed backup restore

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Surface Scan

No new threat surface introduced. Backup files stored at `/opt/intl-dossier/backups/redis/` accessible only to root (T-14-11 mitigated by file permissions). Health endpoint exposure (T-14-10) accepted per threat model.

## Self-Check: PASSED

- [x] deploy/backup-redis.sh exists
- [x] deploy/BACKUP_RESTORE.md exists
- [x] deploy/test-rollback.sh exists
- [x] 14-03-SUMMARY.md exists
- [x] Commit c8133b40 found in git log
