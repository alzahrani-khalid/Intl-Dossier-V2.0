---
phase: quick-260531-tko
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useWorkingGroups.ts
  - frontend/src/routes/_protected/search.tsx
  - frontend/src/routes/_protected/analytics.tsx
  - frontend/src/auth/LoginPageAceternity.tsx
  - frontend/src/store/authStore.ts
  - frontend/src/i18n/en/common.json
  - frontend/src/i18n/ar/common.json
  - frontend/src/components/forms/FormInputAceternity.tsx
  - frontend/src/hooks/useNotificationCenter.ts
autonomous: true
requirements: [TKO-WALKTHROUGH-FIXES]
user_setup: []

must_haves:
  truths:
    - 'Working-groups list count + soft-delete archive work (no reference to a non-existent dossiers.archived column)'
    - 'Navigating to /search renders the dossier search page instead of bouncing to /dashboard'
    - 'Navigating to /analytics renders the analytics dashboard instead of bouncing to /dashboard'
    - 'Login page has a flat token surface (no gradient) and a working forgot-password flow with en+ar copy'
    - 'Required-field asterisks no longer pollute the screen-reader accessible name on login and shared form input'
    - 'Notifications center fetches from a real, reachable endpoint with no failing primary network call'
  artifacts:
    - path: 'frontend/src/routes/_protected/search.tsx'
      provides: 'Search route rendering DossierSearchPage with validateSearch'
      contains: 'validateSearch'
    - path: 'frontend/src/routes/_protected/analytics.tsx'
      provides: 'Analytics route rendering AnalyticsDashboardPage'
      contains: 'AnalyticsDashboardPage'
  key_links:
    - from: 'frontend/src/hooks/useNotificationCenter.ts'
      to: 'supabase/functions/notifications-center'
      via: "apiGet baseUrl 'edge'"
      pattern: "baseUrl: 'edge'"
    - from: 'frontend/src/auth/LoginPageAceternity.tsx'
      to: 'frontend/src/store/authStore.ts'
      via: 'resetPassword store action'
      pattern: 'resetPassword'
---

<objective>
Apply 6 verified, surgical post-walkthrough fixes. Each task is one atomic commit.
Investigation is complete — every file path, line number, DB fact, and edge-function
behavior below was verified by the orchestrator against the live code, the staging DB
(project zkrcjzdemdmwhearhfgg), and git history. Do NOT re-investigate scope; do NOT
refactor adjacent code; do NOT "improve" unrelated things. Touch only what each task names.

Purpose: Close concrete defects found in a manual walkthrough (broken column reference,
two dead routes, login polish/a11y, shared-input a11y, dead notifications endpoint).
Output: 9 files modified across 6 atomic commits, frontend typecheck passing.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

<project_rules>
Non-negotiable, from CLAUDE.md:

- Design tokens only. No raw hex, no Tailwind color literals (`text-blue-500`), NO gradient backgrounds. Surfaces are flat. Borders `1px solid var(--line)`; no card shadows beyond existing.
- Bilingual: every new user-facing string needs BOTH `en` and `ar` entries.
- RTL-safe: logical properties only (`ms-*`, `ps-*`, `text-start`, `start-*`). Never `ml/mr/pl/pr/left/right/text-left/text-right`.
- Code style: explicit function return types, no `any`, prettier — no semicolons, single quotes, trailing commas, 100-col, 2-space indent, always arrow parens.
- React 19: no `React` import needed for JSX.
  </project_rules>

<interfaces>
<!-- Extracted from the codebase. Use these directly — no exploration needed. -->

DB FACT (verified via Supabase MCP): `public.dossiers` has NO `archived` column.
Archival is expressed via `status` (text) === 'archived'. Other code (search
components, base.schema.ts) already uses `status === 'archived'`.

validateSearch idiom in this repo (from src/routes/\_protected/positions.tsx and
src/routes/\_protected/compare.tsx) — a typed interface + cast-per-field returner:

```
validateSearch: (search: Record<string, unknown>): SearchParams => {
  return {
    q: search.q as string | undefined,
    type: search.type as string | undefined,
    // ...
  }
}
```

DossierSearchPage (src/pages/DossierSearchPage.tsx) reads params via
`useSearch({ from: '/_protected/search' })` typed as:

```
interface SearchParams {
  q?: string
  type?: DossierType | 'all'
  status?: 'all' | 'active' | 'archived'
  myDossiers?: string   // value 'true'
}
```

Named export: `export function DossierSearchPage()`.

AnalyticsDashboardPage (src/pages/analytics/AnalyticsDashboardPage.tsx):

```
interface AnalyticsDashboardPageProps {
  initialState?: AnalyticsUrlState   // OPTIONAL
}
export function AnalyticsDashboardPage({ initialState }: AnalyticsDashboardPageProps)
```

It manages timeRange/activeTab with `useState` seeded from the OPTIONAL `initialState`
prop. It does NOT call `useSearch` from the route. → Task 3 needs NO validateSearch.
Also re-exported (named + default) from src/pages/analytics/index.ts.

store/authStore.ts (the store LoginPageAceternity actually uses — imported as
`useAuthStore` from `../store/authStore`) exposes:

```
login, logout, checkAuth, clearError, handleAuthStateChange
```

It has NO resetPassword. The pattern to add it (proven in services/auth.ts):
`supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`.
NOTE: the verified finding named services/auth.ts, but that is a *different* Zustand
store the login page does not consume. To stay surgical and avoid wiring a second
store into the page, add `resetPassword` to store/authStore.ts (the store already in use).

api-client resolveUrl (src/lib/api-client.ts):

- `baseUrl: 'express'` → `VITE_API_URL + path`
- `baseUrl: 'edge'` → `VITE_SUPABASE_URL + '/functions/v1' + path` (DEFAULT)

EDGE FUNCTION FACT (verified, supabase/functions/notifications-center/index.ts):

- Reads `Authorization` header, builds a client bound to the caller JWT, calls
  `supabaseClient.auth.getUser()` → resolves the calling user (401 if absent). It is
  user-JWT-authenticated, NOT service-role-only-without-binding.
- `path` parser explicitly handles `notifications-center` (switch on GET).
- `getNotifications` returns exactly `{ notifications, nextCursor, hasMore }` for GET
  with `category` / `unreadOnly` / `cursor` / `limit` query params — identical shape to
  what `useNotifications()` expects. → Task 6 takes the "wire to edge" branch; no
  response-parsing changes needed.

i18n auth namespace (en/common.json, ar/common.json) currently ends at `enterMfaCode`.
`auth.forgotPassword` exists in both. `validation.*` does NOT exist as a namespace in
common.json (this is why `t('validation.required')` resolved to a garbled literal).
New keys go under the existing `auth` object: `resetEmailSent`, `enterEmailFirst`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix non-existent dossiers.archived column in useWorkingGroups</name>
  <files>frontend/src/hooks/useWorkingGroups.ts</files>
  <action>
    The `dossiers` table has no `archived` column (verified against the live DB);
    archival is `status === 'archived'`. Fix BOTH sites of this same bug class in this
    one commit:
    - Line 88 (inside useWorkingGroups countQuery): change `.neq('archived', true)` to
      `.neq('status', 'archived')`.
    - Line 301 (inside useDeleteWorkingGroup mutationFn): change
      `.update({ archived: true, status: 'archived' })` to `.update({ status: 'archived' })`
      — drop the non-existent column, keep the status set.
    Do not touch anything else in the file.
  </action>
  <verify>
    <automated>cd frontend && grep -n "archived" src/hooks/useWorkingGroups.ts | grep -v "status', 'archived'" | grep -v "status: 'archived'" | grep -c "'archived', true\|archived: true" | grep -qx 0 && echo PASS</automated>
  </verify>
  <done>No reference to an `archived` column remains; both the count query and the soft-delete update use `status`/`status: 'archived'` only.</done>
</task>

<task type="auto">
  <name>Task 2: Restore /search route to render DossierSearchPage</name>
  <files>frontend/src/routes/_protected/search.tsx</files>
  <action>
    Replace the entire file. Remove the `beforeLoad` redirect. Render the existing,
    complete `DossierSearchPage` (named export from `@/pages/DossierSearchPage`). Add a
    `validateSearch` matching the params DossierSearchPage reads via
    `useSearch({ from: '/_protected/search' })`: `q?: string`, `type?: string`,
    `status?: string`, `myDossiers?: string`. Use the repo's cast-per-field idiom
    (see positions.tsx / compare.tsx in <interfaces>) returning a typed
    `SearchParams` interface. Set `component` to the imported `DossierSearchPage`.
    Explicit return type on validateSearch. No redirect import.
  </action>
  <verify>
    <automated>cd frontend && grep -q "DossierSearchPage" src/routes/_protected/search.tsx && grep -q "validateSearch" src/routes/_protected/search.tsx && ! grep -q "redirect" src/routes/_protected/search.tsx && echo PASS</automated>
  </verify>
  <done>/search renders DossierSearchPage; route declares validateSearch for q/type/status/myDossiers; no redirect remains; typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 3: Restore /analytics route to render AnalyticsDashboardPage</name>
  <files>frontend/src/routes/_protected/analytics.tsx</files>
  <action>
    Replace the entire file. Remove the `beforeLoad` redirect. Render the existing,
    complete `AnalyticsDashboardPage` (named export from `@/pages/analytics`). Set
    `component` to that page. AnalyticsDashboardPage manages its own state from an
    OPTIONAL `initialState` prop and does NOT call `useSearch` from the route — so do
    NOT add validateSearch and do NOT pass props. Just `createFileRoute('/_protected/analytics')({ component: AnalyticsDashboardPage })`.
    No redirect import.
  </action>
  <verify>
    <automated>cd frontend && grep -q "AnalyticsDashboardPage" src/routes/_protected/analytics.tsx && ! grep -q "redirect" src/routes/_protected/analytics.tsx && echo PASS</automated>
  </verify>
  <done>/analytics renders AnalyticsDashboardPage; no redirect remains; no validateSearch added; typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 4: Login polish — flat surface, working forgot-password, a11y asterisk</name>
  <files>frontend/src/auth/LoginPageAceternity.tsx, frontend/src/store/authStore.ts, frontend/src/i18n/en/common.json, frontend/src/i18n/ar/common.json</files>
  <action>
    (a) GRADIENT REMOVAL — Line 54: replace `bg-gradient-to-br from-background to-muted`
    with the flat token surface `bg-background`. Keep the rest of that className
    (`flex min-h-screen items-center justify-center ... p-4`) unchanged.

    (b) WORKING FORGOT-PASSWORD FLOW:
    - In store/authStore.ts: add a `resetPassword: (email: string) => Promise<void>` action
      to the `AuthState` interface AND its implementation, mirroring the existing actions'
      style (set isLoading/error, try/catch, narrow errors). Implementation calls
      `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`
      and throws on error. Explicit return type `Promise<void>`. (NOTE: the verified
      finding named services/auth.ts, but the login page consumes store/authStore — add
      it there to avoid wiring a second store; record this in the SUMMARY.)
    - In LoginPageAceternity.tsx: pull `resetPassword` from `useAuthStore()` (extend the
      existing destructure at line 24). Replace the non-functional
      `<a href="#" ...>{t('auth.forgotPassword')}</a>` (line 145) with a
      `<button type="button">` styled with the SAME classes (`text-sm text-primary hover:text-primary/80`)
      plus a guard to keep it inline-sized (it already sits in the flex row). On click:
      read the current email via react-hook-form — add `getValues` (or `watch`) to the
      `useForm` destructure at lines 30-36 and read `getValues('email')`. If the email is
      empty or fails a basic email check, `toast.error(t('auth.enterEmailFirst'))` and
      return. Otherwise `await resetPassword(email)` then `toast.success(t('auth.resetEmailSent'))`;
      on throw, `toast.error(...)` using the existing error message or a generic key.
      Use the already-imported `react-hot-toast` default `toast`. Mark the handler async
      with an explicit `Promise<void>` return type. Do not change layout/spacing.

    (c) PASSWORD ASTERISK A11Y — Lines 87-89: on the `<span ... aria-label={t('validation.required')}>*</span>`
    set `aria-hidden="true"` and REMOVE the `aria-label`. Keep `className="text-destructive ms-1"`.
    Then ensure the password `<input>` (lines 93-98) carries `required` (the field is
    already validated as required by the zod schema) — add the `required` attribute and/or
    `aria-required="true"` so requiredness is still announced.

    (d) i18n: add to the `auth` object in BOTH en/common.json and ar/common.json
    (after `enterMfaCode`):
      en: "resetEmailSent": "Check your email for a password reset link",
          "enterEmailFirst": "Enter your email first, then select forgot password"
      ar: "resetEmailSent": "تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور",
          "enterEmailFirst": "أدخل بريدك الإلكتروني أولاً ثم اختر نسيت كلمة المرور"
    Keep JSON valid (preserve trailing-comma rules of JSON — no trailing comma on last key).

  </action>
  <verify>
    <automated>cd frontend && ! grep -q "bg-gradient" src/auth/LoginPageAceternity.tsx && grep -q "resetPassword" src/auth/LoginPageAceternity.tsx && grep -q "resetPassword" src/store/authStore.ts && grep -q "resetEmailSent" src/i18n/en/common.json && grep -q "resetEmailSent" src/i18n/ar/common.json && node -e "require('./src/i18n/en/common.json');require('./src/i18n/ar/common.json')" && echo PASS</automated>
  </verify>
  <done>No gradient on login; forgot-password button reads the entered email, validates it, calls resetPassword, and toasts success/guidance using en+ar keys; password asterisk is aria-hidden with no aria-label and the input announces requiredness; both JSON files parse.</done>
</task>

<task type="auto">
  <name>Task 5: a11y required asterisk in shared FormInputAceternity</name>
  <files>frontend/src/components/forms/FormInputAceternity.tsx</files>
  <action>
    Lines 97-101: the required asterisk `<span className="text-danger ms-1" aria-label={t('validation.required')}>*</span>`
    concatenates a garbled name onto the field label. Set `aria-hidden="true"` on the
    span and REMOVE its `aria-label`. Keep `className="text-danger ms-1"`. The `t` import
    is still used elsewhere in the file (help/error text), so leave the `useTranslation`
    hook in place. Then wire requiredness onto the rendered `<input>` (around lines
    122-138): add `aria-required={required ? true : undefined}` to the input's props
    WITHOUT disturbing the existing prop spread (`{...(register ? register(name) : {})}`
    and `{...rest}`) — place `aria-required` as an explicit attribute on the `<input>`
    element alongside `aria-invalid`. Do not change anything else.
  </action>
  <verify>
    <automated>cd frontend && grep -q 'aria-hidden="true"' src/components/forms/FormInputAceternity.tsx && grep -q "aria-required" src/components/forms/FormInputAceternity.tsx && ! grep -q "aria-label={t('validation.required')}" src/components/forms/FormInputAceternity.tsx && echo PASS</automated>
  </verify>
  <done>Asterisk span is aria-hidden with no aria-label; input announces requiredness via aria-required; existing register/rest prop flow untouched.</done>
</task>

<task type="auto">
  <name>Task 6: Point notifications-center hook at the deployed edge function</name>
  <files>frontend/src/hooks/useNotificationCenter.ts</files>
  <action>
    VERIFIED: the deployed `notifications-center` edge function authenticates the caller's
    bearer JWT, handles the `notifications-center` path on GET, and returns exactly
    `{ notifications, nextCursor, hasMore }` for `category`/`unreadOnly`/`cursor`/`limit`
    query params (see <interfaces>). There is NO Express handler for `/notifications-center`
    (backend only has /notifications/counts + /notifications/mark-read), so the current
    `baseUrl: 'express'` primary call always fails and only the catch-fallback works.

    TAKE THE "WIRE TO EDGE" BRANCH: In `useNotifications()` (the `apiGet` call at lines
    99-103), change `{ baseUrl: 'express' }` to `{ baseUrl: 'edge' }`. The path stays
    `/notifications-center?${expressParams.toString()}`. The response shape already
    matches the hook's generic `<{ notifications; nextCursor; hasMore }>` — no parsing
    changes. KEEP the existing Supabase-direct catch fallback (lines 106-143) untouched.
    Do NOT touch useNotificationCounts (it correctly targets /notifications/counts) or any
    other hook. Optionally rename the local `expressParams` variable for accuracy only if
    trivial — but prefer leaving it to minimize the diff; do not over-edit.

    In the SUMMARY, document: branch taken = "wired primary call to edge
    (/notifications-center, baseUrl 'edge'); fallback preserved", and the verification
    that the edge fn authenticates the user JWT and returns the compatible shape.

  </action>
  <verify>
    <automated>cd frontend && grep -A6 "notifications-center?" src/hooks/useNotificationCenter.ts | grep -q "baseUrl: 'edge'" && grep -q "from('notifications')" src/hooks/useNotificationCenter.ts && echo PASS</automated>
  </verify>
  <done>useNotifications primary call targets the edge function (baseUrl 'edge'); Supabase-direct fallback preserved; no other hook changed; no failing primary network call in any environment.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                       | Description                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| browser → edge function (notifications-center) | User JWT crosses; edge fn binds the caller token and resolves user via getUser(); RLS + per-user filtering apply |
| browser → Supabase (resetPasswordForEmail)     | Unauthenticated email submission; Supabase rate-limits and only emails registered addresses                      |

## STRIDE Threat Register

| Threat ID | Category               | Component                               | Disposition | Mitigation Plan                                                                                                                                                      |
| --------- | ---------------------- | --------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-tko-01  | Information Disclosure | password reset (Task 4b)                | accept      | resetPasswordForEmail does not reveal whether an email exists; success toast is generic ("check your email"); no enumeration vector introduced                       |
| T-tko-02  | Spoofing               | notifications-center edge call (Task 6) | mitigate    | edge fn requires Authorization header and resolves the user via getUser() (401 otherwise); client sends the user access_token — no service-role exposure client-side |
| T-tko-03  | Tampering              | dossiers status update (Task 1)         | accept      | update is RLS-scoped to working_group rows the user can edit; no new column or privilege added — strictly removes a write to a non-existent field                    |
| T-tko-SC  | Tampering              | npm/pip/cargo installs                  | accept      | this plan installs NO packages; all libraries (supabase-js, react-hook-form, react-hot-toast, tanstack-router) already present                                       |

</threat_model>

<verification>
After ALL 6 tasks (and per-task atomic commits) are complete, run the frontend
typecheck and confirm it passes:

```
pnpm --filter frontend run type-check
```

(equivalently `cd frontend && pnpm type-check` → `tsc --noEmit`). It MUST exit 0 with
no new errors. If pre-existing unrelated errors appear, confirm they exist on `main`
before this batch and note them — do not fix out-of-scope errors.

Bilingual sanity: confirm en/common.json and ar/common.json both parse and both contain
`auth.resetEmailSent` + `auth.enterEmailFirst`.
</verification>

<success_criteria>

- Task 1: no `archived` column reference remains in useWorkingGroups.ts; both sites use `status`.
- Task 2: /search renders DossierSearchPage with validateSearch; no redirect.
- Task 3: /analytics renders AnalyticsDashboardPage; no redirect; no validateSearch added.
- Task 4: login has flat `bg-background`; forgot-password button calls a real resetPassword with en+ar toasts; password asterisk aria-hidden + input aria-required; both JSON files valid.
- Task 5: shared input asterisk aria-hidden (no aria-label) + input aria-required; prop flow intact.
- Task 6: notifications primary call uses edge function; fallback preserved.
- `pnpm --filter frontend run type-check` passes with no new errors.
- 6 atomic commits (one per task).
  </success_criteria>

<output>
Create `.planning/quick/260531-tko-post-walkthrough-fixes/260531-tko-SUMMARY.md` when done.
Record per-task outcome, the Task 4 store-location decision (authStore vs services/auth),
and the Task 6 branch taken (wired to edge) with its verification note.
</output>

## OUT OF SCOPE (do not touch)

- Doppler / VITE_API_URL env config
- digest jobs
- notification_category_preferences 406
  These are env/ops items explicitly excluded by the orchestrator.
