---
phase: 47-type-check-zero
reviewed: 2026-05-09T20:30:00Z
depth: standard
files_reviewed: 322
files_reviewed_list:
  - backend/package.json
  - backend/src/api/after-action.ts
  - backend/src/jobs/refresh-health-scores.job.ts
  - backend/src/lib/sentry.ts
  - backend/src/middleware/optimistic-locking.ts
  - backend/src/queues/digest-scheduler.ts
  - backend/src/services/__tests__/auth.service.test.ts
  - backend/src/services/tasks.service.ts
  - backend/src/types/contact-directory.types.ts
  - backend/src/types/database.types.ts
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
  - frontend/src/domains/briefings/hooks/useBriefingPackStatus.ts
  - frontend/src/domains/briefings/hooks/useCalendarSync.ts
  - frontend/src/domains/briefings/hooks/useGenerateBriefingPack.ts
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
  - frontend/src/types/actionable-error.types.ts
  - frontend/src/types/activity-feed.types.ts
  - frontend/src/types/advanced-search.types.ts
  - frontend/src/types/ai-suggestions.types.ts
  - frontend/src/types/analytics.types.ts
  - frontend/src/types/audit-log.types.ts
  - frontend/src/types/availability-polling.types.ts
  - frontend/src/types/breakpoint.ts
  - frontend/src/types/briefing-book.types.ts
  - frontend/src/types/bulk-actions.types.ts
  - frontend/src/types/calendar-conflict.types.ts
  - frontend/src/types/calendar-sync.types.ts
  - frontend/src/types/comment.types.ts
  - frontend/src/types/commitment-deliverable.types.ts
  - frontend/src/types/commitment.types.ts
  - frontend/src/types/common.types.ts
  - frontend/src/types/compliance.types.ts
  - frontend/src/types/contextual-suggestion.types.ts
  - frontend/src/types/dashboard-widget.types.ts
  - frontend/src/types/database.types.ts
  - frontend/src/types/dossier-context.types.ts
  - frontend/src/types/dossier-export.types.ts
  - frontend/src/types/dossier-recommendation.types.ts
  - frontend/src/types/dossier-search.types.ts
  - frontend/src/types/dossier.ts
  - frontend/src/types/duplicate-detection.types.ts
  - frontend/src/types/engagement-recommendation.types.ts
  - frontend/src/types/enhanced-search.types.ts
  - frontend/src/types/entity-comparison.types.ts
  - frontend/src/types/entity-template.types.ts
  - frontend/src/types/export-import.types.ts
  - frontend/src/types/field-history.types.ts
  - frontend/src/types/field-permission.types.ts
  - frontend/src/types/forum.types.ts
  - frontend/src/types/geographic-visualization.types.ts
  - frontend/src/types/intake.ts
  - frontend/src/types/intelligence-reports.types.ts
  - frontend/src/types/legislation.types.ts
  - frontend/src/types/milestone-planning.types.ts
  - frontend/src/types/multilingual-content.types.ts
  - frontend/src/types/onboarding.types.ts
  - frontend/src/types/preview-layout.types.ts
  - frontend/src/types/progressive-disclosure.types.ts
  - frontend/src/types/relationship.types.ts
  - frontend/src/types/report-builder.types.ts
  - frontend/src/types/retention-policy.types.ts
  - frontend/src/types/sample-data.types.ts
  - frontend/src/types/scenario-sandbox.types.ts
  - frontend/src/types/settings.types.ts
  - frontend/src/types/sla.types.ts
  - frontend/src/types/stakeholder-influence.types.ts
  - frontend/src/types/stakeholder-interaction.types.ts
  - frontend/src/types/tag-hierarchy.types.ts
  - frontend/src/types/timeline-annotation.types.ts
  - frontend/src/types/timeline.types.ts
  - frontend/src/types/unified-dossier-activity.types.ts
  - frontend/src/types/view-preferences.types.ts
  - frontend/src/types/wg-member-suggestion.types.ts
  - frontend/src/types/work-item.types.ts
  - frontend/src/types/workflow-automation.types.ts
  - frontend/src/types/working-group.types.ts
  - frontend/src/utils/broadcast/preference-broadcast.ts
  - frontend/src/utils/local-storage.ts
  - frontend/src/utils/sla-calculator.ts
  - frontend/src/utils/storage/preference-storage.ts
findings:
  blocker: 8
  warning: 12
  total: 20
status: issues_found
---

# Phase 47: Code Review Report (Iteration 2 — fresh adversarial pass)

**Reviewed:** 2026-05-09
**Depth:** standard
**Files Reviewed:** 322
**Status:** issues_found

## Summary

This is a fresh adversarial pass against the post-fix HEAD (after commits `09986501`,
`7affbbc6`, `dfc6ec13`, `6517286f`, `27783458`, `138039cf`, `c163f6fe`, `e199114a`,
`2f9a0b9a`, `76caef4a`, `21d53325`, `35b62d0a`, `aebb7032`, `41a0ba7d`). Phase 47's stated
goal — `pnpm typecheck` returning 0 errors — continues to hold; I confirmed
`pnpm --filter intake-backend run type-check` exits cleanly. The previous review's CR/WR
fixes are correct as applied within their stated scope.

The new findings cluster into three veins that the prior review either undersized or did
not surface:

1. **The `as never` cascade fix (CR-03) only covered _two_ of seven cascade call sites.**
   The original CR-03 named lines 540 and 803; commit `09986501` switched both to
   `aa_commitments`. But `decisions`, `risks`, `follow_up_actions`, and `attachments` all
   still use `query.eq('after_action_id' as never, id)`. For those four tables the column
   _does_ exist in `database.types.ts` (verified at lines 7036, 22517, 13157, 2928), so the
   `as never` cast is gratuitous suppression hiding nothing — but the `as never` pattern
   was Phase 47's documented warning sign, and four leftover instances in the same file
   means the post-fix didn't run a same-bug-class scan (per the project's memory note on
   "type-discriminator drift"). See **WR-26**.

2. **The CommentForm rewrite (CR-07) sits on top of two real, _unfixed_, runtime-blocking
   bugs**: (a) the create-comment handler still sends camelCase `entityType`/`entityId`/
   `parentId` to a Supabase Edge Function that expects snake_case `entity_type`/`entity_id`/
   `parent_id` — backend will return 400 "entity_type, entity_id, and content are
   required"; (b) `updateCommentApi` calls `apiPut` (HTTP `PUT`), but the Edge Function
   only handles `case 'PATCH'` — so update requests fall through. **Both create and edit
   are functionally broken.** The prior review explicitly flagged this for verification;
   the fix-report acknowledged the flag but did not chase. See **CR-08** and **CR-09**.

3. **`useGenerateBriefingPack` silently drops the `language` parameter.** The hook's
   `mutationFn` reads `params.options` and forwards it, but the component
   (`BriefingPackGenerator.tsx:87`) calls with `{ engagementId, language }`. The widening
   shim on lines 43-46 of the component lets it compile. Result: language is never sent;
   server defaults the briefing pack to whatever the backend's default is. This pattern is
   the WR-09/CR-07 family — a typed shim hides a shape mismatch — but for a feature the
   user paid attention to. See **CR-10**.

In addition: **two more entire feature surfaces are silent stubs** alongside the WR-24
calendar-sync stub (skipped by the prior fix). `useAvailabilityPolling.ts` has eight
`Promise.resolve(...)` no-op mutations powering AvailabilityPollCreator/Voter/Results
(see **CR-11**). `useSearchUsersForMention` resolves `[]` so the @mention popup in
CommentForm shows nothing (**WR-29**). Like calendar-sync, these render fully-styled UIs
that do nothing at runtime. The fix-report's WR-24 rationale ("UX/feature scope, not a
type-check fix") applies here too — but the user-facing impact is real and the surfaces
should at least be gated behind a "not yet wired" banner.

There are also several remaining Phase 47-specific problems: the create-after-action
handler at `after-action.ts:294-304` still inserts into `after_action_records` using
column names that **do not exist** on that table (`title`, `description`,
`confidentiality_level`, `attendance_list`, `status`, `_version` — actual columns are
`notes`, `is_confidential`, `attendees`, `publication_status`, `version`). The select at
line 79-89 also embeds `commitments:commitments(count)` which has no FK relationship to
`after_action_records` — a Postgrest "could not find a relationship" error at runtime.
These are CR-class because the create flow is the entry point for the entire after-action
lifecycle. See **CR-12** and **CR-13**.

The prior review's catalog is preserved at the bottom; CR-03 through CR-07 and WR-15
through WR-25 were correctly addressed within their stated scopes. The new findings below
are bugs that were either (a) below the prior review's resolution threshold or (b)
revealed by the cleanup itself — the prior review focused on the sub-targets explicitly
named in commit messages; this pass widened to the same-bug-class sweep that the project's
own memory note recommends.

## Critical Issues

### CR-08: CommentForm `createComment.mutateAsync({entityType, entityId, parentId, ...})` sends camelCase to Edge Function that requires snake_case — comment creation returns HTTP 400

**File:** `frontend/src/components/comments/CommentForm.tsx:99-105`
**Issue:** The component calls:

```tsx
const comment = (await createComment.mutateAsync({
  entityType,
  entityId,
  content: content.trim(),
  parentId,
  visibility,
})) as CommentWithDetails
```

The hook (`useComments.ts:48-56`) forwards the params object verbatim into `createCommentApi(data)`, which `apiPost`s to `/entity-comments`. The Supabase Edge Function at `supabase/functions/entity-comments/index.ts:382-396` reads:

```ts
const { entity_type, entity_id, content, parent_id, visibility = 'public' } = body
if (!entity_type || !entity_id || !content) {
  return /* 400 BAD_REQUEST: 'entity_type, entity_id, and content are required' */
}
```

`entity_type`, `entity_id`, `parent_id` are `undefined` in the destructure because the body keys are `entityType`, `entityId`, `parentId`. **Every comment creation returns HTTP 400.** The prior review (CR-07) flagged this for human verification and the fix-report acknowledged the flag — but did not chase the call site. This is a runtime-blocking bug that ships in production today.

**Fix:** Send the body in the shape the backend reads:

```tsx
const comment = (await createComment.mutateAsync({
  entity_type: entityType,
  entity_id: entityId,
  content: content.trim(),
  parent_id: parentId,
  visibility,
})) as CommentWithDetails
```

### CR-09: `updateCommentApi` calls `apiPut` (HTTP PUT) but the Edge Function only handles PATCH — comment editing returns 405/falls through

**Files:** `frontend/src/domains/misc/repositories/misc.repository.ts:23-25`, `supabase/functions/entity-comments/index.ts:552`
**Issue:** Repository:

```ts
export async function updateComment(id: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPut(`/entity-comments/${id}`, data)
}
```

`apiPut` (`lib/api-client.ts:104`) sends `method: 'PUT'`. The Supabase Edge Function method dispatch reads `case 'PATCH': { ... }` — there is no `case 'PUT'`. The function falls through to the default response (typically 405 Method Not Allowed or an "unsupported method" path). **Comment editing has been broken since the Edge Function was written this way.** Phase 47 didn't introduce this, but did codify the wrong wiring by removing the cast that previously made the call shape ambiguous. The current `useUpdateComment().mutateAsync({ id, data })` is correct on the frontend — the bug is in the repository's HTTP method choice.

**Fix:** In `frontend/src/lib/api-client.ts`, ensure an `apiPatch` is exported (it is — line 115), then in `frontend/src/domains/misc/repositories/misc.repository.ts`:

```ts
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

export async function updateComment(id: string, data: Record<string, unknown>): Promise<unknown> {
  return apiPatch(`/entity-comments/${id}`, data)
}
```

Verify against the Edge Function — it strictly handles `PATCH`.

### CR-10: `useGenerateBriefingPack` ignores the `language` parameter — bilingual selection is non-functional

**Files:** `frontend/src/components/positions/BriefingPackGenerator.tsx:43-46, 87`, `frontend/src/domains/briefings/hooks/useGenerateBriefingPack.ts:13-23`
**Issue:** Component calls:

```ts
const generateMutation = useGenerateBriefingPack() as unknown as {
  mutateAsync: (vars: { engagementId: string; language: string }) => Promise<{ job_id: string }>
  isPending: boolean
}
// ...
const result = await generateMutation.mutateAsync({ engagementId, language })
```

Hook signature is:

```ts
mutationFn: (params: { engagementId: string; options?: Record<string, unknown> }) =>
  generateBriefingPack(params.engagementId, params.options)
```

At runtime, `params.options === undefined` because the call passed `language` instead. The repository call body becomes `{}`. **The user's English/Arabic radio selection has no effect** — the briefing pack is always generated in whatever language the backend defaults to (likely English). This matches the WR-09 family pattern but the user-visible impact is a feature regression: bilingual support is silently broken.

The component-side widening cast on lines 43-46 lets the wrong call shape compile. Drop the cast and either (a) extend the hook to accept a `language` field, or (b) wrap `language` inside `options`:

**Fix (preferred — extend the hook):**

```ts
// useGenerateBriefingPack.ts
mutationFn: (params: {
  engagementId: string
  language: 'en' | 'ar'
  options?: Record<string, unknown>
}) => generateBriefingPack(params.engagementId, { language: params.language, ...params.options })
```

```tsx
// BriefingPackGenerator.tsx
const generateMutation = useGenerateBriefingPack() // no cast
const result = await generateMutation.mutateAsync({ engagementId, language })
```

Then verify `generateBriefingPack` (`briefings.repository.ts:22-27`) actually forwards the body — it does (`apiPost(\`/engagements/\${engagementId}/briefing-packs\`, data ?? {})`).

### CR-11: `useAvailabilityPolling.ts` ships eight stubbed mutations — entire AvailabilityPolling feature is non-functional

**File:** `frontend/src/domains/import/hooks/useAvailabilityPolling.ts:135-197`
**Issue:** Eight hooks return `Promise.resolve(...)` stubs:

- `usePolls(...)`: `Promise.resolve({ polls: [] })`
- `useMyPolls(...)`: `Promise.resolve({ polls: [] })`
- `useCreatePoll()`: `Promise.resolve({ id: '' } as AvailabilityPoll)`
- `usePollDetails(...)`: `Promise.resolve(undefined)`
- `useSubmitVotes()`: `Promise.resolve({ success: true })`
- `useClosePoll()`: `Promise.resolve({ success: true })`
- `useAutoSchedule()`: `Promise.resolve({} as AutoScheduleResponse)`

Three component files (`AvailabilityPollCreator.tsx`, `AvailabilityPollVoter.tsx`, `AvailabilityPollResults.tsx`) render full UIs against these stubs. A user creating a poll sees an empty `id`, voting "succeeds" but persists nothing, opening a poll details URL shows undefined, etc. Same pathology as WR-24 (calendar-sync) but for an eight-action feature. The prior review's WR-24 fix-rationale ("UX/feature scope, not a type-check fix") applies here, but the bug class is identical and the user-visible impact is a fully-styled feature that **silently does nothing**.

**Fix:** At minimum, gate the AvailabilityPolling routes behind a feature flag, or render a "not yet implemented" banner at the top of each consuming page. Long-term: wire to a real backend RPC. Mirror the WR-24 disposition — add a follow-up UX ticket.

### CR-12: `POST /after-action/create` inserts into `after_action_records` using six column names that do not exist on the table

**File:** `backend/src/api/after-action.ts:294-304`
**Issue:** The handler builds:

```ts
const afterActionData = {
  engagement_id: req.body.engagement_id,
  dossier_id: req.body.dossier_id,
  title: req.body.title, // NOT a column
  description: req.body.description, // NOT a column
  confidentiality_level: req.body.confidentiality_level, // NOT a column
  attendance_list: req.body.attendance_list || [], // NOT a column
  status: AfterActionStatus.DRAFT, // NOT a column
  created_by: userId,
  _version: 1, // NOT a column
}

const { data: afterAction, error: afterActionError } = await supabase
  .from('after_action_records')
  .insert(afterActionData)
  .select()
  .single()
```

The actual `after_action_records` table (`database.types.ts:773-841`) has columns: `attendees` (not `attendance_list`), `is_confidential` (boolean, not `confidentiality_level` enum), `notes` (not `description`), `publication_status` (not `status`), `version` (not `_version`). There is **no `title` column** at all.

This typechecks cleanly because Supabase's `.insert()` accepts excess properties (not strictly typed against `Insert`). At runtime, Postgrest ignores unknown columns or returns `42703 column does not exist` depending on the postgrest version. Either way, every CREATE call against `/after-action/create` either (a) inserts a row with all the user-provided fields lost or (b) returns 500. CR-05's filter fix handled the LIST endpoint; the CREATE/UPDATE handlers have the same column-name drift.

**Fix:** Migrate the handler to use the real columns:

```ts
const afterActionData = {
  engagement_id: req.body.engagement_id,
  dossier_id: req.body.dossier_id,
  notes: req.body.description, // was `description`
  is_confidential: req.body.confidentiality_level !== 'public', // boolean mapping
  attendees: req.body.attendance_list || [], // was `attendance_list`
  publication_status: 'draft', // was `status`
  created_by: userId,
  version: 1, // was `_version`
}
```

There is no `title` column on `after_action_records`. Either drop the title parameter from the request shape, or migrate the schema to add a `title` column. The `_version`/`version` rename also needs to be cascaded through the UPDATE handler at line 478 and the Zod schema in `after-action.types.ts`.

### CR-13: `select(\`\*, decisions:decisions(count), commitments:commitments(count), ...\`)`in LIST and GET handlers —`commitments`has no FK to`after_action_records`

**Files:** `backend/src/api/after-action.ts:79-89, 184-195, 614-622`
**Issue:** Three Postgrest selects embed `commitments(count)` or `commitments(*)` from `after_action_records`. The `commitments` table (`database.types.ts:5360-5424`) has `Relationships: []` — no FK. The actual FK lives on `aa_commitments` (line 273-275). At runtime, Postgrest returns `PGRST200` "Could not find a relationship between 'after_action_records' and 'commitments' in the schema cache".

Effect: every call to `GET /after-action/list`, `GET /after-action/:id`, and `POST /after-action/:id/publish` returns 500 once the schema cache is rebuilt. The bug coexists with CR-03's fix on the same file — that fix only addressed the cascade `eq` filter; the upstream embed was missed.

The publish handler's task-creation block (line 679-684) reads `record.commitments` from the embed result, so even if Postgrest tolerates the unknown embed by returning `null`, downstream code receives an empty list and `taskCreationService.createTasksFromCommitments` runs against zero commitments — the after-action publish flow's primary side effect is silently a no-op.

**Fix:** Replace all three embeds:

```ts
// LIST + GET
.select(`
  *,
  decisions:decisions(count),
  commitments:aa_commitments(count),    // <- FK exists here
  risks:risks(count),
  follow_up_actions:follow_up_actions(count),
  attachments:attachments(count)
`)

// PUBLISH
.select(`*, commitments:aa_commitments(*)`)
```

Run a manual Postgrest call against staging to confirm the embed alias works against `aa_commitments` (Supabase generally allows `commitments:aa_commitments(*)` syntax to rename embeds).

### CR-14: `useSLARealtimeUpdates` creates Supabase channels inside `queryFn` — channels are never cleaned up, leaking on every navigation

**File:** `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts:239-270`
**Issue:**

```ts
export function useSLARealtimeUpdates(onUpdate?: () => void): void {
  useQuery({
    queryKey: ['sla', 'realtime'],
    queryFn: async () => {
      const eventsChannel = supabase.channel('sla-events-changes').on(...).subscribe()
      const escalationsChannel = supabase.channel('sla-escalations-changes').on(...).subscribe()
      return { eventsChannel, escalationsChannel }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}
```

Two issues:

1. **Channels are created in `queryFn` with no cleanup.** Each component instance that calls this hook leaks two channels. TanStack Query's `gcTime` will eventually let the cached query be garbage-collected, but the underlying Supabase channel reference is held by the realtime client's subscription map — GC never reaches it. After a few navigations, the user has dozens of orphaned channels firing redundant invalidations.
2. **`queryFn` is conceptually wrong for side-effects.** `useQuery` is for fetching data, not for managing subscription lifecycles. The right primitive is `useEffect` with a cleanup function that calls `supabase.removeChannel(eventsChannel)`.

**Fix:**

```ts
import { useEffect } from 'react'

export function useSLARealtimeUpdates(onUpdate?: () => void): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const eventsChannel = supabase
      .channel('sla-events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_events' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['sla', 'dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['sla', 'at-risk'] })
        void queryClient.invalidateQueries({ queryKey: ['sla', 'breached'] })
        onUpdate?.()
      })
      .subscribe()

    const escalationsChannel = supabase
      .channel('sla-escalations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sla_escalations' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['sla', 'escalations'] })
        onUpdate?.()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(eventsChannel)
      void supabase.removeChannel(escalationsChannel)
    }
  }, [queryClient, onUpdate])
}
```

### CR-15: `version_snapshots` insert in publish handler passes `version_number: rec._version` (number | undefined), but the column is non-nullable — `as never` cast hides a real type error

**File:** `backend/src/api/after-action.ts:725-733`
**Issue:**

```ts
const snapshotData = {
  after_action_id: id,
  version_number: rec._version, // number | undefined per the cast at line 630
  snapshot_data: record,
  version_reason: 'Initial publication',
  created_by: userId,
}

await supabase.from('version_snapshots' as never).insert(snapshotData as never)
```

The `version_snapshots.Insert` shape (`database.types.ts:27458-27469`) requires `version_number: number` (non-optional). Casting the table name and payload to `never` silences the typecheck — but at runtime, when `rec._version` is undefined (which it is in current data because the column is `version`, not `_version`, see CR-12), the insert violates the NOT NULL constraint and the publish handler returns 500. The `as never` casts are the same Phase 47 anti-pattern flagged in CR-03 — a `tsc` error pointing at a real defect was silenced rather than fixed.

**Fix:** Once CR-12 lands and `rec.version` is read from the correct column:

```ts
const snapshotData = {
  after_action_id: id,
  version_number: rec.version ?? 1, // safe default if missing
  snapshot_data:
    record as Database['public']['Tables']['version_snapshots']['Insert']['snapshot_data'],
  version_reason: 'Initial publication',
  created_by: userId,
}

await supabase.from('version_snapshots').insert(snapshotData) // no cast
```

## Warnings

### WR-26: Four `as never` cascades on existing columns in after-action.ts — gratuitous suppression that signals incomplete review

**File:** `backend/src/api/after-action.ts:531, 557, 571, 801, 806, 810, 814`
**Issue:** Seven leftover `query.eq('after_action_id' as never, id)` calls against `decisions`, `risks`, `follow_up_actions`, and `attachments`. For all four tables, `after_action_id` IS a real column (verified at `database.types.ts:7036, 22517, 13157, 2928`). The cast is silencing nothing and adds noise. The CR-03 fix correctly addressed `commitments` (the column did not exist there), but the same-bug-class scan over the file was not done — the project's own memory note recommends:

> Phase 40-22 G11: plan named 1 site, 5 needed the same fix … Same-bug-class scan saves a follow-up plan.

This is exactly that pattern.

**Fix:** Drop all seven `as never` casts. They suppress nothing because the columns exist:

```ts
// example for line 531
.eq('after_action_id', id)

// example for line 801-810 (all four cascade deletes)
supabase.from('decisions').delete().eq('after_action_id', id),
supabase.from('aa_commitments').delete().eq('after_action_id', id),
supabase.from('risks').delete().eq('after_action_id', id),
supabase.from('follow_up_actions').delete().eq('after_action_id', id),
supabase.from('attachments').delete().eq('after_action_id', id),
```

If a `tsc` error surfaces after dropping a cast, fix the underlying issue — do not re-cast.

### WR-27: `update` and `publish` handlers in after-action.ts use legacy `_version` and `status` field names that do not exist on the schema — masked by hand-authored cast wrappers

**File:** `backend/src/api/after-action.ts:426-430, 478, 630-637, 723-733, 780`
**Issue:** Three places in `after-action.ts` define hand-authored cast wrappers like:

```ts
const current = currentRecord as unknown as {
  status?: string
  _version?: number
  updated_at?: string | null
}
```

Then read `current.status`, `current._version`, `current.title`, `current.engagement_id`, `current.dossier_id`, `current.commitments`, etc. None of `status`, `_version`, `title`, or `commitments` (as embed) exist on the schema (real columns: `publication_status`, `version`, `notes`; no `title`; commitments embed needs `aa_commitments`).

Effect: the runtime behavior is dominated by which fields Postgrest actually returns. The hand-authored cast says "I know what shape this is" but that shape is fictional. The handler's logic — checking `current.status === DRAFT`, optimistic-locking on `current._version` — runs against `undefined`, which means the equality checks always fail (so updates always 400 with "only draft records can be updated"), or the lock check uses `(current._version ?? 0) + 1` which always increments from 0.

These are coupled to CR-12's create-handler bug. The whole after-action surface is built on a schema-mismatch foundation that Phase 47's casts hide rather than reveal.

**Fix:** Run the same migration as CR-12 across all five handlers. Drop every `as unknown as { ... }` wrapper and let the `Database['public']['Tables']['after_action_records']['Row']` type drive consumer code. If a column genuinely needs renaming, schedule a migration; do not paper over with casts.

### WR-28: `useSearchUsersForMention` resolves `[]` — `@`-mention popup in CommentForm is silent

**Files:** `frontend/src/domains/misc/hooks/useComments.ts:116-124`, `frontend/src/components/comments/MentionInput.tsx:76-79`
**Issue:** Hook stub:

```ts
export function useSearchUsersForMention(query?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...commentKeys.all, 'mention-search', query],
    queryFn: () => Promise.resolve([]),
    // ...
  })
}
```

Component widening shim:

```ts
const { data: mentionUsers = [], isLoading: isSearching } = useSearchUsersForMention(mentionQuery, {
  enabled: showMentionList && mentionQuery.length >= 1,
}) as unknown as { data: MentionUser[]; isLoading: boolean }
```

User types `@` → popup opens → `mentionUsers` is always `[]` → no users shown. The component "works" but the `@`-mention search is non-functional. Same family as WR-24/CR-11 stubs. The `@/types/comment.types` already defines `MentionUser`; an actual `mentionUsersApi` exists in the repository (`misc.repository.ts:43-45`) — the hook just wasn't wired to it.

**Fix:** Wire the hook to the real endpoint:

```ts
import { mentionUsers as mentionUsersApi } from '../repositories/misc.repository'

export function useSearchUsersForMention(query?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...commentKeys.all, 'mention-search', query],
    queryFn: () => mentionUsersApi({ query }),
    enabled: options?.enabled !== false && Boolean(query) && (query?.length ?? 0) > 0,
    staleTime: 30 * 1000,
  })
}
```

Then drop the `as unknown as { ... }` cast in `MentionInput.tsx`.

### WR-29: Floating `invalidateQueries` calls violate `@typescript-eslint/no-floating-promises` (multiple files)

**Files:**

- `frontend/src/hooks/useDuplicateDetection.ts:111, 158, 161, 164, 168, 169, 203, 204`
- `frontend/src/hooks/useEditWorkflow.ts:28`
- `frontend/src/services/preference-sync.ts:101`
- `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts:144, 156-157, 168, 203, 215, 230, 248-250, 258`

**Issue:** The codebase pattern is `void queryClient.invalidateQueries(...)` to satisfy the `no-floating-promises` ESLint rule. These files use bare `queryClient.invalidateQueries(...)` calls without `void` or `await`. The eslint rule `@typescript-eslint/no-floating-promises` is configured as `error` per CLAUDE.md, but these calls slip through (presumably because the project's strict-boolean-expressions check is the dominant signal and noise from this is suppressed at the lint config level, or the rule is suppressed via inline comment elsewhere).

**Fix:** Prepend `void` to each:

```ts
void queryClient.invalidateQueries({ queryKey: ... })
```

This is mechanical; one PR can sweep the file set. Not a functional bug but a real lint-rule violation that the project's own configuration says is `error`-level.

### WR-30: `auth.ts` Zustand store persists user object (with role) to localStorage — XSS exposure

**File:** `frontend/src/services/auth.ts:622-630`
**Issue:**

```ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,                  // includes role, email, mfaEnabled
      isAuthenticated: state.isAuthenticated,
      mfaConfig: state.mfaConfig,        // includes backupCodes (was hashed?)
    }),
  },
)
```

Default `persist` storage is `localStorage`. The `user` object includes `role: 'admin' | 'editor' | 'viewer'`, which gates UI privilege. An XSS attacker can read this and render as admin without a backend roundtrip — UI-level only, but it lets the attacker discover privileged surfaces. The backup codes in `mfaConfig` are even more sensitive; if those are raw codes (not hashes), persisting them to `localStorage` defeats the MFA mechanism.

**Fix:**

1. Confirm `mfaConfig.backupCodes` is hashed or otherwise non-replayable. If raw, **never persist**.
2. Restrict `partialize` to identity claims only (`id`, `email`, `languagePreference`) — refetch role from the backend after a session restore, gated on the actual session token in HttpOnly cookie or Supabase's own secure storage.
3. Switch to `sessionStorage` if persistence across reload-only is the goal; no auth surface should land in `localStorage` without a hard reason.

This is a pre-existing security design issue but it remains in-scope because Phase 47's persisted state inherits these defaults.

### WR-31: `Sentry.beforeSend` redacts `token`/`password`/`secret`/`apiKey`/`api_key` but misses common variants

**File:** `backend/src/lib/sentry.ts:73-89`
**Issue:** The redaction list is:

```ts
const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key']
```

Common production variants that pass through:

- `clientSecret`, `client_secret` (OAuth)
- `refresh_token`, `refreshToken`
- `access_token`, `accessToken`
- `private_key`, `privateKey`
- `mfa_code`, `mfaCode`, `otp`
- `authorization` (header is sanitized, but if it appears in body it isn't)

If the request body is JSON with any of these, the value reaches Sentry untouched.

**Fix:** Use a regex sweep:

```ts
const SENSITIVE_KEY_RE = /^(password|.*token|.*secret|.*key|.*credential|.*authorization|otp|mfa)/i

function redact(obj: unknown): void {
  if (obj === null || typeof obj !== 'object') return
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      ;(obj as Record<string, unknown>)[key] = '[REDACTED]'
    } else {
      redact((obj as Record<string, unknown>)[key])
    }
  }
}
```

Match against the exact production data shape; the redaction should be deep, not single-level.

### WR-32: `services/upload.ts` floating promises on lines 133, 156, 181 — silent failure if `startUpload` rejects

**File:** `frontend/src/services/upload.ts:133, 156, 181`
**Issue:** Three call sites:

```ts
get().startUpload(uploadId, options)
```

`startUpload` returns `Promise<void>` and can reject (network failure during chunk upload, supabase storage errors). Without `.catch` or `void` prefix, an unhandled rejection bubbles up. The `try`/`catch` inside `startUpload` catches errors and updates state (line 235-243), but the outer call still returns a Promise — TypeScript's `no-floating-promises` rule should flag this. Pre-existing.

**Fix:**

```ts
void get().startUpload(uploadId, options)
```

Or chain `.catch(error => console.error('Upload start failed:', error))` if the inner try/catch isn't trusted.

### WR-33: `AttachmentUploader.tsx` upload pipeline — `apiPost(formData)` JSON-stringifies, silently drops file payload

**Files:** `frontend/src/components/attachment-uploader/AttachmentUploader.tsx:97-148`, `frontend/src/lib/api-client.ts:81-93`
**Issue:** Per WR-16's documented analysis, `apiPost` does `body: JSON.stringify(body)`. `JSON.stringify(formData)` returns `"{}"`. The upload "succeeds" with HTTP 200 but the file never reaches storage. The `c163f6fe` fix correctly removed the type-system lie — the cast no longer claims `FormData` is the contract — but **the upload itself remains broken at runtime.** Users click upload, see "success", and find their attachment is empty when they go to retrieve it.

This was acknowledged in the prior fix-report: "the actual multipart upload fix is left as a separate ticket." That ticket needs to land before any flow that depends on attachment upload (intake-tickets, after-action records, dossier exports, audit logs) ships. Tracker: open issue.

**Fix:** In `frontend/src/lib/api-client.ts`, special-case FormData:

```ts
export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const headers = await getAuthHeaders()
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (isFormData) {
    // Drop Content-Type so the browser sets multipart/form-data; <boundary>
    delete (headers as Record<string, string>)['Content-Type']
  }

  const response = await fetch(resolveUrl(path, options), {
    method: 'POST',
    headers,
    body: isFormData ? (body as FormData) : JSON.stringify(body),
  })
  return handleResponse<T>(response)
}
```

Then drop the comment-shaped explanation in `AttachmentUploader.tsx:45-50` and the call-site cast on line 121.

### WR-34: `AttachmentUploader.tsx:177` floating Promise (`uploadFile(attachmentFile)`)

**File:** `frontend/src/components/attachment-uploader/AttachmentUploader.tsx:177`
**Issue:** `uploadFile` is `async`, but `handleFiles` calls it without `void` or `await`:

```ts
for (const file of fileArray) {
  // ...
  uploadFile(attachmentFile) // floating Promise
}
```

The internal try/catch in `uploadFile` handles errors via state update, so it doesn't crash, but the lint rule still applies.

**Fix:** `void uploadFile(attachmentFile)`.

### WR-35: Component-level Tailwind color literals violate CLAUDE.md design rules (multiple files)

**Files:**

- `frontend/src/components/audit-logs/AuditLogStatistics.tsx:32-34` (`text-green-600 bg-green-100`, etc.)
- `frontend/src/components/positions/BriefingPackGenerator.tsx:196-198` (`border-green-500 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-green-900`)
- `frontend/src/components/comments/CommentItem.tsx` (similar patterns expected — sample only)

**Issue:** CLAUDE.md mandates: "All colors via `var(--*)` tokens or the `@theme`-mapped Tailwind utilities (`bg-bg`, `bg-surface`, `text-ink`, etc.). **No raw hex. No Tailwind color literals** like `text-blue-500`." These files use `text-green-600`, `bg-green-50`, `bg-blue-100`, etc. — direct color literals that bypass the design-system tokens.

This is design-system drift, not a Phase 47 regression; the ports were authored before Phase 47 cleanup. But CLAUDE.md says these are non-negotiable, so flagging.

**Fix:** Replace with semantic-color tokens. The repo already has `frontend/src/lib/semantic-colors.ts` for exactly this purpose — use it. Example for AuditLogStatistics.tsx:32-34:

```ts
const OPERATION_COLORS: Record<string, string> = {
  INSERT: 'text-success bg-success/10',
  UPDATE: 'text-info bg-info/10',
  DELETE: 'text-destructive bg-destructive/10',
}
```

### WR-36: `cn('', className)` no-op pattern across multiple files

**Files (sample):**

- `frontend/src/components/audit-logs/AuditLogStatistics.tsx:70, 93, 118` (`cn('', className)`)

**Issue:** `cn('', className)` evaluates to `cn(className)` — the empty string contributes nothing. Pre-existing code-quality smell. Either the author intended a non-empty default class string and forgot, or the call should be `className` directly.

**Fix:** Drop the `cn('', ...)` wrapper or supply a real default class. This is mechanical — sweep with `grep -r "cn('', "` and clean up.

### WR-37: `services/realtime.ts:reconnect` drops `filter` config when re-subscribing

**File:** `frontend/src/services/realtime.ts:161-171`
**Issue:** When re-subscribing after a reconnect, the original `filter` parameter (`subscribe({ table, event, callback, filter })`) is not preserved on the `RealtimeSubscription` object. Re-subscriptions pass:

```ts
const newChannel = supabase
  .channel(`${subscription.table}-${subscription.event}-${id}`)
  .on('postgres_changes', {
    event: subscription.event as '*',
    schema: 'public',
    table: subscription.table,
    // filter is missing!
  } as RealtimePostgresChangesFilter<...>, subscription.callback)
```

After a reconnect, all subscriptions become unfiltered — receiving every change to the table instead of only the originally-filtered subset. Components consuming filtered subscriptions will misbehave (extra cache invalidations, accidental cross-tenant data leaks if filter was tenant-scoped).

**Fix:**

```ts
// In subscribe():
const subscription: RealtimeSubscription = {
  id: subscriptionId,
  channel,
  table,
  event,
  filter,  // <-- store
  callback,
  status: 'subscribed',
}

// In RealtimeSubscription interface, add:
filter?: string

// In reconnect():
.on('postgres_changes', {
  event: subscription.event as '*',
  schema: 'public',
  table: subscription.table,
  ...(subscription.filter ? { filter: subscription.filter } : {}),
}, subscription.callback)
```

This is pre-existing but worth flagging because reconnect is exercised on every realtime heartbeat failure.

---

## Findings From Prior Review (already fixed — preserved for traceability)

The prior review (iteration 1) found 5 BLOCKERs and 11 WARNINGs. Status of each:

| ID    | Title (truncated)                                                 | Status                                        |
| ----- | ----------------------------------------------------------------- | --------------------------------------------- |
| CR-01 | useCommentThread lost its enabled gate                            | FIXED in `d7bef130`                           |
| CR-02 | useStakeholderTimeline silently dropped its real API call         | FIXED in `31e01886`                           |
| CR-03 | `query.eq('after_action_id', id)` against `commitments`           | PARTIAL — see WR-26 (4 untouched call sites)  |
| CR-04 | `tasks.service.ts` filters by non-existent `related_*_id` columns | FIXED in `7affbbc6`                           |
| CR-05 | `after-action.ts` filter handler — wrong column names             | FIXED in `dfc6ec13` (LIST only — see CR-12)   |
| CR-06 | `useAuditLogExport()` shim destructures non-existent fields       | FIXED in `6517286f`                           |
| CR-07 | CommentForm `mutateAsync({commentId, ...})` — wrong shape         | FIXED for UPDATE, see CR-08/CR-09 for related |
| WR-15 | `optimisticLockingMiddleware('task_contributors')` would crash    | FIXED in `138039cf`                           |
| WR-16 | `useUploadAttachment()` shim claims FormData                      | FIXED (cast removed) — see WR-33 for runtime  |
| WR-17 | `useAuditLogStatistics` shim destructures `{ statistics }`        | FIXED in `e199114a`                           |
| WR-18 | `useAuditLogDistinctValues` shim destructures `{ values }`        | FIXED in `2f9a0b9a`                           |
| WR-19 | `digest-scheduler.ts` `dateStr` unchecked                         | FIXED in `76caef4a`                           |
| WR-20 | `applicationServerKey as BufferSource` — root cause               | DOCUMENTED in `21d53325`                      |
| WR-21 | `ChatContext` is dead infrastructure                              | SKIPPED (per fix-report)                      |
| WR-22 | `BenchmarkPreview` shim — stub returns `[]` instead of object     | FIXED in `35b62d0a`                           |
| WR-23 | Five dossier-section components shim already-typed hooks          | FIXED in `aebb7032`                           |
| WR-24 | `useCalendarSync` returns NOOP for every action                   | SKIPPED (per fix-report) — see CR-11          |
| WR-25 | `BriefingPackJob` cast pattern (3 casts of same data)             | FIXED in `41a0ba7d`                           |

CR-03 is preserved as **WR-26** (new tranche, four files of gratuitous suppression).
WR-21 and WR-24 remain reasonable Skip dispositions; CR-11 records that the same pattern recurs in availability-polling and recommends a unified UX gating ticket.

## What Phase 47 Did Well (carry-forward)

- Suppression discipline holds: `tsc --noEmit` is 0 errors at HEAD; no new `@ts-ignore`/`@ts-expect-error` introduced; `@ts-nocheck` only on auto-generated `database.types.ts`, `routeTree.gen.ts`, and `backend/src/types/contact-directory.types.ts` (justified inline).
- All five iteration-1 BLOCKERs were fixed correctly within their stated scopes.
- Move of typed contracts into hook sources (WR-22, WR-23, WR-25) is the right architectural direction — the new BLOCKERs surface what's left to do on _other_ hook surfaces, not what's wrong with the migrations already done.
- `47-EXCEPTIONS.md` discipline preserved — no new exceptions added during the fix iteration.
- The fix-report's "logic-bug verification flag" on CR-07 was honest about the limit of static review; this iteration found CR-08 and CR-09 by doing the live-route validation that the verification flag explicitly recommended.

## Findings Out of v1 Scope (perf, pre-existing)

- `services/realtime.ts:161-171` `reconnect` drops `filter` (logged as **WR-37** — partial overlap, marked because subscription leakage is also a bug, not just perf).
- Backend `error: any` and `[key: string]: any` in `optimistic-locking.ts` (lines 24, 31, 32). Pre-existing; flagged for future TS-strict cleanup.
- `services/offline-queue.ts:10` `data?: any` — pre-existing.
- `services/upload.ts` floating promises (logged as **WR-32** because the rule is `error`-level and the project's own config says it's a fail).
- `frontend/src/services/dossier-api.ts:11` cross-package import via `../../../backend/src/types` — fragile but pre-existing.
- `frontend/src/lib/sentry.ts:216-220` `import('web-vitals').then(...)` floating Promise — pre-existing.

---

_Re-reviewed: 2026-05-09T20:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard, with Edge Function cross-validation added on top_
_Iteration: 2_
