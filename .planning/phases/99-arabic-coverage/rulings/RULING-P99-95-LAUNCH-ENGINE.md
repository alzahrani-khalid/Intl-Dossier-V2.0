# RULING-P99-95 — accept engine plan and launch Phase 99 from the clean worktree

**Decision:** Accept graph `2fad715c27e5` and routing. Release Phase-99 engine launch from the clean engine worktree, using an updated full `morning-start.sh` and the private 1.97 pin. Human gate P99-41 remains blocked for the operator.

## 1. Accepted plan

- 41 contiguous tasks P99-01…P99-41;
- states: exactly P99-01…06 done, 35 pending, zero running;
- P99-07 first and only dispatchable pending task;
- all mandatory seven gates declared on every task;
- 41 workers pinned to `codex:gpt-5.6-sol`;
- acceptance judge Grok and review Kimi remain role-separated by config;
- one human gate: terminal task P99-41;
- dependency DAG: 108 edges, depth 23.

The six done tasks are not redispatched because graph status is authoritative. BaseRef must be checked at launch, when it becomes observable.

## 2. Update the full launch wrapper in engine-local ignored state

Copy `morning-start.sh`, `launch-daemon.sh`, and `preflight-live-run.py` into the engine worktree's `.tickmarkr/overseer/`. Edit only those engine-local copies:

- repository root = `.tickmarkr/engine-worktree.noindex` absolute path;
- harness = `/Users/khalidalzahrani/.tickmarkr-pin-1.97/node_modules/tickmarkr`;
- source credentials from the user's existing checkout `.env.test` without copying or printing secret values;
- compile assertion = P99-01…06 done, P99-07 first pending, zero running;
- daemon launch = private 1.97 executable;
- baseRef check = engine-worktree HEAD.

Retain all original fail-closed steps: credential presence and DB reachability/constraint, lock authority, ports, harness fingerprint, compile-at-HEAD, detached daemon launch, lock/journal wait, and baseRef equality. Syntax-check and dry-run every non-launch precondition before use.

Record the reproducible pin fingerprint as `5e3ca53fd2ceb21586a2174a55242aa2c9af41101fd3a196bb728ec8637315c8`, the method the orchestrator reproduced before/after four compile engagements. The earlier `6b1e0e…` string is retired because its method was not recorded reproducibly; both methods established byte parity, but only one can guard drift operationally.

## 3. Load and launch precondition

Do not launch while a foreign build/test workload is active. Require no foreign `npm test`, `turbo`, or `vitest` process and load1 ≤18 for three consecutive 30-second samples. A foreign idle daemon may remain; attribute by cwd and never signal it.

Then run the updated engine-local `morning-start.sh` in full. Do not bypass a credential, database, port, pin, compile, or baseRef failure.

## 4. Immediate verification and supervision

After launch require:

- graph lock present with live holder pid;
- journal `run-start` baseRef exactly equals engine-worktree HEAD;
- P99-07 dispatches; P99-01…06 do not;
- daemon-placed watch board exists beside ORCH;
- journal/run-end, task-human, task-failed, consult-verdict, daemon-liveness, contamination, pending-input, blocked-state, and context watchers armed with conventional beat files in the engine worktree;
- current tab label updated to `ORCH · P99 6/41` and then on every task completion.

Write `.tickmarkr/overseer/P99R-LAUNCH-R95.md` ending `ORCH-P99R-LAUNCH-END` once the first worker is visibly running and all watcher tiers are verified. Then supervise the engine. Do not stop at the handoff; continue until a ruling/human gate/run-end requires OVERSEER action.

## 5. Human and release boundaries

Never auto-answer P99-41 or any credential/product/visual prompt. No Phase 100 planning starts until Phase 99 has run-end, tip verify not failed, final 10+8 rendered battery green, and OVERSEER close ruling.
