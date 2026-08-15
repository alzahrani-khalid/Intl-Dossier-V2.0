---
phase: 92-session-integrity-edge-function-auth
plan: 01
kind: baseline
captured: 2026-08-15
base_tag: phase-92-base
base_commit: e7660401b4c72350dddca605230705b0857a0345
---

# Phase 92 — Pre-fix baselines

Two independent baselines, both taken **before** any Phase 92 production edit:

1. **Edge-function auth probe** against deployed staging (D-16 verdict rule + D-21).
2. **The AUTH-01 RED measurement** of `tests/e2e/92-signout.spec.ts` (D-26).

---

## 1. Edge-function auth probe (D-16 / D-21)

### VERDICT RULE — stated before data collection (D-16)

> Verbatim from `92-01-PLAN.md` Task 1 `<acceptance_criteria>`:
>
> VERDICT RULE — stated here, before data collection (D-16). Probe one deployed representative per
> set with a valid JWT; a 401 means auth rejected, any other status (200/400/405/500) means the
> request passed the getUser gate. Branches:
> (1) all three sets non-401 → the 110 @2+bare functions are healthy; AUTH-02 closes at 133;
> nothing carries forward.
> (2) B\A (tasks-get) returns 401 → bare getUser() fails independently of the pin; the 110 are
> real work and are FILED TO PHASE 93 (which declares Depends on: Phase 92) — not pulled in here.
> (3) only A∩B returns 401 → the pin is the sole failure mode; the premise is confirmed by
> measurement rather than assumption.

The rule above was written into the plan at planning time and is reproduced here **above** the data,
so the reading cannot drift toward a preferred scope (T-92-02).

### Run record

| Property   | Value                                                                           |
| ---------- | ------------------------------------------------------------------------------- |
| Date (UTC) | 2026-08-15T10:12:13Z                                                            |
| Command    | `./scripts/probe-edge-auth.sh`                                                  |
| Target     | `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/<fn>` (deployed staging) |
| Auth       | real user JWT minted from `.env.test` `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`  |
| Repo state | `phase-92-base` (`e766040`), working tree = probe script only                   |
| Host       | macOS 26.6.1, bash 3.2.57, curl 8.7.1                                           |

No credential value appears in this file, in the script's output, or in the script itself — only
env-var **names**.

### Actual output (verbatim)

```
audit-logs-viewer -> 401
data-retention -> 401
field-permissions -> 401
my-delegations -> 401
dossiers-update -> 405
tasks-get -> 200
```

### Grouped by set

| Set                                 | Representative      | Actual status | Auth gate |
| ----------------------------------- | ------------------- | ------------- | --------- |
| **A∩B** — pinned + bare `getUser()` | `audit-logs-viewer` | **401**       | REJECTED  |
| **A∩B** — pinned + bare `getUser()` | `data-retention`    | **401**       | REJECTED  |
| **A∩B** — pinned + bare `getUser()` | `field-permissions` | **401**       | REJECTED  |
| **A∩B** — pinned + bare `getUser()` | `my-delegations`    | **401**       | REJECTED  |
| **A\B** — pinned + `getUser(token)` | `dossiers-update`   | **405**       | PASSED    |
| **B\A** — `@2` + bare `getUser()`   | `tasks-get`         | **200**       | PASSED    |

### Verdict: BRANCH 3

Only the A∩B set returns 401. `tasks-get` (`@2` + bare `getUser()`) returns **200**, so bare
`getUser()` does **not** fail independently of the pin — branch (2) is excluded by measurement.
`dossiers-update` (pinned + `getUser(token)`) returns **405** (method-not-allowed on a bare GET),
which is past the auth gate — so the pin alone is also not sufficient to fail; it is the
**pin + bare `getUser()` combination** that rejects.

Consequence per the rule: **the pin is the sole failure mode; the premise is confirmed by
measurement rather than assumption.** The 110 `@2` + bare-`getUser()` functions are NOT carried
into this phase's scope, and no Phase 93 filing is triggered by branch (2).

### What this probe does NOT establish

- It probes **one representative per set**, not all 133 functions. A per-function claim requires a
  per-function probe; this establishes the mechanism, not a census.
- `405` and `200` prove only that the request **passed the getUser gate**. They say nothing about
  whether the handler's RLS scoping is correct (Pitfall 1 is a separate, un-probed risk).
- These are **pre-migration** codes. They are the "before" half of the AUTH-02 evidence; the
  "after" half requires re-running the same command post-deploy.

---

## 2. AUTH-01 RED baseline (D-26)

**Measured, not asserted.** No assertion anywhere in this phase claims the spec is red; the command
below was run and its actual output recorded.

### Run record

| Property       | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Date (UTC)     | 2026-08-15T10:16:51Z                                                                                     |
| Command        | `pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps`                 |
| App under test | `http://localhost:5173` (`E2E_BASE_URL` unset), backed by staging Supabase                               |
| Auth           | inline sign-in from `.env.test` `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; no fixture, no `setup` project |
| Result         | **3 failed / 0 passed**                                                                                  |

### VALIDITY RULE — applied (RULING-37)

> The baseline counts ONLY if the spec reached the sign-out assertion and failed THERE. A failure
> before that point — the `setup` project, the inline sign-in, wrong or rotated credentials,
> staging down, navigation, or a selector-not-found on the LOGIN FORM — is recorded as
> `UNABLE TO MEASURE — <the actual error>` and is NEVER recorded as the red.

Two runs happened. **Both are recorded**, because the first one is exactly the failure mode the
rule exists to reject.

#### Run A — `UNABLE TO MEASURE` (recorded, NOT the red)

```
Error: locator.fill: Error: strict mode violation: getByLabel(/password|كلمة المرور/i) resolved to 2 elements:
    1) <input id="password" type="password" name="password" data-slot="input" ... />
       aka getByRole('textbox', { name: 'Password' })
    2) <button type="button" aria-pressed="false" aria-label="Show password" ...>…</button>
       aka getByRole('button', { name: 'Show password' })
   at support/pages/LoginPage.ts:37
   at LoginPage.signIn (tests/e2e/support/pages/LoginPage.ts:37:30)
   at signInInline (tests/e2e/92-signout.spec.ts:42:3)
```

This is a **selector-not-found on the LOGIN FORM** — explicitly disqualified. It is a pre-existing
defect in the shared `LoginPage` page object (the login form's "Show password" toggle carries
`aria-label="Show password"`, so the label regex matches two elements). It was fixed as a blocking
deviation (Rule 3) by scoping `passwordInput` to `#password`, mirroring
`tests/e2e/support/auth.setup.ts:21`, which already does exactly this. Run B is the measurement.

#### Run B — the AUTH-01 RED (valid)

All three tests **completed inline authentication, reached the app, and failed at the sign-out /
bounce oracle**. Verbatim failure text:

```
  ✘  1 [chromium-en] › 92-signout.spec.ts:63:7 › /settings is reachable from navigation and exposes an independent sign-out (30.4s)
  ✘  2 [chromium-en] › 92-signout.spec.ts:47:7 › sign-out genuinely clears the session (30.4s)
  ✘  3 [chromium-en] › 92-signout.spec.ts:90:7 › invalidated session bounces the open tab (48.7s)

  1) 92-signout.spec.ts:47:7 › sign-out genuinely clears the session
     Test timeout of 30000ms exceeded.
     Error: locator.click: Test timeout of 30000ms exceeded.
     Call log:
       - waiting for getByTestId('user-menu')
     > 54 |     await page.getByTestId('user-menu').click()

  2) 92-signout.spec.ts:63:7 › /settings is reachable from navigation and exposes an independent sign-out
     Test timeout of 30000ms exceeded.
     Error: locator.click: Test timeout of 30000ms exceeded.
     Call log:
       - waiting for getByTestId('user-menu')
     > 69 |     await page.getByTestId('user-menu').click()

  3) 92-signout.spec.ts:90:7 › invalidated session bounces the open tab
     TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
     =========================== logs ===========================
     waiting for navigation to "**/login" until "load"
     ============================================================
     > 114 |     await page.waitForURL('**/login', { timeout: 45_000 })

  3 failed
```

### Attribution — why this is the AUTH-01/03 red and not something else

| Stage                                                      | Outcome in run B                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `setup` project                                            | skipped (`--no-deps`) — E2ECRED-01 cannot contaminate this measurement       |
| inline sign-in (`signInInline`)                            | **PASSED** in all 3 tests — credentials valid, staging up, login form usable |
| navigation to `/`, `/dashboard`                            | **PASSED** in all 3 tests                                                    |
| A1 session-key read (`expect(...).not.toBeNull()`, test 1) | **PASSED** — see A1 finding below                                            |
| storage mutation (`page.evaluate`, test 3)                 | **PASSED** — did not throw `no supabase session under …`                     |
| **sign-out oracle**                                        | **FAILED** — `getByTestId('user-menu')` never appears (tests 1, 2)           |
| **AUTH-03 bounce oracle**                                  | **FAILED** — no navigation to `/login` within 45 s (test 3)                  |

Every disqualifying stage passed. The failures are at the oracle. This is the valid RED.

### Finding: Assumption A1 is CONFIRMED

`92-RESEARCH.md` A1 (`sb-zkrcjzdemdmwhearhfgg-auth-token`) was `[ASSUMED]`. Test 1's
`expect(await readSession(page)).not.toBeNull()` passed against a live post-login page, and test 3's
`page.evaluate` parsed a real session out of that key without throwing. The key name is correct.

### What this RED baseline does NOT establish

- Tests 1 and 2 both die at `getByTestId('user-menu')`, which is one step **before** the sign-out
  click itself. So this run proves **no sign-out seam is mounted on `/`** — it does NOT yet exercise
  `LoginPage.signOut()`, the `/settings` navigation item, or `getByTestId('settings-signout')`.
  Those locators are unproven in either direction until 92-02 mounts the controls.
- Test 3 proves the tab did not bounce within 45 s. It does not isolate **why** (no `SIGNED_OUT`
  handler vs. a handler that fires but does not navigate) — that attribution is 92-02's job.
- A red here is not evidence that 92-02's fix is correct. **D-26 is satisfied by the PAIR of
  measured outputs**: this RED plus the GREEN from re-running the identical command after 92-02
  lands. Neither half alone is the evidence.
- The run used a local dev server (`localhost:5173`) against staging Supabase. It says nothing about
  the deployed droplet build.
