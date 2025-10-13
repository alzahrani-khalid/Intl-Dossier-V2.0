# Tasks: Apply Gusto Design System to Mobile App (TEST-FIRST VERSION)

**Feature Branch**: `021-apply-gusto-design`
**Created**: 2025-10-13
**Revised**: 2025-10-13 (Test-First Restructuring)
**Input**: Design documents from `/specs/021-apply-gusto-design/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**IMPORTANT**: This version follows Constitution Principle III (Test-First Development). Each user story has two sub-phases:
- **Phase XA: Tests** - Write failing tests BEFORE implementation
- **Phase XB: Implementation** - Implement features to make tests pass

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[TEST]**: Test task (must be written before corresponding implementation)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All paths are relative to repository root: `mobile/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Expo project and configure development environment

- [ ] T001 Initialize Expo project with TypeScript 5.8+ strict mode in `mobile/` directory following quickstart.md setup instructions
- [ ] T002 [P] Configure React Native Paper 5.12+ theme in `mobile/src/theme/index.ts` with Gusto color palette (primary #1B5B5A, secondary #FF6B35, background #F5F4F2)
- [ ] T003 [P] Setup i18next with RTL detection in `mobile/src/i18n/index.ts` and create base translation files in `mobile/src/i18n/en/` and `mobile/src/i18n/ar/`
- [ ] T004 [P] Configure TanStack Query v5 provider in `mobile/App.tsx` with cache configuration
- [ ] T005 [P] Install and configure required dependencies (expo-local-authentication, expo-notifications, expo-camera, expo-secure-store, @shopify/flash-list, date-fns, jest, @testing-library/react-native, maestro)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Setup WatermelonDB schema definition in `mobile/src/database/schema/index.ts` with all 11 entities and 4 junction tables per data-model.md
- [ ] T007 [P] Create WatermelonDB model for Dossier entity in `mobile/src/database/models/Dossier.ts` with sync metadata fields
- [ ] T008 [P] Create WatermelonDB model for Assignment entity in `mobile/src/database/models/Assignment.ts`
- [ ] T009 [P] Create WatermelonDB model for CalendarEntry entity in `mobile/src/database/models/CalendarEntry.ts`
- [ ] T010 [P] Create WatermelonDB model for Country entity in `mobile/src/database/models/Country.ts`
- [ ] T011 [P] Create WatermelonDB model for Organization entity in `mobile/src/database/models/Organization.ts`
- [ ] T012 [P] Create WatermelonDB model for Forum entity in `mobile/src/database/models/Forum.ts`
- [ ] T013 [P] Create WatermelonDB model for Position entity in `mobile/src/database/models/Position.ts`
- [ ] T014 [P] Create WatermelonDB model for MOU entity in `mobile/src/database/models/MOU.ts`
- [ ] T015 [P] Create WatermelonDB model for IntelligenceSignal entity in `mobile/src/database/models/IntelligenceSignal.ts`
- [ ] T016 [P] Create WatermelonDB model for IntakeTicket entity in `mobile/src/database/models/IntakeTicket.ts`
- [ ] T017 [P] Create WatermelonDB model for Notification entity in `mobile/src/database/models/Notification.ts`
- [ ] T018 [P] Create junction table models (DossierCountry, DossierOrganization, DossierForum, PositionDossierLink) in `mobile/src/database/models/`
- [ ] T019 Initialize WatermelonDB database instance in `mobile/src/database/index.ts` with SQLiteAdapter and JSI enabled
- [ ] T020 Implement incremental sync service in `mobile/src/services/sync/sync-service.ts` following contracts/sync-api.md with pull/push endpoints
- [ ] T021 Implement conflict resolver in `mobile/src/services/sync/conflict-resolver.ts` with hybrid automatic merge + user-prompted resolution logic
- [ ] T022 [P] Implement biometric authentication service in `mobile/src/services/biometric-service.ts` using expo-local-authentication
- [ ] T023 [P] Implement notification service in `mobile/src/services/notification-service.ts` with Expo Push Notifications per contracts/notifications.md
- [ ] T024 [P] Implement Supabase Auth wrapper in `mobile/src/services/auth-api.ts` with JWT token management and SecureStore integration
- [ ] T025 Setup React Navigation root navigator in `mobile/src/navigation/RootNavigator.tsx` with linking configuration for deep links
- [ ] T026 Create BottomTabNavigator in `mobile/src/navigation/BottomTabNavigator.tsx` with 5 tabs (Home, Dossiers, Search, Calendar, Profile) using Material Design 3 icons
- [ ] T027 [P] Create base UI components: Card, Button, StatusChip, EmptyState, Skeleton, BottomSheet, Snackbar in `mobile/src/components/ui/` following Gusto design patterns
- [ ] T028 [P] Create layout components: Screen, Header, OfflineBanner in `mobile/src/components/layout/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3A: User Story 1 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for core navigation BEFORE implementation per Constitution Principle III

**Goal**: Verify bottom tab navigation with 5 primary screens, smooth transitions (≤300ms), and state preservation

- [ ] T029A [P] [US1-TEST] Write navigation structure tests in `mobile/__tests__/navigation/BottomTabNavigator.test.tsx`:
  * Test 5 tabs exist with correct icons and labels (Home, Dossiers, Search, Calendar, Profile) in English
  * Test 5 tabs exist with correct Arabic labels when i18n.language='ar'
  * Test active tab shows teal color (#1B5B5A) and filled icon variant
  * Test inactive tabs show gray color and outline icon variant
  * Test all tabs are touchable with min 44x44px hit area (accessibility)
- [ ] T029B [P] [US1-TEST] Write navigation performance tests in `mobile/__tests__/navigation/tab-transitions.test.tsx`:
  * Mock performance.now() and test tab transition completes ≤300ms
  * Test smooth animation timing (mock requestAnimationFrame, verify 60fps target)
- [ ] T029C [P] [US1-TEST] Write state preservation tests in `mobile/__tests__/navigation/state-preservation.test.tsx`:
  * Test scroll position preserved when switching from DossiersListScreen to SearchScreen and back
  * Test form input data preserved when switching from ProfileScreen to HomeScreen and back
  * Test navigation state persists across tab switches (stack history maintained)
- [ ] T029D [P] [US1-TEST] Write badge indicator tests in `mobile/__tests__/navigation/badge.test.tsx`:
  * Test badge appears on Profile tab icon when unread notification count > 0
  * Test badge shows correct count (1-9 numeric, "9+" for 10+)
  * Test badge disappears when unread count = 0
  * Test badge accessibility label (e.g., "5 unread notifications")
- [ ] T029E [US1-TEST] Write scroll-to-top tests in `mobile/__tests__/navigation/scroll-to-top.test.tsx`:
  * Test tapping active Home tab triggers scroll to top on HomeScreen
  * Test tapping inactive tab does NOT trigger scroll (navigates normally)
- [ ] T029F [US1-TEST] Run all US1 tests and VERIFY THEY FAIL (no implementation exists yet) - expected 15-20 failing assertions

**Checkpoint**: All navigation tests written and failing ✓ Ready for implementation

---

## Phase 3B: User Story 1 - Implementation

**Goal**: Implement bottom tab navigation to make tests pass

**Prerequisites**: Phase 3A tests must be written and failing

- [ ] T029 [P] [US1] Create HomeStack navigator in `mobile/src/navigation/HomeStack.tsx` with HomeScreen as initial route
- [ ] T030 [P] [US1] Create DossiersStack navigator in `mobile/src/navigation/DossiersStack.tsx` with DossiersListScreen as initial route
- [ ] T031 [P] [US1] Create SearchStack navigator in `mobile/src/navigation/SearchStack.tsx` with SearchScreen as initial route
- [ ] T032 [P] [US1] Create CalendarStack navigator in `mobile/src/navigation/CalendarStack.tsx` with CalendarScreen as initial route
- [ ] T033 [P] [US1] Create ProfileStack navigator in `mobile/src/navigation/ProfileStack.tsx` with ProfileScreen as initial route
- [ ] T034 [US1] Integrate all 5 stack navigators into BottomTabNavigator with proper Gusto-style icons, labels (EN/AR via i18n), active/inactive state styling (teal #1B5B5A for active, gray for inactive), and 44x44px touch targets
- [ ] T035 [P] [US1] Create HomeScreen skeleton UI in `mobile/src/screens/home/HomeScreen.tsx` with SafeAreaView and Gusto card placeholders
- [ ] T036 [P] [US1] Create DossiersListScreen skeleton UI in `mobile/src/screens/dossiers/DossiersListScreen.tsx` with list placeholder
- [ ] T037 [P] [US1] Create SearchScreen skeleton UI in `mobile/src/screens/search/SearchScreen.tsx` with search bar placeholder
- [ ] T038 [P] [US1] Create CalendarScreen skeleton UI in `mobile/src/screens/calendar/CalendarScreen.tsx` with calendar placeholder
- [ ] T039 [P] [US1] Create ProfileScreen skeleton UI in `mobile/src/screens/profile/ProfileScreen.tsx` with user info placeholder
- [ ] T040 [US1] Implement tab state preservation in navigation configuration to maintain scroll position and form data when switching tabs using React Navigation's state management
- [ ] T041 [US1] Add badge indicator support to BottomTabNavigator for unread notification counts on Profile tab with proper accessibilityLabel
- [ ] T042 [US1] Implement scroll-to-top behavior when tapping active tab icon (Home tab taps scroll to top via ref)
- [ ] T042A [US1-VERIFY] Run all US1 tests and VERIFY THEY NOW PASS (implementation complete) - expected 15-20 passing assertions

**Checkpoint**: User Story 1 fully functional with passing tests ✓

---

## Phase 4A: User Story 2 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for home dashboard BEFORE implementation

**Goal**: Verify personalized stats, recent activity feed (last 10), and quick action cards

- [ ] T043A [P] [US2-TEST] Write dashboard data tests in `mobile/__tests__/screens/home/HomeScreen.test.tsx`:
  * Test personalized greeting displays user name and correct time-of-day (morning/afternoon/evening)
  * Test hero stats card shows active dossiers count from API
  * Test quick action cards (Create Dossier, View Assignments, Open Calendar) render with correct icons and labels
  * Test quick action cards navigate to correct screens when tapped
- [ ] T043B [P] [US2-TEST] Write recent activity tests in `mobile/__tests__/screens/home/activity-feed.test.tsx`:
  * Test activity feed displays last 10 activities from WatermelonDB
  * Test each activity shows type icon, title, timestamp (relative format), and related entity name
  * Test activity feed uses FlashList virtualization for performance
  * Test empty state shows when no recent activities exist
- [ ] T043C [P] [US2-TEST] Write pull-to-refresh tests in `mobile/__tests__/screens/home/pull-refresh.test.tsx`:
  * Test pull-to-refresh gesture triggers sync service
  * Test spinner shows during sync
  * Test success indicator (checkmark animation) shows on completion
  * Test snackbar error message shows if sync fails
- [ ] T043D [US2-TEST] Run all US2 tests and VERIFY THEY FAIL - expected 12-15 failing assertions

**Checkpoint**: All dashboard tests written and failing ✓

---

## Phase 4B: User Story 2 - Implementation

**Goal**: Display personalized dashboard to make tests pass

**Prerequisites**: Phase 4A tests must be written and failing

- [ ] T043 [P] [US2] Create StatsCard component in `mobile/src/components/ui/StatsCard.tsx` for hero card with icon, count, and label (Gusto Material Design 3 elevation 2-4dp)
- [ ] T044 [P] [US2] Create ActionCard component in `mobile/src/components/ui/ActionCard.tsx` for quick actions with icon, title, description, tap handler, and 44x44px touch target
- [ ] T045 [P] [US2] Create ActivityFeedItem component in `mobile/src/components/home/ActivityFeedItem.tsx` showing activity type icon, title, relative timestamp (e.g., "2 hours ago"), related entity name in Gusto card style
- [ ] T046 [US2] Implement useAuth hook in `mobile/src/hooks/use-auth.ts` to get current user info for personalized greeting (name from Supabase Auth context)
- [ ] T047 [US2] Implement useDashboardStats hook in `mobile/src/hooks/use-dashboard-stats.ts` using TanStack Query to fetch stats (active dossiers count, assignments count, upcoming events count) from WatermelonDB with observable query
- [ ] T048 [US2] Implement useRecentActivity hook in `mobile/src/hooks/use-recent-activity.ts` to fetch last 10 activities from WatermelonDB with observable query and sort by timestamp DESC
- [ ] T049 [US2] Complete HomeScreen implementation in `mobile/src/screens/home/HomeScreen.tsx` with personalized greeting, hero card (Gusto teal theme), activity feed (FlashList virtualization), and quick action cards (generous 16-24px spacing)
- [ ] T050 [US2] Add PullToRefresh component in `mobile/src/components/feedback/PullToRefresh.tsx` using React Native Gesture Handler with visual spinner and success checkmark animation
- [ ] T051 [US2] Integrate PullToRefresh into HomeScreen to trigger manual sync via sync-service.ts with visual feedback (spinner → checkmark or error snackbar)
- [ ] T052 [US2] Add time-of-day greeting logic (Good morning/afternoon/evening based on device local time) with i18n support (صباح الخير / مساء الخير in Arabic)
- [ ] T053 [US2] Implement quick action navigation handlers (Create Dossier → DossiersStack, View Assignments → AssignmentsScreen, Open Calendar → CalendarStack)
- [ ] T053A [US2-VERIFY] Run all US2 tests and VERIFY THEY NOW PASS - expected 12-15 passing assertions

**Checkpoint**: Home dashboard functional with passing tests ✓

---

## Phase 5A: User Story 3 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for dossier list and detail views BEFORE implementation

**Goal**: Verify dossier browsing, search (300ms debounce), infinite scroll, and detail sections

- [ ] T054A [P] [US3-TEST] Write dossier list tests in `mobile/__tests__/screens/dossiers/DossiersListScreen.test.tsx`:
  * Test dossier cards display title, country, organization, and Gusto pill-shaped status badge
  * Test FlashList renders 100+ items with smooth scrolling (mock scroll performance)
  * Test infinite scroll loads next page when scrolling near bottom (mock pagination API)
  * Test empty state shows with icon + headline + "Create Dossier" CTA when no dossiers exist
  * Test pull-to-refresh triggers sync and updates list
- [ ] T054B [P] [US3-TEST] Write dossier search tests in `mobile/__tests__/screens/dossiers/search.test.tsx`:
  * Test search bar auto-focuses keyboard when search icon tapped
  * Test search query debounced by 300ms (mock timer, verify API called after 300ms not immediately)
  * Test search filters list instantly after debounce completes
  * Test search supports both English and Arabic text (locale-aware)
  * Test X clear button appears when query length > 0 and clears on tap
- [ ] T054C [P] [US3-TEST] Write dossier detail tests in `mobile/__tests__/screens/dossiers/DossierDetailScreen.test.tsx`:
  * Test detail screen shows header with title, status chip, and back button
  * Test card sections render: countries, organizations, relationships, timeline (Gusto 12-16px border radius, 16-24px padding)
  * Test offline indicator shows "Last synced: [timestamp]" when viewing cached data
  * Test confidential dossiers require biometric re-auth (mock biometric prompt)
- [ ] T054D [P] [US3-TEST] Write scroll position tests in `mobile/__tests__/screens/dossiers/scroll-preservation.test.tsx`:
  * Test scroll position preserved when navigating from list to detail and back
  * Test scroll position preserved when switching to another tab and returning
- [ ] T054E [US3-TEST] Run all US3 tests and VERIFY THEY FAIL - expected 18-20 failing assertions

**Checkpoint**: All dossier tests written and failing ✓

---

## Phase 5B: User Story 3 - Implementation

**Goal**: Implement dossier list and detail to make tests pass

**Prerequisites**: Phase 5A tests must be written and failing

- [ ] T054 [P] [US3] Create DossierCard component in `mobile/src/components/dossier/DossierCard.tsx` with Gusto card style: title (titleLarge 22pt/600), country/org (bodyMedium 15pt), pill-shaped status badge (1px teal border, no fill), chevron icon, 44x44px touch target
- [ ] T055 [P] [US3] Create DossierDetailHeader component in `mobile/src/components/dossier/DossierDetailHeader.tsx` with name (displayLarge 32pt/700), status chip, back button (< chevron)
- [ ] T056 [P] [US3] Create DossierInfoSection component in `mobile/src/components/dossier/DossierInfoSection.tsx` for Gusto card sections (12-16px radius, 2-4dp shadow, 16-24px padding) showing countries, organizations, relationships, timeline
- [ ] T057 [US3] Implement useDossiers hook in `mobile/src/hooks/use-dossiers.ts` using TanStack Query + WatermelonDB observable to fetch dossiers with pagination (20 items per page)
- [ ] T058 [US3] Implement useDossierSearch hook in `mobile/src/hooks/use-dossier-search.ts` with 300ms debounced search query using WatermelonDB Q.like on title_en/title_ar fields (locale-aware field selection based on i18n.language)
- [ ] T059 [US3] Complete DossiersListScreen implementation in `mobile/src/screens/dossiers/DossiersListScreen.tsx` with FlashList virtualization, search bar (auto-focus), infinite scroll pagination, pull-to-refresh, empty state with Gusto styling
- [ ] T060 [US3] Create DossierDetailScreen in `mobile/src/screens/dossiers/DossierDetailScreen.tsx` with header, info sections in Gusto cards (generous 24px vertical spacing between cards)
- [ ] T061 [US3] Add search bar to DossiersListScreen header with auto-focus keyboard, X clear button (appears when query.length > 0), and RTL support
- [ ] T062 [US3] Implement scroll position preservation in DossiersListScreen using React Navigation's getStateForNavigation and restoring scroll offset on return
- [ ] T063 [US3] Add empty state UI to DossiersListScreen when no dossiers found: large 80px icon (centered), headline text (titleLarge), description (bodyMedium), "Create Dossier" CTA button, generous 24px spacing per Gusto empty state pattern (FR-005)
- [ ] T064 [US3] Add offline indicator to DossierDetailScreen when viewing cached data: "Offline Mode" banner at top + "Last synced: [timestamp]" label below header
- [ ] T064A [US3-VERIFY] Run all US3 tests and VERIFY THEY NOW PASS - expected 18-20 passing assertions

**Checkpoint**: Dossier list and detail functional with passing tests ✓

---

## Phase 6A: User Story 4 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for global search BEFORE implementation

**Goal**: Verify search across 5 entity types, grouped results (max 3 per type), "See all" links

- [ ] T065A [P] [US4-TEST] Write global search tests in `mobile/__tests__/screens/search/SearchScreen.test.tsx`:
  * Test prominent search bar renders with auto-focus
  * Test recent searches (last 5) display below search bar with X clear buttons
  * Test suggested searches show on empty query
  * Test search debounced by 300ms (verify API not called immediately)
  * Test results grouped by entity type: Dossiers, Countries, Organizations, Forums, Positions
  * Test each group shows max 3 results + "See all [count]" link when more exist
  * Test "See all" navigates to filtered entity list screen
  * Test tapping result navigates to correct detail screen (dossier → DossierDetailScreen, country → CountryDetailScreen, etc.)
- [ ] T065B [P] [US4-TEST] Write search history tests in `mobile/__tests__/screens/search/history.test.tsx`:
  * Test search query saved to AsyncStorage after execution
  * Test max 5 recent searches stored (oldest removed when exceeds 5)
  * Test X button removes individual search from history
  * Test search query preserved when leaving and returning to Search tab
- [ ] T065C [US4-TEST] Run all US4 tests and VERIFY THEY FAIL - expected 12-14 failing assertions

**Checkpoint**: All search tests written and failing ✓

---

## Phase 6B: User Story 4 - Implementation

**Goal**: Implement global search to make tests pass

**Prerequisites**: Phase 6A tests must be written and failing

- [ ] T065 [P] [US4] Create SearchResultGroup component in `mobile/src/components/search/SearchResultGroup.tsx` with Gusto section header (titleMedium 18pt/500), 3 result items, "See all [count]" link in teal
- [ ] T066 [P] [US4] Create SearchResultItem component in `mobile/src/components/search/SearchResultItem.tsx` with entity icon (48x48px), name (titleLarge), type (bodySmall), chevron, ripple effect, Gusto card style
- [ ] T067 [P] [US4] Create RecentSearches component in `mobile/src/components/search/RecentSearches.tsx` showing last 5 searches with X clear buttons (44x44px touch targets)
- [ ] T068 [US4] Implement useGlobalSearch hook in `mobile/src/hooks/use-global-search.ts` with 300ms debounce querying 5 entity types (dossiers, countries, organizations, forums, positions) from WatermelonDB using Q.like on locale-aware fields
- [ ] T069 [US4] Implement search history storage in `mobile/src/utils/search-history.ts` using AsyncStorage with max 5 recent searches (FIFO queue, oldest removed when adding 6th)
- [ ] T070 [US4] Complete SearchScreen implementation in `mobile/src/screens/search/SearchScreen.tsx` with prominent search bar (Gusto outlined input, 12px radius), recent searches, suggested searches (e.g., "Countries", "Active Dossiers"), grouped results with generous spacing
- [ ] T071 [US4] Implement entity-specific navigation from search results: dossier → DossierDetailScreen, country → CountryDetailScreen, organization → OrganizationDetailScreen, forum → ForumDetailScreen, position → PositionDetailScreen (using React Navigation)
- [ ] T072 [US4] Add search query preservation in SearchScreen to maintain last query when returning to tab (store in navigation state)
- [ ] T073 [US4] Implement "See all" navigation to filtered entity list screens (e.g., "See all 15 Dossiers" → DossiersListScreen with search filter pre-applied)
- [ ] T073A [US4-VERIFY] Run all US4 tests and VERIFY THEY NOW PASS - expected 12-14 passing assertions

**Checkpoint**: Global search functional with passing tests ✓

---

## Phase 7A: User Story 5 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for calendar and events BEFORE implementation

**Goal**: Verify month view with color-coded dots, date selection, event list bottom sheet, event creation

- [ ] T074A [P] [US5-TEST] Write calendar view tests in `mobile/__tests__/screens/calendar/CalendarScreen.test.tsx`:
  * Test current month view renders with today's date highlighted (Gusto teal circle)
  * Test color-coded dots show for event types: engagement (blue), MOU (green), milestone (orange), deadline (red)
  * Test multiple events on same date show multiple dots
  * Test swipe left/right navigates to prev/next month with smooth animation
  * Test view mode toggle (month/week/day) switches layout correctly
- [ ] T074B [P] [US5-TEST] Write event list tests in `mobile/__tests__/screens/calendar/event-list.test.tsx`:
  * Test tapping date with events opens bottom sheet with event list
  * Test bottom sheet shows all events for selected date sorted by time
  * Test event items display time, title, type with correct color coding
  * Test tapping event in list opens EventDetailBottomSheet with full details
- [ ] T074C [P] [US5-TEST] Write event creation tests in `mobile/__tests__/screens/calendar/new-event.test.tsx`:
  * Test "+" button opens NewEventModal bottom sheet
  * Test form fields render: type selector (4 options), title, date picker, time picker, notes
  * Test form validation (title required, date required)
  * Test successful submission creates event in WatermelonDB and queues for sync
  * Test cancel button dismisses modal without creating event
- [ ] T074D [US5-TEST] Run all US5 tests and VERIFY THEY FAIL - expected 14-16 failing assertions

**Checkpoint**: All calendar tests written and failing ✓

---

## Phase 7B: User Story 5 - Implementation

**Goal**: Implement calendar to make tests pass

**Prerequisites**: Phase 7A tests must be written and failing

- [ ] T074 [P] [US5] Create CalendarMonthView component in `mobile/src/components/calendar/CalendarMonthView.tsx` using react-native-calendars with Gusto theme (teal accents), color-coded dots for event types (engagement=blue, MOU=green, milestone=orange, deadline=red)
- [ ] T075 [P] [US5] Create CalendarEventList component in `mobile/src/components/calendar/CalendarEventList.tsx` showing events for selected date with time (HH:mm format), title (titleMedium), type badge (color-coded chip) in Gusto card list style
- [ ] T076 [P] [US5] Create EventDetailBottomSheet component in `mobile/src/components/calendar/EventDetailBottomSheet.tsx` with Gusto bottom sheet (rounded 16-20px top corners, pull handle, semi-transparent backdrop) showing event details, attendees list, location
- [ ] T077 [P] [US5] Create NewEventModal component in `mobile/src/components/calendar/NewEventModal.tsx` with Gusto form: type selector (bottom sheet picker), title (outlined input), date/time pickers (iOS/Android native), notes (multiline input), primary CTA "Create Event" (contained button, teal, 52px height)
- [ ] T078 [US5] Implement useCalendarEntries hook in `mobile/src/hooks/use-calendar.ts` using TanStack Query + WatermelonDB observable to fetch events by date range with type-based color mapping
- [ ] T079 [US5] Implement useCreateCalendarEntry hook in `mobile/src/hooks/use-calendar.ts` with mutation to create new events in WatermelonDB and queue for sync (optimistic update)
- [ ] T080 [US5] Complete CalendarScreen implementation in `mobile/src/screens/calendar/CalendarScreen.tsx` with month view (today highlighted in teal), date selection (opens bottom sheet), event list, "+" FAB (floating action button, teal, 56x56px, bottom-right)
- [ ] T081 [US5] Add view mode toggle (month/week/day) to CalendarScreen header using segmented control (Material Design 3 style, teal active state)
- [ ] T082 [US5] Implement swipe left/right gesture for month navigation in CalendarMonthView using PanGestureHandler with smooth animation (300ms ease-in-out)
- [ ] T083 [US5] Add color legend for event types below calendar (small chips with labels: "Engagement", "MOU", "Milestone", "Deadline" in EN/AR)
- [ ] T083A [US5-VERIFY] Run all US5 tests and VERIFY THEY NOW PASS - expected 14-16 passing assertions

**Checkpoint**: Calendar functional with passing tests ✓

---

## Phase 8A: User Story 6 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for profile and settings BEFORE implementation

**Goal**: Verify profile header, settings sections, language switching, biometric toggle, logout

- [ ] T084A [P] [US6-TEST] Write profile screen tests in `mobile/__tests__/screens/profile/ProfileScreen.test.tsx`:
  * Test profile header shows avatar (48x48px circle), name (titleLarge), role (bodyMedium), organization (bodySmall)
  * Test settings sections render: Account Settings, Notifications, Language Preferences, Accessibility, About
  * Test each settings item shows icon (24x24px), label, value/chevron (44x44px touch target)
  * Test tapping settings item navigates to corresponding screen
- [ ] T084B [P] [US6-TEST] Write language switching tests in `mobile/__tests__/screens/profile/LanguagePreferencesScreen.test.tsx`:
  * Test language picker shows EN/AR options in bottom sheet
  * Test selecting Arabic changes i18n.language and updates UI immediately (no app restart)
  * Test RTL layout activates when Arabic selected (dir="rtl" on root container)
  * Test language preference saved to AsyncStorage
- [ ] T084C [P] [US6-TEST] Write biometric toggle tests in `mobile/__tests__/screens/profile/biometric.test.tsx`:
  * Test biometric toggle appears in Account Settings when device supports biometric (mock hasHardwareAsync returns true)
  * Test toggle disabled when biometric not supported (mock hasHardwareAsync returns false)
  * Test enabling biometric prompts enrollment (mock authenticateAsync)
  * Test biometric_enabled flag saved to AsyncStorage
- [ ] T084D [P] [US6-TEST] Write logout tests in `mobile/__tests__/screens/profile/logout.test.tsx`:
  * Test logout button shows at bottom of ProfileScreen (Gusto text button, destructive red color)
  * Test tapping logout opens confirmation dialog with "Cancel" and "Logout" options
  * Test cancel dismisses dialog without logging out
  * Test logout clears SecureStore auth token, clears WatermelonDB cache, navigates to LoginScreen
- [ ] T084E [US6-TEST] Run all US6 tests and VERIFY THEY FAIL - expected 16-18 failing assertions

**Checkpoint**: All profile tests written and failing ✓

---

## Phase 8B: User Story 6 - Implementation

**Goal**: Implement profile and settings to make tests pass

**Prerequisites**: Phase 8A tests must be written and failing

- [ ] T084 [P] [US6] Create ProfileHeader component in `mobile/src/components/profile/ProfileHeader.tsx` with Gusto card style: avatar (48x48px circle, placeholder or user photo), name (displayLarge 32pt/700), role badge (pill chip), organization (bodyMedium gray), edit button icon (24x24px)
- [ ] T085 [P] [US6] Create SettingsSection component in `mobile/src/components/profile/SettingsSection.tsx` with section title (titleMedium 18pt/500, 16px top margin) and list of settings items in Gusto card
- [ ] T086 [P] [US6] Create SettingsItem component in `mobile/src/components/profile/SettingsItem.tsx` with icon (24x24px start), label (bodyLarge 16pt), value/chevron (bodyMedium end), 44x44px touch target, ripple effect
- [ ] T087 [P] [US6] Create LanguagePicker component in `mobile/src/components/profile/LanguagePicker.tsx` with EN/AR radio buttons in bottom sheet modal (Gusto rounded corners, semi-transparent backdrop)
- [ ] T088 [US6] Implement useUserProfile hook in `mobile/src/hooks/use-user-profile.ts` to fetch current user data from Supabase Auth context (user.email, user.user_metadata.name, role, organization)
- [ ] T089 [US6] Implement useLogout hook in `mobile/src/hooks/use-auth.ts` with: clear SecureStore auth/refresh tokens, clear WatermelonDB database (database.write async batch delete all), navigate to LoginScreen using navigation.reset
- [ ] T090 [US6] Complete ProfileScreen implementation in `mobile/src/screens/profile/ProfileScreen.tsx` with header, sections (Gusto card layouts with 12-16px spacing), logout button at bottom (text button, red, 16px bottom margin)
- [ ] T091 [US6] Create NotificationSettingsScreen in `mobile/src/screens/profile/NotificationSettingsScreen.tsx` with toggle switches (Material Design 3 style) for each category: Assignments, Deadlines, Intake Requests, Delegation Expiring, Dossier Comments (save to AsyncStorage)
- [ ] T092 [US6] Create LanguagePreferencesScreen in `mobile/src/screens/profile/LanguagePreferencesScreen.tsx` with language picker and immediate i18n.changeLanguage() on selection (no app restart required, UI updates via re-render)
- [ ] T093 [US6] Implement biometric toggle in Account Settings with enrollment prompt using expo-local-authentication: check hasHardwareAsync(), call authenticateAsync({ promptMessage: "Enable biometric unlock" }), save biometric_enabled to AsyncStorage
- [ ] T094 [US6] Add confirmation dialog to logout with Gusto alert style: title "Confirm Logout", message "Are you sure?", "Cancel" (text button), "Logout" (contained button, red) using React Native Paper Dialog
- [ ] T094A [US6-VERIFY] Run all US6 tests and VERIFY THEY NOW PASS - expected 16-18 passing assertions

**Checkpoint**: Profile and settings functional with passing tests ✓

---

## Phase 9A: User Story 7 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for assignments BEFORE implementation

**Goal**: Verify task list grouped by status, escalation indicators, status updates

- [ ] T095A [P] [US7-TEST] Write assignments list tests in `mobile/__tests__/screens/assignments/AssignmentsScreen.test.tsx`:
  * Test segmented control shows 3 tabs: Pending, In Progress, Completed
  * Test assignments grouped by status in correct tabs
  * Test escalated tasks appear at top with red indicator (priority sort)
  * Test assignment cards show title, due date, priority badge, status chip (Gusto pill shape)
  * Test empty state shows in each tab when no assignments exist
- [ ] T095B [P] [US7-TEST] Write assignment detail tests in `mobile/__tests__/screens/assignments/AssignmentDetailScreen.test.tsx`:
  * Test detail screen shows task description (bodyLarge), due date (formatted), related dossier link (tappable)
  * Test status picker opens bottom sheet with 4 options: Pending, In Progress, Completed, Rejected
  * Test "Mark Complete" button shows for Pending/In Progress statuses
  * Test tapping "Mark Complete" opens confirmation dialog, then updates status and shows success snackbar
- [ ] T095C [US7-TEST] Run all US7 tests and VERIFY THEY FAIL - expected 12-14 failing assertions

**Checkpoint**: All assignment tests written and failing ✓

---

## Phase 9B: User Story 7 - Implementation

**Goal**: Implement assignments to make tests pass

**Prerequisites**: Phase 9A tests must be written and failing

- [ ] T095 [P] [US7] Create AssignmentCard component in `mobile/src/components/assignment/AssignmentCard.tsx` with Gusto card: title (titleMedium), due date (bodySmall with calendar icon), priority badge (high=red, normal=gray), status chip (pill, teal border), escalation indicator (red vertical line 4px wide on start edge), 44x44px touch target
- [ ] T096 [P] [US7] Create AssignmentStatusPicker component in `mobile/src/components/assignment/AssignmentStatusPicker.tsx` with bottom sheet picker showing 4 status options (Pending, In Progress, Completed, Rejected) as radio buttons with icons
- [ ] T097 [US7] Implement useAssignments hook in `mobile/src/hooks/use-assignments.ts` using TanStack Query + WatermelonDB observable to fetch user assignments, group by status, sort escalated to top within each group
- [ ] T098 [US7] Implement useUpdateAssignment hook in `mobile/src/hooks/use-assignments.ts` with mutation to update assignment status in WatermelonDB and queue for sync (optimistic update)
- [ ] T099 [US7] Create AssignmentsScreen in `mobile/src/screens/assignments/AssignmentsScreen.tsx` with segmented control (Material Design 3, teal active), FlashList for each tab (Pending, In Progress, Completed), empty states per Gusto pattern
- [ ] T100 [US7] Create AssignmentDetailScreen in `mobile/src/screens/assignments/AssignmentDetailScreen.tsx` with Gusto card sections: description, due date, related dossier link (navigates to DossierDetailScreen), status picker, action buttons (full-width contained buttons)
- [ ] T101 [US7] Add escalated task sorting to useAssignments hook: sort by escalation_flag DESC, then by due_date ASC within each status group, add red 4px vertical line indicator to escalated cards
- [ ] T102 [US7] Implement "Mark Complete" button in AssignmentDetailScreen with confirmation dialog (Gusto alert: "Are you sure this assignment is complete?", Cancel/Complete buttons), success snackbar ("Assignment marked complete"), navigate back on success
- [ ] T102A [US7-VERIFY] Run all US7 tests and VERIFY THEY NOW PASS - expected 12-14 passing assertions

**Checkpoint**: Assignments functional with passing tests ✓

---

## Phase 10A: User Story 8 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for intake management BEFORE implementation

**Goal**: Verify intake queue (role-based), ticket details, approve/reject/request-more-info actions

- [ ] T103A [P] [US8-TEST] Write intake queue tests in `mobile/__tests__/screens/intake/IntakeQueueScreen.test.tsx`:
  * Test 3 tabs show: Queue, My Tickets, New Request
  * Test only intake officers can access (role check, show 403 screen if not authorized)
  * Test queue shows pending tickets in card format with request type, requester, submission date, priority badge
  * Test tickets sorted by priority DESC, then submission date ASC
  * Test empty state shows when no pending tickets
- [ ] T103B [P] [US8-TEST] Write intake ticket detail tests in `mobile/__tests__/screens/intake/IntakeTicketDetailScreen.test.tsx`:
  * Test detail screen shows full request details, attachments list, requester info
  * Test action buttons show: Approve (contained green), Reject (outlined red), Request More Info (text)
  * Test approve opens notes dialog, submits, updates ticket status, shows success snackbar
  * Test reject opens reason dialog, submits, updates ticket status, shows success snackbar
  * Test request-more-info opens message dialog, sends notification to requester
- [ ] T103C [US8-TEST] Run all US8 tests and VERIFY THEY FAIL - expected 10-12 failing assertions

**Checkpoint**: All intake tests written and failing ✓

---

## Phase 10B: User Story 8 - Implementation

**Goal**: Implement intake management to make tests pass

**Prerequisites**: Phase 10A tests must be written and failing

- [ ] T103 [P] [US8] Create IntakeTicketCard component in `mobile/src/components/intake/IntakeTicketCard.tsx` with Gusto card: request type (titleMedium with icon), requester name (bodyMedium), submission date (bodySmall relative), priority badge (high=red, normal=gray, low=blue), 44x44px touch target
- [ ] T104 [P] [US8] Create IntakeActionButtons component in `mobile/src/components/intake/IntakeActionButtons.tsx` with 3 action buttons: Approve (contained green, 52px height), Reject (outlined red), Request More Info (text teal), stacked vertically with 12px gap
- [ ] T105 [US8] Implement useIntakeTickets hook in `mobile/src/hooks/use-intake.ts` using TanStack Query + WatermelonDB observable to fetch tickets by status for intake officer role (filter by user_role='intake_officer' from auth context)
- [ ] T106 [US8] Implement useProcessTicket hook in `mobile/src/hooks/use-intake.ts` with mutations for: approve (update status, add approval notes), reject (update status, add rejection reason), request-more-info (send notification, add message to ticket)
- [ ] T107 [US8] Create IntakeQueueScreen in `mobile/src/screens/intake/IntakeQueueScreen.tsx` with 3 tabs (segmented control), FlashList for pending tickets sorted by priority/date, empty states, role-based access check (show 403 error screen if user_role !== 'intake_officer')
- [ ] T108 [US8] Create IntakeTicketDetailScreen in `mobile/src/screens/intake/IntakeTicketDetailScreen.tsx` with Gusto card sections: request details, attachments list (with download/preview), requester info card, action buttons at bottom
- [ ] T109 [US8] Add role-based access check in navigation (BottomTabNavigator or menu) to hide Intake section for non-intake-officer users (check user_role from auth context)
- [ ] T109A [US8-VERIFY] Run all US8 tests and VERIFY THEY NOW PASS - expected 10-12 failing assertions

**Checkpoint**: Intake management functional with passing tests ✓

---

## Phase 11A: User Story 9 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for countries/organizations/forums BEFORE implementation

**Goal**: Verify entity lists, detail screens with related dossiers, search capability

- [ ] T110A [P] [US9-TEST] Write countries tests in `mobile/__tests__/screens/countries/CountriesListScreen.test.tsx`:
  * Test country cards show flag icon (48x48px), name (EN/AR based on i18n.language), dossier count badge
  * Test FlashList virtualization for 100+ countries
  * Test search bar filters countries by name (locale-aware)
  * Test tapping country navigates to CountryDetailScreen
- [ ] T110B [P] [US9-TEST] Write country detail tests in `mobile/__tests__/screens/countries/CountryDetailScreen.test.tsx`:
  * Test detail screen shows country info card (flag, name, ISO code)
  * Test related dossiers list shows with dossier cards
  * Test "View all related dossiers" link navigates to DossiersListScreen with country filter
  * Test recent activity section shows last 10 activities
- [ ] T110C [US9-TEST] Write similar tests for OrganizationsListScreen and ForumsListScreen - expected 8-10 failing assertions each

**Checkpoint**: All entity tests written and failing ✓

---

## Phase 11B: User Story 9 - Implementation

**Goal**: Implement countries/organizations/forums to make tests pass

**Prerequisites**: Phase 11A tests must be written and failing

- [ ] T110 [P] [US9] Create CountryCard component in `mobile/src/components/entity/CountryCard.tsx` with Gusto card: flag icon (48x48px circle or rounded square), name (titleMedium, shows name_en or name_ar based on i18n.language), dossier count badge (gray chip "15 dossiers"), chevron, 44x44px touch target
- [ ] T111 [P] [US9] Create OrganizationCard component in `mobile/src/components/entity/OrganizationCard.tsx` with logo (48x48px), name (locale-aware), type badge, relationship count, Gusto card style
- [ ] T112 [P] [US9] Create ForumCard component in `mobile/src/components/entity/ForumCard.tsx` with name, type, status chip (active=green, inactive=gray), participant count, Gusto card style
- [ ] T113 [US9] Implement useCountries, useOrganizations, useForums hooks in `mobile/src/hooks/use-entities.ts` using TanStack Query + WatermelonDB observable queries with search support (Q.like on name_en/name_ar)
- [ ] T114 [US9] Create CountriesListScreen in `mobile/src/screens/countries/CountriesListScreen.tsx` with FlashList, search bar (auto-focus), empty state, Gusto styling (generous spacing, teal search accent)
- [ ] T115 [US9] Create CountryDetailScreen in `mobile/src/screens/countries/CountryDetailScreen.tsx` with Gusto card sections: country info (flag, name, ISO, metadata), related dossiers list (shows first 5, "View all" link), recent activity feed (last 10 items)
- [ ] T116 [US9] Create OrganizationsListScreen in `mobile/src/screens/organizations/OrganizationsListScreen.tsx` with FlashList, search, empty state
- [ ] T117 [US9] Create OrganizationDetailScreen in `mobile/src/screens/organizations/OrganizationDetailScreen.tsx` with organization info card, related dossiers, recent activity
- [ ] T118 [US9] Create ForumsListScreen in `mobile/src/screens/forums/ForumsListScreen.tsx` with FlashList, search, empty state
- [ ] T119 [US9] Create ForumDetailScreen in `mobile/src/screens/forums/ForumDetailScreen.tsx` with forum info card, participants list, related dossiers
- [ ] T120 [US9] Add navigation from entity detail screens to filtered dossier list: tap "View all related dossiers" → DossiersListScreen with pre-applied filter (e.g., country_id=123), show filter chip at top with X clear button
- [ ] T120A [US9-VERIFY] Run all US9 tests and VERIFY THEY NOW PASS - expected 24-30 passing assertions total

**Checkpoint**: Countries/Organizations/Forums functional with passing tests ✓

---

## Phase 12A: User Story 10 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for positions and MOUs BEFORE implementation

**Goal**: Verify position/MOU lists, detail screens with version history, approval status

- [ ] T121A [P] [US10-TEST] Write positions tests in `mobile/__tests__/screens/positions/PositionsListScreen.test.tsx`:
  * Test position cards show title, related dossier link, status chip (draft=gray, approved=green, published=teal), last modified date
  * Test FlashList virtualization
  * Test search filters by title
  * Test tapping position navigates to PositionDetailScreen
- [ ] T121B [P] [US10-TEST] Write position detail tests in `mobile/__tests__/screens/positions/PositionDetailScreen.test.tsx`:
  * Test detail screen shows position content (scrollable text), version history link, approval status badge, approval chain (if approved)
  * Test "View version history" link navigates to PositionVersionsScreen
  * Test PositionVersionsScreen lists all versions with date, author, change summary, restore button (admin only)
- [ ] T121C [US10-TEST] Write similar tests for MOUsListScreen and MOUDetailScreen - expected 8-10 failing assertions total

**Checkpoint**: All position/MOU tests written and failing ✓

---

## Phase 12B: User Story 10 - Implementation

**Goal**: Implement positions and MOUs to make tests pass

**Prerequisites**: Phase 12A tests must be written and failing

- [ ] T121 [P] [US10] Create PositionCard component in `mobile/src/components/entity/PositionCard.tsx` with Gusto card: title (titleMedium), related dossier link (tappable bodySmall with chain icon), status chip (draft=gray, approved=green outlined, published=teal filled), last modified (bodySmall gray relative date "2 days ago"), chevron, 44x44px touch target
- [ ] T122 [P] [US10] Create MOUCard component in `mobile/src/components/entity/MOUCard.tsx` with title, signing parties (comma-separated), effective date (formatted), status chip (active=green, expired=red), Gusto card style
- [ ] T123 [US10] Implement usePositions, useMOUs hooks in `mobile/src/hooks/use-entities.ts` using TanStack Query + WatermelonDB observable with search (Q.like on title field)
- [ ] T124 [US10] Create PositionsListScreen in `mobile/src/screens/positions/PositionsListScreen.tsx` with FlashList, search bar, empty state (Gusto styling)
- [ ] T125 [US10] Create PositionDetailScreen in `mobile/src/screens/positions/PositionDetailScreen.tsx` with Gusto card sections: position content (scrollable markdown/text, bodyLarge), version history link (text button teal), approval status badge, approval chain (list of approvers with timestamps if status=approved)
- [ ] T126 [US10] Create PositionVersionsScreen in `mobile/src/screens/positions/PositionVersionsScreen.tsx` listing all versions with date (formatted), author name, change summary (bodyMedium), restore button (admin role only, outlined button), sorted by version DESC
- [ ] T127 [US10] Create MOUsListScreen in `mobile/src/screens/mous/MOUsListScreen.tsx` with FlashList, search, empty state
- [ ] T128 [US10] Create MOUDetailScreen in `mobile/src/screens/mous/MOUDetailScreen.tsx` with Gusto card sections: parties involved (list with logos), terms summary (text), related documents (list with download icons), status timeline (vertical stepper: signed → active → expired, color-coded)
- [ ] T128A [US10-VERIFY] Run all US10 tests and VERIFY THEY NOW PASS - expected 18-20 passing assertions

**Checkpoint**: Positions and MOUs functional with passing tests ✓

---

## Phase 13A: User Story 11 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for intelligence and monitoring BEFORE implementation

**Goal**: Verify signals list (role-based), priority sorting, monitoring dashboard metrics

- [ ] T129A [P] [US11-TEST] Write intelligence signals tests in `mobile/__tests__/screens/intelligence/IntelligenceSignalsScreen.test.tsx`:
  * Test only analysts can access (role check, show 403 if user_role !== 'analyst')
  * Test signals grouped by priority: Critical (red), High (orange), Medium (yellow), Low (gray)
  * Test critical signals appear at top with red indicator bar (4px vertical line on start edge)
  * Test signal cards show priority badge, title, source, timestamp (relative)
  * Test tapping signal navigates to SignalDetailScreen
- [ ] T129B [P] [US11-TEST] Write signal detail tests in `mobile/__tests__/screens/intelligence/SignalDetailScreen.test.tsx`:
  * Test detail shows description (bodyLarge), source (bodyMedium with icon), related entities (linked chips), analyst notes (editable text area for analysts)
  * Test analyst can add notes (textarea, save button)
- [ ] T129C [P] [US11-TEST] Write monitoring dashboard tests in `mobile/__tests__/screens/monitoring/MonitoringDashboardScreen.test.tsx`:
  * Test metric cards show: Total Dossiers (count), Active Signals (count), Pending Approvals (count), Recent Alerts (count)
  * Test recent alerts list shows last 10 alerts with severity icons
  * Test tapping alert navigates to relevant detail screen
- [ ] T129D [US11-TEST] Run all US11 tests and VERIFY THEY FAIL - expected 12-14 failing assertions

**Checkpoint**: All intelligence tests written and failing ✓

---

## Phase 13B: User Story 11 - Implementation

**Goal**: Implement intelligence and monitoring to make tests pass

**Prerequisites**: Phase 13A tests must be written and failing

- [ ] T129 [P] [US11] Create IntelligenceSignalCard component in `mobile/src/components/intelligence/IntelligenceSignalCard.tsx` with Gusto card: priority indicator (4px vertical bar, color-coded: critical=red, high=orange, medium=yellow, low=gray), priority badge (chip with icon), title (titleMedium), source (bodySmall with icon), timestamp (bodySmall relative "3 hours ago"), 44x44px touch target
- [ ] T130 [P] [US11] Create DashboardMetricCard component in `mobile/src/components/monitoring/DashboardMetricCard.tsx` with Gusto card: metric title (titleMedium), count (displayLarge 32pt/700 teal), trend indicator (optional: up/down arrow with % change), icon (48x48px teal circle background)
- [ ] T131 [US11] Implement useIntelligenceSignals hook in `mobile/src/hooks/use-intelligence.ts` using TanStack Query + WatermelonDB observable filtering by user role (analyst only), group by priority, sort by timestamp DESC within each priority
- [ ] T132 [US11] Implement useDashboardMetrics hook in `mobile/src/hooks/use-monitoring.ts` to fetch key metrics from WatermelonDB: total dossiers (count all), active signals (count where status='active'), pending approvals (count where status='pending'), recent alerts (count where timestamp > now - 24h)
- [ ] T133 [US11] Create IntelligenceSignalsScreen in `mobile/src/screens/intelligence/IntelligenceSignalsScreen.tsx` with signals grouped by priority (Critical section, High section, etc.), FlashList per section, role-based access check (show 403 if not analyst), empty state per priority group
- [ ] T134 [US11] Create SignalDetailScreen in `mobile/src/screens/intelligence/SignalDetailScreen.tsx` with Gusto card sections: description (bodyLarge), source (bodyMedium with external link icon), related entities (horizontal chip list, tappable to navigate), analyst notes (editable textarea if user_role='analyst', read-only otherwise, save button updates WatermelonDB)
- [ ] T135 [US11] Create MonitoringDashboardScreen in `mobile/src/screens/monitoring/MonitoringDashboardScreen.tsx` with 2x2 grid of metric cards (generous 16px gap), recent alerts list below (FlashList), pull-to-refresh to update metrics
- [ ] T136 [US11] Add role-based access check to hide Intelligence and Monitoring sections in navigation for non-analyst users (check user_role from auth context in BottomTabNavigator or menu)
- [ ] T137 [US11] Implement deep linking from push notifications to SignalDetailScreen when critical signal detected: parse notification payload, extract signal_id, navigate using navigation.navigate('SignalDetail', { signalId })
- [ ] T137A [US11-VERIFY] Run all US11 tests and VERIFY THEY NOW PASS - expected 12-14 passing assertions

**Checkpoint**: Intelligence and monitoring functional with passing tests ✓

---

## Phase 14A: User Story 12 - Tests (Test-First) 🧪

**Purpose**: Write failing tests for offline support BEFORE implementation

**Goal**: Verify offline indicators, cached data access, sync on reconnect, conflict resolution UI

- [ ] T138A [P] [US12-TEST] Write offline detection tests in `mobile/__tests__/hooks/use-offline-status.test.tsx`:
  * Test useOfflineStatus hook detects network change (mock NetInfo)
  * Test offline banner appears when network disconnected
  * Test offline banner dismisses when network reconnects
- [ ] T138B [P] [US12-TEST] Write cached data tests in `mobile/__tests__/screens/offline-mode.test.tsx`:
  * Test last 50 dossiers accessible offline (query WatermelonDB, verify records exist)
  * Test last 20 assignments accessible offline
  * Test current month calendar entries accessible offline
  * Test "Last synced: [timestamp]" indicator shows on detail screens when offline
  * Test "Offline Mode" banner shows at top of screen when no network
- [ ] T138C [P] [US12-TEST] Write view-only mode tests in `mobile/__tests__/screens/offline-edit-prevention.test.tsx`:
  * Test edit buttons disabled when offline (dossier edit, assignment update, event create)
  * Test tapping disabled button shows snackbar "Offline - View only mode"
  * Test edit buttons re-enabled when network reconnects
- [ ] T138D [P] [US12-TEST] Write sync tests in `mobile/__tests__/services/sync-service.test.tsx`:
  * Test manual sync triggered by pull-to-refresh gesture
  * Test auto-sync triggered on app foreground if >5 minutes since last sync (mock AppState)
  * Test incremental sync fetches only records modified since last_sync_timestamp
  * Test sync success updates last_sync_timestamp in AsyncStorage
- [ ] T138E [P] [US12-TEST] Write conflict resolution tests in `mobile/__tests__/components/sync/ConflictResolutionModal.test.tsx`:
  * Test conflict modal shows when _version mismatch detected
  * Test modal displays 3 options: Keep mobile changes, Use web version, View side-by-side
  * Test "Keep mobile" applies local changes and increments _version
  * Test "Use web" discards local changes and accepts server version
  * Test "View side-by-side" shows diff UI with field-level comparison (TBD implementation in tasks)
- [ ] T138F [P] [US12-TEST] Write TTL cleanup tests in `mobile/__tests__/services/data-cleanup-service.test.tsx`:
  * Test records older than 90 days purged from WatermelonDB on app foreground (mock synced_at timestamps)
  * Test cleanup runs max once per day (check last_cleanup_timestamp in AsyncStorage)
- [ ] T138G [US12-TEST] Run all US12 tests and VERIFY THEY FAIL - expected 20-24 failing assertions

**Checkpoint**: All offline tests written and failing ✓

---

## Phase 14B: User Story 12 - Implementation

**Goal**: Implement offline support to make tests pass

**Prerequisites**: Phase 14A tests must be written and failing

- [ ] T138 [US12] Implement useOfflineStatus hook in `mobile/src/hooks/use-offline-status.ts` using NetInfo.useNetInfo() to detect connectivity changes, return isOffline boolean
- [ ] T139 [US12] Implement OfflineBanner component display logic in RootNavigator based on useOfflineStatus hook: show banner at top (Gusto warning style: yellow background, dark text, 48px height, "Offline Mode" label) when isOffline=true per FR-074
- [ ] T140 [US12] Implement TTL cleanup service in `mobile/src/services/data-cleanup-service.ts` to purge records older than 90 days on app foreground: query WatermelonDB where synced_at < (now - 90 days), batch delete, save last_cleanup_timestamp to AsyncStorage (max once per day check), run on AppState change to 'active'
- [ ] T141 [US12] Add "Last synced: [timestamp]" indicator to DossierDetailScreen, AssignmentDetailScreen, CalendarScreen when displaying cached data: query last_sync_timestamp from AsyncStorage, format relative (e.g., "Last synced: 2 hours ago"), show below header in gray text (bodySmall) per FR-075
- [ ] T142 [US12] Implement view-only mode in detail screens when offline: check useOfflineStatus(), disable edit buttons (opacity 0.5, onPress shows snackbar), show snackbar "Offline - View only mode" when edit attempted per FR-076
- [ ] T143 [US12] Implement auto-sync on app foreground in `mobile/App.tsx` using AppState listener: check if >5 minutes since last_sync_timestamp from AsyncStorage, call sync-service.ts incrementalSync() if true per FR-079
- [ ] T144 [US12] Add manual sync trigger to PullToRefresh component on Home, Dossiers, Calendar screens: call sync-service.ts incrementalSync(), show spinner, show success checkmark or error snackbar per FR-080
- [ ] T145 [US12] Implement conflict resolution modal in `mobile/src/components/sync/ConflictResolutionModal.tsx` with Gusto bottom sheet style: 3 action buttons (Keep mobile, Use web, View side-by-side in vertical stack), show field-by-field diff (fieldName, localValue, serverValue in table format), primary button "Resolve" applies selection per FR-078
- [ ] T146 [US12] Integrate conflict resolver into sync service to detect conflicts via _version mismatch: when sync-service.ts receives conflict response from backend, show ConflictResolutionModal, await user selection, apply resolution (update WatermelonDB record with chosen values, increment _version), retry sync per contracts/sync-api.md
- [ ] T147 [US12] Add empty state UI to screens when attempting to access uncached data offline: show Gusto empty state (large icon, headline "No cached data available", description "This content requires internet connection", "Retry when online" button that checks connectivity and retries), display when WatermelonDB query returns empty and isOffline=true
- [ ] T148 [US12] Implement WatermelonDB query optimization with @lazy decorators for expensive queries: add @lazy to computed properties in Dossier, Assignment, CalendarEntry models (e.g., @lazy relatedCountries, @lazy timeline), ensure queries use .observeWithColumns() for granular reactivity per data-model.md performance section
- [ ] T148A [US12-VERIFY] Run all US12 tests and VERIFY THEY NOW PASS - expected 20-24 passing assertions

**Checkpoint**: Offline support fully functional with passing tests ✓

---

## Phase 15: Integration Testing & Cross-Feature Validation

**Purpose**: Final integration tests that span multiple user stories and end-to-end validation

**Note**: Unit and component tests were written in test-first phases (3A-14A). This phase covers only integration tests, E2E tests, and cross-cutting validation.

- [ ] T149 [P] Add accessibility labels and hints to all interactive elements across all screens per FR-050 and FR-051 (buttons, cards, inputs) - verify with screen reader test pass in T151
- [ ] T150 [P] Verify color contrast meets WCAG AA standards (4.5:1 minimum) for all text on background per FR-052 and SC-013 - run contrast checker on Gusto color palette (#1B5B5A on #F5F4F2, #FF6B35 on white, etc.)
- [ ] T151 [P] Test VoiceOver (iOS) and TalkBack (Android) support with proper focus management per FR-053 - record E2E test with screen reader navigating through Home → Dossiers → Detail → back
- [ ] T152 [P] Verify all touch targets meet 44x44px minimum size per FR-048 and SC-012 - use React DevTools inspector to measure all Button, Card, Chip, Icon components
- [ ] T153 [P] Test iOS Dynamic Type scaling up to 200% with appropriate reflow per FR-049 - set device to largest text size, verify no text truncation or layout breaks
- [ ] T154 [P] Verify RTL layout for all screens in Arabic language mode with logical properties per FR-042 - toggle to Arabic, verify all margins/padding use ms-/me-/ps-/pe-, no ml-/mr- usage
- [ ] T155 [P] Test directional icon flipping (chevrons, arrows) 180 degrees in RTL mode per FR-044 - verify ChevronRight becomes ChevronLeft visually in Arabic mode
- [ ] T156 [P] Verify date formatting according to locale (English: "Jan 15, 2025" vs Arabic: "١٥ يناير ٢٠٢٥") per FR-046 - check all date displays across screens
- [ ] T157 [P] Verify number formatting according to locale (English: "1,234.56" vs Arabic: "١٬٢٣٤٫٥٦") per FR-047 - check all number displays (counts, stats)
- [ ] T158 Optimize list scrolling performance with FlashList for 1000+ items maintaining 60fps per FR-054 and SC-007 - run performance profiler on DossiersListScreen with 1000 mock items
- [ ] T159 Add React.memo to expensive components to prevent unnecessary re-renders per FR-055 - wrap StatsCard, DossierCard, AssignmentCard, CalendarMonthView
- [ ] T160 Add image lazy loading with placeholder and fade-in animation per FR-057 - test on DossierDetailScreen with images, verify skeleton → fade-in
- [ ] T161 Implement image compression to <2MB before upload per FR-058 - test camera upload flow, verify file size <2MB in network inspector
- [ ] T162 Verify 30-minute inactivity auto-logout using AppState listener per FR-063 - set timer, wait 30 min inactive, verify logout and navigation to LoginScreen
- [ ] T163 Test biometric authentication on physical devices (Face ID/Touch ID/Fingerprint) per FR-061 and FR-062 - test app unlock flow, confidential dossier access flow
- [ ] T164 Test push notifications on physical devices with deep linking per FR-071 - send test notification for each category (assignment, deadline, etc.), verify deep link navigation
- [ ] T165 Verify badge count updates on app icon for unread notifications per FR-068 - send notification, verify badge appears on home screen icon (iOS/Android)
- [ ] T166 Run performance validation tests (home screen ≤1s, list load ≤2s, sync ≤3s, tab transition ≤300ms, search ≤500ms, calendar ≤1s) per SC-M01 through SC-M06 - use Chrome DevTools Performance profiler or React Native performance monitor
- [ ] T167 Run security audit for JWT token encryption in SecureStore per FR-064 - verify tokens stored in SecureStore, not AsyncStorage, check encryption at rest
- [ ] T168 Verify audit logging for sync operations includes metadata (user_id, timestamp, action, entity_type, old_values, new_values) - inspect backend audit_logs table after sync operations
- [ ] T169 Test sync conflict scenarios (same dossier edited on web and mobile) with conflict resolution modal - create conflict by editing dossier on web while offline on mobile, reconnect, verify modal shows with 3 options
- [ ] T170 Test network interruption handling with cached data and offline indicators per SC-015 - toggle airplane mode during various screens, verify graceful degradation
- [ ] T171 [P] Create Maestro E2E tests in `mobile/e2e/`:
  * login.yaml - login flow with email/password and biometric
  * dossier-list.yaml - browse dossiers, search, tap to detail, back
  * dossier-detail.yaml - view detail sections, scroll, navigate to related entities
  * assignment-update.yaml - view assignment, change status, mark complete
  * offline-sync.yaml - go offline, view cached data, reconnect, verify sync
- [ ] T172 Run quickstart.md validation on fresh machine to ensure setup instructions are complete and accurate - follow quickstart from scratch, document any missing steps
- [ ] T173 Update mobile app documentation in `mobile/README.md` with setup, architecture (Gusto design system reference), and development workflow
- [ ] T174 Create PR with comprehensive description, screenshots of all screens (Gusto design examples), and link to specs/021-apply-gusto-design/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story Tests (Phases 3A, 4A, 5A, ... 14A)**: All depend on Foundational phase completion
- **User Story Implementation (Phases 3B, 4B, 5B, ... 14B)**: Each depends on its corresponding test phase (e.g., 3B depends on 3A)
  - User story implementations can proceed in parallel (if staffed) after their tests are written
  - Or sequentially in priority order (P1 → P2 → P3)
- **Integration Testing (Phase 15)**: Depends on all desired user stories being complete

### User Story Dependencies (Test-First Structure)

- **US1 (P1)**: Phase 3A (tests) → Phase 3B (implementation) - No dependencies on other stories
- **US2 (P1)**: Phase 4A → Phase 4B - Integrates with US1 navigation but independently testable
- **US3 (P1)**: Phase 5A → Phase 5B - Uses US1 navigation but independently testable
- **US4 (P2)**: Phase 6A → Phase 6B - Uses US1 navigation, references US3 dossiers but independently testable
- **US5 (P2)**: Phase 7A → Phase 7B - Uses US1 navigation but independently testable
- **US6 (P2)**: Phase 8A → Phase 8B - Uses US1 navigation but independently testable
- **US7 (P2)**: Phase 9A → Phase 9B - References US2 home quick actions and US3 dossiers but independently testable
- **US8 (P3)**: Phase 10A → Phase 10B - Independently testable for intake officer role
- **US9 (P3)**: Phase 11A → Phase 11B - References US3 dossiers but independently testable
- **US10 (P3)**: Phase 12A → Phase 12B - References US3 dossiers but independently testable
- **US11 (P3)**: Phase 13A → Phase 13B - Independently testable for analyst role
- **US12 (P2)**: Phase 14A → Phase 14B - Depends on at least US1, US2, US3 being implemented for meaningful offline testing

### Within Each Phase

- Test phase (XA) tasks marked [P] can run in parallel (different test files, no dependencies)
- Implementation phase (XB) tasks marked [P] can run in parallel (different component files, no dependencies)
- Non-[P] tasks typically depend on previous tasks in sequence
- All tasks within a phase must complete before checkpoint validation

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (Phase 1)
- All Foundational model creation tasks (T007-T018) marked [P] can run in parallel within Phase 2
- All Foundational service tasks (T022-T024) and UI component tasks (T027-T028) marked [P] can run in parallel within Phase 2
- Once Foundational phase completes, all test phases (3A-14A) can start in parallel (if team capacity allows)
- Within each test phase, all [P] tasks can run in parallel
- Within each implementation phase, all [P] tasks can run in parallel
- Integration tasks in Phase 15 marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only, Test-First)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3A: User Story 1 Tests → Verify tests fail
4. Complete Phase 3B: User Story 1 Implementation → Verify tests pass
5. Complete Phase 4A: User Story 2 Tests → Verify tests fail
6. Complete Phase 4B: User Story 2 Implementation → Verify tests pass
7. Complete Phase 5A: User Story 3 Tests → Verify tests fail
8. Complete Phase 5B: User Story 3 Implementation → Verify tests pass
9. **STOP and VALIDATE**: Test navigation, home dashboard, and dossier viewing independently
10. Deploy/demo if ready - this is a functional MVP!

### Incremental Delivery (Test-First)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 Tests → Implement → Verify tests pass → Deploy/Demo (Navigation MVP!)
3. Add User Story 2 Tests → Implement → Verify tests pass → Deploy/Demo (Dashboard MVP!)
4. Add User Story 3 Tests → Implement → Verify tests pass → Deploy/Demo (Dossiers MVP!)
5. Add User Story 4 Tests → Implement → Verify tests pass → Deploy/Demo (Search added!)
6. Add User Story 5 Tests → Implement → Verify tests pass → Deploy/Demo (Calendar added!)
7. Continue with remaining P2 and P3 stories based on user feedback and priority
8. Each story adds value without breaking previous stories (test-first ensures regressions caught)

### Parallel Team Strategy (Test-First)

With multiple developers:

1. Team completes Setup + Foundational together (Phases 1-2)
2. Once Foundational is done:
   - Developer A: User Story 1 Tests (Phase 3A) → Implementation (Phase 3B)
   - Developer B: User Story 2 Tests (Phase 4A) → Implementation (Phase 4B)
   - Developer C: User Story 3 Tests (Phase 5A) → Implementation (Phase 5B)
3. After P1 stories complete:
   - Developer A: User Story 4 Tests/Impl (Phases 6A-6B)
   - Developer B: User Story 5 Tests/Impl (Phases 7A-7B)
   - Developer C: User Story 6 Tests/Impl (Phases 8A-8B)
4. Continue with P2 and P3 stories in parallel
5. Stories complete and integrate independently (test-first prevents merge conflicts)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [TEST] tasks = test files that MUST be written before corresponding implementation tasks
- [Story] label maps task to specific user story for traceability (US1-US12)
- Each user story split into sub-phases: A (tests first), B (implementation)
- Tests must FAIL before implementation begins (red-green-refactor)
- Tests must PASS after implementation completes (verify with T0XXA tasks)
- Commit test phase before starting implementation phase to enable git history verification per constitution
- Physical devices required for testing biometrics, camera, push notifications
- Use development build (not Expo Go) for native modules like biometrics and push notifications
- Follow quickstart.md for environment setup and development workflow
- Reference research.md for technical decisions and alternatives considered
- Use data-model.md for WatermelonDB schema structure and relationships
- Follow contracts/ for API endpoint specifications and sync protocol
- Performance targets: ≤1s render, ≤2s load, ≤3s sync, ≤300ms transitions per spec.md SC-M01 through SC-M06
- RTL support is mandatory - test all screens in Arabic language mode (verify with T154-T157)
- Offline support is critical - test with network disconnected and verify sync on reconnect (verify with T138-T148)
- **Gusto Design System**: All UI components must follow Gusto patterns from mobile/GUSTO_DESIGN_ANALYSIS.md and reference screenshots in "Gusto Mobile ios Jun 2025" folder - card-based layouts, teal color scheme, Material Design 3 typography, pill-shaped chips, generous spacing

---

## Task Summary

- **Total Tasks**: 255 (173 original implementation + 82 new test tasks)
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 23 tasks (BLOCKS all user stories)
- **Phase 3A (US1 Tests)**: 6 tasks
- **Phase 3B (US1 Implementation)**: 15 tasks (14 original + 1 verify)
- **Phase 4A (US2 Tests)**: 4 tasks
- **Phase 4B (US2 Implementation)**: 12 tasks (11 original + 1 verify)
- **Phase 5A (US3 Tests)**: 5 tasks
- **Phase 5B (US3 Implementation)**: 12 tasks (11 original + 1 verify)
- **Phase 6A (US4 Tests)**: 3 tasks
- **Phase 6B (US4 Implementation)**: 10 tasks (9 original + 1 verify)
- **Phase 7A (US5 Tests)**: 4 tasks
- **Phase 7B (US5 Implementation)**: 11 tasks (10 original + 1 verify)
- **Phase 8A (US6 Tests)**: 5 tasks
- **Phase 8B (US6 Implementation)**: 12 tasks (11 original + 1 verify)
- **Phase 9A (US7 Tests)**: 3 tasks
- **Phase 9B (US7 Implementation)**: 9 tasks (8 original + 1 verify)
- **Phase 10A (US8 Tests)**: 3 tasks
- **Phase 10B (US8 Implementation)**: 8 tasks (7 original + 1 verify)
- **Phase 11A (US9 Tests)**: 3 tasks
- **Phase 11B (US9 Implementation)**: 12 tasks (11 original + 1 verify)
- **Phase 12A (US10 Tests)**: 3 tasks
- **Phase 12B (US10 Implementation)**: 9 tasks (8 original + 1 verify)
- **Phase 13A (US11 Tests)**: 4 tasks
- **Phase 13B (US11 Implementation)**: 10 tasks (9 original + 1 verify)
- **Phase 14A (US12 Tests)**: 7 tasks
- **Phase 14B (US12 Implementation)**: 12 tasks (11 original + 1 verify)
- **Phase 15 (Integration Testing)**: 26 tasks (25 original + 1 new Maestro E2E)

**Suggested MVP Scope (Test-First)**: Phases 1-2 + 3A-3B + 4A-4B + 5A-5B (User Stories 1-3 with tests) = 82 tasks
**Full Feature Scope (20 core routes, Test-First)**: All phases = 255 tasks
**Future Enhancement**: Additional 6 routes (Events, Engagements, Data Library, Reports, Admin, User Management) - estimated +50 tasks (+30 test tasks)

**Test-First Compliance**: ✅ Constitution Principle III satisfied - tests written before implementation for all user stories
**Parallel Opportunities Identified**: 93 tasks marked [P] can run in parallel within their phases (47 original + 46 new test tasks)
**Independent Test Criteria**: Each of 12 user stories has clear test validation (verify fail → verify pass)
**Story Completion Order**: Foundation → US1 Tests→Impl (P1) → US2 Tests→Impl (P1) → US3 Tests→Impl (P1) → US4-US7 Tests→Impl (P2) → US8-US11 Tests→Impl (P3) → US12 Tests→Impl (P2) → Integration Testing
