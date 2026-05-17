---
phase: 49
plan: 03
type: execute
wave: 3
depends_on: [49-01, 49-02]
files_modified:
  - .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md
  - .planning/STATE.md
  - .planning/ROADMAP.md
autonomous: false
requirements: [BUNDLE-03]
requirements_addressed: [BUNDLE-03, BUNDLE-04]
must_haves:
  truths:
    - 'D-10: `Bundle Size Check (size-limit)` (verbatim, casing-sensitive — matches the `name:` field at `.github/workflows/ci.yml:271`) is in `required_status_checks.contexts` on `main` branch protection alongside `Lint`, `type-check`, `Security Scan`'
    - 'D-10 + Phase 47/48 carry-forward: `enforce_admins: true` preserved; no other contexts dropped'
    - 'D-11: size-limit native fail-on-exceed is the BUNDLE-03 enforcement — any measured chunk pushed above its locked ceiling rejects. No custom baseline-delta calculator added. Per-chunk slack between measured and ceiling is the documented absorption budget.'
    - 'D-12: Two smoke PRs prove the gate BLOCKS. PR-A pushes Initial JS > 450 KB via an eager d3 import in App.tsx → `Bundle Size Check (size-limit)` bucket=fail → `mergeStateStatus=BLOCKED`. PR-B pushes one sub-vendor chunk over its ceiling via `export * from "@dnd-kit/sortable"` re-export → same proof. Both PRs are closed with `gh pr close --delete-branch` BEFORE the phase SUMMARY.'
    - 'D-14: Phase-wide audit — `git diff phase-49-base..HEAD` shows zero net-new `eslint-disable` / `@ts-(ignore|expect-error|nocheck)` directives in `frontend/src` + `backend/src`; zero `.size-limit.json` ceilings RAISED vs the original phase-49-base baseline values (Plan 01 lowered every ceiling per D-01..D-03; Plan 02 added new entries; nothing should have raised)'
    - '`49-EXCEPTIONS.md` exists with three D-14 PASS rows + smoke PR URLs + final phase verdict'
    - 'STATE.md updated: Phase 49 = Complete (3/3 plans); v6.2 milestone = ready to ship; ROADMAP.md updated similarly'
  artifacts:
    - path: '(GitHub repo settings — branch protection on `main`)'
      provides: '`required_status_checks.contexts` includes `Bundle Size Check (size-limit)`; `enforce_admins.enabled=true`'
      verify: 'gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection'
    - path: '/tmp/49-03-protection-before.json'
      provides: 'Pre-PUT branch-protection snapshot for T-49-11 audit (mirrors Phase 47/48 `/tmp/48-03-protection-before.json` pattern)'
    - path: '/tmp/49-03-protection-after.json'
      provides: 'Post-PUT snapshot'
    - path: '/tmp/49-03-pr-a-checks.json'
      provides: 'Smoke PR-A check evidence (Initial JS overflow → BLOCKED proof)'
    - path: '/tmp/49-03-pr-b-checks.json'
      provides: 'Smoke PR-B check evidence (sub-vendor overflow → BLOCKED proof)'
    - path: '.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md'
      provides: 'Phase-wide D-14 audit ledger — net-new suppressions + ceiling-raise scan + smoke PR URLs + final verdict'
      contains: 'Phase-wide D-14 reconciliation'
    - path: '.planning/STATE.md'
      provides: 'Phase 49 marked Complete; v6.2 progress updated to 3/3 phases done'
    - path: '.planning/ROADMAP.md'
      provides: 'Phase 49 row marked complete in the v6.2 §Phases summary list'
  key_links:
    - from: 'GitHub branch protection on main'
      to: '.github/workflows/ci.yml job `Bundle Size Check (size-limit)` (line 271 `name: Bundle Size Check (size-limit)`)'
      via: '`required_status_checks.contexts` array containing the verbatim case-sensitive string'
      pattern: 'Bundle Size Check \(size-limit\)'
    - from: 'Smoke PR-A (eager d3 import)'
      to: 'Branch protection enforcement on main'
      via: 'gh pr checks <PR> → bucket=fail; gh pr view <PR> --json mergeStateStatus → BLOCKED'
      pattern: 'BLOCKED'
    - from: 'Smoke PR-B (sub-vendor overflow)'
      to: 'Branch protection enforcement on main'
      via: 'gh pr checks <PR> → bucket=fail; gh pr view <PR> --json mergeStateStatus → BLOCKED'
      pattern: 'BLOCKED'
phase_decisions_locked:
  D-10_branch_protection: 'Branch protection on main adds `Bundle Size Check (size-limit)` (verbatim casing — matches ci.yml:271 `name:` field) to required_status_checks.contexts via gh api PUT with read-then-merge-then-write pattern (verbatim from 47-03 Task 4 / 48-03 Task 2). enforce_admins=true MUST be preserved. Existing contexts (Lint, type-check, Security Scan) MUST NOT be dropped.'
  D-11_no_custom_delta: 'size-limit native exit-non-zero on chunk > ceiling IS the BUNDLE-03 enforcement. No custom baseline-delta script. Per-chunk ceilings (Plan 01 D-03 + Plan 02 D-07) determine strictness; per-chunk slack between measured and ceiling is the documented absorption budget. Reviewers tighten ceilings further during PR review if a drift pattern emerges.'
  D-12_two_smoke_prs: 'Two smoke PRs — one per failure surface. PR-A: Initial JS overflow (eager d3 import at frontend/src/App.tsx top). PR-B: sub-vendor chunk overflow (`export * from "@dnd-kit/sortable"` re-export at a new throwaway file in frontend/src). Both close with `gh pr close --delete-branch` BEFORE phase SUMMARY (T-49-13).'
  D-14_phase_audit: 'Phase-wide audit using `phase-49-base` git tag (Plan 01) as diff anchor. Three metrics — net-new eslint-disable count (target 0), net-new @ts-suppressions count (target 0), .size-limit.json ceilings raised count (target 0). All three must read PASS in 49-EXCEPTIONS.md before STATE.md is updated.'
  T-49-11_protection_merge: 'Branch-protection PUT body MUST merge `Bundle Size Check (size-limit)` into the existing contexts (Lint, Security Scan, type-check) array, NOT replace. GET-save-PUT-verify-diff pattern from 47-03 §6 / T-47-01 / T-48-02. Pre-state expected (per Phase 48 close): ["Lint","Security Scan","type-check"]; if extra contexts appear, append all to PUT body — do NOT drop.'
  T-49-12_casing_pitfall: 'Verbatim casing — `Bundle Size Check (size-limit)`. Lowercase `bundle-size-check` is the workflow `id:`, NOT the `name:`. Branch-protection contexts match the `name:` field. Mismatch makes the rule a silent no-op (RESEARCH §Pitfall 3). Smoke PRs in Task 3 are the empirical detector.'
  T-49-13_smoke_pr_disposition: 'Both smoke PRs MUST close with `gh pr close <PR> --delete-branch` — never merged. Title carries `(DO NOT MERGE)`. T-48-03 mitigation lifted from 48-03 Task 3.'
---

<objective>
Flip the gate. Phase 49's bundle work becomes enforceable on `main` via four moves:

1. **Pre-flight + branch-protection PUT (D-10)** — confirm Plan 01 + Plan 02 closed clean (`49-01-SUMMARY.md`, `49-02-SUMMARY.md` exist; `pnpm -C frontend size-limit` exits 0 on the merge base); capture `/tmp/49-03-protection-before.json`; PUT `Bundle Size Check (size-limit)` (verbatim casing — matches `ci.yml:271`) into `required_status_checks.contexts` alongside `Lint`, `type-check`, `Security Scan`; preserve `enforce_admins: true`; verify with `/tmp/49-03-protection-after.json` diff.

2. **Two smoke PRs (D-12)** — PR-A: append `import * as d3 from 'd3'` to `frontend/src/App.tsx` to push Initial JS above 450 KB; PR-B: create `frontend/src/components/kanban/_smoke-dnd-bloat.ts` with `export * from '@dnd-kit/sortable'` to push `dnd-vendor` over its ceiling. Each PR must show `Bundle Size Check (size-limit)` bucket=fail AND `mergeStateStatus=BLOCKED`. Both close with `gh pr close --delete-branch` BEFORE phase SUMMARY (T-49-13).

3. **Phase-wide D-14 audit + 49-EXCEPTIONS.md (D-14)** — `git diff phase-49-base..HEAD` for net-new `eslint-disable` (target 0), net-new `@ts-(ignore|expect-error|nocheck)` (target 0), `.size-limit.json` ceilings raised (target 0). All three rows in `49-EXCEPTIONS.md` must read PASS before STATE.md is updated.

4. **STATE.md + ROADMAP.md close-out** — mark Phase 49 = Complete (3/3 plans); update v6.2 milestone progress; record `v6.2/49-01`, `v6.2/49-02`, `v6.2/49-03` decisions; flip ROADMAP.md Phase 49 entry to checked / completed.

Purpose: BUNDLE-03 closure. After this plan, a PR that pushes any measured chunk above its locked ceiling in `frontend/.size-limit.json` cannot reach `main`. The two smoke PRs prove the gate BLOCKS (not just exists) — same posture as Phase 47 D-13 / Phase 48 D-16.

Output: branch-protection JSON with the new context; two closed BLOCKED smoke PRs; 49-EXCEPTIONS.md with three PASS rows; STATE.md + ROADMAP.md updated; v6.2 milestone ready to ship.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/49-bundle-budget-reset/49-CONTEXT.md
@.planning/phases/49-bundle-budget-reset/49-RESEARCH.md
@.planning/phases/49-bundle-budget-reset/49-PATTERNS.md
@.planning/phases/49-bundle-budget-reset/49-VALIDATION.md
@.planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md
@.planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
@.planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md
@.planning/phases/47-type-check-zero/47-EXCEPTIONS.md
@.planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md
@.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
@./CLAUDE.md
@.github/workflows/ci.yml

<interfaces>
<!--
Repo identity (VERIFIED 2026-05-11 by Phase 48; carry-forward):
  Owner: alzahrani-khalid
  Name:  Intl-Dossier-V2.0
  Default branch: main

Branch-protection pre-state EXPECTED (per Phase 48 close, 2026-05-12):
required_status_checks.strict = true
required_status_checks.contexts = ["Lint", "Security Scan", "type-check"]
enforce_admins.enabled = true
required_pull_request_reviews = null
restrictions = null

Target state after Task 2 PUT:
required_status_checks.contexts = ["Bundle Size Check (size-limit)", "Lint", "Security Scan", "type-check"] (presence matters, not order)
enforce_admins.enabled = true (preserved)
All other fields = byte-unchanged from pre-state

CI job name (VERIFIED 2026-05-12 by RESEARCH from ci.yml:270-273):
bundle-size-check:
name: Bundle Size Check (size-limit) ← capital B, capital S, capital C, lowercase parens content
runs-on: ubuntu-latest
needs: [lint, type-check]
Branch-protection `contexts` is a case-sensitive match against the `name:` field — NOT the workflow `id:`.

PUT body shape — verbatim from 47-03 Task 4 (Issue 5 fix) / 48-03 Task 2 (lifted) — body trimmed to minimum-required:
{
"required_status_checks": {
"strict": true,
"contexts": ["Bundle Size Check (size-limit)", "Lint", "Security Scan", "type-check"]
},
"enforce_admins": true,
"required_pull_request_reviews": null,
"restrictions": null
}
Fields lock_branch / allow_fork_syncing / required_linear_history / required_conversation_resolution / allow_force_pushes / allow_deletions are DROPPED — some repo tiers reject extra fields and abort the PUT.

PR-A trip-wire (Initial JS overflow):
Branch: chore/test-bundle-gate-initial
File: frontend/src/App.tsx (top of file, near existing imports)
Append: `import * as d3 from 'd3'\nconsole.warn('smoke', d3.version)`
Pre-push verification: `pnpm -C frontend build && pnpm -C frontend size-limit` MUST exit non-zero on the modified tree before push (RESEARCH §Pattern 5 + PATTERNS §"Smoke PR A").

PR-B trip-wire (sub-vendor overflow):
Branch: chore/test-bundle-gate-subvendor
File: frontend/src/components/kanban/\_smoke-dnd-bloat.ts (NEW)
Content: `export * from '@dnd-kit/sortable'`
Pre-push verification: `pnpm -C frontend build && pnpm -C frontend size-limit` MUST exit non-zero (dnd-vendor over its ceiling) before push.

Required PR assertions (verbatim shape from 47-03 Task 5 Issue 2 fix + 48-03 Task 3 — mergeStateStatus NOT mergeable):
gh pr checks <PR> --json name,state,bucket --jq '.[] | select(.name == "Bundle Size Check (size-limit)") | .bucket' # MUST return "fail"
gh pr view <PR> --json mergeStateStatus -q .mergeStateStatus # MUST return "BLOCKED"
-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                                         | Description                                                                                                                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gh api PUT branches/main/protection`                            | A misconfigured PUT body could weaken existing protection (drop `Lint`, `type-check`, or `Security Scan`; disable `enforce_admins`).                                                                |
| CI workflow `name:` field → branch-protection `contexts:` string | Case-sensitive equality. `"bundle-size-check"` (workflow id) != `"Bundle Size Check (size-limit)"` (job name). Mismatch makes the rule a silent no-op — PRs merge despite the JSON looking correct. |
| Smoke-test PRs → `main`                                          | Both PRs intentionally carry bundle overruns. They MUST NOT merge — close + delete branch is the only safe disposition (T-49-13).                                                                   |
| STATE.md + ROADMAP.md edit                                       | Updating phase status must not erase other state (audit trail); v6.2 progress fields must increment correctly.                                                                                      |
| `phase-49-base` tag → D-14 diff anchor                           | If tag is missing, D-14 cannot run honestly. Plan 01 created it; Plan 03 verifies presence.                                                                                                         |

## STRIDE Threat Register

| Threat ID | Category    | Component                                                                                        | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | ----------- | ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-49-11   | Tampering   | Branch protection PUT drops `Lint`, `type-check`, or `Security Scan`; or disables enforce_admins | mitigate    | Task 1 captures `/tmp/49-03-protection-before.json` via `gh api GET`. Task 2 PUT body explicitly merges `"Bundle Size Check (size-limit)"` into the existing contexts (`Lint`, `Security Scan`, `type-check`) rather than replacing. Task 2 acceptance runs `gh api GET` again into `/tmp/49-03-protection-after.json` and diffs vs before. `enforce_admins: true` is explicitly in the PUT body. |
| T-49-12   | Tampering   | YAML name typo or workflow-id-vs-name confusion in contexts string                               | mitigate    | Task 2 acceptance asserts the EXACT casing: `gh api .../required_status_checks --jq '.contexts                                                                                                                                                                                                                                                                                                    | sort'`MUST include`"Bundle Size Check (size-limit)"`byte-for-byte. Task 3 smoke PRs are the empirical confirmation — if casing is wrong,`Bundle Size Check (size-limit)`bucket reads`pass`but`mergeStateStatus`is`CLEAN`, not `BLOCKED`. Divergence reveals the typo. |
| T-49-13   | Repudiation | Smoke-test PR accidentally merged into main                                                      | mitigate    | (1) Branch names `chore/test-bundle-gate-{initial,subvendor}` with visible "DO NOT MERGE" naming. (2) PR titles include `(DO NOT MERGE)`. (3) PR bodies state "Will be closed without merging." (4) Task 3 ends with `gh pr close <PR> --delete-branch` for BOTH PRs BEFORE the SUMMARY. (5) `mergeStateStatus=BLOCKED` prevents accidental merge; `enforce_admins=true` blocks admin bypass.     |
| T-49-14   | Tampering   | D-14 audit run against the wrong base (e.g., main after smoke PRs close, dirtying the diff)      | mitigate    | Task 4 uses `phase-49-base` git tag (Plan 01 Task 1) as the diff anchor — not `main`, not `git merge-base`. The tag is created BEFORE phase work and is byte-stable across the phase. Acceptance: `git rev-parse phase-49-base` succeeds before the diff runs.                                                                                                                                    |
| T-49-15   | Tampering   | Smoke-PR ceiling overflow does not actually exceed the ceiling (trip-wire too small)             | mitigate    | Both Task 3 sub-tasks include pre-push local verification — `pnpm -C frontend build && pnpm -C frontend size-limit` MUST exit non-zero locally on the modified tree before pushing. If it exits 0, the trip-wire is undersized — escalate (e.g., add a second eager import) until size-limit fails locally.                                                                                       |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Pre-flight — confirm Plan 01 + 02 closed; capture branch-protection pre-state; confirm phase-49-base tag</name>
  <files>(no files; pre-flight + /tmp captures)</files>
  <read_first>
    - .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md (verify exists; verdict = SUCCESS or SUCCESS-WITH-DEVIATION)
    - .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md (verify exists; verdict = SUCCESS or SUCCESS-WITH-DEVIATION)
    - .planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md Task 1 (verbatim pre-flight pattern donor)
    - .planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md Task 1 (verbatim pre-flight pattern donor — Phase 48 carry-forward)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-10 + D-14
  </read_first>
  <action>
    Mirror Phase 48 03-PLAN Task 1 verbatim; substitute the bundle-size-check context.

    1. Confirm both upstream plan summaries exist:
       - `ls .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md`
       - `ls .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md`
       Both MUST exist. If either is missing, STOP — Plan 03 cannot run against an incomplete predecessor.

    2. Confirm the size-limit gate exits 0 on the merge base (Plan 02's final state):
       - `pnpm -C frontend build && pnpm -C frontend size-limit; echo "size-limit exit=$?"` MUST print `exit=0`. If non-zero, STOP — route back to Plan 02 gap closure. Flipping the gate on a still-red baseline blocks every PR including the smoke PRs.

    3. Confirm carry-forward Phase 47/48 gates remain green:
       - `pnpm --filter intake-frontend type-check; echo "fe tc=$?"` MUST print `=0`.
       - `pnpm --filter intake-backend type-check; echo "be tc=$?"` MUST print `=0`.
       - `pnpm --filter intake-frontend lint; echo "fe lint=$?"` MUST print `=0`.
       - `pnpm --filter intake-backend lint; echo "be lint=$?"` MUST print `=0`.

    4. Confirm GitHub repo identity:
       - `gh repo view --json nameWithOwner -q .nameWithOwner` MUST print `alzahrani-khalid/Intl-Dossier-V2.0`.

    5. Capture pre-state for T-49-11 audit:
       - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/49-03-protection-before.json 2>&1`
       - `cat /tmp/49-03-protection-before.json | jq '{contexts: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}'`
       - Expected (per Phase 48 close, 2026-05-12): `{ "contexts": ["Lint","Security Scan","type-check"], "enforce_admins": true }`.
       - If the response is the 404 "Branch not protected" payload, STOP — Phase 47/48 protection has been removed; Plan 03 cannot rely on the merge-then-write pattern.

    6. Confirm the `phase-49-base` tag exists (Plan 01 Task 1):
       - `git rev-parse phase-49-base` MUST return a 40-char SHA.

    7. Confirm `Bundle Size Check (size-limit)` job exists with the exact `name:` Plan 03 will reference (defensive — protects against rename drift in the workflow file between phases):
       - `grep -A 1 "bundle-size-check:" .github/workflows/ci.yml | grep -c "name: Bundle Size Check (size-limit)"` MUST return 1.

  </action>
  <verify>
    <automated>
      test -f .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md
      test -f .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md
      pnpm -C frontend build
      pnpm -C frontend size-limit
      pnpm --filter intake-frontend type-check
      pnpm --filter intake-backend type-check
      pnpm --filter intake-frontend lint
      pnpm --filter intake-backend lint
      gh repo view --json nameWithOwner -q .nameWithOwner
      test -f /tmp/49-03-protection-before.json
      jq -e '.required_status_checks.contexts | index("Lint")' /tmp/49-03-protection-before.json
      jq -e '.required_status_checks.contexts | index("type-check")' /tmp/49-03-protection-before.json
      jq -e '.required_status_checks.contexts | index("Security Scan")' /tmp/49-03-protection-before.json
      jq -e '.enforce_admins.enabled' /tmp/49-03-protection-before.json
      git rev-parse phase-49-base
      grep -A 1 "bundle-size-check:" .github/workflows/ci.yml | grep -c "name: Bundle Size Check (size-limit)"
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `test -f .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md && test -f .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md` exits 0.
    - Behavior: `pnpm -C frontend size-limit; echo $?` returns 0.
    - Behavior: `pnpm --filter intake-frontend type-check; echo $?` returns 0.
    - Behavior: `pnpm --filter intake-backend type-check; echo $?` returns 0.
    - Behavior: `pnpm --filter intake-frontend lint; echo $?` returns 0.
    - Behavior: `pnpm --filter intake-backend lint; echo $?` returns 0.
    - Behavior: `gh repo view --json nameWithOwner -q .nameWithOwner` outputs `alzahrani-khalid/Intl-Dossier-V2.0`.
    - Source: `/tmp/49-03-protection-before.json` exists with a valid JSON object; contexts include `Lint`, `Security Scan`, `type-check`; `enforce_admins.enabled = true`.
    - Source: `git rev-parse phase-49-base` returns a 40-char SHA.
    - Source: `grep -A 1 "bundle-size-check:" .github/workflows/ci.yml | grep -c "name: Bundle Size Check (size-limit)"` returns 1 (CI job `name:` is the verbatim casing).
  </acceptance_criteria>
  <done>All upstream gates confirmed green; pre-state captured; Plan 03 cleared to PUT.</done>
</task>

<task type="auto">
  <name>Task 2: PUT branch protection — add `Bundle Size Check (size-limit)` to required contexts</name>
  <files>(no files; GitHub API call — output to /tmp)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md Task 4 (verbatim PUT donor + Issue 5 body-trim fix)
    - .planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md Task 2 (verbatim Phase 48 carry-forward — only context-string differs)
    - .planning/phases/49-bundle-budget-reset/49-RESEARCH.md §"Pattern 4: Branch-Protection Update via gh api (D-10)" (Phase 49 payload + casing pitfall)
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"Branch-protection on `main`" (verbatim Phase 49 PUT body)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-10
    - /tmp/49-03-protection-before.json (Task 1 capture)
    - .github/workflows/ci.yml lines 270-273 (verify `name: Bundle Size Check (size-limit)` casing one more time before PUT)
  </read_first>
  <action>
    Apply the read-then-merge-then-write pattern verbatim from 47-03 Task 4 / 48-03 Task 2. Phase 48 pre-state contexts (per Plan 03 Task 1 capture) are `["Lint","Security Scan","type-check"]`; this task adds `"Bundle Size Check (size-limit)"` to produce `["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"]`.

    1. Re-capture state immediately before the PUT (catches any drift between Task 1 and now):
       - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/49-03-protection-before-final.json 2>&1`
       - `diff /tmp/49-03-protection-before.json /tmp/49-03-protection-before-final.json | head -40`
       - Diff should be empty or trivial. If non-empty changes appear that drop required contexts or disable enforce_admins, STOP — investigate before PUT.

    2. Confirm contexts to merge:
       - `jq -r '.required_status_checks.contexts[]' /tmp/49-03-protection-before-final.json`
       - Expected output (Phase 48 close):
         Lint
         Security Scan
         type-check
       - If the output differs (e.g., a new context was added by another admin), update the PUT body's `contexts` array in step 3 to include all existing contexts PLUS `Bundle Size Check (size-limit)` — do NOT replace.

    3. PUT the merged payload (assuming step 2 confirms the Phase 48 baseline):
       - `gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection --input - <<'JSON'

{
"required_status_checks": {
"strict": true,
"contexts": ["Bundle Size Check (size-limit)", "Lint", "Security Scan", "type-check"]
},
"enforce_admins": true,
"required_pull_request_reviews": null,
"restrictions": null
}
JSON`       - Body is trimmed to the minimum-required GitHub REST spec per 47-03 Task 4 "Issue 5 fix" — drop`lock_branch`, `allow_fork_syncing`, `required_linear_history`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions`.

    4. Verify the rule landed (T-49-12 casing detector):
       - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/49-03-protection-after.json`
       - `cat /tmp/49-03-protection-after.json | jq '{contexts: (.required_status_checks.contexts | sort), strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}'`
       - Expected output (sorted, exact casing):
         { "contexts": ["Bundle Size Check (size-limit)","Lint","Security Scan","type-check"], "strict": true, "enforce_admins": true }
       - `jq -e '.required_status_checks.contexts | index("Bundle Size Check (size-limit)")' /tmp/49-03-protection-after.json` MUST succeed (non-null index — the verbatim casing landed).

    5. Diff before/after to confirm no other rules dropped (T-49-11):
       - `diff <(jq -S '.required_status_checks.contexts | sort' /tmp/49-03-protection-before-final.json) <(jq -S '.required_status_checks.contexts | sort' /tmp/49-03-protection-after.json)`
       - Expected: the diff shows only the addition of `"Bundle Size Check (size-limit)"`. Any other line change is a regression — STOP and roll back via `gh api -X PUT ... < /tmp/49-03-protection-before-final.json`-shaped body.

    Do NOT commit anything in this task — branch protection lives in GitHub settings, not in the repo.

  </action>
  <verify>
    <automated>
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'
      test -f /tmp/49-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("Bundle Size Check (size-limit)")' /tmp/49-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("Lint")' /tmp/49-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("type-check")' /tmp/49-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("Security Scan")' /tmp/49-03-protection-after.json
    </automated>
  </verify>
  <acceptance_criteria>
    - Behavior: `gh api .../required_status_checks --jq '.contexts | sort | join(",")'` outputs `Bundle Size Check (size-limit),Lint,Security Scan,type-check` (exact casing, comma-joined alphabetical sort).
    - Behavior: `gh api .../enforce_admins --jq '.enabled'` outputs `true`.
    - Source: `/tmp/49-03-protection-after.json` exists and is a valid JSON document.
    - Gate proof (T-49-12 casing): `jq -e '.required_status_checks.contexts | index("Bundle Size Check (size-limit)")' /tmp/49-03-protection-after.json` succeeds (index is non-null — the verbatim casing string is present).
    - Audit (T-49-11): all three Phase 48 contexts (`Lint`, `type-check`, `Security Scan`) still present in after.json.
    - Audit (T-49-11): `diff` of contexts before vs after shows only the `Bundle Size Check (size-limit)` addition.
  </acceptance_criteria>
  <done>Branch protection on main now requires Bundle Size Check (size-limit) + Lint + Security Scan + type-check; enforce_admins preserved; T-49-11 audit diff clean.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Smoke-test PRs (PR-A initial-JS overflow + PR-B sub-vendor overflow) — observe BLOCKED</name>
  <what-built>Branch protection now requires `Bundle Size Check (size-limit)` per Task 2. This task is the D-12 proof — two deliberately-broken PRs (one per failure surface: initial chunk + sub-vendor) must be rejected by the gate. Mirrors Phase 47 D-13 / Phase 48 D-16 two-smoke-PR pattern.</what-built>
  <how-to-verify>
    Run two smoke PRs in sequence. Each must show `Bundle Size Check (size-limit)` check `bucket=fail` AND `mergeStateStatus=BLOCKED`. Each closes with `gh pr close --delete-branch` immediately after BLOCKED is captured (T-49-13).

    **PR-A smoke (`chore/test-bundle-gate-initial`) — Initial JS overflow:**

    1. Branch from latest main:
       ```
       git fetch origin main
       git checkout -b chore/test-bundle-gate-initial origin/main
       ```

    2. Inject the eager d3 import trip-wire (RESEARCH §Pattern 5 + PATTERNS §"Smoke PR A"). Append exactly these two lines to the top of `frontend/src/App.tsx` (after any existing imports, before the component body):
       ```
       import * as d3 from 'd3'
       console.warn('smoke', d3.version)
       ```
       This forces d3 into the `app-*.js` initial chunk.

    3. T-49-15 pre-push local verification (the trip-wire must actually trip the gate locally before pushing):
       ```
       pnpm -C frontend build
       pnpm -C frontend size-limit; echo "size-limit exit=$?"
       ```
       `size-limit exit=` MUST be non-zero (a chunk exceeds its ceiling). If exit=0, the trip-wire is undersized — escalate by also importing a second heavy lib (e.g., `import { saveAs } from 'file-saver'`) until size-limit fails locally. Do NOT push a smoke branch that does not fail locally — pushing a passing branch wastes a CI cycle and gives a false "BLOCKED" reading if some other unrelated check fails.

    4. Commit, push, open PR:
       ```
       git add frontend/src/App.tsx
       git commit -m "chore: smoke-test bundle gate initial-js (DO NOT MERGE)"
       git push -u origin chore/test-bundle-gate-initial
       gh pr create --base main \
         --title "chore: smoke-test bundle gate initial-js (DO NOT MERGE)" \
         --body "BUNDLE-03 verification per CONTEXT D-12. Injects an eager d3 import to push Initial JS > 450 KB. Will be closed without merging."
       PR_A=$(gh pr view --json number -q .number)
       echo "PR-A number: $PR_A"
       gh pr checks $PR_A --watch
       ```

    5. **Required state assertions:**
       ```
       gh pr checks $PR_A --json name,state,bucket --jq '.[] | select(.name == "Bundle Size Check (size-limit)") | .bucket'
       # MUST return "fail"

       gh pr view $PR_A --json mergeStateStatus -q .mergeStateStatus
       # MUST return "BLOCKED"   (NOT "MERGEABLE" — per 47-03 Issue 2 fix, mergeable returns "MERGEABLE" for branches without git conflicts even when required checks fail; mergeStateStatus is the correct field)

       gh pr checks $PR_A --json name,state,bucket --jq '.[] | select(.name == "Lint") | .bucket'
       # MUST return "pass"   (Lint still passes — clean attribution; only Bundle Size Check fails)
       gh pr checks $PR_A --json name,state,bucket --jq '.[] | select(.name == "type-check") | .bucket'
       # MUST return "pass"
       ```

    6. Capture evidence + close:
       ```
       gh pr checks $PR_A --json name,bucket > /tmp/49-03-pr-a-checks.json
       gh pr close $PR_A --delete-branch
       ```

    **PR-B smoke (`chore/test-bundle-gate-subvendor`) — Sub-vendor chunk overflow:**

    7. Branch from latest main:
       ```
       git checkout main && git pull
       git checkout -b chore/test-bundle-gate-subvendor origin/main
       ```

    8. Create the bloat file (RESEARCH §Pattern 5 + PATTERNS §"Smoke PR B"). Create `frontend/src/components/kanban/_smoke-dnd-bloat.ts` with this single line:
       ```
       export * from '@dnd-kit/sortable'
       ```
       This re-exports the entire scoped package into a file the bundler reaches, ballooning `dnd-vendor` past its Plan-02 ceiling.

    9. T-49-15 pre-push local verification:
       ```
       pnpm -C frontend build
       pnpm -C frontend size-limit; echo "size-limit exit=$?"
       ```
       `size-limit exit=` MUST be non-zero — specifically, `DnD vendor` should exceed its ceiling. If `DnD vendor` still passes (e.g., tree-shaking eliminated the re-export because nothing imports `_smoke-dnd-bloat.ts`), escalate by adding `import "./_smoke-dnd-bloat"` to `frontend/src/App.tsx` so the bundler keeps it live.

    10. Commit, push, open PR:
        ```
        git add frontend/src/components/kanban/_smoke-dnd-bloat.ts frontend/src/App.tsx 2>/dev/null || git add frontend/src/components/kanban/_smoke-dnd-bloat.ts
        git commit -m "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)"
        git push -u origin chore/test-bundle-gate-subvendor
        gh pr create --base main \
          --title "chore: smoke-test bundle gate sub-vendor (DO NOT MERGE)" \
          --body "BUNDLE-03 verification per CONTEXT D-12. Bloats dnd-vendor over its ceiling to prove the gate blocks per-chunk regressions. Will be closed without merging."
        PR_B=$(gh pr view --json number -q .number)
        echo "PR-B number: $PR_B"
        gh pr checks $PR_B --watch
        ```

    11. Required state assertions (same shape as PR-A):
        ```
        gh pr checks $PR_B --json name,state,bucket --jq '.[] | select(.name == "Bundle Size Check (size-limit)") | .bucket'   # MUST return "fail"
        gh pr view $PR_B --json mergeStateStatus -q .mergeStateStatus                                                            # MUST return "BLOCKED"
        gh pr checks $PR_B --json name,state,bucket --jq '.[] | select(.name == "Lint") | .bucket'                              # MUST return "pass"
        gh pr checks $PR_B --json name,state,bucket --jq '.[] | select(.name == "type-check") | .bucket'                        # MUST return "pass"
        ```

    12. Capture evidence + close:
        ```
        gh pr checks $PR_B --json name,bucket > /tmp/49-03-pr-b-checks.json
        gh pr close $PR_B --delete-branch
        ```

    **User signal-back:** Post both PR URLs (closed) and the `gh pr checks` JSON evidence. If EITHER smoke PR shows `Bundle Size Check (size-limit): pass` (real size-limit passed) or `mergeStateStatus: CLEAN`, STOP — that means the gate is not actually wired (T-49-12: likely a casing mismatch in the protection contexts vs the GHA job's `name:` field). Recovery: re-read Task 2 step 4 acceptance, fix the contexts string, re-run Task 3.

  </how-to-verify>
  <resume-signal>Type "approved — both smoke tests blocked" with the two PR URLs and a paste of `gh pr checks` showing `Bundle Size Check (size-limit): fail` + `mergeStateStatus: BLOCKED` for each, OR "blocked — &lt;reason&gt;"</resume-signal>
</task>

<task type="auto">
  <name>Task 4: Phase-wide D-14 reconciliation + create 49-EXCEPTIONS.md</name>
  <files>.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (analog ledger from Phase 47)
    - .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md (analog ledger from Phase 48 — closer model)
    - .planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md Task 4 (verbatim D-17 scan pattern; only the grep targets differ — Phase 49 adds ceiling-raise count)
    - .planning/phases/49-bundle-budget-reset/49-CONTEXT.md D-14
    - .planning/phases/49-bundle-budget-reset/49-PATTERNS.md §"Pattern S3 — Suppression-count diff anchor"
  </read_first>
  <action>
    Run the D-14 phase-wide audit against `phase-49-base`, then commit the ledger.

    1. Verify phase-49-base tag still exists:
       - `git rev-parse phase-49-base` MUST succeed. If not, STOP — diff anchor is gone; D-14 cannot run honestly.

    2. Net-new `eslint-disable` count across the phase (frontend/src + backend/src):
       - `git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' > /tmp/49-03-eslint-disable-additions.txt`
       - `wc -l < /tmp/49-03-eslint-disable-additions.txt` MUST return 0. If non-zero, the offenders are listed in the txt file — fix at the call site (replace the directive with a real code-level resolution). D-14 is "zero net-new", not "log and continue".

    3. Net-new `@ts-(ignore|expect-error|nocheck)` count:
       - `git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' | grep -vE '^\+\+\+' > /tmp/49-03-ts-suppression-additions.txt`
       - `wc -l < /tmp/49-03-ts-suppression-additions.txt` MUST return 0. If non-zero, list and resolve via call-site fixes.

    4. Size-limit ceilings RAISED count vs phase-49-base baseline (Phase 49-specific D-14 extension):
       - `git diff phase-49-base..HEAD -- frontend/.size-limit.json > /tmp/49-03-sizelimit-diff.txt`
       - Manually inspect: every `+`/`-` pair on a `"limit": "<VALUE>"` line. The `+` value MUST be ≤ the `-` value when the corresponding entry is one of the original 6 phase-49-base entries (Initial / React vendor / TanStack vendor / Total JS / d3-geospatial / static-primitives). Plan 01 LOWERED all of these per D-01..D-03; any `+` value > `-` value (other than Total JS WITH a corresponding `## Escalation (D-02)` block in `49-BUNDLE-AUDIT.md`) is a violation.
       - The 3 new entries added in Plan 02 (HeroUI / Sentry / DnD vendors) appear as `+`-only lines (no matching `-` because they are new) — these are NOT raises, they are additions. Distinguish via context lines (`+++` headers and `@@` hunk headers); a "raise" is specifically a `-old / +new` where `new > old` on the same entry name.
       - Tally the raise count → `/tmp/49-03-ceiling-raises.txt` (line per violation; expected 0 lines).
       - `wc -l < /tmp/49-03-ceiling-raises.txt` MUST return 0.

    5. Create `.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md` modeled on `48-EXCEPTIONS.md`. Required sections:

       # Phase 49 — EXCEPTIONS Ledger

       ## Phase-wide D-14 reconciliation

       | Metric | Target | Observed | Status |
       |---|---|---|---|
       | Net-new `eslint-disable` (frontend/src + backend/src, phase-49-base..HEAD) | 0 | <observed> | PASS / FAIL |
       | Net-new `@ts-(ignore|expect-error|nocheck)` (carry-forward Phase 47 D-01) | 0 | <observed> | PASS / FAIL |
       | `.size-limit.json` ceilings RAISED vs phase-49-base | 0 | <observed> | PASS / FAIL |

       ## Retained suppressions

       (None expected. If any exist, list with: file path, rule name, reason, follow-up issue/reference.)

       ## Phase scope summary

       - Files touched (phase-49-base..HEAD): <`git diff --name-only phase-49-base..HEAD | wc -l` count> files; key ones: frontend/.size-limit.json, frontend/vite.config.ts, frontend/scripts/assert-size-limit-matches.mjs, frontend/docs/bundle-budget.md, frontend/src/**/*.tsx (audit-driven lazy() conversions).
       - Sub-vendor decomposition: heroui-vendor + sentry-vendor + dnd-vendor (Plan 02 D-07); optional tiptap/exceljs gated on audit verdict — <captured here from Plan 02 SUMMARY>.
       - lazy() conversions: <count from Plan 02 SUMMARY> components, all ≥30 KB gz non-initial-path per D-06.
       - Ceilings re-baselined (Plan 01 D-01..D-03 via `min(current, measured + 5 KB)` — never raise): Initial 517→450 LOWERED, Total 2.43 MB→<final value from Plan 01 SUMMARY> LOWERED, static-primitives 64→12 LOWERED. UNCHANGED (current already tighter than mechanical +5KB): React 349, TanStack 51, d3-geospatial 55. New entries with measured+5 KB ceilings: HeroUI, Sentry, DnD.
       - Branch protection updated: `Bundle Size Check (size-limit)` added to required_status_checks.contexts; enforce_admins=true preserved (D-10).
       - Smoke PRs verified BLOCKED: <PR-A URL> (closed, initial-JS overflow), <PR-B URL> (closed, sub-vendor overflow) — both showed `Bundle Size Check (size-limit): fail` + `mergeStateStatus: BLOCKED` (D-12).

       ## Phase verdict

       <PASS | PASS-WITH-DEVIATION | gap-closure-needed>

       Rationale: <one paragraph stating which acceptance criteria fully landed vs deferred>.

       Replace `<observed>` and `<PR-A URL>` / `<PR-B URL>` placeholders with real values from steps 2-4 and Task 3. Status column reads `PASS` when observed meets target, `FAIL` otherwise. Any `FAIL` row triggers an immediate return to a gap-closure task — `49-EXCEPTIONS.md` is only committed once all D-14 rows read `PASS`.

    6. Commit:
       - `git add .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md`
       - `git commit -m "docs(49-03): D-14 reconciliation — zero net-new suppressions + zero ceiling raises across phase"`

  </action>
  <verify>
    <automated>
      git rev-parse phase-49-base
      git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' | wc -l
      git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' | grep -vE '^\+\+\+' | wc -l
      test -f .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md
      grep -c "Phase-wide D-14 reconciliation" .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md
      grep -cE "\| PASS \|" .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `git rev-parse phase-49-base` returns a 40-char SHA.
    - Audit (D-14): `git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' | wc -l` returns 0.
    - Audit (D-14): `git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' | grep -vE '^\+\+\+' | wc -l` returns 0.
    - Audit (D-14 ceiling raises): `/tmp/49-03-ceiling-raises.txt` is empty (`wc -l` returns 0).
    - Source: `.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md` exists.
    - Source: `grep -c "Phase-wide D-14 reconciliation" 49-EXCEPTIONS.md` returns 1.
    - Source: all three D-14 metrics in 49-EXCEPTIONS.md read `PASS` (`grep -cE "\| PASS \|" 49-EXCEPTIONS.md` returns ≥3).
    - Source: smoke PR URLs from Task 3 appear verbatim in the "Phase scope summary" section (no `<PR-A URL>` / `<PR-B URL>` placeholders remain).
  </acceptance_criteria>
  <done>D-14 reconciliation logged; zero net-new suppressions across phase; zero ceiling raises; 49-EXCEPTIONS.md committed with three PASS rows + verdict.</done>
</task>

<task type="auto">
  <name>Task 5: Update STATE.md + ROADMAP.md to mark Phase 49 complete</name>
  <files>.planning/STATE.md, .planning/ROADMAP.md</files>
  <read_first>
    - .planning/STATE.md (current state — Phase 48 Complete; Phase 49 Not started)
    - .planning/ROADMAP.md §"Phase 49: Bundle Budget Reset" (line ~180; current: `Plans: TBD`)
    - .planning/phases/48-lint-config-alignment/48-03-ci-gate-and-branch-protection-PLAN.md Task 5 (verbatim STATE.md close-out pattern donor)
    - .planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md (just created)
    - .planning/phases/49-bundle-budget-reset/49-01-SUMMARY.md (for Plan 01 verdict + key numbers)
    - .planning/phases/49-bundle-budget-reset/49-02-SUMMARY.md (for Plan 02 verdict + lazy() count + sub-vendor measurements)
  </read_first>
  <action>
    Mirror Phase 48 03-PLAN Task 5 verbatim shape; substitute Phase 49 specifics.

    1. **Update Current Position** in STATE.md (currently around lines 26-31):
       - Change `Phase: 49` to `Phase: 49 (bundle-budget-reset) — SUCCESS (3/3 plans)`.
       - `Status` line: `Initial JS ceiling 450 KB gz ✓ ; Total JS ceiling 1.8 MB gz (or escalated) ✓ ; HeroUI/Sentry/DnD sub-vendors split ✓ ; Audit-driven React.lazy() conversions landed ✓ ; CI Bundle Size Check job + branch protection live on main (4 contexts with enforce_admins=true) ; Two D-12 smoke PRs verified BLOCKED`.
       - `Last activity` line: today's date with a Phase 49 completion note.

    2. **Update Next Action**: replace the Phase 49 close-out narrative with a 2-3 sentence summary followed by `Next milestone: **v6.2 Type-Check, Lint & Bundle Reset** is now SHIPPED (Phases 47, 48, 49 all complete). v7.0 Intelligence Engine is unblocked.`

    3. **Update v6.2 Execution Progress table** (currently around line 80 — `| 49 | v6.2 | 0/0 | Not started | - |`):
       - Change to `| 49 | v6.2 | 3/3 | Complete | <YYYY-MM-DD> |` (today's date).
       - Update v6.2 milestone status above the table if there's an aggregate line; mark `v6.2 SHIPPED YYYY-MM-DD`.

    4. **Update the frontmatter `progress` block** at the top of STATE.md:
       - `total_plans` increments by 3 (was 14 at Phase 48 close; now 17).
       - `completed_plans` increments by 3.
       - `percent` remains 100 if v6.2 was already 100% of 14 plans; recompute as `completed_plans / total_plans * 100` — should still be 100.
       - `last_activity` and `stopped_at` updated.

    5. **Append to Accumulated Context → Decisions** (around line 366+):
       - `[v6.2/49-01]: Plan 01 — phase-49-base tag created at origin/main HEAD; ANALYZE=true audit produced 49-BUNDLE-AUDIT.md (top-20 chunks + N lazy() candidates); .size-limit.json ceilings re-baselined per D-01..D-03 (Initial 450 / React 350 / TanStack 55 / Total <final value> / d3-geospatial 56 / static-primitives 12); frontend/docs/bundle-budget.md scaffolded.`
       - `[v6.2/49-02]: Plan 02 — manualChunks extended with heroui-vendor + sentry-vendor + dnd-vendor (D-07) <plus optional tiptap/exceljs if added>; .size-limit.json + assert-size-limit-matches.mjs updated with strict ===1 sub-vendor entries; <N> components ≥30 KB gz non-initial-path converted to React.lazy() with D-13-compliant Suspense fallbacks; bundle-budget.md updated with sub-vendor rows + residual vendor disposition; pnpm size-limit exits 0 on the post-Plan-02 baseline.`
       - `[v6.2/49-03]: Plan 03 — Bundle Size Check (size-limit) added to main branch protection alongside Lint + type-check + Security Scan; enforce_admins=true preserved. Both D-12 smoke PRs (initial-JS overflow + sub-vendor overflow) showed Bundle Size Check (size-limit) bucket=fail + mergeStateStatus=BLOCKED. D-14 phase-wide audit: 0 net-new eslint-disable / 0 net-new @ts-suppressions / 0 ceiling-raises. v6.2 milestone shipped.`

    6. **Update ROADMAP.md §"Phase 49: Bundle Budget Reset"** (around line 180):
       - Change the milestone summary `Phases 47-49 (planning, opened 2026-05-08)` to `Phases 47-49 (shipped <YYYY-MM-DD>) — archive: milestones/v6.2-ROADMAP.md` (or leave the archive link off if the archive file does not yet exist — the planner may decide to defer archive creation to a separate task; this plan does NOT create v6.2-ROADMAP.md archive).
       - In §"Phases (summary)" of v6.2, change `- [ ] **Phase 49: Bundle Budget Reset**` to `- [x] **Phase 49: Bundle Budget Reset** — Lowered .size-limit.json Total JS ceiling, route-split heavy chunks via React.lazy(), audited the vendor super-chunk, restored size-limit as a PR-blocking CI gate (completed <YYYY-MM-DD>)`.
       - In §"Phase Details → Phase 49 → Plans", change `**Plans:** TBD` to `**Plans:** 3/3 plans complete` and add the three plan rows in the same shape as Phase 47/48 sections:
         - `- [x] 49-01-audit-and-budget-calibration-PLAN.md — Create phase-49-base tag; ANALYZE=true audit → 49-BUNDLE-AUDIT.md; .size-limit.json ceilings re-baselined per D-01..D-03; frontend/docs/bundle-budget.md scaffolded (BUNDLE-01, BUNDLE-04)`
         - `- [x] 49-02-vendor-decomp-and-lazy-PLAN.md — manualChunks adds heroui/sentry/dnd-vendor branches (D-07); assert-size-limit-matches.mjs extended with strict ===1 entries; audit-identified ≥30 KB gz non-initial components → React.lazy() with D-13 Suspense; bundle-budget.md sub-vendor rows + residual disposition (BUNDLE-02, BUNDLE-04)`
         - `- [x] 49-03-ci-gate-and-smoke-PLAN.md — Bundle Size Check (size-limit) added to main branch protection (D-10); two smoke PRs verified BLOCKED (D-12); D-14 phase-wide audit returned 0 net-new suppressions and 0 ceiling raises (BUNDLE-03)`
       - In the §"Progress" table at the bottom of ROADMAP.md, update the Phase 49 row from `Not started` to `Complete` with today's date; if a v6.2 milestone row exists in the table, mark it `Shipped`.

    7. Commit both files together:
       - `git add .planning/STATE.md .planning/ROADMAP.md`
       - `git commit -m "docs(49-03): close Phase 49 — bundle gate live + v6.2 milestone shipped"`

  </action>
  <verify>
    <automated>
      grep -c "Phase 49 D-12 smoke PRs" .planning/STATE.md
      grep -cE "Phase: 49|bundle-budget-reset.*SUCCESS" .planning/STATE.md
      grep -c "v6.2/49-01" .planning/STATE.md
      grep -c "v6.2/49-02" .planning/STATE.md
      grep -c "v6.2/49-03" .planning/STATE.md
      grep -E "^\| 49 \|" .planning/STATE.md | grep -c "Complete"
      grep -c "\[x\] \*\*Phase 49: Bundle Budget Reset\*\*" .planning/ROADMAP.md
      grep -c "49-01-audit-and-budget-calibration-PLAN.md" .planning/ROADMAP.md
      grep -c "49-02-vendor-decomp-and-lazy-PLAN.md" .planning/ROADMAP.md
      grep -c "49-03-ci-gate-and-smoke-PLAN.md" .planning/ROADMAP.md
    </automated>
  </verify>
  <acceptance_criteria>
    - Source: `grep -c "Phase 49 D-12 smoke PRs" .planning/STATE.md` returns ≥1 (resolution sentence present).
    - Source: `grep -cE "Phase: 49|bundle-budget-reset.*SUCCESS" .planning/STATE.md` returns ≥1 (Current Position updated).
    - Source: `grep -c "v6.2/49-01" .planning/STATE.md` returns 1.
    - Source: `grep -c "v6.2/49-02" .planning/STATE.md` returns 1.
    - Source: `grep -c "v6.2/49-03" .planning/STATE.md` returns 1.
    - Source: `grep -E "^\| 49 \|" .planning/STATE.md | grep -c "Complete"` returns 1 (v6.2 Execution Progress table row updated).
    - Source: `grep -c "\[x\] \*\*Phase 49: Bundle Budget Reset\*\*" .planning/ROADMAP.md` returns 1 (Phase 49 marked checked).
    - Source: `grep -c "49-01-audit-and-budget-calibration-PLAN.md" .planning/ROADMAP.md` returns 1 (Plan 01 row present).
    - Source: `grep -c "49-02-vendor-decomp-and-lazy-PLAN.md" .planning/ROADMAP.md` returns 1 (Plan 02 row).
    - Source: `grep -c "49-03-ci-gate-and-smoke-PLAN.md" .planning/ROADMAP.md` returns 1 (Plan 03 row).
    - Source: Real smoke PR URLs from Task 3 appear in the STATE.md Phase 49 closure paragraph (no placeholders remain).
  </acceptance_criteria>
  <done>STATE.md reflects Phase 49 SUCCESS (3/3 plans); v6.2 milestone shipped; ROADMAP.md Phase 49 entry checked with plan list; all changes committed atomically.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'` outputs exactly `Bundle Size Check (size-limit),Lint,Security Scan,type-check`.
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'` outputs `true`.
- Both smoke PRs (`chore/test-bundle-gate-initial`, `chore/test-bundle-gate-subvendor`) are closed (state=`CLOSED`, not `MERGED`); their respective branches are deleted from origin.
- `/tmp/49-03-pr-a-checks.json` and `/tmp/49-03-pr-b-checks.json` both contain `Bundle Size Check (size-limit): fail` evidence.
- `.planning/phases/49-bundle-budget-reset/49-EXCEPTIONS.md` exists and reports D-14 PASS for all three metrics (suppression + TS-suppression + ceiling-raises counts).
- `git diff phase-49-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*(eslint-disable|@ts-(ignore|expect-error|nocheck))' | grep -vE '^\+\+\+' | wc -l` returns 0.
- `.planning/STATE.md` shows Phase 49 SUCCESS + v6.2 milestone SHIPPED.
- `.planning/ROADMAP.md` Phase 49 entry is `[x]` with the three plan rows listed.
- v6.2 milestone: Phases 47, 48, 49 all Complete; v7.0 Intelligence Engine unblocked.
</verification>

<success_criteria>

- BUNDLE-03 (from ROADMAP): `size-limit` runs as a PR-blocking CI gate; a PR that pushes any measured chunk above its locked ceiling is rejected. PROOF: Task 3's two smoke PRs both showed `Bundle Size Check (size-limit)` bucket=fail + mergeStateStatus=BLOCKED.
- D-10: Branch protection on main requires `Bundle Size Check (size-limit)` alongside `Lint` + `type-check` + `Security Scan`; `enforce_admins=true` preserved.
- D-11: size-limit's native fail-on-exceed is the BUNDLE-03 enforcement — no custom baseline-delta script added. Per-chunk slack between measured and ceiling is the documented absorption budget.
- D-12: Two smoke PRs proved the gate BLOCKS (not just exists); both closed with `--delete-branch` BEFORE phase SUMMARY.
- D-14: Zero net-new `eslint-disable` / `@ts-*` suppressions / ceiling raises across the entire phase (phase-49-base..HEAD).
- STATE.md + ROADMAP.md updated: Phase 49 = Complete; v6.2 milestone SHIPPED; Phase decisions logged with `[v6.2/49-XX]` prefix; Plans roster present in ROADMAP.md.
- Phase 49 SUMMARY can be authored: branch-protection JSON paste, smoke PR URLs + JSON evidence, D-14 PASS rows, v6.2 close-out verdict.

</success_criteria>

<output>
After completion, create `.planning/phases/49-bundle-budget-reset/49-03-SUMMARY.md` recording:
- Final branch-protection state (paste of `gh api .../protection` post-PUT).
- Both smoke PR URLs + their `gh pr checks` JSON evidence (initial-JS overflow + sub-vendor overflow).
- The D-14 reconciliation table from `49-EXCEPTIONS.md`.
- Confirmation that STATE.md + ROADMAP.md reflect Phase 49 = Complete and v6.2 = Shipped.
- Any deviations (e.g., if the protection state at Task 2 included unexpected extra contexts that were merged into the PUT body; or if a smoke trip-wire had to be escalated to actually fail size-limit locally).
- Phase 49 close-out verdict (target: SUCCESS or SUCCESS-WITH-DEVIATION).
- v6.2 milestone close-out note: "Phases 47/48/49 all complete. v7.0 Intelligence Engine unblocked."
</output>
