> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-09-TASK-UNIT-RECUT.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-09 — task-unit contract: acceptance basis superseded IN PART; RE-CUT ordered; the exit instrument is the CLI

2026-08-18, OVERSEER (wK:p7X). Inputs: `P99-URGENT-COMPILE-FAILS-TASK-UNIT-CONTRACT.md`
(URGENT-END). Verified from this seat: the CLI rejects the set with the 82 task-unit errors
(re-run; note my own re-run's `EXIT=0` echo measured `head`'s exit in a pipeline — the error
output is the evidence and the orchestrator's EXIT=1 stands — instrument slips do not respect
seniority even inside the correction of an instrument slip); `MAX_ACCEPTANCE_ITEMS = 6` and
`MAX_FILES_PATTERNS = 8` hardcoded at `collateral.js:242/244`; and the authoring law is in
`tickmarkr.spec.md` lines 37-40 IN THIS REPO — including a FOURTH bound the urgent file did not
list: **≤60 goal words per acceptance criterion ("density")**, and the decisive mechanic:
**a `{a,b}` brace group counts as ONE pattern.**

## 1. RULING-P99-08's basis is SUPERSEDED IN PART — the ACCEPT survives for content, is VOID for shape

Both seats ran `compileGsd()` and read parse-truth as compile-truth — the fourth
correct-computation-over-the-wrong-set this leg, load-bearing for an acceptance, and shared: the
orchestrator authored the instrument, I re-ran it and graded on it. Rule 15's class exactly —
verified through a path other than the one that loads. P99-08 gets a SUPERSEDED-IN-PART
annotation: the 39 decisions, seven rulings, 12 blocker repairs, 59-red oracle register, DAG
intent, and lane content ALL STAND; the claim "the plan set compiles" is void. This is a RE-CUT.

## 2. Exit-instrument law (the §5 proposal, ADOPTED verbatim and generalized)

**The leg-N exit probe is `tickmarkr compile <phase-dir>`, run for real, exit code and output
quoted. Nothing else counts as "it compiles."** `compileGsd()` is relabeled in the contract as a
parse check for authoring iteration. General form for the ledger: **if a check is meant to prove
a command will succeed, the check IS that command.** I am amending `P99-COMPILE-CONTRACT.md` §10
myself, as asked — the author should not silently repair a graded instrument.

## 3. Re-cut constraints (binding)

a. **Read `tickmarkr.spec.md` lines 30-60 BEFORE cutting** — the authoring law the guidance file
named all along, including density (≤60 goal words) and the judge-oracle path rule (OBS-248's
documented form). Deriving from source instead of the shipped law is what this cost.
b. **files[] ≤ 8: prefer BRACE-GROUP EXACT ENUMERATION over widening globs.** `{a,b,c}` counts
as one pattern, so most lanes keep byte-exact scope within the bound. A widening glob is the
exception and carries proof: expand it, diff against the intended set, list every admitted
extra with a one-line justification or narrow the pattern. Any glob whose expansion could
admit an exogenous path (D-03) is REFUSED — positive-control checked.
c. **acceptance ≤ 6: SPLIT over CONSOLIDATE, and consolidation is LOSSLESS.** The density bound
mechanically blocks fat criteria, so the escape valve is more tasks, not thicker sentences.
Where items merge, no criterion text is dropped: the revision file carries a traceability
table — every pre-recut item → its post-recut home — and I spot-check it at re-verification.
P98's law stands guard: compressions made under a ceiling are where unsatisfiable edits
enter; the re-cut is exactly that shape.
d. **OBS-248's 13 are repaired on their merits** — reword, or widen scope deliberately with the
(b) proof — never dissolved by a blanket glob. Each names its resolution.
e. **Structure preserved:** verify-before-drop (P99-16 shape), D-14 flatten ancestry, D-13
atomicity (the flatten's 110 files become brace-grouped patterns — it still cannot split).
Wave intent preserved; task COUNT floats as the bounds require.
f. **Re-verification scope (narrow, not a re-grade):** CLI compile exit 0 quoted; coverage gate
re-run at the new plan count; the (b) scope diffs and (c) traceability table; oracle count
reconciliation (59 red items land somewhere — none silently dropped); human-gate and
pre-done checks. Content already verified is not re-graded.

## 4. Upstream seed (filed with this ruling)

`compileGsd()` is exported and produces a graph the CLI would reject — parse-truth
indistinguishable from compile-truth for any in-process consumer. Ask: enforce the task-unit
contract inside `compileGsd()`, or export `validateTaskUnits()`, or ship `tickmarkr compile
--dry-run`. (The authoring LAW was documented — the template and the guidance block both carry
it; the seed is the API footgun, not missing docs.)

RULING-END
