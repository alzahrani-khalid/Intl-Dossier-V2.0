---
phase: 92-session-integrity-edge-function-auth
plan: 10
status: PARKED — not executed, blocked on an operator act
requirements: [CARRY-01]
gates: { '92-10_g1': RED — parked with named external blocker E2ECRED-01 }
completed: null
---

# Phase 92 Plan 10: CARRY-01 credential rotation — **PARKED, NOT EXECUTED**

**No work was done under this plan, and none should have been.** It is `autonomous: false`; its only
task is a `checkpoint:human-action` gate. This SUMMARY exists so the phase's record is complete and
so nobody later reads the absence of a file as an absence of a decision.

Written by the orchestrator (`orch-p92-exec`), not by an executor — there was no executor, because
dispatching one would have meant an agent attempting a credential rotation.

## Why it was not executed

Rotating live credentials cannot be automated from an agent session: the GitHub Actions secret store
is not writable from here, and doing it at all would put credential values where this session can
see them. The plan says so itself, and the phase brief's rule 3 makes human checkpoints absolute.

**No checkpoint was auto-answered.** The park was filed at dispatch time — before any other plan ran
— specifically so the operator would see it at the start of the run rather than discover it at the
end.

## Park and ruling

- `PARK-EXEC-01` in `.tickmarkr/overseer/PARK-P92-EXEC.md` — candidates, evidence, recommendation.
- **`RULING-P92-45`**: candidate 1 approved. `92-10_g1` stays red as a labelled PARK with its named
  external blocker; the operator is notified; nothing waits on it.

This satisfies branch (b) of `ACCEPTANCE-P92-EXEC.md` condition 2 — _parked with its named external
blocker_ — as distinct from silently dropped, "deferred", or green-by-stand-in.

## Gate `92-10_g1` — RED, and red for the right reason

Measured, not assumed:

```
$ grep -cE '^E2E_(ADMIN|ANALYST|INTAKE)_(EMAIL|PASSWORD)=' .env.test
0                       # all six required keys absent
```

`tests/e2e/support/auth.setup.ts:10-13` reads all six `E2E_{ADMIN,ANALYST,INTAKE}_{EMAIL,PASSWORD}`
and throws when any is `undefined`. The `chromium-en` project carries `dependencies: ['setup']`, so
the throw takes down every spec routed through it — including this gate's `01-login`.

Note the distinction the gate standard's clause C2 draws: this is a gate that **cannot reach its
subject**, not a gate whose subject failed. It is recorded as a park, never as a measured red.

## Why nothing in Phase 92 waited on it

**D-15**, verified in planning by parsing `depends_on` values across all ten plans: **nothing
`depends_on: [92-10]`.** Phase 92's four code criteria closed with this outstanding. CARRY-01 held
Phase 88 open once; it did not hold Phase 92.

## What remains — the operator's checklist

Never paste any value into an agent session.

1. Rotate the staging test users' passwords (project `zkrcjzdemdmwhearhfgg` → Authentication →
   Users, or `auth.admin.updateUserById`).
2. Update the GitHub Actions repository secrets — **six**, not four:
   `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_ANALYST_EMAIL`, `E2E_ANALYST_PASSWORD`,
   `E2E_INTAKE_EMAIL`, `E2E_INTAKE_PASSWORD`.
3. Update local `.env.test` with the same six.
4. Confirm the old values no longer authenticate.
5. Re-run the login smoke.

## WHAT THIS DOES NOT ESTABLISH

- **Nothing about the credentials.** They are not rotated. The exposed P88-02 values are still live
  as far as this phase can tell, and this SUMMARY is not evidence otherwise.
- **Nothing about `01-login`.** The spec has never been observed passing or failing on its merits in
  this phase; it cannot reach its assertions while `setup` throws.
- `E2ECRED-01` is filed to **Phase 101 — CI Gates Green**, where `CARRY-02`/`CARRY-05` consume it,
  and it is a likely contributor to `main` being chronically red. Phase 92 routed around it for one
  spec (`RULING-36/37` moved the AUTH-01 oracle to `92-signout --no-deps`). **Routing around is not
  fixing.**
