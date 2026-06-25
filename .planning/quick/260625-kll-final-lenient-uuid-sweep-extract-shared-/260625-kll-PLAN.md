---
quick_id: 260625-kll
slug: final-lenient-uuid-sweep-extract-shared-
date: 2026-06-25
status: ready
---

# Quick Task 260625-kll: FINAL lenient-UUID sweep + shared helper (end the round-by-round)

## Root cause (recap)

Staging seed ids (e.g. `b0000001-0000-0000-0000-000000000003`) are NOT RFC-4122 (zero
version/variant nibbles), so strict Zod `.uuid()` rejects ids the model correctly takes from
lookups → "Invalid UUID" on legitimate ids. Rounds 2 + 4 made propose_work_item + the 3 propose
tools lenient via a shape regex; round 3 made get_dossier resolve names. This finishes the rest
in ONE pass and DRYs the inline copies. NO reseed (seed ids referenced across the codebase).

## Enumeration (grep `.uuid()` over agent-runtime/src/mastra/tools)

Remaining STRICT `.uuid()` on id args:

- `read-signals.ts` — `dossierId` (optional filter)
- `generate-digest.ts` — `dossierId` (required)
- `query-graph.ts` — `entityId` (required) + `entityId2` (optional, shortest_path)
  Inline `UUID_RE` copies to DRY: propose-work-item.ts, dossier-lookups.ts, propose-brief.ts,
  propose-publish-digest.ts, propose-signal-status.ts.

## Tasks

### Task 1 — shared helper

NEW `agent-runtime/src/mastra/tools/_uuid.ts` exporting `uuidShape`
(`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) and trim-tolerant
`isUuidShape(value): boolean`. Doc: accepts non-RFC-4122 seed ids; still rejects
names/placeholders/garbage (T-73-02-02 holds); only RFC version/variant strictness dropped.

### Task 2 — DRY the 5 inline copies

Replace each local `UUID_RE` const (+ its comment) with `import { isUuidShape } from './_uuid.js'`
and swap `UUID_RE.test(x)` → `isUuidShape(x)`. Behavior identical. Files: propose-work-item.ts,
dossier-lookups.ts, propose-brief.ts, propose-publish-digest.ts, propose-signal-status.ts.

### Task 3 — loosen the 3 remaining strict tools

- `generate-digest.ts`: `dossierId` → `z.string()`; execute() trims + `isUuidShape` gate → not
  shaped returns neutral `{ digest: EMPTY }` BEFORE building the client; else use trimmed id.
- `query-graph.ts`: `entityId` → `z.string()` (not shaped → neutral `{ result: EMPTY_GRAPH }`
  before client); `entityId2` → `z.string().optional()` (not shaped → null, omit). Use trimmed.
- `read-signals.ts`: `dossierId` → `z.string().optional()` (drop `.uuid()`); execute() passes the
  trimmed id only when `isUuidShape`, else null (a non-shaped optional filter is ignored, not an
  error — RPC clearance still enforced, so an unscoped read is safe).

### Task 4 — tests

`tools.test.ts`: add `_uuid.ts` to the service-role source-guard list; add coverage —
generate_digest_preview + query_graph: a seed-shape id is ACCEPTED (builds the client / reaches
the RPC), a NAME is REJECTED to the neutral empty WITHOUT building a client; read_signals: a name
dossierId no longer Zod-fails and the RPC gets `p_dossier_id: null` while a seed id is passed
through. Existing VALID_UUID/keystone/empty + round-2/4 cases stay green.

## Scope guard

Touch ONLY the agent-runtime tool files above + tools.test.ts. NO frontend. NO reseed.
git-add by explicit path (never -A).

## Verification

- STATIC: `pnpm --filter agent-runtime type-check` + `test`.
- LIVE: rebuild + recreate agent-runtime; POST `/api/copilot/chat` (Bearer JWT from `.env.test`,
  x-language en) the two previously-failing flows; CONFIRM NO "Invalid UUID"/"validation failed"
  and RUN_FINISHED:
  - "Publish a weekly digest for the G20 Data Gaps Initiative dossier." (generate_digest_preview)
  - "Show the relationship network for the G20 Data Gaps Initiative dossier." (query_graph)
    Report files/args changed, the shared helper, commit hash, and live results.

## must_haves

- truths:
  - "a single shared \_uuid helper backs every tool's UUID-shape check (no inline copies remain)"
  - "generate_digest_preview + query_graph accept a non-RFC-4122 seed id (no Invalid UUID)"
  - "a name/placeholder id still yields the neutral empty (T-73-02-02 holds), no client built"
  - "read_signals tolerates a non-UUID dossierId (filter ignored), never Zod-fails"
- key_links:
  - agent-runtime/src/mastra/tools/\_uuid.ts
  - agent-runtime/src/mastra/tools/generate-digest.ts
  - agent-runtime/src/mastra/tools/query-graph.ts
  - agent-runtime/src/mastra/tools/read-signals.ts
  - agent-runtime/src/mastra/tools/tools.test.ts
