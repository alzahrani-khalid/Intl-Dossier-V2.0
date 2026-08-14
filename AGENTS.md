<!-- tickmarkr:agent-docs begin -->

## tickmarkr

tickmarkr compiles repository specs into isolated, independently verified agent work.

### Invariants

- Never run two tickmarkr runs in the same repository concurrently.
- Never let tickmarkr merge work to main; new runs consolidate on `tickmarkr/<runId>`.
- Do not edit compiled graphs to force outcomes; fix source specs and recompile.
- Gates verify commits, diffs, acceptance criteria, and reviews independently — never trust a worker's completion claim.
- Treat missing or unparseable machine results and verdicts as failures.

### Commands

- `tickmarkr compile <spec>` — spec → RunGraph
- `tickmarkr plan` — routing table and human gates
- `tickmarkr run` — execute the graph
- `tickmarkr status <runId>` — run progress
- `tickmarkr resume <runId>` — continue a paused or failed run
- `tickmarkr approve <runId> <taskId>` — release a human gate
- `tickmarkr report <runId> --md` — execution record beside the spec
- `tickmarkr verify --base <ref>` — run the gate battery standalone against merge-base(base, HEAD)..HEAD: no daemon, no retries, one fail-closed verdict (`--criteria <file>` or `--task <id>` adds the semantic gates; `--no-review` for deterministic-only)

Loop: compile → plan → run → report. Watch the journal for run-end rather than polling workers.

### Role check (multi-agent environments)

- **Orchestrator:** run the loop in your session; do not start a second run.
- **Supervisor with a live orchestrator:** relay the mission via verified handoff (below), then supervise — do not duplicate the loop.
- **Primary session without an orchestrator:** spawn one child orchestration session, give it the mission and these rules, then supervise.

Outside multi-agent environments, run the loop directly.

### Version preflight

Before `tickmarkr compile` or `tickmarkr run`: run `tickmarkr version`, read `package.json` version, and if the binary is older on major.minor, stop and tell the operator to update. Never proceed on hope — stale binaries silently skip daemon gates. Also verify no run is live before starting one: `pgrep -f "tickmarkr (run|resume)"` must be empty — match the process, not one install path (`dist/cli/index.js` alone misses global and homebrew installs), and treat a held `.tickmarkr/graph.lock` as a live run until its holder pid is proven dead.

### Tip-verify-before-green

A run is green only when the run-end event exists in the journal AND tip verify is not "failed". Never report green to the operator, tab titles, or records until both hold.

### Verified handoffs

When relaying missions between agents, never use bare send-text (`herdr agent send` / pane send-text) — it omits Enter. Use `herdr pane run <pane> "<message>"` or `herdr notification show "<message>"`. Confirm delivery by reading the target pane afterward; never report "relayed" without read-back.

### Orient before you act — this block may be the ONLY guidance your host loaded

These same bytes are written into EVERY repository guidance file this project has, because hosts disagree
about which one they read: some load only `AGENTS.md`, some also load a repo-level guidance file, some load
a user-level one instead. **Anything stated in only one file is invisible to some agent.** So do not assume
you were handed the whole picture — list the repository root, open every guidance file present, and then:

- **Read your host's PROJECT MEMORY before starting.** Hosts that keep one store it under a per-project
  state directory keyed by the absolute working-directory path; find it and read its index plus every entry
  whose name concerns METHOD or DISCIPLINE. It holds rules that cost real defects to learn. Entries may
  predate a project rename, so **search by CONCEPT, not by the current product name.** A memory nobody opens
  is worse than none: every seat assumes the lesson is recorded somewhere and no seat looks.
- **The gates are the product.** Seven, defined in `src/graph/schema.ts`:
  `build test lint evidence scope acceptance review`. **That is DECLARATION order, not execution order** —
  the first five run as a battery that stops at its first red, then `acceptance` and `review` run
  CONCURRENTLY (`run-gates.ts:39`, _"judge ‖ review"_). The first five are MANDATORY; only `acceptance` and
  `review` may be omitted per task. Implementations are in `src/gates/` — `baseline.ts` (build/test/lint,
  diffed against a recorded baseline so pre-existing failures are forgiven), `evidence.ts`, `scope.ts`,
  `acceptance.ts` (its judge reads the DIFF and every criterion must cite a changed hunk), `review.ts`
  (cross-vendor). `run-gates.ts` drives them. **A declared gate is not a passed gate, and a gate that
  returned zero findings is not the same as a gate that ran.**
- **Spec-authoring law ships in the spec template** that `tickmarkr init` writes: the hard bounds and which
  direction each moves, what makes a criterion real, and why an absence or a source-text grep is never a
  criterion. Read it before authoring or repairing acceptance items.
- **Editing `src/gates/`, `src/compile/` or `src/graph/`?** Read `docs/codebase/ARCHITECTURE.md` first.
- **EVERY fix gets a ship/no-ship decision, recorded, at the moment it is made.** Ask one question of each
one: _does a user hit this defect?_ If yes, the fix belongs in `src/**` or `skills/**` — the only trees
the package carries (`files: [dist, schema, skills, fixtures]`). A script, overlay, config entry or
operator-side workaround that resolves the symptom **locally is not the fix; it is a decision to leave
every other user broken**, and it must say so in writing and name the condition that removes it.
**The default answer is SHIP.** A local remedy is the exception and carries the burden of proof.
Watch for the three shapes this hides in: a fix applied where you happened to be standing rather than
where the defect lives; an observation filed with a product fix named in its own text and queued
nowhere; and a local tool that quietly grows into a product feature nobody shipped. **A defect and its
fix must be recorded in the same place, or the queue silently becomes a list of things everyone assumed
someone else had shipped.**
<!-- tickmarkr:agent-docs end -->
