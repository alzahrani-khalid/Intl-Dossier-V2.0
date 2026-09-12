# RULING-P99-51 — frozen reaper candidate released to independent review

**Decision:** Accept the 862-line runtime as the deliberate single runtime artifact; release the frozen candidate to the Grok verifier and the original Codex finding-owner confirmation. No source edit, commit, compile, or Phase-99 run is released.

## File-size decision

RULING-P99-50 required the test/drill harness to split if the runtime would cross 800 lines. That split occurred: `scripts/pw-run-reaped.selftest.mjs` contains the T/D harness and imports production exports. The production wrapper remains 862 lines.

The remaining 62-line overage is accepted. This file is safety-critical and carries the causal lease lifecycle, tri-state census, identity revalidation, signal rounds, exit composition, sweep, and CLI modes. Splitting those runtime responsibilities now would add a second runtime module and a new drift seam solely to satisfy a soft line-count target. Review may still identify a substantive separation; line count alone is not a reason to refactor the frozen candidate.

## Frozen review authority

Review only the bytes identified in `.tickmarkr/overseer/P99R-IMPLEMENTATION-HANDOFF.md` §4. Reviewers must re-run the 16-file SHA-256 manifest before reading and refuse `HEAD-MOVED` on any mismatch. No reviewer may edit, commit, or regenerate the freeze.

## Review topology

Run both seats concurrently in visible Herdr panes; the orchestrator owns spawn, seat ledger, watchers, and completion checks.

1. **Grok verifier:** fresh `grok-4.6` read-only seat in `REVIEW p99r`. Re-run the selftest, attack mutation causality and the fire-and-forget selftest import, verify exit composition, sweep/live-wrapper concurrency, and all 10 routed plan commands. Report `.tickmarkr/overseer/P99R-VERIFY-REPORT.md`, ending `REAPER-VERIFY-END`.
2. **Codex finding-owner:** first attempt one `codex resume --last` in the preserved `w0:p5` pane. If the saved session cannot be resumed decisively, stop that attempt and cold-start `gpt-5.6-sol` in the same pane, re-feeding the complete R1 report plus the frozen handoff. Do not loop on resume. Confirm F1–F7 individually as `CONFIRMED-REPAIRED`, `PARTIALLY-REPAIRED`, or `NOT-REPAIRED`, citing the frozen hash, hunk, and executable row. Report `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R2-REPORT.md`, ending `REAPER-VERDICT-R2-END`.

The Kimi implementer is exited and may not review its own work.

## Completion and handoff

Completion requires each artifact marker, stable file hash, and writer exit. `idle`/`done` is not completion. After both reports settle, the orchestrator writes `.tickmarkr/overseer/P99R-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-REVIEW-END`, with:

- exact reviewer adapters/models and whether Codex resumed or cold-started;
- freeze verification before each review;
- every material finding, classified against the approved file surface;
- whether source edits are required;
- remaining gate items: bounded real rendered run and standalone `tickmarkr verify`.

Stop for OVERSEER ruling. Do not run the bounded real test or standalone gate yet.

## Known operational defects

The Mac restart killed CLI/watch processes but preserved Herdr topology and disk artifacts. Kimi also exhibited a one-prompt queue wedge and tool-call write ceilings. These are recorded supervision defects, not evidence about candidate correctness. The upstream `seat-send.sh` fix exists but the repo mirror is stale; do not refresh it during the frozen review round.
