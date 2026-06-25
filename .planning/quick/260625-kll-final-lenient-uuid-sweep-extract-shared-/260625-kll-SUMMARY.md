---
quick_id: 260625-kll
slug: final-lenient-uuid-sweep-extract-shared-
date: 2026-06-25
status: complete
commit: 2f6454ca
---

# Quick Task 260625-kll — Summary

## Goal

End the round-by-round: do the WHOLE remaining strict-`.uuid()` surface across the agent-runtime
tool roster in ONE pass, and DRY the rounds 2/4 inline shape-regex copies into a single shared
helper. Root cause: staging seed ids (e.g. `b0000001-0000-0000-0000-000000000003`) are not
RFC-4122 (zero version/variant nibbles), so strict Zod `.uuid()` rejects ids the model correctly
takes from lookups → "Invalid UUID". No DB reseed (seed ids referenced across the codebase).

## Enumeration (`grep -rn "\.uuid()" agent-runtime/src/mastra/tools`)

Strict `.uuid()` on id args remaining before this task: `read-signals.ts` dossierId (optional),
`generate-digest.ts` dossierId (required), `query-graph.ts` entityId (required) + entityId2
(optional). Inline `UUID_RE` copies: propose-work-item, dossier-lookups, propose-brief,
propose-publish-digest, propose-signal-status.

## Fix (agent-runtime only — commit 2f6454ca, 10 files)

- **NEW `_uuid.ts`** — shared `uuidShape` regex (`/^[0-9a-f]{8}-…-[0-9a-f]{12}$/i`) +
  trim-tolerant `isUuidShape(value)`. Accepts any UUID-shaped hex (so non-RFC-4122 seed ids
  pass) while still rejecting names/placeholders/garbage → T-73-02-02 narrow-Zod threat control
  holds; only the RFC version/variant strictness is dropped.
- **DRY (5 files)** — propose-work-item.ts, dossier-lookups.ts, propose-brief.ts,
  propose-publish-digest.ts, propose-signal-status.ts now `import { isUuidShape } from './_uuid.js'`
  and drop their inline `UUID_RE` consts. No remaining inline copies.
- **Loosen the 3 strict tools** — drop `.uuid()`, gate via `isUuidShape` in `execute()`:
  - `generate-digest.ts` dossierId (required): non-shaped → neutral empty digest BEFORE any
    client/RPC; seed id accepted.
  - `query-graph.ts` entityId (required): non-shaped → neutral empty graph before client;
    entityId2 (optional): only passed when shaped, else `null`.
  - `read-signals.ts` dossierId (optional filter): non-shaped → ignored (`p_dossier_id: null`),
    never a Zod failure; seed id passed through. The RPC's inline clearance still gates rows.
- **tools.test.ts** — `_uuid.ts` added to the service-role source-guard list; +4 tests (helper
  accepts seed/rejects name; generate_digest_preview + query_graph accept a seed id / reject a
  name; read_signals null-filters a name and passes a seed id through).

## Files & args changed

| File                        | Change                                         |
| --------------------------- | ---------------------------------------------- |
| `_uuid.ts` (NEW)            | shared `uuidShape` + `isUuidShape`             |
| `propose-work-item.ts`      | DRY (assigneeId, dossierIds[])                 |
| `dossier-lookups.ts`        | DRY (get_dossier resolver)                     |
| `propose-brief.ts`          | DRY (dossierId)                                |
| `propose-publish-digest.ts` | DRY (dossierId)                                |
| `propose-signal-status.ts`  | DRY (signalId)                                 |
| `generate-digest.ts`        | loosen dossierId → shape gate                  |
| `query-graph.ts`            | loosen entityId + entityId2 → shape gate       |
| `read-signals.ts`           | loosen dossierId (optional) → null-on-nonshape |
| `tools.test.ts`             | +4 tests, guard-list entry                     |

## Verification

### STATIC (all GREEN)

- `pnpm --filter agent-runtime type-check`: pass.
- `pnpm --filter agent-runtime exec vitest run src/mastra/tools/tools.test.ts`: 49/49 pass (+4).
- eslint (10 changed files): clean.

### LIVE (rebuild + recreate agent-runtime; POST /api/copilot/chat, x-language en)

Both previously-failing flows complete with **NO "Invalid UUID" / "validation failed"** (0 error
markers each), RUN_FINISHED, no RUN_ERROR:

- **Digest** ("Publish a weekly digest for the G20 Data Gaps Initiative dossier"):
  get_dossier (name→seed id) → **`generate_digest_preview({dossierId:"b0000001-…0003"})` returned
  a real digest** (previously emitted "Invalid UUID") → `propose_publish_digest` → `{proposed:true}`.
- **Network** ("Show the relationship network …"):
  get_dossier → **`query_graph` ×4** (engagement_chain; shortest_path with `entityId2` = seed id;
  forum_membership → **real `participates_in` edges**; shared_committees) — every call accepted the
  seed id with no Invalid UUID.

## Scope discipline

Touched ONLY agent-runtime tool files + tools.test.ts (10 total). Staged by explicit path (never
`-A`). No frontend, no reseed. `frontend/src/routeTree.gen.ts` left modified-but-unstaged.
The entire copilot UUID surface is now lenient + backed by one shared helper — no further rounds.
