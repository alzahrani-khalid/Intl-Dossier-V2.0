# Phase 55: DesignV2 → Main Merge & Gate Enforcement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 55-DesignV2 → Main Merge & Gate Enforcement
**Areas discussed:** Merge strategy, Pre-merge push & verify sequence, Smoke PR scope for MERGE-02, Branch protection re-config

---

## Merge Strategy

### Q1 — How should DesignV2 be merged into main?

| Option | Description | Selected |
|--------|-------------|----------|
| Merge commit (`--no-ff`) | Preserves all 111 remote commits + phase-base tag SHAs (phase-47/48/49-base SSH-signed) + per-phase commit history. main HEAD becomes a merge commit. Tags survive verbatim. | ✓ |
| Squash merge | Collapses 111 commits into one on main. Loses individual phase commits + orphans signed phase-base tags from main's reachable history. Cleanest main log but destructive to tag provenance. | |
| Fast-forward (rebase + FF push) | main pointer moves directly to DesignV2 HEAD. Possible because origin/main is ancestor of origin/DesignV2 (1021/111 linear). Preserves tags but main's protection (no force-push) blocks FF via PR — needs admin override. | |

**User's choice:** Merge commit (--no-ff)
**Notes:** Tag preservation is the decisive factor — phase-47/48/49-base are SSH-signed annotated and reachability from main must survive.

### Q2 — Who performs the merge action and via what channel?

| Option | Description | Selected |
|--------|-------------|----------|
| PR via gh CLI by user | Open PR, all 6 required checks run, user clicks 'Merge pull request' (creates merge commit). enforce_admins=true so even owner respects checks. Full audit trail in PR. | ✓ |
| PR via gh CLI, gh merge by Claude | Claude runs `gh pr merge <num> --merge` after checks green. Faster but loses human approval step. Same merge-commit outcome. | |
| Local merge + push to main | git checkout main && git merge --no-ff DesignV2 && git push. Bypasses PR review + CI gate verification. Branch protection may reject. Not recommended. | |

**User's choice:** PR via gh CLI by user
**Notes:** Human approval step preserved; audit trail in PR.

### Q3 — Rollback plan if post-merge main breaks?

| Option | Description | Selected |
|--------|-------------|----------|
| Revert merge commit | `git revert -m 1 <merge-sha>` on main + push. Preserves history, undoes feature. Standard post-incident pattern. | ✓ |
| Hot-fix forward only | No revert; fix forward via new PRs. Cleaner history but risks compounding breakage. | |
| Reset main to pre-merge SHA | Force-push main back. Destructive, blocked by branch protection. Last resort only. | |

**User's choice:** Revert merge commit

### Q4 — Post-merge DesignV2 branch disposition?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete remote DesignV2 | After merge lands, `gh api -X DELETE repos/.../git/refs/heads/DesignV2`. Future v6.4 phases (56-59) branch off main. Tag phase-54-base preserves the historic tip. | ✓ |
| Keep DesignV2 as archive branch | Leave it for historic reference. Adds branch list noise. | |
| Rename to archive/designv2 | Rename + protect read-only. More ceremony than value given tags already mark history. | |

**User's choice:** Delete remote DesignV2

---

## Pre-Merge Push & Verify

### Q5 — Local verification depth before pushing 110 unpushed DesignV2 commits?

| Option | Description | Selected |
|--------|-------------|----------|
| Full local gate parity | Run `pnpm type-check && pnpm lint && pnpm size-limit && pnpm test` locally before push. Mirrors all 4 required CI contexts. | ✓ |
| Quick triage only | Run `pnpm type-check && pnpm lint` only. Skip size-limit + tests. | |
| Skip — let CI verify | Push and let all 6 CI contexts run on the merge PR. | |

**User's choice:** Full local gate parity

### Q6 — Push shape for 110 unpushed commits?

| Option | Description | Selected |
|--------|-------------|----------|
| Single push of all 110 | `git push origin DesignV2`. CI runs once on final tip. Branch protection on main doesn't apply to DesignV2 branch — push is unconstrained. | ✓ |
| Force-push with-lease if conflict | `git push --force-with-lease origin DesignV2` only if remote has diverged. Currently remote is strict ancestor so plain push works. | |
| Open the merge PR before pushing | Sequence inverted. PR can't open until DesignV2 is pushed. Not viable. | |

**User's choice:** Single push of all 110

### Q7 — What gate must the merge PR show green BEFORE clicking Merge?

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 required contexts green | type-check + Security Scan + Lint + Bundle Size Check + Tests (frontend) + Tests (backend) all green. Matches main's branch protection exactly. | ✓ |
| 4 v6.3 gates green; Tests/Security as informational | Insist on type-check + Lint + Bundle Size Check + i18next-factory-equivalent; accept Tests/Security advisory. | |
| All 6 green + manual e2e sanity | Add a manual Playwright run against staging before merge. | |

**User's choice:** All 6 required contexts green
**Notes:** Manual e2e is Phase 57 D-23 ownership; not absorbed into Phase 55.

### Q8 — If CI surfaces a regression on the merge PR, fix path?

| Option | Description | Selected |
|--------|-------------|----------|
| Fix on DesignV2 directly | Commit fixes onto DesignV2 (already the PR source). Push; CI re-runs; merge when green. Single-PR audit trail. | ✓ |
| Branch fix-* off DesignV2, PR back, then merge | Two-PR pattern. Heavier ceremony for a closure phase. | |
| Abort merge PR, defer to a follow-up phase | Blocks phases 56-59 which depend on 55. Avoid unless block is structural. | |

**User's choice:** Fix on DesignV2 directly

---

## Smoke PR Scope for MERGE-02

### Q9 — How many smoke PRs to prove gate enforcement on main?

| Option | Description | Selected |
|--------|-------------|----------|
| Single multi-violation PR | One PR introducing raw hex (D-09 Lint) + vi.mock factory regression (Tests) + bundle bloat + type error. One `mergeStateStatus=BLOCKED` proves multiple contexts at once. | ✓ |
| One PR per gate context | 4 separate PRs, one per v6.3-introduced gate. 4× CI cost + 4× cleanup. | |
| 2 PRs split by domain | Lint+type-check in one (build-time), Tests+Bundle in other (runtime). Compromise. | |

**User's choice:** Single multi-violation PR

### Q10 — Which specific violations to plant in the smoke PR fixture file(s)?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing bad-* fixtures | POLISH-04 (Phase 59) already needs bad-design-token.tsx + bad-vi-mock.ts wired as CI positive-failure assertions. Smoke PR imports those existing fixtures into a real component path. | ✓ |
| Fresh inline violations | Add raw `#ff0000` literal to a real component + break a real vi.mock call. Risk of accidentally merging if cleanup botched. | |
| Synthetic test file only | New file containing all violations. Isolated, easy cleanup. Doesn't prove gates catch violations in real component paths. | |

**User's choice:** Reuse existing bad-* fixtures
**Notes:** Confirmed location: `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts`. Also closes Phase 59 POLISH-04 partially.

### Q11 — Evidence capture for MERGE-02 success criterion #3?

| Option | Description | Selected |
|--------|-------------|----------|
| JSON artifact + screenshot | Commit `55-SMOKE-PR-EVIDENCE.json` (`gh pr view --json mergeStateStatus,statusCheckRollup`) + `55-SMOKE-PR-EVIDENCE.png` screenshot of BLOCKED status. Machine + human readable. | ✓ |
| JSON only | `gh pr view` JSON committed; no screenshot. | |
| URL reference only | Link to GitHub PR URL in SUMMARY.md. PRs can be deleted; reference rots. | |

**User's choice:** JSON artifact + screenshot

### Q12 — Smoke PR cleanup?

| Option | Description | Selected |
|--------|-------------|----------|
| Close + delete branch | After evidence captured, `gh pr close <num> --delete-branch`. Evidence lives in committed JSON+screenshot. | ✓ |
| Close, keep branch | PR closed but smoke-fixture branch lingers. Pollutes branch list. | |
| Leave open as living proof | PR stays open indefinitely showing BLOCKED. Clutters PR list. | |

**User's choice:** Close + delete branch

---

## Branch Protection Re-Config

### Q13 — Does main branch protection need explicit new contexts, or do current 6 satisfy criterion #4?

| Option | Description | Selected |
|--------|-------------|----------|
| Accept current 6 | Lint subsumes D-09 design-token rule per v6.3 fold. Tests subsumes react-i18next factory regression. type-check + Bundle Size Check explicit. Criterion #4 met without protection change. | ✓ (combined) |
| Add 'Design Token Check' as separate context | Split D-09 out of Lint into its own GitHub Actions job + add to required contexts. Reverses v6.3 D-09 fold. | ✓ (combined) |
| Add 'react-i18next Factory Check' as separate context | Dedicated job verifying vi.mock factory. Same trade-off. | ✓ (combined) |

**User's choice:** "all of the above" — keep current 6 AND add 2 new explicit contexts = 8 total required contexts.
**Notes:** Reverses v6.3 D-09 fold-into-Lint decision; rationale = maximum gate-failure attribution clarity. The reversal must be explicitly documented in 55-SUMMARY.md so future audits don't re-fold.

### Q14 — How to wire the 2 new contexts in CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate jobs in ci.yml | Add `design-token-check` + `i18next-factory-check` jobs to `.github/workflows/ci.yml`. Clean failure attribution. Reuse `tools/eslint-fixtures/*` as positive-failure assertions (closes POLISH-04 partially). | ✓ |
| Composite job with matrix | Single job, matrix over [design-token, i18next-factory] strategies. Harder failure isolation. | |
| Reusable workflow | Extract into callable workflow. Most ceremony; useful if many gates needed long-term. | |

**User's choice:** Separate jobs in ci.yml

### Q15 — Sequence — when to add the 2 new contexts relative to the DesignV2 merge?

| Option | Description | Selected |
|--------|-------------|----------|
| After merge lands | (1) Merge DesignV2 → main. (2) Add jobs to ci.yml via separate PR. (3) Update branch protection via gh api. (4) Smoke PR exercises 8-context gate. | ✓ |
| Pre-merge on DesignV2 | Add the 2 jobs on DesignV2 before merging. Risk: new jobs may surface latent failures that block the merge. | |
| Bundle into the merge PR itself | Add jobs in the DesignV2 → main PR commits. Conflates concerns. | |

**User's choice:** After merge lands

### Q16 — Who updates the branch protection contexts list?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude via gh api script | Claude runs `gh api -X PUT repos/.../branches/main/protection --input protection.json`. Scripted, repeatable, auditable. | ✓ |
| User via GitHub web UI | User navigates Settings → Branches → Edit rule and ticks new contexts. Manual; not auditable in repo. | |
| Terraform / IaC | Codify protection in IaC. Major scope expansion. | |

**User's choice:** Claude via gh api script

---

## Claude's Discretion

- Merge commit message format (follow existing repo convention from `git log` precedent)
- PR titles + labels for both merge PR and smoke PR (descriptive, aligned with v6.4 milestone naming)
- Exact filename for the smoke PR's plant-violation component path (low-risk leaf component)
- `protection.json` exact JSON shape (derive from current `gh api repos/:owner/:repo/branches/main/protection` baseline + add 2 new contexts)

## Deferred Ideas

- Terraform / IaC for branch protection — deferred (scope expansion; its own phase if/when v7.x picks IaC direction)
- Reusable workflow extraction (`.github/workflows/check-gate.yml`) — deferred in favor of inline jobs; revisit if more gates accumulate over v7.0+
- Live Playwright run as additional merge gate — explicitly out of scope per Phase 57 D-23 ownership
- e2e.yml as required context — kept separate per v6.4 milestone scope; revisit when E2E flakiness budget is established
