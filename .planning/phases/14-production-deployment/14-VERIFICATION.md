---
phase: 14-production-deployment
verified: 2026-04-06T09:00:00Z
status: human_needed
score: 5/5 must-haves verified (automated artifacts complete; 3 human checkpoints pending)
re_verification: false
human_verification:
  - test: "DNS domain purchase and HTTPS activation"
    expected: "A-record points to 138.197.195.242, certbot obtains certificate, verify-deployment.sh passes with DOMAIN=yourdomain.com"
    why_human: "Requires purchasing a domain, configuring DNS at a registrar, and running certbot on the droplet — cannot be automated"
  - test: "GitHub Actions secrets configured and first deploy triggered"
    expected: "DROPLET_HOST and DROPLET_SSH_KEY secrets exist in repo settings; pushing to main triggers CI then deploy workflow successfully"
    why_human: "Requires access to GitHub repository settings to add secrets and a live push to verify the workflow runs end-to-end"
  - test: "External uptime monitor configured and alert tested"
    expected: "UptimeRobot or Betterstack monitors http://138.197.195.242/health (or https://yourdomain.com/health), shows UP, sends alert when nginx is stopped"
    why_human: "Requires signing up for an external monitoring service and stopping nginx to trigger a real alert"
  - test: "Redis backup cron installed on droplet and first backup verified"
    expected: "crontab -l shows the 02:00 UTC entry; manual run of backup-redis.sh produces a non-empty .rdb file in /opt/intl-dossier/backups/redis/"
    why_human: "Requires SSH access to the DigitalOcean droplet to install the cron and run the script against a live Redis container"
  - test: "Supabase restore procedure tested against staging project"
    expected: "Backup downloaded from Supabase dashboard, restored to staging, critical tables have data, pg_net/pg_cron handled correctly"
    why_human: "Requires Supabase dashboard access, staging project, and manual verification of data integrity after restore"
  - test: "Rollback end-to-end test on droplet"
    expected: "After at least one deployment, test-rollback.sh runs successfully on the droplet — rollback images exist, health checks pass before and after rollback"
    why_human: "Requires a live deployment to have run first (to create :rollback tags), then SSH access to execute test-rollback.sh"
---

# Phase 14: Production Deployment Verification Report

**Phase Goal:** Application runs reliably in production with HTTPS, automated deployments, monitoring, and recovery capabilities
**Verified:** 2026-04-06T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User accesses the application over HTTPS with a valid TLS certificate that auto-renews | VERIFIED (configs) / HUMAN NEEDED (activation) | nginx.prod.conf: HSTS line 97, 301 redirect line 71, SSL cert paths lines 81-82 using `/etc/letsencrypt/live/_DOMAIN_/`; docker-compose mounts `./certbot/conf:/etc/letsencrypt:ro` line 21; certbot container renews every 12h |
| 2 | Pushing to main triggers automated lint, typecheck, build, and deploy to the DigitalOcean droplet | VERIFIED (workflow) / HUMAN NEEDED (secrets) | deploy.yml: `workflow_run` on "CI" success, `appleboy/ssh-action@v1`, `docker compose -f docker-compose.prod.yml build --parallel`, v2 syntax, no stale refs, concurrency group, DROPLET_HOST/DROPLET_SSH_KEY secrets |
| 3 | An external monitor alerts when the application goes down (healthcheck endpoint responds) | VERIFIED (endpoint + docs) / HUMAN NEEDED (service) | `/health` returns 200 "OK" in nginx.prod.conf line 100-104; BACKUP_RESTORE.md + 14-03-PLAN.md document UptimeRobot/Betterstack setup procedure; external service signup is a human checkpoint |
| 4 | Database backups can be restored following a documented procedure | VERIFIED (scripts + docs) / HUMAN NEEDED (cron + restore test) | backup-redis.sh: BGSAVE + docker cp + 7-day retention via `find -mtime +7 -delete`; BACKUP_RESTORE.md: full Supabase 6-step procedure with all risks (pg_net, pg_cron, role passwords, Storage exclusion), Redis restore procedure, cron setup instructions |
| 5 | A failed deployment can be rolled back to the previous version | VERIFIED (code) / HUMAN NEEDED (live test) | deploy.yml: tags `:rollback` before deploy lines 38-39, rollback step with `if: failure()` line 59, `--no-deps frontend backend` line 74; rollback.sh: validates images exist, restores tags, health checks /health and /api/health |

**Score:** 5/5 truths verified at artifact level. All 5 have pending human checkpoints before the phase can be declared fully complete.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `deploy/nginx/nginx.prod.conf` | HTTPS nginx config with fixed proxy_pass and correct SSL cert paths | VERIFIED | `proxy_pass http://backend;` line 110 (no trailing slash); SSL paths `/etc/letsencrypt/live/_DOMAIN_/fullchain.pem` lines 81-82; HSTS line 97; 301 redirect line 71 |
| `deploy/nginx/nginx.initial.conf` | HTTP-only nginx config for ACME challenge with fixed proxy_pass | VERIFIED | `proxy_pass http://backend;` line 46 (no trailing slash); ACME challenge location present lines 32-34 |
| `deploy/docker-compose.prod.yml` | Production Docker Compose with certbot live dir mounted into nginx | VERIFIED | `./certbot/conf:/etc/letsencrypt:ro` line 21 (nginx volumes); certbot container mounts same conf dir line 172; old `./nginx/ssl` path is absent |
| `deploy/verify-deployment.sh` | Shell script to verify TLS, HSTS, health, and proxy_pass | VERIFIED | Executable; 5 checks: health, API proxy, TLS cert, HSTS, HTTP->HTTPS redirect; skips TLS/HSTS/redirect for localhost |
| `.github/workflows/deploy.yml` | Reworked CI/CD deploy pipeline with SSH-based deploy and rollback | VERIFIED | `workflow_run` trigger on "CI"; `appleboy/ssh-action@v1`; `docker compose -f docker-compose.prod.yml`; rollback step with `if: failure()`; concurrency group; no stale gastat-dossier or v1 hyphenated syntax |
| `deploy/rollback.sh` | Standalone rollback script for manual use on the droplet | VERIFIED | Executable; validates `intl-dossier-frontend:rollback` and `intl-dossier-backend:rollback` exist; `docker compose -f docker-compose.prod.yml up -d --no-deps frontend backend`; health checks /health and /api/health |
| `deploy/backup-redis.sh` | Automated Redis RDB backup script with 7-day retention | VERIFIED | Executable; `docker exec intl-dossier-redis redis-cli BGSAVE`; `docker cp` to dated file; `find -mtime +7 -delete`; non-zero size check |
| `deploy/BACKUP_RESTORE.md` | Documented restore procedure for Supabase and Redis | VERIFIED | `## Supabase PostgreSQL Restore` present; `## Redis Restore` present; pg_net/pg_cron risks documented; role password risk documented; Storage objects exclusion documented; staging project ID `zkrcjzdemdmwhearhfgg` referenced |
| `deploy/test-rollback.sh` | Rollback test script for verification | VERIFIED | Executable; checks `intl-dossier-frontend:rollback` and `intl-dossier-backend:rollback` image existence; pre-rollback health checks; calls `rollback.sh` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| docker-compose.prod.yml (nginx volumes) | certbot/conf/live/$DOMAIN/ | `./certbot/conf:/etc/letsencrypt:ro` | WIRED | Line 21; certbot container shares same volume at line 172 |
| nginx.prod.conf (ssl_certificate) | /etc/letsencrypt/live/_DOMAIN_/fullchain.pem | nginx ssl_certificate directive | WIRED | Lines 81-82; `_DOMAIN_` replaced by setup-ssl.sh at deploy time |
| deploy.yml | docker-compose.prod.yml | SSH exec runs `docker compose -f docker-compose.prod.yml` | WIRED | Lines 46-47 in deploy script block |
| deploy.yml | .github/workflows/ci.yml | `workflow_run: workflows: ["CI"]` | WIRED | Line 5-6; matches ci.yml `name: CI` |
| backup-redis.sh | intl-dossier-redis container | `docker exec intl-dossier-redis` | WIRED | Line 20; container name matches docker-compose.prod.yml line 108 |
| BACKUP_RESTORE.md | Supabase dashboard | documented manual procedure | WIRED | References `https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg` |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces infrastructure configs, operational scripts, and runbook documentation. No components rendering dynamic data from a database.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| verify-deployment.sh is executable | `test -x deploy/verify-deployment.sh` | pass | PASS |
| rollback.sh is executable | `test -x deploy/rollback.sh` | pass | PASS |
| backup-redis.sh is executable | `test -x deploy/backup-redis.sh` | pass | PASS |
| test-rollback.sh is executable | `test -x deploy/test-rollback.sh` | pass | PASS |
| proxy_pass has no trailing slash | `grep "proxy_pass http://backend;" nginx.prod.conf` | line 110 matches | PASS |
| proxy_pass has no trailing slash (initial) | `grep "proxy_pass http://backend;" nginx.initial.conf` | line 46 matches | PASS |
| Certbot live dir mounted in nginx | `grep "certbot/conf:/etc/letsencrypt" docker-compose.prod.yml` | line 21 matches | PASS |
| Old stale ssl path removed | `grep "nginx/ssl" docker-compose.prod.yml` | no matches | PASS |
| No stale registry refs in deploy.yml | `grep "gastat-dossier" deploy.yml` | no matches | PASS |
| No v1 CLI syntax in deploy.yml | `grep "docker-compose" deploy.yml` (hyphenated) | no matches (filename is ok) | PASS |
| HSTS header in nginx.prod.conf | line 97 `Strict-Transport-Security "max-age=31536000; includeSubDomains"` | present | PASS |
| HTTP->HTTPS 301 redirect | line 71 `return 301 https://...` | present | PASS |
| BGSAVE in backup script | line 20 | present | PASS |
| 7-day retention in backup script | line 40 `find -mtime +7 -delete` | present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DEPLOY-01 | 14-01 | HTTPS with auto-renewing TLS certificates via nginx + certbot | SATISFIED (configs) / HUMAN NEEDED (DNS + certbot run) | nginx.prod.conf fixed, docker-compose certbot mount corrected, _DOMAIN_ placeholder pattern established |
| DEPLOY-02 | 14-02 | CI/CD pipeline runs lint, typecheck, build, deploys on push to main | SATISFIED (workflow) / HUMAN NEEDED (secrets + live run) | deploy.yml rewritten with workflow_run trigger, SSH-based deploy, health checks |
| DEPLOY-03 | 14-03 | Uptime monitoring alerts when application unreachable | SATISFIED (endpoint + docs) / HUMAN NEEDED (monitor signup) | /health endpoint in nginx config; UptimeRobot/Betterstack setup documented in 14-03-PLAN.md Task 2 |
| DEPLOY-04 | 14-03 | Verified-restorable backups with documented recovery procedure | SATISFIED (scripts + docs) / HUMAN NEEDED (cron install + restore test) | backup-redis.sh with 7-day retention; BACKUP_RESTORE.md with full procedure and known risks |
| DEPLOY-05 | 14-02 | Zero-downtime rollback to previous Docker image | SATISFIED (code) / HUMAN NEEDED (live test) | deploy.yml automatic rollback on failure; rollback.sh for manual rollback; test-rollback.sh for verification |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| deploy/nginx/nginx.prod.conf | 81-82 | `_DOMAIN_` literal placeholder in SSL cert paths | Info | Expected pattern — must be replaced via `sed` by `setup-ssl.sh` before nginx can start in HTTPS mode. Not a bug; it's the documented design. |
| deploy/rollback.sh | 32 | `docker compose` called without `cd` into compose file directory first | Warning | rollback.sh is designed to be run from within `deploy/` directory (per usage comment line 3). If run from repo root it will fail. Low risk given documented usage. |

No blockers found. All scripts use `set -euo pipefail`. No TODO/FIXME/placeholder comments in operational scripts. No hardcoded credentials.

### Human Verification Required

#### 1. DNS Domain Purchase and HTTPS Activation

**Test:** Purchase a domain, set A-record to `138.197.195.242`, SSH into droplet and follow the 11-step procedure in `14-01-PLAN.md` Task 2 (sed replace `_DOMAIN_`, switch to nginx.initial.conf, run certbot, switch to nginx.prod.conf)
**Expected:** `DOMAIN=yourdomain.com bash deploy/verify-deployment.sh` exits 0 with all 5 checks passing
**Why human:** Requires DNS registrar account, domain purchase, and certbot execution on the droplet

#### 2. GitHub Actions Secrets and Live Deploy

**Test:** Add `DROPLET_HOST` (value: `138.197.195.242`) and `DROPLET_SSH_KEY` (SSH private key) to GitHub repository Settings > Secrets > Actions. Push a commit to main, observe CI workflow completes, then Deploy workflow triggers and completes.
**Expected:** Deploy workflow shows green, containers are running the new build on the droplet
**Why human:** Requires GitHub repository admin access and a live network connection to the droplet

#### 3. External Uptime Monitor Configuration and Alert Test

**Test:** Sign up for UptimeRobot (free) or Betterstack, add an HTTP monitor for `http://138.197.195.242/health` (or `https://yourdomain.com/health` once DNS is ready), set 5-minute check interval. Then stop nginx on droplet (`docker compose -f docker-compose.prod.yml stop nginx`), wait 5-10 minutes, confirm alert email/notification arrives.
**Expected:** Monitor shows "UP" status when running; alert received within 10 minutes of nginx being stopped
**Why human:** Requires external service account and live droplet access

#### 4. Redis Backup Cron Install and First Run

**Test:** SSH into droplet, run the cron install command from `deploy/BACKUP_RESTORE.md` Setup section. Then manually run `bash /opt/intl-dossier/deploy/backup-redis.sh` and verify a non-empty `.rdb` file appears in `/opt/intl-dossier/backups/redis/`.
**Expected:** `crontab -l | grep redis` shows the 02:00 UTC entry; backup file exists and `stat` shows non-zero size
**Why human:** Requires live droplet SSH access with Redis container running

#### 5. Supabase Restore Test Against Staging

**Test:** Follow the 6-step procedure in `deploy/BACKUP_RESTORE.md` under "Supabase PostgreSQL Restore" against staging project `zkrcjzdemdmwhearhfgg`. After restore, verify `SELECT COUNT(*) FROM dossiers` returns non-zero, pg_net/pg_cron are disabled.
**Expected:** Restore completes without errors, data integrity confirmed, extensions handled per documented risks
**Why human:** Requires Supabase dashboard access and staging database access

#### 6. Rollback End-to-End Test on Droplet

**Test:** After at least one automated deployment has run (which creates the `:rollback` tags), SSH into droplet and run `cd /opt/intl-dossier/deploy && bash test-rollback.sh`.
**Expected:** Both rollback images found, health checks pass before and after rollback, script exits 0
**Why human:** Requires a prior deployment to have tagged `:rollback` images and live droplet access

### Gaps Summary

No automated gaps found. All phase artifacts exist, are substantive, wired correctly, and pass all programmatic checks. The phase is blocked on 6 human verification items representing the two documented human checkpoints (14-01 Task 2 and 14-03 Task 2) plus the live validation of the CI/CD pipeline.

The configurations are correct and complete. The human items are operational activations, not code gaps.

---

_Verified: 2026-04-06T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
