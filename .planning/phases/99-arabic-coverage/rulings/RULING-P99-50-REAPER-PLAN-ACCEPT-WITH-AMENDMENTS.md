# RULING-P99-50 — reaper remediation plan accepted with amendments

**Decision:** Release the remediation to implementation under the amendments below. No Phase-99 compile or run is released. The orchestrator owns the visible implementation and verification seats; the OVERSEER retains commit and ship authority.

## Accepted design

- The source enumeration is authoritative: 10 executing rendered commands in nine pending plans. P99-20 is included. The three existing wrapper callers are in the permanently closed P99-01/02/03 tasks and are not edited.
- `scripts/pw-run-reaped.mjs` remains the single runtime convention. The root Playwright config invokes its lease writer; executing plan commands and root E2E scripts invoke its run mode.
- Ownership is a spawn-time nonce/lease, not port timing, cwd timing, PID order, or ancestry. Every safety census is tri-state and fails closed.
- Every signal round revalidates the complete birth/session/group/cwd/lease identity. No bare-PID SIGKILL is permitted.
- Cleanup refusal, unavailable instrumentation, or survivors must reach the actual command exit and withhold the JSON consumed by legacy red assertions.
- Pending plan command lines may be edited as source-spec repair. Recompile after the final commit; the graph must still show P99-01…06 done and P99-07 pending.
- P99-01/02/03 plans remain untouched. Their closure is final under RULING-P99-48.

## Amendment 1 — correct the seat identities and preserve reviewer independence

The plan misattributes the R1 safety review to Kimi. It was produced by **Codex `gpt-5.6-sol` in pane `w0:p5`**, as recorded in `seats.jsonl`. That seat found F1–F7 and must remain independent of implementation.

Use this topology:

1. **Implementer:** Kimi `kimi-code/k3`, fresh visible task tab, autonomous mode. It edits the approved files and writes an implementation report ending `REAPER-IMPL-END`. It does not commit.
2. **Independent verifier:** Grok `grok-4.6`, fresh visible `REVIEW p99r` pane, read-only; report ends `REAPER-VERIFY-END`.
3. **Finding-owner confirmation:** reuse the existing Codex R1 consultant pane `w0:p5` only after the diff is frozen. It confirms F1–F7 against the final blob/commit candidates and ends `REAPER-VERDICT-R2-END`.

Kimi may not review its own implementation. Codex may not implement the defects it must independently confirm. Three vendors, no role collapse.

## Amendment 2 — product-owned recovery, not operator-overlay dependence

The tracked wrapper's run mode must sweep orphan leases for its canonical root **before spawning** and skip a live matching wrapper identity. That makes crash recovery part of the product path every Phase-99 and root-script caller executes.

Do not count edits to `.tickmarkr/overseer/launch-daemon.sh` or `.tickmarkr/config.yaml` as the fix; they reach one operator only. They may call the shipped `--sweep` as redundant operational defense after the product implementation passes, but Phase-99 readiness must not depend on those overlays.

## Amendment 3 — frontend configuration is deferred only with a real owner

`frontend/playwright.config.ts` is not widened into this Phase-99 repair. The same defect is now tracked as **CARRY-10**, owned by Phase 101, in both `REQUIREMENTS.md` and `ROADMAP.md`. Phase 101 cannot close until root and frontend configurations both prove zero attributed session/descriptor growth across normal, interrupted, and cleanup-refusal paths.

This is a queued ship decision, not an audit note. Removal condition: CARRY-10 passes its two-config regression proof.

## Amendment 4 — behavioral acceptance, not source-text absence

The draft standalone criteria containing `grep` assertions for `?? []`, `SIGKILL`, `SIGHUP`, `lease-exec`, or `.pw-leases/` are rejected as acceptance criteria. They prove bytes, not behavior, and absence greps are the defect class this phase is repairing.

The criteria file must instead require:

- the complete dependency-injected T1–T15 table with mutation and control results;
- the isolated real-process D1–D9 drill with no residual plant or temp artifact;
- a bounded real rendered worktree run with lease contents, pre/post session census, same-root bystander survival, and zero survivors;
- command-exit composition for clean, refused, unavailable, survivors, and stale-report cases;
- the root config loading and routing all 10 pending plan invocations through the sanctioned wrapper;
- build, lint, evidence, scope, acceptance judge, and cross-vendor review from `tickmarkr verify --base 0413fa1af --criteria <file>` without `--no-review`.

Every criterion must cite a changed hunk and state what it does not establish. Positive controls are inside the executable test, not prose beside a grep.

## Amendment 5 — file size decision

The production runtime remains one wrapper. If `scripts/pw-run-reaped.mjs` would exceed 800 lines, split only the drill/test harness into `scripts/pw-run-reaped.selftest.mjs`, importing the production exports. This is not a second runtime convention. The implementer must state the final line counts and why the split did or did not trigger.

## Commit and verification boundary

Approved tracked surface:

- `scripts/pw-run-reaped.mjs`;
- optional `scripts/pw-run-reaped.selftest.mjs` under Amendment 5;
- `playwright.config.ts`, `.gitignore`, root `package.json`;
- pending plan files 99-08, 10, 12, 19, 20, 21, 24, 40, 41;
- one tracked criteria artifact if required by `tickmarkr verify`.

No other source path is authorized without a new evidence file and ruling. The existing generated skill/scaffold/archive dirt remains untouched.

## Gates before OVERSEER commit

- Implementer artifact complete and writer exited.
- Final diff frozen by blob SHA.
- Grok verifier and original Codex finding-owner reports both complete on that same frozen diff.
- All material findings repaired and re-confirmed; no self-approval.
- Behavioral criteria and standalone tickmarkr gate pass.
- One bounded real run proves target cleanup and bystander survival.

Only then may the OVERSEER decide to commit. No compile/run release is implied.
