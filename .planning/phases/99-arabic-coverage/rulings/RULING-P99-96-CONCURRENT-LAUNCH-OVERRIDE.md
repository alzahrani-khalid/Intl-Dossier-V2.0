# RULING-P99-96 — operator overrides idle gate; launch concurrently

**Operator decision:** Launch Phase 99 now despite the neighboring tickmarkr run's active Vitest workload. This overrides only RULING-P99-95 §3's three-sample idle condition. Every credential, database, lock, port, harness, compile, baseRef, task-state, and human-gate safeguard remains mandatory.

## Risk accepted

Concurrent load previously stretched the same configured build from 27.4 seconds idle to a 719-second ceiling-kill. The operator accepts increased timeout/retry risk to avoid indefinite blocking by the neighboring run. This is not evidence that an infrastructure red is a product defect.

## Launch

Advance the clean engine worktree to this ruling tip. Run the engine-local `morning-start.sh` immediately, skipping only its external idle sampler. Require all internal fail-closed steps green and baseRef equal to the new engine-worktree HEAD.

After launch:

- arm contamination monitoring for load, foreign test-process attribution, and infrastructure failure fingerprints;
- on the first infrastructure-shaped gate red, capture process/load evidence and bring it to OVERSEER before retrying or discounting it;
- never discount semantic acceptance/review findings because load is high;
- never signal the neighboring run;
- P99-41 and every human/product/visual prompt remain operator-only.

Write the existing R95 launch record marker and supervise continuously. No other safety condition is waived.
