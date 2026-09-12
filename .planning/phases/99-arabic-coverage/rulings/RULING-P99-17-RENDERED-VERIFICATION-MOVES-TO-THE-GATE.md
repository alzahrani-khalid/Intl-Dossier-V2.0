> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-17-RENDERED-VERIFICATION-MOVES-TO-THE-GATE.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-17 — rendered verification moves to the GATE layer; the worker sandbox stays

2026-08-18, OVERSEER (wK:p7X). Input: `P99-INFRA-OPTIONS-01.md` (OPTIONS-END) — the best
diagnosis this mission has produced. It found two defects I did not have, and its §3 masking
sentence reframed my own ruling correctly.

## 0. The premise I verified before ruling on it

`a2` rests on "the gate layer can do what the worker cannot", so I tested the other half from my
seat: **P99-01's acceptance carries the rendered requirement in PROSE criteria (items 0-4), judged
from the worker's narrative evidence; its ONE command oracle is a static file/grep check with no
`playwright` in it.** So the gate never attempted a rendered run — §4's measurement (bind OK,
HTTP 302, doppler OK, cwd = worktree) is unchallenged, and the failure was exactly a sandboxed
worker unable to produce evidence a prose criterion demanded.

## 1. ADOPTED — a2. Acceptance semantics, ruled (brief rule 4, my call)

**"Observed RED / GREEN on a rendered surface" is satisfied by the ACCEPTANCE GATE executing the
spec in the worker's own worktree — not by the worker executing it.** The rendered requirements
stop being prose judged from a worker's account and become TYPED `command:` oracles.

This is not a concession, it is stronger: a gate-run spec is machine-verified in the post-diff
tree, where a prose criterion was an LLM reading a narrative — the exact upgrade `A-05` asked for.
Cost, stated: the worker iterates blind on rendered checks and will need more gate cycles. Accepted.

## 2. REFUSED — a1, and (d) is not a defect to fix

The worker sandbox stays. Refusing a1 costs us nothing we need and buys the thing that saved this
run: **(d) masking (b) is the only reason run 0011 produced an honest red instead of a silent
false green.** A relaxation would grant 41 workers network for the phase, by an upstream package
edit, to enable a capability the gate already has. The sandbox is a FEATURE in this architecture —
record it as such.

## 3. ADOPTED with modification — b1, and REFUSED b2

`reuseExistingServer` becomes **false by default**, with an explicit `PW_REUSE=1` opt-in so a human
running the suite against their own dev server keeps that workflow. Reuse then requires an
intention, which is the correct shape for a footgun that renders the wrong tree. b2 (`CI=1`) is
refused on the orchestrator's own finding: it silently flips retries 0→2, workers, `forbidOnly` and
the reporter — **a retried rendered oracle is a different instrument than the plans specify.**
b3 is already done: I reaped the stale stack, so today's instance is gone; b1 closes the class.

## 4. ADOPTED — c1, per-worktree deterministic port

Derived port inside a worktree, **defaulting to 5173 outside one** so every human and existing
spec workflow is unchanged. With b1 a collision fails loud instead of cross-rendering. c2
(serialize) is refused as the primary: there is no per-task concurrency knob, so it means a
separate pass, and it scales badly across the rendered lanes.

## 5. ADOPTED — e1, and NO operator credential act is required

`.env.test` already exists in the main checkout. The daemon is launched with it sourced into the
environment (`set -a; . .env.test; set +a; tickmarkr run`), because `dotenv.config` only populates
`process.env` — an absent file is harmless when the values are already set. **No secret enters the
repo, nothing is created, nothing is printed.** `storageState` is regenerated per-worktree by the
`setup` project, which now works because the gate layer has credentials and network. Committing
either file remains refused.

## 6. Execution, in order

1. **Orchestrator:** convert the rendered PROSE criteria to typed `command:` oracles across the
   rendered lanes — one spec path per invocation (D-09), file-existence assert + hardcoded test
   count, `R="$PWD"` anchoring, and the settle law intact. Report the population BEFORE editing.
2. **Orchestrator:** fix the watcher defect from §7.1 first — capture the lock's pid at ARM time
   and check that pid directly; a vanished lock plus a dead pid is RUN-OVER, not "keep waiting".
   Both watchers failed OPEN through the very halt they watched. **Blocking on relaunch:** I will
   not release a run supervised by a watcher that cannot see its end. Re-drill both polarities.
3. **Me:** the two `playwright.config.ts` edits (b1 + c1), committed with defaults that preserve
   human workflows, plus the plan edits from step 1, in one commit before relaunch.
4. **Orchestrator:** recompile (CLI, quoted), re-verify bounds/coverage/lints, preflight, arm the
   fixed watchers + tripwire on the new runId, launch with the daemon environment carrying
   `.env.test`.

## 7. Credit, recorded

The orchestrator ran the guard BEFORE signalling (checking pgid disjointness so a group TERM could
not reach the operator's server), left pid 98955 untouched as ordered, and disclosed a defect in
its own watchers that made them silent through the halt — the fail-closed law broken by its own
enforcer, found and reported by the seat that owned it. That is the standard.

## 8. Upstream seed (filed with this ruling)

The worker/gate CAPABILITY ASYMMETRY is undocumented and invisible until it fails: workers run
`--sandbox workspace-write` (hardcoded in `adapters/codex.js`, not config-reachable) and can
neither bind a port nor reach the network, while acceptance oracles run unsandboxed in the same
worktree. Any rendered/e2e criterion phrased as "the worker observed X" is therefore
**unsatisfiable at the worker layer, silently**, and the failure surfaces as a judge rejection
that reads like a work defect. Asks: document the asymmetry where criteria are authored; expose
the adapter's sandbox flags in config; and consider a compile-time warning when a task's own
acceptance text asks the worker to run a server.

RULING-END
