---
quick_id: 260625-imo
slug: round-4-extend-lenient-uuid-shape-check-
date: 2026-06-25
status: complete
commit: 15ee29a4
---

# Quick Task 260625-imo — Summary

## Goal

Extend the round-2 lenient UUID-shape check to the three id-taking propose tools so they accept
the legitimate non-RFC-4122 staging seed ids (e.g. `b0000001-0000-0000-0000-000000000003`) that
strict Zod `.uuid()` rejected — the round-3 live probe showed `propose_brief` failing on the id
the model correctly took from get_dossier. No reseed (seed ids are referenced across the codebase).

## Fix (agent-runtime only — commit 15ee29a4, 4 files)

Each tool: schema `dossierId`/`signalId` loosened from `z.string().uuid()` to `z.string()`; in
`execute()` the id is trimmed + shape-checked against the same `UUID_RE` used in round 2 /
get_dossier. A UUID-shaped id (incl. non-RFC-4122 seed ids) is accepted and echoed; a
name/placeholder/garbage yields the neutral `{ proposed: false }` before any read/echo — so the
T-73-02-02 narrow-Zod threat control still holds.

- **propose-publish-digest.ts** — `dossierId` lenient; gate before echo.
- **propose-signal-status.ts** — `signalId` lenient; gate before echo.
- **propose-brief.ts** — `dossierId` lenient; gate BEFORE building the read client (a name never
  reaches the read), then uses the trimmed id for the `.eq('id', …)` read + echo.
- **tools.test.ts** — seed id accepted (publish_digest/signal_status echo it; brief reaches the
  read under the JWT); a name rejected to neutral (brief builds no client). +3 tests.

## Verification

### STATIC (all GREEN)

- `pnpm --filter agent-runtime type-check`: pass.
- `pnpm --filter agent-runtime exec vitest run src/mastra/tools/tools.test.ts`: 45/45 pass (+3).
- eslint (4 changed files): clean.

### LIVE (rebuild + recreate agent-runtime; POST /api/copilot/chat, EN + AR)

**propose_brief** ("Draft a brief for the G20 Data Gaps Initiative dossier") — EN + AR:
get_dossier resolved the name → seed id; `propose_brief({dossierId:"b0000001-…0003"})` → **NO
"Invalid UUID"** (0 error markers). Result `{proposed:false}` — the neutral comes from the brief
GENERATION step (on-prem model envelope), NOT the UUID gate; that is a separate pre-existing P74
concern, out of scope here. RUN_FINISHED, no RUN_ERROR.

**propose_publish_digest** ("Publish a weekly digest …") — EN + AR:
`propose_publish_digest({dossierId:"b0000001-…0003", period:"weekly", summary:…})` →
**`{proposed:true, action:'publish_digest', args:{dossierId, period, summary}}`** — **NO "Invalid
UUID"**, clean proposal. RUN_FINISHED, no RUN_ERROR.

Both named propose tools satisfy the success criterion: no "Invalid UUID" / "validation failed".

### NEWLY SURFACED (distinct tool, out of this task's scope)

In the digest turn the model first called **`generate_digest_preview`** (the READ tool
`generate-digest.ts`) with the seed id, which STILL uses strict `.uuid()` and emitted
`generate_digest_preview: dossierId Invalid UUID` (2×/lang). The model recovered and still
produced a valid `propose_publish_digest` proposal, so it is latency/fragility, not a blocker.
Same lenient-UUID class; `query_graph.entityId` is the other likely strict-`.uuid()` read tool.
Flagged for a follow-up decision (a round-5 one-line lenient-shape extension to those read tools),
consistent with the per-layer pattern — not silently expanded beyond the user's explicit
3-propose-tool scope.

## Scope discipline

Touched ONLY propose-brief.ts + propose-publish-digest.ts + propose-signal-status.ts +
tools.test.ts (agent-runtime). Staged by explicit path (never `-A`). No frontend, no reseed.
`frontend/src/routeTree.gen.ts` left modified-but-unstaged.
