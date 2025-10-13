# Research: Mobile Application Technology Stack

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Purpose**: Resolve technical clarifications identified in Constitution Check for mobile app implementation

---

## 1. Testing Strategy Decision

### Decision
- **Primary Testing**: Jest + React Native Testing Library (RNTL)
- **E2E Testing**: Maestro (not Detox)
- **Test Configuration**: jest-expo preset

### Rationale
1. **Jest-expo** is the official Expo testing preset, fully compatible with SDK 52+ and automatically handles native module mocking
2. **React Native Testing Library** is the current industry standard (Enzyme deprecated in 2025), focuses on user behavior over implementation details, perfect for TDD
3. **Maestro** chosen over Detox because:
   - Easier setup with YAML-based syntax
   - Better CI/CD integration with EAS Workflows (now free tier)
   - Cross-platform support (iOS + Android)
   - Less flaky than Detox under CI load
   - Growing adoption in 2025 (companies like Jupiter switched from Detox)

### Alternatives Considered
- **Detox**: Rejected due to complex setup, flakiness in CI, requires native build hooks that break under load
- **Appium**: Rejected as overkill for Expo managed workflow, requires Selenium-style architecture
- **Expo Test Suite**: Not mature enough for comprehensive TDD workflow

### Implementation
```bash
# Unit/Integration Testing
npx expo install jest-expo jest @testing-library/react-native @testing-library/jest-native

# E2E Testing
curl -Ls "https://get.maestro.mobile.dev" | bash
mkdir .maestro
```

**TDD Workflow**:
1. **RED**: Write failing test with RNTL
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve with hooks, memoization, etc.

**Example Test Pattern**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

describe('LoginForm', () => {
  it('should authenticate user on valid credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    render(<LoginForm onLogin={mockLogin} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

**Maestro E2E Example** (`.maestro/login-flow.yaml`):
```yaml
appId: com.gastat.dossier
---
- launchApp
- tapOn: "Sign In"
- inputText: "test@example.com"
- inputText: "password123"
- tapOn: "Submit"
- assertVisible: "Welcome"
```

---

## 2. Accessibility Strategy Decision

### Decision
- **Manual Testing**: Required - VoiceOver (iOS) + TalkBack (Android) on physical devices
- **Automated Tools**: React Native AMA + color-contrast-checker
- **Accessibility Props**: All interactive elements require `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, `accessibilityState`

### Rationale
1. **Manual testing is mandatory** - automated tools cannot fully validate screen reader experience
2. **React Native AMA** is Expo-compatible (as of 2025) and provides runtime accessibility checks during development
3. **WCAG AA requirements**:
   - Touch targets: Minimum 24x24px (WCAG 2.2), recommended 44x44px
   - Color contrast: 4.5:1 for normal text, 3:1 for large text
   - Screen reader support for all interactive elements

### Alternatives Considered
- **axe-core**: Not available for React Native (web-only)
- **Detox accessibility testing**: Limited compared to manual VoiceOver/TalkBack testing
- **react-native-accessibility-engine**: Good but less comprehensive than AMA

### Implementation

**Required Accessibility Props for All Interactive Components**:
```typescript
<Pressable
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your registration"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  style={{ minHeight: 44, minWidth: 44 }}  // WCAG AA
>
  <Text>Submit</Text>
</Pressable>
```

**Color Contrast Validation**:
```typescript
import ColorContrastChecker from 'color-contrast-checker';

const checker = new ColorContrastChecker();
const isAA = checker.isLevelAA('#000000', '#FFFFFF', 16); // true
```

**Installation**:
```bash
npm install @react-native-ama/core color-contrast-checker
```

**Testing Checklist**:
- [ ] All interactive elements have `accessibilityLabel` and `accessibilityRole`
- [ ] Touch targets minimum 44x44px (or use `hitSlop`)
- [ ] Color contrast validated (4.5:1 normal text, 3:1 large text)
- [ ] VoiceOver/TalkBack manual testing completed on physical devices
- [ ] Text scaling tested (up to 200%)
- [ ] Focus order is logical
- [ ] Form errors announced via `accessibilityRole="alert"`
- [ ] Loading states use `accessibilityState={{ busy: true }}`

---

## 3. UI Library Decision

### Decision
**React Native Paper 5.12+** (Material Design 3)

### Rationale
1. **RTL Built-in**: Works with React Native's `I18nManager` automatically - components flip for Arabic/Hebrew without configuration
2. **WCAG AA Compliant**: Proper color contrast (4.5:1 for normal text), screen reader labels, keyboard navigation built into all components
3. **TypeScript Native**: Excellent type exports and IntelliSense support
4. **Expo SDK 52 Compatible**: Works seamlessly with Expo managed workflow
5. **Beginner-Friendly**: Simple API, extensive documentation, large community (25k+ GitHub stars)
6. **Active Maintenance**: Callstack actively maintains and updates regularly
7. **Material Design 3**: Modern "Material You" theming system with light/dark mode

### Alternatives Considered
- **gluestack-ui**: Excellent accessibility-first approach, but requires manual RTL configuration and has Expo SDK compatibility concerns (v3 targets SDK 53+)
- **Tamagui**: Best performance but steep learning curve, accessibility gaps, overkill for this app
- **NativeBase**: In maintenance mode (transitioning to gluestack-ui), known issues with Expo SDK 52
- **React Native Elements**: Limited RTL documentation and basic accessibility features
- **Custom Components**: Too much effort to build accessible + RTL-compatible components from scratch

### Pros of React Native Paper
✅ RTL support automatic (Arabic/Hebrew)
✅ Screen reader compatible (VoiceOver, TalkBack)
✅ Material Design consistency
✅ Active community (Callstack + 25k stars)
✅ Comprehensive documentation
✅ Expo managed workflow compatible
✅ Theming system with light/dark mode
✅ Bundle size optimization via Babel plugin

### Cons of React Native Paper
⚠️ Material Design may not fit all design systems (opinionated look)
⚠️ Medium bundle size without optimization (~350KB, reducible to ~150KB with Babel plugin)
⚠️ iOS RTL edge cases require app restart (React Native limitation, not Paper-specific)

### Implementation

**Installation**:
```bash
npx expo install react-native-paper react-native-safe-area-context react-native-vector-icons
npx expo install i18next react-i18next @react-native-async-storage/async-storage
npm install react-native-restart
```

**Bundle Optimization** (`babel.config.js`):
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-paper/babel', // Reduces bundle by excluding unused modules
    ],
  };
};
```

**RTL + Accessibility Example**:
```typescript
import { Provider as PaperProvider, DefaultTheme, Button } from 'react-native-paper';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

// WCAG AA compliant theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',    // 4.5:1 contrast on white
    text: '#212121',       // 16:1 contrast on white
    placeholder: '#757575', // 4.6:1 contrast on white
  },
};

function App() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <PaperProvider theme={theme}>
      <Button
        mode="contained"
        // Accessibility props
        accessibilityLabel={t('login')}
        accessibilityHint={t('hints.tapToLogin')}
        accessibilityRole="button"
        // WCAG AA: 44x44px touch target
        contentStyle={{ minHeight: 44 }}
      >
        {t('login')}
      </Button>
    </PaperProvider>
  );
}
```

**RTL Direction Change** (requires app restart on iOS):
```typescript
const changeLanguage = async (lang: string) => {
  const isRTL = lang === 'ar' || lang === 'he';
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem('language', lang);

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    RNRestart.Restart(); // Full app restart for RTL to take effect
  }
};
```

---

## Summary of Decisions

| Area | Decision | Key Reason |
|------|----------|-----------|
| **Unit Testing** | Jest + React Native Testing Library | Official Expo preset, TDD-friendly, industry standard |
| **E2E Testing** | Maestro | Easier than Detox, better CI/CD, EAS Workflows integration |
| **Accessibility Testing** | Manual (VoiceOver/TalkBack) + React Native AMA | Manual testing mandatory, AMA for runtime checks |
| **UI Library** | React Native Paper | Built-in RTL, WCAG AA compliant, Expo compatible, beginner-friendly |

All decisions support:
- ✅ Test-First Development (TDD workflow)
- ✅ WCAG AA Compliance (accessibility props + color contrast)
- ✅ Arabic RTL Support (automatic with Paper + I18nManager)
- ✅ TypeScript Strict Mode (all choices have excellent TS support)
- ✅ Expo SDK 52 Compatibility (verified for all tools)

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
