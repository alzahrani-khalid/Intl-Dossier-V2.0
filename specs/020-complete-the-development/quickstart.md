# Quickstart Guide: Mobile Development

**Feature**: 020-complete-the-development | **Date**: 2025-10-12

## Overview

This quickstart guide provides step-by-step instructions for setting up the mobile development environment, implementing key features, testing, and deploying the Expo/React Native mobile application.

## Prerequisites

### Required Software

```bash
# Node.js 18+ LTS
node --version  # Should be >= 18.0.0

# npm or yarn
npm --version   # Should be >= 9.0.0

# Expo CLI (global installation)
npm install -g expo-cli

# EAS CLI (Expo Application Services)
npm install -g eas-cli

# Watchman (for macOS development)
brew install watchman

# iOS Simulator (macOS only)
# Install Xcode from App Store, then:
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Android Studio (for Android development)
# Download from https://developer.android.com/studio
# Configure Android SDK and emulator
```

### Development Tools

- **VS Code** with extensions:
  - React Native Tools
  - ESLint
  - Prettier
  - vscode-styled-components
  - Expo Tools

- **Physical devices** (recommended for testing):
  - iPhone running iOS 13+ (for biometric testing)
  - Android phone running Android 8.0+ (for biometric testing)

### Backend Requirements

- Supabase project running with Edge Functions deployed
- PostgreSQL database with existing schema (from web application)
- Supabase Auth configured
- Firebase Cloud Messaging (FCM) and APNS configured for push notifications

---

## 1. Project Setup

### Step 1.1: Initialize Expo Project

```bash
# Navigate to repository root
cd /path/to/Intl-DossierV2.0

# Create mobile directory
npx create-expo-app mobile --template expo-template-blank-typescript

# Navigate to mobile directory
cd mobile

# Install required dependencies
npm install @nozbe/watermelondb @nozbe/watermelondb/adapters/sqlite \
  react-native-paper react-native-vector-icons \
  react-navigation/native react-navigation/native-stack react-navigation/bottom-tabs \
  @tanstack/react-query \
  @supabase/supabase-js \
  i18next react-i18next \
  expo-local-authentication expo-secure-store expo-camera expo-document-scanner \
  expo-notifications expo-image \
  react-native-reanimated react-native-gesture-handler \
  @react-native-async-storage/async-storage \
  react-native-logs

# Install dev dependencies
npm install -D @types/react @types/react-native \
  jest @testing-library/react-native @testing-library/jest-native \
  eslint prettier eslint-config-prettier \
  @babel/preset-typescript
```

### Step 1.2: Configure app.json

```json
{
  "expo": {
    "name": "GASTAT Intl Dossier",
    "slug": "intl-dossier",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "sa.gov.stats.intldossier",
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access needed to scan documents and capture field evidence",
        "NSFaceIDUsageDescription": "Face ID is used for quick and secure authentication",
        "NSPhotoLibraryUsageDescription": "Photo library access needed to attach images to intake requests"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "sa.gov.stats.intldossier",
      "permissions": [
        "CAMERA",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-local-authentication",
      "expo-secure-store",
      "expo-camera",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "minSdkVersion": 26
          },
          "ios": {
            "deploymentTarget": "13.0"
          }
        }
      ]
    ],
    "scheme": "intldossier",
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### Step 1.3: Setup WatermelonDB

```bash
# Create database directory structure
mkdir -p mobile/src/database/{schema,models,migrations}

# Install WatermelonDB CLI for code generation
npm install -g @nozbe/watermelondb-cli
```

**Create database schema** (mobile/src/database/schema/index.ts):

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'mobile_intake_tickets',
      columns: [
        { name: 'ticket_number', type: 'string', isIndexed: true },
        { name: 'request_type', type: 'string' },
        { name: 'title_ar', type: 'string' },
        { name: 'title_en', type: 'string' },
        { name: 'sensitivity', type: 'string' },
        { name: 'urgency', type: 'string' },
        { name: 'offline_queue_status', type: 'string' },
        { name: 'sla_deadline', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: '_status', type: 'string' },
        { name: '_version', type: 'number' },
        { name: '_synced_at', type: 'number', isOptional: true },
      ]
    }),
    // Add other tables from data-model.md
  ]
})
```

**Initialize database** (mobile/src/database/index.ts):

```typescript
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'
import { MobileIntakeTicket } from './models'

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: error => {
    console.error('WatermelonDB setup error:', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [MobileIntakeTicket],
})
```

---

## 2. Core Feature Implementation

### Step 2.1: Setup Supabase Client

**Create Supabase client** (mobile/src/services/supabase-client.ts):

```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://zkrcjzdemdmwhearhfgg.supabase.co'
const supabaseAnonKey = 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Step 2.2: Implement Sync Service

**Sync service** (mobile/src/services/sync-service.ts):

```typescript
import { database } from '../database'
import { supabase } from './supabase-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

export class SyncService {
  static async incrementalSync() {
    const lastSyncTimestamp = await AsyncStorage.getItem('last_sync_timestamp')

    const { data, error } = await supabase.functions.invoke('sync-incremental', {
      body: {
        last_sync_timestamp: lastSyncTimestamp || new Date(0).toISOString(),
        entity_types: ['intake_tickets', 'assignments', 'dossiers'],
      }
    })

    if (error) throw error

    await database.write(async () => {
      // Process created entities
      for (const entity of data.delta.created) {
        const collection = database.get(entity.entity_type)
        await collection.create(record => {
          Object.assign(record, entity.data)
          record._version = entity._version
          record._status = 'synced'
          record._synced_at = new Date().getTime()
        })
      }

      // Process updated entities (check for conflicts)
      for (const entity of data.delta.updated) {
        const collection = database.get(entity.entity_type)
        const localRecord = await collection.find(entity.entity_id)

        if (localRecord._version !== entity._version - 1) {
          // Conflict detected - store for user resolution
          await this.handleConflict(localRecord, entity)
        } else {
          // No conflict - apply update
          await localRecord.update(record => {
            Object.assign(record, entity.data)
            record._version = entity._version
            record._status = 'synced'
            record._synced_at = new Date().getTime()
          })
        }
      }

      // Process deleted entities
      for (const entity of data.delta.deleted) {
        const collection = database.get(entity.entity_type)
        const localRecord = await collection.find(entity.entity_id)
        await localRecord.markAsDeleted()
      }
    })

    await AsyncStorage.setItem('last_sync_timestamp', data.sync_timestamp)
  }

  static async pushLocalChanges() {
    const syncQueue = database.get('mobile_sync_queue')
    const pendingOps = await syncQueue.query().fetch()

    const operations = pendingOps.map(op => ({
      operation_id: op.id,
      operation: op.operation,
      entity_type: op.entity_type,
      entity_id: op.entity_id,
      data: op.entity_data,
      client_version: op.entity_data._version,
    }))

    const { data, error } = await supabase.functions.invoke('sync-push', {
      body: { operations }
    })

    if (error) throw error

    await database.write(async () => {
      for (const result of data.results) {
        const queueItem = pendingOps.find(op => op.id === result.operation_id)

        if (result.status === 'success') {
          // Update local record with server metadata
          const collection = database.get(queueItem.entity_type)
          const record = await collection.find(queueItem.entity_id)
          await record.update(r => {
            r._version = result.server_version
            r._status = 'synced'
            r._synced_at = new Date(result.server_updated_at).getTime()
          })
          await queueItem.destroyPermanently()
        } else if (result.status === 'conflict') {
          // Handle conflict (show user dialog)
          await this.showConflictDialog(result.conflict_data)
        }
      }
    })
  }
}
```

### Step 2.3: Implement Biometric Auth

**Biometric service** (mobile/src/services/biometric-service.ts):

```typescript
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { supabase } from './supabase-client'

export class BiometricService {
  static async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    return compatible && enrolled
  }

  static async setupBiometric(refreshToken: string, deviceId: string) {
    // Encrypt refresh token using platform secure storage
    const encryptedToken = await this.encryptToken(refreshToken)

    // Store encrypted token in SecureStore
    await SecureStore.setItemAsync(`biometric_token_${deviceId}`, encryptedToken)

    // Register biometric setup with backend
    const { data, error } = await supabase.functions.invoke('auth-biometric-setup', {
      body: {
        device_id: deviceId,
        biometric_type: 'face_id', // or 'touch_id', 'fingerprint'
        encrypted_refresh_token: encryptedToken,
      }
    })

    if (error) throw error
    return data
  }

  static async authenticateWithBiometric(deviceId: string) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access GASTAT Dossier',
      fallbackLabel: 'Use device password',
      disableDeviceFallback: false,
    })

    if (!result.success) {
      throw new Error('Biometric authentication failed')
    }

    // Retrieve encrypted refresh token
    const encryptedToken = await SecureStore.getItemAsync(`biometric_token_${deviceId}`)
    const refreshToken = await this.decryptToken(encryptedToken!)

    // Exchange refresh token for access token
    const { data, error } = await supabase.functions.invoke('auth-refresh-token', {
      body: { refresh_token: refreshToken, device_id: deviceId }
    })

    if (error) throw error
    return data.access_token
  }

  private static async encryptToken(token: string): Promise<string> {
    // Platform-specific encryption using SecureStore
    return token // SecureStore handles encryption automatically on iOS/Android
  }

  private static async decryptToken(encryptedToken: string): Promise<string> {
    return encryptedToken // SecureStore handles decryption automatically
  }
}
```

### Step 2.4: Setup Push Notifications

**Notification service** (mobile/src/services/notification-service.ts):

```typescript
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase-client'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export class NotificationService {
  static async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission for push notifications not granted')
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data

    // Register device token with backend
    await supabase.functions.invoke('notifications-register-device', {
      body: {
        device_token: token,
        platform: Platform.OS,
        device_id: await this.getDeviceId(),
      }
    })

    return token
  }

  static setupNotificationListeners(navigation: any) {
    // Handle notification tap (app opened from notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      const deepLink = response.notification.request.content.data.deep_link_url
      if (deepLink) {
        this.handleDeepLink(deepLink, navigation)
      }
    })

    // Handle foreground notifications
    Notifications.addNotificationReceivedListener(notification => {
      // Show in-app toast instead of system notification
      console.log('Foreground notification:', notification)
    })
  }

  static handleDeepLink(url: string, navigation: any) {
    // Parse deep link: intldossier://assignment/123
    const match = url.match(/intldossier:\/\/(\w+)\/(.+)/)
    if (match) {
      const [, screen, params] = match
      navigation.navigate(screen, { id: params })
    }
  }

  private static async getDeviceId(): Promise<string> {
    return await AsyncStorage.getItem('device_id') || ''
  }
}
```

---

## 3. Testing

### Step 3.1: Unit Tests with Jest

**Configure Jest** (mobile/jest.config.js):

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
}
```

**Example unit test** (mobile/src/services/__tests__/sync-service.test.ts):

```typescript
import { SyncService } from '../sync-service'
import { database } from '../../database'

jest.mock('../../database')
jest.mock('../supabase-client')

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should perform incremental sync with no conflicts', async () => {
    const mockData = {
      sync_timestamp: '2025-10-12T10:00:00Z',
      delta: {
        created: [],
        updated: [{
          entity_type: 'assignments',
          entity_id: '123',
          data: { status: 'in_progress' },
          _version: 2
        }],
        deleted: []
      }
    }

    // Mock Supabase function response
    require('../supabase-client').supabase.functions.invoke.mockResolvedValue({
      data: mockData,
      error: null
    })

    await SyncService.incrementalSync()

    expect(database.write).toHaveBeenCalled()
    // Verify no conflict dialog shown
  })

  it('should detect and handle conflicts', async () => {
    // Test conflict detection when local_version !== server_version - 1
    // ...
  })
})
```

### Step 3.2: Component Tests with RNTL

**Example component test** (mobile/src/screens/__tests__/IntakeScreen.test.tsx):

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { IntakeScreen } from '../intake/IntakeScreen'

describe('IntakeScreen', () => {
  it('should render intake form with all fields', () => {
    const { getByPlaceholderText } = render(<IntakeScreen />)

    expect(getByPlaceholderText('Title (Arabic)')).toBeTruthy()
    expect(getByPlaceholderText('Title (English)')).toBeTruthy()
    expect(getByPlaceholderText('Description (Arabic)')).toBeTruthy()
  })

  it('should queue intake submission when offline', async () => {
    const { getByText, getByPlaceholderText } = render(<IntakeScreen />)

    // Simulate offline state
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({ isConnected: false })

    fireEvent.changeText(getByPlaceholderText('Title (Arabic)'), 'طلب جديد')
    fireEvent.changeText(getByPlaceholderText('Title (English)'), 'New request')
    fireEvent.press(getByText('Submit'))

    await waitFor(() => {
      expect(getByText('Queued for sync')).toBeTruthy()
    })
  })
})
```

### Step 3.3: E2E Tests with Maestro

**Install Maestro**:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH":"$HOME/.maestro/bin"
```

**Example E2E flow** (mobile/__tests__/e2e/intake-submission.yaml):

```yaml
appId: sa.gov.stats.intldossier
---
- launchApp
- tapOn: "Front Door"
- tapOn: "Engagement Request"
- inputText: "طلب تعاون جديد"
  id: "title_ar"
- inputText: "New collaboration request"
  id: "title_en"
- tapOn: "Submit"
- assertVisible: "Ticket created: INT-*"
- tapOn: "Intake Queue"
- assertVisible: "طلب تعاون جديد"
```

**Run E2E tests**:

```bash
# Start Expo development build
expo start --dev-client

# Run Maestro test
maestro test mobile/__tests__/e2e/intake-submission.yaml
```

---

## 4. Development Workflow

### Step 4.1: Run Development Server

```bash
# Start Expo development server
cd mobile
expo start

# Run on iOS simulator (macOS only)
expo start --ios

# Run on Android emulator
expo start --android

# Run on physical device via Expo Go app
# Scan QR code from Expo Dev Tools
```

### Step 4.2: Code Quality Checks

```bash
# Lint TypeScript code
npm run lint

# Format code with Prettier
npm run format

# Type check with TypeScript
npx tsc --noEmit

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Step 4.3: Debugging

**React Native Debugger**:

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Start debugger on port 19000
open "rndebugger://set-debugger-loc?host=localhost&port=19000"
```

**Flipper** (advanced debugging):

```bash
# Install Flipper
brew install --cask flipper

# Start Flipper, connect to running app
# Inspect network requests, WatermelonDB, Redux, etc.
```

---

## 5. Building & Deployment

### Step 5.1: Configure EAS Build

**Create eas.json**:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@stats.gov.sa",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 5.2: Build for iOS

```bash
# Login to EAS
eas login

# Configure EAS project
eas build:configure

# Build development build for testing
eas build --profile development --platform ios

# Build production build for App Store
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### Step 5.3: Build for Android

```bash
# Build development build
eas build --profile development --platform android

# Build production APK
eas build --profile production --platform android

# Submit to Google Play (internal track)
eas submit --platform android
```

### Step 5.4: Over-the-Air (OTA) Updates

```bash
# Publish update to development channel
eas update --branch development --message "Fix: Sync conflict resolution"

# Publish update to production channel
eas update --branch production --message "Feature: Biometric auth improvements"

# View update history
eas update:list
```

---

## 6. Troubleshooting

### Common Issues

**Issue: WatermelonDB sync conflicts**
```typescript
// Check local version vs server version
const localRecord = await database.get('assignments').find(id)
console.log('Local version:', localRecord._version)
console.log('Server version:', serverData._version)

// Force full sync to reset
await SyncService.fullSync()
```

**Issue: Biometric auth not working**
```typescript
// Check biometric availability
const available = await BiometricService.isAvailable()
console.log('Biometric available:', available)

// Check device enrollment
const enrolled = await LocalAuthentication.isEnrolledAsync()
console.log('Biometrics enrolled:', enrolled)
```

**Issue: Push notifications not received**
```typescript
// Check notification permissions
const { status } = await Notifications.getPermissionsAsync()
console.log('Notification permission:', status)

// Verify device token registration
const token = await Notifications.getExpoPushTokenAsync()
console.log('Push token:', token.data)

// Check backend registration
await supabase.from('user_device_tokens').select('*').eq('device_token', token.data)
```

**Issue: App crash on startup**
```bash
# Clear Metro bundler cache
expo start --clear

# Clear Expo cache
expo start -c

# Reset iOS simulator
xcrun simctl erase all

# Reset Android emulator
adb shell pm clear sa.gov.stats.intldossier
```

---

## 7. Performance Optimization

### Optimize Images

```bash
# Install image optimization tool
npm install -g sharp-cli

# Optimize all images in assets/
sharp -i assets/**/*.png -o assets/optimized/ --webp
```

### Reduce Bundle Size

```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Remove unused dependencies
npx depcheck

# Enable Hermes engine (Android)
# In app.json:
{
  "android": {
    "jsEngine": "hermes"
  }
}
```

### Implement Code Splitting

```typescript
// Lazy load screens
const KanbanScreen = lazy(() => import('./screens/kanban/KanbanScreen'))

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <KanbanScreen />
</Suspense>
```

---

## 8. Deployment Checklist

- [ ] All unit tests passing (≥80% coverage for services)
- [ ] All component tests passing (≥70% coverage for screens)
- [ ] All E2E flows passing (6 user stories covered)
- [ ] TypeScript strict mode with zero errors
- [ ] ESLint passing with zero warnings
- [ ] Performance targets met:
  - [ ] Initial screen render ≤1s
  - [ ] Search typeahead ≤200ms
  - [ ] Kanban drag 60fps
  - [ ] Incremental sync ≤5s
- [ ] Security checklist:
  - [ ] Field-level encryption enabled for confidential data
  - [ ] Biometric auth tested on iOS and Android
  - [ ] JWT token validation working
  - [ ] No secrets in git history
- [ ] Accessibility checklist:
  - [ ] Screen reader tested (TalkBack/VoiceOver)
  - [ ] Touch targets ≥44x44px
  - [ ] Color contrast ≥4.5:1
- [ ] RTL support verified:
  - [ ] Arabic UI renders correctly
  - [ ] Logical properties used throughout
  - [ ] No physical direction properties (left/right)
- [ ] Backend integration verified:
  - [ ] Sync API working with delta queries
  - [ ] Auth API working with biometric setup
  - [ ] Notifications API delivering push notifications
- [ ] App Store compliance:
  - [ ] Privacy policy updated
  - [ ] App Store screenshots prepared (iOS/Android)
  - [ ] App description translated (AR/EN)

---

## 9. Resources

### Documentation
- Expo SDK: https://docs.expo.dev/
- WatermelonDB: https://watermelondb.dev/
- React Native Paper: https://callstack.github.io/react-native-paper/
- React Navigation: https://reactnavigation.org/
- Supabase JS Client: https://supabase.com/docs/reference/javascript

### Community
- Expo Discord: https://chat.expo.dev/
- React Native Community: https://www.reactnative.dev/community/overview

### Tools
- Expo EAS: https://docs.expo.dev/eas/
- Maestro E2E: https://maestro.mobile.dev/
- Flipper Debugger: https://fbflipper.com/

---

## Next Steps

1. Review [data-model.md](./data-model.md) for WatermelonDB schema implementation
2. Review [contracts/](./contracts/) for API integration details
3. Run `/speckit.tasks` to generate actionable task breakdown
4. Implement foundation tasks (setup, configuration) before user story tasks
5. Follow TDD workflow: write tests → verify failure → implement → verify pass
