# Authentication & MFA API

## Overview

Multi-factor authentication (MFA) endpoints provide TOTP-based two-factor authentication with backup codes for account recovery.

## Endpoints

### Enroll in MFA

Initiate MFA enrollment for the authenticated user.

**Endpoint:** `POST /auth/mfa/enroll`

**Request Body:**
```json
{
  "factor_type": "totp"
}
```

**Response (200 OK):**
```json
{
  "factor_id": "550e8400-e29b-41d4-a716-446655440000",
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backup_codes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2",
    "M3N4O5P6",
    "Q7R8S9T0",
    "U1V2W3X4",
    "Y5Z6A7B8",
    "C9D0E1F2",
    "G3H4I5J6",
    "K7L8M9N0"
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid factor type
- `401 Unauthorized` - Not authenticated

**Implementation Example:**
```typescript
const enrollMFA = async () => {
  const response = await fetch('/auth/mfa/enroll', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ factor_type: 'totp' })
  });
  
  const data = await response.json();
  // Display QR code to user
  displayQRCode(data.qr_code);
  // Store backup codes securely
  saveBackupCodes(data.backup_codes);
  return data.factor_id;
};
```

---

### Verify MFA Code

Verify a TOTP code during login or enrollment.

**Endpoint:** `POST /auth/mfa/verify`

**Request Body:**
```json
{
  "code": "123456",
  "factor_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "verified": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid code format
- `401 Unauthorized` - Invalid code or factor
- `429 Too Many Requests` - Rate limit exceeded

**Rate Limiting:**
- 5 attempts per 15 minutes
- Lock period doubles after each threshold

**Implementation Example:**
```typescript
const verifyMFA = async (code: string, factorId: string) => {
  try {
    const response = await fetch('/auth/mfa/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, factor_id: factorId })
    });
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Too many attempts. Try again in ${retryAfter} seconds`);
    }
    
    const data = await response.json();
    if (data.verified) {
      // Store new tokens
      setTokens(data.access_token, data.refresh_token);
    }
    return data;
  } catch (error) {
    console.error('MFA verification failed:', error);
    throw error;
  }
};
```

---

### Get Backup Codes

Retrieve existing backup codes for the authenticated user.

**Endpoint:** `GET /auth/mfa/backup-codes`

**Response (200 OK):**
```json
{
  "codes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2"
  ],
  "generated_at": "2024-01-15T10:30:00Z"
}
```

**Note:** Only unused codes are returned.

---

### Generate New Backup Codes

Generate a fresh set of backup codes, invalidating all previous codes.

**Endpoint:** `POST /auth/mfa/backup-codes`

**Response (200 OK):**
```json
{
  "codes": [
    "P1Q2R3S4",
    "T5U6V7W8",
    "X9Y0Z1A2",
    "B3C4D5E6",
    "F7G8H9I0",
    "J1K2L3M4",
    "N5O6P7Q8",
    "R9S0T1U2",
    "V3W4X5Y6",
    "Z7A8B9C0"
  ],
  "generated_at": "2024-01-15T14:45:00Z"
}
```

**Security Notes:**
- Previous codes are immediately invalidated
- User receives email notification
- Codes must be stored securely by the user

---

### Recover Account with Backup Code

Use a backup code when TOTP device is unavailable.

**Endpoint:** `POST /auth/mfa/recover`

**Request Body:**
```json
{
  "backup_code": "A1B2C3D4"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Error Responses:**
- `400 Bad Request` - Invalid code format
- `401 Unauthorized` - Code already used or invalid

**Security Considerations:**
- Each code can only be used once
- Successful use triggers security alert email
- Consider prompting user to re-enroll MFA after recovery

**Implementation Example:**
```typescript
const recoverWithBackupCode = async (backupCode: string) => {
  const response = await fetch('/auth/mfa/recover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ backup_code: backupCode })
  });
  
  if (!response.ok) {
    throw new Error('Invalid or already used backup code');
  }
  
  const data = await response.json();
  // Store tokens and redirect
  setTokens(data.access_token, data.refresh_token);
  // Prompt to re-enroll MFA
  showMFAReEnrollmentPrompt();
  return data;
};
```

## MFA Flow Diagrams

### Enrollment Flow
```
User → Enable MFA → Generate Secret → Display QR Code
                                          ↓
                              User Scans with Authenticator
                                          ↓
                                  Enter First TOTP Code
                                          ↓
                                    Verify & Activate
                                          ↓
                                 Display Backup Codes
```

### Login Flow with MFA
```
User → Enter Credentials → Valid? → MFA Enabled?
                              ↓           ↓ No
                           Invalid    Grant Access
                              ↓           
                         Show Error   ↓ Yes
                                    Request TOTP
                                         ↓
                                    Verify Code
                                         ↓
                                    Grant Access
```

### Recovery Flow
```
User → Can't Access TOTP → Enter Backup Code → Verify
                                                   ↓
                                            Grant Access
                                                   ↓
                                        Prompt Re-enrollment
```

## Best Practices

### For Implementation

1. **QR Code Display**
   - Show QR code clearly with fallback to manual entry
   - Display secret key for manual entry
   - Provide setup instructions for popular authenticator apps

2. **Backup Codes**
   - Generate 10 codes initially
   - Display only once during generation
   - Provide download option (PDF/text file)
   - Send email confirmation without codes

3. **Error Handling**
   - Show clear, bilingual error messages
   - Implement progressive delays on failed attempts
   - Log all MFA events for security audit

4. **User Experience**
   - Allow testing MFA before fully enabling
   - Provide clear recovery instructions
   - Support multiple MFA factors (future enhancement)

### Security Considerations

1. **Rate Limiting**
   - Implement exponential backoff
   - Track attempts by IP and user
   - Alert on suspicious patterns

2. **Session Management**
   - Require re-authentication for MFA changes
   - Invalidate sessions on MFA disable
   - Short-lived tokens after MFA verification

3. **Audit Logging**
   - Log all MFA operations
   - Track device fingerprints
   - Monitor for anomalies

4. **Communication**
   - Email notifications for MFA changes
   - No sensitive data in emails
   - Secure channel for backup code delivery

## Testing

### Test Scenarios

1. **Enrollment**
   ```bash
   # Test successful enrollment
   curl -X POST /auth/mfa/enroll \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"factor_type": "totp"}'
   ```

2. **Verification**
   ```bash
   # Test with valid code
   curl -X POST /auth/mfa/verify \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"code": "123456", "factor_id": "..."}'
   ```

3. **Recovery**
   ```bash
   # Test backup code recovery
   curl -X POST /auth/mfa/recover \
     -H "Content-Type: application/json" \
     -d '{"backup_code": "A1B2C3D4"}'
   ```

### Test Users

For development/staging environments:
- `test-mfa@gastat.sa` - MFA enabled account
- `test-nomfa@gastat.sa` - Non-MFA account
- `test-locked@gastat.sa` - Rate-limited account

## Troubleshooting

### Common Issues

1. **"Invalid code" errors**
   - Check device time synchronization
   - Verify correct factor_id
   - Ensure code hasn't expired (30-second window)

2. **"Too many requests" (429)**
   - Wait for Retry-After period
   - Check rate limit configuration
   - Review failed attempt patterns

3. **QR code not scanning**
   - Verify QR code generation
   - Check data URI format
   - Provide manual entry option

4. **Backup codes not working**
   - Verify code hasn't been used
   - Check code format (8 characters, alphanumeric)
   - Ensure codes haven't been regenerated

## Migration Guide

### Enabling MFA for Existing Users

1. **Gradual Rollout**
   ```typescript
   // Phase 1: Optional MFA
   const enableOptionalMFA = async (userId: string) => {
     await updateUserSettings(userId, { mfa_optional: true });
     await sendMFAInvitation(userId);
   };
   
   // Phase 2: Required for admins
   const requireAdminMFA = async () => {
     const admins = await getAdminUsers();
     for (const admin of admins) {
       await updateUserSettings(admin.id, { mfa_required: true });
     }
   };
   
   // Phase 3: Required for all
   const requireAllUsersMFA = async () => {
     await updateGlobalSettings({ mfa_required: true });
   };
   ```

2. **Grace Period**
   - 30-day notice before requirement
   - Email reminders at 30, 14, 7, 1 days
   - Support documentation and training

3. **Fallback Options**
   - Temporary bypass tokens for emergencies
   - Admin override capability
   - Alternative authentication methods

---

*For additional support, contact: security@gastat.gov.sa*