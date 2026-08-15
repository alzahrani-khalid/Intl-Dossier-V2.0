---
phase: 92-session-integrity-edge-function-auth
verified: 2026-08-15T11:45:04Z
status: gaps_found
score: 2/5 criteria fully verified (2 partial, 1 parked-external)
verifier_ran_own_derivations: true
gaps:
  - truth: 'SC1 (half B): a signed-in user can sign out from /settings and land on /login with the session cleared'
    status: partial
    reason: 'The control exists and is human-reachable (one click on "Access & Security"), but its click-to-/login behaviour has never been executed by any test or human. The e2e for it is RED — reproduced by this verifier: the spec looks for settings-signout on the /settings landing view, and SettingsSectionWrapper returns null for every section except the active one (default: profile), so the control is not in the DOM. 92-02 filed this as BLOCKED pending an orchestrator ruling (fix the mount vs fix the spec); no commit after 3f0f16be touched SettingsPage.tsx, SettingsLayout.tsx, or the spec — the ruling never happened.'
    artifacts:
      - path: 'frontend/src/components/settings/SettingsLayout.tsx'
        issue: 'SettingsSectionWrapper returns null when sectionId !== activeSection; SecuritySettingsSection (and settings-signout) is unmounted on /settings landing'
      - path: 'tests/e2e/92-signout.spec.ts'
        issue: 'Test 2 assumes the landing render exposes settings-signout; it does not click "Access & Security" first'
    missing:
      - 'An orchestrator ruling: either (1) mount the sign-out control outside the section switch, or (2) have the spec click the "Access & Security" nav button before locating settings-signout'
      - 'One observed execution of the /settings control reaching /login with the session key null'
  - truth: 'SC5: the P88-02 credentials are rotated, GitHub Actions secret + .env.test updated, login smoke passing'
    status: failed
    reason: 'PARKED on an operator act (RULING-P92-45); not performable by an agent. Re-derived by this verifier: .env.test carries 0 of the 6 E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD} keys (E2ECRED-01), so auth.setup.ts throws and 92-10_g1 is red — a gate that cannot reach its subject, not a measured failure of its subject. Nothing in Phase 92 depends on it; Phase 101 (CARRY-02/CARRY-05) consumes it.'
    artifacts:
      - path: '.env.test'
        issue: '0 of 6 required E2E_* keys present (verified by grep this session)'
    missing:
      - 'Operator rotates staging test-user passwords, updates 6 GitHub Actions secrets and .env.test, confirms old values dead, re-runs the login smoke'
deferred:
  - truth: 'SC4 (data half): /delegations renders real delegations when my-delegations calls are not rejected'
    addressed_in: 'Phase 93 (DELEG-01) + Phase 102 (SEED-DELEG-01)'
    evidence: 'REQUIREMENTS.md:371 maps DELEG-01 (my-delegations queries public.delegations, which this verifier confirmed does not exist — 42P01 class) to Phase 93 — Failure Visibility; REQUIREMENTS.md:376 maps SEED-DELEG-01 (this verifier confirmed 0 rows in permission_delegations AND position_delegations on staging) to Phase 102 — Staging Data & Debt Tail. The happy path is not demonstrable by code alone: the handler reads a nonexistent relation, and no delegation data exists anywhere this project deploys.'
human_verification:
  - test: 'On /settings, click "Access & Security", then the Sign out row control'
    expected: 'Lands on /login; localStorage sb-zkrcjzdemdmwhearhfgg-auth-token is null'
    why_human: 'No automated run has ever executed this click (the e2e dies at the locator before it); blocked on the SC1 gap ruling'
  - test: 'Render the sidebar NavUser card and both /settings sign-out rows in Arabic (dir="rtl")'
    expected: 'Tajawal applies; dropdown opens on the correct side; "تسجيل الخروج" renders; row geometry intact'
    why_human: 'AR is verified as JSON data only; no RTL render was ever captured (92-02 does-not-establish #3, 92-VALIDATION Manual-Only)'
  - test: 'View the NavUser card and /settings Session group at 1024px and 1400px'
    expected: 'Matches the sidebar card visual identity and the settings row recipes at both analyst-workstation widths'
    why_human: 'UI-SPEC Definition of Done requires both; neither render was performed (92-02 does-not-establish #4)'
---

# Phase 92: Session Integrity & Edge-Function Auth — Verification Report

**Phase Goal:** A user can sign out, a valid session is accepted by every edge function, and an invalidated session visibly ends.
**Verified:** 2026-08-15T11:45:04Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Method

Goal-backward against the 5 ROADMAP success criteria (`ROADMAP.md:282-288`). **Every number below
was re-derived by this verifier's own commands in this session** — greps re-run, SQL run against
staging, the edge-auth probe executed a third time, and both Playwright specs executed live against
the running dev server (localhost:5173 → staging Supabase). SUMMARY claims were treated as claims;
where a claim is repeated here it is because the derivation reproduced it.

## Goal Achievement

### Observable Truths

| #   | Criterion                                                                                                        | Status                                               | Evidence (verifier-run)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign out from sidebar AND /settings → /login, session cleared                                                    | ⚠️ **PARTIAL**                                       | **Sidebar half VERIFIED live:** my own run of `92-signout.spec.ts` (chromium-en, --no-deps): test 1 passed — inline sign-in, user-menu click, sign-out, `**/login` reached, `sb-…-auth-token` read back **null**. **`/settings` half OPEN:** test 2 failed in my run at `getByTestId('settings-signout')` — same failure, same cause as 92-02 recorded. The control's click has never been executed by anything.                                                                                                                          |
| 2   | Valid session accepted: 133 pinned files migrated to @2 + `getUser(token)`, deployed, no audited route 401-empty | ✓ **VERIFIED**                                       | All re-derived: (a) `grep -rlE '@supabase/supabase-js@2\.3[0-9]' … index.ts \| wc -l` → **0**; (b) population at `phase-92-base` → **133**; plan-derived D → **133**; every one of the 133 now on `@2` with `getUser(token)`/equivalent (see below); (c) ledger → **139 unique OK, 0 unresolved FAIL**; (d) my own probe run: **11 representatives, 0×401**, codes identical line-for-line to `92-PROBE-FINAL.md`; (e) all five audited-401 functions probed non-401 by me.                                                               |
| 3   | Invalidated session bounces the open tab (no ghost shell)                                                        | ✓ **VERIFIED**                                       | **Observed behaving, not just gated:** my own run of test 3 passed — session mutated in-place (expired + corrupted refresh token), **no reload**, tab navigated to `/login` within the 45s budget. Plus `authStore.signout.test.ts` re-run by me: 2/2 (SIGNED_OUT clears cache + navigates; PASSWORD_RECOVERY does neither — greens attributable to the branch).                                                                                                                                                                          |
| 4   | /delegations: error state on rejection, real delegations otherwise                                               | ⚠️ **PARTIAL (error half closed; data half parked)** | **Error half VERIFIED live:** my own run of `92-delegations-error.spec.ts`: CDP-blocked `my-delegations` renders `role="alert"` + "Couldn't load delegations" + Try again inside the alert, no empty state, em-dash stats — 2/2 passed. AR copy keys verified present. **Data half NOT demonstrable:** my SQL against staging confirms `public.delegations` does not exist and both real tables (`permission_delegations`, `position_delegations`) hold **0 rows**. The unblocked test passes via the legitimate-empty-state branch only. |
| 5   | P88-02 credentials rotated, secrets + .env.test updated, login smoke green                                       | ✗ **PARKED (operator act, not done)**                | Re-derived: `.env.test` has **0 of 6** `E2E_*` keys (E2ECRED-01). `92-10_g1` red is the expected park (RULING-P92-45), the one red in the 21-gate drill. The credentials are, as far as this phase can tell, still live.                                                                                                                                                                                                                                                                                                                  |

**Score:** 2/5 fully verified; SC1 and SC4 half-closed with the open halves named; SC5 parked on an external operator act.

### Criterion 2 — the per-file derivation (the phase's core discipline, re-run)

- 302 `index.ts` files exist under `supabase/functions`; the criterion's population is the **133**
  that pinned `@2.3x` at `phase-92-base` (re-derived: exactly 133; identical to the union of the
  92-04..08 plan `<files>` blocks).
- Of the 133 now: **0** still pin 2.3x; **0** call bare `getUser()` — the two grep hits
  (`dossier-export-pack`, `dossiers-update`) are **comments** ("bare getUser() 401s on valid
  tokens"); both files call `getUser(token)` at their real call sites (verified by reading them).
- 105 use `getUser(token|jwt|authHeader…)` or `_shared/auth`; the remaining 28 were inspected by
  sample and fall into two legitimate classes: header-passthrough clients that forward the caller's
  `Authorization` header to PostgREST without calling `getUser` at all (`countries`, `dossiers`,
  `reports`, …) and service-role/webhook functions with no user auth by design (`email-send`,
  `webhook-delivery`, `slack-bot`, …). Neither class carries the bare-`getUser()` 401 defect.
- Second clause ("no audited route renders empty because of a 401"): all five audited-401 functions
  probed **non-401 by this verifier** — `audit-logs-viewer` 500, `data-retention` 500,
  `field-permissions` 200, `my-delegations` 200, `data-export` 200. The two 500s and the
  empty-200 are the three filed defects (below), not 401s.

### The unmasked defects are pre-existing, not regressions — confirmed

`git diff phase-92-base..HEAD` on `my-delegations`, `data-retention`, `audit-logs-viewer`: **5 lines
each** — the import specifier and the `getUser(token)` change, nothing else. The broken data layers
(`public.delegations` missing; `users.role` read without grant; `audit_log` column-shape mismatch)
predate the phase and were untouched by it. All four defects are filed on the tracked surface:
`DELEG-01`, `DR-42501`, `AUDIT-42703` → Phase 93 (`REQUIREMENTS.md:371-373`); `SEED-DELEG-01` →
Phase 102 (`:376`).

### Required Artifacts

| Artifact                                                                | Expected                                                           | Status                 | Details                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/layout/nav-user.tsx`                           | Sidebar user card w/ sign-out, `data-testid="user-menu"`           | ✓ VERIFIED + exercised | Clicked by my live e2e run (test 1 green)                                                                   |
| `frontend/src/store/authStore.ts` SIGNED_OUT seam                       | `queryClient.clear()` + lazy `/login` navigation                   | ✓ VERIFIED + exercised | Unit test 2/2 re-run by me; e2e test 3 green in my run                                                      |
| `frontend/src/components/settings/sections/SecuritySettingsSection.tsx` | Independent `/settings` sign-out, `data-testid="settings-signout"` | ⚠️ ORPHANED-BY-MOUNT   | Exists, statically wired to `logout()`; unreachable to the spec (unmounted on landing view); never executed |
| `/delegations` error branch + `delegation.json` en/ar error keys        | Distinct error state                                               | ✓ VERIFIED + exercised | Forced-error e2e green in my run; ar keys present (`ar/delegation.json:29-32`)                              |
| `supabase/functions/*` (133 files)                                      | `@2` + explicit token                                              | ✓ VERIFIED             | Per-file derivation above                                                                                   |
| `92-DEPLOY-LEDGER.md`                                                   | 139 OK rows, 0 unresolved FAIL                                     | ✓ VERIFIED             | Re-counted by me                                                                                            |
| `scripts/probe-edge-auth.sh` + `92-PROBE-FINAL.md`                      | Live probe evidence                                                | ✓ VERIFIED + re-run    | My third run reproduces all 11 codes exactly                                                                |
| `tests/e2e/92-signout.spec.ts`, `92-delegations-error.spec.ts`          | Behavioral oracles                                                 | ✓ VERIFIED + executed  | Run by this verifier this session                                                                           |

### Behavioral Spot-Checks / Probe Execution (all run by this verifier)

| Check                             | Command                                                                                  | Result                                                 | Status                      |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| Edge auth, 11 representatives     | `bash scripts/probe-edge-auth.sh …` (11 fns)                                             | 0×401; codes identical to 92-PROBE-FINAL               | ✓ PASS                      |
| Sign-out + bounce e2e             | `playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps`           | **2 passed / 1 failed** (test 2 = the SC1 gap)         | ⚠️ matches record           |
| Delegations forced-error e2e      | `playwright test tests/e2e/92-delegations-error.spec.ts …`                               | 2 passed                                               | ✓ PASS                      |
| SIGNED_OUT seam unit              | `vitest run src/store/authStore.signout.test.ts`                                         | 2 passed                                               | ✓ PASS                      |
| SC2 derivation                    | `grep -rlE '@supabase/supabase-js@2\.3[0-9]' …`                                          | 0                                                      | ✓ PASS                      |
| E2ECRED-01                        | `grep -cE '^E2E_(ADMIN\|ANALYST\|INTAKE)_(EMAIL\|PASSWORD)=' .env.test`                  | 0                                                      | ✓ blocker confirmed         |
| DELEG-01 / SEED-DELEG-01          | SQL on staging                                                                           | `public.delegations` absent; 0 + 0 rows in real tables | ✓ parked-half confirmed     |
| RLS header-injection preservation | `git grep -c "global:" {phase-92-base,HEAD} -- 'supabase/functions/*/index.ts' \| wc -l` | 247 → 247                                              | ✓ no decrease (static only) |

### Requirements Coverage

| Requirement | Status               | Evidence                                                                                |
| ----------- | -------------------- | --------------------------------------------------------------------------------------- |
| AUTH-01     | ✓ SATISFIED          | Sidebar sign-out observed live by verifier (session key null)                           |
| AUTH-02     | ✓ SATISFIED          | Two-sided: source derivation 0 + live probe 0×401, both verifier-run                    |
| AUTH-03     | ✓ SATISFIED          | Open-tab bounce observed live by verifier, no reload                                    |
| AUTH-04     | ⚠️ PARTIAL           | Error half proven live; data half deferred (DELEG-01/Phase 93, SEED-DELEG-01/Phase 102) |
| AUTH-05     | ⚠️ PARTIAL           | Control exists + human-reachable; e2e red; click never executed — needs the SC1 ruling  |
| CARRY-01    | ✗ BLOCKED (operator) | E2ECRED-01 re-derived; rotation not performed; Phase 101 consumes it                    |

### Anti-Patterns Found

None. `TBD|FIXME|XXX` scan over the phase-modified frontend files: clean. Known Stubs sections in
all SUMMARYs: none claimed, none found.

### Gate green vs criterion true — instances observed

- The 21-gate drill (20×exit-0, 1×exit-1) proves **parse validity and exit codes only** — its own
  footer says so. It is not cited here as evidence for any criterion.
- `92-09_g2` accepts _any_ 6 non-401 lines; only 4 of the 11 probe lines discriminate a migration
  from no migration (401-at-baseline representatives). `tasks-get`'s 200 proves nothing — it was
  never in the population and was 200 at baseline.
- The delegations "unblocked load" test is green while the surface has no data path — the test's
  own comments say a pass must not be read as a working load. My-delegations' confident
  `200 {"granted":[],"received":[],"total":0}` **satisfies** the non-401 gate while being the exact
  success-shaped failure the milestone targets (DELEG-01).
- `92-10_g1`'s red is a gate that **cannot reach its subject** (setup throws on missing keys), not
  a measured failure of `01-login`.

## WHAT THIS VERIFICATION DOES NOT ESTABLISH

1. **The `/settings` sign-out works.** Nothing — no test, no human — has ever executed that click.
   Its wiring to `logout()` is a static read of the source. This is the sharpest open item in SC1.
2. **Per-function health of the 139 deployed functions.** 11 were probed (by me); no claim exists
   for the other 128. Non-401 ≠ health: 3 of my 11 probes are 500s — two filed
   (`AUDIT-42703`, `DR-42501`), and **`push-notification-send`'s 500 is undiagnosed with no filed
   owner**. `my-delegations`' 200 is empty-array success-shaped (filed).
3. **RLS row-scoping behavior.** The 247→247 header-injected-client count is a static grep (mine).
   No probe ever verified any function returns correctly _scoped_ rows for a real user.
4. **Bare `getUser()` outside the population is safe everywhere.** ~116 non-population files still
   call it; the only behavioral evidence that `@2` + bare `getUser()` works is a single probe
   (`tasks-get` → 200). D-16 branch 2 was excluded by that measurement, not by a sweep.
5. **The deployed `dossier-stats` bundle is clean.** `dossier-stats/dashboard-aggregations.ts:1`
   still pins esm.sh `2.39.0` and **is imported by the migrated `index.ts:4`** (re-verified in
   source), so the deployed artifact re-bundles a 2.3x specifier. Outside the D-07/D-08 population
   by ruling; no deployed-artifact check covers it. (`_shared/ai-interaction-logger.ts:12`
   likewise, though nothing migrated imports it.)
6. **Anything about production.** Every live check in this phase and this verification ran against
   staging (`zkrcjzdemdmwhearhfgg`) and a local dev server. The droplet is untouched and untested.
7. **Arabic as pixels.** AR strings verified as JSON data; no RTL render of NavUser, the settings
   rows, or the delegations error state was ever captured. No 1024/1400px render check either.
8. **Client-side residue is cleared on sign-out.** Only the supabase session key is asserted null.
   Six other localStorage stores persist by design (`CLIENTSEC-01`, Phase 100).
9. **The credentials are safe.** They are not rotated; `01-login` has never been observed passing
   or failing on its merits in this phase.
10. **The second deploy pass is explained.** 229 attempts vs 139 functions remains **unexplained by
    the record**; the "changed nothing" conclusion rests on script-size equality and exit codes,
    not a byte-level artifact diff. Recorded in the ledger addendum (`c43785c6`).
11. **The e2e greens generalize.** My Playwright runs used one user, one browser project
    (`chromium-en`), `--no-deps`, against a dev server already running in this working tree. No AR
    project, no mobile project, no CI run.

### Gaps Summary

Two real gaps and one external park. **SC1's `/settings` half** is an unresolved orchestrator
ruling from 92-02 — the control was built where the plan put it, and the spec can't see it there;
one of the two (mount or spec) must move, then one green run closes it. **SC5/CARRY-01** is an
operator act with a checklist already written in `92-10-SUMMARY.md`; nothing an agent can or should
do. **SC4's data half** is deferred with clear later-phase owners (93 + 102) and is reported
half-closed, per the phase's own discipline. SC2 and SC3 — the phase's heaviest lifts — re-derive
cleanly from scratch, including a third identical probe run and a live behavioral observation of
the session bounce.

---

_Verified: 2026-08-15T11:45:04Z_
_Verifier: Claude (gsd-verifier) — all derivations run in-session; no SUMMARY number re-quoted unverified_
