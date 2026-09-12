# RULING-P99-86 — run standalone verification from a clean isolated worktree

**Decision:** Do not commit, stash, restore, or clean the excluded operator work. Run the exact standalone gate from a dedicated clean worktree at the current committed tip. This satisfies tickmarkr's clean-tree invariant while preserving the user's current checkout byte-for-byte.

## 1. Worktree creation

OVERSEER authorizes one git worktree write under the ignored tickmarkr state directory:

`.tickmarkr/verify-worktree.noindex`

Create it at the committed tip containing candidate `a0a1d3173` and subsequent ruling-only commits. Do not use or modify the current checkout's index. Verify the new worktree has zero tracked/untracked changes before setup.

Copy only these ignored operator inputs into the same relative paths in the worktree:

- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`;
- `.tickmarkr/overseer/P99R-REAPER-BLACKBOX.mjs`.

Verify their SHA-256 values match the current checkout. They remain ignored and must not make the worktree dirty.

## 2. Dependencies

Prepare dependencies inside the worktree with the repository's pinned package manager and lockfile, offline and frozen. Generated dependency paths must remain gitignored. Do not symlink only root `node_modules`; this repository's prior evidence shows that a root-only link leaves workspace transforms blank. Refuse if offline frozen installation cannot reproduce the workspace.

## 3. Preflight and gate

Repeat RULING-P99-85's version/fingerprint, lock/process, Node floor, ports, leases and protected-identity preflight from the worktree. Confirm the current checkout remains untouched.

Run exactly in the clean worktree:

```sh
tickmarkr verify --base 0413fa1af --criteria .tickmarkr/overseer/P99R-REAPER-CRITERIA.md
```

Review remains enabled. No override flag. Missing/unparseable output is failure.

Update `.tickmarkr/overseer/P99R-STANDALONE-VERIFY-HANDOFF.md` with a successor section ending `ORCH-P99R-CLEAN-VERIFY-END`, including worktree commit, clean status, input hashes, dependency command/result, exact gate output, exit code, every gate result, review provider/model, and verification that the user's checkout retained the excluded dirty population unchanged.

Keep the worktree after the handoff until OVERSEER rules; no removal, compile, plan, phase run, or other source edit.
