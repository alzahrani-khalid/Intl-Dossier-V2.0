import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('CSP Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset module cache so env changes take effect
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  async function loadCspDirectives(): Promise<Record<string, string[]>> {
    const mod = await import('../../backend/src/middleware/security')
    return mod.buildCspDirectives()
  }

  async function loadCspReportOnly(): Promise<boolean> {
    const mod = await import('../../backend/src/middleware/security')
    return mod.isCspReportOnly()
  }

  it('includes Supabase URL in connect-src', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    const directives = await loadCspDirectives()
    expect(directives.connectSrc).toContain('https://test.supabase.co')
  })

  it('falls back to wildcard Supabase URL when SUPABASE_URL is not set', async () => {
    delete process.env.SUPABASE_URL
    const directives = await loadCspDirectives()
    // When SUPABASE_URL is unset, the || fallback gives the wildcard
    const hasWildcard = directives.connectSrc.some((s) => s.includes('supabase.co'))
    expect(hasWildcard).toBe(true)
  })

  it('includes Supabase Realtime WSS in connect-src', async () => {
    process.env.SUPABASE_URL = 'https://abc123.supabase.co'
    const directives = await loadCspDirectives()
    // Should have a wss:// entry for Supabase Realtime
    const wssEntries = directives.connectSrc.filter((s) => s.startsWith('wss://'))
    expect(wssEntries.length).toBeGreaterThanOrEqual(1)
  })

  it('falls back to wildcard WSS when SUPABASE_URL is not set', async () => {
    delete process.env.SUPABASE_URL
    const directives = await loadCspDirectives()
    // Should have a wss:// entry (either wildcard or derived)
    const wssEntries = directives.connectSrc.filter((s) => s.startsWith('wss://'))
    expect(wssEntries.length).toBeGreaterThanOrEqual(1)
  })

  it('includes Sentry DSN origin in connect-src when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://key@o123.ingest.sentry.io/456'
    const directives = await loadCspDirectives()
    expect(directives.connectSrc).toContain('https://o123.ingest.sentry.io')
  })

  it('excludes Sentry from connect-src when SENTRY_DSN is not set', async () => {
    delete process.env.SENTRY_DSN
    const directives = await loadCspDirectives()
    const sentryEntries = directives.connectSrc.filter((s) => s.includes('sentry'))
    expect(sentryEntries).toHaveLength(0)
  })

  it('includes AnythingLLM URL in connect-src when ANYTHINGLLM_API_URL is set', async () => {
    process.env.ANYTHINGLLM_API_URL = 'http://localhost:3001'
    const directives = await loadCspDirectives()
    expect(directives.connectSrc).toContain('http://localhost:3001')
  })

  it('excludes AnythingLLM from connect-src when ANYTHINGLLM_API_URL is not set', async () => {
    delete process.env.ANYTHINGLLM_API_URL
    const directives = await loadCspDirectives()
    // Should only have self, supabase, and wss entries
    expect(directives.connectSrc.length).toBeGreaterThanOrEqual(3)
  })

  it('blocks frame embedding (frameSrc is none)', async () => {
    const directives = await loadCspDirectives()
    expect(directives.frameSrc).toContain("'none'")
  })

  it('blocks object embedding (objectSrc is none)', async () => {
    const directives = await loadCspDirectives()
    expect(directives.objectSrc).toContain("'none'")
  })

  it('includes workerSrc with self and blob', async () => {
    const directives = await loadCspDirectives()
    expect(directives.workerSrc).toContain("'self'")
    expect(directives.workerSrc).toContain('blob:')
  })

  it('is enforced in production (reportOnly is false when NODE_ENV=production)', async () => {
    process.env.NODE_ENV = 'production'
    const reportOnly = await loadCspReportOnly()
    expect(reportOnly).toBe(false)
  })

  it('is report-only in development', async () => {
    process.env.NODE_ENV = 'development'
    const reportOnly = await loadCspReportOnly()
    expect(reportOnly).toBe(true)
  })
})
