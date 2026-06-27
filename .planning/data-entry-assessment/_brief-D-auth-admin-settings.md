# Slice D — Auth, admin & settings data entry

First read `.planning/data-entry-assessment/_FORMAT.md` and follow it exactly.

## Your scope

The data-entry flow for account, admin, and configuration inputs:

- **auth forms** — login, signup (if any), password reset, **MFA enrollment & verification**.
  Verify MFA secret persists to `public.users.mfa_secret` and enrollment/reset agree. Confirm there
  is NO backdoor / hard-coded code path. Role source is `public.users.role`.
- **profile / account settings** — display name, language, avatar, contact fields. Verify they
  persist to the right table/columns and re-render.
- **AI settings (org LLM policy)** — the admin AI-settings page. Verify the payload aligns to the
  LIVE columns (this was recently broken: payload didn't match columns so the page didn't persist).
  Check org-scoping from a trusted source + RLS INSERT policy.
- **notification preferences** — digest (daily/weekly), channel toggles. Note the pref tables may be
  empty for all users; reads should use `maybeSingle()` not `.single()` (406 risk).
- **user management / admin** — create/edit user, role assignment (`requireAdmin` guard;
  `is_platform_admin`), clearance level (`profiles.clearance_level`).

Start at `frontend/src/routes/_protected/` (settings/admin), `frontend/src/components/` (auth,
settings, admin dirs), `frontend/src/domains/`, `backend/src/api/`, `supabase/functions/`.
Trace each submit → mutation → table; verify column alignment and RLS against the facts.

## Output

Write your report to:
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/data-entry-assessment/findings-D-auth-admin-settings.md`

Finish with `## ASSESSMENT COMPLETE: D` in the file and print `ASSESSMENT COMPLETE: D`.
