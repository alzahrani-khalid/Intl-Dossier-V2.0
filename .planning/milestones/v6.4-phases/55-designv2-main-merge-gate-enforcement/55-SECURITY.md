# SECURITY.md — Phase 55: designv2-main-merge-gate-enforcement

**Audit date:** 2026-05-18
**ASVS Level:** 2
**Block-on policy:** any open after verification
**Verdict:** SECURED — 14/14 threats closed
**Register origin:** `register_authored_at_plan_time = true` (all 4 PLAN.md files contained `<threat_model>` blocks)

This phase is **CI-config + git-history**, not application code. Verification artifacts are GitHub server state (branch protection JSON), workflow YAML (`.github/workflows/ci.yml`), captured PR JSON evidence (`gh pr view --json`), SSH-signed git tags (`git tag -v`), and the per-plan SUMMARY.md files. Implementation files were not modified by this audit.

---

## Threat Verification Table (14 threats)

| Threat ID | Category        | Disposition | Verdict    | Evidence Citation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | --------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-55-01   | Tampering       | mitigate    | **CLOSED** | `protection-after.json:15` `"enforce_admins": true`; `protection-after.json:19-20` `allow_force_pushes=false, allow_deletions=false`; live `gh api .../protection` GET (this audit) shows `contexts_length=8`, `enforce_admins.enabled=true`, `allow_force_pushes.enabled=false`, `allow_deletions.enabled=false`; `55-03-SUMMARY.md` Diff Summary table rows 4-6, 8                                                                                                                                                                                                                |
| T-55-02   | Spoofing        | mitigate    | **CLOSED** | `git tag -v phase-{47,48,49,54,55}-base` all emit `Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM` (verified live in audit); `55-01-SUMMARY.md:120-128` records the tag-verification matrix; `55-UAT.md` Test 3 (lines 36-46) confirms all 5 reachable from origin/main                                                                                                                                                                                                                                    |
| T-55-03   | Tampering       | mitigate    | **CLOSED** | (a) Title: `55-SMOKE-PR-EVIDENCE.json:230` `"title": "Phase 55 MERGE-02 smoke: prove 8-context gate BLOCKS (DO NOT MERGE)"`; (b) `55-SMOKE-PR-EVIDENCE.json:5` `"mergeStateStatus": "BLOCKED"`; (c) `55-04-SUMMARY.md:115` confirms `gh pr close 18 --delete-branch` executed programmatically by Claude                                                                                                                                                                                                                                                                            |
| T-55-04   | InfoDisclosure  | mitigate    | **CLOSED** | `55-01-PLAN.md` Task 5 (lines 216-247) blocking checkpoint forced deploy-posture decision; `55-01-SUMMARY.md:132-140` (Deploy Posture Decision section) records "Option 1 — Accept auto-deploy" explicitly chosen by user, with `gh workflow disable Deploy` NOT run as the documented choice                                                                                                                                                                                                                                                                                       |
| T-55-PD   | Tampering / EoP | mitigate    | **CLOSED** | Merge commit has 2 parents — `git cat-file -p 3f763ddc` (this audit) shows `parent 7fc9e756…` + `parent 7d5ff2ef…`; `55-01-SUMMARY.md:105-108` records both parents; `protection-after.json:15` `enforce_admins=true` preserved; `55-03-SUMMARY.md` diff table row 4 confirms `enforce_admins.enabled=true` unchanged before→after                                                                                                                                                                                                                                                  |
| T-55-RB   | Repudiation     | mitigate    | **CLOSED** | `55-01-SUMMARY.md:144-175` documents verbatim 4-step revert-and-re-merge sequence with concrete commands (Step 1 `git revert -m 1 <merge-sha>`, Step 2 fix-forward, Step 3 `git revert <REVERT_SHA>`, Step 4 re-merge PR); `55-03-SUMMARY.md:139-181` documents the one-jq-one-PUT rollback for protection state                                                                                                                                                                                                                                                                    |
| T-55-SC   | Tampering       | accept      | **CLOSED** | All 4 PLAN.md `<threat_model>` blocks declare `T-55-SC` as `accept` with rationale "only `pnpm install --frozen-lockfile` against pinned lockfile; no new packages added". Verified by `.github/workflows/ci.yml:60,82,108,134,159,181,204` — every install step uses `pnpm install --frozen-lockfile`. See "Accepted Risks Log" section below.                                                                                                                                                                                                                                     |
| T-55-NJ   | Tampering       | mitigate    | **CLOSED** | `.github/workflows/ci.yml:88` `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 \` against `bad-design-token.tsx`; `.github/workflows/ci.yml:114` same pattern against `bad-vi-mock.ts`. Both use bash `!` inversion + `--max-warnings 0`. `55-CI-JOBS-PR-EVIDENCE.json` (extracted live in audit) shows both jobs `conclusion: success` on the post-merge main HEAD run (jobs run green when fixtures fail lint — positive-failure mechanism live)                                                                                                                         |
| T-55-CN   | Tampering       | mitigate    | **CLOSED** | `.github/workflows/ci.yml:66` `name: Design Token Check` verbatim; `.github/workflows/ci.yml:92` `name: react-i18next Factory Check` verbatim; `protection-after.json:11-12` contexts array contains identical strings; live GET (this audit) confirms server-side match — `"Design Token Check"`, `"react-i18next Factory Check"`                                                                                                                                                                                                                                                  |
| T-55-SQ   | Tampering       | mitigate    | **CLOSED** | `55-02-SUMMARY.md:108` records "52 lines added, 0 lines deleted — no existing job modified"; ci.yml inspection (this audit) confirms only the 2 new jobs `design-token-check` (lines 65-89) and `i18next-factory-check` (lines 91-115) are new; pre-existing jobs (`repo-policy`, `lint`, `type-check`, `test-frontend`, `test-backend`, etc.) are intact and not mutated                                                                                                                                                                                                           |
| T-55-PB   | Tampering       | mitigate    | **CLOSED** | `55-03-SUMMARY.md:139-180` (Diff Summary table + jq transform) confirms every relevant field carried forward by the jq round-trip: `strict`, `enforce_admins`, `required_pull_request_reviews=null`, `restrictions=null`, `required_linear_history`, `allow_force_pushes`, `allow_deletions`, `block_creations`, `required_conversation_resolution`, `lock_branch`, `allow_fork_syncing`. `protection-after.json:2-25` shows the full PUT body containing all listed fields with the correct values. Live GET (this audit) confirms no field silently dropped to default-permissive |
| T-55-EV   | Repudiation     | mitigate    | **CLOSED** | `55-04-PLAN.md` Task 5 (lines 232-255) sequences evidence-PR-then-close. `55-04-SUMMARY.md:91-93,128-129` confirms PR #19 (`docs/phase-55-smoke-evidence`) merged to main as `ec9caffb` BEFORE smoke PR #18 was closed with `--delete-branch`. `55-04-SUMMARY.md:259-265` self-check confirms both evidence files persist on `main` (8627 bytes JSON + 436606 bytes PNG)                                                                                                                                                                                                            |
| T-55-MS   | Tampering       | mitigate    | **CLOSED** | `55-SMOKE-PR-EVIDENCE.json:5` `"mergeStateStatus": "BLOCKED"` — uppercase string, captured via `gh pr view --json mergeStateStatus` (GraphQL path). Lowercase `"blocked"` would indicate REST endpoint mistake (Pitfall 11). UPPERCASE asserted in `55-04-PLAN.md` Task 3 verify block and confirmed in evidence file                                                                                                                                                                                                                                                               |
| T-55-NR   | Tampering       | mitigate    | **CLOSED** | `55-SMOKE-PR-EVIDENCE.json:5` is `BLOCKED` not `UNSTABLE`. Required-context failures captured: `Lint` (line 66, `"conclusion": "FAILURE"`) AND `type-check` (line 116, `"conclusion": "FAILURE"`) — both required contexts in `protection-after.json:7,9`. `55-04-SUMMARY.md:142-153` per-context behavior matrix confirms 2 required-context FAILUREs were sufficient to flip mergeStateStatus to BLOCKED                                                                                                                                                                          |

---

## Live State Re-Verification (performed during this audit)

These checks were re-run against current server state and local tree to confirm the captured evidence still holds:

1. **Branch protection on `main`** — `gh api .../branches/main/protection`:
   - `required_status_checks.contexts | length == 8` ✓
   - 8 contexts present including `Design Token Check` + `react-i18next Factory Check` ✓
   - `enforce_admins.enabled == true` ✓
   - `allow_force_pushes.enabled == false` ✓
   - `allow_deletions.enabled == false` ✓

2. **SSH-signed tags** — `git tag -v phase-{47,48,49,54,55}-base`:
   - All 5 emit `Good "git" signature for alzahrani.khalid@gmail.com` with the same ED25519 key (`SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM`) ✓
   - `phase-55-base` → `object 3f763ddc17fd496ac5ab3f289221a8b70a4a3416` (the merge commit) ✓

3. **Merge commit topology** — `git cat-file -p 3f763ddc…`:
   - 2 parents (`7fc9e756…` + `7d5ff2ef…`) — confirms `--no-ff` strategy, no squash ✓

4. **CI workflow YAML** — `.github/workflows/ci.yml`:
   - Line 66: `name: Design Token Check` ✓
   - Line 92: `name: react-i18next Factory Check` ✓
   - Lines 88, 114: positive-failure pattern `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 \` ✓

5. **CI-jobs evidence** — extracted live: both new jobs show `conclusion: success` in `main_run_jobs.jobs[]` ✓

---

## Accepted Risks Log

The following threats are explicitly accepted (not mitigated) per the declared disposition in PLAN.md `<threat_model>` blocks:

| Threat ID                                                | Plan Source                                                | Acceptance Rationale                                                                                                                                                                                           | Verification                                                                                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-55-SC** (Tampering — supply chain via npm/pip/cargo) | All 4 PLANs (01, 02, 03, 04) declare `T-55-SC` as `accept` | No new package installs in any Plan 55 plan; only `pnpm install --frozen-lockfile` against the pinned lockfile is invoked. The smoke PR's bundle-bloat plant reuses `moment`, an already-installed dependency. | `.github/workflows/ci.yml` — every install step (lines 60, 82, 108, 134, 159, 181, 204) uses `--frozen-lockfile`. No new entries to `package.json` `dependencies` introduced by Phase 55. |

This acceptance is appropriate for a CI-config/git-history phase that introduces no new package installs.

---

## Unregistered Flags

None. The 4 SUMMARY files have no `## Threat Flags` section (CI-config phases historically have no new application attack surface — they mutate metadata, not user-facing code). All 14 threats in the consolidated register from PLAN.md `<threat_model>` blocks resolve to CLOSED.

---

## Threat Verification Summary

- **Total threats:** 14
- **CLOSED (mitigated, verified):** 13
- **CLOSED (accepted, documented):** 1 (T-55-SC)
- **OPEN:** 0
- **ESCALATE:** 0
- **Unregistered flags:** 0

---

## Audit Notes

- The CI YAML (`.github/workflows/ci.yml`) was treated as the implementation file for T-55-NJ, T-55-CN, T-55-SQ verification — line-level grep matches confirmed each declared mitigation pattern.
- The protection JSON files (`protection-before.json`, `protection-after.json`) plus a live `gh api` GET were treated as the implementation surface for T-55-01, T-55-PB, T-55-PD verification.
- The per-PR evidence JSONs (`55-MERGE-PR-EVIDENCE.json`, `55-CI-JOBS-PR-EVIDENCE.json`, `55-SMOKE-PR-EVIDENCE.json`) were treated as the implementation surface for T-55-03, T-55-MS, T-55-NR, T-55-EV verification.
- Git tag signatures were verified live via `git tag -v` for T-55-02 (5 phase-base tags all pass).
- All evidence cited above was loaded during this audit; no claim accepted purely on the basis of SUMMARY narrative.

---

_Phase 55: SECURED — 14/14 threats closed. No blockers. No unregistered flags. Phase may ship._
