# Phase 14: Production Deployment - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-06
**Phase:** 14-production-deployment
**Mode:** assumptions
**Areas analyzed:** HTTPS & TLS Setup, CI/CD Pipeline, Monitoring & Health Checks, Database Backup & Recovery

## Assumptions Presented

### HTTPS & TLS Setup
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Use existing nginx + certbot three-config approach | Confident | `deploy/docker-compose.prod.yml`, `deploy/nginx/nginx.initial.conf`, `deploy/nginx/nginx.prod.conf`, `deploy/setup-droplet.sh` |
| Fix nginx.prod.conf proxy_pass trailing-slash discrepancy | Confident | `deploy/nginx/nginx.conf` line 84 vs `deploy/nginx/nginx.prod.conf` line 112 |
| DNS domain required before certbot can issue certs | Confident | Droplet is bare IP 138.197.195.242, no domain configured |

### CI/CD Pipeline
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| deploy.yml needs significant rework (stale refs) | Confident | `.github/workflows/deploy.yml` lines 51, 66, 71 |
| SSH-based pull-and-restart deployment strategy | Likely | `deploy/DROPLET_INSTRUCTIONS.md`, `docker-compose.prod.yml` uses build context |
| Consider GHCR pre-built images for rollback capability | Likely | `.github/workflows/ci.yml` lines 330-369 already pushes to GHCR |

### Monitoring & Health Checks
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Health endpoints already exist, need external monitor only | Likely | `backend/src/index.ts` line 65-71, `backend/src/api/index.ts` line 50, nginx `/health` |
| Use free external monitor (UptimeRobot/Betterstack) | Likely | No prior decision on monitoring service |
| Prometheus/Grafana available but optional | Likely | `monitoring/` directory exists |

### Database Backup & Recovery
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Rely on Supabase managed backups, focus on testing restore | Likely | `deploy.yml` line 42, database on Supabase not droplet |
| Redis needs off-host backup strategy | Likely | `docker-compose.prod.yml` line 114-119 has persistence but no external backup |
| Supabase restore never tested — must verify | Likely | `.planning/research/PITFALLS.md` lines 70-76 |

## Corrections Made

No corrections — all assumptions confirmed.

## Needs External Research

- Domain name availability and DNS provider choice (droplet is bare IP)
- External uptime monitoring service selection (free-tier comparison)
- Supabase backup restore procedure for current plan tier
