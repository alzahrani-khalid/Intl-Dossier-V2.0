# Implementation Plan: Complete Mobile Development to Match Web Progress

**Branch**: `020-complete-the-development` | **Date**: 2025-10-12 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-complete-the-development/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Platform Scope**: mobile-only

Implement complete mobile application using Expo/React Native to achieve feature parity with the existing web application. The mobile app provides offline-first architecture for field staff and analysts to submit intake requests, search entities, manage user access, view assignments with SLA tracking, manipulate Kanban boards, and explore entity relationships - all optimized for mobile UX with biometric authentication, camera integration, push notifications, and robust offline sync capabilities.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), React Native 0.81+
**Primary Dependencies**: Expo SDK 52+, React Native Paper 5.12+ (Material Design 3), WatermelonDB 0.28+ (offline-first), React Navigation 7+, TanStack Query v5, i18next (i18n), expo-local-authentication, expo-notifications
**Storage**: WatermelonDB (local SQLite for offline-first), Supabase PostgreSQL 15+ (backend sync), AsyncStorage (settings/preferences)
**Testing**: Jest + React Native Testing Library (unit/component), Maestro (E2E), Detox (alternative E2E)
**Target Platform**: iOS 13+, Android 8.0+ (mobile devices with biometric capability)
**Project Type**: cross-platform (web + mobile)
**Performance Goals**:
  - Initial screen render ≤1s on 4G network (skeleton UI with cached data)
  - Fresh data load ≤2s for interactive content
  - Search typeahead suggestions ≤200ms
  - Kanban drag animations 60fps on mid-tier devices (iPhone 12/Pixel 5)
  - Network graph rendering ≤2s for 30 nodes with smooth gestures
  - Incremental sync ≤5s for typical dataset (50 entities changed)
  - App cold start ≤3s to authenticated home screen

**Constraints**:
  - <200ms p95 API latency (matching web)
  - Dynamic storage limit: max 20% of available device storage (min 200MB absolute)
  - Touch targets ≥44x44px with ≥8px spacing (WCAG mobile)
  - RTL/LTR support for Arabic/English (logical properties only)
  - Offline-capable for all read operations, queued sync for write operations
  - Field-level encryption for confidential+ data using platform secure storage

**Scale/Scope**:
  - 6 primary user stories (Front Door, Search, User Management, Assignments, Kanban, Relationships)
  - 1000+ local entities cached (dossiers, assignments, tickets)
  - 50-screen mobile app with deep linking
  - 95% feature parity with web application
  - 70% field staff adoption target within 30 days

**Platform Scope**: mobile-only

*For mobile-only or cross-platform features, specify:*
- **Mobile Tech Stack**: Expo SDK 52+, React Native 0.81+, TypeScript 5.8+, WatermelonDB 0.28+ (offline-first), React Native Paper 5.12+ (MD3), React Navigation 7+, expo-local-authentication (biometrics), expo-notifications (push), i18next (i18n)
- **Offline Requirements**: Offline-first for data-heavy workflows (dossier CRUD, intake drafts, search index, assignments, Kanban boards, relationship graphs). Online-only for admin operations (dual approval workflows, access review generation).
- **Sync Strategy**: Incremental sync with delta queries (last_modified_since), hybrid conflict resolution (auto-merge non-conflicting fields, user-prompt for conflicts), optimistic locking with _version column, server timestamp authority for tie-breaking, automatic cleanup of synced records >90 days old.
- **Native Features**:
  - Biometric auth (Touch ID/Face ID) for quick re-authentication and confidential data access
  - Camera integration for document scanning with auto-crop, perspective correction, OCR (AR/EN)
  - Push notifications for assignments (new, SLA warning/breach, escalation), intake updates, role changes, Kanban moves
  - Share extension (iOS/Android) for sharing dossiers/tickets to external apps with audit logging
  - Local authentication fallback (device PIN/password) when biometrics unavailable

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [x] **Mobile-First & Responsive**: All React Native components inherently mobile-first, minimum 44x44px touch targets enforced via React Native Paper, proper spacing with 8px+ gaps
- [x] **RTL/LTR Support**: React Native Paper provides automatic RTL support via I18nManager, all components use logical properties (start/end instead of left/right), i18next configured for AR/EN
- [x] **Test-First**: Jest + RNTL unit/component tests, Maestro E2E tests covering all 6 user stories - tests written before implementation per TDD workflow
- [x] **Type Safety**: TypeScript 5.8+ strict mode enforced, explicit types for all WatermelonDB models, React Navigation types, no `any` usage
- [x] **Security by Default**: Existing Supabase RLS policies apply to mobile sync, JWT validation via Supabase client, biometric auth for sensitive operations, field-level encryption using iOS Keychain/Android Keystore
- [x] **Performance**: Incremental sync with indexed queries, local WatermelonDB caching, FlatList virtualization for large lists, 60fps animations, <200ms p95 API latency
- [x] **Accessibility**: React Native accessibility props (accessibilityLabel, accessibilityRole), screen reader support, 4.5:1 color contrast (Material Design 3 theme), keyboard navigation via focus management
- [x] **Cross-Platform Mobile**: Platform scope declared in spec (mobile-only), using Expo SDK 52+ with React Native Paper 5.12+, offline-first via WatermelonDB, hybrid conflict resolution implemented

### Security & Compliance

- [x] **Data Protection**: Mobile app respects backend ClamAV document scanning results, sensitivity levels enforced via RLS during sync, no local virus scanning (deferred to backend)
- [x] **Audit Trail**: All mobile CUD operations sync to backend audit_logs table via Edge Functions, local audit queue for offline changes
- [x] **Authentication**: Supabase Auth with JWT tokens securely stored in platform keychain, biometric re-auth for confidential data access, RBAC enforcement via RLS policies

### Quality Standards

- [x] **Code Organization**: Follows mobile/ directory structure: src/screens/, src/components/, src/navigation/, src/services/, src/database/ (WatermelonDB schema)
- [x] **Naming Conventions**: PascalCase for React Native components (IntakeScreen.tsx), kebab-case for utilities (use-offline-sync.ts), WatermelonDB models in camelCase per convention
- [x] **Code Style**: ESLint + Prettier configured for React Native, react-native-logs for Winston-compatible logging (no console.log), explicit try-catch for async operations
- [x] **Git Workflow**: Conventional commits enforced, PRs ≤300 LOC target, UI changes include iOS/Android screenshots, WatermelonDB schema changes documented in migration files

### Development Workflow

- [x] **Specification**: Feature spec exists at specs/020-complete-the-development/spec.md following spec-template.md structure with platform scope declaration
- [x] **Planning**: This plan.md includes technical context, mobile architecture section, complexity tracking (if needed)
- [x] **Task Organization**: Tasks will be organized by user story (6 stories), exact file paths specified, [P] markers for parallel component development
- [x] **UI Components**: React Native Paper 5.12+ components checked first (Button, TextInput, Card, etc.), expo-vector-icons for iconography, custom builds only if unavailable

**Violations Requiring Justification**: None - all constitution principles are satisfied for mobile-only feature.

## Project Structure

### Documentation (this feature)

```
specs/020-complete-the-development/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── sync-api.yaml    # Incremental sync API contract
│   ├── auth-api.yaml    # Mobile authentication API contract
│   └── notifications-api.yaml  # Push notifications API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Cross-Platform (Web + Mobile) - Mobile components added to existing web application

backend/
├── src/
│   ├── models/          # Existing - shared across platforms
│   ├── services/        # Existing - shared across platforms
│   └── api/             # Existing - shared across platforms
└── tests/               # Existing - backend tests

frontend/
├── src/
│   ├── components/      # Existing - web UI components
│   ├── pages/           # Existing - web pages
│   └── services/        # Existing - web services
└── tests/               # Existing - web tests

mobile/                  # NEW - Mobile application directory
├── src/
│   ├── screens/         # NEW - Mobile screens (IntakeScreen, SearchScreen, KanbanScreen, etc.)
│   │   ├── intake/
│   │   ├── search/
│   │   ├── user-management/
│   │   ├── assignments/
│   │   ├── kanban/
│   │   └── relationships/
│   ├── components/      # NEW - Shared mobile components (IntakeForm, SearchBar, KanbanCard, etc.)
│   │   ├── forms/
│   │   ├── lists/
│   │   ├── cards/
│   │   └── graphs/
│   ├── navigation/      # NEW - React Navigation setup (Stack, Tab, Drawer navigators)
│   │   ├── RootNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   └── AuthStackNavigator.tsx
│   ├── services/        # NEW - Mobile-specific services (sync, notifications, biometrics)
│   │   ├── sync-service.ts
│   │   ├── notification-service.ts
│   │   ├── biometric-service.ts
│   │   ├── camera-service.ts
│   │   └── storage-manager.ts
│   ├── database/        # NEW - WatermelonDB schema for offline-first
│   │   ├── schema/
│   │   │   ├── intake-ticket.ts
│   │   │   ├── dossier.ts
│   │   │   ├── assignment.ts
│   │   │   ├── kanban-card.ts
│   │   │   └── sync-queue.ts
│   │   ├── models/
│   │   └── migrations/
│   ├── hooks/           # NEW - Mobile-specific hooks (useOfflineSync, useBiometric, etc.)
│   ├── i18n/            # NEW - Mobile i18n configuration (AR/EN translations)
│   ├── theme/           # NEW - React Native Paper theme (Material Design 3)
│   └── utils/           # NEW - Mobile utilities (encryption, conflict resolution, etc.)
├── __tests__/           # NEW - Mobile tests
│   ├── unit/            # Jest + RNTL unit tests
│   ├── component/       # Jest + RNTL component tests
│   └── e2e/             # Maestro E2E tests
├── app.json             # NEW - Expo configuration
├── package.json         # NEW - Mobile dependencies
└── tsconfig.json        # NEW - TypeScript config for mobile

supabase/
├── migrations/          # Existing - shared across platforms (may add mobile-specific indices)
└── functions/           # Existing - Edge Functions (may add mobile sync endpoints)
    ├── sync-incremental/  # NEW - Incremental sync Edge Function
    ├── sync-full/         # NEW - Full sync Edge Function
    └── push-notification/ # NEW - Push notification Edge Function
```

**Structure Decision**: Cross-platform architecture with new mobile/ directory added to existing web application structure. Backend and Supabase resources are shared across platforms. Mobile app uses WatermelonDB for offline-first local storage syncing to shared Supabase PostgreSQL backend. Web frontend/ remains unchanged. Mobile-specific Edge Functions added to supabase/functions/ for sync and notifications.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations - constitution check passed completely.

## Mobile Architecture

### Offline-First Strategy
- **Data persistence**:
  - WatermelonDB (local SQLite) for all entity types: intake tickets, dossiers, assignments, Kanban cards, search index, network graph nodes, user profiles
  - AsyncStorage for user preferences, app settings, cached authentication state
  - iOS Keychain / Android Keystore for secure storage of confidential+ classified data (intake tickets with sensitivity ≥ confidential, user credentials, delegation tokens)
  - Local sync queue in WatermelonDB for pending operations (intake submissions, Kanban moves, role changes) awaiting connectivity

- **Sync triggers**:
  - **Manual**: Pull-to-refresh gesture on any list screen (intake queue, assignments, search results, Kanban board)
  - **Auto-foreground**: Automatic sync when app comes to foreground if >5 minutes since last sync
  - **Background**: Background sync every 15 minutes when app backgrounded and connected to WiFi (using Expo background fetch)
  - **Event-driven**: Immediate sync on specific user actions (intake submission, role assignment, Kanban move)
  - **Realtime**: Supabase Realtime subscriptions for Kanban board updates, assignment changes (when online)

- **Conflict resolution**:
  - **Hybrid approach** per constitution:
    - **Auto-merge**: Non-conflicting field updates merged automatically (different fields modified by different users/devices)
    - **User-prompt**: Conflicting changes (same field modified) trigger mobile-friendly resolution dialog showing both versions with accept/reject buttons
  - **Optimistic locking**: _version column incremented on each update, conflicts detected by version mismatch during sync
  - **Server timestamp authority**: In case of tie (same version, simultaneous updates), server's updated_at timestamp wins
  - **Audit trail**: All conflict resolutions logged to audit_logs table with resolution_type (auto-merge|user-selected-local|user-selected-remote)
  - **Cleanup strategy**: Automatically purge synced records >90 days old from mobile storage (except active assignments and recent drafts) to prevent storage bloat

### Native Features Integration
- **Biometrics**:
  - Touch ID / Face ID for quick re-authentication after initial login (15-minute session timeout)
  - Required for viewing confidential+ classified intake tickets (sensitivity ≥ confidential)
  - Required for admin role assignments and permission delegation operations
  - Fallback to device PIN/password when biometrics unavailable or user opts out
  - Configurable in app settings with "Require biometrics for sensitive actions" toggle

- **Camera**:
  - Document scanning via expo-document-scanner with auto-crop and perspective correction for intake attachments
  - OCR text extraction (Arabic and English) using ML Kit or Vision API to auto-populate form fields from scanned documents
  - Photo capture for field evidence attachments with optional GPS metadata (if user grants location permission)
  - Maximum 25MB per file, 100MB total per intake ticket with upload progress indicators
  - Pause/resume capability for large file uploads on unstable connections

- **Push Notifications**:
  - **Assignment notifications**: New assignment, SLA warning (75% elapsed), SLA breach (100%), escalation received
  - **Intake notifications**: Ticket approved/rejected, conversion to artifact complete, duplicate detected
  - **User management notifications**: Role changed, delegation expiring (7 days warning), access review required
  - **Kanban notifications**: Assignment moved to Review/Done (opt-in only via settings)
  - **Notification grouping**: Multiple similar notifications bundled (e.g., "10 new assignments - 3 urgent" with expandable detailed view)
  - **Priority levels**: Urgent (sound + vibration), High (vibration only), Normal (silent) - user-configurable per category
  - **Deep linking**: Tapping notification opens relevant screen with context (assignment detail, intake ticket, user profile)

### Performance Targets
- Initial screen render: ≤1s on 4G network (skeleton UI with cached data from WatermelonDB)
- Fresh data load: ≤2s for interactive content (API call to fetch updated data)
- Search typeahead suggestions: ≤200ms (local search on WatermelonDB index, semantic search deferred for online)
- Kanban drag animations: 60fps on mid-tier devices (iPhone 12 / Pixel 5 baseline)
- Network graph rendering: ≤2s for 30 nodes with smooth pinch/pan/tap gestures at 60fps
- Incremental sync: ≤5s for typical dataset (50 entities changed since last sync with delta queries)
- Full sync: ≤30s for initial data load (all user-accessible entities with pagination)
- App cold start: ≤3s to authenticated home screen on warm device (app recently used)
