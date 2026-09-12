> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-35-WEBSERVER-ESCAPES-THE-GROUP.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-35 — my group-reap cannot reach Playwright's webServer, and the run collided with itself

2026-08-19 ~01:0x local, OVERSEER (wK:p7X). The logging I committed did its job: this failure
explained itself in two lines instead of costing another run to guess at.

## 1. What the log said, and what it means

The worktree's `.p99-red-dates.json.log`:

```
◇ injected env (0) from .env.test
Error: http://localhost:5173 is already used … or set reuseExistingServer:true
```

Same string as before — but this time nothing external held the port. **The run collided with
itself.** The daemon's baseline vacuous-oracle probe ran P99-02's rendered oracle in the MAIN
CHECKOUT, that oracle started the dev stack, and the stack was still holding 5173 and 5001 thirteen
minutes later when the task's own gate tried to start its webServer in the worktree.

## 2. Why the reaper missed it — mechanism, measured

The leaked stack's group leader (32065) had **`ppid = 1` and its own process group**, distinct from
the group `pw-run-reaped` created. Playwright starts its `webServer` in a SEPARATE process group so
that it can manage it; when Playwright exits without tearing it down, that group is orphaned to
init. **A reap of the group we created therefore cannot reach it, by construction.**

So `RULING-P99-28` §4.1 — "kill the process GROUP, a gate that starts a server owns stopping it" —
was right in intent and structurally incomplete in mechanism. It reaps our group. The server is not
in our group. That is the fifth time tonight one of my rulings was correct on its own terms and
left the failure somewhere I was not looking, and the pattern is now the finding: **I keep
specifying WHAT to do and not verifying that the mechanism can reach the thing.**

## 3. Acts

Both orphaned groups reaped after checking their executables (only `node`/`esbuild`); 5173 and 5001
are free. The task's failed attempt is not lost work — its worker completed and its deterministic
gates passed.

## 4. Orders

1. **Extend `pw-run-reaped` to reap by PORT after its child exits**, in addition to reaping its own
   group: for each of the stack's ports, find the listener, walk to its process group, and reap it
   — only when the process is rooted in this repository, and printing what it reaped. The port is
   the one handle that reaches a server which deliberately escaped our group.
2. **Drill it two-sided, and drill the ESCAPE specifically**: plant a dev stack via a real
   Playwright `webServer` start, confirm the reap reaches it (the case that failed tonight), and
   confirm a clean exit reaps nothing and reports so.
3. **The port precondition now also runs BETWEEN the baseline probe and the first dispatch** — the
   baseline probe is a gate execution like any other and leaks like one; the precondition that
   protects the launch must protect the transition too.
4. Then re-dispatch P99-02. The graph, harness and plans remain untouched and correct.

## 5. Upstream seed

The engine's own baseline probe executes gate commands, so it leaks whatever they leak — and it
runs in the MAIN CHECKOUT while the tasks it precedes run in worktrees, so its leftovers collide
with the very tasks it was measuring for. Ask: reap gate-spawned process groups after the baseline
probe as well as after a run, or document that a baseline probe has the same teardown obligations
as a gate.

RULING-END
