---
phase: 74-eval-gate-anythingllm-retirement
plan: 05
subsystem: ai
tags: [vllm, on-prem, edge-functions, deno, intelligence-refresh, anythingllm-retirement, json-mode]

# Dependency graph
requires:
  - phase: 74-03
    provides: the AnythingLLM-retirement allowlist/static guard that this wave clears for the three intelligence fns
  - phase: 72-copilot
    provides: getCopilotModel() on-prem vLLM binding pattern (VLLM_BASE_URL, gemma-4-12b, JSON mode) mirrored here
provides:
  - supabase/functions/_shared/onprem-llm.ts (generateStructuredJson) — shared on-prem vLLM JSON-mode chat-completions helper for edge functions
  - intelligence-refresh / intelligence-refresh-v2 / intelligence-batch-update country-intel generation re-homed off AnythingLLM onto the on-prem vLLM /v1/chat/completions endpoint
affects: [74-06, eval-gate, anythingllm-container-removal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Edge-fn on-prem generation: raw Deno fetch to ${VLLM_BASE_URL}/v1/chat/completions with response_format json_object (no openai npm dep in edge runtime)'
    - 'Shared _shared/onprem-llm.ts helper reusable by any edge fn that needs on-prem structured-JSON generation'

key-files:
  created:
    - supabase/functions/_shared/onprem-llm.ts
  modified:
    - supabase/functions/intelligence-refresh/index.ts
    - supabase/functions/intelligence-refresh-v2/index.ts
    - supabase/functions/intelligence-batch-update/index.ts

key-decisions:
  - 'Omit (not null) the legacy anythingllm_* upsert columns — they are nullable/optional in intelligence_reports, so dropping them from the upsert object is cleaner and removes the last anythingllm reference from the write path'
  - 'generateStructuredJson returns the already-parsed JSON object; parseStructuredResponse was adapted to accept an object (not a raw string) since vLLM JSON mode guarantees valid JSON'
  - 'batch-update upgraded its plain-text queries to structured-JSON ({summary,analysis}) so the on-prem response parses deterministically while preserving its confidence_score-number return shape'

patterns-established:
  - 'On-prem edge generation via shared helper: systemPrompt + userPrompt → generateStructuredJson → mapped to the DB write contract; failure throws so the refresh lock is released by the existing error path'

requirements-completed: [EVAL-04]

# Metrics
duration: 9min
completed: 2026-06-21
---

# Phase 74 Plan 05: Country-Intel On-Prem Re-Home Summary

**Country-intelligence generation (`intelligence-refresh` ×3) re-homed off AnythingLLM workspace-chat onto the on-prem vLLM `/v1/chat/completions` endpoint via a new shared `generateStructuredJson` helper, preserving the `intelligence_reports` write contract, bilingual EN+AR output, locking, and zero-egress.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-21T12:04:08Z
- **Completed:** 2026-06-21T12:13:08Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Created `_shared/onprem-llm.ts#generateStructuredJson` — a Deno `fetch` to `${VLLM_BASE_URL}/v1/chat/completions` in JSON mode (`response_format: json_object`), mirroring `getCopilotModel()` env binding (`VLLM_BASE_URL`/`VLLM_MODEL`/`VLLM_API_KEY`) and the propose-brief JSON-mode call. Zero-egress: it only ever reaches the on-prem vLLM host.
- Re-homed `intelligence-refresh`: routed the 5 per-type structured-JSON prompts through the helper; removed the `/api/health` probe, `workspaceSlug`, and `ensureWorkspaceExists`. Preserved the upsert contract (title/title_ar/content/content_ar/confidence_score/data_sources_metadata/metrics) and the `confidence_level→confidence_score` mapping.
- Re-homed `intelligence-refresh-v2` (same transformation; kept its base-70+metrics confidence scoring and `onConflict`/`.select()`).
- Re-homed `intelligence-batch-update`: re-pointed generation to the helper with structured-JSON queries; preserved `confidence_score`-number return shape, `lock_intelligence_for_refresh`, batch sizing, 1s pacing, and the dry-run path.
- Dropped the now-legacy `anythingllm_workspace_id`/`anythingllm_query`/`anythingllm_response_metadata` columns from all three upserts (nullable/optional in `intelligence_reports`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared on-prem helper + re-home intelligence-refresh** — `b3218e8d` (feat)
2. **Task 2: Re-home intelligence-refresh-v2 + intelligence-batch-update** — `49b3a23a` (feat)

**Plan metadata:** _(this docs commit)_

## Files Created/Modified

- `supabase/functions/_shared/onprem-llm.ts` (created) — shared on-prem vLLM JSON-mode chat-completions helper (`generateStructuredJson`); reads `VLLM_BASE_URL`/`VLLM_MODEL`/`VLLM_API_KEY`, throws on missing env / non-ok / empty / parse failure.
- `supabase/functions/intelligence-refresh/index.ts` (modified) — primary country-intel refresh via on-prem vLLM; AnythingLLM health/workspace/fetch removed.
- `supabase/functions/intelligence-refresh-v2/index.ts` (modified) — v2 refresh via on-prem vLLM; same transformation, v2 confidence scoring preserved.
- `supabase/functions/intelligence-batch-update/index.ts` (modified) — TTL-expiry batch driver re-pointed to on-prem vLLM; locking/batch/pacing/dry-run preserved.

## Decisions Made

- **Omit, don't null, the `anythingllm_*` columns** in the upserts. The columns stay in the schema (backward compat for historical rows) but the new write path doesn't reference them — removing the last `anythingllm` reference from the upsert. They are nullable/optional in `intelligence_reports.Insert`, verified against `database.types.ts`.
- **`generateStructuredJson` returns a parsed object.** vLLM JSON mode (`response_format: json_object`) guarantees the completion is valid JSON, so the helper does the `JSON.parse` and `parseStructuredResponse` was adapted to map an object (defensive fallback retained for an unexpected shape).
- **batch-update queries upgraded to structured JSON.** Its old plain-text `mode:'query'` prompts had no parseable structure; switching to `{summary,analysis}` JSON keeps the on-prem output deterministic while preserving its `confidence_score`-number return contract.

## Deviations from Plan

None — plan executed exactly as written. The plan explicitly permitted either nulling or omitting the `anythingllm_*` columns; omitting was chosen (see Decisions).

## Issues Encountered

- **Pre-existing `deno check` failures (TS18046 / TS2322), out of scope.** Strict `deno check` flags `catch (error) { ... error.message }` (`error` is `unknown`) and a pre-existing `failures`-array union-narrowing mismatch in batch-update. Verified pre-existing against `git show HEAD~:...`: original error counts were refresh=9, v2=11, batch=10; the re-homed code is refresh=9, v2=9, batch=9 — i.e. the change introduced **zero new type errors** (and removed 3 by deleting AnythingLLM catch blocks). The repo's `deno check` is not a CI gate anyway (it cannot resolve the monorepo workspace — `shared/` has no `package.json`); the real edge-fn CI gate `pnpm run check:edge-fn-schema` **passes** (319 files, 2098 literals). Logged in `74/deferred-items.md`.
- **lint-staged left two automatic-backup stashes** (`stash@{1}`, `stash@{2}`) after the pre-commit build hook. These are tool-managed (lint-staged's own backup/restore); both commits landed clean and the working tree is clean. Left untouched per the destructive-git prohibition (never `git stash drop`/`pop` on stashes I did not create).

## Verification

- `grep -rin anythingllm` on all three fns → **zero matches**.
- `_shared/onprem-llm.ts` exports `generateStructuredJson` hitting `${VLLM_BASE_URL}/v1/chat/completions` in JSON mode (`json_object`).
- `intelligence_reports` upsert: all 6 core fields + `confidence_score` mapping preserved (v1 + v2 both 6/6); `confidence_level→100/80/60/40` intact.
- **Zero-egress:** the only generation `fetch` in the helper targets the on-prem `VLLM_BASE_URL` host.
- **Keystone (no new service-role):** auth client call-counts byte-identical to pre-change (refresh 2/2, v2 2/2, batch 1/1); `onprem-llm.ts` has zero service-role/supabase references.
- **Bilingual EN+AR intact:** `title_ar`/`content_ar`/Arabic label strings preserved in all three.
- Locking (`lock_intelligence_for_refresh`), batch 1s pacing, 90s race timeout all intact.
- Real CI gate `pnpm run check:edge-fn-schema` → **OK**.

## User Setup Required

None for the code re-home. **Runtime is deploy-gated** (same gate as P72/P73): the live country-intel refresh needs the on-prem GPU stack (vLLM + gemma-4-12b) reachable at `VLLM_BASE_URL`. The CODE re-home is what this wave verifies.

## Next Phase Readiness

- `_shared/onprem-llm.ts#generateStructuredJson` is now available for any other edge fn that needs on-prem structured-JSON generation — **74-06 may reuse it** (e.g. `word-assistant` re-home).
- All three intelligence fns are AnythingLLM-free, clearing them for the EVAL-04 static allowlist and the eventual AnythingLLM container removal.

## Self-Check: PASSED

- All created/modified files exist on disk (helper + 3 fns + SUMMARY + deferred-items).
- Both task commits exist in git history (`b3218e8d`, `49b3a23a`).

---

_Phase: 74-eval-gate-anythingllm-retirement_
_Completed: 2026-06-21_
