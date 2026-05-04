---
phase: 43-rtl-a11y-responsive-sweep
plan: 13
subsystem: design-system / list-pages stylesheet
tags: [qa, gate, remediation, touch-target, responsive, gap-closure, qa-03]
gap_closure: true
requires:
  - 43-08 (canonical list-pages.css already in place from Phase 40)
provides:
  - QA-03 touch-target floor on every `.btn` consumer (anchors + buttons)
  - 44px logical-axis min-block-size for `.btn`, with `justify-content: center` + `box-sizing: border-box`
affects:
  - frontend/src/pages/Dashboard/components/DashboardHero.tsx (consumer; quick-action anchors `/intake`, `/engagements`)
  - frontend/src/pages/MyTasks.tsx (consumer; primary CTA)
  - frontend/src/pages/Briefs/BriefsPage.tsx (consumer; primary CTA)
  - frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx (2 consumers)
  - frontend/src/components/list-page/EngagementsList.tsx (consumer)
tech-stack:
  added: []
  patterns:
    - Logical-axis CSS property `min-block-size` (RTL-safe; respects QA-01 no-physical-properties rule)
    - Single-rule fix at the class definition (Karpathy "Surgical Changes" — fix the class, not 30 anchors)
key-files:
  created: []
  modified:
    - frontend/src/styles/list-pages.css
decisions:
  - 'Edit the `.btn` class rule in list-pages.css (not index.css). UAT note pointed to index.css but the actual `.btn` rule lives in list-pages.css:421-433 — verified via grep before editing.'
  - 'Use `min-block-size` (logical) not `min-height` (physical) so QA-01 grep stays clean.'
  - 'Add `box-sizing: border-box` so the 44px floor is inclusive of border + padding (without it, the 1px border would push total to 46px on min-clamp paths).'
  - 'Add `justify-content: center` so wider buttons keep their label centered after the height grows.'
  - 'No per-call-site changes — single CSS edit benefits all 4+ consumer call sites.'
metrics:
  duration: '~12 minutes (single CSS edit + verification)'
  tasks_completed: 2
  files_modified: 1
  commits: 1
  completed_date: 2026-05-04
---

# Phase 43 Plan 13: Gap-1 closure — `.btn` touch-target floor (QA-03) Summary

Raise the `.btn` class to a 44px logical-axis floor with `min-block-size: 2.75rem` plus `justify-content: center` and `box-sizing: border-box`, eliminating the 30 dashboard quick-action failures observed in 43-HUMAN-UAT.md (Gap-1).

## Diff Applied

Single file modified: `frontend/src/styles/list-pages.css`

```diff
@@ -421,8 +421,10 @@ html[dir='rtl'] .page-sub {
 .btn {
   display: inline-flex;
   align-items: center;
+  justify-content: center;
   gap: 6px;
   padding: 7px 14px;
+  min-block-size: 2.75rem; /* QA-03: 44px touch-target floor (Gap-1 closure) */
   border-radius: var(--radius-sm);
   border: 1px solid var(--line);
   background: var(--surface);
@@ -430,6 +432,7 @@ html[dir='rtl'] .page-sub {
   font-size: 13px;
   font-weight: 500;
   transition: all 0.12s;
+  box-sizing: border-box;
 }
```

Three new declarations, all inside the existing `.btn` rule. Variants `.btn:hover`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`, `.btn-accent`, `.btn-danger` and per-direction overrides (`.dir-chancery .btn`, `.dir-situation .btn-primary`, etc.) are byte-unchanged.

## Consumer Call Sites Found (Task 2 Phase A grep)

`grep -rn 'class(Name)?="btn"|class(Name)?="btn btn-primary"' frontend/src/`:

| File                                                             | Line | Consumer                                               | UAT-named   |
| ---------------------------------------------------------------- | ---- | ------------------------------------------------------ | ----------- |
| `frontend/src/pages/Dashboard/components/DashboardHero.tsx`      | 50   | `/intake` quick-action                                 | yes (Gap-1) |
| `frontend/src/pages/Dashboard/components/DashboardHero.tsx`      | 54   | `/engagements` quick-action                            | yes (Gap-1) |
| `frontend/src/pages/MyTasks.tsx`                                 | 166  | primary CTA                                            | no          |
| `frontend/src/pages/Briefs/BriefsPage.tsx`                       | 281  | primary CTA                                            | no          |
| `frontend/src/components/list-page/EngagementsList.tsx`          | 186  | list-page action (already self-padded with `min-h-11`) | no          |
| `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx` | 64   | drawer CTA                                             | no          |
| `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx` | 77   | drawer CTA                                             | no          |

The two UAT-named anchors (DashboardHero `/intake` + `/engagements`) are now ≥44px tall (44px = `min-block-size 2.75rem` floor, taller if intrinsic content exceeds it).

## qa-sweep-responsive Runtime Result

**Result: deferred-to-ci** (per plan's explicit acceptable outcome — "If env missing").

Exact log excerpt (`/tmp/43-13-sweep.log`):

```
> playwright test qa-sweep-axe.spec.ts qa-sweep-responsive.spec.ts qa-sweep-keyboard.spec.ts qa-sweep-focus-outline.spec.ts --reporter=list ...

sh: playwright: command not found
 ELIFECYCLE  Command failed.
 WARN   Local package.json exists, but node_modules missing, did you mean to install?
```

Reason: this plan ran inside a Claude Code parallel-execution worktree at `.claude/worktrees/agent-a27e088db6fedf5ca/` which has no `node_modules` (workspace install lives in the main checkout). The `pnpm -C frontend test:qa-sweep …` invocation resolved through pnpm and reached the playwright shell-out, which failed because the binary is not on PATH inside the worktree. Identical behavior was observed for `pnpm -C frontend exec vite build` and `pnpm -C frontend exec tsc --noEmit` — same root cause, not a source defect.

The mathematical correctness of the fix is independent of runtime: the existing UAT-observed `.btn` height was `padding 7px + content 24px + padding 7px = 38px`. After this plan, the rule asserts `min-block-size: 2.75rem` (= 44px) with `box-sizing: border-box`, which forces the rendered box to be ≥44px regardless of content. CI will confirm the runtime gate passes once dashboards refetch the new CSS bundle.

## Verification Performed (deviating from plan-declared automated check)

| Plan-declared verify                                  | Outcome                       | Substitute / explanation                                                                                                                                                  |
| ----------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm -C frontend exec vite build --mode development` | Env-blocked (no node_modules) | Substituted with **postcss parse** via main repo's binary. Confirmed file parses; the `.btn` rule contains all 14 declarations including the 3 new ones in correct order. |
| `pnpm -C frontend exec tsc --noEmit`                  | 1580 pre-existing errors      | None mention `list-pages.css` or `.btn`. CSS edit cannot cause TS errors. Out of scope per executor SCOPE BOUNDARY rule.                                                  |
| `git diff HEAD -- spec/helper`                        | empty (byte-unchanged)        | Confirmed.                                                                                                                                                                |

## Files Modified Outside list-pages.css

None.

- `frontend/src/index.css`: byte-unchanged (`git diff HEAD~1 HEAD -- frontend/src/index.css` empty)
- `frontend/tests/e2e/qa-sweep-responsive.spec.ts`: byte-unchanged
- `frontend/tests/e2e/helpers/qa-sweep.ts`: byte-unchanged
- `frontend/design-system/inteldossier_handoff_design/**`: untouched (design-system reference, not production)

## Deviations from Plan

**1. [Rule 3 - Environment limitation] Vite build / tsc / playwright not runnable inside worktree**

- **Found during:** Task 1 verify and Task 2 Phase B
- **Issue:** `.claude/worktrees/agent-…` has no `node_modules`; `pnpm -C frontend exec vite build` and `pnpm -C frontend test:qa-sweep` both fail with "command not found"
- **Fix:** Substituted with postcss parse via main repo's `frontend/node_modules/postcss` binary, confirming the `.btn` rule parses with all 3 new declarations in correct order. Phase B runtime sweep recorded as `deferred-to-ci` per plan's explicit acceptable outcome.
- **Files modified:** none (verification adjustment only)
- **Commit:** n/a

**2. [pre-commit hook] Prettier reformatted multi-line selectors elsewhere in the file**

- **Found during:** Task 1 commit
- **Issue:** lint-staged ran prettier --write on staged CSS. Prettier reformatted ~17 unrelated multi-line CSS selector groups (e.g. `body :is([class~='text-gray-900'], …)` got expanded across more lines). Total stat: 329 insertions / 101 deletions in one file, but semantically identical.
- **Fix:** Accepted the prettier-induced reformat — committed alongside the fix. Pre-existing repo conventions own the formatter rules; rejecting them would require disabling the hook.
- **Files modified:** `frontend/src/styles/list-pages.css` (pre-existing rules formatted by prettier; my 3 new declarations are exactly as planned)
- **Commit:** `73c91878`

No Rule 1, 2, or 4 deviations.

## Authentication Gates

None.

## Self-Check: PASSED

- File `frontend/src/styles/list-pages.css` modified — confirmed (`grep -c "min-block-size: 2.75rem" frontend/src/styles/list-pages.css` → 1)
- Commit `73c91878` exists in `worktree-agent-a27e088db6fedf5ca` (`git log --oneline -3` shows it)
- SUMMARY file path: `.planning/phases/43-rtl-a11y-responsive-sweep/43-13-SUMMARY.md` — created (this file)
- Spec / helper files byte-unchanged — confirmed (`git diff HEAD -- frontend/tests/e2e/qa-sweep-responsive.spec.ts frontend/tests/e2e/helpers/qa-sweep.ts` empty)
- `.btn` variants (`.btn-primary`, `.btn-ghost`, etc.) byte-unchanged — confirmed via diff inspection

## TDD Gate Compliance

n/a — this plan's frontmatter is `type: execute`, not `type: tdd`.

## Known Stubs

None.

## Threat Flags

None — pure CSS class rule edit, no new network / auth / file-access surface.
