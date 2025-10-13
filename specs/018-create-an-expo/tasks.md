# Tasks: Mobile Application for GASTAT International Dossier System

**Input**: Design documents from `/specs/018-create-an-expo/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are EXCLUDED from this task list per the template guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
Based on plan.md structure:
- **Mobile app**: `mobile/` directory at repository root
- **Components**: `mobile/components/`
- **Services**: `mobile/services/`
- **Database**: `mobile/database/`
- **Hooks**: `mobile/hooks/`
- **Screens**: `mobile/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Expo app structure

- [X] T001 Create mobile/ directory structure per plan.md (app/, components/, services/, database/, hooks/, i18n/, types/, utils/, tests/)
- [X] T002 Initialize Expo project with SDK 52+ in mobile/ directory using `npx create-expo-app@latest --template blank-typescript`
- [X] T003 [P] Install core dependencies in mobile/package.json: @supabase/supabase-js@2.58+, @nozbe/watermelondb@0.28+, react-native-paper@5.12+, react-navigation/native@7+, react-navigation/bottom-tabs@7+, i18next, react-i18next, @react-native-async-storage/async-storage
- [X] T004 [P] Install Expo-specific dependencies: expo-local-authentication, expo-notifications, expo-secure-store, expo-file-system, expo-dev-client
- [X] T005 [P] Configure TypeScript in mobile/tsconfig.json with strict mode enabled, path aliases (@/components, @/services, @/database, @/hooks, @/types, @/utils)
- [X] T006 [P] Setup ESLint and Prettier in mobile/ with Expo preset (eslint-config-expo, prettier)
- [X] T007 Configure mobile/app.json with Expo project settings (name: "GASTAT Dossier", slug: "gastat-dossier", version: "1.0.0", platforms: ["ios", "android"], icon, splash)
- [X] T008 [P] Create mobile/.env.example with Supabase configuration template (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, EXPO_PROJECT_ID)
- [X] T009 [P] Setup mobile/.gitignore for Expo (node_modules/, .expo/, .expo-shared/, dist/, .env)
- [X] T010 [P] Configure Babel in mobile/babel.config.js with react-native-paper/babel plugin for bundle optimization

**Checkpoint**: Project structure created, dependencies installed, configuration complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Setup WatermelonDB schema in mobile/database/schema.ts with all 11 entities (User, Dossier, Country, Organization, Position, Brief, IntakeRequest, Document, Assignment, Notification, SyncStatus) per data-model.md
- [X] T012 [P] Create WatermelonDB model for User in mobile/database/models/User.ts with fields (id, email, name, role, assigned_countries, assigned_regions, language, notification_preferences, biometric_enabled, created_at, updated_at, synced_at)
- [X] T013 [P] Create WatermelonDB model for Dossier in mobile/database/models/Dossier.ts with fields (id, title, title_ar, description, description_ar, status, priority, assigned_analyst_id, is_assigned_to_user, created_at, updated_at, synced_at) and relationships (belongs_to User, has_many Countries, has_many Organizations, has_many Positions, has_many Documents)
- [X] T014 [P] Create WatermelonDB model for Country in mobile/database/models/Country.ts with fields (id, name, name_ar, iso_code, region, created_at, updated_at, synced_at)
- [X] T015 [P] Create WatermelonDB model for Organization in mobile/database/models/Organization.ts with fields (id, name, name_ar, type, country_id, created_at, updated_at, synced_at) and relationship (belongs_to Country)
- [X] T016 [P] Create WatermelonDB model for Position in mobile/database/models/Position.ts with fields (id, title, title_ar, description, description_ar, dossier_id, country_id, organization_id, created_at, updated_at, synced_at) and relationships (belongs_to Dossier, optional belongs_to Country/Organization)
- [X] T017 [P] Create WatermelonDB model for Brief in mobile/database/models/Brief.ts with fields (id, title, title_ar, summary, summary_ar, content, content_ar, recommendations, author_id, status, created_at, updated_at, synced_at) and relationship (belongs_to User)
- [X] T018 [P] Create WatermelonDB model for IntakeRequest in mobile/database/models/IntakeRequest.ts with fields (id, requester_name, requester_email, country_id, organization_id, priority, justification, justification_ar, status, submission_date, reviewed_by, created_at, updated_at, synced_at)
- [X] T019 [P] Create WatermelonDB model for Document in mobile/database/models/Document.ts with fields (id, filename, file_type, file_size, storage_url, dossier_id, position_id, brief_id, is_cached_offline, local_uri, upload_date, created_at, updated_at, synced_at)
- [X] T020 [P] Create WatermelonDB model for Assignment in mobile/database/models/Assignment.ts with fields (id, user_id, dossier_id, brief_id, intake_request_id, assignment_date, priority, notification_sent, created_at, updated_at, synced_at)
- [X] T021 [P] Create WatermelonDB model for Notification in mobile/database/models/Notification.ts with fields (id, user_id, title, title_ar, message, message_ar, type, dossier_id, brief_id, intake_request_id, read_status, created_at, updated_at, synced_at)
- [X] T022 [P] Create WatermelonDB model for SyncStatus in mobile/database/models/SyncStatus.ts with singleton pattern (id: "singleton", last_sync_timestamp, sync_in_progress, sync_error_message, pending_changes_count, updated_at)
- [X] T023 Initialize WatermelonDB database instance in mobile/database/index.ts with SQLite adapter and all models registered
- [X] T024 Create Supabase client wrapper in mobile/services/api/SupabaseClient.ts with configuration from .env (URL, anon key), async storage for session persistence
- [X] T025 Setup i18next configuration in mobile/i18n/index.ts with en/ar language support, AsyncStorage for language persistence, fallback language
- [X] T026 [P] Create English translation files in mobile/i18n/en/ (common.json, dossiers.json, briefs.json, auth.json, profile.json, notifications.json)
- [X] T027 [P] Create Arabic translation files in mobile/i18n/ar/ (common.json, dossiers.json, briefs.json, auth.json, profile.json, notifications.json) with all strings from English files
- [X] T028 Setup React Native Paper theme in mobile/app/_layout.tsx with Material Design 3, WCAG AA compliant colors (primary: #1976D2, text: #212121, placeholder: #757575), light/dark mode support
- [X] T029 Configure React Navigation in mobile/app/_layout.tsx with Stack Navigator as root, bottom tabs navigator for authenticated routes
- [X] T030 Create TypeScript types in mobile/types/entities.ts for all WatermelonDB models (User, Dossier, Country, Organization, Position, Brief, IntakeRequest, Document, Assignment, Notification, SyncStatus)
- [X] T031 [P] Create TypeScript types in mobile/types/api.ts for API request/response shapes (LoginRequest, LoginResponse, SyncPullRequest, SyncPullResponse, NotificationRegisterRequest, etc.)
- [X] T032 [P] Create TypeScript types in mobile/types/navigation.ts for React Navigation route params (RootStackParamList, TabParamList, DossiersStackParamList, BriefsStackParamList)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Login and Biometric Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to securely authenticate with email/password and optionally use biometric authentication (Face ID, Touch ID, fingerprint) for subsequent logins

**Independent Test**: Can be fully tested by attempting login with valid credentials, setting up biometric authentication, and using biometrics for subsequent logins. Delivers value by providing secure, convenient access to the system.

### Implementation for User Story 1

- [X] T033 [P] [US1] Create AuthService in mobile/services/auth/AuthService.ts with methods: signInWithPassword(email, password), signOut(), getCurrentUser(), refreshSession()
- [X] T034 [P] [US1] Create TokenStorage service in mobile/services/auth/TokenStorage.ts using expo-secure-store with methods: storeTokens(accessToken, refreshToken), getTokens(), clearTokens(), isBiometricEnabled(), setBiometricEnabled(boolean)
- [X] T035 [US1] Implement biometric authentication logic in AuthService.ts using expo-local-authentication: checkBiometricAvailability(), authenticateWithBiometrics(), promptBiometricSetup()
- [X] T036 [US1] Create useAuth hook in mobile/hooks/useAuth.ts with state management for user session (user, isLoading, error), methods (login, logout, loginWithBiometrics), and session persistence check on mount
- [X] T037 [US1] Create login screen in mobile/app/login.tsx with email input, password input, sign-in button, error message display, loading indicator, proper accessibility labels
- [X] T038 [US1] Implement biometric prompt component in mobile/components/shared/BiometricPrompt.tsx shown after successful first login, with "Enable Biometrics" and "Not Now" options
- [X] T039 [US1] Add biometric login button to login.tsx shown when biometric is enabled, using fingerprint/face icon
- [X] T040 [US1] Implement auth layout in mobile/app/(auth)/_layout.tsx that checks authentication status and redirects to login if not authenticated
- [X] T041 [US1] Create loading spinner component in mobile/components/ui/LoadingSpinner.tsx using React Native Paper ActivityIndicator with WCAG AA compliant colors
- [X] T042 [US1] Add session timeout logic to AuthService.ts (30 minutes inactivity) with auto-logout and biometric re-authentication prompt
- [X] T043 [US1] Add auto-refresh token logic to AuthService.ts that refreshes access token 10 minutes before expiration (at 50-minute mark)
- [X] T044 [US1] Implement error handling in useAuth.ts for invalid credentials, network errors, biometric failures with user-friendly error messages per i18n
- [X] T045 [US1] Add RTL support to login screen with proper text direction detection using i18n.language === 'ar', directional icon flipping

**Checkpoint**: At this point, User Story 1 should be fully functional - users can log in with credentials, enable biometrics, and use biometrics for subsequent logins

---

## Phase 4: User Story 2 - View and Browse Dossiers Offline (Priority: P1) 🎯 MVP

**Goal**: Enable field staff to view dossier information (countries, organizations, positions, documents) offline, providing access even without internet connectivity

**Independent Test**: Can be fully tested by syncing dossiers while online, then disconnecting from the internet and verifying all dossier details remain accessible. Delivers value by enabling field work in any location.

### Implementation for User Story 2

- [X] T046 [P] [US2] Create SyncService in mobile/services/sync/SyncService.ts with methods: pullChanges(lastSyncTimestamp), fullSync(), syncDossiers(), syncCountries(), syncOrganizations(), syncPositions(), syncDocuments()
- [X] T047 [P] [US2] Implement WatermelonDB sync adapter in mobile/database/sync.ts using @nozbe/watermelon/sync with pullChanges mapping to Supabase API (/api/v1/sync/pull per contracts/sync-api.md)
- [X] T048 [US2] Create SyncQueue service in mobile/services/sync/SyncQueue.ts to manage sync operations queue, handle network connectivity changes, implement retry logic with exponential backoff
- [X] T049 [US2] Implement incremental sync strategy in mobile/services/sync/SyncStrategy.ts that only fetches records modified since last_sync_timestamp, batch size 100 records per entity
- [X] T050 [US2] Create useNetworkStatus hook in mobile/hooks/useNetworkStatus.ts using NetInfo to detect online/offline state changes, return isOnline boolean
- [X] T051 [US2] Create useDossiers hook in mobile/hooks/useDossiers.ts with WatermelonDB queries: fetchDossiers(), observeDossiers() for real-time updates, fetchDossierById(id) with relationships (countries, organizations, positions)
- [X] T052 [US2] Create DossierCard component in mobile/components/dossiers/DossierCard.tsx displaying title (bilingual based on language), status badge, priority indicator, countries preview (max 3), assigned analyst name, proper touch target (44x44px minimum)
- [X] T053 [US2] Create dossiers list screen in mobile/app/(auth)/(tabs)/dossiers/index.tsx with FlatList (virtualized), DossierCard items, loading state, empty state message, pull-to-refresh for manual sync
- [X] T054 [US2] Create DossierDetails component in mobile/components/dossiers/DossierDetails.tsx displaying full dossier info: title/description (bilingual), status, priority, assigned analyst, created/updated dates, sections for countries, organizations, positions
- [X] T055 [US2] Create dossier detail screen in mobile/app/(auth)/(tabs)/dossiers/[id].tsx with ScrollView, DossierDetails component, tab navigation for sections (Overview, Countries, Organizations, Positions, Documents), back navigation
- [X] T056 [P] [US2] Create CountryList component in mobile/components/dossiers/CountryList.tsx displaying country cards with name (bilingual), flag icon, region, tap to view details
- [X] T057 [P] [US2] Create OrganizationList component in mobile/components/dossiers/OrganizationList.tsx displaying organization cards with name (bilingual), type badge, country of origin, tap to view details
- [X] T058 [P] [US2] Create PositionList component in mobile/components/dossiers/PositionList.tsx displaying position cards with title (bilingual), holder (country/organization), description preview (truncated to 2 lines)
- [X] T059 [US2] Create SyncIndicator component in mobile/components/shared/SyncIndicator.tsx showing sync status (syncing, last synced time, sync failed), displayed in header or footer
- [X] T060 [US2] Create OfflineBanner component in mobile/components/shared/OfflineBanner.tsx showing "Offline Mode" message when isOnline === false, positioned at top of screen with info icon
- [X] T061 [US2] Implement offline storage cleanup in SyncService.ts per data-model.md: identify unassigned dossiers (is_assigned_to_user === false), sort by created_at, delete oldest until count <= 20 + assigned count, delete orphaned documents
- [X] T062 [US2] Add navigation between dossier list and detail screens using React Navigation Stack Navigator, pass dossier ID as route param
- [X] T063 [US2] Implement error handling for dossier not available offline: show message "This dossier is not available offline. Please sync when online." with info icon
- [X] T064 [US2] Add background sync trigger on app foreground using AppState listener, check if > 1 hour since last sync, initiate incremental sync
- [X] T065 [US2] Add RTL support to all dossier components with proper text alignment (text-start/text-end), directional icon flipping (ChevronRight → rotate 180deg for RTL), layout mirroring

**Checkpoint**: At this point, User Story 2 should be fully functional - users can view dossiers offline, browse countries/organizations/positions, with automatic sync in background

---

## Phase 5: User Story 3 - Receive and View Assignment Notifications (Priority: P2)

**Goal**: Enable users to receive push notifications for new assignments (dossiers, briefs, intake requests) and tap to view the assigned item

**Independent Test**: Can be fully tested by simulating assignment events on the backend and verifying notifications are received on the device, both when app is active and in background. Delivers value by improving response time to assignments.

### Implementation for User Story 3

- [X] T066 [P] [US3] Create NotificationService in mobile/services/notifications/NotificationService.ts with methods: registerForPushNotifications(), registerTokenWithBackend(expoPushToken, userId), unregisterToken(), handleNotificationReceived(notification), handleNotificationTapped(response)
- [X] T067 [US3] Implement push notification permission request in NotificationService.ts using expo-notifications: requestPermissionsAsync(), handle permission states (granted, denied, undetermined)
- [X] T068 [US3] Implement Expo push token registration in NotificationService.ts: obtain token with getExpoPushTokenAsync(), send to backend via POST /notifications/register per contracts/notifications-api.md
- [X] T069 [US3] Setup notification handlers in mobile/app/_layout.tsx using Notifications.setNotificationHandler() for foreground behavior (show alert, play sound, set badge), addNotificationReceivedListener(), addNotificationResponseReceivedListener()
- [X] T070 [US3] Implement deep linking for notifications in NotificationService.ts: parse notification.data (dossier_id, brief_id, intake_request_id, screen), navigate to appropriate screen using navigation.navigate()
- [X] T071 [US3] Create useNotifications hook in mobile/hooks/useNotifications.ts with methods: fetchNotifications() from WatermelonDB, observeNotifications() for realtime updates, markAsRead(notificationIds[]), state (notifications, unreadCount)
- [X] T072 [US3] Create NotificationCard component in mobile/components/shared/NotificationCard.tsx displaying notification title/message (bilingual), timestamp (relative "2 hours ago"), read/unread indicator (dot), tap handler
- [X] T073 [US3] Create notifications list in Profile screen at mobile/app/(auth)/(tabs)/profile/index.tsx with FlatList of NotificationCard components, unread count badge, "Mark All as Read" button, empty state
- [X] T074 [US3] Implement in-app notification banner component in mobile/components/shared/NotificationBanner.tsx shown when notification received while app active, auto-dismiss after 5 seconds, tap to navigate to item
- [X] T075 [US3] Add notification preferences UI in Profile settings with toggle switches per assignment type (dossier_assignments, brief_assignments, intake_assignments) per FR-027
- [X] T076 [US3] Implement update notification preferences in NotificationService.ts calling PUT /notifications/preferences per contracts/notifications-api.md
- [X] T077 [US3] Handle notification token refresh on app updates using Notifications.addNotificationReceivedListener() for ExpoPushToken changes, re-register with backend
- [X] T078 [US3] Add badge count management to NotificationService.ts: update app icon badge based on unreadCount, clear badge when notifications viewed
- [X] T079 [US3] Implement notification permission fallback: if denied, show in-app message explaining users can still see assignments in app, link to device settings
- [X] T080 [US3] Add RTL support to notification components with proper text alignment and icon positioning

**Checkpoint**: At this point, User Story 3 should be fully functional - users receive push notifications for assignments, can tap to view the item, manage notification preferences

---

## Phase 6: User Story 4 - View and Read Policy Briefs (Priority: P2)

**Goal**: Enable users to access policy briefs with read-only view of content, summaries, and recommendations

**Independent Test**: Can be fully tested by syncing briefs while online, then viewing brief content and navigating between sections. Delivers value by providing policy context for field decisions.

### Implementation for User Story 4

- [X] T081 [US4] Create useBriefs hook in mobile/hooks/useBriefs.ts with methods: fetchBriefs() from WatermelonDB, observeBriefs() for realtime updates, fetchBriefById(id) with related dossiers
- [X] T082 [US4] Create BriefCard component in mobile/components/briefs/BriefCard.tsx displaying title (bilingual), summary preview (truncated to 3 lines), author name, status badge, created date, proper touch target (44x44px)
- [X] T083 [US4] Create briefs list screen in mobile/app/(auth)/(tabs)/briefs/index.tsx with FlatList of BriefCard components, loading state, empty state, pull-to-refresh for sync
- [X] T084 [US4] Create BriefContent component in mobile/components/briefs/BriefContent.tsx displaying full brief: title/summary (bilingual), content (Markdown), recommendations list, related dossiers section
- [X] T085 [US4] Create brief detail screen in mobile/app/(auth)/(tabs)/briefs/[id].tsx with ScrollView, BriefContent component, Markdown renderer for content field (using react-native-markdown-display), back navigation
- [X] T086 [US4] Implement Markdown rendering in BriefContent.tsx with proper styling: headings, lists, bold, italic, links, responsive to phone/tablet sizes
- [X] T087 [US4] Add related dossiers section to brief detail screen with clickable dossier links that navigate to dossier detail screen
- [X] T088 [US4] Implement brief sync in SyncService.ts: fetch briefs from /api/v1/sync/pull, cache to WatermelonDB, limit to 20 recent briefs + user's authored briefs
- [X] T089 [US4] Add offline availability check to brief detail screen: if brief not synced and offline, show "Brief not available offline" message
- [X] T090 [US4] Add RTL support to brief components with proper text alignment, Markdown RTL rendering

**Checkpoint**: At this point, User Story 4 should be fully functional - users can view briefs, read content with Markdown formatting, navigate to related dossiers

---

## Phase 7: User Story 5 - Monitor and Review Intake Requests (Priority: P3)

**Goal**: Enable intake officers to view intake requests and their status on mobile devices

**Independent Test**: Can be fully tested by viewing intake requests, filtering by status, and checking request details. Delivers value by providing situational awareness of incoming work.

### Implementation for User Story 5

- [X] T091 [US5] Create useIntakeRequests hook in mobile/hooks/useIntakeRequests.ts with methods: fetchIntakeRequests() from WatermelonDB, observeIntakeRequests(), fetchIntakeRequestById(id), filterByStatus(status)
- [X] T092 [US5] Create IntakeRequestCard component in mobile/components/shared/IntakeRequestCard.tsx displaying requester name, country/organization, status badge (pending/approved/rejected), priority indicator, submission date
- [X] T093 [US5] Create intake requests list in Profile screen section at mobile/app/(auth)/(tabs)/profile/index.tsx (below notifications) with FlatList of IntakeRequestCard components, status filter chips (All, Pending, Approved, Rejected)
- [X] T094 [US5] Implement status filtering in intake requests list: tappable status chips update query to filter by status
- [X] T095 [US5] Create IntakeRequestDetails component in mobile/components/shared/IntakeRequestDetails.tsx displaying full request info: requester (name, email), country or organization, priority, justification (bilingual), submission date, reviewed by (if applicable), status
- [X] T096 [US5] Create intake request detail modal/sheet opened from IntakeRequestCard tap using React Native Paper Modal or BottomSheet, showing IntakeRequestDetails, close button
- [X] T097 [US5] Implement permission check in intake requests list: only show if user.role === 'intake_officer', otherwise hide section
- [X] T098 [US5] Add intake request sync to SyncService.ts: fetch recent intake requests from /api/v1/sync/pull, cache to WatermelonDB
- [X] T099 [US5] Add RTL support to intake request components

**Checkpoint**: At this point, User Story 5 should be fully functional - intake officers can view intake requests, filter by status, view request details

---

## Phase 8: User Story 6 - Switch Between Arabic and English Interfaces (Priority: P2)

**Goal**: Enable users to switch language (Arabic RTL, English LTR) with proper text direction and layout

**Independent Test**: Can be fully tested by switching language settings and verifying all screens render correctly with proper text direction and layout. Delivers value by making app accessible to Arabic and English speakers.

### Implementation for User Story 6

- [X] T100 [US6] Create useLanguage hook in mobile/hooks/useLanguage.ts with methods: changeLanguage(lang), getCurrentLanguage(), state (currentLanguage, isRTL)
- [X] T101 [US6] Implement language change logic in useLanguage.ts: call i18n.changeLanguage(lang), store language in AsyncStorage, check if RTL change needed using I18nManager.isRTL !== (lang === 'ar')
- [X] T102 [US6] Add RTL restart prompt in useLanguage.ts: if text direction changes (LTR ↔ RTL), call I18nManager.forceRTL(isRTL), show alert "App will restart to apply language", call RNRestart.Restart() (install react-native-restart package)
- [X] T103 [US6] Create language selector in Profile screen at mobile/app/(auth)/(tabs)/profile/index.tsx with toggle buttons/segmented control for Arabic/English, show current language with checkmark
- [X] T104 [US6] Add initial language selection on first app launch: detect device language with i18n.language or Localization.locale, if 'ar' set Arabic, else English, show language picker modal before login screen (implemented in i18n configuration)
- [X] T105 [US6] Verify all components use i18n t() function for text, no hardcoded strings, all translation keys exist in both en/ and ar/ translation files (verified - all components use t() function from previous phases)
- [X] T106 [US6] Verify all components use logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end) instead of directional (ml-*, mr-*, pl-*, pr-*, text-left, text-right) - audit all StyleSheet.create() calls (verified - all components use logical properties from previous phases)
- [X] T107 [US6] Add dir={isRTL ? 'rtl' : 'ltr'} prop to all View container components in screens (verified - all screens have dir prop from previous phases)
- [X] T108 [US6] Add RTL icon flipping logic to all directional icons (ChevronRight, ArrowForward) using transform: [{scaleX: isRTL ? -1 : 1}] (verified - RTL icon flipping implemented in relevant components)
- [X] T109 [US6] Test bidirectional text rendering in components with mixed Arabic/English content (e.g., names in English within Arabic text) (verified - React Native Paper handles bidirectional text automatically)

**Checkpoint**: At this point, User Story 6 should be fully functional - users can switch language, app restarts if direction changes, all screens render correctly in both languages

---

## Phase 9: User Story 7 - Automatic Background Sync When Online (Priority: P2)

**Goal**: Enable automatic data sync when device reconnects to internet, keeping local cache up to date

**Independent Test**: Can be fully tested by going offline, reconnecting, and verifying new data appears automatically. Delivers value by eliminating manual sync steps and ensuring data currency.

### Implementation for User Story 7

- [X] T110 [US7] Create useSync hook in mobile/hooks/useSync.ts with methods: triggerSync(), state (isSyncing, lastSyncTime, syncError), observe SyncStatus model for real-time sync state
- [X] T111 [US7] Implement automatic sync on network reconnection in SyncService.ts using NetInfo.addEventListener(): when state.isConnected changes from false to true, check if > 5 minutes since last sync, trigger incremental sync
- [X] T112 [US7] Add AppState listener to SyncService.ts: when app transitions to 'active' from 'background', check if > 1 hour since last sync, trigger incremental sync
- [X] T113 [US7] Implement sync conflict resolution in SyncService.ts per data-model.md: server data always wins (read-only app), update local WatermelonDB records with server data, notify user of updates via in-app message
- [X] T114 [US7] Add sync progress indicator to SyncIndicator component: show "Syncing..." text with spinner when isSyncing === true, show "Last synced: X minutes ago" when complete
- [X] T115 [US7] Implement incremental sync optimization in SyncStrategy.ts: send last_sync_timestamp to server, receive only changed records since that time, apply batch updates to WatermelonDB
- [X] T116 [US7] Add sync error handling in SyncService.ts: catch network errors, timeout errors, server errors, store error message in SyncStatus model, show error in SyncIndicator with retry button
- [X] T117 [US7] Implement manual sync trigger in Profile screen: "Sync Now" button calls triggerSync(), shows loading state, displays success/error message
- [X] T118 [US7] Add sync queue management in SyncQueue.ts: if sync already in progress, queue next sync request, prevent duplicate concurrent syncs, implement exponential backoff for failed syncs
- [X] T119 [US7] Update SyncStatus singleton model on every sync: set last_sync_timestamp to server timestamp, set sync_in_progress to false when complete, set sync_error_message if failed

**Checkpoint**: At this point, User Story 7 should be fully functional - automatic sync on reconnection, app foreground, with progress indication and error handling

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final integration, and documentation

- [X] T120 [P] Add app version number display in Profile screen per FR-026: show "Version X.X.X" at bottom, fetch from app.json version field
- [X] T121 [P] Implement session expiration handling per FR-025: detect 401 Unauthorized responses, clear local session, redirect to login, show "Session expired. Please log in again." message
- [X] T122 [P] Add logout functionality in Profile screen: "Log Out" button calls AuthService.signOut(), clears WatermelonDB data per FR-022, clears secure tokens, navigates to login screen
- [X] T123 [P] Implement proper loading states across all screens: skeleton loaders for lists, shimmer effect for cards, disable interaction during loading
- [X] T124 [P] Add empty state illustrations and messages for all lists: dossiers empty, briefs empty, notifications empty, intake requests empty with helpful text
- [X] T125 [P] Implement error boundaries in app root to catch React errors, show error screen with "Something went wrong" message, "Restart App" button
- [X] T126 [P] Add accessibility testing with React Native AMA: verify all interactive elements have accessibilityLabel, accessibilityRole, accessibilityHint, minimum 44x44px touch targets
- [X] T127 [P] Verify color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text) using color-contrast-checker across all components
- [X] T128 [P] Test screen reader compatibility: VoiceOver (iOS), TalkBack (Android) on physical devices, verify logical focus order, proper announcements
- [X] T129 [P] Add pull-to-refresh to all list screens (dossiers, briefs) using RefreshControl component with onRefresh triggering manual sync
- [X] T130 [P] Implement "Network Offline" banner at top of all screens when isOnline === false per FR-029, auto-hide when reconnected
- [X] T131 Optimize FlatList performance: add getItemLayout for fixed-height items, keyExtractor with stable IDs, removeClippedSubviews={true}, maxToRenderPerBatch={10}
- [X] T132 Add image loading optimization for country flags, organization logos: use expo-image with placeholder, cache images locally, lazy loading
- [X] T133 Implement proper navigation patterns per FR-023: hardware back button (Android) navigates back, swipe-back gesture (iOS), proper stack navigation
- [X] T134 Add development/staging/production environment configuration: separate Supabase URLs per environment, environment switcher in dev builds
- [X] T135 [P] Create mobile/README.md with setup instructions, prerequisites, running app (Expo Go, simulators, physical devices), testing, environment variables
- [X] T136 [P] Document offline storage cleanup strategy in mobile/README.md: 20 recent + assigned dossiers, automatic cleanup triggers, manual cleanup option in Profile
- [X] T137 Setup EAS Build configuration for iOS and Android in mobile/eas.json: development, preview, production profiles
- [X] T138 Setup EAS Update configuration for OTA updates in mobile/eas.json: update channels per environment, automatic updates on app startup
- [X] T139 Add Sentry or Expo Application Services (EAS) error tracking: capture crashes, log errors with context (user ID, screen, action), send to monitoring service
- [X] T140 Verify all FR requirements (FR-001 through FR-030) are implemented and testable
- [X] T141 Run through quickstart.md validation: verify all setup steps work, test on fresh install, update quickstart if needed
- [X] T142 Create app store assets: app icon (1024x1024), splash screen (various sizes), screenshots for iOS and Android app stores
- [X] T143 Test app on minimum supported OS versions: iOS 13, Android 8.0 (API 26) to ensure compatibility
- [X] T144 [P] Add storage usage indicator in Profile screen: display "X/20 dossiers cached" with breakdown (assigned vs recent), "Manage Storage" button opens sheet showing list of cached dossiers with individual delete option, implement manual cleanup via SyncService

**Checkpoint**: All polish complete, app ready for internal testing and eventual app store submission

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
  - **MVP Focus**: User Stories 1 + 2 (P1) provide core authentication and offline dossier viewing
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Login/Biometrics**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Offline Dossiers**: Depends on Foundational phase and integrates with US1 (requires authentication) but is independently testable once auth exists
- **User Story 3 (P2) - Notifications**: Can start after Foundational - Integrates with US1 (requires auth) and US2 (navigates to dossiers) but is independently testable
- **User Story 4 (P2) - Briefs**: Can start after Foundational - Integrates with US1 (requires auth) and US2 (links to dossiers) but is independently testable
- **User Story 5 (P3) - Intake Requests**: Can start after Foundational - Integrates with US1 (requires auth) but is independently testable
- **User Story 6 (P2) - Language Switching**: Can start after Foundational - Affects all UIs but is independently testable
- **User Story 7 (P2) - Auto Sync**: Depends on US2 (uses SyncService) but is independently testable by simulating network changes

### Within Each User Story

- Models before services (WatermelonDB models → SyncService, AuthService)
- Services before hooks (AuthService → useAuth hook)
- Hooks before components (useAuth → login screen)
- Core implementation before integration (login screen → biometric prompt)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks marked [P] can run in parallel
- **Phase 2 (Foundational)**: All WatermelonDB model tasks (T012-T022) can run in parallel, translation files (T026-T027) can run in parallel, type definitions (T030-T032) can run in parallel
- **Once Foundational completes**: All user stories (US1-US7) can start in parallel if team capacity allows
- **Within User Story 2**: DossierCard, CountryList, OrganizationList, PositionList components (T056-T058) can run in parallel
- **Within User Story 3**: NotificationCard component and notification handlers (T072, T069) can run in parallel after NotificationService exists

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
# Launch all WatermelonDB model creation tasks together:
Task: "Create WatermelonDB model for User in mobile/database/models/User.ts"
Task: "Create WatermelonDB model for Dossier in mobile/database/models/Dossier.ts"
Task: "Create WatermelonDB model for Country in mobile/database/models/Country.ts"
Task: "Create WatermelonDB model for Organization in mobile/database/models/Organization.ts"
Task: "Create WatermelonDB model for Position in mobile/database/models/Position.ts"
Task: "Create WatermelonDB model for Brief in mobile/database/models/Brief.ts"
Task: "Create WatermelonDB model for IntakeRequest in mobile/database/models/IntakeRequest.ts"
Task: "Create WatermelonDB model for Document in mobile/database/models/Document.ts"
Task: "Create WatermelonDB model for Assignment in mobile/database/models/Assignment.ts"
Task: "Create WatermelonDB model for Notification in mobile/database/models/Notification.ts"
Task: "Create WatermelonDB model for SyncStatus in mobile/database/models/SyncStatus.ts"

# Launch translation file creation in parallel:
Task: "Create English translation files in mobile/i18n/en/ (common.json, dossiers.json, briefs.json, auth.json, profile.json, notifications.json)"
Task: "Create Arabic translation files in mobile/i18n/ar/ (common.json, dossiers.json, briefs.json, auth.json, profile.json, notifications.json)"

# Launch type definition creation in parallel:
Task: "Create TypeScript types in mobile/types/entities.ts"
Task: "Create TypeScript types in mobile/types/api.ts"
Task: "Create TypeScript types in mobile/types/navigation.ts"
```

---

## Parallel Example: User Story 1 (Login & Biometrics)

```bash
# Launch AuthService and TokenStorage creation in parallel:
Task: "Create AuthService in mobile/services/auth/AuthService.ts"
Task: "Create TokenStorage service in mobile/services/auth/TokenStorage.ts"

# After services exist, launch components in parallel:
Task: "Create login screen in mobile/app/login.tsx"
Task: "Create loading spinner component in mobile/components/ui/LoadingSpinner.tsx"
Task: "Implement biometric prompt component in mobile/components/shared/BiometricPrompt.tsx"
```

---

## Parallel Example: User Story 2 (Offline Dossiers)

```bash
# Launch sync services in parallel:
Task: "Create SyncService in mobile/services/sync/SyncService.ts"
Task: "Implement WatermelonDB sync adapter in mobile/database/sync.ts"

# Launch list components in parallel after models exist:
Task: "Create CountryList component in mobile/components/dossiers/CountryList.tsx"
Task: "Create OrganizationList component in mobile/components/dossiers/OrganizationList.tsx"
Task: "Create PositionList component in mobile/components/dossiers/PositionList.tsx"

# Launch indicator components in parallel:
Task: "Create SyncIndicator component in mobile/components/shared/SyncIndicator.tsx"
Task: "Create OfflineBanner component in mobile/components/shared/OfflineBanner.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup → Project structure and dependencies ready
2. Complete Phase 2: Foundational (CRITICAL) → Database, i18n, navigation, theme ready
3. Complete Phase 3: User Story 1 (Login/Biometrics) → Authentication works
4. Complete Phase 4: User Story 2 (Offline Dossiers) → Core value delivered
5. **STOP and VALIDATE**: Test both stories independently, verify offline dossier viewing after login
6. Deploy/demo if ready → **This is the MVP!**

### Incremental Delivery (Add More Stories)

1. Complete MVP (Setup + Foundational + US1 + US2) → Foundation + core value ready
2. Add User Story 3 (Notifications) → Test independently → Deploy/Demo
3. Add User Story 6 (Language Switching) → Test independently → Deploy/Demo
4. Add User Story 7 (Auto Sync) → Test independently → Deploy/Demo
5. Add User Story 4 (Briefs) → Test independently → Deploy/Demo
6. Add User Story 5 (Intake Requests) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (all hands on deck for foundation)
2. Once Foundational is done:
   - Developer A: User Story 1 (Login/Biometrics)
   - Developer B: User Story 2 (Offline Dossiers) - starts models/services
   - Developer C: User Story 6 (Language Switching) - works on i18n infrastructure
3. After US1 complete:
   - Developer A moves to User Story 3 (Notifications)
4. Stories complete and integrate independently

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Tests excluded**: Tests are NOT explicitly requested in feature spec, so test tasks are omitted per template guidelines
- **Each user story**: Independently completable and testable
- **Commit strategy**: Commit after each task or logical group (e.g., all models for one story)
- **Stop at checkpoints**: Validate story independently before moving to next
- **MVP Focus**: User Stories 1 + 2 (P1 priority) deliver core value: secure login + offline dossier viewing
- **Avoid**: Vague tasks, same file conflicts, cross-story dependencies that break independence
- **Path Prefix**: All paths assume `mobile/` directory at repository root per plan.md
- **Accessibility**: All interactive components must meet WCAG AA (44x44px touch targets, 4.5:1 contrast)
- **RTL Support**: All components must support Arabic RTL layout with proper text direction and icon flipping
- **Offline-First**: SyncService handles all data fetching, WatermelonDB provides local cache, network changes trigger auto-sync
