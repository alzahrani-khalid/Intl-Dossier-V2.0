# RULING-P99-72 — complete process registration and abort manifests

**Decision:** Repair the selftest ownership ledger; runtime remains frozen. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Centralize process registration

Introduce one selftest-owned spawn wrapper used by every real-process fixture. It registers child PID, PGID/session identity and owning directory immediately before control returns to the fixture. Replace direct `spawn`/`spawnSync` fixture creation through this wrapper where a persistent child can survive the call.

Every reviewer-listed family must be covered: T10, T11/runFixture, T14 runMode fixture, reg1, reg8, both reg9 paths, reg10, reg13, reg14, reg16, reg17, reg25, both reg26 lifecycles, reg28 outer/nested, reg34 checker children, escape plant and all plantSession users.

## 2. Local ownership for every fixture family

Route every real-process fixture through an exception-safe local `try/finally` helper that drains its registered processes/sessions and removes its owned directory only after zero. Add forced-throw execution for every named family. A top-level registry remains the last guarantee, not a substitute for local ownership.

## 3. Manifest is incremental and survives abrupt termination

When `--manifest <path>` is supplied:

- create the manifest before the first fixture;
- atomically rewrite it on every registration and cleanup state transition;
- retain all owned identities with current/final status rather than dropping records;
- include run id, timestamps, directories, pid/pgid/sid/start/cwd, ports, and completion state.

If the process is terminated before finalization, the last persisted manifest still names everything registered up to that instant. The external checker treats `completion !== complete` as non-zero and re-probes all identities. Missing manifest is failure, never clean.

## 4. Controls

Add executed controls for:

- a forced throw immediately after each fixture family's spawn: local finally closes it;
- an abrupt child termination after at least one registration but before final manifest completion: external checker reads the persisted partial manifest and reports survivors/non-completion;
- cleanup of that exact aborted manifest's owned identities, followed by checker green only after zero;
- an intentionally omitted registration in a scratch-mutant helper: checker cannot see it, and the registration-completeness test must fail before the checker is credited.

Do not glob or clean the Grok-aborted `tkr-t11-IZ1BcH` / `tkr-t11-hup-OZunMX` evidence paths; they are not this round's owned identities.

## Implementer and surface

Resume Sonnet once if decisive, otherwise cold-start Sonnet. Edit only selftest and criteria. Runtime hash `5e073e35…` remains byte-identical. No Kimi, subagents, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R12-REPAIR-REPORT.md` ending `REAPER-R12-REPAIR-END`. The orchestrator verifies runtime unchanged, scope, writer exit, manifest persistence controls, and immediate checker results; freezes hashes; writes `.tickmarkr/overseer/P99R-R12-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R12-REPAIR-END`; stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R11.md`
- `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R11.md`
- `.tickmarkr/overseer/P99R-R11-REVIEW-HANDOFF.md`
