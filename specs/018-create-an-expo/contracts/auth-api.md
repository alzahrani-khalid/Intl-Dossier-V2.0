# Authentication API Contract: Mobile App Authentication

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Purpose**: Define authentication endpoints for mobile app login, biometric authentication, and session management

---

## Overview

The mobile app uses **Supabase Auth** for authentication. This contract defines the authentication flows supported by the mobile app:

1. **Email/Password Login**: Standard email and password authentication
2. **Biometric Authentication**: Local biometric verification (Face ID, Touch ID, fingerprint) for returning users
3. **Session Management**: JWT token refresh and logout

### Authentication Flow

```
User Opens App
    ↓
Check Local Session
    ↓
Session Valid? → Yes → Load App (Auto-Refresh Token if Needed)
    ↓ No
Biometric Enabled? → Yes → Prompt Biometric → Success → Load App
    ↓ No                        ↓ Fail
Login Screen                Login Screen
    ↓
Email/Password Login
    ↓
Success → Enable Biometric? → Yes → Store Token Securely
    ↓                          ↓ No
Load App                   Load App
```

---

## Base URL

All authentication endpoints use the Supabase Auth API:

```
https://zkrcjzdemdmwhearhfgg.supabase.co/auth/v1
```

---

## 1. Email/Password Login

**Endpoint**: `POST /token?grant_type=password`

**Description**: Authenticate user with email and password. Returns access token (JWT) and refresh token.

### Request

```json
{
  "email": "analyst@gastat.gov.sa",
  "password": "SecurePassword123!"
}
```

**Request Schema**:
- `email` (string, required): User's email address
- `password` (string, required): User's password (minimum 8 characters)

**Headers**:
```
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1696125600,
  "refresh_token": "v1.MRjcF5LkPBJfGc5w...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "analyst@gastat.gov.sa",
    "email_confirmed_at": "2025-09-15T10:30:00.000Z",
    "phone": "",
    "confirmed_at": "2025-09-15T10:30:00.000Z",
    "last_sign_in_at": "2025-10-10T12:00:00.000Z",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "name": "Ahmed Al-Zahrani",
      "role": "analyst",
      "assigned_countries": ["SA", "AE", "KW"],
      "language": "ar"
    },
    "identities": [
      {
        "identity_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "identity_data": {
          "email": "analyst@gastat.gov.sa",
          "email_verified": true,
          "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        },
        "provider": "email",
        "last_sign_in_at": "2025-10-10T12:00:00.000Z",
        "created_at": "2025-09-15T10:30:00.000Z",
        "updated_at": "2025-10-10T12:00:00.000Z"
      }
    ],
    "created_at": "2025-09-15T10:30:00.000Z",
    "updated_at": "2025-10-10T12:00:00.000Z"
  }
}
```

**Response Schema**:
- `access_token` (string): JWT token for API authentication (expires in 1 hour)
- `token_type` (string): Always `"bearer"`
- `expires_in` (number): Token expiration time in seconds (3600 = 1 hour)
- `expires_at` (number): Unix timestamp when token expires
- `refresh_token` (string): Token used to obtain new access token (expires in 30 days)
- `user` (object): User profile data including metadata

### Response (Error - Invalid Credentials)

**Status**: `400 Bad Request`

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```

### Response (Error - Rate Limited)

**Status**: `429 Too Many Requests`

```json
{
  "error": "rate_limit_exceeded",
  "error_description": "Too many login attempts. Please try again in 60 seconds."
}
```

---

## 2. Refresh Access Token

**Endpoint**: `POST /token?grant_type=refresh_token`

**Description**: Obtain a new access token using a valid refresh token. Should be called when access token expires (after 1 hour) or before it expires (recommended at 50 minutes).

### Request

```json
{
  "refresh_token": "v1.MRjcF5LkPBJfGc5w..."
}
```

**Request Schema**:
- `refresh_token` (string, required): Valid refresh token from previous login

**Headers**:
```
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1696129200,
  "refresh_token": "v1.NewRefreshToken...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "analyst@gastat.gov.sa",
    ...
  }
}
```

**Response Schema**: Same as login response

### Response (Error - Invalid Refresh Token)

**Status**: `400 Bad Request`

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid refresh token"
}
```

---

## 3. Logout

**Endpoint**: `POST /logout`

**Description**: Revoke the user's access token and refresh token, ending the session.

### Request

**Headers**:
```
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <access_token>
```

**Body**: Empty or `{}`

### Response (Success)

**Status**: `204 No Content`

(No response body)

---

## 4. Get Current User

**Endpoint**: `GET /user`

**Description**: Retrieve the authenticated user's profile. Used to verify session validity and fetch updated user metadata.

### Request

**Headers**:
```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "analyst@gastat.gov.sa",
  "email_confirmed_at": "2025-09-15T10:30:00.000Z",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "name": "Ahmed Al-Zahrani",
    "role": "analyst",
    "assigned_countries": ["SA", "AE", "KW"],
    "language": "ar"
  },
  "created_at": "2025-09-15T10:30:00.000Z",
  "updated_at": "2025-10-10T12:00:00.000Z"
}
```

### Response (Error - Unauthorized)

**Status**: `401 Unauthorized`

```json
{
  "error": "invalid_token",
  "error_description": "JWT token is invalid or expired"
}
```

---

## 5. Update User Metadata

**Endpoint**: `PUT /user`

**Description**: Update user preferences such as language, notification settings, and biometric enablement. This is one of the few write operations supported by the mobile app.

### Request

```json
{
  "data": {
    "language": "en",
    "notification_preferences": {
      "dossier_assignments": true,
      "brief_assignments": false,
      "intake_assignments": true
    },
    "biometric_enabled": true
  }
}
```

**Request Schema**:
- `data` (object, required): User metadata object
  - `language` (string, optional): Preferred language (`"en"` or `"ar"`)
  - `notification_preferences` (object, optional): Notification settings by assignment type
  - `biometric_enabled` (boolean, optional): Whether biometric auth is enabled

**Headers**:
```
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "analyst@gastat.gov.sa",
  "user_metadata": {
    "name": "Ahmed Al-Zahrani",
    "role": "analyst",
    "assigned_countries": ["SA", "AE", "KW"],
    "language": "en",
    "notification_preferences": {
      "dossier_assignments": true,
      "brief_assignments": false,
      "intake_assignments": true
    },
    "biometric_enabled": true
  },
  "updated_at": "2025-10-10T12:30:00.000Z"
}
```

---

## Biometric Authentication (Client-Side)

Biometric authentication is handled entirely on the mobile device using **expo-local-authentication**. The server is not involved in biometric verification.

### Biometric Flow

1. **First-Time Login**: User logs in with email/password
2. **Prompt to Enable Biometrics**: App asks if user wants to enable biometric login
3. **Store Tokens Securely**: If enabled, store refresh token in **expo-secure-store** (encrypted keychain/keystore)
4. **Subsequent Logins**: Prompt biometric authentication → Retrieve refresh token from secure store → Call refresh token endpoint → Load app

### Implementation Example

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Check if biometric hardware is available
const isBiometricAvailable = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
};

// Enable biometric login (after successful email/password login)
const enableBiometricLogin = async (refreshToken: string) => {
  await SecureStore.setItemAsync('refresh_token', refreshToken);
  await SecureStore.setItemAsync('biometric_enabled', 'true');
};

// Authenticate with biometrics
const authenticateWithBiometrics = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your dossiers',
    fallbackLabel: 'Use password',
    disableDeviceFallback: false,
  });

  if (result.success) {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    // Call refresh token endpoint with refreshToken
    return refreshToken;
  }

  return null;
};

// Disable biometric login
const disableBiometricLogin = async () => {
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('biometric_enabled');
};
```

---

## Session Management

### Token Expiration

- **Access Token**: Expires after **1 hour** (3600 seconds)
- **Refresh Token**: Expires after **30 days** (2592000 seconds)

### Auto-Refresh Strategy

The mobile app should automatically refresh the access token before it expires to prevent interruptions:

```typescript
const autoRefreshToken = async () => {
  // Refresh token 10 minutes before expiration (50 minutes after login)
  const refreshAt = expiresAt - (10 * 60 * 1000);

  setTimeout(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (data.session) {
      // Update stored tokens
      await SecureStore.setItemAsync('access_token', data.session.access_token);
      await SecureStore.setItemAsync('refresh_token', data.session.refresh_token);
    }
  }, refreshAt - Date.now());
};
```

### Session Timeout

If the user is inactive for **30 minutes**, the app should:

1. Lock the screen
2. Prompt biometric authentication or email/password login
3. Refresh the session before resuming

---

## Rate Limiting

Authentication endpoints have strict rate limits to prevent brute-force attacks:

- **Login**: 5 attempts per 5 minutes per IP address
- **Refresh Token**: 30 requests per minute per user
- **Logout**: 10 requests per minute per user
- **Get User**: 60 requests per minute per user
- **Update User**: 30 requests per minute per user

**Rate Limit Response**:

**Status**: `429 Too Many Requests`

```json
{
  "error": "rate_limit_exceeded",
  "error_description": "Too many requests. Retry after 60 seconds.",
  "retry_after": 60
}
```

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_grant` | 400 | Invalid credentials or refresh token |
| `invalid_request` | 400 | Malformed request body |
| `invalid_token` | 401 | JWT token invalid or expired |
| `rate_limit_exceeded` | 429 | Too many authentication attempts |
| `server_error` | 500 | Internal server error |

---

## Security Considerations

1. **HTTPS Only**: All authentication traffic encrypted with TLS 1.3
2. **Secure Token Storage**: Tokens stored in expo-secure-store (iOS Keychain, Android Keystore)
3. **Token Rotation**: Refresh tokens rotated on each refresh (old token invalidated)
4. **Biometric Fallback**: Users can always fall back to email/password if biometrics fail
5. **Session Timeout**: Automatic session timeout after 30 minutes of inactivity
6. **Rate Limiting**: Prevents brute-force attacks on login endpoint
7. **No Password Storage**: Password never stored locally (only tokens)

---

## Performance Targets

- **Login**: < 2 seconds on 4G
- **Refresh Token**: < 500ms on 4G
- **Logout**: < 300ms
- **Get User**: < 200ms
- **Biometric Prompt**: < 1 second to display

---

## Implementation Notes

### Supabase Client Configuration

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://zkrcjzdemdmwhearhfgg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Login Flow Implementation

```typescript
const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Prompt to enable biometrics
  const biometricAvailable = await isBiometricAvailable();
  if (biometricAvailable) {
    // Show prompt to enable biometric login
    const enableBiometric = await showBiometricPrompt();
    if (enableBiometric) {
      await enableBiometricLogin(data.session.refresh_token);
    }
  }

  return data.user;
};
```
