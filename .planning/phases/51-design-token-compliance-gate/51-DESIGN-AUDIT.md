# Phase 51: Design-Token Compliance Gate - Audit

**Generated:** 2026-05-15
**Total Tier-A files:** 50
**Total Tier-C files:** populated by Plan 51-04

## Tier-A Worklist

| file                                                                            | palette_literal_count | dominant_semantic             | swap_summary                                                |
| ------------------------------------------------------------------------------- | --------------------: | ----------------------------- | ----------------------------------------------------------- |
| frontend/src/components/forms/FormCompletionProgress.tsx                        |                    36 | progress/status states        | success, warning, danger, info, and neutral progress chrome |
| frontend/src/components/forms/UnifiedFileUpload.tsx                             |                    32 | upload status and form chrome | success/error upload states plus muted borders and text     |
| frontend/src/components/positions/AttachmentUploader.tsx                        |                    26 | upload status and form chrome | success/error upload states plus muted borders and text     |
| frontend/src/components/forms/ValidationIndicator.tsx                           |                    26 | validation status             | danger, warning, success, and info validation states        |
| frontend/src/components/forms/FormSection.tsx                                   |                    25 | form section chrome           | success/error section states plus muted borders and text    |
| frontend/src/routes/\_protected/admin/system.tsx                                |                    23 | admin status badges           | success, warning, danger, info, and muted status panels     |
| frontend/src/components/forms/FormErrorDisplay.tsx                              |                    20 | error and warning display     | danger, warning, info, and neutral divider states           |
| frontend/src/components/bulk-actions/EnhancedUndoToast.tsx                      |                    20 | undo toast status             | danger, warning, success, info, and neutral toast states    |
| frontend/src/routes/\_protected/positions/$positionId.tsx                       |                    19 | position status chrome        | danger, warning, success, info, and muted status states     |
| frontend/src/components/forms/ProgressiveFormField.tsx                          |                    19 | form field validation         | danger, warning, success, and muted field chrome            |
| frontend/src/components/forms/FormFieldGroup.tsx                                |                    19 | form field validation         | danger, warning, success, and muted field chrome            |
| frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx  |                    18 | work-item status chips        | danger, warning, success, info, and muted work-item states  |
| frontend/src/components/dossiers/DossierMoUsTab.tsx                             |                    17 | dossier status chips          | danger, warning, success, info, and muted dossier states    |
| frontend/src/components/actionable-errors/ActionableErrorSummary.tsx            |                    16 | actionable error summary      | danger, warning, success, info, and alert chrome            |
| frontend/src/components/tasks/SLAIndicator.tsx                                  |                    15 | SLA status indicator          | danger, warning, success, info, and muted SLA states        |
| frontend/src/components/actionable-errors/ActionableErrorMessage.tsx            |                    15 | actionable error message      | danger, warning, info, and alert chrome                     |
| frontend/src/components/forms/FormFieldWithValidation.tsx                       |                    14 | form field validation         | danger, warning, success, and muted field chrome            |
| frontend/src/components/forms/AutoSaveFormWrapper.tsx                           |                    14 | auto-save status              | danger, warning, success, and muted form status             |
| frontend/src/pages/webhooks/WebhooksPage.tsx                                    |                    12 | webhook status                | danger, warning, success, and muted status text             |
| frontend/src/components/edit-approval-flow/EditApprovalFlow.tsx                 |                    12 | approval status               | danger, warning, success, and info approval states          |
| frontend/src/components/collaboration/EditingLockIndicator.tsx                  |                    12 | lock warning                  | warning lock chrome                                         |
| frontend/src/components/availability-polling/AvailabilityPollVoter.tsx          |                    12 | poll response state           | danger, warning, and success voting states                  |
| frontend/src/components/availability-polling/AvailabilityPollResults.tsx        |                    12 | poll result state             | danger, warning, and success result states                  |
| frontend/src/pages/analytics/AnalyticsDashboardPage.tsx                         |                    11 | analytics status chrome       | danger, warning, and info dashboard states                  |
| frontend/src/components/version-comparison/VersionComparison.tsx                |                    11 | diff status                   | danger, success, and muted comparison states                |
| frontend/src/components/sla-monitoring/SLAOverviewCards.tsx                     |                    11 | SLA cards                     | danger, warning, success, and info card states              |
| frontend/src/components/offline-indicator/OfflineIndicator.tsx                  |                    11 | connectivity state            | danger, success, and muted offline states                   |
| frontend/src/components/forms/SmartInput.tsx                                    |                    11 | input validation              | danger and muted input chrome                               |
| frontend/src/components/forms/FormTextareaAceternity.tsx                        |                    11 | textarea validation           | danger and muted input chrome                               |
| frontend/src/components/forms/FormInputAceternity.tsx                           |                    11 | input validation              | danger and muted input chrome                               |
| frontend/src/components/field-history/FieldHistoryTimeline.tsx                  |                    11 | field history status          | danger, warning, success, and muted history states          |
| frontend/src/components/export-import/ImportDialog.tsx                          |                    11 | import status                 | warning, success, and info import states                    |
| frontend/src/components/advanced-search/SavedSearchTemplates.tsx                |                    11 | saved-search status           | danger, warning, info, and muted template states            |
| frontend/src/components/onboarding/OnboardingChecklist.tsx                      |                    10 | checklist completion          | success checklist states                                    |
| frontend/src/components/forms/FormSelectAceternity.tsx                          |                    10 | select validation             | danger and muted select chrome                              |
| frontend/src/components/forms/ArrayFieldManager.tsx                             |                    10 | array field validation        | danger and muted form chrome                                |
| frontend/src/components/form-auto-save/FormDraftBanner.tsx                      |                    10 | draft warning                 | warning draft banner chrome                                 |
| frontend/src/components/advanced-search/BooleanLogicBuilder.tsx                 |                    10 | query builder chrome          | danger and muted builder states                             |
| frontend/src/components/active-filters/ActiveFiltersBar.tsx                     |                    10 | active filter status          | warning, success, and info filter chips                     |
| frontend/src/pages/DossierSearchPage.tsx                                        |                     9 | search loading and muted text | info spinner plus muted search chrome                       |
| frontend/src/components/scenario-sandbox/ScenarioComparison.tsx                 |                     9 | scenario diff status          | danger and success comparison states                        |
| frontend/src/components/advanced-search/AdvancedSearchFilters.tsx               |                     9 | filter chrome                 | muted filter text, borders, and backgrounds                 |
| frontend/src/components/actionable-errors/FieldErrorHighlight.tsx               |                     9 | field error highlight         | danger, warning, and info field rings                       |
| frontend/src/pages/contacts/ContactCreate.tsx                                   |                     8 | contact warning               | warning contact form states                                 |
| frontend/src/components/forms/FormRadioAceternity.tsx                           |                     8 | radio validation              | danger and muted radio chrome                               |
| frontend/src/components/entity-links/LinkCard.tsx                               |                     8 | entity link actions           | danger, info, and muted link card states                    |
| frontend/src/components/commitments/deliverables/DeliverablesTimeline.tsx       |                     8 | deliverable timeline status   | danger, success, and info timeline states                   |
| frontend/src/components/collaboration/ActiveViewers.tsx                         |                     8 | viewer presence               | success, info, and muted presence states                    |
| frontend/src/components/calendar/ConflictResolution/ReschedulingSuggestions.tsx |                     8 | rescheduling status           | danger, warning, and success suggestion states              |
| frontend/src/auth/RegisterPage.tsx                                              |                     8 | registration validation       | danger validation text                                      |

## Histogram Source

Palette histogram command output was captured in `/tmp/51-palette-histogram.txt`.
The first 50 Tier-A rows above were selected from safe semantic families only:
red/rose, amber/yellow, green/emerald, blue, and neutral gray/slate/zinc/stone.
Files with purple, violet, fuchsia, pink, indigo, cyan, teal, orange, lime, or
mixed chart-like semantics were deferred to Tier-C.

Raw hex histogram command output was captured in `/tmp/51-hex-histogram.txt`.
The raw-hex file set is reserved for Plan 51-04 Tier-C disposition except for
the two Plan 51-02 named anchors already handled separately.

## Tier-C Disposition Table

| file | raw_hex_count | palette_literal_count | proposed_token_map | disposition | follow_up_phase |
| ---- | ------------: | --------------------: | ------------------ | ----------- | --------------- |

## Slug index

Plan 51-04 populates row slugs when Tier-C dispositions are recorded.
