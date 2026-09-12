# RULING-P99-84 — fix dead lease-writer recovery; rendered red is the phase baseline

**Decision:** Do not hand-kill the two survivors. They are an attributed live reproduction of a real runtime defect. Repair the one guard that rejects a dead session leader, then use the existing lease and processes to prove the product path recovers them. The eight Arabic failures are expected pre-engine REDs for pending Phase-99 tasks, not a reason to keep repairing the harness.

## 1. Rendered finding disposition

`99-ar03-leak.spec.ts` collected exactly 10 and ran through the production wrapper: 2 passed, 8 failed on the Arabic copy/banner/chip/404 assertions the phase exists to fix. This is valid RED baseline evidence. Those pending tasks have not executed yet; demanding a green full battery before the engine would invert RED→GREEN development.

Do not run `99-ar02-dates.spec.ts` now. Its 8-test battery and the 10-test leak battery run after Phase-99 engine completion as final rendered verification. The task-level plan oracles remain the per-task gates during execution.

## 2. Runtime defect

The lease writer/session leader may exit while its child groups remain in the same session. `reapLeakedSession()` currently requires the writer pid to appear in the first session census and calls absence "sid likely reused". That rejects the ordinary orphan shape.

Minimal production fix, limited to the `expectedWriter` block in `reapLeakedSession()`:

- if the writer appears in the session census, keep the existing pgid/lstart/cwd tuple comparison unchanged;
- if it is absent, call the existing `probeWrapper(expectedWriter.pid, expectedWriter.lstart)`;
- continue only when that probe reports the original writer positively `dead`;
- refuse on `alive`, `stale-identity`, or `unavailable`;
- keep full cwd/identity/lease revalidation for every surviving member and every signal round unchanged.

This distinguishes "original leader is dead, children retain its session" from "the numeric writer pid was reused" without weakening attribution. No new helper or abstraction.

## 3. Use the live reproduction; no out-of-band cleanup

Before editing, preserve the exact lease bytes/hash and the captured member/port identities from `P99R-RENDERED-BLACKBOX-HANDOFF.md`. The current lease is the authority.

After the patch:

1. run `node scripts/pw-run-reaped.mjs --sweep "$PWD"` against the existing lease;
2. require exit 0, exact lease removal, sid 22531 exactly zero members, and ports 5173/5001 free;
3. require the preserved helper, foreign trio, and eight evidence paths unchanged;
4. record every signal target and final census.

If the live state disappears before the patch runs, do not fabricate it; reproduce through the corrected black-box instrument.

## 4. Black-box completion

Keep the bounded-final retry logic and all stronger positive-control assertions. Rerun the full black box once after the runtime fix. Final evidence must be green and must state whether recovery succeeded on the first attempt or after a named fail-closed transient refusal.

Update the minimal criteria limit to distinguish:

- bounded transient attribution refusal, which may retry; and
- the dead-writer guard fixed here, which must recover attributed remaining session members.

## 5. Delivery

Use one fresh visible Sonnet implementer for this single runtime block. Editable source: `scripts/pw-run-reaped.mjs` only. No selftest resurrection, no synthetic harness, no plan/config/package edit, no git write, no rendered battery, no tickmarkr command.

Deliver `.tickmarkr/overseer/P99R-DEAD-WRITER-REPAIR.md` ending `DEAD-WRITER-REPAIR-END`. The orchestrator independently verifies the exact diff, live-state recovery, black-box green, protected identities, and final candidate manifest; then updates `P99R-RENDERED-BLACKBOX-HANDOFF.md` with a successor section ending `ORCH-P99R-DEAD-WRITER-END` and stops before commit.

No separate bespoke reviewer. The standalone `tickmarkr verify` review remains the independent review after the approved scoped commit.

**Ship/no-ship:** This is production recovery behavior and must ship in `scripts/pw-run-reaped.mjs`. Manual pid cleanup would restore this workstation and leave every user with the same unrecoverable orphan; it is rejected.
