# RULING-P99-69 — confirm zero-residue selftest harness

**Decision:** Release the R10 frozen selftest to Grok dynamic confirmation and Codex static confirmation. Runtime hash `5e073e35…` remains authoritative and is not reopened. No source edit, commit, rendered run, standalone gate, compile, or Phase-99 run is released.

## Authority

Use only `.tickmarkr/overseer/P99R-R10-REPAIR-HANDOFF.md` §4 hashes. Re-hash before and after; runtime mismatch voids the round.

## Grok dynamic assignment

Run all four locales sequentially. Immediately after each selftest process exits, with no grace period:

- execute the criteria residue oracle verbatim;
- verify every registered directory in the run's own manifest is absent;
- verify registered process/session/group identities are zero/dead;
- verify drill ports free.

Exercise passing path plus forced assertion, timeout, and “no local cleanup ran” paths. Confirm `reg30-OLD` fails immediate-zero and `reg30-NEW` needs at least two rounds. Do not clean residue before recording it.

Write `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R10.md`, ending `REAPER-RESIDUE-VERIFY-END`.

## Codex static assignment

Under `workspace-write -a never`, confirm every plant/temp directory is registered at creation, every local fixture has `finally`, top-level sweep runs before verdict, directory removal waits for independently verified zero, and the residue oracle uses `$TMPDIR`/owned identities. Run DI rows available in the sandbox; mark `ps`-dependent checks environment-limited.

Write `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R10.md`, ending `REAPER-RESIDUE-CONSULT-END`.

Both seats are read-only. No rendered Playwright stack and no tickmarkr.

## Completion

Both markers, stable hashes, and writer exits are required. The orchestrator writes `.tickmarkr/overseer/P99R-R10-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R10-REVIEW-END`, answering whether the mandatory zero-residue common check is now satisfied. Stop for OVERSEER ruling.

If satisfied, the bounded real rendered run is released next. No commit is implied.
