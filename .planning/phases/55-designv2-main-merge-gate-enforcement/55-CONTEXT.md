# Phase 55: DesignV2 → Main Merge & Gate Enforcement - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Land the DesignV2 branch onto `main` with all v6.3 quality gates green, then prove enforcement is live on `main` via a smoke PR that captures `mergeStateStatus=BLOCKED`. Includes wiring two new explicit CI gate contexts (Design Token Check, react-i18next Factory Check) into `main` branch protection AFTER the merge lands.

Scope anchors (from ROADMAP.md success criteria):
1. `git log main --oneline` shows DesignV2 history merged with no manual cherry-picks
2. `pnpm type-check`, `pnpm lint`, `Bundle Size Check (size-limit)` all exit 0 on post-merge `main` HEAD
3. Smoke PR against `main` with intentional violation returns `mergeStateStatus=BLOCKED` from `gh pr view --json`
4. The four v6.3-introduced gate contexts appear as required contexts on `main` branch protection

</domain>

<decisions>
## Implementation Decisions

### Merge Strategy
- **D-01:** Merge commit (`--no-ff`) — preserves all 111 remote commits + phase-base tag SHAs (`phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base`) which are SSH-signed annotated. Squash would orphan signed tags from main's reachable history.
- **D-02:** Merge channel = PR via `gh pr create`; user clicks "Merge pull request" in GitHub UI (creates merge commit). `enforce_admins=true` so owner respects required checks. Full audit trail on the PR.
- **D-03:** Rollback plan = `git revert -m 1 <merge-sha>` on `main` + push. Documented in phase SUMMARY with the exact command and decision criteria. No force-push, no protection bypass.
- **D-04:** Post-merge DesignV2 disposition = delete remote branch (`gh api -X DELETE repos/.../git/refs/heads/DesignV2`). Future phases 56-59 branch off `main`. `phase-54-base` SSH-signed tag preserves the historic DesignV2 tip.

### Pre-Merge Push & Verify
- **D-05:** Local verification depth BEFORE push = full gate parity. Run `pnpm type-check && pnpm lint && pnpm size-limit && pnpm test` locally on DesignV2 tip. Mirrors 4 of 6 required CI contexts. Catches regressions before consuming CI minutes.
- **D-06:** Push shape = single `git push origin DesignV2` of all 110 unpushed commits. Remote is strict ancestor (110 ahead, 0 behind) so plain push works without `--force-with-lease`.
- **D-07:** Merge PR gate requirement = ALL 6 required contexts green before clicking Merge — `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`. Matches main's existing branch protection contract exactly.
- **D-08:** CI regression fix path = commit fixes onto DesignV2 directly (same PR source); push; CI re-runs; merge when green. Single-PR audit trail. No fix-branch-off-DesignV2 ceremony.

### Smoke PR (MERGE-02)
- **D-09:** PR count = single multi-violation PR. Plant raw hex (Lint/D-09), `vi.mock` factory regression (Tests), bundle bloat (Bundle Size Check), and type error (type-check). One `mergeStateStatus=BLOCKED` proves multiple gate contexts at once.
- **D-10:** Violations source = reuse existing fixtures `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts`. Smoke PR imports them into a real component path so CI exercises them against `main`. Also closes the Phase 59 POLISH-04 "positive-failure CI assertion" gap as a byproduct.
- **D-11:** Evidence artifact = commit `55-SMOKE-PR-EVIDENCE.json` (output of `gh pr view <num> --json mergeStateStatus,statusCheckRollup`) AND `55-SMOKE-PR-EVIDENCE.png` (screenshot of BLOCKED status banner) to the phase folder. Machine-readable + human-readable durable proof.
- **D-12:** Smoke PR cleanup = `gh pr close <num> --delete-branch` after evidence captured. Evidence persists in the committed JSON + PNG artifacts; no lingering proof-of-life PRs.

### Branch Protection Re-Config
- **D-13:** Final required contexts on `main` = **8 contexts** = current 6 (`type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`) PLUS 2 new explicit gates (`Design Token Check`, `react-i18next Factory Check`). This reverses the v6.3 D-09 fold-into-Lint decision; rationale: user wants maximum gate-failure attribution clarity, not minimum CI yaml.
- **D-14:** CI wiring for new contexts = 2 separate jobs in `.github/workflows/ci.yml` (`design-token-check`, `i18next-factory-check`). Each runs the specific ESLint rule / fixture assertion in isolation against `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts` as positive-failure assertions.
- **D-15:** Sequence = (1) merge DesignV2 → main, (2) separate PR adds new ci.yml jobs + smoke-verifies they run green on `main`, (3) `gh api -X PUT repos/.../branches/main/protection` adds 2 new required contexts, (4) smoke PR exercises full 8-context gate. Clean causality: stabilize main first, then expand contracts.
- **D-16:** Branch protection update actor = Claude runs `gh api -X PUT repos/.../branches/main/protection --input protection.json`. Scripted, repeatable, the input JSON committed to phase folder as audit trail.

### Claude's Discretion
- Merge commit message format (Claude follows existing repo convention from `git log` precedent)
- PR title/labels for both the merge PR and the smoke PR (Claude uses descriptive titles aligned with v6.4 milestone naming)
- Exact filename for the smoke PR's plant-violation component path (Claude picks a low-risk leaf component)
- `protection.json` exact JSON shape (Claude derives from current `gh api repos/:owner/:repo/branches/main/protection` baseline + adds the 2 new contexts)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & milestone scope
- `.planning/REQUIREMENTS.md` §"Merge — DesignV2 → main gate enforcement" — locks MERGE-01 + MERGE-02 acceptance text
- `.planning/ROADMAP.md` §"Phase 55: DesignV2 → Main Merge & Gate Enforcement" — 4 success criteria are the test oracle
- `.planning/notes/v6.4-milestone-shape.md` — origin of v6.4 scope including the DesignV2 merge decision
- `.planning/milestones/v6.3-MILESTONE-AUDIT.md` §7 — carryover entry "DesignV2 → main merge sequence (then push triggers v6.3 enforcement on main contexts)"

### v6.3 gate definitions (must remain green post-merge)
- `eslint.config.mjs` — Lint config; D-05 design-token selectors at `error` workspace-wide; D-09 design-token rule folded into `Lint` context (being un-folded by D-13)
- `.size-limit.json` (or equivalent) — Bundle Size Check budgets, including React vendor 285 KB ceiling from Phase 53
- `frontend/src/test/setup.ts` (lines 46-50) — `vi.mock("react-i18next")` factory with `...actual` spread (TEST-01)
- `tools/eslint-fixtures/bad-design-token.tsx` — positive-failure fixture for design-token gate (reused in smoke PR + new `design-token-check` CI job)
- `tools/eslint-fixtures/bad-vi-mock.ts` — positive-failure fixture for react-i18next factory gate (reused in smoke PR + new `i18next-factory-check` CI job)

### Branch protection baseline
- Output of `gh api repos/:owner/:repo/branches/main/protection` — current 6 required contexts: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`; `enforce_admins=true`; `allow_force_pushes=false`; `allow_deletions=false`

### CI workflow
- `.github/workflows/ci.yml` — where the 2 new gate jobs land
- `.github/workflows/deploy.yml` — verify merge does not trigger unintended deploy
- `.github/workflows/e2e.yml` — confirm e2e is not in required contexts (kept separate per v6.4 scope)

### Tag provenance (must survive merge)
- `phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base` — SSH-signed annotated tags. `git tag -v <name>` must continue to exit 0 + print `Good "git" signature` after merge. Tag SHAs must remain reachable from `main` via the merge commit.

### Project guardrails
- `CLAUDE.md` §"Visual Design Source of Truth" + §"Deployment Configuration" — merge must not regress any of these

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tools/eslint-fixtures/bad-design-token.tsx`** — already exists, currently used informally; can be promoted to a `design-token-check` CI job's positive-failure assertion (also closes Phase 59 POLISH-04 partially)
- **`tools/eslint-fixtures/bad-vi-mock.ts`** — same pattern for the `i18next-factory-check` job
- **`gh` CLI** — `gh pr view --json mergeStateStatus,statusCheckRollup` is the verifier for criterion #3
- **Phase-base tag pattern** — Phase 53 already established the annotated + SSH-signed convention; Phase 55 should issue `phase-55-base` after merge lands (consistent with v6.2/v6.3 closing pattern)

### Established Patterns
- **PR-based merges with `enforce_admins=true`** — branch protection respected even by owner; no admin bypass needed or desired
- **D-09 fold into Lint context (being reversed)** — v6.3 chose to fold the design-token rule into the existing `Lint` job; Phase 55 D-13 reverses this for failure-attribution clarity. Document the reversal explicitly in SUMMARY so future audits don't re-fold.
- **Positive-failure fixtures (POLISH-04 pattern)** — fixtures committed to repo whose CI assertion is "running this fixture MUST fail". Aligns Phase 55's new CI jobs with Phase 59's planned closure.

### Integration Points
- **`.github/workflows/ci.yml`** — add 2 new jobs (after the existing `Lint` + `type-check` + `Tests` job blocks)
- **`gh api -X PUT .../branches/main/protection`** — adds 2 new required contexts. Input JSON committed to phase artifact for auditability.
- **Phase 56/57/58/59 unblocked** — once Phase 55 lands, all four downstream phases can plan against `main` directly (Phase 56 + 57 in parallel per STATE.md)

### Anti-patterns to avoid
- **No squash merge** — orphans signed phase-base tags from `main` reachable history (D-01)
- **No force-push to main** — branch protection blocks it; bypass requires disabling protection, which is the rollback nightmare
- **No `--no-verify` on the merge commit** — signing/hooks intact per repo convention
- **No bundling new CI jobs into the merge PR itself** — conflates merge correctness with new gate validity (D-15)

</code_context>

<specifics>
## Specific Ideas

- **Smoke PR plant location**: import the `bad-*` fixtures into a real but low-risk leaf component path (Claude picks during planning). The fixtures themselves should NOT be moved out of `tools/eslint-fixtures/`.
- **Evidence artifacts naming**: `55-SMOKE-PR-EVIDENCE.json` + `55-SMOKE-PR-EVIDENCE.png` (consistent with other phase evidence file conventions).
- **`protection.json` audit artifact**: commit the input + output JSON of the `gh api -X PUT` call to phase folder for auditability.
- **Reversal rationale documented in SUMMARY**: the D-13 un-fold of D-09 should be explicitly justified in 55-SUMMARY.md so v6.5+ audits don't ping-pong the decision.
- **Phase-55-base tag**: issue annotated + SSH-signed `phase-55-base` after merge + protection update land, per v6.2/v6.3 closing convention. `git tag -v phase-55-base` must exit 0.

</specifics>

<deferred>
## Deferred Ideas

- **Terraform / IaC for branch protection** — codifying protection rules in IaC was raised as an option but deferred (scope expansion; belongs in its own phase if/when v7.x decides on infra-as-code direction)
- **Reusable workflow extraction** (`.github/workflows/check-gate.yml`) — considered for the new CI jobs but deferred in favor of inline jobs in `ci.yml`; revisit if more gates accumulate over v7.0+
- **Live Playwright run as additional merge gate** — explicitly out of scope per Phase 57 D-23 ownership; do not absorb into Phase 55
- **e2e.yml as required context** — kept separate per v6.4 milestone scope; revisit when E2E flakiness budget is established

</deferred>

---

*Phase: 55-DesignV2 → Main Merge & Gate Enforcement*
*Context gathered: 2026-05-17*
