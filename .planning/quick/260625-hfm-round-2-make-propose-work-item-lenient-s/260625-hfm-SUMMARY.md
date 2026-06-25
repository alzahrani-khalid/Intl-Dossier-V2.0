---
quick_id: 260625-hfm
slug: round-2-make-propose-work-item-lenient-s
date: 2026-06-25
status: complete
commit: b8fa8b2b
---

# Quick Task 260625-hfm — Summary

## What was still broken after round 1 (66ef7fa7)

Round 1 made `assigneeId`/`dossierIds` `.optional()`, but the live re-probe STILL failed Zod —
the model PRESENTS invalid values rather than omitting them (EN `assigneeId:"CURRENT_USER_ID"`,
AR `assigneeId:""`, junk `dossierIds`), and `.uuid().optional()` rejects a present-but-invalid
value. The model then retries → 2 failed calls, no proposal.

## Fix (lenient + self-normalizing — agent-runtime only)

Per the brief's root principle — _normalize the model's output instead of requiring it to be
perfect_ — `agent-runtime/src/mastra/tools/propose-work-item.ts`:

- inputSchema loosened so junk never hard-rejects: `assigneeId: z.string().optional()` (dropped
  `.uuid()`); `dossierIds: z.array(z.string()).optional()` (dropped inner `.uuid()`);
  `inheritanceSource: z.string().optional()` (dropped the enum).
- `execute()` normalizes before echoing (module-level `UUID_RE` + `INHERITANCE_SOURCES`):
  - `assigneeId` → kept only if it matches the UUID regex (trimmed); else `undefined` (the
    frontend defaults it to the caller via `resolveUid()` at commit — D-03).
  - `dossierIds` → filtered to UUID-matching entries (trimmed); else `[]`.
  - `inheritanceSource` → kept only if in the valid set; else `'direct'`.
  - Echoes the NORMALIZED args. The keystone JWT guard (no auth → `{proposed:false}`) is intact.
- `agent-runtime/src/mastra/tools/tools.test.ts` — rewrote the round-1 work_item test to the
  round-2 contract: junk assignee values (`""`, `"CURRENT_USER_ID"`, names) normalize to
  `undefined` and STILL propose; a valid UUID survives (trimmed); mixed/all-invalid `dossierIds`
  filter to the valid subset / `[]`; `inheritanceSource` `'none'`/`''`/unknown → `'direct'`,
  valid values preserved.

## DEVIATION from the brief (justified by live evidence)

The brief's task list said to KEEP `inheritanceSource` as a strict enum `.default('direct')`.
The first live re-probe (forced tool call, EN+AR) showed the model ALSO fumbles this field —
it supplies `inheritanceSource:"none"`, which the strict enum REJECTED on the first call
(`Invalid option ... validation failed`), forcing a retry. That is the SAME model-junk failure
class the UUID fields had, and it violates the brief's own success criterion ("NO validation
failed, EN+AR") and root principle. So `inheritanceSource` was made lenient + self-normalizing
too (same file, in scope). Without this the live stream still emitted a `validation failed`
event on the first attempt.

## Per-file changes (commit b8fa8b2b — agent-runtime only, 2 files)

- **agent-runtime/src/mastra/tools/propose-work-item.ts** — lenient schema + `UUID_RE` /
  `INHERITANCE_SOURCES` normalization in `execute()`; docblock updated.
- **agent-runtime/src/mastra/tools/tools.test.ts** — round-2 normalization test (assignee,
  dossierIds, inheritanceSource).

## Verification

### STATIC (all GREEN)

- `pnpm --filter agent-runtime type-check`: pass.
- `pnpm --filter agent-runtime exec vitest run src/mastra/tools/tools.test.ts`: 41/41 pass.
- eslint (2 changed files, root config): clean.

### LIVE (docker rebuild + recreate agent-runtime, then POST /api/copilot/chat)

Probe phrasing forced an immediate tool call ("…assigned to me, no dossier link, propose now").

- **First re-probe** (commit before the inheritanceSource extension) exposed the residual bug:
  EN+AR each made 2 calls — call 1 FAILED with `inheritanceSource:"none"` → `validation failed`,
  call 2 recovered. assigneeId `""` and dossierIds `[]` already normalized cleanly (no more
  "Invalid UUID").
- **Final re-probe** (commit b8fa8b2b live): EN + AR each made a SINGLE `propose_work_item` call,
  NO `Invalid UUID` / `validation failed` / `Invalid option` / `RUN_ERROR`. The model supplied
  `assigneeId:""` and the tool normalized it away. Result, both languages:
  `{proposed:true, action:'work_item', args:{title:"…", priority:'high', dossierIds:[], inheritanceSource:'direct'}}`
  - EN title: "Prepare the Friday delegation agenda"
  - AR title: "تحضير جدول أعمال وفد الجمعة"

## Scope discipline

Touched ONLY `propose-work-item.ts` + `tools.test.ts` (agent-runtime). Staged by explicit path
(never `-A`). No frontend, no `copilot.ts` (the round-1 prompt hint stays). The auto-generated
`frontend/src/routeTree.gen.ts` was left modified-but-unstaged (a concurrent agent owns frontend).
