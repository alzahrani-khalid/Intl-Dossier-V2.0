# Impl brief — L5-work-palette-intake (work-creation palette + intake) · priority 6 (validation / honesty)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (12) — touch ONLY these:**
`frontend/src/components/work-creation/forms/{TaskQuickForm,CommitmentQuickForm,IntakeQuickForm}.tsx` ·
`frontend/src/components/work-creation/WorkCreationPalette.tsx` ·
`frontend/src/components/work-creation/WorkCreationProvider.tsx` ·
`frontend/src/components/work-creation/DossierPicker.tsx` ·
`supabase/functions/intake-tickets-create/index.ts` · `supabase/functions/intake-tickets-update/index.ts` ·
`supabase/functions/intake-tickets-assign/index.ts` · `frontend/src/components/intake-form/IntakeForm.tsx` ·
`frontend/src/i18n/en/intake.json` · `frontend/src/i18n/ar/intake.json`.

**Source-of-truth facts:** commitments `valid_owner` (external requires `owner_contact_id`);
work-item↔dossier junction = `work_item_dossiers` (`work_item_type`, `inheritance_source`
direct/engagement/after_action/position/mou); `intake_tickets` require `title_ar`/`description_ar`
NOT NULL; `request_type` enum `engagement|position|mou_action|foresight`; `urgency` enum
`low|medium|high|critical` (intake-specific). `intake` ns is registered.

---

### B-5 (HIGH) — CommitmentQuickForm external owner 500s

`CommitmentQuickForm.tsx:59,140-148` offers `owner_type:'external'` but collects no contact; the
service sets `owner_contact_id=null` → `valid_owner` violation → always 500. **Remove the `external`
option from the quick form** (the full CommitmentForm in L3 keeps external with a validated id; the
quick form is internal-only). Commit: `fix(work-palette): drop unsupported external owner from commitment quick-form (B-5)`.

### B-8 ≡ E-30 (HIGH) — TaskQuickForm link failure swallowed

`TaskQuickForm.tsx:122-176` — the `work_item_dossiers` link hook `onError` only `console.warn`s,
`onSuccess` try/catch is empty, and `toast.success('Task created')` fires regardless. **Tasks have no
backstop trigger** (only commitments have `sync_commitment_dossier_link`) → failed link = silent
orphan + success toast. Surface a soft warning toast when the link insert fails (and stop claiming
unqualified success). Apply the same soft-warning to IntakeQuickForm's link step (E-30). Commit:
`fix(work-palette): surface dossier-link failure on quick task/intake create (B-8/E-30)`.

### B-27 (MED) — WorkCreationPalette stale dossier

`WorkCreationPalette.tsx:153` — `handleDossierSelect` only sets `selectedDossier`, never clears; the
picker's X calls `onChange(null)` but the palette keeps the stale dossier and "Continue" stays
enabled. Handle null: `if (!dossierId) setSelectedDossier(undefined)`. Commit:
`fix(work-palette): clear selected dossier on picker reset (B-27)`.

### B-28 (MED) — double success toast

`WorkCreationProvider.tsx:54` toasts for every type, while `TaskQuickForm.tsx:174` and
`IntakeQuickForm.tsx:138` ALSO `toast.success` → two toasts. Remove the per-form `toast.success` from
TaskQuickForm and IntakeQuickForm; keep the provider's single toast. Commit:
`fix(work-palette): single success toast via provider (B-28)`.

### B-29 (MED) — DossierPicker a11y

`DossierPicker.tsx:308,338-367` — trigger lacks `aria-haspopup`; the Searching/empty state has no
`role="status"`/`aria-live`. Add `aria-haspopup="listbox"` and wrap loading/empty in
`aria-live="polite"`. Commit: `a11y(work-palette): DossierPicker haspopup + live region (B-29)`.

### E-6 — CommitmentQuickForm due_date timezone

`CommitmentQuickForm.tsx:138` — `values.due_date.toISOString().split('T')[0]` stores due_date one day
early in GST. Replace with `format(values.due_date, 'yyyy-MM-dd')` (date-fns). Commit:
`fix(work-palette): format commitment quick-form due_date in local tz (E-6)`.
_(The CommitmentForm.tsx copy of this bug is fixed by L3 — do not touch it.)_

### B-11 (MED) — IntakeQuickForm no junction row

`IntakeQuickForm.tsx:122-133` sets `intake_tickets.dossier_id` but creates no `work_item_dossiers`
row (unlike Task/Commitment quick forms) and no intake sync trigger exists → junction-based dossier
surfaces omit palette-created intakes. After create, insert a `work_item_dossiers` row
(`work_item_type:'intake'`, `inheritance_source:'direct'`). Commit:
`fix(work-palette): link palette-created intake to dossier junction (B-11)`.

### B-12 (MED) — IntakeQuickForm mirrors English into Arabic NOT-NULL cols

`IntakeQuickForm.tsx:128,130` — `titleAr: values.title, descriptionAr: values.description` stores
English in the `*_ar` NOT-NULL columns → AR UI renders English. Add Arabic title/description inputs
and submit the real Arabic values (add labels to `en/intake.json` + `ar/intake.json`). Commit:
`fix(work-palette): collect Arabic title/description in intake quick-form (B-12)`.

### B-10 (MED) — intake-tickets-create coerces Arabic to null

`intake-tickets-create/index.ts:80,163-165` — validator requires only `request_type/title/
description`; `title_ar`/`description_ar` are coerced `|| null` though the DB requires them NOT NULL →
500 not a clean 400, and `|| null` can never satisfy the constraint. Require `title_ar`/
`description_ar` in the validator (400 on missing); never coerce to null. Commit:
`fix(intake): require title_ar/description_ar (400 not 500) (B-10)`.

### B-14 (MED) — intake-tickets-create enum validation

`intake-tickets-create/index.ts:80` — truthiness only; `request_type` never checked against the enum.
Validate `request_type` (`engagement|position|mou_action|foresight`) and `urgency`
(`low|medium|high|critical`) against allow-lists; 400 on mismatch. Commit:
`fix(intake): validate request_type/urgency enums (B-14)`.

### B-15 (MED) — intake leaks raw Postgres error

`intake-tickets-create/index.ts:194` (+ `intake-tickets-update:246`, `intake-tickets-assign:185`)
returns the raw PG error object (column/constraint internals) in the 500 body. Log the raw error
server-side only; return a generic message (mirror `convert/index.ts`). Commit:
`fix(intake): generic error body, log raw server-side (B-15)`.

### B-13 ≡ E-13 (MED) — IntakeForm raw validation key

`IntakeForm.tsx:40,47,267,309` — `z.string().min(1,'validation:required')` rendered raw via plain
`<p>{errors.titleAr.message}</p>` → literal "validation:required" shown. Render via `FormMessage`
(auto-translates) or wrap in `t('validation:required')`. Commit:
`i18n(intake): translate Arabic field validation messages (B-13/E-13)`.

### B-16 (MED) — IntakeForm label association

`IntakeForm.tsx:187-317` — `<label>` with no `htmlFor`; Select/Input/Textarea carry no matching `id`
on all 6 fields. Add `htmlFor`/`id` pairs (or migrate to `FormLabel`+`FormControl` like
IntakeQuickForm). Commit: `a11y(intake): associate labels with controls (B-16)`.

_Opportunistic (LOW): B-32 (IntakeForm dead `mode='edit'` → remove the edit pretense); B-33
(intake-tickets-assign/-update read app role from `public.users` like `convert/index.ts`); B-35
(DossierPicker `isRTL ? 'ms-2' : 'me-2'` → unconditional `me-2`)._

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint src/components/work-creation/**/*.tsx src/components/intake-form/IntakeForm.tsx`.
- intake i18n parity: every new key in BOTH `en/intake.json` and `ar/intake.json`.
- `deno check supabase/functions/{intake-tickets-create,intake-tickets-update,intake-tickets-assign}/index.ts` (if Deno present); confirm enums via read-only SQL.
- **Acceptance:** palette commitment quick-form no longer offers external; a palette intake creates BOTH the ticket and a `work_item_dossiers` row (read-only SQL); one success toast per create.

## Done-when

All items applied; tsc/eslint/deno-check green; no quick-form path 500s or fakes success; commits
atomic; nothing pushed. (intake edge-fn deploy to staging is the orchestrator's step.)
