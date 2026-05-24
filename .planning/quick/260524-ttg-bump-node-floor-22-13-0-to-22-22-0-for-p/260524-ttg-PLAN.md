---
quick_id: 260524-ttg
description: Bump Node floor 22.13.0 → 22.22.0 to satisfy posthog-node@5.35.1 engine
date: 2026-05-24
status: complete
---

# Quick Task 260524-ttg: Bump Node floor to 22.22.0

## Problem

PR #26 (`chore/dependency-security-upgrades`) is `BLOCKED` — all 11 CI checks fail
at the `pnpm install --frozen-lockfile` step with:

```
ERR_PNPM_UNSUPPORTED_ENGINE
Your Node version is incompatible with "posthog-node@5.35.1".
Expected version: ^20.20.0 || >=22.22.0
Got: v22.13.0
```

The dependency upgrade pulled in transitive `posthog-node@5.35.1` (via `@posthog/core`

- `@posthog/types`), which raised its `engines.node` floor to `>=22.22.0`. CI pins
  Node `22.13.0`, so engine-strict install aborts before any job runs.

## Fix

Raise the Node floor to `22.22.0` everywhere it is pinned to an exact/incompatible value.

## Tasks

1. `.github/workflows/ci.yml` — `NODE_VERSION: '22.13.0'` → `'22.22.0'` (single env var feeds all 13 jobs). verify: grep shows `22.22.0`.
2. `package.json` — `engines.node` `>=22.13.0` → `>=22.22.0`. verify: `pnpm install --frozen-lockfile` exits 0.
3. `CLAUDE.md` — `Node.js 22.13.0+` → `Node.js 22.22.0+` (lines 84, 483). verify: grep returns 0 `22.13.0` refs.

## Already-compatible (no change)

- `.github/workflows/e2e.yml` — `node-version: 22` (latest 22.x ≥ 22.22.0).
- `frontend/Dockerfile*`, `backend/Dockerfile*` — `node:22-alpine` (latest 22.x).

## Done when

- `grep -rn "22.13.0" ci.yml package.json CLAUDE.md` returns zero matches.
- `pnpm install --frozen-lockfile` exits 0.
- PR #26 CI install step succeeds (verified post-push).
