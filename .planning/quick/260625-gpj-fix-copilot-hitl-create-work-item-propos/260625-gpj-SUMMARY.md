---
quick_id: 260625-gpj
slug: fix-copilot-hitl-create-work-item-propos
date: 2026-06-25
status: complete
commit: 66ef7fa7
---

# Quick Task 260625-gpj — Summary

## What was broken

The copilot HITL "create work item" flow always failed. `propose_work_item` required
`assigneeId: z.string().uuid()` and a non-empty `dossierIds` UUID array. The model never
receives the caller's user UUID (it is JWT-derived) and has no dossier UUID until it runs a
lookup, so "create a task for me" failed Zod
(`assigneeId: Invalid UUID ("current_user_id_placeholder")`, `dossierIds.0: Invalid UUID`)
→ no approval card → the flagship write action was unreachable. Root cause class: **a
required arg the model cannot know.** The other three propose tools take args from read-tool
output or model text, so they are not in this class (noted, unchanged).

## Fix (proposal robust; default assignee to caller at COMMIT)

Made the model-unknowable args optional, defaulted the assignee to the caller's JWT at the
frontend commit, and instructed the agent (EN+AR) to omit what it cannot know.

## Per-file changes (commit 66ef7fa7 — 7 files, +87/−18)

- **agent-runtime/src/mastra/tools/propose-work-item.ts** — `assigneeId` →
  `.uuid().optional()` ("Omit to assign to the current user; never invent a UUID");
  `dossierIds` → `.array(uuid).optional()` (dropped `.min(1)`; "include ONLY UUIDs from a
  lookup tool; omit if unknown"); `inheritanceSource.default('direct')` kept; widened the TS
  arg cast (`assigneeId?`, `dossierIds?`); docblock updated. Echo unchanged (undefined drops
  in JSON).
- **agent-runtime/src/mastra/agents/copilot.ts** — one guidance line added to BOTH the EN and
  AR system prompts: for `propose_work_item`, omit `assigneeId` to assign to the current user,
  and include `dossierIds` only when resolved from a lookup tool.
- **frontend/src/components/copilot/hitl/useApproveWrite.ts** — `CommitWorkItemInput`
  `assigneeId`/`dossierIds` now optional; `commitWorkItem` defaults the assignee via the
  existing `resolveUid()` (caller JWT) when absent/empty and defaults `dossierIds` to `[]`
  (the existing `length > 0` guard skips the link step).
- **frontend/src/components/copilot/hitl/ProposeToolUIs.tsx** — `WorkItemArgs`
  `assigneeId`/`dossierIds` optional; the confirm card shows the localized "Assigned to you"
  when `assigneeId` is omitted and tolerates `op.dossierIds?.length ?? 0`; passes both through
  to `commitWorkItem`.
- **frontend/src/i18n/en/copilot.json** — added `confirm.value.assigneeSelf` = "Assigned to you".
- **frontend/src/i18n/ar/copilot.json** — added `confirm.value.assigneeSelf` = "مُسند إليك".
- **agent-runtime/src/mastra/tools/tools.test.ts** — new test: `propose_work_item` proposes
  `{proposed:true, action:'work_item'}` with `assigneeId` OMITTED (title only, no invented
  UUID), still echoes a provided UUID, and does NOT propose for the non-UUID
  `current_user_id_placeholder` value that broke the live flow.

## Verification — STATIC only (all GREEN)

- agent-runtime `type-check`: pass.
- agent-runtime `vitest run src/mastra/tools/tools.test.ts`: 41/41 pass (incl. new test).
- agent-runtime eslint (3 changed files): clean.
- frontend `type-check` (full `tsc --noEmit`): 0 errors.
- frontend eslint (2 changed files): clean.
- i18n namespace check (root `scripts/check-i18n-namespaces.mjs`): OK.
- frontend `vitest run src/components/copilot`: 8/8 pass (confirms `useApproveWrite.test.ts`
  case (d), the explicit-assignee path, survives the widening).

## Scope discipline

Touched ONLY the 7 listed files; staged each by explicit path (never `-A`). Did NOT touch
CopilotDrawer / DossierDrawer / ui/sheet.tsx (the concurrent UX agent's surface). The
auto-generated `frontend/src/routeTree.gen.ts` was left modified-but-unstaged.

## Deferred (out of scope here — for the orchestrator)

LIVE verification: rebuild the agent-runtime container and re-run the propose probe
("Create a work item titled X due Friday") to confirm the stream emits a valid
`propose_work_item` result `{proposed:true, action:'work_item', args:{title, ...}}` with no
Zod error, EN + AR.
