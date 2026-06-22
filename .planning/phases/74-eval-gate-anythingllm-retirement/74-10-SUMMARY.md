---
phase: 74
plan: 10
subsystem: ci-eval-gate
tags: [ci, evals, anythingllm-retirement, uat, deploy-gated]
requires: [74-01, 74-08, 74-09]
provides:
  - 'eval-gate CI job (two-mode: required CI-mode + deploy-gated non-blocking live-mode)'
  - 'EVAL-04 network-block live-UAT spec (CDP Network.setBlockedURLs)'
affects:
  - .github/workflows/ci.yml
  - .planning/phases/74-eval-gate-anythingllm-retirement/74-UAT.md
tech-stack:
  added: []
  patterns:
    - 'two-mode CI gate: required computed/structural checks + secret-gated continue-on-error live scoring'
    - 'positive-failure assertion via `! node <guard> <planted-fixture>` (repo-policy precedent)'
    - 'CDP Network.setBlockedURLs network-block UAT, DOM-asserted (project_cdp_forced_error_uat_protocol)'
key-files:
  created:
    - .planning/phases/74-eval-gate-anythingllm-retirement/74-UAT.md
  modified:
    - .github/workflows/ci.yml
decisions:
  - 'Inserted eval-gate after bundle-size-check (sibling with needs:[lint,type-check], no downstream dependents) so a deploy-gated step can never block build/docker-build (T-74-10-01).'
  - 'Required steps carry NO continue-on-error; only the secret-gated live-scoring step is continue-on-error:true (D6 / T-74-10-01).'
  - 'Live step is guarded by the non-empty EVAL_AI_URL secret AND passes that secret as env, so isJudgeConfigured() activates the 74-09 judge tests only when the host exists (T-74-10-02).'
metrics:
  duration: ~20m
  completed: 2026-06-21
---

# Phase 74 Plan 10: CI eval-gate + EVAL-04 network-block UAT Summary

Wired the CI `eval-gate` job (D6 two-mode) that gates the build on EVAL-01/02/03 regressions in CI-mode (computed precision/recall + structural + positive-failure proofs + the `check:no-anythingllm` static guard) as a **required** check, with generative judge scoring deploy-gated and non-blocking; and authored the EVAL-04 network-block live-UAT spec proving the 3 critical surfaces work with AnythingLLM blocked at the CDP layer.

## What was built

### Task 1 — `eval-gate` CI job (`.github/workflows/ci.yml`) — commit `0fbe6fa7`

A new `eval-gate` job (`name: Eval Gate`, `needs: [lint, type-check]`), mirroring the `bundle-size-check` scaffold (checkout + pnpm + Node `${{ env.NODE_VERSION }}` + `pnpm install --frozen-lockfile`):

- **CI-mode (required, no secret guard, no `continue-on-error`):**
  1. `pnpm --filter agent-runtime test:eval` — EVAL-02 computed precision/recall (74-01) + the EVAL-01/03 structural + degraded positive-failure checks (74-09). With `EVAL_AI_URL`/`VLLM_BASE_URL` unset, `isJudgeConfigured()` is false so the live-scoring assertions skip; the computed + structural checks run and must pass.
  2. `pnpm run check:no-anythingllm` — the static no-AnythingLLM guard on the 3 critical surfaces (74-08).
  3. `! node scripts/check-no-anythingllm.mjs tools/anythingllm-fixtures/critical-surface-with-anythingllm` — positive-failure proof that the guard exits 1 on the planted fixture (mirrors the repo-policy bad-fixture step).
- **Live-mode (deploy-gated, non-blocking):** step `Live judge scoring (deploy-gated)` guarded `if: ${{ secrets.EVAL_AI_URL != '' }}`, `continue-on-error: true`, `env: { EVAL_AI_URL, EVAL_AI_API_KEY }`, running `pnpm --filter agent-runtime test:eval` (now the 74-09 judge tests activate).

The job depends only on lint+type-check; `build`/`docker-build` are unaffected, so a deploy-gated step can never block the build pipeline.

### Task 2 — EVAL-04 network-block live-UAT (`74-UAT.md`) — commit `7cd5539b`

Authored `74-UAT.md` mirroring the 72-UAT format (frontmatter, status banner, authoring/execution split, tag table, result legend, three PROOF sections with claim/how/checks tables, pass criteria + evidence checklist, sign-off). It specifies:

- **The block step:** CDP `Network.setBlockedURLs` on `*anythingllm*`, `*:3001/*`, `*/llm/*`, `*/api/v1/embed*` (the container port + nginx `/llm/` proxy + the AnythingLLM embeddings endpoint), with the carried-lock note that `*` crosses `/` in CDP patterns.
- **PROOF A — search suggestions / semantic search:** TEI-backed (74-03); expect results or graceful empty-state, never a hang/AnythingLLM error; DOM-asserted; EN + AR.
- **PROOF B — dashboard digest:** pure-SQL / zero-LLM (`generate_digest()` RPC); must be wholly unaffected; AUTH-GATED only (no GPU needed).
- **PROOF C — assistant / copilot:** on-prem `getCopilotModel()` reply; confirm the legacy ChatDock is GONE; forced-error → neutral `role="alert"` copy with no forbidden substring; EN + AR.
- Marked DEPLOY-GATED, with a cross-reference that the source-guard half runs now as a required CI check and the live judge-scoring half is verified by the deploy-gated live-mode `eval-gate` step.

## Verification

| Check                                                                              | Result                                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ci.yml` contains `eval-gate`, `test:eval`, `check:no-anythingllm`, `EVAL_AI_URL`  | ✅ all 4 present                                                 |
| `ci.yml` parses as YAML (`js-yaml` structural load)                                | ✅ valid; 17 jobs                                                |
| `eval-gate` `needs: [lint, type-check]`                                            | ✅                                                               |
| Live step `if: secrets.EVAL_AI_URL != ''` + `continue-on-error: true`              | ✅ gated + non-blocking                                          |
| 3 required steps have NO `continue-on-error`                                       | ✅                                                               |
| CI-mode `test:eval` passes with judge unset                                        | ✅ 16 passed / 8 skipped (the deploy-gated live assertions skip) |
| `check:no-anythingllm` exits 0 on real surfaces                                    | ✅                                                               |
| `check-no-anythingllm.mjs <planted-fixture>` exits 1 (positive-failure)            | ✅                                                               |
| `74-UAT.md` contains `setBlockedURLs` + semantic + digest + copilot + deploy-gated | ✅                                                               |
| `74-UAT.md` frontmatter parses (requirements: [EVAL-04])                           | ✅                                                               |

## Deviations from Plan

None — plan executed exactly as written. The plan's secondary verify command attempted a `python3 -c "import yaml"` parse; PyYAML is not installed on this machine, so YAML validity was instead confirmed via the `js-yaml` structural load (which the plan's verify command also invokes via `node -e`). The `eval-gate` job + UAT spec were authored exactly per the task `<action>` blocks.

## Notes

- The lint-staged prettier hook reformatted the `74-UAT.md` markdown table alignment on commit (its own staged file) — expected and in-scope; all required tokens preserved.
- The required CI-mode gate is green now with no GPU (the 8 skipped tests are the `skipIf(!isJudgeConfigured())` live-scoring assertions that activate only when the judge endpoint secret is set).

## Self-Check: PASSED

- FOUND: `.github/workflows/ci.yml` (modified)
- FOUND: `.planning/phases/74-eval-gate-anythingllm-retirement/74-UAT.md` (created)
- FOUND: `.planning/phases/74-eval-gate-anythingllm-retirement/74-10-SUMMARY.md` (created)
- FOUND: commit `0fbe6fa7` (Task 1 — eval-gate CI job)
- FOUND: commit `7cd5539b` (Task 2 — EVAL-04 UAT spec)
