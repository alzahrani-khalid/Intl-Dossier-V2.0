---
phase: 92-session-integrity-edge-function-auth
plan: 02
subsystem: auth
tags: [react, zustand, tanstack-query, tanstack-router, radix, i18next, playwright, vitest]

requires:
  - phase: 92-01
    provides: 'tests/e2e/92-signout.spec.ts + the measured AUTH-01/03 RED baseline; LoginPage.signOutButton widened to button|menuitem'
provides:
  - 'NavUser mounted as the sidebar user card — the app''s only sign-out menu, carrying data-testid="user-menu"'
  - 'authStore.handleAuthStateChange SIGNED_OUT branch as the single owner of post-sign-out teardown (queryClient.clear) and navigation (lazy router import → /login)'
  - 'A second, independent sign-out control in /settings → Access & Security, data-testid="settings-signout"'
  - 'Truthful dataPrivacy.signOutAll copy in both locales (no longer claims "other" sessions)'
  - 'frontend/src/store/authStore.signout.test.ts — unit proof the in-memory query cache is empty post-teardown'
affects: [92-03, 92-04, 93-trust, 99-i18n, 100-clientsec, NAV-02]

tech-stack:
  added: []
  patterns:
    - 'One seam owns post-sign-out teardown + navigation; sign-out surfaces call logout() and nothing else'
    - 'Lazy import() at a store→router boundary, with the cycle named inline so it is not simplified back'

key-files:
  created:
    - frontend/src/store/authStore.signout.test.ts
  modified:
    - frontend/src/components/layout/Sidebar.tsx
    - frontend/src/components/layout/nav-user.tsx
    - frontend/src/store/authStore.ts
    - frontend/src/components/settings/sections/SecuritySettingsSection.tsx
    - frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/en/settings.json
    - frontend/src/i18n/ar/settings.json
  deleted:
    - frontend/src/components/layout/header/UserMenu.tsx

key-decisions:
  - 'NavUser adapted to useResponsive (D-23) — the shadcn sidebar-context provider renders nowhere in this app'
  - "The SIGNED_OUT branch clears the query cache BEFORE navigating; navigation rides a lazy import('@/router') to avoid newly creating the authStore→router→routeTree→routes→authStore cycle (D-25)"
  - 'The /settings control lives in the Access & Security section (account/session context), not Data & Privacy'
  - "dataPrivacy.signOutAll relabelled, scope:'global' deliberately unchanged — the lie was the copy, not the behaviour"

patterns-established:
  - 'Cache teardown is asserted (getQueryCache().getAll().length === 0), never inferred from a route change'
  - 'Two same-named sign-out controls on one page are disambiguated by data-testid, never by accessible name (D-28.3)'

requirements-completed: [AUTH-01, AUTH-03, AUTH-05]

duration: 20 min
completed: 2026-08-15
---

# Phase 92 Plan 02: Session Integrity — Sign-out Surfaces & the SIGNED_OUT Seam Summary

**Two working sign-out surfaces plus a single-owner SIGNED_OUT seam that clears the in-memory
TanStack Query cache and lazily navigates to `/login`; `92-signout.spec.ts` flipped 3-failed →
2-passed/1-failed on the same `--no-deps` command, with the surviving red precisely attributed.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-15T10:20Z (first edit)
- **Completed:** 2026-08-15T10:40:36Z
- **Tasks:** 3 of 3
- **Files modified:** 8 modified, 1 created, 1 deleted

---

## Task Commits

| Task | Commit     | Type   | What landed                                                            |
| ---- | ---------- | ------ | ---------------------------------------------------------------------- |
| 1    | `e012f4c6` | `feat` | NavUser mounted as the sidebar user card; `UserMenu.tsx` deleted       |
| 2    | `8fb80bb9` | `feat` | SIGNED_OUT seam: `queryClient.clear()` + lazy router navigation + test |
| 3    | `3f0f16be` | `feat` | `/settings` Session group + truthful Data & Privacy label (en+ar)      |

Every commit used explicit pathspecs (`git commit -- <path>…`). `git show --stat` on each showed
**only this plan's files** — no foreign file landed in any of the three. Other executors' work
(`supabase/functions/*`, 16 files) was uncommitted in the shared tree throughout and was never
staged, stashed, or checked out by this lane.

---

## Task 1 — Mount NavUser as the sidebar user card (D-01, D-23, D-24, D-27) — `e012f4c6`

- `nav-user.tsx`: swapped the unsatisfied shadcn sidebar-context hook for `useResponsive`
  (identical `isMobile` field, D-23). Kept the `side` expression — the mobile branch is genuinely
  reachable via the AppShell drawer mount. Added `data-testid="user-menu"` to the trigger.
  Changed the label call to exactly `t('common.logout')` — dot form, second argument dropped
  (D-24). Rebuilt the trigger markup to the sidebar card's visual identity (accent initials disc,
  two-line name + role, `--radius-sm` wash on `--sidebar-bg`) instead of shipping shadcn
  sidebar-menu chrome. The sign-out item stays a `DropdownMenuItem` with native `role="menuitem"`
  — no role forced for test convenience.
- `Sidebar.tsx`: static card block at §2 replaced with `<NavUser />`. Removed the locals **my**
  edit orphaned (`getInitials`, `displayName`, `roleLabel`, `initials`, `localizedJobTitle`,
  `isRTL`, and the now-unused `i18n` from `useTranslation`). `user` stays — the admin gate uses it.
- `en/common.json:68`: `common.logout` `"Logout"` → `"Sign out"`. **`ar/common.json` untouched**
  (`"تسجيل الخروج"`). Both values still match the D-27 regex `/sign out|logout|تسجيل الخروج|خروج/i`.
- `header/UserMenu.tsx` deleted with `git rm` after re-verifying zero importers.

### Gate — Task 1

```
$ cd frontend && pnpm type-check && ! grep -q "useSidebar" src/components/layout/nav-user.tsx && grep -q "data-testid=\"user-menu\"" src/components/layout/nav-user.tsx && ! test -f src/components/layout/header/UserMenu.tsx
> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
> tsc --noEmit

GATE_EXIT=0
```

**Exit code 0 — PASS.** (First attempt exited 1; see GATE CONCERN below. The gate was not edited.)

Supplementary (plan `<verification>`: "ESLint clean on touched files"):

```
$ pnpm exec eslint src/components/layout/nav-user.tsx src/components/layout/Sidebar.tsx --max-warnings 0
ESLINT_EXIT=0
```

---

## Task 2 — The SIGNED_OUT seam (D-22, D-25, D-29, D-30, D-12, D-18) — `8fb80bb9`

Inside the existing `SIGNED_OUT`/`USER_DELETED` branch, after the state clear:

```ts
queryClient.clear()
void import('@/router').then(({ router }) => router.navigate({ to: '/login' }))
```

`queryClient` is a plain module-level import from `../lib/query-client` (verified acyclic — that
module imports only `@tanstack/react-query`, `sonner`, `./query-tiers`). The router import is
**lazy and stays lazy**; the code carries an inline comment naming the exact cycle a static import
would create, so the next reader does not simplify it back. Plain `/login`, no `redirectTo`.

`logout()`, `services/auth.ts`, and `routes/_protected.tsx` were not touched. No sixth
`onAuthStateChange` subscription was added — a repo-wide grep still returns exactly five.

### Five-site classification (D-22 / D-10 / D-11) — re-confirmed by grep this session

| Site                                           | Today on invalidation                                                                            | Disposition                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| store/authStore.ts:267 → handleAuthStateChange | clears state, navigates nowhere → ghost shell                                                    | THE FIX SITE — teardown + navigation       |
| services/auth.ts:635                           | never runs — zero importers; also persists a 2nd zustand store under the same 'auth-storage' key | DEAD — do not edit, do not revive (NAV-04) |
| hooks/useUnifiedWorkRealtime.ts:166            | re-subscribes its realtime concern                                                               | benign no-op — confirm only                |
| hooks/useActivityFeed.ts:44                    | re-subscribes its feed                                                                           | benign no-op — confirm only                |
| auth/ResetPasswordPage.tsx:25                  | PASSWORD_RECOVERY only                                                                           | benign no-op — confirm only                |

Verbatim grep confirming the count (line numbers shifted by this plan's own edit at authStore):

```
$ grep -rn "onAuthStateChange" src --include='*.ts*'
src/auth/ResetPasswordPage.tsx:25:    } = supabase.auth.onAuthStateChange((event) => {
src/hooks/useUnifiedWorkRealtime.ts:166:    } = supabase.auth.onAuthStateChange((_, session) => {
src/hooks/useActivityFeed.ts:44:    } = supabase.auth.onAuthStateChange((_event, session) => {
src/services/auth.ts:635:supabase.auth.onAuthStateChange(async (event, _session) => {
src/store/authStore.ts:286:  } = supabase.auth.onAuthStateChange((event, session) => {
```

### D-30 — negative scope, stated as required

`queryClient.clear()` empties the **IN-MEMORY** query cache only. Persisted `localStorage` residue
— `auth-storage`, `entity-history-storage`, `ui-storage`, `pinned-entities-storage`,
`dossier-store`, `advanced-search-history`, `quickswitcher_recent_items` — is a **pre-existing**
leak, filed as `CLIENTSEC-01` and owned by Phase 100. It was deliberately **not** swept here. A
green cache criterion in this plan must **not** be read as "client-side residue cleared".

### The unit test is not vacuous

`authStore.signout.test.ts` carries two cases. The first seeds the singleton, fires
`handleAuthStateChange('SIGNED_OUT', null)`, and asserts `getQueryCache().getAll()` is empty **and**
the navigate spy got `{ to: '/login' }`. The second fires `PASSWORD_RECOVERY` and asserts the cache
is **untouched** and navigate was **never** called — so the first test's greens are attributable to
the SIGNED_OUT branch specifically, not to some ambient teardown.

### Gate — Task 2

```
$ cd frontend && pnpm type-check && pnpm exec vitest run src/store/authStore.signout.test.ts && test "$(grep -v '^[[:space:]]*//' src/store/authStore.ts | grep -c "import('@/router')")" -eq 1 && git rev-parse -q --verify refs/tags/phase-92-base >/dev/null && test "$(git diff --name-only phase-92-base -- src/services/auth.ts src/routes/_protected.tsx | wc -l)" -eq 0

> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
> tsc --noEmit


 RUN  v4.1.7 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  13:34:22
   Duration  605ms (transform 59ms, setup 114ms, import 129ms, tests 56ms, environment 240ms)

GATE_EXIT=0
```

**Exit code 0 — PASS.** Non-comment `import('@/router')` count is exactly 1; the scope guard shows
0 changed files for `src/services/auth.ts` and `src/routes/_protected.tsx` against `phase-92-base`.

```
$ pnpm exec eslint src/store/authStore.ts src/store/authStore.signout.test.ts --max-warnings 0
ESLINT_EXIT=0
```

---

## Task 3 — `/settings`: the plain control + the lying label (D-02, D-03, D-28) — `3f0f16be`

**ADD (D-28.1).** A `Session` `SettingsGroup` in `SecuritySettingsSection` with one `SettingsItem`
row: label "Sign out", Meta description "End your session on this device.", and a `.btn-ghost`
button on the end side carrying `data-testid="settings-signout"`. It calls `useAuth().logout()` and
performs **no** navigation or cache-clearing — Task 2's seam owns both.

**Section-choice rationale (as required by the plan's `<output>`).** Access & Security is the
account/session context: it already owns the session-timeout copy and the MFA status, so a session
end belongs beside them. Data & Privacy is a data-rights surface — putting the everyday sign-out
there is exactly the burial D-28 names, and it already holds the _destructive global_ sign-out,
which would sit one row away from the ordinary one.

**RELABEL (D-28.2).** `dataPrivacy.signOutAll`:
`"Sign Out All Other Sessions"` → `"Sign out of all sessions"`;
`"تسجيل الخروج من جميع الجلسات الأخرى"` → `"تسجيل الخروج من جميع الجلسات"`.
The trigger and the dialog confirm render the same key, so both updated. `scope: 'global'` is
**unchanged** — the lie was the copy, not the behaviour. Added
`data-testid="signout-all-sessions"` to the trigger (D-28.3).

**DE-NAVIGATE (D-29).** Removed the `setTimeout(() => { logout(); window.location.href = '/login' },
1000)` block; only the success toast remains, plus the why-comment
("navigation + cache teardown owned by authStore's SIGNED_OUT handler (D-29) — do not restore the
reload"). The removed `logout()` call had been re-invoking `signOut` a second time. This orphaned
the `useAuthStore` import and the `logout` local in that file — both removed (my edit's own mess).

**Scope fence (D-03).** `AppShell.tsx` and `routes/_protected/settings.tsx` untouched:

```
$ git diff --name-only phase-92-base -- src/components/layout/AppShell.tsx src/routes/_protected/settings.tsx | wc -l
       0
```

### Gate — Task 3

```
$ cd frontend && pnpm type-check && ! grep -q 'window.location.href' src/components/settings/sections/DataPrivacySettingsSection.tsx && grep -q 'data-testid="settings-signout"' src/components/settings/sections/SecuritySettingsSection.tsx && grep -q 'data-testid="signout-all-sessions"' src/components/settings/sections/DataPrivacySettingsSection.tsx && node -e "const en=require('./src/i18n/en/settings.json'),ar=require('./src/i18n/ar/settings.json');process.exit(en.dataPrivacy.signOutAll.includes('Other')||ar.dataPrivacy.signOutAll.includes('الأخرى')||!(en.security.session&&en.security.signOut&&ar.security.session&&ar.security.signOut)?1:0)"

> intake-frontend@1.0.0 type-check /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
> tsc --noEmit

GATE_EXIT=0
```

**Exit code 0 — PASS.**

```
$ pnpm exec eslint src/components/settings/sections/SecuritySettingsSection.tsx src/components/settings/sections/DataPrivacySettingsSection.tsx --max-warnings 0
ESLINT_EXIT=0
```

---

## D-26 — the RED/GREEN pair, same command both times

The oracle is `92-signout`, not `01-login` (RULING-36/37). The command below is **byte-identical**
to the one 92-01 measured its RED with.

### RED — as recorded by 92-01 (`a15ba775`, run B), quoted verbatim from `92-01-SUMMARY.md`

<!-- prettier-ignore -->
```
1) sign-out genuinely clears the session
   Error: locator.click: Test timeout of 30000ms exceeded.
   Call log: - waiting for getByTestId('user-menu')
   > 54 |     await page.getByTestId('user-menu').click()

2) /settings is reachable from navigation and exposes an independent sign-out
   Error: locator.click: Test timeout of 30000ms exceeded.
   Call log: - waiting for getByTestId('user-menu')
   > 69 |     await page.getByTestId('user-menu').click()

3) invalidated session bounces the open tab
   TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
   waiting for navigation to "**/login" until "load"
   > 114 |     await page.waitForURL('**/login', { timeout: 45_000 })
```

`3 failed / 0 passed`.

### GREEN (partial) — measured this session, twice

```
$ pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps

Running 3 tests using 3 workers

  ✓  3 [chromium-en] › tests/e2e/92-signout.spec.ts:90:7 › AUTH-01/03/05 session integrity › invalidated session bounces the open tab (6.0s)
  ✓  2 [chromium-en] › tests/e2e/92-signout.spec.ts:47:7 › AUTH-01/03/05 session integrity › sign-out genuinely clears the session (6.9s)
  ✘  1 [chromium-en] › tests/e2e/92-signout.spec.ts:63:7 › AUTH-01/03/05 session integrity › /settings is reachable from navigation and exposes an independent sign-out (30.4s)


  1) [chromium-en] › tests/e2e/92-signout.spec.ts:63:7 › AUTH-01/03/05 session integrity › /settings is reachable from navigation and exposes an independent sign-out

    Test timeout of 30000ms exceeded.

    Error: locator.click: Test timeout of 30000ms exceeded.
    Call log:
      - waiting for getByTestId('settings-signout')

      82 |     // page: it also matches the Data & Privacy "sign out all sessions" control — a strict-mode
      83 |     // failure, and worse, it could click the destructive global sign-out.
    > 84 |     await page.getByTestId('settings-signout').click()
         |                                                ^
      85 |
      86 |     await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

  1 failed
    [chromium-en] › tests/e2e/92-signout.spec.ts:63:7 › AUTH-01/03/05 session integrity › /settings is reachable from navigation and exposes an independent sign-out
  2 passed (34.7s)
```

Confirming re-run (same command, filtered to the verdict lines):

```
  ✓  2 [chromium-en] › … › invalidated session bounces the open tab (3.9s)
  ✓  3 [chromium-en] › … › sign-out genuinely clears the session (4.5s)
  ✘  1 [chromium-en] › … › /settings is reachable from navigation and exposes an independent sign-out (30.4s)
    Error: locator.click: Test timeout of 30000ms exceeded.
      - waiting for getByTestId('settings-signout')
  1 failed
  2 passed (31.0s)
```

**Deterministic across both runs. `3 failed / 0 passed` → `1 failed / 2 passed`.**

### Validity attribution (RULING-37)

| Test                                                      | Verdict                      | Did the run reach the sign-out assertion?                                                                                                                                                                                                                                      |
| --------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — sign-out genuinely clears the session (AUTH-01, D-04) | **GREEN, valid**             | Yes. `setup` skipped (`--no-deps`), inline sign-in passed, the A1 session read passed (non-null), the user-menu opened, the sign-out item was clicked, `**/login` was reached, and `localStorage[sb-…-auth-token]` read back **null**. Passed at the assertion of record.      |
| 3 — invalidated session bounces the open tab (AUTH-03)    | **GREEN, valid**             | Yes. Inline sign-in passed, `/dashboard` loaded, the storage mutation applied without throwing, **no reload**, and the tab navigated to `/login` inside the 45 s budget. Passed at the assertion of record.                                                                    |
| 2 — `/settings` independent sign-out (AUTH-05)            | **RED — real, attributable** | It reached `/settings` (the `waitForURL('**/settings')` on the line above passed), then timed out on `getByTestId('settings-signout')`. This is a failure **at the oracle**, not at `setup`/sign-in/navigation — so it is a genuine RED, not `UNABLE TO MEASURE`. Cause below. |

---

## BLOCKED — AUTH-05's e2e half (test 2)

> **RESOLVED 2026-08-15 by `RULING-P92-48` — this section is kept, not deleted, because it is the
> record of a real defect and of the four hours it stayed buried. Everything below it was accurate
> when written.**
>
> **Ruling: candidate 1 — fix the SPEC, not the mount. The implementation stands and `92-02_g3` was
> NOT reopened.** The control is where this plan put it and where `92-02_g3` pins it; the spec's
> locator assumed a flat settings page this product does not have. Settled by citation, not product
> taste: `92-CONTEXT.md:48` (**D-03**) reads AUTH-05 as _"an inbound nav entry plus a sign-out
> control **on the page**"_ — reachability within `/settings`, not residency on its landing view —
> and **D-12** records that `/settings` already had a working sign-out inside the sectioned layout.
>
> **Fix applied** (`tests/e2e/92-signout.spec.ts`, orchestrator): the spec now clicks the
> "Access & Security" nav button before locating `settings-signout`. That click is **setup, not an
> assertion change** — the oracle (click → land `/login` → session cleared) is untouched.
>
> **Observed after the fix, run from the repo root, output on disk at
> `.tickmarkr/overseer/P92-AUTH05-SPEC-RUN.log`:**
>
> ```
> $ pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps
>   ✓ 3 … invalidated session bounces the open tab (3.6s)
>   ✓ 1 … sign-out genuinely clears the session (4.0s)
>   ✓ 2 … /settings is reachable from navigation and exposes an independent sign-out (5.3s)
>   3 passed (5.7s)
> ```
>
> **AUTH-05's click-to-`/login` has now been executed for the first time.** All three of this plan's
> gates were re-run after the spec edit and still exit 0, as did `92-01_g2` (which counts 3 tests
> and greps this spec) — no gate text was touched.
>
> **How this stayed buried, named rather than smoothed:** all three of this plan's gates are
> **static** — `tsc`, a unit test, greps, a scope guard — and **none of them runs this spec**. So
> three greens said nothing about the criterion, and the orchestrator read the greens without
> reading this section. It was caught by **`gsd-verifier`**, whose `gaps_found` / 2-of-5 honesty is
> the reason it is in the loop at all.

**The control was built exactly where the plan put it, and the spec cannot see it there.**

`/settings` renders one section at a time. `SettingsPage.tsx:138` initialises
`useState<SettingsSectionId>('profile')`, and `SettingsSectionWrapper`
(`SettingsLayout.tsx:139-148`) **returns `null`** when `sectionId !== activeSection`. So on the
`/settings` landing view only `ProfileSettingsSection` is in the DOM;
`SecuritySettingsSection` — and therefore `settings-signout` — is not mounted at all until the user
clicks the **"Access & Security"** nav button.

Playwright's own failure snapshot confirms both halves of this:

```
- navigation "Settings" [ref=e40]:
    - button "Profile" [ref=e45] [cursor=pointer]
    - button "General" [ref=e52] [cursor=pointer]
    - button "Appearance" [ref=e57] [cursor=pointer]
    - button "Notifications" [ref=e61] [cursor=pointer]
    - button "Access & Security" [ref=e68] [cursor=pointer]
    - button "Accessibility" [ref=e72] [cursor=pointer]
    - button "Data & Privacy" [ref=e77] [cursor=pointer]
    …
- generic [ref=e97]: Profile Settings
```

So: the control **is discoverable to a human** (one click on "Access & Security", a nav entry that
is present and enabled), which is what D-02 asks for. What is not true is the spec's implicit
assumption that a `/settings` landing render exposes it.

**Why I did not fix it.** Every available fix is outside this plan's authorised file set:

1. Mount the control outside the section switch (in `SettingsPage.tsx` or `SettingsLayout.tsx`) —
   neither file is in `files_modified`.
2. Have the spec click "Access & Security" first — `tests/e2e/92-signout.spec.ts` is 92-01's
   artifact and is not in `files_modified`.
3. Move the control to a section that renders by default (Profile) — contradicts D-02/D-28's
   explicit section assignment, and Profile is the wrong context.

This needs an orchestrator ruling on which of (1) or (2) is correct. I did not guess, and I did not
manufacture a green.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 gate greps the literal `useSidebar` including comments**

- **Found during:** Task 1 (first gate run)
- **Issue:** The gate is `! grep -q "useSidebar" src/components/layout/nav-user.tsx`. My D-23
  explanatory comment named the replaced hook by its literal identifier, so the gate exited 1 on a
  correct implementation.
- **Fix:** Reworded the comment to "the shadcn sidebar-context hook". **The gate was not edited.**
- **Files modified:** `frontend/src/components/layout/nav-user.tsx`
- **Verification:** gate re-run exited 0 (output above)
- **Committed in:** `e012f4c6`

**2. [Rule 3 - Blocking] Orphaned `useAuthStore` / `logout` in DataPrivacySettingsSection**

- **Found during:** Task 3
- **Issue:** Removing the `setTimeout` reload block (D-29) left `const { logout } = useAuthStore()`
  and its import unused — an ESLint `no-unused-vars` error.
- **Fix:** Removed both. They were orphaned by **my** edit, per the surgical-changes rule.
- **Files modified:** `frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx`
- **Verification:** `pnpm type-check` + `eslint --max-warnings 0` both clean
- **Committed in:** `3f0f16be`

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking).
**Impact on plan:** No scope creep. Both are consequences of the plan's own instructions; neither
changed any decision, gate, or file outside `files_modified`.

---

## GATE CONCERN (informational — the gate PASSED, and was not touched)

Raising this only because the brief routes all gate observations here and the orchestrator owns the
ruling. **No action was taken and no gate text was edited.**

The Task 1 clause `! grep -q "useSidebar" src/components/layout/nav-user.tsx` is a whole-file
literal grep, so it also fails on a **comment** that names the hook being replaced. The gate's
intent (the unsatisfied provider hook is no longer _used_) was satisfied on my first attempt; the
gate read it as violated. Cost: one comment reword. Flagging it because it creates a small pressure
against documenting _why_ a hook was swapped — the exact kind of comment D-25 elsewhere insists on.

---

## Issues Encountered

- **The `.btn-ghost` recipe vs. the `Button` component.** The `/settings` control uses a plain
  `<button className="btn-ghost …">` (the `ThreadList.tsx` / `CopilotComposer.tsx` idiom) rather
  than `<Button variant="…">`, so the recipe's own chrome is not fighting the wrapper's variant
  styles. UI-SPEC Surface 2 asks for `.btn-ghost`; this is the established way to get it.
- **Shared tree, concurrent lanes.** Two other executors landed commits (`92-04`, `92-05`) between
  my Task 2 and Task 3 commits, and 16 `supabase/functions/*` files were dirty in the working tree
  the whole time. Nothing of theirs was staged, stashed, reverted, or checked out by this lane —
  each of my three `git show --stat` outputs lists only this plan's files.

---

## Known Stubs

None. No hardcoded empty value, placeholder string, or unwired data source was introduced.

---

## Threat Flags

None. No new network endpoint, auth path, file access pattern, or schema change was introduced.
The threat-register mitigations landed as planned:

| Threat ID                                                 | Status                                              |
| --------------------------------------------------------- | --------------------------------------------------- |
| T-92-01 (session cleared, not merely navigated away from) | **verified live** — test 1 reads back `null`        |
| T-92-03 (ghost-authenticated shell)                       | **verified live** — test 3 bounces with no reload   |
| T-92-14 (query-cache disclosure)                          | **verified by unit test**, bounded in-memory (D-30) |
| T-92-06 (redirect target)                                 | hardcoded `/login`, no `redirectTo` — static        |
| T-92-13 (/settings test locators)                         | both testids present — static                       |

---

## Requirements

| Req     | Status                                                                                                                                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | **Met and proven live** — sidebar sign-out lands on `/login` with the supabase storage key `null`                                                                                                                                                         |
| AUTH-03 | **Met and proven live** — invalidated session bounces the open tab, no reload                                                                                                                                                                             |
| AUTH-05 | **Implemented, e2e half RED** — an independent `/settings` control exists and is human-reachable via the "Access & Security" nav entry, but the spec's landing-view locator cannot see it (see BLOCKED). Do not mark AUTH-05 complete on this plan alone. |

---

## Next Phase Readiness

- 92-03 / 92-04 are unaffected — nothing this plan touched overlaps their file sets.
- The orchestrator must rule on the AUTH-05 locator/mount question before this phase's AUTH-05
  evidence is closeable.
- `CLIENTSEC-01` (persisted localStorage residue) remains open and untouched, as designed.

---

## WHAT THIS DOES NOT ESTABLISH

Honest list of what I did **not** observe:

1. **AUTH-05 is not proven end-to-end.** The `/settings` sign-out control's click-to-`/login`
   behaviour was **never executed** — not by the e2e run (which never found the element) and not by
   any unit test. That the button calls `logout()` is a **static** claim, read off the source. The
   only thing proven about the seam it relies on is proven from the _sidebar_ path.
2. **No human ever clicked the `/settings` control.** Its visual rendering, its ghost-button
   styling, and its row geometry against the section's other rows are unverified by rendering.
3. **Arabic is verified as data, not as pixels.** `ar/common.json:common.logout` =
   `"تسجيل الخروج"` and the three new `ar/settings.json` keys exist and are non-empty at HEAD, and
   the inline English default is gone from the call site. But **no Arabic render was captured** —
   no `dir="rtl"` screenshot, no Tajawal confirmation, no RTL dropdown-side check. The plan defers
   this to the phase-end human check (92-VALIDATION Manual-Only); it is still open.
4. **No render check at 1024px or 1400px.** The UI-SPEC's Definition of Done requires both. Neither
   was performed. The NavUser trigger's claim to "keep the card's visual identity" is a
   markup-level claim, not a pixel-level one — I copied the class list, I did not compare renders.
5. **The mobile-drawer mount of NavUser was not exercised.** The `side="bottom"` branch is reachable
   in principle (AppShell renders the same `<Sidebar />` in the drawer) but nothing below the `lg`
   breakpoint was run.
6. **The cache criterion is in-memory only and unit-scoped.** `getQueryCache().getAll().length === 0`
   was asserted in **jsdom against the singleton**, not in a real browser after a real sign-out. No
   e2e assertion reads the cache. Persisted `localStorage` residue is untested and unswept by design
   (D-30 / `CLIENTSEC-01`).
7. **The D-25 cycle claim is inherited, not re-measured.** I did not build a module-level-import
   variant to observe the white-screen. I implemented the lazy form the plan mandates and verified
   only that exactly one non-comment `import('@/router')` exists.
8. **`pnpm lint` was not run repo-wide.** ESLint ran on my six touched source files with
   `--max-warnings 0` (clean), and `scripts/check-i18n-namespaces.mjs` passed repo-wide. The other
   three lint sub-checks (`check-duplicate-rtl`, `check-bootstrap-parity`, `check-date-formatting`)
   were not run — CI lints the whole repo and other lanes' uncommitted work was in the tree.
9. **`pnpm test` was not run.** Only `src/store/authStore.signout.test.ts` was executed. Whether the
   NavUser mount or the Sidebar local removals broke an existing component test elsewhere is
   **unknown**. Note the pre-commit hook does run a full `turbo run build`, which passed on all
   three commits — so the app compiles, but no other test suite was exercised.
10. **Nothing was deployed.** These are frontend source changes against a local dev server only.
11. **The three "benign no-op" `onAuthStateChange` sites were confirmed by grep location, not by
    execution.** I confirmed exactly five sites exist and where they are; I did not run them to
    observe that they are no-ops on `SIGNED_OUT`.

---

## Self-Check

```
$ [ -f frontend/src/store/authStore.signout.test.ts ] && echo FOUND
FOUND
$ [ -f frontend/src/components/layout/header/UserMenu.tsx ] || echo "DELETED (as intended)"
DELETED (as intended)
$ git log --oneline --all | grep -cE '^(e012f4c6|8fb80bb9|3f0f16be)'
3
```

## Self-Check: PASSED

---

_Phase: 92-session-integrity-edge-function-auth_
_Completed: 2026-08-15_
