# Implementation Plan: AI Brief Generation & Intelligence Layer

**Branch**: `033-ai-brief-generation` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-ai-brief-generation/spec.md`

## Summary

Implement AI infrastructure (LLM Router, BGE-M3 embeddings) and AI-assisted brief generation for engagements. The system provides RAG-based brief generation, an AI chat dock for interactive assistance, entity linking suggestions for intake tickets, and full observability for cost/usage tracking.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19
**Primary Dependencies**: @mastra/core (agents), @xenova/transformers (BGE-M3), TanStack Router/Query v5, Supabase JS v2, i18next
**Storage**: PostgreSQL 15+ (Supabase) with pgvector extension, Redis 7.x for caching
**Testing**: Vitest (unit), Playwright (E2E), React Testing Library
**Target Platform**: Web (Vite + React), Mobile (future via WebSocket)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Brief generation <60s, chat response <5s (simple) / <10s (with tools), 50 concurrent users
**Constraints**: p95 latency <5s for concurrent requests, private LLM routing for secret data
**Scale/Scope**: ~100 users, 2,000 briefs/month, 30,000 chat messages/month

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                 | Status  | Notes                                                |
| ------------------------- | ------- | ---------------------------------------------------- |
| §1 Bilingual Excellence   | ✅ PASS | FR-026 RTL support, i18n files for AR/EN             |
| §2 Type Safety            | ✅ PASS | TypeScript strict mode, typed SDKs                   |
| §3 Security-First         | ✅ PASS | RLS on all tables, rate limiting, input validation   |
| §4 Data Sovereignty       | ✅ PASS | **Exception 2 approved** - Cloud LLM with safeguards |
| §5 Resilient Architecture | ✅ PASS | Error boundaries, timeout handling, fallbacks        |
| §6 Accessibility          | ✅ PASS | 44x44px touch targets, WCAG AA compliance            |
| §7 Container-First        | ✅ PASS | Docker infrastructure per constitution               |

**Exception 2 Safeguards** (Feature 033-ai-brief-generation):

- LLM Router MUST enforce data classification before cloud requests
- Organization admins MUST explicitly enable cloud providers
- 100% of AI runs MUST be logged in ai_runs table
- Private LLM fallback MUST be available

## Project Structure

### Documentation (this feature)

```text
specs/033-ai-brief-generation/
├── plan.md                           # This file
├── research.md                       # Phase 0 output (complete)
├── data-model.md                     # Phase 1 output (complete)
├── quickstart.md                     # Phase 1 output (complete)
├── contracts/                        # Phase 1 output (API contracts)
│   ├── ai-api.yaml                   # OpenAPI 3.1 spec for all endpoints
│   ├── error-codes.md                # Error codes and HTTP mappings
│   ├── websocket-protocol.md         # WebSocket chat protocol (mobile)
│   ├── brief-content-schema.md       # Brief JSONB content structure
│   └── caching-rate-limiting.md      # Caching and rate limiting strategy
├── checklists/                       # Validation checklists
│   └── requirements.md
└── tasks.md                          # Phase 2 output (complete)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── ai/
│   │   ├── llm-router.ts          # Centralized LLM routing
│   │   ├── embeddings-service.ts  # BGE-M3 embeddings
│   │   ├── config.ts              # AI configuration
│   │   ├── mastra-config.ts       # Mastra agent setup
│   │   └── agents/
│   │       ├── brief-generator.ts # Brief generation agent
│   │       ├── chat-assistant.ts  # Chat agent
│   │       └── intake-linker.ts   # Entity linking agent
│   ├── api/
│   │   └── ai/
│   │       ├── briefs.ts          # Brief API endpoints (SSE)
│   │       ├── chat.ts            # Chat endpoint (SSE)
│   │       ├── ws-chat.ts         # WebSocket chat
│   │       └── intake-linking.ts  # Entity linking API
│   └── services/
│       └── brief-context.service.ts
└── tests/
    └── ai/
        ├── arabic-detection.test.ts
        ├── llm-router.test.ts
        └── security-enforcement.test.ts

frontend/
├── src/
│   ├── components/
│   │   └── ai/
│   │       ├── BriefGenerationPanel.tsx
│   │       ├── BriefViewer.tsx
│   │       ├── ChatDock.tsx
│   │       ├── ChatMessage.tsx
│   │       ├── ChatInput.tsx
│   │       ├── ToolResultCard.tsx
│   │       └── EntityLinkSuggestions.tsx
│   ├── hooks/
│   │   ├── useGenerateBrief.ts
│   │   └── useAIChat.ts
│   ├── contexts/
│   │   └── ChatContext.tsx
│   └── routes/_protected/
│       └── admin/
│           ├── ai-usage.tsx
│           └── ai-settings.tsx
├── public/locales/
│   ├── en/
│   │   ├── ai-brief.json
│   │   └── ai-chat.json
│   └── ar/
│       ├── ai-brief.json
│       └── ai-chat.json
└── tests/

supabase/migrations/
├── 20251205000001_ai_enums.sql
├── 20251205000002_ai_model_pricing.sql
├── 20251205000003_organization_llm_policies.sql
├── 20251205000004_ai_observability.sql
├── 20251205000005_ai_observability_rls.sql
├── 20251205000006_ai_functions.sql
├── 20251206000001_ai_briefs.sql
├── 20251213000001_entity_link_proposals.sql
└── 20251213000002_intake_entity_links.sql
```

**Structure Decision**: Web application with backend (Express + TypeScript) and frontend (Vite + React 19). AI functionality split across dedicated service files with Mastra-based agents.

## Phase Summary

| Phase   | Focus    | Deliverables                             | Status      |
| ------- | -------- | ---------------------------------------- | ----------- |
| Phase 0 | Research | research.md                              | ✅ Complete |
| Phase 1 | Design   | data-model.md, contracts/, quickstart.md | ✅ Complete |
| Phase 2 | Tasks    | tasks.md                                 | ✅ Complete |

## Key Design Decisions

### LLM Provider Selection

- **Primary**: OpenAI GPT-4o for quality (Exception 2 approved)
- **Arabic**: Aya-101 or Jais for Arabic-optimized responses
- **Private**: vLLM/Ollama for secret data classification
- **Cost-saving**: GPT-4o-mini for chat

### Embedding Model

- **Primary**: BGE-M3 (1024 dimensions) via @xenova/transformers
- **Fallback**: OpenAI text-embedding-3-small (initial setup only)
- **Critical**: No runtime fallback - fail if BGE-M3 unavailable

### Agent Framework

- **Selected**: Mastra for TypeScript-native agent development
- **Rationale**: Built-in tools, streaming, active development

### Streaming Strategy

- **Web**: Server-Sent Events (SSE) for brief generation and chat
- **Mobile**: WebSocket for bi-directional streaming

## Complexity Tracking

> No constitution violations requiring justification beyond Exception 2 (already approved).

| Violation           | Why Needed                        | Simpler Alternative Rejected Because                        |
| ------------------- | --------------------------------- | ----------------------------------------------------------- |
| Cloud LLM providers | Frontier model quality for briefs | Private LLM alone insufficient for complex brief generation |

## Generated Artifacts

- [research.md](./research.md) - LLM providers, embedding models, agent frameworks, RAG strategy
- [data-model.md](./data-model.md) - Database schema, enums, tables, views, functions, RLS
- [quickstart.md](./quickstart.md) - Setup guide for development environment
- [tasks.md](./tasks.md) - 71 implementation tasks across 7 phases
- [contracts/ai-api.yaml](./contracts/ai-api.yaml) - OpenAPI 3.1 specification for all AI endpoints
- [contracts/error-codes.md](./contracts/error-codes.md) - Error codes, HTTP mappings, i18n messages
- [contracts/websocket-protocol.md](./contracts/websocket-protocol.md) - WebSocket chat protocol for mobile
- [contracts/brief-content-schema.md](./contracts/brief-content-schema.md) - Brief `full_content` JSONB schema
- [contracts/caching-rate-limiting.md](./contracts/caching-rate-limiting.md) - Caching strategy and rate limits

## Next Steps

Run `/speckit.implement` to begin task execution.
