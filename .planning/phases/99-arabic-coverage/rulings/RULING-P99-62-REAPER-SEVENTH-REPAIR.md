# RULING-P99-62 — seventh bounded reaper repair

**Decision:** Repair both verified unbound inputs. The candidate remains uncommitted. No rendered run, standalone gate, compile, or Phase-99 run is released.

## 1. Report staging path is nonce-bound

Change `pendingReportPath` to require the current run nonce and produce a unique path for the same final `jsonOut`, for example `<jsonOut>.pending-<nonce>`.

- Every call site passes the nonce minted for that wrapper run.
- A second run with the same final path and a different nonce has a different pending path.
- Publication validates that pending path belongs to the current nonce before no-overwrite publish.
- Correct criteria text: `reg18` must use the **same final name with two nonces**, not two different final names.

Add concurrency-oriented regressions for two supported callers sharing one final path: independent pending bytes, one clean publish, the other non-zero on occupied final, no cross-consumption, both evidence sets preserved.

## 2. Direct-group identity is mandatory

Production group cleanup may not signal when `expectedStart` is null/unavailable. Missing direct-child birth identity is `unavailable`, enters the cleanup verdict, and sends zero group signals.

For a non-ESRCH signal-0 error, the only permitted `gone` fallback is positive process-table proof that:

- the exact group leader still has the expected canonical start identity; and
- its state is zombie/dead.

Any identity mismatch, unreadable start, missing expectedStart, live state, or process-table failure is `unavailable`, never `gone`. This measured zombie exception amends the earlier literal “only ESRCH” rule narrowly; it does not turn arbitrary EPERM into success.

Add real and DI regressions for:

- missing expectedStart → unavailable, zero TERM/KILL;
- EPERM + same-start zombie → gone;
- EPERM + different-start zombie → unavailable;
- EPERM + live process → unavailable;
- ESRCH → gone;
- final group-zero result entering the clean conjunction.

## Evidence envelope decision

Codex's workspace-write sandbox could not run `ps`; its static findings remain valid and were verified byte-for-byte by the orchestrator. Do not rerun under a broader bypass. Grok provided the dynamic real-process evidence for the rest of R6. This repair gets its own dynamic confirmation from Grok and static confirmation from Codex under the same bounded envelopes.

## Implementer and surface

Resume the exact Sonnet implementation lineage once if decisive, otherwise cold-start Sonnet. Edit only:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

No Kimi, subagents, plan/config edits, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R7-REPAIR-REPORT.md` ending `REAPER-R7-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes hashes, and writes `.tickmarkr/overseer/P99R-R7-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R7-REPAIR-END`. Stop for final confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R6-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R7-REPORT.md`
- `.tickmarkr/overseer/P99R-R6-REVIEW-HANDOFF.md`
