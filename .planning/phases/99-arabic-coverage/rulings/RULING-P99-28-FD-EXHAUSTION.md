> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-28-FD-EXHAUSTION.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-28 — the unparseable consult was fd exhaustion, and the fd exhaustion is my gate-layer move leaking dev servers

2026-08-19 ~03:0x local, OVERSEER (wK:p7X). Run 0016 parked P99-02 (`kind: stall`) and ended.

## 1. The chain, each link measured

1. **The consult did not return a verdict — it CRASHED.** `consults/P99-02-1-response.txt` is a
   crash dump: `Error: EMFILE: too many open files, watch` from a `FSWatcher`, three times, then an
   unhandled `error` event. The parser was handed a stack trace, so "unparseable" is literally true
   and the engine failed safe to human. **This is not the recorded pane-scraping cause** —
   `visibility.llm` is `headless`, correctly, with its own history in the config comments.
2. **The worker in the same task had already stalled** — `no completion marker within 30m`,
   `cause: stall-timeout`, no `TICKMARKR_RESULT` trailer. Same resource pressure, earlier symptom.
3. **Five orphaned dev-server process groups were holding ~28,000 file descriptors** — 5,570 to
   5,589 each. Their cwds name their origin exactly: three inside
   `worktrees.noindex/…-0000000000000015--P99-01/backend`, `…--P99-02/backend`,
   `…--P99-01/agent-runtime`, plus two in the main checkout (one **two days old**).
4. **They exist because of MY RULING.** `RULING-P99-17` moved rendered verification into the
   acceptance gate; the gate runs Playwright; Playwright's `webServer` is `pnpm dev`, which starts
   the **whole stack** in the worktree. When a run ends — and every run tonight ended by park or
   halt — nothing reaps them. Each run therefore leaves a dev stack behind, and they accumulate
   across runs until a new process cannot open a file.

**So the fix that made rendered verification possible is also what made the consults crash.** That
is the honest shape of it, and it is the second time tonight one of my rulings created the next
defect (the first: c5 left unconverted by the same ruling).

## 2. Reaped — 28,000 descriptors recovered

Six process groups TERMed by PID from a parse, after proving no agent or engine binary was inside
any of them. **My first safety check was wrong and I caught it before acting:** grepping the group
listings for `tickmarkr|codex|claude|kimi|grok` matched the string _inside worktree paths_, not any
real process — the matcher-too-broad class, inside the very check meant to protect the run. Redone
on executable basenames: only `node` and `esbuild`. All six groups gone, zero survivors, top fd
holder now **520** where it was 5,589.

## 3. What I am NOT claiming

That the orphans were provably sufficient to cause the EMFILE. Per-process limits here are enormous
(`kern.maxfilesperproc` 245760) and the crashed process died at a far lower count, which suggests
the consult's own inherited soft limit mattered too — and that is **unmeasured**, because the
process is gone. The pressure is removed and the candidate is strong; the mechanism is not proven.

## 4. Orders

1. **Teardown, in the oracle.** Every rendered oracle wraps its Playwright invocation so the
   `webServer` stack is reaped when the command exits, on the failure path as much as the success
   path — kill the process GROUP, by PID from a parse, never by name pattern. A gate that starts a
   server owns stopping it; relying on Playwright's own teardown has now failed observably across
   four runs.
2. **Headroom, at launch.** Launch the daemon with an explicit `ulimit -n` raise so its children
   inherit headroom regardless of what the launching shell happened to carry, and REPORT the value
   the daemon actually got — derived from the running process, not from the shell that spawned it.
3. **Sweep before every launch.** Add the orphan check to preflight: any `pnpm dev` / vite / tsx
   process rooted in `worktrees.noindex` is a leftover by definition once no run is live, and gets
   reaped before the next run starts.
4. Then recompile, battery, relaunch detached, re-arm.

## 5. Upstream seed

The engine starts long-lived processes on the gate's behalf (a Playwright `webServer` is one) and
has no lifecycle for them: when a run ends parked or halted, whatever the gate spawned keeps
running, holding descriptors and ports, and the NEXT run inherits a machine that is quietly worse.
Ask: reap the gate command's process group at run end, or document that gate commands own their own
teardown and that failure-path teardown is theirs too.

RULING-END
