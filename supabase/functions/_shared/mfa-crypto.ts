/**
 * At-rest encryption for the TOTP MFA secret (`public.users.mfa_secret`).
 *
 * Deno edge counterpart of `backend/src/utils/mfa-crypto.ts`. Both use
 * AES-256-GCM via the WebCrypto API (`crypto.subtle`) with an IDENTICAL stored
 * format, so the edge functions and the Express backend round-trip each other's
 * output byte-for-byte (same key, same format) — required because both read and
 * write the same `public.users.mfa_secret` column.
 *
 * Stored format (the string written to the column):
 *   v1.<base64url(iv, 12 bytes)>.<base64url(ciphertext || authTag)>
 * WebCrypto AES-GCM appends the 16-byte auth tag to the ciphertext, so the
 * third segment is exactly what `crypto.subtle.decrypt` expects back.
 *
 * Backward compatibility (no lockout, no backfill): on READ, a value that does
 * NOT start with `v1.` is treated as a legacy plaintext base32 secret and
 * returned unchanged. On WRITE we always encrypt.
 *
 * The key is 32 bytes provided as base64 in the `MFA_SECRET_ENCRYPTION_KEY`
 * Supabase secret. It is read and validated LAZILY on the first encrypt/decrypt
 * call (never at import). The SAME base64 value must be set in the backend env.
 */

const VERSION_PREFIX = 'v1.'
const IV_LENGTH_BYTES = 12
const KEY_LENGTH_BYTES = 32

let cachedKey: Promise<CryptoKey> | null = null

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function readKeyBytes(): Uint8Array<ArrayBuffer> {
  const base64Key = Deno.env.get('MFA_SECRET_ENCRYPTION_KEY')
  if (base64Key === undefined || base64Key.length === 0) {
    throw new Error(
      'MFA_SECRET_ENCRYPTION_KEY is not set — it is required to encrypt/decrypt the MFA secret at rest',
    )
  }
  const keyBytes = base64ToBytes(base64Key)
  if (keyBytes.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `MFA_SECRET_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (got ${keyBytes.length})`,
    )
  }
  return keyBytes
}

function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey('raw', readKeyBytes(), { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ])
  }
  return cachedKey
}

/**
 * Encrypt a plaintext base32 TOTP secret for storage.
 * Returns a `v1.`-prefixed string in the format documented above.
 */
export async function encryptMfaSecret(plain: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return `${VERSION_PREFIX}${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`
}

/**
 * Decrypt a stored MFA secret back to its plaintext base32 form.
 * A value that does not start with `v1.` is a legacy plaintext secret and is
 * returned unchanged (backward compatibility — no lockout).
 */
export async function decryptMfaSecret(stored: string): Promise<string> {
  if (!stored.startsWith(VERSION_PREFIX)) {
    return stored
  }
  const parts = stored.split('.')
  if (parts.length !== 3 || parts[1] === undefined || parts[2] === undefined) {
    throw new Error('Malformed encrypted MFA secret')
  }
  const key = await getKey()
  const iv = base64ToBytes(parts[1])
  const ciphertext = base64ToBytes(parts[2])
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
