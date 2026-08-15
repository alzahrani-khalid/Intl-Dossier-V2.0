# Phase 92: Session Integrity & Edge-Function Auth - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes a session's **beginning, acceptance, and end** all honest:

- a signed-in user can deliberately end their session, from the shell and from `/settings`
- a valid session is accepted by the edge functions rather than rejected as unauthenticated
- an _invalidated_ session visibly ends the open tab instead of decaying into a half-authenticated
  ghost page
- `/delegations` says "this failed" when its calls are rejected, instead of "you have none"
- the operator rotates the P88-02 credentials (an operator act, not code)

Requirements: `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-04`, `AUTH-05`, `CARRY-01` (`ROADMAP.md:281`).

**Not in this phase.** The general "failure rendered as emptiness" fix at the repository layer is
`TRUST-01`/`TRUST-02` in Phase 93, which declares `Depends on: Phase 92` precisely because many
"empty" surfaces are 401s that must stop being auth failures first. Only `/delegations` is fixed here,
and only because `AUTH-04` names it. Also explicitly out of scope, per `REQUIREMENTS.md`
"Out of scope — verified already correct": dossier overview tabs, `devModeGuard`-gated demo routes,
design-token discipline, and RTL layout infrastructure.

**Answering policy for this CONTEXT.** Questions the governing documents settle were answered from
them, with the source line cited on each decision. Two genuine forks the documents do not settle were
parked to the operator in `.tickmarkr/overseer/PARK-P92.md`; **both have since been decided by the
operator** in `.tickmarkr/overseer/RULING-P92-02-PARKS.md` and are recorded at D-07 (AUTH-02
population → all 133) and D-12 (forced redirect → plain, no return path). Nothing in this file is
still open.

</domain>

<decisions>
## Implementation Decisions

### Sign-out surfaces (AUTH-01, AUTH-05)

- **D-01:** The live sign-out control is the existing `frontend/src/components/layout/nav-user.tsx`
  (`NavUser`), mounted as the sidebar user card — not a newly written control. `REQUIREMENTS.md
AUTH-01` names this component explicitly ("`NavUser` — which already implements it and is imported
  nowhere — is mounted or its `logout()` path is wired to the live shell"). It already calls
  `useAuth().logout()` at `nav-user.tsx:92`; the defect is purely that nothing imports it.
- **D-02:** `/settings` exposes a second, independent sign-out control. `ROADMAP.md:284` requires
  sign-out "from the sidebar user card **and** from `/settings`" — two surfaces, not one.
- **D-03:** `/settings` is reachable from navigation, per `REQUIREMENTS.md AUTH-05` — and that is
  **all** AUTH-05 asks: an inbound nav entry plus a sign-out control on the page. `NavUser` already
  links to `/settings` (`nav-user.tsx:80,86`), so D-01's mount satisfies the reachability half; D-02
  supplies the control. **Scope fence:** the `/settings/*` subtree rendering with no navigation at all
  is `NAV-02`, a _later_ phase, and must not be pulled in here. Evidence for that phase, recorded now
  so it is not re-earned: `AppShell.tsx:125` suppresses the global sidebar across the whole subtree via
  `pathname.startsWith('/settings')`, justified by a comment asserting "the SettingsLayout renders its
  own 240px nav column" — but `routes/_protected/settings.tsx:9-30` renders that column only when the
  last match is exactly `/settings`, and returns a bare `<Outlet/>` for every child route. The
  suppression is predicated on a promise the layout does not keep on children. That is the whole
  mechanism, in one sentence, for whoever plans `NAV-02`.
- **D-28:** **DECIDED by the operator** (`RULING-P92-11`, resolving `PARK-P92-R2.md` PARK-R2-1):
  `/settings` gets **both** a new control and a fix to the existing one.
  `/settings` already has a _working_ full sign-out today — `DataPrivacySettingsSection.tsx`'s
  `handleSignOutAll` (`:164-178`) runs `supabase.auth.signOut({ scope: 'global' })` → `logout()` →
  `window.location.href = '/login'` — but it is labelled `dataPrivacy.signOutAll` = en "Sign Out All
  Other **Sessions**" / ar "…الجلسات **الأخرى**", and `scope: 'global'` ends **this** session too. It
  works and lies. So AUTH-01's "no logout anywhere" premise was not strictly true.
  1. **Add** a plain, discoverable "Sign out" in an **account context** — not buried in Data &
     Privacy. This is criterion 1's `/settings` half.
  2. **Relabel** the existing control so it stops claiming "other", both locales mirrored. It also
     currently breaks `CLAUDE.md`'s sentence-case rule for buttons, so one edit fixes copy truth and
     house style together. **Do not change `scope`** — what the button does to other devices is a
     separate product decision; relabelling removes the lie.
  3. **Both controls get a `data-testid`.** `/settings` will then hold 2+ elements matching
     `/sign out|logout|تسجيل الخروج|خروج/i`, so the Wave-0 `/settings` assertion **must** use testids
     or scoped locators — **never** the shared regex. Unconditional, and a _safety_ rule: the shared
     regex could click the destructive global sign-out while intending to test ordinary logout. The
     collision is already latent today (same string at trigger `:286` and confirm action `:301`).
  4. **`window.location.href = '/login'` stays — DELIBERATE, not an oversight.** It is not
     inconsistent with D-25's lazy router import: a full reload guarantees state teardown on sign-out.
     Recorded so a reviewer does not "fix" it into a router navigation and quietly weaken the
     teardown.
     **Interaction the D-22 task must accept explicitly:** `signOut({ scope: 'global' })` emits
     `SIGNED_OUT`, so once D-22's handler navigates on that event this component navigates reactively
     _and then_ hard-navigates a second later. With (4) keeping the hard nav, that double-navigation is
     accepted knowingly — one sentence naming it, rather than leaving it to be discovered.
- **D-29:** **The hard reload IS load-bearing — and that is an argument for moving its function into
  the single owner, not for keeping it.** Re-derived on the merits (`RULING-P92-12` withdrew the
  instruction that had made this an inherited accept; `RULING-P92-13` required a fresh basis).

  **Evidence.** `frontend/src/lib/query-client.ts` exports a **module-level singleton**
  `queryClient`, mounted once in `App.tsx:30`, with `staleTime: 5 min`, `gcTime: 10 min`,
  `refetchOnMount: false`, `refetchOnWindowFocus: false`. **Nothing clears it on sign-out** — the only
  `queryClient.clear()` in the whole frontend is in a test file. `authStore.logout()` (`:105-124`)
  clears the auth store and Sentry context, not the cache. A client-side navigation to `/login`
  therefore leaves the previous user's fetched data resident for up to **10 minutes**, and served
  **without refetch** for **5**. On a shared analyst workstation, the next user to sign in on that tab
  can be served the previous user's rows before any refetch — in a product whose v7.0 premise is
  `sensitivity_level <= clearance`. A full page load is currently the **only** mechanism that
  destroys that cache.

  **The finding that inverts the conclusion:** today exactly one working sign-out exists and it
  reloads, so the product has **zero** cache-leak paths. This phase adds a sidebar sign-out (AUTH-01),
  a `/settings` sign-out (D-02/D-28), and a reactive `SIGNED_OUT` redirect (D-22) — **all three
  soft-navigating**. As planned, Phase 92 would take a product with no leak and give it three.

  **Resolution — single-owner holds, and the leak closes:** D-22's `SIGNED_OUT` seam is the single
  owner of post-sign-out teardown **and** navigation, and its teardown **must include
  `queryClient.clear()`** before it navigates. Once it does, the reload's only load-bearing function
  is covered centrally, so `DataPrivacySettingsSection` drops its `setTimeout` +
  `window.location.href` and keeps only its toast (per `RULING-P92-12`), and every sign-out path —
  including the two this phase introduces — is safe by construction rather than by whichever one
  happened to reload.

  **This supersedes the earlier "explicit accept" of the double-navigation**, which rested on a
  retracted instruction. There is now no double-navigation to accept: one owner navigates, and the
  component that used to navigate no longer does.

- **D-04:** Sign-out lands the user on `/login` with the session cleared (`ROADMAP.md:284`). Clearing
  is asserted, not assumed — the acceptance check must show the session gone, not just the route
  changed.

### Edge-function JWT acceptance (AUTH-02)

- **D-05:** The end state per migrated function is `@supabase/supabase-js@2` + `getUser(token)`, the
  house pattern documented in the project's `edge-function-add` skill. `REQUIREMENTS.md AUTH-02`
  specifies this end state; it does not mandate a refactor shape, so consolidating through
  `supabase/functions/_shared/auth.ts` is allowed where a function already imports it, but a helper
  refactor must not become a precondition for the version bump.
- **D-06:** `supabase/functions/_shared/auth.ts` is itself in scope. It is the repo's canonical
  `validateJWT()` helper (used by 10 of 303 functions) and it pins
  `@supabase/supabase-js@2.39.3` at line 2 — the exact deprecated pin this requirement retires. It
  already uses the correct `getUser(token)` call, so this is a pin bump, not a rewrite.
- **D-07:** **DECIDED by the operator** (`RULING-P92-02`, PARK-1 → option A): the migration population
  is **all 133 `index.ts` files pinning `supabase-js@2.3x`**. Each is moved to
  `@supabase/supabase-js@2` and its `getUser()` converted to `getUser(token)` **in the same edit**.
  All 53 genuinely-both files are inside the 133. Phase 90's 36/36 CORS sweep is the shape to reuse.
  The 110 bare-`getUser()` functions already on `@2` are **out of scope** unless D-16's probe says
  otherwise.
- **D-16:** The AUTH-02 probe task **states its verdict rule in its acceptance criteria before it
  collects any data** — otherwise the reading is free to drift toward the scope already chosen. The
  rule: call one function from each of A∩B (53), B\A (110) and A\B (83) with a valid JWT, then —
  _all three 200_ → the 110 are healthy on `@2`, AUTH-02 closes at 133, nothing carries forward;
  _B\A returns 401_ → bare `getUser()` fails independently of the pin, the 110 are real work and land
  in Phase 93 (which already declares `Depends on: Phase 92`); _only A∩B returns 401_ → the pin is
  the sole failure mode, confirming the premise by measurement rather than assumption. Record the
  **actual status codes** in the plan's evidence, not a summary of them.
- **D-17:** The criterion's false wording is **corrected, not stretched** — done during planning, not
  deferred to execution. `ROADMAP.md:285` said "the 133 … pinning `2.3x` **with** bare `getUser()`";
  no single set satisfies that (133 pin, 163 are bare, 53 are both), so it was a criterion
  verify-phase could not honestly close. Swept in the same edit: `ROADMAP.md:285`,
  `REQUIREMENTS.md AUTH-02`, `STATE.md`, `PROJECT.md`, and the audit's `INDEX.md` ship-blocker 2
  (annotated with a dated correction rather than silently rewritten — the audit's source lane,
  `adminops.md:97`, used the pin-only command and was correct; the conjunction was introduced during
  consolidation).
- **D-08:** The plan carries the **derivation command**, never the count. This is a count over a
  population the phase's own work mutates, so a frozen number is self-invalidating by construction and
  verify-phase must re-derive it. Under the recommended scope the check is
  `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' | wc -l` → `0`.
- **D-09:** Migrated functions are **deployed to staging within this phase**. `ROADMAP.md:285` is a
  live claim — "no audited route renders empty because of a 401" cannot be true of an edited-but-
  undeployed function. Editing without deploying does not satisfy the criterion.
- **D-19:** **The 133 is not one population. Split it 3 + 130.** The source lane confirmed the bare
  `getUser()` 401 for **exactly three** functions — `audit-logs-viewer`, `data-retention`,
  `field-permissions` (nine observed 401s plus a direct curl) — and its own fix line reads "move
  **these** functions to `@supabase/supabase-js@2` and `getUser(token)`, **then sweep the remaining
  130**." The lane asserted _3 broken and 133 suspect_, never 133 broken.
  - **The 3 are the must-fix core.** They get their own tasks and their own acceptance criteria, and
    the nine observed 401s are the evidence they close against.
  - **The 130 are the sweep** — version hygiene converting _suspect_ to _resolved_. Their acceptance
    is the D-08 derivation command reaching `0`, **not** a per-function failure proof, because no
    per-function failure was ever demonstrated for them.
  - The operator's PARK-1 (A) decision is unchanged: (A) _is_ the sweep the lane asked for.
- **D-20:** **Fixing the core de-risks Phase 93 and that dependency is named, not left implicit.**
  Two of the three — `data-retention` and `field-permissions` — are exactly the surfaces Phase 93's
  criterion 2 turns on (`/admin/field-permissions` showing the 19 rules the DB holds; the same for
  `/admin/data-retention`). Phase 93 already declares `Depends on: Phase 92`. Phase 93's planner
  inherits these as a **known-closed precondition** rather than re-deriving them — and, conversely,
  Phase 93 cannot judge those two surfaces' error states until this phase's auth fix is deployed
  (D-09). `TRUST-02` names both surfaces explicitly.
- **D-21:** **The pin retirement fixes a nondeterminism, not only a bug** — evidence the operator did
  not have when deciding PARK-1, and it strengthens (A). A `2.39.3` "pin" is not a lockfile: it
  declares `@supabase/gotrue-js: ^2.60.0`, and that caret currently floats to `2.112.3`. In modern
  gotrue, `getUser()` with no argument returns `AuthSessionMissingError` **without a network call**
  unless `hasCustomAuthorizationHeader` is set — and that flag is passed only by supabase-js wrappers
  **≥ 2.43.0**. So an old wrapper bundles a new auth client that it never tells about the header. Two
  consequences the plan must encode: the 83 pinned-but-token-passing functions work today yet sit on
  a floating caret, and **a redeploy with no edit can silently flip a function from working to
  broken**. That is why verification is repo grep **plus** live probe, never grep alone.

### Session invalidation (AUTH-03)

- **D-10:** The work is to **fix the behaviour of the `onAuthStateChange` handlers that already
  exist**, never to add another subscription. Five already exist —
  `frontend/src/store/authStore.ts:267`, `frontend/src/services/auth.ts:635`,
  `frontend/src/hooks/useUnifiedWorkRealtime.ts:166`, `frontend/src/hooks/useActivityFeed.ts:44`,
  `frontend/src/auth/ResetPasswordPage.tsx:25`. A sixth subscription firing alongside five that
  already fire is a new bug, not a fix. The plan must enumerate all five and state, per site, what it
  does on an invalidated session today and what it must do instead.
- **D-11:** **CORRECTED 2026-08-15 — the earlier text blamed a module that never runs.** The "Member/
  Member" ghost shell in `ROADMAP.md:286` is the symptom of the **live** handler, and this decision
  originally attributed it to `services/auth.ts:637-650`. That module is **imported by zero files** —
  verified repo-wide — so its `onAuthStateChange` never registers and its clearing code never
  executes. A plan built on the original wording would have edited dead code and shipped nothing.
  The ghost state is produced by the **live** seam: `authStore.handleAuthStateChange`, reached via
  `subscribeToAuthChanges()` (`authStore.ts:264-270`). Route away there, do not merely null the state.
  **Latent hazard worth one line in the plan:** `services/auth.ts:624` persists a _second_ zustand
  store under the **same `'auth-storage'` key** as the live `authStore.ts:253`. It is inert only
  because nothing imports it; anything that imports that module later gets two stores fighting over
  one persist key. Do not "revive" it — the correct disposal is deletion, which belongs to the `DEAD`
  group, not here.
- **D-22:** **The five sites are not five fix sites.** Per the researcher's map, verified: **1 live fix
  site** (`authStore.handleAuthStateChange`), **3 benign no-ops**
  (`useUnifiedWorkRealtime.ts:166`, `useActivityFeed.ts:44`, `ResetPasswordPage.tsx:25` — each
  re-subscribes its own concern on session change and is correct as-is), and **1 dead module**
  (`services/auth.ts:635`). The fix is **one navigation line at the `SIGNED_OUT` seam in
  `authStore`**, which covers deliberate logout (AUTH-01) and forced invalidation (AUTH-03) with the
  same edit. `router` is exported at `router/index.tsx:62`. Touch the three no-ops only to confirm
  they are no-ops; do not refactor them.
  **D-25 — the navigation must use a LAZY import, or it closes a cycle.** `92-RESEARCH.md`'s
  Pattern 1 shows a module-level `import { router } from '@/router'` inside `authStore`. That is a
  **cycle**: `router/index.tsx:2` imports `routeTree`, `routeTree.gen` imports the routes (203 of
  them), and both `routes/_protected.tsx:4` and `routes/index.tsx:2` import `authStore` — every edge
  verified independently twice, 2026-08-15. `authStore` does **not** import `router` today, so the
  cycle would be **newly introduced by this phase**. This repo has already shipped a production
  white-screen from a module cycle (the Vite `react-vendor` `manualChunks` incident), so it is a live
  hazard. Use `void import('@/router').then(({ router }) => router.navigate({ to: '/login' }))`, and
  make the task state _why_, because the next reader's instinct is to simplify it back.

  **Precedence rule when planning artifacts disagree — the artifact DERIVED FROM THE THING IN
  QUESTION wins.** Not "PATTERNS wins": that is too broad and would discard something true.
  - Claims about **this repo's** structure — module graph, imports, which components exist and are
    mounted → **PATTERNS.md**.
  - Claims about **external** behaviour — library versions, transitive deps, API semantics →
    **RESEARCH.md**. The gotrue version-skew mechanism (D-21) came from served artifacts and no
    codebase pattern-map could have produced it.
  - A disagreement falling outside both their derivations is a **park**, not a coin-toss.

  **D-26 — `tests/e2e/01-login.spec.ts:30` is a LIVE FAILING TEST, not existing coverage.** The
  distinction matters. Verified: the test is **not quarantined** (the `base.skip` at `:11` is a
  credential guard inside the _first_ describe, `:9`; the sign-out test is in a separate describe at
  `:23` with zero skip/fixme/fail in the file); `LoginPage.signOut()` clicks a
  `getByRole('button', { name: /sign out|logout|تسجيل الخروج|خروج/i })`; AUTH-01's whole premise is
  that no such button exists on `/`; and `data-testid="user-menu"` does not exist anywhere in
  `frontend/src`. So it is failing right now, unseen, on a non-required CI check this project already
  knows is chronically red.
  **This is worth more than a new spec.** A spec written during this phase is written to pass. This
  one fails on its own, independently, and the fix must make it pass — a real before/after rather
  than a self-confirming one. The plan must therefore:
  1. **Measure the RED before the fix** — run that single spec, record the actual output. **Do not
     assert it is red.** If it passes, AUTH-01's premise is wrong, and that is a finding.
  2. **Capture the GREEN after**, with both outputs in the evidence.
  3. **Re-run rather than reason about the post-fix path.** `if (await userMenu.isVisible())` is
     false today, so the test currently skips the menu and calls `signOut()` directly. Adding
     `data-testid="user-menu"` makes that branch true **for the first time**, so the post-fix path is
     not the pre-fix path with one thing repaired — it is a _different_ path through the test.
     `data-testid="user-menu"` on the mounted `NavUser` is therefore load-bearing, and belongs in the
     mount task's acceptance criteria. AUTH-01 needs no new spec; the Wave-0 spec narrows to what this
     one does not cover — the AUTH-03 bounce, the `/settings` surface, and D-04's assertion that the
     session is genuinely _cleared_.

  **D-27 — the sign-out LABEL is load-bearing for that spec, by luck of the key rather than by
  design.** `signOut()` matches on the accessible name `/sign out|logout|تسجيل الخروج|خروج/i`.
  D-24's repoint to `common.logout` yields en `"Logout"` and ar `"تسجيل الخروج"` — **both match**.
  Write this coupling into _both_ the i18n task and the mount task: if anyone later picks "Sign out
  of IntelDossier", "End session", or an Arabic synonym like "خروج من الحساب", this spec breaks and
  the failure will read as an auth regression rather than a copy change.
  **Related trap for the Wave-0 `/settings` test:** `DataPrivacySettingsSection` already renders a
  button labelled `dataPrivacy.signOutAll` that also matches that regex. Once D-02 adds a second
  sign-out control to `/settings`, a role+name locator pointed at that page matches **two** elements
  and fails Playwright strict mode. The `/settings` assertion must use a testid or a scoped locator,
  not the shared regex.

  **Hard constraints (`RULING-P92-06` amended acceptance condition 5′):** a task that edits
  `services/auth.ts`'s handler is a **REJECT** — that module is dead, so such a task ships nothing
  while looking thorough. A task that adds a sixth subscription is a **REJECT**. The five-site
  classification (live / no-op / dead) must still appear in the plan, because it is the _evidence_
  for why exactly one site is touched — without it, "we only changed one line" is indistinguishable
  from an incomplete fix.

- **D-23:** **Mounting `NavUser` is not a one-line import — it has an unsatisfied provider
  dependency.** `nav-user.tsx:15,27` imports `useSidebar` from `@/components/ui/sidebar` and reads
  `isMobile`, but **`SidebarProvider` is rendered nowhere in the app** (verified repo-wide; the live
  `Sidebar.tsx` does not use that provider). Mounting it as-is throws or yields `undefined`. **Adapt
  the consumer** — drop or replace the `isMobile` dependency with the shell's own responsive signal —
  and do **not** wrap the live shell in a foreign provider to satisfy one component. The mount seam is
  the static user card at `Sidebar.tsx:101-114`.
- **D-24:** **The sign-out label currently renders English in Arabic too, and the Arabic string
  already exists.** `nav-user.tsx:94` calls `t('navigation.logout', 'Logout')`, but no
  `navigation.logout` key exists in either locale — so it falls back to its inline English default in
  **both** languages, which is this project's recurring i18n trap. The translation is already present
  at **`common.logout`** (`en` "Logout" / `ar` "تسجيل الخروج"), and the dead `Header.tsx:101` uses that
  correct path. **Repoint the key rather than adding new ones**; if the spec's "Sign out" wording is
  kept, change the `en` value at `common.logout` and leave `ar` untouched. Adding a parallel key would
  leave two logout strings to drift apart.
  **Use the DOT form** (`t('common.logout')`), not colon — this codebase is overwhelmingly dot-form,
  the dead `Header.tsx:101` already used that exact path, and matching the surrounding code is the
  smaller change. Phase 99 converts the whole codebase and will sweep this line with the rest; it is
  not an exception to be preserved.
  **DROP THE SECOND ARGUMENT** (`RULING-P92-07`). The final call is `t('common.logout')` — **not**
  `t('common.logout', 'Logout')`. `common.logout` exists in both locales, so the English default has
  no function except masking a future regression: if that key is ever removed or renamed, the second
  argument silently renders "Logout" in Arabic again instead of surfacing the miss. Leaving it would
  ship a site that is still an instance of the exact class this phase just filed as `AR-04a`.
  Masking (the second argument) and resolution (dot vs colon) are **independent** defects — fixing
  the key path does not fix the mask, and this phase fixes both on this one line.
  **Scope fence (`RULING-P92-06` condition 11):** this is one instance of a **class** — every
  `t('key', 'English default')` call site, where the second argument masks a missing key by rendering
  plausible English in both locales instead of leaking a raw key. **Phase 92 repoints this one key
  and nothing else.** The class is filed into `REQUIREMENTS.md AR-04` with its derivation command
  (Phase 99, whose criterion 4 is exactly this). Do not sweep it here.
- **D-18:** **The route guard already works — do not touch it.** The source lane is more precise than
  its restatement: `sweeper.md` F7 records that after a programmatic `signOut()` on `/dashboard` the
  open tab stayed put for 3s and decayed, **but a _fresh_ navigation to `/dashboard` correctly bounced
  to `/login`** — `_protected.tsx`'s `beforeLoad` checks the live session and that half is sound. The
  missing piece is only the **reactive** path: nothing drives an _already-mounted_ route to re-evaluate
  and redirect. So the fix is reactive redirect on `SIGNED_OUT`, and `_protected.tsx`'s `beforeLoad` is
  an explicit **non-goal** — changing it risks regressing a guard that is currently correct.
  The plan's repro is the lane's: mint an independent session, sit on `/dashboard`, call
  `supabase.auth.signOut()` out-of-band, and assert the open tab reaches `/login`. Note that with
  AUTH-01 landed this path also becomes reachable from the UI, which it is not today.
- **D-12:** **DECIDED by the operator** (`RULING-P92-02`, PARK-2 → option A): a **plain redirect to
  `/login`**. No return path, no `redirectTo` param — a security-hardening phase does not open an
  open-redirect surface. Consequence for the planner: **`/login` stays out of this phase's
  `files_modified`.** A return path is a later, self-contained improvement and would need an explicit
  allowlist-against-the-route-tree task; do not add a half-version of it here.

### `/delegations` (AUTH-04)

- **D-13:** `/delegations` is fixed **locally in this phase**, both halves: the `my-delegations` calls
  authenticate, and a rejected query renders an error state instead of "You haven't granted any
  delegations." The general data-layer fix that stops repositories swallowing failures is `TRUST-01`
  in Phase 93 — this phase must not pre-empt it, and Phase 93 must not be assumed to cover this.
  Call sites: `frontend/src/services/user-management-api.ts:479`,
  `supabase/functions/my-delegations/index.ts` (pins `@supabase/supabase-js@2.39.0`, calls bare
  `auth.getUser()` at line 106 — so it sits inside the AUTH-02 population and its auth half is fixed
  by that migration).

### Credential rotation (CARRY-01)

- **D-14:** `CARRY-01` is planned as an **operator act, not code** — a checklist plan with an
  explicit verification step (GitHub Actions secret updated, `.env.test` updated, login smoke
  passing), owned by the operator. `ROADMAP.md:293` states this directly.
- **D-15:** No other criterion in this phase may depend on `CARRY-01`. `ROADMAP.md:293`: "The other
  four criteria do not depend on it and must not wait for it." It held Phase 88 open once already;
  the phase must be able to close its code criteria with `CARRY-01` still outstanding.

### Claude's Discretion

- **There are THREE orphaned logout components, not one.** `nav-user.tsx` (`useAuth().logout()` :92),
  `header/UserMenu.tsx` (:78), and `layout/Header.tsx` (`useAuthStore().logout()` :21, `LogOut` item
  :100) — **none imported by any file**, confirmed repo-wide. The audit's row 1 named two of the three
  (`nav-user` + `Header`); the orchestrator independently found the third (`header/UserMenu`); the
  union is three. Exactly **one** gets mounted (D-01: `nav-user.tsx`). Planner's call: delete it in the same plan
  that mounts `NavUser` if it is still unreferenced, or leave it and let the `DEAD` requirement group
  take it. Do not mount both — two logout menus is a worse outcome than one orphan.
- Whether the AUTH-02 migration is one plan or several, and how the deploy is batched, is a planning
  judgment — subject to `D-09` (it does get deployed) and `D-07` (the file list is parked).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md:277-293` — Phase 92 goal, the 5 success criteria, and the note that
  criterion 5 is an operator act the other four must not wait on
- `.planning/REQUIREMENTS.md` — `AUTH-01`..`AUTH-05` (lines 25-29), `CARRY-01` (line 101), and the
  "Out of scope — verified already correct" list
- `.planning/audits/live-audit-2026-08-15/INDEX.md` — the audit of record; ship-blockers 1, 2, 4 and
  18 are this phase. Read the "governing pattern" section: failure rendered as emptiness
- `.planning/audits/live-audit-2026-08-15/sweeper.md` — findings F6 (no logout) and F7 (ghost shell)
- `.planning/audits/live-audit-2026-08-15/adminops.md` — finding F2 (edge-function JWT population)
- `.planning/audits/live-audit-2026-08-15/engagements.md` — finding F4 (`/delegations` over two 401s)

### Orchestration rulings that bind this phase's plan shape

- `.tickmarkr/overseer/PARK-P92.md` — PARK-1 (AUTH-02 population, 3 candidate scopes with the
  derivation command for every count) and PARK-2 (forced-redirect return path). **Read before
  writing the AUTH-02 task list.**
- `.tickmarkr/overseer/RULING-P92-01-EVIDENCE.md` — R2 (derive the intersection; never freeze the
  count in the plan) and R3 (AUTH-03 is "fix the existing handlers", never "add a subscription")

### House patterns this phase must follow

- `CLAUDE.md` § "Deployment Configuration" — staging project `zkrcjzdemdmwhearhfgg`; migrations and
  edge-function deploys go through the Supabase MCP / CLI
- `~/.claude/skills/edge-function-add/SKILL.md` — the canonical `supabase-js@2` + `getUser(token)`
  auth pattern, origin-validated CORS, and the `RETURNS TABLE` varchar/text `42804` cast gotcha
- `supabase/functions/_shared/auth.ts` — the existing `validateJWT()` / `createUserClient()` helper
- `supabase/functions/_shared/cors.ts` — the Phase 90 origin-validated CORS helper; that phase's
  36/36 repo-wide sweep is the proven precedent for the shape of the AUTH-02 sweep

### UI

- `frontend/DESIGN.md` — the Linear spec (dark-canonical tokens, radii 6/8/12, the recipe rules).
  **Linear dark is the only direction.**
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine
- `frontend/design-system/inteldossier_handoff_design/` — **historical reference, superseded 2026-07.
  Do not point new work at it.**

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `frontend/src/components/layout/nav-user.tsx` — a complete user dropdown: avatar, `/settings`
  links, and `logout()` from `useAuth()` at line 92. **Imported by zero files.** AUTH-01 is a mount,
  not a build.
- `frontend/src/components/layout/header/UserMenu.tsx` — a _second_ complete, functionally identical
  dropdown (`logout()` at line 78). **Also imported by zero files.** The audit did not mention it.
- `frontend/src/store/authStore.ts` — `signOut()` at line 108; `subscribeToAuthChanges()` at line 264
  wrapping `onAuthStateChange` at line 267 and delegating to `handleAuthStateChange`. There is an
  `AuthListenerManager` tying that listener to the React lifecycle.
- `frontend/src/services/auth.ts` — `signOut` at line 152; a module-level `onAuthStateChange` at line
  635 that clears store state on `SIGNED_OUT` but **navigates nowhere** (lines 637-650).
- `supabase/functions/_shared/auth.ts` — `validateJWT(authHeader)` already implements the correct
  `getUser(token)` pattern; imported by 10 of 303 functions; pinned `@2.39.3`.

### Established Patterns

- **The repo-wide edge-function sweep is a solved shape here.** Phase 90 migrated 36/36 functions off
  wildcard CORS onto `_shared/cors.ts`, with a repo-wide grep returning 0 as the success criterion.
  AUTH-02 is the same shape against a larger population.
- **The canonical edge auth construction** is
  `createClient(url, ANON_KEY, { global: { headers: { Authorization: authHeader } } })` followed by
  `auth.getUser()`. Specimen: `supabase/functions/access-review-detail/index.ts:83-97`. 161 of the 163
  bare-`getUser()` functions are built this way, so **bare `getUser()` is not a defect by shape** — it
  is a defect on the deprecated pin. Any task that treats "bare `getUser()`" as the selector will
  over-scope; see PARK-1.
- `useAuth()` is the shell's auth seam; both orphaned menus already consume it.

### Integration Points

- `frontend/src/routes/__root.tsx` / `frontend/src/routes/_protected.tsx` — the app root, where the
  redirect behaviour for AUTH-03 lands (in the _existing_ handlers, per D-10).
- `frontend/src/components/layout/AppShell.tsx:125` — the `startsWith('/settings')` prefix check that
  disagrees with the exact-match check at `routes/_protected/settings.tsx:14` (AUTH-05).
- `frontend/src/services/user-management-api.ts:479` — the `my-delegations` caller (AUTH-04).
- The Supabase staging project — edge functions must be **deployed**, not merely edited (D-09).

</code_context>

<specifics>
## Specific Ideas

- **Fix at the shared seam, not per caller.** Both AUTH-02 and AUTH-03 have a shared-owner shape:
  one helper (`_shared/auth.ts`) and five existing handlers respectively. A guard added at each caller
  is a larger diff than one fix where the callers route through, and it leaves siblings broken.
- **The two-of-163 outlier is worth a line in the plan.** Exactly 2 bare-`getUser()` functions forward
  no `Authorization` header at all, and neither is pinned `2.3x` — so they fall outside every candidate
  scope in PARK-1 while being the only two that provably cannot authenticate. They should not be lost.

</specifics>

<deferred>
## Deferred Ideas

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

</deferred>

---

_Phase: 92-session-integrity-edge-function-auth_
_Context gathered: 2026-08-15_
