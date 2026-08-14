# Phase 92: Session Integrity & Edge-Function Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-15
**Phase:** 92-session-integrity-edge-function-auth
**Areas discussed:** Sign-out surfaces, Edge-function JWT acceptance, Session invalidation,
`/delegations` failure reporting, Credential rotation

---

## How these were answered

This discussion ran under an orchestration policy set by the operator, not the standard interactive
flow. Questions the governing documents settle were answered from the documents, with the source line
recorded against each decision. Questions the documents do **not** settle were parked to the operator
in `.tickmarkr/overseer/PARK-P92.md` rather than decided here.

Every row below therefore records **which document decided it**, not a user selection — except the two
parked rows, which record that no decision was taken.

---

## Sign-out surfaces (AUTH-01, AUTH-05)

| Option                        | Description                                                      | Selected |
| ----------------------------- | ---------------------------------------------------------------- | -------- |
| Mount the existing `NavUser`  | `nav-user.tsx` already implements `logout()`; nothing imports it | ✓        |
| Mount the existing `UserMenu` | `header/UserMenu.tsx` — a second, functionally identical orphan  |          |
| Write a new shell control     | Fresh dropdown in the sidebar user card                          |          |

**Decided by:** `REQUIREMENTS.md AUTH-01` names `NavUser` explicitly ("is mounted or its `logout()`
path is wired to the live shell"). `ROADMAP.md:284` requires the control on the sidebar user card
**and** `/settings`, so two surfaces, not one.
**Notes:** `UserMenu.tsx` was discovered during the codebase scout and is not in the audit. Mounting
both would be worse than one orphan; its disposal was recorded as Claude's Discretion (D-16 area),
not as scope.

---

## Edge-function JWT acceptance (AUTH-02)

| Option                 | Description                                                          | Selected   |
| ---------------------- | -------------------------------------------------------------------- | ---------- |
| Take the number — 133  | Every `index.ts` pinning `2.3x`, per the figure both documents quote | **PARKED** |
| Take the wording — 53  | Only files that are both pinned `2.3x` **and** call bare `getUser()` | **PARKED** |
| Take the defect — ~216 | Every bare `getUser()` plus the pin-only bumps                       | **PARKED** |

**Decided by:** nothing — **parked as PARK-1.** `ROADMAP.md:285`'s number and its wording select
different populations (133 vs 53), and 110 further functions call bare `getUser()` while already on
`@2`.
**Notes:** The end state per migrated function _is_ settled by `REQUIREMENTS.md AUTH-02`
(`@supabase/supabase-js@2` + `getUser(token)`) — only the file list is open. A third measurement
reframed the defect: 161 of 163 bare-`getUser()` functions forward the caller's `Authorization` header
into the client, so bare `getUser()` is not a defect by shape, only on the deprecated pin. Per ruling
R2 the plan carries the derivation command, never the count.

---

## Session invalidation (AUTH-03)

| Option                                        | Description                                       | Selected |
| --------------------------------------------- | ------------------------------------------------- | -------- |
| Add a subscription at the app root            | What the requirement's wording literally suggests |          |
| Fix the five subscriptions that already exist | Correct the handlers producing the ghost state    | ✓        |

**Decided by:** ruling `RULING-P92-01-EVIDENCE.md` R3, on evidence from the codebase scout —
`onAuthStateChange` already exists at five sites, so the premise "no subscription exists" is false. A
sixth firing alongside five is a new bug.
**Notes:** `services/auth.ts:637-650` already clears user/session/`isAuthenticated` on `SIGNED_OUT`
but performs no navigation — that is precisely the "Member/Member ghost shell" of `ROADMAP.md:286`.
The symptom and its cause are the same code.

### Sub-question: does the forced redirect preserve a return path?

| Option                                  | Description                                          | Selected                 |
| --------------------------------------- | ---------------------------------------------------- | ------------------------ |
| Plain redirect to `/login`              | Literally what AUTH-03 asks; no new state            | **PARKED** (recommended) |
| `redirectTo` param honoured after login | Standard UX; opens a redirect surface if unvalidated | **PARKED**               |

**Decided by:** nothing — **parked as PARK-2.**

---

## `/delegations` failure reporting (AUTH-04)

| Option                                         | Description                                          | Selected |
| ---------------------------------------------- | ---------------------------------------------------- | -------- |
| Fix `/delegations` locally in this phase       | Both halves: authenticate, and render an error state | ✓        |
| Defer the error state to Phase 93's `TRUST-01` | Let the general data-layer fix cover it              |          |

**Decided by:** `REQUIREMENTS.md AUTH-04` names `/delegations` in _this_ phase's requirement set, while
`TRUST-01` sits in Phase 93 — which declares `Depends on: Phase 92` because auth failures must stop
first. Deferring would invert that dependency.
**Notes:** `supabase/functions/my-delegations/index.ts` pins `@2.39.0` and calls bare
`auth.getUser()` at line 106, so it sits inside the AUTH-02 population — its auth half is fixed by
that migration whichever scope PARK-1 resolves to.

---

## Credential rotation (CARRY-01)

| Option                                         | Description                       | Selected |
| ---------------------------------------------- | --------------------------------- | -------- |
| Plan it as an operator checklist, non-blocking | Verification step, operator-owned | ✓        |
| Treat it as code work in the phase             |                                   |          |
| Let the phase's other criteria wait on it      |                                   |          |

**Decided by:** `ROADMAP.md:293` — "Criterion 5 is an operator act, not code… The other four criteria
do not depend on it and must not wait for it."
**Notes:** This is the same act that held Phase 88 open. The phase must be able to close its four code
criteria with `CARRY-01` still outstanding.

---

## Claude's Discretion

- Disposal of `frontend/src/components/layout/header/UserMenu.tsx`, the second orphaned logout menu —
  delete alongside the `NavUser` mount if still unreferenced, or leave it to the `DEAD` group.
- Whether AUTH-02 is one plan or several, and how its staging deploy is batched.

## Deferred Ideas

- The 110 functions calling bare `getUser()` while already on `@2` — Phase 93 if the PARK-1 probe
  shows them failing.
- A `redirectTo` return path after forced sign-out — PARK-2 option B.
- `/settings` tabs not saving (`WRITE-05`) — this phase makes `/settings` reachable and gives it a
  sign-out control; it does not make it save.
