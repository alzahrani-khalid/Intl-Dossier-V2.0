# Implementation Plan: Apply Gusto Design System to Mobile App with Full Web Route Parity

**Branch**: `021-apply-gusto-design` | **Date**: 2025-10-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-apply-gusto-design/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Platform Scope**: mobile-only

This feature applies the Gusto Mobile design system to the Intl-Dossier mobile app using React Native Paper 5.12+ (Material Design 3) with a custom teal color palette. It implements bottom tab navigation with 5 primary tabs (Home, Dossiers, Search, Calendar, Profile) and delivers 20 core mobile routes covering primary user workflows (dossiers, assignments, calendar, search, profile, intake, countries/organizations/forums, positions/MOUs, intelligence/monitoring). The design emphasizes card-based layouts, generous spacing, clear typography hierarchy, and comprehensive offline support using WatermelonDB for the last 50 viewed dossiers, 20 assignments, and current month's calendar entries.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)
**Primary Dependencies**:
- Expo SDK 52+ (React Native 0.81+)
- React Native Paper 5.12+ (Material Design 3)
- React Navigation 7+ (bottom tabs, stack navigation)
- WatermelonDB 0.28+ (offline-first local persistence)
- TanStack Query v5 (API state management, caching)
- i18next (internationalization with RTL support)
- expo-local-authentication (biometric auth)
- expo-notifications (push notifications)
- expo-camera (document scanning with OCR)
- @shopify/flash-list (virtualized lists)

**Storage**:
- WatermelonDB 0.28+ (local SQLite for offline-first with 90-day retention)
- Supabase PostgreSQL 15+ (backend persistence)
- Expo SecureStore (encrypted token storage)
- AsyncStorage (user preferences, settings)

**Testing**:
- Jest + React Native Testing Library (unit/component tests)
- Maestro (E2E mobile user journeys)
- Detox (optional - native E2E framework)

**Target Platform**: iOS 14+ and Android 10+ (minimum screen width 375px - iPhone SE)

**Project Type**: Cross-platform (Web + Mobile) - This plan focuses on mobile implementation with backend sync APIs

**Performance Goals**:
- Initial home screen render ≤1s on 4G (skeleton with cached data)
- Fresh dossier list load ≤2s for 100 items
- Incremental sync ≤3s for 50 modified records
- Bottom tab transition ≤300ms (smooth 60fps animation)
- Search results ≤500ms after typing stops (300ms debounce + 200ms query)
- Calendar month view load ≤1s with event indicators
- List scrolling maintains 60fps with FlashList virtualization

**Constraints**:
- Touch targets minimum 44x44px (iOS HIG standard)
- WCAG AA color contrast 4.5:1 minimum
- Offline access to last 50 dossiers, 20 assignments, current month calendar
- Auto-logout after 30 minutes inactivity
- Image uploads compressed to <2MB
- API responses <200ms p95 latency
- Background sync ≤5s for large datasets

**Scale/Scope**:
- 20 core mobile routes (primary workflows, additional 13 routes deferred to future phases)
- 11 key entity types (dossier, assignment, calendar entry, country, organization, forum, position, MOU, intelligence signal, intake ticket, notification)
- 5 bottom tabs (Home, Dossiers, Search, Calendar, Profile)
- 12 prioritized user stories (P1-P3)
- 80 functional requirements across 8 categories
- Support 1000+ dossiers per user with virtualization
- Average user: 20-50 active dossiers, 5-10 assignments/week, 10-20 calendar entries/month

**Platform Scope**: mobile-only

*Mobile-specific details:*
- **Mobile Tech Stack**: Expo SDK 52+, React Native 0.81+, TypeScript 5.8+ strict mode, React Native Paper 5.12+ (Material Design 3), WatermelonDB 0.28+ (offline-first), React Navigation 7+ (tab + stack navigation), TanStack Query v5 (API caching), i18next (RTL support), expo-local-authentication (biometrics), expo-notifications (push), @shopify/flash-list (virtualization)
- **Offline Requirements**: Offline-first for data-heavy workflows - last 50 viewed dossiers, last 20 assignments, current month calendar entries cached in WatermelonDB with TTL-based invalidation (90-day retention). View-only mode when offline (no edits to prevent conflicts). "Offline Mode" banner and "Last synced: [timestamp]" indicators displayed.
- **Sync Strategy**: Incremental sync with last_sync_timestamp parameter and delta queries. Manual sync via pull-to-refresh on Home/Dossiers/Calendar screens. Auto-sync on app foreground if >5 minutes since last sync. Hybrid conflict resolution: automatic merge for non-conflicting field updates, user-prompted resolution dialog for conflicting changes (same field modified). Optimistic locking with _version column. Server timestamp authority for tie-breaking. Full audit trail of conflict resolutions.
- **Native Features**:
  - Biometric authentication (Touch ID/Face ID/Fingerprint) for app unlock and confidential dossier access
  - Camera integration with auto-crop, perspective correction, and OCR (Arabic/English) for document scanning
  - Push notifications with categories: Assignments (immediate), Deadlines (24h before), Intake Requests (immediate), Delegation Expiring (24h before), Dossier Comments (hourly batch)
  - Deep linking for notification taps to relevant detail screens
  - Badge count on app icon for unread notifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [x] **Mobile-First & Responsive**: ✅ All UI components use React Native Paper with mobile-first principles. Base styles for mobile (375px min), progressive enhancement for tablets (future). Touch targets 44x44px minimum (FR-048). Spacing follows 4px base unit (8px, 12px, 16px, 24px, 32px).
- [x] **RTL/LTR Support**: ✅ React Native Paper + i18next provide automatic RTL support. All custom components use logical properties (start/end). Directional icons flip 180° in RTL mode (FR-044). Date/number formatting locale-aware (FR-046, FR-047). Language toggle in Profile settings with immediate UI update (FR-043).
- [x] **Test-First**: ✅ Testing strategy defined: Jest + RNTL for unit/component tests, Maestro for E2E mobile user journeys. Test files will be created before implementation during task generation phase (/speckit.tasks).
- [x] **Type Safety**: ✅ TypeScript 5.8+ strict mode enforced. All components, hooks, and services have explicit types. No `any` usage except wrapped third-party libraries. Null safety with optional chaining (?.) and nullish coalescing (??).
- [x] **Security by Default**: ✅ Supabase Auth with JWT validation (FR-060). Biometric authentication for sensitive operations (FR-061, FR-062). Auth tokens in Expo SecureStore encrypted storage (FR-064). Auto-logout after 30 minutes inactivity (FR-063). Clear cached data on logout (FR-065). RLS policies enforced server-side (existing backend).
- [x] **Performance**: ✅ FlashList virtualization for long lists (FR-054). React.memo for expensive components (FR-055). Debounced search 300ms (FR-056). Lazy-load images with placeholder (FR-057). WatermelonDB caching with TTL invalidation (FR-059). Performance targets: ≤1s render, ≤2s load, ≤3s sync (SC-M01 through SC-M06).
- [x] **Accessibility**: ✅ WCAG AA compliance: 4.5:1 color contrast (FR-052, SC-013), 44x44px touch targets (FR-048, SC-012), accessibility labels/hints for all interactive elements (FR-050, FR-051), VoiceOver/TalkBack support with proper focus management (FR-053), iOS Dynamic Type scaling up to 200% (FR-049).
- [x] **Cross-Platform Mobile**: ✅ Platform scope declared as mobile-only in spec. Mobile tech stack: Expo SDK 52+, React Native 0.81+, WatermelonDB 0.28+, React Native Paper 5.12+. Offline-first for dossiers/assignments/calendar with incremental sync (FR-072 through FR-080). Hybrid conflict resolution per constitution (FR-078). Performance targets met (SC-M01 through SC-M06).

### Security & Compliance

- [x] **Data Protection**: ✅ Document sensitivity levels enforced via backend RLS (existing). Mobile displays "Confidential" badge and requires biometric re-authentication (FR-062). Virus scanning handled server-side (existing ClamAV integration).
- [x] **Audit Trail**: ✅ Audit logging for create/update/delete on core entities handled by backend Edge Functions (existing audit_logs table). Mobile operations queue in WatermelonDB when offline, sync includes audit metadata (user_id, timestamp, action, entity_type, entity_id, old_values, new_values).
- [x] **Authentication**: ✅ Supabase Auth with email/password login (FR-060). JWT validation on all API calls (existing backend middleware). RBAC enforcement server-side (existing RLS policies). Session timeout 30 minutes (FR-063). Optional biometric unlock (FR-061).

### Quality Standards

- [x] **Code Organization**: ✅ Follows mobile structure: mobile/src/screens/, mobile/src/components/, mobile/src/navigation/, mobile/src/services/, mobile/src/database/ (WatermelonDB schema). Tests in mobile/__tests__/ (Jest + RNTL) and mobile/e2e/ (Maestro).
- [x] **Naming Conventions**: ✅ React Native components: PascalCase (e.g., DossierCard.tsx, HomeScreen.tsx). Hooks: kebab-case with use- prefix (e.g., use-dossier.ts, use-offline-sync.ts). Services: kebab-case (e.g., dossier-api.ts, sync-service.ts). Test files: *.test.tsx or *.test.ts.
- [x] **Code Style**: ✅ ESLint + Prettier enforced via lint-staged and Husky (existing). Winston logger for backend (no console.log in production). Explicit try-catch error handling. Comments focus on WHY, not WHAT (self-documenting code).
- [x] **Git Workflow**: ✅ Conventional commits (feat:, fix:, docs:, style:, refactor:, test:, chore:). PRs ≤300 LOC preferred. PRs link to specs/021-apply-gusto-design/. UI changes include screenshots. Schema changes documented in WatermelonDB schema files and Supabase migrations.

### Development Workflow

- [x] **Specification**: ✅ Feature spec exists at specs/021-apply-gusto-design/spec.md following spec-template.md structure. Platform scope declared as mobile-only. 12 user stories prioritized (P1-P3), independently testable. 80 functional requirements, 20 success criteria, all measurable and technology-agnostic.
- [x] **Planning**: ✅ This plan.md includes technical context, constitution check, structure decision, mobile architecture section. Complexity Tracking section (empty - no violations). Phase 0 research.md to follow. Phase 1 data-model.md, contracts/, quickstart.md to follow.
- [x] **Task Organization**: ✅ Tasks will be organized by user story (P1-P3) in tasks.md (/speckit.tasks command - next phase). Exact file paths will be specified. [P] markers for parallelizable tasks. Dependencies explicit. Foundation tasks (navigation setup, theme config, WatermelonDB init) before user story work.
- [x] **UI Components**: ✅ React Native Paper 5.12+ is primary component library (Material Design 3). expo-vector-icons for icons (MaterialCommunityIcons preferred). Custom components only when RN Paper doesn't provide equivalent (e.g., dossier-specific cards, timeline components). All components support offline state indicators and biometric-protected actions.

**Violations Requiring Justification**: None - all constitution principles met

## Project Structure

### Documentation (this feature)

```
specs/021-apply-gusto-design/
├── spec.md              # Feature specification (completed)
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed, all checks passed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (next step - research on Gusto patterns, RN Paper theme customization, WatermelonDB sync strategies)
├── data-model.md        # Phase 1 output (WatermelonDB schema for 11 key entities)
├── quickstart.md        # Phase 1 output (mobile dev environment setup, build/run instructions, testing guide)
└── contracts/           # Phase 1 output (Sync API contracts, Push Notification contracts, Biometric Auth contracts)
    ├── sync-api.md      # Incremental sync endpoint contracts with last_sync_timestamp parameter
    ├── notifications.md # Push notification payload schemas and deep linking contracts
    └── biometric.md     # Biometric authentication flow contracts
```

### Source Code (repository root)

```
# Option 3: Cross-Platform (Web + Mobile)
backend/
├── src/
│   ├── models/          # Existing models (dossier, assignment, etc.)
│   ├── services/        # Existing services + new sync-service.ts
│   └── api/             # Existing Edge Functions + new sync endpoints
│       ├── sync-incremental/    # GET /sync/incremental?last_sync_timestamp=...&entity_types[]=...
│       ├── sync-push/           # POST /sync/push - push local changes to server
│       └── notifications-register-device/  # POST /notifications/register-device - Expo push token registration

frontend/
├── src/
│   ├── components/      # Existing web components
│   ├── pages/           # Existing web pages (33 routes documented for mobile parity)
│   └── services/        # Existing web services

mobile/                  # NEW: Mobile app directory
├── App.tsx              # Root app component with theme provider and navigation container
├── app.json             # Expo configuration
├── package.json         # Mobile-specific dependencies
├── tsconfig.json        # TypeScript config for mobile
├── babel.config.js      # Babel config for Expo
├── metro.config.js      # Metro bundler config
├── src/
│   ├── navigation/      # React Navigation setup
│   │   ├── RootNavigator.tsx        # Root navigation container
│   │   ├── BottomTabNavigator.tsx   # 5 bottom tabs (Home, Dossiers, Search, Calendar, Profile)
│   │   ├── HomeStack.tsx            # Home tab stack navigation
│   │   ├── DossiersStack.tsx        # Dossiers tab stack navigation
│   │   ├── SearchStack.tsx          # Search tab stack navigation
│   │   ├── CalendarStack.tsx        # Calendar tab stack navigation
│   │   ├── ProfileStack.tsx         # Profile tab stack navigation
│   │   └── linking-config.ts        # Deep linking configuration for push notifications
│   ├── screens/         # Screen components (33 routes)
│   │   ├── HomeScreen.tsx           # Dashboard with hero card, recent activity, quick actions
│   │   ├── DossiersListScreen.tsx   # Dossier list with search/filter
│   │   ├── DossierDetailScreen.tsx  # Dossier detail with card sections
│   │   ├── SearchScreen.tsx         # Global search across all entities
│   │   ├── CalendarScreen.tsx       # Calendar month/week/day views
│   │   ├── ProfileScreen.tsx        # User profile, settings, logout
│   │   ├── AssignmentsScreen.tsx    # Assignments queue, escalations
│   │   ├── AssignmentDetailScreen.tsx
│   │   ├── IntakeQueueScreen.tsx    # Intake officer - pending tickets
│   │   ├── IntakeTicketDetailScreen.tsx
│   │   ├── CountriesListScreen.tsx  # Countries list
│   │   ├── CountryDetailScreen.tsx
│   │   ├── OrganizationsListScreen.tsx
│   │   ├── OrganizationDetailScreen.tsx
│   │   ├── ForumsListScreen.tsx
│   │   ├── ForumDetailScreen.tsx
│   │   ├── PositionsListScreen.tsx
│   │   ├── PositionDetailScreen.tsx
│   │   ├── PositionVersionsScreen.tsx
│   │   ├── MoUsListScreen.tsx
│   │   ├── MoUDetailScreen.tsx
│   │   ├── EventsListScreen.tsx
│   │   ├── EventDetailScreen.tsx
│   │   ├── EngagementsListScreen.tsx
│   │   ├── EngagementDetailScreen.tsx
│   │   ├── IntelligenceSignalsScreen.tsx  # Analyst role
│   │   ├── SignalDetailScreen.tsx
│   │   ├── MonitoringDashboardScreen.tsx  # Analyst role
│   │   ├── DataLibraryScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── AdminApprovalsScreen.tsx       # Admin role
│   │   ├── UsersListScreen.tsx            # Admin role
│   │   ├── UserDetailScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base components using React Native Paper
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx             # Base card with Gusto design (12-16px radius, 2-4dp shadow)
│   │   │   ├── DossierCard.tsx      # Specialized card for dossier list items
│   │   │   ├── StatsCard.tsx        # Hero card for dashboard stats
│   │   │   ├── ActionCard.tsx       # Quick action cards with icon + title + description
│   │   │   ├── StatusChip.tsx       # Pill-shaped outlined chip (teal border, no fill)
│   │   │   ├── EmptyState.tsx       # Large icon + headline + description + CTA
│   │   │   ├── Skeleton.tsx         # Placeholder with shimmer effect
│   │   │   ├── BottomSheet.tsx      # Modal bottom sheet for forms/pickers
│   │   │   └── Snackbar.tsx         # Success/error feedback at bottom
│   │   ├── layout/
│   │   │   ├── Screen.tsx           # Base screen with SafeAreaView
│   │   │   ├── Header.tsx           # Screen header with title, back button, action icons
│   │   │   └── OfflineBanner.tsx    # "Offline Mode" banner at top
│   │   └── feedback/
│   │       ├── LoadingOverlay.tsx
│   │       └── PullToRefresh.tsx    # Pull-to-refresh with spinner
│   ├── services/        # API and business logic
│   │   ├── api/         # API client services
│   │   │   ├── dossier-api.ts       # Dossier CRUD endpoints
│   │   │   ├── assignment-api.ts    # Assignment CRUD endpoints
│   │   │   ├── calendar-api.ts      # Calendar CRUD endpoints
│   │   │   ├── country-api.ts
│   │   │   ├── organization-api.ts
│   │   │   ├── forum-api.ts
│   │   │   ├── position-api.ts
│   │   │   ├── mou-api.ts
│   │   │   ├── intelligence-api.ts
│   │   │   ├── intake-api.ts
│   │   │   ├── notification-api.ts
│   │   │   ├── sync-api.ts          # Incremental sync endpoints
│   │   │   └── auth-api.ts          # Supabase Auth wrapper
│   │   ├── sync/
│   │   │   ├── sync-service.ts      # Orchestrates incremental sync
│   │   │   ├── conflict-resolver.ts # Hybrid conflict resolution logic
│   │   │   └── queue-manager.ts     # Offline operation queue
│   │   ├── biometric-service.ts     # expo-local-authentication wrapper
│   │   ├── notification-service.ts  # expo-notifications wrapper
│   │   └── camera-service.ts        # expo-camera wrapper with OCR
│   ├── database/        # WatermelonDB offline-first storage
│   │   ├── schema/
│   │   │   ├── index.ts             # WatermelonDB schema definition
│   │   │   ├── dossier.schema.ts    # Dossier table schema
│   │   │   ├── assignment.schema.ts
│   │   │   ├── calendar-entry.schema.ts
│   │   │   ├── country.schema.ts
│   │   │   ├── organization.schema.ts
│   │   │   ├── forum.schema.ts
│   │   │   ├── position.schema.ts
│   │   │   ├── mou.schema.ts
│   │   │   ├── intelligence-signal.schema.ts
│   │   │   ├── intake-ticket.schema.ts
│   │   │   └── notification.schema.ts
│   │   ├── models/
│   │   │   ├── Dossier.ts           # WatermelonDB model with @field decorators
│   │   │   ├── Assignment.ts
│   │   │   ├── CalendarEntry.ts
│   │   │   ├── Country.ts
│   │   │   ├── Organization.ts
│   │   │   ├── Forum.ts
│   │   │   ├── Position.ts
│   │   │   ├── MOU.ts
│   │   │   ├── IntelligenceSignal.ts
│   │   │   ├── IntakeTicket.ts
│   │   │   └── Notification.ts
│   │   ├── migrations/
│   │   │   └── index.ts             # WatermelonDB migrations
│   │   └── index.ts                 # Database initialization
│   ├── hooks/           # Custom React hooks
│   │   ├── use-dossiers.ts          # TanStack Query hooks for dossier CRUD
│   │   ├── use-assignments.ts
│   │   ├── use-calendar.ts
│   │   ├── use-sync.ts              # Hook for manual sync trigger
│   │   ├── use-offline-status.ts    # Hook for network connectivity detection
│   │   ├── use-biometric.ts         # Hook for biometric authentication
│   │   └── use-notifications.ts     # Hook for push notification setup
│   ├── theme/
│   │   ├── index.ts                 # React Native Paper theme configuration
│   │   ├── colors.ts                # Gusto color palette (primary #1B5B5A, secondary #FF6B35, background #F5F4F2)
│   │   ├── typography.ts            # Material Design 3 typography scale (displayLarge 32pt → bodySmall 13pt)
│   │   └── spacing.ts               # 4px base unit spacing scale (8, 12, 16, 24, 32)
│   ├── i18n/
│   │   ├── index.ts                 # i18next configuration with RTL detection
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── dossiers.json
│   │   │   ├── auth.json
│   │   │   ├── calendar.json
│   │   │   └── errors.json
│   │   └── ar/
│   │       ├── common.json
│   │       ├── dossiers.json
│   │       ├── auth.json
│   │       ├── calendar.json
│   │       └── errors.json
│   ├── utils/
│   │   ├── date-formatter.ts        # Locale-aware date formatting
│   │   ├── number-formatter.ts      # Locale-aware number formatting
│   │   └── validation.ts            # Form validation utilities
│   └── types/
│       ├── navigation.ts            # React Navigation type definitions
│       ├── api.ts                   # API request/response types
│       └── database.ts              # WatermelonDB type extensions
├── __tests__/           # Jest + React Native Testing Library tests
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── hooks/
├── e2e/                 # Maestro E2E tests
│   ├── login.yaml
│   ├── dossier-list.yaml
│   ├── dossier-detail.yaml
│   ├── assignment-update.yaml
│   └── offline-sync.yaml
└── assets/              # Images, fonts, animations
    ├── images/
    ├── fonts/
    └── animations/      # Lottie animations for empty states, loading

supabase/
├── migrations/          # Shared PostgreSQL migrations (existing + new sync-related tables)
│   └── [timestamp]_add_sync_metadata.sql  # Add last_sync_timestamp, _version columns for optimistic locking
└── functions/           # Edge Functions (existing + new sync endpoints)
    ├── sync-incremental/
    │   └── index.ts     # GET /sync/incremental - return delta since last_sync_timestamp
    ├── sync-push/
    │   └── index.ts     # POST /sync/push - accept local changes, detect conflicts, return resolution
    └── notifications-register-device/
        └── index.ts     # POST /notifications/register-device - register Expo push token
```

**Structure Decision**: Option 3 (Cross-Platform Web + Mobile) selected. This plan focuses on implementing the mobile/ directory with full route parity to the 33 existing web routes in frontend/src/pages/. Backend Edge Functions will be extended with new sync endpoints (sync-incremental/, sync-push/, notifications-register-device/) to support mobile offline-first architecture. Supabase migrations will add sync metadata (_version, last_sync_timestamp) for optimistic locking and conflict detection. Mobile app uses WatermelonDB for local persistence of 11 key entities (dossier, assignment, calendar entry, country, organization, forum, position, MOU, intelligence signal, intake ticket, notification) with 90-day retention and TTL-based invalidation.

## Complexity Tracking

*No constitution violations - this section is empty*

## Mobile Architecture

### Offline-First Strategy

**Data persistence**:
- **WatermelonDB** for core entities requiring offline access:
  - Dossiers: Last 50 viewed dossiers with full details (title, description, status, related countries/organizations, relationships, timeline events, confidentiality level)
  - Assignments: Last 20 assignments with task details (title, description, status, due date, priority, related dossier, escalation flag)
  - Calendar Entries: Current month's calendar entries (title, type, date, time, notes, related entities, attendees)
  - Reference entities (cached for 90 days): Countries, Organizations, Forums (name, logo, metadata)
  - Intelligence Signals (for analyst role): Last 30 days of signals (description, source, priority, related entities, analyst notes)
  - Intake Tickets (for intake officer role): Last 30 days of tickets (type, requester info, submission date, priority, status, notes)
  - Notifications: Last 100 notifications (title, body, category, timestamp, read status, related entity reference for deep linking)
- **AsyncStorage** for user preferences: language preference (en/ar), biometric enabled flag, notification preferences per category, last sync timestamp
- **Expo SecureStore** for sensitive data: JWT auth token, refresh token, biometric authentication keys

**Sync triggers**:
1. **Manual sync**: Pull-to-refresh gesture on Home, Dossiers, and Calendar screens (FR-080)
2. **Auto-sync on foreground**: When app returns to foreground, check if >5 minutes since last sync, trigger incremental sync (FR-079)
3. **Background sync**: Optional background task (iOS BackgroundFetch, Android JobScheduler) every 30 minutes when app is closed (future enhancement - not in MVP)

**Conflict resolution** (per constitution - hybrid approach):
1. **Non-conflicting field updates**: Automatic merge - if user A updates field X on web and user B updates field Y on mobile, both changes apply (last-write-wins per field)
2. **Conflicting field updates**: User-prompted resolution - if both users modify the same field (e.g., dossier title), sync detects conflict via _version column mismatch, presents modal with 3 options:
   - "Keep mobile changes" - discard server version, apply local changes
   - "Use web version" - discard local changes, accept server version
   - "View side-by-side" - show diff with option to manually merge
3. **Optimistic locking**: All entities have _version column (integer), incremented on each update. Sync endpoint checks if local _version matches server _version. If mismatch, conflict detected.
4. **Server timestamp authority**: Server's updated_at timestamp is authoritative for tie-breaking when _version matches but timestamps differ (clock skew scenarios)
5. **Full audit trail**: All conflict resolutions logged to audit_logs table (user_id, timestamp, action='conflict_resolved', entity_type, entity_id, resolution_choice, local_values, server_values, merged_values)

**Cleanup strategy**:
- WatermelonDB records older than 90 days purged on app foreground (daily cleanup check)
- Synced records marked with synced_at timestamp; records with synced_at < (now - 90 days) deleted from local DB
- Notifications older than 30 days purged automatically
- User can manually "Clear cache" in Profile > Settings to delete all local data except auth token

### Native Features Integration

**Biometrics** (Touch ID/Face ID/Fingerprint):
- **App unlock**: After initial email/password login, user can enable biometric unlock in Profile > Settings. On subsequent app launches, biometric prompt appears before showing home screen. Fallback to password if biometric fails 3 times or is unavailable (FR-061).
- **Confidential dossiers**: Dossiers with confidentiality_level='confidential' or 'secret' require biometric re-authentication before viewing detail screen. If biometric fails, user must re-enter password (FR-062).
- **Implementation**: expo-local-authentication library. Check device support with hasHardwareAsync(). Authenticate with authenticateAsync({ promptMessage: "Unlock Intl-Dossier" }). Store biometric_enabled flag in AsyncStorage.

**Camera** (document scanning):
- **Document scanning**: When uploading attachment to dossier or intake ticket, user can tap "Scan Document" to launch camera with auto-crop and perspective correction for clean image capture. Image is uploaded to server as attachment.
- **Photo capture**: User can update profile avatar by tapping avatar in Profile screen, selecting "Take Photo" to launch camera.
- **Implementation**: expo-camera library for camera access. expo-image-manipulator for auto-crop/perspective correction. expo-document-picker as fallback for file selection.
- **Future enhancement**: OCR text extraction (Arabic and English) using Tesseract.js or cloud OCR service (Google Cloud Vision API, Azure Computer Vision) will be added in subsequent phase to enable searchable document text.

**Push Notifications**:
- **Categories** (FR-069):
  - **Assignments** (immediate): "New assignment: [title]" - user taps to open AssignmentDetailScreen
  - **Deadlines** (24h before): "Reminder: [assignment] due tomorrow" - user taps to open AssignmentDetailScreen
  - **Intake Requests** (immediate, intake officer role): "New intake ticket: [type]" - user taps to open IntakeTicketDetailScreen
  - **Delegation Expiring** (24h before): "Your delegation expires tomorrow" - user taps to open ProfileScreen (delegations section)
  - **Dossier Comments** (hourly batch): "5 new comments on followed dossiers" - user taps to open DossiersListScreen with filter
- **Customization** (FR-070): User can toggle each category on/off in Profile > Notifications settings. Preferences stored in AsyncStorage and synced to backend user_notification_preferences table.
- **Deep linking** (FR-071): Push notification payload includes deep link URL (e.g., intldossier://assignment/123). React Navigation linking configuration maps URLs to screens. When user taps notification, app opens and navigates to relevant screen.
- **Badge count** (FR-068): Badge count on app icon shows unread notification count. Updated when notification received or when user marks notification as read.
- **Implementation**: expo-notifications library. Request permission with requestPermissionsAsync(). Register device token with getExpoPushTokenAsync(), send to backend via POST /notifications/register-device. Listen for notifications with addNotificationReceivedListener() (app foreground) and addNotificationResponseReceivedListener() (user taps notification). Update badge with setBadgeCountAsync().

### Performance Targets

- **Initial screen render**: ≤1s (skeleton UI with cached data) - Measured from app launch to interactive home screen hero card (SC-M01)
- **Fresh data load**: ≤2s for 100 dossiers on 4G network - Measured from screen mount to list fully rendered (SC-M02)
- **Incremental sync**: ≤3s for typical daily changes (50 modified records) - Measured from sync trigger to completion (SC-M03)
- **Bottom tab navigation**: ≤300ms transition - Measured from tab tap to screen interactive (SC-M04, smooth 60fps animation)
- **Search results**: ≤500ms after user stops typing (300ms debounce + 200ms query execution) - Measured from last keystroke to results displayed (SC-M05)
- **Calendar month view**: ≤1s with all event indicators visible - Measured from screen mount to calendar fully rendered with dots (SC-M06)
- **List scrolling**: 60fps with FlashList virtualization for 1000+ items (FR-054, SC-007)
- **Image loading**: Lazy-load with placeholder, smooth fade-in animation (FR-057)
- **Background sync**: ≤5s for large datasets (future enhancement - not in MVP)
