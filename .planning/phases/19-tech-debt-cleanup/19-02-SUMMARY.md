---
phase: 19-tech-debt-cleanup
plan: 02
subsystem: gsd-tooling
tags: [gsd, roadmap, automation, idempotent]
requirements: [DEBT-02]
key-files:
  created:
    - $HOME/.claude/get-shit-done/bin/lib/__tests__/roadmap-sync-progress.test.cjs
    - .planning/phases/19-tech-debt-cleanup/19-02-roadmap-sync-progress/19-02-WAVE0-NOTES.md
    - .planning/phases/19-tech-debt-cleanup/19-02-roadmap-sync-progress/19-02-SELFTEST.md
  modified:
    - $HOME/.claude/get-shit-done/bin/lib/roadmap.cjs
    - $HOME/.claude/get-shit-done/bin/gsd-tools.cjs
    - $HOME/.claude/agents/gsd-executor.md
    - .planning/ROADMAP.md
metrics:
  duration: ~25min
  completed: 2026-04-08
---

# Phase 19 Plan 02: Roadmap sync-progress Subcommand Summary

`gsd-tools roadmap sync-progress` regenerates the marker-bounded `## Progress`
table in `.planning/ROADMAP.md` from disk inventory on every call, replacing
the per-row regex patcher that caused format drift (DEBT-02).

## What changed

- **New subcommand** `roadmap sync-progress` in `bin/gsd-tools.cjs` and
  `bin/lib/roadmap.cjs` (`cmdRoadmapSyncProgress`, `renderProgressTable`,
  `collectPhasesFromDisk`, `bootstrapMarkers`, exported `PROGRESS_START` /
  `PROGRESS_END` constants).
- **Marker bootstrap** in live `.planning/ROADMAP.md` — now wrapped in
  `<!-- gsd:progress:start -->` / `<!-- gsd:progress:end -->`.
- **Byte-preservation guarantee** — content outside the markers is left
  untouched on every call; pre-`## Progress` slice is byte-identical (verified).
- **Idempotency** — second run is byte-equal to first (verified via diff).
- **Single-marker corruption check** — throws "manual repair required" rather
  than silently auto-inserting a missing marker (T-19-04 mitigation).
- **Atomic write** via `.tmp` + `renameSync` to prevent half-written ROADMAP on
  crash (T-19-03 mitigation).
- **gsd-executor wired** — `agents/gsd-executor.md` calls `sync-progress` after
  each atomic plan commit (3 call sites updated: lines 468, 483, 529).
- **Backward-compat wrapper** — `cmdRoadmapUpdatePlanProgress` now delegates to
  `cmdRoadmapSyncProgress` first, with the legacy regex patcher kept as a
  fallback. Workflow files (`workflows/execute-phase.md`,
  `workflows/execute-plan.md`) still call the old command name and continue to
  work without modification (out of plan scope per `files_modified`).
- **Test suite** — 7 tests covering bootstrap / replace / idempotency /
  byte-preservation / single-marker error / manifest-derived rows / no checkbox
  parsing. All green. Plain Node test runner (no Vitest dependency in this GSD
  install).

## Disk-driven correction discovered during bootstrap

Phase 16 was hand-recorded as `3/3` in the ROADMAP table; disk inventory
showed `4/4`. The first sync-progress run auto-corrected the drift — this is
exactly the bug DEBT-02 was opened to prevent.

## Wave 0 decisions (see 19-02-WAVE0-NOTES.md)

- **OQ1**: No `.json` manifests exist in this install. Renderer uses the
  EXISTING ROADMAP progress table as the seed for phase labels and milestones,
  overlaid with disk-derived counts/status. New on-disk phases without an
  existing row get a `slugToLabel` fallback (`19-tech-debt-cleanup` → "19. Tech
  Debt Cleanup") and milestone `TBD`. Pre-GSD historical phases (1–13) are
  preserved verbatim.
- **OQ2**: 6 call sites identified. Plan scope authorized only the 3 in
  `gsd-executor.md`. Workflow files are protected by the backward-compat
  wrapper.
- **OQ3**: `withPlanningLock` is **non-reentrant** (`wx` flag → 10s timeout
  loop). Wrapper does NOT acquire the lock before delegating; only
  `cmdRoadmapSyncProgress` itself takes the lock.

## Deviations from Plan

### [Rule 3 - Blocking] Vitest unavailable in GSD install

- **Found during:** Task 1 setup
- **Issue:** No `package.json` or `node_modules` in `$HOME/.claude/get-shit-done/`
- **Fix:** Wrote tests as a self-executing plain Node test runner using
  `node:assert/strict`. Same `.test.cjs` file path; same 7 behaviors covered;
  invocation is `node bin/lib/__tests__/roadmap-sync-progress.test.cjs`
  instead of `npx vitest run`.
- **Impact:** Plan's verify command in Task 1/2 (`npx vitest run`) is
  effectively replaced by the bare `node` invocation. Same exit-code contract.

### [Rule 2 - Critical functionality] Backward-compat wrapper fallback

- **Found during:** Task 3
- **Issue:** Workflow files (`execute-phase.md`, `execute-plan.md`) still call
  `roadmap update-plan-progress <phase>` and are out of plan scope per
  `files_modified`.
- **Fix:** Wrapper attempts `cmdRoadmapSyncProgress` first; if that throws, it
  warns and falls back to the legacy regex patcher. Stale callers continue to
  work, and the new path is exercised on every call.

## Known Stubs

None.

## Verification

- 7/7 fixture tests green
- Live ROADMAP.md bootstrap successful, 2 markers present
- Idempotency verified (`diff -q` silent across two consecutive runs)
- Pre-`## Progress` byte-preservation verified (`diff` of lines 1–166 silent)
- Manifest ↔ table parity self-test for phases 14, 16, 18 (see SELFTEST.md)
- No `- [x]` checkbox parsing in new code (test 7 enforces)

## Self-Check: PASSED

- FOUND: `.planning/phases/19-tech-debt-cleanup/19-02-roadmap-sync-progress/19-02-WAVE0-NOTES.md`
- FOUND: `.planning/phases/19-tech-debt-cleanup/19-02-roadmap-sync-progress/19-02-SELFTEST.md`
- FOUND: `$HOME/.claude/get-shit-done/bin/lib/__tests__/roadmap-sync-progress.test.cjs`
- FOUND: `$HOME/.claude/get-shit-done/bin/lib/roadmap.cjs` (modified)
- FOUND: `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` (modified)
- FOUND: `$HOME/.claude/agents/gsd-executor.md` (modified)
- FOUND: `.planning/ROADMAP.md` (markers bootstrapped)
