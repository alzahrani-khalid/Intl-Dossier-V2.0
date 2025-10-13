# API Contract: Biometric Authentication

**Feature**: 021-apply-gusto-design
**Created**: 2025-10-13
**Version**: 1.0
**Base URL**: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1`

## Overview

The Biometric Authentication API enables secure app unlock and access to confidential dossier content using device biometrics (Face ID, Touch ID, fingerprint). It integrates with Expo's `expo-local-authentication` module and Supabase Auth for JWT token management.

### Key Features

1. **Device Biometric Support**: Face ID (iOS), Touch ID (iOS), Fingerprint (Android)
2. **Two-Factor Authentication**: Biometrics as second factor for sensitive operations
3. **Secure Token Storage**: JWT tokens stored in device Keychain/Keystore via `expo-secure-store`
4. **Session Management**: Biometric re-authentication after app backgrounding (5-minute timeout)
5. **Fallback Authentication**: Password fallback when biometrics fail or unavailable
6. **Confidential Content Access**: Biometric-gated dossier details, documents, signals

### Security Model

- **Primary Auth**: Supabase Auth (email/password) for initial login
- **Biometric Auth**: Device-level authentication for app unlock and confidential content
- **Token Refresh**: Automatic JWT refresh with biometric re-authentication every 7 days
- **Secure Storage**: All tokens stored in device Keychain (iOS) or Keystore (Android)

## Client-Side Biometric Flow

### 1. Check Biometric Availability

Before enabling biometric authentication, check device support:

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function checkBiometricSupport(): Promise<BiometricSupport> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    return { supported: false, type: null };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return { supported: true, enrolled: false, type: null };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const biometricType = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  )
    ? 'face_id'
    : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ? 'fingerprint'
    : 'iris';

  return { supported: true, enrolled: true, type: biometricType };
}

interface BiometricSupport {
  supported: boolean;
  enrolled: boolean;
  type: 'face_id' | 'fingerprint' | 'iris' | null;
}
```

### 2. Enable Biometric Authentication

User enables biometrics in app settings after successful password login:

```typescript
import * as SecureStore from 'expo-secure-store';

async function enableBiometricAuth(jwtToken: string): Promise<boolean> {
  try {
    // 1. Verify biometric support
    const support = await checkBiometricSupport();
    if (!support.supported || !support.enrolled) {
      throw new Error('Biometrics not available on this device');
    }

    // 2. Prompt user to authenticate with biometrics
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric unlock',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    // 3. Store JWT token securely
    await SecureStore.setItemAsync('auth_token', jwtToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });

    // 4. Mark biometric auth as enabled
    await SecureStore.setItemAsync('biometric_enabled', 'true');

    return true;
  } catch (error) {
    console.error('Failed to enable biometric auth:', error);
    return false;
  }
}
```

### 3. Authenticate with Biometrics (App Unlock)

When user reopens the app after backgrounding:

```typescript
async function authenticateWithBiometrics(): Promise<string | null> {
  try {
    // 1. Check if biometrics are enabled
    const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
    if (biometricEnabled !== 'true') {
      return null;
    }

    // 2. Prompt biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Intl-Dossier',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (!result.success) {
      return null;
    }

    // 3. Retrieve stored JWT token
    const jwtToken = await SecureStore.getItemAsync('auth_token');
    return jwtToken;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return null;
  }
}
```

### 4. Access Confidential Content

For accessing sensitive dossier information (e.g., intelligence signals, confidential documents):

```typescript
async function accessConfidentialContent(dossierId: string): Promise<boolean> {
  try {
    // 1. Prompt biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to view confidential content',
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    // 2. Fetch confidential content (JWT token already in Supabase client)
    const { data, error } = await supabase
      .from('intelligence_signals')
      .select('*')
      .eq('dossier_id', dossierId)
      .eq('is_confidential', true);

    if (error) throw error;

    // 3. Display content
    return true;
  } catch (error) {
    console.error('Failed to access confidential content:', error);
    return false;
  }
}
```

### 5. Disable Biometric Authentication

User can disable biometrics from app settings:

```typescript
async function disableBiometricAuth(): Promise<void> {
  await SecureStore.deleteItemAsync('biometric_enabled');
  // Keep auth_token for password-based sessions
  console.log('Biometric authentication disabled');
}
```

## Server-Side API (Optional)

While biometric authentication is primarily client-side, the backend can track biometric enrollment for analytics and security audits.

### 1. Record Biometric Enrollment

**Endpoint**: `POST /auth-biometric-setup`

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body**:

```typescript
interface BiometricSetupRequest {
  enabled: boolean;
  biometric_type: 'face_id' | 'fingerprint' | 'iris';
  device_id: string;                    // Unique device identifier
  device_type: 'ios' | 'android';
}
```

**Request Example**:

```json
{
  "enabled": true,
  "biometric_type": "face_id",
  "device_id": "device-uuid-123",
  "device_type": "ios"
}
```

**Response Success (200 OK)**:

```json
{
  "user_id": "user-uuid-456",
  "biometric_enabled": true,
  "biometric_type": "face_id",
  "updated_at": 1697560000000
}
```

**Response Schema**:

```typescript
interface BiometricSetupResponse {
  user_id: string;
  biometric_enabled: boolean;
  biometric_type: 'face_id' | 'fingerprint' | 'iris';
  updated_at: number;
}
```

### 2. Fetch Biometric Status

**Endpoint**: `GET /auth-biometric-setup`

**Request Headers**:

```
Authorization: Bearer <supabase_jwt_token>
```

**Response Success (200 OK)**:

```json
{
  "user_id": "user-uuid-456",
  "biometric_enabled": true,
  "biometric_type": "face_id",
  "device_id": "device-uuid-123",
  "enabled_at": 1697560000000
}
```

## Session Management with Biometrics

### Background Timeout (5 Minutes)

When the app is backgrounded for more than 5 minutes, require biometric re-authentication:

```typescript
import { AppState, AppStateStatus } from 'react-native';

let backgroundTime: number | null = null;
const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes

AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
  if (nextAppState === 'background') {
    backgroundTime = Date.now();
  } else if (nextAppState === 'active') {
    if (backgroundTime && Date.now() - backgroundTime > BIOMETRIC_TIMEOUT) {
      // Require biometric re-authentication
      const authenticated = await authenticateWithBiometrics();
      if (!authenticated) {
        // Redirect to login screen
        navigation.navigate('Login');
      }
    }
    backgroundTime = null;
  }
});
```

### Token Refresh with Biometrics

Refresh JWT tokens every 7 days with biometric re-authentication:

```typescript
async function refreshTokenWithBiometrics(): Promise<boolean> {
  try {
    // 1. Check token expiry
    const storedToken = await SecureStore.getItemAsync('auth_token');
    if (!storedToken) return false;

    const decodedToken = jwtDecode(storedToken);
    const tokenAge = Date.now() - decodedToken.iat * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (tokenAge < sevenDays) {
      return true; // Token still valid
    }

    // 2. Prompt biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Re-authenticate to refresh session',
      fallbackLabel: 'Use password',
    });

    if (!result.success) {
      return false;
    }

    // 3. Refresh token via Supabase
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;

    // 4. Store new token
    await SecureStore.setItemAsync('auth_token', data.session.access_token);

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}
```

## Biometric Authentication Strategies

### Strategy 1: App Unlock Only

Biometrics used only for unlocking the app after backgrounding. All API calls use stored JWT token.

**Pros**: Simple, fast, seamless UX
**Cons**: Less secure for highly confidential content
**Use Case**: General dossier browsing, calendar, profile

### Strategy 2: Confidential Content Gating

Biometrics required for accessing specific confidential content (intelligence signals, classified documents).

**Pros**: Balances security and UX
**Cons**: Requires multiple biometric prompts for different content
**Use Case**: Intelligence signals, classified documents, sensitive reports

### Strategy 3: Per-Action Authentication (Recommended)

Biometrics required for sensitive actions (delete dossier, approve assignment, export data).

**Pros**: Maximum security for critical operations
**Cons**: May feel intrusive for frequent actions
**Use Case**: Delete operations, approvals, exports

### Recommended Hybrid Approach

- **App Unlock**: Biometric required after 5-minute background timeout
- **Confidential Content**: Biometric required for `is_confidential=true` dossiers/signals
- **Critical Actions**: Biometric required for delete, approve, export operations
- **Token Refresh**: Biometric required every 7 days

## Error Handling

### Client-Side Error Codes

```typescript
enum BiometricError {
  NOT_AVAILABLE = 'biometric_not_available',
  NOT_ENROLLED = 'biometric_not_enrolled',
  USER_CANCELED = 'user_canceled',
  AUTHENTICATION_FAILED = 'authentication_failed',
  LOCKOUT = 'biometric_lockout',
  SYSTEM_ERROR = 'system_error',
}

async function handleBiometricError(error: BiometricError): Promise<void> {
  switch (error) {
    case BiometricError.NOT_AVAILABLE:
      Alert.alert('Biometrics Unavailable', 'This device does not support biometric authentication.');
      break;

    case BiometricError.NOT_ENROLLED:
      Alert.alert('No Biometrics Enrolled', 'Please set up Face ID or Touch ID in device settings.');
      break;

    case BiometricError.USER_CANCELED:
      // User canceled authentication, do nothing
      break;

    case BiometricError.AUTHENTICATION_FAILED:
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again.');
      break;

    case BiometricError.LOCKOUT:
      Alert.alert(
        'Biometrics Locked',
        'Too many failed attempts. Please unlock your device and try again.'
      );
      break;

    case BiometricError.SYSTEM_ERROR:
      Alert.alert('System Error', 'An error occurred. Please restart the app.');
      break;
  }
}
```

### Fallback to Password

When biometrics fail or are unavailable:

```typescript
async function authenticateWithFallback(): Promise<boolean> {
  try {
    // 1. Try biometric authentication
    const biometricResult = await authenticateWithBiometrics();
    if (biometricResult) {
      return true;
    }

    // 2. Fallback to password
    const passwordResult = await promptPasswordAuthentication();
    return passwordResult;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

async function promptPasswordAuthentication(): Promise<boolean> {
  // Show password input modal
  const password = await showPasswordPrompt();

  // Verify password with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password,
  });

  if (error) {
    Alert.alert('Login Failed', error.message);
    return false;
  }

  // Store new JWT token
  await SecureStore.setItemAsync('auth_token', data.session.access_token);
  return true;
}
```

## Security Best Practices

1. **Never Store Passwords**: Only store JWT tokens, never raw passwords
2. **Keychain/Keystore Only**: Use `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` accessibility
3. **Biometric Lockout**: Implement exponential backoff after 3 failed biometric attempts
4. **Token Rotation**: Refresh JWT tokens every 7 days with biometric re-authentication
5. **Device-Specific Tokens**: Never sync biometric tokens across devices
6. **Audit Logging**: Log all biometric authentication attempts (success/failure) for security audits
7. **Wipe on Uninstall**: Tokens automatically deleted when app is uninstalled (handled by OS)

## Testing Strategy

### Unit Tests

```typescript
describe('Biometric Authentication - Check Support', () => {
  it('should detect Face ID support on iOS', async () => {
    jest.spyOn(LocalAuthentication, 'hasHardwareAsync').mockResolvedValue(true);
    jest.spyOn(LocalAuthentication, 'isEnrolledAsync').mockResolvedValue(true);
    jest
      .spyOn(LocalAuthentication, 'supportedAuthenticationTypesAsync')
      .mockResolvedValue([LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]);

    const support = await checkBiometricSupport();

    expect(support.supported).toBe(true);
    expect(support.enrolled).toBe(true);
    expect(support.type).toBe('face_id');
  });

  it('should detect fingerprint support on Android', async () => {
    jest.spyOn(LocalAuthentication, 'hasHardwareAsync').mockResolvedValue(true);
    jest.spyOn(LocalAuthentication, 'isEnrolledAsync').mockResolvedValue(true);
    jest
      .spyOn(LocalAuthentication, 'supportedAuthenticationTypesAsync')
      .mockResolvedValue([LocalAuthentication.AuthenticationType.FINGERPRINT]);

    const support = await checkBiometricSupport();

    expect(support.supported).toBe(true);
    expect(support.type).toBe('fingerprint');
  });
});

describe('Biometric Authentication - Enable', () => {
  it('should enable biometric auth after successful authentication', async () => {
    jest.spyOn(LocalAuthentication, 'authenticateAsync').mockResolvedValue({
      success: true,
    });

    const result = await enableBiometricAuth('test-jwt-token');

    expect(result).toBe(true);
    const storedToken = await SecureStore.getItemAsync('auth_token');
    expect(storedToken).toBe('test-jwt-token');
  });

  it('should fail to enable if biometric authentication fails', async () => {
    jest.spyOn(LocalAuthentication, 'authenticateAsync').mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });

    const result = await enableBiometricAuth('test-jwt-token');

    expect(result).toBe(false);
  });
});
```

### Integration Tests (Manual)

1. **Enable Biometrics**:
   - Login with password
   - Enable biometrics in settings
   - Verify Face ID/Touch ID prompt appears
   - Verify success confirmation

2. **App Unlock**:
   - Background app for 6 minutes
   - Reopen app
   - Verify biometric prompt appears
   - Authenticate successfully
   - Verify app unlocks to last screen

3. **Confidential Content Access**:
   - Navigate to intelligence signal (confidential)
   - Verify biometric prompt appears
   - Authenticate successfully
   - Verify content is displayed

4. **Token Refresh**:
   - Wait 7 days (or manipulate system clock)
   - Open app
   - Verify biometric re-authentication prompt
   - Verify token is refreshed after successful auth

5. **Fallback to Password**:
   - Trigger biometric prompt
   - Cancel biometric authentication
   - Verify password fallback prompt appears
   - Enter password
   - Verify successful authentication

## Performance Expectations

- **Biometric Check**: ≤100ms
- **Enable Biometrics**: ≤2s (includes user authentication time)
- **App Unlock**: ≤1s (from biometric prompt to unlock)
- **Confidential Content Access**: ≤500ms (biometric check only)
- **Token Refresh**: ≤3s (includes Supabase API call)

## Platform-Specific Considerations

### iOS

- **Face ID**: Requires `NSFaceIDUsageDescription` in `app.json`
- **Touch ID**: Requires `NSFaceIDUsageDescription` (same key for both)
- **Keychain Access**: Tokens stored in iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- **Background Timeout**: App state change triggers biometric re-auth

### Android

- **Fingerprint**: Requires `USE_BIOMETRIC` permission in `app.json`
- **Keystore**: Tokens stored in Android Keystore
- **Authentication Prompt**: Custom prompt UI for fingerprint (Material Design 3)
- **Fallback**: PIN/pattern fallback if fingerprint fails

## References

- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [iOS Face ID / Touch ID](https://developer.apple.com/documentation/localauthentication)
- [Android BiometricPrompt](https://developer.android.com/training/sign-in/biometric-auth)
- Feature Specification: `specs/021-apply-gusto-design/spec.md`
- Data Model: `specs/021-apply-gusto-design/data-model.md`
