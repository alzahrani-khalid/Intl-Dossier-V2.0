# RULING-P99-83 — accept black-box cutover with two small corrections

**Decision:** Accept the meta-harness deletion and the real crash/recovery result. Do not spawn another bespoke reviewer; the standalone `tickmarkr verify` review is the independent review for this smaller surface. Make two instrument corrections, rerun the black box once, fix three dangling comments, then release the bounded rendered battery.

## 1. Accepted evidence

The real CLI/webServer scenario proved, from an attributed lease:

- exact wrapper pid and valid lease identity;
- wrapper SIGKILL with the leased session surviving as a real orphan;
- wrong-birth identity refusing without signaling that session;
- product `--sweep` exiting 0;
- exact lease removal, session zero, ports restored, and protected identities unchanged.

The selftest checkpoint is frozen 4/4 and recoverable. Deleting `scripts/pw-run-reaped.selftest.mjs` and its optional CLI branch is accepted. Production run, lease, sweep, package, config, and plan paths remain unchanged.

## 2. Instrument corrections

Before rerun, update `.tickmarkr/overseer/P99R-REAPER-BLACKBOX.mjs`:

1. The wrong-birth control must require a nonzero sweep exit, require the corrupted lease to remain, and require the output to identify a refusal/failure. Session-member equality alone can also mean the runtime skipped the lease for an unrelated reason.
2. `cleanupOwn()` must invoke the product `--sweep "$ROOT"` after terminating the wrapper and before deleting scratch. Preflight requires zero existing leases, so any repository lease created during this instrument belongs to this instrument. This closes the instrument's own error path without name-prefix discovery.

Rerun the complete black box. Require every assertion green and protected identities unchanged. Replace the evidence JSON; record the new script/evidence hashes in the rendered handoff.

## 3. Runtime comments

Fix the three dangling comments that refer to the deleted selftest. Comments must describe imports/drills historically or production behavior accurately; no reference to a file or CLI mode that no longer exists. No executable runtime change beyond the already accepted optional-branch deletion.

## 4. Bounded rendered battery

Run the two real Phase-99 specs once each, sequentially, through the production wrapper:

1. hardcode and verify collection `Total: 10 tests in 1 file`, then run `tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps`;
2. hardcode and verify collection `Total: 8 tests in 1 file`, then run `tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps`.

Together these 18 tests cover every narrower Phase-99 rendered filter without repeating the same spec through nine plan commands. Capture wrapper exit, Playwright JSON/log, lease cleanup, ports 5173/5001, and protected identities after each. A missing credential or product/visual question is a human checkpoint and stays blocked; do not auto-answer it.

Write `.tickmarkr/overseer/P99R-RENDERED-BLACKBOX-HANDOFF.md` ending `ORCH-P99R-RENDERED-END`, then stop before git write.

## 5. Candidate commit manifest decision

The candidate commit is limited to the runtime work named by RULING-P99-50:

- `scripts/pw-run-reaped.mjs`;
- `package.json`;
- `playwright.config.ts`;
- `.gitignore`;
- the twelve modified Phase-99 plan files `99-{01,02,03,08,10,12,19,20,21,24,40,41}-PLAN.md`.

Exclude from this commit:

- `.claude/**` and `.agents/**` skill changes and new scripts;
- `CLAUDE.md`, `AGENTS.md`, and `tickmarkr.spec.md`;
- the Phase-98 archive;
- every `.tickmarkr/**` operator artifact.

Those excluded paths are preserved, not rejected; bundling prior operator work into the runtime commit would make the standalone criteria review the wrong population. They require their own later scoped commit.

No git write is released until the rendered handoff is ruled green.

**Ship/no-ship:** Ship the production wrapper/config/package/plan routing only. Keep the black-box instrument and evidence operator-local. The method skill work remains preserved for a separate commit; it is not silently absorbed here.
