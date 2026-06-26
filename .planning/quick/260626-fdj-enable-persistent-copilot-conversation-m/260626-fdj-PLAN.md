---
quick_id: 260626-fdj
slug: enable-persistent-copilot-conversation-m
date: 2026-06-26
description: Enable persistent copilot conversation memory (Mac-local mastra-pg + threadId wiring)
---

# Quick Task 260626-fdj — Persistent copilot conversation memory (Mac-local)

## Problem

The copilot forgets across container restarts. `buildMemory()`
(`agent-runtime/src/mastra/agents/copilot.ts:95`) returns `undefined` when
`MASTRA_PG_URL` is empty → the agent runs with ephemeral (in-memory) threads.
`@mastra/pg` `PostgresStore` + `@mastra/memory` are already dependencies; the path
just needs a Postgres and the env var the code reads.

## CRUX — is the AG-UI `threadId` actually plumbed to Mastra memory?

Verified empirically against the installed `@ag-ui/mastra@1.0.3`
(`node_modules/@ag-ui/mastra/dist/mastra-*.mjs`):

- `MastraAgent.getLocalAgent({ resourceId, requestContext })` → `run(input)` →
  `streamMastraAgent(input, …)` destructures `threadId` from the `RunAgentInput` and
  calls `agent.stream(messages, { memory: { thread: input.threadId, resource: this.resourceId ?? threadId }, … })`.
- `this.resourceId` is set in `index.ts` from the **JWT-derived sub** (`deriveResourceId`),
  never client-provided (D-08 owner-only threads).
- `@mastra/core` `memoryDefaultOptions = { lastMessages: 10, semanticRecall: false }` →
  message-history recall is ON by default.

**Conclusion: the threadId (and resourceId) are ALREADY correctly wired by the
bridge. No code fix is needed in `index.ts`/`copilot.ts`.** The only missing piece
is `MASTRA_PG_URL` + a Postgres — pure infra.

## Tasks

1. `deploy/docker-compose.mac.yml` — add a `mastra-pg` service (`postgres:16-alpine`,
   internal-only, named volume `mastra_pg_data`, `POSTGRES_DB=postgres`, local
   password, `pg_isready` healthcheck) on the inherited `intl-dossier` network.
   - verify: `docker compose … config` resolves the service + URL.
   - done: service present, healthcheck defined.
2. Same file — override `agent-runtime`: add
   `MASTRA_PG_URL=postgresql://postgres:…@mastra-pg:5432/postgres` and
   `depends_on: mastra-pg: { condition: service_healthy }`.
   - verify: merged `config` shows `MASTRA_PG_URL` + merged depends_on (redis + mastra-pg).
   - done: container env has `MASTRA_PG_URL` after recreate.
3. Recreate `mastra-pg` + `agent-runtime`; e2e-verify the 4 tests (tables auto-created,
   within-thread recall, cross-restart recall, isolation).
   - verify: see SUMMARY verify results.
   - done: all 4 pass; static `type-check` + `test` green.

## must_haves

- truths: threadId+resourceId already plumbed by @ag-ui/mastra@1.0.3 (no code fix);
  buildMemory keys on MASTRA_PG_URL only (not DATABASE_URL).
- artifacts: `deploy/docker-compose.mac.yml` (mastra-pg service + agent-runtime
  MASTRA_PG_URL/depends_on + mastra_pg_data volume).
- key_links: `agent-runtime/src/mastra/agents/copilot.ts:95` (buildMemory),
  `agent-runtime/src/mastra/index.ts:90` (getLocalAgent run).

## PROD follow-up (NOT needed for Mac single-user)

PROD must set `MASTRA_PG_URL` to the Supabase Postgres URL and apply owner-only RLS on
`mastra_threads` / `mastra_messages` (72-03/04/05 carry-over) — a deploy-time follow-up.
