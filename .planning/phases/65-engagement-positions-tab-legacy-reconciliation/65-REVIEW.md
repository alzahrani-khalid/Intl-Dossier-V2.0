---
phase: 65-engagement-positions-tab-legacy-reconciliation
reviewed: 2026-06-12T21:32:36Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - frontend/src/components/dossier/AddToDossierDialogs.tsx
  - frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx
  - frontend/src/components/workspace/WorkspaceShell.tsx
  - frontend/src/components/workspace/WorkspaceTabNav.tsx
  - frontend/src/hooks/useEngagementCalendarEntries.ts
  - frontend/src/i18n/ar/positions.json
  - frontend/src/i18n/ar/workspace.json
  - frontend/src/i18n/en/positions.json
  - frontend/src/i18n/en/workspace.json
  - frontend/src/pages/engagements/workspace/CalendarTab.tsx
  - frontend/src/pages/engagements/workspace/ContextTab.tsx
  - frontend/src/pages/engagements/workspace/DocsTab.tsx
  - frontend/src/pages/engagements/workspace/OverviewTab.tsx
  - frontend/src/pages/engagements/workspace/TasksTab.tsx
  - frontend/src/pages/engagements/workspace/__tests__/CalendarTabCtas.test.tsx
  - frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx
  - frontend/src/pages/engagements/workspace/__tests__/RemovedCtas.test.tsx
  - frontend/src/routes/_protected/engagements/$engagementId/positions.tsx
  - frontend/src/routeTree.gen.ts
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 65: Code Review Report

**Reviewed:** 2026-06-12T21:32:36Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the engagement Positions tab mount, workspace CTA reconciliation (re-enabled Create task / Add event, removed unwireable CTAs), the scheduled-events reader hook, the i18n bundles, and the three new test suites. Cross-contracts that the phase depends on were traced end-to-end and verified:

- **No dangling imports** to the 5 deleted modules (`EngagementDossierDetail`, `BriefingPackGenerator`, `EngagementPositionsSection`, `PositionSuggestionsPanel`, `useEngagementPositions`) anywhere in `frontend/src` or `backend/src`. Remaining matches are only in the git-ignored `.understand-anything/` cache.
- **`routeTree.gen.ts` contains the route**: `/_protected/engagements/$engagementId/positions` is registered (import line 140, route entry lines 3506-3509), consistent with the 36199591 restore commit.
- **`supabase/functions/engagements-positions-{attach,detach,list}` diffs are comment-only** DEPRECATED headers (21 insertions, 0 deletions vs the phase base).
- **Calendar reader/writer contract holds**: `calendar-create` maps `linked_item_type: 'dossier'` (not in `ALLOWED_LINKED_TYPES`) to the `dossier_id` column and splits `start_datetime` into `event_date`/`event_time` — exactly the columns and filter `useEngagementCalendarEntries` reads. `EventDialog` invalidates `['engagement-calendar-entries', dossier_id]`, matching the hook's key verbatim.
- **Positions attach contract holds**: `useDossierPositionLinks` keys on `['dossier-position-links', dossierId, filters]`; `DossierPositionsTab` prefix-invalidates `['dossier-position-links', dossierId]` — a correct prefix match.
- **i18n `calendar:types.*` lookups resolve**: all 13 entry-type keys (incl. `internal_meeting`, `review`) exist in both `en/calendar.json` and `ar/calendar.json`; the `calendar` and `workspace` namespaces are registered in `src/i18n/index.ts`.
- The 65-03 `engagement_section` i18n sweep removed the block symmetrically from EN and AR.

The remaining findings are below. The most significant is the recorded-but-only-partially-mitigated kanban data-plane gap (WR-01/WR-02), plus one EN/AR key-parity gap reachable from the new Positions tab (WR-03).

## Warnings

### WR-01: TasksTab masks kanban fetch errors as the "No tasks yet" empty state

**Status:** fixed — commit `7ae3cac9`. TasksTab now destructures `error` and renders a `role="alert"` danger-token line (`error.tabLoad`, existing EN+AR keys) before the empty branch. The OverviewTab Task Progress card had the same masked shape and the fix there was small and contained (one ternary branch in the card), so it was applied in the same commit rather than deferred. Error-state test added to `CreateTaskCtas.test.tsx`.

**File:** `frontend/src/pages/engagements/workspace/TasksTab.tsx:48,140`
**Issue:** `useEngagementKanban` returns an `error` field, but TasksTab destructures only `{ columns, stats, handleDragEnd, isLoading }`. On any fetch failure, `isLoading` becomes false and `columns` stays undefined, so `isEmpty = !isLoading && (stats.total === 0 || !columns)` evaluates true and the tab renders the **empty state** ("No tasks yet" + Create task CTA) instead of an error. This is not theoretical: the phase's own 65-04 summary records that `engagements-kanban-get` validates against the legacy `engagements` table and **404s for canonical engagements without a legacy twin** — for those engagements this tab will permanently display "No tasks yet" while the fetch is hard-failing. `OverviewTab.tsx:116` has the same masked-error shape (Task Progress silently shows 0%/0/0 on error). The `error.tabLoad` key already exists in both workspace bundles and is unused here.
**Fix:**

```tsx
const { columns, stats, handleDragEnd, isLoading, error } = useEngagementKanban(engagementId, sortBy)
...
if (error) {
  return (
    <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
      {t('error.tabLoad')}
    </div>
  )
}
```

### WR-02: Created tasks never appear on the kanban board; populated-board path has no honesty mitigation

**Status:** fixed — commit `492656b3`. The comment now states the truth: the invalidation only refetches the board and cannot surface the new task (tasks-row write vs legacy `assignments` reader) until kanban canonicalization (T-65-11); the created task appears in the main tasks list. No copy change was required on the populated-board path: the success toast ("Task created successfully") makes no board claim, and the empty-state body already directs users to the main tasks list. Kanban canonicalization itself remains T-65-11 (not attempted here).

**File:** `frontend/src/components/dossier/AddToDossierDialogs.tsx:364-370`, `frontend/src/pages/engagements/workspace/TasksTab.tsx:218-229`
**Issue:** Traced end-to-end: `TaskDialog` → `tasks-create` inserts only a `tasks` row with `engagement_id: null` (the dialog intentionally posts none) plus a `work_item_dossiers` link; no migration trigger creates an `assignments` row; `engagements-kanban-get` reads `assignments` filtered `.eq('engagement_id', engagementId)`. Therefore a task created from the workspace **will never render on the board the user just created it from** — the `['engagement-kanban', engagementId]` invalidation refetches identical data. The phase recorded this caveat (T-65-11) and mitigated the **empty-state** path via the honest `empty.tasks.body` copy, but the **header "Create task" on a populated board** (disposition #5) has zero signal: success toast fires, board is unchanged, and the feature reads as broken. The code comment at AddToDossierDialogs.tsx:364-367 ("so a task created from the workspace refreshes the board") overstates what the invalidation achieves today.
**Fix:** Until T-65-11 reconciles the kanban reader onto `tasks`/`work_item_dossiers`, surface the same honesty on the populated-board path — e.g. an engagement-context success toast ("Task created — it appears in the main tasks list") or an inline note near the header CTA; and reword the comment to state the invalidation is a forward-compat no-op until the data planes are reconciled.

### WR-03: EN/AR key-parity gap — `positions:status.review` exists only in EN

**Status:** fixed — commit `393fa73d`. AR `status.review` ("قيد المراجعة") added. EN/AR `status.*` key parity verified: both bundles carry exactly `draft`, `under_review`, `review`, `approved`, `published`, `unpublished`.

**File:** `frontend/src/i18n/en/positions.json:235`, `frontend/src/i18n/ar/positions.json:203-208`
**Issue:** EN carries `status.review: "Under Review"` (a safety alias for the dynamic lookup) but AR has no `status.review`. `AttachPositionDialog.tsx:295` renders `t(`positions:status.${previewPosition.status}`)` dynamically — and this dialog is now mounted on the new engagement Positions tab. A position whose status is `review` renders "Under Review" in EN but silently falls back to English in AR (the exact recurring pitfall this project has documented: looks fine in EN, breaks AR). This asymmetry predates phase 65, but the phase put a new high-traffic surface in front of it and the file is in scope.
**Fix:** Add to the AR `status` block (line 204):

```json
"review": "قيد المراجعة",
```

### WR-04: TaskDialog/IntakeDialog partial failure shows a full-failure toast and invites duplicate creation

**Status:** fixed (TaskDialog only) — commit `6403633a`. The link write now has its own catch (NewPositionDialog phase-64 precedent): a link failure after a successful create closes/resets the dialog and shows a distinct warning toast (`addToDossier.error.taskLinkOnly`, new EN+AR keys) so resubmission cannot duplicate the task. Invalidation failures after both writes fall through to the success path. Partial-failure contract test added. **Scope decision:** IntakeDialog has the same pre-existing shape but was not modified this phase — left untouched, tracked by this finding's record for a future pass.

**File:** `frontend/src/components/dossier/AddToDossierDialogs.tsx:345-379` (TaskDialog), `:212-233` (IntakeDialog)
**Issue:** In `handleSubmit`, the create call and the `work_item_dossiers` link write share one `try/catch`. If `createTask.mutateAsync` succeeds but `createLinks.mutateAsync` rejects, the catch fires `toast.error(t('addToDossier.error.task'))` — a full-failure message — while the task **was** created (orphaned, unlinked to the dossier/engagement). The dialog stays open with the form populated; the natural user response is to resubmit, producing a duplicate task. CommitmentDialog (line 519-522) at least documents the ambiguity in a comment; Task and Intake do not. This pattern predates the phase, but `TaskDialog.handleSubmit` was modified this phase (kanban invalidation added inside the same block) and TaskDialog is now the primary CTA on two workspace tabs.
**Fix:** Split the failure domains: catch the link write separately, toast a distinct partial message (e.g. "Task created but not linked to this dossier"), and close/reset the dialog so resubmission cannot duplicate the work item:

```tsx
const result = await createTask.mutateAsync({...})  // outer try → error.task
if (result?.id) {
  try {
    await createLinks.mutateAsync(buildDossierLinkPayload('task', result.id, dossierContext))
  } catch {
    toast.warning(t('addToDossier.error.taskLinkOnly'))  // new key, EN+AR
  }
  ...invalidations
}
```

## Info

### IN-01: ScheduledEventsSection renders an empty bordered box while loading

**File:** `frontend/src/pages/engagements/workspace/CalendarTab.tsx:371-376`
**Issue:** The branch chain is `hasError → error line`, `!isLoading && entries.length === 0 → empty line`, else `→ bordered divided list`. While `isLoading` is true with zero entries, the else branch renders `<div className="rounded-md border divide-y">` with no rows — a visible empty bordered box flashes under the "Scheduled events" heading on every tab load.
**Fix:** Add a loading branch (skeleton row or spinner) before the list branch.

### IN-02: Dead workspace.json keys left behind by the CTA removals

**File:** `frontend/src/i18n/en/workspace.json:28,32` (+ `docs.upload:18`, `empty.context.action:71`), mirrored in `frontend/src/i18n/ar/workspace.json`
**Issue:** After 65-02 removed the Transition Stage, Link Dossier, and Upload CTAs, `actions.transitionStage`, `actions.linkDossier`, `docs.upload`, and `empty.context.action` have zero non-test consumers (verified by grep). The RemovedCtas tests assert on the key _strings_, not the JSON entries, so the entries are removable.
**Fix:** Delete the four keys from both bundles, or annotate why they are retained.

### IN-03: Hardcoded bilingual literals bypass i18n across the workspace tabs

**File:** `frontend/src/pages/engagements/workspace/ContextTab.tsx:53-70,173-175,224-226,239-241,268-269,286-288,303-305`; `OverviewTab.tsx:71-72,271,312,322,325`; `CalendarTab.tsx:109-124,314-328`
**Issue:** Numerous `isRTL ? '<arabic>' : '<english>'` literals (some as `\uXXXX` escapes) instead of workspace-namespace keys. Pre-existing pattern, but it sits oddly in a phase that added an i18n key-parity test, and it makes future copy edits drift-prone (the parity test cannot see these strings).
**Fix:** Migrate the literals into `workspace.json` (EN+AR) opportunistically when these files are next touched.

### IN-04: Type-erasing casts mask contract drift

**File:** `frontend/src/pages/engagements/workspace/CalendarTab.tsx:197`, `OverviewTab.tsx:378`, `TasksTab.tsx:74`, `frontend/src/components/dossier/AddToDossierDialogs.tsx:197-200`, `frontend/src/hooks/useEngagementCalendarEntries.ts:70,79`
**Issue:** `dossier as Parameters<typeof TaskDialog>[0]['dossier']` (×3) papers over the type mismatch between `useDossier`'s row and the dialogs' `Dossier` prop — safe only while the prop stays documented-unused (`dossier: _dossier`); if a dialog starts reading it, the compiler will not catch the mismatch. `useCreateTicket() as unknown as {...}` double-casts away the mutation contract entirely. `(rows ?? []) as EngagementCalendarEntry[]` and `error as Error | null` are unvalidated casts of external data (the same cast class behind the prior `invoke<T>` timeline crash, though low-risk here given the explicit column select).
**Fix:** Make the dialogs' `dossier` prop optional (it is unused), removing the three casts; type `useCreateTicket`'s return at the hook; keep the hook casts but note the column-select dependency.

### IN-05: Locale-formatting inconsistencies in counts and dates

**File:** `frontend/src/pages/engagements/workspace/TasksTab.tsx:188`, `CalendarTab.tsx:73`, `DocsTab.tsx:58`
**Issue:** TasksTab renders `{stats.total}` raw while OverviewTab formats the same stats via `Intl.NumberFormat(toFormatLocale(locale))`. CalendarTab's header `dateFormatter` and DocsTab's `formatBriefDate` use raw `'ar-SA'` while the phase's new `entryDateFormatter` correctly routes through `toFormatLocale` (the round-11 digit-rendering fact). Mixed digit systems can appear on the same screen in AR.
**Fix:** Route all three through `toFormatLocale` for consistency.

### IN-06: CalendarTabCtas.test mutates the module registry mid-suite

**File:** `frontend/src/pages/engagements/workspace/__tests__/CalendarTabCtas.test.tsx:186-250`
**Issue:** The hook-shape test calls `vi.doUnmock` + `vi.resetModules` + dynamic imports inside the test body, then re-establishes the stub and resets modules again at the end. It currently works only because `CalendarTab` is statically imported (line 145) before any test runs, so the registry reset cannot reach the tab tests' bindings — an implicit ordering invariant that is easy to break (e.g. converting the import to dynamic, or vitest isolation changes). The dynamically re-imported second copy of `@testing-library/react` is a further fragility.
**Fix:** Move the hook-shape test into its own test file (e.g. `useEngagementCalendarEntries.test.tsx`) where the supabase mock can be a plain top-level `vi.mock`.

---

_Reviewed: 2026-06-12T21:32:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
