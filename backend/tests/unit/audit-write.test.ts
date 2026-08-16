/**
 * AUDIT-DROP-01 behavioural oracle — the backend `public.audit_log` writer.
 *
 * WHY THIS PATH. `backend/vitest.config.ts` includes the `tests/unit` glob, so
 * this file runs in the required unit job. The colocated directory
 * `backend/src/services/__tests__/` is outside every include glob, so the
 * `auth.service.test.ts` shipped there NEVER RUNS — a test placed in it is a
 * non-oracle that reports green by never executing. The boundary is that one
 * directory, NOT "colocated backend tests": vitest.config.ts line 28 does
 * include `src/utils/__tests__`.
 *
 * WHICH SUBJECT. `AuthService.logSecurityEvent` from `src/services/auth.service`.
 * `src/utils/logger` exports a same-named `logSecurityEvent` that is a different
 * function entirely — a pure basename collision. Every import and every vi.mock
 * below pins its target by PATH, not by name.
 */
import { describe, it, expect, vi } from 'vitest'
import { AuthService } from '../../src/services/auth.service'
import { supabaseAdmin } from '../../src/config/supabase'
import { logError } from '../../src/utils/logger'

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
  supabaseAnon: { auth: { getUser: vi.fn() } },
}))

vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logAuthEvent: vi.fn(),
  logSecurityEvent: vi.fn(),
  logApiRequest: vi.fn(),
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), http: vi.fn() },
}))

/**
 * The live column set of `public.audit_log`, derived 2026-08-16 from
 * `information_schema.columns` against staging `zkrcjzdemdmwhearhfgg` (D-17).
 * Any key outside this set fails the WHOLE insert with PGRST204 — which is how
 * this table went its entire lifetime without recording one security event.
 */
const AUDIT_LOG_COLUMNS = [
  'id',
  'tenant_id',
  'entity_type',
  'entity_id',
  'action',
  'user_id',
  'timestamp',
  'old_values',
  'new_values',
  'ip_address',
  'user_agent',
  'session_id',
  'additional_context',
]

/** NOT NULL with no default — the insert fails if any one is absent. */
const AUDIT_LOG_REQUIRED = ['tenant_id', 'entity_type', 'entity_id', 'action', 'user_id']

type Row = Record<string, unknown> | null

const selectChain = (data: Row): unknown => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data, error: null })) })),
  })),
})

/**
 * Wire supabaseAdmin.from per table and hand back the audit_log insert spy.
 * Any table the subject does not expect throws, so a mis-pointed write is a
 * test failure rather than a silent pass.
 */
const wire = (opts: {
  profileOrg?: string | null
  defaultOrg?: string | null
  insertError?: { message: string } | null
}): ReturnType<typeof vi.fn> => {
  const insert = vi.fn(async () => ({ error: opts.insertError ?? null }))
  const from = supabaseAdmin.from as unknown as ReturnType<typeof vi.fn>

  from.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return selectChain(opts.profileOrg != null ? { organization_id: opts.profileOrg } : null)
    }
    if (table === 'users') {
      return selectChain(
        opts.defaultOrg != null ? { default_organization_id: opts.defaultOrg } : null,
      )
    }
    if (table === 'audit_log') return { insert }
    throw new Error(`unexpected table: ${table}`)
  })

  return insert
}

const errorLines = (): string[] => vi.mocked(logError).mock.calls.map((call) => String(call[0]))

describe('AUDIT-DROP-01 — AuthService.logSecurityEvent writes public.audit_log', () => {
  it('names only real audit_log columns and supplies every NOT NULL one', async () => {
    const insert = wire({ profileOrg: 'org-profile' })

    await new AuthService().logSecurityEvent('user-1', 'login_success', { ip: '203.0.113.4' })

    expect(insert).toHaveBeenCalledTimes(1)
    const payload = insert.mock.calls[0][0] as Record<string, unknown>

    // The whole point: no key outside the live column set may reach PostgREST.
    expect(Object.keys(payload).sort()).toEqual(
      Object.keys(payload)
        .filter((key) => AUDIT_LOG_COLUMNS.includes(key))
        .sort(),
    )
    for (const column of AUDIT_LOG_REQUIRED) {
      expect(Object.keys(payload)).toContain(column)
    }

    expect(payload.tenant_id).toBe('org-profile')
    expect(payload.entity_type).toBe('security')
    expect(payload.entity_id).toBe('user-1')
    expect(payload.user_id).toBe('user-1')
    expect(payload.action).toBe('login_success')
    expect(payload.additional_context).toEqual({ ip: '203.0.113.4' })
    expect(errorLines()).toEqual([])
  })

  it('derives tenant_id from users.default_organization_id when profiles has no org', async () => {
    const insert = wire({ profileOrg: null, defaultOrg: 'org-fallback' })

    await new AuthService().logSecurityEvent('user-2', 'mfa_enabled')

    expect(insert).toHaveBeenCalledTimes(1)
    expect((insert.mock.calls[0][0] as Record<string, unknown>).tenant_id).toBe('org-fallback')
  })

  it('surfaces an insert failure distinguishably and does not throw', async () => {
    wire({
      profileOrg: 'org-profile',
      insertError: { message: "PGRST204 Could not find the 'nope' column" },
    })

    await expect(
      new AuthService().logSecurityEvent('user-3', 'password_reset'),
    ).resolves.toBeUndefined()

    const failures = errorLines().filter(
      (line) => line.includes('AUDIT-DROP-01') && line.includes('FAILED'),
    )
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain("PGRST204 Could not find the 'nope' column")
    // Distinguishable from the skip branch, not just "something was logged".
    expect(errorLines().some((line) => line.includes('SKIPPED'))).toBe(false)
  })

  it('skips the insert loudly when no tenant resolves — never a sentinel tenant', async () => {
    const insert = wire({ profileOrg: null, defaultOrg: null })

    await new AuthService().logSecurityEvent('user-4', 'suspicious_login')

    expect(insert).not.toHaveBeenCalled()
    const skips = errorLines().filter(
      (line) => line.includes('AUDIT-DROP-01') && line.includes('SKIPPED'),
    )
    expect(skips).toHaveLength(1)
    expect(skips[0]).toContain('user-4')
  })
})
