---
phase: 42
slug: remaining-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source-of-truth: `42-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 1.x (unit) + Playwright (E2E + visual) + axe-core (a11y)                                                                                                      |
| **Config files**       | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `.size-limit.json`                                                                                     |
| **Quick run command**  | `pnpm --filter frontend test --run --reporter=verbose <file>`                                                                                                        |
| **Full suite command** | `pnpm --filter frontend test && pnpm --filter frontend playwright test --grep "phase-42\|briefs-page\|after-actions-page\|tasks-page\|activity-page\|settings-page"` |
| **Estimated runtime**  | ~180s (vitest 30s + playwright suite 150s)                                                                                                                           |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test --run --reporter=verbose <file>` (vitest unit for the page changed)
- **After every plan wave:** Run `pnpm --filter frontend test && pnpm --filter frontend playwright test --grep "phase-42"`
- **Before `/gsd-verify-work`:** Full suite must be green + 10 visual baselines accepted
- **Max feedback latency:** 30s (per-task) / 180s (per-wave)

---

## Per-Task Verification Map

> Tasks numbered by plan; ID format `42-{plan}-{task}` is finalized after planning. The matrix below is keyed by requirement so the planner can derive task-level entries from `42-RESEARCH.md` §Validation Architecture and §Plan Structure.

| Req ID  | Behavior                                                                       | Wave | Test Type                | Automated Command                                                                                                    | File Exists    | Status     |
| ------- | ------------------------------------------------------------------------------ | ---- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| PAGE-01 | Briefs renders responsive card grid + status chip + page count + author/due    | 1    | Unit + visual            | `pnpm --filter frontend test BriefsPage` + `pnpm --filter frontend playwright test briefs-page-visual`               | ❌ W0          | ⬜ pending |
| PAGE-01 | Brief card click opens BriefViewer Modal                                       | 1    | E2E                      | `pnpm --filter frontend playwright test briefs-page --grep card-click`                                               | ❌ W0          | ⬜ pending |
| PAGE-01 | "New brief" CTA opens BriefGenerationPanel Modal                               | 1    | E2E                      | `pnpm --filter frontend playwright test briefs-page --grep cta`                                                      | ❌ W0          | ⬜ pending |
| PAGE-02 | After-actions table renders 6 columns + chevron flips in RTL                   | 1    | Unit + visual            | `pnpm --filter frontend test AfterActionsTable` + `pnpm --filter frontend playwright test after-actions-page-visual` | ❌ W0          | ⬜ pending |
| PAGE-02 | Row click navigates to `/after-actions/$id`                                    | 1    | E2E                      | `pnpm --filter frontend playwright test after-actions-page --grep navigation`                                        | ❌ W0          | ⬜ pending |
| PAGE-02 | `useAfterActionsAll` hook returns engagement+dossier joined data               | 0    | Unit (hook)              | `pnpm --filter frontend test useAfterActionsAll`                                                                     | ❌ W0          | ⬜ pending |
| PAGE-03 | Tasks list renders checkbox + glyph + title + priority + due                   | 1    | Unit + visual            | `pnpm --filter frontend test MyTasksPage` + `pnpm --filter frontend playwright test tasks-page-visual`               | ❌ W0          | ⬜ pending |
| PAGE-03 | Done-toggle flips visual state (opacity + strikethrough) without nav           | 1    | E2E                      | `pnpm --filter frontend playwright test tasks-page --grep done-toggle`                                               | ❌ W0          | ⬜ pending |
| PAGE-03 | Assigned/Contributed tabs swap data sets                                       | 1    | E2E                      | `pnpm --filter frontend playwright test tasks-page --grep tabs`                                                      | ❌ W0          | ⬜ pending |
| PAGE-04 | Activity rows render `who action what in where` with `where` in `--accent-ink` | 1    | Unit + visual            | `pnpm --filter frontend test ActivityList` + `pnpm --filter frontend playwright test activity-page-visual`           | ❌ W0          | ⬜ pending |
| PAGE-04 | All/Following tabs work                                                        | 1    | E2E                      | `pnpm --filter frontend playwright test activity-page --grep tabs`                                                   | ❌ W0          | ⬜ pending |
| PAGE-05 | Settings 240+1fr layout with `inset-inline-start: 0` accent bar on active row  | 1    | Unit + visual            | `pnpm --filter frontend test SettingsLayout` + `pnpm --filter frontend playwright test settings-page-visual`         | ❌ W0          | ⬜ pending |
| PAGE-05 | Mobile (≤768px) collapses to horizontal pill nav with accent underline         | 1    | E2E (viewport)           | `pnpm --filter frontend playwright test settings-page --grep mobile-collapse`                                        | ❌ W0          | ⬜ pending |
| PAGE-05 | Appearance section design controls share state with TweaksDrawer               | 1    | Unit (hook integration)  | `pnpm --filter frontend test AppearanceSettingsSection`                                                              | ❌ W0 (extend) | ⬜ pending |
| All 5   | RTL renders correctly via `dir="rtl"` + logical properties                     | 2    | Visual (×5 AR baselines) | `pnpm --filter frontend playwright test --grep "rtl-flip"`                                                           | ❌ W0          | ⬜ pending |
| All 5   | axe-core WCAG AA zero violations                                               | 2    | a11y E2E                 | `pnpm --filter frontend playwright test --grep "page-42-axe"`                                                        | ❌ W0          | ⬜ pending |
| All 5   | size-limit ≤815 KB Total JS                                                    | 2    | bundle                   | `pnpm --filter frontend size-limit`                                                                                  | ✅ exists      | ⬜ pending |
| All 5   | ≥44×44px touch targets                                                         | 2    | E2E                      | `pnpm --filter frontend playwright test --grep "touch-targets-42"`                                                   | ❌ W0          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/tests/e2e/support/phase-42-fixtures.ts` — mock briefs (published+draft+ai_briefs), mock after-actions-all (3 records across 2 dossiers, varied counts), mock tasks (mixed priorities + done state), mock activity (one per `action_type`), mock settings (logged-in user + section state)
- [ ] `frontend/tests/e2e/briefs-page-visual.spec.ts` (2 baselines: LTR + AR @ 1280)
- [ ] `frontend/tests/e2e/after-actions-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/tasks-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/activity-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/settings-page-visual.spec.ts` (2 — 1280 + 768 mobile pill nav)
- [ ] `frontend/tests/e2e/{briefs,after-actions,tasks,activity,settings}-page.spec.ts` (functional E2E ×5)
- [ ] `frontend/tests/e2e/page-42-axe.spec.ts` (axe-core WCAG AA × 5 pages × LTR+AR = 10)
- [ ] `frontend/tests/e2e/touch-targets-42.spec.ts` (44×44 boundingBox per interactive element)
- [ ] Vitest unit harnesses: `BriefsPage.test.tsx`, `AfterActionsTable.test.tsx`, `MyTasksPage.test.tsx`, `ActivityList.test.tsx`, `SettingsLayout.test.tsx`, `useAfterActionsAll.test.ts`
- [ ] Visual determinism layers per Phase 40 plan 40-17 (clock freeze, `caret: hide`, `reducedMotion: reduce`, `maxDiffPixels: 100`) — already configured in `playwright.config.ts`

---

## Manual-Only Verifications

| Behavior                                                       | Requirement           | Why Manual                                                                    | Test Instructions                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10 visual baselines accepted (LTR + AR for all 5 pages @ 1280) | PAGE-01..05           | First-time baseline establishment requires human inspection vs handoff source | After Wave 1 complete, run `pnpm --filter frontend playwright test --update-snapshots --grep "phase-42-visual"`; reviewer compares each new PNG side-by-side with `frontend/design-system/inteldossier_handoff_design/src/pages.jsx` rendered at 1280; sign-off in PR description |
| Density rename `spacious → dense` migration                    | PAGE-05 (D-11 update) | Existing localStorage values in dev/staging environments must transition      | After deploy, verify Settings → Appearance shows `Comfortable / Compact / Dense`; legacy `spacious` localStorage values map to `dense` via DesignProvider migration shim                                                                                                          |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Icon set, Edge Function, hook, fixtures, specs)
- [ ] No watch-mode flags (CI uses `--run` for vitest, default for playwright)
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
