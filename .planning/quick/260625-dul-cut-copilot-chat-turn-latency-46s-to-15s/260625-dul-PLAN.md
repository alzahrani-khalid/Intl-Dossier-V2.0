---
quick_id: 260625-dul
slug: cut-copilot-chat-turn-latency-46s-to-15s
date: 2026-06-25
status: ready
---

# Quick Task 260625-dul: Cut copilot chat turn latency (~46s → ≤15s)

## Problem

A copilot chat turn takes ~46s. Root cause (already proven, per brief): the on-prem
`gemma4:12b` is a _thinking_ model (capability `thinking`, Modelfile `temperature 1`).
`agent-runtime` binds it as a bare `{ id, url, apiKey }` OpenAI-compatible model with **no
generation options**, so every turn runs at temp=1 with full chain-of-thought (~1,800
reasoning tokens before a ~50-token answer). Raw model speed is fine (~53 tok/s); the
reasoning _volume_ is the cost.

## Empirical findings (proven against the LIVE endpoint before wiring)

Probed `http://127.0.0.1:11434/v1/chat/completions` (= `VLLM_BASE_URL` on Mac), model
`gemma4:12b`, with the `query_work_items` tool roster:

| Candidate                                       | reasoning                    | tool-call | verdict                                   |
| ----------------------------------------------- | ---------------------------- | --------- | ----------------------------------------- |
| baseline (no opts)                              | 594 chars / 169 tok          | ✓ fires   | slow                                      |
| `temperature: 0.2`                              | 394 chars                    | ✓         | not enough                                |
| `reasoning_effort: "none"` (+temp 0.2)          | **0 chars / 21 tok / 0.78s** | ✓ fires   | **WINNER**                                |
| `reasoning_effort: "low"`                       | 408 chars                    | ✓         | not suppressed                            |
| `chat_template_kwargs: {enable_thinking:false}` | 349 chars                    | ✓         | Ollama ignores on `/v1`                   |
| `think: false`                                  | 412 chars                    | ✓         | native `/api/chat` only, ignored on `/v1` |

`reasoning_effort: "none"` is an **OpenAI-standard** chat-completions field honored by both
Ollama (Mac dev) **and** vLLM (prod GPU host) — server-agnostic. Second turn (post-tool
answer) also stayed at 0 reasoning and produced a grounded answer in **EN and AR**.

### Mastra integration (read from installed `@mastra/core` 1.43.0, not guessed)

- The bundled `@ai-sdk/openai-compatible` chat model `getArgs` maps the standardized
  `temperature` call option → body `temperature`, and `providerOptions['openai-compatible'].reasoningEffort`
  → body `reasoning_effort` (the literal `"openai-compatible"` key is always parsed,
  independent of the model's provider name).
- The `@ag-ui/mastra` bridge calls `agent.stream(messages, { runId, ... })` and passes **no**
  model options. Agent **config-level** `modelSettings`/`providerOptions` are **NOT** merged
  into that `.stream()` path (proven: body had neither param). The **documented**
  `ModelWithRetries[]` fallback-array form on the agent's `model` **does** bind per-model
  `modelSettings` + `providerOptions` and reaches the wire.
- Proven via a minimal Agent invoked exactly like the bridge: fallback-array form →
  `temperature=0.2` + `reasoning_effort="none"` on BOTH model calls, reasoning 0 chars,
  tool-call intact, full 2-turn cycle 2.24s.
- `maxTokens` did not map to `max_tokens` in this version and is **moot** (reasoning is
  already 0 tokens), so the optional safety cap is omitted (KISS — don't ship a no-op field).

## Task

**File:** `agent-runtime/src/mastra/agents/copilot.ts`

Change the copilot agent's `model` from the bare single-model binding:

```ts
model: () => getCopilotModel(),
```

to the documented fallback-array form carrying the proven generation policy:

```ts
model: () => [
  {
    model: getCopilotModel(),
    modelSettings: { temperature: 0.2 },
    providerOptions: { 'openai-compatible': { reasoningEffort: 'none' } },
  },
],
```

- `getCopilotModel()` stays the pure endpoint/model binding in `llm-router.ts` (its job);
  the generation/latency policy lives with the agent.
- A code comment must document the **prod (vLLM/gemma-4-12b) equivalence**: `reasoning_effort`
  is OpenAI-standard and honored identically by vLLM, so the same binding is correct on the
  GPU host.

**verify:** rebuild the `agent-runtime` container (it runs built `dist`, not tsx), then hit
the live `/api/copilot/chat` for `x-language: en` AND `ar`.

**done:** EN + AR turns ≤15s (aim ≤12s) with `TOOL_CALL_*` for `query_work_items` firing,
near-zero `REASONING_MESSAGE_CONTENT`, grounded `TEXT_MESSAGE_CHUNK`, `RUN_FINISHED`, no
`RUN_ERROR`.

## Verification protocol

```bash
docker compose -p intl-dossier --env-file deploy/.env \
  -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml build agent-runtime
docker compose -p intl-dossier --env-file deploy/.env \
  -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d --no-deps agent-runtime
# JWT from .env.test, POST http://localhost/api/copilot/chat with x-language en then ar,
# parse SSE for TOTAL, TOOL_CALL_*, REASONING_MESSAGE_CONTENT, TEXT_MESSAGE_CHUNK, RUN_FINISHED.
```

## Notes

Executed inline by the orchestrator (not a worktree gsd-executor): the change is a single
empirically-locked edit gated on a Docker rebuild + live EN/AR `/chat` verification that only
the orchestrator can run. All GSD guarantees (plan artifact, atomic commit, STATE tracking,
SUMMARY) are delivered.
