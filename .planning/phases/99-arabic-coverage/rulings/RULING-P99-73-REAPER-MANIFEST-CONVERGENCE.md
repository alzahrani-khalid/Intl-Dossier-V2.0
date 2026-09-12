# RULING-P99-73 — complete manifest convergence confirmation

**Decision:** Release the R12 selftest/criteria candidate to Grok dynamic and Codex static confirmation. Runtime remains frozen. No source edit, commit, rendered run, standalone gate, compile, or Phase-99 run is released.

## Authority

Use `.tickmarkr/overseer/P99R-R12-REPAIR-HANDOFF.md` §3 hashes. Preserve the two Grok-aborted evidence directories. Re-hash before and after; runtime mismatch voids the round.

## Grok dynamic assignment

For each locale:

- run selftest with a unique manifest;
- immediately run external checker;
- require 208/208 and 129/129, no grace;
- inspect manifest counts/statuses and registered ports;
- run forced exceptions for every named fixture family;
- execute reg35 RED→GREEN completeness control;
- execute abrupt termination, record persisted partial manifest and checker non-zero, then clean exact identities and confirm identity rows zero while completion remains non-zero by design.

Also force manifest write failure (EACCES and malformed destination) and require selftest/checker non-zero without losing already-registered ownership data where persistence was possible.

Write `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R12.md`, ending `REAPER-RESIDUE-R12-VERIFY-END`.

## Codex static assignment

Under `workspace-write -a never`, enumerate every real-process fixture and confirm central spawn registration plus local `try/finally`. Verify the 210→208 change is restructuring rather than deleted protection. Confirm incremental atomic manifest writes on every transition, missing/malformed/in-progress manifests fail, checker instrumentation fails closed, criteria uses unique manifest + external checker, and global pgrep/glob diagnostics do not decide pass/fail.

Write `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R12.md`, ending `REAPER-RESIDUE-R12-CONSULT-END`.

Both seats are read-only. Runtime may not change. No rendered Playwright stack and no tickmarkr.

## Completion

Both markers, stable hashes, writer exits, unchanged runtime and preserved evidence paths are required. The orchestrator writes `.tickmarkr/overseer/P99R-R12-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R12-REVIEW-END`, answering whether the zero-residue guarantee is now structurally and dynamically satisfied. Stop for OVERSEER ruling.

A two-reviewer yes releases the bounded real rendered run only.
