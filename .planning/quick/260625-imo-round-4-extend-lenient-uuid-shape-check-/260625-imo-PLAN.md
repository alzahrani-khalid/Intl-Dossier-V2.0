---
quick_id: 260625-imo
slug: round-4-extend-lenient-uuid-shape-check-
date: 2026-06-25
status: ready
---

# Quick Task 260625-imo: lenient UUID-shape check for the id-taking propose tools

## Problem (round-3 live evidence, 260625-i3t)

After the get_dossier name-resolution fix, the live "Draft a brief" probe showed `propose_brief`
rejecting the dossier id the model CORRECTLY took from get_dossier: `propose_brief: dossierId
Invalid UUID` for `b0000001-0000-0000-0000-000000000003`. That id is a staging SEED id that is not
RFC-4122 (version & variant nibbles are `0`), and `propose_brief` / `propose_publish_digest` /
`propose_signal_status` still validate with strict Zod `.uuid()`. Same lenient-UUID class as the
round-2 propose_work_item fix. NO reseed (the seed ids are referenced across the codebase).

## Fix (agent-runtime ONLY — mirror round 2)

Extend the round-2 lenient UUID-shape check (the same `UUID_RE` that accepts non-RFC-4122 hex) to
the three id-taking propose tools. The lenient regex still REJECTS names/placeholders/garbage, so
the T-73-02-02 narrow-Zod threat control holds (a non-UUID-shaped value yields the neutral
`{ proposed: false }`, never a write proposal).

### Task 1 — propose-publish-digest.ts

- add module `UUID_RE`; loosen `dossierId` to `z.string()` (drop `.uuid()`).
- execute(): after the JWT guard, trim + shape-check `dossierId`; if not UUID-shaped → return
  `{ proposed: false }`; else echo the trimmed id.

### Task 2 — propose-signal-status.ts

- add module `UUID_RE`; loosen `signalId` to `z.string()` (drop `.uuid()`).
- execute(): trim + shape-check `signalId`; not shaped → `{ proposed: false }`; else echo trimmed.

### Task 3 — propose-brief.ts

- add module `UUID_RE`; loosen `dossierId` to `z.string()` (drop `.uuid()`).
- execute(): after the JWT guard, trim + shape-check `dossierId`; not shaped → `{ ...NEUTRAL }`
  (BEFORE building the read client); else use the trimmed id for the `.eq('id', …)` read + echo it.

### Task 4 — tools.test.ts

- a non-RFC-4122 SEED id (`b0000001-0000-0000-0000-000000000003`) is now ACCEPTED:
  publish_digest/signal_status → `{ proposed: true }` echoing the id; brief → builds the client
  from the JWT (proceeds to read).
- a NAME/placeholder is REJECTED: publish_digest/signal_status → `{ proposed: false }`; brief →
  neutral `{ proposed: false }` and NEVER builds a client (rejected before the read).
- existing VALID_UUID echo/keystone/indistinguishable-empty cases stay green.

## Scope guard

Touch ONLY propose-brief.ts + propose-publish-digest.ts + propose-signal-status.ts + tools.test.ts
(agent-runtime). NO frontend, NO reseed. git-add by explicit path (never -A).

## Verification

- STATIC: `pnpm --filter agent-runtime type-check` + `test`.
- LIVE: rebuild + recreate agent-runtime; POST `/api/copilot/chat` (Bearer JWT from `.env.test`,
  x-language en then ar):
  - "Draft a brief for the G20 Data Gaps Initiative dossier." → propose_brief with the seed id
    must NOT emit "Invalid UUID".
  - "Publish a weekly digest for the G20 Data Gaps Initiative dossier." → propose_publish_digest
    with the seed id must NOT emit "Invalid UUID".
    Report the live tool-call sequence + commit hash.

## must_haves

- truths:
  - "propose_brief/publish_digest/signal_status accept a non-RFC-4122 UUID-shaped id (seed ids)"
  - "a name/placeholder id still yields the neutral { proposed: false } (T-73-02-02 holds)"
  - "no caller JWT still returns the neutral { proposed: false }"
- key_links:
  - agent-runtime/src/mastra/tools/propose-brief.ts
  - agent-runtime/src/mastra/tools/propose-publish-digest.ts
  - agent-runtime/src/mastra/tools/propose-signal-status.ts
  - agent-runtime/src/mastra/tools/tools.test.ts
