# RULING-P99-80 — accept R17 and release independent harness confirmation

**Decision:** Accept R17 as satisfying RULING-P99-79. The concurrent `$TMPDIR` writer is a supervision-method defect, not a defect in the R17 candidate: the candidate already attributes cleanup through its manifest and never sweeps a `tkr-*` prefix. Release independent, cross-vendor confirmation of the frozen selftest/criteria candidate. Both phase gates remain closed.

## 1. R17 disposition

Independent orchestrator evidence reproduced:

- `252/252` for bare, Arabic-locale, and manifest selftests;
- `224/224` for the external checker;
- all ten executable criteria oracles;
- both count mutants plus an independently constructed third-mechanism mutant rejected by the `252/252` pin;
- `reg41`'s six rows, including two live orphaned sessions durably named before parent death and drained from the partial manifest alone, without `ps`/`pgrep` discovery;
- unchanged `reg31-A` and `reg31-B`, with exact identity-scoped reconciliation and no widened `sweepRegistry` blast radius;
- frozen runtime, two-file scope, exact scratch cleanup, and all eight evidence paths.

RULING-P99-79 is closed. Candidate freeze: `.tickmarkr/overseer/freeze-p99r-r17/`.

## 2. Concurrent `$TMPDIR` writer ruling

The Phase-99 brief's claim that every new `tkr-*` entry belonged to this round was false. `$TMPDIR` is machine-wide; a live run in the separate tickmarkr product repository created `tkr-preview-*` and `tkr-review-*` directories concurrently. Prefix and creation time are not ownership.

No candidate repair is required. The selftest and criteria already use manifest-based exact ownership, which is the correct product mechanism. The method guard has been promoted to both project-discovered overseer skill mirrors:

- `.claude/skills/tickmarkr-overseer/SKILL.md`
- `.agents/skills/tickmarkr-overseer/SKILL.md`

The guard states that `$TMPDIR` prefix deltas are not attribution, foreign `.tickmarkr/graph.json` is a stop signal, and cleanup uses the current run's manifest and lock with exact paths. These skill files already carried prior uncommitted operator work, so this ruling does not authorize a partial commit that would absorb unrelated bytes. They remain in the final candidate's existing dirty set for the eventual scoped commit decision.

Never touch the three foreign directories. The neighboring repository's live run is unrelated and is not a concurrency violation in this repository.

## 3. Exact expected-residue cleanup before review

`tkr-bridge-helper-67472.mjs` is this phase's expected abrupt-kill artifact. It is proof that record-first ownership works, not a defect and not foreign state. Before closing the R17 seat, the orchestrator must recover its owning manifest path from the seat's own R17 evidence, verify that the manifest names this exact canonical file, and have the owning seat perform exact manifest-backed cleanup. No prefix search and no hand-authored ownership record. Record the manifest path, transition, and post-cleanup absence in the review handoff.

If the owning manifest cannot be recovered, preserve the file and report the missing authority; do not delete it by name alone.

## 4. Independent confirmation round

After exact cleanup, spawn two visible, read-only confirmation seats in the canonical reviewer layout. Buy current diversity from the live capability matrix; prefer Grok for executable falsification and Codex for independent structural review. A substitution requires an evidence file and OVERSEER ruling, not silent same-family collapse.

Both reviewers receive the frozen R17 hashes, RULING-P99-77 through RULING-P99-80, R15–R17 handoffs, and the byte copies in `freeze-p99r-r17/`. They refuse `HEAD-MOVED` or hash drift. They make no source edit, commit, rendered run, tickmarkr call, or gate decision.

### Executable verifier

Re-run the frozen candidate's declared oracles and construct focused counterexamples for:

- count pinning under a truthful lower total;
- record-before-write and both helper abrupt-exit windows;
- runtime write-path census rejecting an unclassified standalone path;
- parent-process `process.execve` absence;
- real reg31 abrupt death with manifest-only recovery;
- foreign `$TMPDIR` entries remaining untouched.

Deliver `.tickmarkr/overseer/P99R-VERIFY-R17-REPORT.md` ending `REAPER-R17-VERIFY-END`.

### Structural confirmer

Read the R15→R17 byte diffs and every changed control. Look specifically for echo-not-implement controls, hand-authored manifests standing in for real paths, authority split between isolated and run-wide registries, cleanup blast-radius expansion, count pins that can no-op, canonical-path aliasing, and any generated standalone file outside both an owned directory and a prior file record.

Deliver `.tickmarkr/overseer/CONSULT-REAPER-R17-REPORT.md` ending `REAPER-R17-CONFIRM-END`.

### Orchestrator handoff

Consume neither report until marker-terminal, writer-exited, and hash-stable. Reproduce material claims rather than averaging verdicts. Write `.tickmarkr/overseer/P99R-R17-REVIEW-HANDOFF.md` ending `ORCH-REAPER-R17-REVIEW-END`, then stop for OVERSEER ruling.

## 5. Closed gates

No bounded rendered Playwright run, standalone `tickmarkr verify`, candidate commit, compile, reviewer gate override, or Phase-99 run is released by this ruling.

**Ship/no-ship:** R17's ownership fix belongs in the Phase-99 selftest/criteria candidate. The concurrent-writer lesson belongs in the overseer skill because runtime code already enforces the correct manifest boundary. A new runtime check would duplicate the existing ownership mechanism; no runtime change is authorized.
