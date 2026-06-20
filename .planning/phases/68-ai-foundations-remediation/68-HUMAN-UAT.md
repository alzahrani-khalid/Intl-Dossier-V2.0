---
status: partial
phase: 68-ai-foundations-remediation
source: [68-08-SUMMARY.md]
started: 2026-06-14
updated: 2026-06-14
---

## Current Test

[awaiting human testing — full-stack EN+AR UI + live Phoenix trace]

> Context: the clearance block itself is already PROVEN deterministically at the
> RLS/RPC layer on staging (level-1 → 0 above-clearance rows via both the gated
> semantic RPC and dossiers RLS; level-3 → visible). These items are full-stack
> UI + observability confirmations, not the core security proof.

## Tests

### 1. Semantic search clearance block in the UI (EN + AR)

expected: Signed in as a properly-org'd LEVEL-1 user, searching the name of a
`sensitivity_level=2` dossier returns ZERO results for that dossier, in both
English and Arabic (ع). Other level-1 dossiers may appear.
prereq: a level-1 account WITH an organization (the current level-1 seed accounts
have no org → app renders brokenly); a seeded `ai_embeddings` row for the
above-clearance dossier (table is currently empty, so semantic is vacuous until
content is re-embedded — Phase 72).
result: [pending]

### 2. Assistant clearance block — indistinguishable empty (EN + AR)

expected: As the same level-1 user, ask the assistant "Tell me about <the
above-clearance dossier>". It returns a generic "no information available"
response (NOT "access denied" / NOT "filtered by clearance" / NOT an error), in
EN and AR. (The assistant's tools read `dossiers` under the caller JWT, which RLS
already blocks — proven; this confirms the UI/LLM wording.)
prereq: local/staging assistant LLM configured (AnythingLLM or OpenAI).
result: [pending]

### 3. Observability — one traced AI request, zero egress (REMED-05)

expected: After deploying the observability containers on the droplet
(138.197.195.242): set `LANGFUSE_DATABASE_URL`/`LANGFUSE_SECRET`/`LANGFUSE_SALT`/
`OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:4317` in `/opt/intl-dossier/.env`,
`docker compose -f deploy/docker-compose.prod.yml up -d phoenix langfuse`, rebuild
the backend, send one chat request, SSH-tunnel `6006`, and confirm a trace
(prompt→model→response) appears in Phoenix. Confirm no external egress:
`docker logs intl-dossier-phoenix 2>&1 | grep -i 'https://'` shows nothing external.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
