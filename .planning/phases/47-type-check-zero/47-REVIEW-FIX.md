---
phase: 47-type-check-zero
fixed_at: 2026-05-09T00:00:00Z
review_path: .planning/phases/47-type-check-zero/47-REVIEW.md
iteration: 1
findings_in_scope: 16
fixed: 15
skipped: 1
status: partial
---

# Phase 47: Code Review Fix Report

**Fixed at:** 2026-05-09
**Source review:** `.planning/phases/47-type-check-zero/47-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 16 (2 Critical + 14 Warning)
- Fixed: 15
- Skipped: 1

All fix commits land on the user's branch via the agent's gsd-reviewfix worktree;
each is a self-contained, atomic commit prefixed `fix(47): {ID(s)} ...`.
Frontend tsc verified to pass with all fixes applied (exit 0, no errors
introduced).

## Fixed Issues

### CR-01: `useCommentThread` lost its enabled gate — N+1 API calls per comment list

**Files modified:** `frontend/src/components/comments/CommentItem.tsx`
**Commit:** `d7bef130`
**Applied fix:** Restored the four-condition gate
(`showReplies && reply_count > 0 && showRepliesExpanded && parent_id === null`)
at the caller by passing `null` to `useCommentThread` when conditions are not
met. The hook self-disables on null commentId.

### CR-02: `useStakeholderTimeline` silently dropped its real API call

**Files modified:** `frontend/src/domains/misc/repositories/misc.repository.ts`
**Commit:** `31e01886`
**Applied fix:** Removed the dead repo functions `getStakeholderTimeline`,
`getTimelineStats`, `getTimelineExport`, `compareTimelines` (zero call sites
in frontend), and added a follow-up comment explaining the consumer hook
remains stubbed pending feature work. Per REVIEW.md option (b) — option (a)
(restore live `useQuery`) requires backend response shape verification, out
of scope for type-check-zero milestone.
**Status:** fixed (option-b path; option-a deferred to feature work)

### WR-01: `EMPTY_CONFIGURATION` ships invalid runtime shape

**Files modified:** `frontend/src/domains/misc/hooks/useReportBuilder.ts`
**Commit:** `f4cc5ed3`
**Applied fix:** Renamed fields to match `ReportConfiguration`:
`filters` → `FilterGroup` (id/logic/filters/groups), `sorting` instead of
`sort_order`, dropped `filter_logic`. Removed `as unknown as` cast so tsc
verifies shape.

### WR-02 + WR-03: BriefingPackGenerator status field mismatch and lost polling gate

**Files modified:** `frontend/src/components/positions/BriefingPackGenerator.tsx`
**Commit:** `d3daa7f7`
**Applied fix:** Read job status from `briefingStatus.data` (`BriefingPackJob`,
status: `pending|processing|completed|failed`) instead of `briefingStatus.status`
(TanStack QueryStatus, only `pending|error|success`). Restored
`{ enabled: Boolean(jobId) && status === 'generating' }` polling gate. Dropped
the misleading shim that codified the wrong assumption.
**Status:** fixed: requires human verification (logic — verifying the
BriefingPackJob runtime shape matches the typed assumption requires running
the briefing-pack endpoint against a live backend).

### WR-04 + WR-09: useEntityTemplates lost enabled gate; redundant useApplyTemplate cast

**Files modified:**
`frontend/src/components/entity-templates/QuickEntryDialog.tsx`,
`frontend/src/components/entity-templates/useTemplateKeyboardShortcuts.ts`
**Commit:** `398d8f17`
**Applied fix:**

- WR-04: pass `enabled` through to `useEntityTemplates({ entityType, enabled })`
  in `useTemplateKeyboardShortcuts` (gated on shortcut activation) and
  `QuickEntryDialog` (gated on dialog `open` prop).
- WR-09: drop redundant `as unknown as { applyTemplate: ... }` cast — the
  hook source already returns the precise shape.

### WR-05: MentionInput lost visibility gate on user search

**Files modified:**
`frontend/src/components/comments/MentionInput.tsx`,
`frontend/src/domains/misc/hooks/useComments.ts`
**Commit:** `e2cf68a8`
**Applied fix:** Extended `useSearchUsersForMention` hook source to accept
`options?: { enabled?: boolean }`. Restored the `showMentionList && length >= 1`
gate at the caller. Follows the "type at hook source" pattern from 47-08/47-11.

### WR-07: Fallback colors changed for unknown enum values

**Files modified:** `frontend/src/lib/semantic-colors.ts`
**Commit:** `d0f61b98`
**Applied fix:** Replaced parallel `DEFAULT_DOSSIER_COLORS` /
`DEFAULT_STATUS_COLORS` / `DEFAULT_PRIORITY_COLORS` /
`DEFAULT_ACTIVITY_TYPE_COLORS` constants with non-null-asserted fallbacks to
the canonical map entries (`statusColors.todo!`, `priorityColors.medium!`,
`dossierTypeColors.country!`, `activityTypeColors.task!`). Pixel output
unchanged — each removed constant was byte-equivalent to the canonical entry
it replaces. Eliminates drift risk going forward.

### WR-08: DocumentsSection EmptyState type still requires unused isRTL

**Files modified:** `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx`
**Commit:** `8dbc3e06`
**Applied fix:** Dropped `isRTL: boolean` from EmptyState type and removed
`isRTL={isRTL}` from both call sites (DocumentList and the no-documents Card
branch). Brings DocumentsSection in line with sibling sections that cleanly
removed both prop and type.

### WR-10 + WR-11: CalendarSyncSettings redundant `as any` casts and dead `void` discard

**Files modified:** `frontend/src/components/calendar/CalendarSyncSettings.tsx`
**Commit:** `9096c3f1`
**Applied fix:**

- WR-10: Removed `updates as any` from both `onUpdateSettings` and `onUpdate`
  callbacks. The hook stub already accepts `Record<string, unknown>` and the
  caller passes the same — no cast needed. Restores compliance with project
  no-`any` rule.
- WR-11: Removed the dead `void (isExpanded ? connection.id : undefined)`
  scaffolding line — `connection.id` is consumed elsewhere; `isExpanded` is
  used by `Collapsible`.

### WR-12: push-subscription buffer-extraction cast

**Files modified:** `frontend/src/services/push-subscription.ts`
**Commit:** `ffa14f4f`
**Applied fix:** Replaced `applicationServerKey.buffer as ArrayBuffer` with
`applicationServerKey as BufferSource`. The Push API accepts `BufferSource`
(union of `ArrayBuffer | ArrayBufferView`) — Uint8Array is an
ArrayBufferView. Preserves the original clear shape and avoids the
ArrayBuffer-vs-ArrayBufferLike asymmetry from `.buffer`.

### WR-13: CommandPalette non-null assertions after typeguard

**Files modified:** `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx`
**Commit:** `0c1ad92e`
**Applied fix:** Restructured the dossier-grouping pipeline to avoid `!`
non-null assertions. Use `.map(type => ({ type, items: grouped[type] ?? [] }))`,
then `.filter(entry => entry.items.length > 0)`, then `.map` to slice — tsc
verifies the shape directly.

### WR-14: useStakeholderInfluenceList lossy `Record<string, unknown>` queryKey

**Files modified:** `frontend/src/domains/misc/hooks/useStakeholderInfluence.ts`
**Commit:** `04717ddb`
**Applied fix:** Tightened hook param type from `Record<string, unknown>` to
the existing `StakeholderInfluenceListParams` (limit, offset, sort_by,
sort_order, type, min_score). Now tsc catches typos like `tipe: 'org'`.

## Skipped Issues

### WR-06: Repository `Promise<unknown>` casts to `Promise<DomainType>`

**File:** `frontend/src/domains/audit/hooks/useRetentionPolicies.ts:69, 127, 187, 192, 207, 218, 224`
(also `frontend/src/domains/import/hooks/useWebhooks.ts:50, 60`)
**Reason:** skipped: requires backend response shape verification

The fix requires confirming whether each underlying API endpoint
(`/admin/retention-policies`, `/admin/retention-policies/:id/legal-holds`,
`/admin/retention-statistics`, etc.) returns a flat array `RetentionPolicy[]`
or a paginated wrapper `{data, pagination}`. Verifying that requires running
each endpoint against a live backend — out of scope for the type-check-zero
milestone, which restricts itself to typing fixes.

The reviewer's own "Findings Not Reviewed" section explicitly flags this:
"Verifying that requires running each endpoint, which is out of scope."

**Original issue:** Multiple hooks cast `getXxx(searchParams) as Promise<DomainType[]>`
against repository functions whose signature is `Promise<unknown>`. The cast's
job should be to reflect runtime, not impose a wishful shape.

**Recommendation for follow-up:** Pair this with the backend API contract
work — verify each endpoint, then either remove the cast (if the endpoint
returns a flat array) or fix the cast to `Promise<{data: T[]}>` and update
consumers (if the endpoint returns a paginated wrapper).

---

_Fixed: 2026-05-09_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
