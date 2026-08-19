# RULING-P99-54 — third reaper repair, six bounded defects

**Decision:** Accept the R2 confirmation findings. The candidate remains uncommitted and unshippable. Release one bounded repair pass limited to the runtime, selftest, and behavioral criteria artifact. No bounded rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## Required repairs

### 1. Pre-spawn port census is fail-closed

Replace `runMode`'s spawn-time `flatMap(portHolders)` with an explicit tri-state loop. A `null`/unavailable result is never inserted into `portsBefore`, never cancellable by a later `Set.has(null)`, and prevents the Playwright child from spawning. The wrapper exits non-zero with the unavailable port named. Add a real `runMode` regression where the same port lookup is unavailable before and after; prove child spawn count remains zero and no report is published.

### 2. Lease schema is complete before it carries authority

Validate every lease before liveness or signalling:

- nonce in the expected format and equal to the wrapper-requested nonce;
- canonical root equal to the current canonical root;
- canonical writer cwd contained within root;
- positive integer sid, pid, pgid, wrapperPid;
- non-empty, parseable lstart and wrapperStart;
- valid writtenAt.

No field is an optional wildcard. Missing/non-numeric wrapper identity means wrapper death is unproven: retain the lease, signal nothing, and return unavailable/non-zero. A reused wrapper PID with a different valid start is explicit stale identity, not an instrument failure.

### 3. Recompare the full tuple every signal round

At first use and immediately before each TERM/KILL round, compare lease nonce/root plus writer `sid,pid,pgid,lstart,canonical cwd` against a complete fresh census. Any mismatch refuses the whole session and follows no recycled number.

### 4. Consumer-visible report is published only after clean cleanup

Do not write Playwright JSON directly to the path a legacy consumer reads. Run Playwright against a private pending report path. Before spawn, remove/refuse any stale final path fail-closed. Only after `cleanupVerdict === clean` atomically publish the pending report to the final path. On refused/unavailable/survivors, the final path must never exist; retain pending evidence under an explicitly unclean name. A failed publish/cleanup is non-zero.

This replaces best-effort “withhold after failure,” which cannot guarantee safety if rename/unlink fails after a valid final report already exists.

### 5. T11 and every detached child have unconditional ownership

The outer fixture owns both wrapper and detached dummy identities from creation through `finally`. Ordinary early exit, timeout, assertion throw, and detector failure all independently prove both gone. No cleanup depends on parsing output that may never flush.

### 6. Canonical entry detection

Determine entry status by canonical filesystem identity, not byte-equality between `import.meta.url` and `process.argv[1]`. Resolve both through `fileURLToPath`/`realpathSync`; invocation through `/var` versus `/private/var` and through a symlink must execute normally. If canonicalization fails, fail closed for CLI invocation rather than silently behaving as an import.

The seven bootstrap failure shapes must run canonically, via `/var` alias, and via symlink; every shape exits non-zero and proves the entry body actually ran.

## Tests

Add causal regressions for each item above. Re-run the four-locale 87-test matrix plus new rows, the seven failure-propagation shapes across all three invocation paths, and zero-residue checks. Each mutation must assert the intended branch/call count, not only a non-success outcome.

## Implementer

Reuse the Sonnet implementation lineage once if its session resumes decisively; otherwise cold-start one fresh visible Sonnet seat. Do not return to Kimi. The seat edits only:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

No subagents, commit, rendered run, tickmarkr command, or reviewer spawn. Deliver `.tickmarkr/overseer/P99R-R3-REPAIR-REPORT.md` ending `REAPER-R3-REPAIR-END`.

The orchestrator verifies scope, exits the writer by pane ownership, freezes new hashes, and writes `.tickmarkr/overseer/P99R-R3-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R3-REPAIR-END`. Stop for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R2-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R3-REPORT.md`
- `.tickmarkr/overseer/P99R-R2-REVIEW-HANDOFF.md`

Both reviewers independently reproduced the spawn-time `flatMap(null)` defect. Codex additionally reproduced valid-report survival after failed withholding and noncanonical-entry seven-way false success.
