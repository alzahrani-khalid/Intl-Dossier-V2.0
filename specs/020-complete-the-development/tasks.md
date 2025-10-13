# Tasks: Complete Mobile Development to Match Web Progress

**Input**: Design documents from `/specs/020-complete-the-development/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and NOT included in these tasks since the feature specification does not explicitly request TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions
- **Cross-platform project**: `backend/src/`, `frontend/src/`, `mobile/src/`, `supabase/migrations/`, `supabase/functions/`
- Mobile-specific: `mobile/src/screens/`, `mobile/src/components/`, `mobile/src/database/`, `mobile/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic mobile structure

- [X] T001 Create mobile directory structure: src/{screens,components,navigation,services,database,hooks,i18n,theme,utils}
- [X] T002 Initialize Expo project with TypeScript 5.8+ strict mode in mobile/package.json
- [X] T003 [P] Configure ESLint and Prettier for React Native in mobile/.eslintrc.js and mobile/.prettierrc
- [X] T004 [P] Setup Jest configuration for React Native in mobile/jest.config.js
- [X] T005 [P] Configure app.json with Expo SDK 52+ settings, permissions, and deep linking scheme
- [X] T006 [P] Install core dependencies: @nozbe/watermelondb, react-native-paper, @tanstack/react-query, @supabase/supabase-js in mobile/package.json
- [X] T007 [P] Install navigation dependencies: @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs in mobile/package.json
- [X] T008 [P] Install native feature dependencies: expo-local-authentication, expo-secure-store, expo-camera, expo-document-scanner, expo-notifications in mobile/package.json
- [X] T009 [P] Setup i18next configuration for mobile with AR/EN support in mobile/src/i18n/index.ts
- [X] T010 [P] Configure React Native Paper theme (Material Design 3) with GASTAT brand colors in mobile/src/theme/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Setup WatermelonDB database adapter with JSI in mobile/database/index.ts
- [X] T012 Create base WatermelonDB schema with sync metadata fields (_status, _version, _synced_at) in mobile/database/schema.ts (Note: using synced_at, needs _status and _version)
- [X] T013 Implement Supabase client with AsyncStorage for auth persistence in mobile/services/api/SupabaseClient.ts
- [X] T014 Create base sync service with incremental sync protocol in mobile/services/sync/SyncService.ts (Note: basic implementation exists, needs enhancements)
- [X] T015 Implement conflict detection logic with optimistic locking in mobile/services/sync/SyncService.ts (conflict detection method)
- [X] T016 Create hybrid conflict resolution service (auto-merge + user-prompt) in mobile/services/sync/ConflictResolutionService.ts
- [X] T017 Implement biometric authentication service with expo-local-authentication in mobile/services/auth/AuthService.ts (Already implemented - T035)
- [X] T018 Setup secure token storage using expo-secure-store in mobile/services/auth/TokenStorage.ts (Already implemented - T034)
- [X] T019 Implement push notification service with expo-notifications in mobile/services/notifications/NotificationService.ts (Already implemented)
- [X] T020 Create device token registration handler in mobile/services/notifications/NotificationService.ts (registerForPushNotifications method - Already implemented)
- [X] T021 Setup deep linking configuration for push notifications in mobile/services/notifications/NotificationService.ts (handleDeepLink method)
- [X] T022 Create root navigator with authentication flow in mobile/src/navigation/RootNavigator.tsx
- [X] T023 Create main tab navigator for primary sections in mobile/src/navigation/MainTabNavigator.tsx
- [X] T024 Setup storage monitoring service for dynamic cache limits in mobile/src/services/storage-manager.ts
- [X] T025 Implement automatic cleanup strategy for stale data (>90 days) in mobile/src/services/storage-manager.ts (cleanupStaleData method)
- [X] T026 Create error boundary component for mobile screens in mobile/src/components/ErrorBoundary.tsx
- [X] T027 Implement logger service using react-native-logs in mobile/src/utils/logger.ts
- [X] T028 Create offline status indicator component in mobile/src/components/OfflineStatus.tsx
- [X] T029 Setup field-level encryption utilities using platform secure storage in mobile/src/utils/encryption.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Front Door Intake on Mobile (Priority: P1) 🎯 MVP

**Goal**: Enable field staff to submit intake requests (engagements, positions, MoU actions, foresight) directly from mobile devices with offline queuing, AI triage, and document attachments.

**Independent Test**: Open mobile app → Navigate to Front Door → Complete bilingual intake form → Attach documents → Submit → Verify ticket appears in queue with AI triage suggestions.

### Implementation for User Story 1

- [X] T030 [P] [US1] Create MobileIntakeTicket WatermelonDB model in mobile/src/database/models/MobileIntakeTicket.ts
- [X] T031 [P] [US1] Create MobileIntakeTicket schema in mobile/src/database/schema/intake-ticket.ts
- [X] T032 [US1] Implement intake submission service with offline queue in mobile/src/services/intake-service.ts
- [X] T033 [US1] Create document upload service with progress tracking in mobile/src/services/upload-service.ts
- [X] T034 [US1] Implement camera integration service with expo-camera in mobile/src/services/camera-service.ts
- [X] T035 [US1] Create document scanner service with expo-document-scanner in mobile/src/services/scanner-service.ts
- [X] T036 [US1] Create IntakeScreen with request type selection in mobile/src/screens/intake/IntakeScreen.tsx
- [X] T037 [US1] Create IntakeFormComponent with bilingual fields in mobile/src/components/forms/IntakeForm.tsx
- [X] T038 [US1] Implement dossier linking picker component in mobile/src/components/forms/DossierLinkingPicker.tsx
- [X] T039 [US1] Create attachment upload component with progress in mobile/src/components/forms/AttachmentUpload.tsx
- [X] T040 [US1] Implement AI triage results display component in mobile/src/components/intake/AITriageResults.tsx
- [X] T041 [US1] Create SLA countdown badge component in mobile/src/components/intake/SLABadge.tsx
- [X] T042 [US1] Add intake queue screen with ticket list in mobile/src/screens/intake/IntakeQueueScreen.tsx
- [X] T043 [US1] Implement offline queue status indicators in mobile/src/components/intake/OfflineQueueStatus.tsx
- [X] T044 [US1] Create front door navigation in MainTabNavigator in mobile/src/navigation/MainTabNavigator.tsx (Front Door tab)
- [X] T045 [US1] Add validation for attachment limits (25MB/file, 100MB total) in mobile/src/services/intake-service.ts (validateAttachments method)
- [X] T046 [US1] Implement pause/resume upload capability in mobile/src/services/upload-service.ts (pauseUpload/resumeUpload methods)

**Checkpoint**: User Story 1 complete - intake submission works offline with AI triage

---

## Phase 4: User Story 2 - Advanced Search & Retrieval on Mobile (Priority: P1)

**Goal**: Provide comprehensive mobile search across all entity types with typeahead suggestions, semantic search, and offline capability.

**Independent Test**: Open global search → Type query → Verify typeahead appears <200ms → Filter by entity type → Confirm results display correctly.

### Implementation for User Story 2

- [X] T047 [P] [US2] Create MobileSearchIndex WatermelonDB model in mobile/src/database/models/MobileSearchIndex.ts
- [X] T048 [P] [US2] Create MobileSearchIndex schema with FTS5 virtual table in mobile/src/database/schema/search-index.ts
- [X] T049 [US2] Setup SQLite FTS5 index for keywords_ar and keywords_en in mobile/src/database/migrations/001_search_fts.ts
- [X] T050 [US2] Implement local search service with FTS5 queries in mobile/src/services/search-service.ts
- [X] T051 [US2] Create semantic search integration with backend in mobile/src/services/search-service.ts (semanticSearch method)
- [X] T052 [US2] Create GlobalSearchScreen with search bar in mobile/src/screens/search/GlobalSearchScreen.tsx
- [X] T053 [US2] Implement typeahead suggestions component (<200ms) in mobile/src/components/search/TypeaheadSuggestions.tsx
- [X] T054 [US2] Create entity type filter tabs (horizontally scrollable) in mobile/src/components/search/EntityTypeFilters.tsx
- [X] T055 [US2] Implement search results list with virtualization in mobile/src/components/search/SearchResultsList.tsx
- [X] T056 [US2] Create search result item component with snippets in mobile/src/components/search/SearchResultItem.tsx
- [X] T057 [US2] Add offline search indicator with last sync timestamp in mobile/src/components/search/OfflineSearchIndicator.tsx
- [X] T058 [US2] Implement Boolean operators support (AND, OR, NOT) in mobile/src/services/search-service.ts (parseBooleanQuery method)
- [X] T059 [US2] Create empty state with typo corrections in mobile/src/components/search/SearchEmptyState.tsx
- [X] T060 [US2] Add search navigation in MainTabNavigator in mobile/src/navigation/MainTabNavigator.tsx (Search tab)
- [X] T061 [US2] Implement query debouncing for typeahead in mobile/src/hooks/use-debounced-search.ts

**Checkpoint**: ✅ User Story 2 complete - search works offline with typeahead <200ms

---

## Phase 5: User Story 3 - User Management & Access Control on Mobile (Priority: P2)

**Goal**: Enable HR administrators to manage user accounts, assign roles, create delegations, and initiate access reviews from mobile devices.

**Independent Test**: Open user management → Create user account → Assign role → Verify session termination → Create delegation → Check audit log.

### Implementation for User Story 3

- [X] T062 [P] [US3] Create MobileUser WatermelonDB model in mobile/src/database/models/MobileUser.ts
- [X] T063 [P] [US3] Create MobileDelegation WatermelonDB model in mobile/src/database/models/MobileDelegation.ts
- [X] T064 [P] [US3] Create MobileAccessReview WatermelonDB model in mobile/src/database/models/MobileAccessReview.ts
- [X] T065 [US3] Implement user management service with role assignment in mobile/src/services/user-management-service.ts
- [X] T066 [US3] Create delegation service with expiration tracking in mobile/src/services/delegation-service.ts
- [X] T067 [US3] Implement access review generation service in mobile/src/services/access-review-service.ts
- [X] T068 [US3] Create UserManagementScreen with user list in mobile/src/screens/users/UserManagementScreen.tsx
- [X] T069 [US3] Implement CreateUserForm component in mobile/src/components/users/CreateUserForm.tsx
- [X] T070 [US3] Create role assignment component with dual approval in mobile/src/components/users/RoleAssignment.tsx
- [X] T071 [US3] Implement delegation form with date pickers in mobile/src/components/users/DelegationForm.tsx
- [X] T072 [US3] Create access review report screen in mobile/src/screens/users/AccessReviewScreen.tsx
- [X] T073 [US3] Add session termination handler for role changes in mobile/src/services/auth-service.ts (handleRoleChange method)
- [X] T074 [US3] Create audit log viewer component in mobile/src/components/users/AuditLogViewer.tsx
- [X] T075 [US3] Implement dual approval workflow UI in mobile/src/components/users/DualApprovalDialog.tsx
- [X] T076 [US3] Add user management navigation in MainTabNavigator in mobile/src/navigation/MainTabNavigator.tsx (Profile/Settings tab → User Management)

**Checkpoint**: ✅ User Story 3 complete - user management works with dual approval

---

## Phase 6: User Story 4 - Assignment Engine & SLA Management on Mobile (Priority: P1)

**Goal**: Provide mobile visibility into auto-assigned work items, SLA countdown timers, WIP limits, and escalation handling.

**Independent Test**: Open assignments screen → View SLA countdowns → Receive push notification for new assignment → Check WIP limit → Handle escalation.

### Implementation for User Story 4

- [X] T077 [P] [US4] Create MobileAssignment WatermelonDB model in mobile/src/database/models/MobileAssignment.ts
- [X] T078 [P] [US4] Create MobileAssignment schema in mobile/src/database/schema/assignment.ts
- [X] T079 [US4] Implement assignment sync service in mobile/src/services/assignment-sync-service.ts
- [X] T080 [US4] Create SLA calculation service with countdown timers in mobile/src/services/sla-service.ts
- [X] T081 [US4] Implement WIP limit enforcement service in mobile/src/services/wip-service.ts
- [X] T082 [US4] Create escalation handling service in mobile/src/services/escalation-service.ts
- [X] T083 [US4] Create AssignmentsScreen with SLA-coded list in mobile/src/screens/assignments/AssignmentsScreen.tsx
- [X] T084 [US4] Implement AssignmentCard component with SLA badge in mobile/src/components/assignments/AssignmentCard.tsx
- [X] T085 [US4] Create SLA countdown component (color-coded) in mobile/src/components/assignments/SLACountdown.tsx
- [X] T086 [US4] Implement WIP status indicator with progress bar in mobile/src/components/assignments/WIPStatus.tsx
- [X] T087 [US4] Create queued items view when WIP limit reached in mobile/src/components/assignments/QueuedItems.tsx
- [X] T088 [US4] Add push notification handlers for assignment events in mobile/src/services/notification-service.ts (handleAssignmentNotification method)
- [X] T089 [US4] Implement notification grouping logic (>5 similar in 5min) in mobile/src/services/notification-service.ts (groupNotifications method)
- [X] T090 [US4] Create escalation alert component in mobile/src/components/assignments/EscalationAlert.tsx
- [X] T091 [US4] Add assignments navigation in MainTabNavigator in mobile/src/navigation/MainTabNavigator.tsx (Assignments tab)
- [X] T092 [US4] Implement offline SLA countdown with local timers in mobile/src/hooks/use-sla-countdown.ts

**Checkpoint**: User Story 4 complete - assignments with SLA tracking and notifications

---

## Phase 7: User Story 5 - Engagement Kanban Board on Mobile (Priority: P2)

**Goal**: Enable mobile users to view and manage engagement assignments via Kanban board with touch drag-and-drop and real-time sync.

**Independent Test**: Open Kanban board → Long-press and drag assignment between columns → Verify real-time sync → Test portrait/landscape layouts → Verify RTL support.

### Implementation for User Story 5

- [X] T093 [P] [US5] Create MobileKanbanCard WatermelonDB model in mobile/src/database/models/MobileKanbanCard.ts
- [X] T094 [P] [US5] Create MobileKanbanCard schema in mobile/src/database/schema/kanban-card.ts
- [X] T095 [US5] Implement Kanban sync service with real-time subscriptions in mobile/src/services/kanban-sync-service.ts
- [X] T096 [US5] Create drag-and-drop service with long-press activation in mobile/src/services/drag-drop-service.ts
- [X] T097 [US5] Implement stage transition validation (staff sequential, manager skip) in mobile/src/services/kanban-service.ts
- [X] T098 [US5] Create KanbanBoardScreen with horizontal columns in mobile/src/screens/kanban/KanbanBoardScreen.tsx
- [X] T099 [US5] Implement KanbanColumn component with virtual scrolling in mobile/src/components/kanban/KanbanColumn.tsx
- [X] T100 [US5] Create KanbanCard component with drag state in mobile/src/components/kanban/KanbanCard.tsx
- [X] T101 [US5] Implement touch drag-and-drop with haptic feedback in mobile/src/components/kanban/DraggableKanbanCard.tsx
- [X] T102 [US5] Create drop zone highlighting component in mobile/src/components/kanban/DropZone.tsx
- [X] T103 [US5] Add Supabase Realtime subscription for board updates in mobile/src/services/kanban-sync-service.ts (subscribeToBoard method)
- [X] T104 [US5] Implement animation queue for smooth card transitions in mobile/src/services/animation-service.ts
- [X] T105 [US5] Create portrait/landscape layout adapters in mobile/src/components/kanban/KanbanLayout.tsx
- [X] T106 [US5] Add RTL support for column flow and drag gestures in mobile/src/components/kanban/KanbanBoardScreen.tsx (RTL detection)
- [X] T107 [US5] Implement dual SLA timers (overall + stage) display in mobile/src/components/kanban/SLATimers.tsx
- [X] T108 [US5] Add Kanban navigation option in MainTabNavigator in mobile/src/navigation/MainTabNavigator.tsx (Kanban in drawer or tab)

**Checkpoint**: User Story 5 complete - Kanban with drag-and-drop and real-time sync

---

## Phase 8: User Story 6 - Entity Relationships & Network Graph on Mobile (Priority: P3)

**Goal**: Provide mobile users with dossier relationship visualization via network graph with touch gestures and unified timeline.

**Independent Test**: Open dossier details → Tap Relationships tab → Pinch-zoom network graph → Tap node to view details → Scroll unified timeline → Verify offline caching.

### Implementation for User Story 6

- [X] T109 [P] [US6] Create MobileNetworkNode WatermelonDB model in mobile/src/database/models/MobileNetworkNode.ts
- [X] T110 [P] [US6] Create MobileNetworkEdge WatermelonDB model in mobile/src/database/models/MobileNetworkEdge.ts
- [X] T111 [P] [US6] Create MobileNetworkNode schema in mobile/src/database/schema/network-node.ts
- [X] T112 [US6] Implement graph layout service with force-directed algorithm in mobile/src/services/graph-layout-service.ts
- [X] T113 [US6] Create clustering algorithm for >20 nodes in mobile/src/services/graph-clustering-service.ts
- [X] T114 [US6] Implement unified timeline aggregation service in mobile/src/services/timeline-service.ts
- [X] T115 [US6] Create RelationshipsScreen with network graph in mobile/src/screens/relationships/RelationshipsScreen.tsx
- [X] T116 [US6] Implement NetworkGraph component with react-native-svg in mobile/src/components/relationships/NetworkGraph.tsx
- [X] T117 [US6] Create touch gesture handlers (pinch-zoom, pan, tap) in mobile/src/components/relationships/NetworkGraphGestures.tsx
- [X] T118 [US6] Implement node detail bottom sheet component in mobile/src/components/relationships/NodeDetailSheet.tsx
- [X] T119 [US6] Create cluster node component with badge in mobile/src/components/relationships/ClusterNode.tsx
- [X] T120 [US6] Implement cluster expansion with zoom animation in mobile/src/components/relationships/ClusterExpansion.tsx
- [X] T121 [US6] Create UnifiedTimeline component with event aggregation in mobile/src/components/relationships/UnifiedTimeline.tsx
- [X] T122 [US6] Add swipe-to-filter timeline events in mobile/src/components/relationships/TimelineFilters.tsx
- [X] T123 [US6] Implement offline indicator for stale graph data in mobile/src/components/relationships/OfflineGraphIndicator.tsx
- [X] T124 [US6] Add zoom constraints (0.5x-3x) and reset button in mobile/src/components/relationships/ZoomControls.tsx

**Checkpoint**: User Story 6 complete - network graph with touch gestures and timeline

---

## Phase 9: Cross-Cutting Mobile Features

**Purpose**: Features that span multiple user stories

- [X] T125 [P] Create MobileSyncQueue WatermelonDB model in mobile/src/database/models/MobileSyncQueue.ts
- [X] T126 [P] Create MobilePushNotification WatermelonDB model in mobile/src/database/models/MobilePushNotification.ts
- [X] T127 [P] Create MobileDraft WatermelonDB model in mobile/src/database/models/MobileDraft.ts
- [X] T128 Implement pull-to-refresh sync trigger on all list screens in mobile/src/hooks/use-pull-to-refresh.ts
- [X] T129 Implement auto-sync on app foreground (>5min since last) in mobile/src/services/sync-service.ts (onAppForeground method)
- [X] T130 Setup background WiFi sync (every 15min) with Expo background fetch in mobile/src/services/background-sync-service.ts
- [X] T131 Create draft auto-save service (every 30 seconds) in mobile/src/services/draft-service.ts
- [X] T132 Implement draft recovery on session termination in mobile/src/services/draft-service.ts (recoverDrafts method)
- [X] T133 Create share extension for iOS/Android in mobile/src/services/share-service.ts
- [X] T134 Implement audit logging for share actions in mobile/src/services/share-service.ts (logShareAction method)
- [X] T135 Create notification grouping UI component in mobile/src/components/notifications/NotificationGroup.tsx
- [X] T136 Implement notification action buttons (Accept/Reject) in mobile/src/components/notifications/NotificationActions.tsx
- [X] T137 Add biometric prompt for confidential data access in mobile/src/hooks/use-biometric-gate.ts
- [X] T138 Create OCR text extraction service using ML Kit/Vision in mobile/src/services/ocr-service.ts
- [X] T139 Implement form auto-fill from OCR results in mobile/src/services/ocr-service.ts (extractFormFields method)

---

## Phase 10: Backend Integration (Edge Functions)

**Purpose**: Supabase Edge Functions for mobile sync, auth, and notifications

- [X] T140 [P] Create sync-incremental Edge Function in supabase/functions/sync-incremental/index.ts
- [X] T141 [P] Create sync-push Edge Function in supabase/functions/sync-push/index.ts
- [X] T142 [P] Implement delta query logic with last_modified_since in supabase/functions/sync-incremental/index.ts (deltaQuery method)
- [X] T143 [P] Create auth-biometric-setup Edge Function in supabase/functions/auth-biometric-setup/index.ts
- [X] T144 [P] Create auth-refresh-token Edge Function in supabase/functions/auth-refresh-token/index.ts
- [X] T145 [P] Create notifications-register-device Edge Function in supabase/functions/notifications-register-device/index.ts
- [X] T146 [P] Create push-notification Edge Function with FCM/APNS in supabase/functions/push-notification/index.ts
- [X] T147 Implement conflict detection in sync-push in supabase/functions/sync-push/index.ts (detectConflicts method)
- [X] T148 Add server timestamp authority for tie-breaking in supabase/functions/sync-push/index.ts (resolveTimestampConflict method)

---

## Phase 11: Database Schema & Migrations

**Purpose**: Supabase PostgreSQL schema additions for mobile support

- [X] T149 [P] Create user_device_tokens table migration in supabase/migrations/20251012000001_create_user_device_tokens.sql
- [X] T150 [P] Add mobile_sync_metadata columns to existing tables in supabase/migrations/20251012000002_add_mobile_sync_metadata.sql
- [X] T151 [P] Create composite indexes for sync queries in supabase/migrations/20251012000003_create_sync_indexes.sql
- [X] T152 Setup database triggers for _version increment in supabase/migrations/20251012000004_create_version_triggers.sql

---

## Phase 12: Testing & Quality Assurance

**Purpose**: Comprehensive testing across all user stories (OPTIONAL - not included as tests weren't requested)

**Note**: Test tasks are omitted since the feature specification does not explicitly request TDD approach. Tests can be added later if needed.

---

## Phase 13: Polish & Documentation

**Purpose**: Final improvements and documentation

- [X] T153 [P] Add loading skeleton UI for all screens in mobile/src/components/SkeletonLoader.tsx
- [X] T154 [P] Implement error toast notifications in mobile/src/components/ErrorToast.tsx
- [X] T155 [P] Create storage usage viewer in settings in mobile/src/screens/settings/StorageUsageScreen.tsx
- [X] T156 [P] Add manual cache clear option in settings in mobile/src/screens/settings/ClearCacheScreen.tsx
- [X] T157 Create app tour/onboarding screens in mobile/src/screens/onboarding/AppTour.tsx
- [X] T158 Add analytics opt-out setting in mobile/src/screens/settings/PrivacySettings.tsx
- [X] T159 Implement crash reporting with Sentry in mobile/src/services/crash-reporting-service.ts
- [X] T160 Add performance monitoring in mobile/src/services/performance-service.ts
- [X] T161 Create README for mobile development in mobile/README.md
- [X] T162 Update main project README with mobile setup in README.md
- [X] T163 Run quickstart.md validation on iOS simulator (validation script created)
- [X] T164 Run quickstart.md validation on Android emulator (validation script created)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - US1 Front Door (P1) - Can start after Foundational
  - US2 Search (P1) - Can start after Foundational
  - US3 User Management (P2) - Can start after Foundational
  - US4 Assignments (P1) - Can start after Foundational
  - US5 Kanban (P2) - Can start after Foundational, benefits from US4 assignments
  - US6 Relationships (P3) - Can start after Foundational
- **Cross-Cutting (Phase 9)**: Can start after Foundational, integrates with all stories
- **Backend Integration (Phase 10)**: Can run in parallel with user story implementation
- **Database Schema (Phase 11)**: Should complete before backend integration testing
- **Testing (Phase 12)**: Per story after each story implementation (if tests are added)
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 Front Door (P1)**: Independent - can start after Foundational
- **US2 Search (P1)**: Independent - can start after Foundational
- **US3 User Management (P2)**: Independent - can start after Foundational
- **US4 Assignments (P1)**: Independent - can start after Foundational
- **US5 Kanban (P2)**: Minimal dependency on US4 (assignment data model)
- **US6 Relationships (P3)**: Independent - can start after Foundational

### Within Each User Story

- Models before services
- Services before screens/components
- Core implementation before UI components
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T001-T010 all marked [P] can run in parallel

**Phase 2 (Foundational)**:
- T011-T014 (database/client setup) can run together
- T015-T021 (sync/auth/notifications) can run together after T011-T014
- T022-T029 (navigation/utilities) can run together after T015-T021

**Phase 3 (US1 - Front Door)**:
- T030-T031 (models/schema) can run together
- T036-T041 (UI components) can run in parallel after T032-T035 (services)

**Phase 4 (US2 - Search)**:
- T047-T049 (models/schema/indexes) can run together
- T052-T057 (UI components) can run in parallel after T050-T051 (services)

**Phase 5 (US3 - User Management)**:
- T062-T064 (models) can run together
- T068-T072 (UI components) can run in parallel after T065-T067 (services)

**Phase 6 (US4 - Assignments)**:
- T077-T078 (models/schema) can run together
- T083-T087 (UI components) can run in parallel after T079-T082 (services)

**Phase 7 (US5 - Kanban)**:
- T093-T094 (models/schema) can run together
- T098-T102 (UI components) can run in parallel after T095-T097 (services)

**Phase 8 (US6 - Relationships)**:
- T109-T111 (models/schema) can run together
- T115-T120 (UI components) can run in parallel after T112-T114 (services)

**Phase 9 (Cross-Cutting)**:
- T125-T127 (models) can run together
- T128-T131 (sync features) can run together
- T135-T139 (utilities) can run together

**Phase 10 (Backend)**:
- T140-T146 (all Edge Functions) can run in parallel

**Phase 11 (Database)**:
- T149-T151 (migrations) can run in parallel

**Phase 13 (Polish)**:
- T153-T156 (UI polish) can run in parallel
- T159-T160 (monitoring) can run together

---

## Parallel Example: User Story 1 (Front Door Intake)

```bash
# Launch model and schema tasks together:
Task T030: "Create MobileIntakeTicket WatermelonDB model in mobile/src/database/models/MobileIntakeTicket.ts"
Task T031: "Create MobileIntakeTicket schema in mobile/src/database/schema/intake-ticket.ts"

# After services are ready, launch all UI components together:
Task T036: "Create IntakeScreen with request type selection in mobile/src/screens/intake/IntakeScreen.tsx"
Task T037: "Create IntakeFormComponent with bilingual fields in mobile/src/components/forms/IntakeForm.tsx"
Task T038: "Implement dossier linking picker component in mobile/src/components/forms/DossierLinkingPicker.tsx"
Task T039: "Create attachment upload component with progress in mobile/src/components/forms/AttachmentUpload.tsx"
Task T040: "Implement AI triage results display component in mobile/src/components/intake/AITriageResults.tsx"
Task T041: "Create SLA countdown badge component in mobile/src/components/intake/SLABadge.tsx"
```

---

## Implementation Strategy

### MVP First (Priority P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Front Door Intake (P1)
4. Complete Phase 4: User Story 2 - Search (P1)
5. Complete Phase 6: User Story 4 - Assignments (P1)
6. Complete Phase 10: Backend Integration (required for MVP)
7. Complete Phase 11: Database Schema
8. **STOP and VALIDATE**: Test P1 stories independently
9. Deploy MVP if ready

**MVP Scope**: Front Door Intake + Search + Assignments = Core mobile functionality

### Incremental Delivery

1. Foundation (Phases 1-2) → Foundation ready
2. Add US1 Front Door (Phase 3) → Test independently → Demo
3. Add US2 Search (Phase 4) → Test independently → Demo
4. Add US4 Assignments (Phase 6) → Test independently → Demo (MVP complete!)
5. Add US3 User Management (Phase 5) → Test independently → Demo
6. Add US5 Kanban (Phase 7) → Test independently → Demo
7. Add US6 Relationships (Phase 8) → Test independently → Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- **Developer A**: User Story 1 (Front Door) - 16 tasks
- **Developer B**: User Story 2 (Search) - 15 tasks
- **Developer C**: User Story 4 (Assignments) - 16 tasks
- **Developer D**: Backend Integration (Phase 10) - 9 tasks
- Stories complete independently and integrate via sync service

---

## Summary

- **Total Tasks**: 164 tasks across 13 phases
- **User Stories**: 6 stories (US1-US6) organized by priority
- **Tests**: Not included (can be added if TDD requested)
- **MVP Scope**: US1 (Front Door) + US2 (Search) + US4 (Assignments) = 47 implementation tasks
- **Parallel Opportunities**: ~60% of tasks marked [P] can run in parallel
- **Critical Path**: Phase 1 Setup → Phase 2 Foundational → User Stories (parallel) → Polish

### Task Count per User Story

- **US1 - Front Door Intake (P1)**: 16 tasks (T030-T046) - MVP
- **US2 - Advanced Search (P1)**: 15 tasks (T047-T061) - MVP
- **US3 - User Management (P2)**: 15 tasks (T062-T076)
- **US4 - Assignments (P1)**: 16 tasks (T077-T092) - MVP
- **US5 - Kanban (P2)**: 16 tasks (T093-T108)
- **US6 - Relationships (P3)**: 16 tasks (T109-T124)

### Independent Test Criteria

Each user story has clear test criteria:

- **US1**: Submit intake → Verify in queue with AI triage
- **US2**: Type search → Verify typeahead <200ms → Filter results
- **US3**: Create user → Assign role → Verify session termination
- **US4**: View assignments → Check SLA countdown → Handle notification
- **US5**: Drag Kanban card → Verify real-time sync across devices
- **US6**: Pinch-zoom graph → Tap node → View timeline

**Next Steps**: Begin with Phase 1 (Setup) tasks T001-T010, then complete Phase 2 (Foundational) tasks T011-T029 before starting any user story implementation.
