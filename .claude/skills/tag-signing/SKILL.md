---
name: tag-signing
description: Set up SSH-signed git tags for phase-base tags (once per machine) and verify with git tag -v. Use when git tag -v fails, when enabling signing on a new machine, or when creating phase-NN-base tags.
---

# Tag signing setup

Phase 53 (BUNDLE-06) introduced SSH-signed phase-base tags so `git tag -v <name>` succeeds for `phase-47-base`, `phase-48-base`, `phase-49-base`, and every `phase-NN-base` tag created from Phase 54 onward.

The signing config is user-local (`~/.gitconfig` and `~/.ssh/allowed_signers`) and is NOT committed to the repo. Run these three commands once per machine to enable signing:

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/<your-github-enrolled-key>.pub
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

Then create `~/.ssh/allowed_signers` (chmod 600) with one line per signer:

```
alzahrani.khalid@gmail.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA<rest-of-pubkey-blob>
```

The first field is the email used by `git config user.email`; the rest is the literal contents of the corresponding `~/.ssh/id_*.pub`. Verify with:

```bash
git tag -v phase-49-base   # MUST exit 0 and print "Good \"git\" signature"
```

For GitHub's "Verified" tag badge to appear, the SSH key must be enrolled on github.com as a **Signing Key** (separate enrollment from Authentication Keys). Local `git tag -v` works against `allowed_signers` regardless of the GitHub enrollment.
