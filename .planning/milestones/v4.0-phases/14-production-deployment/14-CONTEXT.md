# Phase 14: Production Deployment - Context

**Gathered:** 2026-04-06 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Application runs reliably in production with HTTPS, automated deployments, monitoring, and recovery capabilities. Covers DEPLOY-01 through DEPLOY-05: TLS certificates, CI/CD pipeline, uptime monitoring, database backup verification, and zero-downtime rollback.

</domain>

<decisions>
## Implementation Decisions

### HTTPS & TLS Setup

- **D-01:** Use the existing nginx + certbot Docker setup with the three-config approach — HTTP-only `nginx.initial.conf` for cert acquisition, then swap to `nginx.prod.conf` for full HTTPS with TLS 1.2/1.3 and HSTS
- **D-02:** Fix the `nginx.prod.conf` proxy_pass trailing-slash discrepancy before switching configs — current prod config strips `/api/` prefix which would break all backend routes (backend mounts at `/api`)
- **D-03:** DNS domain must be purchased and A-record pointed to 138.197.195.242 before certbot can issue certificates — this is a prerequisite blocker for DEPLOY-01

### CI/CD Pipeline

- **D-04:** Rework `deploy.yml` — fix stale Docker registry name (`gastat-dossier`), wrong health check URL (`dossier.gastat.gov.sa`), and v1 `docker-compose` CLI syntax; align with the already-functional `ci.yml`
- **D-05:** Deployment strategy uses SSH-based pull-and-restart on the DigitalOcean droplet, matching current manual workflow documented in `deploy/DROPLET_INSTRUCTIONS.md`
- **D-06:** Investigate pulling pre-built images from GHCR (ci.yml already builds them) as an upgrade path — enables faster deploys and true image-based rollback for DEPLOY-05

### Monitoring & Health Checks

- **D-07:** Health check endpoints already exist at multiple levels (backend `/health`, `/api/health`, nginx `/health`, Docker healthchecks) — no new endpoint development needed
- **D-08:** Add an external uptime monitor (UptimeRobot, Betterstack, or similar free-tier service) pointing at the nginx `/health` endpoint for DEPLOY-03 alerting
- **D-09:** Self-hosted Prometheus/Grafana stack (existing `monitoring/` directory) is available but not required for this phase — external monitor satisfies DEPLOY-03

### Database Backup & Recovery

- **D-10:** Database backups rely on Supabase managed backups (database is hosted on Supabase, not on the droplet) — phase work focuses on documenting and testing the restore procedure
- **D-11:** Redis data on the droplet has persistence configured (`--save 60 1000 --appendonly yes`) but needs an off-host backup strategy (RDB snapshots to external storage)
- **D-12:** Supabase backup restore must be tested against staging project — PITFALLS.md warns: backups have never been tested, don't include Storage objects, may have extension/role conflicts

### Claude's Discretion

- Exact external monitoring service selection (UptimeRobot vs Betterstack vs other)
- Redis backup cron schedule and storage destination
- GitHub Actions workflow job naming and step organization
- Nginx SSL cipher suite ordering within TLS 1.2/1.3

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Deployment Infrastructure

- `deploy/docker-compose.prod.yml` — Production Docker Compose with all services, certbot container, Redis persistence
- `deploy/DROPLET_INSTRUCTIONS.md` — Current manual deployment procedure and droplet setup
- `deploy/setup-droplet.sh` — Droplet provisioning script, generates `setup-ssl.sh` helper
- `deploy/nginx/nginx.conf` — Current HTTP nginx config (preserves `/api/` prefix)
- `deploy/nginx/nginx.initial.conf` — HTTP-only config for ACME challenge during cert acquisition
- `deploy/nginx/nginx.prod.conf` — Full HTTPS config (has trailing-slash bug in proxy_pass)

### CI/CD Workflows

- `.github/workflows/ci.yml` — Functional CI: lint, typecheck, tests, Docker build to GHCR
- `.github/workflows/deploy.yml` — Stale deploy workflow (needs full rework per D-04)

### Backend Health

- `backend/src/index.ts` — `/health` endpoint (line ~65-71)
- `backend/src/api/index.ts` — `/api/health` endpoint (line ~50)

### Known Issues

- `.planning/research/PITFALLS.md` §Supabase Backup — Restore risks, Storage gaps, extension conflicts

### Root Docker

- `docker-compose.yml` — Development Docker Compose (root)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Certbot container**: Already configured in `docker-compose.prod.yml` with auto-renewal loop
- **SSL nginx configs**: `nginx.initial.conf` and `nginx.prod.conf` exist — need trailing-slash fix only
- **CI pipeline**: `ci.yml` already builds and pushes Docker images to GHCR with metadata tagging
- **Health endpoints**: Backend and nginx both have `/health` — ready for external monitoring
- **Monitoring stack**: `monitoring/` directory has Prometheus/Grafana configs (optional enhancement)

### Established Patterns

- Docker Compose for all services (frontend, backend, nginx, redis, certbot)
- SSH-based deployment to DigitalOcean droplet
- GitHub Actions for CI with matrix builds

### Integration Points

- Supabase managed database (external to droplet) — backup/restore via Supabase dashboard or API
- Redis on droplet — persistence enabled, needs off-host backup
- GHCR container registry — ci.yml already pushes images, deploy.yml can pull them
- DNS provider (TBD) — A-record + SPF/DKIM/DMARC for Resend email

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

_Phase: 14-production-deployment_
_Context gathered: 2026-04-06_
