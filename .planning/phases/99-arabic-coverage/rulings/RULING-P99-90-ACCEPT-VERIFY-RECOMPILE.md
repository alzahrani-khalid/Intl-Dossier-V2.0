# RULING-P99-90 — standalone gate accepted; release clean-worktree compile and plan

**Decision:** Accept the reviewed standalone gate. Seven gates passed on a 42,724-byte post-R9 delta with 16/16 candidate blob parity. Kimi `kimi-code/k3` is positively identified as the independent reviewer and approved. The acceptance judge identity is not load-bearing for reviewer independence; c1–c9 passed under the configured gate, and the absence of judge provider telemetry is recorded as an upstream observability gap, not a reason to repeat a green gate.

Release Phase-99 recompile and `tickmarkr plan` only. Do not start the engine run yet.

## 1. Verification disposition

Accepted evidence:

- fresh configured baseline under idle load;
- build, test-with-baseline-forgiveness, lint, evidence, scope, acceptance, and review all passed;
- real black-box crash/recovery executed inside acceptance;
- Kimi review approved with two intentional/deferred findings;
- synthetic tip's 16 blobs equal candidate commit `a0a1d3173` exactly;
- tickmarkr 1.97.0 bytes stable before/after.

The synthetic commits remain review instruments and never become baseRef.

No additional judge rerun. Removal condition for the observability gap: tickmarkr records acceptance judge adapter/model in verify output/artifacts.

## 2. Immutable harness pin

The new private pin is accepted:

- executable: `/Users/khalidalzahrani/.tickmarkr-pin-1.97/node_modules/.bin/tickmarkr`;
- version: `1.97.0`;
- dist content SHA-256 (relative paths + bytes): `6b1e0ede94251323d08ad1a9319e2a2c46e2d1ab1002dde7133cec9169cbb08b`;
- byte-identical by the same hash method to the stable global 1.97.0 install.

Every compile, plan, run, report, resume, approve, and daemon launch for the remainder of this milestone uses that absolute executable. Hash it before and after each engine engagement. The stale private 1.93 pin is retired for this 1.97 repository.

## 3. Clean engine worktree

Run engine commands from `.tickmarkr/engine-worktree.noindex` at the real milestone tip containing `a0a1d3173` and this ruling. The user's dirty checkout stays untouched.

In that worktree:

- install dependencies offline with frozen lockfile;
- copy exact `.tickmarkr/config.yaml` and live-probe `doctor.json` with the private 1.97 binary;
- verify clean git status, no lock/live run attributable to this engine worktree, Node floor, harness hash, and committed Phase-99 plans/summaries.

The worktree is the engine root. Its `.tickmarkr` state is authoritative for the new run. Do not reuse stale graph state from the user's checkout.

## 4. Compile and plan

Recompile Phase 99 from its committed GSD phase plans using the same source contract ruled in RULING-P99-48. Then run `tickmarkr plan`.

Verify mechanically:

- graph baseRef equals the engine-worktree tip;
- P99-01…P99-06 are compiler-done from committed summaries/ruling evidence;
- P99-07 is the first pending task;
- no task remains `running` from the dead prior daemon;
- six done tasks are not redispatched;
- routing, adapter/model assignments, dependency shape, and every human gate are recorded;
- all mandatory build/test/lint/evidence/scope gates remain declared.

Write `.tickmarkr/overseer/P99R-ENGINE-PLAN-R90.md` ending `ORCH-P99R-ENGINEPLAN-END`, including exact commands, harness hashes, graph hash/baseRef, task-state table, routing, human gates, and any compiler warning. Stop for OVERSEER routing ruling.

No `tickmarkr run`, daemon launch, resume, approval, source edit, or current-checkout cleanup is released.

## 5. Deferred documentation

Queue the stale 99-02/99-03 sentences for post-Phase-99 correction. They do not change executable gates and must not mutate the reviewed candidate before engine execution.
