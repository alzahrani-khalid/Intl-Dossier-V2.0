# Phase 23: Missing Verifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 23-missing-verifications
**Areas discussed:** Verification depth, Gap handling, Evidence standard, Scope boundaries

---

## Verification Depth

| Option                       | Description                                                                                                       | Selected           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------ |
| Code + runtime (Recommended) | Inspect code to confirm implementation exists, THEN run seed scripts / check TanStack Router params actually work | :heavy_check_mark: |
| Code inspection only         | Grep for implementations, check file existence, read SUMMARYs. Faster but relies on trusting SUMMARY claims       |                    |
| Full regression test         | Run the full app, execute seed data flow end-to-end, verify every DEBT fix in browser                             |                    |

**User's choice:** Code + runtime
**Notes:** Proves features work at runtime, not just that code was written.

---

## Gap Handling

| Option                          | Description                                                                                  | Selected           |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------ |
| Fix in this phase (Recommended) | If verification finds a gap, fix it immediately and document the fix. Only defer large gaps. | :heavy_check_mark: |
| Document only, defer fixes      | Record gap as FAIL with evidence, create new phase for fixes                                 |                    |
| You decide per case             | Claude's discretion based on fix complexity                                                  |                    |

**User's choice:** Fix in this phase
**Notes:** Small fixes inline, large gaps deferred to new phase.

---

## Evidence Standard

| Option                               | Description                                                                    | Selected           |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------ |
| CLI output + code refs (Recommended) | Grep results, CLI output from running seed scripts, TypeScript compiler checks | :heavy_check_mark: |
| Screenshots + CLI output             | Include browser screenshots of seed data in UI and DEBT fixes working          |                    |
| Structured checklist only            | Pass/fail table per requirement with brief text evidence                       |                    |

**User's choice:** CLI output + code refs
**Notes:** Matches depth of Phase 18/22 verifications.

---

## Scope Boundaries

| Option                           | Description                                                                                    | Selected           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------ |
| Full closure (Recommended)       | Create VERIFICATION.md AND update REQUIREMENTS.md checkboxes AND update milestone audit status | :heavy_check_mark: |
| VERIFICATION.md only             | Only write verification documents, leave other updates manual                                  |                    |
| Verification + requirements only | Update VERIFICATION.md and REQUIREMENTS.md, leave audit for next run                           |                    |

**User's choice:** Full closure
**Notes:** All 5 requirements fully closed by end of phase.

## Claude's Discretion

- Execution environment for seed script verification
- VERIFICATION.md internal structure
- Order of verification (Phase 17 vs 19)

## Deferred Ideas

None — discussion stayed within phase scope
