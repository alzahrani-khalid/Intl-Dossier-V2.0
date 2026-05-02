---
phase: 42-remaining-pages
plan: 03
subsystem: design-system
tags:
  - phase-42
  - css-port
  - density-migration
  - wave-0
dependency_graph:
  requires:
    - frontend/design-system/inteldossier_handoff_design/src/app.css (handoff source-of-truth)
    - frontend/src/design-system/DesignProvider.tsx (existing density wiring)
    - frontend/src/design-system/tokens/types.ts (Density union, already 'dense')
  provides:
    - global handoff CSS classes (.tasks-list/.task-row/.task-box/.task-title/.task-due, .act-list/.act-row/.act-t/.act-who/.act-what/.act-where, .settings-nav/.settings-nav.active, .card-head/.card-title/.card-sub) consumable by Wave 1 plans 05–09
    - one-time density migration shim (readDensityWithMigration) preserving user preference across the spacious → dense rename
  affects:
    - Wave 1 plans 05, 06, 07, 08, 09 (consume the new CSS classes)
    - Settings → Appearance section (label rename surface — actual i18n string update is a Wave 1 concern, see "Out of scope" below)
tech-stack:
  added: []
  patterns:
    - 'append-only handoff CSS port via index.css (no @import — Tailwind v4 ordering rule)'
    - 'one-time localStorage migration shim with idempotency'
    - 'TDD RED → GREEN gate (vitest)'
key-files:
  created:
    - frontend/src/design-system/__tests__/density-migration.test.tsx
    - .planning/phases/42-remaining-pages/deferred-items.md
  modified:
    - frontend/src/index.css
    - frontend/src/design-system/DesignProvider.tsx
decisions:
  - 'Skipped Density union rename in tokens/types.ts — already done in a prior commit (idempotent no-op)'
  - 'Promoted .tasks-list/.task-row/.task-box/.task-title/.task-due from page-scoped (dashboard.css) to global (index.css) so non-Dashboard reskinned pages can render the same primitives without importing dashboard.css'
  - 'Documented overlap with .card-head/.card-title/.card-sub in styles/list-pages.css; Plan 42-03 values are byte-aligned (intentional by plan author) and live in index.css alongside the new act/task/settings classes'
metrics:
  duration: '~5 min'
  completed: '2026-05-02'
---

# Phase 42 Plan 03: Wave-0 Infrastructure (CSS Port + Density Migration) Summary

**One-liner:** Global handoff CSS port (.tasks-list, .act-list, .settings-nav, .card-head) appended to `frontend/src/index.css`, plus a `readDensityWithMigration` shim in `DesignProvider.tsx` that one-time rewrites legacy `id.density='spacious'` localStorage values to `'dense'` so user preferences survive the R-03 rename.

## What was built

### Task 1 — Handoff CSS port (commit `45a7d2e8`)

Appended a verbatim port of selectors from
`frontend/design-system/inteldossier_handoff_design/src/app.css` to the END of
`frontend/src/index.css`. The new block is wrapped in a "Phase 42 remaining-pages
handoff CSS port" comment header. All values resolve to design tokens
(`var(--*)`); all directional properties are logical (`inset-inline-start`,
`padding-block`, `margin-block-end`, `border-block-end`, `text-align: start/end`).

Selectors added:

- `.settings-nav` + `.settings-nav:hover` + `.settings-nav.active` +
  `.settings-nav.active::before`
- `.card-head` / `.card-title` / `.card-sub`
- `.tasks-list` / `.task-row` (+ `:last-child`) / `.task-box` (+ `:hover`,
  `.done`) / `.task-title` / `.task-due` (+ `.today`, `.high`)
- `.act-list` / `.act-row` (+ `:last-child`) / `.act-t` / `.act-who` /
  `.act-what` / `.act-where`
- `@media (max-width: 768px)` settings pill-row block (D-12) — collapses
  `.settings-layout` to single column, scrolls `.settings-nav-card`
  horizontally, swaps the active vertical bar for a `border-block-end`
  underline.

`index.css` line count: 672 → 864 (192 lines added).

### Task 2 — Density migration shim (commits `441e9328`, `f9c2f931`)

TDD RED → GREEN:

- **RED** (`441e9328`): added `frontend/src/design-system/__tests__/density-migration.test.tsx`
  with 4 cases. RED produced 1 failure (the spacious→dense rewrite), as expected.
  The other 3 (comfortable untouched, dense idempotent, missing key) coincidentally
  passed on the unmodified provider because invalid values fell through to the
  default density without touching localStorage — but the spec demands an
  *explicit* migration that *preserves* the spacious preference as `'dense'`.
- **GREEN** (`f9c2f931`): added `readDensityWithMigration()` to
  `frontend/src/design-system/DesignProvider.tsx` and wired the lazy `useState`
  initializer to use it. The function calls `safeSetItem(LS_DENSITY, 'dense')`
  exactly once when it sees `'spacious'`, then returns `'dense'`. Other valid
  values pass through. Missing/invalid keys return `null` → caller falls back
  to `initialDensity`. 4/4 vitest cases PASS.

No REFACTOR commit needed — the shim is 11 lines including the comment and
slots cleanly between `safeSetItem` and the `DesignTestHatch` interface.

## Verification

| Check                                                            | Result      |
| ---------------------------------------------------------------- | ----------- |
| `grep -c "\.tasks-list" frontend/src/index.css` ≥ 1              | 4 ✓         |
| `grep -c "\.act-list" frontend/src/index.css` ≥ 1                | 3 ✓         |
| `grep -c "\.settings-nav" frontend/src/index.css` ≥ 1            | 10 ✓        |
| `grep -c "\.card-head" frontend/src/index.css` ≥ 1               | 4 ✓         |
| `grep -c "@media (max-width: 768px)"` ≥ 1                        | 1 ✓         |
| Logical properties only (no `left/right/text-align: right/left`) | OK ✓        |
| `grep "'dense'" frontend/src/design-system/tokens/types.ts`      | matches ✓   |
| `grep "readDensityWithMigration" DesignProvider.tsx`             | 2 matches ✓ |
| `pnpm exec vitest run … density-migration`                       | 4/4 PASS ✓  |

## Deviations from Plan

### Auto-fixed Issues

None of Rules 1–3 fired during execution; both tasks completed inside their
specified scope.

### Plan-spec deltas (minor — documented for traceability)

**1. [Plan-spec delta — already-done] Density union rename in `types.ts`**

- **Found during:** Task 2 read-first phase
- **Issue:** Plan Task 2 Part A asked to rename `Density = 'comfortable' | 'compact' | 'spacious'` → `'comfortable' | 'compact' | 'dense'` in `frontend/src/design-system/types.ts`. Inspection showed:
  - The actual file is `frontend/src/design-system/tokens/types.ts` (not `design-system/types.ts`).
  - The rename is already applied: `export type Density = 'comfortable' | 'compact' | 'dense'` at line 23.
  - `frontend/src/design-system/tokens/densities.ts` already has the `'dense'` key (no `'spacious'`).
  - `DesignProvider.tsx` `isDensity` already accepts `'dense'`.
  - `grep -rn "spacious" frontend/src/design-system/` returns ZERO matches before this plan.
- **Fix:** Skipped Part A — it is a no-op against the current tree. Task 2's value comes from Parts B (migration shim) and C (vitest suite), both of which were missing.
- **Files modified:** none (skip)
- **Commit:** n/a

**2. [Plan-spec delta — global promotion] `.tasks-list/.task-row/.task-box/.task-title/.task-due` previously page-scoped**

- **Found during:** Task 1 read-first phase
- **Issue:** These selectors were already defined in `frontend/src/pages/Dashboard/widgets/dashboard.css` (Phase 41). Because that file is imported only from `pages/Dashboard/index.tsx`, the styles do NOT apply on the Wave 1 task/agenda pages this plan exists to enable.
- **Fix:** Followed the plan's literal instruction and appended the same selectors (with the plan-spec values) to `index.css`. The plan-spec values match the dashboard.css values for the Dashboard-relevant subset, so dashboard rendering is unchanged. Documented the overlap in the new block's comment header.
- **Files modified:** `frontend/src/index.css` (append-only)
- **Commit:** `45a7d2e8`

**3. [Plan-spec delta — overlap noted] `.card-head/.card-title/.card-sub` overlap with `styles/list-pages.css`**

- **Found during:** Task 1 read-first phase
- **Issue:** `frontend/src/styles/list-pages.css` (Phase 40 port) already defines these three selectors. The plan's values for `.card-head` and `.card-sub` differ slightly (e.g. `.card-sub` font-size 11.5px vs 12px in list-pages.css). Adding the plan-spec values to `index.css` creates a cascade race resolved by source order at bundle time.
- **Fix:** Followed plan literally — appended the plan-spec values. Documented the overlap in the new block's comment header. Future consolidation (recommended) can collapse the two ports.
- **Files modified:** `frontend/src/index.css` (append-only)
- **Commit:** `45a7d2e8`

## Out of scope (deferred)

- `frontend/src/design-system/tokens/applyTokens.ts:29` — pre-existing TS2345
  ("Argument of type 'string | undefined' is not assignable to parameter of
  type 'string | null'") inherited from Phase 33-01. The plan's verify expected
  zero design-system tsc errors but this error predates Plan 42-03 and is not
  caused by any of its changes. Logged in
  `.planning/phases/42-remaining-pages/deferred-items.md`.

- The Settings → Appearance label rename (`Spacious` → `Dense`) is a Wave 1
  concern. Files still using `'spacious'` outside `frontend/src/design-system/`:
  - `frontend/src/types/settings.types.ts` (separate `DisplayDensity` enum used
    by SettingsPage form schema)
  - `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx`
    (radio option value + i18n key)
  - `frontend/src/i18n/{ar,en}/settings.json` (`appearance.spacious*` keys)
  - `frontend/src/pages/settings/SettingsPage.tsx` (zod schema)

  These are intentionally scoped to Wave 1 plan 09 (Settings reskin) per the
  plan author's wave allocation. Plan 42-03's migration shim ensures the
  *runtime DesignProvider* density preference survives until Wave 1 lands the
  full label/form rename.

## Self-Check: PASSED

Files verified to exist:

- `FOUND: frontend/src/index.css` (modified, +192 lines)
- `FOUND: frontend/src/design-system/DesignProvider.tsx` (modified, +20/-2 lines)
- `FOUND: frontend/src/design-system/__tests__/density-migration.test.tsx` (new, 78 lines)
- `FOUND: .planning/phases/42-remaining-pages/deferred-items.md` (new)

Commits verified in `git log --oneline 861bc942..HEAD`:

- `FOUND: 45a7d2e8` — `feat(42-03): port handoff CSS for tasks/activity/settings pages`
- `FOUND: 441e9328` — `test(42-03): add failing test for density migration shim (R-03)`
- `FOUND: f9c2f931` — `feat(42-03): add density "spacious" → "dense" migration shim`
- `FOUND: ee124594` — `docs(42-03): log out-of-scope pre-existing tsc error in deferred-items`

## TDD Gate Compliance

The plan as a whole is `type: execute`, but Task 2 carries `tdd="true"`. Gate
sequence in `git log --oneline`:

1. RED gate: `441e9328` — `test(42-03): add failing test for density migration shim (R-03)` ✓
2. GREEN gate: `f9c2f931` — `feat(42-03): add density "spacious" → "dense" migration shim` ✓
3. REFACTOR gate: skipped (the 11-line shim needed no cleanup) — allowed by `<tdd_execution>`.

## What's next (Wave 1)

- Plan 42-05/06/07/08/09 can now use `<ul className="tasks-list">`,
  `<ul className="act-list">`, `<button className="settings-nav active">`,
  and the styles render globally.
- Plan 42-09 (Settings reskin) should land the user-visible
  `Spacious → Dense` label rename and the `DisplayDensity` form-schema
  alignment.
