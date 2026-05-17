# Phase 49 — EXCEPTIONS Ledger

This file is the phase-wide ledger for suppression scans, ceiling-raise paper trails, and D-14 reconciliation across Phase 49 (`bundle-budget-reset`).

- **D-14 (suppressions):** Zero net-new `eslint-disable*` directives introduced by Phase 49 in `frontend/src` + `backend/src`.
- **D-14 (TS suppressions, Phase 47 carry-forward):** Zero net-new `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` directives.
- **D-14 (ceilings):** Zero unauthorized `.size-limit.json` ceiling raises vs `phase-49-base`. Two raises occurred — both have signed paper trails (Plan 01 D-02 + Plan 02 D-03) and are reconciled below.
- **Phase-base anchor:** `phase-49-base` → `8ecd12a7e6fb8299b8dfd448d0efc895bdea36fe`.

---

## Phase-wide D-14 reconciliation

| Metric                                                                        | Target | Observed | Status |
| ----------------------------------------------------------------------------- | ------ | -------- | ------ |
| Net-new `eslint-disable*` (frontend/src + backend/src, `phase-49-base..HEAD`) | 0      | 0        | PASS   |
| Net-new `@ts-(ignore\|expect-error\|nocheck)` (carry-forward Phase 47 D-01)   | 0      | 0        | PASS   |
| `.size-limit.json` ceilings RAISED without paper trail vs `phase-49-base`     | 0      | 0        | PASS   |

Audit commands (verbatim, reproducible):

```bash
# 1. Net-new eslint-disable directives
git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\+.*eslint-disable' \
  | grep -vE '^\+\+\+' \
  > /tmp/49-03-eslint-disable-additions.txt
wc -l < /tmp/49-03-eslint-disable-additions.txt
# 0

# 2. Net-new @ts-* suppressions
git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' \
  | grep -vE '^\+\+\+' \
  > /tmp/49-03-ts-suppression-additions.txt
wc -l < /tmp/49-03-ts-suppression-additions.txt
# 0

# 3. Unauthorized ceiling raises (excluding the 2 documented exceptions)
git diff phase-49-base..HEAD -- frontend/.size-limit.json > /tmp/49-03-sizelimit-diff.txt
# Manual inspection — see "Ceiling-raise paper trail" section below.
# Unauthorized count: 0 (both observed raises have full paper trails).
```

## Ceiling-raise paper trail (D-14 ceilings reconciliation)

The `.size-limit.json` diff between `phase-49-base..HEAD` shows 7 entries with changes. Of these, **2 are RAISES** — both authorized and documented in upstream plan summaries:

| Entry                               | Pre (phase-49-base) | Post (HEAD) | Direction | Authorisation                                                                                                                                                 |
| ----------------------------------- | ------------------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial JS (entry point)            | 517 KB              | 450 KB      | LOWERED   | Plan 01 D-01 (re-baseline) — `49-01-SUMMARY.md` "Ceiling diff" table.                                                                                         |
| TanStack vendor                     | 51 KB               | 63 KB       | RAISED    | **Plan 02 D-03 ordering-fix exception** — paper trail in `49-02-SUMMARY.md` Deviation §2: "TanStack vendor ceiling raised 51 → 63 KB ... HONEST re-baseline." |
| HeroUI vendor                       | (NEW)               | 9 KB        | NEW       | Plan 02 D-07 sub-vendor split — measured 3.55 KB + 5 KB rounded up. Paper trail in `49-02-SUMMARY.md` "Sub-vendor measurements + locked ceilings" table.      |
| Sentry vendor                       | (NEW)               | 9 KB        | NEW       | Plan 02 D-07 sub-vendor split — measured 3.93 KB + 5 KB rounded up. Same table as above.                                                                      |
| DnD vendor                          | (NEW)               | 22 KB       | NEW       | Plan 02 D-07 sub-vendor split — measured 16.55 KB + 5 KB rounded up. Same table as above.                                                                     |
| Total JS                            | 2.43 MB             | 2.45 MB     | RAISED    | **Plan 01 D-02 escalation exception** — paper trail in `49-BUNDLE-AUDIT.md` `## Escalation (D-02)` block + `49-01-SUMMARY.md` "D-02 attainability verdict".   |
| signature-visuals/static-primitives | 64 KB               | 12 KB       | LOWERED   | Plan 01 D-03 (measured 9 KB + 3 KB; symbolic 64 KB dropped) — `49-01-SUMMARY.md` "Ceiling diff" table.                                                        |

**Net direction:** 2 LOWERED + 3 NEW + 2 RAISED-with-paper-trail + 0 UNCHANGED-with-current-tighter-than-mechanical-bound.

**Unauthorized raises:** 0. Both raises (TanStack 51→63, Total 2.43→2.45) have explicit Deviation entries in their respective Plan SUMMARY files. The raises map directly to D-02 (Total JS escalation, anticipated by CONTEXT) and D-03 (TanStack post-ordering-fix honest re-baseline). No silent raises occurred.

## Retained suppressions

No retained suppression was introduced by Phase 49. Phase 49 modified `.size-limit.json`, `frontend/vite.config.ts`, `frontend/scripts/assert-size-limit-matches.mjs`, `frontend/docs/bundle-budget.md`, and 4 `frontend/src/**/*.tsx` files (Plan 02 lazy() conversions). None of those changes introduced `eslint-disable*` or `@ts-*` suppressions.

The Phase 47/48 baseline of pre-existing inherited suppressions is unchanged by Phase 49 — see `48-EXCEPTIONS.md` "Retained suppressions" table for the inherited inventory.

## Smoke-PR proofs (D-12)

Both smoke PRs branched from `DesignV2` (which carries the locked Phase 49 ceilings) and opened against `main`. After branch protection PUT (Plan 03 Task 2) added `Bundle Size Check (size-limit)` as a required context, both PRs showed `Bundle Size Check (size-limit) bucket=fail` and `mergeStateStatus=BLOCKED`. Both were closed with `gh pr close --delete-branch` BEFORE this ledger was committed (T-49-13).

| PR # | URL                                                           | Trip-wire                                                                                       | Failing chunk                                              | Required-context check buckets                                                        | mergeStateStatus | Disposition                 |
| ---- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- | --------------------------- |
| #9   | https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/9  | 100 KB high-entropy literal in `frontend/src/_smoke-bloat-initial.ts`                           | Initial JS: 490.06 KB / 450 KB ceiling                     | `Bundle Size Check (size-limit)`=fail; Lint=pass; type-check=pass; Security Scan=pass | BLOCKED          | Closed with --delete-branch |
| #10  | https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/10 | `world-atlas/countries-50m.json` import in `frontend/src/components/kanban/_smoke-dnd-bloat.ts` | signature-visuals/d3-geospatial: 285.09 KB / 55 KB ceiling | `Bundle Size Check (size-limit)`=fail; Lint=pass; type-check=pass; Security Scan=pass | BLOCKED          | Closed with --delete-branch |

Evidence captured to `/tmp/49-03-pr-a-checks.json` and `/tmp/49-03-pr-b-checks.json` before closing.

**Note (PR-B trip-wire deviation, Rule 3):** The original plan strategy targeted the `dnd-vendor` sub-chunk via `export * from '@dnd-kit/sortable'` re-export. However, dnd-vendor's headroom is too narrow (4.21 KB at 17.79 KB / 22 KB ceiling) for any combination of `@dnd-kit/*` re-exports to overflow without also importing more dnd-kit code than the package ships. The `signature-visuals/d3-geospatial` sub-chunk has the tightest headroom (0.85 KB at 54.15 KB / 55 KB ceiling), making it the most decisive trip-wire. Switched to `world-atlas/countries-50m.json` (which routes to `signature-visuals-d3` per `vite.config.ts:172-177` D-07 chunker rule). Same gate, same proof posture: per-chunk ceilings BLOCK regressions.

## CI gate state (final)

Captured at Phase 49-03 close-out via `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`:

```json
{
  "required_status_checks": {
    "contexts": ["Bundle Size Check (size-limit)", "Lint", "Security Scan", "type-check"],
    "strict": true
  },
  "enforce_admins": { "enabled": true }
}
```

- `Bundle Size Check (size-limit)` was added to the required-context set by 49-03 Task 2 (PUT diff vs. `/tmp/49-03-protection-before.json` shows ONLY the new context added; no other field touched).
- `Lint`, `type-check`, `Security Scan` were added by Phase 47 + Phase 48 — preserved across this PUT (carry-forward).
- `enforce_admins=true` was preserved across the PUT (D-10 requirement).
- Smoke PRs #9 + #10 verified the byte-exact casing match: both produced `mergeStateStatus=BLOCKED` with `Bundle Size Check (size-limit)=fail`.
- `strict=true` (require branches to be up-to-date with main before merging) was preserved.

## Phase scope summary

- Files touched (`phase-49-base..HEAD`): 61 files. Key non-doc files:
  - `frontend/.size-limit.json` (6 → 9 entries; ceilings re-baselined per D-01..D-03 + D-07)
  - `frontend/vite.config.ts` (manualChunks ordering fix + 3 new sub-vendor branches per D-07)
  - `frontend/scripts/assert-size-limit-matches.mjs` (extended `expectedMatchCounts` with strict ===1 sub-vendor entries)
  - `frontend/docs/bundle-budget.md` (re-scaffolded with sub-vendor rows + residual vendor disposition)
  - `frontend/src/domains/documents/hooks/useExportData.ts` (top-level exceljs import → dynamic `await import('exceljs')`)
  - `frontend/src/components/position-editor/PositionEditor.tsx` (added `export default` for React.lazy compatibility)
  - `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx` (lazy + Suspense around WorldMap)
  - `frontend/src/routes/_protected/positions/$id.tsx` (lazy + Suspense around PositionEditor)
- Sub-vendor decomposition: `heroui-vendor` (3.55 KB / 9 KB), `sentry-vendor` (3.93 KB / 9 KB), `dnd-vendor` (16.55 KB / 22 KB) — Plan 02 D-07. Optional `tiptap-vendor` / `exceljs-vendor` NOT added (audit Decision conditional approval; deps remain in residual vendor table per D-08).
- lazy() conversions: 3 components (PositionEditor + WorldMap via `React.lazy()`; useExportData via dynamic `await import('exceljs')` per hook-not-component pattern). All ≥30 KB gz off-initial-path per D-06.
- Ceilings re-baselined (Plan 01 D-01..D-03 via `min(current, measured + 5 KB)` — never raise except via D-02): Initial 517→450 LOWERED; static-primitives 64→12 LOWERED; React 349 / d3-geospatial 55 UNCHANGED (current already tighter); Total 2.43→2.45 RAISED per D-02 escalation; TanStack 51→63 RAISED per Plan 02 D-03 honest re-baseline post-ordering-fix.
- Branch protection updated: `Bundle Size Check (size-limit)` added to `required_status_checks.contexts`; `enforce_admins=true` preserved (D-10).
- Smoke PRs verified BLOCKED: PR #9 (initial-JS overflow, closed --delete-branch), PR #10 (sub-vendor d3-geospatial overflow, closed --delete-branch) — both showed `Bundle Size Check (size-limit): fail` + `mergeStateStatus: BLOCKED` (D-12).

## Phase verdict

**SUCCESS-WITH-DEVIATION**

Rationale: All BUNDLE-01..04 acceptance criteria landed. The CI gate is enforceable on `main`; per-chunk ceilings BLOCK regressions; sub-vendor decomposition + lazy() conversions deliver the budget reshape; D-14 phase-wide audit returned 0 net-new suppressions and 0 unauthorized ceiling raises.

Two raised ceilings (TanStack 51→63 KB, Total JS 2.43→2.45 MB) are documented exceptions with paper trails — Plan 01 D-02 (anticipated by CONTEXT) and Plan 02 D-03 (forced by audit-mandated ordering fix that returned `@tanstack/react-*` paths to their proper chunk). The PR-B smoke trip-wire was relocated from dnd-vendor to d3-geospatial (Rule 3 deviation) because the dnd ceiling has insufficient headroom to overflow with package-level imports alone — same gate, same proof posture. The plan template's `import * as d3 from 'd3'` PR-A trip-wire was substituted with `_smoke-bloat-initial.ts` containing 100 KB of high-entropy literals, because the umbrella `d3` package is not installed (only `d3-geo` and `d3-hierarchy` sub-packages are) — same outcome (Initial JS overflow → BLOCKED).
