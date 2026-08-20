# RULING-P99-70 — complete the selftest residue guarantee

**Decision:** Behavioural cleanliness is credited, but the guarantee is incomplete. Repair the selftest and residue criterion; runtime remains frozen. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Register every owned process identity

Extend the run-local registry to record every real process/session/group at creation, including:

- escape plant;
- T11 wrapper and detached dummy;
- T10 and every standalone fixture child;
- regB/regC/reg25/reg26/reg28 and all other real-process fixtures.

A directory registration is not a process registration. The top-level sweep must have enough pane-independent identity to terminate and independently verify every owned process even when local cleanup never runs.

## 2. Local `try/finally` is mandatory

Add local `try/finally` ownership to every real-process fixture, specifically the reviewer-named T10, T11/runFixture, regB, regC, reg25, reg26 and reg28 paths. Callback cleanup without a surrounding `finally` is insufficient. Local cleanup runs first; the top-level registry is the final guarantee.

## 3. Residue oracle fails closed and is ownership-bound

Replace the global glob/signature oracle with a manifest-based external check:

- selftest writes a run-specific residue manifest naming every owned directory, pid/session/group and drill port;
- after selftest exit, a separate mode in the same selftest file reads that manifest and re-probes each exact identity/path/port;
- unavailable `ps`/process census or malformed manifest is failure, never zero;
- the checker reports each identity's outcome and exits non-zero on survivor, unavailable instrument, missing expected record, or present directory;
- no global `pgrep`/glob is used as the ship oracle. Optional global diagnostics must carry their own positive control and cannot decide pass/fail.

Update `P99R-REAPER-CRITERIA.md` to invoke the selftest with a unique manifest path and then the external manifest checker. The manifest checker itself gets positive and negative controls, including a deliberately live owned process and an unavailable-census instrument.

## Tests

Retain `reg30-OLD/NEW` and `reg31`. Add coverage proving every real fixture registers process identity and has a local `finally`; a source-text count alone is not acceptance, so execute forced exceptions for each fixture family. Re-run four locales with per-locale manifest checks immediately after exit, no grace period. Verify zero owned residue and free registered ports.

## Implementer and surface

Resume the Sonnet lineage once if decisive, otherwise cold-start Sonnet. Edit only:

- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

Runtime hash `5e073e35…` must remain byte-identical. No Kimi, subagents, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R11-REPAIR-REPORT.md` ending `REAPER-R11-REPAIR-END`. The orchestrator verifies runtime unchanged, scope, writer exit, and the external manifest checker; freezes hashes; writes `.tickmarkr/overseer/P99R-R11-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R11-REPAIR-END`; then stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R10.md`
- `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R10.md`
- `.tickmarkr/overseer/P99R-R10-REVIEW-HANDOFF.md`
