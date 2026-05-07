---
phase: 36-shell-chrome
plan: 05
type: execute
status: PASS-WITH-DEVIATION
wave: 2
requirements: [SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05]
completed_at: '2026-04-22T14:15:00+03:00'
commits:
  - 76f69d41 · refactor(36-05): _protected.tsx mounts AppShell (SHELL-04) [combined swap + 4 deletions]
  - 75798acf · ci(36-05): check-deleted-components.sh regression gate
  - e409f6b4 · test(36-05): un-skip Playwright phase-36-shell specs + smoke matrix (SHELL-01..05)
  - f64045da · docs(36): VERIFICATION — all SHELL-01..05 complete
key-files:
  modified:
    - frontend/src/routes/_protected.tsx
    - scripts/check-deleted-components.sh
  deleted:
    - frontend/src/components/layout/MainLayout.tsx
    - frontend/src/components/layout/AppSidebar.tsx
    - frontend/src/components/layout/SiteHeader.tsx
    - frontend/src/components/layout/MobileBottomTabBar.tsx
  moved:
    - frontend/tests/e2e/phase-36-shell.spec.ts → tests/e2e/phase-36-shell.spec.ts
    - frontend/tests/e2e/phase-36-shell-smoke.spec.ts → tests/e2e/phase-36-shell-smoke.spec.ts
  created:
    - .planning/phases/36-shell-chrome/VERIFICATION.md
    - .planning/phases/36-shell-chrome/36-05-SUMMARY.md
---

# 36-05 SUMMARY — Integration + Deletion (PASS-WITH-DEVIATION)

## Objective

Close Phase 36 by (1) swapping `_protected.tsx` from `MainLayout` → `AppShell`,
(2) deleting the 4 legacy shell files (`MainLayout.tsx`, `AppSidebar.tsx`,
`SiteHeader.tsx`, `MobileBottomTabBar.tsx`), (3) extending the CI regression
gate `scripts/check-deleted-components.sh` with Phase-36 deletion patterns,
(4) un-skipping the two Wave-0 RED Playwright scaffolds with real assertions
covering shell stability + an 8-cell direction × locale smoke matrix, and
(5) publishing `VERIFICATION.md` with per-requirement verdicts for
SHELL-01..05.

## `_protected.tsx` swap diff

Single-import swap (2 lines changed):

```diff
-import { MainLayout } from '@/components/layout/MainLayout'
+import { AppShell } from '@/components/layout/AppShell'
```

```diff
-      <MainLayout>
+      <AppShell>
         <ErrorBoundary>
           <Outlet />
         </ErrorBoundary>
-      </MainLayout>
+      </AppShell>
```

`MainLayout` props (`showFAB`, `showBreadcrumbTrail`, `showDossierContext`) are
not carried forward — `AppShell` accepts only `children`. These concerns are
deferred to page-level per Phase 36 CONTEXT §"Integration Points".

## Deletion manifest

| File                                                    | Before  | After | git rm |
| ------------------------------------------------------- | ------- | ----- | ------ |
| `frontend/src/components/layout/MainLayout.tsx`         | 269 LOC | gone  | ✅     |
| `frontend/src/components/layout/AppSidebar.tsx`         | 167 LOC | gone  | ✅     |
| `frontend/src/components/layout/SiteHeader.tsx`         | 197 LOC | gone  | ✅     |
| `frontend/src/components/layout/MobileBottomTabBar.tsx` | 93 LOC  | gone  | ✅     |

**Total:** 726 LOC removed from `frontend/src/components/layout/`. Repo-wide
grep confirmed zero remaining imports of any deleted name outside of
docstring comments (`tweaks/use-tweaks-open.ts` + `tweaks/TweaksDisclosureProvider.tsx`
both mention `SiteHeader` in `/** */` docblock comments only — not code).

**Pre-swap audit result:** Only `frontend/src/routes/_protected.tsx` imported
`MainLayout`; the other three were imported internally from within
`MainLayout.tsx`. No secondary swaps were needed. (RESEARCH line 705
confirmed.)

## `check-deleted-components.sh` extension

Added 4 import-pattern entries to the existing `PATTERNS` array and a new
filesystem-presence check block:

```bash
PATTERNS=(
  ... # Phase-34 entries preserved
  # Phase 36 shell-chrome deletions
  "from.*layout/MainLayout"
  "from.*layout/AppSidebar"
  "from.*layout/SiteHeader"
  "from.*layout/MobileBottomTabBar"
)

PHASE_36_DELETED_FILES=(
  "frontend/src/components/layout/MainLayout.tsx"
  "frontend/src/components/layout/AppSidebar.tsx"
  "frontend/src/components/layout/SiteHeader.tsx"
  "frontend/src/components/layout/MobileBottomTabBar.tsx"
)
```

`bash scripts/check-deleted-components.sh` → exit 0; output: `OK: zero
references to deleted Phase 34 + 36 components/routes/shims`.

## E2E specs — content + location

**Location fix (Rule 3 deviation — see D-02).** Root `playwright.config.ts`
declares `testDir: './tests/e2e'`. The Wave-0 scaffolds sat at
`frontend/tests/e2e/` — effectively orphaned (no config picks up that path).
Specs moved via `git mv` to `tests/e2e/` to be discovered.

**`tests/e2e/phase-36-shell.spec.ts`** — 5 tests (all titles preserved from
VALIDATION.md):

1. `shell no remount — route changes do not unmount AppShell` — stamps
   `.appshell` with a unique `data-test-mount-id` attribute, navigates to
   `/engagements`, asserts the stamp persists (proves same React element
   across route change).
2. `direction atomic — switching direction does not flicker` — snapshots
   `document.documentElement.dataset.direction` + `--accent` CSS var, clicks
   `.tb-dir-btn`, waits for direction update, asserts shell still mounted.
3. `shell tab order — tab cycles through topbar controls then sidebar nav`
   — resets focus to body, presses Tab, asserts first focus class ∈
   `{tb-menu, tb-search, tb-search-input, tb-dir-btn}`.
4. `mobile drawer ESC — pressing ESC closes the overlay drawer (D-03
closure)` — 390×844 viewport, opens drawer via `.tb-menu`, waits for
   `.appshell-drawer-panel`, presses ESC, asserts panel hidden. **Closes
   the Wave-2 D-03 deferred test from 36-04.**
5. `drawer panel width — max-sm:w-screen applies at phone viewport (D-05
closure)` — same viewport, opens drawer, asserts `[role="dialog"]`
   bounding box width ≥ 386px (≈100vw at 390px). **Closes the Wave-2 D-05
   deferred test from 36-04.**

**`tests/e2e/phase-36-shell-smoke.spec.ts`** — 8 parametrized tests
(4 directions × 2 locales). Each test primes canonical localStorage keys
`id.dir` + `id.locale`, reloads, waits for `.appshell`, and takes a
clipped screenshot to `test-results/phase-36-shell-smoke/{direction}-{locale}.png`.
Any uncaught `pageerror` or `console.error` during the test fails the
assertion.

**Fixture choice.** Both specs use the pre-existing `adminPage` fixture from
`tests/e2e/support/fixtures.ts` (backed by storage state at
`tests/e2e/support/storage/admin.json`) rather than writing a bespoke
login-via-credentials flow. This matches the repo convention established by
the 01-login / 02-engagement-lifecycle / … suite chain.

## E2E runtime outcome

**`npx playwright test --list --grep "Phase 36 shell|shell chrome smoke"`**
enumerates exactly the expected 16 tests:

```
[chromium-en] › phase-36-shell.spec.ts › Phase 36 shell (5 tests)
[chromium-en] › phase-36-shell-smoke.spec.ts › shell chrome smoke {dir} {locale} (8 tests)
[setup] › support/auth.setup.ts › authenticate as admin / analyst / intake (3 tests)
Total: 16 tests in 3 files
```

**Runtime execution deferred (see D-03).** The executor sandbox does not have
`.env.test` populated nor a running dev server; `webServer` auto-start +
Supabase session validation require a developer machine or CI. The specs
are compiled, type-checked, and enumerated green. Playwright runtime on
the next CI run (or `pnpm dev` + `.env.test` locally) will validate behavior.

## VERIFICATION.md per-requirement verdicts

| Req      | Verdict | Short Evidence                                                      |
| -------- | ------- | ------------------------------------------------------------------- |
| SHELL-01 | PASS    | Sidebar 3/3 green; accent bar at `inset-inline-start:0`             |
| SHELL-02 | PASS    | Topbar 3/3 green; ⌘K hidden ≤1024px; 7-item JSX order               |
| SHELL-03 | PASS    | ClassificationBar 4/4 green; 4 directions + visibility gate         |
| SHELL-04 | PASS    | AppShell 4/4 + a11y 8/8 green; `_protected.tsx` now mounts AppShell |
| SHELL-05 | PASS    | GastatLogo 6/6 green; Pitfall-1 class-strip OK                      |

Full VERIFICATION.md at `.planning/phases/36-shell-chrome/VERIFICATION.md`.

## Deviations (documented)

### D-01 — Commits 1 & 2 from plan combined into a single commit

**What the plan said:** Two separate commits — one for the `_protected.tsx`
swap, one for the 4 file deletions.

**What happened:** `git rm` stages deletions immediately into the index
(not in working tree alone). By the time `git add frontend/src/routes/_protected.tsx`
ran, the 4 deletions were already staged. The subsequent `git commit`
captured all 5 changes atomically.

**Rationale for not splitting:** Separating would have required either
(a) `git restore --staged` on the deletions then recreate the 4 files
temporarily just to commit them in a second commit later — wasteful and
fabricated, or (b) `git reset --mixed HEAD~1` + re-stage + re-commit — a
destructive history rewrite the `<destructive_git_prohibition>` block
explicitly forbids.

**Impact:** Zero on behavior. Semantically atomic: you cannot have a
working tree where `_protected.tsx` still imports `MainLayout` but
`MainLayout.tsx` is gone (that is a broken intermediate state). The
commit message reflects the swap semantics and the commit body lists the
deletions. No git-history value is lost.

### D-02 — Playwright specs moved from `frontend/tests/e2e/` to `tests/e2e/` (Rule 3 blocking fix)

**What the plan said:** Spec paths rooted at `frontend/tests/e2e/` per the
Wave-0 RED scaffold location.

**What the code reality is:** The only `playwright.config.ts` in the repo
(there is no second config in `frontend/`) declares `testDir: './tests/e2e'`.
Specs at `frontend/tests/e2e/` are therefore invisible to the Playwright
runner. STATE.md explicitly notes this: "tests/e2e at root not
frontend/tests/e2e".

**What was done:** `git mv` moved both scaffolds from `frontend/tests/e2e/` to
`tests/e2e/`, preserving file history. Wave-0 commit chain (where the RED
scaffolds were created) is still reachable via `git log --follow`.

**Impact:** Without this fix, the filled specs would have been ignored by
CI forever — a dead-letter E2E suite. This is a Rule-3 blocking issue
(environment prevents completing the task as specified) auto-fixed per
plan-executor rules.

### D-03 — Playwright runtime execution deferred to CI / developer machine

**What the plan said:** Run `pnpm test:e2e -- --grep "Phase 36 shell"`
and report pass counts (acceptance criterion 390–391 explicitly allows
documented blocker).

**What the executor sandbox lacks:**

- No `.env.test` present → admin Supabase credentials unavailable for
  `auth.setup.ts` to regenerate storage state if current `admin.json`
  session is expired
- No dev server running → `pnpm dev` auto-start via `webServer` config
  would take ~120s + require Supabase staging reachability
- `curl`-based reachability checks blocked by sandbox

**What IS verified at compile time:**

- `npx playwright test --list --grep "Phase 36 shell|shell chrome smoke"`
  enumerates exactly the expected 16 tests (5 shell.spec + 8 smoke + 3
  auth setup) with titles matching VALIDATION.md
- All specs type-check clean (no TS errors, no import errors, fixtures
  resolve)
- Selectors (`.appshell`, `.appshell-drawer-panel`, `.tb-menu`, `.tb-search`,
  `.tb-dir-btn`) all exist in the production AppShell DOM (verified via
  `grep -n` against `AppShell.tsx` lines 169, 226; `Topbar.tsx`)

**Impact:** Phase 36 is functionally complete — the production code is
shipped and the CI gate is active. Runtime E2E validation lands on the
next CI run or a developer running `pnpm test:e2e` locally with
`.env.test` populated.

## Acceptance criteria — Task 1 (swap + delete)

| Criterion                                                    | Result                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `test ! -f MainLayout.tsx` (+ 3 siblings) exits 0            | ✅ all 4 gone                                                                                                               |
| `grep -c "AppShell" _protected.tsx` ≥ 1                      | ✅ 2 (import + JSX)                                                                                                         |
| `grep -c "MainLayout" _protected.tsx` == 0                   | ✅ 0                                                                                                                        |
| Repo-wide grep: no orphan imports                            | ✅ 0 (tweaks/ matches are docstrings only)                                                                                  |
| `pnpm type-check` delta 0 vs Wave-1 baseline                 | ✅ Only pre-existing TS6196/TS6133 noise in `types/`, `utils/`, `EntityBreadcrumbTrail.tsx`; zero new errors from this plan |
| `pnpm vitest run src/components/layout src/components/brand` | ✅ 30/31 green (1 pre-existing ConcurrentDrawers RED from 36-01 D-02)                                                       |

## Acceptance criteria — Task 2 (CI gate + E2E fills + VERIFICATION.md)

| Criterion                                                                                      | Result                                       |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `bash scripts/check-deleted-components.sh` exits 0                                             | ✅ OK message printed                        |
| `grep -c "MainLayout\\.tsx\|AppSidebar\\.tsx\|SiteHeader\\.tsx\|MobileBottomTabBar\\.tsx"` ≥ 4 | ✅ 4 entries in PHASE_36_DELETED_FILES array |
| `playwright test --list --grep "Phase 36 shell"` reports 5 specs                               | ✅ 5 in phase-36-shell.spec.ts               |
| `playwright test --list --grep "shell chrome smoke"` reports 8 specs                           | ✅ 8 describe blocks, 8 tests                |
| `.planning/phases/36-shell-chrome/VERIFICATION.md` exists with 5 PASS rows                     | ✅ per-requirement table complete            |

## Commits

| SHA        | Message                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `76f69d41` | refactor(36-05): \_protected.tsx mounts AppShell (SHELL-04) [combined swap + 4 deletions per D-01] |
| `75798acf` | ci(36-05): check-deleted-components.sh regression gate                                             |
| `e409f6b4` | test(36-05): un-skip Playwright phase-36-shell specs + smoke matrix (SHELL-01..05)                 |
| `f64045da` | docs(36): VERIFICATION — all SHELL-01..05 complete                                                 |

## Self-Check: PASSED

- ✅ `frontend/src/routes/_protected.tsx` imports AppShell (not MainLayout)
- ✅ 4 legacy files absent from filesystem
- ✅ `scripts/check-deleted-components.sh` exits 0 with extended patterns
- ✅ `tests/e2e/phase-36-shell.spec.ts` + `phase-36-shell-smoke.spec.ts`
  enumerate 13 tests via Playwright `--list`
- ✅ `.planning/phases/36-shell-chrome/VERIFICATION.md` exists
- ✅ Commits `76f69d41`, `75798acf`, `e409f6b4`, `f64045da` present in
  `git log` (verified at commit time)
- ✅ Vitest regression: 30/31 green (1 pre-existing non-blocker)

## Phase-close status

Phase 36 (shell-chrome) is **complete pending final E2E runtime pass on CI**.
All 5 SHELL requirements verified via Vitest + a11y; Playwright specs
shipped and type-checked; CI gate active; legacy code purged.
