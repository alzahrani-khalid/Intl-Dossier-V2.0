# Research: Complete Mobile Development to Match Web Progress

**Feature**: 020-complete-the-development | **Date**: 2025-10-12

## Overview

This research document consolidates technology choices, architectural decisions, and best practices for implementing the complete mobile application using Expo/React Native to achieve feature parity with the existing web application.

## Technology Stack Decisions

### 1. Expo SDK 52+ vs React Native CLI

**Decision**: Use Expo SDK 52+ (managed workflow)

**Rationale**:
- **Simplified development**: Expo provides pre-configured setup with common native modules (camera, notifications, biometrics, local authentication)
- **OTA updates**: Expo's over-the-air update capability allows rapid bug fixes and feature rollouts without app store delays
- **Consistent API surface**: Expo SDK abstracts platform differences (iOS/Android) with unified APIs for native features
- **Development velocity**: Expo Go app enables instant testing on physical devices without native builds
- **Enterprise features**: Expo Application Services (EAS) provides managed builds, submissions, and updates

**Alternatives Considered**:
- **React Native CLI (bare workflow)**: Rejected due to increased complexity for native module integration, longer setup time, and need for iOS/Android native development expertise. Expo SDK 52+ now supports all required native features (biometrics, camera, notifications) without ejecting.

**References**:
- Expo SDK 52 documentation: https://docs.expo.dev/
- Expo vs React Native CLI comparison: https://docs.expo.dev/faq/#expo-vs-react-native-cli

---

### 2. WatermelonDB 0.28+ for Offline-First Architecture

**Decision**: Use WatermelonDB 0.28+ for local database with offline-first sync

**Rationale**:
- **Performance**: Built on SQLite, optimized for React Native with lazy loading and query batching for 1000+ entity collections
- **Sync protocol**: Built-in sync adapter with incremental updates, conflict resolution, and optimistic locking via _status and _version columns
- **Reactive queries**: Observable queries automatically update UI when local data changes (similar to TanStack Query for web)
- **TypeScript support**: Full type safety with decorators for model definitions and relations
- **Offline-first**: Designed for mobile-first workflows where local database is source of truth, syncing to backend when online

**Alternatives Considered**:
- **AsyncStorage**: Rejected due to key-value limitation (no relational data), poor performance for large datasets, no query capabilities
- **Realm 12+**: Rejected due to MongoDB lock-in (Atlas Device Sync required), higher complexity, larger bundle size (~2MB vs WatermelonDB ~200KB)
- **SQLite + TypeORM**: Rejected due to lack of built-in sync adapter, manual conflict resolution implementation needed

**Implementation Notes**:
- WatermelonDB schema must mirror Supabase PostgreSQL schema with additional sync metadata (_status, _version, _synced_at)
- Use `@date('synced_at')` decorator for tracking last sync timestamp per record
- Implement custom sync adapter connecting to Supabase Edge Functions for incremental sync

**References**:
- WatermelonDB documentation: https://watermelondb.dev/
- WatermelonDB sync protocol: https://watermelondb.dev/Advanced/Sync.html

---

### 3. React Native Paper 5.12+ (Material Design 3)

**Decision**: Use React Native Paper 5.12+ for UI component library

**Rationale**:
- **Material Design 3 compliance**: Latest MD3 theming with dynamic colors, improved accessibility, RTL support out-of-box
- **RTL support**: Automatic RTL layout via I18nManager integration, no manual logical properties needed (library handles start/end positioning)
- **Component coverage**: 40+ components (Button, TextInput, Card, List, Dialog, Menu, Snackbar) covering all mobile UI needs
- **Theme consistency**: Centralized theming with color schemes (light/dark), typography, and spacing scales matching web design tokens
- **Accessibility**: Built-in accessibility props (accessibilityLabel, accessibilityRole) on all components, WCAG AA compliant

**Alternatives Considered**:
- **React Native Elements**: Rejected due to outdated design patterns, limited Material Design 3 support, requires manual RTL implementation
- **NativeBase 3.x**: Rejected due to larger bundle size, opinionated Chakra UI-like API (less familiar for Material Design developers)
- **Custom components**: Rejected to avoid reinventing UI components, slower development, accessibility implementation burden

**Implementation Notes**:
- Configure `MD3LightTheme` and `MD3DarkTheme` with GASTAT brand colors (primary, secondary, tertiary)
- Use `PaperProvider` at app root with dynamic theme switching (light/dark mode)
- Leverage `useTheme()` hook for accessing theme tokens in custom components

**References**:
- React Native Paper documentation: https://callstack.github.io/react-native-paper/
- Material Design 3 guidelines: https://m3.material.io/

---

### 4. React Navigation 7+ for Navigation

**Decision**: Use React Navigation 7+ for navigation stack

**Rationale**:
- **Stack, tab, drawer navigators**: Comprehensive navigation patterns (stack for hierarchical screens, tabs for primary sections, drawer for settings)
- **Deep linking**: Built-in deep linking configuration for push notification navigation to specific screens with params
- **Type safety**: Full TypeScript support with typed navigation params and screen props
- **Gesture handling**: Smooth iOS-style swipe-back, Android back button handling, tab bar animations
- **Integration**: Works seamlessly with React Native Paper (shared theme provider), Expo Router (file-based routing alternative)

**Alternatives Considered**:
- **Expo Router**: Rejected for now due to file-based routing being less intuitive for complex navigation hierarchies, newer API surface
- **React Native Navigation (Wix)**: Rejected due to native bridge complexity, harder to customize, limited community compared to React Navigation

**Implementation Notes**:
- Use `createStackNavigator()` for main navigation flow (Auth → Main → Screen details)
- Use `createBottomTabNavigator()` for primary sections (Intake, Search, Assignments, Profile)
- Configure deep linking for notification navigation: `intldossier://assignment/:id`, `intldossier://intake/:ticketId`

**References**:
- React Navigation 7 documentation: https://reactnavigation.org/
- Deep linking guide: https://reactnavigation.org/docs/deep-linking/

---

### 5. Biometric Authentication Strategy

**Decision**: Use `expo-local-authentication` for biometric auth

**Rationale**:
- **Cross-platform**: Unified API for iOS (Touch ID/Face ID) and Android (Biometric Prompt, Fingerprint)
- **Security levels**: Supports device credential fallback (PIN/password) when biometrics unavailable
- **Supabase integration**: Store encrypted refresh token in secure storage (iOS Keychain/Android Keystore), use biometric auth to decrypt for session refresh
- **User opt-in**: Biometric auth is optional enhancement, not blocking authentication flow

**Implementation Approach**:
1. **Initial login**: User authenticates with email/password via Supabase Auth, receives JWT access token + refresh token
2. **Secure storage**: Encrypt refresh token using platform secure storage (expo-secure-store wrapping iOS Keychain/Android Keystore)
3. **Biometric setup**: Prompt user to enable biometric auth after first login, store encrypted token mapped to biometric identity
4. **Quick re-auth**: On subsequent app opens, prompt biometric auth to decrypt refresh token, exchange for new access token without password entry
5. **Sensitive operations**: Require biometric re-auth before viewing confidential+ intake tickets, performing admin role assignments

**Security Considerations**:
- Refresh token encryption key derived from platform-specific hardware-backed keystore (cannot be exported)
- Session timeout: 15 minutes inactivity triggers re-auth (biometric or password)
- Revocation: If user changes device biometric setup (adds/removes fingerprint), invalidate stored refresh token, force full re-login

**References**:
- expo-local-authentication: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- expo-secure-store: https://docs.expo.dev/versions/latest/sdk/securestore/

---

### 6. Push Notifications Architecture

**Decision**: Use `expo-notifications` with Firebase Cloud Messaging (FCM) / Apple Push Notification Service (APNS)

**Rationale**:
- **Unified API**: expo-notifications abstracts FCM (Android) and APNS (iOS) with single API surface
- **Background handling**: Supports background notification handling, badge counts, notification grouping
- **Deep linking integration**: Configure notification taps to navigate to specific screens via React Navigation deep links
- **Supabase Edge Functions**: Backend triggers notifications via Supabase Edge Functions calling FCM/APNS HTTP APIs

**Implementation Approach**:
1. **Device token registration**: On app install, request notification permissions, obtain device token (FCM for Android, APNS for iOS)
2. **Token storage**: Send device token to backend, store in `user_device_tokens` table with user_id, platform, token, updated_at
3. **Notification triggers**: Backend Edge Functions (assignment-created, SLA-warning, role-changed) query user_device_tokens, send notifications via FCM/APNS HTTP APIs
4. **Foreground handling**: When app in foreground, display in-app toast notification instead of system notification
5. **Background/killed**: System notification displayed, tap opens app via deep link to relevant screen
6. **Notification grouping**: Use `collapseId` (Android) and `thread-id` (iOS) to group similar notifications (e.g., "10 new assignments")

**Notification Categories**:
- **Assignments**: New assignment, SLA warning (75%), SLA breach (100%), escalation received
- **Intake**: Ticket approved/rejected, conversion complete, duplicate detected
- **User Management**: Role changed, delegation expiring (7 days), access review required
- **Kanban**: Assignment moved to Review/Done (opt-in only)

**References**:
- expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- FCM HTTP v1 API: https://firebase.google.com/docs/cloud-messaging/http-server-ref
- APNS API: https://developer.apple.com/documentation/usernotifications

---

### 7. Camera & Document Scanning

**Decision**: Use `expo-document-scanner` + `expo-camera` with OCR via ML Kit (Android) / Vision (iOS)

**Rationale**:
- **Document scanning**: expo-document-scanner provides auto-crop, perspective correction, edge detection for intake attachments
- **OCR integration**: ML Kit (Android) and Vision (iOS) for text extraction from scanned documents (Arabic and English)
- **Photo capture**: expo-camera for field evidence attachments with EXIF metadata (GPS location if permitted)
- **Performance**: Native SDKs (ML Kit/Vision) provide on-device OCR without backend API latency

**Implementation Approach**:
1. **Document scanning**: Use `expo-document-scanner` to scan intake documents, returns image URI with auto-cropped perspective
2. **OCR extraction**: Pass scanned image to platform-specific OCR:
   - Android: ML Kit Text Recognition API for Arabic/English
   - iOS: Vision VNRecognizeTextRequest for Arabic/English
3. **Form auto-fill**: Extract key-value pairs from OCR text (e.g., "Country: Saudi Arabia" → populate country field in intake form)
4. **Photo capture**: Use `expo-camera` for quick photo attachments with `type={CameraType.back}`, save to local cache, upload to Supabase Storage on submit
5. **Upload handling**: Maximum 25MB per file, 100MB total per ticket, display progress indicator with pause/resume for large uploads

**Security Considerations**:
- Request camera permission via `expo-camera` permissions API with clear explanation: "Camera access needed to scan documents and capture field evidence"
- OCR processing occurs on-device, no text sent to external APIs
- Uploaded documents stored in Supabase Storage with sensitivity-based access control (RLS policies)

**References**:
- expo-document-scanner: https://docs.expo.dev/versions/latest/sdk/document-scanner/
- expo-camera: https://docs.expo.dev/versions/latest/sdk/camera/
- ML Kit Text Recognition: https://developers.google.com/ml-kit/vision/text-recognition
- Apple Vision: https://developer.apple.com/documentation/vision/recognizing_text_in_images

---

### 8. Incremental Sync Strategy

**Decision**: Delta sync with `last_modified_since` timestamp + optimistic locking via `_version` column

**Rationale**:
- **Bandwidth efficiency**: Only fetch entities changed since last sync, reducing mobile data usage for 50-entity typical sync (<500KB vs 5MB+ full sync)
- **Conflict detection**: `_version` column incremented on each update, conflicts detected when mobile version ≠ server version
- **Hybrid resolution**: Auto-merge non-conflicting field updates, user-prompt for conflicting changes (same field modified)
- **Audit trail**: All sync operations and conflict resolutions logged to audit_logs table

**Sync Protocol**:
1. **Initial sync** (first app launch):
   - Full sync: Fetch all user-accessible entities (dossiers, assignments, intake tickets, etc.) in batches of 100
   - Store in WatermelonDB with `_synced_at = current_timestamp`, `_status = 'synced'`
   - Track last sync timestamp in AsyncStorage: `last_full_sync_at`

2. **Incremental sync** (subsequent syncs):
   - Send `last_sync_timestamp` to backend Edge Function `sync-incremental`
   - Backend queries: `SELECT * FROM entities WHERE updated_at > $last_sync_timestamp`
   - Returns delta: {created: [...], updated: [...], deleted: [...]}
   - Merge into WatermelonDB:
     - Created: Insert new records
     - Updated: Check `_version` for conflicts, auto-merge or prompt user
     - Deleted: Mark as deleted locally (soft delete for audit trail)

3. **Push local changes**:
   - Query WatermelonDB for records with `_status IN ('created', 'updated', 'deleted')`
   - Send batch to backend `sync-push` Edge Function
   - Backend validates, applies to PostgreSQL, returns server `_version` and `updated_at`
   - Update local records with server metadata, mark `_status = 'synced'`

4. **Conflict resolution**:
   - If `local._version ≠ server._version`: Conflict detected
   - Compare field-by-field:
     - Different fields modified: Auto-merge (combine changes)
     - Same field modified: Show conflict dialog with local vs server values, user selects
   - Apply resolution, increment `_version`, log to audit_logs with `resolution_type`

**Cleanup Strategy**:
- Purge synced records >90 days old: `DELETE FROM local_table WHERE _status = 'synced' AND _synced_at < now() - INTERVAL '90 days' AND id NOT IN (SELECT entity_id FROM active_assignments)`
- Preserve active assignments and recent drafts (last 7 days) from cleanup

**References**:
- WatermelonDB Sync: https://watermelondb.dev/Advanced/Sync.html
- Optimistic locking patterns: https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html

---

### 9. Performance Optimization Strategies

**Decision**: FlatList virtualization + Memoization + Image lazy loading + Bundle splitting

**Rationale**:
- **FlatList virtualization**: Render only visible items for large lists (assignments, search results, Kanban cards), recycle views for 1000+ items with <50ms scroll lag
- **React.memo + useMemo**: Memoize expensive components (network graph, timeline) and calculations (SLA countdown timers)
- **Image optimization**: Use `expo-image` with caching, lazy loading, blurhash placeholders for document thumbnails
- **Bundle splitting**: Code-split screens with React.lazy(), reduce initial bundle size from ~5MB to ~2MB, load screens on-demand

**Performance Targets**:
- Initial screen render: ≤1s (skeleton UI with cached data from WatermelonDB)
- Fresh data load: ≤2s (API call + UI update)
- Search typeahead: ≤200ms (local WatermelonDB query with indexed search)
- Kanban drag: 60fps on iPhone 12/Pixel 5 (use `useNativeDriver: true` for animations)
- Network graph: ≤2s for 30 nodes with react-native-svg + d3-force layout

**Implementation Checklist**:
- [ ] Use `FlatList` with `windowSize={10}` for all lists (assignments, search results, intake queue)
- [ ] Memoize `KanbanCard`, `AssignmentCard`, `SearchResultItem` with React.memo()
- [ ] Use `useMemo()` for SLA countdown calculations: `const timeRemaining = useMemo(() => calculateSLA(assignment), [assignment.sla_deadline])`
- [ ] Implement `expo-image` with `cachePolicy="memory-disk"` for document thumbnails
- [ ] Code-split screens: `const KanbanScreen = lazy(() => import('./screens/kanban/KanbanScreen'))`
- [ ] Use `InteractionManager.runAfterInteractions()` for non-critical data loading (analytics, background sync)

**References**:
- React Native Performance: https://reactnative.dev/docs/performance
- FlatList optimization: https://reactnative.dev/docs/optimizing-flatlist-configuration
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/

---

### 10. Testing Strategy

**Decision**: Jest + RNTL (unit/component) + Maestro (E2E)

**Rationale**:
- **Jest**: Standard for React Native unit tests, mocking WatermelonDB models, testing sync logic
- **React Native Testing Library (RNTL)**: Component testing with user interaction simulation (press, swipe, input)
- **Maestro**: Declarative E2E testing for mobile flows (login, intake submission, Kanban drag), simpler than Detox, no native build required

**Test Coverage Targets**:
- Unit tests: ≥80% coverage for services (sync-service, biometric-service, notification-service)
- Component tests: ≥70% coverage for screens (IntakeScreen, SearchScreen, KanbanScreen)
- E2E tests: Cover all 6 user stories (Front Door, Search, User Management, Assignments, Kanban, Relationships)

**Testing Approach**:
1. **Unit tests** (Jest):
   - Mock WatermelonDB: `jest.mock('@nozbe/watermelondb')`
   - Test sync logic: `sync-service.test.ts` covering incremental sync, conflict resolution, cleanup
   - Test biometric flow: `biometric-service.test.ts` with mocked `expo-local-authentication`

2. **Component tests** (RNTL):
   - Render screens: `render(<IntakeScreen />)` with mocked navigation
   - Simulate user interactions: `fireEvent.press(getByText('Submit'))`, `fireEvent.changeText(getByPlaceholder('Title'), 'New intake')`
   - Assert UI updates: `expect(getByText('Ticket created')).toBeTruthy()`

3. **E2E tests** (Maestro):
   - Declarative YAML flows: `maestro test e2e/intake-submission.yaml`
   - Example flow: Login → Navigate to Front Door → Fill form → Submit → Verify ticket in queue
   - Run on Expo Go or native builds: `maestro test --app=app-release.apk`

**References**:
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- Maestro: https://maestro.mobile.dev/
- Jest React Native: https://jestjs.io/docs/tutorial-react-native

---

## Best Practices Summary

### 1. Offline-First Architecture
- Local database (WatermelonDB) is source of truth
- All read operations use local cache, writes queue for sync
- Incremental sync with delta queries, optimistic locking, hybrid conflict resolution
- Automatic cleanup of stale data (>90 days) to prevent storage bloat

### 2. Security & Privacy
- Field-level encryption for confidential+ data using platform secure storage (iOS Keychain, Android Keystore)
- Biometric auth for sensitive operations (viewing confidential tickets, admin role assignments)
- JWT token validation via Supabase Auth, RLS policies enforced during sync
- No PII in crash reports or analytics (aggregated metrics only)

### 3. Performance Optimization
- FlatList virtualization for large lists (1000+ items)
- React.memo + useMemo for expensive components/calculations
- Image lazy loading with blurhash placeholders
- Code splitting with React.lazy() for on-demand screen loading
- Native animations with `useNativeDriver: true` for 60fps

### 4. User Experience
- RTL support via React Native Paper I18nManager (automatic start/end positioning)
- Touch targets ≥44x44px with ≥8px spacing (WCAG mobile guidelines)
- Loading states with skeleton UI using cached data (≤1s initial render)
- Error boundaries with user-friendly fallback screens
- Push notifications with deep linking to relevant screens

### 5. Development Workflow
- TypeScript 5.8+ strict mode for type safety
- Test-first development: Jest + RNTL (unit/component), Maestro (E2E)
- ESLint + Prettier for code consistency
- Conventional commits with PRs ≤300 LOC
- UI changes include iOS/Android screenshots in PRs

---

## Open Questions & Risks

### Open Questions
1. **OCR accuracy**: What is acceptable OCR accuracy threshold for Arabic text extraction? (e.g., 85% character accuracy)
2. **Notification limits**: Should we implement rate limiting for push notifications to prevent spam? (e.g., max 10 notifications per hour per user)
3. **Storage limits**: How should we handle users with <200MB free space (below minimum)? Block sync or warn?

### Risks & Mitigations
1. **Risk**: WatermelonDB sync conflicts overwhelming users with resolution prompts
   - **Mitigation**: Implement intelligent auto-merge for 90% of conflicts, only prompt for critical data (intake submissions, role changes)

2. **Risk**: Large network graphs (>50 nodes) causing performance issues on low-end devices
   - **Mitigation**: Implement clustering algorithm to group related nodes, max 20 visible nodes initially, expand on tap

3. **Risk**: Biometric auth failure preventing access to critical workflows
   - **Mitigation**: Always provide fallback to device PIN/password, allow users to disable biometrics in settings

4. **Risk**: Background sync draining battery on older devices
   - **Mitigation**: Implement adaptive sync: WiFi-only background sync, reduce frequency on low battery (<20%)

---

## References

### Official Documentation
- Expo SDK 52: https://docs.expo.dev/
- React Native 0.81: https://reactnative.dev/
- WatermelonDB: https://watermelondb.dev/
- React Native Paper: https://callstack.github.io/react-native-paper/
- React Navigation 7: https://reactnavigation.org/
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript

### Architecture Patterns
- Offline-first architecture: https://offlinefirst.org/
- Optimistic UI patterns: https://www.apollographql.com/docs/react/performance/optimistic-ui/
- Mobile-first design: https://www.mobilefirst.design/

### Security
- OWASP Mobile Security: https://owasp.org/www-project-mobile-security/
- iOS Data Protection: https://support.apple.com/guide/security/data-protection-overview-secf6276da8a/web
- Android Keystore: https://developer.android.com/training/articles/keystore
