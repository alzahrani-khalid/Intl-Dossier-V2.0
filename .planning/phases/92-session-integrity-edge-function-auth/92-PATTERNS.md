# Phase 92: Session Integrity & Edge-Function Auth - Pattern Map

**Mapped:** 2026-08-15
**Files analyzed:** 14 groups (133 edge functions counted as one sweep population with 3 named cores)
**Analogs found:** 13 / 14 (no in-repo analog for the CDP forced-error spec — see "No Analog Found")

All repo facts below re-verified this session (line numbers, import counts, the 133 derivation).
Population check run today: `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l` → **133**. `_shared/auth.ts` importers → **10**.

## File Classification

| New/Modified File                                                                                     | Role          | Data Flow              | Closest Analog                                                                                 | Match Quality                                         |
| ----------------------------------------------------------------------------------------------------- | ------------- | ---------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `supabase/functions/{audit-logs-viewer,data-retention,field-permissions}/index.ts` (3 cores, Class 1) | edge function | request-response       | `supabase/functions/access-requests/index.ts` (target end state)                               | exact                                                 |
| ~130 remaining 2.3x-pinned `index.ts` (sweep, Classes 1/2)                                            | edge function | request-response       | same + `dossiers-update/index.ts` (Class-2 end state)                                          | exact                                                 |
| `supabase/functions/_shared/auth.ts` (Class 3, pin bump)                                              | shared helper | request-response       | itself — already correct `getUser(token)`; only line 2 changes                                 | exact                                                 |
| `frontend/src/store/authStore.ts` (SIGNED_OUT navigation)                                             | store         | event-driven           | own `handleAuthStateChange` + Research Pattern 1                                               | exact (seam), no-repo-precedent (navigate-from-store) |
| `frontend/src/components/layout/Sidebar.tsx` (NavUser mount)                                          | component     | request-response       | own static user card `:101-114` (geometry to preserve)                                         | exact                                                 |
| `frontend/src/components/layout/nav-user.tsx` (adapt + repoint key)                                   | component     | request-response       | `hooks/useResponsive.ts` (`isMobile`), `layout/Header.tsx:102` (`t('common.logout')`)          | role-match                                            |
| `frontend/src/components/settings/sections/SecuritySettingsSection.tsx` (Session group)               | component     | request-response       | its own `SettingsGroup`/`SettingsItem` rows `:132-152`                                         | exact                                                 |
| `frontend/src/pages/delegations/DelegationManagementPage.tsx` (isError branch)                        | page          | request-response       | `pages/WorkingGroupsPage.tsx:237-247` (branch shape only)                                      | role-match                                            |
| Error-state block (extend `EmptyState` or sibling)                                                    | component     | request-response       | `components/empty-states/EmptyState.tsx` + `components/delegation/DelegationList.tsx:71-88`    | exact                                                 |
| `frontend/src/i18n/{en,ar}/{common,settings,delegation}.json`                                         | config (i18n) | —                      | existing keys: `common.json:68` `logout`, `settings` `security.*`, `delegation` `list.empty.*` | exact                                                 |
| `tests/e2e/92-signout.spec.ts`                                                                        | test          | e2e                    | `tests/e2e/01-login.spec.ts:30-41` + `support/pages/LoginPage.ts:18-19,32-34`                  | exact                                                 |
| `tests/e2e/92-delegations-error.spec.ts`                                                              | test          | e2e forced-error       | none in repo (see No Analog Found)                                                             | none                                                  |
| `scripts/probe-edge-auth.sh` (or plan-embedded)                                                       | script        | request-response probe | RESEARCH.md Pattern 3 (no repo analog needed; it IS the source)                                | research                                              |
| Docs sweep (D-17): `ROADMAP.md:285`, `REQUIREMENTS.md`, `STATE.md`, `PROJECT.md`, audit `INDEX.md`    | docs          | —                      | in-place annotated corrections (dated), per D-17                                               | n/a                                                   |

`CARRY-01` is an operator checklist (D-14), not a code file — no pattern assignment. Deleting `header/UserMenu.tsx` is planner's discretion; deletion needs no pattern.

## Pattern Assignments

### AUTH-02 — the edge-function migration (133 files, 3 edit classes)

**Population selector (D-08 — carry the command, never the count):**

```bash
grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts'   # → 0 after sweep
```

**Sweep-shape precedent:** Phase 90's 36/36 CORS migration. Its plan shape is directly reusable —
see `.planning/phases/90-cors-edge-migration/90-02-PLAN.md:42-45,93`: per-chunk plans with
`files_modified` lists, "CODE-MIGRATION ONLY — no deploy (worker sandbox has no Supabase creds).
Deploy + smoke for batch A runs at the orchestrator checkpoint plan after this batch's code merges."
D-09 makes the deploy checkpoint mandatory here too, plus a per-function deploy ledger (Research Pitfall 4).

#### Class 1 — pinned + bare `getUser()` + injected client (the 3 cores + part of the sweep)

**Broken specimen (BEFORE):** `supabase/functions/access-review-detail/index.ts:15,83-97`

```ts
// line 15
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// lines 83-97
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: authHeader },
    },
  },
)
const {
  data: { user: requester },
  error: userError,
} = await supabaseClient.auth.getUser()
```

**Target end state (AFTER):** `supabase/functions/access-requests/index.ts:7,57-61`

```ts
// line 7 — the skill's canonical specifier
import { createClient } from 'jsr:@supabase/supabase-js@2'
// lines 57-61 — explicit token
const token = authHeader.replace('Bearer ', '')
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser(token)
```

**THE EDIT THAT IS NOT A FIND-AND-REPLACE (Research Pitfall 1):** in Class-1 files the
header-injected client serves TWO purposes — auth check AND RLS scoping of every later query.
The edit is exactly: (a) bump the import specifier, (b) add
`const token = authHeader.replace('Bearer ', '')`, (c) pass `token` to `getUser(token)` —
**keeping `{ global: { headers: { Authorization: authHeader } } }` untouched**. A "cleanup" to a
plain client makes auth pass while every query silently runs as `anon` and returns `[]`.
Warning sign: a migrated function returns 200 with `[]` where data existed.

Note `access-requests/index.ts:43` uses a **service-role** client (it deliberately bypasses RLS) —
copy its `getUser(token)` call shape, NOT its client construction. The client construction to
preserve is the one already inside each Class-1 file.

**The 3 cores' own auth blocks (per-file evidence anchors, all same shape):**

| Function                                      | Import (2.39.0) | Injected client | Bare `getUser()` | 401 response style                                                                   |
| --------------------------------------------- | --------------- | --------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `audit-logs-viewer/index.ts`                  | :21             | :371-379        | :382-385         | `errorResponse('Invalid user session', 401, 'AUTH_REQUIRED')` via `_shared/utils.ts` |
| `data-retention/index.ts`                     | :2              | :77-85          | :88-91           | inline bilingual `{ code, message_en, message_ar }`                                  |
| `field-permissions/index.ts`                  | :2              | :165-173        | :176-179         | `createErrorResponse('UNAUTHORIZED', …, ar)` local helper                            |
| `my-delegations/index.ts` (AUTH-04 auth half) | :16             | :92-100         | :103-106         | inline `{ error, code: "UNAUTHORIZED" }`                                             |

Each file keeps its own error-response idiom — the edit touches only the specifier and the `getUser` call.

#### Class 2 — pinned + already `getUser(token)`: specifier bump ONLY

**Specimen already carrying the pattern AND the reason in a comment:** `supabase/functions/dossiers-update/index.ts:2,92-97`

```ts
// line 2 (the only line that changes)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// lines 92-97 — already correct; note the in-repo comment naming the exact defect:
// dossiers-create/get — a bare getUser() 401s valid tokens on @2.39).
const token = authHeader.replace('Bearer ', '')
const {
  data: { user },
} = await supabaseClient.auth.getUser(token)
```

Class-2 members found by: pin matches `2\.3[0-9]` AND file already passes a token
(`dossiers-update`, `ocr-extract`, `smart-import-suggestions`, `assignments-comments-create`, … — derive at plan time).

#### Class 3 — `_shared/auth.ts` (D-06): line-2 bump only

`supabase/functions/_shared/auth.ts:2,15-38` — `validateJWT` already does it right:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'  // ← the only edit
...
const token = authHeader.replace('Bearer ', '')
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) {
  throw new Error('Invalid token or user not found')
}
```

Its 10 importers inherit the fix **only on their own redeploy** — editing `_shared/auth.ts`
redeploys nothing by itself (Research: eszip bundles at deploy time). The deploy ledger must
include all 10 even if their `index.ts` is untouched.

**CORS non-regression:** every specimen above already imports
`getCorsHeaders`/`handleCorsPreflightRequest` from `../_shared/cors.ts` (e.g.
`access-review-detail/index.ts:16`, `data-retention/index.ts:3`). The sweep must leave those
imports and `config.toml` untouched (Phase 90's work rides underneath this one).

---

### `frontend/src/store/authStore.ts` (store, event-driven) — AUTH-03/D-22

**Analog:** its own `SIGNED_OUT` branch — the fix is one line added inside it.

**Live seam** (`authStore.ts:201-212`):

```ts
handleAuthStateChange: async (event: AuthChangeEvent, session: Session | null) => {
  // Handle auth state changes from Supabase (token refresh, sign out, etc.)
  if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
    clearSentryUser()
    addBreadcrumb('Auth state changed: signed out', 'auth', 'info')
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    // ← the navigation line lands here (plain /login, D-12; no redirectTo)
  }
```

**Wiring proof (this handler IS live):** `subscribeToAuthChanges()` at `authStore.ts:264-271` is
consumed by `frontend/src/components/auth/AuthListenerManager.tsx:11`, mounted at
`frontend/src/App.tsx:32`. Router exported at `frontend/src/router/index.tsx:62`
(`export const router = createRouter({ routeTree, … })`).

**No existing programmatic `router.navigate` outside a component exists in the repo** (grep:
only a test file). The pattern source is RESEARCH.md Pattern 1 — with one correction verified
this session: **the import cycle is REAL, use the lazy form.** `router/index.tsx:2` imports
`routeTree.gen`, and both `routes/_protected.tsx` and `routes/index.tsx` import
`@/store/authStore` — so a module-level `import { router } from '@/router'` inside authStore
creates the cycle authStore → router → routeTree → \_protected → authStore. The safe shape:

```ts
// inside the SIGNED_OUT branch — dynamic import breaks the cycle
void import('@/router').then(({ router }) => router.navigate({ to: '/login' }))
```

(Research Pattern 1's own caveat: "or lazy-load via `import('@/router')` inside the handler to
break a cycle" — the cycle check has now been done; take the lazy branch.)

**Five-site classification the plan must reproduce (D-22, evidence not edit list):**
1 live fix site (`authStore.handleAuthStateChange`), 3 benign no-ops
(`useUnifiedWorkRealtime.ts:166`, `useActivityFeed.ts:44`, `ResetPasswordPage.tsx:25`),
1 dead module (`services/auth.ts:635` — zero importers; **editing it is a REJECT condition**).
`_protected.tsx`'s `beforeLoad` is an explicit non-goal (D-18 — the reload path already works).

Note: `authStore.logout()` (`:105-130`) clears state but does not navigate — correct as-is; it
calls `supabase.auth.signOut()`, which fires `SIGNED_OUT`, which now navigates. Do not add a
second navigation inside `logout()`.

---

### `frontend/src/components/layout/Sidebar.tsx` (component) — AUTH-01 mount seam

**Analog:** its own static user card — the block `NavUser` replaces/wraps, preserving visual identity.

**Mount seam** (`Sidebar.tsx:101-114`):

```tsx
{
  /* 2. User card — avatar initials + name + role */
}
;<div className="sb-user mt-3 flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--sidebar-ink)_6%,transparent)] p-2">
  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] font-body text-[11px] font-semibold">
    {initials}
  </div>
  <div className="flex min-w-0 flex-col">
    <span className="font-body text-[13px] font-medium leading-[1.4] truncate">{displayName}</span>
    <span className="font-body text-[10.5px] leading-[1.3] truncate text-[var(--sidebar-ink)]/70">
      {roleLabel}
    </span>
  </div>
</div>
```

Supporting locals already in scope: `getInitials` (`:48-56`), `displayName`/`roleLabel`/`isRTL`
(`:67-71`), `useAuthStore` user (`:60`). UI-SPEC: the mounted control keeps the accent avatar
disc, two-line name+role, and the `--radius-sm` card wash on `--sidebar-bg`.

**Import style analog** (`Sidebar.tsx:28-40`): named imports, `@/` alias, type imports via
`import type`. The mount is `import { NavUser } from './nav-user'` beside the existing
`./navigation-config` relative import.

**Where this Sidebar renders (both mounts inherit NavUser):** desktop column at
`AppShell.tsx:190` (`hidden lg:block`) and the mobile drawer at `AppShell.tsx:238-253`
(`<Drawer.Dialog className="w-[280px] max-sm:w-screen lg:hidden p-0">` wrapping `<Sidebar />`).
So NavUser DOES render on <1024px (inside the drawer) — the `isMobile` adaptation below matters.

---

### `frontend/src/components/layout/nav-user.tsx` (component) — D-23 adaptation + D-24 key repoint

**Unsatisfied dependency (verified):** `nav-user.tsx:15,27` — `useSidebar` from
`@/components/ui/sidebar`; `SidebarProvider` renders nowhere in the app (only defined inside
`components/ui/sidebar.tsx` / `sidebar-collapsible.tsx`, mounted by nothing). Mounting as-is breaks.

**Adaptation analog — the shell's own responsive signal:** `frontend/src/hooks/useResponsive.ts`.
It exposes the **same field name**, so the adaptation is a one-line import swap:

```tsx
// BEFORE (nav-user.tsx:15,27)
import { useSidebar } from '@/components/ui/sidebar'
const { isMobile } = useSidebar()
// AFTER — repo's live responsive hook, identical field
import { useResponsive } from '@/hooks/useResponsive'
const { isMobile } = useResponsive()
```

`useResponsive` reads `--breakpoint-*` CSS vars (mobile = <768px), matching the shell's CSS-only
breakpoints. `isMobile` is used once, at `nav-user.tsx:60`, to pick the dropdown `side`
(`isMobile ? 'bottom' : isRTL ? 'left' : 'right'`) — keep that expression; inside the mobile
drawer `'bottom'` is the correct opening side. Do NOT wrap the shell in `SidebarProvider` (D-23).

**Sole consumer of the dead provider idiom in this file:** the trigger's
`group-data-[collapsible=icon]:*` classes (`:43,:51`) are inert without the provider — harmless
to keep, harmless to drop; planner's call, not a requirement.

**i18n repoint (D-24, all facts verified):**

- `nav-user.tsx:94` today: `t('navigation.logout', 'Logout')` — key missing in both locales,
  inline English renders in BOTH languages.
- The existing key: `frontend/src/i18n/en/common.json:68` `"logout": "Logout"` /
  `ar/common.json:68` `"logout": "تسجيل الخروج"`, nested under a top-level `"common"` object —
  full path inside the namespace is `common.logout`.
- The dead-but-correct usage to copy: `frontend/src/components/layout/Header.tsx:102`
  `{t('common.logout')}`.
- `nav-user.tsx:24` already does `useTranslation('common')`, so `t('common.logout')` resolves
  (dot-form nested lookup inside the common bundle). If the spec's "Sign out" wording is kept,
  change the `en` value at `common.json:68`; leave `ar` untouched. **One key, no new keys** —
  the `t('key', 'English default')` class sweep is Phase 99 / AR-04, not here.

**Testability note for the e2e spec:** `tests/e2e/support/pages/LoginPage.ts:18-19` finds the
control by role: `getByRole('button', { name: /sign out|logout|تسجيل الخروج|خروج/i })`, and
`01-login.spec.ts:34` first tries `getByTestId('user-menu')`. Mounting NavUser with
`data-testid="user-menu"` on the trigger makes the existing spec's happy path light up unchanged.

---

### `frontend/src/components/settings/sections/SecuritySettingsSection.tsx` — AUTH-05/D-02 sign-out row

**Analog:** its own `SettingsGroup` + `SettingsItem` row (imports at `:19` from
`../SettingsSectionCard`). The two-factor row is the exact geometry to copy — label +
description + control on the end side:

**Row pattern** (`SecuritySettingsSection.tsx:132-152`):

```tsx
<SettingsGroup>
  <SettingsItem
    label={t('security.twoFactor')}
    description={t('security.twoFactorDesc')}
    icon={Smartphone}
  >
    <div className="flex items-center gap-3">
      {/* control lives here — for sign-out: a .btn-ghost button, NOT .btn-primary, NOT danger */}
    </div>
  </SettingsItem>
</SettingsGroup>
```

New group title comes from `SettingsGroup title={...}` (see the password-change group at `:193`).
The file already imports `Button` (`:5`) and uses `useTranslation('settings')` (`:34`); new
strings go in the `settings` namespace under `security.*` beside the existing
`signOutConfirm`/`sessionTimeoutDesc` keys (UI-SPEC copy table: "Session" /
"End your session on this device." / EN+AR in the same edit).

**Action wiring:** call the same seam NavUser uses — `useAuth().logout()`
(`nav-user.tsx:5,26,92`) — so both surfaces converge on `authStore.logout()` →
`supabase.auth.signOut()` → `SIGNED_OUT` → the new navigation line. No navigation code in the
component itself. One click, no confirmation dialog (UI-SPEC).

**Scope fence:** `AppShell.tsx:178` (`isSettingsRoute ? 'lg:grid-cols-[0px_1fr]'`) and the
`startsWith('/settings')` check at `AppShell.tsx:125` are `NAV-02`'s problem — do not touch.
AUTH-05 reachability is satisfied by NavUser's two `/settings` links (`nav-user.tsx:80,86`).

---

### `frontend/src/pages/delegations/DelegationManagementPage.tsx` — AUTH-04 UI half

**Today's defect (verified):** `:50-57` destructures only `data, isLoading, refetch` from
`useMyDelegations` — no `isError`. The query layer is already honest:

- `frontend/src/services/user-management-api.ts:481-493` — `supabase.functions.invoke` →
  `if (error) { throw error }` (and throws on empty result).
- `frontend/src/hooks/useDelegation.ts:175-182` — plain `useQuery<MyDelegationsResponse, Error>`,
  so `isError`/`error` are available; the page just never reads them.

**Branch-shape analog** (`frontend/src/pages/WorkingGroupsPage.tsx:129,237-247`):

```tsx
const { data, isLoading, isError, error } = useWorkingGroups({ ... })
...
// Error state
if (isError) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-4">
      <AlertCircle className="size-12 text-destructive" />
      ...
```

**Copy the branch shape, NOT the body:** WorkingGroupsPage renders `error?.message` raw (`:244`)
— explicitly forbidden here (UI-SPEC: "Never the raw error string"; house rule: user-facing
errors never leak internals; `FunctionsHttpError.message` is a supabase-js internal string).

**Placement per UI-SPEC:** the error state replaces the **list area of both tabs** (one failure,
one message → render once above/instead of the `Tabs` content at `:199-250`), and the three stat
cards (`:122-176`) render **em-dash `—`, never `0`** on error — the `stats` memo at `:90-99`
currently returns zeros for missing data; the error branch must bypass that confident zero.
`AlertTriangle` is already imported (`:36`); `refetch` already destructured for the retry CTA.

---

### Error-state block — sibling of the existing empty state

**Analog 1 — geometry** (`frontend/src/components/empty-states/EmptyState.tsx:114-137`, `md` size):

```tsx
<div className={cn('flex flex-col items-center justify-center text-center', sizes.container /* py-10 px-4 sm:py-12 sm:px-6 */)}>
  <div className={cn('flex items-center justify-center rounded-full bg-surface-raised', sizes.iconWrapper)}>
    <Icon className={cn('text-ink-faint', sizes.icon)} />
  </div>
  <h3 className={cn('text-ink', sizes.title /* text-base sm:text-lg md:text-xl font-semibold mb-2 */)}>{title}</h3>
  <p className={cn('text-ink-mute max-w-md', sizes.description)}>{description}</p>
```

and its CTA recipe (`:151-160`): `className="btn-primary inline-flex items-center justify-center"`
with `isRTL ? 'ms-2' : 'me-2'` icon spacing — exactly the "Try again" button the spec wants.

**Analog 2 — the sibling to invert** (`frontend/src/components/delegation/DelegationList.tsx:71-88`):

```tsx
// Empty state
if (delegations.length === 0) {
  ...
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <EmptyIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t(`list.empty.${type}`)}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{t(`list.emptyDescription.${type}`)}</p>
```

**Inversion per UI-SPEC:** same geometry, `AlertTriangle` in `text-danger` on a `bg-danger/10`
circular wrapper (opacity modifier, never a `-soft` utility), `role="alert"` on the container,
`.btn-primary` retry wired to `refetch`. Strings in `delegation` namespace under `list.error.*`
beside the existing `list.empty.*` keys, EN+AR in the same edit. Whether this is an
`EmptyState` variant/tone prop or a sibling `ErrorState` component is the planner's call —
`EmptyState` already has a variant axis (`:6`, `'default' | 'card' | 'inline' | 'compact'`) if
extension is chosen. Note `EmptyState` has no `role="alert"` today — the error rendering must add it.

---

### `tests/e2e/92-signout.spec.ts` — AUTH-01/03/05 e2e

**Analog:** `tests/e2e/01-login.spec.ts` (imports, fixtures, describe shape) — it already
contains a sign-out test written for this exact control:

**Existing sign-out test** (`01-login.spec.ts:30-41`):

```ts
test('signs out and returns to login', async ({ adminPage }) => {
  const login = new LoginPage(adminPage)
  await adminPage.goto('/')
  // Open user menu then click sign out; fall back to direct button.
  const userMenu = adminPage.getByTestId('user-menu')
  if (await userMenu.isVisible().catch(() => false)) {
    await userMenu.click()
  }
  await login.signOut()
  await expect(adminPage).toHaveURL(/\/login/)
})
```

Fixture/page-object conventions: `import { test } from './support/fixtures'` (adminPage fixture),
page objects in `tests/e2e/support/pages/`, env-guarded `base.skip(...)` for missing creds
(`:11-14`). The new spec adds D-04's session-cleared assertion (RESEARCH "Sign-out acceptance
check": `localStorage.getItem('sb-zkrcjzdemdmwhearhfgg-auth-token') === null` — storage key name
is Assumption A1, verify once in a live tab) and AUTH-03's storage-invalidation repro
(RESEARCH Pattern 4: expire `expires_at` AND corrupt `refresh_token`, wait ≤45 s —
corrupting only the refresh token does nothing, Pitfall 2).

---

### `scripts/probe-edge-auth.sh` — AUTH-02 probe (D-16)

No repo analog; RESEARCH.md Pattern 3 is the complete source (login via
`/auth/v1/token?grant_type=password` with `.env.test` creds, then per-set representative curls
recording raw status codes). Constraints already locked: verdict rule stated in acceptance
criteria BEFORE data collection (D-16); probe hits **deployed staging** functions, never repo
source (D-21); never echo credentials (house rule). Anon-key env var name is Assumption A4 —
resolve against `.env.test` at plan time.

## Shared Patterns

### RLS-preserving injected client (apply to every Class-1 edit)

**Source:** any Class-1 file, e.g. `supabase/functions/data-retention/index.ts:77-85`

```ts
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } },
)
```

This construction survives the migration verbatim. Only the import specifier and the
`getUser()` → `getUser(token)` call change. (Research Pitfall 1 — the one edit class that is
not a pure find-and-replace.)

### CORS helper non-regression (apply to all 133)

**Source:** `supabase/functions/_shared/cors.ts` via e.g. `data-retention/index.ts:3`

```ts
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
```

Phase 90's landed sweep; the AUTH-02 sweep must not touch these imports, `config.toml`, or the
`ALLOWED_ORIGINS` secret.

### Single sign-out seam (apply to both UI surfaces)

**Source:** `nav-user.tsx:26,92` (`const { user, logout } = useAuth()` … `onClick={() => logout()}`)
Both surfaces call `useAuth().logout()`; navigation lives ONLY in
`authStore.handleAuthStateChange`'s `SIGNED_OUT` branch. Neither surface navigates itself —
that is what makes one line cover AUTH-01 and AUTH-03.

### i18n both-locales-same-edit (apply to every new string)

**Source:** `frontend/src/i18n/index.ts` static bundle (frontend/CLAUDE.md). New keys land in
`src/i18n/en/<ns>.json` AND `src/i18n/ar/<ns>.json` in the same commit; namespaces `common`,
`settings`, `delegation` are already registered — no loader edits. `public/locales/` is dead;
never touch it. For the one repointed key, dot form per D-24 (matches `Header.tsx:102` and
`nav-user`'s `useTranslation('common')` binding).

### Logical properties + token discipline (apply to all touched UI)

**Source:** `Sidebar.tsx` throughout (e.g. `:162-167` — `ps/pe/ms/me`, `var(--radius-sm)`,
`var(--accent)`); `EmptyState.tsx:151-160` (`.btn-primary`, `isRTL` icon spacing). No raw hex,
no physical directional classes (ESLint errors), radii/row-heights via tokens.

## No Analog Found

| File                                     | Role  | Data Flow        | Reason                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/e2e/92-delegations-error.spec.ts` | test  | e2e forced-error | No spec in `tests/e2e` blocks a network route today (`BriefingPage.ts:32` only _mentions_ future `page.route()` stubs). Use the project's documented forced-error protocol — CDP `Network.setBlockedURLs`, assert `role="alert"` via DOM (project memory + RESEARCH Validation table). Spec scaffolding (fixtures, projects, env guards) still copies `01-login.spec.ts`. |
| navigate-from-store call                 | store | event-driven     | No non-component `router.navigate` exists in the repo. Source is RESEARCH Pattern 1 with the lazy `import('@/router')` form — the import cycle via `_protected.tsx` is verified real (see the authStore assignment).                                                                                                                                                      |

## Metadata

**Analog search scope:** `supabase/functions/**` (population + specimens), `frontend/src/{components,pages,store,hooks,services,i18n,router,routes}`, `tests/e2e/**`, `.planning/phases/90-cors-edge-migration/` (sweep-plan precedent)
**Files read in full or in targeted ranges:** 25
**Pattern extraction date:** 2026-08-15

Key verification results folded in above (things a planner would otherwise re-derive):

- 133 population count reproduces today; `access-requests` = jsr-`@2` + `getUser(token)` end-state specimen; `dossiers-update` = Class-2 specimen with an in-repo comment naming the defect.
- authStore→router import cycle is real → lazy import form is the pattern.
- `useResponsive()` exposes `isMobile` under the same name → one-line `useSidebar` replacement.
- `common.logout` exists in both locales at `common.json:68`; `nav-user` already binds the `common` namespace.
- `01-login.spec.ts:30-41` already tests this sign-out flow via `user-menu` testid + role-regex button — mount NavUser to satisfy it.
- The same `<Sidebar />` renders in the desktop column AND the mobile drawer (`AppShell.tsx:190,238-253`) — NavUser's mobile branch is reachable.
