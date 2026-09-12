# RULING-P99-89 — recapture configured baseline and rerun when foreign load clears

**Decision:** Classify the cross-vendor run's build ceiling-kill as infrastructure contamination, not a candidate red. Do not change config, ceiling, candidate, or routing. Preserve and invalidate the config-less baseline cache, wait for the neighboring run to become idle, then rerun the identical configured gate.

## 1. Idle precondition

The neighboring tickmarkr repository owns pid 4202 and its build/test descendants. Never signal or modify them.

Proceed only after:

- pid 4202 and every attributed build/test descendant have exited;
- no other foreign `npm test`, `turbo`, or `vitest` process is consuming the gate worktree's machine budget; and
- one-minute load is at or below the machine's 18 logical CPUs for three consecutive 30-second samples.

Record process cwd/ancestry and all three load samples. This is a scheduling condition, not a runtime estimate.

## 2. Baseline cache

The reused baseline was captured without `.tickmarkr/config.yaml`; its command texts do not match the configured gate. Before removal:

1. resolve the exact cache path from the gate log;
2. copy that one JSON file into `.tickmarkr/overseer/freeze-p99r-configless-baseline/` with SHA-256 and source path;
3. verify the copy;
4. remove only the exact original baseline file from the review worktree.

Do not clear a directory or wildcard. The next gate must print that it captured a fresh baseline under the configured commands, not reused the old one.

## 3. Rerun

Keep review base/tip, candidate parity, criteria, black box, config, doctor channels, dependencies, tickmarkr 1.97.0 bytes, and 60,000-byte cap unchanged.

Run the exact command from RULING-P99-88. Require:

- fresh configured baseline capture;
- seven gates run;
- Grok acceptance judge;
- Kimi review;
- no Anthropic fallback;
- stable tickmarkr dist hash before/after.

Append a fourth successor section to `P99R-STANDALONE-VERIFY-HANDOFF.md` ending `ORCH-P99R-IDLE-CROSS-VENDOR-END`, then stop.

If the configured build ceiling-kills under the idle precondition, stop for an explicit ceiling decision; do not retry or raise it.

No compile, plan, phase run, source edit, git write, or worktree removal is released.
