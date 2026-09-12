# RULING-P99-56 — fourth bounded reaper repair

**Decision:** Accept the final static-review residuals. The candidate remains uncommitted. Release one repair pass with the bounded surface below. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## Required repairs

### 1. Lease identity is structurally valid and filename-bound

- Validate `lstart` and `wrapperStart` in the forced-C `ps lstart` format before either carries authority; non-empty malformed strings are invalid, not wildcards.
- Require every lease field. Use valid-hex nonces in every regression so the asserted branch is actually reached.
- Bind `lease.nonce` to the lease filename and the wrapper-requested nonce.
- Re-read the lease from disk and revalidate nonce/root/full writer tuple immediately before every TERM/KILL round and before consume/unlink. Replacement or mutation refuses, signals nothing further, retains evidence, and exits non-zero.

### 2. Spawn-time port census remains explicit tri-state

Keep the R3 explicit loop. Add a direct `runMode` regression where the same port lookup is unavailable before and after: spawn count zero, final report absent, non-zero exit. No `null` may enter `portsBefore`.

### 3. Command composition, not post-failure deletion, owns legacy safety

All executing Phase-99 callers already use `&&`. Amend the three permanently closed wrapper command records P99-01/02/03 from `;` composition to `&&` composition without reopening their done status. This is a safety correction to dead plan text, not worker re-execution.

The runtime still uses a private pending JSON path and publishes only on clean cleanup. If an unrelated final report appears after preflight, quarantine it by atomic rename to a foreign-evidence path when possible and return non-zero. Preserve evidence; do not delete a foreign writer's bytes. The command chain must remain non-zero even if quarantine fails. Tests must exercise the real command composition with a valid foreign final report present.

### 4. T11 owns dummy identity out of band

The outer test parent creates and retains the detached dummy identity directly, or receives it through an independent IPC/temp-file channel that does not depend on stdout flush. The parent owns wrapper and dummy in one unconditional `finally`. Death checks are tri-state: unavailable is failure, not “dead.” Cover ordinary early exit, pre-handler throw, timeout, assertion throw, and normal exit.

### 5. Imported runtime is never promoted to CLI by ambiguity

`isCliEntry` returns true only on positive canonical identity equality. Missing or unresolvable `argv[1]` is treated as imported/false and performs no CLI action. Canonical, `/var` alias, and symlink CLI paths still execute. Add an imported-module regression with missing and unresolvable argv proving no usage/exit side effect.

### 6. Use the full-path Playwright JSON output variable

Set `PLAYWRIGHT_JSON_OUTPUT_FILE` to the private pending path. Do not rely on `PLAYWRIGHT_JSON_OUTPUT_NAME` accepting an absolute path. Static and executable config probes must show the reporter resolves exactly the pending file.

## Tests

Add causal regressions for malformed starts, filename/body nonce mismatch, lease replacement mid-round, full tuple mutation, identical pre/post port unavailability, foreign final report with real legacy `&&` tail, unflushed dummy identity, ambiguous imported argv, and the full-path reporter variable.

Re-run the four-locale matrix, canonical/alias/symlink bootstrap matrix, zero-residue checks, and real command-composition probes. Every regression asserts branch/call counts, not merely non-zero outcome.

## Implementer and surface

Reuse the exact Sonnet implementation session once if it resumes decisively; otherwise cold-start fresh Sonnet. No Kimi, no subagents. Approved editable paths:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`;
- `.planning/phases/99-arabic-coverage/99-01-PLAN.md`;
- `.planning/phases/99-arabic-coverage/99-02-PLAN.md`;
- `.planning/phases/99-arabic-coverage/99-03-PLAN.md`.

The three plans remain compiler-done under RULING-P99-48. Do not touch their summaries or dependency graph.

Deliver `.tickmarkr/overseer/P99R-R4-REPAIR-REPORT.md` ending `REAPER-R4-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes new hashes, and writes `.tickmarkr/overseer/P99R-R4-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R4-REPAIR-END`. Stop for final static confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R3-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R4-REPORT.md`
- `.tickmarkr/overseer/P99R-R3-REVIEW-HANDOFF.md`
