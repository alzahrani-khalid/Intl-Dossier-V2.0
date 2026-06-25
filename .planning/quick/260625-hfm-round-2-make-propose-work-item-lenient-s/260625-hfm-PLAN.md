---
quick_id: 260625-hfm
slug: round-2-make-propose-work-item-lenient-s
date: 2026-06-25
status: ready
---

# Quick Task 260625-hfm: propose_work_item ROUND 2 — lenient + self-normalizing

## Problem (round-1 commit 66ef7fa7 was insufficient)

Round 1 made `assigneeId`/`dossierIds` `.optional()`, but the LIVE re-probe STILL fails Zod —
the model PRESENTS invalid values rather than omitting them:

- EN: `assigneeId:"CURRENT_USER_ID..."` → Invalid UUID; `dossierIds.0` → Invalid UUID
- AR: `assigneeId:""` (empty) → Invalid UUID; `dossierIds.0` → Invalid UUID

`.uuid().optional()` rejects a PRESENT-but-invalid value, and the model then retries → 2 failed
calls, no proposal, flagship action still broken.

## Root principle

Don't require the model to be perfect — make the TOOL normalize the model's output. agent-runtime
ONLY (the frontend commit already defaults the assignee via `resolveUid()`).

## Tasks

### Task 1 — lenient schema + self-normalization

`agent-runtime/src/mastra/tools/propose-work-item.ts`:

- inputSchema: `assigneeId: z.string().optional()` (DROP `.uuid()`);
  `dossierIds: z.array(z.string()).optional()` (DROP inner `.uuid()`); keep
  `inheritanceSource` enum `.default('direct')`. Junk no longer hard-rejects.
- `execute()`: add a UUID regex
  (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) and NORMALIZE before
  echoing:
  - `assigneeId` → keep only if it matches the regex; otherwise `undefined` (empty,
    "CURRENT_USER_ID", names → undefined → frontend commit uses the caller).
  - `dossierIds` → filter to entries matching the regex; echo the (possibly empty) array.
  - Echo the NORMALIZED args. Keep the keystone JWT guard (no auth → `{proposed:false}`).
- Update the docblock to describe the normalization contract.
- verify: `pnpm --filter agent-runtime type-check`

### Task 2 — tests

`agent-runtime/src/mastra/tools/tools.test.ts`: update the round-1 work_item test to the
round-2 normalization contract:

- `assigneeId:"CURRENT_USER_ID"` and `assigneeId:""` BOTH normalize to `undefined`
  (`proposed:true`), NOT reject.
- a valid UUID assignee is preserved.
- mixed `dossierIds` (`[VALID_UUID, "not-a-uuid", ""]`) → invalid dropped, valid survive;
  all-invalid → `[]`.
- verify: `pnpm --filter agent-runtime test`

## Scope guard

Touch ONLY propose-work-item.ts + tools.test.ts. No frontend, no copilot.ts (the round-1
prompt hint stays). git-add by explicit path (never -A) — a concurrent agent owns frontend.

## Verification

- STATIC: agent-runtime `type-check` + `test` (tools.test green).
- LIVE: rebuild + recreate the agent-runtime container, then POST to
  `http://localhost/api/copilot/chat` (Bearer JWT from `.env.test`, `x-language` en then ar)
  asking to "Create a work item titled X due Friday"; CONFIRM the stream emits
  `propose_work_item` → `{proposed:true, action:'work_item', args:{title,...}}` with NO
  "Invalid UUID"/"validation failed", EN + AR.

## must_haves

- truths:
  - "a present-but-invalid assigneeId normalizes to undefined and STILL proposes"
  - "an empty-string assigneeId normalizes to undefined and STILL proposes"
  - "a valid UUID assigneeId is preserved in the echoed args"
  - "non-UUID dossierIds are filtered out; valid UUIDs survive"
  - "no caller JWT still returns the neutral { proposed: false }"
- key_links:
  - agent-runtime/src/mastra/tools/propose-work-item.ts
  - agent-runtime/src/mastra/tools/tools.test.ts
