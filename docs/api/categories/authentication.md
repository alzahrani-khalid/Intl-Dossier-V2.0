# Authentication & MFA API

## Overview

The Authentication & MFA API provides comprehensive multi-factor authentication, biometric setup, step-up authentication, and token refresh capabilities. All endpoints support bilingual error messages (English/Arabic) and enforce secure authentication patterns.

## Endpoints

### Setup MFA

Setup multi-factor authentication for the authenticated user.

**Endpoint:** `POST /setup-mfa`

**Request Body:**
```json
{
  "method": "totp",
  "phone_number": "+966501234567"
}
```

**Response (200 OK):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "backup_codes": [
    "12345678",
    "87654321",
    "11223344"
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid MFA method or phone number format
  ```json
  {
    "error": "Invalid MFA method",
    "error_ar": "طريقة المصادقة الثنائية غير صالحة"
  }
  ```
- `401 Unauthorized` - Missing or invalid authorization header
- `500 Internal Server Error` - MFA setup failed

**Implementation Example:**
```typescript
const setupMFA = async (method: 'totp' | 'sms', phoneNumber?: string) => {
  const response = await fetch('/setup-mfa', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ method, phone_number: phoneNumber })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- TOTP method returns QR code for authenticator apps
- SMS method requires valid phone number
- Backup codes should be securely stored by user
- Rate limited to 3 requests per hour per user

---

### Verify MFA Setup

Verify MFA setup with a test code.

**Endpoint:** `POST /verify-mfa-setup`

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "verified": true,
  "message": "MFA setup verified successfully",
  "message_ar": "تم التحقق من إعداد المصادقة الثنائية بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired code
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Verification failed

---

### Biometric Setup

Register biometric authentication (fingerprint/face) for mobile devices.

**Endpoint:** `POST /auth-biometric-setup`

**Request Body:**
```json
{
  "device_id": "device-uuid",
  "biometric_type": "fingerprint",
  "public_key": "-----BEGIN PUBLIC KEY-----..."
}
```

**Response (200 OK):**
```json
{
  "biometric_id": "bio-uuid",
  "device_id": "device-uuid",
  "biometric_type": "fingerprint",
  "registered_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid device_id or biometric_type
- `401 Unauthorized` - Not authenticated
- `409 Conflict` - Biometric already registered for device
- `500 Internal Server Error` - Registration failed

**Implementation Example:**
```typescript
const setupBiometric = async (deviceId: string, type: 'fingerprint' | 'face', publicKey: string) => {
  const response = await fetch('/auth-biometric-setup', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_id: deviceId,
      biometric_type: type,
      public_key: publicKey
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Requires Expo LocalAuthentication module on mobile
- Public key used for challenge-response authentication
- One biometric per device
- Biometric data never leaves device

---

### Refresh Token

Refresh authentication token before expiry.

**Endpoint:** `POST /auth-refresh-token`

**Request Body:**
```json
{
  "refresh_token": "refresh-token-here"
}
```

**Response (200 OK):**
```json
{
  "access_token": "new-access-token",
  "refresh_token": "new-refresh-token",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid refresh token
- `401 Unauthorized` - Refresh token expired or revoked
- `500 Internal Server Error` - Token refresh failed

**Implementation Example:**
```typescript
const refreshToken = async (refreshToken: string) => {
  const response = await fetch('/auth-refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Call before access token expires (check expires_in)
- Store new tokens securely
- Refresh tokens have 30-day expiry
- Rate limited to prevent abuse

---

### Initiate Step-Up Authentication

Initiate step-up authentication for sensitive operations.

**Endpoint:** `POST /auth-step-up-initiate`

**Request Body:**
```json
{
  "operation": "delete_account",
  "context": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Response (200 OK):**
```json
{
  "challenge_id": "challenge-uuid",
  "methods": ["totp", "sms", "email"],
  "expires_at": "2024-01-15T10:35:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid operation type
- `401 Unauthorized` - Not authenticated
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Challenge generation failed

---

### Complete Step-Up Authentication

Complete step-up authentication with verification code.

**Endpoint:** `POST /auth-step-up-complete`

**Request Body:**
```json
{
  "challenge_id": "challenge-uuid",
  "method": "totp",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "step_up_token": "elevated-token",
  "expires_in": 300
}
```

**Error Responses:**
- `400 Bad Request` - Invalid challenge_id or verification code
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Challenge not found or expired
- `500 Internal Server Error` - Verification failed

---

### Verify Step-Up Token

Verify step-up token for sensitive operation.

**Endpoint:** `POST /auth-verify-step-up`

**Request Body:**
```json
{
  "step_up_token": "elevated-token",
  "operation": "delete_account"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "operation": "delete_account",
  "remaining_time": 240
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid token
- `401 Unauthorized` - Token expired or operation mismatch
- `500 Internal Server Error` - Verification failed

---

### Activate Account

Activate user account with email verification token.

**Endpoint:** `POST /activate-account`

**Request Body:**
```json
{
  "token": "activation-token-from-email"
}
```

**Response (200 OK):**
```json
{
  "activated": true,
  "user_id": "user-uuid",
  "message": "Account activated successfully",
  "message_ar": "تم تفعيل الحساب بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired token
- `404 Not Found` - User not found
- `409 Conflict` - Account already activated
- `500 Internal Server Error` - Activation failed

---

### Initiate Password Reset

Initiate password reset process.

**Endpoint:** `POST /initiate-password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent",
  "message_ar": "تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email format
- `429 Too Many Requests` - Rate limit exceeded (1 request per 15 minutes)
- `500 Internal Server Error` - Email sending failed

**Notes:**
- Always returns success to prevent email enumeration
- Reset link valid for 1 hour
- Rate limited by IP and email

---

### Reset Password

Complete password reset with token.

**Endpoint:** `POST /reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "reset": true,
  "message": "Password reset successfully",
  "message_ar": "تم إعادة تعيين كلمة المرور بنجاح"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid token or weak password
  ```json
  {
    "error": "Password must be at least 8 characters with uppercase, lowercase, number, and symbol",
    "error_ar": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل مع أحرف كبيرة وصغيرة ورقم ورمز"
  }
  ```
- `404 Not Found` - Token expired or invalid
- `500 Internal Server Error` - Password reset failed

**Notes:**
- Password requirements: 8+ characters, uppercase, lowercase, number, symbol
- Token single-use only
- All sessions invalidated after reset

---

## Authentication Patterns

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;         // User email
  role: string;          // User role
  aud: string;           // Audience (project ref)
  iat: number;           // Issued at
  exp: number;           // Expires at
  mfa_verified?: boolean; // MFA verification status
}
```

### Mobile Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const authenticateWithBiometric = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error('Biometric authentication not available');
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to continue',
    fallbackLabel: 'Use password'
  });

  if (result.success) {
    // Retrieve stored token and authenticate
    const token = await SecureStore.getItemAsync('biometric_token');
    return token;
  }
};
```

## Security Best Practices

1. **Token Storage**: Store tokens in secure storage (Expo SecureStore on mobile, httpOnly cookies on web)
2. **MFA Enforcement**: Require MFA for privileged users
3. **Step-Up Auth**: Use for sensitive operations (delete account, change email, etc.)
4. **Rate Limiting**: All endpoints rate-limited to prevent brute force
5. **Biometric Security**: Biometric keys never leave device, challenge-response only

## Related APIs

- [User Management](./user-management.md) - User creation and role assignment
- [Security & Access](./security-access.md) - Permissions and access control
- [Notifications](./notifications.md) - MFA verification codes via email/SMS
