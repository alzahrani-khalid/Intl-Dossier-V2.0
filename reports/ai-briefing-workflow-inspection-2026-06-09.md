# AI Briefing Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end AI/manual briefing workflow (`frontend/`, `backend/`, `supabase/functions/`)  
**Mode:** Read-only code inspection (no source changes)

---

## Executive summary

The codebase implements **two parallel briefing paths** that do not converge on the engagement dossier UI:

| Path                              | Trigger                                     | Backend                                     | LLM                                                                 | Persists to                           | Visible on engagement Briefs tab                                            |
| --------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| **A — Express / AnythingLLM**     | `BriefsPage` → `BriefGenerationPanel`       | `POST /api/ai/briefs/generate` (SSE)        | `brief-generator` → `llmRouter` → AnythingLLM (non-streaming chunk) | `ai_briefs`                           | Only if `engagement_dossier_id` is set (currently **not** set by generator) |
| **B — Engagement manual compose** | `EngagementBriefsSection` → Generate dialog | Edge `POST /engagement-briefs/:id/generate` | None (deterministic template)                                       | `briefs` with `engagement_dossier_id` | Yes (via `engagement_briefs` view)                                          |

Path A is the real AnythingLLM integration. Path B is labeled with Sparkles / “Generate brief” copy but **never calls AnythingLLM**. Several data-contract and error-handling defects cause silent failures, empty context, English error text in Arabic mode, and a non-functional View control on engagement brief cards.

---

## Workflow trace

### Path A — AI brief (AnythingLLM via Express)

```
BriefsPage (select dossier)
  → BriefGenerationPanel
  → useGenerateBrief (frontend/src/domains/ai/hooks/useGenerateBrief.ts)
  → ai.repository generateBrief → POST /api/ai/briefs/generate (Accept: text/event-stream)
  → backend/src/api/ai/briefs.ts (SSE loop)
  → briefGeneratorAgent.generateStream (backend/src/ai/agents/brief-generator.ts)
      → briefContextService.gatherContext (backend/src/services/brief.service.ts)
      → llmRouter.streamChat → AnythingLLM chat (single content chunk, backend/src/ai/llm-router.ts:558-571)
      → insert/update ai_briefs
  → SSE: init → content → done { briefId }
  → getBrief → GET /api/ai/briefs/:id
  → BriefViewer
```

### Path B — Engagement brief (manual compose via Edge)

```
EngagementDetailPage → EngagementBriefsSection
  → useGenerateEngagementBrief
  → engagements.repository generateEngagementBrief
  → supabase/functions/engagement-briefs/index.ts POST .../generate
      → RPC get_engagement_brief_context
      → buildManualBrief (no LLM)
      → INSERT briefs (engagement_dossier_id set)
  → RPC get_engagement_briefs → engagement_briefs VIEW
```

### Legacy / unused

- `supabase/functions/dossiers-briefs-generate/index.ts` — not referenced from `frontend/`; inserts obsolete columns (`dossier_id`, `content_en`, `content_ar`) against current `briefs` schema (`content` JSON).
- `backend/src/api/ai.ts` legacy `POST/GET /briefs` handlers — mounted **after** `router.use('/briefs', briefsRouter)` and are unreachable for overlapping routes.

---

## Findings

### CRITICAL

#### 1. SSE `error` events swallowed by parse-error handler

**File:** `frontend/src/domains/ai/hooks/useGenerateBrief.ts` (lines 75–103)

The inner `try/catch` wraps JSON parsing **and** the explicit `throw new Error(...)` for `data.type === 'error'`. When the backend emits `{ type: 'error', ... }` (e.g. AnythingLLM failure from `brief-generator.ts:241`, or `briefs.ts:197`), the thrown error is caught by `catch (_parseError)` and ignored. The stream ends with `isGenerating === false`, no `error` state, and phase returns to idle — the user sees streaming stop with no message.

**Recommended fix:** Use a nested try/catch: parse JSON in an inner block; handle `data.type === 'error'` **outside** the parse-only catch, or rethrow if the caught value is an `Error` with a known generation code.

---

### HIGH

#### 2. AI error i18n keys never resolve (Arabic shows English fallbacks)

**File:** `frontend/src/utils/ai-errors.ts` (lines 147–247); consumed in `frontend/src/components/ai/BriefGenerationPanel.tsx` (lines 52, 88)

`BriefGenerationPanel` passes `t` from namespace `ai-brief`, where messages live under `errors.*` (see `frontend/src/i18n/en/ai-brief.json` and `ar/ai-brief.json`). `formatAIError` / `getErrorMessage` call `t('ai.errors.title', ...)`, `t('ai.errors.timeout', ...)`, etc. Those paths do not exist in the bundle (`errors.title` exists, not `ai.errors.title`). i18next returns the **English default strings** embedded in `ai-errors.ts`, so Arabic users see English error copy.

**Recommended fix:** Change keys to `errors.title`, `errors.timeout`, … (no `ai.` prefix), or nest translations under `ai.errors` in both locale files. Align `getErrorAction` keys similarly (`retryAfter`, `retryNow`, etc. are also missing from locale files).

---

#### 3. Express AI briefs never set `engagement_dossier_id`

**File:** `backend/src/ai/agents/brief-generator.ts` (lines 409–424)

`createBriefRecord` inserts `engagement_id` and `dossier_id` but **not** `engagement_dossier_id`. The `engagement_briefs` view (`supabase/migrations/20260110100001_engagement_brief_linking.sql`, lines 75–101) only includes `ai_briefs` rows where `engagement_dossier_id IS NOT NULL`. AI briefs generated via Path A therefore **never appear** on the engagement Briefs tab unless manually linked later.

**Recommended fix:** When `engagementId` is present, set `engagement_dossier_id: request.engagementId` (IDs in the app are `engagement_dossiers.id`). Optionally stop writing legacy `engagement_id` or map it only when it truly references the legacy table.

---

#### 4. Brief context loads engagements from the wrong table

**File:** `backend/src/services/brief.service.ts` (lines 656–679)

`BriefContextService.getEngagement()` queries `from('engagements')`. Application engagement routes and the edge function use **`engagement_dossiers`** (joined to `dossiers`). Passing an engagement dossier UUID as `engagement_id` to `POST /api/ai/briefs/generate` yields empty engagement context; the LLM prompt lacks engagement metadata (`brief-generator.ts` buildUserPrompt, lines 252–258).

**Recommended fix:** Replace the query with `engagement_dossiers` joined to `dossiers`, mirroring `get_engagement_brief_context` in `supabase/migrations/20260530121000_fix_get_engagement_brief_context_positions.sql`.

---

#### 5. Failed DB update after generation is silent; UI can show success or idle incorrectly

**File:** `backend/src/ai/agents/brief-generator.ts` (lines 436–468, 233–237)

`updateBriefRecord` logs Supabase errors but does not throw. The stream still yields `{ type: 'done' }`. The frontend may fetch a row stuck in `status: 'generating'` with empty sections, or land in idle if fetch fails (`useGenerateBrief.ts` lines 85–94). Users get no error surface.

**Recommended fix:** Throw on update failure (and emit SSE `error` with a stable `code`). Have the hook treat missing/invalid post-`done` brief as `BRIEF_FETCH_FAILED` or `GENERATION_FAILED`.

---

#### 6. Engagement “Generate brief” UI implies AI but uses manual compose only

**Files:**

- `frontend/src/components/engagements/EngagementBriefsSection.tsx` (lines 165–177, 183–189)
- `supabase/functions/engagement-briefs/index.ts` (lines 13–14, 392–395)
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` (lines 263–274, comment “Generate a new AI brief”)

The primary engagement trigger calls the edge function’s deterministic `buildManualBrief`; **AnythingLLM is never invoked**. UI still uses `Sparkles`, action key `generateWithAI`, and dialog copy referencing AI-style context counts. Path A (`BriefGenerationPanel`) is **not mounted** on `EngagementDetailPage` (only `EngagementBriefsSection` at line 786).

**Recommended fix:** Either wire `BriefGenerationPanel` with `engagementId` + fix linking fields (#3, #4), or rebrand UI/i18n to “Compose brief” and remove Sparkles/AI wording. Update repository comment to “manual brief”.

---

### MEDIUM

#### 7. Engagement brief “View” button has no handler

**File:** `frontend/src/components/engagements/EngagementBriefsSection.tsx` (lines 443–447)

`BriefCard` renders a View button with no `onClick`. Users cannot open full brief content (including `content` JSON / AI sections) from the engagement tab.

**Recommended fix:** Add navigation or modal: for `brief_type === 'ai'`, fetch `GET /api/ai/briefs/:id` and open `BriefViewer`; for legacy, parse `briefs.content` JSON (`format: markdown`, `en`/`ar`).

---

#### 8. Context RPC omits `commitments` and `recent_interactions`; frontend and manual composer expect them

**Files:**

- `supabase/migrations/20260530121000_fix_get_engagement_brief_context_positions.sql` (full function — keys end at `previous_briefs_count`)
- `frontend/src/domains/engagements/types/index.ts` (lines 150–166)
- `frontend/src/components/engagements/EngagementBriefsSection.tsx` (lines 345–361, 185–189)
- `supabase/functions/engagement-briefs/index.ts` (`buildManualBrief`, lines 591–685)

The RPC never returned these keys (original migration `20260110100001` also lacked them). The Context tab always shows **0 commitments / 0 interactions**; generate dialog counts are wrong; manual briefs omit commitment sections even when real data exists (e.g. via `aa_commitments` / work items).

**Recommended fix:** Extend `get_engagement_brief_context` to aggregate engagement-linked commitments and recent timeline/interaction events; keep frontend types in sync.

---

#### 9. `BriefsPage` legacy brief viewer drops body content

**File:** `frontend/src/pages/Briefs/BriefsPage.tsx` (lines 163–190, 253–269)

Non-AI rows map `full_content_en: raw.full_content_en`, but the `briefs` table stores body in **`content` JSON** (`frontend/src/types/database.types.ts`, `briefs.Row.content`). `openCard` builds `BriefViewer` input with `executiveSummary: summary` only — markdown body from engagement manual briefs is discarded.

**Recommended fix:** Parse `raw.content` (`{ format, en, ar }`) when building `BriefContent` or a legacy viewer model; use `summary` as fallback.

---

#### 10. SSE `done` without usable brief leaves UI in idle with no error

**File:** `frontend/src/domains/ai/hooks/useGenerateBrief.ts` (lines 85–94, 82–84)

If `done` arrives without `briefId`, or `getBrief` fails (caught as `BRIEF_FETCH_FAILED` but user may already see stream text), `BriefGenerationPanel` effect sets phase to **idle** when `!isGenerating && !brief && !error` — indistinguishable from a clean cancel.

**Recommended fix:** Treat `done` without fetchable completed brief as an error state; surface `BRIEF_FETCH_FAILED` in the panel.

---

#### 11. Backend SSE error payload lacks machine-readable `code`

**File:** `backend/src/api/ai/briefs.ts` (lines 194–198)

Catch block sends `{ type: 'error', error: 'Generation failed' }` without `code`. Hook maps to generic `GENERATION_FAILED` (#1 makes this moot until parse fix lands).

**Recommended fix:** Include `code: 'GENERATION_FAILED'` (and message) consistently on all SSE error events; mirror `checkFeatureEnabled` JSON shape where applicable.

---

#### 12. Hardcoded English empty-state in context cards

**File:** `frontend/src/components/engagements/EngagementBriefsSection.tsx` (line 498)

`ContextCard` renders `"No items"` without `t()`. Arabic mode shows English.

**Recommended fix:** Add `engagement-briefs` key (e.g. `context.noItems`) and use `t()`.

---

### LOW

#### 13. Obsolete edge function schema (`dossiers-briefs-generate`)

**File:** `supabase/functions/dossiers-briefs-generate/index.ts` (lines 298–312)

Inserts `dossier_id`, `content_en`, `content_ar` — not present on current `briefs` row type. No frontend callers found; likely fails if invoked.

**Recommended fix:** Deprecate/remove function or align insert with `content` JSON + correct FK columns.

---

#### 14. Legacy Express brief routes unreachable

**File:** `backend/src/api/ai.ts` (lines 109, 185–240)

`router.use('/briefs', briefsRouter)` registers first; legacy `POST /briefs`, `GET /briefs`, `GET /briefs/:id` on the parent router never run for those paths. Dead code / confused API surface.

**Recommended fix:** Remove legacy handlers or mount under a different prefix (e.g. `/briefs-legacy`).

---

## RTL / i18n sweep (briefing UI)

- **RTL:** No `ml-*` / `mr-*` / `pl-*` / `pr-*` / physical `left-*` / `right-*` violations found in `frontend/src/components/ai/` or `EngagementBriefsSection.tsx`. Chevron flip uses `rotate-180` when `isRTL`.
- **i18n gaps:** Besides #2 and #12, `ai-errors.ts` references action keys (`retryAfter`, `retryNow`, `contactAdmin`, `loginAgain`, `shortenInput`) absent from `ai-brief.json` — English fallbacks always used.

---

## Verified non-issues (do not treat as bugs)

- `engagement_briefs` is a **VIEW** unioning `briefs` + `ai_briefs` on `engagement_dossier_id` — by design.
- Manual brief body in `briefs` uses **`content` JSON** (edge function sets `{ format: 'markdown', en, ar }`) — not `content_en`/`content_ar` columns.
- `get_engagement_briefs` varchar/text **42804** cast fix is present (`supabase/migrations/20260530120500_fix_get_engagement_briefs_text_cast.sql`).
- `BriefGenerationPanel` manual submit intentionally not persisted (notice + `.planning` follow-up) — not a regression.
- Positions fix migration intentionally sets `stance` / `position_type` to NULL where columns do not exist — not a frontend bug.
- AnythingLLM “streaming” is implemented as one non-streaming chat response (`llm-router.ts:558-571`) — UX limitation, not a contract break.

---

## Recommended priority order

1. Fix SSE error swallowing (#1) — unblocks all failure visibility.
2. Fix i18n key prefix (#2) — Arabic error UX.
3. Set `engagement_dossier_id` + correct engagement context query (#3, #4) — links AI briefs to engagements.
4. Wire engagement View + content parsing (#7, #9).
5. Extend context RPC for commitments/interactions (#8).
6. Decide product direction for engagement generate (#6): real AI vs honest manual labeling.

---

_Inspection performed against repository state on 2026-06-09. Dev stack referenced: frontend :5173, backend :5001, Supabase project `zkrcjzdemdmwhearhfgg`._
