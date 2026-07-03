---
phase: 78-heroui-v3-api-audit-bump
reviewed: 2026-07-03T01:56:14Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - frontend/src/components/ui/heroui-forms.tsx
  - frontend/src/components/ui/heroui-forms.test.tsx
  - frontend/src/components/ui/heroui-chip.tsx
  - frontend/package.json
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 78: Code Review Report

**Reviewed:** 2026-07-03T01:56:14Z
**Depth:** deep (cross-file: library source, styles, react-aria internals, consumer graph, ESLint config, live test run)
**Files Reviewed:** 4 (`heroui-forms.tsx`, `heroui-forms.test.tsx`, `heroui-chip.tsx`, `package.json`) — `pnpm-lock.yaml` cross-checked for resolution consistency
**Status:** clean

## Summary

The Phase 78 source changes are a lockstep `@heroui/react` + `@heroui/styles` `3.0.5 → 3.2.1`
bump plus the mandatory `*.Content` migration of the two toggle wrappers
(`HeroUIFormCheckbox`, `HeroUIFormSwitch`), a new behavioral test oracle, and a docstring
correction. I verified the migration against the installed library source rather than trusting
the diff. It is correct on every axis the task called out. No CRITICAL, HIGH, or MEDIUM defects.

Verification performed (not just read):

- **Anatomy is exactly right.** `frontend/node_modules/@heroui/react/dist/components/checkbox/checkbox.js:42-62` and `.../switch/switch.js:39-59` document and implement the required shape: `Content` is the clickable `CheckboxButton`/`SwitchButton` `<label>` that wraps Control+Indicator/Thumb + the label text, and `Description`/`FieldError` must be **siblings** of `Content`. The migrated JSX (`heroui-forms.tsx:201-207`, `253-259`) matches this verbatim.
- **The migration is load-bearing, not cosmetic.** In react-aria-components (`react-aria-components/dist/private/Checkbox.mjs:220-268`) the hidden `<input>` is rendered _inside_ `CheckboxButton` (= `Checkbox.Content`). The pre-migration markup had no `Content`, so on 3.2.1 it would have rendered **no functional input at all** — the exact silent, tsc-invisible regression the bump introduced. The migration restores it. No a11y regression; it is an a11y _fix_.
- **No separate label slot exists in v3.2.** The checkbox/switch style slot sets are `{base, content, control, indicator}` and `{base, content, control, thumb, icon}` — there is no `label` slot. Placing bare `{label}` directly inside `Content` (styled by the `checkbox__content` / `switch__content` BEM class) is the correct v3.2 idiom; wrapping it in a `<Label>` would have been wrong. Dropping the old `<HeroUILabel>` wrapper is correct, not a typography regression.
- **Tests are non-vacuous and GREEN.** `pnpm exec vitest run heroui-forms.test.tsx` → 4/4 passed on 3.2.1. Imports come only from `./heroui-forms` (import-site count preserved), assertions resolve the control by accessible name (`getByRole('checkbox'|'switch', { name })`), assert `toBeChecked()` after `userEvent.click`, and assert the description is a non-`<label>` sibling. All assertions are structurally justified by the react-aria source (input nested in the `Content` `<label>`).
- **Public API unchanged.** `HeroUICheckboxFieldProps` (`heroui-forms.tsx:155-176`) and `HeroUISwitchFieldProps` (`215-232`) are byte-identical to pre-phase; the non-toggle components (`HeroUIFormTextField`, `HeroUIFormTextArea`), the primitive re-exports (`269-279`), and the type aliases (`282-285`) are untouched.
- **RTL & tokens clean.** The only classes moved/added are `min-h-11 sm:min-h-10`, `flex items-start gap-3`, `mt-0.5`, `flex items-center justify-between gap-3`, `text-xs`. None are physical inline-axis utilities (no `ml/mr/pl/pr/text-left/text-right`); all are direction-agnostic. No raw hex, no Tailwind color literals, no new button variants, no card drop-shadows.
- **TS quality clean.** No `console.*`/`debugger`/TODO, no `any`/`as any`, and the awaited `userEvent.click` calls carry no floating promises. The frontend ESLint override (`eslint.config.mjs:109-113`) disables return-type/`any`/floating-promise rules for `frontend/**`, so the wrappers and test lint clean.
- **Bump is consistent.** `package.json` changes only the two `@heroui/*` lines to `3.2.1`; `pnpm-lock.yaml` resolves `@heroui/react@3.2.1` and `@heroui/styles@3.2.1`, and `node_modules` confirms both installed at 3.2.1. Lockstep versions maintained.
- **No sibling breakage.** The only compound HeroUI toggle consumer in `frontend/src` is `heroui-forms.tsx`. `heroui-switch.tsx` (51 consumers) is a hand-rolled `<button role="switch">` with no HeroUI dependency and is unaffected. No other file uses the old `*.Control`/`*.Thumb` anatomy that the bump would have silently broken. Zero live consumers pass `HeroUIFormCheckbox`/`HeroUIFormSwitch` at all.
- **Docstring correction is accurate.** `heroui-chip.tsx` imports only `class-variance-authority`, `@radix-ui/react-slot`, `react`, and `@/lib/utils` — it genuinely imports nothing from `@heroui/react`, so the corrected docstring is truthful.

## Info

### IN-01: Description now renders full-width below the Content row (correct-by-anatomy, zero live impact)

**File:** `frontend/src/components/ui/heroui-forms.tsx:207, 259`
**Issue:** For both toggles the `description` moved from a column beside/under the label into a
full-width sibling **below** the entire `Content` row. This is a deliberate, unavoidable
consequence of the correct v3.2 anatomy (`Description` cannot live inside the `Content`
`<label>` without becoming part of the toggle's pressable/accessible name). There are currently
**zero** consumers of these two wrappers and none pass `description`, so there is no runtime or
visual impact today. Flagging only so a future consumer isn't surprised by the layout when
`description` is first used.
**Fix:** None required. If a future design calls for the old beside-the-label placement, wrap the
label text in an inner element inside `Content` and position the description via the `content`
slot layout — but keep `Description` a sibling of `Content` (never inside it).

### IN-02: Switch test coverage is asymmetric with Checkbox

**File:** `frontend/src/components/ui/heroui-forms.test.tsx:71-83`
**Issue:** The Checkbox suite has three tests (toggle-by-label, structural "label wraps control",
and "description is a non-`<label>` sibling"); the Switch suite has only the toggle-by-label test.
The Switch's structural anatomy and its description-sibling placement are not directly asserted.
Because the two wrappers are structurally analogous and the Checkbox tests prove the shared
`Content` anatomy while the Switch toggle test proves the Switch's label→control association, the
gap is low-risk — but a Switch-specific regression in description placement would not be caught.
**Fix:** Optional. Mirror the two Checkbox structural tests for `HeroUIFormSwitch` (a `getByRole('switch').closest('label')` containing `input[type="checkbox"]`, and a `description.closest('label')` toBeNull assertion) for symmetric coverage.

---

_Reviewed: 2026-07-03T01:56:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
