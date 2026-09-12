# RULING-P99-79 — R16 closes R78; reg31 still escapes durable ownership

**Decision:** Accept R16 as satisfying all four items in RULING-P99-78. Do not release reviewer confirmation or either phase gate. The newly disclosed `reg31` residue is not a random flake: its isolated registry is intentionally absent from the durable manifest, so an external kill during `reg31` deterministically leaves its real session and directory outside the only recovery authority. Repair this in R17.

Runtime remains frozen. No rendered run, standalone gate, candidate commit, compile, or Phase-99 run is released.

## 1. R16 disposition

The orchestrator independently reproduced:

- `244/244` for bare, Arabic-locale, and manifest selftests;
- `215/215` for the external checker;
- all ten executable criteria oracles at exit 0;
- an independently constructed deleted-`check()` mutant that exits 0 at `243/243` and is rejected by the pinned oracle;
- both real helper abrupt-exit windows (`reg39`), parent-process capability absence (`reg40`), and `CENSUS 5/5`;
- frozen runtime, two-file scope, all eight evidence paths, and zero new harness residue.

RULING-P99-78 is closed on independent evidence. The candidate freeze is `.tickmarkr/overseer/freeze-p99r-r16/`.

## 2. The reg31 finding is a mechanism, not a distribution

`reg31` creates real `tkr-reg31a-*` and `tkr-reg31b-*` directories and real planted sessions in isolated in-memory registries. Registrations against those isolated registries deliberately do not enter `manifestRecords`. If the parent reaches `sweepRegistry(isoA/isoB)`, cleanup passes. If the parent is killed before that call, the isolated registry dies with it and the external checker has no directory, session, or process record to act on.

The two stale directories observed before R16 are evidence of this missing authority. Their age does not make the defect pre-existing noise; it identifies the exact abort window. Deleting those directories treated the residue, not the mechanism.

## 3. R17 repair and executable proof

R17 must give every real resource planted by `reg31` durable run-wide ownership from creation until independent final cleanup, without letting its mid-run isolated sweep drain unrelated fixtures.

Required behavior:

1. Before either planted session can outlive the parent, the main manifest durably names the directory and complete session/process identity needed for cleanup.
2. `reg31` may retain an isolated view for its local mechanism assertion, but isolated cleanup must reconcile the corresponding run-wide records rather than create a second authority.
3. A deterministic control must execute the real `reg31` path, stop after both owned plants are durably visible and before either isolated sweep, kill the parent, then prove the partial manifest alone names and cleans both plants. No `ps`/`pgrep` discovery and no hand-authored manifest.
4. The normal `reg31-A` and `reg31-B` assertions must still prove exception-unwind and no-local-cleanup behavior.
5. The external checker must fail on the abrupt partial state, then pass the exact identities after cleanup and legal status transitions.
6. Update and behaviorally pin any raised selftest/checker totals. The existing count mutants must remain red.
7. Use exact paths. Preserve all eight R11–R14 evidence paths; never glob `tkr-*`.

## 4. Surface and handoff

- Editable surface: `scripts/pw-run-reaped.selftest.mjs` and `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md` only.
- Frozen runtime SHA-256: `5e073e3577be3ec3032cbd728fd4027a9c330319cac069eb45658df31ded50a3`.
- Resume the fresh R16 Sonnet seat once; it is at approximately 40% context and already owns the disclosed finding. Do not cold-start a duplicate unless that resume is unavailable.
- The four `p99r-cnt-test*` development directories belong to that seat. Preserve their exact names in the report, then remove only those exact paths before handoff; never glob them.
- Deliver `.tickmarkr/overseer/P99R-R17-REPAIR-REPORT.md` ending `REAPER-R17-REPAIR-END`.
- The orchestrator independently verifies durable ownership before the kill, manifest-only cleanup, normal reg31 behavior, pinned totals and mutants, scope, runtime, evidence preservation, and exact scratch cleanup; freeze and deliver `.tickmarkr/overseer/P99R-R17-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R17-REPAIR-END`.
- Stop after handoff. Reviewer confirmation remains a separate, unreleased gate.

**Ship/no-ship:** This defect affects the Phase-99 safety harness, not application users. It must ship in the selftest/criteria candidate because an operator can hit it whenever the harness process is interrupted. A one-time `$TMPDIR` deletion is not the fix. Removal condition: the durable manifest owns the real reg31 resources under the abrupt-kill control and the final reviewed standalone gate passes.
