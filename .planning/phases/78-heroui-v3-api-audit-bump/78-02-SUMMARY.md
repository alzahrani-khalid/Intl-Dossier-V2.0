---
phase: 78-heroui-v3-api-audit-bump
plan: 02
subsystem: ui
tags: [heroui, react-aria, checkbox, switch, vitest, jsdom, testing-library, a11y]

# Dependency graph
requires:
  - phase: 78-01
    provides: '@heroui/react + @heroui/styles bumped to 3.2.1 in lockstep (node_modules on 3.2.1)'
provides:
  - 'HeroUIFormCheckbox / HeroUIFormSwitch migrated to the shipped v3.2.0 *.Content composition'
  - 'Committed behavioral vitest oracle (label-named toggle + Content DOM) that tsc cannot provide'
  - 'Honest heroui-chip.tsx docstring (cva + @radix-ui/react-slot, not a HeroUI primitive)'
affects: [78-03, 78-04, 80]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'HeroUI toggles anatomy: root Checkbox/Switch = Field wrapper; *.Content = clickable label wrapping Control(+Indicator/Thumb) + plain label text; Description/FieldError are siblings of Content'
    - "jsdom oracle for react-aria pressables: resolve the control by its visible-label accessible name (getByRole(role,{name})) and toggle it — raw <label>-element clicks cannot drive react-aria's pointer-press in jsdom"

key-files:
  created:
    - frontend/src/components/ui/heroui-forms.test.tsx
  modified:
    - frontend/src/components/ui/heroui-forms.tsx
    - frontend/src/components/ui/heroui-chip.tsx

key-decisions:
  - "Test the toggle by resolving the control via its visible-label accessible name (getByRole) rather than clicking the <label> element, because jsdom cannot drive react-aria's press lifecycle; structural label→control association is asserted separately."
  - "Kept the literal `@heroui/react` token in the corrected chip docstring (to satisfy 'states there is no @heroui/react import'), so the loose text-grep count did NOT drop as the plan predicted — the import-specific protocol grep (8) is what matters and is unaffected."

patterns-established:
  - 'Wave-0 behavioral oracle imports ONLY the wrapper module (./heroui-forms), never @heroui/react, keeping the Phase 75 import-site count at 8.'

requirements-completed: [HEROUI-02]

# Metrics
duration: 16 min
completed: 2026-07-03
---

# Phase 78 Plan 02: Toggle wrappers → v3.2 \*.Content composition Summary

**Migrated `HeroUIFormCheckbox`/`HeroUIFormSwitch` to the shipped 3.2.1 `*.Content` anatomy (restoring the label→control click/a11y association the toggles refactor broke), proven by a committed vitest oracle that goes RED on the old markup and GREEN on the new, plus an honest `heroui-chip.tsx` docstring.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-07-03T00:52:00Z
- **Completed:** 2026-07-03T01:08:00Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Closed HEROUI-02's one real breaking change: the v3.2.0 toggles composition delta that tsc and the Phase 75 grep protocol are blind to.
- Landed a behavioral oracle (`heroui-forms.test.tsx`) — the exact test that would have caught this class of regression — demonstrably RED against the unmigrated markup on 3.2.1 and GREEN after migration.
- Migrated both toggle wrappers to `*.Content` with public API (`HeroUICheckboxFieldProps` / `HeroUISwitchFieldProps`), exports, and every other component in the file untouched.
- Corrected the false `heroui-chip.tsx` docstring (comment-only) to describe its actual cva + Radix Slot implementation.
- Kept all three edits in separate atomic commits, independently revertible and separate from the 78-01 bump.

## Task Commits

Each task was committed atomically:

1. **Task 1: failing toggles Content-composition oracle (RED)** — `b7c98c41` (test)
2. **Task 2: migrate toggle wrappers to v3.2 \*.Content composition (GREEN)** — `41c925c5` (feat)
3. **Task 3: correct heroui-chip.tsx docstring** — `47a6a75e` (docs)

_Note: Task 1's commit was amended in place (same commit slot, SHA `b7c98c41`) to carry the finalized oracle — see Deviation 1. It remains a standalone test-only commit, separate from the migration._

## Files Created/Modified

- `frontend/src/components/ui/heroui-forms.test.tsx` (created) — 4-behavior vitest oracle: checkbox label-named toggle fires onChange+flips checked; switch label-named toggle; checkbox Content wraps text+control in one `<label>`; description renders as a sibling outside the clickable label. Imports only from `./heroui-forms`.
- `frontend/src/components/ui/heroui-forms.tsx` (modified) — `HeroUIFormCheckbox` + `HeroUIFormSwitch` reworked to the `*.Content` anatomy: root keeps props + `min-h-11 sm:min-h-10` + caller className; `*.Content` wraps Control(+Indicator/Thumb) and the plain `{label}` text (checkbox: `flex items-start gap-3`; switch: `flex items-center justify-between gap-3` with label first); Description is a sibling of Content. Props/exports/other components unchanged.
- `frontend/src/components/ui/heroui-chip.tsx` (modified) — header docstring only: replaced the false "Real @heroui/react Chip primitive" claim with an honest cva + `@radix-ui/react-slot` Badge-replacement description that states it imports nothing from `@heroui/react`; Phase 33-05 provenance line kept; zero code/JSX/export edits.

## Verification Evidence

### Task 1 — RED (finalized oracle vs the UNMIGRATED markup on 3.2.1)

Verified by pathspec-stashing the migration and running the final test against the old markup:

```
 × HeroUIFormCheckbox … toggles selection when the control resolved by its visible label is clicked
 × HeroUIFormCheckbox … wraps the label text and the control in one clickable <label> (Content)
 × HeroUIFormSwitch   … toggles selection when the control resolved by its visible label is clicked

TestingLibraryElementError: Unable to find an accessible element with the role "checkbox" and name "Accept terms"
AssertionError: expected null not to be null
TestingLibraryElementError: Unable to find an accessible element with the role "switch" and name "Enable alerts"

 Tests  3 failed | 1 passed (4)
```

Non-vacuous: both label-named toggle tests fail (plus the Content-composition test). Under the old markup on 3.2.1 the control never renders an accessible `checkbox`/`switch` whose name is the visible label, so the toggle cannot be located or fired — the exact regression. The 1 pass is the description-sibling test (description sits outside a `<label>` in both compositions).

### Task 2 — GREEN + type-check

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

`pnpm --dir frontend type-check` → **exit 0**.

All 4 behaviors pass: checkbox label-named toggle (onChange(true) + checked), switch label-named toggle, checkbox Content wraps text+control in one `<label>`, description sibling outside the clickable label.

### Loose-grep side effect (RECORDED — diverges from the plan's predicted 12→11)

Consistent measurement (`git grep -lI "@heroui" <rev> -- frontend/src` filtered to `.ts/.tsx`):

- **Bump base `f0561afee` (78-02 base):** 12 files
- **HEAD (after these 3 commits):** 13 files

The plan predicted the chip docstring fix would drop the loose count 12→11. It did NOT, and the actual movement is **12→13**, for two reasons:

1. The corrected chip docstring **retains** the literal token `@heroui/react` (it must, to satisfy the acceptance criterion "states there is no @heroui/react import"), so `heroui-chip.tsx` still matches the loose grep — no −1.
2. The new `heroui-forms.test.tsx` contains one explanatory comment mention ("never from `@heroui/react` directly"), adding **+1** to the loose count. This is a comment, **not** an import: the import-specific protocol grep scores it **0**.

This reinforces the plan's own point — the loose `grep -rln "@heroui"` is noise (it counts docstrings and comments); the authoritative import-specific protocol grep is unaffected: `grep -rlnE "from ['\"]@heroui/react['\"]" frontend/src` still returns **8** files, and the test file is **not** among them. Plan 78-03 uses the import-specific grep, so its 8-file result is intact. Per the plan, no grep was "fixed" to compensate.

### Phase 75 protocol command #4 — expected new delta for plan 78-03

`grep -rn "Modal\.|Checkbox\.|Switch\.|Card\." <heroui-modal|heroui-forms|heroui-card>` now additionally emits, as an **expected, explainable** delta (not a failure):

```
heroui-forms.tsx:201:  <HeroUICheckbox.Content className="flex items-start gap-3">
heroui-forms.tsx:206:  </HeroUICheckbox.Content>
heroui-forms.tsx:253:  <HeroUISwitch.Content className="flex items-center justify-between gap-3">
heroui-forms.tsx:258:  </HeroUISwitch.Content>
```

(alongside the pre-existing `.Control` / `.Indicator` / `.Thumb` / `Card.*` lines). When plan 78-03 re-runs the protocol verbatim and diffs vs `75-AUDIT-heroui-confirmation.md`, these `Checkbox.Content` / `Switch.Content` lines are the expected addition to record, not a regression.

## Decisions Made

- **Toggle oracle uses accessible-name resolution, not a raw label click.** HeroUI's `*.Content` label is a react-aria _pressable_ (`data-react-aria-pressable`), not a native `<label for>`. jsdom cannot drive react-aria's pointer-press lifecycle, so `userEvent.click` on the `<label>` element is a no-op there (it works in a real browser — verified empirically via a throwaway scratch test). The test instead locates the control by its visible-label accessible name (`getByRole('checkbox'|'switch', { name })`) and toggles it — which only resolves under the Content association — and asserts the structural label→control wrapping separately. This is the standard testing-library idiom and a faithful proxy for "clicking the visible label toggles selection."
- **Kept `@heroui/react` token in the chip docstring** to satisfy the "states there is no @heroui/react import" acceptance criterion, accepting the loose-grep divergence (documented above) rather than weakening the docstring to chase a soft prediction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Oracle refined so it can go GREEN — jsdom cannot drive react-aria's label press**

- **Found during:** Task 2 (GREEN). The Task-1 oracle as first committed clicked the visible label element (`getByText('Accept terms')`) and asserted `onChange`. After migration this stayed RED because HeroUI's `Checkbox.Content` uses react-aria press, which jsdom does not simulate — a raw `<label>`-element click fired `onChange` 0 times (confirmed via a throwaway scratch test; clicking the accessible control did fire `onChange([true])`).
- **Issue:** The literal label-element-click could never go GREEN in jsdom — it would be a false BLOCKER, not a real product bug (the label press works in a real browser).
- **Fix:** Rewrote the two toggle tests to resolve the control by its visible-label accessible name (`getByRole('checkbox'|'switch', { name })`) and click that, keeping the structural label→control wrapping and description-sibling assertions. Re-verified the finalized oracle is RED against the old markup (pathspec-stash) and GREEN after migration. The corrected oracle was folded into the standalone Task-1 test commit via `git commit --amend` (SHA `b7c98c41`), keeping the migration commit purely `heroui-forms.tsx`.
- **Files modified:** frontend/src/components/ui/heroui-forms.test.tsx
- **Verification:** RED 3 failed | 1 passed on old markup; GREEN 4 passed on new markup; type-check exit 0; protocol grep #1 = 8, test-file import-grep = 0.
- **Committed in:** `b7c98c41` (Task 1 commit, amended)

**2. [Rule 1 - Documentation] Loose-grep side effect diverged from plan prediction (12→13, not 12→11)**

- **Found during:** Task 3 (docstring) verification.
- **Issue:** The plan's SUMMARY note anticipated the loose `grep -rln "@heroui"` dropping 12→11. It actually moved 12→13.
- **Fix:** None required — reported honestly (see "Loose-grep side effect" above). Cause: the corrected chip docstring must keep the `@heroui/react` token (acceptance criterion), and the new test file adds one comment mention. The authoritative import-specific protocol grep is unaffected (8), so plan 78-03's diff is intact.
- **Files modified:** none (reporting only)
- **Verification:** import-specific grep #1 = 8; test file import-grep = 0.
- **Committed in:** n/a (documentation)

---

**Total deviations:** 2 (1 Rule-1 bug auto-fixed in the test artifact, 1 Rule-1 documentation reconciliation).
**Impact on plan:** No scope creep. The migration, public API, and the three-commit atomic structure are exactly as planned; the oracle refinement makes the committed test a valid RED→GREEN oracle, and the loose-grep divergence is a recorded reporting nuance that does not affect the protocol grep or plan 78-03.

## Issues Encountered

None blocking. The jsdom/react-aria press limitation was diagnosed with a throwaway scratch test (created, used, deleted — never committed) and resolved by the accessible-name oracle above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HEROUI-02's real breaking change is closed with a committed behavioral oracle; type-check exit 0; all 4 behaviors GREEN.
- Plan 78-03 (Phase 75 protocol re-run): expect the import-specific grep #1 to still return **8** and command #4 to gain the `Checkbox.Content` / `Switch.Content` lines shown above (record as expected delta). The loose text grep now reads 13, not the protocol number — 78-03 must use the import-specific grep.
- No consumers of `heroui-forms.tsx` exist yet (module is "for new forms"); the migration prevents the next consumer inheriting a broken pattern.

---

_Phase: 78-heroui-v3-api-audit-bump_
_Completed: 2026-07-03_
