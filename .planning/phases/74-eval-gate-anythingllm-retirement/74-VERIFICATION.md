---
phase: 74-eval-gate-anythingllm-retirement
plan: 11
artifact: live-verification
status: PARTIAL — CI half GREEN, live half DEPLOY-GATED
recorded: 2026-06-21
requirements: [EVAL-01, EVAL-02, EVAL-03, EVAL-04]
executes_uat: .planning/phases/74-eval-gate-anythingllm-retirement/74-UAT.md
ci_job: .github/workflows/ci.yml (eval-gate)
static_guard: scripts/check-no-anythingllm.mjs
---

# Phase 74 — Live Verification (EVAL-01/02/03/04)

> Records the verification evidence for the eval-gate + AnythingLLM-retirement phase.
> The **CI-runnable half** is GREEN now (no GPU). The **live half** (the EVAL-04
> network-block UAT in `74-UAT.md` + the live EVAL-01/03 judge scoring) is
> **DEPLOY-GATED** behind the on-prem vLLM/gemma + TEI stack — the SAME deploy gate as
> P72/P73 — and AUTH-GATED behind a real authenticated browser session on staging.
> Per the threat register (T-74-11-02) **no threshold was lowered** to force a pass,
> and per the deploy-gate posture **no live result was fabricated**.

## Status banner (2026-06-21)

| Half                                                   | Status                | Gate                                               |
| ------------------------------------------------------ | --------------------- | -------------------------------------------------- |
| EVAL-02 computed precision/recall (CI-native)          | ✅ GREEN (local + CI) | none — runs now                                    |
| EVAL-01/03 **structural + degraded** positive-failures | ✅ GREEN (CI-mode)    | none — runs now                                    |
| EVAL-04 **source guard** (`check:no-anythingllm`)      | ✅ GREEN + required   | none — runs now                                    |
| Full-repo AnythingLLM-absence audit                    | ✅ COMPLETE           | none — done in this plan                           |
| EVAL-01/03 **live judge scores** (≥0.80 / ≥0.75)       | ⬜ DEPLOY-GATED       | on-prem vLLM/gemma (`EVAL_AI_URL`/`VLLM_BASE_URL`) |
| EVAL-04 **network-block UAT** (3 surfaces, EN+AR)      | ⬜ DEPLOY+AUTH-GATED  | on-prem stack + real browser on staging            |
| Human sign-off on the live bilingual surfaces          | ⬜ DEPLOY+AUTH-GATED  | the same gate                                      |

---

## EVAL-02 — Correlation accuracy (link discovery) — ✅ GREEN

**Requirement:** P71 `query_graph` edge precision ≥ 0.75 / recall ≥ 0.70 vs a golden edge
set (D1 — computed set-overlap, **no LLM judge** → CI-native, runs without the GPU stack).

**Evidence (local run, 2026-06-21):**

```
EVAL_AI_URL='' VLLM_BASE_URL='' pnpm --filter agent-runtime test:eval
  Test Files  3 passed (3)
       Tests  16 passed | 8 skipped (24)
```

- Rubric: `agent-runtime/evals/correlation.eval.test.ts` + `lib/set-metrics.ts`.
- Golden fixtures: `agent-runtime/evals/fixtures/correlation/{forum-membership,shared-committees,engagement-chain,shortest-path}.json` + `_degraded.json` (the positive-failure proof — a deliberately-wrong edge set MUST drop below threshold).
- The 16 passing CI-mode tests include EVAL-02's computed precision/recall over the golden
  edges AND the degraded-fixture positive-failure. **GREEN.**
- Wired in CI: `.github/workflows/ci.yml` `eval-gate` job → `pnpm --filter agent-runtime test:eval` (CI-mode, required).

## EVAL-01 — Briefing quality (≥ 0.80) — ⬜ live judge DEPLOY-GATED (structural ✅)

**Requirement:** generated briefs score ≥ **0.80** on the bilingual (EN+AR) judge rubric.

**CI-mode (GREEN now):** `agent-runtime/evals/briefs.eval.test.ts` runs its **structural**
checks + the `fixtures/briefs/_degraded.json` positive-failure now (part of the 16 passing).
Golden fixtures: `fixtures/briefs/{en-economic,en-political,ar-economic}.json`. The judge
client is `agent-runtime/evals/lib/judge.ts` with a Zod-validated score schema
(`evals/schemas/score.ts`) per rubric dimension (D4).

**Live-mode (DEPLOY-GATED):** the generative `briefing`-quality judge assertions (the 8
skipped tests across the briefs+arabic suites) activate ONLY when `EVAL_AI_URL` /
`VLLM_BASE_URL` points at the on-prem gemma stack:

```
.github/workflows/ci.yml  eval-gate:
  - name: Run live-judge evals (deploy-gated)
    if: ${{ secrets.EVAL_AI_URL != '' }}
    env: { EVAL_AI_URL: ${{ secrets.EVAL_AI_URL }} }
    run: pnpm --filter agent-runtime test:eval
```

**Recorded live score:** ⬜ **PENDING the deploy gate.** Run once the on-prem stack is up
(runbook below). EVAL-01 EN+AR briefs must score ≥ **0.80** on the golden fixtures. **Do not
lower the 0.80 threshold to force a pass (T-74-11-02);** if a fixture misses, record the gap.

## EVAL-03 — Arabic quality (≥ 0.75) — ⬜ live judge DEPLOY-GATED (structural ✅)

**Requirement:** Arabic output scores ≥ **0.75** on the fluency rubric.

**CI-mode (GREEN now):** `agent-runtime/evals/arabic.eval.test.ts` structural + degraded
positive-failure run now (part of the 16 passing). Golden: `fixtures/arabic/fluency-cases.json`

- `_degraded.json`.

**Live-mode (DEPLOY-GATED):** the generative Arabic-fluency judge score activates with
`EVAL_AI_URL` set (same skipped-until-live mechanism). **Recorded live score:** ⬜ **PENDING
the deploy gate.** Must be ≥ **0.75** on the golden fixtures.

## EVAL-04 — AnythingLLM zero-dependency — source guard ✅ / network-block UAT ⬜

EVAL-04 has two complementary halves (D6):

### (a) Source guard — ✅ GREEN + required (runs now)

The static `scripts/check-no-anythingllm.mjs` greps the **three critical surfaces** for the
`anythingllm` token and fails (exit 1) on any reference; a planted positive-failure fixture
proves it fails on a regression.

```
node scripts/check-no-anythingllm.mjs
  no-AnythingLLM check OK: 6 critical-surface file(s) scanned, zero `anythingllm` references.
  exit 0
```

- Surfaces guarded: `frontend/src/hooks/useDashboardDigest.ts`,
  `frontend/src/components/copilot/{useCopilotRuntime.ts,CopilotSurface.tsx}`,
  `supabase/functions/{search-semantic,semantic-search-unified,position-suggestions-get}/index.ts`.
- Positive-failure fixture: `tools/anythingllm-fixtures/critical-surface-with-anythingllm/sample.ts`
  (CI asserts `! node scripts/check-no-anythingllm.mjs <fixture>`).
- Wired **required** in `.github/workflows/ci.yml` `eval-gate` → `pnpm run check:no-anythingllm`.

### (b) Network-block runtime UAT — ⬜ DEPLOY+AUTH-GATED

The runtime proof — with the AnythingLLM origin **blocked at the network layer** via CDP
`Network.setBlockedURLs`, all three critical surfaces still function (EN+AR) and ZERO requests
reach the AnythingLLM origin — is specified in **`74-UAT.md`** (PROOF A: semantic search,
PROOF B: dashboard digest [pure-SQL, the least-gated], PROOF C: copilot + ChatDock-gone +
forced-error). It is **DEPLOY-GATED** (on-prem stack) + **AUTH-GATED** (real browser on
staging). **Result:** ⬜ **PENDING** — see the runbook below. Do NOT self-sign these checks.

| Surface                                          | UAT proof | EN  | AR  | Status              |
| ------------------------------------------------ | --------- | --- | --- | ------------------- |
| Semantic search (TEI bge-m3)                     | PROOF A   | ⬜  | ⬜  | DEPLOY+AUTH-GATED   |
| Dashboard digest (pure SQL)                      | PROOF B   | ⬜  | ⬜  | AUTH-GATED (no GPU) |
| Copilot (on-prem) + ChatDock-gone + forced-error | PROOF C   | ⬜  | ⬜  | DEPLOY+AUTH-GATED   |
| Network-tab: 0 AnythingLLM requests across all 3 | —         | ⬜  | ⬜  | DEPLOY+AUTH-GATED   |

---

## Full-repo AnythingLLM-absence audit — ✅ COMPLETE (2026-06-21)

Scanned the entire app (`backend/src`, `frontend/src`, `supabase/functions` + `migrations`,
`agent-runtime/src`, `deploy`, `scripts`, `tools`, all `.env.example`) for every `anythingllm`
reference and classified each. Two latent levers that the static guard does **not** scan were
found and **fixed in this plan**; every other remaining hit is intentional data-only or docs.

### Gaps found + fixed (the static guard does not cover these files)

| #   | File                          | Finding                                                                                                                                                                                                                                                                                                                                                                                                                              | Disposition                                                                                                                                                                                         | Commit     |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `agent-runtime/src/config.ts` | Dead `anythingllm` provider block in the COPILOT runtime config (`AIProvider` union member + `providers.anythingllm` entry reading `ANYTHINGLLM_API_KEY`/`ANYTHINGLLM_API_URL`, default `localhost:3001`, `enabled` lever). **Unreachable** — `selectCopilotProvider`/`getCopilotModel` routing only ever resolves to `vllm`/`ollama` — but it still read the legacy env levers, so a future routing edit could silently re-wire it. | **REMOVED** (Rule 1/2 — dead lever, D3 FULL rip-out). Removed the union member, the map entry, and all 3 `ANYTHINGLLM_*` env reads. `pnpm --filter agent-runtime type-check` exit 0; guard still 0. | `233e5c02` |
| 2   | `.env.example` (repo root)    | Dead `ANYTHINGLLM_API_URL`/`ANYTHINGLLM_API_KEY` keys — 74-08 cleaned `backend/.env.example` + `deploy/.env.example` but missed the root one. No code reads them (the only such reads were gap #1, now gone).                                                                                                                                                                                                                        | **REMOVED** — replaced with the on-prem `VLLM_BASE_URL`/`TEI_EMBED_URL` levers (D3).                                                                                                                | `c3e2ee87` |

After both fixes: **all four `.env.example` variants grep clean**, and `config.ts` greps clean.

### Definitive call-shape scan — ZERO real AnythingLLM calls remain

A targeted scan for runtime CALL shapes across `backend/src`, `frontend/src`,
`supabase/functions`, `agent-runtime/src` (code only, `node_modules`/`dist` excluded):

| Call shape                                                                                            | Result                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`/`axios`/`http` to an `anythingllm` origin / `:3001` (AnythingLLM) / `/llm/` / `/api/v1/embed` | **ZERO** (the only `:3001` in code are unrelated: `backend/src/middleware/security.ts` dev-frontend CORS + `export.service.ts` R2 download URL) |
| `import`/`require` of an AnythingLLM client/SDK                                                       | **ZERO**                                                                                                                                        |
| `/llm/` proxy path or `/api/v1/embed` endpoint in code                                                | **ZERO** (only in `*.md` runbooks — prose)                                                                                                      |
| `process.env`/`Deno.env`/`import.meta.env` read of `ANYTHINGLLM_*`                                    | **ZERO** (was only `config.ts`, removed in `233e5c02`)                                                                                          |

**Conclusion: ZERO real AnythingLLM calls remain on the critical path (or anywhere in
runtime code).** The FULL rip-out (D3) is complete.

### Remaining `anythingllm` references — all intentional (the allowlist)

73 remaining code hits, all **category (a) data-only** or **(b) docs/guard**, none a call:

**(a) Data-only — retained legacy DB columns, by design (nulled/omitted by 74-05):**

- `backend/src/types/{database.types.ts,contact-directory.types.ts}` + `frontend/src/types/{database.types.ts,intelligence-reports.types.ts}` — generated DB types: `anythingllm_workspace_id`/`anythingllm_query`/`anythingllm_response_metadata` columns + the `ai_provider` enum value `"anythingllm"`. **Generated; do not hand-edit.**
- `supabase/functions/_shared/validation-schemas.ts` — `AnythingLLMMetadataSchema` Zod + the 3 optional `anythingllm_*` fields (mirrors the DB columns).
- `supabase/functions/intelligence-get/index.ts:171-173` — **reads** the 3 data-only columns into the response (no AnythingLLM call). For new reports these are null/`{}` (74-05 stopped writing them).
- `frontend/src/services/intelligence-api.ts` + `frontend/src/components/intelligence/{BilateralOpportunities,EconomicDashboard,PoliticalAnalysis,SecurityAssessment}.tsx` — type fields + a conditional "Generated by: AnythingLLM (model)" attribution badge gated on `latestReport?.anythingllm_workspace_id`. It **renders a retained data-only column** — no call; the `&&` guard is falsy for new (null) reports, so the badge no longer renders. (Cosmetic legacy branding on historical rows only; optional follow-up doc/UI cleanup, not a gap.)
- `supabase/migrations/{20250130000001_extend_intelligence_reports_dynamic_system,20260111800001_translation_service}.sql` — historical migrations that CREATED the columns. **Append-only history; never edit.**

**(b) Docs / guard / fixture — prose, by design:**

- `scripts/check-no-anythingllm.mjs` — the guard itself (the token appears as the forbidden pattern, by design).
- `tools/anythingllm-fixtures/critical-surface-with-anythingllm/sample.ts` — the planted positive-failure fixture (by design; imported nowhere).
- `supabase/functions/_shared/onprem-llm.ts` (3 comments) — documents that it REPLACED AnythingLLM ("never AnythingLLM").
- `frontend/src/domains/positions/types/index.ts:159` + `frontend/src/domains/ai/repositories/ai.repository.ts:81` — stale comments referencing the old AnythingLLM behavior (no call; the underlying paths were re-homed in 74-07). Optional comment-refresh follow-up.
- `agent-runtime/src/mastra/index.ts:10` + `agent-runtime/src/mastra/tools/tools.test.ts:364` — a port-comment ("anythingllm 3001") and a test ASSERTING absence (`not.toContain('anythingllm')`).
- `deploy/{README.md,DROPLET_INSTRUCTIONS.md,DEPLOY_NEW_APP_GUIDE.md}` + `supabase/functions/intelligence-refresh*/WORKSPACE_AUTO_CREATION.md` — runbook prose / topology diagrams / legacy curl examples (74-08 noted these as a deferred doc-cleanup; not load-bearing — the container/proxy/levers are all gone).

---

## DEPLOY-GATED live-verification runbook (run after the GPU stack is up)

Same posture + discipline as the P72/P73 live UAT. Bring up the on-prem stack, set the env,
then execute — **restore any seed afterward (seed → prove → restore, T-74-11-03)**.

### 1. Bring up the on-prem stack (the deploy gate)

- vLLM `/v1/models` returns `gemma-4-12b` (or the configured on-prem model).
- TEI `/embed` returns a 1024-dim vector; `/rerank` responds.
- Export `EVAL_AI_URL` / `VLLM_BASE_URL` + `TEI_EMBED_URL` for the verification env.
- Ensure the bge-m3 re-embed of the corpus has run (the P72 gate) so semantic search has live
  1024-dim vectors.

### 2. Live EVAL-01/03 judge scoring

```bash
EVAL_AI_URL=<on-prem> VLLM_BASE_URL=<on-prem> pnpm --filter agent-runtime test:eval
```

The 8 currently-skipped judge tests activate. Record: EVAL-01 EN+AR briefs ≥ **0.80**,
EVAL-03 Arabic ≥ **0.75** on the golden fixtures. **Do not lower a threshold below the
success-criterion value to force a pass (T-74-11-02)** — record any miss as a gap.

### 3. EVAL-04 network-block UAT (per `74-UAT.md`)

Login admin `kazahrani@stats.gov.sa` (`.env.test`, a **real** session — never service-role,
the P69 landmine). Drive Chrome over the CDP bridge (`project_cdp_forced_error_uat_protocol`);
keep a Network tab open. Arm the block BEFORE exercising the surfaces:

```
Network.setBlockedURLs({ urls: ["*anythingllm*","*:3001/*","*/llm/*","*/api/v1/embed*"] })
```

Verify the block is live (request a known AnythingLLM URL → fails) before asserting any green
surface. Then exercise PROOF A (semantic search), PROOF B (dashboard digest), PROOF C
(copilot + ChatDock-gone + forced-error) in **EN and AR**, asserting via **DOM** (results list
/ empty-state / streamed reply / `role="alert"`) — never an HTTP status (RLS/block failures
surface as empty 200s). Confirm in the Network tab: **0** requests to the AnythingLLM origin.
Forced-error copilot state must carry no `/clearance|filtered|restricted/i` (indistinguishable-
empty) and no `anythingllm` string. Clear the block afterward
(`Network.setBlockedURLs({ urls: [] })`) and restore any seed.

### 4. Record + sign off

Fill the EVAL-01/03 live scores + the EVAL-04 surface/network results into the tables above,
flip the status banner, and capture the human sign-off (Task 3 of `74-11-PLAN.md`).

---

## Summary

- **CI half: GREEN.** EVAL-02 computed precision/recall + the EVAL-01/03 structural & degraded
  positive-failures (16 passing) + the EVAL-04 source guard all pass now, wired into the
  required `eval-gate` CI job.
- **Audit: COMPLETE.** ZERO real AnythingLLM calls/imports/proxy-paths/env-reads remain on the
  critical path (or anywhere in runtime code). Two latent dead levers the guard did not cover
  (`agent-runtime/src/config.ts`, root `.env.example`) were found and removed (`233e5c02`,
  `c3e2ee87`). The 73 remaining references are all data-only DB columns or docs/guard prose.
- **Live half: DEPLOY-GATED.** The EVAL-01/03 live judge scores + the EVAL-04 network-block UAT
  (EN+AR) + human sign-off stay PENDING the on-prem GPU/gemma + TEI stack — the same gate as
  P72/P73. No live result was fabricated; no threshold was lowered.
