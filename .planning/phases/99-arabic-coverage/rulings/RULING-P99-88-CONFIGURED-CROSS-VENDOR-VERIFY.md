# RULING-P99-88 — rerun split gate with repository cross-vendor routing

**Decision:** The split-base mechanism and candidate byte parity are accepted. The green Anthropic review is real but does not satisfy this phase's independence requirement because `.tickmarkr/config.yaml` was absent. Rerun the same retained gate with the repository config: Grok acceptance judge and Kimi review, Anthropic denied.

## 1. Configuration

Copy the current checkout's exact `.tickmarkr/config.yaml` into the review worktree and record its SHA-256. Run `tickmarkr doctor` in that worktree after the copy so channel state is live and repo-local. Do not edit the config.

Before the gate, require effective routing to resolve:

- `judge: grok:grok-4.6`;
- `review: kimi:kimi-code/k3`;
- `claude-code:{fable,opus,sonnet}` denied.

If either intended channel is unauthenticated or the effective config differs, stop; no silent provider substitution.

## 2. Harness ruling

For standalone `verify`, use tickmarkr 1.97.0: it matches the repository package major.minor, resolves to a real directory rather than the symlink condition that triggered RULING-P99-30, and its dist hash was stable before/after the prior gate. The private 1.93.0 pin is stale and must not run a 1.97.0 repository gate.

Before Phase-99 compile/run, create a new immutable private 1.97.0 pin and record its realpath/dist hash. RULING-P99-30's reproducibility principle survives; its 1.93.0 artifact does not.

## 3. Gate

Keep synthetic base `0fccd0450`, tip `ce9a4ba60`, 16/16 candidate blob parity, and the 42,724-byte diff unchanged. Run exactly:

```sh
tickmarkr verify --base 0fccd0450 --criteria .tickmarkr/overseer/P99R-REAPER-CRITERIA.md
```

No override and no `--no-review`. Require all seven gates green, acceptance provider Grok, review provider Kimi, and parseable artifacts/verdicts. Re-hash tickmarkr dist before and after.

Append a third successor section to `P99R-STANDALONE-VERIFY-HANDOFF.md` ending `ORCH-P99R-CROSS-VENDOR-END`, then stop. Keep both worktrees.

## 4. Deferred prose

The stale 99-02/99-03 sentences saying the Playwright exit code is not consulted are a real documentation defect, not a gate blocker. Queue them for the post-Phase-99 documentation correction; changing candidate blobs now would invalidate the review pair for no behavioral benefit.

No compile, plan, phase run, source edit, or git write is released by this ruling.
