---
phase: 85-linear-taste-refinements-f16-f21
plan: 04
subsystem: ui
tags: [css, design-system, settings, labels, linear, rtl, i18n]

# Dependency graph
requires:
  - phase: 77-linear-migration
    provides: '.dir-linear direction root + the .label/.dir-linear .label recipe in list-pages.css'
provides:
  - 'Scoped .label-field modifier (sentence-case 13px/500 var(--ink-mute) form-field labels)'
  - 'label-field applied to all 17 field <Label> call sites across the 5 Label-importing settings sections'
affects: [settings, form-labels, taste-refinements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Suffix modifier class over shared recipe (mirrors .chip/.chip-* idiom) — never edit the base .label'
    - 'dir-linear-scoped compound selector (.dir-linear .label.label-field, 0,3,0) placed after the .dir-linear .label override to win the cascade under the active root'

key-files:
  created: []
  modified:
    - frontend/src/styles/list-pages.css
    - frontend/src/components/settings/sections/ProfileSettingsSection.tsx
    - frontend/src/components/settings/sections/GeneralSettingsSection.tsx
    - frontend/src/components/settings/sections/SecuritySettingsSection.tsx
    - frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx
    - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx

key-decisions:
  - 'D-85-04: scope the sentence-case fix to a new .label-field suffix, leaving .label/.dir-linear .label/.t-label/labelVariants byte-unchanged'
  - 'D-85-07: uppercase meta labels (KPI strips, table headers, topbar) keep their .label styling; AR (no letter case, Tajawal weight/spacing) unaffected'
  - "Applied label-field to ALL <Label> call sites in the 5 sections (incl. radio-option labels in Accessibility/Appearance) per the plan's per-file count-equality acceptance — those option labels were already rendering 11px uppercase because .dir-linear .label out-specified their text-sm utility"

patterns-established:
  - 'Sentence-case form labels: append label-field to a <Label className>; no component change (rides cn(labelVariants(), className))'

requirements-completed: [TASTE-04]

# Metrics
duration: 15min
completed: 2026-07-05
---

# Phase 85 Plan 04: Sentence-case settings form-field labels (F19/TASTE-04) Summary

**Settings form-field labels now render calm sentence-case 13px/500 var(--ink-mute) via a scoped `.label-field` modifier — the global uppercase `.label` recipe, `.t-label`, and `labelVariants` are byte-unchanged, so KPI strips / table headers / the topbar keep their uppercase meta styling.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-05
- **Tasks:** 2 auto tasks executed (Task 3 human-verify deferred — see below)
- **Files modified:** 6

## Accomplishments

- Added the `.label-field` suffix modifier to `list-pages.css`, placed immediately after the `.dir-linear .label` block so the compound `.dir-linear .label.label-field` (0,3,0) out-specifies `.dir-linear .label` (0,2,0) under the active dir-linear root.
- Appended `label-field` to every field `<Label>` className across the five Label-importing settings sections (Profile 6, General 4, Security 4, Accessibility 1, Appearance 2 = 17 sites); per-file `label-field` count equals each file's `<Label>` count.
- Verified the global recipes stayed untouched: `components/ui/label.tsx` and `src/index.css` are absent from both commits; base `.label` still carries `text-transform: uppercase`/`font-size: 11px`; `.t-label` present and unedited.

## Task Commits

Each task was committed atomically:

1. **Task 1: add scoped .label-field modifier** — `9b04c345` (fix)
2. **Task 2: apply label-field to the 5 settings sections' field labels** — `ec986a5c` (fix)

_Task 3 (checkpoint:human-verify) was NOT executed — see Deviations._

## Files Created/Modified

- `frontend/src/styles/list-pages.css` — new `.label.label-field, .dir-linear .label.label-field` rule (`text-transform: none; letter-spacing: normal; 13px/500; var(--ink-mute)`)
- `frontend/src/components/settings/sections/ProfileSettingsSection.tsx` — 6 field labels carry `label-field`
- `frontend/src/components/settings/sections/GeneralSettingsSection.tsx` — 4 field labels
- `frontend/src/components/settings/sections/SecuritySettingsSection.tsx` — 4 field labels
- `frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx` — 1 radio-option label (prettier wrapped the className onto its own line)
- `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` — 2 radio-option labels (mode + density)

## Decisions Made

- Scoped variant, not a base edit (D-85-04) — the shared `.label` also styles legitimate uppercase meta labels elsewhere, so it must not change.
- Covered every `<Label>` in the five files, including the mode/density/focus radio-option labels in Accessibility/Appearance. Those used `text-sm cursor-pointer` but were already rendering 11px uppercase because `.dir-linear .label` (0,2,0) beat the `text-sm` utility (0,1,0); `label-field` brings them to the intended readable 13px sentence-case, matching the plan's per-file count-equality criterion.

## Deviations from Plan

**Task 3 (checkpoint:human-verify, blocking) intentionally not executed.** Per the orchestrator's dispatch instruction, this subagent cannot take interactive input; the human render-parity sign-off (EN/AR × dark/light) is owned by the orchestrator's single consolidated post-merge walk across all four Phase-85 plans. Recorded here as **deferred to orchestrator consolidated render sign-off (post-merge)** — not blocked, not self-certified.

No Rule 1-4 auto-fixes were needed. Prettier (pre-commit hook) wrapped the long Accessibility `<Label>` className onto its own line — a formatting no-op, class content unchanged.

**Total deviations:** 0 auto-fixed. 1 planned checkpoint deferred to orchestrator.
**Impact on plan:** None — plan executed as written; only the human gate is deferred by design.

## Issues Encountered

- Acceptance criterion "`grep -c '\.label\.label-field'` returns 1" assumed a single-line selector list; prettier's CSS formatter forces comma-separated selectors onto separate lines, so the honest committed count is **2** selector lines (plus explanatory comment). The substantive intent — exactly one new rule with `text-transform: none`, positioned after `.dir-linear .label` — holds and was verified against the committed tree.

## Automated Verification

- `pnpm type-check` — exit 0 (no tsc errors)
- `pnpm test --run src/components/settings` — 8/8 pass (1 file)
- `pnpm build` — exit 0 (built in 11.40s; pre-existing chunk-size warning only)
- Guards: `label.tsx` + `index.css` absent from both commits; base `.label` still `uppercase`/`11px`; `.t-label` present; no raw hex added; only `var(--ink-mute)` used for color.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- F19/TASTE-04 complete. Remaining Phase-85 human render-parity sign-off (this plan's Task 3 plus the sibling plans') is consolidated into the orchestrator's post-merge walk.

## Self-Check: PASSED

- `85-04-SUMMARY.md` — FOUND
- Commit `9b04c345` (Task 1, CSS modifier) — FOUND
- Commit `ec986a5c` (Task 2, 5 sections) — FOUND
- `label.tsx` + `index.css` absent from both commits — CONFIRMED

---

_Phase: 85-linear-taste-refinements-f16-f21_
_Completed: 2026-07-05_
