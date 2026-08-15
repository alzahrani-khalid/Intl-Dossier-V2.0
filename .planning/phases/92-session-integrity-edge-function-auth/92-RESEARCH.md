# Phase 92: Session Integrity & Edge-Function Auth - Research

**Researched:** 2026-08-15
**Domain:** Supabase auth (supabase-js/auth-js version behavior, edge-function JWT validation, client session lifecycle)
**Confidence:** HIGH on the central version-skew mechanism (proven from served artifacts); MEDIUM on GoTrue server-side revocation semantics (flagged)

<user_constraints>

## User Constraints (from 92-CONTEXT.md)

### Locked Decisions

#### Sign-out surfaces (AUTH-01, AUTH-05)

- **D-01:** The live sign-out control is the existing `frontend/src/components/layout/nav-user.tsx`
  (`NavUser`), mounted as the sidebar user card — not a newly written control. `REQUIREMENTS.md
AUTH-01` names this component explicitly ("`NavUser` — which already implements it and is imported
  nowhere — is mounted or its `logout()` path is wired to the live shell"). It already calls
  `useAuth().logout()` at `nav-user.tsx:92`; the defect is purely that nothing imports it.
- **D-02:** `/settings` exposes a second, independent sign-out control. `ROADMAP.md:284` requires
  sign-out "from the sidebar user card **and** from `/settings`" — two surfaces, not one.
- **D-03:** `/settings` is reachable from navigation, per `REQUIREMENTS.md AUTH-05`. The known cause is
  a disagreement between `AppShell.tsx:125` (`pathname.startsWith('/settings')`, which hides the global
  sidebar for the whole subtree) and `routes/_protected/settings.tsx:14` (an exact-match check that
  only renders the settings nav on `/settings` itself). Fix the disagreement; do not add a third nav.
- **D-04:** Sign-out lands the user on `/login` with the session cleared (`ROADMAP.md:284`). Clearing
  is asserted, not assumed — the acceptance check must show the session gone, not just the route
  changed.

#### Edge-function JWT acceptance (AUTH-02)

- **D-05:** The end state per migrated function is `@supabase/supabase-js@2` + `getUser(token)`, the
  house pattern documented in the project's `edge-function-add` skill. `REQUIREMENTS.md AUTH-02`
  specifies this end state; it does not mandate a refactor shape, so consolidating through
  `supabase/functions/_shared/auth.ts` is allowed where a function already imports it, but a helper
  refactor must not become a precondition for the version bump.
- **D-06:** `supabase/functions/_shared/auth.ts` is itself in scope. It is the repo's canonical
  `validateJWT()` helper (used by 10 of 303 functions) and it pins
  `@supabase/supabase-js@2.39.3` at line 2 — the exact deprecated pin this requirement retires. It
  already uses the correct `getUser(token)` call, so this is a pin bump, not a rewrite.
- **D-07:** **`[PARKED — PARK-1]`** The migration _population_ is not settled. `ROADMAP.md:285`'s
  number (`133`) and its wording ("pinning `2.3x` **with** bare `getUser()`") select different sets —
  133 vs 53 — and 110 further functions call bare `getUser()` while already on `@2`. Planning proceeds
  on everything except this task's file list.
- **D-08:** The plan carries the **derivation command**, never the count. This is a count over a
  population the phase's own work mutates, so a frozen number is self-invalidating by construction and
  verify-phase must re-derive it. Under the recommended scope the check is
  `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l` → `0`.
- **D-09:** Migrated functions are **deployed to staging within this phase**. `ROADMAP.md:285` is a
  live claim — "no audited route renders empty because of a 401" cannot be true of an edited-but-
  undeployed function. Editing without deploying does not satisfy the criterion.

#### Session invalidation (AUTH-03)

- **D-10:** The work is to **fix the behaviour of the `onAuthStateChange` handlers that already
  exist**, never to add another subscription. Five already exist —
  `frontend/src/store/authStore.ts:267`, `frontend/src/services/auth.ts:635`,
  `frontend/src/hooks/useUnifiedWorkRealtime.ts:166`, `frontend/src/hooks/useActivityFeed.ts:44`,
  `frontend/src/auth/ResetPasswordPage.tsx:25`. A sixth subscription firing alongside five that
  already fire is a new bug, not a fix. The plan must enumerate all five and state, per site, what it
  does on an invalidated session today and what it must do instead.
- **D-11:** The "Member/Member" ghost shell in `ROADMAP.md:286` is the **symptom these handlers
  produce**, not an independent defect. `services/auth.ts:637-650` already clears user/session/
  isAuthenticated on `SIGNED_OUT` but performs no navigation — the page keeps rendering with
  `role` gone, which is exactly the ghost state described. Route away, do not merely null the state.
- **D-12:** **`[PARKED — PARK-2]`** Whether the forced redirect preserves a return path
  (`redirectTo`) is unsettled by the documents. Recommendation on file is a plain redirect, to avoid
  opening an open-redirect surface inside a security phase.

#### `/delegations` (AUTH-04)

- **D-13:** `/delegations` is fixed **locally in this phase**, both halves: the `my-delegations` calls
  authenticate, and a rejected query renders an error state instead of "You haven't granted any
  delegations." The general data-layer fix that stops repositories swallowing failures is `TRUST-01`
  in Phase 93 — this phase must not pre-empt it, and Phase 93 must not be assumed to cover this.
  Call sites: `frontend/src/services/user-management-api.ts:479`,
  `supabase/functions/my-delegations/index.ts` (pins `@supabase/supabase-js@2.39.0`, calls bare
  `auth.getUser()` at line 106 — so it sits inside the AUTH-02 population and its auth half is fixed
  by that migration).

#### Credential rotation (CARRY-01)

- **D-14:** `CARRY-01` is planned as an **operator act, not code** — a checklist plan with an
  explicit verification step (GitHub Actions secret updated, `.env.test` updated, login smoke
  passing), owned by the operator. `ROADMAP.md:293` states this directly.
- **D-15:** No other criterion in this phase may depend on `CARRY-01`. `ROADMAP.md:293`: "The other
  four criteria do not depend on it and must not wait for it." It held Phase 88 open once already;
  the phase must be able to close its code criteria with `CARRY-01` still outstanding.

### Claude's Discretion

- **`frontend/src/components/layout/header/UserMenu.tsx` is a second orphaned logout menu.** The audit
  named only `NavUser`, but `UserMenu.tsx` is functionally identical (`useAuth().logout()` at line 78,
  the same `/settings` links) and is imported by zero files. Planner's call: delete it in the same plan
  that mounts `NavUser` if it is still unreferenced, or leave it and let the `DEAD` requirement group
  take it. Do not mount both — two logout menus is a worse outcome than one orphan.
- Whether the AUTH-02 migration is one plan or several, and how the deploy is batched, is a planning
  judgment — subject to `D-09` (it does get deployed) and `D-07` (the file list is parked).

### Deferred Ideas (OUT OF SCOPE)

- **The 110 functions calling bare `getUser()` while already on `@2`** — outside every reading of
  AUTH-02's population. If the PARK-1 runtime probe shows any of them 401ing, they belong in Phase 93
  (which already declares `Depends on: Phase 92`), not here.
- **Deleting `header/UserMenu.tsx`** — dead-surface removal is the `DEAD` requirement group's job if
  the planner does not take it opportunistically (see Claude's Discretion).
- **A `redirectTo` return path after forced sign-out** — PARK-2 option B; a self-contained UX
  improvement that can be added later without rework, and one that needs an explicit
  allowlist-against-the-route-tree task if it is ever taken.
- **`/settings` tabs not saving** (`WRITE-05`, the `.upsert()` that omits NOT NULL `email`) — this
  phase only makes `/settings` _reachable_ and gives it a sign-out control. It does not make it save.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                | Research Support                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01  | Sign out from the running app; `NavUser` mounted or its `logout()` wired to the live shell | Mount seam identified: `Sidebar.tsx:101-114` renders a **static** user card (initials + name + role, no dropdown) — `NavUser` replaces exactly this block. `authStore.logout()` (signOut + state clear, **no navigation**) verified — D-04's "lands on /login" is not free; see AUTH-03 seam finding                                                                              |
| AUTH-02  | The 2.3x-pinned edge functions migrated to `@2` + `getUser(token)`                         | Root cause proven from served artifacts: 2.3x pins carry a **caret** gotrue-js dep that esm.sh resolves to **2.112.3 today**, while the 2.39.x wrapper never passes `hasCustomAuthorizationHeader` → bare `getUser()` short-circuits with `AuthSessionMissingError` before any network call. Boundary: supabase-js **≥ 2.43.0** passes the flag. See "The version-skew mechanism" |
| AUTH-03  | Session invalidation bounces the open tab to `/login`                                      | All 5 existing handlers characterized per-site (one is **dead code** — `services/auth.ts` has zero importers). Deterministic repro derived from auth-js source: expire `expires_at` + corrupt `refresh_token` in localStorage → ≤30 s tick → `SIGNED_OUT`. Router exported at `frontend/src/router/index.tsx:62` → navigation from non-React code is available                    |
| AUTH-04  | `/delegations` renders error on rejected calls, real data otherwise                        | `getMyDelegations` (user-management-api.ts:481-493) already **throws** on `functions.invoke` error → `useMyDelegations` (useDelegation.ts:175) surfaces `isError`; the page `routes/_protected/delegations.tsx` has **zero error branches** — UI half is purely "branch on isError". Auth half is inside AUTH-02's population (esm.sh 2.39.0 + bare getUser)                      |
| AUTH-05  | `/settings` reachable from navigation, exposes sign-out                                    | Both sides of the disagreement read and quoted: `AppShell.tsx:125` prefix check vs `settings.tsx:13-14` last-match exact check. No new nav needed                                                                                                                                                                                                                                 |
| CARRY-01 | P88-02 credential rotation (operator act)                                                  | Verification path exists and is documented below: GH secrets `E2E_ANALYST_EMAIL/PASSWORD` + `E2E_ADMIN_EMAIL/PASSWORD` (ci.yml:244-245,300-301,340-341,387-388; e2e.yml:67-68), local `.env.test` (exists, git-ignored), smoke = `tests/e2e/01-login.spec.ts` via `pnpm test:e2e:ci`                                                                                              |

</phase_requirements>

## Summary

The phase's centerpiece question — _why do 2.3x-pinned edge functions 401 valid sessions while
identically-shaped `@2` functions work_ — is now answered from primary evidence, not hypothesis.
The 2.3x pins are not frozen old code: `supabase-js@2.39.x` declares its auth client as a **caret
range** (`@supabase/gotrue-js@^2.56.0` / `^2.60.0`), and Supabase still publishes gotrue-js in
lockstep with auth-js, so esm.sh resolves that caret to **gotrue-js 2.112.3 (current) at build
time**. Modern gotrue's `getUser()` with no argument short-circuits with `AuthSessionMissingError`
when there is no stored session **unless** the client was constructed with
`hasCustomAuthorizationHeader: true` — a constructor option that only supabase-js **2.43.0+**
passes (verified: the 2.39.0 and 2.42.0 built modules contain zero references to the flag; 2.43.0+
contain it). So an old-wrapper function that injects the caller's `Authorization` header and calls
bare `getUser()` gets a modern auth client that ignores the injected header, returns
`AuthSessionMissingError` without any network call, and the function's `if (authError || !user)`
guard turns that into a 401 on a perfectly valid token. Every fresh deploy of a 2.3x-pinned
bare-`getUser()` function produces a broken artifact **today**; whether a given _currently deployed_
artifact is broken depends on what esm.sh served on its deploy date — which is exactly why PARK-1's
runtime probe must hit deployed staging functions, not repo source.

The client-side half (AUTH-01/03/05) is a navigation problem, not a state problem. The
`SIGNED_OUT` machinery works: `authStore.handleAuthStateChange` clears state, and the sidebar's
static user card then renders its `shell.user.noRole` fallback twice — that is literally the
"Member/Member" ghost. Nothing navigates, on deliberate logout or on forced invalidation. One
research surprise refines D-10: `frontend/src/services/auth.ts` — home of the second module-level
`onAuthStateChange` and a _duplicate_ zustand store persisting under the same `'auth-storage'` key —
is imported by **zero** files, so that handler never registers at runtime. The five-site enumeration
the plan owes is: 1 live fix site (authStore), 3 benign no-ops (realtime/activity/reset-password),
1 dead module.

**Primary recommendation:** treat AUTH-02 as a pin migration whose _mechanism_ is now known (carry
the version-skew explanation into the plan so the probe asserts the right thing), fix sign-out
navigation once at the `SIGNED_OUT` seam in `authStore.handleAuthStateChange` (covers deliberate
logout AND forced invalidation with one edit), and keep both PARK decisions open — this research
prices them but does not close them.

## Architectural Responsibility Map

| Capability                               | Primary Tier                                          | Secondary Tier                 | Rationale                                                                                               |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Sign-out control (AUTH-01, AUTH-05)      | Browser/Client (React shell)                          | —                              | Pure frontend: mount `NavUser` in `Sidebar.tsx`, add `/settings` control                                |
| Session clear + redirect (AUTH-03, D-04) | Browser/Client (auth store + router)                  | Supabase Auth (GoTrue)         | `SIGNED_OUT` events originate in the auth client; navigation is the app's job via the exported `router` |
| JWT acceptance (AUTH-02)                 | Edge Functions (Deno)                                 | Supabase Auth `/auth/v1/user`  | Per-function client construction decides whether the token ever reaches GoTrue                          |
| `/delegations` error state (AUTH-04)     | Browser/Client (TanStack Query branch)                | Edge Function `my-delegations` | Query already surfaces `isError`; page must branch on it. Auth half lands in the AUTH-02 sweep          |
| Deploy of migrated functions (D-09)      | Supabase platform (staging `zkrcjzdemdmwhearhfgg`)    | —                              | Deploy-time dependency resolution is part of the defect; editing without deploying changes nothing live |
| Credential rotation (CARRY-01)           | Operator (GitHub secrets, Supabase auth, `.env.test`) | CI (login smoke)               | No code tier owns this; verification is a CI/e2e run                                                    |

## Standard Stack

### Core

No new libraries. The phase moves existing code onto versions/patterns already in the repo.

| Library                              | Version                                                                                                                          | Purpose                                                 | Why Standard                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` (edge, Deno) | `@2` → resolves to **2.112.3** today on both jsr and esm.sh `[VERIFIED: jsr.io meta.json + esm.sh response headers, 2026-08-15]` | Edge-function auth + RLS-scoped queries                 | House pattern per `edge-function-add` skill; 141 functions already on `@2` (96 esm.sh + 45 jsr) |
| `@supabase/supabase-js` (frontend)   | `^2.100.1` `[VERIFIED: frontend/package.json]`                                                                                   | Browser auth client (already modern; no change needed)  | Already past the 2.43.0 flag boundary                                                           |
| `@tanstack/react-router`             | in repo                                                                                                                          | `router.navigate({ to: '/login' })` from non-React code | `router` is exported at `frontend/src/router/index.tsx:62`                                      |
| `@tanstack/react-query`              | v5, in repo                                                                                                                      | `isError` branch on `/delegations`                      | Hook already returns it (`useDelegation.ts:175`)                                                |

### Import specifier landscape (derived 2026-08-15, re-derive at plan time per D-08)

`grep -rhoE "(jsr:|npm:|https://esm\.sh/)@supabase/supabase-js@[0-9.]*" supabase/functions --include='*.ts' | sort | uniq -c`:

| Count | Specifier                                     | Status                                                                   |
| ----: | --------------------------------------------- | ------------------------------------------------------------------------ |
|   109 | `https://esm.sh/@supabase/supabase-js@2.39.0` | 2.3x population (broken-by-skew wrapper)                                 |
|    22 | `https://esm.sh/@supabase/supabase-js@2.39.3` | 2.3x population                                                          |
|     4 | `https://esm.sh/@supabase/supabase-js@2.39.7` | 2.3x population                                                          |
|     1 | `https://esm.sh/@supabase/supabase-js@2.38.4` | 2.3x population (matches `2\.3[0-9]`)                                    |
|    25 | `https://esm.sh/@supabase/supabase-js@2.45.0` | old pin but **≥ 2.43.0** → passes the flag; outside AUTH-02's population |
|     1 | `https://esm.sh/@supabase/supabase-js@2.49.2` | ≥ 2.43.0 → fine by shape                                                 |
|    96 | `https://esm.sh/@supabase/supabase-js@2`      | current wrapper + current auth                                           |
|    45 | `jsr:@supabase/supabase-js@2`                 | skill's canonical form; current                                          |

The migration target specifier per the skill is `jsr:@supabase/supabase-js@2`. Note the repo's `@2`
functions today split across esm.sh and jsr; both resolve to 2.112.3 `[VERIFIED: curl of both registries]`.
Whether the sweep normalizes esm.sh-`@2` files to jsr is planner's call — it is cosmetic, both work.

### Alternatives Considered

| Instead of                                         | Could Use                                                      | Tradeoff                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jsr:@supabase/supabase-js@2` (floating)           | Pin an exact current version (`@2.112.3`)                      | Floating `@2` re-resolves per deploy (behavior drift risk — this phase's defect IS drift); an exact pin freezes behavior but re-creates "deprecated pin" debt later. D-05 locks `@2`; note the tradeoff, follow the lock                                                                        |
| Bare `getUser()` + injected header (skill shape 1) | `getUser(token)` explicit (skill shape 2, requirement wording) | On `@2` **both authenticate** (verified from 2.112.3 source: explicit-jwt path bypasses session machinery; injected-header path passes via `hasCustomAuthorizationHeader`). `getUser(token)` is additionally immune to any future session-resolution change — matches the requirement's wording |

**Installation:** none — no npm/pip installs. Edge imports are URL/jsr specifiers resolved at deploy.

## Package Legitimacy Audit

This phase installs **no new packages**. The only dependency change is a version-specifier edit of
`@supabase/supabase-js` — the official Supabase client, already used in 303 edge functions and both
app workspaces. Registry identity confirmed via jsr.io (`@supabase/supabase-js`, latest 2.112.3) and
npm (`2.112.3`), matching official Supabase docs. slopcheck not run: nothing new is installed, and
`pip`-based tooling has no bearing on Deno URL imports of an already-vendored official package.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### The version-skew mechanism (AUTH-02 root cause) — the load-bearing finding

**Evidence chain, each step verified 2026-08-15:**

1. `npm view @supabase/supabase-js@2.39.3 dependencies` → `@supabase/gotrue-js: ^2.60.0` (2.39.0 → `^2.56.0`). **The pin is not a lockfile** — no import map or lockfile exists for edge functions (one bare `index.ts` per function).
2. `npm view @supabase/gotrue-js version` → **2.112.3**. Supabase still publishes gotrue-js in lockstep with auth-js, so the caret has 50+ newer versions to float to.
3. `curl https://esm.sh/@supabase/supabase-js@2.39.3` → imports `/@supabase/gotrue-js@^2.60.0`, and `curl -I 'https://esm.sh/@supabase/gotrue-js@^2.60.0?target=es2022'` → `x-esm-path: /@supabase/gotrue-js@2.112.3/...`. **A "2.39.3-pinned" function bundles the 2026 auth client under the 2023 wrapper.**
4. gotrue-js 2.112.3 built source, `_getUser` (deobfuscated):

```js
// Source: https://esm.sh/@supabase/gotrue-js@2.112.3/es2022/gotrue-js.mjs (deobfuscated)
async _getUser(jwt) {
  if (jwt) return request('GET', `${this.url}/user`, { headers: this.headers, jwt }) // explicit token: always works
  return this._useSession(async (result) => {
    const { data, error } = result
    if (error) throw error
    if (!data.session?.access_token && !this.hasCustomAuthorizationHeader) {
      return { data: { user: null }, error: new AuthSessionMissingError() }   // ← the "401" path, no network call
    }
    return request('GET', `${this.url}/user`, { headers: this.headers, jwt: data.session?.access_token ?? undefined })
  })
}
```

5. `hasCustomAuthorizationHeader` **defaults to false and is set only from a constructor option** — it is NOT derived from headers inside GoTrueClient. The current supabase-js wrapper passes it: `hasCustomAuthorizationHeader: Object.keys(this.headers).some(c => c.toLowerCase() === 'authorization')` `[VERIFIED: supabase-js@2.112.3 built module]`.
6. Boundary scan of built modules on esm.sh: refs to the flag — `2.39.0: 0`, `2.42.0: 0`, **`2.43.0: 1`**, `2.44.0: 1`, `2.45.0: 1`, `2.49.2: 1`, `2.112.3: 1`. **supabase-js ≥ 2.43.0 is the safe wrapper.** (Community corroboration: the break was first reported against 2.42.5 — supabase-js issues #1024/#1025, auth-js #881 `[CITED: github.com/supabase/supabase-js/issues/1024]`.)

**Consequences the plan should encode:**

- **The 133 (2.3x pins, `index.ts`)**: any that call bare `getUser()` produce a broken artifact on
  every fresh deploy from now on, and possibly already in production depending on deploy date. Any
  that pass `getUser(token)` (83 of 136 by PARK-1's derivation) work — the explicit-jwt path is
  version-independent — but sit on a nondeterministic caret. **The pin retirement fixes a
  nondeterminism, not only a bug** — this is a new, evidence-backed argument for PARK-1 option (A)
  that the operator should see (it strengthens (A) without the researcher closing the park).
- **The 110 on `@2` with bare `getUser()`**: fine **by source** (current wrapper passes the flag;
  the skill's own `tasks-get` template is this exact shape). Whether their _deployed_ artifacts are
  fine is a deploy-date question — the probe answers it. Per the deferred list, any that probe broken
  go to Phase 93.
- **The 25 pinned `2.45.0` + 1 pinned `2.49.2`**: outside AUTH-02's population and fine by shape
  (≥ 2.43.0). Do not let a "retire all old pins" impulse pull them in — that is scope the operator
  has not granted.
- **Deployed artifacts are runtime state.** Supabase bundles dependencies at deploy time (eszip).
  Editing the repo changes nothing live (D-09), and a _redeploy without edit_ can silently flip a
  function from working to broken (caret re-resolution). The probe must therefore run against
  **deployed staging functions**, and verification must combine repo grep (source) + probe (live).

### System Architecture Diagram

```
Browser (React SPA)
  │  supabase.functions.invoke('fn', …)          Authorization: Bearer <user JWT> + apikey
  ▼
Supabase API gateway  ── verify_jwt=true (default; config.toml lists only 3 exceptions)
  │                       rejects absent/malformed JWT before the handler runs
  ▼
Edge Function (Deno)  ── createClient(URL, ANON_KEY, { global: { headers: { Authorization } } })
  │
  ├─ auth.getUser()          [bare]     → needs hasCustomAuthorizationHeader (wrapper ≥2.43.0) ──┐
  ├─ auth.getUser(token)     [explicit] → always hits /auth/v1/user with the token ─────────────┤
  │                                                                                             ▼
  │                                                              GoTrue  /auth/v1/user  → user | 401
  ▼
PostgREST queries with injected JWT  →  RLS enforces (this is why the injected client must survive
                                        any getUser(token) refactor — see Pitfall 1)

Session end (client):
  GoTrue client _removeSession()  ──emits──▶  SIGNED_OUT  ──▶  5 subscription sites
    triggers: signOut(); refresh failure WITH access token also expired; invalid stored session
    NOT triggered by: refresh failure while access token still valid ("preserving session" branch)
  Site map:  authStore.handleAuthStateChange (LIVE, clears state, must ALSO navigate)
             services/auth.ts:635 (DEAD MODULE — zero importers, never registers)
             useUnifiedWorkRealtime:166 / useActivityFeed:44 (benign no-ops)
             ResetPasswordPage:25 (PASSWORD_RECOVERY only, untouched)
```

### Pattern 1: Fix sign-out landing at the SIGNED_OUT seam, once

**What:** Add navigation to `/login` in `authStore.handleAuthStateChange`'s `SIGNED_OUT` branch
(`store/authStore.ts:201-212`), using the exported `router` (`frontend/src/router/index.tsx:62`).
**When to use:** This one edit covers BOTH deliberate logout (D-01/D-02/D-04 — `logout()` calls
`supabase.auth.signOut()`, which fires `SIGNED_OUT`) and forced invalidation (D-10/D-11). Putting
navigation inside `logout()` instead would fix only the deliberate path and leave the ghost shell.
**Example:**

```ts
// Source: repo — store/authStore.ts SIGNED_OUT branch + router/index.tsx exported router
import { router } from '@/router' // module-level import is safe; authStore is not imported by the router

if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
  clearSentryUser()
  set({ user: null, isAuthenticated: false, isLoading: false, error: null })
  // PARK-2: plain redirect recommended; if the operator picks (B), the redirectTo
  // param needs an allowlist-against-the-route-tree task, not a bare param.
  void router.navigate({ to: '/login' })
}
```

Check the import graph before landing this (`router/index.tsx` must not import the store, or lazy-load
via `import('@/router')` inside the handler to break a cycle). `_protected.tsx`'s `beforeLoad` guard
covers the reload case; the handler covers the open-tab case — both are needed, only the second is missing.

### Pattern 2: The three migration edit classes (AUTH-02)

Whatever population PARK-1 settles on, every file falls into one of three mechanical classes:

```ts
// CLASS 1 — pinned + bare getUser() + injected header (the broken-by-skew set; my-delegations is one)
// BEFORE
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } },
})
const {
  data: { user },
  error,
} = await supabaseClient.auth.getUser()
// AFTER  (specifier bump + explicit token; KEEP the injected client for RLS queries)
import { createClient } from 'jsr:@supabase/supabase-js@2'
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } },
})
const token = authHeader.replace('Bearer ', '')
const {
  data: { user },
  error,
} = await supabaseClient.auth.getUser(token)

// CLASS 2 — pinned + already getUser(token) (83 files by PARK-1's derivation): specifier bump ONLY.
// CLASS 3 — _shared/auth.ts (D-06): line-2 specifier bump ONLY; validateJWT already calls getUser(token).
//           NOTE: its 10 importers inherit the fix, but each still needs ITS OWN deploy to re-bundle
//           the shared helper — editing _shared/auth.ts redeploys nothing by itself.
```

### Pattern 3: The PARK-1 runtime probe (deployed-artifact ground truth)

```bash
# Source: standard Supabase REST auth; creds from .env.test (never echo them)
set -a; source .env.test; set +a
JWT=$(curl -s -X POST "https://zkrcjzdemdmwhearhfgg.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" | python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])')
# one representative per set — record status codes:
for fn in my-delegations <a-pinned-token-passing-fn> tasks-get; do
  printf '%s -> ' "$fn"
  curl -s -o /dev/null -w '%{http_code}\n' "https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/$fn" \
    -H "Authorization: Bearer $JWT" -H "apikey: $VITE_SUPABASE_ANON_KEY"
done
```

What the probe must assert, given the mechanism: a 401 from a Class-1 function is expected
(pre-migration) and must flip to non-401 after migrate+deploy; a 401 from an `@2` bare-`getUser()`
function is a _deploy-date artifact_ finding that routes to Phase 93, not into this phase's scope.
(Exact env var names for the anon key: check `.env.test` / `frontend/.env` — `[ASSUMED]` the anon key
is available locally as a `VITE_SUPABASE_*` variable; adjust to the actual name at plan time.)

### Pattern 4: Deterministic AUTH-03 repro (invalidate a session out-of-band)

Derived from gotrue-js 2.112.3 source, all branches verified in the built module:

- `SIGNED_OUT` is emitted from exactly **one** place: `_removeSession()`.
- The auto-refresh ticker runs every **30 s** (`L = 30*1e3` in the built module) and acts when the
  session is within the expiry margin or expired.
- On refresh failure, gotrue **preserves the session if the access token is still valid** (debug
  string in the artifact: `"refresh failed, access token still valid — preserving session"`). So
  corrupting only the refresh token does NOT sign the tab out.
- No `storage` event listener exists in the built module → cross-tab sign-out propagation is not
  push-based; do not build the repro on a second tab.

```ts
// Playwright: force the open tab into the invalidated-session path, no reload.
await page.evaluate(() => {
  const key = 'sb-zkrcjzdemdmwhearhfgg-auth-token' // sb-<project-ref>-auth-token
  const s = JSON.parse(localStorage.getItem(key)!)
  s.expires_at = Math.floor(Date.now() / 1000) - 3600 // access token expired → no "preserve" branch
  s.refresh_token = 'invalid-refresh-token' // refresh must fail
  localStorage.setItem(key, JSON.stringify(s))
})
// next tick (≤30 s) → refresh fails + access token expired → _removeSession → SIGNED_OUT
await page.waitForURL('**/login', { timeout: 45_000 })
```

Alternative server-side invalidation (delete the user's `auth.sessions` rows via
`mcp__supabase__execute_sql`, or `auth.admin.signOut(jwt, 'global')`) genuinely revokes the session,
but the open tab only notices at its next refresh attempt — with 1-hour access tokens that is up to
~55 minutes, so it is the _truthful_ invalidation but the _slow_ repro. Whether GoTrue's
`/auth/v1/user` rejects a revoked-but-unexpired access token could not be verified this session
(see Assumptions Log A3) — the storage-manipulation repro above avoids depending on it.

### Anti-Patterns to Avoid

- **Navigation inside `logout()` only:** fixes deliberate sign-out, leaves the forced-invalidation
  ghost shell — the seam is the `SIGNED_OUT` handler (covers both).
- **A sixth `onAuthStateChange` subscription:** explicitly ruled out (D-10, RULING-P92-01 R3).
- **"Normalizing" the 2.45.0/2.49.2 pins into the sweep:** they are ≥ 2.43.0, fine by shape, and
  outside every PARK-1 candidate population.
- **Treating `grep` results as live behavior:** deployed artifacts ≠ repo source (deploy-time
  bundling). Source grep verifies the edit; only the probe verifies the criterion's live claim.

## Don't Hand-Roll

| Problem                                | Don't Build                                   | Use Instead                                                                                                                                         | Why                                                                                                                     |
| -------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| JWT validation in edge functions       | Manual JWT decode/verify (jose, jwt.io logic) | `getUser(token)` against GoTrue (`_shared/auth.ts` `validateJWT` or inline)                                                                         | GoTrue checks signature, expiry, aud, and (server-side) session validity; hand-rolled decode misses revocation entirely |
| Post-login return path (if PARK-2 → B) | Bare `redirectTo` search param                | TanStack Router typed search + allowlist against the route tree                                                                                     | Open-redirect surface; CONTEXT already flags the allowlist task as the price of option B                                |
| Sign-out UI                            | New dropdown                                  | `NavUser` (`nav-user.tsx`, complete: avatar, /settings links, logout at line 92)                                                                    | AUTH-01 is a mount, not a build (D-01); a static card to replace already exists at `Sidebar.tsx:101-114`                |
| CORS in touched functions              | Per-function headers                          | `_shared/cors.ts` origin-validated helpers                                                                                                          | Phase 90 precedent; the sweep must not regress it                                                                       |
| Batch deploy                           | Ad-hoc per-function shell hops                | `supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg` in a loop (or MCP `deploy_edge_function`), with a per-function success record | 130+ deploys need a resumable record — partial deploys are the failure mode, not deploy syntax                          |

**Key insight:** every hard problem in this phase is already solved by something in the repo (the
skill's auth shapes, Phase 90's sweep shape, the exported router, the existing `isError` from
TanStack Query). The phase is wiring, version hygiene, and _proof_ — not construction.

## Runtime State Inventory

This is a migration phase; repo edits alone change nothing live.

| Category                | Items Found                                                                                                                                                                                            | Action Required                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployed edge artifacts | 303 functions on staging with **deploy-date-dependent** bundled auth clients (caret resolution). The audit's 401s are properties of these artifacts, not of repo source                                | Migrate + **redeploy every file in the chosen population** (D-09); `_shared/auth.ts`'s 10 importers each need their own redeploy to pick up the helper bump      |
| Live service config     | `verify_jwt` per function in `config.toml` (3 exceptions listed; all others default `true`) — unchanged by this phase. `ALLOWED_ORIGINS` Supabase secret (Phase 90) — must survive the sweep untouched | None — verify the sweep does not touch `config.toml` or CORS imports                                                                                             |
| Browser-stored state    | zustand `persist` key `'auth-storage'` (user, isAuthenticated, mfaConfig) + supabase key `sb-zkrcjzdemdmwhearhfgg-auth-token` in localStorage                                                          | None to migrate — but sign-out acceptance (D-04) must assert the supabase key is gone, and the SIGNED_OUT handler's `set()` already rewrites the persisted store |
| Secrets/env vars        | GH Actions: `E2E_ANALYST_EMAIL/PASSWORD`, `E2E_ADMIN_EMAIL/PASSWORD` (ci.yml ×3 jobs, e2e.yml). Local: `.env.test` (exists, git-ignored). Staging auth user rows                                       | CARRY-01 rotation touches all three stores; nothing else in the phase reads them                                                                                 |
| Build artifacts         | None — edge functions have no local build output; frontend bundle rebuilt by CI                                                                                                                        | None                                                                                                                                                             |

## Common Pitfalls

### Pitfall 1: getUser(token) conversion that drops the injected client

**What goes wrong:** RLS silently stops applying — queries run as `anon`, returning empty sets (the
exact "failure rendered as emptiness" this milestone exists to kill).
**Why it happens:** In Class-1 functions the header-injected client serves TWO purposes: auth check
AND RLS scoping of every subsequent query. A refactor that "cleans up" to a plain client +
`getUser(token)` keeps auth working but de-scopes the queries.
**How to avoid:** The Class-1 edit keeps `{ global: { headers: { Authorization: authHeader } } }`
and only changes the import specifier + adds the token argument.
**Warning signs:** A migrated function returns 200 with `[]` where data existed before.

### Pitfall 2: AUTH-03 repro that only corrupts the refresh token

**What goes wrong:** Nothing happens; the test times out and gets "fixed" with a reload, which tests
the wrong path (`beforeLoad` guard, not the open-tab handler).
**Why it happens:** gotrue preserves the session on refresh failure while the access token is still
valid (verified branch in 2.112.3). `SIGNED_OUT` needs refresh failure AND an expired access token.
**How to avoid:** Set `expires_at` into the past _and_ corrupt `refresh_token`; wait ≥ one 30 s tick.

### Pitfall 3: Counting `services/auth.ts` as a live handler

**What goes wrong:** The plan budgets a fix for a handler that never runs, or worse, "fixes" it and
declares AUTH-03 done.
**Why it happens:** `frontend/src/services/auth.ts` is imported by zero files (verified by grep over
`frontend/src`); its module-level `onAuthStateChange` and its duplicate zustand store (same
`'auth-storage'` persist key as `store/authStore.ts` — a latent collision if ever imported) are dead.
**How to avoid:** Per-site table in the plan: authStore = the fix site; realtime/activity/reset =
documented no-ops; services/auth.ts = dead module (note for the DEAD requirement group, or delete
under Claude's-discretion if the planner takes UserMenu.tsx opportunistically anyway).

### Pitfall 4: Verifying the sweep by grep alone

**What goes wrong:** Repo shows 0 old pins; staging still 401s (undeployed functions), or an `@2`
function 401s because its _deployed_ artifact predates the fix — and verify-phase signs a false claim.
**Why it happens:** Deploy-time bundling (see Runtime State Inventory).
**How to avoid:** Two-sided verification: D-08's grep → 0 (source) + probe of representative deployed
functions incl. `my-delegations` → non-401 (live). Keep a per-function deploy ledger in the plan.

### Pitfall 5: The `/settings` fix that re-breaks the sidebar suppression

**What goes wrong:** Making `/settings` reachable by removing `AppShell.tsx:125`'s prefix check
restores the global sidebar on top of SettingsLayout's own 240px nav column — two nav columns (the
F18/D-85-03 comment at that line documents why suppression exists).
**How to avoid:** D-03 says fix the _disagreement_ — the exact-match check at
`routes/_protected/settings.tsx:13-14` (last-match `pathname === '/settings'`) vs the prefix check.
The fix makes the settings nav render for the whole subtree (or routes children through the settings
layout), not un-suppress the global sidebar.

### Pitfall 6: Two logout menus

**What goes wrong:** Mounting `NavUser` while `header/UserMenu.tsx` also gets wired somewhere.
**How to avoid:** Mount only `NavUser` (D-01); UserMenu.tsx stays orphaned or is deleted (discretion).

### Pitfall 7: A dead-code deletion sweep riding on the phase

**What goes wrong:** Scope creep into the DEAD requirement group inside a security phase.
**How to avoid:** Only `UserMenu.tsx` (explicit discretion) and possibly `services/auth.ts` (same
rationale, discovered this session — flag to planner as the same discretionary call) qualify;
everything else waits.

## Code Examples

### `/delegations` error branch (AUTH-04, UI half)

```tsx
// Source: repo — useDelegation.ts:175 already surfaces isError; delegations.tsx has no branch today
const { data, isError, error, refetch } = useMyDelegations(params)
if (isError) {
  return <ErrorState onRetry={refetch} /> // role="alert"; mirror an existing error state component
}
```

Error-state precedent: the repo's forced-error UAT protocol asserts `role="alert"` via DOM (see
memory: CDP `Network.setBlockedURLs` protocol) — reuse that assertion shape. Note
`supabase.functions.invoke` rejects with `FunctionsHttpError` whose message does NOT include the
response body — `getMyDelegations` already throws it (`user-management-api.ts:481-493`), so the query
layer is honest; only the page swallows it. UI must satisfy the design system (Linear dark, tokens,
no raw hex, logical properties) since this phase carries `UI hint: yes`.

### Sign-out acceptance check (D-04 — "session gone, not just route changed")

```ts
// Playwright, after clicking logout:
await page.waitForURL('**/login')
const gone = await page.evaluate(
  () => localStorage.getItem('sb-zkrcjzdemdmwhearhfgg-auth-token') === null,
)
expect(gone).toBe(true)
// plus: authenticated fetch fails — e.g. reload lands on /login, not the shell
```

### CARRY-01 operator checklist skeleton (verification path found in repo)

1. Rotate the staging users' passwords (Supabase dashboard or `auth.admin.updateUserById` via MCP).
2. Update GH secrets: `E2E_ANALYST_EMAIL/PASSWORD`, `E2E_ADMIN_EMAIL/PASSWORD`
   (consumed at `.github/workflows/ci.yml:244-245,300-301,340-341,387-388`, `.github/workflows/e2e.yml:67-68`).
3. Update local `.env.test` (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`; template `.env.test.example:18-19`).
4. Smoke: `pnpm test:e2e:ci` (or narrowly `pnpm exec playwright test tests/e2e/01-login.spec.ts --project=chromium-en`).
   Note e2e.yml runs against the **deployed** app (per project memory) — a green run needs the deploy current.

## State of the Art

| Old Approach                                          | Current Approach                                                                                                                                                                                       | When Changed                                                                                                 | Impact                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Bare `getUser()` + injected header on any supabase-js | Works only when the wrapper passes `hasCustomAuthorizationHeader` (supabase-js ≥ 2.43.0)                                                                                                               | Break introduced ~2.42.5 (Apr 2024, community reports); flag wired from 2.43.0 (verified in built artifacts) | The entire AUTH-02 defect class                                                                                         |
| `https://esm.sh/...@2.39.x` pins                      | `jsr:@supabase/supabase-js@2` (skill canonical)                                                                                                                                                        | Repo convention since the skill landed                                                                       | Migration target specifier                                                                                              |
| Supabase docs: header-injection + bare `getUser()`    | Docs now show a `withSupabase({ auth: 'user' })` wrapper with platform-verified JWT `[CITED: supabase.com/docs/guides/functions/auth]`; the older explicit-token pattern lives under "auth-legacy-jwt" | Docs revision (2025-2026)                                                                                    | Informational only — D-05 locks the house pattern (`@2` + `getUser(token)`); do not adopt the new wrapper in this phase |

**Deprecated/outdated:** the audit's framing "133 functions failing to validate JWTs" — corrected in
MILESTONES.md 2026-08-15; PARK-1 and this research replace it with the pin/shape/skew model.

## Assumptions Log

| #   | Claim                                                                                                                                                                          | Section                   | Risk if Wrong                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | localStorage key is `sb-zkrcjzdemdmwhearhfgg-auth-token` (`sb-<project-ref>-auth-token` convention; no custom `storageKey` in `lib/supabase.ts`)                               | AUTH-03 repro, D-04 check | Repro/assert scripts read the wrong key — verify once in a live tab before locking the spec `[ASSUMED]`                                  |
| A2  | Auto-refresh expiry margin ≈ 90 s (tick 30 s is verified; margin constant not extracted)                                                                                       | AUTH-03 repro timing      | Only affects wait budget; 45 s timeout already covers one tick `[ASSUMED]`                                                               |
| A3  | GoTrue `/auth/v1/user` may reject a revoked-but-unexpired token (server-side session check) — **unverified both ways**                                                         | Pattern 4 alternative     | If false, server-side revocation tests of AUTH-02 need an expired token instead; the recommended repro avoids the dependency `[ASSUMED]` |
| A4  | Local anon key env var name for the probe script (`VITE_SUPABASE_ANON_KEY` or similar in `.env.test`/`frontend/.env`)                                                          | Pattern 3                 | Probe script needs a one-line rename `[ASSUMED]`                                                                                         |
| A5  | Break-introducing version ~2.42.5 (community reports; not reproduced from artifacts this session — only the 2.42.0=absent / 2.43.0=present flag boundary is artifact-verified) | State of the Art          | None — no repo pin sits between 2.39.7 and 2.45.0 `[CITED: github.com/supabase/supabase-js/issues/1024]`                                 |

## Open Questions

1. **PARK-1 — the AUTH-02 population (operator decision; NOT closed here).**
   - What we know now that PARK-1 didn't: the 2.3x pins are nondeterministic (caret → 2.112.3 at
     deploy time) — every fresh deploy of a Class-1 function is broken _today_, and even the 83
     token-passing pins float their entire client stack per deploy. This materially strengthens
     option (A) (all 133): it retires a nondeterminism, not just a deprecated version.
   - What's unclear: which _deployed_ artifacts are currently broken (deploy-date dependent).
   - Recommendation: keep PARK-1's own recommendation ((A) + probe) and surface the caret finding to
     the operator alongside it; the probe (Pattern 3) is a small, plannable task either way.
2. **PARK-2 — forced-redirect return path (operator decision; NOT closed here).**
   - Cost accounting from this research: option (A) is one line inside the existing handler (Pattern
     1). Option (B) adds `/login` + an allowlist task and pulls the login route into the phase's
     files_modified. Nothing found this session changes PARK-2's on-file recommendation (A).
3. **Does anything beyond `/delegations` in the audited-route set depend on a Class-1 function?**
   The criterion says "no audited route renders empty because of a 401" — the plan needs the audit's
   route→function mapping (adminops.md F2) cross-checked against the chosen population, or the probe
   extended to the audited routes' functions specifically.

## Environment Availability

| Dependency                             | Required By                     | Available                                                                           | Version                                | Fallback                           |
| -------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------- |
| Supabase CLI                           | edge deploys (D-09)             | ✓                                                                                   | 2.106.0 (`/opt/homebrew/bin/supabase`) | MCP `deploy_edge_function`         |
| Supabase MCP                           | migrations/SQL probes/deploys   | ✓ (project-configured)                                                              | —                                      | CLI                                |
| Deno                                   | local type-sanity of edge edits | ✓                                                                                   | 2.8.1                                  | not blocking (no local build step) |
| esm.sh / jsr.io reachability           | deploy-time dep resolution      | ✓ (verified by the curls above)                                                     | —                                      | none — outage blocks deploys       |
| `.env.test`                            | probe + smokes                  | ✓ (exists, git-ignored)                                                             | —                                      | `.env.test.example` template       |
| Playwright + configs                   | AUTH-01/03/04 e2e               | ✓ (`playwright.config.ts` root, `testDir: tests/e2e`, projects incl. `chromium-en`) | —                                      | —                                  |
| Staging project `zkrcjzdemdmwhearhfgg` | everything live                 | ✓ (per CLAUDE.md)                                                                   | PostgreSQL 17.6                        | —                                  |

**Missing dependencies with no fallback:** none identified.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frameworks         | Vitest (unit — `frontend: pnpm test` → vitest), Playwright (e2e — root `playwright.config.ts`, `testDir: tests/e2e`, `baseURL` = `E2E_BASE_URL` or `http://localhost:5173`) |
| Quick run command  | `pnpm --filter frontend test -- run <file>` / `pnpm exec playwright test <spec> --project=chromium-en --no-deps`                                                            |
| Full suite command | `pnpm test` (turbo) / `pnpm test:e2e:ci` (chromium-en + chromium-ar-smoke)                                                                                                  |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                | Test Type                                                                                          | Automated Command                                                                                  | File Exists?       |
| -------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ |
| AUTH-01  | Logout from sidebar user card → /login, session cleared | e2e                                                                                                | `pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps`           | ❌ Wave 0          |
| AUTH-02  | Valid JWT accepted by migrated deployed functions       | probe script (staging, curl)                                                                       | Pattern-3 probe script; plus D-08 grep → 0                                                         | ❌ Wave 0 (script) |
| AUTH-03  | Invalidated session bounces open tab to /login          | e2e (storage-manipulation repro)                                                                   | same spec file, second test (45 s budget for the tick)                                             | ❌ Wave 0          |
| AUTH-04  | /delegations error state on rejected calls              | e2e forced-error (CDP `Network.setBlockedURLs` protocol from project memory) + unit for the branch | `pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps` | ❌ Wave 0          |
| AUTH-05  | /settings reachable from nav, exposes sign-out          | e2e (same signout spec)                                                                            | covered by 92-signout.spec.ts                                                                      | ❌ Wave 0          |
| CARRY-01 | Rotated creds; login smoke green                        | existing e2e                                                                                       | `pnpm exec playwright test tests/e2e/01-login.spec.ts --project=chromium-en`                       | ✅                 |

### Sampling Rate

- **Per task commit:** targeted spec (`--no-deps`, single project) or the D-08 grep for sweep tasks
- **Per wave merge:** `pnpm test:e2e:ci` + repo-wide grep + probe of touched functions
- **Phase gate:** full grep → 0, probe non-401 on representatives incl. `my-delegations`, both new e2e specs green, before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/92-signout.spec.ts` — AUTH-01/03/05 (logout both surfaces; storage-invalidation bounce; settings reachability)
- [ ] `tests/e2e/92-delegations-error.spec.ts` — AUTH-04 forced-error via CDP
- [ ] `scripts/probe-edge-auth.sh` (or a plan-embedded command) — Pattern-3 probe with per-set representatives
- [ ] No framework installs needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                                                                                                                              |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes            | GoTrue via `getUser(token)`; never hand-rolled JWT parsing; gateway `verify_jwt=true` default stays                                                                                                                           |
| V3 Session Management | yes            | Supabase session lifecycle; sign-out clears storage; forced invalidation navigates (this phase's core); localStorage persistence is a documented accepted tradeoff (`lib/supabase.ts` comment — BFF/HttpOnly is out of scope) |
| V4 Access Control     | yes            | RLS via header-injected client (Pitfall 1 protects it); role from `public.users.role` only (existing rule — the SIGNED_IN branch in authStore already enforces it; don't disturb)                                             |
| V5 Input Validation   | yes (narrow)   | If PARK-2 → (B): `redirectTo` MUST be allowlisted against the route tree; under (A) no new input surface                                                                                                                      |
| V6 Cryptography       | no new surface | JWT verification delegated to GoTrue                                                                                                                                                                                          |

### Known Threat Patterns for this stack

| Pattern                                          | STRIDE                                                 | Standard Mitigation                                                                            |
| ------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Open redirect via post-login return path         | Tampering/Spoofing                                     | PARK-2 (A) avoids it entirely; (B) requires route-tree allowlist (already priced in CONTEXT)   |
| RLS de-scoping during refactor (queries as anon) | Information Disclosure (inverted: data loss/emptiness) | Class-1 edit keeps injection; probe asserts non-empty data for a known-seeded user             |
| Privilege state from client-writable metadata    | Elevation                                              | Existing guard (role from `public.users.role`) — the sweep must not touch it                   |
| Credential exposure during CARRY-01              | Information Disclosure                                 | Never echo secrets (house rule); rotate → update stores → smoke; `.env.test` stays git-ignored |
| Ghost-authenticated UI after invalidation        | Spoofing (UI state)                                    | The AUTH-03 fix itself; e2e repro keeps it fixed                                               |

## Sources

### Primary (HIGH confidence)

- Served build artifacts, fetched 2026-08-15 (the load-bearing evidence): `esm.sh/@supabase/supabase-js@{2.39.0,2.42.0,2.43.0,2.44.0,2.45.0,2.49.2,2.112.3}/es2022/supabase-js.mjs` (flag boundary), `esm.sh/@supabase/gotrue-js@2.112.3/es2022/gotrue-js.mjs` (`_getUser`, `_removeSession`, tick constant, preserve-session branch, no storage listener), `x-esm-path` header for caret resolution
- npm registry: `@supabase/supabase-js` 2.112.3; `@supabase/supabase-js@2.39.x` dependency ranges; `@supabase/gotrue-js` 2.112.3
- jsr.io `@supabase/supabase-js` meta.json: latest 2.112.3
- Repo: all file/line citations verified this session (Sidebar.tsx card, authStore handlers, dead `services/auth.ts`, delegations chain, workflows, playwright config, `_shared/auth.ts`, `edge-function-add` skill, PARK-P92, CONTEXT)

### Secondary (MEDIUM confidence)

- [supabase/supabase-js#1024](https://github.com/supabase/supabase-js/issues/1024), [#1025](https://github.com/supabase/supabase-js/issues/1025), [supabase/auth-js#881](https://github.com/supabase/auth-js/issues/881) — community dating of the 2.42.5 break (corroborates the artifact-verified boundary)
- [supabase.com/docs/guides/functions/auth](https://supabase.com/docs/guides/functions/auth) — current official pattern (`withSupabase`); [auth-legacy-jwt](https://supabase.com/docs/guides/functions/auth-legacy-jwt) hosts the explicit-token pattern

### Tertiary (LOW confidence)

- GoTrue server-side revocation semantics for `/auth/v1/user` — search inconclusive; logged as A3, repro designed to not depend on it

## Metadata

**Confidence breakdown:**

- AUTH-02 mechanism: HIGH — proven from the served artifacts the functions actually bundle
- Client session lifecycle (AUTH-03 repro): HIGH on emission path/tick/preserve-branch (artifact-verified); MEDIUM on storage-key name and margin (A1/A2)
- Handler map & UI seams: HIGH — read directly from repo this session
- CARRY-01 path: HIGH — secret names and smoke spec located in repo
- Server-side revocation: LOW — flagged, not load-bearing

**Research date:** 2026-08-15
**Valid until:** ~2026-09-15 for repo facts; the esm.sh/jsr resolution facts are inherently time-of-request (that volatility is itself a documented finding)
