# Phase 97 — seat → model record (configured vs ACTUAL)

**Committed on purpose.** The overseer-side chain (`.tickmarkr/overseer/`: rulings, plan-check
verdicts, the plan report, the ledger) is **gitignored — local-only and machine-bound**. This
file exists because Phase 97 produced the first constraint in six phases that a FUTURE phase
must inherit and that would otherwise live only in untracked local files.

**The inherited fact, stated plainly: the `fable` model quota is EXHAUSTIBLE, and when it is
exhausted the thing being rationed is CROSS-MODEL INDEPENDENCE, not intelligence.** Two seats
on the same model can both be brilliant and still fail to catch each other's shared-ancestry
mistakes. Independence is the scarce resource — ration it deliberately.

Ruled by `RULING-P97-02-MODEL-FALLBACK.md` (2026-08-17, overseer under standing delegation;
the operator did not sign it). Config was left **unedited** — the deviation is recorded, not
papered over.

## Planning leg — seats, configured vs actual

<!-- prettier-ignore -->
| Seat | Configured | ACTUAL | Why the difference |
|---|---|---|---|
| `gsd-phase-researcher` | fable | **fable** | ran before the quota was exhausted |
| `gsd-ui-researcher` (attempt 1) | fable | **fable — DIED** | Fable 5 quota exhausted mid-run; **no artifact written**; the run is a FAILURE, not a partial credit |
| `gsd-ui-researcher` (attempt 2) | fable | **opus** | fallback after the quota death |
| `gsd-ui-checker` | sonnet | **sonnet** | unaffected — and the only cross-model seat left in the planning leg |
| `gsd-planner` | fable | **opus** | quota |
| `gsd-plan-checker` (attempt 1) | opus | **fable attempted first** | scarcity priority (below) puts the checker above the planner, so the scarce independent model is offered to the checker seat |
| `gsd-plan-checker` (attempt 2, if 1 dies) | opus | **opus** | fallback |

**The cost, named rather than glossed:** with the planner and the plan-checker both on opus,
the planning leg loses the cross-model independence that caught real defects in P95 and P96.
A checker sharing the planner's ancestry shares its blind spots.

**Checker false-green guard (overseer, same day).** A dead checker and a clean checker both
produce "no blockers reported" — the seat whose job is finding blockers returning nothing, for
a reason that has nothing to do with the plans. Therefore:

1. A checker run that dies, truncates, or returns an unparseable/partial verdict is a
   **FAILURE, never a PASS.** No partial verdict is merged; there is no "got most of the way"
   credit.
2. A checker PASS is believed only if the run **completed** AND its verdict artifact
   (`P97-PLAN-CHECK-<attempt>.md`) is **on disk with its terminal marker** — the disk-over-
   transcript law every other seat obeys.
3. Both attempts are recorded, the dead one included: a dead attempt is DATA, showing the
   priority was actually tried rather than skipped.

## Execution leg — binding rules (re-derive, do not assume)

1. **RE-DERIVE fable availability at exec dispatch.** Quota state at plan time does not predict
   quota state at exec time; treat the earlier death as a measurement with a timestamp, not a
   standing fact.
2. **Fable goes to the INDEPENDENT VERIFIER first.** Its entire value is shared-no-ancestry
   with the seats that produced the work. If fable is unavailable, the verifier runs opus **and
   states the shared-ancestry limit in its own did-NOT-establish section** — an independent
   verifier that shares the executor's model has not established independence and must say so.
3. **Scarcity priority when the independent model is limited:**
   **verifier > checker > planner > executors.**

## Why this is a phase record and not process scaffolding

Process scaffolding (which pane ran what, watcher timings) is fine local-only. A constraint the
next phase inherits is not. Phase 98's planner needs to know, before it dispatches anything,
that model independence can vanish mid-leg and that there is a ruled priority for who gets it
first.

MODEL-SEATS-END
