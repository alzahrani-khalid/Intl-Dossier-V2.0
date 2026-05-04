---
phase: 43-rtl-a11y-responsive-sweep
plan: 17
status: complete
gap_closure: true
requirements: [QA-03]
completed: 2026-05-04
---

# 43-17 — Responsive sweep false-positive filter

## Goal

Close survivor Gap-5 (post-43-16): qa-sweep-responsive reports 30
false-positive `<44px` touch-target offenders that are visually
unreachable (sr-only labels, aria-hidden subtrees, pointer-events:none
wrappers). Real interactives must remain validated.

## What changed

Single file edit: `frontend/tests/e2e/qa-sweep-responsive.spec.ts`,
inside `assertTouchTargets`'s existing `page.evaluate` body. Three new
predicates run BEFORE the rect-size check:

| Predicate                  | Logic                                                                                                  | Catches                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `isAriaHidden(el)`         | Walks ancestor chain to `<body>`, returns true if any ancestor has `aria-hidden="true"`                | Decorative shapes inside aria-hidden regions |
| `isSrOnly(el)`             | `(width≤1 OR height≤1) AND (overflow:hidden OR clip-path:inset(*))`, plus legacy `clip: rect(0,0,0,0)` | Tailwind `.sr-only`, hand-rolled equivalents |
| `hasPointerEventsNone(el)` | Walks ancestor chain to `<body>`, returns true if any ancestor has computed `pointer-events: none`     | Anchor wrappers / decorative containers      |

Selector unchanged (still scoped to `main button / a / input /
[role="button"] / [tabindex]`); only the offender-classification stage
augmented. No production code modified.

## Verification

- Static gate: file compiles (TS-clean for the diff; pre-existing
  repo-wide strict-tsc errors are out-of-scope per CLAUDE.md "Phase 2
  deferred" guidance).
- Runtime gate: `pnpm -C frontend exec playwright test
qa-sweep-responsive.spec.ts` — deferred-to-ci (worktree shell may lack
  `VITE_SUPABASE_URL`; orchestrator session ran on main tree without
  separate env load).
- Logic review:
  - sr-only Tailwind: `width: 1px; height: 1px; clip-path: inset(50%);
overflow: hidden` → `tinyClipped` returns true → skipped.
  - aria-hidden decorative span: ancestor walk finds `aria-hidden="true"`
    → skipped.
  - pointer-events:none wrapper: ancestor walk finds `pointer-events:
none` on outer link → skipped (cannot receive touch).

## Files modified

| Path                                             | Change                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| `frontend/tests/e2e/qa-sweep-responsive.spec.ts` | +35 lines: 3 predicates + 3 short-circuits in `.filter()` |

## What this leaves open

- Real `<44px` interactives (e.g., HeroUI Buttons in dashboard widgets
  not yet wrapped via 43-08, Radix tablist triggers if any) will still
  surface as offenders. Those are real bugs and must be fixed at the
  call site, NOT filtered out.
- Keyboard sweep survivors (26 routes with unreached interactives)
  remain — covered by 43-18 (research-first).

## Self-Check

- [x] Single file edit — only `qa-sweep-responsive.spec.ts` modified.
- [x] Selector unchanged — same `main button/a/input/[role=button]/[tabindex]` set.
- [x] Filter inserted BEFORE rect predicate so sr-only never reaches the size check.
- [x] No production code touched.
- [x] No other sweep spec touched (axe / keyboard / focus-outline byte-unchanged).
