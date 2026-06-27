# Impl brief — L6-dossier-wizard (create-wizard validation + office_type) · priority 7 (validation)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (5) — touch ONLY these:**
`frontend/src/components/Dossier/wizard/hooks/useCreateDossierWizard.ts` ·
`frontend/src/components/ui/form-wizard.tsx` ·
`frontend/src/components/Dossier/wizard/config/engagement.config.ts` ·
`frontend/src/components/Dossier/wizard/steps/OfficeTermStep.tsx` ·
`frontend/src/components/Dossier/wizard/config/person.config.ts`.

**Scope note:** dossier **create** only. The dossier **edit** path (A-1 build edit surface, A-2
rewrite `dossiers-update`) is NEEDS-DECISION — do NOT touch `dossiers-update/index.ts` or
`dossier-api.ts` here. Extension-table routing in `dossiers-create` is already correct (verified) —
do not change it.

---

### A-3 ≡ E-5 (HIGH) — wizard never validates before submit

Verified: `useCreateDossierWizard.ts:146` `canComplete = name length only`; `:78` `handleComplete`
reads `form.getValues()` with no `form.trigger()`; `form-wizard.tsx:191-210` `goNext` only validates
`if (currentStepConfig?.validate)` and **no step supplies `validate`**. So every per-type required Zod
rule (ISO codes, `theme_category`, nationality, office/term) is unenforced → incomplete records persist
or surface as 500s (e.g. `topics.theme_category` has a CHECK + no default). Fix:

1. In `handleComplete` (`useCreateDossierWizard.ts:78`): `const ok = await form.trigger(); if (!ok)
return` (abort + let RHF surface errors) before building values.
2. Gate the Complete button on `form.formState.isValid` (alongside the existing name check).
3. In `form-wizard.tsx`: have `goNext` run the step's `validate` when present, and add per-step
   `validate: () => form.trigger(stepFields)` wiring so "Next" validates the current step's fields.

This also resolves **A-5** (person/elected `nationality_id`/`country_id`/`term_start` silent NULLs) —
once `form.trigger()` runs, the existing `person.schema.ts` "required" rules are enforced; no schema
edit needed. Commit: `fix(dossier-wizard): enforce zod validation before complete + per-step Next (A-3/E-5/A-5)`.

### A-4 (HIGH) — engagement participants silently dropped

`engagement.config.ts:73` `postCreate` catches the `engagement_participants` insert error and only
`console.warn`s (`:89`) — never rethrows. The compensating `toast.warning` in
`useCreateDossierWizard.ts:101-113` fires **only if postCreate throws**, so it never fires: on any
RLS/CHECK failure the participants vanish under a success toast. **Rethrow** from `postCreate` after
logging, so the hook's warning toast fires (insert columns are already correct). Commit:
`fix(dossier-wizard): rethrow engagement participants insert failure (A-4)`.

### A-6 (MED) — elected_official `office_type` never collected

`office_type` is declared required on `ElectedOfficialExtension` but `OfficeTermStep.tsx` has no field
and `person.config.ts:187-240` `filterExtensionData` never sends it → every elected official persists
`persons.office_type = NULL`. Add an `office_type` `<Select>` to `OfficeTermStep.tsx` (use the existing
allowed `office_type` values) and map it in `electedOfficialWizardConfig.filterExtensionData`. Commit:
`feat(dossier-wizard): collect elected_official office_type (A-6)`.

_Opportunistic (LOW A-9, OfficeTermStep.tsx): add `aria-required` to the required `country`/`term_start`
controls (or use `FieldLabelWithHelp … required` like the person step). (A-8 lives in
SharedBasicInfoStep.tsx — NOT in this lane; leave it to the deferred sweep.)_

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint src/components/Dossier/wizard/hooks/useCreateDossierWizard.ts src/components/ui/form-wizard.tsx src/components/Dossier/wizard/config/engagement.config.ts src/components/Dossier/wizard/steps/OfficeTermStep.tsx src/components/Dossier/wizard/config/person.config.ts`.
- **A-3 acceptance:** attempt to complete a `topic` dossier with no `theme_category`, or a `person`
  with no nationality → the wizard blocks with field errors instead of submitting. A complete,
  valid dossier of each affected type still submits.
- **A-6:** creating an elected_official persists a non-null `persons.office_type` (read-only SQL).

## Done-when

All items applied; tsc/eslint green; the wizard cannot submit an invalid per-type form; participants
failures surface; office_type is captured; commits atomic; nothing pushed.
