---
phase: 14-production-deployment
plan: 02
subsystem: ci-cd
tags: [deployment, github-actions, rollback, docker, ssh]
dependency_graph:
  requires: []
  provides: [automated-deployment, rollback-mechanism]
  affects: [deploy/docker-compose.prod.yml]
tech_stack:
  added: [appleboy/ssh-action@v1]
  patterns: [workflow_run-trigger, image-tag-rollback, concurrency-group]
key_files:
  created:
    - deploy/rollback.sh
  modified:
    - .github/workflows/deploy.yml
decisions:
  - SSH-based deploy matching proven manual workflow (not GHCR pull)
  - workflow_run trigger ensures CI passes before deploy
  - Image tag rollback (latest/rollback) for zero-downtime recovery
  - --no-deps on rollback to avoid dependency health check issues
metrics:
  duration: 2m
  completed: 2026-04-06
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 14 Plan 02: CI/CD Pipeline and Rollback Summary

SSH-based automated deployment via GitHub Actions with image-tag rollback on failure, replacing stale gastat-dossier workflow.

## Completed Tasks

| Task | Name                                                      | Commit   | Files                        |
| ---- | --------------------------------------------------------- | -------- | ---------------------------- |
| 1    | Rewrite deploy.yml with SSH-based deployment and rollback | f5b8efcc | .github/workflows/deploy.yml |
| 2    | Create standalone rollback script for manual use          | eccd1ea5 | deploy/rollback.sh           |

## What Was Done

### Task 1: deploy.yml Rewrite

Complete rewrite of the stale deploy.yml that referenced non-existent `gastat-dossier` registry and `dossier.gastat.gov.sa` health URL. New workflow:

- Triggers via `workflow_run` after CI succeeds (not on push)
- Uses `appleboy/ssh-action@v1` to SSH into droplet
- Tags current images as `:rollback` before deploying
- Runs `git pull`, `docker compose build --parallel`, `docker compose up -d`
- Health checks both `/health` and `/api/health`
- Automatic rollback step on failure using `--no-deps`
- Concurrency group prevents parallel deployments
- Supports manual trigger via `workflow_dispatch`

### Task 2: rollback.sh

Standalone rollback script for manual use on the droplet:

- Validates rollback images exist before attempting restore
- Restores `:rollback` tagged images as `:latest`
- Uses `--no-deps frontend backend` to avoid touching nginx/redis
- Health checks both endpoints after rollback
- Shows running container status for verification

## Decisions Made

1. **SSH-based deploy over GHCR pull**: Matches proven manual workflow per D-05/D-06. GHCR pull remains an upgrade path.
2. **workflow_run trigger**: Ensures lint/typecheck/build pass before deploy. Replaces direct push trigger.
3. **Image tag rollback**: Tags current images as `:rollback` before deploy. Simpler than maintaining a registry of versioned images.
4. **--no-deps on rollback**: Avoids Docker Compose re-evaluating health checks on dependencies during rollback (Pitfall 6).

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- No stale references to gastat-dossier or dossier.gastat.gov.sa
- No v1 `docker-compose` CLI syntax (filename `docker-compose.prod.yml` is not v1 syntax)
- workflow_run trigger references "CI" workflow
- appleboy/ssh-action@v1 used for SSH
- docker compose v2 syntax throughout
- Rollback uses --no-deps frontend backend
- Concurrency group configured
- Secrets reference DROPLET_HOST and DROPLET_SSH_KEY
- rollback.sh is executable with health checks and image validation
