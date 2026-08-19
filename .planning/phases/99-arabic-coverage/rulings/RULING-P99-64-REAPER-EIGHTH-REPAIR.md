# RULING-P99-64 — eighth bounded reaper repair

**Decision:** Repair the two verified fail-open inputs. The candidate remains uncommitted. No rendered run, standalone gate, compile, or Phase-99 run is released.

## 1. Startup never deletes a shared final report

`clearStaleReport` must not remove `jsonOut`. The final path is shared by supported callers and has no nonce ownership at startup. Atomic no-overwrite publish already makes a pre-existing final fail closed; startup deletion defeats that guarantee.

- Clear only this run's nonce-bound pending path and nonce-bound unclean path.
- Make retained unclean evidence nonce-bound as well; concurrent failed runs must not overwrite each other.
- A supported caller starting while another caller's published final exists leaves that final untouched, writes to its own pending path, and exits non-zero at publish without invoking the consumer.
- A stale final is treated as occupied/foreign evidence, never silently deleted. Cleanup of old finals is an operator action outside runMode.

Add a real runMode lifecycle regression that includes the pre-spawn clear, two nonces sharing one final, caller A's published final present before caller B starts, and call-count proof that B never invokes `pw-red-assert` or changes A's bytes.

## 2. Own-process-group identity is mandatory

In `reapLeakedPorts`, if `pgidOf(process.pid)` is unavailable/null/unsafe, fail closed for the entire operation: signal nothing, record the unavailable self-exclusion input, and spare every target.

The “never signal our own group” guard is a safety prerequisite, not an optional comparison. Add a DI row where only the own-PGID lookup is unavailable while holder PGID/start remain valid; assert zero reap calls and explicit unavailable output. Keep valid-own-PGID controls and real escape drills green.

## Tests and criteria

Update stale criteria/header text. Re-run four-locale 126/126 plus new rows, both entry matrices, nonce-concurrency lifecycle, `reapLeakedPorts` real plants, actual `&&` composition, and zero residue. Each new row asserts the intended branch and call count.

## Implementer and surface

Resume the exact Sonnet lineage once if decisive, otherwise cold-start Sonnet. Edit only:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

No Kimi, subagents, plan/config edits, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R8-REPAIR-REPORT.md` ending `REAPER-R8-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes hashes, and writes `.tickmarkr/overseer/P99R-R8-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R8-REPAIR-END`. Stop for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R7-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R8-REPORT.md`
- `.tickmarkr/overseer/P99R-R7-REVIEW-HANDOFF.md`
