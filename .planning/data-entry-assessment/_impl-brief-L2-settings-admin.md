# Impl brief — L2-settings-admin (settings save + ai-admin + notifications) · priority 3 (save-broken / honesty)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (12) — touch ONLY these:**
`frontend/src/pages/settings/SettingsPage.tsx` ·
`frontend/src/components/settings/sections/{ProfileSettingsSection,SecuritySettingsSection,DataPrivacySettingsSection,NotificationsSettingsSection,AppearanceSettingsSection,AccessibilitySettingsSection,GeneralSettingsSection}.tsx` ·
`frontend/src/routes/_protected/admin/ai-settings.tsx` ·
`frontend/src/routes/_protected/admin/ai-usage.tsx` ·
`frontend/src/hooks/useNotificationCenter.ts` ·
`supabase/functions/notifications-center/index.ts`.

**Verify real columns FIRST** via read-only `mcp__supabase__execute_sql` before writing any
table-targeting code:

```sql
select column_name from information_schema.columns where table_schema='public' and table_name='users' order by 1;
select column_name from information_schema.columns where table_schema='public' and table_name='user_preferences' order by 1;
select column_name from information_schema.columns where table_schema='public' and table_name='notification_category_preferences' order by 1;
```

Slice D/E verified `public.users` real cols ≈ `full_name, job_title_en, job_title_ar, department,
phone, avatar_url, language_preference, timezone, mfa_enabled` (the ~23 others in the current upsert
do NOT exist). Confirm before relying on this list.

---

### D-4 ≡ E-1 (CRITICAL) — stop upserting phantom columns

`SettingsPage.tsx:172-217` upserts ~23 columns absent from `public.users` → PostgREST PGRST204 fails
the whole atomic upsert → **every** Save no-ops. Rewrite `saveMutation` so it persists each concern
to a real home:

- **Profile + General → real `users` columns** only: map `display_name → full_name`,
  `job_title → job_title_en` (and `job_title_ar` if the form has it), keep `department, phone,
avatar_url, language_preference, timezone`. This makes Profile/General Saves actually work.
- **Appearance (`color_mode/theme/display_density`) → DROP from the DB upsert** — DesignProvider
  already persists these to localStorage (D-39); the upsert must not carry them.
- **Notifications (`notifications_*` ×8) → `notification_category_preferences`** (the working surface
  per D-30), not `users`. Mirror the shape the existing NotificationPreferences page writes.
- **Accessibility (×6), `date_format`, `start_of_week`, `session_timeout` → no column exists.** Make
  them honest: keep them local-only (DesignProvider/localStorage) or remove the controls. Do NOT
  upsert unknown columns. (Server-side persistence for these = the D-19-adjacent NEEDS-DECISION; not
  in scope here.)

Commit: `fix(settings): persist only real columns; route prefs to real tables (D-4/E-1)`.

### D-5 (HIGH) — load reads real columns, no fabrication

`SettingsPage.tsx:114-148` reads the missing columns back as `undefined` and fabricates
`display_name = email.split('@')[0]` and every toggle `?? true`. Read the real columns (and
`notification_category_preferences` for toggles); show genuine empty/unset state instead of
hard-coded defaults. Commit: `fix(settings): load real stored values, stop fabricating defaults (D-5)`.

### D-6 ≡ E-4 (HIGH) — MFA setup button (SecuritySettingsSection)

`SecuritySettingsSection.tsx:147,163-166` — the "Set up two-factor" `<Button>` has **no `onClick`**
and the toggle only `form.setValue('mfa_enabled', …)`. Either wire the button to the real flow
(`setup-mfa` → render QR → `verify-mfa-setup`) or, if that's out of scope for this pass, **honest-
disable** it (`disabled` + "coming soon" copy per the app's honest-stub pattern). Never persist
`mfa_enabled` without a verified secret. Commit: `fix(settings): wire/honest-disable MFA setup; no mfa_enabled without secret (D-6/E-4)`.

### D-7 (HIGH) — "Export my data" honesty (DataPrivacySettingsSection)

`:112-142` queries `user_settings` and `activity_log` (both don't exist on staging), ignores errors,
then `toast.success`. Query the real tables (`user_preferences`, a real activity source), check
`error`, and fail honestly (no success toast) if a source is missing/empty. Commit:
`fix(settings): export queries real tables and fails honestly (D-7)`.

### D-8 (HIGH) — "Delete account" (DataPrivacySettingsSection)

`:187-196` does `from('users').update({ status:'deleted', deleted_at:… })` — `users` has neither col,
and it's a destructive self-delete from the browser. Honest-disable the client path (it currently
throws anyway): remove the broken client update and either route to a server edge fn (with authz +
confirm) or show "contact an administrator". Building the deletion edge fn = follow-up; the FIX-NOW is
removing the lie. Commit: `fix(settings): stop broken client-side account deletion (D-8)`.

### D-9 (HIGH, fallback) — hide avatar upload (ProfileSettingsSection)

`ProfileSettingsSection.tsx:83-96` uploads to a non-existent `avatars` bucket. Per the
NEEDS-DECISION, **hide/disable** the avatar-upload control until the bucket exists (don't show a
control that always errors). Commit: `fix(settings): hide avatar upload until bucket exists (D-9)`.

### D-20 (MED) — Profile/General form error rendering (ProfileSettingsSection)

`:182-259` registers fields with no `aria-invalid`/`aria-describedby` and never renders
`formState.errors` → a Zod failure blocks submit with zero feedback. Render field errors with
`aria-invalid` + `aria-describedby`. Commit: `a11y(settings): render profile field errors (D-20)`.

### D-21 (MED) — Notification toggles a11y (NotificationsSettingsSection)

`:95-101` — each `Switch` gets no `aria-label(ledby)` and the label is a bare `<p>` → 8 unnamed
switches. Give each label an `id` and pass `aria-labelledby` to its `Switch`. Commit:
`a11y(settings): name notification toggle switches (D-21)`.

### D-30 (MED) — notification prefs single source (NotificationsSettingsSection + useNotificationCenter)

Point the Settings notifications section at `notification_category_preferences` (the working surface),
consistent with the D-4 routing, so Settings and the Notifications page agree. Read with
`maybeSingle()`/PGRST116 handling like `useNotificationCenter.ts:349-384`. Commit:
`fix(settings): notifications read/write notification_category_preferences (D-30)`.

### D-16 ≡ D-28 (MED) — AI settings save (ai-settings.tsx)

`:196-237` — `onSuccess` clears `hasChanges` but not `formState` (stale partial shadows fresh policy);
editing one field blanks untouched selects; `upsert` lacks `onConflict`; UI fallback shows
`anthropic/claude-sonnet-4` while DB defaults are `openai/gpt-4o` → silent corruption under a "saved"
toast. Fix: `setFormState(null)` in `onSuccess`; compute payload `{...(policy ?? defaults),
...formState}`; `.upsert(payload, { onConflict: 'organization_id' })`; make the UI fallback match the
DB defaults (`openai`/`gpt-4o`). Commit: `fix(ai-settings): merged payload + onConflict + correct defaults (D-16/D-28)`.

### D-17 (MED) — AI usage Top Users (ai-usage.tsx)

`:144-149` queries `from('profiles').select('id, email')` — `profiles` has neither col → 42703,
swallowed → every email renders "Unknown". Query `users(id, email)` and check `error`. Commit:
`fix(ai-usage): query users for top-user emails (D-17)`.

### D-18 (MED) — notifications-center digest read (edge fn)

`notifications-center/index.ts:302-310` — `.single()` on a 0-row `email_notification_preferences`
→ PGRST116; only `catError` is inspected, `emailError` never checked. Use `.maybeSingle()` and handle
`emailError`. Commit: `fix(notifications): maybeSingle + error check on digest read (D-18)`.

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint src/pages/settings/SettingsPage.tsx src/components/settings/sections/*.tsx src/routes/_protected/admin/ai-settings.tsx src/routes/_protected/admin/ai-usage.tsx src/hooks/useNotificationCenter.ts`.
- `deno check supabase/functions/notifications-center/index.ts` (if Deno present); confirm column names via read-only SQL before committing.
- Manual smoke (optional, app at :5173 → staging): Profile Save now persists `full_name`; Notifications save reflects on the Notifications page; AI-settings save round-trips without blanking untouched selects.

## Done-when

All 13 items applied; tsc/eslint/deno-check green; the Settings page has **no** save that targets a
non-existent column and **no** success toast over a failed/empty operation; commits atomic; nothing
pushed. (notifications-center deploy to staging is the orchestrator's step.)
