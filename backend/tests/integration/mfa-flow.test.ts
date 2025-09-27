import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, TestServer } from '../setup';
import { mfaService } from '../../src/services/mfa.service';

describe('MFA Integration Flow Tests', () => {
  let server: TestServer;
  const testToken = 'test-user-token-123';

  beforeEach(async () => {
    server = await createTestServer();
    // Clear any existing MFA state
    (mfaService as any).enrolled.clear();
    (mfaService as any).verifyState.clear();
    (mfaService as any).usedBackupCodes.clear();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Complete MFA Enrollment Flow', () => {
    it('should successfully enroll user in MFA', async () => {
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('factor_id');
      expect(data).toHaveProperty('secret');
      expect(data).toHaveProperty('qr_code');
      expect(data).toHaveProperty('backup_codes');
      expect(data.backup_codes).toHaveLength(10);
      expect(data.qr_code).toMatch(/^data:image\/png;base64,/);
    });

    it('should reject enrollment if already enrolled', async () => {
      // First enrollment
      await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      // Second enrollment should fail
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.code).toBe('MFA_ALREADY_ENROLLED');
    });

    it('should reject invalid factor type', async () => {
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'sms'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_FACTOR_TYPE');
    });
  });

  describe('MFA Verification Flow', () => {
    beforeEach(async () => {
      // Enroll user first
      await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });
    });

    it('should successfully verify valid TOTP code', async () => {
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '123456'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.verified).toBe(true);
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
    });

    it('should reject expired TOTP code on reuse', async () => {
      // First verification
      await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '123456'
        })
      });

      // Second verification with same code should fail
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '123456'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('EXPIRED_MFA_CODE');
    });

    it('should reject invalid TOTP code', async () => {
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '999999'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('INVALID_MFA_CODE');
    });

    it('should reject invalid code format', async () => {
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '12345'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_CODE_FORMAT');
    });

    it('should block after too many failed attempts', async () => {
      // Make 6 failed attempts
      for (let i = 0; i < 6; i++) {
        await server.request('/api/auth/mfa/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: '999999'
          })
        });
      }

      // 7th attempt should be blocked
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '999999'
        })
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.code).toBe('TOO_MANY_ATTEMPTS');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Backup Codes Flow', () => {
    beforeEach(async () => {
      // Enroll user first
      await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });
    });

    it('should retrieve backup codes', async () => {
      const response = await server.request('/api/auth/mfa/backup-codes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('codes');
      expect(data).toHaveProperty('generated_at');
      expect(data.codes).toHaveLength(10);
      expect(data.codes[0]).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('should regenerate backup codes', async () => {
      // Get original codes
      const originalResponse = await server.request('/api/auth/mfa/backup-codes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      const originalData = await originalResponse.json();

      // Regenerate codes
      const response = await server.request('/api/auth/mfa/backup-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('codes');
      expect(data).toHaveProperty('generated_at');
      expect(data.codes).toHaveLength(10);
      expect(data.generated_at).not.toBe(originalData.generated_at);
    });

    it('should reject backup code operations for unenrolled user', async () => {
      const unenrolledToken = 'unenrolled-user-token';
      
      const response = await server.request('/api/auth/mfa/backup-codes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${unenrolledToken}`
        }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.code).toBe('MFA_NOT_ENROLLED');
    });
  });

  describe('MFA Recovery Flow', () => {
    let backupCodes: string[];

    beforeEach(async () => {
      // Enroll user and get backup codes
      const enrollResponse = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });
      const enrollData = await enrollResponse.json();
      backupCodes = enrollData.backup_codes;
    });

    it('should successfully recover with valid backup code', async () => {
      const response = await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: backupCodes[0]
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
      expect(data).toHaveProperty('expires_in');
    });

    it('should reject already used backup code', async () => {
      // Use backup code first time
      await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: backupCodes[0]
        })
      });

      // Try to use same backup code again
      const response = await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: backupCodes[0]
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('BACKUP_CODE_ALREADY_USED');
    });

    it('should reject invalid backup code', async () => {
      const response = await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: 'INVALID123'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('INVALID_BACKUP_CODE');
    });

    it('should reject invalid backup code format', async () => {
      const response = await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: '1234567'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_BACKUP_CODE_FORMAT');
    });

    it('should block after too many failed recovery attempts', async () => {
      // Make 6 failed attempts with invalid codes
      for (let i = 0; i < 6; i++) {
        await server.request('/api/auth/mfa/recover', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            backup_code: 'INVALID123'
          })
        });
      }

      // 7th attempt should be blocked
      const response = await server.request('/api/auth/mfa/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_code: 'INVALID123'
        })
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.code).toBe('TOO_MANY_ATTEMPTS');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce enrollment rate limit', async () => {
      // Make 6 enrollment attempts (limit is 5 per minute)
      for (let i = 0; i < 5; i++) {
        await server.request('/api/auth/mfa/enroll', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}-${i}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            factor_type: 'totp'
          })
        });
      }

      // 6th attempt should be rate limited
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}-6`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      expect(response.status).toBe(429);
    });

    it('should enforce verification rate limit', async () => {
      // Enroll user first
      await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      // Make 7 verification attempts (limit is 6 per minute)
      for (let i = 0; i < 6; i++) {
        await server.request('/api/auth/mfa/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: '999999'
          })
        });
      }

      // 7th attempt should be rate limited
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '999999'
        })
      });

      expect(response.status).toBe(429);
    });
  });

  describe('Bilingual Error Messages', () => {
    it('should return bilingual error messages', async () => {
      const response = await server.request('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: '12345'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('message_ar');
      expect(data.message_ar).toBe('الرمز مفقود');
    });
  });

  describe('Security Headers and Validation', () => {
    it('should require authorization header', async () => {
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factor_type: 'totp'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should validate request body structure', async () => {
      const response = await server.request('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('MISSING_FACTOR_TYPE');
    });
  });
});
