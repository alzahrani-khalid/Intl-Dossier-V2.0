# RULING-P99-85 — runtime candidate committed; release standalone reviewed verification

**Decision:** Accept the dead-writer repair and green real black box. Candidate commit `a0a1d3173` contains exactly the 16 approved runtime/config/plan paths. Release the standalone tickmarkr gate with review enabled. Do not compile or start Phase 99 yet.

## Evidence accepted

- The pre-fix live lease refused three times with nine attributed session members and two live port holders.
- The minimal expected-writer patch recovered that exact lease through product `--sweep`, exit 0, `startedWith:9`; no manual kill occurred.
- The corrected black box then passed 24/24: attributed lease, wrapper SIGKILL, live six-member orphan, wrong-birth refusal, product sweep first-attempt exit 0, exact zero, lease removal, ports restored, protected identities unchanged.
- The 10-test rendered leak spec produced the expected pre-engine RED baseline for pending Arabic tasks. It is not release green and is not misclassified as a harness failure.
- Commit `a0a1d3173` contains runtime, package, Playwright config, gitignore, and twelve Phase-99 plans only. Skill/guidance/spec/archive/operator paths remain uncommitted and outside this gate population.

## Required preflight

The orchestrator must, immediately before verification:

1. prove this repository has no `.tickmarkr/graph.lock` and no live `tickmarkr run|resume` process;
2. run `tickmarkr version`, read the repository's recorded version/fingerprint authority, and stop if the binary is stale on major.minor or the artifact differs from the pinned recipe;
3. verify HEAD is `a0a1d3173` or report `HEAD-MOVED` and re-pin the exact candidate commit;
4. verify ports 5173/5001 free, `.pw-leases` empty, preserved helper unchanged, foreign trio present, and evidence 8/8.

## Command

Run exactly, with review enabled:

```sh
tickmarkr verify --base 0413fa1af --criteria .tickmarkr/overseer/P99R-REAPER-CRITERIA.md
```

Do not add `--no-review`. Treat missing/unparseable verdicts as failure. Capture stdout, stderr, exit code, gate-by-gate results, review provider/model, the exact diff range, and the criteria hash.

Write `.tickmarkr/overseer/P99R-STANDALONE-VERIFY-HANDOFF.md` ending `ORCH-P99R-STANDALONE-END`, then stop for ruling.

No compile, `tickmarkr plan`, phase run, resume, approval, or additional source edit is released.
