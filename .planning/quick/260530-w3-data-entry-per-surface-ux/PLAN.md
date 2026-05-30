---
quick_id: 260530-w3
slug: data-entry-per-surface-ux
date: 2026-05-30
branch: fix/data-entry-uiux-polish
wave: 3 of 4 (data-entry UI/UX polish sweep)
---

# Wave 3 — Per-surface UX / a11y completeness

From the 2026-05-30 audit. P1-heavy, pure frontend, disjoint files per surface.
Items already done in Wave 2 (DossierPicker aria-label, aria-required threading,
unsaved-guard) are NOT repeated here.

## Intake / Tickets

### I1. IntakeForm inline error states + aria (P1, UX-001)

File: `components/intake-form/IntakeForm.tsx`. The form already uses RHF (`register`,
`errors`). For each of the 6 fields (requestType, title, titleAr, description,
descriptionAr, urgency): add `aria-invalid={!!errors.X}` and
`aria-describedby="X-error"` to the control; give the error `<p>` `id="X-error"`;
add a visual error state (e.g. `aria-[invalid=true]:border-destructive` or conditional
`border-destructive`) to the control. Do NOT do a full FormField-compound rewrite
(that P2 consistency refactor is deferred).

- Commit: `fix(intake): add aria-invalid + visual error states to create-form fields`

### I2. Replace alert() with inline error (P1, UX-002)

File: `components/triage-panel/TriagePanel.tsx` (~L80-82). Replace the `alert()` on empty
override reason with an inline error state (add `const [reasonError, setReasonError]`),
rendered as a destructive alert box above the Reason field (mirror the existing banner
~L294-298). Clear it when the user types. Also: move the override-reason label asterisk
INTO the `t()` string and add `aria-required="true"` to the textarea (A11Y-001).

- Commit: `fix(intake): replace alert() with inline triage override error + aria-required`

### I3. Gate the dev "Fill Mock" button (P1, UX-003)

File: `components/intake-form/IntakeForm.tsx` (~L389-408). Wrap the Fill Mock button in
`{import.meta.env.DEV && ( ... )}` (Vite dev flag). Do NOT use process.env.NODE_ENV.

- Commit: `fix(intake): gate dev-only Fill Mock button behind import.meta.env.DEV`

## Dossier wizards

### D1. EngagementDetailsStep HTML5 required -> Zod (P2, consistency)

File: `components/dossier/wizard/steps/EngagementDetailsStep.tsx` (~L124,137). Remove the
HTML5 `required` on the start/end date inputs; the engagement Zod schema already requires
them (verify in `schemas/engagement.schema.ts`). If the schema does NOT already require
start_date/end_date, add them to the schema instead of relying on the HTML attribute.
Keep the visual required marker consistent with W2 (aria-required already added).

- Commit: `fix(dossier): validate engagement dates via Zod, drop HTML5 required`

## After-action

### A1. AI-extraction dedupe + toast (P1)

File: `components/after-action-form/AfterActionForm.tsx` (`handleAIExtraction`, ~L146-169).
Before appending extracted decisions/commitments/risks, dedupe against existing rows by a
stable key (id if present, else normalized description hash). Show a toast like
"Added {n}, skipped {m} duplicates" (use the app's existing toast util — find how other
components toast; e.g. sonner/`useToast`). i18n the toast.

- Commit: `fix(after-action): dedupe AI-extracted rows + summary toast`

### A2. Destructive-delete confirm dialogs (P2)

Files: `decision-list/DecisionList.tsx`, `commitment-editor/CommitmentEditor.tsx`,
`risk-list/RiskList.tsx`, `follow-up-list/FollowUpList.tsx`. Wrap each row "Remove"/trash
button in an `@/components/ui/alert-dialog` "Remove this item?" confirm; only remove on
confirm. i18n the dialog copy. Keep it DRY if a tiny shared confirm wrapper is clean;
otherwise per-list is fine.

- Commit: `fix(after-action): confirm before removing decision/commitment/risk/follow-up rows`

### A3. FollowUpList date constraints (P2)

File: `follow-up-list/FollowUpList.tsx`. The target-date picker has no min/max (decisions =
past-only, commitments = future-only). Add a sensible `disabled` predicate (target dates
should be today-or-future) + help text. i18n the help text.

- Commit: `fix(after-action): constrain follow-up target date to today-or-future`

## Briefs

### B1. Streaming aria-live (P1)

File: `components/ai/BriefGenerationPanel.tsx` (~L217-234, the streaming preview container).
Add `role="status"` + `aria-live="polite"` + a descriptive `aria-label` so SR users hear
progressive content.

- Commit: `fix(briefs): announce streaming generation via aria-live`

### B2. Brief-fetch error surfaced to user (P2)

File: `pages/Briefs/BriefsPage.tsx` (~L227-244). The brief-fetch failure path is console-only.
Surface a destructive toast + an error state in the modal/list. i18n the message.

- Commit: `fix(briefs): surface brief-fetch errors to the user`

## Deferred to Wave 4 / follow-up (do NOT do here)

- Attendees chip/typeahead (P2): real component change needing a contact source — file as a
  `.planning/todos/` follow-up at the end of Wave 4, do not implement now.
- Full IntakeForm -> FormField-compound migration + TriagePanel raw -> primitives refactor
  (P2 consistency): larger; note as follow-up.

## Verification (before each commit)

- `cd frontend && pnpm lint` PASS (eslint --max-warnings 0); `pnpm type-check` PASS;
  build runs in pre-commit hook (must pass). `--no-verify` BLOCKED.
- Code style: no semicolons, single quotes, explicit return types, no `any`,
  strict-boolean-expressions. Tokens only (no raw hex / Tailwind color literals).
- GateGuard fact-forces first edit/write per file -> present 4 facts, retry once.
- Do NOT push / open PR. Report commit hashes + lint/type/build evidence.
