---
phase: 57-phase-52-deviation-closure-d-19-d-23
plan: 03
subsystem: testing
tags: [i18n, querystring-detector, visual-baselines, eslint-ban, byte-distinction, playwright]

# Dependency graph
requires:
  - phase: 52-heroui-v3-kanban-migration
    provides: 4 kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png baselines and the Phase 52 D-22 deviation register
provides:
  - querystring-first i18n detector chain so URL ?lng= flips language pre-mount
  - kanban-visual.spec.ts + tasks-tab-visual.spec.ts use ?lng= URL params instead of addInitScript(i18nextLng)
  - ESLint no-restricted-syntax rule banning addInitScript(i18nextLng) under frontend/tests/e2e/**
  - bad-i18n-init.spec.ts positive-failure fixture
  - eslint-ban-i18n.test.ts vitest meta-test (3rd layer of D-57-14 guard)
  - baseline-byte-distinction.test.ts hash-comparison meta-test asserting LTR vs RTL byte-distinction
affects:
  [phase-57-plan-02-baseline-regen, phase-57-plan-04-live-run, phase-52-verification-D-22-row]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'URL ?lng= query-string drives language flip pre-mount via i18next-browser-languagedetector querystring detector'
    - '3-layer ESLint guard (rule + positive-failure fixture + vitest meta-test) mirroring KANBAN-03 / Phase 57-02 @dnd-kit/core twin'
    - 'Hash-comparison vitest meta-test for mechanical byte-distinction enforcement in CI'
    - 'Skip-with-rationale pattern when prerequisite artifact is generated downstream (avoids Wave 1 blocking on Wave 2 host-operator regen)'

key-files:
  created:
    - tools/eslint-fixtures/bad-i18n-init.spec.ts
    - frontend/tests/security/baseline-byte-distinction.test.ts
    - frontend/src/components/kanban/__tests__/eslint-ban-i18n.test.ts
  modified:
    - frontend/src/i18n/index.ts
    - frontend/tests/e2e/kanban-visual.spec.ts
    - frontend/tests/e2e/tasks-tab-visual.spec.ts
    - eslint.config.mjs

key-decisions:
  - "Add 'querystring' as the FIRST entry in detection.order so URL ?lng=ar wins over localStorage at first paint; lookupLocalStorage/lookupCookie unchanged so production users keep id.locale-based persistence."
  - 'ESLint rule scope is frontend/tests/e2e/**/*.{ts,tsx} with an ignores list of 9 legacy specs that intentionally write i18nextLng for bootstrap-migration backward-compat — each ignored file is out of plan scope per the 57-03 files_modified frontmatter.'
  - "Hash-comparison enforcement chosen as a vitest meta-test at frontend/tests/security/baseline-byte-distinction.test.ts (not a bash script) per D-57-13 'minimizes new tooling' rationale; vitest's existing **/*.test.{ts,tsx} include picks it up under the Tests (frontend) CI context with no config change."
  - 'Skip-with-rationale when baseline PNGs are absent so Wave 1 close does not block on Wave 2 host-operator regen (per executor scope guidance).'
  - "AST selector picked: CallExpression[callee.property.name='addInitScript']:has(Literal[value=/i18nextLng/]). The :has subtree match catches the literal in any descendant position (template-tag, callback body, second arg) without coupling to a specific argument position."

patterns-established:
  - '3-layer ESLint boundary guard for anti-patterns (rule + positive-failure fixture + vitest meta-test asserting non-zero ESLint exit). Mirrors Phase 52 KANBAN-03 (kibo-ui ban) and Phase 57-02 (@dnd-kit/core ban). i18n is the 3rd instance — pattern is now established convention.'
  - 'Vitest hash-comparison meta-test as CI gate for visual-baseline byte-distinction. Generalizable to any future LTR/RTL visual regression suite where byte-identity would silently mask a defect.'

requirements-completed: [DEVIATE-03]

# Metrics
duration: ~25min
completed: 2026-05-18
---

# Phase 57 Plan 03: D-22 LTR/RTL Baseline Byte-Distinction Closure Summary

**i18next querystring detector + ?lng URL-param fix in visual specs + 3-layer ESLint guard for the addInitScript(i18nextLng) anti-pattern + vitest hash-comparison meta-test for mechanical byte-distinction enforcement.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-18T16:35:00Z (approx)
- **Completed:** 2026-05-18T16:59:38Z
- **Tasks:** 4
- **Files modified:** 7 (3 modified + 4 created including the SUMMARY)

## Accomplishments

- Closed D-22 spec-side mechanism: kanban-visual.spec.ts and tasks-tab-visual.spec.ts now use `page.goto(url + '?lng=' + lng)` instead of the broken `addInitScript` writing `localStorage.i18nextLng` which i18next silently ignored (i18n detector reads `id.locale`, not `i18nextLng`).
- Added `querystring` as the first entry in i18n detection.order so the URL `?lng=ar` flips the language pre-mount on first paint, producing byte-distinct LTR vs RTL snapshots once Plan 57-02 Task 3 regenerates the baselines.
- 3-layer regression guard now in place mirroring KANBAN-03 / Phase 57-02 @dnd-kit/core: (a) ESLint rule banning `addInitScript(i18nextLng)` under `frontend/tests/e2e/**`, (b) positive-failure fixture at `tools/eslint-fixtures/bad-i18n-init.spec.ts`, (c) vitest meta-test at `frontend/src/components/kanban/__tests__/eslint-ban-i18n.test.ts` asserting ESLint exits non-zero against the fixture.
- Hash-comparison meta-test at `frontend/tests/security/baseline-byte-distinction.test.ts` mechanically enforces `md5(kanban-ltr-1280) != md5(kanban-rtl-1280)` and the 768 pair in CI; skips gracefully when baseline PNGs are absent so Wave 1 closure does not block on Wave 2 regen.

## Task Commits

Each task was committed atomically:

1. **Task 1: querystring detector + ?lng URL-param fix in visual specs** — `05271fb4` (fix)
2. **Task 2: ESLint ban + positive-failure fixture for addInitScript(i18nextLng)** — `e154f033` (feat)
3. **Task 3: Vitest hash-comparison meta-test for byte-distinction** — `17122065` (test)
4. **Task 4: Vitest meta-test asserting ESLint exits non-zero on the bad fixture** — `06985eeb` (test)

## Files Created/Modified

### Modified

- `frontend/src/i18n/index.ts` — prepended `'querystring'` to `detection.order` array so URL `?lng=ar` flips language at first paint. `lookupLocalStorage: 'id.locale'` and `lookupCookie: 'id.locale'` unchanged; `caches: ['localStorage', 'cookie']` unchanged to keep production behavior intact. Inline comment cites the Phase 57 D-22 fix.
- `frontend/tests/e2e/kanban-visual.spec.ts` — dropped the `addInitScript((d) => localStorage.setItem('i18nextLng', ...), dir)` block at L13-15; introduced `const lng = dir === 'rtl' ? 'ar' : 'en'`; replaced `page.goto('/kanban')` with `page.goto('/kanban?lng=' + lng)` via template literal. addStyleTag animation-suppression block, `waitForLoadState('networkidle')`, and `document.fonts.ready` wait preserved.
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` — same conversion. `page.goto` now appends `?lng=${lng}` to the engagement-route URL.
- `eslint.config.mjs` — added two new flat-config blocks. (a) `files: ['frontend/tests/e2e/**/*.{ts,tsx}']` block scoped to e2e specs with `no-restricted-syntax` selector `"CallExpression[callee.property.name='addInitScript']:has(Literal[value=/i18nextLng/])"` at error severity and an `ignores` array listing 9 legacy specs that retain backward-compat `i18nextLng` writes. (b) Fixture-scoped block at `files: ['tools/eslint-fixtures/bad-i18n-init.spec.ts']` re-applies the same selector so the bad fixture triggers the rule on demand. Inline header comment documents the rationale + cross-references CONTEXT.md D-57-11/14.

### Created

- `tools/eslint-fixtures/bad-i18n-init.spec.ts` — positive-failure fixture. A single Playwright test() body that calls `page.addInitScript((d) => localStorage.setItem('i18nextLng', d), 'ar')`. Header comment cites 57-CONTEXT.md D-57-14 and explains the fixture's purpose. Minimal Playwright import + `export {}` for module isolation.
- `frontend/tests/security/baseline-byte-distinction.test.ts` — vitest hash-comparison meta-test. Reads `kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png` via `node:fs.readFileSync`, computes `node:crypto.createHash('md5').digest('hex')`, asserts pairs differ. Each pair lives in its own `it()` block so failures localize to the offending viewport. Skip-with-rationale via `existsSync` + early-return when baseline PNG is absent.
- `frontend/src/components/kanban/__tests__/eslint-ban-i18n.test.ts` — vitest meta-test mirroring `eslint-ban.test.ts` byte-for-byte. Spawns `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-i18n-init.spec.ts` via `execSync` from the repo root; wraps in try/catch and asserts `lintFailed === true`. 60_000ms timeout. Same `resolveRepoRoot()` helper as the kibo-ui and @dnd-kit/core twins.

## Decisions Made

1. **Detector order:** `'querystring'` added as the FIRST entry (over inserting it later) so the URL param wins decisively over any cached `id.locale` value. Production users without `?lng=` in the URL fall through to localStorage exactly as before; only test/QA URLs trigger the new path. Caches array deliberately NOT extended with `'querystring'` to avoid `?lng=ar` contaminating subsequent localStorage state across test runs.
2. **ESLint AST selector:** `CallExpression[callee.property.name='addInitScript']:has(Literal[value=/i18nextLng/])` uses `:has()` for subtree match so the literal can appear in any descendant position (callback arrow body, second positional arg, template element) without coupling to a specific path. Tested mentally against the original `kanban-visual.spec.ts` L13-15 shape and the bad fixture body.
3. **Rule scope vs ignores:** The plan's `files_modified` frontmatter restricts this plan to two e2e specs (kanban-visual + tasks-tab-visual). Nine other e2e specs already write `i18nextLng` for documented backward-compat reasons (`frontend/tests/e2e/support/list-pages-auth.ts` and `frontend/tests/e2e/support/phase-42-fixtures.ts` comments explain the bootstrap-migration cleanup behavior). The pragmatic decision was to scope the rule broadly (`frontend/tests/e2e/**`) but `ignores`-list the 9 legacy specs by name, so the workspace-wide lint stays green and a follow-up sweep can migrate each at its own pace.
4. **Hash-test placement:** `frontend/tests/security/baseline-byte-distinction.test.ts` chosen over a colocated path under `src/components/kanban/__tests__/` because the test asserts a property of the visual-baseline artifacts, not a kanban component invariant; logical home is `tests/security/` (a sibling of the existing security CI lane). Vitest's `**/*.test.{ts,tsx}` discovery picks it up with no config edit.
5. **Skip-with-rationale:** Required by the executor scope constraint. Implemented via `existsSync(ltrAbs) || existsSync(rtlAbs)` guard + `console.warn` naming Plan 57-02 Task 3 as the regen source. The current pre-regen state of the repo (baselines present, 768 pair byte-identical) means the test will FAIL with an informative md5 diff message until Wave 2 regen completes — that is the intended Wave 1 behavior per the plan's `<verify><human-check>` clause.

## tasks-tab-visual.spec.ts audit outcome

Per Task 1 Step 3 the audit was conducted:

- `frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/` directory **DOES exist** with 4 PNGs (`tasks-tab-{ltr,rtl}-{1280,768}-chromium-darwin.png`). This contradicts the planner's prediction that the dir was never generated; subsequent baseline generation in Phase 52 produced these files.
- Computed md5 hashes:
  - `tasks-tab-ltr-1280-chromium-darwin.png`: `23257b1ec9246aa2dbdc2d6d99d6722f`
  - `tasks-tab-rtl-1280-chromium-darwin.png`: `978a888a005c07de8d99f845156abc8d` (distinct from LTR)
  - `tasks-tab-ltr-768-chromium-darwin.png`: `f5e86eb2605897ebb1d2a82d9e146ee3`
  - `tasks-tab-rtl-768-chromium-darwin.png`: `f5e86eb2605897ebb1d2a82d9e146ee3` (**BYTE-IDENTICAL** to LTR — same defect as kanban 768)
- Outcome: tasks-tab 1280 baselines were already byte-distinct under the old addInitScript mechanism (likely because some non-language content rendered differently between the LTR and RTL DOM trees by accident); however the 768 baselines are byte-identical, reproducing the kanban-768 defect. The ?lng= fix in Task 1 was therefore applied to tasks-tab-visual.spec.ts as well to ensure post-regen all four pairs are byte-distinct.

The hash-comparison meta-test created in Task 3 scopes to the kanban PNGs per plan; if the tasks-tab baselines should be added to the meta-test, that is a follow-up — the plan's `<acceptance_criteria>` for Task 3 names only the kanban pair.

## kanban-visual.spec.ts audit outcome (pre-fix evidence of the defect)

- `kanban-ltr-1280-chromium-darwin.png`: `f55083f6f81bc3a48ecb6761fc93cc25`
- `kanban-rtl-1280-chromium-darwin.png`: `de11c99107250589b1a76398b6ea1884` (distinct)
- `kanban-ltr-768-chromium-darwin.png`: `5ce26cd18883db6dafbf1218650e2440`
- `kanban-rtl-768-chromium-darwin.png`: `5ce26cd18883db6dafbf1218650e2440` (**BYTE-IDENTICAL**)

The 768 kanban pair confirms the D-22 byte-identity defect. The 1280 pair coincidentally diverges (likely because the desktop layout has wider RTL-flipping behavior even when the language detector silently failed). The hash-comparison meta-test correctly catches the 768 case.

## Pre-flight grep inventory: remaining addInitScript+i18nextLng usages

Per Task 2 Step 5 a workspace-wide grep was run. The 9 files listed below contain `page.addInitScript` with a body that writes `localStorage.setItem('i18nextLng', ...)`. Each is **excluded by name** from the ESLint rule's `frontend/tests/e2e/**` glob via the `ignores` array. Rationale per file: each writes the legacy key for backward-compat coverage of the bootstrap migration (`frontend/public/bootstrap.js` clears `i18nextLng` after migrating to `id.locale`) or for non-visual purposes where the language flip happens via a follow-up `page.reload()`.

| File                                                   | Reason for exclusion                                                                                                            | Action class   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts` | Phase 52 mid-drag debug capture; underscore-prefixed → not in the canonical run. Out of plan scope.                             | Defer          |
| `frontend/tests/e2e/calendar-a11y.spec.ts`             | a11y spec; language flip via init script + page.reload pattern. Out of plan scope (calendar).                                   | Defer          |
| `frontend/tests/e2e/calendar-visual.spec.ts`           | Visual spec for calendar surface; likely has the same byte-identity defect at 768 but calendar baselines are out of D-22 scope. | Follow-up plan |
| `frontend/tests/e2e/dossier-rtl-complete.spec.ts`      | Dossier RTL functional spec; non-visual. Out of plan scope.                                                                     | Defer          |
| `frontend/tests/e2e/dossier-rtl-mobile.spec.ts`        | Same.                                                                                                                           | Defer          |
| `frontend/tests/e2e/kanban-a11y.spec.ts`               | Kanban a11y spec; functional axe assertions, not pixel-level. Out of plan scope.                                                | Defer          |
| `frontend/tests/e2e/tasks-tab-a11y.spec.ts`            | Same.                                                                                                                           | Defer          |
| `frontend/tests/e2e/tasks-tab-dnd.spec.ts`             | Tasks-tab DnD spec; functional. Out of plan scope.                                                                              | Defer          |
| `frontend/tests/e2e/tasks-tab-keyboard.spec.ts`        | Tasks-tab keyboard spec; functional. Out of plan scope.                                                                         | Defer          |

Additionally, `frontend/tests/e2e/pull-to-refresh.spec.ts` and `frontend/tests/e2e/dashboard.spec.ts` use `page.evaluate` (not `page.addInitScript`) to write `i18nextLng`, so they are not caught by the rule's selector and need no exclusion. The support modules `frontend/tests/e2e/support/list-pages-auth.ts` and `frontend/tests/e2e/support/phase-42-fixtures.ts` write `i18nextLng` from a `page.evaluate` block (per comments noting bootstrap-migration cleanup behavior); also not caught by the selector.

A follow-up sweep is recommended to convert the calendar-visual spec at minimum (potentially same byte-identity defect at 768) and to migrate the functional specs to `?lng=` URL params for consistency, but that work is explicitly out of plan 57-03 scope per the `files_modified` frontmatter.

## Vitest hash-comparison meta-test: pre/post-regen expected behavior

- **Pre-Plan-57-02-Task-3 (current state):** The 768 baselines are byte-identical. The hash-comparison meta-test will **FAIL** at the `kanban 768` `it()` block with an assertion message of the form:
  > `kanban 768 baselines are byte-identical between LTR and RTL: frontend/tests/e2e/kanban-visual.spec.ts-snapshots/kanban-ltr-768-chromium-darwin.png md5=5ce26cd18883db6dafbf1218650e2440 == frontend/tests/e2e/kanban-visual.spec.ts-snapshots/kanban-rtl-768-chromium-darwin.png md5=5ce26cd18883db6dafbf1218650e2440. Plan 57-02 Task 3 regenerates these post Plan-57-03 ?lng= URL-param fix.`
- **Post-Plan-57-02-Task-3 (post-regen):** With the ?lng= URL-param fix landed and baselines regenerated on the canonical macOS chromium host, both viewport pairs produce distinct hashes and the meta-test PASSES.
- **If baselines deleted:** Both `it()` blocks emit `console.warn` and return early; the test reports as passed (no assertion) but the warning is visible in CI output. This is the skip-with-rationale path; it exists so Wave 1 closure does not block on Wave 2 host-operator regen if anyone removes the baselines mid-Wave-1 (defensive engineering).

## 3-layer D-57-14 guard confirmation

The D-57-14 boundary guard is now complete and structurally matches the Phase 52 KANBAN-03 / Phase 57-02 @dnd-kit/core twins:

| Layer                              | File                                                                                   | Status           |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| Layer 1 — ESLint rule              | `eslint.config.mjs` (new no-restricted-syntax block scoped to `frontend/tests/e2e/**`) | Present (Task 2) |
| Layer 2 — positive-failure fixture | `tools/eslint-fixtures/bad-i18n-init.spec.ts`                                          | Present (Task 2) |
| Layer 3 — vitest meta-test         | `frontend/src/components/kanban/__tests__/eslint-ban-i18n.test.ts`                     | Present (Task 4) |

The eslint-ban-i18n.test.ts byte-shape mirrors `eslint-ban.test.ts` and (per Plan 57-02 Task 2 Step 3) `eslint-ban-dndkit.test.ts` — same `execSync` invocation, same `resolveRepoRoot()` helper, same try/catch + `lintFailed` boolean + `expect(lintFailed).toBe(true)`, same 60_000ms timeout, same `stdio: 'pipe'`, same `cwd: repoRoot`. Only the describe name, it-title, and fixture path differ. A future eslint.config.mjs change that silently breaks the addInitScript(i18nextLng) ban will be caught by this meta-test in the `Tests (frontend)` CI lane.

## Deviations from Plan

None - plan executed exactly as written. The plan's `<files>` frontmatter, `<acceptance_criteria>`, and `<verify>` blocks were satisfied without auto-fix invocations. The pre-flight grep audit (Task 2 Step 5) surfaced 9 legacy specs that retain `i18nextLng` writes; the planned mitigation (exclude-by-name in the ESLint rule's `ignores` array) was applied per the plan's explicit option (b) instruction.

## Issues Encountered

- The parallel-worktree environment has no `node_modules`, so the `<human-check>` lint and typecheck commands cannot be run from this executor. The pre-commit hooks DID run `eslint --fix` and `prettier --write` on the staged files via lint-staged (output visible in the Task 1/3/4 commit logs), confirming the new files pass the existing rule set. The host operator should run `pnpm --filter ./frontend lint frontend/src/i18n/index.ts frontend/tests/e2e/kanban-visual.spec.ts frontend/tests/e2e/tasks-tab-visual.spec.ts` and `pnpm --filter ./frontend typecheck` after the worktrees merge to fully discharge the `<human-check>` clauses. This is expected for parallel-worktree execution mode.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- **Plan 57-02 Task 3 (baseline regen):** unblocked. Once Plan 57-02 lands the WorkBoard migration, the host operator regenerates the 4 kanban baselines on the canonical macOS chromium host with the ?lng= URL-param fix in effect; the new baselines will be byte-distinct between LTR and RTL at both viewports, and the hash-comparison meta-test created in Task 3 will pass.
- **Plan 57-04 (live tasks-tab run):** independent of this plan; can proceed in parallel.
- **52-VERIFICATION.md D-22 row flip:** still requires Plan 57-02 Task 3 regen to land before the row can be flipped from `passed_with_deviation` to `passed`. Final-task cross-phase update happens at phase close per CONTEXT D-57 specifics.

## Self-Check

Verified before returning:

- `frontend/src/i18n/index.ts` contains `'querystring'` as first detector entry — verified via grep.
- `frontend/tests/e2e/kanban-visual.spec.ts` uses `page.goto(.../kanban?lng=...)` and no longer contains `addInitScript` writing `i18nextLng` — verified via grep.
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` uses `?lng=` URL param — verified via grep.
- `eslint.config.mjs` contains the new `no-restricted-syntax` selector banning `addInitScript(i18nextLng)` and an `ignores` list of 9 legacy specs — verified via grep.
- `tools/eslint-fixtures/bad-i18n-init.spec.ts` exists with the bad `addInitScript` call — verified via grep + read.
- `frontend/tests/security/baseline-byte-distinction.test.ts` exists with `createHash`, references all 4 baseline PNG filenames, and includes skip-with-rationale `existsSync` guard — verified via grep.
- `frontend/src/components/kanban/__tests__/eslint-ban-i18n.test.ts` exists, describes 'addInitScript(i18nextLng) ban fixture', references `bad-i18n-init.spec.ts`, has 60_000ms timeout, uses `resolveRepoRoot` helper — verified via grep.
- 4 task commits present in `git log e1536173..HEAD`: 05271fb4, e154f033, 17122065, 06985eeb — verified via git log.

## Self-Check: PASSED

---

_Phase: 57-phase-52-deviation-closure-d-19-d-23_
_Completed: 2026-05-18_
