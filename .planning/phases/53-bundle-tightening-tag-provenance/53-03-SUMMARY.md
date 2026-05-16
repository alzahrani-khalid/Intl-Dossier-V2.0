---
phase: 53-bundle-tightening-tag-provenance
plan: 03
status: PASS-WITH-DEFERRAL
verdict: PASS-WITH-DEFERRAL
requirements:
  - BUNDLE-06
deviations:
  - id: D-26
    severity: deferred
    title: Force-push of re-issued tags to origin deferred to human operator
    detail: |
      Sandbox blocks `git push` invocations. All three tags were re-issued
      locally as annotated + SSH-signed at their pre-existing commit SHAs
      with valid `Good "git" signature` against the user-configured
      `~/.ssh/allowed_signers`. The plan D-10 step `git push --force origin
      phase-47-base / phase-48-base / phase-49-base` must be executed by
      the human operator from an unsandboxed shell. Documented in the
      "Force-push checklist" section below.
    impact: |
      Local `git tag -v` works for all three tags. `git ls-remote` on
      origin still shows the pre-re-issue tag objects (commit-typed
      lightweight for phase-47/48; phase-49-base never existed on origin).
      A fresh clone today cannot run `git tag -v` against the new
      signatures until the human operator completes the force-push.
    closure_path: |
      Run the three `git push --force origin phase-NN-base` commands from
      an unsandboxed terminal in this repo, then verify
      `git ls-remote --tags origin refs/tags/phase-4{7,8,9}-base^{}`
      matches local commit SHAs.
files_modified:
  - CLAUDE.md
git_refs_modified:
  - refs/tags/phase-47-base (re-created annotated+signed, SHA preserved)
  - refs/tags/phase-48-base (re-created annotated+signed, SHA preserved)
  - refs/tags/phase-49-base (re-created annotated+signed, SHA preserved)
user_local_modified:
  - ~/.gitconfig (gpg.format, user.signingkey, gpg.ssh.allowedSignersFile)
  - ~/.ssh/allowed_signers (created, chmod 600, 1 signer line)
commits:
  - <fill-in-after-commit>
key-files:
  created: []
  modified:
    - CLAUDE.md
---

# Plan 53-03 Summary — Re-issue phase-NN-base tags as signed

## Verdict

**PASS-WITH-DEFERRAL** — All three `phase-NN-base` tags re-issued locally as annotated + SSH-signed at their pre-existing commit SHAs; `git tag -v` exits 0 for all three with `Good "git" signature`. Global SSH signing configured in `~/.gitconfig` + `~/.ssh/allowed_signers` (chmod 600). CLAUDE.md gained a 26-line `### Tag signing setup` appendix between `## Deployment Configuration` and `## Browser Automation`.

**Deferred:** the D-10 `git push --force origin phase-NN-base` step (×3) is blocked by the executor's sandbox and must be completed by the human operator. See "Force-push checklist" below.

## What Was Built

### Task 1 (Checkpoint resolved)
Human confirmed signing key `~/.ssh/id_ed25519.pub` (SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM) is enrolled on github.com as a Signing Key (id 949257, title `tag-signing-2026`). Key has no passphrase (`ssh-keygen -y -P "" -f ~/.ssh/id_ed25519` confirmed); `git tag -s` signs non-interactively.

### Task 2 (Global SSH signing config)
Three `git config --global` commands executed:

```
gpg.format=ssh
user.signingkey=/Users/khalidalzahrani/.ssh/id_ed25519.pub
gpg.ssh.allowedSignersFile=/Users/khalidalzahrani/.ssh/allowed_signers
```

`~/.ssh/allowed_signers` created (chmod 600, 1 line):

```
alzahrani.khalid@gmail.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPrRz9eX6qps6FleDJiFBqIMvDwlJVeV6mRM2XUJ5bxl alzahrani.khalid@gmail.com
```

Per D-07: user-local config; nothing in repo modified.
Per plan note: `commit.gpgsign` / `tag.gpgsign` NOT set globally — `-s` passed explicitly on `git tag` invocations.

### Task 3 (Re-issue local + force-push)

Per-tag procedure executed for all three (D-08 verbatim):

```
phase-47-base:
  - Pre: type=commit (lightweight), sha=41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - git tag -d phase-47-base
  - git tag -a -s phase-47-base 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5 -m "Phase 47 diff anchor — type-check-zero"
  - git tag -v phase-47-base → Good "git" signature ✓
  - Post: type=tag (annotated+signed), sha=41f28f169a2ca3bc2ed75b407f62f9f1b14404e5 (unchanged)
  - tag-object: 915b44f848ab4b14418ac147d1778a27db82e4bf

phase-48-base:
  - Pre: type=commit (lightweight), sha=baaf644a15fdcf97aa11c70f27a1187d558adaee
  - git tag -d phase-48-base
  - git tag -a -s phase-48-base baaf644a15fdcf97aa11c70f27a1187d558adaee -m "Phase 48 diff anchor — lint-config-alignment"
  - git tag -v phase-48-base → Good "git" signature ✓
  - Post: type=tag (annotated+signed), sha=baaf644a15fdcf97aa11c70f27a1187d558adaee (unchanged)
  - tag-object: 3a8feb4c2e939d621b3c4efb83b9f852f0dc2c8c

phase-49-base:
  - Pre: type=tag (annotated, unsigned), sha=7fc9e7564ce01afee067277045573f192163f6d2
  - git tag -d phase-49-base (deleted tag-object 8ecd12a7…)
  - git tag -a -s phase-49-base 7fc9e7564ce01afee067277045573f192163f6d2 -m "Phase 49 diff anchor — bundle-budget-reset"
  - git tag -v phase-49-base → Good "git" signature ✓
  - Post: type=tag (annotated+signed), sha=7fc9e7564ce01afee067277045573f192163f6d2 (unchanged)
  - tag-object: 06a77010d3a9a77fc8a4612af97901920292c7f8
```

All three signed with `ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM` for `alzahrani.khalid@gmail.com`.

**Pre-re-issue origin state:**
- phase-47-base on origin: lightweight (commit-typed, 41f28f1…)
- phase-48-base on origin: lightweight (commit-typed, baaf644…)
- phase-49-base on origin: **not present** (was local-only annotated)

**Post-re-issue origin state:** unchanged — force-push deferred (D-26).

### Task 4 (CLAUDE.md appendix)

26-line `### Tag signing setup` H3 subsection inserted between line 420 (end of `### Test Credentials for Browser/Chrome MCP`) and line 447 (`## Browser Automation`). Section sits at line 421 inside `## Deployment Configuration` (starting line 382). Plan 53-02's Node-line edits at lines 84 and 457 preserved untouched.

Contents (per plan §Specifics):
- Intro paragraph (why Phase 53 / what tags this covers)
- Three `git config --global` commands (verbatim)
- `~/.ssh/allowed_signers` line format with example
- `git tag -v phase-49-base` verification command
- GitHub Signing Key enrollment note

`git diff --stat CLAUDE.md` → `1 file changed, 26 insertions(+)`. Purely additive.

## Force-push checklist (human action — D-26 closure)

The plan D-10 step requires force-push of all three tags to origin so a fresh clone can `git tag -v` without local fixup. Sandbox blocks `git push`. Run these three commands from an unsandboxed shell in the repo root:

```bash
git push --force origin phase-47-base
git push --force origin phase-48-base
git push --force origin phase-49-base
```

After pushing, verify origin agrees with local:

```bash
for T in phase-47-base phase-48-base phase-49-base; do
  REMOTE=$(git ls-remote --tags origin "refs/tags/$T^{}" | awk '{print $1}')
  LOCAL=$(git rev-parse "$T^{commit}")
  test "$REMOTE" = "$LOCAL" && echo "$T: remote matches local ✓"
done
```

Expected output:
```
phase-47-base: remote matches local ✓
phase-48-base: remote matches local ✓
phase-49-base: remote matches local ✓
```

Once verified, this plan flips PASS-WITH-DEFERRAL → PASS, and the phase-level VERIFICATION can confirm all D-10 acceptance criteria.

## Verification Evidence

```
$ git tag -v phase-47-base 2>&1 | grep "Good"
Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM

$ git tag -v phase-48-base 2>&1 | grep "Good"
Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM

$ git tag -v phase-49-base 2>&1 | grep "Good"
Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM

$ for T in phase-47-base phase-48-base phase-49-base; do git cat-file -t "$T"; done
tag
tag
tag

$ for T in phase-47-base phase-48-base phase-49-base; do git rev-parse "$T^{commit}"; done
41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
baaf644a15fdcf97aa11c70f27a1187d558adaee
7fc9e7564ce01afee067277045573f192163f6d2
```

## Self-Check: PASSED (with deferral)

- [x] Task 1 (Checkpoint): human reply `signing-key-enrolled: ~/.ssh/id_ed25519.pub` captured
- [x] Task 2: global SSH config + `~/.ssh/allowed_signers` (chmod 600) in place
- [x] Task 3 (local part): all 3 tags re-issued annotated+signed, SHAs preserved, `git tag -v` exits 0 for each
- [ ] Task 3 (origin force-push): **deferred to human (D-26)** — sandbox restriction
- [x] Task 4: `### Tag signing setup` appendix inserted in CLAUDE.md between `## Deployment Configuration` and `## Browser Automation`, 26-line purely additive diff
- [x] No CLAUDE.md content outside the insertion modified (Plan 53-02 Node lines preserved)
- [x] No `~/.gitconfig` / `~/.ssh/allowed_signers` content committed to the repo (D-07)
- [x] BUNDLE-06 must-haves all locally satisfied; remote-side flip awaits 3 `git push --force` commands
