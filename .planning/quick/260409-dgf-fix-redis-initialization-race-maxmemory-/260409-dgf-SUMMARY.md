# Quick Task 260409-dgf: Summary

**Task:** Fix Redis initialization race + maxmemory-policy persistence + redeploy backend
**Date:** 2026-04-09
**Commit:** 75759a9d

## Changes

### 1. `backend/src/config/redis.ts` — initializeRedis() race fix

**Root cause:** The singleton ioredis client is created with `lazyConnect: true`, but
module-level side effects from service imports trigger auto-connect before
`initializeRedis()` runs. The old code unconditionally called `redis.connect()`,
which throws "Redis is already connecting" when the client is mid-connect.

**Fix:** Check `redis.status` before acting:

- `ready` → skip connect, just ping (another path already connected)
- `connecting` / `reconnecting` → wait for the existing connect via event listeners
  with a 10s safety timeout
- `wait` → normal explicit connect (the intended lazyConnect path)

This makes `initializeRedis()` cooperative rather than competitive with the module
import graph.

### 2. `deploy/docker-compose.prod.yml` — Redis maxmemory-policy

**Root cause:** Hardcoded `--maxmemory-policy allkeys-lru` in the Redis service
command. BullMQ requires `noeviction`; with LRU, Redis can silently evict job keys
causing notification queue data loss.

**Fix:** Changed `allkeys-lru` → `noeviction` on line 117.

## Deployment

Code committed. **Not yet deployed** — user will deploy when SSH access is available:

```bash
ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build backend && docker compose -f docker-compose.prod.yml up -d redis backend"
```

After deploy, verify:

```bash
ssh root@138.197.195.242 "docker logs --tail 50 intl-dossier-backend 2>&1 | grep -i redis"
```

Expected: `Redis connected and healthy` (NOT `Redis initialization failed`).

## Discovery Context

Found during Phase 20-05 NOTIF-08 verification: backend logs showed zero
notification/queue/worker/bullmq messages — the entire notification subsystem
was dark because Redis init failed at boot and the backend ran in cache-bypass
mode with no retry.
