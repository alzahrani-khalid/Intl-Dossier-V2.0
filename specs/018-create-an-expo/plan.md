# Implementation Plan: Mobile Application for GASTAT International Dossier System

**Branch**: `018-create-an-expo` | **Date**: 2025-10-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-create-an-expo/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create an Expo-based mobile application providing field staff and analysts with offline-capable access to dossiers, briefs, and intake requests. The app connects to the existing Supabase backend (zkrcjzdemdmwhearhfgg.supabase.co), supports biometric authentication, implements offline-first data sync, and provides bilingual Arabic/English interfaces with proper RTL support. The technical approach uses Expo SDK 52+ with React Native 0.81+, WatermelonDB for offline storage, and React Navigation for bottom tab navigation across Dossiers, Briefs, and Profile screens.

## Technical Context

**Language/Version**: TypeScript 5.8+, React Native 0.81+ (via Expo SDK 52+), Node.js 20 LTS
**Primary Dependencies**: Expo SDK 52+, @supabase/supabase-js 2.58+, WatermelonDB 0.28+, React Navigation 7+, expo-local-authentication (biometrics), expo-notifications (push), i18next (internationalization)
**Storage**: WatermelonDB (local SQLite) for offline cache, Supabase PostgreSQL 17 (existing backend)
**Testing**: Jest for unit tests, Detox for E2E mobile testing, Expo Go for manual testing
**Target Platform**: iOS 13+, Android 8.0+ (Expo managed workflow, OTA updates via EAS Update)
**Project Type**: mobile - New mobile/ directory at repository root
**Performance Goals**: <3s offline data access, <10s authentication, <5min full sync on 4G for 100 dossiers, <1s UI navigation
**Constraints**: <500MB offline storage for 50 dossiers, 99.5% crash-free rate, offline-first with 7-day offline capability, 95% push notification delivery within 30s
**Scale/Scope**: ~50 users initially (field staff + analysts), ~1000 dossiers total, 20 dossiers + assignments cached offline per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [x] **Mobile-First & Responsive**: ✅ Mobile app is inherently mobile-first. All components will use Expo/React Native responsive patterns with proper screen size handling via Dimensions API and responsive StyleSheet
- [x] **RTL/LTR Support**: ✅ i18next for language switching, React Native's I18nManager for RTL detection, all layout using start/end instead of left/right, directional icon flipping via transforms
- [x] **Test-First**: ✅ Jest + React Native Testing Library for unit/integration tests, Maestro for E2E tests (see research.md for rationale)
- [x] **Type Safety**: ✅ TypeScript strict mode enabled, explicit types for all components, props, hooks, and API responses
- [x] **Security by Default**: ✅ Supabase Auth with JWT, secure token storage via expo-secure-store, RLS policies already exist on backend, API rate limiting handled by Supabase
- [x] **Performance**: ✅ WatermelonDB uses lazy loading and optimistic UI, React Navigation lazy loads screens, FlatList virtualization for long lists, incremental sync strategy
- [x] **Accessibility**: ✅ Manual testing with VoiceOver/TalkBack + React Native AMA for runtime checks, all interactive elements have accessibility props (label, role, hint, state), 44x44px touch targets, 4.5:1 color contrast (see research.md)

### Security & Compliance

- [x] **Data Protection**: ✅ Document scanning handled by backend (ClamAV), mobile app respects existing RLS policies for sensitivity levels
- [x] **Audit Trail**: ✅ Audit logging handled by backend, mobile app reads audit logs but doesn't create them (read-only app)
- [x] **Authentication**: ✅ Supabase Auth integration, biometric authentication via expo-local-authentication, 30-minute session timeout with refresh token rotation

### Quality Standards

- [x] **Code Organization**: ✅ Mobile app follows Expo conventions: `mobile/app/` (screens), `mobile/components/` (UI), `mobile/services/` (business logic), `mobile/database/` (WatermelonDB models)
- [x] **Naming Conventions**: ✅ PascalCase for components (DossierCard.tsx), camelCase for utilities (useDossierSync.ts), .test.tsx for tests
- [x] **Code Style**: ✅ ESLint + Prettier with Expo preset, Winston logger replaced by expo-dev-client console (dev) + Sentry (prod), explicit error handling with try-catch
- [x] **Git Workflow**: ✅ Conventional commits, separate mobile/ directory, PRs include screenshots/videos for UI changes

### Development Workflow

- [x] **Specification**: ✅ Feature has spec in specs/018-create-an-expo/ following spec-template.md
- [x] **Planning**: ✅ This plan includes technical context, structure decision, constitution compliance check
- [x] **Task Organization**: ✅ Tasks will be organized by user story (P1: Auth, P1: Offline Dossiers, P2: Notifications, etc.), exact file paths, [P] markers for parallelizable tasks
- [x] **UI Components**: ✅ React Native Paper 5.12+ (Material Design 3) for built-in RTL support, WCAG AA compliance, and Expo compatibility (see research.md for rationale)

**Violations Requiring Justification**: None - All core principles can be satisfied with Expo + React Native architecture

## Project Structure

### Documentation (this feature)

```
specs/018-create-an-expo/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
mobile/                          # New Expo app directory
├── app/                         # Expo Router file-based routing
│   ├── (auth)/                  # Auth-gated routes
│   │   ├── (tabs)/              # Bottom tab navigator
│   │   │   ├── dossiers/        # Dossiers tab screens
│   │   │   │   ├── index.tsx    # Dossier list
│   │   │   │   └── [id].tsx     # Dossier details
│   │   │   ├── briefs/          # Briefs tab screens
│   │   │   │   ├── index.tsx    # Brief list
│   │   │   │   └── [id].tsx     # Brief details
│   │   │   └── profile/         # Profile tab screens
│   │   │       └── index.tsx    # Profile + settings
│   │   └── _layout.tsx          # Auth layout
│   ├── login.tsx                # Login screen (unauth)
│   └── _layout.tsx              # Root layout
│
├── components/                  # Reusable UI components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── dossiers/               # Dossier-specific components
│   │   ├── DossierCard.tsx
│   │   ├── DossierFilters.tsx
│   │   └── DossierDetails.tsx
│   ├── briefs/                 # Brief-specific components
│   │   ├── BriefCard.tsx
│   │   └── BriefContent.tsx
│   └── shared/                 # Shared components
│       ├── SyncIndicator.tsx
│       ├── OfflineBanner.tsx
│       └── BiometricPrompt.tsx
│
├── services/                    # Business logic services
│   ├── auth/                    # Authentication service
│   │   ├── AuthService.ts       # Supabase Auth + biometrics
│   │   └── TokenStorage.ts      # Secure token storage
│   ├── sync/                    # Sync service
│   │   ├── SyncService.ts       # Orchestrates sync operations
│   │   ├── SyncQueue.ts         # Manages sync queue
│   │   └── SyncStrategy.ts      # Incremental sync logic
│   ├── notifications/           # Push notification service
│   │   └── NotificationService.ts
│   └── api/                     # API client
│       └── SupabaseClient.ts    # Supabase client wrapper
│
├── database/                    # WatermelonDB local database
│   ├── models/                  # WatermelonDB models
│   │   ├── Dossier.ts
│   │   ├── Country.ts
│   │   ├── Organization.ts
│   │   ├── Position.ts
│   │   ├── Brief.ts
│   │   ├── IntakeRequest.ts
│   │   └── Document.ts
│   ├── schema.ts                # WatermelonDB schema definition
│   └── sync.ts                  # Sync adapters for Watermelon
│
├── hooks/                       # Custom React hooks
│   ├── useDossiers.ts           # Dossier data hook
│   ├── useBriefs.ts             # Brief data hook
│   ├── useAuth.ts               # Auth state hook
│   ├── useSync.ts               # Sync status hook
│   ├── useNetworkStatus.ts      # Network connectivity hook
│   └── useLanguage.ts           # i18n language hook
│
├── i18n/                        # Internationalization
│   ├── index.ts                 # i18next configuration
│   ├── en/                      # English translations
│   │   ├── common.json
│   │   ├── dossiers.json
│   │   └── briefs.json
│   └── ar/                      # Arabic translations
│       ├── common.json
│       ├── dossiers.json
│       └── briefs.json
│
├── types/                       # TypeScript type definitions
│   ├── entities.ts              # Entity types (Dossier, Brief, etc.)
│   ├── api.ts                   # API request/response types
│   └── navigation.ts            # Navigation types
│
├── utils/                       # Utility functions
│   ├── formatters.ts            # Date/number formatters
│   ├── validators.ts            # Input validators
│   └── rtl.ts                   # RTL helper functions
│
├── tests/                       # Test files
│   ├── unit/                    # Unit tests (Jest)
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests (Detox)
│
├── app.json                     # Expo configuration
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env.example                 # Environment variables template
└── README.md
```

**Structure Decision**: Selected **Option 3: Mobile + API** structure. The mobile app resides in a new `mobile/` directory at repository root, separate from existing `backend/` and `frontend/` web application directories. This isolation allows independent mobile development cycles, separate deployment via EAS Build/Update, and avoids conflicts with web dependencies. The mobile app connects to the same Supabase backend (shared database) but has its own Expo-specific build configuration, testing setup, and deployment pipeline.

## Complexity Tracking

*No violations requiring justification. All constitution principles can be satisfied within Expo/React Native constraints.*
