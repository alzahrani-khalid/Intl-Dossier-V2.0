# Impl brief — L4-tasks-workboard (tasks + kanban + task i18n) · priority 5 (silent-data-loss / i18n)

**Self-contained worker order. Atomic commits, conventional messages, NO push, NO PR.**

**Files you own (12 + 1 opportunistic) — touch ONLY these:**
`supabase/functions/tasks-create/index.ts` · `supabase/functions/tasks-update/index.ts` ·
`frontend/src/components/tasks/{TaskEditDialog,DeleteTaskDialog,ConflictDialog}.tsx` ·
`frontend/src/hooks/useTasks.ts` · `frontend/src/hooks/useUnifiedKanban.ts` ·
`frontend/src/pages/WorkBoard/WorkBoard.tsx` ·
`frontend/src/components/unified-kanban/utils/{column-definitions,status-transitions}.ts` ·
`frontend/src/i18n/en/tasks-page.json` · `frontend/src/i18n/ar/tasks-page.json` ·
`frontend/src/components/tasks/TaskDetail.tsx` (opportunistic LOW only).

**Source-of-truth facts:** `tasks` uses `sla_deadline` (NOT `deadline`) and `workflow_stage`
(`todo|in_progress|review|done|cancelled`); `task_status` enum includes `pending|in_progress|review|
completed|cancelled`; priority `low|medium|high|urgent`. **i18n:** the `tasks` namespace is
UNREGISTERED — use the already-registered **`tasks-page`** namespace (colon form
`t('...', { ns:'tasks-page' })` or `useTranslation('tasks-page')`). Do NOT edit `i18n/index.ts`.

---

### B-2 (HIGH) — tasks-create wrong tenant query

`tasks-create/index.ts:176-182` — `.from('profiles').select('tenant_id, organization_id').eq('id',
user.id)` ; `profiles` has neither `id` nor `tenant_id`, only `data` is destructured so the 400 is
dropped and `tenant_id` falls back to `user.id` on every task. Change to
`.select('organization_id').eq('user_id', user.id)` and `tenantId = profile?.organization_id ??
user.id`. Commit: `fix(tasks): correct tenant lookup (organization_id by user_id) (B-2)`.

### B-3 (HIGH) — task stage/status desync

`TaskEditDialog.tsx:96-109` submits `workflow_stage` with no `status`; `tasks-update/index.ts:158-176`
applies both independently → setting stage `done`/`cancelled` leaves `status='pending'` so SLA/overdue
keep firing. **Derive `status` from `workflow_stage` in `tasks-update`** (single source of truth):
`done→completed`, `cancelled→cancelled`, `review→review`, `todo→pending`, else `in_progress` — set it
whenever `workflow_stage` changes and `status` wasn't explicitly provided. Commit:
`fix(tasks): derive status from workflow_stage on update (B-3)`.

### B-26 (MED) — stage→status map not 1:1

`WorkBoard.tsx:58-64`, `unified-kanban/utils/column-definitions.ts:261-272`,
`status-transitions.ts:329-346` — `review`/`todo` fall through `default → 'in_progress'`, so the enum's
`review`/`pending` are never written and `status='review'|'pending'` filters miss tasks. Make the map
1:1 where the enum allows: `todo→pending`, `review→review` (consistent with the B-3 derivation).
Commit: `fix(kanban): 1:1 stage→status mapping (B-26)`.

### B-21 (MED) — drag-to-Done misses completion stamps

`useUnifiedKanban.ts:337-343` — dragging to Done writes `status='completed'` but never `completed_at`/
`completed_by` and bypasses optimistic locking, so `SLAIndicator` can't compute on-time/late. Set
`completed_at` (now) + `completed_by` (current user) on completion (or route board completion through
`tasks-update`). Commit: `fix(kanban): set completed_at/completed_by on drag-to-Done (B-21)`.

### B-24 (MED) — WorkBoard "+Add" is misleading

`WorkBoard.tsx:251-260` navigates to `/tasks` with an unused `defaultWorkflowStage` and no create form.
Either open the work-creation palette prefilled with the column's stage, or remove the +Add affordance.
(If you open the palette, do it via the existing provider; do NOT edit work-creation files — those are
L5. If that coupling is awkward, just remove the misleading +Add.) Commit:
`fix(kanban): +Add opens create prefilled or is removed (B-24)`.

### B-25 (MED) — tasks edge fns: enum validation + leaked errors

`tasks-create/index.ts:75,217` and `tasks-update/index.ts:95,190` — body is a bare cast (only
title+assignee checked) and the raw `insertError.message` is returned. Validate `priority`
(`low|medium|high|urgent`) and `workflow_stage` (`todo|in_progress|review|done|cancelled`) against
allow-lists (400 on mismatch); return a generic error message, log the raw error server-side. Commit:
`fix(tasks): validate enums + generic error body in edge fns (B-25)`.

### B-4 (HIGH) — useTasks toasts raw keys

`useTasks.ts:128-139` (+207,242,265) — `t('tasks.created')` etc. with no `defaultValue`; the `tasks`
ns is unregistered → raw key in EN and AR on every task mutation. Move these to the registered
`tasks-page` namespace: add `created`, `created_success`, `create_failed`, `updated`, `deleted`, … keys
to `en/tasks-page.json` + `ar/tasks-page.json`, and call them via `t('...', { ns:'tasks-page' })` (or
switch the hook's `useTranslation` to include `tasks-page` and use colon form). Commit:
`i18n(tasks): task mutation toasts via tasks-page namespace (B-4)`.

### B-22 ≡ E-11 (MED) — TaskEditDialog/DeleteTaskDialog labels

`TaskEditDialog.tsx:160` uses `t('tasks.title','Title')` → `common.tasks.title="Tasks"` so the Title
field label literally renders "Tasks" (AR "المهام"); `editTask`/`assignee`/`workflowStage`/`deadline`/
`deleteTask` don't exist → English-in-Arabic. Switch both dialogs to `useTranslation('tasks-page')`
with distinct keys (avoid the `common.tasks.title="Tasks"` collision); add the keys to both
`tasks-page.json` files; drop the English `defaultValue`s. Commit:
`i18n(tasks): TaskEdit/Delete dialogs use tasks-page keys (B-22/E-11)`.

### B-23 (MED) — ConflictDialog raw keys

`ConflictDialog.tsx:78-128` — `t('tasks.conflict.*')` with no defaults and no `conflict` block → raw
keys on every optimistic-lock conflict. Add a `conflict.*` block (title/description/yourChange/
theirChange/reload/forceSave) to both `tasks-page.json` files and read via `tasks-page` ns. Commit:
`i18n(tasks): add conflict dialog keys (B-23)`.

_Opportunistic (LOW, TaskDetail.tsx): B-30 add `workflow_stage._`/`status._`/`priority._`label keys;
B-36 drop`flex-row-reverse`under`dir="rtl"`. (LOW, column-definitions.ts): B-37 `[...columns].sort()`
instead of mutating the shared constant.\*

---

## Verify

- `cd frontend && pnpm tsc --noEmit`; `pnpm exec eslint src/components/tasks/*.tsx src/hooks/useTasks.ts src/hooks/useUnifiedKanban.ts src/pages/WorkBoard/WorkBoard.tsx src/components/unified-kanban/utils/*.ts`.
- Confirm every new `tasks-page` key exists in BOTH `en/tasks-page.json` and `ar/tasks-page.json` (parity grep).
- `deno check supabase/functions/{tasks-create,tasks-update}/index.ts` (if Deno present).
- **B-3 acceptance:** after `tasks-update` deploy, set a task's stage to `done` → its `status` becomes `completed` (read-only SQL). **B-2:** new tasks carry `tenant_id = organization_id` not `user.id`.

## Done-when

All items applied; tsc/eslint/deno-check green; task toasts/labels render localized in AR; stage→status
stays consistent; commits atomic; nothing pushed.
