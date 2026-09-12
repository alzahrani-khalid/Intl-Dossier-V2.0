# RULING-P99-66 — ninth bounded reaper repair

**Decision:** Repair both verified gaps. The candidate remains uncommitted. No rendered run, standalone gate, compile, or Phase-99 run is released.

## 1. Never move a consumer-visible final owned by an unknown writer

Remove final-report quarantine from the runtime. The wrapper cannot distinguish a supported caller's final from a foreign writer's final, and it does not need to.

- Startup never deletes/moves the final.
- Finish never deletes/moves the final.
- Clean publication uses atomic no-overwrite; occupied final makes this run non-zero and leaves this run's nonce-bound pending evidence intact.
- Unclean verdict with any final present records occupancy as a cause and returns non-zero; the final remains byte-identical.
- Actual repository `&&` composition prevents the consumer from running on every non-zero wrapper result.

Update header and criteria: do not claim quarantine or distinguishability. Remove stale foreign-path expectations. Add a genuinely overlapping two-run `runMode` lifecycle: B preflights while final absent, A publishes before B finishes, B returns non-zero with zero consumer calls, A's final remains byte-identical, B's pending evidence remains nonce-bound. This is the interleaving R9-N1 constructed; sequential A-then-B is not a substitute.

## 2. Revalidate own PGID immediately before every exported reap

In `reapLeakedPorts`, before each target call to `reap`:

- re-read `pgidOf(process.pid)`;
- require a valid safe value;
- require it equals the initial own-PGID observation, otherwise fail closed for the remainder;
- refuse when target PGID equals the current own PGID.

Unavailable or changed own identity signals nothing further and records an explicit unavailable cause. Add a DI call-order row where own PGID changes during port census and the target becomes the new own group: zero reap calls. Keep the valid control and real escape drill green.

A valid-but-wrong value returned consistently by the sole `ps` authority remains documented instrument trust; no second authority exists.

## Implementer and tests

Resume the exact Sonnet lineage once if decisive, otherwise cold-start Sonnet. Edit only runtime, selftest, and criteria. No Kimi, subagents, plan/config edits, commit, rendered run, tickmarkr command, or reviewer spawn.

Re-run four-locale matrix, both entry matrices, concurrent same-final lifecycle, exported reaper real plants, actual `&&` composition, and zero residue. Every new row asserts branch and call counts.

Deliver `.tickmarkr/overseer/P99R-R9-REPAIR-REPORT.md` ending `REAPER-R9-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes hashes, and writes `.tickmarkr/overseer/P99R-R9-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R9-REPAIR-END`. Stop for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R8-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R9-REPORT.md`
- `.tickmarkr/overseer/P99R-R8-REVIEW-HANDOFF.md`
