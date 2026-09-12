# RULING-P99-74 — manifest completeness and synchronous-child ownership

**Decision:** Repair the remaining selftest ledger completeness gaps. Runtime stays frozen. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Synchronous child registration must survive parent blocking

A parent cannot register a `spawnSync` child after it blocks and still claim abort-survivable ownership. Replace persistent `spawnSync` fixture patterns with one of:

- asynchronous spawn awaited by the fixture, registering immediately in the parent; or
- a manifest bridge where the parent atomically records a pending family slot before spawn and the child writes its pid/pgid/sid/start/cwd into that slot immediately on startup.

If the parent dies before the child fills the slot, the pending slot itself makes the checker fail non-complete. No persistent child may exist while the manifest contains no corresponding record.

## 2. Centralize every remaining spawn and local cleanup

Route `plantSession`, reg33, reg36 driver/grandchild and every remaining bare spawn through the ownership wrapper/bridge. Pass the owning root for reg34 and all other helpers; `root:null` is invalid for an owned fixture.

Every real-process family has local `try/finally` that drains its own records before directory removal. `catch`-then-cleanup or sequential cleanup without `finally` is not sufficient. Add executed forced throws for plantSession, reg33, reg34, reg35, reg36 and all families named in the R12 review.

## 3. Manifest schema proves completeness

Version the manifest and require:

- schema version, runId, createdAt, updatedAt, completion enum;
- expected fixture-family list for a complete full run;
- every process record: family, pid, pgid, sid, canonical start, canonical cwd/root, status, registeredAt, updatedAt;
- session/directory/port records with owner family and status;
- no duplicate active identities, unknown status or missing required field.

The checker rejects malformed/incomplete metadata, empty complete manifests, pending spawn slots, and any expected family absent. A hand-written empty manifest and a pid-only record must fail.

## 4. Controls and preserved evidence

Add executed controls for the synchronous-parent-killed window, child self-registration, missing family, pending slot, malformed metadata, root-null record, and valid complete manifest. Preserve all existing evidence paths listed in R11/R12 handoffs, including reviewer-created directories; never glob them.

## Implementer and surface

Resume Sonnet once if decisive, otherwise cold-start Sonnet. Edit only selftest and criteria. Runtime hash `5e073e35…` remains byte-identical. No Kimi, subagents, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R13-REPAIR-REPORT.md` ending `REAPER-R13-REPAIR-END`. The orchestrator verifies runtime unchanged, scope, writer exit, schema controls, forced-family coverage and preserved evidence; freezes hashes; writes `.tickmarkr/overseer/P99R-R13-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R13-REPAIR-END`; stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R12.md`
- `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R12.md`
- `.tickmarkr/overseer/P99R-R12-REVIEW-HANDOFF.md`
