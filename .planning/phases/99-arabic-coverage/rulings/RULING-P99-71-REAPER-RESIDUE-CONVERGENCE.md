# RULING-P99-71 — ownership-bound residue convergence

**Decision:** Release the R11 selftest/criteria candidate to Grok dynamic and Codex static confirmation. Runtime remains frozen and is not reopened. No source edit, commit, rendered run, standalone gate, compile, or Phase-99 run is released.

## Authority

Use `.tickmarkr/overseer/P99R-R11-REPAIR-HANDOFF.md` §4 hashes. Re-hash before and after; runtime mismatch voids the round.

## Grok dynamic assignment

For each of four locales:

1. create a unique manifest path;
2. run the selftest with `--manifest`;
3. immediately run `--check-residue` with no grace period;
4. verify 210/210 and manifest 101/101;
5. independently verify registered ports and exact owned identities zero.

Execute forced exception/timeout/no-local-cleanup paths for every fixture family named in RULING-P99-70, not a source-text count. Re-run `reg30-OLD/NEW`, `reg31`, the live-owned-process negative control, unavailable-census control, empty-manifest control, and resurrected-directory control. Do not clean before recording a failure.

Write `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R11.md`, ending `REAPER-RESIDUE-R11-VERIFY-END`.

## Codex static assignment

Under `workspace-write -a never`, enumerate each real fixture and verify registration-at-creation plus local `try/finally`. Run the manifest checker controls available in the sandbox. Confirm unavailable `ps`/census returns non-zero rather than zero and that criteria invokes a unique manifest and external check. Mark real-process rows environment-limited where necessary.

Write `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R11.md`, ending `REAPER-RESIDUE-R11-CONSULT-END`.

Both seats are read-only. Runtime may not change. No rendered Playwright stack and no tickmarkr.

## Completion

Both markers, stable hashes, writer exits and unchanged runtime are required. The orchestrator writes `.tickmarkr/overseer/P99R-R11-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R11-REVIEW-END`, answering whether the mandatory zero-residue check is satisfied structurally and dynamically. Stop for OVERSEER ruling.

A two-reviewer yes releases the bounded real rendered run only.
