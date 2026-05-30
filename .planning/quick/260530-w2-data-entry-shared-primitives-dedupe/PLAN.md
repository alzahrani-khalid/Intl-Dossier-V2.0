---
quick_id: 260530-w2
slug: data-entry-shared-primitives-dedupe
date: 2026-05-30
branch: fix/data-entry-uiux-polish
wave: 2 of 4 (data-entry UI/UX polish sweep)
---

# Wave 2 — Cross-cutting consistency + shared primitives

From the 2026-05-30 data-entry UI/UX audit. Highest-leverage wave: fix shared
primitives + consolidate duplicates so downstream fix-sites collapse. Executed in
two parts (P1 first = after-action; then P2 = primitives) — disjoint file sets.

## Verified facts (do not re-derive)

- `@theme` in `frontend/src/index.css` maps shadcn utilities to IntelDossier tokens
  (`--color-primary:var(--accent)`, `--color-foreground:var(--ink)`,
  `--color-border:var(--line)`, `--color-muted:var(--surface)`, etc.). These classes are
  ON-BRAND — do NOT flag/replace them.
- Radius tokens exist: `--radius-sm`(8) `--radius`(12) `--radius-lg`(16). **`rounded-field`
  is undefined** (no `--radius-field`). Web RTL: `flex-direction:row` already follows inline
  dir, so `isRTL && 'flex-row-reverse'` is a DOUBLE-FLIP bug; directional-icon flips
  (`rotate-180`/`scaleX(-1)`) are correct and must stay.
- **Dedupe is safe.** `src/components/after-action/` contains ONLY 3 dead duplicate files
  with ZERO importers (incl. tests): `AfterActionForm.tsx`, `DecisionList.tsx`,
  `CommitmentList.tsx`. The LIVE trio (keep) = `after-action-form/AfterActionForm.tsx`
  (imported by route `engagements/$engagementId/after-action.tsx`),
  `decision-list/DecisionList.tsx`, `commitment-editor/CommitmentEditor.tsx`.

---

## PART A (executor W2-1) — After-action consolidation + internal fixes

Touches ONLY: `src/components/after-action/**` (delete), the live trio +
`risk-list/RiskList.tsx` + `follow-up-list/FollowUpList.tsx`, the after-action detail
route, and a NEW shared date util. Disjoint from Part B.

### A1. Delete dead duplicate dir

- `git rm` the whole `src/components/after-action/` directory (3 files). Confirm with
  `knip`/build that nothing breaks (zero importers confirmed).
- Commit: `refactor(after-action): delete dead duplicate AfterActionForm/DecisionList/CommitmentList`

### A2. RTL double-flip removal (P1)

On each LIVE file remove `isRTL && 'flex-row-reverse'` (and `isRTL ? 'flex-row-reverse'`)
from CONTAINERS; let `dir=rtl` auto-reverse. KEEP directional-icon flips. Sites:

- `after-action-form/AfterActionForm.tsx:327`
- `decision-list/DecisionList.tsx:56,73,77`
- `commitment-editor/CommitmentEditor.tsx:93,110,114`
- `risk-list/RiskList.tsx:74,103,107`
- `follow-up-list/FollowUpList.tsx:54,74`
  Re-verify each line in the current files (numbers may have shifted). For each removed
  flip, confirm no icon-only flip was removed by mistake.
- Commit: `fix(after-action): remove RTL flex-row-reverse double-flips on row containers`

### A3. aria-required on required inputs (P1/a11y)

Add `aria-required="true"` (keep existing HTML `required`) to required controls in the
live trio (attendees, decision description+decision_maker+decision_date, commitment
description+owner+priority+due_date). Asterisk stays visual (aria-hidden).

- Commit: `fix(after-action): add aria-required to required fields`

### A4. Shared day-first date util

- Create `frontend/src/lib/format-date.ts` exporting:
  - `formatDayFirst(date: Date | string | number, locale?: string): string` -> `Tue 28 Apr`
    (day-first, no comma; Arabic-Indic digits when locale ar). Reuse existing
    `toArDigits` if present (used in AfterActionsTable); otherwise replicate minimally.
  - `formatTime(date, locale?): string` -> `14:30 GST` style.
  - Explicit return types; no `any`.
- Replace `'PPP'` (date-fns) usages with `formatDayFirst`:
  `after-actions/$afterActionId.tsx`, `decision-list/DecisionList.tsx`,
  `commitment-editor/CommitmentEditor.tsx`, `follow-up-list/FollowUpList.tsx`.
  (Keep date-PICKER calendars as-is; only the DISPLAY formatting changes.)
- Commit: `refactor(dates): add shared formatDayFirst/formatTime util, apply to after-action`

---

## PART B (executor W2-2) — Shared primitives + dossier/intake/briefs

Run AFTER Part A (Part B step B5 uses the date util from A4). Touches: `ui/**`,
`dossier/**`, `intake/**`, `briefing-books/**`, `engagements/EngagementBriefsSection.tsx`,
a new hook. Disjoint from Part A files.

### B1. Radius pass (design-conformance)

- `index.css`: do NOT add `--radius-field`. Confirm `rounded`/`rounded-sm`/`rounded-md`
  resolve via @theme (`--radius`/`--radius-sm`; if `--radius-md` missing, use `rounded`).
- Base primitives: `ui/input.tsx`, `ui/textarea.tsx` — add `rounded` (12px) to the base
  class so all downstream inputs inherit a radius.
- `ui/select.tsx` — replace inline `rounded-[var(--radius-sm)]`/`rounded-[var(--radius)]`
  with `rounded-sm`/`rounded` utilities.
- `intake-form/IntakeForm.tsx` + `type-specific-fields/TypeSpecificFields.tsx` — replace
  every `rounded-field` with `rounded`.
- Commit: `fix(ui): replace dead rounded-field/inline-radius with @theme radius utilities`

### B2. aria-required threading + consistent required marking (a11y/consistency)

- `ui/form.tsx` `FormControl`: thread a `required`/`aria-required` so wrapped inputs get
  `aria-required` automatically (don't break existing API).
- Adopt `FieldLabelWithHelp required` (or add `aria-required`) in
  `dossier/wizard/steps/EngagementDetailsStep.tsx` (lines ~64,92,124,137) and
  `OfficeTermStep.tsx` (~96-99,252-255), replacing manual `FormLabel`+`*`.
- `work-creation/DossierPicker.tsx` — add `aria-label` to the CommandList listbox (~330).
- Commit: `fix(a11y): thread aria-required through FormControl; unify required-field marking`

### B3. CreateDossierHub card shadow (design-conformance)

- `pages/dossiers/CreateDossierHub.tsx:~119` — replace `hover:shadow-lg` with
  `hover:border-primary` (no card shadows per canon). Keep focus ring.
- Commit: `fix(dossier): drop card hover-shadow per design canon`

### B4. Unsaved-changes guard (ux-completeness)

- Create `frontend/src/hooks/useUnsavedChangesGuard.ts`:
  `useUnsavedChangesGuard(isDirty: boolean): void` -> `beforeunload` listener (and TanStack
  Router block if trivially available; otherwise beforeunload only). Explicit return type.
- Apply to `briefing-books/BriefingBookBuilder.tsx` (dirty config; warn on step-back/cancel
  via an AlertDialog "Discard changes?" — or at minimum beforeunload) and the after-action
  new-record route `engagements/$engagementId/after-action.tsx` (dirty form).
- Commit: `feat(ux): add useUnsavedChangesGuard; apply to brief builder + after-action route`

### B5. Briefs date formatting

- `engagements/EngagementBriefsSection.tsx:~142-149` — replace `en-US` date formatting with
  `formatDayFirst` from `@/lib/format-date` (created in A4).
- Commit: `fix(briefs): use shared day-first date formatting`

---

## Verification (BOTH parts, before each commit)

- `cd frontend && pnpm lint` (eslint --max-warnings 0) PASS — watch unused vars.
- `cd frontend && pnpm type-check` PASS.
- Build runs in the pre-commit hook (must pass). `--no-verify` is BLOCKED.
- Code style: no semicolons, single quotes, trailing-comma all, explicit return types,
  no `any`, strict-boolean-expressions. Tokens only (no raw hex / Tailwind color literals).
- GateGuard fact-forces the FIRST edit/write per file -> present 4 facts, retry once.
- Do NOT push / open PR. Write SUMMARY.md per part with commit hashes + lint/type/build evidence.
