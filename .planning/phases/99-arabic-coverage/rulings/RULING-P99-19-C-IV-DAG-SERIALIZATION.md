> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-19-C-IV-DAG-SERIALIZATION.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-19 — c-iv: serialize the rendered lane in the DAG. Neither c-i nor c-ii is needed.

2026-08-18, OVERSEER (wK:p7X). Input: `P99-C-PRICING.md` (C-PRICING-END). Your analysis is
accepted in full — and it made a fourth option visible that none of us had priced.

## 1. What your pricing established, credited

- **c-i's deadlock is defused, and you defused MY objection rather than agreeing with it:**
  `/usr/bin/shlock` takes over a dead holder's lock. The real cost is the one you found instead —
  a 30-minute stall window against `taskTimeoutMinutes: 30`, worst wait ~70 min, converting into
  flaky reds. That is a worse failure than the collision it prevents.
- **c-ii measured honestly:** 21.3 min/task clean → ~14.6 h serial vs ~5–6.4 h at concurrency 3.
  A real 8–9 hour bill.
- **c-iii is dead on a fact I could not have guessed:** backend AND agent-runtime both read `PORT`,
  so one value collides _inside a single worktree_, and vite reads none. Three product files to
  change for a mechanism that still would not work. Refused.

## 2. The measurement that decides it — c-iv, and it is nearly free

12 of 41 tasks carry rendered oracles, but their existing dependencies already serialize most of
them. Computing transitive ancestry over the current graph (hash `b0dcf8c4d7a1`), the tasks that
can genuinely run at the same time produce **12 concurrent-capable rendered pairs**, and every one
of them involves just four tasks: `P99-08`, `P99-10`, `P99-12`, `P99-19`.

**THREE edges collapse all twelve to ZERO, with no cycles introduced** (verified by re-running the
ancestry computation over the modified graph):

```
P99-10 depends_on P99-08
P99-12 depends_on P99-10
P99-19 depends_on P99-12
```

Chain: `P99-08 → P99-10 → P99-12 → P99-19 → P99-20 → P99-21` (the last two were already chained).
The other 29 tasks keep concurrency 3 and are untouched.

**Cost: roughly two task-slots of added critical path — under an hour on your own 21.3 min figure
— against c-ii's 8–9 hours.** No new mechanism, no repo change, no product change, and the
scheduling authority stays the thing that is already the scheduling authority. It is the same
instrument that carries D-24's verify-before-drop, which is precedent, not novelty.

## 3. The cost I am accepting, stated rather than discovered later

These edges are **resource serialization, not data dependencies** — `P99-10` does not consume
`P99-08`'s output. Two consequences, both owned:

1. **Park propagation.** A park in `P99-08` now stalls five tasks behind it where today it stalls
   none. This phase parks often, so the cost is real; I accept it against an 8-hour alternative,
   and I commit to ruling rendered-lane parks FIRST when several are open.
2. **A modelling smell that must not rot into a lie.** Each of the three plans records, in the
   frontmatter beside the edge, that it is a PORT-CONTENTION serialization with this ruling cited —
   so no later reader infers a data relationship that does not exist, and so the edges are
   removable the day `c-iii`'s port plumbing becomes real.

## 4. Execution

1. Add the three `depends_on` edges with the annotation above. Nothing else in those plans changes.
2. Recompile (CLI, exit quoted) and **re-run the concurrency analysis as the acceptance of this
   ruling**: concurrent-capable rendered pairs must be **0**, cycles none, task count 41, bounds
   intact. Quote it.
3. Then the single commit: your five conversions + these edges + my `playwright.config.ts`
   reuse-opt-in.
4. Preflight, fixed watchers armed, tripwire re-bound to the new runId, daemon launched with
   `.env.test` sourced, launch.

If step 2 shows anything other than zero, stop and bring it — c-ii remains the fallback and its
price is known.

RULING-END
