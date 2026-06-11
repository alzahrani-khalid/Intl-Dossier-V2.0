---
phase: 47
plan: 03
type: execute
wave: 2
depends_on: [47-01, 47-02]
files_modified:
  - .github/workflows/ci.yml
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: false
requirements: [TYPE-03, TYPE-04]
must_haves:
  truths:
    - 'A dedicated CI job named `type-check` runs on every push and pull_request, calls `pnpm --filter frontend type-check && pnpm --filter backend type-check` directly (not `pnpm typecheck`), and is green on first run after merge'
    - 'The redundant `Check TypeScript` step is removed from the existing `Lint` job (clean attribution per D-08)'
    - 'The four downstream jobs (`test-rtl-responsive`, `test-a11y`, `bundle-size-check`, `build`) require both `lint` AND `type-check` via `needs:`'
    - 'Branch protection on `main` requires both `Lint` and `type-check` checks AND `enforce_admins=true`'
    - 'Two smoke-test PRs (one frontend TS error, one backend TS error) demonstrate the gate BLOCKS — both PRs have `type-check` failure status and are merge-blocked'
    - 'Phase-wide net-new `@ts-ignore` / `@ts-expect-error` count = 0 (or every match has a corresponding 47-EXCEPTIONS.md entry per D-02)'
  artifacts:
    - path: '.github/workflows/ci.yml'
      provides: 'type-check job (parallel to lint, both depending on repo-policy); lint job stripped of its tsc step; four downstream needs: arrays updated'
      contains: 'type-check:'
    - path: '(no file — GitHub repo settings)'
      provides: "Branch protection rule on main with required_status_checks.contexts including 'Lint' and 'type-check' AND enforce_admins=true"
      verify: 'gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection'
  key_links:
    - from: '.github/workflows/ci.yml job:type-check'
      to: 'frontend/package.json + backend/package.json scripts.type-check'
      via: 'pnpm --filter <ws> type-check (NOT pnpm typecheck — turbo runs build first per D-12 / RESEARCH §11.5)'
      pattern: 'pnpm --filter (frontend|backend) type-check'
    - from: 'GitHub branch protection on main'
      to: 'ci.yml job:type-check (name: type-check)'
      via: "required_status_checks.contexts includes 'type-check' (and 'Lint')"
      pattern: 'type-check'
    - from: 'Smoke-test PR (deliberate TS error injected)'
      to: 'Mergeable: false; type-check check status: failure'
      via: 'gh pr checks <PR#> --json state,bucket'
      pattern: 'fail'
phase_decisions_locked:
  D-08_CI_split_post_zero: 'This plan runs ONLY after 47-01 and 47-02 land. If main currently shows red type-check (because 47-01/47-02 have not merged), STOP — splitting before zero births the new job red, which prevents flipping the gate on. First task acceptance includes `pnpm --filter frontend type-check; echo $?` AND `pnpm --filter backend type-check; echo $?` both returning 0 on the merge base of this plan.'
  T-47-01_protection_merge_pattern: 'The branch-protection update MUST use a read-then-merge-then-write pattern. The current protection state may already include other contexts (none today, per Q1 — but future state may differ). Task 3 first GETs `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`, captures the JSON to `/tmp/47-03-protection-before.json`, then PUTs a config that ADDS `Lint` and `type-check` to existing `contexts` (not replaces). enforce_admins MUST be true (CONTEXT D-09).'
  smoke_test_after_protection: 'Per RESEARCH §6.3, smoke-test PRs run AFTER branch protection is set, NOT before. Running before the rule lands would surface the failure as a Lint job failure (pre-split) or as advisory (post-split, pre-protection) — neither proves D-13.'
  turbo_dependsOn_deferred: "Per planner directive, `turbo.json type-check.dependsOn: ['build']` cleanup is deferred OUT OF SCOPE for Phase 47. CI bypasses turbo by calling per-workspace scripts directly; the cleanup is not on the critical path for TYPE-01..04."
---

<objective>
Restore type-check as a PR-blocking CI gate on `main` so a single TS error in either workspace cannot reach `main` (TYPE-03). Split the existing `Lint` job's two responsibilities into separate `Lint` and `type-check` jobs (per D-08 / RESEARCH §5), update the four downstream `needs:` chains, set GitHub branch protection on `main` requiring both checks (per D-09 / Q1 resolution — branch protection does not exist today), and prove the gate enforces by opening two deliberately-broken smoke-test PRs and observing them blocked (per D-13 / RESEARCH §6).

**Purpose:** Without branch protection, the new `type-check` job is informational only — Q1 evidence shows the existing `Lint` job has been red on every push to `main` for ≥5 consecutive runs over 5 days yet work continues unblocked because there is no rule. Adding the rule is the gate-flip moment.

**Output:** New CI job structure; updated branch protection config; two confirmed-blocked smoke-test PRs; phase-wide TYPE-04 reconciliation showing zero net-new suppressions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/47-type-check-zero/47-CONTEXT.md
@.planning/phases/47-type-check-zero/47-RESEARCH.md
@.planning/phases/47-type-check-zero/47-VALIDATION.md
@.planning/research/Q1-ci-gate-status.md
@./CLAUDE.md
@.github/workflows/ci.yml

<interfaces>
<!-- Repo identity (verified `gh repo view`):
       Owner: alzahrani-khalid
       Name:  Intl-Dossier-V2.0
       Default branch: main

     CI structure today (RESEARCH §5 + Q1 evidence):
       Lint job (.github/workflows/ci.yml lines 43–68):
         - line 65: `run: pnpm run lint`
         - line 67–68: `- name: Check TypeScript`  +  `run: pnpm run typecheck`
         - name: 'Lint'
         - needs: [repo-policy]
         - no continue-on-error
       Downstream jobs with `needs: [lint]` (verified file:line):
         - line 156: test-rtl-responsive  →  needs: [lint]
         - line 192: test-a11y            →  needs: [lint]
         - line 228: build                →  needs: [lint, test-unit]
         - line 263: bundle-size-check    →  needs: [lint]
       security-scan (line 372): no `needs:` — leave alone.

     CI structure target (RESEARCH §5):
       Lint job: just ESLint (remove the tsc step at lines 67–68)
       NEW type-check job: parallel to Lint, needs:[repo-policy], same setup steps + checkout/pnpm/node/install,
                            then `pnpm --filter frontend type-check` then `pnpm --filter backend type-check`
                            (both per-workspace scripts directly — NOT `pnpm typecheck` because turbo.json line 23
                            has `dependsOn: ['build']` for the type-check task per D-12 / RESEARCH §11.5).
       Downstream `needs:` arrays: each `[lint]` becomes `[lint, type-check]`; `[lint, test-unit]` becomes `[lint, type-check, test-unit]`.

     Branch protection target state (RESEARCH §6.2):
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection
         .required_status_checks.contexts → includes BOTH "Lint" AND "type-check"
         .required_status_checks.strict   → true
         .enforce_admins.enabled          → true (CONTEXT D-09)

     Smoke-test recipe (RESEARCH §6.1):
       1. Branch chore/test-type-check-gate-frontend from main.
       2. Inject one TS error: append `const _smokeTest: string = 42;` to any frontend file.
       3. git push -u origin chore/test-type-check-gate-frontend.
       4. gh pr create --base main --title 'chore: smoke-test type-check gate (DO NOT MERGE)' --body '...'
       5. Wait for CI. Verify: gh pr checks <PR#>  →  type-check status = fail.
                                gh pr view <PR#> --json mergeable  →  mergeable: false (or BLOCKED).
       6. gh pr close <PR#> --delete-branch.
       7. Repeat for backend on chore/test-type-check-gate-backend.

     Pre-existing suppressions inventory (RESEARCH §11.12 — for Task 5 phase-wide suppression check):
       frontend/src/routeTree.gen.ts  // @ts-nocheck (generated; standard)
       frontend/src/components/intake-form/IntakeForm.tsx  // @ts-expect-error Type instantiation too deep
       frontend/src/components/signature-visuals/__tests__/Icon.test.tsx  // @ts-expect-error — runtime fallback
       Plus net-new @ts-nocheck added by 47-01 Task 2 + 47-02 Task 2 (both on database.types.ts; logged in EXCEPTIONS.md).
       Net-new @ts-ignore / @ts-expect-error: MUST be 0. -->

Exact CI YAML insert (matches RESEARCH §5.1 verbatim, with `name: type-check` for branch-protection ergonomics):

```yaml
type-check:
  name: type-check
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: ${{ env.PNPM_VERSION }}
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Type-check frontend
      run: pnpm --filter frontend type-check
    - name: Type-check backend
      run: pnpm --filter backend type-check
```

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                 | Description                                                                                                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub repo settings → branch protection | A single misconfigured PUT call could weaken existing protection (drop required checks, disable enforce_admins, change other rules).                                          |
| CI workflow → enforced gate              | A typo in `name:` (e.g. `type_check` vs `type-check`) breaks the link between branch protection and the actual job — protection becomes a no-op, work merges with red checks. |
| Smoke-test PR → main                     | The smoke-test PRs intentionally have a TS error. They MUST NOT merge; close + delete branch is the only safe disposition.                                                    |

## STRIDE Threat Register

| Threat ID   | Category    | Component                                                              | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------- | ---------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-47-01     | Tampering   | Branch protection update on main (gh api PUT)                          | mitigate    | Task 3 reads existing protection state via `gh api GET` and saves to `/tmp/47-03-protection-before.json` BEFORE any PUT. The PUT body merges `Lint` and `type-check` into existing `contexts` (does not replace). Acceptance criterion compares before/after to confirm no other rules were dropped. enforce_admins=true is set explicitly per D-09. |
| T-47-02     | Tampering   | YAML name typo                                                         | mitigate    | Acceptance criterion runs `gh api repos/.../branches/main/protection/required_status_checks --jq '.contexts'` AFTER protection is set AND after the smoke PR is open, and asserts both `"Lint"` and `"type-check"` are listed. The smoke-test (Task 4) is the only proof the names match the actual jobs.                                            |
| T-47-03     | Repudiation | Smoke-test PR accidentally merged                                      | mitigate    | Smoke-test branch names are prefixed `chore/test-type-check-gate-*` (visible "DO NOT MERGE" naming). PR body explicitly states "DO NOT MERGE — close + delete branch when verified". Task 4 ends with `gh pr close <PR#> --delete-branch` for both.                                                                                                  |
| T-47-NetNew | Tampering   | Net-new @ts-ignore / @ts-expect-error introduced anywhere in the phase | mitigate    | Task 5 runs the phase-wide diff scan. If count > 0 AND no matching EXCEPTIONS.md row exists, the task fails and routes to gap-closure.                                                                                                                                                                                                               |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Pre-flight — verify 47-01 and 47-02 are landed and main is green</name>
  <files>(no files; pre-flight)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §6.3 ("Do not run the smoke test before plan 47-03 lands" — corollary: do not run 47-03 before 47-01 + 47-02 land)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-08 (split happens AFTER zero, not before)
    - .planning/research/Q1-ci-gate-status.md
  </read_first>
  <action>
    1. Confirm 47-01 and 47-02 have merged into the working branch:
       ```bash
       ls .planning/phases/47-type-check-zero/47-01-SUMMARY.md
       ls .planning/phases/47-type-check-zero/47-02-SUMMARY.md
       ```
       Both must exist.
    2. Confirm both workspaces type-check is at zero on the local checkout:
       ```bash
       pnpm --filter frontend type-check; echo "frontend exit=$?"
       pnpm --filter backend type-check;  echo "backend exit=$?"
       ```
       Both MUST print `exit=0`. If either is non-zero, STOP — return to gap-closure for the failing plan; do not run this plan against a still-red baseline (D-08 violation).
    3. Confirm the GitHub repo identity matches the planner-supplied owner/name:
       ```bash
       gh repo view --json nameWithOwner -q .nameWithOwner
       # must print: alzahrani-khalid/Intl-Dossier-V2.0
       ```
    4. Capture the existing branch-protection state for later diff:
       ```bash
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/47-03-protection-before.json 2>&1
       cat /tmp/47-03-protection-before.json
       ```
       Today this returns 404 "Branch not protected" per Q1 evidence — that is expected. The capture is for audit even when the response is 404.
  </action>
  <verify>
    <automated>
      test -f .planning/phases/47-type-check-zero/47-01-SUMMARY.md && test -f .planning/phases/47-type-check-zero/47-02-SUMMARY.md && echo "summaries exist"
      pnpm --filter frontend type-check; echo "fe=$?"
      pnpm --filter backend type-check; echo "be=$?"
      test -f /tmp/47-03-protection-before.json && echo "captured"
    </automated>
  </verify>
  <acceptance_criteria>
    - Both 47-01-SUMMARY.md and 47-02-SUMMARY.md exist.
    - `pnpm --filter frontend type-check; echo $?` returns 0.
    - `pnpm --filter backend type-check; echo $?` returns 0.
    - `/tmp/47-03-protection-before.json` exists and contains either `"Branch not protected"` (today's state) or a valid protection JSON object.
    - `gh repo view --json nameWithOwner -q .nameWithOwner` returns `alzahrani-khalid/Intl-Dossier-V2.0`.
  </acceptance_criteria>
  <done>Pre-flight passes; 47-03 is safe to run.</done>
</task>

<task type="auto">
  <name>Task 2: Edit ci.yml — insert type-check job, strip tsc from Lint job, update four needs: arrays</name>
  <files>.github/workflows/ci.yml</files>
  <read_first>
    - .github/workflows/ci.yml lines 43–68 (Lint job — template + the two lines to delete: `- name: Check TypeScript` and `run: pnpm run typecheck`)
    - .github/workflows/ci.yml line 156 (test-rtl-responsive needs)
    - .github/workflows/ci.yml line 192 (test-a11y needs)
    - .github/workflows/ci.yml line 228 (build needs)
    - .github/workflows/ci.yml line 263 (bundle-size-check needs)
    - .github/workflows/ci.yml line 372 (security-scan — confirm no needs:; leave alone)
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §5.1 (exact YAML to insert), §5.2 (exact lines to delete from Lint), §5.3 (exact needs: array updates), §5.4 (validate locally before opening PR)
  </read_first>
  <action>
    1. **Insert the new `type-check:` job** immediately AFTER the existing `lint:` job ends (around line 68, after the `Check TypeScript` step that this task removes). The exact YAML block is in the `<interfaces>` section of this plan and matches RESEARCH §5.1 verbatim. Indentation MUST match the sibling `lint:` job (top-level under `jobs:`).
    2. **Delete the redundant tsc step from `lint:`** — remove these two lines (currently around lines 67–68):
       ```yaml
       - name: Check TypeScript
         run: pnpm run typecheck
       ```
       After this deletion, the `lint:` job's last step is `Run linting` (`pnpm run lint`).
    3. **Update four downstream `needs:` arrays** (file:line per RESEARCH §5.3):
       - line 156: `needs: [lint]` → `needs: [lint, type-check]`
       - line 192: `needs: [lint]` → `needs: [lint, type-check]`
       - line 228: `needs: [lint, test-unit]` → `needs: [lint, type-check, test-unit]`
       - line 263: `needs: [lint]` → `needs: [lint, type-check]`
       (Line numbers may shift slightly after the insert — locate by job name: `test-rtl-responsive`, `test-a11y`, `build`, `bundle-size-check`.)
    4. **Do NOT** touch `security-scan`'s missing `needs:` (RESEARCH §5.3 — it scans filesystem artifacts, not source compileability).
    5. **Do NOT** edit `turbo.json`'s `type-check.dependsOn: ["build"]`. Per planner directive (CONTEXT phase_decisions_locked) this is deferred OUT OF SCOPE for Phase 47; CI bypasses turbo by calling per-workspace scripts directly.
    6. Validate the YAML locally:
       ```bash
       gh workflow view ci.yml 2>&1 | head -50  # smoke check; if YAML is malformed, the response is an error
       ```
       If `yamllint` is available, run it; otherwise rely on the dry-run PR in Task 3.
  </action>
  <verify>
    <automated>
      grep -E "^  type-check:" .github/workflows/ci.yml | wc -l   # returns 1
      grep -E "    name: type-check" .github/workflows/ci.yml | wc -l   # returns 1
      grep -E "Type-check frontend|Type-check backend" .github/workflows/ci.yml | wc -l   # returns 2
      grep -cE "Check TypeScript" .github/workflows/ci.yml   # returns 0 (deleted from Lint)
      grep -cE "pnpm run typecheck" .github/workflows/ci.yml   # returns 0 (no longer called from Lint)
      grep -cE "needs: \[lint, type-check" .github/workflows/ci.yml   # returns ≥3 (test-rtl-responsive, test-a11y, bundle-size-check; build uses `[lint, type-check, test-unit]`)
      grep -cE "needs: \[lint, type-check, test-unit\]" .github/workflows/ci.yml   # returns 1 (build)
      grep -cE "^  security-scan:" .github/workflows/ci.yml   # returns 1 (still exists, untouched)
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep -E "^  type-check:" .github/workflows/ci.yml | wc -l` returns 1.
    - `grep -E "    name: type-check" .github/workflows/ci.yml | wc -l` returns 1.
    - `grep -cE "Check TypeScript" .github/workflows/ci.yml` returns 0.
    - `grep -cE "pnpm run typecheck" .github/workflows/ci.yml` returns 0.
    - `grep -cE "needs: \[lint, type-check\]" .github/workflows/ci.yml` returns ≥3.
    - `grep -cE "needs: \[lint, type-check, test-unit\]" .github/workflows/ci.yml` returns 1.
    - `git diff <task-base>..HEAD -- turbo.json | wc -l` returns 0 (turbo.json untouched per planner directive).
    - YAML is valid (no parser error from `gh workflow view ci.yml`).
  </acceptance_criteria>
  <done>ci.yml diff matches RESEARCH §5 spec; ready for PR-observe step.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Push wiring PR; observe both Lint and type-check checks green; merge</name>
  <what-built>The ci.yml diff from Task 2 — type-check job inserted, redundant tsc step removed from Lint, four downstream needs: arrays updated.</what-built>
  <how-to-verify>
    1. Push the wiring change to a feature branch, e.g. `chore/47-03-split-type-check-job`:
       ```bash
       git checkout -b chore/47-03-split-type-check-job
       git push -u origin chore/47-03-split-type-check-job
       gh pr create --base main \
         --title "chore(47-03): split type-check into its own CI job" \
         --body "Phase 47 plan 03 task 2. Inserts new type-check CI job parallel to Lint (per CONTEXT D-08, RESEARCH §5). Removes redundant tsc step from Lint job (clean attribution). Updates four downstream needs: arrays (test-rtl-responsive, test-a11y, build, bundle-size-check) to require both lint and type-check. No turbo.json or tsconfig changes (D-11, D-12 respected)."
       ```
    2. Wait for CI to complete on the PR. Observe via:
       ```bash
       PR=$(gh pr view --json number -q .number)
       gh pr checks $PR --watch
       ```
    3. **Required state:**
       - `Lint` check appears as a separate item with conclusion `pass`.
       - `type-check` check appears as a separate item with conclusion `pass`.
       - All four downstream jobs (`test-rtl-responsive`, `test-a11y`, `build`, `bundle-size-check`) attempted to run (status `pass` or `fail`, NOT `skipped`).
    4. Verify with the API directly:
       ```bash
       gh pr checks $PR --json name,state,bucket --jq '.[] | select(.name=="Lint" or .name=="type-check") | {name, bucket}'
       # expected: both pass (bucket=pass)
       ```
    5. **If everything is green: merge the PR.** Use squash or merge per repo convention:
       ```bash
       gh pr merge $PR --squash --delete-branch
       ```
    6. **If `type-check` is failing:** STOP. Either Task 1's pre-flight zero-confirm was wrong, or 47-01/47-02 left residual errors. Route to gap-closure for the failing workspace.

    **User signal-back:** Post the merged PR URL and the screenshot/log evidence that both `Lint` and `type-check` showed as separate green checks before merge.

  </how-to-verify>
  <resume-signal>Type "approved — wiring PR merged" with the PR URL, OR "blocked — &lt;reason&gt;"</resume-signal>
</task>

<task type="auto">
  <name>Task 4: Update branch protection on main via gh api (read-then-merge-then-write)</name>
  <files>(no files; GitHub API call)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §6.2 (expected post-state shape: `required_status_checks.contexts` includes "Lint" and "type-check"; `enforce_admins.enabled=true`)
    - .planning/research/Q1-ci-gate-status.md (today: branch is unprotected, GET returns 404)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-09 (branch protection requires both checks AND enforce_admins=true)
    - /tmp/47-03-protection-before.json (captured in Task 1)
  </read_first>
  <action>
    1. **Re-capture current state** (between Task 1 and now, the wiring PR merge may have introduced auto-protection):
       ```bash
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/47-03-protection-before-final.json 2>&1 || true
       cat /tmp/47-03-protection-before-final.json
       ```
    2. **PUT the new protection config** with required checks `Lint` + `type-check` and `enforce_admins=true`. Per D-09 + read-then-merge-then-write pattern, if existing contexts include other checks, MERGE those into the new contexts list (today expected to be empty per Q1):
       ```bash
       gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
         --input - <<'JSON'
       {
         "required_status_checks": {
           "strict": true,
           "contexts": ["Lint", "type-check"]
         },
         "enforce_admins": true,
         "required_pull_request_reviews": null,
         "restrictions": null
       }
       JSON
       ```
       (Issue 5 fix — body trimmed to the minimum-required GitHub REST API spec for `repos/{owner}/{repo}/branches/{branch}/protection`. Fields like `lock_branch`, `allow_fork_syncing`, `required_linear_history`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions` were dropped because some repo tiers reject them and would abort the entire PUT. The TYPE-03 acceptance — `contexts` includes both `Lint` and `type-check` — does not depend on the dropped fields, so the trim is lossless for this phase.)
    3. **Verify the rule landed:**
       ```bash
       gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection > /tmp/47-03-protection-after.json
       cat /tmp/47-03-protection-after.json | jq '{required_status_checks: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}'
       ```
       Expected output:
       ```json
       {
         "required_status_checks": ["Lint", "type-check"],
         "enforce_admins": true
       }
       ```
    4. **Diff before/after** to ensure the only change is the addition of the rule (since today's before-state is "Branch not protected", the diff is "no protection" → "protection with two required checks").
  </action>
  <verify>
    <automated>
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | .[]' | tr '\n' ',' | grep -c "Lint,type-check,"   # returns 1
      gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'   # returns true
    </automated>
  </verify>
  <acceptance_criteria>
    - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort'` outputs a JSON array containing exactly `["Lint", "type-check"]` (sorted; order doesn't matter, presence does).
    - `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'` returns `true`.
    - `/tmp/47-03-protection-after.json` exists and is a valid JSON document (not the 404 "Branch not protected" string).
    - `/tmp/47-03-protection-before-final.json` and `/tmp/47-03-protection-after.json` differ only in the rule additions (no other rules dropped — T-47-01 mitigation).
  </acceptance_criteria>
  <done>Branch protection on main now requires Lint and type-check; enforce_admins=true.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Smoke-test PRs (frontend + backend) — observe gate BLOCKS</name>
  <what-built>The `type-check` job and the branch-protection rule are now live. This task is the proof D-13 demands — a deliberately-broken PR must be rejected by the gate.</what-built>
  <how-to-verify>
    **Per RESEARCH §6.1, run two smoke-test PRs in sequence (frontend then backend). Both must show `type-check` failure AND PR mergeable status `BLOCKED`.**

    **Frontend smoke test (`chore/test-type-check-gate-frontend`):**

    1. Branch from latest main:
       ```bash
       git fetch origin main
       git checkout -b chore/test-type-check-gate-frontend origin/main
       ```
    2. Inject one TS error into a frontend file (use a benign location like a comment-adjacent line in any non-critical file):
       ```bash
       # Append to any frontend/src/*.ts(x) file:
       printf '\nconst _smokeTest: string = 42;\n' >> frontend/src/App.tsx
       ```
       This produces TS2322 ("Type 'number' is not assignable to type 'string'.").
    3. Commit and push:
       ```bash
       git add frontend/src/App.tsx
       git commit -m "chore: smoke-test type-check gate (DO NOT MERGE)"
       git push -u origin chore/test-type-check-gate-frontend
       gh pr create --base main \
         --title "chore: smoke-test type-check gate frontend (DO NOT MERGE)" \
         --body "TYPE-03 verification per CONTEXT D-13 / RESEARCH §6.1. Injects one TS error to confirm the new type-check gate blocks merges. Will be closed without merging."
       ```
    4. Wait for CI:
       ```bash
       PR_FE=$(gh pr view --json number -q .number)
       gh pr checks $PR_FE --watch
       ```
    5. **Required state:**
       - `gh pr checks $PR_FE --json name,state,bucket --jq '.[] | select(.name=="type-check") | .bucket'` returns `"fail"`.
       - `gh pr view $PR_FE --json mergeStateStatus -q .mergeStateStatus` returns `"BLOCKED"` (Issue 2 fix — `mergeable` returns `"MERGEABLE"` for branches without git conflicts even when required checks fail; `mergeStateStatus` is the correct field for "PR is blocked from merging by required checks").
       - The Lint check is `pass` (only type-check fails — clean attribution per D-08).
    6. **Close, do NOT merge:**
       ```bash
       gh pr close $PR_FE --delete-branch
       ```

    **Backend smoke test (`chore/test-type-check-gate-backend`):**

    7. Repeat steps 1–6 with backend:
       ```bash
       git checkout main && git pull
       git checkout -b chore/test-type-check-gate-backend origin/main
       printf '\nconst _smokeTest: string = 42;\n' >> backend/src/index.ts
       git add backend/src/index.ts
       git commit -m "chore: smoke-test type-check gate backend (DO NOT MERGE)"
       git push -u origin chore/test-type-check-gate-backend
       gh pr create --base main \
         --title "chore: smoke-test type-check gate backend (DO NOT MERGE)" \
         --body "TYPE-03 verification (backend half) per CONTEXT D-13 / RESEARCH §6.1."
       PR_BE=$(gh pr view --json number -q .number)
       gh pr checks $PR_BE --watch
       gh pr checks $PR_BE --json name,state,bucket --jq '.[] | select(.name=="type-check") | .bucket'   # MUST return "fail"
       gh pr view $PR_BE --json mergeStateStatus -q .mergeStateStatus   # MUST return "BLOCKED" (Issue 2 fix — same as frontend)
       gh pr close $PR_BE --delete-branch
       ```

    **User signal-back:** Post both PR URLs (closed) and the `gh pr checks` output evidence showing `type-check` failed for both. If either smoke test shows `type-check` PASSING, STOP — that means the gate is not actually wired (likely a `name:` typo in ci.yml or a contexts mismatch in the protection rule).

  </how-to-verify>
  <resume-signal>Type "approved — both smoke tests blocked" with the two PR URLs, OR "blocked — &lt;reason&gt;"</resume-signal>
</task>

<task type="auto">
  <name>Task 6: TYPE-04 phase-wide net-new suppression count = 0</name>
  <files>.planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (current ledger from 47-01 + 47-02)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-02, TYPE-04 verbatim
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §11.12 (pre-existing suppressions inventory)
    - **Prerequisite:** the git tag `phase-47-base` exists (created in 47-01 Task 1, idempotently re-created in 47-02 Task 1). Verify with `git rev-parse phase-47-base` before running this task.
  </read_first>
  <action>
    1. **Use the `phase-47-base` tag (Issue 4 fix — `git merge-base main HEAD` is unreliable after 47-03 Task 3 merges into main; the tag was created in 47-01 Task 1 / 47-02 Task 1 before any phase work began):**
       ```bash
       git rev-parse phase-47-base   # MUST return a SHA — fails fast if tag missing
       PHASE_BASE=phase-47-base
       echo "phase base: $(git rev-parse $PHASE_BASE)"
       ```
       If `git rev-parse phase-47-base` fails, STOP — the tag was never created or was deleted; the suppression-diff scan cannot run honestly without it.
    2. Count net-new `@ts-ignore` and `@ts-expect-error` lines across the entire phase:
       ```bash
       git diff $PHASE_BASE..HEAD -- 'frontend/src' 'backend/src' \
         | grep -E '^\+.*@ts-(ignore|expect-error)' \
         | grep -vE '^\+\+\+' \
         > /tmp/47-03-suppression-additions.txt
       wc -l < /tmp/47-03-suppression-additions.txt   # MUST be 0 (per Issue 1 fix — option (a): inline comments at IntakeForm.tsx + Icon.test.tsx are byte-unchanged across the phase, so they do not appear as `+` lines)
       ```
    3. Count net-new `@ts-nocheck` (allowlist for generated files):
       ```bash
       git diff $PHASE_BASE..HEAD -- 'frontend/src' 'backend/src' \
         | grep -E '^\+.*@ts-nocheck' \
         | grep -vE '^\+\+\+' \
         > /tmp/47-03-nocheck-additions.txt
       cat /tmp/47-03-nocheck-additions.txt
       ```
       Expected: exactly 2 lines — one from 47-01 Task 2 (frontend/src/types/database.types.ts) and one from 47-02 Task 2 (backend/src/types/database.types.ts). Both must already be logged in 47-EXCEPTIONS.md `## Retained suppressions (TYPE-04 ledger)`.
    4. Append `## Phase-wide TYPE-04 reconciliation` section to 47-EXCEPTIONS.md with:
       - The net-new `@ts-ignore` / `@ts-expect-error` count (target: 0).
       - The net-new `@ts-nocheck` count and which files they cover (target: 2, both database.types.ts allowlisting).
       - The pre-existing IntakeForm.tsx and Icon.test.tsx suppressions, byte-unchanged across the phase, with their follow-up references living in the seeded ledger rows from 47-01 Task 1 (Issue 1 — option (a): the ledger is the TYPE-04 source of truth, NOT inline comments).
       - A final ledger summary table: file | suppression | reason | follow-up.
  </action>
  <verify>
    <automated>
      git rev-parse phase-47-base   # MUST succeed (tag was created in 47-01 Task 1)
      git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error)' | grep -vE '^\+\+\+' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-nocheck' | grep -vE '^\+\+\+' | wc -l   # returns 2
      grep -c "Phase-wide TYPE-04 reconciliation" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0. (TYPE-04 net-new = 0 — D-01 satisfied; honest because Issue 1 — option (a) keeps the two pre-existing inline comments byte-unchanged.)
    - `git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-nocheck' | wc -l` returns exactly 2 (the two allowlisted database.types.ts files).
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0 (file byte-unchanged — Issue 1 fix).
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0 (file byte-unchanged — Issue 1 fix).
    - 47-EXCEPTIONS.md has `## Phase-wide TYPE-04 reconciliation` section with the final ledger summary.
    - The two pre-existing `@ts-expect-error` suppressions live in the 47-EXCEPTIONS.md ledger (seeded in 47-01 Task 1 baseline; ledger is the TYPE-04 source of truth per Issue 1 — option (a)).
  </acceptance_criteria>
  <done>TYPE-04 reconciliation complete; ledger comprehensive; phase-wide suppression posture documented.</done>
</task>

</tasks>

<verification>
- The new `type-check` CI job runs on every push and pull_request, calls per-workspace `pnpm --filter <ws> type-check` directly (RESEARCH §11.5 — bypasses turbo's build dependency), and is green on `main` after Task 3 merges.
- The redundant `Check TypeScript` step is gone from the `Lint` job (clean attribution per D-08).
- Four downstream `needs:` arrays (`test-rtl-responsive`, `test-a11y`, `build`, `bundle-size-check`) require both `lint` AND `type-check`.
- Branch protection on `main` lists both `"Lint"` and `"type-check"` in `required_status_checks.contexts` AND `enforce_admins.enabled=true`.
- Two smoke-test PRs (frontend + backend) showed `type-check` status `fail` and were merge-blocked; both closed without merging.
- `git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0 across the entire phase.
- `git diff phase-47-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*@ts-nocheck' | wc -l` returns exactly 2 (both on auto-generated database.types.ts; both ledgered).
- `git diff phase-47-base..HEAD -- backend/tsconfig.json frontend/tsconfig.json | wc -l` returns 0 (D-11 respected).
- `git diff phase-47-base..HEAD -- turbo.json | wc -l` returns 0 (per planner directive).
</verification>

<success_criteria>

- TYPE-03 (code half): dedicated `type-check` CI job in place; downstream `needs:` updated. ✅
- TYPE-03 (settings half): branch protection on `main` requires `Lint` + `type-check` + `enforce_admins=true`. ✅
- TYPE-03 (smoke proof): two PRs with deliberate TS errors are merge-blocked. ✅
- TYPE-04: phase-wide net-new `@ts-ignore` / `@ts-expect-error` = 0; the only allowed allowlist is two `@ts-nocheck` on auto-generated files, both ledgered. ✅
- D-11 / D-12 / planner directive: tsconfig and turbo.json untouched. ✅
- D-08: split happens after zero, not before (Task 1 enforces). ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-03-SUMMARY.md` covering:
- The wiring PR URL and merge SHA.
- The branch-protection before/after JSON snapshots (link to /tmp captures or paste inline).
- The two smoke-test PR URLs (closed) with `gh pr checks` output evidence.
- Phase-wide TYPE-04 reconciliation table.
- Confirmation that all four downstream jobs (`test-rtl-responsive`, `test-a11y`, `build`, `bundle-size-check`) now require both `lint` and `type-check`.
- Confirmation that the deferred items (turbo.json `dependsOn` cleanup, frontend test files exclusion considerations) remain in the project's deferred ledger and are not silently regressed.
</output>
