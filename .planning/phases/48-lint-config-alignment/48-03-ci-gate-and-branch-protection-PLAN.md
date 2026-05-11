---
phase: 48
plan: 03
type: execute
wave: 3
depends_on: [48-01, 48-02]
files_modified:
  - .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
  - .planning/STATE.md
autonomous: false
requirements: [LINT-09]
must_haves:
  truths:
    - 'Branch protection on `main` requires `Lint` (capital L) alongside the existing `type-check` + `Security Scan` checks'
    - '`enforce_admins: true` is preserved (Phase 47 D-09 posture carries forward)'
    - 'A frontend smoke PR with a deliberate `text-left` JSX violation shows `Lint` check `bucket=fail` AND `mergeStateStatus=BLOCKED`'
    - 'A backend smoke PR with a deliberate `console.log` violation shows `Lint` check `bucket=fail` AND `mergeStateStatus=BLOCKED`'
    - 'Both smoke PRs are closed with `gh pr close --delete-branch` (never merged)'
    - 'D-17 net-new `eslint-disable` count across the phase (phase-48-base..HEAD) is 0'
    - 'Phase 47 outstanding follow-up #1 (deferred smoke PRs) is resolved by analogy in STATE.md'
  artifacts:
    - path: '(GitHub repo settings — branch protection on `main`)'
      provides: '`required_status_checks.contexts` includes `"Lint"`; `enforce_admins.enabled=true`'
      verify: 'gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection'
    - path: '/tmp/48-03-protection-before.json'
      provides: 'Snapshot of pre-PUT branch protection state for diff/audit (T-48-02 mitigation)'
    - path: '/tmp/48-03-protection-after.json'
      provides: 'Snapshot of post-PUT branch protection state'
    - path: '.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md'
      provides: 'Phase-wide D-17 reconciliation: zero net-new `eslint-disable` directives + ledger entry confirming compliance'
      contains: 'Phase-wide D-17 reconciliation'
  key_links:
    - from: 'GitHub branch protection on main'
      to: '.github/workflows/ci.yml job `Lint` (line 44 `name: Lint`)'
      via: '`required_status_checks.contexts` array containing `"Lint"` (exact casing — capital L)'
      pattern: 'Lint'
    - from: 'Smoke PR (deliberate violation)'
      to: 'Branch protection enforcement on main'
      via: 'gh pr checks <PR> → Lint bucket=fail; gh pr view <PR> --json mergeStateStatus → BLOCKED'
      pattern: 'BLOCKED'
phase_decisions_locked:
  D-15_branch_protection_update: 'Branch protection on `main` adds `"Lint"` to required_status_checks.contexts via gh api PUT with read-then-merge-then-write pattern (verbatim from 47-03 Task 4). enforce_admins=true MUST be preserved. Other existing contexts (`type-check`, `Security Scan`) MUST NOT be dropped.'
  D-16_smoke_pr_proof: 'Two smoke PRs (one per workspace) prove the gate BLOCKS — frontend injects a JSX `text-left` violation triggering no-restricted-syntax; backend injects raw `console.log` triggering no-console. Branch names `chore/test-lint-gate-{frontend,backend}` with explicit "DO NOT MERGE" in PR title.'
  D-17_audit_anchor: 'D-17 net-new eslint-disable scan uses `git diff phase-48-base..HEAD` — the tag was created in 48-01 Task 1. Acceptance: 0 net-new directives across the phase.'
  T-48-02_protection_merge: 'Branch-protection PUT body MUST merge `"Lint"` into the existing contexts array, NOT replace. GET-save-PUT-verify-diff pattern from 47-03 §6 / T-47-01.'
  T-48-03_smoke_pr_disposition: 'Both smoke PRs MUST be closed with `gh pr close --delete-branch` — never merged. Title carries `(DO NOT MERGE)`. T-47-03 mitigation lifted from 47-03 Task 5.'
  STATE_followup_resolution: 'STATE.md "Outstanding follow-ups" item #1 (Phase 47 deferred smoke PRs) is resolved by analogy when 48-03 lands successfully — same gate-blocks-on-required-context proof applies to both type-check and Lint via the same protection mechanism (RESEARCH §14).'
---

<objective>
Restore `Lint` as a PR-blocking CI gate on `main` so that a single lint error or warning in either workspace fails the merge check (LINT-09). Two structural moves:

1. **Branch protection PUT** — add `"Lint"` (exact casing — capital L, matching `name: Lint` at ci.yml:44) to `required_status_checks.contexts` alongside the existing `type-check` + `Security Scan` via the read-then-merge-then-write pattern verbatim from 47-03 Task 4. Preserve `enforce_admins: true`.
2. **Two smoke PRs** — one frontend, one backend, each with a deliberate violation. Both must show `Lint` check `bucket=fail` AND `mergeStateStatus=BLOCKED`. Both closed with `--delete-branch` immediately after the BLOCKED state is captured. This proves the gate BLOCKS (not just exists), closes Phase 47 outstanding follow-up #1 by analogy, and exits the milestone confident that lint regressions cannot reach `main`.

Also runs the phase-wide D-17 reconciliation: `git diff phase-48-base..HEAD | grep '^+.*eslint-disable' | wc -l` MUST return 0. The ledger entry lands in a new `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` (modeled on `47-EXCEPTIONS.md`).

Purpose: this is the gate-flip moment for the milestone. Without it, the new `Lint` job is informational; with it, the milestone's lint-zero invariant is enforceable on every future PR.

Output: branch protection JSON with `"Lint"` in contexts; two closed (BLOCKED) smoke PRs as proof; D-17 audit report in 48-EXCEPTIONS.md; STATE.md follow-up #1 marked resolved.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/48-lint-config-alignment/48-CONTEXT.md
@.planning/phases/48-lint-config-alignment/48-RESEARCH.md
@.planning/phases/48-lint-config-alignment/48-PATTERNS.md
@.planning/phases/48-lint-config-alignment/48-VALIDATION.md
@.planning/phases/48-lint-config-alignment/48-01-SUMMARY.md
@.planning/phases/48-lint-config-alignment/48-02-SUMMARY.md
@.planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md
@.planning/phases/47-type-check-zero/47-EXCEPTIONS.md
@./CLAUDE.md
@.github/workflows/ci.yml

<interfaces>
<!-- Repo identity (VERIFIED 2026-05-11 via gh repo view, RESEARCH §12.1):
       Owner: alzahrani-khalid
       Name:  Intl-Dossier-V2.0
       Default branch: main

     Branch protection current state (VERIFIED 2026-05-11 via gh api):
       required_status_checks.strict     = true
       required_status_checks.contexts   = ["type-check", "Security Scan"]
       enforce_admins.enabled            = true
       required_pull_request_reviews     = null
       restrictions                      = null

     Target state after Task 2:
       required_status_checks.contexts   = ["Lint", "Security Scan", "type-check"]  (sorted; order doesn't matter, presence does)
       enforce_admins.enabled            = true   (preserved)
       All other fields                  = byte-unchanged

     CI job name (RESEARCH §11.1, ci.yml:43–64 verbatim):
       lint:
         name: Lint           ← capital L; this is the string branch protection must match (RESEARCH §17.3 pitfall)

     Smoke PR mechanics (verbatim from PATTERNS §"Smoke PRs `chore/test-lint-gate-{frontend,backend}`" — same as 47-03 Task 5, only trip-wires differ):

     FRONTEND smoke trip-wire (RESEARCH §13.2 ASSUMED A2 — verify locally first):
       Append to frontend/src/App.tsx:
         const _smokeTest = <div className="text-left">x</div>
       The string literal "text-left" triggers no-restricted-syntax via the Literal[value=/.../] selector.
       (A comment-only injection does NOT match the rule; the rule walks AST Literal nodes, not comment text — RESEARCH §13.2.)
       Pre-push local verification: `pnpm exec eslint -c eslint.config.mjs frontend/src/App.tsx` MUST exit non-zero on the modified tree.

     BACKEND smoke trip-wire (unambiguous — no-console matches the CallExpression directly):
       Append to backend/src/index.ts:
         console.log("smoke-test")
       Pre-push local verification: `pnpm exec eslint -c eslint.config.mjs backend/src/index.ts` MUST exit non-zero on the modified tree.

     Required PR assertions (verbatim from 47-03 Task 5 — Issue 2 fix; mergeStateStatus NOT mergeable):
       gh pr checks <PR> --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'   # MUST return "fail"
       gh pr view <PR> --json mergeStateStatus -q .mergeStateStatus                              # MUST return "BLOCKED"

     Branch protection PUT body (minimum-required GitHub REST spec per 47-03 Task 4 "Issue 5 fix" — body trimmed):
       {
         "required_status_checks": {
           "strict": true,
           "contexts": ["type-check", "Security Scan", "Lint"]
         },
         "enforce_admins": true,
         "required_pull_request_reviews": null,
         "restrictions": null
       }
       (Fields lock_branch, allow_fork_syncing, required_linear_history, required_conversation_resolution, allow_force_pushes, allow_deletions are DROPPED to keep the body within the minimum-required spec — some repo tiers reject extra fields and abort the entire PUT.)

-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                                         | Description                                                                                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gh api PUT branches/main/protection`                            | A misconfigured PUT body could weaken existing protection (drop `type-check` or `Security Scan`; disable `enforce_admins`; change other rules).                  |
| CI workflow `name:` field → branch-protection `contexts:` string | Case-sensitive string equality. `"lint"` (lowercase) != `"Lint"`; mismatch makes the rule a no-op and merges proceed unblocked despite the JSON looking correct. |
| Smoke-test PRs → `main`                                          | Both PRs intentionally carry lint errors. They MUST NOT merge — close + delete branch is the only safe disposition.                                              |
| STATE.md edit                                                    | Updating the "Outstanding follow-ups" section to mark Phase 47 #1 resolved must not erase other state (audit trail).                                             |

## STRIDE Threat Register

| Threat ID | Category    | Component                                                                                                   | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ----------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-48-02   | Tampering   | Branch protection PUT could weaken protection (drop `type-check`/`Security Scan` or disable enforce_admins) | mitigate    | Task 1 captures `/tmp/48-03-protection-before.json` via gh api GET. Task 2 PUT body explicitly merges `"Lint"` into the existing contexts (`type-check`, `Security Scan`) rather than replacing. Task 2 acceptance criterion runs gh api GET again into `/tmp/48-03-protection-after.json` and diffs vs before to confirm no other rules were dropped. `enforce_admins: true` is explicitly in the PUT body (not omitted, which would default to false).                                  |
| T-48-02b  | Tampering   | YAML name typo (lowercase `lint` in contexts instead of capital `Lint`)                                     | mitigate    | Acceptance criterion in Task 2 asserts the exact casing: `gh api .../required_status_checks --jq '.contexts                                                                                                                                                                                                                                                                                                                                                                               | sort'`must include exactly`"Lint"`. The smoke PRs in Task 3 are the empirical confirmation — if the casing is wrong, the Lint check status will read pass (real lint passed) but mergeStateStatus will be CLEAN, not BLOCKED. That divergence reveals the typo. |
| T-48-03   | Repudiation | Smoke-test PR accidentally merged into main                                                                 | mitigate    | (1) Branch names `chore/test-lint-gate-{frontend,backend}` carry visible "DO NOT MERGE" naming. (2) PR titles include `(DO NOT MERGE)`. (3) PR bodies explicitly state "Will be closed without merging". (4) Task 3 ends with `gh pr close <PR#> --delete-branch` for both PRs — this happens BEFORE the SUMMARY is written. (5) The mergeStateStatus=BLOCKED state itself prevents accidental merge by anyone without admin bypass; with enforce_admins=true, even admins cannot bypass. |
| T-48-08   | Tampering   | D-17 net-new eslint-disable scan executes against the wrong base (e.g., `main` after smoke PRs close)       | mitigate    | Task 4 uses `phase-48-base` git tag (created in 48-01 Task 1) as the diff anchor — not `main`, not `git merge-base`. The tag is created BEFORE any phase work and is byte-stable across the phase. Acceptance criterion `git rev-parse phase-48-base` succeeds before the diff runs.                                                                                                                                                                                                      |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Pre-flight — confirm 48-01 + 48-02 landed; capture current branch-protection state</name>
  <files>(no files; pre-flight)</files>
  <read_first>
    - .planning/phases/48-lint-config-alignment/48-01-SUMMARY.md (verify exists)
    - .planning/phases/48-lint-config-alignment/48-02-SUMMARY.md (verify exists)
    - .planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md Task 1 (verbatim pre-flight pattern)
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-15
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §12.1 (current branch protection state VERIFIED 2026-05-11)
  </read_first>
  <action>
    1. Confirm both upstream plan summaries exist:
       ```
       ls .planning/phases/48-lint-config-alignment/48-01-SUMMARY.md
       ls .planning/phases/48-lint-config-alignment/48-02-SUMMARY.md
       ```
       Both MUST exist. If either is missing, STOP — return to executing the missing plan; 48-03 cannot run against an incomplete predecessor (CONTEXT phase_decisions_locked rule).

    2. Confirm both workspaces are at lint-zero on the merge base of this plan:
       ```
       pnpm --filter intake-frontend lint; echo "frontend lint exit=$?"
       pnpm --filter intake-backend lint;  echo "backend lint exit=$?"
       ```
       Both MUST print `exit=0`. If either is non-zero, STOP — route back to 48-02 gap closure. Flipping the gate on a still-red baseline blocks every PR including the smoke PRs.

    3. Confirm type-check is still at zero (Phase 47 zero-state preservation):
       ```
       pnpm --filter intake-frontend type-check; echo "frontend tc exit=$?"
       pnpm --filter intake-backend type-check;  echo "backend tc exit=$?"
       ```
       Both MUST print `exit=0`.

    4. Confirm the GitHub repo identity matches the planner-supplied owner/name:
       ```
       gh repo view --json nameWithOwner -q .nameWithOwner
       ```
       MUST print `alzahrani-khalid/Intl-Dossier-V2.0`.

    5. Capture the existing branch-protection state for the T-48-02 audit diff:
       ```
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
         > /tmp/48-03-protection-before.json 2>&1
       cat /tmp/48-03-protection-before.json | jq '{contexts: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}'
       ```
       Expected (per RESEARCH §12.1 VERIFIED 2026-05-11):
       ```
       { "contexts": ["type-check","Security Scan"], "enforce_admins": true }
       ```
       Save the full JSON to `/tmp/48-03-protection-before.json` (already saved in step above). Do NOT proceed if the response is the 404 "Branch not protected" payload — that would mean Phase 47's protection has been removed and Phase 48 cannot rely on the merge-then-write pattern.

    6. Confirm the `phase-48-base` tag exists:
       ```
       git rev-parse phase-48-base
       ```
       MUST return a 40-character SHA (created in 48-01 Task 1).

  </action>
  <verify>
    <automated>
      test -f .planning/phases/48-lint-config-alignment/48-01-SUMMARY.md
      test -f .planning/phases/48-lint-config-alignment/48-02-SUMMARY.md
      pnpm --filter intake-frontend lint
      pnpm --filter intake-backend lint
      pnpm --filter intake-frontend type-check
      pnpm --filter intake-backend type-check
      gh repo view --json nameWithOwner -q .nameWithOwner
      test -f /tmp/48-03-protection-before.json
      jq -e '.required_status_checks.contexts | index("type-check")' /tmp/48-03-protection-before.json
      jq -e '.enforce_admins.enabled' /tmp/48-03-protection-before.json
      git rev-parse phase-48-base
    </automated>
  </verify>
  <acceptance_criteria>
    - `test -f .planning/phases/48-lint-config-alignment/48-01-SUMMARY.md && test -f .planning/phases/48-lint-config-alignment/48-02-SUMMARY.md` exits 0.
    - `pnpm --filter intake-frontend lint; echo $?` returns 0.
    - `pnpm --filter intake-backend lint; echo $?` returns 0.
    - `pnpm --filter intake-frontend type-check; echo $?` returns 0.
    - `pnpm --filter intake-backend type-check; echo $?` returns 0.
    - `gh repo view --json nameWithOwner -q .nameWithOwner` outputs `alzahrani-khalid/Intl-Dossier-V2.0`.
    - `/tmp/48-03-protection-before.json` exists and contains a valid JSON object with `required_status_checks.contexts` non-null (NOT the 404 "Branch not protected" string).
    - `jq -e '.required_status_checks.contexts | index("type-check")' /tmp/48-03-protection-before.json` succeeds (current contexts include `type-check` — Phase 47 state intact).
    - `jq -e '.enforce_admins.enabled' /tmp/48-03-protection-before.json` outputs `true`.
    - `git rev-parse phase-48-base` returns a 40-char SHA.
  </acceptance_criteria>
  <done>Pre-flight passes; baseline confirmed; T-48-02 audit snapshot captured; phase-48-base tag confirmed.</done>
</task>

<task type="auto">
  <name>Task 2: Update branch protection on main — add `Lint` to required contexts (read-then-merge-then-write)</name>
  <files>(no files; GitHub API call — output captured to /tmp)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md Task 4 (verbatim PUT pattern + Issue 5 body-trim fix)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §12.2 (update command verbatim) and §17.3 (casing pitfall — `Lint` capital L matches `name: Lint` at ci.yml:44)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"Read-then-merge-then-write for branch-protection updates"
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-15
    - /tmp/48-03-protection-before.json (captured in Task 1)
    - .github/workflows/ci.yml line 43–44 (`lint:` job, `name: Lint` — confirm exact casing)
  </read_first>
  <action>
    Apply the read-then-merge-then-write pattern verbatim from 47-03 Task 4. The current contexts (per RESEARCH §12.1 VERIFIED 2026-05-11 + Task 1 capture) are `["type-check", "Security Scan"]`; this task adds `"Lint"` to produce `["type-check", "Security Scan", "Lint"]`.

    1. **Re-capture state immediately before the PUT** (catches any drift between Task 1 and now):
       ```
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
         > /tmp/48-03-protection-before-final.json 2>&1
       diff /tmp/48-03-protection-before.json /tmp/48-03-protection-before-final.json | head -40
       ```
       The diff should be empty or minimal (typically empty between Task 1 and Task 2 unless another admin touched protection). If non-empty changes appear that drop required contexts or disable enforce_admins, STOP — investigate before PUT.

    2. **Confirm the contexts to merge** by reading the captured state:
       ```
       jq -r '.required_status_checks.contexts[]' /tmp/48-03-protection-before-final.json
       ```
       Expected output (per RESEARCH §12.1):
       ```
       type-check
       Security Scan
       ```
       If the output is different (e.g., a new context was added by another admin), update the PUT body's `contexts` array in step 3 to include all existing contexts PLUS `"Lint"` — do NOT replace.

    3. **PUT the new protection config** with `Lint` added to the contexts list (assuming current state matches the VERIFIED RESEARCH §12.1 baseline — if step 2 revealed extra contexts, append them to the PUT body's contexts array):
       ```
       gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
         --input - <<'JSON'
       {
         "required_status_checks": {
           "strict": true,
           "contexts": ["type-check", "Security Scan", "Lint"]
         },
         "enforce_admins": true,
         "required_pull_request_reviews": null,
         "restrictions": null
       }
       JSON
       ```
       Body is trimmed to the minimum-required GitHub REST spec per 47-03 Task 4 "Issue 5 fix" — fields `lock_branch`, `allow_fork_syncing`, `required_linear_history`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions` are dropped (some repo tiers reject these and abort the PUT). The LINT-09 acceptance — `Lint` is in `contexts` AND `enforce_admins=true` — does not depend on the dropped fields.

    4. **Verify the rule landed** with sorted contexts assertion:
       ```
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
         > /tmp/48-03-protection-after.json
       cat /tmp/48-03-protection-after.json | jq '{contexts: (.required_status_checks.contexts | sort), strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}'
       ```
       Expected output (exactly):
       ```
       {
         "contexts": ["Lint", "Security Scan", "type-check"],
         "strict": true,
         "enforce_admins": true
       }
       ```

    5. **Diff before/after to confirm no rules dropped** (T-48-02 mitigation):
       ```
       diff <(jq -S '.required_status_checks.contexts | sort' /tmp/48-03-protection-before-final.json) \
            <(jq -S '.required_status_checks.contexts | sort' /tmp/48-03-protection-after.json)
       ```
       Expected: the diff shows only the addition of `"Lint"`. Any other line change is a regression — STOP and roll back via `gh api -X PUT ... < /tmp/48-03-protection-before-final.json`-shaped body.

    Casing detail (RESEARCH §17.3): `"Lint"` is CAPITAL L. It must match `name: Lint` at `.github/workflows/ci.yml:44` exactly. The current context `"Security Scan"` is title-case (matches `name: Security Scan` elsewhere in ci.yml); the current context `"type-check"` is lowercase (matches `name: type-check` from Phase 47). Each context string mirrors the `name:` field of the corresponding GHA job byte-for-byte.

    Do NOT commit anything in this task — branch protection lives in GitHub settings, not in the repo.

  </action>
  <verify>
    <automated>
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'
      test -f /tmp/48-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("Lint")' /tmp/48-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("type-check")' /tmp/48-03-protection-after.json
      jq -e '.required_status_checks.contexts | index("Security Scan")' /tmp/48-03-protection-after.json
    </automated>
  </verify>
  <acceptance_criteria>
    - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'` outputs `Lint,Security Scan,type-check` (exact casing).
    - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'` outputs `true`.
    - `/tmp/48-03-protection-after.json` exists and is a valid JSON document (NOT 404 "Branch not protected").
    - `jq -e '.required_status_checks.contexts | index("Lint")' /tmp/48-03-protection-after.json` succeeds (index is non-null).
    - `jq -e '.required_status_checks.contexts | index("type-check")' /tmp/48-03-protection-after.json` succeeds (Phase 47 context preserved — no regression).
    - `jq -e '.required_status_checks.contexts | index("Security Scan")' /tmp/48-03-protection-after.json` succeeds (Phase 47 context preserved).
    - `diff <(jq -S '.required_status_checks.contexts | sort' /tmp/48-03-protection-before-final.json) <(jq -S '.required_status_checks.contexts | sort' /tmp/48-03-protection-after.json)` shows only the `Lint` addition (no other contexts dropped — T-48-02 mitigation).
  </acceptance_criteria>
  <done>Branch protection on `main` requires `Lint` + `type-check` + `Security Scan`; enforce_admins=true preserved; T-48-02 audit diff shows clean addition.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Smoke-test PRs (frontend + backend) — observe Lint gate BLOCKS</name>
  <what-built>Branch protection now requires `Lint` per Task 2. This task is the proof D-16 demands — two deliberately-broken PRs (one per workspace) must be rejected by the gate. Resolves Phase 47 outstanding follow-up #1 by analogy.</what-built>
  <how-to-verify>
    Run two smoke PRs in sequence. Both must show `Lint` check `bucket=fail` AND `mergeStateStatus=BLOCKED`. Both close with `--delete-branch` immediately after BLOCKED is captured (T-48-03 mitigation).

    **Frontend smoke test (`chore/test-lint-gate-frontend`):**

    1. Branch from latest main:
       ```
       git fetch origin main
       git checkout -b chore/test-lint-gate-frontend origin/main
       ```

    2. Inject a deliberate JSX `text-left` violation (RESEARCH §13.2 A2 — the no-restricted-syntax rule's `Literal[value=/.../]` AST selector matches real string literals in JSX className props, NOT comments). Append exactly this line to `frontend/src/App.tsx`:
       ```
       const _smokeTest = <div className="text-left">x</div>
       ```
       Pre-push local verification — confirm the rule fires on this single file before pushing:
       ```
       pnpm exec eslint -c eslint.config.mjs frontend/src/App.tsx 2>&1 | grep -E "no-restricted-syntax|text-left"
       ```
       MUST emit at least one match. If it does not match, the injection target is wrong — adjust to inject inside an actual TSX fragment in the body of a function/component rather than at module top-level, until the local eslint run flags the violation.

    3. Commit and push:
       ```
       git add frontend/src/App.tsx
       git commit -m "chore: smoke-test lint gate frontend (DO NOT MERGE)"
       git push -u origin chore/test-lint-gate-frontend
       gh pr create --base main \
         --title "chore: smoke-test lint gate frontend (DO NOT MERGE)" \
         --body "LINT-09 verification per CONTEXT D-16. Injects one lint error to confirm the lint gate blocks merges. Will be closed without merging."
       ```

    4. Wait for CI:
       ```
       PR_FE=$(gh pr view --json number -q .number)
       echo "Frontend smoke PR number: $PR_FE"
       gh pr checks $PR_FE --watch
       ```

    5. **Required state assertions:**
       ```
       gh pr checks $PR_FE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'
       # MUST return "fail"

       gh pr view $PR_FE --json mergeStateStatus -q .mergeStateStatus
       # MUST return "BLOCKED"   (NOT "MERGEABLE" — per 47-03 Issue 2 fix, mergeable returns "MERGEABLE" for branches without git conflicts even when required checks fail; mergeStateStatus is the correct field)

       gh pr checks $PR_FE --json name,state,bucket --jq '.[] | select(.name=="type-check") | .bucket'
       # MUST return "pass"   (only Lint fails — clean attribution; type-check still passes because the violation is a lint rule, not a TS error)
       ```

    6. **Close, do NOT merge** (T-48-03):
       ```
       gh pr close $PR_FE --delete-branch
       ```

    7. Capture evidence: `gh pr checks $PR_FE --json name,bucket > /tmp/48-03-pr-fe-checks.json` (output is preserved even after close).

    **Backend smoke test (`chore/test-lint-gate-backend`):**

    8. Branch from latest main:
       ```
       git checkout main && git pull
       git checkout -b chore/test-lint-gate-backend origin/main
       ```

    9. Inject a raw `console.log` (no-console matches CallExpression directly — unambiguous):
       ```
       printf '\nconsole.log("smoke-test")\n' >> backend/src/index.ts
       ```
       Pre-push local verification:
       ```
       pnpm exec eslint -c eslint.config.mjs backend/src/index.ts 2>&1 | grep -E "no-console"
       ```
       MUST emit a match.

    10. Commit, push, open PR:
        ```
        git add backend/src/index.ts
        git commit -m "chore: smoke-test lint gate backend (DO NOT MERGE)"
        git push -u origin chore/test-lint-gate-backend
        gh pr create --base main \
          --title "chore: smoke-test lint gate backend (DO NOT MERGE)" \
          --body "LINT-09 verification (backend half) per CONTEXT D-16."
        PR_BE=$(gh pr view --json number -q .number)
        echo "Backend smoke PR number: $PR_BE"
        gh pr checks $PR_BE --watch
        ```

    11. Required state assertions (same shape as frontend):
        ```
        gh pr checks $PR_BE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'    # MUST return "fail"
        gh pr view $PR_BE --json mergeStateStatus -q .mergeStateStatus                                # MUST return "BLOCKED"
        gh pr checks $PR_BE --json name,state,bucket --jq '.[] | select(.name=="type-check") | .bucket'  # MUST return "pass"
        ```

    12. Close:
        ```
        gh pr close $PR_BE --delete-branch
        gh pr checks $PR_BE --json name,bucket > /tmp/48-03-pr-be-checks.json
        ```

    **User signal-back:** Post both PR URLs (closed) and the `gh pr checks` JSON evidence. If EITHER smoke PR shows `Lint: pass` (real lint passed) or `mergeStateStatus: CLEAN`, STOP — that means the gate is not actually wired (RESEARCH §17.3 — likely a casing mismatch in the protection contexts vs the GHA job's `name:` field). Recovery: re-read Task 2 step 4 acceptance criterion, fix the contexts string, re-run Task 3.

  </how-to-verify>
  <resume-signal>Type "approved — both smoke tests blocked" with the two PR URLs and a paste of `gh pr checks` showing `Lint: fail` + `mergeStateStatus: BLOCKED` for each, OR "blocked — &lt;reason&gt;"</resume-signal>
</task>

<task type="auto">
  <name>Task 4: Phase-wide D-17 reconciliation + create 48-EXCEPTIONS.md</name>
  <files>.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (the analog ledger from Phase 47 — Phase 48's exceptions file mirrors its shape)
    - .planning/phases/47-type-check-zero/47-03-ci-gate-and-branch-protection-PLAN.md Task 6 (verbatim D-17 scan pattern, only the grep target differs: `@ts-(ignore|expect-error)` → `eslint-disable`)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §19 ("Wave 0 Gaps" — D-17 audit method) and §17.4 (no-regression posture)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"D-17 net-new eslint-disable scan"
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-17
  </read_first>
  <action>
    Run the D-17 audit verbatim from PATTERNS, then write the ledger to `48-EXCEPTIONS.md`.

    1. **Verify the phase-48-base tag still exists** (sanity check; created in 48-01 Task 1):
       ```
       git rev-parse phase-48-base
       ```
       MUST succeed. If not, STOP — the diff anchor is gone; D-17 cannot run honestly.

    2. **Count net-new `eslint-disable` directives across the phase** (RESEARCH §19 acceptance criterion):
       ```
       git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
         | grep -E '^\+.*eslint-disable' \
         | grep -vE '^\+\+\+' \
         > /tmp/48-03-eslint-disable-additions.txt
       wc -l < /tmp/48-03-eslint-disable-additions.txt
       ```
       MUST return 0 (D-17 compliance — zero net-new directives across the entire phase). If the count is non-zero, list the offenders in `/tmp/48-03-eslint-disable-additions.txt` — each is a line that this phase added. Fix at the call site (replace the directive with a real code-level resolution), do NOT log to EXCEPTIONS.md as a retained suppression. The D-17 rule is "zero net-new", not "log and continue".

    3. **Count net-new `@ts-(ignore|expect-error|nocheck)` directives** (TYPE-04 carry-forward from Phase 47 D-01 — Phase 48 should not regress type-check zero state by adding TS suppressions either):
       ```
       git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
         | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' \
         | grep -vE '^\+\+\+' \
         > /tmp/48-03-ts-suppression-additions.txt
       wc -l < /tmp/48-03-ts-suppression-additions.txt
       ```
       Expected: 0 (Phase 48 is a lint phase; it should not add new TS suppressions). If non-zero, list and resolve via call-site fixes.

    4. **Write `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md`** modeled on `47-EXCEPTIONS.md`. Include exactly these sections:

       ```
       # Phase 48 — EXCEPTIONS Ledger

       ## Phase-wide D-17 reconciliation

       | Metric | Target | Observed | Status |
       |--------|--------|----------|--------|
       | Net-new `eslint-disable` (frontend/src + backend/src, phase-48-base..HEAD) | 0 | <observed count> | PASS / FAIL |
       | Net-new `@ts-(ignore|expect-error|nocheck)` (carry-forward Phase 47 D-01) | 0 | <observed count> | PASS / FAIL |
       | Stale `eslint-disable` deletions (48-02 Task 3) | ≥ 10 (9 directives + 1 from FirstRunModal scope) | <observed deletion count> | PASS / FAIL |

       ## Retained suppressions

       (None expected. If any exist, list with: file path, rule name, reason, follow-up issue/reference.)

       ## Phase scope summary

       - Files touched (phase-48-base..HEAD): <list from `git diff --name-only phase-48-base..HEAD`>
       - Aceternity wrappers deleted: 3d-card.tsx, bento-grid.tsx, floating-navbar.tsx (D-07)
       - Configs consolidated: frontend/eslint.config.js deleted (D-01); root eslint.config.mjs holds inverted no-restricted-imports (D-05/D-06).
       - Branch protection updated: `Lint` added to required_status_checks.contexts; enforce_admins=true preserved (D-15).
       - Smoke PRs verified: <frontend PR URL> (closed), <backend PR URL> (closed) — both BLOCKED.
       ```

       Substitute the `<observed ...>` placeholders with the real counts from steps 2 and 3 and the PR URLs from Task 3. The "Status" column reads `PASS` when the observed count meets the target, `FAIL` otherwise. Any `FAIL` row triggers an immediate return to a gap-closure task — `48-EXCEPTIONS.md` is only committed once all rows read `PASS`.

    5. Commit `48-EXCEPTIONS.md`:
       ```
       git add .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
       git commit -m "docs(48-03): D-17 reconciliation — zero net-new eslint-disable across phase"
       ```

  </action>
  <verify>
    <automated>
      git rev-parse phase-48-base
      git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' | wc -l
      git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error|nocheck)' | grep -vE '^\+\+\+' | wc -l
      test -f .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
      grep -c "Phase-wide D-17 reconciliation" .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md
    </automated>
  </verify>
  <acceptance_criteria>
    - `git rev-parse phase-48-base` returns a 40-char SHA.
    - `git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\\+.*eslint-disable' | grep -vE '^\\+\\+\\+' | wc -l` returns 0 (D-17 satisfied — zero net-new directives across the entire phase).
    - `git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\\+.*@ts-(ignore|expect-error|nocheck)' | grep -vE '^\\+\\+\\+' | wc -l` returns 0 (no new TS suppressions introduced).
    - `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` exists.
    - `grep -c "Phase-wide D-17 reconciliation" .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` returns 1.
    - The "Status" column for all three D-17 metrics in 48-EXCEPTIONS.md reads `PASS` (not `FAIL`).
  </acceptance_criteria>
  <done>D-17 reconciliation logged; zero net-new eslint-disable directives across the phase; 48-EXCEPTIONS.md committed.</done>
</task>

<task type="auto">
  <name>Task 5: Resolve STATE.md outstanding follow-up #1 + record Phase 48 close-out</name>
  <files>.planning/STATE.md</files>
  <read_first>
    - .planning/STATE.md (current "Outstanding follow-ups" section — line ~36, item #1 is the Phase 47 smoke PR follow-up)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §14 (Phase 47 follow-up resolution by analogy)
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-16 (smoke PR proof)
    - .planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md (just created in Task 4)
  </read_first>
  <action>
    Update STATE.md to (a) mark Phase 47's smoke-PR follow-up resolved, and (b) record Phase 48 as complete.

    1. **Mark Phase 47 outstanding follow-up #1 resolved by analogy** (RESEARCH §14):
       Locate the "Outstanding follow-ups (small)" subsection (currently around line 36–39 of STATE.md). Edit item #1 (Phase 47 smoke PRs) to:
       ```
       1. **47-03 Task 5 smoke PRs** — RESOLVED 2026-05-11 by analogy via Phase 48 D-16 smoke PRs. Same gate-blocks-on-required-context proof applies to both `type-check` and `Lint` via the same protection mechanism. Phase 48 frontend PR <FE-URL> and backend PR <BE-URL> both showed `<gate>: fail` + `mergeStateStatus: BLOCKED`. Phase 47 #1 closed.
       ```
       Substitute `<FE-URL>` and `<BE-URL>` with the real PR URLs from Task 3.

    2. **Update "Current Position"** (currently around lines 26–30):
       Change `Phase: 47 (type-check-zero) — SUCCESS (11/11 plans)` to `Phase: 48 (lint-and-config-alignment) — SUCCESS (3/3 plans)`.
       Update `Status` to reflect: `Frontend lint 0 ✓ ; Backend lint 0 ✓ ; CI Lint job + branch protection live on main (Lint + type-check + Security Scan with enforce_admins=true) ; Two D-16 smoke PRs verified BLOCKED`.
       Update `Last activity` to today's date with a Phase 48 completion note.

    3. **Update "Next Action"** to reflect Phase 49 readiness:
       Replace the Phase 47 close-out narrative with a 2–3 sentence Phase 48 close-out followed by "Next phase: **Phase 49 — bundle-budget-reset (BUNDLE-01..04)** is unblocked. The lint gate is now PR-blocking; bundle changes ride on a typed + linted baseline."

    4. **Update the v6.2 Progress table** (currently around line 207 — `| 48 | v6.2 | 0/0 | Not started | - |`):
       Change to `| 48 | v6.2 | 3/3 | Complete | 2026-05-11 |` (substitute today's date).
       Recompute the milestone progress percentage at the top of the file (`gsd_state_version` frontmatter `progress` block): `total_plans` and `completed_plans` increment by 3 (47 had 11/11; now 14/14 across phases 47+48).

    5. **Append to STATE.md "Accumulated Context → Decisions"** (around line 339+):
       Add new entries with the `[v6.2/48-XX]` prefix:
       - `[v6.2/48-01]`: Root `eslint.config.mjs` is the single canonical config; `frontend/eslint.config.js` was deleted because its shadow position diverged the local lint count (~92) from the ROADMAP baseline (~723). Inverted `no-restricted-imports` to ban Aceternity / Kibo UI per CLAUDE.md primitive cascade.
       - `[v6.2/48-02]`: ~30 frontend call-site fixes + 2 backend at source (Winston `logInfo`, type alias). Zero rule downgrades. `**/__tests__/**` carve-out across check-file blocks (RESEARCH §3 Path A) cleared 96 folder-naming errors with inline rationale per D-10.
       - `[v6.2/48-03]`: Branch protection on `main` now requires `Lint` + `type-check` + `Security Scan` with `enforce_admins=true`. Both D-16 smoke PRs verified `mergeStateStatus=BLOCKED`. D-17 phase-wide audit returned 0 net-new eslint-disable directives. Resolves Phase 47 outstanding follow-up #1 by analogy.

    6. Commit STATE.md:
       ```
       git add .planning/STATE.md
       git commit -m "docs(48-03): close Phase 48 — Lint gate live + Phase 47 followup #1 resolved by analogy"
       ```

  </action>
  <verify>
    <automated>
      grep -c "Phase 48 D-16 smoke PRs" .planning/STATE.md
      grep -cE "Phase: 48|lint-and-config-alignment.*SUCCESS" .planning/STATE.md
      grep -c "v6.2/48-01" .planning/STATE.md
      grep -c "v6.2/48-02" .planning/STATE.md
      grep -c "v6.2/48-03" .planning/STATE.md
      grep -E "^\| 48 \|" .planning/STATE.md | grep -c "Complete"
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "Phase 48 D-16 smoke PRs" .planning/STATE.md` returns ≥1 (the resolution sentence is present).
    - `grep -cE "Phase: 48|lint-and-config-alignment.*SUCCESS" .planning/STATE.md` returns ≥1 (Current Position updated).
    - `grep -c "v6.2/48-01" .planning/STATE.md` returns 1 (decision entry added).
    - `grep -c "v6.2/48-02" .planning/STATE.md` returns 1.
    - `grep -c "v6.2/48-03" .planning/STATE.md` returns 1.
    - `grep -E "^\\| 48 \\|" .planning/STATE.md | grep -c "Complete"` returns 1 (v6.2 Progress table row updated).
    - The real frontend + backend smoke PR URLs from Task 3 appear in the Phase 47 follow-up resolution paragraph (no `<FE-URL>` / `<BE-URL>` placeholders remain).
  </acceptance_criteria>
  <done>STATE.md reflects Phase 48 complete; Phase 47 follow-up #1 resolved by analogy; ready for Phase 49 to start.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'` outputs exactly `Lint,Security Scan,type-check`.
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'` outputs `true`.
- Both smoke PRs (`chore/test-lint-gate-frontend`, `chore/test-lint-gate-backend`) are closed (state=`CLOSED`, not `MERGED`); their respective branches are deleted from origin.
- `/tmp/48-03-pr-fe-checks.json` and `/tmp/48-03-pr-be-checks.json` both contain `Lint: fail` evidence.
- `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md` exists and reports D-17 PASS for all three metrics.
- `git diff phase-48-base..HEAD | grep '^+.*eslint-disable' | grep -v '^+++' | wc -l` returns 0.
- `.planning/STATE.md` shows Phase 48 SUCCESS; Phase 47 follow-up #1 marked resolved.
</verification>

<success_criteria>

- LINT-09 (from ROADMAP): The lint job runs as a PR-blocking CI gate on both frontend and backend; a PR introducing a single lint error in either workspace fails the merge check on `main`. PROOF: Task 3's two smoke PRs both showed `Lint` check `fail` + `mergeStateStatus=BLOCKED`.
- D-15: Branch protection on `main` requires `Lint` alongside `type-check` + `Security Scan`; `enforce_admins=true` preserved.
- D-16: Two smoke PRs proved the gate BLOCKS (not just exists); both closed with `--delete-branch`.
- D-17: Zero net-new `eslint-disable` directives across the entire phase (phase-48-base..HEAD).
- Phase 47 outstanding follow-up #1 resolved by analogy (RESEARCH §14).
- STATE.md updated: Phase 48 SUCCESS; v6.2 progress table reflects 3/3 plans complete; Phase 49 unblocked.
  </success_criteria>

<output>
After completion, create `.planning/phases/48-lint-config-alignment/48-03-SUMMARY.md` recording:
- Final branch-protection state (paste of `gh api .../protection` post-PUT).
- Both smoke PR URLs + their `gh pr checks` JSON evidence.
- The D-17 reconciliation table from `48-EXCEPTIONS.md`.
- Confirmation that Phase 47 follow-up #1 is marked resolved in STATE.md.
- Any deviations (e.g., if the protection state at Task 2 included unexpected extra contexts that were merged into the PUT body).
- Phase 48 close-out verdict (target: SUCCESS).
</output>
