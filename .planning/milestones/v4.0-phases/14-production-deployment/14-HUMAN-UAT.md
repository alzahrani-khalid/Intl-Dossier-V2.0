---
status: partial
phase: 14-production-deployment
source: [14-VERIFICATION.md]
started: 2026-04-06T12:00:00Z
updated: 2026-04-06T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. DNS domain purchase and HTTPS activation

expected: Domain purchased, A-record pointing to 138.197.195.242, certbot certificate obtained, nginx serving over HTTPS with valid TLS, verify-deployment.sh passes all checks
result: [pending]

### 2. GitHub Actions secrets setup and live deploy trigger

expected: DROPLET_HOST and DROPLET_SSH_KEY secrets configured in repo settings, push to main triggers CI then Deploy workflow, deployment completes successfully
result: [pending]

### 3. External uptime monitor configured with alerting

expected: UptimeRobot or Betterstack monitor on /health endpoint, 5-minute interval, email alerts configured, monitor shows UP status
result: [pending]

### 4. Redis backup cron installed and first backup verified

expected: Cron job at 02:00 UTC running backup-redis.sh, manual test run produces dump file in /opt/intl-dossier/backups/redis/, file has non-zero size
result: [pending]

### 5. Supabase restore test against staging

expected: Backup downloaded from Supabase dashboard, restored to staging project, pg_net/pg_cron handled, data integrity verified
result: [pending]

### 6. Rollback end-to-end test on droplet

expected: After at least one deploy, rollback images exist, test-rollback.sh passes, services healthy after rollback
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
