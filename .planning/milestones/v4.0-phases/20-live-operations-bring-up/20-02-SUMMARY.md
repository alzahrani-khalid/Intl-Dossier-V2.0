---
plan: 20-02
phase: 20-live-operations-bring-up
title: Production Domain, TLS & First Live Deploy
status: deferred
started: 2026-04-09
completed: null
reason: App will be installed on corporate infrastructure — droplet is temporary staging. Domain, TLS, and GH Actions deploy pipeline will be configured on corporate infra.
---

## Deferred

Plan 20-02 is deferred because the DigitalOcean droplet at `138.197.195.242` is a temporary staging environment. The production deployment will happen on corporate infrastructure with its own domain, TLS, and CI/CD pipeline.

**What remains when corporate infra is ready:**

- DNS A record pointing to corporate host
- TLS certificate (certbot or corporate CA)
- GH Actions secrets for automated deploy
- `verify-deployment.sh` against production URL

## Self-Check: SKIPPED (deferred)
