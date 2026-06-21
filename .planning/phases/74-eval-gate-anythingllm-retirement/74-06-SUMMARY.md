---
phase: 74-eval-gate-anythingllm-retirement
plan: 06
subsystem: ai
tags:
  [
    vllm,
    on-prem,
    edge-functions,
    deno,
    anythingllm-retirement,
    translation,
    summary,
    extraction,
    word-assistant,
  ]

# Dependency graph
requires:
  - phase: 74-05
    provides: the shared `_shared/onprem-llm.ts#generateStructuredJson` on-prem vLLM helper this wave reuses (and extends with `generateText`)
  - phase: 72-copilot
    provides: getCopilotModel() on-prem vLLM binding pattern (VLLM_BASE_URL, gemma-4-12b) mirrored by the helper
provides:
  - supabase/functions/_shared/onprem-llm.ts#generateText — plain-text (prose) on-prem vLLM chat-completions helper for edge functions (no response_format)
  - ai-extract / ai-summary-generate / dossier-field-assist generation re-homed off AnythingLLM onto generateStructuredJson (structured JSON)
  - multilang-content / translate-content / word-assistant generation re-homed off AnythingLLM onto generateText (prose)
affects: [74-07, eval-gate, anythingllm-container-removal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Edge-fn on-prem prose generation: generateText({systemPrompt,userPrompt,timeoutMs}) -> ${VLLM_BASE_URL}/v1/chat/completions WITHOUT response_format, returns trimmed content string'
    - 'Re-home pattern: replace the `if (ANYTHINGLLM env) { try fetch } catch fallback else fallback` gate with `try { onprem-helper } catch { existing-fallback }` since the helper throws when VLLM_BASE_URL is unset'

key-files:
  created: []
  modified:
    - supabase/functions/_shared/onprem-llm.ts
    - supabase/functions/ai-extract/index.ts
    - supabase/functions/ai-summary-generate/index.ts
    - supabase/functions/dossier-field-assist/index.ts
    - supabase/functions/multilang-content/index.ts
    - supabase/functions/translate-content/index.ts
    - supabase/functions/word-assistant/index.ts

key-decisions:
  - 'Added generateText to _shared/onprem-llm.ts (sibling to generateStructuredJson) for the prose surfaces (translation, writing assistant); same fetch/env binding, no response_format, returns choices[0].message.content trimmed'
  - 'Collapsed the env-presence gate (if ANYTHINGLLM_URL && ANYTHINGLLM_API_KEY) into a plain try/catch: the helper throws when VLLM_BASE_URL is unset, so the existing fallback catch covers the unconfigured-model case identically'
  - 'word-assistant generate_embeddings action returns a 1024-dim placeholder vector (was a 1536-dim random mock via AnythingLLM /api/v1/embed) with a code note that real embeddings re-home to on-prem TEI BGE-M3 in 74-07; the FE WordAssistantPage never invokes this action'
  - 'word-assistant model label changed anythingllm->vllm; AI-interaction-logger modelProvider/modelName changed ollama/llama2 -> vllm/${VLLM_MODEL||gemma-4-12b} in the three logger-bearing fns'

patterns-established:
  - 'On-prem prose generation via generateText: systemPrompt + userPrompt -> string; throw -> caller degrades to its non-AnythingLLM fallback'

requirements-completed: [EVAL-04]

# Metrics
duration: 8min
completed: 2026-06-21
---

# Phase 74 Plan 06: Text-AI Edge-Fn On-Prem Re-Home Summary

**The six remaining text/generation AI edge functions (`ai-extract`, `ai-summary-generate`, `dossier-field-assist`, `multilang-content`, `translate-content`, `word-assistant`) re-homed off AnythingLLM workspace/chat onto the shared on-prem vLLM helper — structured-JSON fns via `generateStructuredJson`, prose fns via a new `generateText` export — completing the generative half of the FULL AnythingLLM rip-out (D3) with every fallback, the word-assistant page, bilingual EN+AR output, and the no-new-service-role keystone intact.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-21T12:17:44Z
- **Completed:** 2026-06-21T12:25:53Z
- **Tasks:** 2
- **Files modified:** 7 (0 created, 7 modified)

## Accomplishments

- **Added `generateText` to `_shared/onprem-llm.ts`** — a Deno `fetch` to `${VLLM_BASE_URL}/v1/chat/completions` mirroring `generateStructuredJson`'s env binding (`VLLM_BASE_URL`/`VLLM_MODEL`/`VLLM_API_KEY`) but WITHOUT `response_format`, returning `choices[0].message.content` trimmed. Throws on missing endpoint / non-ok / empty completion so callers degrade. Zero-egress: only ever reaches the on-prem vLLM host.
- **`ai-extract`** — `callAnythingLLM` → `extractStructuredData` via `generateStructuredJson` (JSON mode); maps to the same `ExtractionResult` shape; keeps the `'AI extraction failed. Please try manual entry.'` throw as the degradation. Both call sites (sync + async background job) updated. Removed `ANYTHINGLLM_API_URL`/`ANYTHINGLLM_API_KEY` consts.
- **`ai-summary-generate`** — `/api/chat` + `JSON.parse(aiData.textResponse)` → `generateStructuredJson` producing the bilingual `{en,ar}` `SummaryResponse`; preserves metadata enrichment, the `ai_summaries` DB save, the AI-interaction logger lifecycle, and the existing 503 `AI_UNAVAILABLE` + `generateFallbackSummary` branch. Added an incomplete-bilingual guard that throws → falls through to the data-derived fallback.
- **`dossier-field-assist` (edge)** — workspace-chat → `generateStructuredJson` producing the bilingual field object (`name_en/ar`, `description_en/ar`, `suggested_tags`); keeps `generateFallbackFields` + the missing-required-fields → fallback validation; logger preserved.
- **`multilang-content`** — `translateText` workspace-chat → `generateText`; keeps the length-ratio confidence calc and the original-content/`0.1`-confidence fallback.
- **`translate-content`** — both the single-translation path and the batch path (`handleBatchTranslation`) → `generateText`; keeps the prefix-cleanup regex, the AI-interaction logger, and `generateFallbackTranslation` (word-by-word/placeholder, confidence 0.0).
- **`word-assistant`** — `callAnythingLLM` → `callOnPremModel` (wraps `generateText`) preserving the `WordAssistantResponse` shape the FE page consumes; `generateFallbackResponse` kept (sanitized the "AnythingLLM" wording in the placeholder strings to "AI service"). The `generate_embeddings` action's AnythingLLM `/api/v1/embed` call → a 1024-dim placeholder with a 74-07 TEI note. **The standalone `WordAssistantPage.tsx`, its route, and the nav entry are untouched (D3: re-home, keep the page).**

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-home extraction + summary + field-assist (structured JSON)** — `27801cb8` (feat)
2. **Task 2: Re-home translation + multilang + word-assistant (text) + add generateText** — `560f0237` (feat)

**Plan metadata:** _(this docs commit)_

## Files Created/Modified

- `supabase/functions/_shared/onprem-llm.ts` (modified) — added `generateText` (prose, no `response_format`) alongside `generateStructuredJson`.
- `supabase/functions/ai-extract/index.ts` (modified) — bilingual extraction via on-prem vLLM JSON mode; AnythingLLM env/URL removed; manual-entry degradation kept.
- `supabase/functions/ai-summary-generate/index.ts` (modified) — bilingual `{en,ar}` executive summary via on-prem vLLM JSON mode; 503 data-derived fallback kept.
- `supabase/functions/dossier-field-assist/index.ts` (modified) — bilingual field assist via on-prem vLLM JSON mode; `generateFallbackFields` kept.
- `supabase/functions/multilang-content/index.ts` (modified) — multi-language translation via on-prem vLLM prose; original-content fallback kept.
- `supabase/functions/translate-content/index.ts` (modified) — single + batch translation via on-prem vLLM prose; word-by-word fallback kept.
- `supabase/functions/word-assistant/index.ts` (modified) — writing assistant via on-prem vLLM prose; page/route/nav kept; embeddings placeholdered pending 74-07.

## Decisions Made

- **`generateText` is a sibling export, not a refactor of `generateStructuredJson`.** Appended a parallel function (same env reads, same fetch shape, minus `response_format`, returning a trimmed string) rather than refactoring the working JSON path — keeps the 74-05-verified `generateStructuredJson` byte-stable and isolates risk.
- **Collapse the env-presence gate into a plain try/catch.** The old `if (ANYTHINGLLM_URL && ANYTHINGLLM_API_KEY) { try } catch fallback else fallback` had two fallback exits (AI-error and not-configured). The on-prem helper throws when `VLLM_BASE_URL` is unset, so a single `try { helper } catch { fallback }` covers both cases identically and removes the AnythingLLM env reads.
- **word-assistant embeddings → placeholder, not TEI here.** Real embeddings re-home to the on-prem TEI BGE-M3 (1024-dim) service in **74-07** alongside the semantic-search edge fns (file-disjoint from this wave). The `generate_embeddings` action is API-compat-only (the FE page never calls it), so it returns a zero 1024-dim vector with an explicit code note rather than pulling 74-07's TEI work forward. This removes the last AnythingLLM reference from the file without overstepping scope.
- **AI-interaction-logger provider/model labels updated** ollama/llama2 → vllm/`${VLLM_MODEL||gemma-4-12b}` in the three logger-bearing fns, so the audit trail reflects the real upstream model.

## Deviations from Plan

None — plan executed exactly as written. The plan permitted `generateText` to be added to the helper "if absent" (it was) and permitted word-assistant to be re-homed via `generateText`/`generateStructuredJson` (chose `generateText`). The embeddings placeholder is consistent with the plan's explicit file-disjointness from 74-07 (embedding fns).

## Issues Encountered

- **`deno check` unusable as a gate (pre-existing, out of scope).** As documented in 74-05, `deno check` cannot resolve the monorepo workspace (`shared/` has no `package.json`) and errors before type-checking. Brace-balance was verified on all four Task-2 files (all balanced) and the real CI gate `pnpm run check:edge-fn-schema` **passes** (319 files, 2098 literals). No new `.from`/`.rpc` references were introduced.
- **Adjacent non-target edge fns appear modified in the tree.** `intelligence-{refresh,refresh-v2,batch-update}` (74-05, already committed) show as modified because the pre-commit lint-staged formatter reformatted them; `search-semantic`/`semantic-search-unified`/`position-suggestions-get` are **74-07's** embedding files being worked elsewhere. All have **zero** AnythingLLM refs and are **NOT** in this plan's file set — they were deliberately left unstaged (staged exactly the 4 Task-2 files; Task-1 staged exactly its 3). Not my changes; left untouched per the destructive-git prohibition.

## Verification

- **`grep -rin anythingllm`** on all six target `index.ts` → **zero matches** (grep exit 1). (The three remaining "AnythingLLM" mentions in `_shared/onprem-llm.ts` are the helper's own descriptive comments documenting the retirement — same as the 74-05 precedent; the helper is not in the plan's grep scope.)
- **Each fn imports `_shared/onprem-llm.ts` and uses a generator** (`generateStructuredJson` ×3, `generateText` ×3); `generateText` is exported from the helper (1 export).
- **FE word-assistant intact:** `frontend/src/routes/_protected/word-assistant.tsx`, `frontend/src/pages/word-assistant/WordAssistantPage.tsx`, and the nav entry in `frontend/src/components/modern-nav/navigationData.ts` all present (untouched by this wave).
- **Degradation preserved (EVAL-04 "surfaces still work" / T-74-06-02):** ai-extract (manual-entry throw), ai-summary-generate (`generateFallbackSummary` + 503 `AI_UNAVAILABLE`), dossier-field-assist (`generateFallbackFields`), multilang-content (original+0.1 conf), translate-content (`generateFallbackTranslation`), word-assistant (`generateFallbackResponse`).
- **Zero-egress (T-74-06-01):** the only generation `fetch` paths now reach `${VLLM_BASE_URL}` (on-prem) via the helper; no AnythingLLM/cloud endpoint remains in any of the six.
- **Keystone — no new service-role (T-74-06-04):** `SUPABASE_SERVICE_ROLE_KEY` ref counts byte-identical pre/post (ai-extract 0→0, multilang 1→1 pre-existing, word-assistant 0→0); generator swap only, Supabase client setup untouched.
- **Bilingual EN+AR intact:** ai-summary `{en,ar}` shape preserved; dossier-field-assist `name_ar`/`description_ar` preserved; translation system prompts and Arabic placeholder fallbacks (`[الترجمة معلقة]`) intact.
- **Real CI gate `pnpm run check:edge-fn-schema` → OK.**

## User Setup Required

None for the code re-home. **Runtime is deploy-gated** (same gate as P72/P73/74-05): live generation needs the on-prem GPU stack (vLLM + gemma-4-12b) reachable at `VLLM_BASE_URL`. Until then every surface degrades to its preserved fallback. The CODE re-home is what this wave verifies.

## Next Phase Readiness

- `_shared/onprem-llm.ts` now exports both `generateStructuredJson` (JSON) and `generateText` (prose) — available to any remaining edge fn.
- All six text-AI edge fns are AnythingLLM-free, clearing them for the EVAL-04 static allowlist.
- **74-07** owns the remaining AnythingLLM removal: the embedding/semantic-search fns (`search-semantic`, `semantic-search-unified`, `position-suggestions-get`) re-pointed to on-prem TEI BGE-M3 (1024-dim), the backend twin `ai/dossier-field-assist.ts`, and the brief/health fns — plus wiring word-assistant's `generate_embeddings` placeholder to TEI.

## Self-Check: PASSED

- All seven modified files exist on disk (helper + 6 fns + this SUMMARY).
- Both task commits exist in git history (`27801cb8`, `560f0237`).
- `grep -rin anythingllm` on the six target fns returns nothing; `pnpm run check:edge-fn-schema` OK.

---

_Phase: 74-eval-gate-anythingllm-retirement_
_Completed: 2026-06-21_
