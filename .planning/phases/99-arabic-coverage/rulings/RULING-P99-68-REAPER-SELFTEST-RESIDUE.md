# RULING-P99-68 — close selftest residue before bounded render

**Decision:** The two-reviewer no-material verdict on the runtime stands, but the mandatory zero-residue check is unmet. Repair the selftest harness only. Runtime and criteria behavior stay frozen unless criteria needs a residue clause correction. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## Problem

A full successful four-locale run left 30 live `time.sleep(120)` plants and six `$TMPDIR/tkr-t11-*` directories immediately after execution. Prior `/tmp/tkr-*` checks measured the wrong directory and established nothing. Transient later disappearance is not cleanup evidence.

## Required harness contract

- Register every spawned process, process group/session, and temp directory immediately at creation in a run-local cleanup registry.
- Every fixture has local `try/finally`; the top-level selftest has a final registry sweep that runs on success, assertion failure, timeout, and exception.
- Cleanup re-resolves the registered session/process identity, signals every remaining owned group, waits/polls to independently verified zero, and handles delayed inner forks. A fixed 200 ms sleep is not proof.
- Do not remove a temp directory until its owned process/session population is zero. Then remove it and verify absence.
- Before printing `SELFTEST OK`, assert: every registered pid/session/group is gone or positively dead, every registered directory is absent, and configured drill ports are free. Any unavailable instrument or survivor makes the selftest fail.
- Measure paths through `os.tmpdir()` / Node `tmpdir()`, never hardcoded `/tmp`. Report the exact owned registry population; do not glob and claim ownership of another run's `tkr-*` path.

## Regressions

Add a fixture whose inner child appears after the parent is killed and survives longer than 200 ms. The old cleanup must fail the immediate-zero assertion; the repaired cleanup must wait/reap and finish with zero. Add forced assertion/timeout paths and verify the top-level registry closes them.

Re-run four locales sequentially. Immediately after each process exits, independently check the registered manifest/paths, live process signatures and drill ports. No grace period may be used to turn transient residue into green.

## Implementer and surface

Resume the Sonnet lineage once if decisive, otherwise cold-start Sonnet. Edit only:

- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md` if needed for residue wording.

Do not edit `scripts/pw-run-reaped.mjs`; its R9 hash remains the candidate authority. No Kimi, subagents, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R10-REPAIR-REPORT.md` ending `REAPER-R10-REPAIR-END`. The orchestrator verifies runtime hash unchanged, scope, writer exit, and immediate zero residue; freezes new selftest/criteria hashes; writes `.tickmarkr/overseer/P99R-R10-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R10-REPAIR-END`; then stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R9-REPORT.md`
- `.tickmarkr/overseer/P99R-R9-REVIEW-HANDOFF.md`

The runtime convergence verdict is not reopened by this ruling. This repair exists because verification that leaks processes is unfinished verification.
