---
phase: 74-eval-gate-anythingllm-retirement
plan: 09
subsystem: eval-harness (AI-quality regression gate)
tags: [eval-gate, eval-01, eval-03, llm-judge, on-prem, deploy-gated, d4, d5, d6, bilingual]
requirements: [EVAL-01, EVAL-03]
wave: 4
depends_on: [74-01]
dependency_graph:
  requires:
    - '74-01 (eval harness: vitest.eval.config.ts, RubricScoreSchema in schemas/score.ts, fixtures/ layout)'
    - 'agent-runtime/src/llm-router.ts getCopilotModel() (on-prem gemma judge client)'
    - 'agent-runtime/src/mastra/tools/propose-brief.ts (the supported BriefContent shape EVAL-01 targets)'
  provides:
    - 'evals/lib/judge.ts — on-prem gemma LLM-judge (isJudgeConfigured + judgeRubric), RubricScoreSchema-validated, zero-egress'
    - 'EVAL-01 briefs.eval.test.ts (bilingual briefing quality, >= 0.80) + golden EN/AR brief fixtures + _degraded positive-failure'
    - 'EVAL-03 arabic.eval.test.ts (Arabic quality fluency/terminology/RTL, >= 0.75) + golden Arabic cases + _degraded positive-failure'
  affects:
    - '74-10 (CI wiring — the eval-gate job runs the eval config; EVAL-01/03 live scoring is the deploy-gated, non-blocking half via secrets.EVAL_AI_URL)'
tech_stack:
  added: []
  patterns:
    - 'On-prem LLM-judge via getCopilotModel() (OpenAI-compatible chat-completions, json_object, temperature 0), output validated through RubricScoreSchema.parse'
    - 'Deploy gate at the TEST level: it.skipIf(!isJudgeConfigured()) on the live-scoring assertions so a missing GPU host skips (not fails) CI (D6, mirrors P72/P73 posture)'
    - 'CI-runnable structural + positive-failure half always runs: golden+candidate parse to the brief shape; each _degraded.json is structurally KNOWN-bad (empty summary / wrong-language / Latin-digit + mixed-script markers)'
    - 'Directory-scanned fixtures: the rubric reads every fixtures/{briefs,arabic}/*.json (leading-underscore = positive-failure), so more goldens drop in with no test change'
key_files:
  created:
    - 'agent-runtime/evals/lib/judge.ts'
    - 'agent-runtime/evals/briefs.eval.test.ts'
    - 'agent-runtime/evals/arabic.eval.test.ts'
    - 'agent-runtime/evals/fixtures/briefs/en-economic.json'
    - 'agent-runtime/evals/fixtures/briefs/en-political.json'
    - 'agent-runtime/evals/fixtures/briefs/ar-economic.json'
    - 'agent-runtime/evals/fixtures/briefs/_degraded.json'
    - 'agent-runtime/evals/fixtures/arabic/fluency-cases.json'
    - 'agent-runtime/evals/fixtures/arabic/_degraded.json'
  modified:
    - 'agent-runtime/evals/README.md'
decisions:
  - 'D4 — the eval judge is the SAME on-prem gemma-4-12B endpoint the copilot binds to (getCopilotModel()). judgeRubric only ever contacts getCopilotModel().url — zero-egress, no cloud LLM. Self-grading bias accepted (regression-delta gate, not an absolute oracle).'
  - 'D5 — authored golden EN+AR fixtures targeting the SUPPORTED propose-brief BriefContent shape ({ summary, sections:[{title,content}] }), NOT the retired backend generator. Seeded a representative subset (3 brief goldens EN/EN/AR + 3 Arabic cases) toward the ~15-30/rubric target; the harness reads every fixtures/*.json so more drop in as plain JSON.'
  - 'D6 — live judge scoring is DEPLOY-GATED behind isJudgeConfigured() (EVAL_AI_URL || VLLM_BASE_URL). Absent host -> the 8 live-scoring assertions skip, CI stays green. The structural + positive-failure half is CI-runnable now (no GPU).'
  - 'Threshold consts: BRIEF_MIN = 0.80 (EVAL-01), ARABIC_MIN = 0.75 (EVAL-03). Judge output validated through RubricScoreSchema.parse so a hallucinated/out-of-range score throws (T-74-09-02) rather than rubber-stamping the gate.'
metrics:
  duration_minutes: 16
  tasks_completed: 2
  files_changed: 10
  completed_date: 2026-06-21
---

# Phase 74 Plan 09: EVAL-01 Briefing Quality + EVAL-03 Arabic Quality Judge Rubrics Summary

Wired the two generative AI-quality regression rubrics on the on-prem gemma judge (D4): **EVAL-01** bilingual briefing quality (EN+AR, ≥ 0.80) and **EVAL-03** Arabic quality (fluency / terminology / RTL, ≥ 0.75), with authored golden EN+AR fixtures (D5) targeting the supported `propose-brief` content shape. Live judge scoring is deploy-gated behind `isJudgeConfigured()` so CI stays green without the GPU/gemma stack (D6); the structural + per-rubric positive-failure half runs now.

## What Was Built

### Task 1 — On-prem gemma judge lib (D4) — commit `7d775014`

`agent-runtime/evals/lib/judge.ts`:

- `isJudgeConfigured(): boolean` — the deploy gate. True iff `EVAL_AI_URL || VLLM_BASE_URL` is set. Callers wrap live scoring in `it.skipIf(!isJudgeConfigured())`.
- `judgeRubric({ dimension, rubricInstruction, candidate, reference }): Promise<RubricScore>` — builds an OpenAI-compatible chat-completions call against `getCopilotModel()` (the SAME on-prem endpoint the copilot uses — zero-egress, threat T-74-09-01), `json_object` response, temperature 0. The reply is validated through `RubricScoreSchema.parse` (out-of-range/wrong-typed score throws — T-74-09-02). Throws if invoked while `!isJudgeConfigured()`.
- Zero-egress proven: the only URL contacted is `getCopilotModel().url`; no cloud-endpoint literal exists in the file.

### Task 2 — EVAL-01 + EVAL-03 rubrics + golden EN/AR + degraded fixtures (D5) — commit `58ce1fe8`

- `briefs.eval.test.ts` (EVAL-01, `BRIEF_MIN = 0.80`) — dimensions completeness / accuracy / language_quality, averaged per fixture. CI-mode (always-run): bilingual-coverage assert (EN+AR golden present), structural parse of golden+candidate to the brief shape, and the degraded fixture asserted structurally KNOWN-bad (empty summary / wrong-language sections). Live-mode (deploy-gated): `judgeRubric` per dimension, `avg >= BRIEF_MIN`; degraded `avg < BRIEF_MIN`.
- `arabic.eval.test.ts` (EVAL-03, `ARABIC_MIN = 0.75`) — dimensions arabic_fluency / terminology / rtl_correctness. CI-mode: per-case structural parse + Arabic-script/Arabic-Indic-numeral sanity (no Latin letters, no ASCII digits in goldens); the degraded case asserted KNOWN-bad via present ASCII-digit + Latin-letter markers. Live-mode (deploy-gated): same averaged-score gate.
- Golden fixtures (synthetic only): `briefs/en-economic.json`, `briefs/en-political.json`, `briefs/ar-economic.json` (propose-brief `BriefLang` shape); `arabic/fluency-cases.json` (3 Arabic cases). Per-rubric `_degraded.json` positive-failure fixtures (T-74-09-04).
- `README.md` updated: Layout block lists the new judge lib + both rubrics + fixture dirs; the live-mode section documents the deploy gate and the D5 fixture-count target / drop-in mechanism.

## How It Plumbs Into CI (D6)

The eval config (`evals/vitest.eval.config.ts`, from 74-01) is the run surface 74-10 wires into the `eval-gate` job. With the judge endpoint **unset** (CI default): EVAL-01/03 structural + positive-failure checks pass, live-scoring assertions skip — green without the GPU host. With `EVAL_AI_URL` **set** (the GPU/gemma host, same gate as P72/P73): the 8 live-scoring assertions un-skip and score against the real on-prem judge.

## Deviations from Plan

None — plan executed as written. (The 74-01 scaffold comments in `score.ts`/`vitest.eval.config.ts`/`README.md` refer to these rubrics as "Plan 74-08"; the actual plan is 74-09. This is a pre-existing comment drift in 74-01's files, outside this plan's file set — left untouched per surgical-change discipline; the README sections this plan does own were corrected to 74-09.)

## Verification

- `pnpm --filter agent-runtime test:eval` (full suite, CI-mode): **16 passed | 8 skipped** (6 EVAL-02 from 74-01 + 10 new EVAL-01/03 structural+positive-failure; 8 deploy-gated live-scoring skipped). No regression to 74-01.
- Deploy-gate flip proven: `EVAL_AI_URL=http://127.0.0.1:9/v1 pnpm vitest run ...` un-skips all 8 live-scoring tests (0 skipped) — they then attempt the (unreachable) on-prem endpoint, confirming `judgeRubric` routes only to `getCopilotModel().url` and that the gate genuinely controls live scoring.
- ESLint (repo config, `--max-warnings 0`) on all three new TS eval files: exit 0. `tsc -p tsconfig.json` surfaces no eval-file errors (evals/ is outside the tsconfig include by 74-01 design; Vitest's vite transform is the type gate and runs green).
- All 6 fixtures are valid JSON after the pre-commit prettier pass; fixtures are synthetic (no real dossier names or classified content — T-74-09-01).

## Fixture Count vs D5

Seed subset now: **3** brief goldens (EN economic, EN political, AR economic) + **3** Arabic cases, plus 2 `_degraded` positive-failure fixtures. D5 targets ≈15–30 cases per rubric — the harness reads **every** `fixtures/{briefs,arabic}/*.json`, so growing toward that target is a drop-in (author a new JSON file, no test change). Live generative scoring of the full set verifies only once the GPU/gemma host is permanent (deploy-gated, same as the rest of the live-mode half).

## Known Stubs

None. The judge client is fully implemented and zero-egress; the deploy gate is intentional (D6) and the live-scoring path is wired and proven to run when the endpoint env is set — it is gated on infrastructure, not stubbed.

## Self-Check: PASSED

All 10 created files verified present on disk; both task commits (`7d775014`, `58ce1fe8`) verified in git log.
