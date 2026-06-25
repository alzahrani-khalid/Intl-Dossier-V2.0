---
quick_id: 260625-gpj
slug: fix-copilot-hitl-create-work-item-propos
date: 2026-06-25
status: ready
---

# Quick Task 260625-gpj: Fix copilot HITL "create work item" flow

## Problem (live evidence 2026-06-25)

A copilot turn asking to "create a work item" calls `propose_work_item`, which FAILS Zod:
`assigneeId: Invalid UUID ("current_user_id_placeholder")`, `dossierIds.0: Invalid UUID`,
`inheritanceSource: Invalid option`. The model CANNOT know the caller's user UUID (it is
derived from the JWT and never given to the model), so `assigneeId: z.string().uuid()` makes
"create a task for me" ALWAYS fail → no approval card → the flagship write action is broken.

Root cause class: a **required arg the model cannot know**. `assigneeId` is the caller's
identity (JWT-derived). `dossierIds` requires real UUIDs the model only has after a lookup.
The other three propose tools take args from read-tool output or model text, so they are not
in this class (noted, not changed).

## Fix

Make the proposal robust (optional where the model can't know), default the assignee to the
caller's JWT at COMMIT (frontend), and tell the agent to omit what it can't know.

## Tasks

### Task 1 — agent-runtime tool schema (the keystone fix)

- `agent-runtime/src/mastra/tools/propose-work-item.ts`:
  - `assigneeId` → `.uuid().optional()` (describe: "Omit to assign to the current user; never invent a UUID")
  - `dossierIds` → `.array(uuid).optional()` (drop `.min(1)`; describe: "include ONLY UUIDs from a lookup tool; omit if unknown")
  - keep `inheritanceSource.default('direct')`
  - widen the TS arg cast (`assigneeId?`, `dossierIds?`); echo unchanged (undefined drops in JSON)
  - update the docblock to match (optional assignee / optional dossier array)
- verify: `pnpm --filter agent-runtime type-check`

### Task 2 — agent prompt guidance (EN + AR)

- `agent-runtime/src/mastra/agents/copilot.ts`: one terse line in BOTH prompts — for
  `propose_work_item`, omit `assigneeId` to assign to the current user; include `dossierIds`
  only when resolved from a lookup tool.
- verify: tools.test.ts assertion (prompts mention propose_work_item EN+AR) still green

### Task 3 — frontend commit defaulting

- `frontend/src/components/copilot/hitl/useApproveWrite.ts`:
  - `CommitWorkItemInput.assigneeId` → optional; `dossierIds` → optional
  - in `commitWorkItem`, default `assigneeId` via existing `resolveUid()` when absent/empty;
    default `dossierIds` to `[]` so the `length > 0` guard still protects the link step
- verify: `useApproveWrite.test.ts` (d) still passes (explicit assignee path unchanged)

### Task 4 — HITL confirm card (optional assignee display)

- `frontend/src/components/copilot/hitl/ProposeToolUIs.tsx`: `WorkItemArgs.assigneeId?` /
  `dossierIds?`; render "Assigned to you" / "مُسند إليك" when `assigneeId` absent; tolerate
  `op.dossierIds?.length ?? 0`; pass through to `commitWorkItem`.
- `frontend/src/i18n/{en,ar}/copilot.json`: add `confirm.value.assigneeSelf`
  ("Assigned to you" / "مُسند إليك"). Tokens only, no new chrome.

### Task 5 — agent-runtime test

- `agent-runtime/src/mastra/tools/tools.test.ts`: assert `propose_work_item` proposes
  `{proposed:true, action:'work_item'}` with `assigneeId` OMITTED (title only, no invented
  UUID), still echoes a provided UUID, and does NOT propose for a non-UUID assignee
  (the exact `current_user_id_placeholder` value that broke the live flow).
- verify: `pnpm --filter agent-runtime test`

## Scope guard

Touch ONLY: propose-work-item.ts, copilot.ts, useApproveWrite.ts, ProposeToolUIs.tsx,
en/copilot.json, ar/copilot.json, tools.test.ts. Do NOT touch
CopilotDrawer/DossierDrawer/ui/sheet.tsx. git-add only these listed files (never -A).

## Verification (STATIC only)

- agent-runtime: `type-check` + `test`
- frontend: `tsc` + `eslint` scoped to changed files + `vitest run src/components/copilot`
- LIVE container rebuild + propose probe is DEFERRED to the orchestrator (out of scope here).

## must_haves

- truths:
  - "propose_work_item with title only (no assigneeId, no dossierIds) returns proposed:true"
  - "assigneeId defaults to the caller JWT (resolveUid) at commit when omitted"
  - "a non-UUID assigneeId still does NOT propose (Zod rejects it)"
  - "EN + AR prompts tell the agent to omit assigneeId for the current user"
- key_links:
  - agent-runtime/src/mastra/tools/propose-work-item.ts
  - frontend/src/components/copilot/hitl/useApproveWrite.ts
  - frontend/src/components/copilot/hitl/ProposeToolUIs.tsx
  - agent-runtime/src/mastra/tools/tools.test.ts
