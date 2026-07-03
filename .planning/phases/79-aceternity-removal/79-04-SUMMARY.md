---
phase: 79-aceternity-removal
plan: 04
subsystem: ui
tags: [react, cmdk, radix, heroui, aria, combobox, a11y, rtl, bundle-size]

# Dependency graph
requires:
  - phase: 79
    provides: '79-01 Wave-0 a11y baseline (T-79-01/02/03 verdicts); 79-02 dead-component deletion; 79-03 registry + residue purge'
  - phase: 78
    provides: HeroUI v3.2.1 Button primitive used as the trigger recipe
provides:
  - 'Rebuilt SearchableSelect: variant/motion/rgba-free on retained HeroUI v3 Button + Radix Popover + cmdk'
  - 'Restored + strengthened Phase-75 ARIA contract (role=combobox, aria-invalid/required, valid aria-controls, named popover)'
  - 'ACET-01 + ACET-02 fully proven: zero aceternity in .ts/.tsx, import ban green, bundle held'
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "`Button asChild` + plain <button> to forward role/aria-invalid/aria-required that @heroui/react Button's filterDOMProps drops"
    - "Mirror cmdk's runtime-owned listbox id onto the trigger aria-controls on open (cmdk hardcodes its own id after the props spread)"

key-files:
  created: []
  modified:
    - frontend/src/components/forms/SearchableSelect.tsx
    - frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx

key-decisions:
  - "KEPT cmdk + Radix Popover + HeroUI v3 Button; REJECTED HeroUI/RAC ComboBox (can't preserve the trigger-Button combobox contract; heroui-vendor budget 9 kB)"
  - "Expanded scope beyond the plan to RESTORE T-79-02 (stripped trigger ARIA) and FIX T-79-03 (unnamed popover) — both are Phase-78 regressions that 'preserving the Phase-75 contract' (ACET-01) requires fixing"

patterns-established:
  - 'Isolated-component a11y contract test drives the rebuild; both Wave-0 skips unskipped and green'

requirements-completed: [ACET-01, ACET-02]

# Metrics
duration: ~50min
completed: 2026-07-03
---

# Phase 79-04: Rebuild SearchableSelect — Aceternity fully gone, a11y contract restored

**SearchableSelect rebuilt in place — variant/`motion/react`/rgba-shadow-free on the retained HeroUI v3 Button + Radix Popover + cmdk — with the full Phase-75 ARIA/keyboard/validation contract not just preserved but genuinely restored (Phase-78 had silently stripped 3 attributes and left the popover unnamed). Aceternity is provably gone; all REQUIRED gates green.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-07-03T12:05:00Z
- **Tasks:** 2 (rebuild; fully-gone proof + gates)
- **Files modified:** 2

## Accomplishments

- Stripped every Aceternity vector from `SearchableSelect.tsx`: the `variant?: 'default' | 'aceternity'` prop and its path, `aceternityTriggerClasses` (hard-coded rgba box-shadow literals — Linear design-rule violations), and all `motion/react` usage (`m.label`/`m.p`/`AnimatePresence` → plain elements; chevron rotation stays a CSS transition).
- **Restored the ARIA contract Phase 78 broke** (Wave-0 findings), making the Phase-75 contract genuinely hold:
  - **T-79-02:** trigger now renders as a plain `<button>` via `Button asChild`, so `role="combobox"` + `aria-invalid` + `aria-required` reach the DOM (the `@heroui/react` Button element dropped them via React-Aria `filterDOMProps`). `aria-controls` mirrors cmdk's real listbox id on open (cmdk hardcodes its own id after the props spread, so the old static reference never matched) — a valid link, not a dangling one.
  - **T-79-03:** `PopoverContent` given an `aria-label` — fixes the serious axe `aria-dialog-name` on the open state.
  - **T-79-01:** clear affordance preserved verbatim (Wave-0 proved NOT flagged).
- **a11y test fully green with ZERO skips** — both Wave-0 `it.skip`s (T-79-02, T-79-03) unskipped and passing; contract _preserved and proven_, not merely present.

## Task Commits

1. **Task 1: rebuild + restore contract + unskip tests** — `6e7c23d3` (refactor)
2. **Task 2: fully-gone proof + gates** — verification only (no code changes; nothing to commit)

## Files Created/Modified

- `frontend/src/components/forms/SearchableSelect.tsx` — de-Aceternity + ARIA restore (94 ins / 103 del).
- `frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` — unskipped T-79-02/T-79-03; `getTrigger` now targets `role="combobox"`; T-79-02 asserts the real post-open aria-controls↔listbox link.

## T-79-01 resolution

Clear affordance **preserved verbatim** — the `<span role="button">` (no tabindex) is not treated as nested-interactive by axe (79-01 evidence). No restructure to a sibling was needed.

## Fully-gone proof (all zero)

- `variant="aceternity"`, case-sensitive `Aceternity` in src+tests, `components.json` aceternity, `from 'aceternity'`/`@aceternity` imports, and forms/_Aceternity_/SmartInput/FormFieldWithValidation files: **0 each**.
- Strict `grep -rni "aceternity" frontend/src --include="*.tsx" --include="*.ts"`: **0**. (The only literal-"aceternity" left repo-wide is `frontend/src/components/ui/COMPONENT_REGISTRY.md`, a `.md` **ban doc** — excluded by the .ts/.tsx-scoped proof, correct/intentional like `eslint.config.mjs`.)

## Gates

- `pnpm exec tsc --noEmit`: **0 errors**.
- `pnpm lint` (eslint `frontend/src/**` + i18n + duplicate-rtl + bootstrap-parity, `--max-warnings 0`): **exit 0** — inverted `no-restricted-imports` Aceternity ban green.
- Full `vitest run`: **1440 passed / 25 todo**, only 1 failure — `tests/accessibility/waiting-queue-a11y.test.tsx > T091-07` — which is **pre-existing** (fails in isolation, no dependency on this phase; documented in 79-02 SUMMARY). `CreateTaskCtas.test.tsx` (UserPicker facade guard) **7/7 green**.
- `pnpm build && pnpm exec size-limit`: **exit 0, zero `exceeded` lines.**

### Bundle size (size-limit, gzipped) — all under budget, HeroUI held

| Bundle                | Size        | Limit    |
| --------------------- | ----------- | -------- |
| Initial JS (entry)    | 471.84 kB   | 476 kB   |
| React vendor          | 61.08 kB    | 285 kB   |
| TanStack vendor       | 58.17 kB    | 63 kB    |
| **HeroUI vendor**     | **3.56 kB** | **9 kB** |
| Sentry vendor         | 3.94 kB     | 9 kB     |
| DnD vendor            | 16.55 kB    | 22 kB    |
| Copilot vendor (lazy) | 137.12 kB   | 145 kB   |
| Total JS              | 2.65 MB     | 2.78 MB  |

HeroUI vendor at 3.56/9 kB confirms the ComboBox-rejection decision held the budget (no `@heroui` ComboBox import). Direction: held/reduced (phase deleted 7 components + `motion/react` usage from this file).

## Deviations from Plan

- **Scope expansion (justified, within ACET-01):** the plan (written before 79-01's evidence) assumed the 12-ARIA contract already reached the DOM and only needed _not regressing_. 79-01 proved 3 attributes were stripped (T-79-02) and the popover unnamed (T-79-03) by the Phase-78 primitive migration. "Preserving the Phase-75 captured contract" therefore required _restoring_ them. Handled inside this plan's files (SearchableSelect + its test) with no new deps.
- **T-79-02 test assertion corrected (not weakened):** the original 79-01 assertion (`listbox.id === aria-controls captured while closed`) is structurally unsatisfiable — cmdk owns/overrides the listbox id and Radix unmounts the popover on close, so no stable closed-state id can match. Replaced with the genuinely-correct check: once open, the trigger's (synced) `aria-controls` equals the real listbox id. This is a stronger, real assertion, not a relaxation.

## Security flag (per plan output requirement)

- **T-79-S2 (future hardening, NOT this phase):** `UserPicker.handleSearch` interpolates the raw query into a PostgREST `.or('full_name.ilike.%${query}%,…')` filter string — injects PostgREST filter syntax (not SQL). Facade is frozen this phase (byte-untouched). Harden later via `.ilike()` builder calls or by sanitizing `,().` from the query. RLS still bounds visibility.

## Next Phase Readiness

- v8.0 Linear DS Migration: only **Phase 80 (final full-route verification)** remains. Aceternity is fully removed; the live SearchableSelect/UserPicker path is contract-proven and RTL/Linear-clean.

---

_Phase: 79-aceternity-removal_
_Completed: 2026-07-03_
