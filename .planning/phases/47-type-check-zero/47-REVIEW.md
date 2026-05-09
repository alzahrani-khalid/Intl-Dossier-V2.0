---
phase: 47-type-check-zero
reviewed: 2026-05-09T00:00:00Z
depth: standard
files_reviewed: 313
files_reviewed_list:
  - frontend/src/services/realtime.ts
  - frontend/src/domains/briefings/hooks/useCalendarSync.ts
  - frontend/src/components/calendar/CalendarSyncSettings.tsx
  - frontend/src/domains/misc/hooks/useStakeholderInfluence.ts
  - frontend/src/routes/_protected/stakeholder-influence.tsx
  - frontend/src/domains/audit/hooks/useRetentionPolicies.ts
  - frontend/src/routes/_protected/admin/data-retention.tsx
  - frontend/src/domains/misc/hooks/useReportBuilder.ts
  - frontend/src/components/report-builder/ReportBuilder.tsx
  - frontend/src/domains/misc/hooks/useStakeholderTimeline.ts
  - frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx
  - frontend/src/components/audit-logs/AuditLogStatistics.tsx
  - frontend/src/domains/audit/hooks/useAuditLogs.ts
  - frontend/src/components/positions/BriefingPackGenerator.tsx
  - frontend/src/components/comments/CommentItem.tsx
  - frontend/src/components/comments/MentionInput.tsx
  - frontend/src/components/comments/ReactionPicker.tsx
  - frontend/src/domains/misc/hooks/useComments.ts
  - frontend/src/domains/tags/hooks/useEntityTemplates.ts
  - frontend/src/components/entity-templates/QuickEntryDialog.tsx
  - frontend/src/components/entity-templates/useTemplateKeyboardShortcuts.ts
  - frontend/src/domains/import/hooks/useAvailabilityPolling.ts
  - frontend/src/components/availability-polling/AvailabilityPollResults.tsx
  - frontend/src/domains/import/hooks/useWebhooks.ts
  - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/KeyContactsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/RelatedDossiersSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx
  - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
  - frontend/src/components/tags/TagAnalytics.tsx
  - frontend/src/contexts/ChatContext.tsx
  - frontend/src/services/push-subscription.ts
  - frontend/src/services/upload.ts
  - frontend/src/services/auth.ts
  - frontend/src/services/intelligence-api.ts
  - frontend/src/services/contact-relationship-api.ts
  - frontend/src/services/dossier-export.service.ts
  - frontend/src/services/unified-work.service.ts
  - frontend/src/lib/utils.ts
  - frontend/src/lib/sentry.ts
  - frontend/src/lib/semantic-colors.ts
  - frontend/src/lib/i18n/toArDigits.ts
  - frontend/src/design-system/tokens/applyTokens.ts
  - frontend/src/domains/audit/repositories/audit.repository.ts
  - frontend/src/domains/misc/repositories/misc.repository.ts
  - frontend/src/domains/briefings/index.ts
  - frontend/src/hooks/useCalendarSync.ts
  - frontend/src/hooks/useDossierContext.ts
  - frontend/src/hooks/useFieldPermissions.ts
  - frontend/src/hooks/useDuplicateDetection.ts
  - frontend/src/hooks/useCommitmentDeliverables.ts
  - frontend/src/hooks/useNotificationCenter.ts
  - frontend/src/hooks/useRecentNavigation.ts
  - frontend/src/types/database.types.ts
  - frontend/src/types/dossier-export.types.ts
  - frontend/src/types/report-builder.types.ts
  - frontend/src/domains/topics/hooks/useTopics.ts
  - frontend/src/hooks/useTopics.ts
  - frontend/src/domains/engagements/hooks/useEngagements.ts
  - frontend/src/domains/persons/hooks/usePersons.ts
  - frontend/src/domains/tags/hooks/useTagHierarchy.ts
  - frontend/src/domains/search/hooks/useEnhancedSearch.ts
  - frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
findings:
  critical: 2
  warning: 14
  info: 0
  total: 16
status: issues_found
---

# Phase 47: Code Review Report

**Reviewed:** 2026-05-09
**Depth:** standard
**Files Reviewed:** 313 (sampled — 65 read in full, ~250 inspected via diff)
**Status:** issues_found

## Summary

Phase 47 was a type-check-zero campaign: 1580 → 0 frontend tsc errors across 11 sub-plans. The discipline on suppressions held — only 2 in-source `@ts-nocheck` (auto-generated `database.types.ts` and `routeTree.gen.ts`); 1 `@ts-expect-error` in `IntakeForm.tsx`; 1 in a test file. No new `@ts-ignore`. Overwhelming majority of changes are net deletions of unused types, unused hooks, and dead utility code (754 files, +1841/-103703 lines workspace-wide).

The review surfaced **two BLOCKER findings** introduced (or codified) by Phase 47 and **fourteen WARNINGs**. The dominant defect class is **`as unknown as { ... }` shims that lie about runtime shape** — Phase 47 used these to satisfy tsc against stub hooks, but several shims assert fields/values that the underlying stub does not produce, hiding latent runtime bugs.

The second class is **dropped runtime guards**: `enabled` flags removed from queries during signature-narrowing (`useCommentThread`, `useBriefingPackStatus`, `useEntityTemplates`, `useSearchUsersForMention`), causing N+1 fetches or polling runaways.

## Critical Issues

### CR-01: `useCommentThread` lost its enabled gate — N+1 API calls per comment list

**File:** `frontend/src/components/comments/CommentItem.tsx:90-103`
**Issue:** Pre-Phase47, the thread fetch was gated by:

```ts
enabled: showReplies && comment.reply_count > 0 && showRepliesExpanded && comment.parent_id === null
```

After Phase 47, the four-condition gate was removed and the call collapsed to `useCommentThread(comment.id)`. The hook self-gates only on `Boolean(commentId)`. Effect: every rendered `<CommentItem>` (including replies and deeply-nested replies) now issues `GET /entity-comments/:id/thread`. With M visible comments, this triggers M concurrent API calls on first render, and again on every render of a parent that re-renders. The `comment.parent_id === null` gate that prevented child comments from fetching their own threads is gone — children also fetch.

Repository function `getCommentThread` (`misc.repository.ts:51`) is a real network call; this is not stubbed.

**Fix:** Restore the gate. The hook signature accepts only `(commentId)`, so the gate must live at the caller:

```ts
const shouldFetchThread =
  showReplies && comment.reply_count > 0 && showRepliesExpanded && comment.parent_id === null
const { data: replies = [], isLoading: isLoadingReplies } = useCommentThread(
  shouldFetchThread ? comment.id : null,
) as unknown as { data: CommentWithDetails[]; isLoading: boolean }
```

The hook already returns `Promise.resolve(null)` when `commentId` is null (with `enabled: Boolean(commentId)`), so passing `null` cleanly disables it. Alternatively, extend the hook signature to accept `options?: { enabled?: boolean }` (47-08's "type at hook source" pattern explicitly allows this).

### CR-02: `useStakeholderTimeline` silently dropped its real API call (regression-by-stubbing)

**File:** `frontend/src/domains/misc/hooks/useStakeholderTimeline.ts:48-72`
**Issue:** Pre-Phase47, the hook called `getStakeholderTimelineApi(stakeholderId, searchParams)` and returned the live `useQuery` result. Phase 47 (commit `a0af1763`) replaced the body with hard-coded `events: []`, `stats: null`, and the underscore-prefixed args `_stakeholderId`, `_params` to silence tsc. The repository function `getStakeholderTimeline` (`misc.repository.ts:51`) is not deleted — it is now dead code. The component `StakeholderInteractionTimeline.tsx` (used at route `/stakeholder-influence`) will render the empty state regardless of which stakeholder is loaded.

Pre-Phase47 the consumer also passed an object as `stakeholderId` (a separate runtime bug), so the feature was already half-broken. But the prior code at least _attempted_ to fetch — Phase 47 acknowledged the brokenness with a concrete stub rather than fixing the actual call shape. This is a regression in intent: there is now no path to live data short of re-implementing the hook.

**Fix:** Either (a) restore the live `useQuery` and align the hook signature with the consumer (`(stakeholderId: string, params?: {...})`) so real data flows again, or (b) delete `getStakeholderTimeline` from the repository and document in `47-EXCEPTIONS.md` that the timeline is stubbed pending feature work. Stubbing without removing the dead repository function leaves the codebase ambiguous about whether the API is intended to be live.

## Warnings

### WR-01: `EMPTY_CONFIGURATION` in `useReportBuilder.ts` ships invalid runtime shape, masked by `as unknown as`

**File:** `frontend/src/domains/misc/hooks/useReportBuilder.ts:110-119`
**Issue:** The stub initializer uses fields that **do not exist** on `ReportConfiguration`:

- `filter_logic: 'and'` — not a field of `ReportConfiguration` (filters is `FilterGroup`, not an array + separate logic flag)
- `sort_order: []` — actual field name is `sorting: ReportSort[]`
- `filters: []` — type expects `FilterGroup` object, not array

The cast `as unknown as ReportConfiguration` (line 119) was introduced to bypass tsc, but the fields are renamed — making the cast a lie. `ReportBuilder.tsx:361` reads `configuration.sorting` and gets `undefined`; line 339 reads `configuration.filters` and gets `[]` instead of a `FilterGroup`. SortingBuilder and FilterBuilder will receive `undefined` / wrong shape.

The whole hook is a stub, so this is not a live UX failure — but the introduction of `as unknown as` made a real shape mismatch invisible to tsc, defeating the point of typing at the source.

**Fix:** Match field names to `ReportConfiguration`:

```ts
const EMPTY_CONFIGURATION: ReportConfiguration = {
  entities: [],
  columns: [],
  filters: { conditions: [], logic: 'and' }, // FilterGroup shape
  groupings: [],
  aggregations: [],
  sorting: [], // not sort_order
  visualization: { type: 'table', config: {} },
}
// Drop the `as unknown as ReportConfiguration` cast — let tsc verify.
```

If `FilterGroup` shape is unclear, look it up in `frontend/src/types/report-builder.types.ts:189-199`.

### WR-02: `BriefingPackGenerator.tsx` lies about TanStack `status` field

**File:** `frontend/src/components/positions/BriefingPackGenerator.tsx:48-52`
**Issue:** The shim asserts:

```ts
status: 'pending' | 'completed' | 'failed' | 'success' | 'error'
```

But `useBriefingPackStatus` returns a TanStack `useQuery` result whose `.status` is the QueryStatus union: `'pending' | 'error' | 'success'`. `'completed'` and `'failed'` are not produced. The `useEffect` at line 63-75 checks `jobStatus.status === 'completed'` and `=== 'failed'` — neither will ever fire. Briefing pack jobs cannot transition the UI from "generating" to "completed".

This is a pre-existing design bug (pre-Phase47 the same mismatch existed implicitly). Phase 47 codified the wrong assumption in a typed shim that _looks_ authoritative.

**Fix:** Either (a) inspect `briefingStatus.data?.status` from the actual repository response (the _server's_ job status, not TanStack's query status), or (b) restore the `enabled: status === 'generating'` polling guard and use `.data` for the success/failure transitions:

```ts
const briefingStatus = useBriefingPackStatus(jobId, {
  enabled: !!jobId && status === 'generating',
})
const job = briefingStatus.data as BriefingPackJob | null | undefined
if (job?.status === 'completed') {
  /* ... */
}
```

### WR-03: `useBriefingPackStatus` lost its `enabled` gate — polling continues after completion

**File:** `frontend/src/components/positions/BriefingPackGenerator.tsx:48`
**Issue:** Pre-Phase47:

```ts
useBriefingPackStatus({ jobId: jobId || '', enabled: !!jobId && status === 'generating' })
```

Post-Phase47:

```ts
useBriefingPackStatus(jobId || '')
```

The hook polls every 3000ms whenever `Boolean(jobId)` is true. Combined with WR-02, the component never sets `setJobId(null)` (the transition to `'completed'`/`'failed'` never fires), so once a job starts, the hook polls indefinitely. Even if WR-02 is fixed, the _initial_ Phase-47 call has lost the `status === 'generating'` gate, so polling will run during all three phases (generating, completed, failed) until the React unmount or jobId reset.

**Fix:** See WR-02 — pass options object once the hook signature is fixed.

### WR-04: `useEntityTemplates` callers void the `enabled` flag, fetching on every mount

**Files:**

- `frontend/src/components/entity-templates/QuickEntryDialog.tsx:101-106`
- `frontend/src/components/entity-templates/useTemplateKeyboardShortcuts.ts:43-47`

**Issue:** Pre-Phase47 the keyboard-shortcut hook called `useEntityTemplates(entityType, { enabled })` so templates only loaded when shortcuts were enabled. Post-Phase47 the call is `useEntityTemplates({ entityType })` with `void enabled` to discard the intent. Templates now load on every mount of every page that renders the keyboard-shortcuts hook (including pages that disable shortcuts entirely).

**Fix:** Extend the hook signature at source:

```ts
export function useEntityTemplates(params?: { entityType?: string; enabled?: boolean }) {
  // ...
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => getEntityTemplatesApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}
```

This is exactly the "type at hook source" approach 47-11 used elsewhere — apply it here too.

### WR-05: `MentionInput` no longer gates user-search on popup visibility

**File:** `frontend/src/components/comments/MentionInput.tsx:74-76`
**Issue:** Pre-Phase47:

```ts
useSearchUsersForMention(mentionQuery, { enabled: showMentionList && mentionQuery.length >= 1 })
```

Post-Phase47:

```ts
void (showMentionList && mentionQuery.length >= 1)
useSearchUsersForMention(mentionQuery)
```

The hook self-gates by `Boolean(query) && length > 0`, so the visibility-gate is lost — searches fire even when the mention popup is closed (e.g., user typed `@` then dismissed the popup but kept typing). Wasteful but not catastrophic because the stub returns `[]` without hitting the network. **However**, when this hook is wired to a real endpoint, behavior will silently degrade.

**Fix:** Same as WR-04 — accept `options?: { enabled?: boolean }` at the hook source; restore the visibility gate at the caller.

### WR-06: Repository `Promise<unknown>` casts to `Promise<DomainType>` lose runtime shape verification

**Files (representative):**

- `frontend/src/domains/audit/hooks/useRetentionPolicies.ts:69, 127, 187, 192, 207, 218, 224`
- `frontend/src/domains/import/hooks/useWebhooks.ts:50, 60`

**Issue:** Multiple hooks cast `getXxx(searchParams) as Promise<DomainType[]>` against repository functions whose signature is `Promise<unknown>`. Examples:

```ts
queryFn: () => getRetentionPoliciesApi(searchParams) as Promise<RetentionPolicy[]>
```

The repository (`audit.repository.ts:67-156`) returns `apiGet(...)` which is opaquely `unknown`. The cast asserts a flat array, but if the API returns paginated `{data, pagination}`, the typed `RetentionPolicy[]` is wrong and consumers iterating `.length` / `.map` will silently misbehave (`.length` undefined, `.map` is not a function). The consumer at `routes/_protected/admin/data-retention.tsx:151,177` does `policies.length`, `statistics.reduce(...)`, etc.

**Fix:** If the API returns an array — verify and remove the cast (let tsc complain so the next person types the repo). If it returns a paginated wrapper, fix the cast to `Promise<{data: RetentionPolicy[]}>` and update consumers. The cast's job is to **reflect runtime**, not impose a wishful shape.

### WR-07: Fallback colors changed for unknown enum values (subtle visual regression)

**File:** `frontend/src/lib/semantic-colors.ts:80-88, 175-183, 226-234, 282-290`
**Issue:** Pre-Phase47 fallbacks pointed at known categories:

```ts
const colors = statusColors[status] ?? statusColors.todo
const colors = priorityColors[priority] ?? priorityColors.medium
```

Post-Phase47:

```ts
const colors = statusColors[status] ?? DEFAULT_STATUS_COLORS // bg-muted
const colors = priorityColors[priority] ?? DEFAULT_PRIORITY_COLORS // bg-primary/10
```

An unknown status used to render as "todo" colors; now renders as muted. Unknown priority used to render as "medium"; now renders as primary-tinted. This is a deliberate, defensive change driven by `noUncheckedIndexedAccess`, but it changes pixel output for any data containing un-enumerated values (legacy rows, partial migrations).

**Fix:** Either acceptable as documented behavior (consider a brief note in `47-EXCEPTIONS.md`) or make the fallback keys explicit:

```ts
const colors = statusColors[status] ?? statusColors.todo! // assert known key
```

The `!` is local and verifiable; the rename to `DEFAULT_STATUS_COLORS` introduces a parallel color set that drifts from the canonical map.

### WR-08: `EmptyState` props mismatch in `DocumentsSection.tsx` — type still requires unused `isRTL`

**File:** `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:126`
**Issue:** The destructure is `({ type})` (no `isRTL`) but the type signature is `{ type?: ...; isRTL: boolean }`. Callers (lines 232, ~286-equivalent) still pass `isRTL={isRTL}`. Other sibling sections (`ActivityTimelineSection`, `CalendarEventsSection`, `KeyContactsSection`) cleanly removed both prop and type. This file is an inconsistent half-revert — and there is also a formatting bug `{ type}:` (missing space).

**Fix:**

```ts
function EmptyState({ type }: { type?: DossierDocumentType | 'all' }) {
```

And drop `isRTL={isRTL}` from the two call sites at lines 232 and 286.

### WR-09: `as unknown as { applyTemplate: ... }` is double-redundant on already-typed hook

**File:** `frontend/src/components/entity-templates/QuickEntryDialog.tsx:108-110`
**Issue:**

```ts
const { applyTemplate } = useApplyTemplate() as unknown as {
  applyTemplate: (template: EntityTemplate) => Record<string, unknown>
}
```

The hook's actual return type (`useEntityTemplates.ts:107-113`) is exactly `{ applyTemplate: (template: EntityTemplate) => Record<string, unknown> }`. The cast is leftover from a prior-shape shim; it now hides any future drift in the hook signature.

**Fix:** Drop the cast entirely.

### WR-10: `as any` casts re-introduced in `CalendarSyncSettings.tsx` despite stub re-typing

**File:** `frontend/src/components/calendar/CalendarSyncSettings.tsx:755, 791`
**Issue:** The new `useCalendarSync` stub types `updateConnection(id, updates: Record<string, unknown>)` and `updateICalFeed(id, updates: Record<string, unknown>)` — both accept `Record<string, unknown>`. Caller passes `(updates) => updateConnection(connection.id, updates as any)`. The `as any` is unnecessary (project rule bans `any`; these are `Record<string, unknown>` already). Caller is leftover from when the stub was a `useMutation` requiring different shape.

**Fix:** Remove `as any`:

```ts
onUpdateSettings={(updates) => updateConnection(connection.id, updates)}
```

### WR-11: `void (isExpanded ? connection.id : undefined)` dead expression in CalendarSyncSettings

**File:** `frontend/src/components/calendar/CalendarSyncSettings.tsx:153-155`
**Issue:** Three lines with a comment explaining "we discard the (connectionId, isExpanded) intent" followed by a `void` expression that does nothing. This is leftover scaffolding from satisfying `noUnusedLocals`. It is now noise — `connection.id` is consumed plenty of times below; the `isExpanded` discard is meaningless.

**Fix:** Delete lines 153-155 entirely. `connection.id` is used at line 754 (`disconnectProvider(connection.id)`) and line 753 (`triggerSync({connection_id: connection.id})`), so the discard is unnecessary.

### WR-12: `applicationServerKey.buffer as ArrayBuffer` cast is unnecessary; the original `Uint8Array` was valid

**File:** `frontend/src/services/push-subscription.ts:75`
**Issue:** The Push API's `applicationServerKey` accepts `BufferSource` (i.e., `ArrayBuffer | ArrayBufferView`). A `Uint8Array` is an `ArrayBufferView` and was a perfectly valid argument before Phase 47. The change to `applicationServerKey.buffer as ArrayBuffer` reaches into the underlying buffer and asserts `ArrayBuffer` (TS lib types `.buffer` as `ArrayBufferLike`, which includes `SharedArrayBuffer`). For a freshly-allocated `new Uint8Array(n)`, `.buffer` is correct, so this works at runtime — but the cast is awkward and the original code was clearer.

**Fix:** Investigate the original tsc error and prefer fixing it without the buffer-extraction:

```ts
applicationServerKey: applicationServerKey as BufferSource,
```

Or upgrade the lib types if a DOM-types version mismatch was the trigger.

### WR-13: Non-null assertions in `CommandPalette.tsx` after typeguard

**File:** `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:575-576`
**Issue:**

```ts
return DOSSIER_TYPE_ORDER.filter((type) => grouped[type] != null && grouped[type]!.length > 0).map(
  (type) => ({ type, items: grouped[type]!.slice(0, 5) }),
)
```

The `!` non-null assertions appear because TS's narrowing through `Array.filter` does not propagate. Acceptable, but a local variable is safer:

```ts
return DOSSIER_TYPE_ORDER.map((type) => ({ type, items: grouped[type] ?? [] }))
  .filter((entry) => entry.items.length > 0)
  .map(({ type, items }) => ({ type, items: items.slice(0, 5) }))
```

This avoids `!` entirely.

### WR-14: Hook-source typing on `useStakeholderInfluenceList` stub uses lossy `Record<string, unknown>` queryKey

**File:** `frontend/src/domains/misc/hooks/useStakeholderInfluence.ts:96-105`
**Issue:** `useStakeholderInfluenceList(params?: Record<string, unknown>)` produces queryKey `[...all, 'list', params]`. Two callers passing semantically different filters (`{type: 'org'}` vs `{type: 'country'}`) will create distinct cache keys (good), but a caller passing the **same logical filter** as different object identities (e.g., a fresh literal each render) will produce keyset misses for what should be the same data. TanStack uses structural equality on queryKeys, so object literals are fine — but the `Record<string, unknown>` widening means tsc won't catch a typo like `{ tipe: 'org' }` (silent miss).

**Fix:** Extend the params type to a discriminated shape (`Pick<StakeholderFilters, 'type' | 'limit'>` or similar) at the hook source. The 47-08 charter explicitly endorses this.

---

## Findings Not Reviewed (out of v1 scope)

- Performance issues from N+1 patterns introduced by gate-removals (CR-01, WR-04, WR-05) are flagged as correctness/regression issues, not pure perf — they reach into "correctness of behavior under load."
- The numerous `as Promise<DomainType>` casts (WR-06) are acceptable boundary casts at the repository → hook seam **only if** the underlying repo returns the asserted shape. Verifying that requires running each endpoint, which is out of scope.
- `setupConnectionMonitoring` in `services/realtime.ts:236-300` retains a pre-existing bug where `reconnect` does not preserve the original `filter` config — but Phase 47 did not modify this code path.

## What Phase 47 Did Well

- Suppression discipline: 0 net-new `@ts-ignore`/`@ts-expect-error`; `@ts-nocheck` only on auto-generated `database.types.ts` and `routeTree.gen.ts`.
- Aggressive deletion of dead code (754 files, ~100k lines net). Several deletions verified to have zero call sites (`useDossierStoreState`, `useFieldPermission`, `useDuplicateCandidate`, `useDuplicateCandidatesInfinite`, `getRelationshipsForContactDirect`, `getIntelligenceByType`, `fetchWorkItemsRPC`, `formatBytes`, `generateUserColor`, `getFileIcon`).
- Removal of emoji-laden helper `getFileIcon` from `services/upload.ts` and color-hex helper `generateUserColor` from `lib/utils.ts` — both violated CLAUDE.md design rules.
- Migration of typed-shims from component files into hook-source signatures (47-11 retired 19 component-side shims) — directionally correct, even where individual shims (CR-01, WR-03, WR-04, WR-05) lost runtime guards in the move.
- `toArDigits.ts` defensive `?? d` fallback for `noUncheckedIndexedAccess`.
- `EnhancedSearchAction` replaced an unreadable conditional-type ladder.
- Realtime `services/realtime.ts` channel-cleanup contract (subscribe/unsubscribe/unsubscribeAll, beforeunload teardown) preserved unchanged.

---

_Reviewed: 2026-05-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
