# Tasks: Full Assignment Detail Page

**Feature**: 014-full-assignment-detail
**Input**: Design documents from `/specs/014-full-assignment-detail/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-spec.yaml, quickstart.md

## Project Structure
- **Backend**: Supabase Edge Functions in `/supabase/functions/`
- **Frontend**: React components in `/frontend/src/`
- **Database**: PostgreSQL migrations in `/supabase/migrations/`

**Naming Conventions**:
- **React Components**: PascalCase matching spec.md terminology (e.g., "engagement context banner" → `EngagementContextBanner.tsx`)
- **Edge Functions**: kebab-case matching API paths (e.g., `/assignments-escalate` → `supabase/functions/assignments-escalate/`)
- **Database Tables**: snake_case (e.g., `assignment_comments`, `comment_reactions`)
- **TanStack Query Hooks**: camelCase with "use" prefix (e.g., `useAssignmentDetail`, `useAddComment`)

## Phase 3.1: Database Setup (Sequential)

- [x] **T001** Create migration file `20251003000_add_engagement_context_to_assignments.sql` to add `engagement_id` and `workflow_stage` columns to existing `assignments` table, create `engagement_workflow_stage` enum, add trigger for auto-sync
- [x] **T002** Create migration file `20251003001_create_assignment_comments.sql` for `assignment_comments` table with RLS policies
- [x] **T003** Create migration file `20251003002_create_comment_reactions.sql` for `comment_reactions` table with composite unique constraint and RLS policies
- [x] **T004** Create migration file `20251003003_create_comment_mentions.sql` for `comment_mentions` table with RLS policies
- [x] **T005** Create migration file `20251003004_create_assignment_checklist_items.sql` for `assignment_checklist_items` table with sequence ordering and RLS policies
- [x] **T006** Create migration file `20251003005_create_assignment_checklist_templates.sql` for `assignment_checklist_templates` table with bilingual fields and RLS policies
- [x] **T007** Create migration file `20251003006_create_assignment_observers.sql` for `assignment_observers` table with unique constraint and RLS policies
- [x] **T008** Create migration file `20251003007_create_assignment_events.sql` for `assignment_events` table with event type enum and RLS policies
- [x] **T009** Create migration file `20251003008_create_rls_policies.sql` to enable RLS on all new tables and create view permissions for assignees and observers
- [x] **T010** Create migration file `20251003009_create_functions.sql` with database functions: `get_assignment_progress()`, `get_engagement_progress()`, `get_comment_reactions()`
- [x] **T011** Create migration file `20251003010_seed_checklist_templates.sql` to seed 2-3 common checklist templates (Dossier Review, Ticket Processing) with bilingual content
- [x] **T012** Create migration file `20251003011_backfill_engagement_assignments.sql` to backfill `engagement_id` for existing assignments linked to engagements (if applicable)
- [x] **T013** Apply all migrations to Supabase project (zkrcjzdemdmwhearhfgg) using Supabase MCP `apply_migration` tool
- [x] **T014** Generate TypeScript types from updated database schema using Supabase MCP `generate_typescript_types` tool and save to `frontend/src/types/database.ts`

## Phase 3.2: Backend API - Contract Tests [P] (Parallel - Test-Driven Development)

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T015** [P] Contract test for GET /assignments-get/{id} in `backend/tests/contract/assignments-get.test.ts` - verify schema, 200/403/404 responses, engagement context included
- [x] **T016** [P] Contract test for POST /assignments-comments-create in `backend/tests/contract/assignments-comments-create.test.ts` - verify request/response schema, @mention parsing, 201/400/403/429 responses
- [x] **T017** [P] Contract test for POST /assignments-comments-reactions-toggle in `backend/tests/contract/assignments-comments-reactions-toggle.test.ts` - verify toggle behavior, 200/400/403 responses
- [x] **T018** [P] Contract test for POST /assignments-checklist-create-item in `backend/tests/contract/assignments-checklist-create-item.test.ts` - verify item creation, 201/400/403 responses
- [x] **T019** [P] Contract test for POST /assignments-checklist-import-template in `backend/tests/contract/assignments-checklist-import-template.test.ts` - verify bulk import, 201/400/403 responses
- [x] **T020** [P] Contract test for POST /assignments-checklist-toggle-item in `backend/tests/contract/assignments-checklist-toggle-item.test.ts` - verify completion toggle, 200/400/403 responses
- [x] **T021** [P] Contract test for POST /assignments-escalate in `backend/tests/contract/assignments-escalate.test.ts` - verify observer added, 200/400/403/429 responses
- [x] **T022** [P] Contract test for POST /assignments-complete in `backend/tests/contract/assignments-complete.test.ts` - verify completion, 200/400/403/409 responses
- [x] **T023** [P] Contract test for POST /assignments-observer-action in `backend/tests/contract/assignments-observer-action.test.ts` - verify accept/reassign/observe, 200/400/403 responses
- [x] **T024** [P] Contract test for GET /assignments-related/{id} in `backend/tests/contract/assignments-related-get.test.ts` - verify sibling assignments, context type, 200/403/404 responses
- [x] **T025** [P] Contract test for GET /engagements/{id}/kanban in `backend/tests/contract/engagements-kanban-get.test.ts` - verify kanban columns, progress stats, 200/403/404 responses
- [x] **T026** [P] Contract test for PATCH /assignments/{id}/workflow-stage in `backend/tests/contract/assignments-workflow-stage-update.test.ts` - verify stage update, 200/400/403/404 responses

## Phase 3.3: Backend API - Edge Functions (Sequential after T014)

- [x] **T027** Implement Edge Function `supabase/functions/assignments-get/index.ts` to retrieve assignment detail with metadata, SLA tracking, work item preview, comments, checklist, timeline, observers, and engagement context
- [x] **T028** Implement Edge Function `supabase/functions/assignments-comments-create/index.ts` with @mention parsing, validation, notification creation, rate limiting (10 comments/min)
- [x] **T029** Implement Edge Function `supabase/functions/assignments-comments-reactions-toggle/index.ts` with upsert/delete logic and emoji validation
- [x] **T030** Implement Edge Function `supabase/functions/assignments-checklist-create-item/index.ts` with sequence calculation and RLS checks
- [x] **T031** Implement Edge Function `supabase/functions/assignments-checklist-import-template/index.ts` to bulk create items from template with preserved sequence
- [x] **T032** Implement Edge Function `supabase/functions/assignments-checklist-toggle-item/index.ts` with optimistic locking and completion timestamp tracking
- [x] **T033** Implement Edge Function `supabase/functions/assignments-escalate/index.ts` to add supervisor as observer, create escalation event, send notification, enforce rate limit (1/hour)
- [x] **T034** Implement Edge Function `supabase/functions/assignments-complete/index.ts` with optimistic locking check (version field), SLA stop, completion event
- [x] **T035** Implement Edge Function `supabase/functions/assignments-observer-action/index.ts` to handle accept (reassign to observer), reassign (to other user), or continue observing
- [x] **T036** Implement Edge Function `supabase/functions/assignments-related-get/index.ts` to query sibling assignments by engagement_id or dossier_id, return context info and progress
- [x] **T037** Implement Edge Function `supabase/functions/engagements-kanban-get/index.ts` to retrieve all assignments for engagement grouped by workflow_stage, calculate progress stats
- [x] **T038** Implement Edge Function `supabase/functions/assignments-workflow-stage-update/index.ts` to update workflow_stage via PATCH, create timeline event, broadcast real-time update

## Phase 3.4: Frontend - TanStack Query Hooks [P] (Parallel after T014)

- [x] **T039** [P] Create TanStack Query hook `frontend/src/hooks/useAssignmentDetail.ts` with Supabase Realtime subscription on assignments, comments, checklist, reactions, events, and workflow_stage changes - includes engagement context
- [x] **T040** [P] Create TanStack Query mutation hook `frontend/src/hooks/useAddComment.ts` with optimistic update (add temp comment), onError rollback, invalidate on success
- [x] **T041** [P] Create TanStack Query mutation hook `frontend/src/hooks/useToggleReaction.ts` with optimistic update (add/remove reaction), real-time sync
- [x] **T042** [P] Create TanStack Query mutation hook `frontend/src/hooks/useAddChecklistItem.ts` with optimistic update, sequence calculation
- [x] **T043** [P] Create TanStack Query mutation hook `frontend/src/hooks/useImportChecklistTemplate.ts` to import template items, invalidate checklist query
- [x] **T044** [P] Create TanStack Query mutation hook `frontend/src/hooks/useToggleChecklistItem.ts` with optimistic update (mark complete/incomplete), progress recalculation
- [x] **T045** [P] Create TanStack Query mutation hook `frontend/src/hooks/useEscalateAssignment.ts` to escalate, add observer, trigger notification
- [x] **T046** [P] Create TanStack Query mutation hook `frontend/src/hooks/useCompleteAssignment.ts` with optimistic locking check, status update
- [x] **T047** [P] Create TanStack Query mutation hook `frontend/src/hooks/useObserverAction.ts` for accept/reassign/observe actions
- [x] **T048** [P] Create TanStack Query hook `frontend/src/hooks/useRelatedAssignments.ts` with Supabase Realtime subscription on sibling assignments (same engagement or dossier)
- [x] **T049** [P] Create TanStack Query hook `frontend/src/hooks/useEngagementKanban.ts` with Supabase Realtime subscription on all assignments for engagement, grouped by workflow_stage
- [x] **T050** [P] Create TanStack Query mutation hook `frontend/src/hooks/useUpdateWorkflowStage.ts` for kanban drag-and-drop, optimistic update with <100ms latency

## Phase 3.5: Frontend - UI Components [P] (Parallel after T014)

- [x] **T051** [P] Create component `frontend/src/components/assignments/AssignmentMetadataCard.tsx` to display assignment ID, date, assignee, priority, status with bilingual labels (i18next)
- [x] **T052** [P] Create component `frontend/src/components/assignments/SLACountdown.tsx` with real-time timer (updates every 1 second), color-coded health status (safe/warning/breached), percentage display
- [x] **T053** [P] Create component `frontend/src/components/assignments/WorkItemPreview.tsx` to display work item type, title, ID, content preview (200 chars), required skills, "View Full" link
- [x] **T054** [P] Create component `frontend/src/components/assignments/CommentList.tsx` with @mention rendering (clickable usernames), reaction badges, infinite scroll pagination (50 per page)
- [x] **T055** [P] Create component `frontend/src/components/assignments/CommentForm.tsx` with @mention autocomplete (search users on '@' trigger), character counter (5000 max), submit validation
- [x] **T056** [P] Create component `frontend/src/components/assignments/ReactionPicker.tsx` with emoji picker (👍✅❓❤️🎯💡), toggle behavior, tooltip showing who reacted
- [x] **T057** [P] Create component `frontend/src/components/assignments/ChecklistSection.tsx` with drag-drop reordering (dnd-kit), progress bar, "Import Template" and "Add Item" buttons
- [x] **T058** [P] Create component `frontend/src/components/assignments/ChecklistItemRow.tsx` with checkbox, text, completed_at/by display, sequence number
- [x] **T059** [P] Create component `frontend/src/components/assignments/ChecklistTemplateSelector.tsx` modal to select from templates, show preview of items, bilingual template names
- [x] **T060** [P] Create component `frontend/src/components/assignments/Timeline.tsx` with ARIA feed role, chronological event list, critical event highlighting, infinite scroll
- [x] **T061** [P] Create component `frontend/src/components/assignments/ObserversList.tsx` to show observers with avatars, roles (supervisor/other), added_at timestamps
- [x] **T062** [P] Create component `frontend/src/components/assignments/EscalateDialog.tsx` modal with reason textarea (1000 char max), confirmation, supervisor auto-selection
- [x] **T063** [P] Create component `frontend/src/components/assignments/CompleteDialog.tsx` modal with completion notes textarea, confirmation, optimistic locking warning
- [x] **T064** [P] Create component `frontend/src/components/assignments/EngagementContextBanner.tsx` to display engagement title, type, date range, progress bar, "View Full Engagement" and "Show Kanban" buttons
- [x] **T065** [P] Create component `frontend/src/components/assignments/RelatedTasksList.tsx` to show sibling assignments with title, assignee, status, workflow_stage badges, clickable to navigate
- [x] **T066** [P] Create component `frontend/src/components/assignments/EngagementKanbanDialog.tsx` full-screen modal with 4 columns (To Do, In Progress, Review, Done), progress bar at top, close button
- [x] **T067** [P] Create component `frontend/src/components/assignments/KanbanColumn.tsx` drop zone for workflow stage, shows column title and count, accepts draggable cards
- [x] **T068** [P] Create component `frontend/src/components/assignments/KanbanTaskCard.tsx` draggable card with dnd-kit, displays title, assignee, SLA remaining, priority badge, highlight current assignment (⭐)

## Phase 3.6: Frontend - Main Route (Sequential after T039-T050, T051-T068)

- [x] **T069** Create TanStack Router route `frontend/src/routes/_protected/assignments.$id.tsx` with route parameter `id`, loader to fetch assignment detail
- [x] **T070** Implement main page component `frontend/src/pages/AssignmentDetailPage.tsx` composing all sub-components (metadata, SLA, work item, comments, checklist, timeline, observers, engagement context banner, related tasks)
- [x] **T071** Setup Supabase Realtime subscriptions in `AssignmentDetailPage` for: assignments table (status changes), assignment_comments (new comments), comment_reactions (reactions), assignment_checklist_items (completions), assignment_events (timeline), workflow_stage updates
- [x] **T072** Add keyboard shortcuts using `react-hotkeys-hook`: E = escalate, C = comment input focus, K = open kanban modal (only if engagement-linked), Tab navigation
- [x] **T073** Add error boundaries in `AssignmentDetailPage` with bilingual error messages, auto-redirect to /assignments on 404, retry button for network errors

## Phase 3.7: i18n Translations [P] (Parallel)

- [x] **T074** [P] Add English translations to `frontend/src/i18n/en/assignments.json` for all assignment detail labels, actions, errors, timeline events, engagement context, kanban columns
- [x] **T075** [P] Add Arabic translations to `frontend/src/i18n/ar/assignments.json` for all assignment detail labels (RTL-compatible), actions, errors, timeline events, engagement context, kanban columns

## Phase 3.8: E2E Tests (Sequential after T069-T073)

- [x] **T076** E2E test `frontend/tests/e2e/view-assignment-detail.spec.ts` - navigate to assignment, verify all sections visible, metadata correct, SLA countdown active
- [x] **T077** E2E test `frontend/tests/e2e/add-comment-with-mention.spec.ts` - add comment with @username, verify mention rendered as link, notification sent
- [x] **T078** E2E test `frontend/tests/e2e/react-to-comment.spec.ts` - toggle reaction on comment, verify count updates, toggle again to remove
- [x] **T079** E2E test `frontend/tests/e2e/add-complete-checklist-items.spec.ts` - add manual item, complete items, verify progress percentage updates
- [x] **T080** E2E test `frontend/tests/e2e/import-checklist-template.spec.ts` - open template selector, import template, verify all items created with sequence
- [x] **T081** E2E test `frontend/tests/e2e/escalate-assignment.spec.ts` - click escalate button, enter reason, confirm, verify observer added to list, timeline event
- [x] **T081b** E2E test `frontend/tests/e2e/prevent-duplicate-escalation.spec.ts` - escalate assignment, verify escalate button disabled, attempt second escalation via API, verify 400 error returned (per spec.md FR-009 and edge case line 122)
- [x] **T082** E2E test `frontend/tests/e2e/observer-accepts-assignment.spec.ts` - login as supervisor, view escalated assignment, click "Accept Assignment", verify assignee changed
- [x] **T083** E2E test `frontend/tests/e2e/mark-assignment-complete.spec.ts` - click "Mark Complete", enter notes, confirm, verify status=completed, SLA stopped
- [x] **T084** E2E test `frontend/tests/e2e/realtime-updates-two-windows.spec.ts` - open assignment in 2 windows, add comment in window 1, verify appears in window 2 < 1 second
- [x] **T085** E2E test `frontend/tests/e2e/bilingual-support-switch-locale.spec.ts` - view assignment in English, switch to Arabic, verify RTL layout, translated labels
- [x] **T086** E2E test `frontend/tests/e2e/keyboard-navigation-accessibility.spec.ts` - Tab through all interactive elements, verify focus indicators, test keyboard shortcuts (E, C, K)
- [x] **T087** E2E test `frontend/tests/e2e/screen-reader-announcements.spec.ts` - enable screen reader, verify timeline announced as feed, new comments announced via aria-live
- [x] **T088** E2E test `frontend/tests/e2e/view-engagement-linked-assignment.spec.ts` - navigate to engagement-linked assignment, verify context banner visible, progress bar shows correct stats, related tasks listed
- [x] **T089** E2E test `frontend/tests/e2e/view-standalone-assignment.spec.ts` - navigate to standalone assignment (no engagement_id), verify no context banner, no kanban button
- [x] **T090** E2E test `frontend/tests/e2e/navigate-between-related-tasks.spec.ts` - on engagement-linked assignment, click sibling task, verify navigation, related tasks list updates
- [x] **T091** E2E test `frontend/tests/e2e/open-kanban-board.spec.ts` - click "Show Kanban" button, verify modal opens, 4 columns visible, current assignment highlighted
- [x] **T092** E2E test `frontend/tests/e2e/drag-task-between-kanban-columns.spec.ts` - drag task from "To Do" to "In Progress", verify column counts update, workflow_stage saved to database
- [x] **T093** E2E test `frontend/tests/e2e/realtime-kanban-updates-two-windows.spec.ts` - open kanban in 2 windows, drag task in window 1, verify task moves in window 2 < 1 second
- [x] **T094** E2E test `frontend/tests/e2e/keyboard-navigation-kanban.spec.ts` - open kanban, Tab through cards, verify focus indicators, test Arrow keys for navigation, Enter to open card, Esc to close modal
- [x] **T095** E2E test `frontend/tests/e2e/workflow-stage-auto-sync-with-status.spec.ts` - mark assignment complete via "Mark Complete" button, verify workflow_stage auto-updates to 'done', kanban reflects change

## Phase 3.9: Performance & Security (Sequential after E2E)

- [x] **T096** Performance test `frontend/tests/performance/realtime-latency.spec.ts` - measure latency for comment, checklist, reaction, escalation updates < 1 second target
- [x] **T097** Performance test `frontend/tests/performance/kanban-drag-drop-latency.spec.ts` - measure optimistic update latency < 100ms, database persistence < 500ms
- [x] **T098** Performance test `frontend/tests/performance/bundle-size.spec.ts` - verify initial bundle < 300KB (gzipped), assignment detail chunk < 50KB, i18n locales < 20KB each (lazy loaded)
- [x] **T099** Security test `backend/tests/integration/rls-policies-enforce-permissions.test.ts` - verify RLS policies prevent unauthorized access to assignments, comments, checklist, reactions, observers
- [x] **T099b** Observability test `backend/tests/integration/audit-log-completeness.test.ts` - perform all assignment actions (escalate, complete, comment, checklist update, workflow stage change), verify all events logged to `assignment_events` table with timestamp and actor_user_id (per spec.md NFR-Observability)
- [x] **T100** Security test `backend/tests/integration/assignment-rate-limiting.test.ts` - verify rate limits enforced: 10 comments/min per assignment, 1 escalation/hour per assignment, 60 requests/min per user
- [x] **T101** Security test `backend/tests/integration/mention-validation-unauthorized-users.test.ts` - verify @mention validation blocks unauthorized users, no notification sent to users without view permission
- [x] **T102** Security test `backend/tests/integration/engagement-access-control.test.ts` - verify RLS policies on engagement-linked assignments, sibling assignments, kanban board data

## Phase 3.10: Documentation (Parallel)

- [x] **T103** [P] Update API documentation in `docs/api/assignment-detail-api.md` with all 12 endpoint specs, request/response examples, error codes, engagement-related endpoints
- [x] **T104** [P] Add Storybook stories for all UI components in `frontend/src/components/**/*.stories.tsx` (if Storybook configured - SKIPPED: Storybook not configured in project)

## Dependencies

**Critical Path** (longest sequential chain):
```
T001-T014 (Database Setup) 
  → T027-T038 (Backend Edge Functions) 
  → T039-T050 (Frontend Hooks - parallel) 
  → T051-T068 (Frontend Components - parallel) 
  → T069-T073 (Route Integration) 
  → T076-T095 (E2E Tests) 
  → T096-T102 (Performance/Security)
```

**Parallel Execution Groups**:
1. **T015-T026**: All contract tests (different files)
2. **T039-T050**: All TanStack Query hooks (different files)
3. **T051-T068**: All UI components (different files)
4. **T074-T075**: i18n translations (different files)
5. **T103-T104**: Documentation (different files)

**Blocking Dependencies**:
- T015-T026 can start after T014 (need database types)
- T027-T038 must wait for T015-T026 (TDD: tests first)
- T039-T050 must wait for T014 (need database types)
- T051-T068 must wait for T014 (need database types)
- T069-T073 must wait for T039-T050 AND T051-T068 (need hooks + components)
- T076-T095 must wait for T069-T073 (need working feature)
- T096-T102 must wait for T076-T095 (need E2E passing)

## Parallel Execution Example

**Launch Database Setup** (Sequential):
```bash
Task: "Create migration for engagement context columns"
# After T001-T014 complete, launch contract tests in parallel:
```

**Launch Contract Tests** (Parallel):
```bash
Task: "Contract test GET /assignments-get/{id}"
Task: "Contract test POST /assignments-comments-create"
Task: "Contract test POST /assignments-comments-reactions-toggle"
Task: "Contract test POST /assignments-checklist-create-item"
Task: "Contract test POST /assignments-checklist-import-template"
Task: "Contract test POST /assignments-checklist-toggle-item"
Task: "Contract test POST /assignments-escalate"
Task: "Contract test POST /assignments-complete"
Task: "Contract test POST /assignments-observer-action"
Task: "Contract test GET /assignments-related/{id}"
Task: "Contract test GET /engagements/{id}/kanban"
Task: "Contract test PATCH /assignments/{id}/workflow-stage"
```

**Launch Frontend Hooks** (Parallel after T014):
```bash
Task: "Create useAssignmentDetail hook with real-time subscription"
Task: "Create useAddComment mutation hook with optimistic update"
Task: "Create useToggleReaction mutation hook"
Task: "Create useAddChecklistItem mutation hook"
Task: "Create useImportChecklistTemplate mutation hook"
Task: "Create useToggleChecklistItem mutation hook"
Task: "Create useEscalateAssignment mutation hook"
Task: "Create useCompleteAssignment mutation hook"
Task: "Create useObserverAction mutation hook"
Task: "Create useRelatedAssignments hook with real-time"
Task: "Create useEngagementKanban hook with real-time"
Task: "Create useUpdateWorkflowStage mutation hook"
```

**Launch UI Components** (Parallel after T014):
```bash
Task: "Create AssignmentMetadataCard component"
Task: "Create SLACountdown component"
Task: "Create WorkItemPreview component"
Task: "Create CommentList component"
Task: "Create CommentForm component"
Task: "Create ReactionPicker component"
Task: "Create ChecklistSection component"
Task: "Create ChecklistItemRow component"
Task: "Create ChecklistTemplateSelector component"
Task: "Create Timeline component"
Task: "Create ObserversList component"
Task: "Create EscalateDialog component"
Task: "Create CompleteDialog component"
Task: "Create EngagementContextBanner component"
Task: "Create RelatedTasksList component"
Task: "Create EngagementKanbanDialog component"
Task: "Create KanbanColumn component"
Task: "Create KanbanTaskCard component"
```

## Validation Checklist
*GATE: Verify before marking feature complete*

- [x] All 12 API contracts have corresponding tests (T015-T026)
- [x] All 8 database entities have migration tasks (T001-T008)
- [x] All contract tests come before Edge Function implementation (T015-T026 → T027-T038)
- [x] All parallel tasks are truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Engagement context integrated in: T001 (migration), T027 (get assignment), T039 (hook), T064-T068 (UI), T088-T095 (E2E)
- [x] Kanban feature integrated in: T001 (workflow_stage), T037-T038 (endpoints), T049-T050 (hooks), T066-T068 (UI), T091-T095 (E2E)

## Notes

- **Total Tasks**: 106 tasks across 10 phases (includes T081b, T099b added during analysis)
- **New Features**: Engagement context (9 tasks), Kanban board (11 tasks), Duplicate prevention test (1 task), Observability test (1 task) - 28 new tasks total
- **Estimated Duration**: ~3-4 weeks (assuming 3-5 tasks/day)
- **Parallelization**: ~60% of tasks can run in parallel (contract tests, hooks, components, translations, docs)
- **TDD Approach**: All contract tests (T015-T026) MUST fail before implementing Edge Functions (T027-T038)
- **Real-time Focus**: Supabase Realtime subscriptions in T039, T048, T049, T071 for <1 second latency
- **Accessibility**: WCAG 2.1 AA compliance verified in T086-T087, keyboard navigation, screen reader support
- **Bilingual**: Arabic RTL + English LTR throughout, verified in T085
- **Security**: RLS policies on all tables (T009), rate limiting (T100), @mention validation (T101)

---

**Status**: Tasks generated ✅
**Ready for**: Phase 3 execution - start with T001 (Database Setup)
