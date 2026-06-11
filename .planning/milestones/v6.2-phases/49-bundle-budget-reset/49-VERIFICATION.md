---
phase: 49-bundle-budget-reset
verified: 2026-05-12T12:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 49: Bundle Budget Reset — Verification Report

**Phase Goal:** The `frontend/.size-limit.json` ceiling reflects a real, defensible budget; the initial route loads under it; and `size-limit` is restored as a PR-blocking CI gate.
**Verified:** 2026-05-12
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Pre-Verification Finding: Stale `dist/` Directory

Before running any checks the `dist/` directory contained artifacts from two separate builds:

- `app-2Kk8QWF2.js` (14:12) — from the smoke-PR sub-vendor trip-wire commit `cf514115`
- `app-CfjtfFcH.js` (14:22) — from the clean Phase 49 build
- Two `signature-visuals-d3-*.js` chunks for the same reason

Running `pnpm size-limit` against this stale dist produced false overflows:
`Initial JS = 824 kB, Total JS = 3.89 MB, signature-visuals/d3 = 339 kB`.

The smoke-PR source files (`_smoke-bloat-initial.ts`, `_smoke-dnd-bloat.ts`) do NOT exist in HEAD — they were closed with `--delete-branch` on the remote PRs but their built artifacts remained in the local `dist/`. A `rm -rf frontend/dist && pnpm -C frontend build` (clean rebuild from HEAD source) produced correct results. All checks below were verified against that clean build.

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                               | Status   | Evidence                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pnpm -C frontend size-limit` exits 0 on clean HEAD build                           | VERIFIED | Exit 0 after `rm -rf dist && pnpm build`. All 9 entries within ceilings.                                                                                                                             |
| 2   | Initial JS ceiling = 450 KB (was 517 KB); Total JS = 2.45 MB (was 2.43 MB)          | VERIFIED | `.size-limit.json` diff: `517 KB -> 450 KB` (LOWERED); `2.43 MB -> 2.45 MB` (RAISED with D-02 paper trail). Verified via `git diff phase-49-base..HEAD -- frontend/.size-limit.json`.                |
| 3   | 3 lazy() conversions land; sub-vendor chunks (heroui/sentry/dnd) emit as singletons | VERIFIED | `React.lazy` in `positions/$id.tsx` + `WorldMapVisualization.tsx`; `await import('exceljs')` x2 in `useExportData.ts`. Each of heroui/sentry/dnd-vendor globs returns exactly 1 file in clean build. |
| 4   | `Bundle Size Check (size-limit)` is a PR-blocking required context on `main`        | VERIFIED | `gh api .../branches/main/protection/required_status_checks --jq '.contexts                                                                                                                          | sort'`returns`["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]`. `enforce_admins.enabled = true`. Smoke PRs #9 + #10 both `state=CLOSED, mergedAt=null, mergeStateStatus=BLOCKED`. |

**Score: 4/4 truths verified**

---

## Required Artifacts

| Artifact                                                                     | Expected                                                                             | Status   | Details                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/.size-limit.json`                                                  | 9 entries with re-baselined ceilings per D-01..D-03 + D-07                           | VERIFIED | 9 entries confirmed. Ceilings: Initial 450 KB, React 349 KB, TanStack 63 KB, HeroUI 9 KB, Sentry 9 KB, DnD 22 KB, Total 2.45 MB, d3-geo 55 KB, static-prim 12 KB.                                                                                                                                                                       |
| `frontend/scripts/assert-size-limit-matches.mjs`                             | 8 named singletons in `expectedMatchCounts`; exits 0 on clean build                  | VERIFIED | `node frontend/scripts/assert-size-limit-matches.mjs` exits 0 on clean build. 8 entries in Map. Each named singleton = 1 file; Total JS = 287 files.                                                                                                                                                                                    |
| `frontend/vite.config.ts`                                                    | `manualChunks` with heroui/sentry/dnd-vendor branches BEFORE `react` substring match | VERIFIED | Lines 143-154: `@heroui` → `heroui-vendor`, `@sentry` → `sentry-vendor`, `@dnd-kit` → `dnd-vendor` all placed before `id.includes('react')` rule. `@radix-ui` and `@tanstack` also moved before react match per audit critical finding.                                                                                                 |
| `frontend/docs/bundle-budget.md`                                             | Chunks >100 KB gz with rationale; D-08 residual vendor table                         | VERIFIED | File exists (38 lines). Table covers all 7 entries over 100 KB gz: Initial JS, React vendor, TanStack vendor, HeroUI, Sentry, DnD, Total JS. D-08 residual vendor table lists 7 deps ≥10 KB gz (exceljs ~256 KB, dotted-map ~112 KB, tiptap/prosemirror ~140 KB, proj4 ~76 KB, date-fns ~58 KB, css-utils ~37 KB, @floating-ui ~16 KB). |
| `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`                 | Top-20 chunks, lazy() candidates, D-02 escalation block                              | VERIFIED | File exists with all 6 required sections: top-20 ranked table, suspected app chunk culprits, residual vendor composition, lazy() candidates (5 ranked), sub-vendor decomp list, escalation block.                                                                                                                                       |
| `frontend/src/routes/_protected/positions/$id.tsx`                           | `React.lazy()` + `Suspense` + `GlobeSpinner` around PositionEditor                   | VERIFIED | Confirmed: `import { Suspense, lazy }`, `GlobeSpinner` import, `<Suspense>` wrapper with GlobeSpinner fallback at line 183-203.                                                                                                                                                                                                         |
| `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` | `React.lazy()` + `Suspense` + `GlobeSpinner` around WorldMap                         | VERIFIED | Confirmed: `import { useMemo, useState, useCallback, Suspense, lazy }`, GlobeSpinner at line 14, `<Suspense>` at line 177-199.                                                                                                                                                                                                          |
| `frontend/src/domains/documents/hooks/useExportData.ts`                      | `await import('exceljs')` inside xlsx callback bodies (x2)                           | VERIFIED | Lines 396 and 522: `const ExcelJS = await import('exceljs')`. Top-level static `import * as ExcelJS from 'exceljs'` is absent.                                                                                                                                                                                                          |
| `.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md`                   | D-14 reconciliation table; ceiling-raise paper trails; smoke PR table                | VERIFIED | File exists. D-14 table shows 3 rows all PASS. Ceiling-raise table lists 7 entries (2 LOWERED, 3 NEW, 2 RAISED-with-paper-trail, 0 silent). Smoke PR table has PR #9 + #10 with URLs, trip-wires, failing chunks, mergeStateStatus.                                                                                                     |
| `.planning/STATE.md`                                                         | Phase 49 status=shipped; v6.2 SHIPPED                                                | VERIFIED | `status: shipped`, `percent: 100`, v6.2 milestone row shows SHIPPED 2026-05-12.                                                                                                                                                                                                                                                         |
| `.planning/ROADMAP.md`                                                       | Phase 49 `[x]` with 3/3 plans complete; v6.2 `✅ shipped`                            | VERIFIED | Phase 49 entry marked `[x]` with all 3 plans `[x]`; v6.2 row shows `✅ shipped 2026-05-12`.                                                                                                                                                                                                                                             |

---

## Key Link Verification

| From                                    | To                         | Via                                                                                         | Status | Details                                                                                                                                       |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/vite.config.ts` manualChunks  | `heroui-vendor-*.js` chunk | `if (id.includes('@heroui'))` before react match                                            | WIRED  | Clean build emits exactly 1 heroui-vendor chunk. assert-size-limit-matches passes.                                                            |
| `frontend/vite.config.ts` manualChunks  | `sentry-vendor-*.js` chunk | `if (id.includes('@sentry'))` before react match                                            | WIRED  | 1 sentry-vendor chunk in clean build.                                                                                                         |
| `frontend/vite.config.ts` manualChunks  | `dnd-vendor-*.js` chunk    | `if (id.includes('@dnd-kit'))` before react match                                           | WIRED  | 1 dnd-vendor chunk in clean build.                                                                                                            |
| `positions/$id.tsx`                     | PositionEditor lazy chunk  | `React.lazy(() => import('../../../components/position-editor/PositionEditor'))` + Suspense | WIRED  | Lazy import + Suspense confirmed. GlobeSpinner fallback present.                                                                              |
| `WorldMapVisualization.tsx`             | WorldMap lazy chunk        | `React.lazy(() => import('./world-map'))` + Suspense                                        | WIRED  | Lazy import + Suspense confirmed. GlobeSpinner fallback present.                                                                              |
| `useExportData.ts`                      | exceljs dynamic chunk      | `await import('exceljs')` inside xlsx format branches (x2)                                  | WIRED  | Dynamic import at lines 396 + 522. No top-level static import of exceljs.                                                                     |
| `Bundle Size Check (size-limit)` CI job | `main` branch protection   | `gh api PUT required_status_checks.contexts`                                                | WIRED  | API returns `["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]`. PRs #9+#10 showed this check failing and BLOCKED merge. |
| `enforce_admins`                        | `main` branch protection   | PUT body preserving field                                                                   | WIRED  | `gh api .../protection --jq '.enforce_admins'` returns `{"enabled":true, ...}`.                                                               |

---

## Data-Flow Trace (Level 4)

Not applicable to this phase. Phase 49 delivers configuration, tooling, and code-splitting changes — no components rendering dynamic API-sourced data were added or modified as the primary deliverable. The lazy() conversions defer existing components (PositionEditor, WorldMap) that were already verified by prior phases to render real data.

---

## Behavioral Spot-Checks

| Behavior                                                    | Command                                                                                                                                     | Result                                                                               | Status |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| `pnpm size-limit` exits 0 (clean build)                     | `rm -rf frontend/dist && pnpm -C frontend build && pnpm -C frontend size-limit`                                                             | exit 0; all 9 entries within ceilings                                                | PASS   |
| `assert-size-limit-matches` exits 0 (clean build)           | `node frontend/scripts/assert-size-limit-matches.mjs`                                                                                       | exit 0; 8 named singletons = 1 file each; Total JS = 287                             | PASS   |
| D-14 net-new suppressions = 0                               | `git diff phase-49-base..HEAD -- frontend/src backend/src \| grep -E '^\+.*(@ts-(ignore\|expect-error\|nocheck)\|eslint-disable)' \| wc -l` | `0`                                                                                  | PASS   |
| Phase-49-base tag resolves to expected commit               | `git rev-parse phase-49-base^{commit}`                                                                                                      | `7fc9e7564ce01afee067277045573f192163f6d2` (matches origin/main HEAD at phase start) | PASS   |
| Branch protection includes `Bundle Size Check (size-limit)` | `gh api .../branches/main/protection/required_status_checks --jq '.contexts \| sort'`                                                       | `["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]`             | PASS   |
| `enforce_admins=true` preserved                             | `gh api .../branches/main/protection --jq '.enforce_admins'`                                                                                | `{"enabled":true,...}`                                                               | PASS   |
| Smoke PR #9 CLOSED, not MERGED                              | `gh pr view 9 --json state,mergedAt,mergeStateStatus`                                                                                       | `{"mergeStateStatus":"BLOCKED","mergedAt":null,"state":"CLOSED"}`                    | PASS   |
| Smoke PR #10 CLOSED, not MERGED                             | `gh pr view 10 --json state,mergedAt,mergeStateStatus`                                                                                      | `{"mergeStateStatus":"BLOCKED","mergedAt":null,"state":"CLOSED"}`                    | PASS   |

---

## Probe Execution

No `scripts/*/tests/probe-*.sh` probes declared or applicable for this phase. The `pnpm size-limit` run serves as the functional probe and is verified above.

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                               | Status    | Evidence                                                                                                                                                               |
| ----------- | ----------- | ------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUNDLE-01   | 49-01       | Real budget — initial JS ≤ 450 KB gz; Total JS ceiling honest             | SATISFIED | Initial JS = 412.06 KB / 450 KB ceiling. Total JS = 2.42 MB / 2.45 MB ceiling (D-02 escalation documented).                                                            |
| BUNDLE-02   | 49-02       | Initial route under budget; heavy chunks lazy-split per audit             | SATISFIED | 3 lazy() conversions (PositionEditor, WorldMap, exceljs). All ≥30 KB gz off-initial-path per D-06. Initial JS ceiling = 412 KB at HEAD.                                |
| BUNDLE-03   | 49-03       | PR-blocking CI gate — `Bundle Size Check (size-limit)` required on `main` | SATISFIED | Context in branch protection confirmed. Smoke PRs #9+#10 show BLOCKED state. `enforce_admins=true`.                                                                    |
| BUNDLE-04   | 49-01/02    | Vendor super-chunk audited; every chunk >100 KB has documented rationale  | SATISFIED | `49-BUNDLE-AUDIT.md` provides top-20 audit + escalation. `frontend/docs/bundle-budget.md` has rationale for all 7 chunks >100 KB + D-08 residual vendor per-dep table. |

---

## Phase-Wide D-14 Reconciliation

| Metric                                                                      | Target | Observed | Status |
| --------------------------------------------------------------------------- | ------ | -------- | ------ |
| Net-new `eslint-disable*` (frontend/src + backend/src, phase-49-base..HEAD) | 0      | 0        | PASS   |
| Net-new `@ts-(ignore\|expect-error\|nocheck)`                               | 0      | 0        | PASS   |
| `.size-limit.json` ceilings RAISED without paper trail                      | 0      | 0        | PASS   |

**Documented ceiling raises (2 authorized, 0 silent):**

| Entry                               | Pre (phase-49-base) | Post (HEAD) | Direction | Authorisation                                                                                                                                                 |
| ----------------------------------- | ------------------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial JS                          | 517 KB              | 450 KB      | LOWERED   | Plan 01 D-01                                                                                                                                                  |
| TanStack vendor                     | 51 KB               | 63 KB       | RAISED    | Plan 02 D-03 — ordering fix returned `@tanstack/react-*` to proper chunk; honest re-baseline; paper trail in `49-02-SUMMARY.md` Deviation §2                  |
| HeroUI vendor                       | (new)               | 9 KB        | NEW       | Plan 02 D-07 (measured 3.55 KB + 5 KB rounded)                                                                                                                |
| Sentry vendor                       | (new)               | 9 KB        | NEW       | Plan 02 D-07 (measured 3.93 KB + 5 KB rounded)                                                                                                                |
| DnD vendor                          | (new)               | 22 KB       | NEW       | Plan 02 D-07 (measured 16.55 KB + 5 KB rounded)                                                                                                               |
| Total JS                            | 2.43 MB             | 2.45 MB     | RAISED    | Plan 01 D-02 escalation — 1.8 MB unattainable without out-of-scope dep removal; paper trail in `49-BUNDLE-AUDIT.md §Escalation (D-02)` and `49-01-SUMMARY.md` |
| signature-visuals/static-primitives | 64 KB               | 12 KB       | LOWERED   | Plan 01 D-03 (measured 9 KB + 3 KB)                                                                                                                           |

---

## Live-State vs SUMMARY Drift Check

| SUMMARY claim                                              | Disk / API state                                                                   | Drift? |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| `frontend/.size-limit.json` has 9 entries                  | Confirmed 9 entries                                                                | NONE   |
| `assert-size-limit-matches.mjs` has 8 named singletons     | Confirmed 8 in `expectedMatchCounts` Map                                           | NONE   |
| `frontend/docs/bundle-budget.md` exists                    | Confirmed (38 lines)                                                               | NONE   |
| `49-BUNDLE-AUDIT.md` exists with top-20 + escalation block | Confirmed all sections present                                                     | NONE   |
| `49-EXCEPTIONS.md` exists with D-14 table + smoke PR table | Confirmed                                                                          | NONE   |
| heroui/sentry/dnd-vendor emit as singletons in build       | Confirmed (1 file each in clean build)                                             | NONE   |
| 3 lazy() conversions landed                                | Confirmed (PositionEditor, WorldMap, useExportData/exceljs)                        | NONE   |
| Smoke PRs #9+#10 CLOSED not MERGED                         | Confirmed via `gh pr view`                                                         | NONE   |
| Branch protection: 4 required contexts                     | Confirmed `["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]` | NONE   |
| `enforce_admins=true` preserved                            | Confirmed `{"enabled":true}`                                                       | NONE   |
| STATE.md `status: shipped`, `percent: 100`                 | Confirmed                                                                          | NONE   |
| ROADMAP.md Phase 49 `[x]`, v6.2 `✅ shipped`               | Confirmed                                                                          | NONE   |

**Notable operational finding (not a drift):** The local `dist/` directory at verification time contained stale artifacts from smoke-PR builds. This is an expected artifact of the smoke-PR workflow (branches were deleted from origin but local builds were not cleaned). The stale dist caused `pnpm size-limit` to return false overflows before a clean rebuild. After `rm -rf frontend/dist && pnpm -C frontend build`, all checks pass. This is a local development hygiene issue, not a code defect.

---

## Tag Integrity Note

The annotated tag `phase-49-base` resolves differently depending on the `git rev-parse` form used:

- `git rev-parse phase-49-base` → `8ecd12a7e6fb8299b8dfd448d0efc895bdea36fe` (tag object SHA)
- `git rev-parse phase-49-base^{commit}` → `7fc9e7564ce01afee067277045573f192163f6d2` (commit SHA)

Plan 01 SUMMARY correctly used the commit SHA (`7fc9e756`). Plans 02 + 03 SUMMARIES and EXCEPTIONS.md used the tag object SHA (`8ecd12a7`). Both forms dereference to the same underlying commit (`7fc9e756` = the origin/main HEAD at phase start). No integrity issue — this is a documentation inconsistency in SHA notation, not a tag-pointing-to-wrong-commit defect.

---

## Anti-Patterns Found

| File                        | Line     | Pattern                            | Severity | Impact                                                                                                                          |
| --------------------------- | -------- | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `WorldMapVisualization.tsx` | 193      | `lineColor="#3B82F6"` (raw hex)    | Warning  | Pre-existing, NOT introduced by Phase 49. Documented in `49-02-SUMMARY.md` Deviation §5. Out of Phase 49 scope per Karpathy §3. |
| `PositionEditor.tsx`        | 211, 237 | `class: 'text-blue-600 underline'` | Warning  | Pre-existing TipTap link style. NOT introduced by Phase 49. Same deviation §5.                                                  |
| `PositionEditor.tsx`        | 412, 531 | `text-red-800` / `text-red-600`    | Warning  | Pre-existing validation alert styling. NOT introduced by Phase 49.                                                              |

All three are pre-existing violations in files touched by Phase 49's lazy() conversions. Zero new anti-patterns introduced by Phase 49 diffs. The D-14 grep scan confirms 0 net-new suppressions.

---

## Human Verification Required

None. All acceptance criteria are verifiable programmatically. Visual verification of Suspense fallback styling (GlobeSpinner with 1px border, density tokens, no shadow) is out of phase scope per the VALIDATION.md manual-only table — it requires a running dev server with the `/positions/:id` and `/geographic-visualization` routes rendered. The verifier notes this is deferred; it does not block the PASS verdict because the code patterns (GlobeSpinner import, token-styled wrapper with `border: 1px solid var(--line)`, `var(--row-h)`) are confirmed in both files.

---

## Gaps Summary

No gaps. All 4 requirements (BUNDLE-01..04) are satisfied. D-14 audit clean. The only divergences from plan templates (PR trip-wire substitutions, smoke PRs branched from DesignV2, TanStack ceiling raise, Total JS escalation) are all documented with paper trails as authorized deviations.

---

## Deferred Items

None identified for later milestone phases.

---

## Recommendation

Phase 49 and the v6.2 milestone are complete. v7.0 (Intelligence Engine) is unblocked.

Before the `DesignV2` branch is merged to `main`, the following follow-up items are worth scheduling — none are blockers:

1. **React vendor ceiling tightening** — currently 349 KB with a 279.91 KB measured size. Plan 02 intentionally left this loose to keep the diff surgical. A one-line change to `285 KB` per D-03 `min` rule could be a separate micro-task.
2. **Pre-existing design-rule violations** — `WorldMapVisualization.tsx:193` (raw hex), `PositionEditor.tsx` (Tailwind color literals). Retire as part of a future design-compliance sweep, not Phase 49 scope.
3. **Local `dist/` cleanup convention** — the stale dist from smoke-PR staging caused a confusing false-overflow on initial verification. A `pnpm -C frontend build:clean` script or a `presize-limit` hook that runs `rm -rf dist` before measuring would prevent this for future phases.

---

_Verified: 2026-05-12_
_Verifier: Claude (gsd-verifier)_
