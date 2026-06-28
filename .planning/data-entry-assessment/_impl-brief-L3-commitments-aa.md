# Impl brief — L3-commitments-aa (after-action commitments) · priority 4 (silent-data-loss, CRITICAL B-1)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (11) — touch ONLY these:**
`supabase/functions/after-actions-create/index.ts` · `supabase/functions/detect-overdue-commitments/index.ts` ·
`frontend/src/components/commitment-editor/CommitmentEditor.tsx` ·
`frontend/src/components/after-action-form/AfterActionForm.tsx` ·
`frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx` ·
`frontend/src/hooks/useAfterAction.ts` · `frontend/src/services/commitments.service.ts` ·
`frontend/src/components/commitments/CommitmentForm.tsx` ·
`frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx` ·
`frontend/src/i18n/en/commitments.json` · `frontend/src/i18n/ar/commitments.json`.

**Source-of-truth facts:** commitments table = `aa_commitments`; columns `due_date`, `owner_type`,
`owner_user_id`/`owner_contact_id` (NOT `owner_id`/`assignee_id`); `title` is **NOT NULL, no default,
no INSERT trigger**; coupled CHECKs `valid_owner` (internal⇒`owner_user_id`, external⇒`owner_contact_id`)

- `valid_tracking` (internal⇒`tracking_mode='automatic'`, external⇒`'manual'`); priority enum
  `low|medium|high|urgent` (NOT `critical`). `commitments` ns is registered in i18n.

---

### B-1 ≡ C-1 (CRITICAL) — after-action commitment omits NOT-NULL `title`

Verified: `after-actions-create/index.ts:207-221` inserts into `aa_commitments` with NO `title` →
23502 NOT NULL violation → line 224 deletes the parent `after_action_records` → every after-action
saved _with a commitment_ 500s. Three edits, one commit:

1. **Edge fn insert (`:217`)** — add `title: commitment.title ?? commitment.description?.slice(0, 200)`.
2. **Type (`useAfterAction.ts`, the AA-commitment input interface ~`:38`/`:51`)** — add `title: string`
   (and keep `priority: 'low'|'medium'|'high'|'urgent'`).
3. **UI (`CommitmentEditor.tsx`)** — add a required `title` `<Input>` bound to the new field.

Commit: `fix(after-action): persist NOT NULL aa_commitments.title (B-1/C-1)`.
_Opportunistic (LOW B-31/C-13, same edge fn):_ change the `priority` union literal `'critical'` →
`'urgent'` at `after-actions-create/index.ts:16` while you're here.

### B-6 (HIGH) — internal commitment owner has no users

`routes/.../after-action.tsx:135-140` renders `<AfterActionForm …/>` with no `availableUsers` → it
defaults to `[]`, the internal-owner `<Select>` is empty, `owner_user_id` stays undefined →
`valid_owner` violation (compounds B-1). Pass a real `availableUsers` list (fetch the org users, e.g.
via the existing users hook) into the route's `<AfterActionForm>`, and in `AfterActionForm.tsx` block
submit when an **internal** commitment has no `owner_user_id`. Commit:
`fix(after-action): provide availableUsers + require internal owner (B-6)`.

### B-9 (HIGH) — detect-overdue-commitments wrong column

`detect-overdue-commitments/index.ts:86` selects `owner_id` (doesn't exist on `aa_commitments`) →
42703 → fn 500s, overdue auto-flagging never runs. Select `owner_user_id, owner_contact_id` and fix
the downstream `owner_id` reads. Commit: `fix(commitments): detect-overdue selects owner_user_id/owner_contact_id (B-9)`.

### B-7 (HIGH) — updateCommitment recompute tracking_mode

`commitments.service.ts:221-239` — `updateCommitment` passes `tracking_mode` raw and never recomputes
it, so changing `owner_type` without flipping `tracking_mode` violates `valid_tracking`. Recompute
from `owner_type` exactly like create (`:184`): `const tracking_mode = owner_type === 'internal' ?
'automatic' : 'manual'`. Commit: `fix(commitments): recompute tracking_mode on update (B-7)`.

### B-17 ≡ E-22 (MED) — createCommitment drops audit columns

`commitments.service.ts:188-203` — `createCommitment`'s insert omits `created_from_route` /
`created_from_entity` although the form sends them and the columns exist on `aa_commitments`. Add both
to the insert payload. Commit: `fix(commitments): persist created_from_route/entity audit context (B-17/E-22)`.

### E-6 — CommitmentForm due_date timezone (CommitmentForm.tsx)

`:120` and `:144` use `values.due_date.toISOString().split('T')[0]` on a local-midnight Date → in
GST (UTC+4) `toISOString()` rolls back a calendar day → due_date persisted one day early. Replace both
with `format(values.due_date, 'yyyy-MM-dd')` (date-fns). Commit:
`fix(commitments): format due_date in local tz, not UTC (E-6)`.
_(The same bug in CommitmentQuickForm.tsx is fixed by L5 — do not touch that file.)_

### B-19 ≡ E-18 (MED) — CommitmentForm owner picker (CommitmentForm.tsx)

`:302-325` — owner is a raw free-text `<Input>` for a UUID (`// TODO picker`); a typed name → FK /
`valid_owner` 500. **Floor fix (no new component needed):** for internal owners reuse an
`availableUsers` `<Select>` (mirror AfterActionForm); for external, at minimum **require a selection
and validate the value is a UUID** before submit (reject free text). A full contact combobox is an
optional enhancement — the required outcome is "no non-UUID ever reaches Postgres." Commit:
`fix(commitments): validated owner selection, no free-text UUID (B-19/E-18)`.

### B-20 (MED) — CommitmentForm hardcoded English helper (CommitmentForm.tsx + commitments.json)

`:317-321` hardcodes `'Enter internal user ID' / 'Enter external contact ID'` (no `t()`) → English in
Arabic. Move both into the `commitments` namespace (`en/commitments.json` + `ar/commitments.json`) and
render via `t('commitments:...')`. Commit: `i18n(commitments): localize owner helper text (B-20)`.

### E-19 (MED) — AddDeliverableDialog raw English message

`commitments/deliverables/AddDeliverableDialog.tsx:57,70,276,314` — `z.string().min(1,'Required')`
rendered raw via `{errors.title_en.message}` → literal "Required" in AR. Use a `validation:` key and
render through `FormMessage` (auto-translates). Commit: `i18n(commitments): localize AddDeliverable validation (E-19)`.

_Opportunistic (LOW B-38, commitments.service.ts):_ in `updateCommitmentStatus`, clear `completed_at`
when status leaves `completed`.

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint src/components/commitment-editor/CommitmentEditor.tsx src/components/after-action-form/AfterActionForm.tsx src/hooks/useAfterAction.ts src/services/commitments.service.ts src/components/commitments/CommitmentForm.tsx src/components/commitments/deliverables/AddDeliverableDialog.tsx src/routes/_protected/engagements/\$engagementId/after-action.tsx`.
- i18n keys resolve: `pnpm --filter frontend test` for any i18n key tests, or grep that every new `t('commitments:...')` key exists in both `en/` and `ar/commitments.json`.
- `deno check supabase/functions/{after-actions-create,detect-overdue-commitments}/index.ts` (if Deno present).
- **B-1 acceptance:** after deploy of `after-actions-create` to staging, create an after-action with one commitment → 201 and a row in `aa_commitments` with a non-null `title` (confirm via read-only SQL). Edge-fn deploy is the orchestrator's step.

## Done-when

All items applied to their files; tsc/eslint/deno-check green; an after-action-with-commitment saves;
commits atomic + conventional; nothing pushed.
