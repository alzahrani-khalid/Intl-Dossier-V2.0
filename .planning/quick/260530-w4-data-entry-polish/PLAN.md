---
quick_id: 260530-w4
slug: data-entry-polish
date: 2026-05-30
branch: fix/data-entry-uiux-polish
wave: 4 of 4 (data-entry UI/UX polish sweep)
---

# Wave 4 — Polish (i18n leaks, emoji, labels, a11y)

From the 2026-05-30 audit. All low-risk S items. Re-grep each site (numbers shift).
For every new user-facing string: add the key to BOTH en + ar bundles. Note the repo
has two i18n locations: bundled `src/i18n/{en,ar}/*.json` (intake, briefs-page, common)
and runtime `public/locales/{en,ar}/*.json` (ai-brief, briefing-books, others). Match the
namespace's existing location; do NOT edit `dist/locales/*` (build output).

## E1. Emoji -> lucide icons (design-conformance)

- `pages/IntakeQueue.tsx` (~L496): replace `[robot emoji]` with a lucide `Bot` icon (`<Bot className="h-4 w-4 text-muted-foreground" />`) beside the AI-suggestion label.
- `pages/TicketDetail.tsx` (~L282): replace `<span className="text-2xl">[paperclip emoji]</span>` with `<Paperclip className="h-5 w-5 text-muted-foreground" />` (import from lucide-react).
- Commit: `fix(intake): replace emoji with lucide icons in queue + ticket detail`

## E2. i18n leaks — intake

- `type-specific-fields/TypeSpecificFields.tsx` L204/263: `<option value="">Select action type...</option>` and `Select time horizon...` -> `{t('...selectPlaceholder', 'Select action type...')}` etc. (add keys to `intake` ns en+ar).
- `attachment-uploader/AttachmentUploader.tsx`: `Maximum ${maxFiles} files allowed` (~L85), the `Total:` summary line, and the `file/files` count -> route through `t()` with i18next plural form (`{{count}}`). Add keys to `intake` ns en+ar.
- Commit: `fix(intake): route remaining hardcoded strings through i18n`

## E3. i18n leaks — dossier

- `work-creation/DossierPicker.tsx`: replace the hardcoded EN default/fallback strings (audit cited ~L262,318,326,333,339,355,418 — re-grep for English string literals not behind `t()`). Add/verify keys in the namespace DossierPicker uses.
- Commit: `fix(dossier): route DossierPicker hardcoded strings through i18n`

## E4. i18n leaks — briefs

- `briefing-books/BriefingBookBuilder.tsx`: `Entities:`/`Sections:` (~L947,963), `No matching entities found`/`No entities available` (~L549-552) -> `t()`.
- `briefing-books/BriefingBooksList.tsx`: `{pageCount} pages` (~L244) -> i18next plural; `Deleting...` (~L371) -> `t('confirmDelete.deleting', 'Deleting…')`.
- Add keys to `briefing-books` ns en+ar.
- Commit: `fix(briefs): route remaining briefing-books strings through i18n`

## E5. Unified submit labels (consistency, CONSISTENCY-002)

- `intake-form/IntakeForm.tsx` submit button currently `actions.submit` ("Submit") vs
  `work-creation/forms/IntakeQuickForm.tsx` ("Submit Request"). Standardize BOTH on one
  label + the same `Button` (default/primary) variant. Prefer `t('actions.submitRequest', 'Submit request')`
  (sentence case per canon). Update keys so both forms render identically.
- Commit: `fix(intake): unify create-request submit button label + variant`

## E6. StepIndicator aria-disabled (a11y)

- `ui/form-wizard.tsx` (~L118-156): on step buttons that are not navigable (locked), add
  `aria-disabled={!canNavigate}` (keep them focusable only if appropriate; otherwise also
  `disabled`). Re-read to match the current canNavigate/allowStepNavigation logic.
- Commit: `fix(ui): mark non-navigable wizard steps aria-disabled`

## E7. File deferred follow-ups (tracking)

Create two `.planning/todos/` markdown files (these are the items deferred from Wave 3):

- `260530-followup-after-action-attendees-chip.md` — attendees stored as comma-string;
  replace with a chip/tag + typeahead input (needs a contact/person source). P2.
- `260530-followup-form-strategy-unification.md` — migrate `IntakeForm` to the RHF
  `FormField`-compound pattern and `TriagePanel` raw `<select>/<button>` to token-bound
  primitives (Input/Select/Button), to converge the divergent form strategy. P2.
- Commit: `docs(planning): file attendees-chip + form-strategy-unification follow-ups`

## Verification (before each commit)

- `cd frontend && pnpm lint` PASS; `pnpm type-check` PASS; build runs in pre-commit hook
  (must pass). `--no-verify` BLOCKED.
- No semicolons, single quotes, explicit return types, no `any`, strict-boolean-expressions.
  Tokens only. Verify the emoji grep is empty after E1.
- GateGuard fact-forces first edit/write per file -> present 4 facts, retry once.
- Do NOT push / open PR. Report commit hashes + lint/type/build evidence + confirm emoji grep empty.
