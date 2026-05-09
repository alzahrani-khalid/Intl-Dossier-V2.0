---
phase: 47-type-check-zero
reviewed: 2026-05-09T18:30:00Z
depth: standard
files_reviewed: 323
files_reviewed_list:
  - .github/workflows/ci.yml
  - backend/package.json
  - backend/src/api/after-action.ts
  - backend/src/jobs/refresh-health-scores.job.ts
  - backend/src/lib/sentry.ts
  - backend/src/queues/digest-scheduler.ts
  - backend/src/services/__tests__/auth.service.test.ts
  - backend/src/types/contact-directory.types.ts
  - backend/src/types/database.types.ts
  - backend/src/middleware/optimistic-locking.ts
  - backend/src/services/tasks.service.ts
  - frontend/package.json
  - frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx
  - frontend/src/components/attachment-uploader/AttachmentUploader.tsx
  - frontend/src/components/audit-logs/AuditLogExport.tsx
  - frontend/src/components/audit-logs/AuditLogFilters.tsx
  - frontend/src/components/audit-logs/AuditLogStatistics.tsx
  - frontend/src/components/availability-polling/AvailabilityPollCreator.tsx
  - frontend/src/components/availability-polling/AvailabilityPollResults.tsx
  - frontend/src/components/availability-polling/AvailabilityPollVoter.tsx
  - frontend/src/components/calendar/CalendarSyncSettings.tsx
  - frontend/src/components/collaboration/ConflictResolutionDialog.tsx
  - frontend/src/components/collaboration/EditingLockIndicator.tsx
  - frontend/src/components/comments/CommentForm.tsx
  - frontend/src/components/comments/CommentItem.tsx
  - frontend/src/components/comments/MentionInput.tsx
  - frontend/src/components/comments/ReactionPicker.tsx
  - frontend/src/components/commitments/StatusDropdown.tsx
  - frontend/src/components/compliance/ComplianceRulesManager.tsx
  - frontend/src/components/compliance/ComplianceSignoffDialog.tsx
  - frontend/src/components/compliance/ComplianceViolationAlert.tsx
  - frontend/src/components/contacts/ContactList.tsx
  - frontend/src/components/dashboard-widgets/BenchmarkPreview.tsx
  - frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx
  - frontend/src/components/dossier/AddToDossierDialogs.tsx
  - frontend/src/components/dossier/CountryMapImage.tsx
  - frontend/src/components/dossier/DossierLoadingSkeletons.tsx
  - frontend/src/components/dossier/DossierTypeGuide.tsx
  - frontend/src/components/dossier/DossierTypeSelector.tsx
  - frontend/src/components/dossier/MiniRelationshipGraph.tsx
  - frontend/src/components/dossier/RelationshipSidebar.tsx
  - frontend/src/components/dossier/TopicDossierDetail.tsx
  - frontend/src/components/dossier/UniversalDossierCard.tsx
  - frontend/src/components/dossier/dossier-overview/DossierOverview.tsx
  - frontend/src/components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/KeyContactsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/RelatedDossiersSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx
  - frontend/src/components/dossier/index.ts
  - frontend/src/components/dossier/sections/DecisionLogs.tsx
  - frontend/src/components/dossier/sections/InteractionHistory.tsx
  - frontend/src/components/dossier/sections/MeetingSchedule.tsx
  - frontend/src/components/dossier/sections/OrganizationAffiliations.tsx
  - frontend/src/components/dossier/sections/PositionsHeld.tsx
  - frontend/src/components/dossiers/CustomNodes.tsx
  - frontend/src/components/dossiers/RelationshipGraph.tsx
  - frontend/src/components/duplicate-comparison/DuplicateComparison.tsx
  - frontend/src/components/duplicate-detection/MergeDialog.tsx
  - frontend/src/components/edit-approval-flow/EditApprovalFlow.tsx
  - frontend/src/components/empty-states/ContextualSuggestions.tsx
  - frontend/src/components/empty-states/index.ts
  - frontend/src/components/engagement-recommendations/RecommendationCard.tsx
  - frontend/src/components/engagement-recommendations/RecommendationsPanel.tsx
  - frontend/src/components/entity-links/LinkTypeBadge.tsx
  - frontend/src/components/entity-templates/QuickEntryDialog.tsx
  - frontend/src/components/entity-templates/TemplateSelector.tsx
  - frontend/src/components/entity-templates/useTemplateKeyboardShortcuts.ts
  - frontend/src/components/export-import/ExportDialog.tsx
  - frontend/src/components/export-import/ImportDialog.tsx
  - frontend/src/components/forms/AutoSaveFormWrapper.tsx
  - frontend/src/components/forms/ContextualHelp.tsx
  - frontend/src/components/forms/FormErrorDisplay.tsx
  - frontend/src/components/forms/FormFieldGroup.tsx
  - frontend/src/components/forms/ValidationIndicator.tsx
  - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
  - frontend/src/components/layout/EntityBreadcrumbTrail.tsx
  - frontend/src/components/modern-nav/navigationData.ts
  - frontend/src/components/multilingual/ContentLanguageSelector.tsx
  - frontend/src/components/notifications/PushOptInBanner.tsx
  - frontend/src/components/onboarding/OnboardingChecklist.tsx
  - frontend/src/components/onboarding/OnboardingEmptyState.tsx
  - frontend/src/components/positions/BriefingPackGenerator.tsx
  - frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx
  - frontend/src/components/progressive-disclosure/ProgressiveHint.tsx
  - frontend/src/components/relationships/AdvancedGraphVisualization.tsx
  - frontend/src/components/relationships/EnhancedGraphVisualization.tsx
  - frontend/src/components/relationships/GraphVisualization.tsx
  - frontend/src/components/relationships/TouchOptimizedGraphControls.tsx
  - frontend/src/components/report-builder/ReportBuilder.tsx
  - frontend/src/components/responsive/responsive-table.tsx
  - frontend/src/components/search/DossierFirstSearchResults.tsx
  - frontend/src/components/search/DossierSearchFilters.tsx
  - frontend/src/components/settings/SettingsSectionCard.tsx
  - frontend/src/components/sla-countdown/SLACountdown.tsx
  - frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx
  - frontend/src/components/stakeholder-influence/InfluenceReport.tsx
  - frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx
  - frontend/src/components/stakeholder-timeline/StakeholderTimelineCard.tsx
  - frontend/src/components/step-up-mfa/StepUpMFA.tsx
  - frontend/src/components/tags/TagAnalytics.tsx
  - frontend/src/components/tags/TagHierarchyManager.tsx
  - frontend/src/components/tags/TagSelector.tsx
  - frontend/src/components/tasks/ContributorsList.tsx
  - frontend/src/components/tasks/SLAIndicator.tsx
  - frontend/src/components/timeline/TimelineAnnotationDialog.tsx
  - frontend/src/components/triage-panel/TriagePanel.tsx
  - frontend/src/components/ui/content-skeletons.tsx
  - frontend/src/components/unified-kanban/utils/status-transitions.ts
  - frontend/src/components/validation/validation-badge.tsx
  - frontend/src/components/waiting-queue/EscalationDialog.tsx
  - frontend/src/components/waiting-queue/FilterPanel.tsx
  - frontend/src/components/work-creation/hooks/useGlobalKeyboard.ts
  - frontend/src/components/workflow-automation/WorkflowExecutionsList.tsx
  - frontend/src/components/workflow-automation/WorkflowRulesList.tsx
  - frontend/src/components/workflow-automation/WorkflowTestDialog.tsx
  - frontend/src/contexts/ChatContext.tsx
  - frontend/src/design-system/tokens/applyTokens.ts
  - frontend/src/domains/ai/hooks/useAIFieldAssist.ts
  - frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts
  - frontend/src/domains/analytics/hooks/useOrganizationBenchmarks.ts
  - frontend/src/domains/audit/hooks/useAuditLogs.ts
  - frontend/src/domains/audit/hooks/useComplianceRules.ts
  - frontend/src/domains/audit/hooks/useRetentionPolicies.ts
  - frontend/src/domains/audit/repositories/audit.repository.ts
  - frontend/src/domains/briefings/hooks/useBriefingPackStatus.ts
  - frontend/src/domains/briefings/hooks/useCalendarSync.ts
  - frontend/src/domains/briefings/hooks/useGenerateBriefingPack.ts
  - frontend/src/domains/briefings/index.ts
  - frontend/src/domains/calendar/hooks/useRecurringEvents.ts
  - frontend/src/domains/documents/hooks/useExportData.ts
  - frontend/src/domains/documents/repositories/documents.repository.ts
  - frontend/src/domains/engagements/hooks/useEngagements.ts
  - frontend/src/domains/import/hooks/useAvailabilityPolling.ts
  - frontend/src/domains/import/hooks/useImportData.ts
  - frontend/src/domains/import/hooks/useWebhooks.ts
  - frontend/src/domains/intake/hooks/useIntakeApi.ts
  - frontend/src/domains/intake/hooks/useQueueFilters.ts
  - frontend/src/domains/intake/hooks/useWaitingQueueActions.ts
  - frontend/src/domains/intake/repositories/intake.repository.ts
  - frontend/src/domains/misc/hooks/useComments.ts
  - frontend/src/domains/misc/hooks/useMultiLangContent.ts
  - frontend/src/domains/misc/hooks/useOnboardingChecklist.ts
  - frontend/src/domains/misc/hooks/useProgressiveDisclosure.ts
  - frontend/src/domains/misc/hooks/usePullToRefresh.ts
  - frontend/src/domains/misc/hooks/useReportBuilder.ts
  - frontend/src/domains/misc/hooks/useSampleData.ts
  - frontend/src/domains/misc/hooks/useScenarioSandbox.ts
  - frontend/src/domains/misc/hooks/useStakeholderInfluence.ts
  - frontend/src/domains/misc/hooks/useStakeholderTimeline.ts
  - frontend/src/domains/misc/repositories/misc.repository.ts
  - frontend/src/domains/persons/hooks/usePersons.ts
  - frontend/src/domains/relationships/hooks/useCreateRelationship.ts
  - frontend/src/domains/relationships/hooks/useRelationships.ts
  - frontend/src/domains/search/hooks/useEnhancedSearch.ts
  - frontend/src/domains/shared/types/result.ts
  - frontend/src/domains/tags/hooks/useContextualSuggestions.ts
  - frontend/src/domains/tags/hooks/useEntityTemplates.ts
  - frontend/src/domains/tags/hooks/useTagHierarchy.ts
  - frontend/src/domains/topics/hooks/useTopics.ts
  - frontend/src/domains/work-items/hooks/useSLAMonitoring.ts
  - frontend/src/domains/work-items/hooks/useUpdateSuggestionAction.ts
  - frontend/src/domains/work-items/hooks/useWorkflowAutomation.ts
  - frontend/src/hooks/useActivityFeed.ts
  - frontend/src/hooks/useAddToDossierActions.tsx
  - frontend/src/hooks/useAfterAction.ts
  - frontend/src/hooks/useAutoSaveForm.ts
  - frontend/src/hooks/useBriefingBooks.ts
  - frontend/src/hooks/useCalendarSync.ts
  - frontend/src/hooks/useCommitmentDeliverables.ts
  - frontend/src/hooks/useContactRelationships.ts
  - frontend/src/hooks/useContributors.ts
  - frontend/src/hooks/useDelegation.ts
  - frontend/src/hooks/useDossierContext.ts
  - frontend/src/hooks/useDossierOverview.ts
  - frontend/src/hooks/useDossierPresence.ts
  - frontend/src/hooks/useDuplicateDetection.ts
  - frontend/src/hooks/useEditWorkflow.ts
  - frontend/src/hooks/useEmailNotifications.ts
  - frontend/src/hooks/useEntityComparison.ts
  - frontend/src/hooks/useEntityLinks.ts
  - frontend/src/hooks/useEntityNavigation.ts
  - frontend/src/hooks/useEntitySearch.ts
  - frontend/src/hooks/useFieldPermissions.ts
  - frontend/src/hooks/useFieldValidation.ts
  - frontend/src/hooks/useForums.ts
  - frontend/src/hooks/useGeographicVisualization.ts
  - frontend/src/hooks/useIntelligence.ts
  - frontend/src/hooks/useInteractions.ts
  - frontend/src/hooks/useKeyboardShortcuts.ts
  - frontend/src/hooks/useLanguage.ts
  - frontend/src/hooks/useLastSyncInfo.ts
  - frontend/src/hooks/useLegislation.ts
  - frontend/src/hooks/useMeetingMinutes.ts
  - frontend/src/hooks/useMilestonePlanning.ts
  - frontend/src/hooks/useNotificationCenter.ts
  - frontend/src/hooks/useOCR.ts
  - frontend/src/hooks/useOfflineState.ts
  - frontend/src/hooks/useOptimisticLocking.ts
  - frontend/src/hooks/usePersonDossiers.ts
  - frontend/src/hooks/usePreviewLayouts.ts
  - frontend/src/hooks/usePullToRefresh.ts
  - frontend/src/hooks/useRecentNavigation.ts
  - frontend/src/hooks/useScheduledReports.ts
  - frontend/src/hooks/useTasks.ts
  - frontend/src/hooks/useTeamCollaboration.ts
  - frontend/src/hooks/useTopics.ts
  - frontend/src/hooks/useUnifiedWork.ts
  - frontend/src/hooks/useViewPreferences.ts
  - frontend/src/hooks/useWorkingGroups.ts
  - frontend/src/lib/auth-utils.ts
  - frontend/src/lib/country-codes.ts
  - frontend/src/lib/dossier-type-guards.ts
  - frontend/src/lib/i18n/toArDigits.ts
  - frontend/src/lib/plugin-system/plugins/project-plugin/types.ts
  - frontend/src/lib/plugin-system/types/plugin.types.ts
  - frontend/src/lib/plugin-system/utils/createPlugin.ts
  - frontend/src/lib/query-client.ts
  - frontend/src/lib/semantic-colors.ts
  - frontend/src/lib/sentry.ts
  - frontend/src/lib/utils.ts
  - frontend/src/lib/validation-rules.ts
  - frontend/src/pages/Countries.tsx
  - frontend/src/pages/Organizations.tsx
  - frontend/src/pages/WaitingQueue.tsx
  - frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
  - frontend/src/pages/audit-logs/AuditLogsPage.tsx
  - frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx
  - frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx
  - frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx
  - frontend/src/pages/engagements/EngagementDetailPage.tsx
  - frontend/src/pages/engagements/workspace/CalendarTab.tsx
  - frontend/src/pages/webhooks/WebhooksPage.tsx
  - frontend/src/routes/_protected/admin/data-retention.tsx
  - frontend/src/routes/_protected/dossiers/$id.overview.tsx
  - frontend/src/routes/_protected/dossiers/countries/index.tsx
  - frontend/src/routes/_protected/dossiers/organizations/index.tsx
  - frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx
  - frontend/src/routes/_protected/dossiers/topics/-TopicsListPage.tsx
  - frontend/src/routes/_protected/my-work/index.tsx
  - frontend/src/routes/_protected/scenario-sandbox.tsx
  - frontend/src/routes/_protected/stakeholder-influence.tsx
  - frontend/src/services/auth.ts
  - frontend/src/services/commitments.service.ts
  - frontend/src/services/contact-api.ts
  - frontend/src/services/contact-relationship-api.ts
  - frontend/src/services/dossier-api.ts
  - frontend/src/services/dossier-export.service.ts
  - frontend/src/services/entity-links-api.ts
  - frontend/src/services/export-api.ts
  - frontend/src/services/intelligence-api.ts
  - frontend/src/services/interaction-api.ts
  - frontend/src/services/offline-queue.ts
  - frontend/src/services/preference-sync.ts
  - frontend/src/services/push-subscription.ts
  - frontend/src/services/realtime.ts
  - frontend/src/services/search-api.ts
  - frontend/src/services/unified-dossier-activity.service.ts
  - frontend/src/services/unified-work.service.ts
  - frontend/src/services/upload.ts
  - frontend/src/services/user-management-api.ts
  - frontend/src/store/dossierStore.ts
  - frontend/src/store/pinnedEntitiesStore.ts
  - frontend/src/store/uiStore.ts
  - frontend/src/types/database.types.ts
  - frontend/src/types/dossier-export.types.ts
  - frontend/src/types/report-builder.types.ts
  - frontend/src/utils/broadcast/preference-broadcast.ts
  - frontend/src/utils/local-storage.ts
  - frontend/src/utils/sla-calculator.ts
  - frontend/src/utils/storage/preference-storage.ts
findings:
  critical: 5
  warning: 11
  info: 0
  total: 16
status: issues_found
---

# Phase 47: Code Review Report (Re-review)

**Reviewed:** 2026-05-09
**Depth:** standard
**Files Reviewed:** 323 (the prior CR-NN/WR-NN findings already fixed via commits 9096c3f1, ffa14f4f, 0c1ad92e, 04717ddb, etc. — this re-review preserves the prior catalog at the bottom for reference and surfaces a new tranche that the first pass missed.)
**Status:** issues_found

## Summary

The first review caught the most visible component-side shims and gate regressions; the team landed clean fixes. This second pass dug into the **backend** (`api/after-action.ts`, `services/tasks.service.ts`, `middleware/optimistic-locking.ts`) and the **shape lies in component shims that destructure non-existent fields from TanStack hooks**. Both clusters were under-served by the first review.

The headline finding is that Phase 47 used the cast pattern `query.eq('column' as never, value as never)` against the typed Supabase client — and in **every backend instance that pattern surfaced, the underlying column did not exist on the table**. The `as never` cast was the silencer for what should have been a real schema-mismatch tsc error. Affected code paths run only on specific user actions (publish/edit/delete after-action records, update task from commitment), so the bugs are latent until exercised, but they exist in production code and will break those flows at runtime with Postgrest "column does not exist" errors.

The second cluster is **TanStack hook shims that destructure fields that don't exist on `useQuery`/`useMutation`**: `{ exportLogs, isExporting }` from `useAuditLogExport()` (shape returned is `{ mutate, mutateAsync, isPending, ... }`); `{ values }` from `useAuditLogDistinctValues` (returns `{ data, ... }`); `{ statistics, isLoading, error }` from `useAuditLogStatistics` (returns `{ data, ... }`). The first two cause runtime crashes when triggered (export action throws `TypeError: exportLogs is not a function`); the third gracefully degrades to "no data" UI. All three are codified by `as unknown as { ... }` casts that override the real return shape and hide the bug from tsc.

A third cluster is the **`as unknown as { mutateAsync: (params: Record<string, unknown>) => ... }` pattern that widens mutation parameter types in component shims, hiding broken-by-design call sites**. Specifically: `CommentForm.tsx` passes `{ commentId, content, visibility }` to `useUpdateComment`, but the hook signature is `{ id: string; data: Record<string, unknown> }` — `commentId` is silently discarded and the API request goes to `/entity-comments/undefined`. This bug pre-existed Phase 47, but the new shim makes it untraceable through the type system.

The dominant pattern, repeated across all five new BLOCKERs: **a tsc error pointed at a real defect, and Phase 47 silenced the error with a cast rather than fixing the defect**. This is exactly what 47-EXCEPTIONS.md was meant to prevent.

## Critical Issues

### CR-03: Backend `query.eq('after_action_id', id)` against `commitments` table — column does not exist

**File:** `backend/src/api/after-action.ts:540, 803`
**Issue:** The `update` and `delete` handlers for after-action records cascade-delete child entities. They call:

```ts
await supabase
  .from('commitments')
  .delete()
  .eq('after_action_id' as never, id)
```

But the `commitments` table (in `database.types.ts:5360`) **has no `after_action_id` column**. Its sibling table `aa_commitments` (line 189) is the one with the FK to `after_action_records` (`aa_commitments_after_action_id_fkey`, line 273). The Phase 47 `as never` cast on the column name silenced the schema mismatch.

At runtime, calling `update` (PUT) or `delete` (DELETE) on an after-action record returns Postgrest error `column commitments.after_action_id does not exist` (PG error code 42703). The cascade silently fails: the delete handler swallows errors via `Promise.all` so the parent `after_action_record` is deleted but its commitments are orphaned. The update handler's catch-all logs and returns 500.

This matches the codebase's documented memory note: `[aa_commitments has no FK to dossiers]` — the same `aa_commitments` vs `commitments` confusion bit before.

**Fix:**

```ts
await supabase.from('aa_commitments').delete().eq('after_action_id', id)
```

Drop both `as never` casts. If the typed client surfaces a remaining tsc error, that is _information_ — fix the call shape; do not silence it.

### CR-04: `tasks.service.ts` filters `tasks` by columns that don't exist (`related_commitment_id`, `related_after_action_id`)

**File:** `backend/src/services/tasks.service.ts:691, 716, 746`
**Issue:** Three methods on `TaskCreationService` query the `tasks` table by columns that don't exist on it:

```ts
// Line 691 — in updateTaskStatusFromCommitment()
.eq('related_commitment_id' as never, commitmentId)

// Line 716 — in getTasksByAfterAction()
.eq('related_after_action_id' as never, afterActionId)

// Line 746 — in deleteTasksByAfterAction()
.eq('related_after_action_id' as never, afterActionId)
```

The `tasks` table (`database.types.ts:25336-25368`) defines `work_item_id: string | null` and `work_item_type: string | null`, with NO `related_commitment_id` or `related_after_action_id`. The only `related_commitment_id` (singular) column in the schema lives on `working_group_deliverables`.

Effect: every call to `updateTaskStatusFromCommitment(...)`, `getTasksByAfterAction(...)`, or `deleteTasksByAfterAction(...)` returns Postgrest error `42703 column tasks.related_* does not exist`. The first method returns `false` and logs an error; the second throws; the third returns `false` after logging. **All three are core to the after-action publish→tasks lifecycle**, so the entire commitment-to-task linkage is broken whenever exercised.

**Fix:** Use the actual columns:

```ts
.eq('work_item_id', commitmentId).eq('work_item_type', 'commitment')
.eq('work_item_id', afterActionId).eq('work_item_type', 'after_action')
```

Drop the `as never` casts. If `work_item_type` enum doesn't include `'after_action'` / `'commitment'`, fix the schema or the lookup table — but do not paper over with casts.

### CR-05: `after-action.ts` filters `after_action_records` by non-existent columns (`status`, `confidentiality_level`)

**File:** `backend/src/api/after-action.ts:99, 105`
**Issue:** The `GET /after-action/list` endpoint filters by `status` and `confidentiality_level`:

```ts
if (q.status) {
  query = query.eq('status' as never, q.status as never)
}
if (q.confidentiality_level) {
  query = query.eq('confidentiality_level' as never, q.confidentiality_level as never)
}
```

The `after_action_records` table (`database.types.ts:773-841`) has **`publication_status: string` and `is_confidential: boolean`** — not `status` and not `confidentiality_level`. The Zod schema at line 47-51 even validates `status` against `'draft'|'published'|'edit_pending'` (which matches `publication_status` semantically, but the column name is wrong) and `confidentiality_level` against `'public'|'internal'|'confidential'|'secret'` (a four-state enum, not a boolean — wrong representation entirely).

Effect: when a client calls `GET /after-action/list?status=draft`, the typed Supabase client's runtime accepts the cast, hits Postgrest, and gets `column after_action_records.status does not exist`. The endpoint returns 500 with the error. Same for `confidentiality_level`. Filtering is broken; the endpoint is half-functional (returns the unfiltered list when no status/confidentiality passed; errors when either is passed).

The `as never` casts hide both the column-name typo and the type representation mismatch (boolean vs four-state enum).

**Fix:** Either rename the columns in the schema and migrate, or rewrite the API:

```ts
if (q.status) {
  query = query.eq('publication_status', q.status)
}
if (q.confidentiality_level) {
  // confidentiality_level is a UX-level four-state enum but the column is a boolean.
  // Decide here: either map to is_confidential (boolean), or extend the schema.
  const isConfidential = q.confidentiality_level !== 'public'
  query = query.eq('is_confidential', isConfidential)
}
```

The Zod schema also needs alignment with the actual column representation.

### CR-06: `useAuditLogExport()` shim destructures fields that don't exist — runtime TypeError on user click

**File:** `frontend/src/components/audit-logs/AuditLogExport.tsx:40-43`
**Issue:** The shim:

```ts
const { exportLogs, isExporting } = useAuditLogExport() as unknown as {
  exportLogs: (params: { format: ExportFormat; filters: unknown }) => Promise<unknown>
  isExporting: boolean
}
```

But the underlying hook (`useAuditLogs.ts:98-102`) is:

```ts
export function useAuditLogExport() {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ url: '', success: true }),
  })
}
```

A TanStack `useMutation` returns `{ mutate, mutateAsync, isPending, isError, error, ... }` — **never** `{ exportLogs, isExporting }`. Both destructured names resolve to `undefined`. The handler at line 45-47:

```ts
const handleExport = async (format: ExportFormat) => {
  await exportLogs({ format, filters })
}
```

When the user clicks `Export → CSV` or `Export → JSON`, this throws `TypeError: exportLogs is not a function`. The component does not catch the rejection, so it surfaces as an unhandled promise rejection in the console and breaks the export flow.

**Fix:** Match the TanStack mutation API surface:

```ts
const exportMutation = useAuditLogExport()
const isExporting = exportMutation.isPending
const handleExport = async (format: ExportFormat) => {
  await exportMutation.mutateAsync({ format, filters })
}
```

Drop the cast — TanStack types are correct out of the box.

### CR-07: `CommentForm.tsx` `updateComment.mutateAsync({ commentId, ... })` — wrong param shape, hidden by widening cast

**File:** `frontend/src/components/comments/CommentForm.tsx:75-82, 92-97`
**Issue:** The hook signature (`useComments.ts:58-67`) is:

```ts
export function useUpdateComment() {
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      updateCommentApi(params.id, params.data),
    // ...
  })
}
```

CommentForm.tsx defines:

```ts
const updateComment = useUpdateComment() as unknown as {
  mutateAsync: (params: Record<string, unknown>) => Promise<Partial<CommentWithDetails>>
  isPending: boolean
}
```

— and then calls:

```ts
const result = await updateComment.mutateAsync({
  commentId: editingComment.id, // wrong: should be `id`
  content: content.trim(), // wrong: should live inside `data`
  visibility, // wrong: should live inside `data`
})
```

At runtime: `params.id === undefined`, `params.data === undefined` → `updateCommentApi(undefined, undefined)` → `PUT /entity-comments/undefined` with body `undefined`. Editing comments is silently broken.

The bug pre-existed Phase 47. Pre-Phase47 the hook had `: ReturnType<typeof useMutation>` which left the param type unconstrained, so the wrong call shape compiled silently. Phase 47 removed that annotation and added the `as unknown as` cast that widens the param type to `Record<string, unknown>` — codifying the broken shape rather than exposing it.

**Fix:** Drop the cast and fix the call:

```ts
const updateComment = useUpdateComment() // no cast
// ...
const result = await updateComment.mutateAsync({
  id: editingComment.id,
  data: { content: content.trim(), visibility },
})
```

Then verify the `createComment` call site at line 108-114 matches the same expectation (camelCase `entityType`, `entityId`, etc. is what the repository expects? — also worth a look; this review did not run end-to-end against the backend route).

## Warnings

### WR-15: `optimisticLockingMiddleware('task_contributors')` would crash at runtime — `task_contributors` has no `is_deleted` column

**File:** `backend/src/middleware/optimistic-locking.ts:40, 60, 86`
**Issue:** The middleware signature accepts `'tasks' | 'task_contributors'`. The `tasks` row (line 25352) has `is_deleted: boolean`. The `task_contributors` row (line 25298-25307) has only `added_at, id, notes, removed_at, role, task_id, user_id` — no `is_deleted`.

The middleware queries `.eq('is_deleted' as never, false as never)`. The `as never` casts (added by Phase 47 to silence the union-type error) hide that the query is invalid for `task_contributors`. The current call sites in `api/tasks.ts` only pass `'tasks'`, so the bug doesn't fire today — but the API surface is misleading and the second a route uses `optimisticLockingMiddleware('task_contributors')`, the request crashes.

**Fix:** Either remove `'task_contributors'` from the union (current callers don't need it) or split the function into two implementations. Drop the `as never` casts and let the type system pick up the second misuse.

### WR-16: `useUploadAttachment()` shim claims `mutateAsync: (data: FormData) => ...` — but `apiPost` JSON-stringifies the body, dropping all upload data

**File:** `frontend/src/components/attachment-uploader/AttachmentUploader.tsx:45-47`
**Issue:** The shim:

```ts
const uploadMutation = useUploadAttachment() as unknown as {
  mutateAsync: (data: FormData) => Promise<{ id: string }>
}
```

— combined with the call:

```ts
const formData = new FormData()
formData.append('file', attachmentFile.file)
const result = await uploadMutation.mutateAsync(formData)
```

The hook (`useIntakeApi.ts:154-160`) calls `uploadAttachmentApi(data)` which calls `apiPost('/intake-tickets-attachments', data)`. `apiPost` (`lib/api-client.ts:81-93`) does:

```ts
body: JSON.stringify(body)
```

`JSON.stringify(formData)` returns `"{}"` because `FormData` is not enumerable. The HTTP request body becomes `{}`. **No file data is ever transmitted.** The endpoint receives an empty payload.

This is a pre-existing bug but the Phase 47 shim _codifies_ `FormData` as the parameter type, which misleads any future reader to believe the wiring works. Either fix `apiPost` to detect `FormData` and skip JSON-stringify, or rewrite this hook to use a multipart-aware fetch path.

**Fix:** Replace the shim with the real signature (`Record<string, unknown>`) so future readers see the actual contract. Then fix the upload pipeline separately — the file-upload code path needs a multipart body, not JSON. Track the actual upload bug in a separate ticket; the WARNING here is the _cast that hides the bug_.

### WR-17: `useAuditLogStatistics` shim destructures `{ statistics }` but the hook returns `{ data }` — silently always undefined

**File:** `frontend/src/components/audit-logs/AuditLogStatistics.tsx:57-69`
**Issue:** The shim:

```ts
const { statistics, isLoading, error } = useAuditLogStatistics(...) as unknown as {
  statistics: { ... } | undefined
  isLoading: boolean
  error: unknown
}
```

The hook (`useAuditLogs.ts:90-96`) returns a TanStack `useQuery` result whose data field is `data`, not `statistics`. So `statistics` is always `undefined`. The component handles this via `if (error || !statistics) return ...no-data...` — safe, but the cast is a _lie about the field name_, and once the hook is wired to a real endpoint that returns `{statistics: ...}`, the lie persists.

**Fix:** Use the correct destructure name and read the inner field:

```ts
const { data, isLoading, error } = useAuditLogStatistics(...)
const statistics = data as StatsShape | undefined
```

Or extend the hook to return a `select`-mapped shape. Drop the cast — let tsc check.

### WR-18: `useAuditLogDistinctValues` shim destructures `{ values }` but hook returns `{ data }` — silently always undefined

**File:** `frontend/src/components/audit-logs/AuditLogFilters.tsx:106-108`
**Issue:** Same pattern as WR-17:

```ts
const { values: availableTables } = useAuditLogDistinctValues('table_name') as unknown as {
  values: string[]
}
```

The underlying stub (`useAuditLogs.ts:82-88`) is `useQuery` returning `data: []`. `availableTables` is always `undefined`, never `[]`. Component must defensively check; no current crash because the dropdown handles `undefined` gracefully, but the destructured-name lie persists.

**Fix:** Destructure `data` and rename inline:

```ts
const { data: availableTables = [] } = useAuditLogDistinctValues('table_name') as unknown as {
  data: string[] | undefined
}
```

### WR-19: Backend `digest-scheduler.ts` — `dateStr` used unchecked after potentially returning `undefined`

**File:** `backend/src/queues/digest-scheduler.ts:41, 51`
**Issue:** Phase 47 added `?? ''` defaults at line 142 (`const today = ... ?? ''`) but missed line 41:

```ts
const dateStr = now.toISOString().split('T')[0] // typed `string | undefined` under noUncheckedIndexedAccess
// ...
const testDate = new Date(`${dateStr}T12:00:00Z`) // line 51 — `dateStr` may be undefined
```

If `dateStr` is `undefined`, the template literal becomes `"undefinedT12:00:00Z"`, `new Date(...)` is `Invalid Date`, `formatter.format(testDate)` returns `"Invalid Date"`, and `Number(...)` is `NaN`. The whole timezone offset calculation breaks.

`backend/tsconfig.build.json` has `noUncheckedIndexedAccess: false`, so the build doesn't catch this — but `tsconfig.json` has it `true`, so the strict check is enabled for editor/CLI tsc. Phase 47's claim of "0 frontend errors" did not extend to backend strict mode.

In practice `now.toISOString()` always returns a valid ISO 8601 string with `T` separator, so `dateStr` is never `undefined`. So the runtime is safe — but this is a defensive-programming gap consistent with the rest of Phase 47's `?? d` discipline.

**Fix:** Apply the same `?? ''` defensive default:

```ts
const dateStr = now.toISOString().split('T')[0] ?? '1970-01-01'
```

### WR-20: `applicationServerKey: applicationServerKey as BufferSource` cast is acceptable but skips the underlying root cause

**File:** `frontend/src/services/push-subscription.ts` (verified post-fix in commit ffa14f4f)
**Issue:** The prior fix replaced `applicationServerKey.buffer as ArrayBuffer` with `applicationServerKey as BufferSource`. The cast satisfies the `PushSubscriptionOptionsInit` lib types and is correct at runtime (a `Uint8Array` IS a `BufferSource`). However, the original tsc error this was hiding is likely a DOM-types lib-version mismatch that should be fixed at the project level (`@types/dom` or `lib: [...]` in tsconfig). Document in `47-EXCEPTIONS.md` if not already.

This is not a bug, just a flag that the cast is masking a setup issue.

**Fix:** None required for the cast itself. Optionally investigate the root tsc lib-version mismatch.

### WR-21: `ChatContext` provider is now dead infrastructure (no consumer hook)

**File:** `frontend/src/contexts/ChatContext.tsx` (whole file post-Phase47)
**Issue:** Phase 47 deleted `useChatContext` and the `useContext` import. The `ChatContext` is created and `ChatProvider` wraps the app (`routes/_protected.tsx:5`), but no component reads from the context. The context value is computed and dispatched on every state change for nothing.

This is not a bug, but ~30 LOC of useless work happening on every chat state change. Either restore `useChatContext` if it's intended to be consumed, or delete the entire `ChatContext` and `ChatProvider` (and its wrapper in `_protected.tsx`).

**Fix:** Audit whether any future consumer is planned. If not, delete the whole file and remove the provider from `_protected.tsx`.

### WR-22: `BenchmarkPreview` shim widens stub data shape to `{ shouldShowPreview?: boolean; benchmarks?: OrganizationBenchmark }` but stub returns `[]` (an empty array)

**File:** `frontend/src/components/dashboard-widgets/BenchmarkPreview.tsx:228-231`
**Issue:** The stub `useBenchmarkPreview` (`useOrganizationBenchmarks.ts:49-55`) returns `Promise.resolve([])`. The shim asserts an object shape. Component checks `data?.shouldShowPreview` — on `[]`, that property is `undefined`, so the component bails. **Safe stub behavior**, but the shim casts an empty array to an object type — which is a structural lie that will burn the next person who writes `Object.entries(data)` or similar.

**Fix:** When stubbing, return the asserted shape, not an empty array:

```ts
queryFn: () => Promise.resolve({ shouldShowPreview: false, benchmarks: undefined }),
```

Then drop the cast in `BenchmarkPreview.tsx`.

### WR-23: `MiniRelationshipGraph.tsx` and four other dossier-section components cast `useRelationshipsForDossier(id)` to `{ data: { data: RelationshipWithDossiers[] } }` — actual hook returns `{ data: RelationshipsListResponse }`

**Files:**

- `frontend/src/components/dossier/TopicDossierDetail.tsx:114`
- `frontend/src/components/dossier/sections/DecisionLogs.tsx:29`
- `frontend/src/components/dossier/sections/InteractionHistory.tsx:27`
- `frontend/src/components/dossier/sections/PositionsHeld.tsx:99`
- `frontend/src/components/dossier/sections/OrganizationAffiliations.tsx:26`

**Issue:** The shim says `data: { data: RelationshipWithDossiers[] } | undefined`. The actual hook returns `useQuery<RelationshipsListResponse, ...>` where `RelationshipsListResponse` is `{ data: RelationshipWithDossiers[]; pagination: {...}; relationships?: ...; ... }`. The shim narrows the response correctly for the `data` field but discards `pagination`, `relationships`, `total_count`, etc. The current consumers only read `data?.data || []` so the narrow is technically fine — but five copies of the same incorrect shim is the wrong tactic. Consolidate at the hook source.

**Fix:** Add a typed export at the hook source returning `RelationshipsListResponse`, then drop all five shims:

```ts
// In useRelationships.ts
export function useRelationshipsForDossier(...): UseQueryResult<RelationshipsListResponse, RelationshipAPIError> { ... }
```

(It already does — the hook is generic on the result. The shims are redundant.)

### WR-24: `useCalendarSync` returns `NOOP_ASYNC` for every action — provider/disconnect/sync are silent no-ops at runtime

**File:** `frontend/src/domains/briefings/hooks/useCalendarSync.ts:124-147`
**Issue:** The stub returns:

```ts
const NOOP_ASYNC = (): Promise<void> => Promise.resolve()

export function useCalendarSync(): CalendarSyncState {
  return {
    // ...
    connectProvider: NOOP_ASYNC, // expected (provider, redirectUri)
    disconnectProvider: NOOP_ASYNC, // expected (id)
    updateConnection: NOOP_ASYNC, // expected (id, updates)
    triggerSync: NOOP_ASYNC, // expected (params)
    resolveConflict: NOOP_ASYNC, // expected (params)
    addICalFeed: NOOP_ASYNC, // expected (feed)
    updateICalFeed: NOOP_ASYNC, // expected (id, updates)
    removeICalFeed: NOOP_ASYNC, // expected (id)
    refreshICalFeed: NOOP_ASYNC, // expected (id)
  }
}
```

All eleven actions silently swallow their args (TS bivariant function-param check accepts the assignment). The whole CalendarSyncSettings page is non-functional. This is a documented stub, but the component renders a fully-styled UI that does nothing. Either render an "under construction" placeholder, or delete the page until the feature is wired.

**Fix:** Add a top-of-component banner: "Calendar sync is not yet wired to a backend. Actions below have no effect." Or gate the route on a feature flag and 404 it. Do not let users click through a fully-styled UI that does nothing.

### WR-25: `ApplyTemplate` shim and `BriefingPackJob` cast pattern — risk of cast staleness when underlying hooks evolve

**File:** Multiple (e.g., `frontend/src/components/positions/BriefingPackGenerator.tsx:55-58`)
**Issue:** The post-fix code reads:

```ts
const job = briefingStatus.data as BriefingPackJob | null | undefined
const jobFileUrl = (briefingStatus.data as { file_url?: string } | null | undefined)?.file_url
const jobErrorMessage = (briefingStatus.data as { error_message?: string } | null | undefined)
  ?.error_message
```

Three separate casts of the same `briefingStatus.data` to three different shapes. If the underlying response shape ever changes, three call sites need updating. Consolidate to a single typed view at the hook source — `useBriefingPackStatus` should return `useQuery<BriefingPackJob>` directly:

```ts
export function useBriefingPackStatus(jobId, options): UseQueryResult<BriefingPackJob | null> {
  return useQuery<BriefingPackJob | null>({
    // ...
    queryFn: () =>
      jobId ? (getBriefingPackStatus(jobId) as Promise<BriefingPackJob>) : Promise.resolve(null),
    // ...
  })
}
```

Then `briefingStatus.data` is `BriefingPackJob | null | undefined` directly, and all three component-side casts disappear.

**Fix:** Move the type at the hook source (47-08 charter). Apply the same to other repeat-cast patterns surfaced in WR-23.

---

## Findings From Prior Review (already fixed — preserved for traceability)

The prior review found 2 BLOCKERs and 14 WARNINGs. Status of each:

| ID    | Title (truncated)                                                    | Status                          |
| ----- | -------------------------------------------------------------------- | ------------------------------- |
| CR-01 | useCommentThread lost its enabled gate — N+1 API calls               | FIXED in commit `d7bef130`      |
| CR-02 | useStakeholderTimeline silently dropped its real API call            | FIXED in commit `31e01886`      |
| WR-01 | EMPTY_CONFIGURATION ships invalid runtime shape                      | FIXED in commit `f4cc5ed3`      |
| WR-02 | BriefingPackGenerator lies about TanStack `status` field             | FIXED in commit `d3daa7f7`      |
| WR-03 | useBriefingPackStatus lost its `enabled` gate                        | FIXED in commit `d3daa7f7`      |
| WR-04 | useEntityTemplates callers void the `enabled` flag                   | FIXED in commit `398d8f17`      |
| WR-05 | MentionInput no longer gates user-search on popup visibility         | FIXED in commit `e2cf68a8`      |
| WR-06 | Repository `Promise<unknown>` casts to `Promise<DomainType>`         | NOT FIXED — see WR-23 expansion |
| WR-07 | Fallback colors changed for unknown enum values                      | FIXED in commit `d0f61b98`      |
| WR-08 | EmptyState props mismatch in DocumentsSection                        | FIXED in commit `8dbc3e06`      |
| WR-09 | `as unknown as { applyTemplate }` is double-redundant                | FIXED in commit `398d8f17`      |
| WR-10 | `as any` casts in CalendarSyncSettings                               | FIXED in commit `9096c3f1`      |
| WR-11 | `void (isExpanded ? connection.id : undefined)` dead expression      | FIXED in commit `9096c3f1`      |
| WR-12 | `applicationServerKey.buffer as ArrayBuffer` cast unnecessary        | FIXED in commit `ffa14f4f`      |
| WR-13 | Non-null assertions in CommandPalette.tsx after typeguard            | FIXED in commit `0c1ad92e`      |
| WR-14 | useStakeholderInfluenceList queryKey lossy `Record<string, unknown>` | FIXED in commit `04717ddb`      |

WR-06 is preserved in the new tranche as **WR-23** (expanded with five concrete file paths).

## What Phase 47 Did Well (unchanged from prior review)

- Suppression discipline: 0 net-new `@ts-ignore`/`@ts-expect-error`; `@ts-nocheck` only on auto-generated `database.types.ts`, `routeTree.gen.ts`, and `backend/src/types/contact-directory.types.ts` (now justified inline).
- Aggressive deletion of dead code (754 files, ~100k lines net). Verified: `useDossierStoreState`, `useFieldPermission`, `useDuplicateCandidate`, `useDuplicateCandidatesInfinite`, `getRelationshipsForContactDirect`, `getIntelligenceByType`, `fetchWorkItemsRPC`, `formatBytes`, `generateUserColor`, `getFileIcon`, `useDelegation` aggregator, `useMarkMilestoneComplete`, `getDossierContextResolution`, `searchByType`, `quickSearch`, `getDossierRoute`, `getDossierColorClass`, backend `sentryUserMiddleware`, `clearSentryUser`, `useTableSubscription`, `usePresence`, `useRealtimeSubscription`, `getConnectionStatus`, `isRealtimeConnected`, `quickExportDossier`, `getExportEstimate`, frontend `authFetch`, `addToQueue`/`processQueue` standalone wrappers — all confirmed zero callers.
- Removal of emoji-laden helper `getFileIcon` from `services/upload.ts` and color-hex helper `generateUserColor` from `lib/utils.ts` — both violated CLAUDE.md design rules.
- Migration of typed-shims from component files into hook-source signatures (47-11 retired 19 component-side shims). Where individual shims remained problematic (CR-04 through CR-07, WR-15 through WR-18), the failure mode is _bug-hiding_, not _suppression-without-thought_ — most remaining shims are correct narrowings, just a handful misrepresent shape.
- `toArDigits.ts` defensive `?? d` fallback for `noUncheckedIndexedAccess`.
- `EnhancedSearchAction` replaced an unreadable conditional-type ladder.
- Realtime `services/realtime.ts` channel-cleanup contract preserved unchanged.
- `applyTokens.ts` `for of Object.entries(set)` rewrite — same semantics, cleaner with strict index.

## Findings Out of v1 Scope (perf, pre-existing)

- `services/realtime.ts` `reconnect` still drops the `filter` config when re-subscribing (line 161-171). Pre-existing; Phase 47 did not modify the function body.
- `services/upload.ts` floating promises on lines 133, 156, 181 (`get().startUpload(...)` not awaited). Pre-existing.
- `backend/src/api/after-action.ts:111-115` `query.or(...)` interpolates `q.search` directly without escaping — Postgrest filter injection risk. Pre-existing; Phase 47 only renamed the variable.
- `backend/src/api/after-action.ts:89` `error: any` in catch — pre-existing.
- `useCalendarSync` NOOP semantics (WR-24 above) is documented stub status, not a Phase 47 regression.

---

_Re-reviewed: 2026-05-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard, with backend-strict-mode pass added on top_
