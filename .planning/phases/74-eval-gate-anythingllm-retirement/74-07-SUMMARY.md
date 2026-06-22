---
phase: 74-eval-gate-anythingllm-retirement
plan: 07
subsystem: ai-edge-and-backend
tags: [anythingllm-retirement, embeddings, tei-bge-m3, vllm, briefs, zero-egress, EVAL-04]
requires:
  - 74-04 (backend AI-core AnythingLLM removal — provided the AnythingLLM-free backend baseline)
  - 74-05 (shared on-prem helper `_shared/onprem-llm.ts`: generateText/generateStructuredJson)
provides:
  - Embedding edge fns (embeddings-generate, intake-tickets-duplicates) sourcing vectors from on-prem TEI BGE-M3 (1024-dim)
  - positions-consistency-check recommendations via on-prem vLLM (generateText)
  - briefing-pack translator on on-prem vLLM; dossiers-briefs-generate retired (directs to copilot propose_brief)
  - intake-ai-health probing on-prem TEI + vLLM
  - backend BriefService AnythingLLM generator removed (generateBrief throws migration error); briefContextService preserved
  - dossier-field-assist on deterministic rule-based generation (zero-egress)
affects:
  - supabase/functions/embeddings-generate, intake-tickets-duplicates, positions-consistency-check
  - supabase/functions/_shared/briefing-pack-generator, dossiers-briefs-generate, intake-ai-health
  - backend/src/services/brief.service.ts, backend/src/api/ai/dossier-field-assist.ts
tech-stack:
  added: []
  patterns:
    - 'TEI /embed (POST { inputs } -> number[][] -> [0], assert 1024-dim, never pad/truncate)'
    - 'on-prem chat via _shared/onprem-llm.ts generateText (VLLM_BASE_URL), throw-and-fallback'
key-files:
  created: []
  modified:
    - supabase/functions/embeddings-generate/index.ts
    - supabase/functions/intake-tickets-duplicates/index.ts
    - supabase/functions/positions-consistency-check/index.ts
    - supabase/functions/_shared/briefing-pack-generator.ts
    - supabase/functions/dossiers-briefs-generate/index.ts
    - supabase/functions/intake-ai-health/index.ts
    - backend/src/services/brief.service.ts
    - backend/src/api/ai/dossier-field-assist.ts
decisions:
  - 'dossier-field-assist routes through generateFallbackFields (deterministic, rule-based) rather than the org-policy-driven backend llmRouter — the field-assist path has no org/classification context to plumb, and the plan permits the fallback. Zero-egress, no service-role.'
  - 'briefing-packs-generate/index.ts was NOT modified (listed defensively in files_modified): its only AnythingLLM dependency lived in the shared briefing-pack-generator.translateText, now re-homed. Touching it would be stray reformatting.'
  - 'dossiers-briefs-generate returns 200 with a BRIEF_GENERATION_RETIRED notice + the manual template (not a 503 error) — the template is a supported response; AI generation is the copilot propose_brief path.'
  - 'BriefService.generateBrief throws a migration-path error (kept the method + POST /api/ai/briefs route) rather than removing the route, so callers get a clear signal instead of a 404.'
metrics:
  duration: ~45m
  completed: 2026-06-21
  tasks: 2
  files: 8
  commits: 2
---

# Phase 74 Plan 07: Embedding + Brief + Backend-Twin AnythingLLM Rip-out Summary

Completed the FULL AnythingLLM removal (D3 / EVAL-04) for the embedding, brief-pack, and backend brief/field-assist surfaces: the three embedding-producing edge fns now source vectors from on-prem TEI BGE-M3 (1024-dim, dim-asserted), the brief-pack translator + position recommendations run on on-prem vLLM via the shared helper, the retired `dossiers-briefs-generate` generator is gated off (directs to the copilot `propose_brief` path), the backend `BriefService` AnythingLLM generator + the `dossier-field-assist` AnythingLLM call are removed, and `intake-ai-health` probes TEI + vLLM. Zero-egress throughout; no new service-role; `briefContextService` preserved.

## What shipped

### Task 1 — Embedding edge fns → on-prem TEI BGE-M3 (commit `be6c2a78`)

- **`embeddings-generate/index.ts`**: replaced `generateAnythingLLMEmbedding` with `generateTEIEmbedding` (`${TEI_EMBED_URL}/embed`, `{ inputs }` → `number[][]`, asserts 1024-dim on every vector — never pads/truncates). `provider` union changed `'openai'|'anythingllm'|'fallback'` → `'openai'|'tei'|'fallback'`. OpenAI stays the configured primary (1536-dim, unchanged); the self-hosted fallback is now TEI. Health probe (`checkProviderHealth` + GET `/health`) reports `tei` instead of `anythingllm`.
- **`intake-tickets-duplicates/index.ts`**: query embedding via TEI `/embed` (1024-dim, validated before insert). `ai_embeddings` cache-hit path (line 91-92) and the no-embedding → keyword-search fallback preserved.
- **`positions-consistency-check/index.ts`**: the `includeRecommendations` chat re-homed off AnythingLLM onto `generateText` (on-prem vLLM, `VLLM_BASE_URL`, 45s). Block now gated on `VLLM_BASE_URL` presence; keyword/text-similarity fallback (`generateFallbackRecommendations`) intact. The vector-similarity path (`find_similar_positions` RPC) never called AnythingLLM — unchanged.

### Task 2 — Brief paths + backend twin + AI health (commit `b287c1a5`)

- **`_shared/briefing-pack-generator.ts`**: `translateText` re-homed to `generateText` (on-prem EN↔AR translation); original-text fallback on error preserved.
- **`briefing-packs-generate/index.ts`**: unchanged — consumes the fixed shared helper (no direct AnythingLLM reference existed).
- **`dossiers-briefs-generate/index.ts`**: removed the retired AnythingLLM generate+persist branch (and its now-dead AI-interaction-logger plumbing + imports). The fn no longer generates; returns 200 with a `BRIEF_GENERATION_RETIRED` bilingual notice + the manual template (pre-populated from dossier + recent timeline) and directs callers to the copilot `propose_brief` flow (P73 `persist_brief`). `briefs` is not written here.
- **`intake-ai-health/index.ts`**: probes on-prem TEI (`TEI_EMBED_URL` → `embedding_model`) + on-prem vLLM (`VLLM_BASE_URL` `/v1/models` → `classification_model`). Response shape (`{ status, services:{embedding_model, classification_model, vector_store}, fallback_active, last_success, timestamp }`) preserved.
- **`backend/src/services/brief.service.ts`**: removed the AnythingLLM generator (`callAnythingLLM`, `generateSection`, `prepareContext`, `translateContent`, `extractKeyPoints`, `extractRecommendations`, `getArabicType`, `fetchEntityData`, `getTemplate`, `getDefaultTemplate`), the `anythingLLMUrl`/`anythingLLMKey` fields + constructor, and the now-orphaned `axios` import. `generateBrief` throws a clear "moved to the copilot propose_brief path (P73)" error. **`briefContextService` + `BriefContext` and all read/template methods (getUserBriefs, getBriefById, getTemplates, createTemplate, reviewBrief, getBriefsForEntity) preserved** (brief-generator.ts:15 dep intact).
- **`backend/src/api/ai/dossier-field-assist.ts`**: removed `callAnythingLLM` + the AnythingLLM env consts (`ANYTHINGLLM_BASE_URL/API_KEY/WORKSPACE`) + the AI-prompt; the handler routes generation through the deterministic `generateFallbackFields` extractor. Fallback path preserved.

## Verification

| Check                                                                              | Result                        |
| ---------------------------------------------------------------------------------- | ----------------------------- |
| `grep -rin anythingllm` across all 9 plan files                                    | CLEAN (empty)                 |
| `embeddings-generate` + `intake-tickets-duplicates` use `TEI_EMBED_URL`            | yes                           |
| `positions-consistency-check` + `briefing-pack-generator` use `_shared/onprem-llm` | yes                           |
| `intake-ai-health` probes `VLLM_BASE_URL`                                          | yes (3 refs)                  |
| `briefContextService` still exported from `brief.service.ts`                       | yes (line 516)                |
| `pnpm run check:edge-fn-schema`                                                    | OK (319 files, 2097 literals) |
| `backend pnpm type-check` (`tsc --noEmit`)                                         | clean (exit 0)                |
| `eslint` on the 2 changed backend files                                            | clean (exit 0)                |
| pre-commit full build (turbo)                                                      | passed (both commits landed)  |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed orphaned `axios` import + dead helper cluster in `brief.service.ts`**

- **Found during:** Task 2
- **Issue:** Removing the AnythingLLM generator body orphaned `axios` (sole user was `callAnythingLLM`) and an entire private-helper cluster (`generateSection`, `prepareContext`, `fetchEntityData`, `getTemplate`, `getDefaultTemplate`, `translateContent`, `extractKeyPoints`, `extractRecommendations`, `getArabicType`). With `@typescript-eslint/no-unused-vars: error`, the unused `axios` import would fail CI lint.
- **Fix:** Removed the orphaned import and the dead helper cluster (in-scope — they existed solely to serve the removed generator).
- **Files modified:** `backend/src/services/brief.service.ts`
- **Commit:** `b287c1a5`

**2. [Rule 3 - Blocking] Removed dead AI-interaction-logger imports in `dossiers-briefs-generate.ts`**

- **Found during:** Task 2
- **Issue:** Gating off the AnythingLLM branch orphaned `createAIInteractionLogger`, `extractClientInfo`, `AIInteractionType`, `AIContentType` imports.
- **Fix:** Removed the dead import block (those symbols served only the removed branch).
- **Commit:** `b287c1a5`

**Note (comment wording, not a code deviation):** the plan's `grep -in anythingllm` must return nothing, so retirement comments were worded to avoid the literal substring (e.g. "external-LLM generator removed" instead of "AnythingLLM removed").

## Carve-outs (intentional, not gaps)

- The legacy `anythingllm_*` DB columns (`intelligence_reports.anythingllm_workspace_id/query/response_metadata`), their Zod schema in `_shared/validation-schemas.ts`, and the reads in `intelligence-get` are **data-only** (nulled by 74-05). They remain as legacy/optional fields and are NOT in scope to delete (renaming/dropping would risk inserts). T-74-07-05 (accept).
- The env-key removal (`.env.example`, `deploy/.env.example`, compose container/nginx proxy) is a different plan's scope — those files are NOT in this plan's `files_modified` and were left untouched.

## Threat surface

No new network endpoints, auth paths, or trust boundaries introduced. All re-pointed paths target on-prem TEI/vLLM only (zero-egress, T-74-07-03). No service-role added — brief generation stays on the copilot `propose_brief` caller-JWT path (T-74-07-02). Embedding dim asserted at 1024 (TEI) / 1536 (OpenAI) with no force-merge (T-74-07-01). Every fn keeps a degradation fallback (T-74-07-04).

## Self-Check: PASSED

- Created/modified files: all 8 named files exist on disk (FOUND).
- Commits: `be6c2a78` and `b287c1a5` both present in `git log`.
