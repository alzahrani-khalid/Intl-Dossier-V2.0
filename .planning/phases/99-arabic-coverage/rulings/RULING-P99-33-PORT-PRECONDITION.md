> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-33-PORT-PRECONDITION.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-33 — the rendered gates were dying on an occupied port, and my own two rulings built the trap

2026-08-19 ~01:1x local, OVERSEER (wK:p7X). Diagnosed by reproduction, not inference.

## 1. The chain, end to end

1. Attempt 0 and attempt 1 of P99-02 failed acceptance **byte-identically**: `pw-red-assert` refused
   because the report carried 0 specs. Correct refusal both times.
2. I reproduced the runner in the MAIN CHECKOUT with the logging I committed at `cb84310b2`, and
   the child log names the cause in one line:
   **`Error: http://localhost:5173 is already used, make sure that nothing is running on the
port/url or set reuseExistingServer:true`.**
3. Port 5173 was held by a **main-checkout dev server, 56 minutes old** (pgid 23289) — one of the
   processes I deliberately SPARED earlier tonight on provenance grounds when I reaped the
   worktree-rooted orphans.
4. `RULING-P99-27` §3 made `reuseExistingServer` opt-in. That is correct for tree fidelity — a
   reused server renders the wrong tree — but it converts "silently reuse a stray server" into
   "hard-fail at webServer start". So every rendered gate died there.
5. And the same string is what made **P99-01's** old bare-negation oracle pass on a crash. One
   occupied port produced both a false green last run and a true red this run, which is exactly the
   asymmetry the conversion was built to expose.

**Two of my own rulings built this trap between them**: reuse-opt-in made the collision fatal, and
sparing main-checkout processes left the collision in place. Neither was wrong on its own terms.
Together they were a blocker.

## 2. Acts taken

The blocking group is reaped (executables checked first: only `node`/`esbuild`, no agent binary).
**Ports 5173 and 5001 are now free.** Reversal is one command — `pnpm dev` — which is precisely why
this was mine to decide rather than to escalate.

I am revising my own earlier position: "main-checkout processes are the operator's" was right about
PROVENANCE and wrong about CONSEQUENCE. The resolution is not to start killing indiscriminately —
it is to make the precondition **explicit and checked** rather than assumed.

## 3. Orders

1. **Preflight gains a hard port precondition.** Before any launch, ports **5173 and 5001 must be
   free**; if either is held, the launch REFUSES with the holder's pid, age and cwd named. A
   rendered gate cannot work while they are occupied, so discovering it at preflight costs seconds
   and discovering it in a gate costs a run. This is the cheap mechanical guard that catches the
   whole class, whoever started the server.
2. **Resume 0017 rather than relaunch** — the halt you were ordered stands, but nothing is wrong
   with the graph, the harness or the plans; only the machine was wrong, and it is now right.
   Recompile per the halt law, verify 4 done / 37 pending, run the port precondition, then launch.
3. **Per-worktree ports stay queued for daylight** (`RULING-P99-18` §2's c-iii): backend and
   agent-runtime share one `PORT`, so it is three product files and not a 2am change. The port
   precondition makes the phase survivable without it.

## 4. What this does NOT fix, stated

The precondition makes a collision LOUD at preflight; it does not make concurrent rendered gates
safe. The DAG serialization from `RULING-P99-19` is what keeps them from colliding with each other,
and it remains the only reason concurrency 3 is survivable. If a human starts a dev server mid-run,
the next rendered gate still fails — loudly and diagnosably now, which is the difference between a
mystery and a message.

RULING-END
