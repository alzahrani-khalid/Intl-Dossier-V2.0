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

### Session invalidation (AUTH-03)

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

- **`frontend/src/components/layout/header/UserMenu.tsx` is a second orphaned logout menu.** The audit
  named only `NavUser`, but `UserMenu.tsx` is functionally identical (`useAuth().logout()` at line 78,
  the same `/settings` links) and is imported by zero files. Planner's call: delete it in the same plan
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
