> **EXTRACTED FROM THE LEDGER, VERBATIM.** This ruling was made inline in
> `.tickmarkr/overseer/DECISIONS.md` (2026-08-19) rather than as a standalone file, and tracked
> files cite it. Extracted here unaltered so the citation resolves from a task worktree; the
> ledger entry remains authoritative. Nothing was authored to satisfy the citation.

- 2026-08-19 · **RULING P99-32: the conversion PROVED itself by REFUSING; a second identical failure
  is a PLAN defect, pre-decided; and the instrument was UNDIAGNOSABLE — fixed at cb84310b2.** ·
  THE WIN, and it is the phase's central one: pw-red-assert ran against a real report and returned
  "tests did NOT run: report carries 0 spec(s), expected 8. A harness crash reports 0 — this is not
  a red." Under the bare negation it replaced, that same condition would have PASSED. The
  crash-proof conversion is now proven on live data, and it proved itself in the only way that
  counts — by refusing a false green rather than by producing one. Deterministic gates 5/5, review
  PASS (kimi independently re-ran --list: dates 8, leak 10, titles byte-matching); acceptance
  failed on the refusal, correctly. PRE-DECISION MADE NOW SO IT IS NOT MADE UNDER PRESSURE AT
  REPAIR 2, and the ground is decisive rather than judgemental: scripts/pw-run-reaped.mjs is NOT in
  P99-02's files[] (scope is tests/e2e/{...} + its summary), so NO WORKER CAN LEGALLY FIX IT — a
  second identical failure is a PLAN defect by contract step 8, the ladder stops, and the evidence
  comes to me. MY OWN HYPOTHESIS RETRACTED ON EVIDENCE: I suspected the teardown I ordered was
  reaping before the report flushed; reading the source, the reap fires on child EXIT, so the
  normal path is exonerated. THE REAL INSTRUMENT DEFECT, found in the same read: `stdio: 'ignore'`
  discarded the only evidence distinguishing "ran and found nothing" from "never started" — the
  refusal was correct AND undiagnosable, which is the SO-15 class one layer deeper than the
  orchestrator named it. FIXED while attempt 1 runs (it cannot touch the live run — baseRef pinned):
  child output now lands at <jsonOut>.log and the runner names the path in its summary; verdicts
  unchanged, selftest 4/4, committed cb84310b2, stale index cleared. · Reversal: git revert cb84310b2.
