---
quick_id: 260625-i3t
slug: copilot-tool-robustness-prompt-rule-get-
date: 2026-06-25
status: complete
commit: d1d44f3a
---

# Quick Task 260625-i3t — Summary

## Goal

Stop the copilot model fuzzing UUID tool args. Live probes showed the model passes a dossier
NAME where a UUID is expected → `get_dossier: dossierId Invalid UUID` → failed calls + retries.

## Fix (agent-runtime only — commit d1d44f3a, 3 files)

- **agent-runtime/src/mastra/agents/copilot.ts** — added rule #6 to BOTH the EN and AR
  "When answering" lists: when a tool needs an id/UUID (dossierId, signalId, work-item ids),
  always pass the exact UUID from a prior lookup (list_dossiers, hybrid_rag_search,
  read_signals, get_dossier) — never a name/title/placeholder; call the lookup tool first if
  you don't have it.
- **agent-runtime/src/mastra/tools/dossier-lookups.ts** (get_dossier) — loosened `dossierId`
  to `z.string()` (dropped `.uuid()`); `execute()` resolves a non-UUID via a name/title ILIKE
  lookup (`resolveDossierIdentifier`: `name_en`/`name_ar`, best single active match, or-filter
  term sanitized of `,()*`) before the by-id query; a UUID still takes the cheap by-id path;
  no match → neutral `{ dossier: null }`. Indistinguishable-empty preserved on every path.
- **agent-runtime/src/mastra/tools/tools.test.ts** — fake Supabase builder gained `.or`/`.ilike`;
  new test asserts a NAME arg validates (no Zod rejection), builds the client from the JWT, and
  returns the neutral `{ dossier: null }` on an empty match.

## Verification

### STATIC (all GREEN)

- `pnpm --filter agent-runtime type-check`: pass.
- `pnpm --filter agent-runtime exec vitest run src/mastra/tools/tools.test.ts`: 42/42 pass (+1).
- eslint (3 changed files): clean.

### LIVE (docker rebuild + recreate agent-runtime; POST /api/copilot/chat, "Draft a brief for the G20 Data Gaps Initiative dossier")

The get_dossier fix WORKS — both EN and AR:

- `get_dossier({"dossierId":"G20 Data Gaps Initiative"})` (a NAME) RESOLVED via ILIKE to the
  real dossier `b0000001-0000-0000-0000-000000000003` ("G20 Data Gaps Initiative", forum).
  **No "Invalid UUID" on get_dossier.** Both runs reached RUN_FINISHED, no RUN_ERROR.

Tool-call sequence (EN): get_dossier ✓ → propose_brief ✗ → hybrid_rag_search ✓ → propose_brief ✗.
Tool-call sequence (AR): get_dossier ✓ → propose_brief ✗ → propose_brief ✗.

### NEWLY SURFACED (distinct root cause — NOT in this task's scope)

`propose_brief` rejected the dossier id the model CORRECTLY took from get_dossier's result:
`propose_brief: dossierId Invalid UUID` for `b0000001-0000-0000-0000-000000000003`. That id is a
**staging SEED id that is not RFC-4122** (version nibble `0`, variant nibble `0`), and
`propose_brief` (and `propose_publish_digest`/`propose_signal_status`) still validate with strict
Zod `.uuid()`. The model behaved correctly; the propose tool's strict `.uuid()` is the blocker.

This is the SAME lenient-UUID class fixed for propose_work_item in round 2 (260625-hfm). The
brief's scope guard explicitly limited this task to copilot.ts + dossier-lookups.ts +
tools.test.ts and forbade touching the propose tools, while its success criterion expected
"(and the propose tool)" to stop emitting Invalid UUID — a contradiction the brief author could
not have foreseen (they didn't know the seed ids are non-RFC-4122). Left to a follow-up decision
rather than silently violating the explicit scope guard.

## Scope discipline

Touched ONLY copilot.ts + dossier-lookups.ts + tools.test.ts (agent-runtime). Staged by explicit
path (never `-A`). No frontend. `frontend/src/routeTree.gen.ts` left modified-but-unstaged.
