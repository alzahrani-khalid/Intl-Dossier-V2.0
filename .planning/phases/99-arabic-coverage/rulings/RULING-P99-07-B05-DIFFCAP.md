> **WORKER-REACHABLE COPY.** The authoritative original is `.tickmarkr/overseer/RULING-P99-07-B05-DIFFCAP.md`,
> which is gitignored and therefore unreachable from a task worktree. This copy was placed here by the
> OVERSEER on 2026-08-18 (`RULING-P99-14`) so the 17 tasks citing it as context can actually read it.
> Verbatim at copy time; if the two ever differ, the `.tickmarkr` original governs.

# RULING P99-07 — B-05 diffCap: SPLIT, no config raise

2026-08-18, OVERSEER (wK:p7X). Inputs: orchestrator's independent measurements (99-08
ruled-terms-only ~63,262 logic bytes + up to ~94,266 from ملف lines; 99-09 ~237,818 as a FLOOR
from a line-bound instrument), checker B B-05. Verified from this seat: the cap check runs in the
ACCEPTANCE gate (`gates/acceptance.js:331-332`, `opts.diffCap ?? DEFAULT_DIFF_CAP`), the only
override is GLOBAL `gates.diffCap`, and the config's own comment states the fork: "split the
task or raise this positive integer."

## Decision: SPLIT BOTH PLANS. The global raise is REFUSED.

The cap is not an arbitrary ceiling — it protects the two LLM gates that read the DIFF: the
acceptance judge (every criterion must cite a changed hunk) and the cross-vendor review. Raising
it globally to clear a 237KB diff makes those gates decorative precisely on the phase's
highest-risk mechanical sweeps — and the ملف sense-classification is the phase's KNOWN
destructive class, the one place I most want reviewable diff sizes. A plan knowingly built to
park is a plan defect; a cap raised until nothing parks is a review gate removed in disguise.

## Split constraints (binding on p99-planner-2)

1. **Axis: FILE-DISJOINT lanes (D-39), each estimated ≤ ~45,000 logic bytes** — headroom below
   60,000 because the current numbers are FLOORS. Estimates come from the MULTI-LINE matcher
   (the committed audit), never the line-bound grep — the instrument whose blindness produced
   the floor is not the instrument that budgets the lanes.
2. **99-09 keeps the A-02 structure:** ONE repo-wide verification task (strict-zero, both
   locales), then N deletion lanes, each `depends_on` the verify task, each file-disjoint, each
   with a scoped two-arg-zero oracle over its own `files[]` plus the suite. Estimate ~5 lanes;
   the count comes from the measurement, not from this sentence.
3. **99-08 splits along the term-family axis:** (a) ruled instances + tie-breaks + queue
   collision (small); (b) `ارتباط`→`مشاركة`; (c) `موجز`/`منصب` sense repairs; (d) the ملف
   sense-classification as its OWN lane — it is the highest-judgment sweep and gets its own
   review gate. The drilled glossary instrument (A-04) runs in EVERY lane's acceptance AND the
   99-10 consolidated battery.
4. **Per-lane estimates are STATED in the plan report** with the instrument named and the
   floor-awareness stated. A lane that measures over budget at plan time is re-cut then, not
   parked later.
5. Wave shape: lanes that are file-disjoint run concurrently; the split adds tasks, not
   serialization. Neither shatter nor fuse (D-39) — the lane count follows the measurement.

## Upstream seed (filed with this ruling)

The park shape is a product gap: the cap trips in the acceptance gate AFTER the work is done,
the park is un-retryable by the engine's own message, and there is no compile-time estimator and
no per-task cap — honest large mechanical work cannot be planned against the cap except by
operator guesswork. Seeded in the tickmarkr queue: compile-time diff-budget estimation (the
compiler already knows `files[]` and could warn), and/or a per-task `diffCap` in the plan
schema so a ruled exception is scoped instead of global.

RULING-END
