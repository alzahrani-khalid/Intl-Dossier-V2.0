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

Measured, not asserted. See the appended section below.
