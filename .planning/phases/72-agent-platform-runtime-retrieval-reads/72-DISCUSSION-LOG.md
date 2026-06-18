# Phase 72: Agent Platform — Runtime, Retrieval, Reads - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 72-Agent Platform — Runtime, Retrieval, Reads
**Areas discussed:** Serving target & brain, The copilot's home, What it can read, Memory/shell/authz

---

## Serving target & brain

### GPU reality → brain

| Option                  | Description                                       | Selected |
| ----------------------- | ------------------------------------------------- | -------- |
| Single 16–24GB GPU      | Gemma 4 12B (QAT/FP8) on vLLM — spec lock holds   | ✓        |
| Single 48–80GB GPU      | Reopens Fanar-2-27B / Qwen3.5-32B as brain        |          |
| No GPU yet / CPU box    | Ship llama.cpp/Ollama as v1 production            |          |
| Unknown — confirm later | Plan Gemma+vLLM, Ollama dev, GPU as pre-exec gate |          |

**User's choice:** Single 16–24GB GPU → **Gemma 4 12B on vLLM**, eval-gated + swappable.

### ALLaM optics

| Option                          | Description                                                   | Selected |
| ------------------------------- | ------------------------------------------------------------- | -------- |
| Best-Arabic-on-prem sufficient  | Gemma brain, ALLaM not wired, eval harness = Arabic guarantee | ✓        |
| Wire ALLaM as offered secondary | ALLaM-7B optional secondary for short Arabic tasks            |          |
| ALLaM is a hard requirement     | National model gets a named visible role                      |          |

**User's choice:** **Best-Arabic-on-prem sufficient** — ALLaM NOT wired in v1.

### Spike form

| Option                        | Description                                                        | Selected |
| ----------------------------- | ------------------------------------------------------------------ | -------- |
| Throwaway slice, then rebuild | AI-SDK+Ollama proves AG-UI loop, then rebuild on Mastra+vLLM       | ✓        |
| Graduate in place on Mastra   | Build the slice on Mastra from the start (Ollama→vLLM config swap) |          |
| You decide                    | Researcher/planner pick                                            |          |

**User's choice:** **Throwaway slice, then rebuild** (Option-C spike is itself a locked spec decision).

---

## The copilot's home

### Surface placement

| Option                     | Description                                               | Selected      |
| -------------------------- | --------------------------------------------------------- | ------------- |
| Persistent app-wide drawer | Desktop slide-over + mobile sheet; Cmd+K/FAB second entry | ✓ (via Other) |
| Repurpose word-assistant   | Repoint /word-assistant to Mastra/AG-UI                   |               |
| Dedicated /copilot route   | New full-page surface                                     |               |
| You decide                 | UI-spec settles it                                        |               |

**User's choice:** **Other** → "based on usability + friendliness in both web and mobile." Reflected back and confirmed as the **responsive app-wide drawer** (desktop right-side slide-over mirroring the 720px dossier drawer; mobile full-screen/bottom sheet mirroring `RelationshipSidebar → BottomSheet`; Cmd+K desktop / topbar-FAB mobile). `word-assistant` left untouched.
**Notes:** Reads-only P72 aligns with the read-only mobile surface; single component, one data path, only container chrome differs per breakpoint.

### Context-awareness

| Option              | Description                                                         | Selected |
| ------------------- | ------------------------------------------------------------------- | -------- |
| Context-aware in v1 | Opening on a dossier passes it as readable context; Cmd+K pre-fills | ✓        |
| Global only in v1   | General copilot, no page context                                    |          |
| You decide          | UI-spec picks depth                                                 |          |

**User's choice:** **Context-aware in v1.**

---

## What it can read

### Re-embed corpus

| Option                 | Description                                           | Selected |
| ---------------------- | ----------------------------------------------------- | -------- |
| Core intelligence text | Dossiers + signals + briefs/after-actions + positions |          |
| Core + documents/OCR   | Above + uploaded documents/attachments (OCR'd)        | ✓        |
| Dossiers only          | Minimal v1                                            |          |
| You decide             | Researcher inventories + sizes                        |          |

**User's choice:** **Core + documents/OCR** — the richest corpus.
**Notes:** OCR-text availability + re-embed sizing flagged as a research item (RF-2).

### Read-tool roster

| Option                       | Description                                                                    | Selected |
| ---------------------------- | ------------------------------------------------------------------------------ | -------- |
| Reads + RAG, digest deferred | hybrid-RAG + read_signals + query_graph + dossier reads; generate_digest → P73 |          |
| Wrap all three + RAG         | Above + generate_digest PREVIEW-only (publish stays P73)                       | ✓        |
| You decide                   | Planner finalizes                                                              |          |

**User's choice:** **Wrap all three + RAG** — generate_digest preview-only, publish stays P73.

---

## Memory, shell & authz

### Conversation persistence

| Option                   | Description                                                    | Selected |
| ------------------------ | -------------------------------------------------------------- | -------- |
| Persistent, user-private | Mastra threads via @mastra/pg; RLS own-threads-only; resumable | ✓        |
| Ephemeral per-session    | No stored history; Langfuse traces only                        |          |
| You decide               | Planner picks vs schema/RLS cost                               |          |

**User's choice:** **Persistent, user-private threads.**

### Chat-shell lean

| Option                  | Description                                                 | Selected |
| ----------------------- | ----------------------------------------------------------- | -------- |
| Lean pure headless      | assistant-ui / @ag-ui/client; CopilotKit runtime/hooks only |          |
| Lean CopilotKit chrome  | CopilotKit built-ins restyled via CSS vars                  |          |
| No lean — spike decides | Fully empirical                                             |          |

**User's choice:** **Other** → "master CopilotKit." Reflected back and confirmed as **CopilotKit-first**: adopt runtime + hooks + generative-UI + HITL + render the shell via CopilotKit theming; the spike MUST prove (1) RTL/token/Tajawal fidelity to the CLAUDE.md bar and (2) full air-gap (self-hosted `@copilotkit/runtime`, no Cloud key/egress); documented fallback = headless `assistant-ui`/`@ag-ui/client`.
**Notes:** User added a standing directive — "look for open-source alternatives to make the app more functional and easy to use." Captured as the **OSS-survey mandate** (D-11) with on-prem/permissive-license/token-RTL guardrails.

### supabaseAdmin retirement breadth

| Option           | Description                                           | Selected |
| ---------------- | ----------------------------------------------------- | -------- |
| Fold + audit now | P72 also audits brief-generator.ts + intake-linker.ts | ✓        |
| Keep separate    | Only chat-assistant.ts; others stay a follow-up       |          |
| You decide       | Researcher classifies, planner folds interactive ones |          |

**User's choice:** **Fold + audit now** — folds the `p68-followup-supabaseadmin-background-agents.md` todo.

---

## Claude's Discretion

- Spike build form (researcher may confirm throwaway vs graduate-in-place).
- vLLM concurrency targets, FP8/AWQ quantization, eval-challenger bench (Qwen3.5/Fanar-2).
- Chunking strategy, top-k after rerank, RRF `k`, iterative-scan tuning, coalescing.
- agent-runtime port number + turbo/docker wiring specifics.
- Generative-UI depth (P72 = answers + citations token-bound; rich inline cards are P73).

## Deferred Ideas

- Writes + HITL confirmation cards + generative-UI dossier cards → Phase 73.
- `generate_digest` publish path → Phase 73.
- Bilingual eval CI gate + full AnythingLLM decommission → Phase 74.
- ALLaM/SDAIA secondary → only if it becomes a procurement requirement.
- Larger Arabic brain (Fanar-2-27B / Qwen3.5-32B) → gated on a bigger GPU (config swap).
- Multi-GPU scale-out, external feed ingestion + quarantine → v7.1.
- Repurposing `word-assistant` into the copilot → future.
