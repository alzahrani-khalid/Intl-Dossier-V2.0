---
phase: 51
slug: design-token-compliance-gate
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-15
---

# Phase 51 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Source:** `51-RESEARCH.md` §Validation Architecture (commit `e717bbd0`).

---

## Test Infrastructure

| Property               | Value                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Framework**          | ESLint 9.39.4 (flat config) + Vitest 3.x (existing visual-parity spot-checks)   |
| **Config file**        | `eslint.config.mjs` (root); `frontend/vitest.config.ts` (component tests)       |
| **Quick run command**  | `pnpm lint` (workspace-wide; flat config picks up D-05 selectors automatically) |
| **Targeted command**   | `pnpm exec eslint -c eslint.config.mjs <file>` for a single file                |
| **Full suite command** | `pnpm lint` + `pnpm --filter frontend test --run` — both exit 0                 |
| **Estimated runtime**  | `pnpm lint` ~25s workspace; per-file ~3s; full Vitest run ~90s                  |

---

## Sampling Rate

- **After every task commit:** `pnpm exec eslint -c eslint.config.mjs <touched-files>` (<10s)
- **After every plan wave:** `pnpm lint` workspace-wide + `pnpm --filter frontend test --run` on Tier-A-touched modules
- **Before `/gsd-verify-work`:** Full suite green AND smoke PR `mergeStateStatus=BLOCKED` captured AND Tier-C disable count matches `51-DESIGN-AUDIT.md`
- **Max feedback latency:** 30s for per-file lint; 120s for workspace lint + targeted test run

---

## Per-Task Verification Map

| Task Anchor                                                 | Requirement | Threat Ref | Secure Behavior                                               | Test Type          | Automated Command                                                                                                                   | File Exists                             |
| ----------------------------------------------------------- | ----------- | ---------- | ------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Rule activation (`eslint.config.mjs` D-05 hex selector)     | DESIGN-01   | —          | Raw hex in `.ts`/`.tsx` flagged outside allowlist             | static lint        | `pnpm exec eslint -c eslint.config.mjs <tier-c-file-with-hex>` → exits 1 with hex-rule message                                      | ✅                                      |
| Rule activation (`eslint.config.mjs` D-05 palette selector) | DESIGN-02   | —          | Palette literal (incl. variant prefix) flagged                | static lint        | `pnpm exec eslint -c eslint.config.mjs <tier-c-file-with-palette>` → exits 1 with palette-rule message                              | ✅                                      |
| Token-mapped utility passes                                 | DESIGN-02   | —          | `text-ink` / `bg-accent` / `text-success` NOT flagged         | static lint        | `pnpm lint <Tier-A-file-after-swap>` → exits 0                                                                                      | ✅                                      |
| Template-literal companion selector                         | DESIGN-02   | —          | Banned palette inside template string flagged                 | static lint        | `pnpm exec eslint -c eslint.config.mjs <file-with-template-literal-palette>` → exits 1                                              | ✅ shipped in Plan 51-01 Task 2c        |
| WorldMapVisualization Tier-A swap                           | DESIGN-03   | —          | SVG renders with theme-derived color, visual parity preserved | component/manual   | `pnpm --filter frontend test --run -- geographic-visualization` + dev-page mount                                                    | ✅ dev-page mount per Plan 51-02 Task 1 |
| PositionEditor Tier-A swap                                  | DESIGN-03   | —          | Renders identically pre/post swap on default theme            | component/snapshot | `pnpm --filter frontend test --run -- position-editor`                                                                              | ✅ verified spec exists                 |
| Workspace lint zero-state                                   | DESIGN-04   | —          | `pnpm lint` exits 0 with new selectors active                 | static lint        | `pnpm lint`                                                                                                                         | ✅                                      |
| PR-blocking gate behavior                                   | DESIGN-04   | —          | Known-bad-literal PR cannot merge to `main`                   | integration/smoke  | `gh pr view <smoke-pr> --json mergeStateStatus` → `BLOCKED`                                                                         | ✅ recipe in RESEARCH §Smoke PR Recipe  |
| Zero net-new eslint-disable outside Tier-C                  | D-12        | —          | Diff disable count equals Tier-C row count                    | grep               | `git diff phase-51-base..HEAD -- 'frontend/src' \| grep -E '^\+.*eslint-disable' \| wc -l` equals `51-DESIGN-AUDIT.md` Tier-C count | ✅ Phase 48-03 pattern                  |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `tools/eslint-fixtures/bad-design-token.tsx` — permanent regression fixture mirroring Phase 50 D-15 vi-mock pattern; scoped into rule `files` glob so `pnpm lint` exits 1 on it. (Plan 51-01 Task 4)
- [x] `51-DESIGN-AUDIT.md` — initialize with template + 1 representative Tier-C row before the sweep begins; gives executor a concrete shape. (Plan 51-03 Task 1 scaffolds Tier-A worklist + Tier-C placeholder; Plan 51-04 Task 1 populates Tier-C rows)
- [x] Visual-parity decision for `PositionEditor.tsx` + `WorldMapVisualization.tsx`: either (a) eyeball verification on a dev page (project-default), or (b) add component snapshot tests. Plan must commit to one before Tier-A wave begins. (Plan 51-02 Tasks 1 + 2 commit to dev-page verification + visual-parity spot-checks per UI-SPEC §Visual Fidelity Guarantee)
- [x] Tier-A swap dev-page mount for `WorldMapVisualization.tsx` `var(--accent)` vs `getComputedStyle` fallback — confirm SVG renders before locking the recipe. (Plan 51-02 Task 1 SPIKE → CHOOSE RECIPE → SWAP three-step approach)

_No new framework install — Vitest already wired (Phase 50 D-03)._

---

## Manual-Only Verifications

| Behavior                            | Requirement | Why Manual                                                                                    | Test Instructions                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Smoke PR `mergeStateStatus=BLOCKED` | DESIGN-04   | GitHub branch-protection state is eventual-consistency; manual gh CLI polling required        | 1. Push smoke branch with deliberate-bad literal injection into a real route-level component. 2. `gh pr create`. 3. Wait for `Lint` workflow to complete. 4. `gh pr view <PR#> --json mergeStateStatus` until non-`UNKNOWN`. 5. Confirm `BLOCKED`. 6. Close PR without merge. Record URL in `51-SUMMARY.md`. |
| WorldMap SVG visual parity          | DESIGN-03   | No Playwright visual baselines exist for `geographic-visualization/WorldMapVisualization.tsx` | Mount dev page pre-swap; screenshot. Apply Tier-A swap. Re-mount post-swap; screenshot. Diff visually. If `var(--accent)` fails in SVG, fall back to `getComputedStyle(...).getPropertyValue('--accent')` and re-verify.                                                                                     |

---

## Validation Sign-Off

- [x] All tasks have automated verify command OR Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (workspace lint covers gap)
- [x] Wave 0 covers all ⚠️ entries above
- [x] No watch-mode flags (lint + `--run` for tests)
- [x] Feedback latency: per-file <10s, workspace <30s, full <120s
- [x] `nyquist_compliant: true` set in frontmatter after plan-checker pass

**Approval:** gsd-plan-checker (verifier) — Phase 51 iteration 1
