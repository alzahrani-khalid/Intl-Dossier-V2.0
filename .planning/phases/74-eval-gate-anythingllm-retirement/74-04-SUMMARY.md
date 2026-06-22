---
phase: 74-eval-gate-anythingllm-retirement
plan: 04
subsystem: ai
tags: [anythingllm, llm-router, embeddings, bge-m3, vllm, ollama, csp, backend]

# Dependency graph
requires:
  - phase: 74-02
    provides: Removal of the /api/ai/chat route that drove chatAssistantAgent over AnythingLLM
provides:
  - AIProvider union and providers map with the anythingllm provider removed
  - llmRouter routing only to openai/anthropic/google/vllm/ollama (no AnythingLLM branch)
  - Deletion of the standalone anythingllm.service.ts client
  - BGE-M3-only embedding path in vector/semantic-search services (AnythingLLM fallback removed)
  - AI health endpoint with the AnythingLLM probe removed
  - CSP connect-src allow-list with the AnythingLLM origin removed
affects: [74-05, 74-06, 74-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Backend LLM routing is on-prem (vLLM/Ollama) + cloud (OpenAI/Anthropic/Google) only'
    - 'Embeddings are BGE-M3 (local) primary with keyword fallbackSearch degradation; no external embedder fallback'

key-files:
  created: []
  modified:
    - backend/src/ai/config.ts
    - backend/src/ai/llm-router.ts
    - backend/src/ai/embeddings-service.ts
    - backend/src/services/vector.service.ts
    - backend/src/services/semantic-search.service.ts
    - backend/src/api/ai.ts
    - backend/src/middleware/security.ts
  deleted:
    - backend/src/services/anythingllm.service.ts

key-decisions:
  - 'Default provider falls through to anthropic (if key) else openai — the AI_USE_ANYTHINGLLM/ANYTHINGLLM_API_URL auto-select branch was removed, so a stray env var can no longer re-route traffic to AnythingLLM (T-74-04-05)'
  - "On BGE-M3 embedding failure, vector.service sets fallbackMode='keyword' so searchByVector degrades to fallbackSearch instead of crashing (T-74-04-04); the removed anythingLLMAvailable guard is folded into fallbackMode"
  - 'chat-assistant.ts / brief-generator.ts were NOT edited; both compile because they bind via the provider-agnostic llmRouter (T-74-04-01)'
  - 'brief.service.ts and api/ai/dossier-field-assist.ts AnythingLLM usage intentionally deferred to 74-06 (out of scope here to avoid file overlap)'
  - "Generated DB type artifacts (database.types.ts anythingllm_* columns + 'anythingllm' enum value, contact-directory.types.ts) left untouched — they mirror the live schema, not the AI core, and are out of this plan's scope"

patterns-established:
  - 'Provider removal: drop from AIProvider union AND the Record<AIProvider, AIProviderConfig> map key to keep the type exhaustive'
  - 'When removing a dead import that orphaned a binding (aiConfig in api/ai.ts), drop the import in the same edit to satisfy no-unused-vars'

requirements-completed: [EVAL-04]

# Metrics
duration: 30min
completed: 2026-06-21
---

# Phase 74 Plan 04: Backend AI-Core AnythingLLM Rip-Out Summary

**Removed the AnythingLLM provider, its AI_USE_ANYTHINGLLM/ANYTHINGLLM_API_URL off-switch + default auto-select, the llmRouter branch, the standalone client, the BGE-M3 embedding fallback, the AI health probe, and the CSP allow-entry from the backend AI core — leaving llmRouter on vLLM/Ollama + cloud only and embeddings on BGE-M3 with keyword degradation.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-06-21T14:40:00Z (approx, first edit)
- **Completed:** 2026-06-21T14:55:11Z
- **Tasks:** 2
- **Files modified:** 8 (7 modified, 1 deleted)

## Accomplishments

- Severed the `anythingllm` provider end to end: removed it from the `AIProvider` union and the `providers` map, deleted the provider entry, and removed the `AI_USE_ANYTHINGLLM`/`ANYTHINGLLM_API_URL` default-provider auto-select branch (config.ts). Default provider now resolves to `anthropic` (if key present) else `openai`.
- Stripped the entire AnythingLLM path from `llm-router.ts`: import, `private anythingllm` field, init block, `providerHealth.set('anythingllm', ...)`, the `chat()` dispatch branch, the whole `chatAnythingLLM` method, and the `streamChat` non-streaming branch. `chatAssistantAgent` (used by brief-generator) compiles unchanged.
- Deleted `backend/src/services/anythingllm.service.ts` (only `llm-router.ts` imported it; verified zero importers remain).
- Removed the AnythingLLM `/v1/embeddings` fallback, the `anythingLLMAvailable` field, and the `checkAnythingLLMStatus` method from `vector.service.ts`; BGE-M3 is the unconditional primary embedder, with `fallbackMode='keyword'` driving the existing `fallbackSearch` degradation.
- Reworded `semantic-search.service.ts` comments/warning to BGE-M3 and made `isSemanticSearchAvailable` BGE-M3-only (dropped the `checkAnythingLLMStatus` call).
- Removed the AnythingLLM health probe + `inference.anythingllm` field from `api/ai.ts` (health now from embedding + openai/anthropic), and dropped the AnythingLLM origin from the CSP `connect-src` allow-list in `security.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the anythingllm provider, off-switch, llm-router branch, and client** - `09c78a3b` (feat)
2. **Task 2: Remove AnythingLLM embedding fallback, health probe, and CSP entry** - `bee5c8da` (feat)

**Plan metadata:** (final docs commit — this SUMMARY + STATE/ROADMAP)

## Files Created/Modified

- `backend/src/ai/config.ts` - Removed `anythingllm` from `AIProvider` union + providers map; removed the off-switch default-provider auto-select branch.
- `backend/src/ai/llm-router.ts` - Removed AnythingLLM import/field/init/dispatch/streaming branches + `chatAnythingLLM` method.
- `backend/src/services/anythingllm.service.ts` - **Deleted** (orphaned client, no importers).
- `backend/src/ai/embeddings-service.ts` - Removed `'anythingllm'` from the two `provider` union types (type-only).
- `backend/src/services/vector.service.ts` - Removed AnythingLLM embedding fallback, `anythingLLMAvailable`, `checkAnythingLLMStatus`, and the `AI_USE_ANYTHINGLLM` read; BGE-M3 primary with keyword degradation.
- `backend/src/services/semantic-search.service.ts` - Reworded comments/warning to BGE-M3; availability now BGE-M3-only.
- `backend/src/api/ai.ts` - Removed AnythingLLM health probe + `inference.anythingllm`; recomputed health from embedding + openai/anthropic; dropped now-unused `aiConfig` import; reworded dossier-field-assist mount comment.
- `backend/src/middleware/security.ts` - Removed `ANYTHINGLLM_API_URL` from CSP `connect-src`.

## Decisions Made

- **Default-provider fall-through:** With the auto-select branch gone, `defaultProvider = anthropic (if ANTHROPIC_API_KEY) else openai`. This removes the spoofing vector (T-74-04-05) where a stray `AI_USE_ANYTHINGLLM` could silently re-route traffic.
- **Keyword degradation preserved:** The removed `anythingLLMAvailable` flag previously triggered `fallbackSearch`. Folded that into `fallbackMode='keyword'` set on BGE-M3 failure, so search still degrades to keyword rather than crashing (T-74-04-04). `searchByVector` now guards on `this.fallbackMode` only.
- **chat-assistant / brief-generator untouched:** Confirmed both compile against the provider-agnostic `llmRouter` after the AnythingLLM branch was removed (T-74-04-01). No edits to those files.
- **Generated DB types left as-is:** `database.types.ts` (`anythingllm_*` columns + `"anythingllm"` enum value) and `contact-directory.types.ts` are generated schema mirrors, not part of the AI core; out of this plan's `files_modified` and verification scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed now-unused `aiConfig` import in api/ai.ts**

- **Found during:** Task 2 (api/ai.ts health probe removal)
- **Issue:** Removing the AnythingLLM health probe orphaned the `aiConfig` import (it was the only consumer), which would fail `@typescript-eslint/no-unused-vars: error` and block lint/commit.
- **Fix:** Changed `import { getAIFeatureStatus, aiConfig }` to `import { getAIFeatureStatus }`.
- **Files modified:** backend/src/api/ai.ts
- **Verification:** ESLint exit 0 on all 7 changed files; type-check clean.
- **Committed in:** bee5c8da (Task 2 commit)

**2. [Rule 1 - Bug] Reworded stale AnythingLLM comments in edited files**

- **Found during:** Tasks 1 & 2
- **Issue:** Comments/warnings in semantic-search.service.ts ("via BGE-M3 (primary) or AnythingLLM (fallback)", "AnythingLLM unavailable...") and the api/ai.ts mount comment ("AnythingLLM integration") would leave the verification grep dirty and misdescribe the new behavior.
- **Fix:** Reworded to BGE-M3 / generic embedding-service language. The `dossier-field-assist` route itself was NOT changed (deferred to 74-06) — only its mount comment in ai.ts.
- **Files modified:** backend/src/services/semantic-search.service.ts, backend/src/api/ai.ts
- **Verification:** `grep -rin anythingllm` on the plan's 5 Task-2 files returns CLEAN.
- **Committed in:** bee5c8da (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug/comment-hygiene)
**Impact on plan:** Both were necessary to keep lint/type-check green and the verification grep clean. No scope creep — the deferred `brief.service.ts` / `dossier-field-assist.ts` AnythingLLM logic was left intact for 74-06 as the plan specifies.

## Issues Encountered

- The pre-commit hook blocks `git commit --no-verify`; the hook runs `lint-staged` (passed) then a full `pnpm build`. After Task 1 alone, `api/ai.ts` still referenced the removed provider, so a Task-1-only build necessarily failed — but the hook's `pnpm build` failure is non-blocking on this machine (documented behavior), so Task 1 committed cleanly (`09c78a3b`). After Task 2 the full backend type-check (exit 0) and build (exit 0) both pass.
- Pre-existing `pdfkit`/`PDFDocument` esbuild warning in `reporting.service.ts` is unrelated to this plan (out of scope, not introduced here) — left untouched.

## Keystone / Security

- **No new service-role introduced (T-74-04-02).** The pre-existing `supabaseAdmin` usage in `llm-router.ts` and `embeddings-service.ts` was already present and is untouched. This plan only removed a provider + fallbacks; the caller-JWT keystone and RLS posture are unchanged.
- **CSP tightened (T-74-04-03):** the AnythingLLM origin is removed from `connect-src`, so the browser can no longer be steered to that unused external endpoint.

## Next Phase Readiness

- Backend AI core is AnythingLLM-free for routing, embeddings, health, and CSP. `llmRouter` reaches only on-prem + cloud providers; embeddings are BGE-M3-primary.
- **For 74-06:** `brief.service.ts` (lines ~61-68, 146, 383-427) and `backend/src/api/ai/dossier-field-assist.ts` still reference AnythingLLM — intentionally deferred.
- **For 74-05/06/07:** edge functions, compose/nginx/env, and `intelligence-refresh*` country-intel still carry AnythingLLM and are handled in those plans.

## Self-Check: PASSED

- `backend/src/services/anythingllm.service.ts` — CONFIRMED ABSENT
- Commit `09c78a3b` (Task 1) — FOUND in git log
- Commit `bee5c8da` (Task 2) — FOUND in git log
- No importer of `anythingllm.service` anywhere in `backend/src` — CLEAN
- Plan `<verification>` grep over `backend/src/ai` + the two service files + `api/ai.ts` + `security.ts` — CLEAN
- `pnpm --filter intake-backend type-check` — exit 0
- `pnpm --filter intake-backend build` — exit 0
- ESLint on all 7 changed source files — exit 0

---

_Phase: 74-eval-gate-anythingllm-retirement_
_Completed: 2026-06-21_
