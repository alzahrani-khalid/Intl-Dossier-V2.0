# Quickstart Guide: Mobile App Development

**Feature**: 021-apply-gusto-design
**Created**: 2025-10-13
**Platform**: iOS/Android (Expo SDK 52+)
**Estimated Setup Time**: 45-60 minutes

## Overview

This guide walks you through setting up the Intl-Dossier mobile development environment using Expo SDK 52+. You'll configure your local machine, run the app on a physical device or simulator, and understand the development workflow.

### What You'll Build

- **Expo-based mobile app** with Gusto design system
- **Offline-first architecture** using WatermelonDB
- **Biometric authentication** with Face ID/Touch ID
- **Push notifications** via Expo Push Notification Service
- **Bilingual UI** (English/Arabic) with RTL support

### Prerequisites

- **macOS 12+** (required for iOS development)
- **Node.js 18+ LTS** ([download](https://nodejs.org/))
- **npm 9+** or **pnpm 8+**
- **Git** ([download](https://git-scm.com/))
- **Xcode 15+** (iOS) or **Android Studio Hedgehog+** (Android)
- **Physical device** (recommended) or simulator

---

## Part 1: System Setup (15 minutes)

### 1. Install Node.js & npm

```bash
# Verify Node.js version (18+ required)
node --version  # Should output v18.x or higher

# Verify npm version (9+ required)
npm --version   # Should output 9.x or higher
```

**If not installed**:
- Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
- Or use nvm: `nvm install 18 && nvm use 18`

### 2. Install Expo CLI

```bash
# Install Expo CLI globally
npm install -g expo-cli@latest

# Verify installation
expo --version  # Should output 6.x or higher
```

### 3. Install EAS CLI

EAS (Expo Application Services) is required for building and deploying production apps:

```bash
# Install EAS CLI globally
npm install -g eas-cli@latest

# Login to Expo account (create one at expo.dev if needed)
eas login
```

### 4. Install Platform Tools

#### iOS Development (macOS only)

1. **Install Xcode** from Mac App Store (15+ required)
2. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Install iOS Simulator**:
   - Open Xcode → Preferences → Components
   - Download iOS 17+ Simulator

4. **Install CocoaPods** (dependency manager for iOS):
   ```bash
   sudo gem install cocoapods
   ```

#### Android Development (macOS/Windows/Linux)

1. **Download Android Studio** from [developer.android.com](https://developer.android.com/studio)
2. **Install Android SDK**:
   - Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
   - Install Android 14 (API 34) or higher
   - Install Android SDK Build-Tools 34+
   - Install Android Emulator

3. **Set environment variables** (add to `~/.zshrc` or `~/.bash_profile`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Reload shell**:
   ```bash
   source ~/.zshrc  # or source ~/.bash_profile
   ```

---

## Part 2: Project Setup (10 minutes)

### 1. Clone Repository

```bash
# Clone the Intl-Dossier repository
git clone https://github.com/your-org/Intl-DossierV2.0.git
cd Intl-DossierV2.0

# Switch to mobile development branch
git checkout 021-apply-gusto-design
```

### 2. Install Dependencies

```bash
# Install root dependencies (monorepo)
npm install

# Navigate to mobile directory
cd mobile

# Install mobile-specific dependencies
npm install
```

**Key Dependencies Installed**:
- `expo@^52.0.0` - Expo SDK
- `react-native@0.81.0` - React Native core
- `react-native-paper@5.12.0` - Material Design 3 UI library
- `@nozbe/watermelondb@0.28.0` - Offline-first database
- `@react-navigation/native@7.0.0` - Navigation library
- `expo-local-authentication` - Biometric authentication
- `expo-notifications` - Push notifications
- `react-native-reanimated@3.0.0` - Animations

### 3. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables**:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Expo Project ID (get from expo.dev after creating project)
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# Environment
EXPO_PUBLIC_ENV=development  # development | staging | production
```

### 4. Create Expo Project (First Time Only)

If this is your first time setting up the mobile app:

```bash
# Create Expo project in expo.dev
eas init

# Follow prompts to create project
# - Project name: Intl-Dossier
# - Slug: intl-dossier
# - Bundle identifier (iOS): com.stats.intldossier
# - Package name (Android): com.stats.intldossier
```

**Save the Project ID** to `.env` as `EXPO_PUBLIC_PROJECT_ID`

---

## Part 3: Running the App (10 minutes)

### Option A: Physical Device (Recommended)

Physical devices provide the best testing experience for biometrics, camera, and push notifications.

#### iOS Device

1. **Install Expo Go** from App Store on your iPhone/iPad

2. **Start development server**:
   ```bash
   npm run start
   ```

3. **Scan QR code** with Camera app → Open in Expo Go

4. **For development builds** (with native modules):
   ```bash
   # Build development client
   eas build --profile development --platform ios

   # Install on device via TestFlight or direct download
   # Then run:
   npx expo start --dev-client
   ```

#### Android Device

1. **Enable Developer Mode** on Android device:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Install Expo Go** from Google Play Store

3. **Connect via USB** or **same WiFi network**

4. **Start development server**:
   ```bash
   npm run start
   ```

5. **Scan QR code** in Expo Go app

### Option B: Simulator/Emulator

#### iOS Simulator

1. **Start Metro bundler**:
   ```bash
   npm run start
   ```

2. **Press `i`** to open iOS Simulator (or select from Expo Dev Tools)

3. **Wait for app to build and launch** (first launch may take 2-3 minutes)

**Common Issues**:
- **"No simulators found"**: Open Xcode → Window → Devices and Simulators → Create new simulator
- **"Build failed"**: Run `cd ios && pod install && cd ..` then retry

#### Android Emulator

1. **Create AVD (Android Virtual Device)** in Android Studio:
   - Tools → Device Manager → Create Device
   - Select Pixel 6 (or similar)
   - System Image: Android 14 (API 34)
   - RAM: 4GB minimum

2. **Start emulator**:
   ```bash
   # List available emulators
   emulator -list-avds

   # Start emulator
   emulator -avd Pixel_6_API_34
   ```

3. **Start Metro bundler**:
   ```bash
   npm run start
   ```

4. **Press `a`** to open Android app

**Common Issues**:
- **"ADB not found"**: Ensure `ANDROID_HOME` is set correctly
- **"Emulator won't start"**: Allocate more RAM (4GB+) or enable hardware acceleration

---

## Part 4: Development Workflow (10 minutes)

### File Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # React Native Paper components
│   │   ├── dossier/      # Dossier-specific components
│   │   └── shared/       # Shared components
│   ├── screens/          # Screen components (one per route)
│   │   ├── home/
│   │   ├── dossiers/
│   │   ├── calendar/
│   │   └── profile/
│   ├── navigation/       # React Navigation setup
│   │   ├── BottomTabNavigator.tsx
│   │   └── StackNavigators.tsx
│   ├── database/         # WatermelonDB setup
│   │   ├── models/       # Model classes
│   │   ├── schemas/      # Table schemas
│   │   └── index.ts      # Database initialization
│   ├── services/         # API clients and services
│   │   ├── sync.ts       # Incremental sync service
│   │   ├── auth.ts       # Authentication service
│   │   └── notifications.ts
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   │   ├── en/           # English translations
│   │   └── ar/           # Arabic translations
│   ├── theme/            # React Native Paper theme
│   └── utils/            # Helper functions
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
├── babel.config.js       # Babel configuration
└── package.json          # Dependencies
```

### Key Commands

```bash
# Start development server
npm run start

# Start with cache cleared
npm run start -- --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run TypeScript compiler in watch mode
npm run typecheck:watch

# Run linter
npm run lint

# Run tests
npm run test

# Build production app (iOS)
eas build --profile production --platform ios

# Build production app (Android)
eas build --profile production --platform android
```

### Hot Reloading

Expo supports **Fast Refresh** for instant code changes:

1. **Save any file** in `src/` directory
2. **App reloads automatically** in <2 seconds
3. **Component state preserved** (except for new components)

**Manual Reload**:
- iOS Simulator: `Cmd + R`
- Android Emulator: `Cmd + M` → Reload
- Physical Device: Shake device → Reload

### Debugging

#### React Native Debugger

1. **Install React Native Debugger**:
   ```bash
   brew install --cask react-native-debugger
   ```

2. **Open debugger**:
   ```bash
   open "rndebugger://set-debugger-loc?host=localhost&port=8081"
   ```

3. **Enable debug mode** in app:
   - Shake device → Enable Remote JS Debugging

#### Expo Dev Tools

Access Expo Dev Tools at `http://localhost:8081`:

- **Component Inspector**: Inspect component hierarchy
- **Performance Monitor**: Track FPS, memory usage
- **Network Inspector**: View API requests
- **Console**: View logs and errors

#### Console Logging

```typescript
// Standard console logging
console.log('Dossier loaded:', dossier);
console.warn('API deprecation warning');
console.error('Failed to fetch data', error);

// Grouped logs
console.group('Sync Operation');
console.log('Pulling changes...');
console.log('Pushing changes...');
console.groupEnd();

// Debug-only logs (removed in production)
if (__DEV__) {
  console.log('[DEBUG] Database initialized');
}
```

---

## Part 5: Testing (15 minutes)

### Unit Tests (Jest + React Native Testing Library)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/components/DossierCard.test.tsx
```

**Example Test**:

```typescript
// src/components/DossierCard.test.tsx
import { render, screen } from '@testing-library/react-native';
import DossierCard from './DossierCard';

describe('DossierCard', () => {
  it('should render dossier name in English', () => {
    const dossier = {
      id: '123',
      name_en: 'Germany',
      name_ar: 'ألمانيا',
      status: 'active',
    };

    render(<DossierCard dossier={dossier} locale="en" />);

    expect(screen.getByText('Germany')).toBeTruthy();
  });

  it('should render dossier name in Arabic with RTL', () => {
    const dossier = {
      id: '123',
      name_en: 'Germany',
      name_ar: 'ألمانيا',
      status: 'active',
    };

    render(<DossierCard dossier={dossier} locale="ar" />);

    expect(screen.getByText('ألمانيا')).toBeTruthy();
    // Check RTL layout
    const card = screen.getByTestId('dossier-card');
    expect(card.props.style).toMatchObject({ flexDirection: 'row-reverse' });
  });
});
```

### E2E Tests (Maestro)

```bash
# Install Maestro CLI
brew tap mobile-dev-inc/tap
brew install maestro

# Run E2E tests on iOS simulator
maestro test mobile/.maestro/login.yaml

# Run E2E tests on Android emulator
maestro test mobile/.maestro/dossier-list.yaml

# Run all E2E tests
maestro test mobile/.maestro/
```

**Example E2E Test** (`.maestro/login.yaml`):

```yaml
appId: com.stats.intldossier
---
- launchApp
- tapOn: "Login"
- inputText: "kazahrani@stats.gov.sa"
- tapOn: "Password"
- inputText: "itisme"
- tapOn: "Sign In"
- assertVisible: "Home"
- assertVisible: "Dossiers"
```

---

## Part 6: Building for Production (10 minutes)

### Configure EAS Build

Edit `eas.json`:

```json
{
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
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Build iOS App

```bash
# Build for iOS App Store
eas build --profile production --platform ios

# Wait for build to complete (15-30 minutes)
# Download IPA when ready

# Submit to App Store (requires Apple Developer account)
eas submit --platform ios
```

### Build Android App

```bash
# Build for Google Play Store
eas build --profile production --platform android

# Wait for build to complete (10-20 minutes)
# Download AAB when ready

# Submit to Google Play (requires Google Play Console account)
eas submit --platform android
```

### Build Configuration

**iOS Build Settings** (`app.json`):

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.stats.intldossier",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Allow camera access to scan documents",
        "NSFaceIDUsageDescription": "Enable Face ID for secure app unlock"
      }
    }
  }
}
```

**Android Build Settings** (`app.json`):

```json
{
  "expo": {
    "android": {
      "package": "com.stats.intldossier",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1B5B5A"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.USE_BIOMETRIC"
      ]
    }
  }
}
```

---

## Part 7: Common Issues & Solutions

### Issue: "Expo CLI not found"

**Solution**:
```bash
npm install -g expo-cli@latest
npm install -g eas-cli@latest
```

### Issue: "Metro bundler failed to start"

**Solution**:
```bash
# Clear Metro cache
npm run start -- --clear

# Reset Metro bundler
rm -rf node_modules/.cache
npm run start
```

### Issue: "WatermelonDB build error"

**Solution**:
```bash
# iOS: Reinstall pods
cd ios && pod install && cd ..

# Android: Clean Gradle cache
cd android && ./gradlew clean && cd ..
```

### Issue: "Biometrics not working on simulator"

**Explanation**: Face ID/Touch ID require physical devices for full functionality.

**Workaround** (iOS Simulator only):
- Features → Face ID → Enrolled
- Features → Face ID → Matching Face (when prompted)

### Issue: "Push notifications not received"

**Solution**:
1. Verify Expo Project ID in `.env`
2. Check device token registration: `eas device:list`
3. Test with Expo Push Tool: `https://expo.dev/notifications`
4. Ensure app has notification permissions: Settings → Notifications

### Issue: "App crashes on startup"

**Solution**:
```bash
# Check error logs
npx expo start

# View device logs
# iOS: Console.app (filter by "Expo")
# Android: adb logcat | grep "ReactNative"

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Part 8: Next Steps

### 1. Explore Sample Data

The app includes seed data for testing:

- **3 sample dossiers**: Germany, United Nations, G20 Summit
- **5 calendar events**: Upcoming meetings and deadlines
- **2 intelligence signals**: Sample alerts
- **1 intake ticket**: Pending approval

**Login Credentials** (Staging):
- Email: `kazahrani@stats.gov.sa`
- Password: `itisme`

### 2. Implement Features

Follow the implementation tasks in `specs/021-apply-gusto-design/tasks.md`:

1. **Phase 1**: WatermelonDB schema and sync service
2. **Phase 2**: Bottom tab navigation with 5 tabs
3. **Phase 3**: Dossier screens (list, detail, edit)
4. **Phase 4**: Calendar, search, profile screens
5. **Phase 5**: Biometric authentication and push notifications

### 3. Learn Key Concepts

- **React Navigation**: [reactnavigation.org/docs](https://reactnavigation.org/docs/getting-started)
- **WatermelonDB**: [watermelondb.dev/docs](https://watermelondb.dev/docs)
- **React Native Paper**: [callstack.github.io/react-native-paper](https://callstack.github.io/react-native-paper/)
- **Expo SDK**: [docs.expo.dev](https://docs.expo.dev/)

### 4. Join Community

- **Expo Discord**: [expo.dev/discord](https://expo.dev/discord)
- **React Native Discord**: [reactnative.dev/community](https://reactnative.dev/community)
- **Stack Overflow**: Tag questions with `expo`, `react-native`

---

## Troubleshooting Checklist

Before asking for help, verify:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ Expo CLI installed (`expo --version`)
- ✅ Environment variables configured (`.env` file)
- ✅ Dependencies installed (`npm install` in `mobile/`)
- ✅ Metro bundler running (`npm run start`)
- ✅ Physical device on same WiFi OR USB debugging enabled
- ✅ Expo Go app installed (for managed workflow)
- ✅ No firewall blocking port 8081

---

## Performance Tips

### 1. Enable Hermes Engine

Hermes provides faster startup and lower memory usage:

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### 2. Optimize Images

Use optimized image formats:

```bash
# Install Sharp for image optimization
npm install --save-dev sharp-cli

# Optimize PNG images
npx sharp -i assets/images/*.png -o assets/images-optimized/ --format webp
```

### 3. Use Production Build for Testing

Development builds include debugging overhead. Test performance on production builds:

```bash
eas build --profile preview --platform ios
```

### 4. Enable Flipper (Optional)

Flipper provides advanced debugging tools:

```bash
# Install Flipper
brew install --cask flipper

# Enable Flipper in app
# Already configured in this project
```

---

## Additional Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [WatermelonDB Sync Guide](https://watermelondb.dev/docs/Sync/Intro)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### Design System

- [Gusto Mobile Design Analysis](../mobile/GUSTO_DESIGN_ANALYSIS.md)
- [Material Design 3](https://m3.material.io/)
- [React Native Paper Theming](https://callstack.github.io/react-native-paper/docs/guides/theming)

### Architecture

- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)
- [Research Findings](./research.md)

### Tools

- [Expo Snack](https://snack.expo.dev/) - Online playground for testing code
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Maestro Studio](https://maestro.mobile.dev/getting-started/installing-maestro) - E2E test recorder

---

## Support

### Internal Support

- **Slack Channel**: #intl-dossier-mobile
- **Email**: mobile-support@stats.gov.sa
- **Documentation**: `specs/021-apply-gusto-design/`

### External Support

- **Expo Forums**: [forums.expo.dev](https://forums.expo.dev/)
- **React Native Community**: [reactnative.dev/community](https://reactnative.dev/community)
- **Stack Overflow**: Tag questions with `expo`, `react-native`, `watermelondb`

---

## Congratulations! 🎉

You've successfully set up the Intl-Dossier mobile development environment. You're now ready to start building features and contributing to the project.

**Next Steps**:
1. Run the app on your device or simulator
2. Explore the sample data and navigation
3. Review the feature specification and implementation plan
4. Start implementing tasks from `tasks.md`
5. Join the team Slack channel for support

Happy coding! 🚀
