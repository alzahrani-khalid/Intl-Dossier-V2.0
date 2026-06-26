/**
 * Unit/route test: POST /api/ai/briefs/manual (feature fde9aa72).
 *
 * Mounts ONLY the briefs router on an ephemeral in-process HTTP server (not the
 * full /api chain, which would pull in Redis/queues) and exercises it over
 * fetch. supertest is intentionally NOT used — it is not a dependency of this
 * workspace — so this relies only on `express` (installed) + Node's http/fetch.
 *
 * Auth and the ai_briefs insert are driven through the global @/config/supabase
 * mock from tests/setup.ts. No live infra.
 *
 * Covered: 401 (no token / rejected token), 400 MISSING_TARGET, 400
 * MISSING_SUMMARY, and the 201 happy path — asserting created_by /
 * organization_id are pinned from the verified token (never the request body)
 * and the response is the camelCase-transformed row.
 */
import express, { type Express } from 'express'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/config/supabase'

// Typed handles onto the global mock (tests/setup.ts mocks @/config/supabase).
const mockGetUser = supabaseAdmin.auth.getUser as unknown as ReturnType<typeof vi.fn>
const mockFrom = supabaseAdmin.from as unknown as ReturnType<typeof vi.fn>

const TOKEN = 'Bearer valid-test-token'
const USER_ID = 'user-uuid-1'
const ORG_ID = 'org-uuid-1'

let server: Server | null = null

async function startServer(): Promise<string> {
  const app: Express = express()
  app.use(express.json())
  const briefsRouter = (await import('../../src/api/ai/briefs')).default
  app.use('/api/ai/briefs', briefsRouter)

  return new Promise<string>((resolve) => {
    server = createServer(app)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server!.address() as AddressInfo
      resolve(`http://127.0.0.1:${port}`)
    })
  })
}

interface PostResult {
  status: number
  body: Record<string, unknown>
}

async function postManual(
  baseUrl: string,
  payload: unknown,
  headers: Record<string, string> = {},
): Promise<PostResult> {
  const res = await fetch(`${baseUrl}/api/ai/briefs/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, body }
}

/** Authorize the inline verifySupabaseToken gate: valid user + profile org lookup. */
function stubAuthenticatedUser(): void {
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID, user_metadata: {} } }, error: null })
  // verifySupabaseToken does supabaseAdmin.from('profiles').select().eq().single()
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { organization_id: ORG_ID }, error: null }),
      }
    }
    throw new Error(`unexpected table ${table}`)
  })
}

describe('POST /api/ai/briefs/manual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()))
      server = null
    }
  })

  it('returns 401 when no token is provided', async () => {
    const baseUrl = await startServer()
    const res = await postManual(baseUrl, { dossier_id: 'dos-1' })
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ error: 'No token provided' })
  })

  it('returns 401 when the token is rejected', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } })
    const baseUrl = await startServer()
    const res = await postManual(
      baseUrl,
      { dossier_id: 'dos-1', summary: 'x' },
      { Authorization: TOKEN },
    )
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ error: 'Invalid token' })
  })

  it('returns 400 MISSING_TARGET when neither engagement_id nor dossier_id is present', async () => {
    stubAuthenticatedUser()
    const baseUrl = await startServer()
    const res = await postManual(baseUrl, { summary: 'A valid summary' }, { Authorization: TOKEN })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ code: 'MISSING_TARGET' })
  })

  it('returns 400 MISSING_SUMMARY when the summary is empty/whitespace', async () => {
    stubAuthenticatedUser()
    const baseUrl = await startServer()
    const res = await postManual(
      baseUrl,
      { dossier_id: 'dos-1', summary: '   ' },
      { Authorization: TOKEN },
    )
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ code: 'MISSING_SUMMARY' })
  })

  it('creates the brief (201), pinning created_by/organization_id from the token', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, user_metadata: {} } },
      error: null,
    })

    const insertSpy = vi.fn().mockReturnThis()
    const insertedRow = {
      id: 'brief-1',
      title: 'Trade summary',
      status: 'completed',
      executive_summary: 'Trade summary line one',
      background: null,
      key_participants: null,
      relevant_positions: null,
      active_commitments: null,
      historical_context: null,
      talking_points: null,
      recommendations: null,
      citations: null,
      engagement_id: null,
      dossier_id: 'dos-1',
      created_by: USER_ID,
      created_at: '2026-06-26T00:00:00Z',
      completed_at: '2026-06-26T00:00:00Z',
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { organization_id: ORG_ID }, error: null }),
        }
      }
      if (table === 'ai_briefs') {
        return {
          insert: insertSpy,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    })

    const baseUrl = await startServer()
    const res = await postManual(
      baseUrl,
      {
        dossier_id: 'dos-1',
        summary: 'Trade summary line one\nmore detail',
        // These body fields must be ignored in favor of the token-derived values.
        created_by: 'attacker-user',
        organization_id: 'attacker-org',
      },
      { Authorization: TOKEN },
    )

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: 'brief-1',
        title: 'Trade summary',
        status: 'completed',
        executiveSummary: 'Trade summary line one',
        dossierId: 'dos-1',
        engagementId: null,
        createdBy: USER_ID,
      },
    })

    // created_by / organization_id come from the verified token, not the body.
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const insertArg = insertSpy.mock.calls[0]?.[0] as Record<string, unknown>
    expect(insertArg).toMatchObject({
      created_by: USER_ID,
      organization_id: ORG_ID,
      dossier_id: 'dos-1',
      status: 'completed',
    })
    expect(insertArg.created_by).not.toBe('attacker-user')
    expect(insertArg.organization_id).not.toBe('attacker-org')
  })
})
