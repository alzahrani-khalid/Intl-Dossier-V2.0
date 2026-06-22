---
phase: 74-eval-gate-anythingllm-retirement
plan: 11
subsystem: testing
tags:
  [anythingllm-retirement, eval-gate, audit, deploy-gated, EVAL-04, copilot-runtime, zero-egress]

# Dependency graph
requires:
  - phase: 74-06
    provides: text-AI edge fns re-homed to on-prem vLLM (AnythingLLM-free)
  - phase: 74-07
    provides: embedding/brief/backend-twin AnythingLLM rip-out + the data-only carve-out list
  - phase: 74-08
    provides: infra removal (container/proxy/env) + the static check:no-anythingllm CI guard
  - phase: 74-10
    provides: the eval-gate CI job + the 74-UAT.md network-block UAT spec
provides:
  - 74-VERIFICATION.md — per-requirement EVAL-01/02/03/04 evidence (CI half GREEN, live half deploy-gated)
  - Full-repo AnythingLLM-absence audit — ZERO real calls/imports/proxy-paths/env-reads remain on the critical path
  - Two latent dead-lever removals the static guard did not cover (agent-runtime config + root .env.example)
affects: [v7.0-milestone-close, droplet-deploy, future-AI-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Full-repo call-shape audit: classify every token hit as (a) data-only DB column, (b) docs/guard prose, or (c) a real call — only (c) is a gap'
    - 'Deploy-gate posture for live verification: document the runbook + leave PENDING, never fabricate live results or lower a threshold'

key-files:
  created:
    - .planning/phases/74-eval-gate-anythingllm-retirement/74-VERIFICATION.md
  modified:
    - agent-runtime/src/config.ts
    - .env.example

key-decisions:
  - 'The dead anythingllm provider block in agent-runtime/src/config.ts is a Rule 1/2 lever-removal (unreachable but read legacy env levers) — removed, not just noted, to complete D3.'
  - 'The root .env.example AnythingLLM keys (missed by 74-08) are dead doc levers — replaced with on-prem VLLM_BASE_URL/TEI_EMBED_URL.'
  - 'The 73 remaining anythingllm references are all intentional: data-only DB columns/types/Zod schemas + immutable migrations + docs/guard/fixture. Allowlisted in 74-VERIFICATION.md.'
  - 'Live tasks (EVAL-04 network-block UAT + live EVAL-01/03 judge) are DEPLOY-GATED — resolved the deploy-gate by documenting the runbook, no fabrication (T-74-11-02/05).'

patterns-established:
  - 'Audit > guard: the static guard covers only the 3 critical surfaces (6 files); a full-repo audit caught two dead levers in adjacent files (copilot runtime config + a third env-example) the guard never scans.'

requirements-completed: [] # EVAL-01/03/04 are DEPLOY-GATED (live half pending); EVAL-02 + CI-mode + source-guard verified GREEN. No requirement fully closed by this plan — live verification is the remaining gate.

# Metrics
duration: ~50min
completed: 2026-06-21
---

# Phase 74 Plan 11: Live-Verification + Full-Repo AnythingLLM Audit Summary

**The FULL AnythingLLM rip-out is audit-confirmed complete (ZERO real calls/imports/proxy-paths/env-reads remain on the critical path); the CI half of the eval gate is GREEN; the live EVAL-01/03/04 verification is documented and left DEPLOY-GATED on the on-prem GPU/gemma + TEI stack — same gate as P72/P73.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-06-21T13:09:21Z
- **Tasks:** 1 of 3 executed (Task 2 audit); Tasks 1 + 3 are the deploy-gate + human-verify checkpoints (deferred)
- **Files modified:** 3 (1 created: 74-VERIFICATION.md; 2 fixed: config.ts, .env.example)

## Accomplishments

### Autonomous task — full-repo AnythingLLM-absence audit (COMPLETE)

Scanned `backend/src`, `frontend/src`, `supabase/functions` + `migrations`, `agent-runtime/src`,
`deploy`, `scripts`, `tools`, and all `.env.example` for every `anythingllm` reference and
classified each as **(a)** data-only DB column, **(b)** docs/comment/guard prose, or **(c)** a
real call. A targeted call-shape scan (fetch/axios/http to an AnythingLLM origin / `:3001` /
`/llm/` / `/api/v1/embed`, AnythingLLM client imports, `ANYTHINGLLM_*` env reads) returned:

- **ZERO** fetch/http-to-AnythingLLM in code (the only `:3001` hits are unrelated — `security.ts`
  dev-frontend CORS + `export.service.ts` R2 URL).
- **ZERO** AnythingLLM client imports.
- **ZERO** `/llm/` or `/api/v1/embed` in code (only `.md` runbook prose).
- **ZERO** `ANYTHINGLLM_*` env reads in code **after** the fix below.

**Conclusion: ZERO real AnythingLLM calls remain on the critical path (or anywhere in runtime
code).** The static guard's 6 critical-surface files stay clean (`check:no-anythingllm` exit 0).

### Two latent dead levers found + fixed (the guard does not scan these)

1. **`agent-runtime/src/config.ts`** (commit `233e5c02`) — the COPILOT runtime config carried a
   dead `anythingllm` provider block: the `AIProvider` union member, the `providers.anythingllm`
   map entry reading `ANYTHINGLLM_API_KEY`/`ANYTHINGLLM_API_URL` (default `localhost:3001`), and
   an `enabled` lever. It was **unreachable** — `selectCopilotProvider`/`getCopilotModel` routing
   only ever resolves to `vllm`/`ollama` — but it still READ the legacy env levers, so a future
   routing edit could silently re-wire an external dep. Removed the union member, the map entry,
   and all 3 env reads (Rule 1/2, D3 FULL rip-out). `pnpm --filter agent-runtime type-check`
   exit 0; the no-anythingllm guard stays exit 0; on-prem vLLM/Ollama selection unchanged.

2. **`.env.example`** (repo root, commit `c3e2ee87`) — 74-08 cleaned `backend/.env.example` +
   `deploy/.env.example` but missed the root one, which still documented `ANYTHINGLLM_API_URL`/
   `ANYTHINGLLM_API_KEY`. No code reads them (the only such reads were gap #1, now gone).
   Replaced with the on-prem `VLLM_BASE_URL`/`TEI_EMBED_URL` levers. **All four `.env.example`
   variants now grep clean.**

### CI half captured GREEN (no GPU)

- `EVAL_AI_URL='' pnpm --filter agent-runtime test:eval` → **16 passed | 8 skipped** (the 8 are
  the deploy-gated live-judge assertions, skipped-until-live by design, D6). The 16 cover EVAL-02
  computed precision/recall + the EVAL-01/03 structural & degraded positive-failures.
- `node scripts/check-no-anythingllm.mjs` → exit 0 (6 surfaces, 0 refs).
- The `eval-gate` CI job (`.github/workflows/ci.yml:417`) wires the CI-mode evals +
  `check:no-anythingllm` (required) + the deploy-gated live-judge step (`if: secrets.EVAL_AI_URL`).

### 74-VERIFICATION.md written

Per-requirement EVAL-01/02/03/04 evidence: EVAL-02 + CI-mode + source-guard GREEN (with the
local run cited); EVAL-01/03 live scores + the EVAL-04 network-block UAT marked PENDING with the
full DEPLOY-GATED runbook; the complete full-repo audit (gaps fixed + the data-only/docs
allowlist). Executes the `74-UAT.md` spec; links it via the `setBlockedURLs|network-block` key.

## Task Commits

1. **fix(74-11): remove dead external-LLM-platform provider from copilot runtime config** — `233e5c02`
2. **fix(74-11): drop dead external-LLM-platform keys from root .env.example** — `c3e2ee87`
3. **Docs (this SUMMARY + 74-VERIFICATION.md + STATE/ROADMAP)** — _(final metadata commit)_

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1/2 — dead lever / D3 completion] Removed the dead AnythingLLM provider from `agent-runtime/src/config.ts`**

- **Found during:** Task 2, the full-repo audit (this file is NOT one of the static guard's 6 surfaces).
- **Issue:** An unreachable-but-env-reading legacy provider block in the copilot runtime config — a latent re-wire risk that contradicts D3's "FULL rip-out of the levers."
- **Fix:** Removed the `AIProvider` union member, the `providers.anythingllm` entry, and the 3 `ANYTHINGLLM_*` env reads. Type-check + guard stay green.
- **Files modified:** `agent-runtime/src/config.ts`
- **Commit:** `233e5c02`

**2. [Rule 2 — missing critical functionality / D3 completion] Cleaned the root `.env.example`**

- **Found during:** Task 2, the audit.
- **Issue:** 74-08 missed the root `.env.example`, leaving dead `ANYTHINGLLM_*` doc levers.
- **Fix:** Replaced them with the on-prem `VLLM_BASE_URL`/`TEI_EMBED_URL` levers (parity with the sibling env-examples 74-08 cleaned).
- **Files modified:** `.env.example`
- **Commit:** `c3e2ee87`

### Checkpoints deferred (deploy gate)

- **Task 1 (checkpoint:human-action — DEPLOY GATE):** the on-prem vLLM/gemma + TEI stack is not
  running in this environment (same gate as P72/P73). Resolved the `deploy-gate` by documenting
  the bring-up + runbook in `74-VERIFICATION.md` rather than blocking. Live tasks NOT executed.
- **Task 3 (checkpoint:human-verify):** the live bilingual sign-off depends on Task 1's stack +
  a real authenticated browser on staging. Left PENDING with its checklist in `74-VERIFICATION.md`.
- **No live result was fabricated and no threshold was lowered (T-74-11-02/05).**

## Known Stubs

None. This plan is an audit + two surgical dead-lever removals + verification docs. No
placeholder/empty-value stubs introduced.

## Threat surface

No new network endpoints, auth paths, or trust boundaries. Both fixes are removals of dead
external-LLM levers (reduce surface). No service-role added. The copilot runtime keeps its
zero-egress on-prem binding (vLLM/Ollama via `getCopilotModel`).

## Remaining work (deploy-gated)

The deploy-gated half of EVAL-01/03/04 closes once the GPU/gemma + TEI stack is live:

1. `EVAL_AI_URL=… pnpm --filter agent-runtime test:eval` → record EVAL-01 ≥ 0.80 + EVAL-03 ≥ 0.75.
2. The `74-UAT.md` network-block UAT (3 surfaces, EN+AR, zero AnythingLLM requests) on staging.
3. Human sign-off → flip the `74-VERIFICATION.md` status banner.

## Self-Check: PASSED

- Created/modified files all exist on disk (74-VERIFICATION.md, config.ts, .env.example).
- Both task commits present in git log (`233e5c02`, `c3e2ee87`).
- Plan `<verify>` automated check passes (EVAL-04 + network-block/setBlockedURLs + EVAL-01/0.80/briefing all present in 74-VERIFICATION.md).
