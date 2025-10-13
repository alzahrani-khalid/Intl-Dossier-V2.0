# Phase 0 Research: Apply Gusto Design System to Mobile App

**Date**: 2025-10-13
**Feature**: Apply Gusto Mobile design system to Intl-Dossier mobile app with full web route parity

## Research Summary

This document consolidates research findings from three specialized investigations:
1. Gusto Mobile design patterns and React Native Paper implementation
2. WatermelonDB offline-first sync strategies
3. Expo SDK 52+ native features integration

---

## 1. Gusto Design System Implementation with React Native Paper

### Decision: Use React Native Paper 5.12+ with Custom Gusto-Inspired Theme

**Rationale**: React Native Paper provides Material Design 3 components that align well with Gusto's design patterns while offering automatic RTL support and accessibility features.

**Key Implementation Details**:

#### Theme Configuration
```typescript
// Gusto Color Palette
const GustoColors = {
  primary: '#1B5B5A',           // Dark teal (Gusto brand)
  primaryContainer: '#E0F2F1',  // Light teal
  secondary: '#FF6B35',         // Accent orange
  background: '#F5F4F2',        // Warm off-white
  surface: '#FFFFFF',           // White cards
  surfaceVariant: '#E8E6E3',   // Light gray
  outline: '#C8C6C3',          // Border color
};

// Spacing (4px base unit)
const Spacing = {
  xs: 4,   sm: 8,   md: 12,  lg: 16,
  xl: 20,  '2xl': 24,  '3xl': 32,
};

// Touch Targets
const TouchTargets = {
  minimum: 44,      // WCAG AA
  comfortable: 48,  // Gusto buttons
  large: 56,       // Tab bar height
};
```

#### Card-Based Layouts
- Border radius: 12-16px (`roundness: 12`)
- Elevation: 2-4dp (`elevation={2}`)
- Internal padding: 16-24px
- Spacing between cards: 12-16px
- Background: White on light beige (#F5F4F2)

#### Status Chips
- Style: Outlined, pill-shaped (`mode="outlined"`, `borderRadius: 16`)
- Border: 1px teal (#1B5B5A), no fill
- Text: 12pt, medium weight, uppercase
- Height: 28px compact, 32px standard

#### Bottom Tab Navigation
- 5 persistent tabs: Home, Dossiers, Search, Calendar, Profile
- Active: Teal color (#1B5B5A), filled icon
- Inactive: Gray, outline icon
- Tab bar height: 60px
- Transition: ≤300ms (60fps)
- Badge support for notifications

#### RTL Support
- **Automatic with React Native Paper + i18next**:
  - Text alignment (`start`/`end`)
  - Icon placement in Material components
  - Typography scaling
  - Number formatting (Arabic-Indic numerals)
- **Manual handling required**:
  - Directional icons (flip 180° with `className={isRTL ? 'rotate-180' : ''}`)
  - Custom flex layouts (`row` ↔ `row-reverse`)
  - Date formatting with locale-aware libraries (date-fns with ar/enUS locale)

**Alternatives Considered**:
- **React Native Elements**: Less mature Material Design 3 support
- **NativeBase**: Heavy bundle size, slower performance
- **Custom components**: Time-consuming, inconsistent accessibility

**Conclusion**: React Native Paper 5.12+ provides the best balance of Gusto design alignment, RTL support, and accessibility compliance.

---

## 2. WatermelonDB Offline-First Sync Strategy

### Decision: Incremental Sync with Optimistic Locking and Hybrid Conflict Resolution

**Rationale**: WatermelonDB's sync protocol combined with optimistic locking provides efficient offline-first architecture with minimal data transfer and automatic conflict detection.

**Key Implementation Details**:

#### Incremental Sync API Contract

**Pull Endpoint**: `GET /api/sync/incremental`
```typescript
interface PullRequest {
  last_pulled_at: number | null;  // Unix timestamp (ms)
  schema_version: number;
  entity_types?: string[];        // Optional: filter specific tables
}

interface PullResponse {
  changes: {
    [tableName: string]: {
      created: RawRecord[];
      updated: RawRecord[];
      deleted: string[];
    };
  };
  timestamp: number;  // Server's current timestamp
}
```

**Push Endpoint**: `POST /api/sync/push`
```typescript
interface PushRequest {
  changes: {
    [tableName: string]: {
      created: RawRecord[];
      updated: RawRecord[];
      deleted: string[];
    };
  };
  lastPulledAt: number;
}
```

#### Schema Design for 11 Entities

Each entity includes sync metadata:
- `_version` (number): Optimistic lock version (incremented on each update)
- `last_modified` (number): Unix timestamp for change tracking
- `synced_at` (number, nullable): Timestamp of last successful sync
- `created_at` (number): Record creation time
- `updated_at` (number): Record last update time

**Indexes**: All foreign keys have `isIndexed: true` for query performance

#### Optimistic Locking Strategy

1. **Non-conflicting field updates**: Automatic merge
   - User A updates `field_x` on web, User B updates `field_y` on mobile → both apply
   - Last-write-wins per field

2. **Conflicting field updates**: User-prompted resolution
   - Both users modify same field (e.g., dossier title)
   - Sync detects conflict via `_version` mismatch
   - Modal presents 3 options: Keep mobile / Use web / View side-by-side

3. **Server validation**:
   - Check if `server.last_modified > lastPulledAt` (modified after last sync)
   - Check if `server._version === client._version - 1` (expected version)
   - Return 409 Conflict on mismatch → triggers client retry

4. **Audit trail**: All conflict resolutions logged to `audit_logs` table

#### TTL-Based Cleanup (90-Day Retention)

**DataCleanupService** runs:
- **Trigger**: Daily check on app foreground
- **Tables**: notifications, calendar_entries, intelligence_signals, intake_tickets
- **Logic**: Delete records where `synced_at < (now - 90 days)` AND `_status === 'synced'`
- **Preserve**: Records with pending local changes (`_status !== 'synced'`)
- **Background task**: Optional iOS BackgroundFetch / Android JobScheduler

#### Performance Optimization

1. **Batch operations**: Use `prepareCreate`, `prepareUpdate`, `prepareMarkAsDeleted` with `database.batch()`
2. **Query optimization**: `@lazy` decorators for expensive queries, `fetchCount()` instead of `fetch()` for counts
3. **Minimize re-renders**: `withObservables` HOC for reactive components
4. **Sync optimization**: Only push tables with actual changes, debounce sync triggers (5s)
5. **60fps UI**: Debounced queries (300ms), virtualized lists (FlashList)

**Alternatives Considered**:
- **Redux Persist**: Doesn't support relational queries or complex sync
- **Realm**: Higher memory usage, less TypeScript support
- **Custom SQLite**: Time-consuming, no sync protocol

**Conclusion**: WatermelonDB 0.28+ provides production-ready offline-first architecture with automatic sync conflict detection and efficient incremental sync.

---

## 3. Expo SDK 52+ Native Features Integration

### Decision: Use Expo Managed Workflow with Native Modules for Biometrics, Push Notifications, and Camera

**Rationale**: Expo SDK 52+ provides seamless integration with native features while maintaining cross-platform compatibility and OTA update support.

**Key Implementation Details**:

#### Biometric Authentication (expo-local-authentication)

**Use Cases**:
- App unlock after initial email/password login
- Confidential dossier access (confidentiality_level='confidential' or 'secret')

**Implementation**:
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

// Check device support
const hasHardware = await LocalAuthentication.hasHardwareAsync();
const isEnrolled = await LocalAuthentication.isEnrolledAsync();

// Authenticate
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Unlock Intl-Dossier',
  fallbackLabel: 'Use password',
  disableDeviceFallback: false, // Allow password fallback
});

if (result.success) {
  // Grant access
}
```

**Storage**: Store `biometric_enabled` preference in **SecureStore** (not AsyncStorage)

**Error Handling**: Fallback to password after 3 failed attempts

#### Push Notifications (expo-notifications)

**⚠️ Breaking Change**: Push notifications no longer work in Expo Go (SDK 52+). Must create development build.

**Setup**:
```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get Expo push token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig.extra.eas.projectId,
});

// Send token to backend
await fetch('/api/notifications/register-device', {
  method: 'POST',
  body: JSON.stringify({ token: token.data, userId }),
});
```

**Categories** (5 types):
1. **Assignments** (immediate): "New assignment: [title]"
2. **Deadlines** (24h before): "Reminder: [assignment] due tomorrow"
3. **Intake Requests** (immediate): "New intake ticket: [type]"
4. **Delegation Expiring** (24h before): "Your delegation expires tomorrow"
5. **Dossier Comments** (hourly batch): "5 new comments on followed dossiers"

**Deep Linking**:
```typescript
// React Navigation linking configuration
const linking = {
  config: {
    screens: {
      AssignmentDetail: 'assignment/:id',
      DossierDetail: 'dossier/:id',
      IntakeTicketDetail: 'intake/:id',
    },
  },
};

// Notification payload includes deep link
{
  title: 'New assignment',
  body: 'Review Saudi Arabia dossier',
  data: { url: 'intldossier://assignment/123' }
}
```

**Android 13+ Requirement**: Create notification channel BEFORE getting push token

#### Camera Integration & Document Scanning (expo-camera)

**Use Cases**:
- Document scanning with auto-crop and OCR
- Profile avatar photo capture

**Implementation**:
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

// Request permissions
const [permission, requestPermission] = useCameraPermissions();

// Capture photo
const photo = await cameraRef.current.takePictureAsync();

// Compress to <2MB
const compressed = await ImageManipulator.manipulateAsync(
  photo.uri,
  [{ resize: { width: 1920 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
```

**OCR Options**:

| Solution | Type | Accuracy | Cost | Arabic Support |
|----------|------|----------|------|----------------|
| **Google Cloud Vision** | Cloud | 95%+ | $1.50/1k | ✅ Excellent (95%+) |
| **expo-ocr** | On-Device | 75-85% | Free | ✅ Moderate (75%) |
| **Google ML Kit** | Hybrid | 85-90% | Free | ✅ Good (85%) |

**Recommendation**:
- **MVP (Phase 1)**: expo-ocr (free, offline, fast setup)
- **Production (Phase 2)**: Google Cloud Vision API (high accuracy, Arabic support)
- **Optimization (Phase 3)**: Hybrid with confidence-based fallback

#### Secure Storage (expo-secure-store)

**Use Cases**:
- JWT auth tokens
- Refresh tokens
- Biometric authentication keys
- Session data

**Implementation**:
```typescript
import * as SecureStore from 'expo-secure-store';

// Store encrypted data
await SecureStore.setItemAsync('auth_token', jwtToken, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// Retrieve
const token = await SecureStore.getItemAsync('auth_token');

// Delete
await SecureStore.deleteItemAsync('auth_token');
```

**iOS Keychain Accessibility Levels**:
- `WHEN_UNLOCKED`: Accessible only when device is unlocked (recommended)
- `AFTER_FIRST_UNLOCK`: Accessible after first unlock (default)
- `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: Most secure, device-specific

**Android Backup**: Configure `android:allowBackup="false"` for encrypted data

**Alternatives Considered**:
- **AsyncStorage**: Not encrypted, unsuitable for sensitive data
- **react-native-keychain**: Requires native module, Expo provides built-in solution
- **react-native-mmkv**: Fast but not encrypted by default

**Conclusion**: Expo SDK 52+ native modules provide production-ready implementations with proper encryption, platform-specific best practices, and seamless cross-platform compatibility.

---

## 4. Mobile Architecture Decisions

### Screen Navigation Structure (33 Routes)

**5 Bottom Tabs** (Primary Navigation):
1. **Home**: Dashboard with hero stats card, recent activity feed, quick action cards
2. **Dossiers**: List view with search/filter, detail view with card sections
3. **Search**: Global search across all entity types (grouped results)
4. **Calendar**: Month/week/day views, event detail bottom sheets
5. **Profile**: User info, settings, notifications preferences, language toggle, logout

**Stack Navigation** (Within Tabs):
- Home Stack: HomeScreen
- Dossiers Stack: DossiersListScreen → DossierDetailScreen
- Search Stack: SearchScreen → [EntityDetailScreen]
- Calendar Stack: CalendarScreen → EventDetailScreen → NewEventModal
- Profile Stack: ProfileScreen → SettingsScreen → NotificationsScreen → LanguageScreen

**Additional Screens** (28 screens for full web parity):
- Assignments (queue, escalations, detail)
- Intake (queue, my tickets, detail, new request) [Intake Officer role]
- Countries, Organizations, Forums (list, detail)
- Positions (list, detail, versions, approvals)
- MOUs (list, detail)
- Events (list, detail)
- Engagements (list, detail, after-action)
- Intelligence (signals list, signal detail) [Analyst role]
- Monitoring (dashboard) [Analyst role]
- Data Library (document repository)
- Reports (list, detail)
- Admin (approvals, users list, user detail, access review) [Admin role]

### Data Model for WatermelonDB (11 Entities)

**Core Entities**:
1. **Dossier**: title, description, status, country_id, organization_id, _version, last_modified, synced_at
2. **Assignment**: dossier_id, user_id, role, assigned_at, _version
3. **CalendarEntry**: title, event_type, start_date, end_date, dossier_id, notes, _version

**Reference Entities** (Cached 90 days):
4. **Country**: name, code, region, _version
5. **Organization**: name, type, country_id, _version
6. **Forum**: name, description, type, _version

**Specialized Entities**:
7. **Position**: title, summary, country_id, forum_id, _version
8. **MOU**: title, country_id, signed_date, expiry_date, status, _version
9. **IntelligenceSignal**: title, content, source, priority, country_id, dossier_id, _version [Analyst role, 30-day retention]
10. **IntakeTicket**: subject, description, status, priority, submitted_by, assigned_to, dossier_id, _version [Intake Officer role, 30-day retention]
11. **Notification**: title, message, type, is_read, user_id, related_entity_type, related_entity_id, _version [100-item retention]

**Relationships**:
- Dossier → Country (belongs_to)
- Dossier → Organization (belongs_to)
- Dossier → Assignments (has_many)
- Dossier → CalendarEntries (has_many)
- Assignment → Dossier (belongs_to)
- CalendarEntry → Dossier (belongs_to, optional)

### Sync Strategy

**Triggers**:
1. **Manual sync**: Pull-to-refresh gesture on Home/Dossiers/Calendar screens
2. **Auto-sync on foreground**: When app returns to foreground, check if >5 minutes since last sync
3. **Background sync** (future): iOS BackgroundFetch / Android JobScheduler every 30 minutes

**Offline Queue**:
- WatermelonDB automatically tracks local changes with `_status` field: 'created', 'updated', 'deleted', 'synced'
- Queue manager processes changes when network restored
- Retry logic with exponential backoff (3 max retries)

**Conflict Resolution**:
1. Non-conflicting: Automatic merge (per-field last-write-wins)
2. Conflicting: User-prompted modal with 3 options
3. Server validation: Check `_version` and `last_modified` timestamps
4. Audit trail: Log all conflict resolutions

**Cleanup**:
- Run daily on app foreground
- Purge records older than 90 days (notifications 30 days)
- Preserve records with pending changes (`_status !== 'synced'`)

---

## 5. Performance Targets Validation

| Metric | Target | Implementation Strategy | Measurement |
|--------|--------|------------------------|-------------|
| Initial screen render | ≤1s | Skeleton UI with cached WatermelonDB data, lazy load images | From app launch to interactive hero card |
| Fresh data load | ≤2s | TanStack Query caching, incremental sync, batch operations | From screen mount to list fully rendered |
| Incremental sync | ≤3s | Delta queries with `last_pulled_at`, batch database writes | From sync trigger to completion |
| Bottom tab transition | ≤300ms | React Navigation native driver, 60fps animations | From tab tap to screen interactive |
| Search results | ≤500ms | 300ms debounce + 200ms query execution, indexed columns | From last keystroke to results displayed |
| Calendar month view | ≤1s | Optimized queries with `@lazy` decorators, pre-calculated event indicators | From screen mount to calendar fully rendered |
| List scrolling | 60fps | FlashList virtualization, `withObservables` HOC to minimize re-renders | Continuous scroll of 1000+ items |

**Tools for Validation**:
- React Native Performance Monitor (built-in FPS counter)
- Flipper for database query analysis
- react-native-performance for custom metrics
- PerformanceMonitor class (tracks operation times)

---

## 6. Security & Compliance Validation

| Requirement | Implementation | Validation Method |
|-------------|---------------|-------------------|
| Biometric authentication for app unlock | expo-local-authentication with SecureStore preference storage | Manual testing on physical devices |
| Biometric re-auth for confidential dossiers | Check `confidentiality_level` field, prompt before detail screen | Unit tests + manual verification |
| JWT token encrypted storage | expo-secure-store with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Security audit, penetration testing |
| Auto-logout after 30min inactivity | AppState listener, AsyncStorage for last activity timestamp | Manual testing with timer |
| RLS policies enforced server-side | Existing Supabase RLS (no mobile changes needed) | Backend integration tests |
| Audit logging for sync operations | Include metadata in sync payloads: user_id, timestamp, action, entity_type, old_values, new_values | Database query validation |

---

## 7. Testing Strategy

### Unit Tests (Jest + React Native Testing Library)
- Component rendering with mock data
- Hook behavior (useSync, useBiometric, useNotifications)
- Service logic (SyncService, OfflineQueueManager, DataCleanupService)
- WatermelonDB model methods

### Integration Tests
- Sync API endpoints (incremental pull/push, conflict detection)
- Offline queue processing
- Conflict resolution flows
- Push notification handling

### E2E Tests (Maestro)
- Login flow with biometric authentication
- Dossier list → detail → offline viewing
- Assignment status update
- Calendar event creation
- Offline sync with conflict resolution
- Push notification tap → deep link navigation

### Performance Tests
- List scrolling with 1000+ items (60fps)
- Sync performance with 50 records (≤3s)
- Memory usage during large syncs (<100MB)
- Battery impact (background sync)

### Testing Requirements
- **Physical devices required** (biometrics, camera, push notifications don't work in simulators)
- Test devices: iPhone (iOS 14+) with Face ID/Touch ID, Android device (10+) with fingerprint
- Network conditions: 4G, 3G, offline, intermittent

---

## 8. Dependencies & Versions

### Primary Dependencies
```json
{
  "dependencies": {
    "expo": "^52.0.0",
    "react-native": "~0.81.0",
    "react-native-paper": "^5.12.0",
    "react-navigation/native": "^7.0.0",
    "react-navigation/bottom-tabs": "^7.0.0",
    "react-navigation/stack": "^7.0.0",
    "@nozbe/watermelondb": "^0.28.0",
    "@tanstack/react-query": "^5.0.0",
    "i18next": "^23.0.0",
    "react-i18next": "^14.0.0",
    "expo-local-authentication": "^14.0.0",
    "expo-notifications": "^0.28.0",
    "expo-camera": "^15.0.0",
    "expo-image-manipulator": "^12.0.0",
    "expo-secure-store": "^13.0.0",
    "@shopify/flash-list": "^1.6.0",
    "date-fns": "^3.0.0"
  }
}
```

### Backend Dependencies (New)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "expo-server-sdk": "^3.10.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.81.0",
    "typescript": "^5.8.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "maestro": "^1.38.0"
  }
}
```

---

## 9. Implementation Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Sync conflicts overwhelm users | High | Medium | Implement automatic merge for 90% of cases, only prompt for true conflicts |
| Poor offline performance (<1s render) | High | Low | Use skeleton screens with cached data, lazy load images, optimize queries |
| Push notifications not working | Medium | Medium | Test early with development build, implement fallback in-app notifications |
| WatermelonDB migration issues | High | Low | Version schema carefully, test migrations thoroughly, backup data before updates |
| OCR accuracy too low for Arabic | Medium | Medium | Start with expo-ocr for MVP, upgrade to Google Cloud Vision for production |
| Biometric authentication lockout | Medium | Low | Always provide password fallback, clear error messages |
| Large sync payloads (>1MB) | Medium | Medium | Paginate sync responses, compress JSON, batch large syncs |
| Background sync battery drain | Low | Medium | Limit background sync frequency (30min), only sync on WiFi by default |

---

## 10. Open Questions Resolved

### Q1: Which OCR solution to use for Arabic document scanning?
**Answer**: Start with **expo-ocr** for MVP (free, offline, 75% accuracy), upgrade to **Google Cloud Vision API** for production (95%+ accuracy, excellent Arabic support, $1.50/1,000 requests).

### Q2: How to handle sync conflicts when user edits same field on web and mobile?
**Answer**: **Hybrid approach** - Automatic merge for non-conflicting field updates, user-prompted resolution modal for conflicting changes with 3 options: Keep mobile / Use web / View side-by-side comparison.

### Q3: Should we use React Navigation or Expo Router for navigation?
**Answer**: **React Navigation 7+** - More mature, better TypeScript support, extensive community resources, seamless deep linking integration for push notifications.

### Q4: How to secure JWT tokens on mobile?
**Answer**: **expo-secure-store** with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` accessibility level. Uses iOS Keychain (encrypted) and Android Keystore (encrypted). Never use AsyncStorage for sensitive data.

### Q5: What's the minimum device requirements for native features?
**Answer**: iOS 14+ (Face ID/Touch ID support), Android 10+ (Biometric API), minimum screen width 375px (iPhone SE). Physical devices required for testing (simulators don't support biometrics/camera/push).

---

## 11. Next Steps (Phase 1: Design & Contracts)

1. **Create data-model.md**: WatermelonDB schema for 11 entities with relationships, indexes, and sync metadata
2. **Create contracts/sync-api.md**: Incremental sync endpoint contracts (GET /sync/incremental, POST /sync/push)
3. **Create contracts/notifications.md**: Push notification payload schemas and deep linking contracts
4. **Create contracts/biometric.md**: Biometric authentication flow contracts
5. **Create quickstart.md**: Mobile dev environment setup (Expo CLI, EAS Build, testing guide)
6. **Update agent context**: Run `.specify/scripts/bash/update-agent-context.sh claude` to add mobile tech stack to CLAUDE.md

---

## References

- [Gusto Mobile Design Analysis](/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/mobile/GUSTO_DESIGN_ANALYSIS.md)
- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [WatermelonDB Documentation](https://watermelondb.dev/docs)
- [Expo SDK 52 Documentation](https://docs.expo.dev)
- [Material Design 3 Guidelines](https://m3.material.io/)
- [Supabase Sync Strategies](https://supabase.com/blog/react-native-offline-first-watermelon-db)

---

**Research Complete** ✅

All technical unknowns have been resolved. Ready to proceed with Phase 1 (Design & Contracts).
