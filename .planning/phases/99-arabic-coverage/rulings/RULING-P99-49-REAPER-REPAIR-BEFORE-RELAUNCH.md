# RULING-P99-49 — current session-reaper draft is not shippable

**Decision:** Do not commit the current `scripts/pw-run-reaped.mjs` diff and do not restart Phase 99 with it. Preserve it as the implementation draft, repair the seven cross-vendor findings, re-review, and only then make the ship decision. No compile or run is released by this ruling.

## Why

The recovery evidence proves a real repo defect: one rendered Playwright execution left a three-process, portless session after the listener was reaped. Enumerating every process group in the session is the right platform model; `kill(-sid)` is not a session operation.

The current implementation nevertheless carries destructive-safety failures:

1. **Critical — unavailable census can report `reaped/zero`:** recensus failures are coerced to empty populations, so no signal plus a dead verifier can return success.
2. **Critical — post-snapshot same-repo process can be killed:** “new port holder with cwd under root” is temporal coincidence, not ownership. A spawn-time lease is required.
3. **High — cwd attribution fails open:** lexical `startsWith` accepts prefix siblings and unreadable/unresolvable cwd members are not refused.
4. **High — numeric identities are not rebound:** `lstart` is collected but ignored; PID/PGID reuse can redirect TERM/KILL between snapshots. The bare-PID SIGKILL fallback is unsafe.
5. **High — cleanup failure is informational:** refusal, unavailable instruments, or survivors still lead the wrapper and current `;`-separated callers to success.
6. **Medium — exit-path coverage is incomplete:** SIGHUP, synchronous fatal errors, and uncatchable termination need explicit in-process or external-lease treatment.
7. **Medium — the drill misses the destructive boundary and can leak its own plants on early failure.**

Dependency-injected read-only probes reproduced three failures without signalling real processes: prefix-collision cwd and unreadable cwd both reached the fake signal function, and a mid-reap unavailable census returned `outcome: reaped`, `zero: true` with zero signals.

## Required implementation contract

Before this file may be committed:

- Make every census and verification result tri-state; unavailable/malformed/empty instrumentation fails closed and can never become an empty success.
- Add a spawn-time lease/nonce that binds the Playwright-started session. Port and cwd evidence may corroborate but may not establish ownership.
- Canonicalize root and every member cwd; use component-aware containment; refuse the entire session on unknown or out-of-root members.
- Carry and revalidate `sid`, `pid`, `pgid`, `lstart`, canonical cwd, and lease identity immediately before each bounded signal round. Recompute groups each round. Remove bare-PID SIGKILL.
- Define one cleanup verdict. `refused`, `unavailable`, or `survivors` must fail the wrapper and the actual acceptance command; update every caller so cleanup failure cannot be discarded by `;`.
- Make cleanup idempotent and cover the chosen catchable exit set. External lease recovery owns SIGKILL/crash/preflight/stand-down.
- Harden drills with no-op and over-broad mutations, same-root post-snapshot bystander, prefix collision, unreadable cwd, detector dropout, identity swap, caller propagation, and `try/finally` cleanup of every plant/temp artifact.
- Account for all direct rendered Playwright callers in Phase 99. A fix that protects only P99-02/03 while later rendered gates still leak is not phase-ready.

## Verification before ship

1. Syntax and formatting checks.
2. Dependency-injected tests for every finding above, each with a positive and negative control.
3. Revised synthetic real-process drill in an isolated environment, with no residual plants.
4. One bounded real rendered Playwright run with pre/post session census, lease identity, survivor evidence, and bystander survival.
5. Fresh cross-vendor confirmation by the consultant that found the defects, plus the shipped standalone gate battery for the final changed file set.

## Evidence and limits

Primary review: `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R1-REPORT.md` (`REAPER-VERDICT-END`). Recovery reproduction: `.tickmarkr/overseer/P99-RECOVERY-REPORT-R2.md` §5.

This ruling does not assert the leak caused a particular prior gate failure, does not claim every worktree is healthy, and does not prescribe a specific file decomposition before the remediation plan enumerates every caller and owner.
