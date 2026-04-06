# Phase 14: Production Deployment - Research

**Researched:** 2026-04-06
**Domain:** DevOps -- HTTPS/TLS, CI/CD, monitoring, backup/recovery, Docker deployment
**Confidence:** HIGH

## Summary

Phase 14 transforms the existing DigitalOcean droplet deployment from a bare-IP HTTP-only manual process into a production-grade setup with HTTPS, automated CI/CD, uptime monitoring, verified backups, and zero-downtime rollback. The infrastructure is largely in place -- Docker Compose, nginx configs, certbot container, health endpoints, and a functional CI pipeline all exist. The work is primarily configuration fixes, workflow rework, and operational procedure documentation.

The critical path is: DNS A-record (human prerequisite) -> fix nginx.prod.conf proxy_pass bug -> certbot certificate acquisition -> deploy.yml rework -> external monitoring -> backup verification -> rollback mechanism.

**Primary recommendation:** Fix the existing deploy.yml to use SSH-based pull-and-restart (matching the proven manual workflow), fix the nginx.prod.conf trailing-slash bug, and add UptimeRobot as the external monitor. Do NOT introduce new infrastructure (Kubernetes, Caddy, Terraform) -- iterate on what exists.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use existing nginx + certbot Docker setup with three-config approach (HTTP-only `nginx.initial.conf` for cert acquisition, then swap to `nginx.prod.conf` for full HTTPS with TLS 1.2/1.3 and HSTS)
- **D-02:** Fix `nginx.prod.conf` proxy_pass trailing-slash discrepancy before switching configs -- current prod config strips `/api/` prefix which would break all backend routes
- **D-03:** DNS domain must be purchased and A-record pointed to 138.197.195.242 before certbot can issue certificates -- prerequisite blocker for DEPLOY-01
- **D-04:** Rework `deploy.yml` -- fix stale Docker registry name (`gastat-dossier`), wrong health check URL (`dossier.gastat.gov.sa`), and v1 `docker-compose` CLI syntax; align with already-functional `ci.yml`
- **D-05:** Deployment strategy uses SSH-based pull-and-restart on DigitalOcean droplet, matching current manual workflow
- **D-06:** Investigate pulling pre-built images from GHCR (ci.yml already builds them) as upgrade path -- enables faster deploys and true image-based rollback for DEPLOY-05
- **D-07:** Health check endpoints already exist at multiple levels -- no new endpoint development needed
- **D-08:** Add external uptime monitor (UptimeRobot, Betterstack, or similar free-tier) pointing at nginx `/health` endpoint for DEPLOY-03 alerting
- **D-09:** Self-hosted Prometheus/Grafana stack is available but not required for this phase
- **D-10:** Database backups rely on Supabase managed backups -- phase work focuses on documenting and testing restore procedure
- **D-11:** Redis data needs off-host backup strategy (RDB snapshots to external storage)
- **D-12:** Supabase backup restore must be tested against staging project

### Claude's Discretion
- Exact external monitoring service selection (UptimeRobot vs Betterstack vs other)
- Redis backup cron schedule and storage destination
- GitHub Actions workflow job naming and step organization
- Nginx SSL cipher suite ordering within TLS 1.2/1.3

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | HTTPS with auto-renewing TLS via nginx + certbot | D-01/D-02/D-03: Three-config nginx approach, certbot container already in docker-compose.prod.yml, setup-ssl.sh helper exists. Bug fix needed in nginx.prod.conf proxy_pass. DNS is human prerequisite. |
| DEPLOY-02 | CI/CD pipeline: lint, typecheck, build, deploy on push to main | D-04/D-05/D-06: ci.yml already runs lint/typecheck/build/Docker. deploy.yml needs full rework -- stale registry, wrong health URL, v1 CLI syntax. SSH-based deploy matches proven manual workflow. |
| DEPLOY-03 | Uptime monitoring with external alerting | D-07/D-08/D-09: Health endpoints exist at `/health` (nginx) and `/health` (backend). External free-tier monitor (UptimeRobot recommended) satisfies requirement. No new code needed. |
| DEPLOY-04 | Database backups verified restorable with documented procedure | D-10/D-11/D-12: Supabase manages daily PostgreSQL backups. Must test restore to staging. Redis needs off-host RDB backup. PITFALLS.md documents known risks: Storage objects not included, role passwords not preserved, extension conflicts on restore. |
| DEPLOY-05 | Zero-downtime rollback to previous Docker image | D-06: GHCR images from ci.yml enable image-based rollback. Docker Compose `docker compose up -d --no-deps <service>` for per-service restart. Keep N-1 image tagged for instant rollback. |
</phase_requirements>

## Standard Stack

### Core (Already in Place)
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| nginx | alpine (latest) | Reverse proxy + TLS termination | Already configured in docker-compose.prod.yml [VERIFIED: deploy/docker-compose.prod.yml] |
| certbot/certbot | latest | Let's Encrypt certificate acquisition + renewal | Already configured as container with 12h renewal loop [VERIFIED: deploy/docker-compose.prod.yml] |
| Docker Compose | v2 | Container orchestration | Already used for all services [VERIFIED: deploy/setup-droplet.sh] |
| GitHub Actions | N/A | CI/CD pipeline | ci.yml already functional with lint/typecheck/test/Docker build [VERIFIED: .github/workflows/ci.yml] |
| GHCR | N/A | Container registry | ci.yml already pushes images to ghcr.io [VERIFIED: .github/workflows/ci.yml] |

### Supporting (To Add)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| UptimeRobot | Free tier | External uptime monitoring + alerting | DEPLOY-03: HTTP(S) check on `/health` endpoint every 5 min [ASSUMED] |
| cron (host) | System | Redis RDB backup to off-host storage | DEPLOY-04: Scheduled `docker cp` of Redis dump.rdb [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| UptimeRobot | Betterstack (formerly Better Uptime) | Betterstack has nicer status pages but UptimeRobot has simpler setup and 50 free monitors [ASSUMED] |
| UptimeRobot | Freshping | Free tier, but less well-known [ASSUMED] |
| SSH deploy | GHCR pull deploy | GHCR pull is faster (no build on droplet) and enables true image rollback, but requires more deploy.yml changes. D-06 marks this as upgrade path. |

## Architecture Patterns

### Nginx Three-Config Approach
```
deploy/nginx/
  nginx.conf          <- Currently active config (HTTP-only, production)
  nginx.initial.conf  <- HTTP-only for ACME challenge (temporary during cert acquisition)
  nginx.prod.conf     <- Full HTTPS with TLS 1.2/1.3, HSTS, security headers (TARGET)
```

**Flow:**
1. Copy `nginx.initial.conf` -> `nginx.conf` (start HTTP-only)
2. Run certbot to acquire certificate via ACME webroot challenge
3. Copy certificates to `nginx/ssl/`
4. Copy `nginx.prod.conf` -> `nginx.conf` (switch to HTTPS)
5. Restart nginx

This is already scripted in `deploy/setup-ssl.sh` (generated by `setup-droplet.sh`). [VERIFIED: deploy/setup-droplet.sh lines 157-195]

### CI/CD Pipeline Architecture (Reworked deploy.yml)
```
Push to main
  |
  v
ci.yml (existing - no changes needed)
  ├── repo-policy
  ├── lint + typecheck
  ├── unit tests
  ├── build (backend + frontend matrix)
  └── docker-build -> push to GHCR
  
deploy.yml (reworked)
  ├── needs: ci passes (or runs after ci.yml via workflow_run)
  ├── SSH into droplet
  ├── git pull latest code
  ├── docker compose build (or pull from GHCR)
  ├── docker compose up -d
  ├── health check (curl /health)
  └── rollback on failure (restart previous containers)
```

### Rollback Strategy
```
# Tag current working images before deploy
docker tag intl-dossier-frontend:latest intl-dossier-frontend:rollback
docker tag intl-dossier-backend:latest intl-dossier-backend:rollback

# Deploy new version
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# If health check fails, rollback:
docker tag intl-dossier-frontend:rollback intl-dossier-frontend:latest
docker tag intl-dossier-backend:rollback intl-dossier-backend:latest
docker compose -f docker-compose.prod.yml up -d --no-deps frontend backend
```

### Anti-Patterns to Avoid
- **Building Docker images on the droplet during deploy.yml AND in ci.yml:** Wasteful double-build. Either build on droplet (current manual approach) or pull from GHCR (upgrade path), not both.
- **Using `docker-compose` (v1 hyphenated) syntax:** Droplet has Docker Compose v2 installed as plugin. Always use `docker compose` (space). [VERIFIED: deploy.yml line 67 uses v1 syntax]
- **Hardcoding domain in health check:** deploy.yml line 71 uses `dossier.gastat.gov.sa` which does not exist. Use the actual domain or IP. [VERIFIED: deploy.yml line 71]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS certificate management | Custom ACME client or manual cert renewal | certbot container with 12h renewal loop | Already configured, handles renewal, edge cases, and rate limits [VERIFIED: docker-compose.prod.yml] |
| Uptime monitoring | Custom health check cron + email | UptimeRobot/Betterstack free tier | Handles retry logic, incident tracking, alert escalation, status pages |
| Docker image tagging | Manual SHA tracking | docker/metadata-action in GitHub Actions | Already used in ci.yml, handles branch/tag/SHA tagging [VERIFIED: ci.yml lines 350-359] |
| SSH key management for deploy | Inline key handling | GitHub Actions secrets + ssh-agent | Standard pattern, avoids key leakage |

## Common Pitfalls

### Pitfall 1: nginx proxy_pass Trailing Slash Strips Path Prefix
**What goes wrong:** `proxy_pass http://backend/;` (trailing slash) causes nginx to strip the `/api/` location prefix before forwarding. A request to `/api/health` arrives at the backend as `/health` instead of `/api/health`. The backend mounts routes at `/api/...` so everything 404s.
**Why it happens:** nginx URI normalization: when `proxy_pass` has a URI component (even just `/`), nginx replaces the matched location prefix with that URI.
**How to avoid:** Use `proxy_pass http://backend;` (NO trailing slash) to preserve the full original URI.
**Warning signs:** All API calls return 404 after switching to nginx.prod.conf.
**Files affected:** `deploy/nginx/nginx.prod.conf` line 110, `deploy/nginx/nginx.initial.conf` line 46 [VERIFIED: both files read]

### Pitfall 2: Certbot Certificate Path vs Nginx SSL Path Mismatch
**What goes wrong:** `setup-ssl.sh` copies certs from `certbot/conf/live/$DOMAIN/` to `nginx/ssl/`. But certbot renewal writes to the original path. After renewal, nginx still serves the old cert copy.
**Why it happens:** The copy-based approach breaks the symlink chain certbot uses for renewal.
**How to avoid:** Mount the certbot conf directory directly into nginx instead of copying. Or add a post-renewal hook that re-copies and reloads nginx.
**Warning signs:** Certificate expires despite certbot renewal logs showing success.
**Current state:** `docker-compose.prod.yml` mounts `./nginx/ssl:/etc/nginx/ssl:ro` but certbot writes to `./certbot/conf/`. These are separate paths. [VERIFIED: docker-compose.prod.yml lines 20-22]

### Pitfall 3: deploy.yml Uses Stale References
**What goes wrong:** Current deploy.yml references `gastat-dossier` Docker registry name (line 51-53), health checks `dossier.gastat.gov.sa` (line 71), uses `docker-compose` v1 syntax (line 67), and uses separate DOCKER_REGISTRY secrets instead of GHCR.
**Why it happens:** deploy.yml was scaffolded but never actually used -- manual SSH deploy has been the workflow.
**How to avoid:** Rewrite deploy.yml from scratch using SSH-based approach matching manual workflow, or use GHCR images from ci.yml.
**Warning signs:** Deploy workflow fails immediately on first run.
[VERIFIED: .github/workflows/deploy.yml]

### Pitfall 4: Supabase Backup Restore Risks
**What goes wrong:** Restore fails due to missing role passwords, Storage objects not included in backup, `pg_net`/`pg_cron` extensions firing unintended actions during restore.
**Why it happens:** Supabase daily backups are automatic but have known limitations. Never tested.
**How to avoid:** Test restore to staging project. Disable `pg_net`/`pg_cron` post-restore. Verify Storage objects separately. Document in RESTORE_RUNBOOK.md.
[VERIFIED: .planning/research/PITFALLS.md - Pitfall 5]

### Pitfall 5: Certbot Rate Limits During Testing
**What goes wrong:** Let's Encrypt has a 5 duplicate certificates per week rate limit. Repeated failed attempts during setup can lock you out.
**Why it happens:** Testing certbot commands without `--dry-run` flag.
**How to avoid:** Always use `certbot certonly --dry-run` first. Only remove `--dry-run` for the final issuance. [ASSUMED]

### Pitfall 6: Docker Compose Service Dependencies During Rollback
**What goes wrong:** Rolling back a single service (e.g., backend) causes nginx to lose its upstream because `depends_on` with `condition: service_healthy` re-checks health during `up`.
**Why it happens:** Docker Compose health check conditions are re-evaluated on `up`.
**How to avoid:** Use `docker compose up -d --no-deps <service>` to restart a single service without touching its dependencies. [ASSUMED]

## Code Examples

### Fixed nginx.prod.conf proxy_pass (DEPLOY-01)
```nginx
# Source: Current nginx.conf (working HTTP config) - line 83
# FIX: Remove trailing slash from proxy_pass to preserve /api/ prefix

location /api/ {
    limit_req zone=api burst=20 nodelay;

    proxy_pass http://backend;          # NO trailing slash
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
[VERIFIED: comparing nginx.conf line 86 vs nginx.prod.conf line 110]

### Reworked deploy.yml Structure (DEPLOY-02)
```yaml
# Source: Pattern from existing manual workflow in DROPLET_INSTRUCTIONS.md
name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd /opt/intl-dossier
            # Tag current images for rollback
            docker tag intl-dossier-frontend:latest intl-dossier-frontend:rollback 2>/dev/null || true
            docker tag intl-dossier-backend:latest intl-dossier-backend:rollback 2>/dev/null || true
            # Pull and rebuild
            git pull origin main
            cd deploy
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
            # Health check
            sleep 10
            curl -f http://localhost/health || exit 1

      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            docker tag intl-dossier-frontend:rollback intl-dossier-frontend:latest 2>/dev/null || true
            docker tag intl-dossier-backend:rollback intl-dossier-backend:latest 2>/dev/null || true
            cd /opt/intl-dossier/deploy
            docker compose -f docker-compose.prod.yml up -d --force-recreate
```
[ASSUMED: appleboy/ssh-action version and exact API]

### Certbot with Dry Run (DEPLOY-01)
```bash
# Source: Let's Encrypt best practice [ASSUMED]
# Always dry-run first to avoid rate limits
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d $DOMAIN \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    --dry-run

# If dry-run succeeds, run without --dry-run
```

### Redis Backup Script (DEPLOY-04)
```bash
#!/bin/bash
# Source: Standard Redis backup pattern [ASSUMED]
# Cron: 0 2 * * * /opt/intl-dossier/backup-redis.sh

BACKUP_DIR="/opt/intl-dossier/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Trigger Redis BGSAVE and wait
docker exec intl-dossier-redis redis-cli BGSAVE
sleep 5

# Copy RDB file from container
docker cp intl-dossier-redis:/data/dump.rdb "$BACKUP_DIR/dump_${DATE}.rdb"

# Keep only last 7 days
find "$BACKUP_DIR" -name "dump_*.rdb" -mtime +7 -delete
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `docker-compose` (v1) | `docker compose` (v2 plugin) | Docker Compose v2 GA 2022 | deploy.yml must use space syntax [VERIFIED: deploy.yml uses hyphenated v1] |
| Manual cert renewal | certbot container with auto-renewal loop | Standard practice | Already implemented in docker-compose.prod.yml [VERIFIED] |
| Custom Docker registry | GHCR (GitHub Container Registry) | GitHub Packages | ci.yml already pushes to GHCR [VERIFIED] |
| `docker/login-action@v2` | `docker/login-action@v3` | 2024 | ci.yml already uses v3 [VERIFIED] |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit), Playwright (E2E) |
| Config file | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test && pnpm lint && pnpm typecheck` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPLOY-01 | HTTPS serves with valid TLS | manual-only | `curl -vI https://$DOMAIN 2>&1 \| grep "SSL certificate"` | N/A -- requires live domain |
| DEPLOY-02 | CI/CD deploys on push to main | manual-only | Trigger deploy.yml via `gh workflow run deploy.yml` then verify | N/A -- requires GitHub Actions run |
| DEPLOY-03 | External monitor alerts on downtime | manual-only | Stop nginx, verify alert received within SLA | N/A -- requires monitoring service setup |
| DEPLOY-04 | Backup restore works | manual-only | Execute RESTORE_RUNBOOK.md against staging | N/A -- requires Supabase staging project |
| DEPLOY-05 | Rollback restores previous version | smoke | SSH into droplet, run rollback commands, verify `/health` | N/A -- requires deployed environment |

**Justification for manual-only:** All DEPLOY requirements involve live infrastructure (DNS, droplet, Supabase, monitoring service) that cannot be tested in CI. Verification is procedural.

### Sampling Rate
- **Per task commit:** `pnpm lint && pnpm typecheck` (catch syntax errors in config files)
- **Per wave merge:** Full CI pipeline green
- **Phase gate:** Manual verification of each DEPLOY requirement against live infrastructure

### Wave 0 Gaps
- None -- no new test files needed. Phase is infrastructure/config, not application code.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (Supabase Auth unchanged) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | no | N/A (no new endpoints) |
| V6 Cryptography | yes | TLS 1.2/1.3 via nginx, Let's Encrypt certificates, HSTS header |
| V9 Communications | yes | HTTPS enforced, HTTP->HTTPS redirect, HSTS with includeSubDomains |
| V14 Configuration | yes | Security headers (X-Frame-Options, X-Content-Type-Options, CSP), fail2ban, UFW firewall |

### Known Threat Patterns for Infrastructure

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unencrypted traffic (HTTP) | Information Disclosure | Force HTTPS redirect, HSTS header [VERIFIED: nginx.prod.conf lines 60-73, 97] |
| SSH brute force | Elevation of Privilege | fail2ban with 3-retry limit [VERIFIED: setup-droplet.sh lines 98-110] |
| Stale TLS certificates | Information Disclosure | certbot auto-renewal every 12h [VERIFIED: docker-compose.prod.yml line 174] |
| Docker socket exposure | Elevation of Privilege | No Docker socket mounted into containers [VERIFIED: docker-compose.prod.yml] |
| Exposed Redis port | Information Disclosure | Redis uses `expose` not `ports` -- internal network only [VERIFIED: docker-compose.prod.yml line 111] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UptimeRobot free tier provides 50 monitors with 5-min intervals and email/webhook alerts | Standard Stack | Low -- all major uptime monitors have similar free tiers; easily swapped |
| A2 | `appleboy/ssh-action@v1` is the current stable version for SSH in GitHub Actions | Code Examples | Medium -- version may differ; verify before implementation |
| A3 | Let's Encrypt rate limit is 5 duplicate certs per week | Pitfalls | Low -- actual limit documented on Let's Encrypt site; dry-run avoids issue regardless |
| A4 | `docker compose up -d --no-deps` skips dependency health checks during rollback | Pitfalls | Medium -- must verify with Docker Compose v2 docs |
| A5 | certbot renewal writes to original path, not the copy in nginx/ssl/ | Pitfalls | HIGH -- if wrong, the copy approach works fine. But if right, certs expire after 90 days despite renewal running. Must verify cert path mounting strategy. |

## Open Questions

1. **Domain name not yet purchased**
   - What we know: DNS A-record to 138.197.195.242 is a prerequisite for DEPLOY-01 (D-03)
   - What's unclear: What domain will be used? When will it be purchased?
   - Recommendation: Plan should include a "human prerequisite" task that blocks HTTPS work. All other tasks (deploy.yml rework, monitoring setup, backup docs) can proceed in parallel.

2. **Certbot cert path vs nginx SSL mount**
   - What we know: docker-compose.prod.yml mounts `./nginx/ssl` for nginx and `./certbot/conf` for certbot. setup-ssl.sh copies certs between them.
   - What's unclear: Will certbot renewal auto-copy, or will certs go stale after 90 days?
   - Recommendation: Change nginx SSL volume mount to point directly at certbot's live directory, or add a post-renewal hook script. This is a critical fix.

3. **GHCR pull vs build-on-droplet for deploy strategy**
   - What we know: D-06 marks GHCR pull as an "upgrade path." ci.yml already pushes images.
   - What's unclear: Should Phase 14 implement GHCR pull now, or stick with build-on-droplet?
   - Recommendation: Start with build-on-droplet (proven, matches manual workflow). GHCR pull can be a follow-up enhancement if time permits.

## Environment Availability

> These dependencies are on the DigitalOcean droplet (138.197.195.242), not the local dev machine. Cannot probe remotely without SSH.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker + Compose v2 | All services | Assumed yes | Installed by setup-droplet.sh | -- |
| nginx (Alpine image) | DEPLOY-01 | Yes (Docker image) | alpine latest | -- |
| certbot (Docker image) | DEPLOY-01 | Yes (Docker image) | latest | -- |
| UFW firewall | Security | Assumed yes | Installed by setup-droplet.sh | -- |
| fail2ban | Security | Assumed yes | Installed by setup-droplet.sh | -- |
| git | DEPLOY-02 | Assumed yes | Installed by setup-droplet.sh | -- |
| GitHub Actions | DEPLOY-02 | Yes | N/A | -- |
| UptimeRobot | DEPLOY-03 | External SaaS | Free tier | Betterstack, Freshping |
| Supabase managed backups | DEPLOY-04 | Yes (Pro plan) | Daily | -- |

**Missing dependencies with no fallback:**
- DNS domain + A-record (human prerequisite, blocks DEPLOY-01)

**Missing dependencies with fallback:**
- None identified

## Project Constraints (from CLAUDE.md)

- **Deployment target:** DigitalOcean droplet at 138.197.195.242 with Docker Compose
- **Quick deploy command:** `git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"`
- **Database:** Supabase managed PostgreSQL -- migrations via Supabase MCP
- **Monorepo:** pnpm + Turborepo (backend, frontend, shared workspaces)
- **Must maintain:** Backwards compatibility, bilingual Arabic/English
- **Stack constraint:** No framework migrations -- stay with existing stack

## Sources

### Primary (HIGH confidence)
- `deploy/docker-compose.prod.yml` -- Full production Docker Compose config [READ]
- `deploy/nginx/nginx.conf` -- Current working HTTP nginx config [READ]
- `deploy/nginx/nginx.prod.conf` -- HTTPS nginx config with trailing-slash bug [READ]
- `deploy/nginx/nginx.initial.conf` -- HTTP-only config for cert acquisition [READ]
- `deploy/setup-droplet.sh` -- Droplet provisioning including setup-ssl.sh generation [READ]
- `deploy/DROPLET_INSTRUCTIONS.md` -- Manual deployment procedure [READ]
- `.github/workflows/ci.yml` -- Functional CI pipeline [READ]
- `.github/workflows/deploy.yml` -- Stale deploy workflow needing rework [READ]
- `.planning/research/PITFALLS.md` -- Supabase backup restore risks [READ]
- `backend/src/index.ts` -- Health endpoint at `/health` [GREP verified]

### Secondary (MEDIUM confidence)
- `.planning/phases/14-production-deployment/14-CONTEXT.md` -- User decisions [READ]

### Tertiary (LOW confidence)
- UptimeRobot free tier capabilities [ASSUMED]
- appleboy/ssh-action version [ASSUMED]
- Let's Encrypt rate limits [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already exist in the repo, verified by reading config files
- Architecture: HIGH -- patterns derive from existing working configs and documented manual workflow
- Pitfalls: HIGH -- nginx bug verified by diff, Supabase risks documented in PITFALLS.md, deploy.yml issues visible in source

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable infrastructure, no fast-moving dependencies)
