> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-20-FOLD-REVIEW-INTO-PLAN.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-20 — HALT 0012; fold run 11's review into 99-04-PLAN.md; my D-22 control was poisoned

2026-08-18, OVERSEER (wK:p7X). Operator flagged the risk; I verified all three of its premises
before acting: `bdcd717d8` does not touch `99-04-PLAN.md`, `scripts/i18n-audit-strict.mjs` is
absent from the base tree (it is P99-04's own output), and run 11's review of P99-04 FAILED with
two material findings that reach no worker in run 12.

## 1. HALT and fold. Not "let it ride."

Letting it ride risks more than one attempt and one review round. The instrument is the acceptance
instrument for AR-04a's population — if the same defect returns and the reviewer that round is not
as sharp as `claude-code:opus` was, a **defective instrument ships and every downstream
strict-audit number in P99-08..19 is wrong**. Depending on drawing a good reviewer is not a
control. Halt now, at four minutes, in the same shape as the P99-01 repair.

## 2. What must land in the plan (both findings, verbatim in substance)

**(i) The binding model — `i18n-audit-strict.mjs:86`.** `USE_NS` captures only the FIRST namespace
of an array binding and cannot match a bare `useTranslation()`. i18next consults EVERY namespace
in an array, and a bare binding uses defaultNS `translation`, which IS registered
(`index.ts:274/410`) and which the instrument already aliases to common. The corrected model must
handle all three shapes: single string, array, bare.

**(ii) The fixture is the reason it survived — name it as such.** The `--self-check` fixture
exercises ONLY `useTranslation('feature')`, so it _structurally cannot fail_ on the two shapes the
instrument gets wrong. The fixture MUST contain all three binding shapes and MUST go red if any is
mishandled. A control that cannot distinguish the two outcomes is not a control — this phase's own
law, met inside the instrument built to enforce it.

**(iii) Vacuous `--scope` — `:124-131`.** A `--scope` prefix matching zero source files reports
`twoArgTotal 0 / rawKeyUnresolved 0` and exits 0 — a green indistinguishable from a genuinely
clean slice, in the exact flag added "so a lane can assert its own slice". **A scope prefix
matching zero source files must exit NON-ZERO.**

## 3. My own ruling is corrected in the same act

`RULING-P99-03` §5a and D-22 require, as the strict instrument's positive control, that it find
"the 9 two-arg + 42 raw-key sites the loose model hides." **The 42 is poisoned:** 39 of them
(Topbar 9, IntelligencePage 27, PositionDossierLinker 3) are artifacts of the binding bug, and
only 3 are genuine. The two-arg half (9) is clean and stands.

So D-22's control is amended: **the raw-key half of the discriminating set is RE-DERIVED under the
corrected binding model and is NOT the number 42.** No plan, oracle or summary may quote 42 as a
target. A concrete discriminator to assert instead: under the corrected model those three files
contribute ZERO rawKeyUnresolved sites — which is a check the buggy instrument fails and the
correct one passes.

## 4. Execution

1. Orchestrator: TERM run 0012's group, then recompile (the halt-leaves-running-state law).
2. Fold (i)(ii)(iii) into `99-04-PLAN.md` as explicit decisions plus oracle requirements; if
   acceptance is at the 6-item cap, extend existing items rather than adding — the pattern you
   used for the five conversions. State the population you edited before editing.
3. Recompile (CLI, exit quoted), bounds re-verified, concurrency pairs still 0.
4. I commit; you relaunch with watchers and tripwire re-bound to the new runId.

## 5. Two things worth naming in the record

The reviewer that produced this was `claude-code:opus` — the cross-vendor review seat this mission
ruled into place, catching a defect in an instrument that had already passed its own self-check.
That is the second time the review layer has paid for itself outright.

And the operator caught what neither seat did: **a finding recorded in run 11's journal does not
travel to run 12's worker.** Nothing in the engine carries a review finding across runs; the plan
is the only channel. That is a product gap, seeded upstream.

RULING-END
