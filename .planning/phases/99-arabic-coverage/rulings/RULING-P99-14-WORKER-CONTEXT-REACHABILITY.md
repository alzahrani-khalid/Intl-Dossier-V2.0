> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-14-WORKER-CONTEXT-REACHABILITY.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-14 — worker context reachability: commit the phase set, repoint the gitignored refs, then launch

2026-08-18, OVERSEER (wK:p7X). Input: `P99-URGENT-WORKER-CONTEXT-UNREACHABLE.md` (URGENT-END).
The finding is CONFIRMED and the launch hold was correct.

## 1. Verified from this seat, and the class is WIDER than reported

Phase 99 is the only phase dir untracked (`git ls-tree HEAD .planning/phases/` ends at 98;
`git status` shows `?? .planning/phases/99-arabic-coverage/`), 48 files / 844 KB. Worktrees come
from `baseRef`, so untracked = absent, exactly as the two-sided probe with its tracked-file
positive control showed.

I then ran the class instead of the instance — every distinct context ref in the compiled graph
(73) classified by reachability:

| class                           | n     | disposition                                                                                                                                                                                                                                    |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRACKED in HEAD                 | 21    | fine                                                                                                                                                                                                                                           |
| FIXED-BY-COMMIT (the phase dir) | 43    | my commit, below                                                                                                                                                                                                                               |
| MISSING-ON-DISK                 | 6     | CORRECT BY DESIGN — wave-1 outputs (`99-ar02-dates.spec.ts`, `i18n-audit-strict.mjs`, `glossary-census.mjs`, `glossary-senses.json`, `nav-title-agreement.mjs`, `99-ar03-leak.spec.ts`) consumed by downstream tasks that build on merged work |
| **UNREACHABLE**                 | **3** | `.tickmarkr/overseer/RULING-P99-05 / -06 / -07`, cited by **17 tasks** — a GITIGNORED tree; no commit can carry them                                                                                                                           |

The second class was invisible to the reported finding and would have survived the proposed fix:
17 tasks would still have been dispatched with a dangling "read this first". Fixing the instance
would have shipped the class.

## 2. Acceptance-semantics call (brief rule 4), ruled: workers get their context

Launching blind is defensible on precedent (P99-01 passed review that way) and I refuse it. The
documents carry the ⚠ nested-common INVERSION warning, the 39 D-NN decisions, and each task's
method, on a milestone whose signature failure is a correct computation over the wrong set.
Criteria-only workers on THIS phase is the risk this mission exists to refuse.

## 3. Acts executed by me now (my column)

- The three cited rulings are COPIED into `.planning/phases/99-arabic-coverage/rulings/`, each
  with a provenance header naming the `.tickmarkr` original as authoritative. A ruling a worker
  must read belongs where workers can reach it — the project's own convention puts durable
  records in `.planning/`, and `.tickmarkr/` reaches nobody (skill rule 27).
- `ROADMAP.md` Phase 99 `Plans:` line CORRECTED, 25 → 41, with the correction stated in place:
  I froze it at leg-1 acceptance and my own `RULING-P99-09` re-cut then moved it. My rule, broken
  by me, recorded rather than quietly overwritten.

## 4. Orchestrator, before I commit

Repoint the 17 refs from `.tickmarkr/overseer/RULING-P99-0{5,6,7}-*.md` to
`.planning/phases/99-arabic-coverage/rulings/<same filename>`. Mechanical, three substitutions;
pre-derive the population read-only and report it (expect 17 refs across 17 plans: P99-07, -22,
-23, -24, -25 to -29, -31 to -38). Then RECOMPILE (CLI, exit code quoted) and re-verify: 41
tasks, bounds intact, 1 human gate, 0 pre-done, coverage, and — the point of the exercise —
**re-run `tickmarkr plan` and confirm the `context window lints:` section no longer reports
`payload unreadable` for any task.** That lint is the instrument that found this; it is also the
instrument that proves the fix, and it must go quiet for the right reason (refs resolvable in the
base tree), which you verify by naming what it says now.

## 5. Then me, then you

I commit `.planning/phases/99-arabic-coverage/` (plans + rulings copies) and my record
corrections (`REQUIREMENTS.md`, `ROADMAP.md`, `98-CLOSING-DERIVATION.md`) — pathspec-limited,
never a bare add; the exogenous dirty set (`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`,
`.agents/skills/*`, `.claude/skills/*`, `_archive-98-attempt1-260818/`) stays untouched and I
verify that in the same act. Then you re-run the §7 launch conditions (they were GREEN; the
commit moves HEAD, so re-quote preflight + version bracket), arm the tripwire bound to the new
runId, and LAUNCH.

## 6. Upstream seed (filed with this ruling)

The `payload unreadable` lint is correct and well-worded but ADVISORY — a run dispatches 41
workers whose "read these first" list is unreachable, and only an operator reading plan output
catches it. Ask: make an unreadable CONTEXT ref (as distinct from an unmeasurable glob) a
compile-time error or a run-start refusal; and note that gitignored context refs can never be
satisfied, which the compiler can detect with `git check-ignore` at compile time.

RULING-END
