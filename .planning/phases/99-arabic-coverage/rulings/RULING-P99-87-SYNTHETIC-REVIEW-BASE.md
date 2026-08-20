# RULING-P99-87 — review only the post-R9 delta through a synthetic base

**Decision:** Do not raise `gates.diffCap` and do not ask a reviewer to re-read 152 KB of governance prose plus the already-reviewed R1–R9 runtime. Build an isolated review-only commit pair: exact frozen R9 runtime as the base, exact 16-path candidate as the tip. Run the unchanged standalone gate against that small, byte-proven delta.

## 1. Prior evidence boundary

The runtime at SHA-256 `5e073e3577be3ec3032cbd728fd4027a9c330319cac069eb45658df31ded50a3` received two-vendor no-material-defect convergence at R9. The new independent review is responsible for changes after that frozen runtime:

- optional `--selftest` CLI deletion and dangling-comment corrections;
- dead lease-writer recovery;
- package/config/gitignore routing;
- twelve Phase-99 plan routing edits.

The five deterministic standalone gates already ran green at the real candidate tip. Acceptance and review alone were blocked by the cap before provider invocation.

## 2. Review-only commit pair

Create a second isolated worktree under `.tickmarkr/review-worktree.noindex`, never the user's checkout.

Start from commit `489eb70be` (the parent immediately before candidate commit `a0a1d3173`). Create:

1. **review base:** add only `scripts/pw-run-reaped.mjs` from the frozen pre-deletion bytes in `freeze-p99r-r18-checkpoint/`; require SHA-256 `5e073e35…`;
2. **review tip:** replace the exact 16 approved paths with their blobs from candidate commit `a0a1d3173`, then commit.

Before gating, mechanically verify every one of the 16 review-tip blobs equals `a0a1d3173:<path>`. The synthetic commits are review instruments only: never merge, tag, push, or use them as Phase-99 baseRef.

Require the review-base→review-tip diff below the configured 60,000-byte cap. If not, stop; do not change the cap.

## 3. Gate environment

Copy the exact ignored black-box script and criteria into the review worktree and verify their hashes. Install dependencies offline with frozen lockfile, or reuse the already-proven complete offline installation only if workspace node_modules parity is rechecked.

Run:

```sh
tickmarkr verify --base <review-base-commit> --criteria .tickmarkr/overseer/P99R-REAPER-CRITERIA.md
```

Review stays enabled. Capture every gate, provider/model, artifacts, exact synthetic commit ids, blob-parity proof, and diff size.

Update `P99R-STANDALONE-VERIFY-HANDOFF.md` with a second successor section ending `ORCH-P99R-SPLIT-VERIFY-END`. Keep both review worktrees until OVERSEER rules.

## 4. Interpretation

A green result applies to the exact candidate bytes because the 16 candidate blobs are proven identical. It does not make the synthetic history shippable. The actual milestone remains on the real tip containing `a0a1d3173` and the ruling commits.

No compile, plan, phase run, source edit, or current-checkout cleanup is released.
