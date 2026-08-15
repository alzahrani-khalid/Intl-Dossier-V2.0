---
phase: 92-session-integrity-edge-function-auth
kind: deploy-ledger
started_by: 92-04
project_ref: zkrcjzdemdmwhearhfgg
---

# Phase 92 — staging deploy ledger

One line per named-function deploy against staging (`zkrcjzdemdmwhearhfgg`). Started by plan `92-04`;
later plans (`92-09` in particular, which owns the four `intelligence-*` importers) append to it.

**Deploy command** (never bare `supabase functions deploy` — that would push all 303 functions and
re-resolve carets on functions this phase does not own):

```
supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg
```

CLI `supabase` v2.106.0. Timestamps are UTC, captured immediately **before** each deploy invocation.
`OK` means the command printed `Deployed Functions on project zkrcjzdemdmwhearhfgg: <name>` and
exited 0; every line below was observed, none typed from expectation.

## 92-04 deploys

| #   | Function                      | Deployed (UTC)       | Bundle   | Result | Why deployed                           |
| --- | ----------------------------- | -------------------- | -------- | ------ | -------------------------------------- |
| 1   | audit-logs-viewer             | 2026-08-15T10:29:21Z | 741.9 kB | OK     | Class-1 core (D-19), observed 401      |
| 2   | data-retention                | 2026-08-15T10:29:31Z | 740.3 kB | OK     | Class-1 core (D-19), observed 401      |
| 3   | field-permissions             | 2026-08-15T10:29:37Z | 736.3 kB | OK     | Class-1 core (D-19), observed 401      |
| 4   | my-delegations                | 2026-08-15T10:29:44Z | 732.5 kB | OK     | AUTH-04 auth half, observed 401        |
| 5   | auth-biometric-setup          | 2026-08-15T10:29:53Z | 737.2 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 6   | auth-refresh-token            | 2026-08-15T10:29:59Z | 762.2 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 7   | embeddings-generate           | 2026-08-15T10:30:06Z | 719.3 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 8   | notifications-register-device | 2026-08-15T10:30:11Z | 738.0 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 9   | push-notification             | 2026-08-15T10:30:16Z | 739.5 kB | OK     | `_shared/auth.ts` importer — re-bundle |
| 10  | sync-push                     | 2026-08-15T10:30:22Z | 738.0 kB | OK     | `_shared/auth.ts` importer — re-bundle |

**10 / 10 OK. No retries were needed — no deploy failed.**

### Helper-importer note (D-06)

Editing `_shared/auth.ts` redeploys nothing by itself; each importer must be deployed to re-bundle
the helper. Rows 5–10 are the six importers **outside** the 2.3x sweep population. The other four
importers — `intelligence-batch-update`, `intelligence-get`, `intelligence-refresh`,
`intelligence-refresh-v2` — are in the sweep population and are deployed by plan **92-09** after
their own sweep edits. Until 92-09 lands, those four still run a bundle carrying the old
`_shared/auth.ts` pin. That is by design, not an omission.

## Probe: baseline vs post-deploy (D-16 / D-21)

Command, run from the repo root after the deploys above:

```
bash scripts/probe-edge-auth.sh audit-logs-viewer data-retention field-permissions my-delegations
```

Verbatim stdout:

```
audit-logs-viewer -> 500
data-retention -> 500
field-permissions -> 200
my-delegations -> 200
```

| Function          | Baseline (pre-migration) | Post-deploy | Auth gate             |
| ----------------- | ------------------------ | ----------- | --------------------- |
| audit-logs-viewer | 401                      | **500**     | PASSED (was REJECTED) |
| data-retention    | 401                      | **500**     | PASSED (was REJECTED) |
| field-permissions | 401                      | **200**     | PASSED (was REJECTED) |
| my-delegations    | 401                      | **200**     | PASSED (was REJECTED) |

Baseline codes are quoted from `92-PROBE-BASELINE.md` §1 ("Actual output (verbatim)"), captured at
`phase-92-base` before any Phase 92 production edit.

Per the D-16 verdict rule, **401 means auth rejected; any other status means the request passed the
`getUser` gate.** All four flipped off 401, so all four now accept a valid session JWT.

The two `500`s are **past the auth gate** and are pre-existing data-layer defects that the 401 was
previously masking. They are diagnosed, with their verbatim error bodies, in `92-04-SUMMARY.md`
under `PRE-EXISTING DEFECTS NEWLY EXPOSED` — including the correction they force on this plan's
D-20 handoff claim. Do not read `500` here as "auth still broken"; do not read it as "closed",
either.
