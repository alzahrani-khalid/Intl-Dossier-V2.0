---
phase: 47-type-check-zero
fixed_at: 2026-05-09T19:30:00Z
review_path: .planning/phases/47-type-check-zero/47-REVIEW.md
iteration: 1
findings_in_scope: 16
fixed: 14
skipped: 2
status: partial
---

# Phase 47: Code Review Fix Report

**Fixed at:** 2026-05-09
**Source review:** `.planning/phases/47-type-check-zero/47-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope (CR + WR): 16
- Fixed: 14
- Skipped (require human judgment): 2
- Phase goal (`pnpm typecheck` → 0 errors): **HOLDS**. Both `intake-backend` and `intake-frontend` `tsc --noEmit` pass cleanly after every commit and at HEAD.

## Fixed Issues

### CR-03: Backend `query.eq('after_action_id', id)` against `commitments` — column does not exist

**Files modified:** `backend/src/api/after-action.ts`
**Commit:** `09986501`
**Applied fix:** Switched both cascade call sites (update at L540, delete at L803) from `commitments` to `aa_commitments`. Dropped both `as never` casts on the column literal. Added a typed `Insert[]` cast on the upsert payload so future schema drift surfaces at compile time.

### CR-04: `tasks.service.ts` filters `tasks` by columns that don't exist (`related_commitment_id`, `related_after_action_id`)

**Files modified:** `backend/src/services/tasks.service.ts`
**Commit:** `7affbbc6`
**Applied fix:** Rewrote three queries (`updateTaskStatusFromCommitment`, `getTasksByAfterAction`, `deleteTasksByAfterAction`) to filter by the schema's real linkage `work_item_id` + `work_item_type` (`'commitment'`|`'after_action'`). Dropped all three `as never` casts.

### CR-05: `after-action.ts` filters `after_action_records` by non-existent columns (`status`, `confidentiality_level`)

**Files modified:** `backend/src/api/after-action.ts`
**Commit:** `dfc6ec13`
**Applied fix:** Mapped `q.status` to the real column `publication_status` and `q.confidentiality_level` to the boolean `is_confidential` (any non-`public` value collapses to `true`). Documented the boolean ↔ four-state-enum impedance with an inline comment so the next reader knows the narrowing is deliberate, not a bug. Dropped both `as never` casts.

### CR-06: `useAuditLogExport()` shim destructures fields that don't exist — runtime TypeError on user click

**Files modified:** `frontend/src/components/audit-logs/AuditLogExport.tsx`
**Commit:** `6517286f`
**Applied fix:** Replaced the `{ exportLogs, isExporting }` shim with the real TanStack mutation API (`mutateAsync` + `isPending`). Dropped the `as unknown as { ... }` cast.

### CR-07: `CommentForm.tsx` `updateComment.mutateAsync({ commentId, ... })` — wrong param shape, hidden by widening cast

**Files modified:** `frontend/src/components/comments/CommentForm.tsx`
**Commit:** `27783458`
**Applied fix:** Dropped the `as unknown as { ... }` shim on both `useCreateComment` and `useUpdateComment`. Pass `{ id, data: { content, visibility } }` matching the hook's real signature. Added a guard `if (isEditing && editingComment)` so the editing branch can no longer fall through with a stale `editingComment`. **Logic-bug class — flagged for human verification of the param shape against the live backend route, since the review noted "the createComment call site is also worth a look; this review did not run end-to-end against the backend route."**

### WR-15: `optimisticLockingMiddleware('task_contributors')` would crash at runtime

**Files modified:** `backend/src/middleware/optimistic-locking.ts`
**Commit:** `138039cf`
**Applied fix:** Narrowed parameter from `'tasks' | 'task_contributors'` to `'tasks'` — all current callers pass `'tasks'` only. Dropped the `as never` casts on `is_deleted` filter and `false` literal. Future readers extending to `task_contributors` will hit a real type error.

### WR-16: `useUploadAttachment()` shim claims `mutateAsync: (data: FormData) => ...` — but `apiPost` JSON-stringifies

**Files modified:** `frontend/src/components/attachment-uploader/AttachmentUploader.tsx`
**Commit:** `c163f6fe`
**Applied fix:** Replaced the shim's param type with the real contract (`Record<string, unknown>`). Cast the FormData at the call site with a comment pointing at the open upload-pipeline bug. Per the review's explicit guidance, the actual multipart upload fix is left as a separate ticket — this commit only addresses the type-system lie.

### WR-17: `useAuditLogStatistics` shim destructures `{ statistics }` but hook returns `{ data }`

**Files modified:** `frontend/src/components/audit-logs/AuditLogStatistics.tsx`
**Commit:** `e199114a`
**Applied fix:** Switched destructure to `{ data, isLoading, error }`, narrowed `data` via a single explicit cast to a local `AuditStatistics` type, and assigned to a `statistics` const for downstream readability.

### WR-18: `useAuditLogDistinctValues` shim destructures `{ values }` but hook returns `{ data }`

**Files modified:** `frontend/src/components/audit-logs/AuditLogFilters.tsx`
**Commit:** `2f9a0b9a`
**Applied fix:** Destructured `data` (renamed inline to `availableTables`) with `[]` default and a narrowed cast to `string[] | undefined`.

### WR-19: Backend `digest-scheduler.ts` — `dateStr` used unchecked

**Files modified:** `backend/src/queues/digest-scheduler.ts`
**Commit:** `76caef4a`
**Applied fix:** Added `?? '1970-01-01'` defensive default at line 41, matching the pattern Phase 47 already applied at line 142.

### WR-20: `applicationServerKey: applicationServerKey as BufferSource` cast — root cause documentation

**Files modified:** `frontend/src/services/push-subscription.ts`
**Commit:** `21d53325`
**Applied fix:** Per the review's recommendation ("None required for the cast itself. Optionally investigate the root tsc lib-version mismatch"), added a four-line inline comment naming the `@types/dom` lib-version mismatch. No behavior change; the cast is correct at runtime.

### WR-22: `BenchmarkPreview` shim widens stub data shape — stub returns `[]` instead of object

**Files modified:** `frontend/src/components/dashboard-widgets/BenchmarkPreview.tsx`, `frontend/src/domains/analytics/hooks/useOrganizationBenchmarks.ts`
**Commit:** `35b62d0a`
**Applied fix:** Moved the typed contract into the hook source: `useBenchmarkPreview` now returns `UseQueryResult<BenchmarkPreviewData>` and the stub resolves with the asserted object shape rather than `[]`. Component-side cast narrowed to the existing `OrganizationBenchmark` typed view.

### WR-23: Five dossier-section components shim already-typed TanStack hooks

**Files modified:** `frontend/src/components/dossier/TopicDossierDetail.tsx`, `frontend/src/components/dossier/sections/DecisionLogs.tsx`, `frontend/src/components/dossier/sections/InteractionHistory.tsx`, `frontend/src/components/dossier/sections/PositionsHeld.tsx`, `frontend/src/components/dossier/sections/OrganizationAffiliations.tsx`
**Commit:** `aebb7032`
**Applied fix:** Dropped all five `as unknown as { ... }` shims. The hooks already return strong types (`UseQueryResult<RelationshipsListResponse>`, `UseQueryResult<PersonFullProfile>`); the `PersonFullProfile` type already exposes the very fields the shims re-narrowed. Note: the review listed three of the files (`InteractionHistory`, `PositionsHeld`, `OrganizationAffiliations`) under the `useRelationshipsForDossier` banner, but those files actually shim `usePerson`. The pattern and fix are the same; all five are addressed in one commit. Full traceability is in the commit message.

### WR-25: `BriefingPackJob` cast pattern — three casts of the same `briefingStatus.data`

**Files modified:** `frontend/src/components/positions/BriefingPackGenerator.tsx`, `frontend/src/domains/briefings/hooks/useBriefingPackStatus.ts`, `frontend/src/domains/briefings/types/index.ts`
**Commit:** `41a0ba7d`
**Applied fix:** Consolidated at the hook source per the 47-08 charter. Extended `BriefingPackJob` with `file_url?` and `error_message?`. Typed `useBriefingPackStatus` as `UseQueryResult<BriefingPackJob | null>` and cast the repo's `unknown` return inside `queryFn` once. Dropped all three component-side casts; `briefingStatus.data` is now narrowed automatically.

## Skipped Issues

### WR-21: `ChatContext` provider is now dead infrastructure (no consumer hook)

**File:** `frontend/src/contexts/ChatContext.tsx` (whole file post-Phase47)
**Reason:** skipped — requires human judgment about feature roadmap
**Original issue:** `ChatProvider` wraps the app at `routes/_protected.tsx:5`, but no component consumes the context (the `useChatContext` hook was deleted in Phase 47). Recomputed value dispatches on every chat state change for nothing.
**Why skipped:** The file's docblock identifies it as "Feature: 033-ai-brief-generation, Task: T039". Deleting the entire context + provider risks removing planned-but-not-yet-wired infrastructure for the AI brief generation feature. The Karpathy "Surgical Changes" rule applies: if a file's intent is documented and the file is not yet broken, do not delete it without explicit confirmation. This is also outside the phase's narrow type-check-zero charter — the file already type-checks correctly. Recommended next step: confirm with the product owner of feature 033 whether the chat context will be consumed; if not, a follow-up commit can delete `ChatContext.tsx` and the wrapper in `_protected.tsx`.

### WR-24: `useCalendarSync` returns `NOOP_ASYNC` for every action — UI is non-functional

**File:** `frontend/src/domains/briefings/hooks/useCalendarSync.ts:124-147`
**Reason:** skipped — UX/feature scope, not a type-check fix
**Original issue:** Eleven action callbacks all return `NOOP_ASYNC`. Users can click through the fully-styled CalendarSyncSettings page and nothing happens. The fix recommended by the review is a UI banner ("Calendar sync is not yet wired to a backend") OR a feature-flag gate that 404s the route.
**Why skipped:** Both proposed fixes are user-facing UX changes outside the phase 47 type-check-zero charter. Adding a banner needs i18n keys (en + ar) and design-system review (`Alert` vs prototype banner pattern). Feature-flagging the route requires a flag-management decision. The review acknowledges the file already type-checks correctly. Recommended next step: file as a follow-up UX ticket against the calendar-sync feature owner.

---

## Logic-bug verification flags

The following commit is flagged as `fixed: requires human verification` because the change includes a logic refactor that Tier 1/2 verification (re-read + `tsc --noEmit`) cannot fully validate:

- **CR-07 (`27783458`)** — fixed the `commentId` → `id` param shape and the `data: { content, visibility }` envelope. The review explicitly noted that the sibling `createComment.mutateAsync({...})` call at L108-114 was not validated against the live backend route. Recommend an end-to-end test of comment creation + edit before this phase exits the verifier stage.

## Phase-goal verification

After all 14 fix commits, ran `pnpm typecheck` (= `turbo run type-check` against both `intake-backend` and `intake-frontend`):

```
intake-backend:type-check  > tsc --noEmit  →  0 errors
intake-frontend:type-check > tsc --noEmit  →  0 errors
Tasks:    4 successful, 4 total
```

Phase 47's "type-check-zero" goal **continues to hold** post-fix. No new exceptions added to `47-EXCEPTIONS.md`.

## Commit summary

```
41a0ba7d fix(47): WR-25 type useBriefingPackStatus at the hook source
aebb7032 fix(47): WR-23 drop redundant shims on useRelationshipsForDossier/usePerson
35b62d0a fix(47): WR-22 align BenchmarkPreview stub with asserted shape
21d53325 fix(47): WR-20 document why applicationServerKey needs a BufferSource cast
76caef4a fix(47): WR-19 add defensive default for dateStr in digest-scheduler
2f9a0b9a fix(47): WR-18 destructure `data` from useAuditLogDistinctValues
e199114a fix(47): WR-17 read TanStack `data` field in AuditLogStatistics
c163f6fe fix(47): WR-16 stop codifying FormData as the upload param type
138039cf fix(47): WR-15 narrow optimistic-locking middleware to tasks-only
27783458 fix(47): CR-07 send correct param shape to useUpdateComment
6517286f fix(47): CR-06 use TanStack mutation API in AuditLogExport
dfc6ec13 fix(47): CR-05 align after-action list filter columns with schema
7affbbc6 fix(47): CR-04 use work_item_id/work_item_type on tasks queries
09986501 fix(47): CR-03 redirect cascade ops to aa_commitments table
```

---

_Fixed: 2026-05-09T19:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
