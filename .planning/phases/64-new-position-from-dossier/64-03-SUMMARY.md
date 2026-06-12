---
phase: 64-new-position-from-dossier
plan: 03
subsystem: positions
tags: [react, react-hook-form, zod, i18n, tdd, dialog, positions, rtl]

# Dependency graph
requires:
  - phase: 64-new-position-from-dossier
    provides: usePositionTypes / useAudienceGroups lookups, translateContent wrapper, create_dialog + validation i18n keys (64-02)
provides:
  - NewPositionDialog form layer (RHF+Zod, pickers, bilingual titles, optional content pair, audience multi-select, translate assists)
  - NewPositionDialogProps contract (isOpen / onClose / dossierContext / isRTL)
  - Six-case unit test file; submit-flow cases (d/e/f) staged as it.skip for 64-04
affects:
  [
    64-04-PLAN (AddToDossierDialogs renders NewPositionDialog + wires submit flow),
    64-05-PLAN (DossierPositionsTab opens NewPositionDialog),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'RHF + zodResolver with mode: onTouched; Zod messages are i18n KEYS rendered through the FormMessage primitive (TaskEditDialog precedent)'
    - 'Name-match-with-first-row-fallback defaults resolved in a useEffect form.reset (never a hard-coded UUID)'
    - 'Content-driven (not locale-driven) per-field direction: _ar controls dir=rtl + inline Tajawal var(--font-arabic) even in EN locale'
    - 'Fail-safe translate assist: fill counterpart on 2xx only; any throw -> generic unavailable toast, field untouched, submission never blocks'

key-files:
  created:
    - frontend/src/components/positions/NewPositionDialog.tsx
    - frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx
  modified: []

key-decisions:
  - 'DossierContextBadge duplicated locally (27 lines) rather than imported from AddToDossierDialogs.tsx, which is owned by plan 64-04 (no cross-plan edit/import)'
  - 'Arabic font applied via inline style fontFamily: var(--font-arabic) — there is no font-arabic Tailwind utility (token lives in :root, not @theme); inline style is the only way to force Tajawal in EN locale'
  - 'onSubmit is a no-op stub this plan; create -> link -> invalidate -> toast lands in 64-04 (the d/e/f it.skip tests pin that contract now)'

requirements-completed: [POSNEW-01]

# Metrics
duration: ~22min
completed: 2026-06-12
---

# Phase 64 Plan 03: NewPositionDialog Form Layer Summary

**Test-first extraction of the broken quick-create position dialog into `NewPositionDialog`: RHF+Zod with localized inline validation, a real type picker, required bilingual titles, an optional bilingual content pair, an audience multi-select, robust name-match defaults, and fail-safe translate assists — the three form-behavior tests GREEN, the three submit-flow tests staged as `it.skip` for 64-04.**

## Performance

- **Duration:** ~22 min
- **Tasks:** 2 (TDD: RED skeleton+tests, then GREEN form layer)
- **Files:** 2 created (component + test)

## Accomplishments

- **Task 1 (RED, `f4d7dae8`):** Created the `NewPositionDialog.tsx` skeleton — `NewPositionDialogProps` contract + the sibling dialog frame (`sm:max-w-lg`, MessageSquare title, a local 27-line `DossierContextBadge` copied from `AddToDossierDialogs.tsx` L117-144, `min-h-11` footer with a permanently-disabled submit) — and the six-case test file following the ExportDossierDialog analog (mocks declared before importing the component, all targeting the exact module paths the implementation imports). Tests a–c active and failing for behavior reasons (no form yet); d/e/f `it.skip` with the 64-04 handoff comment. Verified exactly **3 failed / 3 skipped** (RED, no import crash).
- **Task 2 (GREEN, `ea2d2c2f`):** Extended the skeleton into the full form per the UI-SPEC layout contract — type Select, bilingual titles, optional content pair, audience checkbox fieldset, footer. RHF `useForm` with `zodResolver(newPositionSchema)`, `mode: 'onTouched'`, submit `disabled={!form.formState.isValid}`. Lookups via `usePositionTypes` / `useAudienceGroups` with loading-disabled controls and an inline `var(--danger)` `lookup_error` on query failure. Name-match defaults (`Standard Position ?? types[0]`, `All Staff ?? groups[0]`) applied once in a `useEffect` `form.reset`. Four ghost translate assists fill the counterpart field on 2xx only; any throw shows the unavailable toast and leaves the field untouched (disable-while-in-flight is the debounce; an `aria-live="polite"` region announces translating). `title_ar`/`content_ar` render `dir="rtl"` + inline Tajawal in both locales; `title_en`/`content_en` render `dir="ltr"`. Tests a/b/c GREEN; type-check exit 0.

## Task Commits

1. **Task 1: skeleton + six-case RED test file** — `f4d7dae8` (test)
2. **Task 2: form layer implementation (form-subset GREEN)** — `ea2d2c2f` (feat)

## Files Created/Modified

- `frontend/src/components/positions/NewPositionDialog.tsx` (created, 512 lines) — Extracted quick-create dialog: RHF+Zod form, lookups, name-match defaults, four translate assists, audience multi-select, bilingual content-driven direction. `onSubmit` is a no-op stub (submit flow → 64-04).
- `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` (created, 320 lines) — Six decision-tagged tests; a/b/c active (D-04 / D-05-D-06 / D-07), d/e/f `it.skip` (D-09/D-10, D-12, D-11) staged for 64-04.

## Decisions Made

- **DossierContextBadge copied, not imported.** `AddToDossierDialogs.tsx` is owned by plan 64-04 and is over the 800-line rule; importing or editing it from here would violate plan ownership and the surgical-change rule. The 27-line badge was duplicated locally per the plan's explicit instruction (`<action>` step 1). The new file is 512 lines, well under the 800 cap.
- **Arabic font via inline style.** `--font-arabic` ('Tajawal') is defined in `:root` (index.css L229) but NOT inside the `@theme` block, so there is no `font-arabic` Tailwind utility. The `html[dir='rtl']` cascade only fires in AR locale, but the UI-SPEC requires the `_ar` fields to render Tajawal in EN locale too (content-driven direction). The only correct mechanism is an inline `style={{ fontFamily: 'var(--font-arabic)' }}` — token-referenced (no raw value), so it stays within the design-token rule.
- **Submit is a no-op stub.** Per the plan, the create → link → invalidate → toast flow is plan 64-04. The three `it.skip` tests (d/e/f) already pin that contract (real `position_type_id`/`audience_groups`, `link_type: 'applies_to'`, dossier-scoped invalidation, warning-not-success on partial failure) so 64-04 unskips rather than re-discovers it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored the worktree dependency tree (`node_modules`)**

- **Found during:** Pre-execution environment check.
- **Issue:** The Claude Code worktree was spawned without `node_modules`, so `vitest`, `tsc`, `eslint`, and the pre-commit hook (build + lint-staged + knip) could not run.
- **Fix:** Ran `pnpm install --frozen-lockfile` at the worktree root — restored the EXISTING dependency tree from the committed lockfile (no new package, zero lockfile drift). This is explicitly distinct from the prohibited package-manager install of a new dependency; no human-verify checkpoint applies.
- **Files modified:** None tracked (worktree-local `node_modules` only).
- **Committed in:** N/A (environment fix, no tracked file change).

**2. [Rule 3 - Blocking] `vi.hoisted()` for the repository mock spies**

- **Found during:** Task 2 (the GREEN test run), after the implementation began importing `positions.repository`.
- **Issue:** The `positions.repository` mock factory referenced `linkMock`/`translateMock` (plain `const`s). `vi.mock` is hoisted above their declarations, so once the component imported the real module path the factory ran before the consts initialized → `ReferenceError: Cannot access 'linkMock' before initialization`. (Masked in RED because the skeleton did not import the repository.)
- **Fix:** Moved the two spies into a `vi.hoisted(() => ({ linkMock, translateMock }))` container so the factory closure reads initialized values.
- **Files modified:** `NewPositionDialog.test.tsx`.
- **Committed in:** `ea2d2c2f`.

**3. [Rule 1 - Bug] Guard undefined first-row defaults (TS strict `noUncheckedIndexedAccess`)**

- **Found during:** Task 2 `pnpm type-check`.
- **Issue:** `types[0]` / `groups[0]` are `T | undefined` under the repo's strict index-access setting; the early `length === 0` return doesn't narrow them, so `standardType.id` / `allStaff.id` errored TS18048.
- **Fix:** Added an explicit `if (standardType === undefined || allStaff === undefined) return` before the `form.reset`. Correct behavior regardless (no defaults applied if the lookups are somehow empty).
- **Files modified:** `NewPositionDialog.tsx`.
- **Committed in:** `ea2d2c2f`.

### Test-query refinements (not deviations — test precision while keeping RED behavior intact)

- Test b (D-05): "Standard Position" appears twice in the DOM (Radix Select renders a visible `span[data-slot="select-value"]` AND a hidden native `<option>` for form compat). Asserted on the visible value span specifically.
- Test c (D-07): "Translate to Arabic" labels two buttons (title_en + content_en). Scoped the click to the title_en FormItem via `within(...)`.

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug). All within scope; no architectural or design-direction change.

## Threat Surface

No new security surface. Per the plan threat model: translated text flows only into React controlled inputs (auto-escaped, filled on 2xx only, never placeholder text — T-64-07); client Zod is UX-only and the server re-validates (T-64-08); repeated translate clicks are blocked by disable-while-in-flight (T-64-09). No `dangerouslySetInnerHTML`, no package installs.

## Verification Results

- **Task 1 (RED):** `vitest run …NewPositionDialog.test.tsx` → exactly **3 failed / 3 skipped** (behavior reasons, no import crash). `RED_CONFIRMED`.
- **Task 2 (GREEN):** `-t 'D-04'`, `-t 'D-05'`, `-t 'D-07'` each → 1 passed / 5 skipped. Full file → **3 passed / 3 skipped**. `pnpm type-check` exit 0.
- **Design-token grep:** zero `ml-/mr-/pl-/pr-/text-left/text-right`; zero raw hex. `dir="ltr"` on title_en/content_en; `dir="rtl"` on title_ar/content_ar. `mode: 'onTouched'`, `zodResolver`, `'Standard Position' ?? types[0]`, `'All Staff' ?? groups[0]` all present.
- **ESLint:** both files clean (exit 0).
- **Plan-level (wave-merge gate):** full frontend unit suite `pnpm exec vitest run` → **170 files passed / 4 skipped; 1280 tests passed / 3 skipped / 25 todo**. The 3 skips are exactly the d/e/f submit-flow cases staged for 64-04. No regressions.

## Next Phase Readiness

- Plan 64-04 can render `<NewPositionDialog isOpen onClose dossierContext isRTL />`, replace the broken `PositionDialog` body, and unskip d/e/f by wiring `onSubmit` (create via `useCreatePosition` → `createPositionDossierLink(..., { link_type: 'applies_to' })` → invalidate `['dossier-position-links', dossierId]` + `dossierOverviewKeys.detail(dossierId)` → success/warning toasts).
- Plan 64-05 can open the same dialog from `DossierPositionsTab` (D-13 secondary action).
- No blockers.

## Self-Check: PASSED

- Files: `NewPositionDialog.tsx` and `__tests__/NewPositionDialog.test.tsx` both present on disk.
- Commits: `f4d7dae8` (test) and `ea2d2c2f` (feat) both verified in `git log`.

---

_Phase: 64-new-position-from-dossier_
_Completed: 2026-06-12_
