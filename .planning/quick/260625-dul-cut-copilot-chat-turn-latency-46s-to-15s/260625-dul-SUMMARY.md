---
quick_id: 260625-dul
slug: cut-copilot-chat-turn-latency-46s-to-15s
date: 2026-06-25
status: complete
commits:
  - 91e8127f # perf: disable gemma4 thinking + temp 0.2
  - c94e8f50 # fix: open/active work-item status synonyms
---

# Quick Task 260625-dul — SUMMARY

## Outcome

Copilot chat-turn latency cut from **~29s (measured live) → ≤6s** with thinking suppressed,
tool-calling and grounding intact in **EN and AR**. Target was ≤15s (aim ≤12s) — beaten by a
wide margin.

## Before / after (live `/api/copilot/chat`, real staging data, real gemma4:12b)

| Turn | Before             | After (run 1) | After (run 2) | Reasoning chars | Tool-call          | Grounded               |
| ---- | ------------------ | ------------- | ------------- | --------------- | ------------------ | ---------------------- |
| EN   | **28.95s**         | 5.79s         | **5.37s**     | 4438 → **0**    | ✓ query_work_items | ✓ 5 real items         |
| AR   | (not pre-measured) | 9.25s         | **6.56s**     | n/a → **0**     | ✓ query_work_items | ✓ Arabic, 5 real items |

`RUN_FINISHED` present, no `RUN_ERROR`, on every after-run. Both languages ≤12s.

## What changed (2 atomic commits)

1. **`91e8127f` perf — `agent-runtime/src/mastra/agents/copilot.ts`**
   Bind the copilot model via the documented `ModelWithRetries[]` fallback-array form so
   per-model `modelSettings` + `providerOptions` actually reach the `/v1/chat/completions`
   body:
   - `modelSettings: { temperature: 0.2 }`
   - `providerOptions: { 'openai-compatible': { reasoningEffort: 'none' } }` → body
     `reasoning_effort: "none"`, which suppresses gemma4's chain-of-thought.

2. **`c94e8f50` fix — `agent-runtime/src/mastra/tools/dossier-lookups.ts` (+ test mock)**
   `query_work_items` exact-matched `status` verbatim. With thinking on, the model
   over-reasoned the filter to `null` and got everything; with thinking off it passed the
   literal `"open"` (the system prompt says "open commitments") — but `"open"` is not a stored
   status (real values: pending, overdue, …), so it matched zero rows → ungrounded
   "could not find anything". Map vague active synonyms (open/active/outstanding/ongoing) to
   `status NOT IN (completed,cancelled,…)`; a real stored status still exact-matches.

## Why this wiring (determined EMPIRICALLY, not guessed)

- **Param:** probed live Ollama `/v1/chat/completions`. `reasoning_effort:"none"` zeroed
  reasoning (594→0 chars, 21 completion tokens, 0.78s) while the tool-call still fired.
  `reasoning_effort:"low"`, `chat_template_kwargs:{enable_thinking:false}`, and `think:false`
  all FAILED to suppress on the `/v1` path. `reasoning_effort` is OpenAI-standard.
- **Plumbing:** read `@mastra/core` 1.43.0 source. The bundled `@ai-sdk/openai-compatible`
  `getArgs` maps the standardized `temperature` and `providerOptions['openai-compatible'].reasoningEffort`
  → `reasoning_effort` (literal key always parsed). The `@ag-ui/mastra` bridge calls
  `agent.stream(messages,{runId})` with no model opts. Agent-level config `modelSettings`/
  `providerOptions` are **NOT** merged into that path (proven: captured request body had
  neither param). The `ModelWithRetries[]` fallback-array form **is** — proven via a minimal
  agent invoked exactly like the bridge (both model calls carried `temperature=0.2` +
  `reasoning_effort="none"`).

## Prod (vLLM) equivalence — documented in code

`reasoning_effort:"none"` is an OpenAI-standard chat-completions field honored identically by
Ollama (Mac dev) and vLLM (prod GPU host) on the `/v1` path, so the same binding is correct
for the prod gemma-4-12b deployment — no prod-specific override. (Code comment in copilot.ts.)

## Notes on the optional safety cap

The brief's optional `maxTokens`/`num_predict` cap was **omitted**: `maxTokens` did not map to
`max_tokens` in this Mastra version, and it is moot — `reasoning_effort:"none"` already drives
completion tokens to ~21 on the tool turn. Shipping a silently-ignored field would be a no-op,
so per KISS it was left out.

## Verification

`tsc --noEmit` = 0, eslint (changed files) = 0, `tools.test.ts` 40/40 pass. Rebuilt the
`agent-runtime` container (runs built `dist`) twice and verified the live `/api/copilot/chat`
SSE stream for `x-language: en` and `ar` (timings above).

## Execution note

Run inline by the orchestrator rather than a worktree `gsd-executor`: this was a pair of
single-file, empirically-locked edits gated on a Docker rebuild + live EN/AR `/chat`
verification only the orchestrator can run. All GSD guarantees delivered (plan artifact,
atomic commits, STATE tracking, this summary).
