> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-02-COMPILE-CONTRACT.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-02 — the GSD→engine compile contract: ACCEPTED as binding, one correction, ship decision made

2026-08-18, OVERSEER (wK:p7X). Input: `P99-COMPILE-CONTRACT.md` (CONTRACT-END verified on disk).

## Verification performed from this seat, not inherited

- §0 reproduced in my own hands: `compileGsd(".planning/phases/98-copy-truth", …)` at 1.93.0
  returns the exact `COMPILE_ERROR` quoted (P98-01, `Create …98-01-SUMMARY.md` outside
  `files_modified`).
- The write-directive regex is exact bytes at `dist/compile/gsd.js:85`; `assertWriteScope` is
  called at `:173`.
- Negative scope: §§1–9's other proven claims (id derivation, acceptance shapes, context-ref
  filtering, status trap, routing tiers) are accepted on the orchestrator's probe record; I did
  not independently re-run those probes. The one command in §10 re-checks the load-bearing ones
  against the real P99 set at leg-1 exit, which is where they matter.

## Rulings

1. **The contract is BINDING for leg 1.** The 12-point checklist is a leg-1 exit condition:
   `P99-PLAN-REPORT.md` must quote the §10 in-process compile output (task count, per-task id /
   deps / files / acceptance / humanGate) for the final plan set. A plan set that has not been
   through that command is not ready, exactly as the contract says.

2. **Correction to §5, so an act does not migrate columns:** DECIDING a human gate is mine and
   is never auto-answered — that half stands verbatim. EXECUTING `tickmarkr approve <runId>
<taskId>` after my written ruling is the ORCHESTRATOR's act (the division-of-labor table:
   I rule and record; you run the loop). The contract as written would put my hands on the
   run loop; it does not.

3. **Ship/no-ship on the §0 collision — decided now, recorded in both repos.** The defect is a
   PRODUCT defect: `compileGsd`'s stated purpose is ingesting GSD plan sets, it already models
   the sibling-summary convention for status inference (§8), and it rejects the standard
   template on boilerplate. QUEUED UPSTREAM: appended to
   `~/Desktop/CodingSpace/tickmarkr/.planning/QUEUE-v191-SEEDS.md` (2026-08-18) with repro and
   the natural fix (auto-scope the plan's own sibling summary). Checklist item 2 (hand-list the
   summary in `files_modified`) is the INTERIM, operator-local remedy; its removal condition is
   the upstream fix shipping. Until then it applies to every phase 99–103.

4. **Model discipline, standing from this ruling:** every future claude seat spawn pins
   `--model` explicitly after the `--`; the seats ledger records the model READ from the pane
   status line, never assumed. The 10:19:35Z correction line is accepted as filed (right form —
   corrects, does not rewrite). `p99-research` stays live on fable-5: swapping a mid-work seat
   costs more than the quota it saves; rationing priority (verifier > checker > planner >
   executors) governs the seats not yet spawned, and the leg-1 checker/verifier independence
   still comes from codex per the brief.

RULING-END
