---
phase: 14-production-deployment
plan: 01
subsystem: infra
tags: [nginx, certbot, tls, https, docker-compose, letsencrypt]

# Dependency graph
requires: []
provides:
  - Fixed nginx proxy_pass preserving /api/ prefix for both HTTP and HTTPS configs
  - Certbot live directory mounted directly into nginx for auto-renewing TLS
  - SSL cert paths using _DOMAIN_ placeholder for certbot live dir
  - Deployment verification script for TLS, HSTS, health, and proxy checks
affects: [14-production-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Certbot live dir mount pattern: ./certbot/conf:/etc/letsencrypt:ro in nginx volumes"
    - "_DOMAIN_ placeholder in nginx.prod.conf replaced by setup-ssl.sh at deploy time"

key-files:
  created:
    - deploy/verify-deployment.sh
  modified:
    - deploy/nginx/nginx.prod.conf
    - deploy/nginx/nginx.initial.conf
    - deploy/docker-compose.prod.yml

key-decisions:
  - "Mount certbot conf dir directly into nginx instead of copying certs to nginx/ssl — prevents stale certs after renewal"
  - "Use _DOMAIN_ placeholder in nginx.prod.conf SSL paths — sed-replaced by setup-ssl.sh at deploy time since nginx configs are static"

patterns-established:
  - "Certbot cert mount: nginx reads from /etc/letsencrypt/live/ via shared volume, no manual copy needed"

requirements-completed: [DEPLOY-01]

# Metrics
duration: 1min
completed: 2026-04-06
---

# Phase 14 Plan 01: HTTPS & Nginx Fix Summary

**Fixed nginx proxy_pass trailing-slash bug and certbot cert path mounting for production HTTPS with auto-renewing TLS**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-06T08:38:58Z
- **Completed:** 2026-04-06T08:40:27Z
- **Tasks:** 1 of 2 (Task 2 is human-action checkpoint)
- **Files modified:** 4

## Accomplishments
- Fixed proxy_pass trailing-slash bug in nginx.prod.conf and nginx.initial.conf that would strip /api/ prefix and 404 all backend routes
- Changed docker-compose.prod.yml to mount certbot live directory directly into nginx, preventing stale certs after 90-day renewal
- Updated SSL cert paths to use _DOMAIN_ placeholder pointing to certbot live directory
- Created verify-deployment.sh script testing health, API proxy, TLS, HSTS, and HTTP-to-HTTPS redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix nginx configs and certbot cert path mounting** - `faade191` (fix)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `deploy/nginx/nginx.prod.conf` - Fixed proxy_pass (no trailing slash), updated SSL cert paths to certbot live dir with _DOMAIN_ placeholder
- `deploy/nginx/nginx.initial.conf` - Fixed proxy_pass (no trailing slash) for HTTP-only cert acquisition config
- `deploy/docker-compose.prod.yml` - Changed nginx volume from ./nginx/ssl to ./certbot/conf:/etc/letsencrypt:ro
- `deploy/verify-deployment.sh` - New verification script checking 5 deployment criteria

## Decisions Made
- Mount certbot conf dir directly into nginx instead of copying certs to nginx/ssl — prevents stale certs after 90-day renewal cycle
- Use _DOMAIN_ placeholder in nginx.prod.conf SSL paths — setup-ssl.sh uses sed to replace at deploy time since nginx configs cannot use environment variables

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**DNS domain purchase and HTTPS activation required.** Task 2 is a human-action checkpoint requiring:
1. Purchase a domain and create A-record pointing to 138.197.195.242
2. SSH into droplet and run setup-ssl.sh to acquire certificates
3. See Task 2 in 14-01-PLAN.md for step-by-step instructions

## Next Phase Readiness
- All nginx config fixes and cert mounting are ready for HTTPS activation
- Blocked on DNS domain purchase (human prerequisite)
- Other plans in Phase 14 (CI/CD, monitoring, backups) can proceed independently

---
*Phase: 14-production-deployment*
*Completed: 2026-04-06*
