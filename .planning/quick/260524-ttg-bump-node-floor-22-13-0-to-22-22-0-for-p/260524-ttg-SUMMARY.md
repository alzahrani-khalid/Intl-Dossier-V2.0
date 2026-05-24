---
quick_id: 260524-ttg
description: Bump Node floor 22.13.0 → 22.22.0 to satisfy posthog-node@5.35.1 engine
date: 2026-05-24
status: complete
---

# Quick Task 260524-ttg — Summary

## What changed

| File                       | Change                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` | `NODE_VERSION: '22.13.0'` → `'22.22.0'` (+ comment noting posthog-node floor) |
| `package.json`             | `engines.node` `>=22.13.0` → `>=22.22.0`                                      |
| `CLAUDE.md`                | `Node.js 22.13.0+` → `Node.js 22.22.0+` (lines 84, 483)                       |

## Root cause

The `chore/dependency-security-upgrades` upgrade added transitive
`posthog-node@5.35.1` (+ `@posthog/core@1.29.9`, `@posthog/types@1.376.0`), which
declares `engines.node: ^20.20.0 || >=22.22.0`. CI pinned Node `22.13.0`, so
`pnpm install --frozen-lockfile` (engine-strict) aborted at the install step,
failing all 11 checks in ~15s before any job logic ran.

## Verification

- `pnpm install --frozen-lockfile` → exits 0 (local Node v24.9.0).
- No other Node pins needed changing: `e2e.yml` uses `node-version: 22` and all four
  Dockerfiles use `node:22-alpine` — both resolve to latest 22.x (≥ 22.22.0).
- Post-push CI confirmation on PR #26 pending.

## Notes

- The GitHub Actions runner also emitted a Node-20-actions deprecation warning
  (actions/checkout@v4, setup-node@v4, pnpm/action-setup@v4 forced to Node 24 on
  2026-06-02). Out of scope here — noted for a future workflow-actions bump.
