---
phase: 77
slug: linear-token-system
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-02
---

# Phase 77 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Substantive dimensions derive from `77-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (e2e / visual regression) + node check scripts (`scripts/check-*.mjs`)                           |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                                |
| **Quick run command**  | `cd frontend && pnpm type-check && pnpm run lint` (lint includes the Design-Token-Check + FOUC byte-match guard once wired) |
| **Full suite command** | `cd frontend && pnpm exec vitest run && pnpm exec playwright test`                                                          |
| **Estimated runtime**  | quick ~30–90s; full ~several min (Playwright)                                                                               |

---

## Sampling Rate

- **After every task commit:** Run the quick command (type-check + lint/Design-Token-Check + FOUC byte-match guard).
- **After every plan wave:** Run the full suite.
- **Before `/gsd:verify-work`:** Full suite green AND the VERIFY-01 pre-swap visual baseline captured (gates the token PR — no baseline laundering; re-compare is Phase 80).
- **Max feedback latency:** ~90s for the quick gate.

---

## Per-Task Verification Map

> Populated by the planner from each plan's `<acceptance_criteria>`. Every behavior-adding task maps to an
> automated command (or a Wave-0 stub / Manual-Only row below).

| Task ID  | Plan | Wave | Requirement                  | Threat Ref    | Secure Behavior                                 | Test Type     | Automated Command                                                                                                                | File Exists          | Status     |
| -------- | ---- | ---- | ---------------------------- | ------------- | ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------- |
| 77-01-01 | 01   | 1    | VERIFY-01 (gate)             | —             | N/A                                             | grep + tsc    | `grep -l "id.theme\|lng=" <12 specs> \| wc -l` = 12; `pnpm -C frontend type-check`                                               | ✅ specs exist       | ⬜ pending |
| 77-01-02 | 01   | 1    | VERIFY-01 (gate)             | T-77-01-01    | seed touches b0000002-\* fixture rows only      | visual replay | `pnpm -C frontend exec playwright test <12 visual specs>` (no --update-snapshots)                                                | ✅ specs exist       | ⬜ pending |
| 77-01-03 | 01   | 1    | VERIFY-01 (gate)             | T-77-01-02    | human PNG review before commit                  | manual        | Manual-Only row 1 (below)                                                                                                        | —                    | ⬜ pending |
| 77-02-01 | 02   | 1    | FOUC-01, TOKEN-02            | T-77-02-01/02 | path.resolve + read-only + bare vm sandbox      | script        | `node scripts/check-bootstrap-parity.mjs && ! node scripts/check-bootstrap-parity.mjs tools/bootstrap-fixtures/bad-bootstrap.js` | ❌ W0 → created here | ⬜ pending |
| 77-02-02 | 02   | 1    | FOUC-01                      | T-77-02-03    | positive-failure fixture proves both polarities | lint/CI       | `cd frontend && pnpm run lint`                                                                                                   | ✅ after 77-02-01    | ⬜ pending |
| 77-03-01 | 03   | 2    | TOKEN-01, TOKEN-03, TOKEN-02 | T-77-03-01/02 | whitelist static-table lookups preserved        | script + unit | guard + `pnpm -C frontend exec vitest run tests/unit/design-system/contrast.test.ts`                                             | ❌ W0 → created here | ⬜ pending |
| 77-03-02 | 03   | 2    | TOKEN-01                     | —             | —                                               | unit          | `pnpm -C frontend exec vitest run tests/unit/design-system/buildTokens.test.ts`                                                  | ✅ extended          | ⬜ pending |
| 77-04-01 | 04   | 3    | TOKEN-04, TOKEN-01, TOKEN-05 | T-77-04-01/02 | dual-layer id.dir coercion whitelist            | unit + grep   | `pnpm -C frontend exec vitest run tests/bootstrap tests/unit/design-system` + dir-\* purge grep                                  | ✅ updated in-task   | ⬜ pending |
| 77-04-02 | 04   | 3    | TOKEN-04, TOKEN-02, FOUC-01  | T-77-04-02/03 | coercion probes + :root check build-breaking    | script + unit | guard v2 both polarities + `pnpm -C frontend exec vitest run tests/bootstrap/coercion.test.ts`                                   | ❌ W0 → created here | ⬜ pending |
| 77-04-03 | 04   | 3    | TOKEN-05                     | —             | —                                               | e2e probe     | `pnpm -C frontend exec playwright test tests/e2e/font-registration.spec.ts`                                                      | ❌ W0 → created here | ⬜ pending |
| 77-05-01 | 05   | 4    | TOKEN-04                     | —             | —                                               | unit          | vitest component suites (Topbar/TweaksDrawer/Appearance)                                                                         | ✅ reworked          | ⬜ pending |
| 77-05-02 | 05   | 4    | TOKEN-04                     | —             | —                                               | unit + script | label-parity test + `node scripts/check-i18n-namespaces.mjs`                                                                     | ✅ exists            | ⬜ pending |
| 77-06-01 | 06   | 4    | TOKEN-06                     | T-77-06-01    | —                                               | lint + unit   | `pnpm run lint` + `vitest run tests/unit/design-system/handoff-css-contract.test.ts`                                             | ✅ exists            | ⬜ pending |
| 77-06-02 | 06   | 4    | TOKEN-06                     | —             | —                                               | lint + grep   | `pnpm run lint` + palette-literal grep over the 6 migrated files = 0                                                             | ✅ exists            | ⬜ pending |
| 77-07-01 | 07   | 5    | TOKEN-01, TOKEN-04, TOKEN-05 | —             | —                                               | script + unit | guard both polarities + vitest design-system/bootstrap + `pnpm exec size-limit`                                                  | ✅ exists            | ⬜ pending |
| 77-07-02 | 07   | 5    | TOKEN-04                     | T-77-07-01/02 | engagement-domain 'ministerial' whitelisted     | unit + grep   | vitest unit + retired-identifier purge greps                                                                                     | ✅ exists            | ⬜ pending |
| 77-07-03 | 07   | 5    | TOKEN-04 (visual matrix)     | —             | —                                               | visual        | `pnpm -C frontend exec playwright test tests/e2e/qa-sweep-focus-outline.spec.ts`                                                 | ✅ rewritten in-task | ⬜ pending |
| 77-08-01 | 08   | 6    | DOC-01                       | T-77-08-01    | —                                               | grep + manual | `! grep -rn "Bureau is the default\|RTLWrapper" CLAUDE.md frontend/CLAUDE.md frontend/src/design-system/CLAUDE.md`               | manual + grep        | ⬜ pending |
| 77-08-02 | 08   | 6    | DOC-01                       | —             | —                                               | grep + manual | `grep -q "#5e6ad2" frontend/DESIGN.md` + supersession-banner grep                                                                | manual + grep        | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] FOUC byte-match guard (`scripts/check-bootstrap-parity.mjs`) — **plan 77-02 (wave 1)**, proven against live Bureau values + positive-failure fixture BEFORE any literal moves; extended (coercion probes + :root check) in **plan 77-04**.
- [x] WCAG-AA contrast assertion for the TOKEN-03 gap palettes — **plan 77-03 task 1** (`frontend/tests/unit/design-system/contrast.test.ts`), committed in the same task as the derived values.
- [x] `id.dir` legacy-coercion regression — **plan 77-04 task 2** (`frontend/tests/bootstrap/coercion.test.ts` + guard v2 retired-dir probes), landing in the same plan as the coercion itself.
- [x] Font-registration probe (TOKEN-05, research Wave-0 gap) — **plan 77-04 task 3** (`frontend/tests/e2e/font-registration.spec.ts`).
- [x] Ordering constraint: VERIFY-01 baseline capture (plan 77-01, wave 1, human-gated) precedes the first `directions.ts` literal change (plan 77-03, wave 2) by wave construction.

_Existing infra (vitest/Playwright/ESLint Design-Token-Check) covers the rest; no new framework install._

---

## Manual-Only Verifications

| Behavior                                                                     | Requirement   | Why Manual                                                                                                             | Test Instructions                                                                              |
| ---------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| VERIFY-01 pre-swap visual baseline (12 specs, pinned EN/AR states)           | TOKEN-01 gate | `Visual Regression (Phase 46)` CI job is red on main (issue #31 class) — capture/replay follows the Phase-46 precedent | Plan 77-01 task 3 checkpoint: seeded dev machine + human PNG review BEFORE the baseline commit |
| Linear primitive re-skin visual fidelity (button/card/input, dark canonical) | TOKEN-06      | Recipe fidelity (no shadows, hairline borders, surface ladder) is a visual judgment                                    | At phase verify-work: human review against `.planning/research/STACK.md` + 77-06 SUMMARY notes |
| DOC-01 prose quality (docs teach Linear correctly)                           | DOC-01        | Prose quality isn't machine-checkable; greps only catch stale tokens                                                   | Read the rewritten sections at verify-work; cross-check DESIGN.md values vs directions.ts      |

---

## Validation Sign-Off

- [x] All behavior-adding tasks have `<automated>` verify or a Wave-0 dependency / Manual-Only row
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (only 77-01-03 and the DOC greps are manual-leaning; both are adjacent to automated tasks)
- [x] Wave 0 covers all MISSING references (FOUC guard, WCAG assertion, id.dir coercion, font probe)
- [x] No watch-mode flags
- [x] Feedback latency < 90s (quick gate)
- [x] `nyquist_compliant: true` set in frontmatter (planner flipped — map complete)

**Approval:** pending (checker/verify-work)
