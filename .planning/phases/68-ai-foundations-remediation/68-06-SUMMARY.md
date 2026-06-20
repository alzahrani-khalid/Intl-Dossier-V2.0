---
phase: 68-ai-foundations-remediation
plan: 06
subsystem: infra
tags: [docker, observability, opentelemetry, langfuse, phoenix, mastra]

requires:
  - phase: 68-02
    provides: canonical clearance scale (AI paths now safe to trace)
provides:
  - Langfuse + Phoenix self-hosted observability containers (zero egress)
  - OTel NodeSDK exporting AI/HTTP traces to phoenix:4317
affects: [68-08]

tech-stack:
  added:
    - '@opentelemetry/sdk-node'
    - '@opentelemetry/exporter-trace-otlp-grpc'
    - '@opentelemetry/auto-instrumentations-node'
  patterns:
    - 'Self-hosted observability: expose-only containers, OTLP gRPC over the internal Docker network'

key-files:
  created: []
  modified:
    - deploy/docker-compose.prod.yml
    - backend/src/ai/mastra-config.ts
    - deploy/.env.example

key-decisions:
  - "DEVIATION: OTel NodeSDK wrapper (plan's escape hatch) instead of a Mastra-native exporter — @mastra/core 1.36 exposes no obvious OTLP telemetry config key"
  - 'Langfuse TELEMETRY_ENABLED=false + expose-only (no ports:) to honor the zero-egress requirement'
  - 'Checkpoint accepted code-complete; live trace verification folded into the 68-08 UAT gate (user decision)'

patterns-established:
  - 'Guarded telemetry init: try/catch so an unreachable collector never blocks backend startup'

requirements-completed: [REMED-05]

duration: 30min
completed: 2026-06-14
---

# Phase 68 — Plan 06 Summary

**Self-hosted Langfuse + Phoenix observability containers (zero external egress) are defined in the prod compose, and the backend exports OTLP gRPC traces to phoenix:4317 via a guarded OpenTelemetry NodeSDK — live container/trace confirmation folded into the 68-08 gate.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-06-14
- **Tasks:** 2 auto (Task 3 checkpoint accepted code-complete)
- **Files modified:** 3 + deps

## Task Commits

1. **compose + mastra-config + .env.example + OTel deps** — `4d6c5ae9` (feat)

## Verification — VERBATIM

- `grep -c 'intl-dossier-langfuse' docker-compose.prod.yml` → **1** ✅
- `grep -c 'intl-dossier-phoenix' docker-compose.prod.yml` → **1** ✅
- No new `ports:` under langfuse/phoenix (expose-only) → **0** ✅; `- intl-dossier` refs **6 → 8** (+2) ✅
- `grep -c 'LANGFUSE_DATABASE_URL' .env.example` → **1**; `OTEL_EXPORTER_OTLP_ENDPOINT` → **1** ✅
- mastra-config.ts: `OTEL_EXPORTER_OTLP_ENDPOINT` **1**, `OTLPTraceExporter` **2**, `intl-dossier-ai` **1**, `phoenix:4317` **2** ✅
- `tsc --noEmit` → **exit 0**; `eslint mastra-config.ts` → **clean** (no floating-promise; `sdk.start()` is void) ✅

## Mastra telemetry note (plan output requirement)

`@mastra/core` installed version: **1.36.0**. Its constructor config exposed **no obvious native OTLP `telemetry`/`observability` key** (the 1.x observability API is a new AI-tracing system with a non-trivial config shape). Per the plan's documented escape hatch, used a standalone **OpenTelemetry NodeSDK** (`@opentelemetry/sdk-node` + `exporter-trace-otlp-grpc` + `auto-instrumentations-node`) which registers the global tracer and auto-instruments HTTP/Express, so a full chat request reaches Phoenix regardless of Mastra internals. Mastra construction left as `new Mastra({})`.

## Deviations from Plan

1. **NodeSDK instead of Mastra-native exporter** (above) — the plan's escape hatch.
2. **Langfuse `TELEMETRY_ENABLED=false`** added (not in plan) to satisfy the zero-egress must-have (Langfuse phones home by default).

## Checkpoint (Task 3 — blocking human-verify)

**Outcome: accepted code-complete** (user decision). The live verification — `docker compose up -d phoenix langfuse` on the droplet, set `LANGFUSE_DATABASE_URL`/`LANGFUSE_SECRET`/`LANGFUSE_SALT`/`OTEL_EXPORTER_OTLP_ENDPOINT`, send one chat, confirm a Phoenix trace, rebuild backend — is folded into the **68-08 UAT gate** as a HUMAN-UAT item. REMED-05 code is complete and zero-egress by construction; the runtime trace is the remaining manual confirmation.

## Next Phase Readiness

- REMED-05 infra + wiring committed. Wave 4 (68-05 embeddings write path) is next; the live observability check rides along with the 68-08 gate.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
