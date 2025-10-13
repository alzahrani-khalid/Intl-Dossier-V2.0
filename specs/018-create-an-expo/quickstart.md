# Quickstart Guide: Mobile Application Development

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Purpose**: Quick setup and development guide for the Expo mobile application

---

## Prerequisites

Before starting development, ensure you have the following installed:

### Required Software

1. **Node.js 20 LTS**
   ```bash
   node --version  # Should be v20.x.x
   npm --version   # Should be 10.x.x
   ```

2. **Expo CLI**
   ```bash
   npm install -g expo-cli eas-cli
   ```

3. **Git**
   ```bash
   git --version  # Any recent version
   ```

4. **Code Editor**: VS Code (recommended) with extensions:
   - ES7+ React/Redux/React-Native snippets
   - React Native Tools
   - ESLint
   - Prettier

### Optional (for Physical Device Testing)

5. **iOS Development** (macOS only):
   - Xcode 15+ (App Store)
   - iOS Simulator
   - Apple Developer Account (for device testing)

6. **Android Development**:
   - Android Studio (with Android SDK)
   - Android Emulator
   - Java Development Kit (JDK) 17

### Testing Tools

7. **Maestro** (E2E Testing):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   maestro --version
   ```

---

## Initial Setup

### 1. Clone Repository

```bash
cd /path/to/your/workspace
cd Intl-DossierV2.0

# Verify you're in the correct directory
ls -la  # Should see backend/, frontend/, mobile/ directories
```

### 2. Navigate to Mobile Directory

```bash
cd mobile
```

### 3. Install Dependencies

```bash
npm install
```

This will install all dependencies including:
- Expo SDK 52+
- React Navigation 7+
- React Native Paper 5.12+
- WatermelonDB 0.28+
- Supabase Client 2.58+
- Testing libraries (Jest, React Native Testing Library)

### 4. Configure Environment Variables

Create a `.env` file in the `mobile/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ

# Expo Configuration
EXPO_PUBLIC_API_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
EXPO_PROJECT_ID=your-expo-project-id

# Environment
NODE_ENV=development
```

### 5. Initialize Expo Project

```bash
npx expo start
```

You should see output like:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

---

## Running the App

### Option 1: Expo Go (Quickest)

**Pros**: No build required, instant preview
**Cons**: Limited to Expo Go-supported APIs

1. Install Expo Go on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start dev server:
   ```bash
   npx expo start
   ```

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

### Option 2: iOS Simulator (macOS only)

```bash
npx expo start --ios
```

This will:
1. Start Metro bundler
2. Build the app
3. Open iOS Simulator
4. Install and launch the app

### Option 3: Android Emulator

1. Start Android Emulator from Android Studio

2. Run:
   ```bash
   npx expo start --android
   ```

### Option 4: Physical Device (Development Build)

For testing native features (biometrics, push notifications):

1. Create development build:
   ```bash
   eas build --profile development --platform ios
   # or
   eas build --profile development --platform android
   ```

2. Install the development build on your device

3. Start dev server:
   ```bash
   npx expo start --dev-client
   ```

---

## Project Structure Overview

```
mobile/
├── app/                      # Expo Router file-based routing
│   ├── (auth)/               # Auth-gated routes
│   │   ├── (tabs)/           # Bottom tab navigator
│   │   │   ├── dossiers/     # Dossiers tab
│   │   │   ├── briefs/       # Briefs tab
│   │   │   └── profile/      # Profile tab
│   │   └── _layout.tsx       # Auth layout
│   ├── login.tsx             # Login screen
│   └── _layout.tsx           # Root layout
│
├── components/               # Reusable UI components
│   ├── ui/                   # Base UI (Button, Card, etc.)
│   ├── dossiers/             # Dossier-specific components
│   ├── briefs/               # Brief-specific components
│   └── shared/               # Shared components
│
├── services/                 # Business logic
│   ├── auth/                 # Authentication service
│   ├── sync/                 # Sync service
│   ├── notifications/        # Push notifications
│   └── api/                  # API client
│
├── database/                 # WatermelonDB
│   ├── models/               # Database models
│   ├── schema.ts             # Schema definition
│   └── sync.ts               # Sync adapters
│
├── hooks/                    # Custom React hooks
├── i18n/                     # Internationalization
├── types/                    # TypeScript types
├── utils/                    # Utility functions
└── tests/                    # Test files
```

---

## Development Workflow

### 1. Create a New Feature

```bash
# Create a new screen
touch app/(auth)/(tabs)/dossiers/filters.tsx

# Create a component
touch components/dossiers/DossierFilters.tsx

# Create a hook
touch hooks/useDossierFilters.ts
```

### 2. Test-First Development (TDD)

**Write the test first** (RED):

```typescript
// __tests__/components/DossierCard.test.tsx
import { render, screen } from '@testing-library/react-native';
import { DossierCard } from '@/components/dossiers/DossierCard';

describe('DossierCard', () => {
  it('should display dossier title', () => {
    render(<DossierCard title="Test Dossier" status="active" />);
    expect(screen.getByText('Test Dossier')).toBeTruthy();
  });
});
```

Run test (should fail):
```bash
npm test -- DossierCard.test.tsx
```

**Implement the component** (GREEN):

```typescript
// components/dossiers/DossierCard.tsx
import { Card, Text } from 'react-native-paper';

export function DossierCard({ title, status }) {
  return (
    <Card>
      <Card.Content>
        <Text>{title}</Text>
      </Card.Content>
    </Card>
  );
}
```

**Refactor** (REFACTOR):
```bash
npm test -- DossierCard.test.tsx  # Should pass
```

### 3. RTL/Internationalization

Always wrap text in translation:

```typescript
import { useTranslation } from 'react-i18next';

function DossierList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View dir={isRTL ? 'rtl' : 'ltr'}>
      <Text>{t('dossiers.title')}</Text>
    </View>
  );
}
```

Add translations:

```json
// i18n/en/dossiers.json
{
  "title": "Dossiers",
  "filters": {
    "status": "Status",
    "priority": "Priority"
  }
}

// i18n/ar/dossiers.json
{
  "title": "الملفات",
  "filters": {
    "status": "الحالة",
    "priority": "الأولوية"
  }
}
```

### 4. Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- DossierCard.test.tsx
```

### 5. Linting and Type Checking

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Fix linting errors
npm run lint -- --fix
```

---

## Testing

### Unit/Integration Tests (Jest + RNTL)

Run all tests:
```bash
npm test
```

Run specific test:
```bash
npm test -- hooks/useDossiers.test.ts
```

Generate coverage report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### E2E Tests (Maestro)

Run Maestro tests:
```bash
# Start app first
npx expo start

# In another terminal, run Maestro tests
maestro test .maestro/login-flow.yaml
```

Run all E2E tests:
```bash
maestro test .maestro/
```

### Manual Testing Checklist

Before submitting PR:

- [ ] Test on iOS Simulator (or physical iPhone)
- [ ] Test on Android Emulator (or physical Android device)
- [ ] Test in English (LTR)
- [ ] Test in Arabic (RTL)
- [ ] Test biometric authentication (physical device only)
- [ ] Test offline mode (Airplane mode)
- [ ] Test push notifications (physical device only)
- [ ] Test VoiceOver/TalkBack screen reader

---

## Common Commands

### Development

```bash
# Start dev server
npx expo start

# Clear cache
npx expo start --clear

# Open iOS simulator
npx expo start --ios

# Open Android emulator
npx expo start --android

# Run on physical device
npx expo start --dev-client
```

### Building

```bash
# Development build
eas build --profile development --platform all

# Preview build (TestFlight/Internal Testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
maestro test .maestro/

# Type check
npm run typecheck

# Lint
npm run lint
```

### Database

```bash
# Generate WatermelonDB models
npm run db:generate

# Reset local database (development only)
npm run db:reset
```

---

## Debugging

### React Native Debugger

1. Install React Native Debugger:
   ```bash
   brew install --cask react-native-debugger
   ```

2. Open React Native Debugger

3. In app, shake device and select "Debug JS Remotely"

### Expo Dev Client

Press `m` in terminal to open developer menu:
- **Reload**: `r`
- **Toggle Element Inspector**: `i`
- **Toggle Performance Monitor**: `p`
- **Open React DevTools**: (opens in browser)

### Console Logs

View logs:
```bash
# iOS
npx expo start --ios

# Android
npx expo start --android
```

All console.log() statements will appear in the terminal.

---

## Troubleshooting

### Issue: "Metro bundler failed to start"

**Solution**:
```bash
# Kill Metro processes
killall -9 node

# Clear Metro cache
npx expo start --clear
```

### Issue: "Unable to resolve module"

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: "Push notifications not working"

**Solution**:
- Push notifications only work on physical devices (not simulators)
- Ensure you've requested permission: `Notifications.requestPermissionsAsync()`
- Verify push token is registered with backend
- Check Expo push notification service status: https://status.expo.dev/

### Issue: "Biometric authentication fails"

**Solution**:
- Biometrics only work on physical devices
- Ensure device has biometrics enrolled (Settings > Face ID/Touch ID)
- Check `LocalAuthentication.hasHardwareAsync()` returns true
- Check `LocalAuthentication.isEnrolledAsync()` returns true

### Issue: "WatermelonDB sync fails"

**Solution**:
```bash
# Check network connectivity
# Verify Supabase backend is running
# Check RLS policies allow user to read data
# View sync logs in console
```

---

## Next Steps

1. **Read Documentation**:
   - `spec.md`: Feature specification and requirements
   - `data-model.md`: Database schema and relationships
   - `contracts/`: API endpoint specifications

2. **Explore Example Code**:
   - `app/(auth)/(tabs)/dossiers/index.tsx`: Dossier list screen
   - `components/dossiers/DossierCard.tsx`: Dossier card component
   - `hooks/useDossiers.ts`: Dossier data hook

3. **Start Implementing**:
   - Run `/speckit.tasks` to generate actionable tasks
   - Follow TDD workflow (RED → GREEN → REFACTOR)
   - Write tests first, then implement features

4. **Testing**:
   - Unit test all components and hooks
   - E2E test critical user flows
   - Manual test on both iOS and Android
   - Test RTL layout with Arabic language

---

## Resources

### Documentation

- **Expo**: https://docs.expo.dev/
- **React Native**: https://reactnavigation.org/
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **WatermelonDB**: https://watermelondb.dev/
- **Supabase**: https://supabase.com/docs
- **Maestro**: https://maestro.mobile.dev/

### Community

- **Expo Discord**: https://chat.expo.dev/
- **React Native Community**: https://www.reactnative.dev/community/overview
- **Stack Overflow**: Tag with `expo`, `react-native`, `watermelondb`

### Tools

- **Expo Snack**: https://snack.expo.dev/ (Online playground)
- **React Native Directory**: https://reactnative.directory/ (Find libraries)
- **Expo Status**: https://status.expo.dev/ (Service status)

---

## Getting Help

1. **Check Documentation**: Review spec.md, data-model.md, and API contracts
2. **Search Issues**: Check if issue already reported in GitHub Issues
3. **Ask Team**: Reach out to team members on Slack/Teams
4. **Create Issue**: Open a GitHub issue with reproduction steps

---

**Happy coding! 🚀**
