# RULING-P99-60 — sixth bounded reaper repair

**Decision:** Repair the supported-caller provenance defect and the five remaining unbound safety inputs. The candidate remains uncommitted. No rendered run, standalone gate, compile, or Phase-99 run is released.

## 1. Publish clean reports atomically without overwrite

A clean verdict may publish only a pending report produced by this run.

- Missing pending report is unclean; never `{ok:true,published:false}`.
- Use an atomic no-overwrite operation in the same directory/filesystem (for example `linkSync(pending, final)` followed by unlink of pending). Never use overwrite-capable `renameSync` for the final publish.
- If final already exists, preserve it untouched, retain the pending report as this run's evidence, return non-zero, and do not invoke the consumer.
- Prove the current run's pending path is nonce-bound and that only a successful no-overwrite publish makes the final path consumer-visible.

Add real `&&` composition tests for: pending missing, final pre-existing, final appearing immediately before publish, publish failure, and clean publish. In every unclean case the consumer call count is zero.

## 2. Start identity is canonical and attainable

Parse forced-C `ps lstart` into a canonical identity rather than treating a regex match as authority.

- Enforce exact canonical C-locale token/spacing form or canonicalize once and compare canonical identities everywhere.
- Reject starts in the future beyond a small injected clock tolerance and years beyond the current injected year.
- Keep existing calendar/leap/time validation.
- Inject `now` in tests; add future-year/future-instant and alternate-spacing regressions whose nonces and other fields are valid.

## 3. Lease authority binds every decision field

`leaseAuthorityStillValid` must compare, on every re-read:

- nonce and canonical root;
- target `sid`;
- writer `pid,pgid,lstart,canonical cwd`;
- `wrapperPid` and `wrapperStart` whose proven death authorised orphan reaping.

Any changed decision field refuses before the next signal/unlink. Add call-order regressions for SID and wrapper-pair replacement during census.

## 4. Direct Playwright group identity and final zero are verified

At child spawn, record direct child PID, PGID, and canonical start identity. Before signalling the captured group, confirm the child/group identity still matches or that the child exited while the same owned group remains attributable. `reapGroup` must distinguish `gone` from `unavailable`; signal-0 errors other than ESRCH are unavailable.

A clean verdict requires independent final proof that the direct group has zero members. The `seen`/group result must enter the verdict conjunction. Add PID/PGID reuse and unavailable signal-0 regressions with zero collateral calls.

## 5. Port attribution uses birth identity

Snapshot configured port holders as `(pid, canonical lstart)` tuples, not PID numbers. Finish-time equality requires both fields. PID reuse with a different start is a new holder and follows normal lease attribution/refusal. Any holder birth lookup unavailable makes the census unavailable and the verdict non-clean.

## 6. Documentation and criteria match the current contract

Correct the runtime header and criteria statements that still describe legacy semicolon support, optional/parseable-only starts, stdout-owned T11 identity, or pre-R4 cwd bounds. The supported boundary is actual repository `&&` composition plus atomic no-overwrite publication.

## Tests

Add causal regressions for items 1–5, each with branch/call counts and valid controls. Re-run four-locale 105/105 plus new rows, both entry matrices, real `&&` composition, and zero-residue checks. No test may use a malformed nonce when claiming another branch.

## Implementer and surface

Resume the exact Sonnet implementation lineage once if decisive, otherwise cold-start Sonnet. No Kimi or subagents. Edit only:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

No plan/config/package edits, commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R6-REPAIR-REPORT.md` ending `REAPER-R6-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes hashes, and writes `.tickmarkr/overseer/P99R-R6-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R6-REPAIR-END`. Stop for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R5-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R6-REPORT.md`
- `.tickmarkr/overseer/P99R-R5-REVIEW-HANDOFF.md`

The clean-path provenance defect was independently identified by both reviewers without constructing a payload. The remaining five items enumerate safety-decision inputs still not bound by the runtime.
