# Follow-up: Unify divergent form strategy (RHF FormField compound + token primitives)

Created: 2026-05-30
Origin: Wave 3 deferral (`.planning/quick/260530-w3-data-entry-per-surface-ux/PLAN.md`)
Branch context: `fix/data-entry-uiux-polish`
Priority: P2

## Problem

Data-entry surfaces use inconsistent form strategies, which fragments validation,
error display, accessibility, and visual fidelity:

- `IntakeForm` is hand-rolled (manual state / ad-hoc field wiring) rather than the
  React Hook Form `FormField`-compound pattern used by the work-creation forms
  (e.g. `IntakeQuickForm`).
- `TriagePanel` renders raw `<select>` / `<button>` elements instead of the
  token-bound primitives (`Input` / `Select` / `Button`) that resolve their
  color, spacing, radius, and row-height from the design tokens.

The result is divergent error UX, inconsistent keyboard/ARIA handling, and chrome
that does not match the IntelDossier prototype.

## Desired state

1. Migrate `IntakeForm` to the RHF `FormField`-compound pattern (the same shape the
   work-creation forms already use), so validation, error messaging, and submit
   handling are consistent across intake create paths.
2. Replace `TriagePanel`'s raw `<select>` / `<button>` with the token-bound
   primitives (`Input` / `Select` / `Button`), inheriting design-token chrome —
   no raw hex, no Tailwind color literals, borders `1px solid var(--line)`,
   row heights via `var(--row-h)`.
3. Verify both surfaces render correctly in LTR and RTL after migration.

## Open questions / dependencies

- Confirm the shared `FormField` compound API covers every field type IntakeForm
  needs (type-specific fields, attachments note, SLA preview) before migrating.
- Ensure no regression to the unified submit-button label/variant standardized in
  Wave 4 E5 (`intake:actions.submitRequest`).

## Touch points

- `frontend/src/components/intake-form/IntakeForm.tsx`
- `frontend/src/components/triage-panel/TriagePanel.tsx`
- Shared RHF `Form` / `FormField` primitives and token-bound `Input` / `Select` / `Button`
