---
quick_id: 260626-fdj
slug: enable-persistent-copilot-conversation-m
date: 2026-06-26
status: complete
---

# Quick Task 260626-fdj — SUMMARY

Persistent copilot conversation memory is now live on the Mac stack. Verified e2e,
including the cross-restart recall test.

## Files changed

- `deploy/docker-compose.mac.yml` — added `mastra-pg` (`postgres:16-alpine`,
  internal-only, named volume `mastra_pg_data`, `POSTGRES_DB=postgres`, local password
  via `${MASTRA_LOCAL_PG_PASSWORD:-mastra_local_dev}`, `pg_isready` healthcheck on the
  inherited `intl-dossier` network); overrode `agent-runtime` to add
  `MASTRA_PG_URL=postgresql://postgres:…@mastra-pg:5432/postgres` +
  `depends_on: mastra-pg: { condition: service_healthy }`; added top-level
  `volumes: mastra_pg_data`.

**No source code changed** — see the threadId finding.

## threadId-wiring finding / fix

**Finding: the threadId was already correctly plumbed — no fix required.**

Traced the installed `@ag-ui/mastra@1.0.3`: `MastraAgent.getLocalAgent(...).run(input)`
→ `streamMastraAgent(input)` calls
`agent.stream(messages, { memory: { thread: input.threadId, resource: this.resourceId ?? threadId } })`.
`this.resourceId` is the JWT-derived `sub` set in `index.ts` (`deriveResourceId`,
never client-trusted — D-08). `@mastra/core` default `lastMessages: 10` means
message-history recall is on by default.

So the AG-UI `RunAgentInput.threadId` AND the JWT resourceId already flow into Mastra
memory. The path had simply never been exercised because `buildMemory()` returned
`undefined` (empty `MASTRA_PG_URL`). Setting the env + standing up a Postgres was the
entire fix. **Proof it's plumbed, not just configured:** the `mastra_threads` row is
keyed by the exact request `threadId` and owned by `resourceId = de2734cf-…` (the JWT
sub).

Note: `agent-runtime` code reads `process.env.MASTRA_PG_URL` only; prod's
`DATABASE_URL: ${MASTRA_PG_URL}` mapping does not feed `buildMemory()`. The Mac override
sets `MASTRA_PG_URL` directly (the var the code reads).

## Verify results (all 4 PASS)

1. **Tables auto-created** — `docker exec intl-dossier-mastra-pg psql -U postgres -c '\dt'`
   lists `mastra_threads` + `mastra_messages` (full Mastra schema, 34 tables, created by
   PostgresStore on first use). After turn 1: `threads=1, messages=2`; thread row
   `id=89f8897b-…` `resourceId=de2734cf-…`.
2. **Within-thread recall** — turn 1 "My favorite dossier is the G20 Data Gaps
   Initiative."; turn 2 (same threadId, **only** the question in the request) "What did I
   just say my favorite dossier was?" → "…your favorite dossier is the **G20 Data Gaps
   Initiative**…". PASS.
3. **Cross-restart recall (killer test)** — `docker restart intl-dossier-agent-runtime`,
   waited healthy (fresh process, in-process memory wiped), turn 3 (same threadId, only
   "Remind me — what's my favorite dossier?") → "Your favorite dossier is the **G20 Data
   Gaps Initiative**…". Can only have come from PG. `mastra_messages=6` (3 turns ×
   user+assistant), all under the one thread. PASS.
4. **Isolation** — turn 4 on a NEW threadId (same JWT) "What's my favorite dossier?" →
   "I do not have access to your personal preferences…" (no G20 recall). PASS.

## Static checks

- `pnpm --filter agent-runtime type-check` → clean (tsc --noEmit).
- `pnpm --filter agent-runtime test` → 49/49 passed.

## PROD follow-up (deploy-time; NOT needed for the Mac single-user case)

PROD must set `MASTRA_PG_URL` to the Supabase Postgres URL and apply owner-only RLS on
`mastra_threads` / `mastra_messages` (72-03/04/05 carry-over). Also note prod currently
wires `DATABASE_URL: ${MASTRA_PG_URL}` while the code reads `MASTRA_PG_URL` — prod will
need `MASTRA_PG_URL` set as the actual container var (same fix shape as this Mac override).
