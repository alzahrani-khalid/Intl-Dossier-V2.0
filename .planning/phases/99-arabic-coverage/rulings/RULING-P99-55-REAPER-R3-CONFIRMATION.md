# RULING-P99-55 — release R3 reaper candidate to final static confirmation

**Decision:** Release the R3 frozen candidate to the same Grok and Codex reviewer lineages. No source edit, commit, bounded rendered run, standalone gate, compile, or Phase-99 run is released.

The runtime is now 1253 lines. Do not split or refactor during this confirmation round: three safety passes have shown that unrelated structural churn is itself a defect source. If the candidate clears behavior, decomposition becomes a separately reviewed maintainability decision, not an acceptance prerequisite.

## Review authority

Review only the R3 hashes in `.tickmarkr/overseer/P99R-R3-REPAIR-HANDOFF.md` §4:

- runtime `d1fcf86768282b72517c26cdcf43a274254492dcb2d252d8fe28b5990edc3d3e`;
- selftest `552ee2640bd40224d225a458b274cc1702ff26dfe6ee2dabedc0cc81fdb43066`;
- criteria `70ffd3b1d5fe35ea38fa55c8667b8c8493ff15c590c74a3a450903e82de94009`.

Each reviewer re-hashes before reading and after finishing; mismatch is `HEAD-MOVED`.

## Grok assignment

Resume the original Grok lineage once. Regrade the six RULING-P99-54 repairs with its own constructions:

1. pre-spawn port unavailability prevents child spawn and final report publication;
2. malformed/incomplete lease schema and missing wrapper identity signal nothing and retain evidence;
3. full writer tuple is matched first and every signal round;
4. pending JSON is not consumer-visible before clean cleanup, and publish/cleanup failure stays non-zero;
5. T11 ordinary early exit/timeout/throw leaves wrapper and detached dummy gone;
6. canonical, `/var` alias, and symlink invocations all execute the seven failure shapes and exit non-zero.

Re-run the four-locale 92/92 matrix and verify zero residue. Probe the implementer's stated weak point: real Playwright has not exercised `PLAYWRIGHT_JSON_OUTPUT_NAME`; static review must at least establish the environment path reaches the reporter config correctly.

Write `.tickmarkr/overseer/P99R-VERIFY-R3-REPORT.md`, ending `REAPER-VERIFY-R3-END`.

## Codex assignment

Resume the original Codex finding-owner lineage once. Re-confirm the six consolidated R2 residuals and R3-N3/N4 as repaired/partial/not repaired. Attack missing/invalid schema fields, stale/reused identities, noncanonical paths, pre-spawn census failure, failed pending publish, and legacy consumer visibility. Re-run 92/92 plus the 21-shape bootstrap matrix. State whether any prior F1–F7/N1/N2 repair regressed.

Write `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R4-REPORT.md`, ending `REAPER-VERDICT-R4-END`.

Both seats are read-only and may not start a rendered Playwright stack or run tickmarkr.

## Completion

Both markers, stable hashes, and writer exits are required. The orchestrator writes `.tickmarkr/overseer/P99R-R3-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R3-REVIEW-END`, classifying every finding and whether static source repair is still required. Stop for OVERSEER ruling.

If and only if both reviewers return no material source defect, the next ruling will release the bounded real rendered run; it will not infer real-world correctness from synthetic confirmation.
