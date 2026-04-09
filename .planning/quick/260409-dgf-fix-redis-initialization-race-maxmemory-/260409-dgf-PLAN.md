# Quick Task 260409-dgf: Fix Redis Initialization Race + maxmemory-policy

**Task:** Fix Redis initialization race condition + persist noeviction policy + redeploy
**Date:** 2026-04-09

## Root Cause

`backend/src/config/redis.ts` creates the ioredis singleton with `lazyConnect: true`.
During app boot, module-level side effects from imported services trigger auto-connect
before `initializeRedis()` explicitly calls `redis.connect()`. ioredis then rejects
with "Redis is already connecting/connected", the wrapper catches it, and the backend
proceeds in **cache-bypass mode forever** — no retry.

BullMQ uses a separate client (`queues/queue-connection.ts`) that connects eagerly
and works fine, masking the problem.

Secondary: the staging Redis container runs without a config file, so `CONFIG SET
maxmemory-policy noeviction` does not survive container restarts.

## Tasks

### Task 1: Fix `initializeRedis()` to handle all connection states

**File:** `backend/src/config/redis.ts`
**Action:** Replace the `initializeRedis()` function to check `redis.status` before
calling `.connect()`. If the client is already `connecting` or `ready`, cooperate
instead of throwing.

**Verify:** `tsc --noEmit` passes; grep for the new status check in the compiled output.

### Task 2: Persist Redis `maxmemory-policy noeviction` in docker-compose

**File:** `deploy/docker-compose.prod.yml`
**Action:** Add `command: redis-server --maxmemory-policy noeviction` to the Redis
service definition. This ensures the policy survives container restarts without
needing a mounted `redis.conf`.

**Verify:** `docker compose -f deploy/docker-compose.prod.yml config` parses
without error and shows the command override.

### Task 3: Rebuild + redeploy backend to staging droplet

**Action:** SSH to droplet, pull latest, rebuild backend image, restart containers.
Tail logs and confirm:

- "Redis connected and healthy" appears (NOT "Redis initialization failed")
- BullMQ eviction-policy warnings are gone (was "allkeys-lru", now "noeviction")

**Verify:** `docker logs --tail 50 intl-dossier-backend 2>&1 | grep -i redis`
shows healthy connection.
