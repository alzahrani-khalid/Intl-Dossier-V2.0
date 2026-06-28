# Impl brief — L1-auth (server + client auth / MFA / admin-authz) · priority 2 (security)

**Self-contained worker order. Atomic commits (one per item / tightly-coupled pair),
conventional-commit messages, NO push, NO PR.** Edge fns are Deno; the pre-commit hook runs
`pnpm build` (frontend) — keep frontend `tsc` green before committing frontend files.

**Files you own (11) — touch ONLY these:**
`backend/src/services/auth.service.ts` · `supabase/functions/create-user/index.ts` ·
`supabase/functions/assign-role/index.ts` · `supabase/functions/deactivate-user/index.ts` ·
`supabase/functions/reactivate-user/index.ts` · `supabase/functions/user-permissions/index.ts` ·
`frontend/src/store/authStore.ts` · `frontend/src/auth/LoginPage.tsx` ·
`frontend/src/auth/ResetPasswordPage.tsx` · `frontend/src/components/step-up-mfa/StepUpMFA.tsx` ·
`frontend/src/lib/auth/require-admin.ts`.

**Source-of-truth facts:** authz role = `public.users.role`; clearance = `profiles.clearance_level`
(1-4); `profiles` has NO `id` (key on `user_id`); `public.users` has `is_active boolean` (NO `status`).
**Service-role rule:** every cross-user / privileged write (role, clearance, is_active) MUST use the
service-role Supabase client so it passes the L0 D-1/D-2 triggers and bypasses RLS intentionally.

---

### D-3 (CRITICAL) — `auth.service.ts:~863` real MFA verify

`private verifyMFACode(){ return true }` is unconditional and backs live `POST /api/auth/login` +
`/api/auth/verify-mfa`. Replace with real TOTP: load the user's base32 secret from
`public.users.mfa_secret` and validate with `otpauth` (already used by the edge fns), ±1 step window;
**fail closed** if no secret. Signature stays `(secret, code) => boolean` but actually verify.

```ts
import { TOTP, Secret } from 'otpauth' // confirm dep; edge fns already use otpauth
private verifyMFACode(secret: string, code: string): boolean {
  if (!secret || !code) return false
  const totp = new TOTP({ secret: Secret.fromBase32(secret) })
  return totp.validate({ token: code, window: 1 }) !== null
}
```

Ensure callers (`:138` login, `:329`, `:640`) pass the stored `mfa_secret`. **If `otpauth` is not a
backend dep,** prefer **deleting** the Express MFA path entirely (the hardened edge fns are the real
path) over leaving a stub — never re-introduce an always-true verify. Commit: `fix(security): real TOTP verify in Express auth (D-3)`.

### D-11 (HIGH) — deactivate/reactivate use `is_active`, not `status`

`deactivate-user/index.ts:89,202` and `reactivate-user/index.ts:73,106` select/`update` a
non-existent `status` col → `targetUser` null → every user 404s. Change select to
`'is_active, role, email'`; deactivate `.update({ is_active: false })`, reactivate
`.update({ is_active: true })` (plus existing soft-delete cols `deleted_by` if used). Commit:
`fix: deactivate/reactivate target is_active not status (D-11)`.

### D-24 (MED) — deactivate/reactivate hardening (same two files)

Replace local `corsHeaders: '*'` with the shared origin-validated `_shared/cors.ts getCorsHeaders`;
add `withRateLimit`; perform the cross-user mutation with the **service-role** client (not anon+bearer
RLS). Commit: `fix(security): origin CORS + rate-limit + service-role on user (de)activation (D-24)`.

### D-31 (MED) — deactivate cleanup column names (deactivate-user)

`:127-164` filters `pending_role_approvals` by `requestor_id/approver_1_id/approver_2_id` (real:
`requested_by/first_approver_id/second_approver_id`) and queries `delegations`/`user_sessions` that
don't exist on staging; results are consumed without checking `error`. Fix the column names, guard
for the real tables (skip if absent), and check every `error`. Verify real columns first via
`mcp__supabase__execute_sql` against `information_schema.columns`. Commit:
`fix: correct pending_role_approvals columns + guard missing tables on deactivate (D-31)`.

### D-14 (HIGH) — create-user role-write must not be swallowed

`create-user/index.ts:341-356` swallows the `public.users` role update ("Non-critical…"). Since authz
reads that column, a failed/0-row update yields a user with no canonical role behind a 201. Use the
service-role client for the role write; if it errors or affects 0 rows, **compensate** (delete the
just-created auth user) and return 500. Commit: `fix(security): fail create-user when role write does not land (D-14)`.

### D-23 (MED) — create-user accepts validated clearance

`CreateUserRequest` has no clearance field; new users get the DB default with no admin input. Add an
optional `clearance` (integer 1-4, validated; 400 on out-of-range) and write `profiles.clearance_level`
via the service-role client (key on `user_id`). The create **UI** field rides D-10 (NEEDS-DECISION) —
ship the edge-fn side now. Commit: `feat: create-user accepts validated clearance_level (D-23)`.

### D-22 ≡ D-25 (MED) — one admin/role vocabulary

- **Admin gate:** `require-admin.ts:15` accepts `admin`+`super_admin`(+`security_admin` via enum) but
  every edge fn checks `role !== 'admin'` exactly → elevated admins get 403 on every action. Converge:
  make the client guard accept exactly the set the edge fns enforce (today `['admin']`). Fix
  `require-admin.ts` to `role === 'admin'` (drop the dead elevated roles) **or**, if super_admin must
  work, widen the edge-fn checks to the same set — pick ONE set and apply it in `require-admin.ts`
  (here) + `create-user:76` + `assign-role:148`.
- **Assignable roles:** UI offers `admin/manager/staff/viewer`; validators accept `admin/editor/viewer`.
  Canonicalize on the validator set `['admin','editor','viewer']` in `create-user:76` and
  `assign-role:148` (the dead UsersListPage picker is corrected under D-10). Commit:
  `fix: converge admin role set across guard and validators (D-22/D-25)`.

### D-29 (MED) — user-permissions wrong embed/select

`user-permissions/index.ts:204,231,255`: the `grantor:auth.users!…(email)` embed isn't
PostgREST-embeddable (errors, swallowed at :238 → delegations always empty); `:255` reads
`targetUser.allowed_resources` but the `:204` select only fetches `id,email,role` → undefined. Fetch
`allowed_resources` in the select, resolve grantor email via a `public.users` lookup (not an
`auth.users` embed), and check the returned `error`. Commit: `fix: user-permissions embed/select + error check (D-29)`.

### D-12 (HIGH) — StepUpMFA request/response contract

`StepUpMFA.tsx:227-241` POSTs `{challenge_id, verification_code}` and reads `data.elevated_token`;
`auth-step-up-complete` requires `{challenge_id, factor_id, totp_code}` and returns `step_up_token`.
Send `factor_id` (from the initiate response `factors`) + `totp_code`, and read `step_up_token`. Commit:
`fix: align step-up MFA payload + token field to edge fn (D-12)`.

### D-27 (MED) — StepUpMFA initiation error not shown

`:183,395,443` — the only error renderer is inside `{challengeData && !isInitiating && (…)}`; on
initiate failure `challengeData` stays null so nothing shows. Render the error outside that guard.
Commit: `fix: surface step-up MFA initiation error (D-27)`.

### D-13 (HIGH) — login MFA is decorative + errors swallowed

`authStore.ts:44,93-99` — `login(email,password,_mfaCode?)` ignores `_mfaCode` and swallows errors
(never re-throws), so `LoginPage.tsx` navigates to `/dashboard` even on failure and the MFA re-prompt
is unreachable. Floor fix: make `login()` **re-throw** on error so nav gates on success; remove (or
disable) the unreachable MFA input so it isn't decorative. (Full Supabase AAL2 challenge/verify is an
optional follow-up — not required here.) Commit: `fix(security): login re-throws on failure; drop decorative MFA input (D-13)`.

### D-26 (MED) — ResetPasswordPage i18n separator

`ResetPasswordPage.tsx:55` uses dot form `t('validation.minLength', …)`; `validation` is a separate
namespace → renders the literal. Use the colon form `t('validation:minLength', …)` (Login/Register
already do). Commit: `i18n: colon namespace separator in reset-password validation (D-26)`.

---

## Verify

- Frontend files: `cd frontend && pnpm tsc --noEmit` and `pnpm exec eslint src/store/authStore.ts src/auth/LoginPage.tsx src/auth/ResetPasswordPage.tsx src/components/step-up-mfa/StepUpMFA.tsx src/lib/auth/require-admin.ts`.
- Edge fns: `deno check supabase/functions/{create-user,assign-role,deactivate-user,reactivate-user,user-permissions}/index.ts` (if Deno present). Confirm any column/table names against staging first via read-only `mcp__supabase__execute_sql`.
- Backend: `cd backend && pnpm tsc --noEmit` (or repo `pnpm typecheck`).
- Edge fns must be **deployed** to staging to take effect (`mcp__supabase__deploy_edge_function`) — that's the orchestrator's integration step; your deliverable is committed code. After deploy, smoke-test deactivate/reactivate return 200 for a real user id and step-up returns a `step_up_token`.

## Done-when

All 11 items applied to their files; tsc/eslint/deno-check green; commits atomic + conventional; nothing
pushed. Flag to the L0 worker that admin role/clearance/is_active writes now use the service-role client
(so the D-1/D-2 triggers are safe to apply).
