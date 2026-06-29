/**
 * Unit tests for at-rest MFA secret encryption (D-19).
 *
 * @see backend/src/utils/mfa-crypto.ts
 * @see supabase/functions/_shared/mfa-crypto.ts (byte-compatible Deno port)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { encryptMfaSecret, decryptMfaSecret } from '@/utils/mfa-crypto'

// Fixed 32-byte key (base64) so the suite runs with no external config.
const TEST_KEY_BASE64 = Buffer.from(new Uint8Array(32).fill(7)).toString('base64')

describe('mfa-crypto', () => {
  beforeAll(() => {
    process.env.MFA_SECRET_ENCRYPTION_KEY = TEST_KEY_BASE64
  })

  it('round-trips an encrypted base32 secret back to the original plaintext', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'

    const encrypted = await encryptMfaSecret(secret)

    expect(encrypted.startsWith('v1.')).toBe(true)
    expect(encrypted).not.toContain(secret)
    expect(await decryptMfaSecret(encrypted)).toBe(secret)
  })

  it('passes a non-v1 (legacy plaintext) value through unchanged', async () => {
    const legacyPlaintext = 'JBSWY3DPEHPK3PXP'

    expect(await decryptMfaSecret(legacyPlaintext)).toBe(legacyPlaintext)
  })

  it('uses a fresh IV per call so two encryptions of the same secret differ', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'

    const first = await encryptMfaSecret(secret)
    const second = await encryptMfaSecret(secret)

    expect(first).not.toBe(second)
    expect(await decryptMfaSecret(first)).toBe(secret)
    expect(await decryptMfaSecret(second)).toBe(secret)
  })
})
