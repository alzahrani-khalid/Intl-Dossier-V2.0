# Impl brief — L7-positions-calendar-rel-mou (assorted entity forms) · priority 8 (honesty / error-surfacing / i18n)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.** This is the
largest lane; the file groups below are independent and may be split L7a (positions + positions.json)
/ L7b (calendar + relationships + MoU + legislation + contacts + common.json) if more parallelism is
wanted — they're already file-disjoint.

**Files you own (15) — touch ONLY these:**
`frontend/src/components/positions/{AttachPositionDialog,PositionDossierLinker,AttachmentUploader}.tsx` ·
`frontend/src/components/position-editor/PositionEditor.tsx` ·
`frontend/src/components/calendar/CalendarEntryForm.tsx` · `supabase/functions/calendar-create/index.ts` ·
`frontend/src/domains/calendar/hooks/useRecurringEvents.ts` ·
`frontend/src/components/relationships/RelationshipForm.tsx` · `frontend/src/pages/MoUs/MousPage.tsx` ·
`frontend/src/components/legislation/LegislationForm.tsx` ·
`frontend/src/components/contacts/InteractionNoteForm.tsx` ·
`frontend/src/i18n/en/common.json` · `frontend/src/i18n/ar/common.json` ·
`frontend/src/i18n/en/positions.json` · `frontend/src/i18n/ar/positions.json`.

**Source-of-truth facts:** operational calendar = `calendar_entries` (NOT `calendar_events`);
`calendar_entries.title_en` NOT NULL; positions↔dossiers `link_type` ∈
`applies_to|related_to|endorsed_by|opposed_by`; `mou_state` ∈
`draft,negotiation,pending_approval,signed,active,suspended,expired,terminated`. `positions`/`common`
namespaces are registered. `FormMessage` auto-translates its message via `t(rawBody,{defaultValue})`.

---

### POSITIONS

**E-2 (CRITICAL) — AttachmentUploader raw i18n keys (AttachmentUploader.tsx + positions.json).**
`positions.json:248` (en) / `:422` (ar) defines `attachments` as a **string**, but the component reads
`t('positions:attachments.dropzone')`, `…errors.unsupportedType`, `…confirmDelete`, `…label`,
`…maxSize`, `…supportedFormats`, `…listTitle`, `…dropzoneAriaLabel` as a nested object → every label /
validation / confirm renders the raw dotted key in both languages. Author a **new nested key set**
(e.g. `attachments_uploader: { label, description, dropzone, dropzoneAriaLabel, maxSize,
supportedFormats, listTitle, confirmDelete, errors: { unsupportedType, fileTooLarge } }`) in BOTH
`en/positions.json` and `ar/positions.json`, and repoint every `t('positions:attachments.*')` in
`AttachmentUploader.tsx` to `t('positions:attachments_uploader.*')`. Commit:
`i18n(positions): nested attachments_uploader keys + repoint uploader (E-2)`.

**E-23 (MED) — AttachmentUploader error leaf keys (same file).** `:107,188,394,419` use
`error.message || t('common:error')` but `common.error` is an **object** → i18next returns the
diagnostic string; `t('common:success')`/`t('common:loading')` have no leaf. Use real leaf keys
(`common:errors.generic`, etc. — verify they exist in common.json, add if missing). Commit:
`i18n(positions): use leaf error keys in uploader (E-23)`.

**C-4 (HIGH) — AttachPositionDialog swallows error (AttachPositionDialog.tsx).** `:124-125`
`catch { console.error(...) }` only. Add `toast.error(t('positions:attach.attachError'))` (add the
key to positions.json EN+AR) and keep the dialog open on failure. Commit:
`fix(positions): surface attach failure + keep dialog open (C-4)`.

**C-5 ≡ E-9 (HIGH) — PositionDossierLinker swallows errors (PositionDossierLinker.tsx).** `:64-66,75-77`
both create+delete catches only `console.error`. Surface `toast.error(...)` in both (or route through
the hook's `onError`); add a confirm before delete (currently deletes immediately, E-9). Commit:
`fix(positions): surface link create/delete errors + confirm delete (C-5/E-9)`.

**C-11 (MED) + E-25 (MED) — PositionDossierLinker label/i18n (same file).** `:118-120` bare `<label>`
no `htmlFor`; Select/Textarea have no `id` → add `htmlFor`/`id` pairs + `aria-required` (C-11). `:202`
`t('common.saving')` leaks a literal under single-ns `useTranslation('positions')` → use an existing
pending key (colon form `t('common:...')` for a real leaf). Commit:
`fix(positions): linker label association + pending i18n key (C-11/E-25)`.

**E-24 (MED) — PositionEditor (PositionEditor.tsx).** `:543` `t('common.cancel')` under
`useTranslation('positions')` leaks literal → colon form `t('common:common.cancel')` (verify the leaf
exists in common.json); conflict "reload" `window.location.reload()` discards unsaved edits → offer
merge/copy (or at least warn); save-error Card has no `role="alert"` → add it; manual save guards only
`saving` not `autoSaving` → exclude `autoSaving` from the manual-save guard to prevent concurrent
double-write. Commit: `fix(positions): editor i18n + role=alert + autosave guard (E-24)`.

### CALENDAR

**C-2 (HIGH) — participants silently dropped (CalendarEntryForm.tsx + calendar-create/index.ts).**
Form submits `participants[]`; `calendar-create/index.ts:133` hardcodes `attendee_ids: []` (comment
admits it). **Fallback (recommended for this pass):** remove the participants control from
`CalendarEntryForm.tsx` so users aren't misled (persisting needs a junction table = bigger). If you
instead persist, map participants → a real store. Commit:
`fix(calendar): stop misleading participants control (C-2)`.

**C-6 (MED) — title not required (CalendarEntryForm.tsx + edge).** `:334-343` only `startDatetime`
required; `title_en: titleEn || titleAr || undefined` with no guard while `calendar_entries.title_en`
is NOT NULL → blank-title submit 500s. Add a pre-submit guard requiring `title_en || title_ar` and a
400 in `calendar-create`. Commit: `fix(calendar): require title client + edge (C-6)`.

**C-7 (MED) — reminder_minutes dropped (CalendarEntryForm.tsx + edge).** Form sends `reminder_minutes`;
`calendar-create/index.ts:45-57` omits it from the destructure → silently dropped. Accept + persist it
(column/reminders table) or remove the control. Commit: `fix(calendar): persist or remove reminder_minutes (C-7)`.

**E-14 (MED) — alert() + title validation (CalendarEntryForm.tsx).** `:334-337,343,391` use blocking
native `alert()` for validation/errors. Replace with toast / inline `role="alert"`; validate title
client-side (mark required). Commit: `fix(calendar): replace alert() with toast/inline role=alert (E-14)`.

**E-15 (MED) — saving label key (CalendarEntryForm.tsx + common.json).** `:892`
`t('common.saving',{ns:'translation'})` — `common.saving` doesn't exist. Add `common.saving` to
`en/common.json` + `ar/common.json` (or point at an existing key). Commit:
`i18n(calendar): add common.saving key (E-15)`.

**C-10 (MED) — recurring detect wrong table (useRecurringEvents.ts).** `:202`
`.from('calendar_events').select('series_id')` hits the empty forum table; `calendar_entries` has no
`series_id` → `is_recurring` always false. Query `calendar_entries` recurrence columns
(`is_recurring`/`recurrence_pattern`) or the real series source (verify columns via read-only SQL).
Commit: `fix(calendar): recurring detection reads calendar_entries (C-10)`.

### RELATIONSHIPS

**E-7 (HIGH) — RelationshipForm no validation (RelationshipForm.tsx).** `:66-77,114,129-133` —
`useForm` with no resolver and no field rules; `to_contact_id`/`relationship_type` set via `setValue`,
so `errors.*` never populate and the `{errors.to_contact_id && …}` block is dead → an empty required
relationship submits. Add `zodResolver` (required `to_contact_id`, `relationship_type`); gate submit;
route messages through `FormMessage`. Commit: `fix(relationships): add zod resolver + required gating (E-7)`.

### MoU

**C-8 (MED) — MoU status labels (common.json).** `mous.statuses` is missing live `mou_state` values
`pending_approval`, `suspended`, `terminated` → raw key in badge + transition label. Add the 3 keys
(EN+AR) and drop the dead `internal_review`/`external_review`/`renewed`. Commit:
`i18n(mous): add pending_approval/suspended/terminated; drop dead statuses (C-8)`.

**C-9 (MED) + C-3 fallback (MousPage.tsx).** `:73-75` transition button
`onClick={()=>{/* handle transition */}}` is a dead placeholder → hide/disable it (C-9). `:210-213`
"Add MoU" button has no `onClick` and no create flow exists → disable it (C-3 honest-disable fallback;
building the real MoU create is NEEDS-DECISION). Commit: `fix(mous): disable dead transition + add buttons (C-9/C-3)`.

### LEGISLATION

**E-16 (MED) — LegislationForm edit data-loss (LegislationForm.tsx).** `:166-168`
`filter(([_,v]) => v !== '' && v !== undefined)` strips fields the user cleared to `''` in edit mode →
old value never overwritten (can't blank optional fields). In edit mode send `null` for cleared
fields instead of omitting them. Commit: `fix(legislation): send null for cleared fields in edit (E-16)`.

### CONTACTS

**E-17 (MED) — InteractionNoteForm duplicate note (InteractionNoteForm.tsx).** `:148-183` —
`await mutateAsync(note)` then `await Promise.all(uploadPromises)`; the outer catch only `console.error`s
and leaves the dialog open without reset → if the note saved but an attachment threw, re-submitting
creates a **duplicate note**. Track the created note id; on partial failure stop re-create and surface a
soft warning. Commit: `fix(contacts): avoid duplicate note on partial attachment failure (E-17)`.

_Opportunistic (LOW): C-12 (calendar `alert()`→toast — folded into E-14); C-14 (calendar end>start
validation, CalendarEntryForm + calendar-create); E-28 (InteractionNoteForm date-fns `ar`/`en` locale +
oversize-file toast); E-31 (AttachmentUploader real progress + design tokens); E-32 (PositionDossierLinker
`isRTL?'ms-2':'me-2'` → `me-2`); E-33 (NewPositionDialog lookup-error `role="alert"` — NOT in this lane's
files, skip)._

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint` the frontend files you touched.
- i18n parity: every new key present in BOTH `en/` and `ar/` of `common.json` / `positions.json`; grep that no `t('positions:attachments.*')` remains in AttachmentUploader.tsx (all repointed to `attachments_uploader`).
- `deno check supabase/functions/calendar-create/index.ts` (if Deno present); confirm `calendar_entries` recurrence column names via read-only SQL before C-10.
- **E-2 acceptance:** render AttachmentUploader in AR → labels/errors show real Arabic, not `attachments.dropzone`.

## Done-when

All items applied to their files; tsc/eslint/deno-check green; no swallowed errors, no dead controls,
no raw i18n keys in the owned surfaces; commits atomic; nothing pushed.
