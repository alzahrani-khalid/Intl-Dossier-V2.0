# Phase 55: DesignV2 → Main Merge & Gate Enforcement - Research

**Researched:** 2026-05-17
**Domain:** GitHub branch protection, `--no-ff` merge mechanics, SSH-signed tag preservation, CI required-context naming, positive-failure CI assertions
**Confidence:** HIGH

## Summary

Phase 55 is a release-engineering phase, not a code phase. The work is: (1) push 111 unpushed DesignV2 commits, (2) open a PR DesignV2 → main, (3) run all 6 required CI contexts green, (4) merge via the GitHub UI as `--no-ff` so signed phase-base tags stay reachable, (5) open a separate PR that adds 2 new CI jobs (`Design Token Check`, `react-i18next Factory Check`) wired as positive-failure assertions against existing fixtures, (6) `gh api PUT` the `main` branch protection to add those 2 contexts to the required list, (7) open a smoke PR with planted violations and capture `mergeStateStatus=BLOCKED` from `gh pr view --json` as durable evidence, (8) clean up: delete the remote `DesignV2` branch and the smoke PR, issue annotated + SSH-signed `phase-55-base` tag.

Two technical surfaces were verified empirically in this session: the live `main` branch protection JSON (current 6 contexts, `enforce_admins=true`, `allow_force_pushes=false`, `allow_deletions=false`, the modern `checks[]` array format), and the actual behavior of both eslint fixtures against the current `eslint.config.mjs`. Critical surprises that the CONTEXT.md did not foreground are documented in the Common Pitfalls section.

**Primary recommendation:** Plan **at minimum 4 sequential plans**: (1) push + open merge PR + watch gates green + merge via UI + signed `phase-55-base` tag; (2) separate PR adding the 2 CI jobs + verifying they run green on main; (3) `gh api PUT` branch protection with the 2 new contexts; (4) smoke PR with planted violations + evidence capture + cleanup. Plans 2 and 3 should NOT be combined (the protection update must follow the CI jobs running once green on main so the contexts are "known" to GitHub).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Merge Strategy**
- **D-01:** Merge commit (`--no-ff`) — preserves all 111 remote commits + phase-base tag SHAs (`phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base`) which are SSH-signed annotated. Squash would orphan signed tags from main's reachable history.
- **D-02:** Merge channel = PR via `gh pr create`; user clicks "Merge pull request" in GitHub UI (creates merge commit). `enforce_admins=true` so owner respects required checks. Full audit trail on the PR.
- **D-03:** Rollback plan = `git revert -m 1 <merge-sha>` on `main` + push. Documented in phase SUMMARY with the exact command and decision criteria. No force-push, no protection bypass.
- **D-04:** Post-merge DesignV2 disposition = delete remote branch (`gh api -X DELETE repos/.../git/refs/heads/DesignV2`). Future phases 56-59 branch off `main`. `phase-54-base` SSH-signed tag preserves the historic DesignV2 tip.

**Pre-Merge Push & Verify**
- **D-05:** Local verification depth BEFORE push = full gate parity. Run `pnpm type-check && pnpm lint && pnpm size-limit && pnpm test` locally on DesignV2 tip. Mirrors 4 of 6 required CI contexts.
- **D-06:** Push shape = single `git push origin DesignV2` of all 110 unpushed commits. Remote is strict ancestor (110 ahead, 0 behind).
- **D-07:** Merge PR gate requirement = ALL 6 required contexts green before clicking Merge — `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`.
- **D-08:** CI regression fix path = commit fixes onto DesignV2 directly (same PR source); push; CI re-runs; merge when green. Single-PR audit trail.

**Smoke PR (MERGE-02)**
- **D-09:** PR count = single multi-violation PR. Plant raw hex (Lint), `vi.mock` factory regression (Tests), bundle bloat (Bundle Size Check), and type error (type-check). One `mergeStateStatus=BLOCKED` proves multiple gate contexts at once.
- **D-10:** Violations source = reuse existing fixtures `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts`. Smoke PR imports them into a real component path so CI exercises them against `main`. Also closes the Phase 59 POLISH-04 "positive-failure CI assertion" gap as a byproduct.
- **D-11:** Evidence artifact = commit `55-SMOKE-PR-EVIDENCE.json` (output of `gh pr view <num> --json mergeStateStatus,statusCheckRollup`) AND `55-SMOKE-PR-EVIDENCE.png` (screenshot of BLOCKED status banner) to the phase folder.
- **D-12:** Smoke PR cleanup = `gh pr close <num> --delete-branch` after evidence captured.

**Branch Protection Re-Config**
- **D-13:** Final required contexts on `main` = **8 contexts** = current 6 PLUS 2 new explicit gates (`Design Token Check`, `react-i18next Factory Check`). Reverses v6.3 D-09 fold-into-Lint decision.
- **D-14:** CI wiring for new contexts = 2 separate jobs in `.github/workflows/ci.yml` (`design-token-check`, `i18next-factory-check`). Each runs the specific ESLint rule / fixture assertion in isolation against `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts` as positive-failure assertions.
- **D-15:** Sequence = (1) merge DesignV2 → main, (2) separate PR adds new ci.yml jobs + smoke-verifies they run green on `main`, (3) `gh api -X PUT repos/.../branches/main/protection` adds 2 new required contexts, (4) smoke PR exercises full 8-context gate. Clean causality: stabilize main first, then expand contracts.
- **D-16:** Branch protection update actor = Claude runs `gh api -X PUT repos/.../branches/main/protection --input protection.json`. Scripted, repeatable, the input JSON committed to phase folder as audit trail.

### Claude's Discretion

- Merge commit message format (Claude follows existing repo convention from `git log` precedent)
- PR title/labels for both the merge PR and the smoke PR (Claude uses descriptive titles aligned with v6.4 milestone naming)
- Exact filename for the smoke PR's plant-violation component path (Claude picks a low-risk leaf component)
- `protection.json` exact JSON shape (Claude derives from current `gh api repos/:owner/:repo/branches/main/protection` baseline + adds the 2 new contexts)

### Deferred Ideas (OUT OF SCOPE)

- **Terraform / IaC for branch protection** — deferred (scope expansion; belongs in its own phase if/when v7.x decides on infra-as-code direction)
- **Reusable workflow extraction** (`.github/workflows/check-gate.yml`) — deferred in favor of inline jobs in `ci.yml`
- **Live Playwright run as additional merge gate** — out of scope per Phase 57 D-23 ownership
- **e2e.yml as required context** — kept separate per v6.4 milestone scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MERGE-01 | DesignV2 branch merged to `main` with all v6.3 quality gates green (type-check, Lint, Bundle Size Check (size-limit), design-token D-05 selectors, `react-i18next` factory) | Live `main` protection JSON captured (Code Examples §"Current branch protection JSON"); `--no-ff` mechanics documented (Code Examples §"Merge via UI"); 6 required contexts already match DesignV2's ci.yml job names (verified via `gh api ... actions/runs/<id>/jobs`) |
| MERGE-02 | v6.3 enforcement verified live on `main` PR contexts post-merge (smoke PR captures `mergeStateStatus=BLOCKED`) | `mergeStateStatus=BLOCKED` empirically verified on prior smoke PRs #8-12 against main (gh GraphQL query in this session); GitHub docs confirm BLOCKED is the value when required checks fail (Sources); positive-failure idiom documented (Code Examples §"Positive-failure CI assertion") |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Branch protection update | GitHub API | `gh` CLI | Protection lives in GitHub's repo settings, mutated via REST API; `gh api -X PUT` is the canonical client |
| Merge commit creation | GitHub UI (web) | git (CLI fallback) | D-02 locks UI merge so `enforce_admins=true` is exercised; CLI merge would bypass that test |
| Push of 111 commits | git protocol | — | Plain `git push` — no API surface |
| Smoke PR creation | `gh pr create` | git | PR is a GitHub artifact; `gh` is the CLI client |
| Evidence capture | `gh pr view --json` | manual screenshot | JSON is machine-readable durable proof; PNG is human-readable durable proof |
| CI job execution | GitHub Actions runners | — | Workflow runs are GitHub's responsibility once the YAML lands |
| Positive-failure assertion | Bash idiom in CI step | ESLint | `eslint ... && exit 1 || exit 0` inverts exit code; ESLint produces the underlying signal |
| Tag signing | local git (SSH key in `~/.ssh/`) | `git tag -s` | Signing happens client-side; GitHub validates if the key is enrolled as a Signing Key |

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `gh` CLI | 2.92.0 (verified `gh --version`) [VERIFIED: local installation] | GitHub API client for PR, branch protection, status check rollup | Official GitHub CLI; only tool with `gh api -X PUT` for branch protection in one line. Already installed (verified). |
| `git` | 2.x with SSH signing config | Push, merge, tag (annotated + signed) | Project already uses SSH signing per `CLAUDE.md §Tag signing setup`. `phase-47/48/49/54-base` tags verified working in this session. |
| ESLint (resolved via `pnpm`) | from `eslint.config.mjs` flat config | Positive-failure assertions for the 2 new CI jobs | Already the enforcement mechanism for `Lint` context; fixtures live at `tools/eslint-fixtures/` |
| `bash` (in CI runner) | 5.x | Wrap eslint invocation to invert exit code | Standard POSIX idiom — `cmd && exit 1 || exit 0` |
| `size-limit` (via `pnpm -C frontend size-limit`) | from `frontend/.size-limit.json` | Bundle size budget — preserve existing context | Already wired as `Bundle Size Check (size-limit)` context in main protection |
| Vitest | from `frontend/tests/setup.ts` | Underlying test runner whose vi.mock contract the i18next fixture enforces | Already the test runner; the fixture is an eslint regression test on the vi.mock factory shape, NOT a vitest test |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `jq` (via `gh api --jq`) | Filter JSON output from `gh api` | When extracting specific fields like `.required_status_checks.contexts` |
| `pnpm` 10.29.1 | Workspace-scoped script execution | For all `pnpm -C frontend ...` invocations |
| `git tag -v` | Verify SSH signature on phase-base tags | Pre-merge: confirm `phase-47/48/49/54-base` still pass; Post-merge: confirm they remain reachable + verifiable; After issuing `phase-55-base` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gh api -X PUT branches/main/protection --input protection.json` | Terraform branch protection resource | Terraform is IaC, requires module + state — deferred per CONTEXT.md `<deferred>` |
| Inline CI job `design-token-check` | Reusable workflow `.github/workflows/check-gate.yml` | Reusable workflow is DRY but premature with only 2 gates — deferred per CONTEXT.md `<deferred>` |
| `git push origin DesignV2 --force-with-lease` | Plain `git push origin DesignV2` | DesignV2 remote is strict ancestor (verified: 111 ahead, 0 behind) — plain push works; force-push is forbidden per repo guardrails |

**Installation:** none required. All tools already present (verified `gh auth status` showing `Logged in to github.com account alzahrani-khalid (keyring)` with `repo`, `workflow`, `admin:public_key`, `admin:ssh_signing_key` scopes — exactly the scopes needed for branch protection PUT and SSH-signing-key operations).

## Package Legitimacy Audit

Not applicable — this phase installs **no new external packages**. The two new CI jobs invoke `pnpm exec eslint` against existing fixtures and the existing `eslint.config.mjs`; no `npm install`, `pnpm add`, or `pip install` is required. The audit is omitted by design, not by oversight.

## Architecture Patterns

### System Architecture Diagram

```
                  ┌──────────────────────────────────────────────────────────────┐
                  │                       Phase 55 Pipeline                       │
                  └──────────────────────────────────────────────────────────────┘

   ┌─────────────────┐    git push    ┌────────────────────┐
   │ local DesignV2  ├───────────────▶│ origin/DesignV2    │
   │ tip 35df6187    │  111 commits   │ (now strict-ancest)│
   └─────────────────┘                └─────────┬──────────┘
                                                │
                                                │ gh pr create
                                                ▼
                              ┌──────────────────────────────────┐
                              │  PR #N: DesignV2 → main          │
                              │  Required contexts (6):          │
                              │   type-check, Lint, Tests(fe),   │
                              │   Tests(be), Security Scan,      │
                              │   Bundle Size Check (size-limit) │
                              └─────────┬────────────────────────┘
                                        │ all 6 green
                                        │ user clicks "Merge"
                                        ▼
                              ┌──────────────────────────────────┐
                              │  origin/main HEAD = merge commit │
                              │  --no-ff preserves history       │
                              │  phase-47/48/49/54-base now      │
                              │  reachable from main             │
                              └─────────┬────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
   ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
   │ Tag phase-55-base│  │ Separate PR #M:      │  │ DELETE remote        │
   │ annotated+signed │  │ add 2 CI jobs to     │  │ DesignV2 branch      │
   │ git tag -v ✓     │  │ ci.yml; verify green │  │ via gh api -X DELETE │
   └──────────────────┘  └──────────┬───────────┘  └──────────────────────┘
                                    │ merged to main
                                    ▼
                         ┌────────────────────────────────────┐
                         │ gh api -X PUT branches/main/       │
                         │ protection — add 2 new contexts    │
                         │ Required contexts now: 8           │
                         └────────────┬───────────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────────────────┐
                         │ Smoke PR #X: planted violations    │
                         │ (hex, vi.mock factory miss,        │
                         │  bundle bloat, type error)         │
                         │ gh pr view --json                  │
                         │ mergeStateStatus → BLOCKED         │
                         └────────────┬───────────────────────┘
                                      │
                          capture .json + .png evidence
                                      │
                          gh pr close <num> --delete-branch
                                      │
                                      ▼
                         ┌────────────────────────────────────┐
                         │   55-SMOKE-PR-EVIDENCE.json        │
                         │   55-SMOKE-PR-EVIDENCE.png         │
                         │   protection.json (audit input)    │
                         │   committed to phase folder        │
                         └────────────────────────────────────┘
```

### Recommended Plan Structure

This is a **release-engineering phase, not a code phase**. There is no `src/` structure to recommend. The artifacts produced live in `.planning/phases/55-designv2-main-merge-gate-enforcement/` and `.github/workflows/ci.yml`:

```
.planning/phases/55-designv2-main-merge-gate-enforcement/
├── 55-CONTEXT.md                       # exists
├── 55-DISCUSSION-LOG.md                # exists
├── 55-RESEARCH.md                      # this file
├── 55-01-*-PLAN.md                     # plan 1: push + merge PR + signed tag
├── 55-02-*-PLAN.md                     # plan 2: CI jobs PR (2 new jobs)
├── 55-03-*-PLAN.md                     # plan 3: branch protection update
├── 55-04-*-PLAN.md                     # plan 4: smoke PR + evidence + cleanup
├── 55-XX-*-SUMMARY.md                  # one per plan
├── 55-VERIFICATION.md                  # phase-level verification
├── protection-before.json              # audit: gh api ... pre-update
├── protection-after.json               # audit: gh api ... post-update
├── 55-SMOKE-PR-EVIDENCE.json           # gh pr view --json output
└── 55-SMOKE-PR-EVIDENCE.png            # GitHub UI screenshot
```

### Pattern 1: `--no-ff` merge preserves signed annotated tag reachability

**What:** A merge commit (created by `--no-ff` or the GitHub UI "Merge pull request" button) has TWO parents: parent 1 = main's previous HEAD, parent 2 = DesignV2's tip. Both parents' ancestor commits become reachable from the new merge commit. Annotated tag objects (47-base, 48-base, 49-base, 54-base) point to specific commit SHAs — those SHAs are now in main's reachable history.

**When to use:** Phase 55 by D-01 lock; any future phase that has signed phase-base tags on the source branch.

**Counter-example:** **Squash merge would orphan the signed tags from main's reachable history** — the squashed commit has different SHA from any of the original commits, so phase-47-base etc would still point to the original commits but those commits would no longer be in main's first-parent ancestry (they'd live only in the closed PR's now-deleted branch ref).

**Verification command (post-merge):**
```bash
git tag -v phase-47-base   # MUST exit 0
git tag -v phase-48-base   # MUST exit 0
git tag -v phase-49-base   # MUST exit 0
git tag -v phase-54-base   # MUST exit 0
git merge-base --is-ancestor $(git rev-parse phase-54-base) main && echo "phase-54-base reachable from main"
```

### Pattern 2: Positive-failure CI assertion

**What:** A CI job whose pass condition is "this command MUST exit non-zero". The pattern proves a guardrail is active: if the guard ever silently degrades to permissive, the assertion fires.

**Bash idiom:**
```bash
# Pass when fixture FAILS lint, fail when fixture starts passing lint
# (Use `!` form not `&& exit 1 || exit 0` — the latter masks set -e)
set -e
! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-design-token.tsx
```

**When to use:** Both new CI jobs in Phase 55 (`design-token-check`, `i18next-factory-check`). Also retroactively addresses Phase 59 POLISH-04.

**Why `--max-warnings 0` matters for `bad-design-token.tsx`:** Verified in this session — running `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-design-token.tsx` produces **3 warnings, 0 errors → exit code 0** (because the fixture-specific override at `eslint.config.mjs:286-292` sets severity to `warn`). Without `--max-warnings 0` the assertion would always pass even if the rule were removed entirely. By contrast `bad-vi-mock.ts` produces **1 error → exit code 1** without any flags (its override sets `error`). Both jobs should use `--max-warnings 0` for symmetric, defensive behavior.

### Pattern 3: Single-PR audit trail for CI regression fixes (D-08)

**What:** When CI fails on the merge PR, commit fixes onto the same `DesignV2` branch (the head of the PR). The PR auto-rebuilds. Do NOT branch off DesignV2 to a fix branch and PR back.

**When to use:** Phase 55 plan 1 if any of the 6 contexts fail.

**Why:** Preserves single chronological audit trail; matches D-08 lock; avoids "PR-of-a-PR" review fatigue.

### Anti-Patterns to Avoid

- **`--squash` merge.** Orphans signed annotated tags from main's reachable ancestry. Hard-locked OUT by D-01.
- **`git push --force` to main.** Branch protection has `allow_force_pushes.enabled=false` (verified). Push would be rejected by the server; would also fail `enforce_admins=true`.
- **Disabling branch protection to "unstick" a merge.** Even temporarily. The rollback path (D-03) explicitly prohibits this; use `git revert -m 1 <merge-sha>` instead.
- **Adding the 2 new contexts to required list BEFORE the jobs run once on main.** GitHub treats unknown required contexts as "Expected — Waiting for status to be reported" indefinitely, blocking all subsequent PRs. D-15 sequences this correctly: jobs land on main first (plan 2), THEN protection is updated (plan 3).
- **Bundling new CI jobs into the merge PR.** Conflates "merge DesignV2 history" with "introduce new contracts on main". D-15 already separates these.
- **Using `--no-verify` on the merge commit.** Bypasses commit hooks and signing. Forbidden per CLAUDE.md `<file_changing_tools>` block.
- **Inverting the fixture's `eslint.config.mjs` severity to `error` to skip `--max-warnings 0`.** Would change the fixture's standalone behavior. The fixture is shared with the smoke PR (D-10) which intentionally exercises the same rule against a real component path; the smoke PR needs the fixture's behavior preserved. Use `--max-warnings 0` in the CI job instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wait for all PR checks to settle before recording status | Custom polling script | `gh pr checks <num> --watch` OR `gh pr view <num> --json statusCheckRollup` invoked in a small loop | `gh` already handles auth, pagination, retries, and exposes JSON; rolling a poller invites timeout edge cases |
| Construct the protection JSON | Manual JSON authoring from spec | `gh api ... | jq` of current protection → modify → PUT back | The endpoint REPLACES the entire config (not merges) — see Pitfall §"GitHub branch protection PUT is replace-not-merge". Always round-trip from current state. |
| Detect "no required contexts pending" | Custom rollup logic | `gh pr view --json mergeStateStatus` and check for `BLOCKED` vs `CLEAN` | GitHub already computes this; the enum is documented (see Sources). |
| Verify SSH signatures | Custom verification script | `git tag -v <name>` — must exit 0 with "Good \"git\" signature" | Project already uses this idiom per CLAUDE.md §"Tag signing setup". |
| Wait for CI run on the protection-update PR | sleep + polling | `gh run watch <run-id>` | Native command that streams logs and exits with the workflow's conclusion. |

**Key insight:** Every API the phase touches has a first-class `gh` subcommand or a published JSON-schema endpoint. There is zero need to write any custom code — the phase is a sequence of curl/`gh` invocations against documented APIs, plus a `--no-ff` merge button click and a signed-tag creation.

## Runtime State Inventory

This phase is NOT a rename/refactor/migration. It is a merge + branch-protection + CI-config phase. The standard rename checklist does not apply. However, a parallel inventory of runtime state that MUST survive the merge is useful and is captured here:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Signed annotated tags | `phase-47-base` (SHA `7fc9e756...`, annotated, SSH-signed — verified `git tag -v` Good) | None — verify post-merge they remain reachable from main and `git tag -v` still passes |
| Signed annotated tags | `phase-48-base` (annotated, SSH-signed — verified) | Same |
| Signed annotated tags | `phase-49-base` (annotated, SSH-signed — verified; points to current origin/main HEAD `7fc9e756...`) | Same |
| Signed annotated tags | `phase-54-base` (annotated, SSH-signed — verified; points to `b174815e...` on DesignV2 only) | Verify post-merge that the commit is reachable from main via the merge commit (test: `git merge-base --is-ancestor $(git rev-parse phase-54-base) origin/main` must exit 0) |
| Lightweight tags | `phase-51-base` (commit type, NOT annotated, NOT signed) | None — CONTEXT.md does not list it; preserve as-is; `git tag -v` will continue to fail with "cannot verify a non-tag object" but that's the existing state |
| Branch protection rule | `main` requires 6 contexts: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`; `enforce_admins=true`; `allow_force_pushes=false`; `allow_deletions=false`; `block_creations=false`; `required_conversation_resolution=false`; `required_signatures.enabled=false`; `required_linear_history.enabled=false` | Capture as `protection-before.json` in phase folder; PUT new version `protection-after.json` with 8 contexts |
| Open PRs against main | Verified via `gh pr list --state all --base main` — past smoke PRs (#8-12) all closed with `mergeStateStatus=BLOCKED` (good — proves the gate works historically) | None — for context only |
| Remote `DesignV2` branch ref | Present (111 commits unpushed locally; 222 commits ahead of origin/main) | Push 111 commits, merge, then DELETE per D-04 |
| Workflow runs | Most recent CI run on origin/main HEAD = `25659989275`, conclusion `failure` (Security Scan, Unit Tests, Lint, E2E Tests all failed; type-check passed) — **main is currently in a degraded CI state because main's ci.yml predates the DesignV2 ci.yml shape** | None — the merge brings DesignV2's stable ci.yml shape into main |
| Local `main` branch | 802 commits BEHIND origin/main | Pull/fetch before any merge work; do NOT use stale local main as merge base |
| `.husky/` hooks | Present (per repo-policy CI job); active on every commit | None — preserve; do not use `--no-verify` |
| Deploy workflow trigger | `.github/workflows/deploy.yml` triggers on `workflow_run` of `CI` on `main` with `conclusion == 'success'` | **WARNING: merging DesignV2 → main will trigger production deploy if CI passes.** See Pitfall §"Deploy workflow auto-triggers on main merge". |

**The canonical question for this phase:** After the merge lands and `phase-55-base` is tagged, do all 4 prior signed phase-base tags still `git tag -v` Good AND have their SHAs reachable from main? If yes, the merge correctly preserved provenance.

## Common Pitfalls

### Pitfall 1: GitHub branch protection PUT is replace-not-merge

**What goes wrong:** Calling `gh api -X PUT repos/.../branches/main/protection` with a partial JSON body silently DELETES any field not provided. E.g. supplying only `required_status_checks` would wipe `enforce_admins`, `allow_force_pushes`, etc.

**Why it happens:** Per GitHub REST docs for `PUT /repos/{owner}/{repo}/branches/{branch}/protection`, "Passing new arrays of users and teams replaces their previous values" — the entire request body replaces, not merges. Required top-level fields are `required_status_checks`, `enforce_admins`, `required_pull_request_reviews`, `restrictions`. ([source](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection))

**How to avoid:** Round-trip ALWAYS. Pattern:

```bash
# Step 1: snapshot current state
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > .planning/phases/55-designv2-main-merge-gate-enforcement/protection-before.json

# Step 2: build new body from snapshot, ADDING 2 contexts
jq '
  {
    required_status_checks: {
      strict: .required_status_checks.strict,
      contexts: (.required_status_checks.contexts + ["Design Token Check", "react-i18next Factory Check"])
    },
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews: null,
    restrictions: null,
    required_linear_history: .required_linear_history.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled,
    block_creations: .block_creations.enabled,
    required_conversation_resolution: .required_conversation_resolution.enabled,
    lock_branch: .lock_branch.enabled,
    allow_fork_syncing: .allow_fork_syncing.enabled
  }' \
  .planning/phases/55-designv2-main-merge-gate-enforcement/protection-before.json \
  > .planning/phases/55-designv2-main-merge-gate-enforcement/protection-after.json

# Step 3: PUT it back
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input .planning/phases/55-designv2-main-merge-gate-enforcement/protection-after.json
```

**Note on `required_pull_request_reviews` and `restrictions`:** Current protection has these absent from the GET response (verified — they don't appear in the JSON). They must still be sent as `null` in the PUT body to satisfy the "required field" contract. The GET-response shape and PUT-request shape are NOT byte-identical.

**Warning signs:** If `gh api` returns 200 but the protection appears blank afterwards, you sent a partial body.

### Pitfall 2: GET-response vs PUT-request JSON shape mismatch

**What goes wrong:** The GET response wraps booleans in objects: `"enforce_admins": {"enabled": true}` and `"allow_force_pushes": {"enabled": false}`. The PUT request expects raw booleans: `"enforce_admins": true`, `"allow_force_pushes": false`.

**Why it happens:** GitHub's API designers added `{enabled, url}` wrappers to GET responses for self-discoverability but kept PUT input flat. The endpoint is documented but the asymmetry catches everyone the first time.

**How to avoid:** The `jq` transform in Pitfall 1 already handles this (`.enforce_admins.enabled`, `.allow_force_pushes.enabled`, etc.). If hand-editing, strip the `{enabled: …}` wrappers manually.

**Warning signs:** PUT returns 422 with `"Invalid request"` and no detail — almost always a shape mismatch.

### Pitfall 3: Required-context name must EXACTLY match the job's `name:` value

**What goes wrong:** If `ci.yml` declares `jobs.design-token-check.name: Design-Token Check` (with a hyphen) but branch protection requires `"Design Token Check"` (with a space), GitHub treats the context as "Expected — Waiting for status to be reported" forever, blocking every PR.

**Why it happens:** GitHub matches required contexts by exact string comparison against the workflow's reported check-run name. The check-run name comes from `jobs.<id>.name:` if set, otherwise from `<id>` itself.

**How to avoid:** Use **identical** strings in three places: (a) `.github/workflows/ci.yml` `jobs.<id>.name:`, (b) `protection.json` `required_status_checks.contexts[]`, (c) any verification documentation. The CONTEXT.md D-13 specifies the literal strings: `"Design Token Check"` and `"react-i18next Factory Check"`. The plan should use those verbatim, lowercased only in the job ID:

```yaml
jobs:
  design-token-check:
    name: Design Token Check
    # ...
  i18next-factory-check:
    name: react-i18next Factory Check
    # ...
```

**Empirical verification:** I checked `gh api .../actions/runs/<id>/jobs` against the current `main` run. Job IDs in the YAML become check-run names directly when no `name:` is set (e.g. `type-check` job has `name: type-check` and the check-run name is also `type-check`). Matrix jobs are NOT in the protection list (the `Build` job is not required), so the matrix-context-naming question is moot for this phase.

**Warning signs:** A "real" PR (not the smoke PR) opened after plan 3 hangs in "Expected — Waiting for status to be reported" on the new contexts.

### Pitfall 4: Adding required contexts BEFORE the jobs exist on main

**What goes wrong:** If you add `Design Token Check` to required contexts before the `design-token-check` job has run successfully on a commit reachable from `main`, the next PR opened against main reports the context as "Expected" and blocks merging — but no run will ever report it because no commit in main's history has that job in its `ci.yml`. Every PR is stuck.

**Why it happens:** GitHub considers a required context "satisfied" only when a check-run with that exact name reports `success` on the PR's head commit. The check-run only appears if the workflow file at the PR's head commit defines that job. If the protection update happens before the job is on main, branching off main inherits the no-job state.

**How to avoid:** D-15 already locks this — plan 2 (CI jobs PR) MUST land on main before plan 3 (protection update). Verification: after plan 2 merges, query `gh api repos/.../actions/runs?branch=main&per_page=1 --jq '.workflow_runs[0]'` and confirm both new job names appear in `.jobs[].name`.

**Belt-and-braces verification before running plan 3:** open a throwaway draft PR from a small commit on main; let CI run; confirm the new check-run names appear in `statusCheckRollup`; close the throwaway PR.

**Warning signs:** First post-protection-update PR is stuck "Expected — Waiting for status to be reported" with no run pending.

### Pitfall 5: `git revert -m 1 <merge-sha>` makes re-merging the same branch a 4-step dance

**What goes wrong:** If the DesignV2 merge needs to be reverted (D-03), the obvious reflex is `git revert -m 1 <merge-sha>`. That works for undoing. But then if you want to re-merge DesignV2 later (after fixing whatever motivated the revert), Git will say "Already up to date" because the merge-base computation thinks DesignV2 is already merged.

**Why it happens:** Reverting a merge commit produces a new commit that *undoes* the diff but does NOT change the commit graph. The merge commit still exists in main's history. Git's "already merged" check is based on the graph, not the diff.

**How to avoid:** The full revert-and-re-merge sequence is:
1. `git revert -m 1 <merge-sha>` → creates `revert-of-merge` commit on main
2. (fix whatever motivated the revert on DesignV2)
3. To re-merge: first `git revert <revert-of-merge-sha>` on a new branch → creates `revert-of-revert` commit that re-applies DesignV2's diff
4. Open a new PR with the `revert-of-revert` branch + any additional fix commits → merge as `--no-ff`

**Recommended:** Document this 4-step sequence in `55-SUMMARY.md` so the rollback procedure is durably captured. Alternatively, prefer fixing forward (commit fix to DesignV2 via D-08, push, CI re-runs, merge) over reverting whenever possible.

**Warning signs:** `git merge DesignV2` after a revert says "Already up to date." That's the symptom of the rollback graph trap.

**Reference:** [How to revert a merge commit then merge again](https://dev.to/jbrocher/how-to-revert-a-merge-commit-then-merge-again-hoo), [git-tower.com: How to undo a merge](https://www.git-tower.com/learn/git/faq/undo-git-merge).

### Pitfall 6: Deploy workflow auto-triggers on main merge

**What goes wrong:** `.github/workflows/deploy.yml` is configured with `on.workflow_run.workflows: ["CI"]` + `branches: [main]` + `types: [completed]` + `if: github.event.workflow_run.conclusion == 'success'`. When the merge PR closes and CI runs successfully on main HEAD, `deploy.yml` auto-deploys to production (DigitalOcean droplet).

**Why it happens:** The trigger predates Phase 55 and exists for normal development flow.

**How to avoid (decision for the planner / user):** Pick one of:
1. **Accept the deploy** (default). The merge is intended to ship; production is expected to follow. Document in 55-SUMMARY.md that the merge causes a production deploy and that's expected.
2. **Disable the workflow temporarily.** `gh workflow disable Deploy` before merging; re-enable after. Two-step ceremony; reduces blast radius if the merge has runtime regressions not caught by CI gates.
3. **Plan a deploy window.** Time the merge for a low-traffic window so a regression discovered post-deploy can be reverted (per D-03) with minimal user impact.

**Recommendation:** Surface this choice to the user during plan 1 of execution. CONTEXT.md is silent on it, which is a real gap — the plan should make the decision explicit.

**Warning signs:** Unexpected deploy run starts immediately after the merge.

### Pitfall 7: `bad-design-token.tsx` exits 0 without `--max-warnings 0`

**What goes wrong:** A naive `pnpm exec eslint tools/eslint-fixtures/bad-design-token.tsx && exit 1 || exit 0` always exits 1 (the test for "positive failure" inverted). The fixture produces 3 warnings but 0 errors, so eslint exits 0.

**Why it happens:** Verified empirically in this session — the fixture-specific override at `eslint.config.mjs:286-292` sets `'no-restricted-syntax': ['warn', ...]`, intentionally so the fixture file doesn't break general workspace lint. The general frontend block at line 162 uses `error`, but the per-file override at line 290 wins.

**How to avoid:** Always use `--max-warnings 0` in the CI job invocation:
```bash
! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-design-token.tsx
```

This is also how the root `scripts/lint.mjs` invokes eslint when given args.

**Warning signs:** The `design-token-check` CI job passes when it shouldn't (e.g. if someone deletes the entire `no-restricted-syntax` rule from `eslint.config.mjs`).

### Pitfall 8: Local `main` is 802 commits stale

**What goes wrong:** Computing `git rev-list --count main..DesignV2` returned `1022` initially. After `git fetch origin main`, the count against `origin/main..DesignV2` is `222`. The CONTEXT.md "1022" number is wrong; the actual delta from origin/main is `222` first-parent or `~10000+` if you count merge-flattened commits.

**Why it happens:** Local `main` branch has not been updated since 2026-04-18 (`6fcbfd07`, the same SHA as `merge-base main DesignV2`). Remote main has moved on (now at `7fc9e756...`). The merge-base computation that matters is against `origin/main`, not local `main`.

**How to avoid:** Plan 1's first task should be `git fetch origin` followed by reasoning about `origin/main` not `main`. Do NOT assume local main is current. Do NOT `git push origin main` from a stale local main.

**Warning signs:** Local `git log main` shows older commits than what's on GitHub.

### Pitfall 9: 111 unpushed commits, not 110

**What goes wrong:** CONTEXT.md D-06 says "all 110 unpushed commits". The actual count is `111` (verified `git rev-list --count origin/DesignV2..DesignV2`). Could be a one-off — the new commit `35df6187 docs(55): capture phase context` (from this session) was committed after the CONTEXT.md was generated.

**Why it happens:** Adding new commits between context-gathering and execution is normal; the number drifts.

**How to avoid:** Plan 1 should recompute the count at execution time, not trust CONTEXT.md verbatim. Use the live count in the SUMMARY.

**Warning signs:** None — this is informational, not blocking.

### Pitfall 10: Smoke PR cleanup deletes the head branch but evidence must already be committed

**What goes wrong:** `gh pr close <num> --delete-branch` (D-12) is the cleanup step. If the JSON / PNG evidence isn't committed to the phase folder BEFORE this command, the evidence is gone.

**How to avoid:** Plan 4 ordering must be:
1. Open smoke PR
2. Wait for required contexts to run
3. Confirm `mergeStateStatus=BLOCKED`
4. `gh pr view <num> --json mergeStateStatus,statusCheckRollup > 55-SMOKE-PR-EVIDENCE.json`
5. Manual screenshot of the GitHub UI BLOCKED banner → save as `55-SMOKE-PR-EVIDENCE.png`
6. Commit both evidence files to the phase folder
7. Push the phase-folder commit to main (via a separate small PR, or as part of plan 4 wrap-up)
8. ONLY THEN: `gh pr close <smoke-pr-num> --delete-branch`

**Warning signs:** None — sequencing fix.

### Pitfall 11: `mergeStateStatus` requires GraphQL or the `gh pr view --json` path, NOT the REST `mergeable_state`

**What goes wrong:** The REST API field `mergeable_state` is similar but NOT identical to GraphQL `mergeStateStatus`. They have different value enums. `gh pr view --json mergeStateStatus` works because `gh` uses GraphQL under the hood.

**How to avoid:** Use `gh pr view <num> --json mergeStateStatus,statusCheckRollup` per D-11. Don't reach for `gh api repos/.../pulls/<num>` and look at `mergeable_state` — different enum.

**Reference:** REST values include `clean`, `dirty`, `unstable`, `blocked`, `behind`, `draft`, `unknown` (lowercase). GraphQL values are SCREAMING_CASE: `CLEAN`, `DIRTY`, `UNSTABLE`, `BLOCKED`, `BEHIND`, `DRAFT`, `UNKNOWN`, plus `HAS_HOOKS`. CONTEXT.md D-09 says "mergeStateStatus=BLOCKED" → must use GraphQL path. ([source](https://docs.github.com/en/graphql/reference/enums#mergestatestatus))

**Warning signs:** Evidence JSON has lowercase `blocked` — wrong endpoint was used.

### Pitfall 12: BLOCKED vs UNSTABLE distinction

**What goes wrong:** If a context is FAILING but is NOT in the required-contexts list, the PR returns `mergeStateStatus=UNSTABLE` (not BLOCKED). The smoke PR (D-09) plants violations specifically against `Lint` (raw hex), `Tests` (vi.mock factory), and `Bundle Size Check` — all required. So `BLOCKED` is the expected outcome.

**Why it happens:** GitHub semantics — `BLOCKED` means "required check failing/pending"; `UNSTABLE` means "non-required check failing/pending but merge is allowed (with warning)". ([source](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks))

**How to avoid:** When designing the smoke PR violations, ensure each planted violation maps to a context that is actually in the required-contexts list. The current 6 required: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`. After plan 3 the list becomes 8.

**Warning signs:** Evidence JSON shows `UNSTABLE` not `BLOCKED` → at least one planted violation hit a non-required context.

### Pitfall 13: `enforce_admins=true` does block the UI Merge button, but admins can re-disable protection

**What goes wrong:** Misreading `enforce_admins=true` as "admin cannot bypass at all". Actually, an admin can disable branch protection, merge, then re-enable. The protection is enforcement-only while ON.

**How to avoid:** The phase guardrail (no force-push, no protection bypass, D-03 rollback uses revert not bypass) hangs on **discipline**, not on a technical impossibility. Plan 1 SUMMARY should explicitly state: "no admin-bypass merges were used; protection remained ON throughout".

**Empirical verification:** Past smoke PRs #8-12 all show `mergeStateStatus=BLOCKED` and all were closed (not merged) → discipline has been honored historically. Continue.

**Warning signs:** Audit trail shows protection was briefly OFF during the merge window.

## Code Examples

Verified against the live repo in this session.

### Pre-merge gate parity (D-05)

```bash
# On DesignV2 tip, before push
cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0

pnpm install --frozen-lockfile
pnpm --filter intake-frontend type-check
pnpm --filter intake-backend type-check
pnpm run lint                            # uses scripts/lint.mjs → eslint + turbo
pnpm -C frontend size-limit
pnpm --filter intake-frontend test --run
pnpm --filter intake-backend test --run
```

All five must exit 0 before pushing. This mirrors 4 of 6 required contexts plus the 2 type-check sub-jobs.

### Push (D-06)

```bash
# Verify strict-ancestor relationship
test "$(git rev-list --count origin/DesignV2..DesignV2)" -gt 0 && \
  test "$(git rev-list --count DesignV2..origin/DesignV2)" -eq 0 || \
  { echo "DesignV2 is not strict-ancestor of origin/DesignV2"; exit 1; }

git push origin DesignV2
```

Current count (verified this session): 111 ahead, 0 behind. Plain push succeeds.

### Open merge PR (D-02, D-07)

```bash
gh pr create \
  --base main \
  --head DesignV2 \
  --title "Phase 55: merge DesignV2 → main (v6.4 gate enforcement)" \
  --body "$(cat <<'EOF'
Lands DesignV2 onto main as required by MERGE-01.

## Required contexts (must all be green before merge)
- type-check
- Security Scan
- Lint
- Bundle Size Check (size-limit)
- Tests (frontend)
- Tests (backend)

## Provenance preserved
Merge strategy: --no-ff (D-01) preserves SSH-signed annotated tags:
phase-47-base, phase-48-base, phase-49-base, phase-54-base.

Squash merge would orphan these from main's reachable history.

## Post-merge plan
1. Tag main HEAD as phase-55-base (annotated + SSH-signed)
2. Delete remote DesignV2 branch (D-04; phase-54-base preserves the tip SHA)
3. Plans 2-4 follow: add 2 new CI jobs, expand protection to 8 contexts, smoke-PR verify
EOF
)"
```

### Watch CI run on the merge PR

```bash
PR_NUM=$(gh pr list --head DesignV2 --base main --json number --jq '.[0].number')
gh pr checks "$PR_NUM" --watch
# or
gh pr view "$PR_NUM" --json statusCheckRollup --jq '.statusCheckRollup'
```

### Merge via UI (D-02)

The user (owner, signed in to github.com as alzahrani-khalid) clicks **Merge pull request → Create a merge commit** on the PR page. The CLI alternative `gh pr merge <num> --merge` works too but D-02 specifies UI to exercise the `enforce_admins=true` path via the documented user flow.

### Tag phase-55-base (annotated + signed)

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main
git tag -s -a phase-55-base -m "Phase 55 baseline: DesignV2 → main merge & gate enforcement (MERGE-01, MERGE-02)"
git push origin phase-55-base

# Verify
git tag -v phase-55-base   # must exit 0 with "Good \"git\" signature"
```

`-s` triggers SSH signing per repo config (`gpg.format=ssh`); `-a` makes it annotated (required for signing); the `-m` flag avoids opening an editor.

### Verify prior signed tags survived the merge

```bash
for t in phase-47-base phase-48-base phase-49-base phase-54-base; do
  git tag -v "$t" 2>&1 | head -1
  git merge-base --is-ancestor "$(git rev-parse "$t")" origin/main && \
    echo "  $t reachable from main: YES" || \
    echo "  $t reachable from main: NO (PROBLEM)"
done
```

Expected output: 4× "Good \"git\" signature" + 4× "reachable from main: YES".

### Delete remote DesignV2 (D-04)

```bash
# Sanity: confirm DesignV2 tip is reachable from main
git fetch origin
git merge-base --is-ancestor origin/DesignV2 origin/main || \
  { echo "DesignV2 tip not reachable from main — DO NOT delete"; exit 1; }

# Verify phase-54-base preserves the tip SHA for forensic recovery
test "$(git rev-parse phase-54-base)" = "$(git rev-parse origin/DesignV2)" || \
  echo "phase-54-base SHA differs from DesignV2 tip — note in SUMMARY"

# Delete remote
gh api -X DELETE repos/alzahrani-khalid/Intl-Dossier-V2.0/git/refs/heads/DesignV2

# Prune local remote-tracking ref
git fetch --prune origin
```

Note: as of this session, `phase-54-base` points to `b174815e...` and DesignV2 tip is `35df6187...`. They differ by 5 commits (the v6.4 milestone/docs commits added since phase-54-base was issued). The phase plan must explicitly mention this in SUMMARY: "DesignV2 tip ≠ phase-54-base; the 5 trailing commits are pure docs (v6.4 milestone setup) and are preserved in main via the merge commit."

### Add 2 new CI jobs (plan 2 — `.github/workflows/ci.yml` patch)

Append after the existing `lint:` job block (D-15: separate PR after the merge):

```yaml
  design-token-check:
    name: Design Token Check
    runs-on: ubuntu-latest
    needs: [repo-policy]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Assert design-token fixture fails lint (positive-failure)
        shell: bash
        run: |
          set -e
          ! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 \
            tools/eslint-fixtures/bad-design-token.tsx

  i18next-factory-check:
    name: react-i18next Factory Check
    runs-on: ubuntu-latest
    needs: [repo-policy]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Assert vi.mock fixture fails lint (positive-failure)
        shell: bash
        run: |
          set -e
          ! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 \
            tools/eslint-fixtures/bad-vi-mock.ts
```

The leading `!` and `set -e` together produce the correct exit semantics: bash inverts the eslint exit code, but only if eslint actually ran (set -e catches eslint binary missing).

### Update branch protection (plan 3 — D-16)

```bash
PHASE_DIR=.planning/phases/55-designv2-main-merge-gate-enforcement
mkdir -p "$PHASE_DIR"

# Snapshot
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > "$PHASE_DIR/protection-before.json"

# Compute new body
jq '
  {
    required_status_checks: {
      strict: .required_status_checks.strict,
      contexts: (.required_status_checks.contexts + ["Design Token Check", "react-i18next Factory Check"])
    },
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews: null,
    restrictions: null,
    required_linear_history: .required_linear_history.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled,
    block_creations: .block_creations.enabled,
    required_conversation_resolution: .required_conversation_resolution.enabled,
    lock_branch: .lock_branch.enabled,
    allow_fork_syncing: .allow_fork_syncing.enabled
  }' "$PHASE_DIR/protection-before.json" \
  > "$PHASE_DIR/protection-after.json"

# Apply
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input "$PHASE_DIR/protection-after.json"

# Verify
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --jq '.required_status_checks.contexts'
# Expected: ["type-check","Security Scan","Lint","Bundle Size Check (size-limit)","Tests (frontend)","Tests (backend)","Design Token Check","react-i18next Factory Check"]
```

### Smoke PR with planted violations (plan 4 — D-09, D-10)

The plan must pick a low-risk leaf component path. Recommended (Claude's discretion per CONTEXT.md): a NEW file that imports the fixtures rather than modifying an existing component. E.g. `frontend/src/components/__smoke__/Phase55GateSmoke.tsx`:

```tsx
// Phase 55 MERGE-02 smoke component — proves all 4 gate contexts block.
// DO NOT MERGE THIS BRANCH. Evidence is captured in 55-SMOKE-PR-EVIDENCE.{json,png}.

// Lint violation: raw hex (catches Lint context + Design Token Check)
const planted = { color: '#abcdef' }

// type-check violation: assign string to number
const badType: number = 'this is not a number'

// Tests violation: import the bad-vi-mock fixture into a real test path
// (handled by adding a tests/__smoke__/phase55.test.ts file that imports bad-vi-mock.ts)

// Bundle Size Check violation: import a huge static blob
// (handled by adding a dummy large constant or wide moment.js import to bump bundle past budget)

export const Phase55GateSmoke = (): null => {
  void planted
  void badType
  return null
}
```

The actual component should NOT be wired into any route — it's a smoke file. Then:

```bash
git checkout -b smoke/phase-55-merge-02
# add the smoke file
git add frontend/src/components/__smoke__/Phase55GateSmoke.tsx
git commit -m "smoke(55): plant multi-context violations — DO NOT MERGE"
git push -u origin smoke/phase-55-merge-02

gh pr create \
  --base main \
  --head smoke/phase-55-merge-02 \
  --title "Phase 55 MERGE-02 smoke: prove 8-context gate blocks (DO NOT MERGE)" \
  --body "Plants violations against Lint, type-check, Tests, Bundle Size Check, Design Token Check, react-i18next Factory Check. Expected: mergeStateStatus=BLOCKED."

# Wait for all required contexts to run
PR=$(gh pr list --head smoke/phase-55-merge-02 --json number --jq '.[0].number')
gh pr checks "$PR" --watch

# Capture evidence
gh pr view "$PR" --json mergeStateStatus,statusCheckRollup \
  > .planning/phases/55-designv2-main-merge-gate-enforcement/55-SMOKE-PR-EVIDENCE.json

# Verify mergeStateStatus
jq -e '.mergeStateStatus == "BLOCKED"' \
  .planning/phases/55-designv2-main-merge-gate-enforcement/55-SMOKE-PR-EVIDENCE.json
# Exit 0 = passes; non-zero = re-check planted violations

# (Manual): screenshot the GitHub PR page showing the BLOCKED banner
# Save as .planning/phases/55-designv2-main-merge-gate-enforcement/55-SMOKE-PR-EVIDENCE.png
```

### Cleanup (D-12)

```bash
# After evidence is committed and pushed to main:
gh pr close "$PR" --delete-branch --comment "Evidence captured in 55-SMOKE-PR-EVIDENCE.json + .png. Closing per Phase 55 D-12."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `required_status_checks.contexts: ["foo", "bar"]` (string array) | `required_status_checks.checks: [{context: "foo", app_id: ...}]` (object array with optional app pinning) | GitHub API rolled out the `checks` field ~2021; `contexts` marked "closing down" but still supported | The GET response includes BOTH fields; PUT can use either. This phase uses `contexts` (simpler, no app-pinning needed for our jobs). |
| Squash-only merges to keep main linear | `--no-ff` merge commits when source branch has signed tags to preserve | Per Phase 55 D-01 | Signed tag SHAs stay reachable from main; squash would orphan them. |
| `gh pr merge --auto` | Manual UI merge per D-02 | This phase | Exercises `enforce_admins=true` via the documented user flow |
| `mergeable` (REST, boolean) | `mergeStateStatus` (GraphQL, enum) | GitHub API v4 GraphQL | More granular — distinguishes BLOCKED vs UNSTABLE vs DIRTY |

**Deprecated / outdated:**
- `required_status_checks.contexts` is "closing down" per docs but works — keep using it; switching to `checks[]` is a future deferred concern (not needed for Phase 55).

## Project Constraints (from CLAUDE.md)

Phase 55 is release engineering — most CLAUDE.md visual/RTL/dossier directives do not apply. The applicable constraints:

- **Tech stack constraint**: "Must stay within current stack (React 19, Express, Supabase, TanStack, Tailwind v4) — no framework migrations." → Phase 55 adds zero new packages, satisfies trivially.
- **Backwards compatibility**: "All existing features must continue working after cleanup — no regressions." → The merge is exactly DesignV2 head; if pre-merge gates pass, no behavior changes from what's already on DesignV2.
- **Bilingual constraint**: "Arabic (RTL) and English (LTR) must both work correctly after every change." → No UI changes in this phase. The smoke component is unwired and renders `null`.
- **Database**: "Supabase managed PostgreSQL — migrations via Supabase MCP, no direct DB access changes." → No DB changes.
- **Deployment**: "DigitalOcean droplet with Docker Compose — changes must be deployable via existing pipeline." → See Pitfall 6: the merge will trigger `deploy.yml`. Plan must surface this to the user.
- **Tag signing setup** (CLAUDE.md §Tag signing setup): The `phase-NN-base` annotated + SSH-signed tag convention is mandatory. `git tag -v phase-55-base` must exit 0. Verified the signing setup works in this session (`git tag -v phase-49-base` returned "Good \"git\" signature").
- **GSD Workflow Enforcement** (CLAUDE.md §): "Before using Edit, Write, or other file-changing tools, start work through a GSD command." → This phase is being executed under `/gsd:plan-phase 55`, which satisfies the requirement.
- **Karpathy §Surgical Changes**: "Touch only what you must. Clean up only your own mess." → The two new CI jobs do NOT modify existing jobs. The smoke component is in a new `__smoke__/` folder. Branch protection update preserves all existing fields via the round-trip JSON pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The user will click "Merge pull request" in the GitHub UI (D-02), not run `gh pr merge` | Execution flow | Low — both achieve the same `--no-ff` result; UI is preferred for the audit trail |
| A2 | Production deploy on `deploy.yml` is acceptable as a side-effect of the merge | Pitfall 6 | Medium — if the user wanted to avoid it, plan 1 needs an extra step. **Plan 1 SHOULD surface this choice during execution.** |
| A3 | No PRs from contributors are currently in-flight against `main` | Plan 3 protection update | Low — verified no open PRs against main other than smoke PRs (which are closed). Re-verify before plan 3. |
| A4 | The `Build` matrix job is NOT in the required-contexts list (and won't be) | Pitfall 3 matrix discussion | Low — verified current required contexts have no `Build` entry; D-13 enumerates the 8 final contexts and Build is not among them |
| A5 | `phase-54-base` ≠ DesignV2 tip is acceptable for D-04 | Code Examples §Delete remote DesignV2 | Low — the trailing 5 commits past `phase-54-base` are all phase-55 setup docs; merge preserves them in main's reachable history via the merge commit |
| A6 | `eslint.config.mjs` flat-config severity resolution will not change between now and execution | Pitfall 7 + Pattern 2 | Low — verified empirically in this session; no Phase 55 plan modifies eslint config |
| A7 | A signed `phase-55-base` tag does not need to be issued BEFORE the protection update — it can come after | Sequencing | Low — `phase-NN-base` is a provenance artifact for the merge commit, not a gate; either order works. Recommended after plan 4 (end of phase). |

## Open Questions

1. **Pre-merge sync of local main with origin/main**
   - What we know: Local main is 802 commits behind origin/main. The merge happens on GitHub UI so server-side main is what matters; local main staleness doesn't block the merge itself.
   - What's unclear: Whether the planner / executor should sync local main first as a sanity step. Strictly not required (the merge is server-side).
   - Recommendation: Plan 1's setup task should include `git fetch origin && git checkout main && git pull --ff-only origin main` before any tag verification. Cheap, eliminates a class of subtle confusion later.

2. **Production deploy posture for the merge moment**
   - What we know: `deploy.yml` auto-triggers on successful CI on main (Pitfall 6).
   - What's unclear: Whether the user wants this disabled for the merge window or accepted.
   - Recommendation: Plan 1 should pause and ask the user before clicking Merge. Surface options (1) accept, (2) `gh workflow disable Deploy` before/re-enable after, (3) time-window the merge.

3. **Smoke PR plant location — new file vs modify existing**
   - What we know: D-10 says "import them into a real component path" but Claude's discretion (CONTEXT.md) on the exact file.
   - What's unclear: Whether the user prefers (a) a new `frontend/src/components/__smoke__/Phase55GateSmoke.tsx` (cleanly removable, isolated blast radius — recommended), or (b) modifying an existing leaf component (proves the gate fires on any source file, harder to undo).
   - Recommendation: Use (a). The smoke PR is a proof-of-life, not a production check; an isolated file is reverted in one operation. Plan 4 SHOULD lock this; this RESEARCH.md recommends (a) and Plan 4 can ratify or override.

4. **What happens if Step 2 (`Tests` regression) is hard to fix on DesignV2**
   - What we know: D-08 prescribes commit-fixes-to-DesignV2; D-05 prescribes local pre-flight runs.
   - What's unclear: Failure-mode complexity in 2094 changed files. There may be platform-specific issues (Node version drift, pnpm lockfile changes) that only manifest in CI.
   - Recommendation: Plan 1 should include a CI-failure triage subroutine: if CI red, capture the specific job's logs, fix on DesignV2, push, re-run. Budget 2-3 iterations before escalating to user.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | Plan 1 (PR create), Plan 2 (PR create), Plan 3 (`gh api -X PUT`), Plan 4 (PR create + evidence + close) | ✓ | 2.92.0 | None — required |
| `gh auth` with `repo` + `workflow` + `admin:public_key` + `admin:ssh_signing_key` scopes | All plans | ✓ | scopes verified `gh auth status` | None |
| `git` with SSH signing config | Plan 1 (signed tag); pre-existing `git tag -v` on prior phase tags | ✓ | per CLAUDE.md `~/.gitconfig` setup | None |
| `pnpm` 10.29.1 | Plan 1 local pre-flight (D-05) | ✓ | verified via `package.json packageManager` | None |
| Node.js 22.13.0+ | Plan 1 local pre-flight | ✓ | per CI workflow env | None |
| `jq` | Plan 3 (protection JSON transform) | ✓ (standard on macOS via Homebrew, verified earlier `gh api ... --jq` pattern works) | — | use Python `json` module |
| Network access to github.com | All plans | ✓ | — | None — blocks phase |
| SSH key enrolled as Signing Key on github.com | "Verified" badge on tag (CLAUDE.md §Tag signing setup) | UNKNOWN — was set up for phase-49-base etc, must verify pre-tag | — | If badge missing, tag is still locally verifiable via `~/.ssh/allowed_signers`; UI badge is cosmetic only |

**Missing dependencies with no fallback:** None — all critical tools are present.

**Missing dependencies with fallback:** None.

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`). Phase 55 has unique validation surface because the artifacts are CI configuration + GitHub state, not local code.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (CI-config phase) + smoke vitest/eslint reuse |
| Config file | `.github/workflows/ci.yml` (CI YAML); `eslint.config.mjs` (lint config — unchanged in this phase); `frontend/tests/setup.ts` (vitest setup — unchanged) |
| Quick run command | `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-design-token.tsx && echo "FAIL: should have errored" \|\| echo "OK: positive-failure as expected"` (local smoke for design-token-check job) |
| Full suite command | `pnpm install --frozen-lockfile && pnpm --filter intake-frontend type-check && pnpm --filter intake-backend type-check && pnpm run lint && pnpm -C frontend size-limit && pnpm --filter intake-frontend test --run && pnpm --filter intake-backend test --run` (D-05 local parity) |
| Phase gate | All 4 ROADMAP success criteria met before `/gsd:verify-work`: (1) `git log main --oneline` shows DesignV2 history merged; (2) `pnpm type-check && pnpm lint && pnpm -C frontend size-limit` all 0 on post-merge main; (3) `gh pr view <smoke-num> --json mergeStateStatus` = `BLOCKED`; (4) `gh api ... protection --jq '.required_status_checks.contexts | length'` = 8 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MERGE-01 | DesignV2 history reachable from main via merge commit | integration | `git merge-base --is-ancestor $(git rev-parse origin/DesignV2 2>/dev/null \|\| git rev-parse phase-54-base) origin/main && echo MERGED` | ✅ existing git tooling |
| MERGE-01 | All 6 required v6.3 contexts exit 0 on the merge PR | integration | `gh pr view <merge-pr-num> --json statusCheckRollup --jq '.statusCheckRollup \| map(select(.name \| IN("type-check","Lint","Tests (frontend)","Tests (backend)","Bundle Size Check (size-limit)","Security Scan"))) \| map(.conclusion) \| unique'` should equal `["SUCCESS"]` | ✅ |
| MERGE-01 | Local pre-flight parity passes | integration | `pnpm install --frozen-lockfile && pnpm --filter intake-frontend type-check && pnpm run lint && pnpm -C frontend size-limit && pnpm test` | ✅ |
| MERGE-01 | All 4 SSH-signed phase-base tags survive merge | integration | `for t in phase-47-base phase-48-base phase-49-base phase-54-base; do git tag -v "$t" \|\| exit 1; done` | ✅ |
| MERGE-02 | Smoke PR returns `mergeStateStatus=BLOCKED` | integration | `gh pr view <smoke-num> --json mergeStateStatus --jq '.mergeStateStatus == "BLOCKED"'` returns `true` | ✅ |
| MERGE-02 | All 8 required contexts present on main protection | integration | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection --jq '.required_status_checks.contexts \| length'` returns `8` | ✅ |
| MERGE-02 | Both new CI jobs run green on main | integration | `gh api repos/.../actions/workflows/ci.yml/runs?branch=main&per_page=1 --jq '.workflow_runs[0].id' \| xargs -I{} gh api repos/.../actions/runs/{}/jobs --jq '.jobs \| map(select(.name \| IN("Design Token Check","react-i18next Factory Check"))) \| map(.conclusion) \| unique'` returns `["success"]` | ✅ |
| MERGE-02 | Positive-failure CI assertion fires locally | unit | `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-design-token.tsx; ! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-vi-mock.ts` (both must succeed via `!`) | ✅ |

### Sampling Rate
- **Per task commit:** Each plan's commit should run the relevant local pre-flight (D-05 for plan 1; eslint positive-failure local check for plan 2; protection JSON dry-validate via `jq -e` for plan 3; mergeStateStatus check for plan 4).
- **Per wave merge:** N/A — this is a sequential phase, not waved.
- **Phase gate:** All 4 ROADMAP success criteria pass via the commands above before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] No new test files needed — this phase exercises existing infrastructure
- [ ] No new test framework setup — vitest + eslint + size-limit already in place
- [ ] Smoke artifacts (`55-SMOKE-PR-EVIDENCE.json/.png`, `protection-before.json`, `protection-after.json`) are EVIDENCE not tests — produced by plan 4 + plan 3

*Existing test infrastructure covers all phase requirements.*

## Security Domain

`security_enforcement` not explicitly set in `.planning/config.json` (treat as enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partial | `gh auth status` already shows token-based auth with keyring storage; scope-limited |
| V3 Session Management | no | No web sessions in this phase |
| V4 Access Control | yes | Branch protection `enforce_admins=true`; `allow_force_pushes=false`; `allow_deletions=false` — all preserved across the PUT |
| V5 Input Validation | partial | `protection-after.json` is validated by GitHub before applying — but Pitfall 1/2 are the real validation surface |
| V6 Cryptography | yes | SSH-signed annotated tags (Ed25519) — handled by `git tag -s -a`, never hand-rolled |
| V14 Configuration | yes | `.github/workflows/ci.yml` changes are config; reviewed via PR (plan 2 is its own reviewable PR per D-15) |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Branch protection accidentally weakened by partial PUT body | Tampering | Round-trip JSON pattern (Pitfall 1) — snapshot `protection-before.json`, transform, PUT; commit both files for audit |
| Force-push to main bypasses gates | Tampering | `allow_force_pushes.enabled=false` (verified); plus repo-policy CI job blocks committed env files / build artifacts |
| Unsigned tag passed off as signed | Spoofing | `git tag -v` exit code; CLAUDE.md tag signing setup requires SSH key in `~/.ssh/allowed_signers` |
| Admin bypass merging without protection | Elevation of Privilege | `enforce_admins=true`; CONTEXT.md guardrails forbid disabling protection; audit via PR + commit history |
| Secret leakage through committed env files | Information Disclosure | Existing `repo-policy` CI job blocks tracked env files; this phase does not add any env files |
| Smoke PR planted violations accidentally merged | Tampering | `mergeStateStatus=BLOCKED` is the test that proves they CAN'T be merged; plus D-12 cleanup deletes the branch |

## Sources

### Primary (HIGH confidence)
- Live `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` — current 6 required contexts, all booleans, `app_id` 15368 (GitHub Actions app); captured this session.
- Live `gh api repos/.../actions/runs/25659989275/jobs` — actual job names from most recent main CI run.
- Live `gh pr list ... --json mergeStateStatus` — past smoke PRs #8-12 all `BLOCKED`; confirms enum value empirically.
- `git rev-list --count`, `git tag -v`, `git rev-parse` outputs — branch state and tag verification, all captured this session.
- Local `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-design-token.tsx` and `bad-vi-mock.ts` exit codes (0 vs 1) — positive-failure mechanics verified empirically.
- `.github/workflows/ci.yml` (DesignV2 HEAD) and remote `main` branch's `ci.yml` (via `gh api contents`) — confirmed job-name → context-name mapping AND the diff between branches.
- `.planning/phases/55-designv2-main-merge-gate-enforcement/55-CONTEXT.md` — locked decisions D-01..D-16.
- `eslint.config.mjs` — fixture-specific override severity at lines 286-292 (`warn` not `error`).

### Secondary (MEDIUM confidence)
- [GitHub REST API — Update branch protection](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection) — JSON body shape, replace-not-merge semantics, required fields, `contexts` vs `checks` distinction.
- [GitHub GraphQL — MergeStateStatus enum](https://docs.github.com/en/graphql/reference/enums#mergestatestatus) — enum values and their meanings.
- [GitHub Docs — Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks) — BLOCKED vs UNSTABLE distinction.

### Tertiary (LOW confidence — used only for cross-verification)
- [How to revert a merge commit then merge again — DEV community](https://dev.to/jbrocher/how-to-revert-a-merge-commit-then-merge-again-hoo) — Pattern 5 / Pitfall 5 (revert-then-re-merge dance).
- [git-tower.com — How to undo a merge](https://www.git-tower.com/learn/git/faq/undo-git-merge) — `git revert -m 1` mechanics for merge commits.
- [GitHub Community Discussion #26822 — Status check for matrix jobs](https://github.com/orgs/community/discussions/26822) — context naming with matrix strategies (Pitfall 3 / focus area 5; partially answered, confirmed via empirical check that current phase's required contexts have no matrix entries).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified working in this session against the live repo
- Architecture: HIGH — D-01..D-16 are locked; no architectural choices remain
- Pitfalls: HIGH — 13 pitfalls documented, 8 of them with empirical verification in this session, 5 with explicit doc citations
- Validation: HIGH — all 4 ROADMAP success criteria have automated verification commands

**Research date:** 2026-05-17
**Valid until:** 2026-06-15 — GitHub API surfaces stable; branch protection format unlikely to change in 30 days; eslint config locked for this milestone. Re-verify if Phase 55 execution is deferred past v6.4 ship.
