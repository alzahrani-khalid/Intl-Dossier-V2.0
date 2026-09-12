# RULING-P99-104 — Run 0044 SIGTERM recovery

## Incident disposition

Run `run-20260826-175349-0000000000000044` is incomplete. Its journal records a deliberate
`SIGTERM` exit cause and no `run-end`; therefore the run is not green and must never be resumed or
reported as complete. The post-TERM compiled status is not execution evidence.

The accepted predecessor work is preserved. Journal gate and merge facts establish that P99-45,
P99-46, and P99-47 each passed all seven gates and merged in dependency order:

- P99-45 merged as `71b272519d8960116f146a70936a244863eabd8f`;
- P99-46 merged as `6cfe9e42e93a25e3df5cd75d0289f9f84293ec26`;
- P99-47 merged as `a661f02928b259aada2895fe2577e982d7dad725`.

No P99-31 through P99-38 worker dispatched. P99-30 dispatched only after all three predecessors
merged, so the RULING-P99-103 barrier held. The milestone is fast-forwarded to the accepted
integration at `a661f0292`; these three tasks are banked and must not be reopened.

## P99-30 remains pending

P99-30 did not pass its gate battery. Attempt 0 died before producing an accepted result. Attempt 1
produced candidate commit `514ccbad73eb627a3b6c1393ae3c531138281d03`, whose sole diff is a new
`99-30-SUMMARY.md`, but only the build gate passed before SIGTERM interrupted the test gate. The
candidate is therefore unaccepted and must never be merged directly or treated as completion.

A fresh isolated P99-30 worker may cherry-pick `514ccbad7` as candidate evidence only. After any
cherry-pick it must rerun all four P99-30 instruments against the fresh accepted base, update and
recommit the canonical summary if the evidence remains true, and pass all seven gates. Missing,
stale, or unparseable evidence fails closed. The acceptance commands, acceptance prose, goal,
write scope, and seven-gate requirement are unchanged.

Before the fresh run, compilation is acceptable only if the compiled graph shows:

- exactly 35 banked tasks `done` (the prior 32 plus P99-45, P99-46, and P99-47);
- P99-30 `pending`, with dependencies exactly `[P99-45, P99-46, P99-47]`, empty compiled
  evidence, and sole write scope `99-30-SUMMARY.md`;
- READY exactly `[P99-30]`;
- P99-31 through P99-38 still blocked directly behind P99-30;
- all 47 tasks carrying all seven declared gates with no exception; and
- `514ccbad7` remaining a non-ancestor of the fresh base.

No compiled graph may be edited to obtain this state.

## Relaunch and supervision boundary

Recompile and plan from the accepted milestone, then start a new run. Do not resume run 0044. The
new daemon must be launched in a session detached from the orchestrator shell. Before reporting it
live, prove the daemon has `ppid=1`, is its own process-group leader (`pgid == pid`), and has a
session-leader process state such as `Ss`. A shell-owned background child is not acceptable.

Run-scoped journal and daemon-liveness watchers must be freshly armed and side-effect verified.
The repository heartbeat must remain independently live. Process `22555` predates run 0044, has
the main repository backend as its cwd, and is outside run ownership; do not reap it.

The execution record `P99-AR04-PREDECESSORS-EXECUTION-R3.md` may record this incident, but it must
remain open and must not receive its terminal `ORCH-AR04-END` marker until a genuine `run-end` or a
human/failed park occurs.
