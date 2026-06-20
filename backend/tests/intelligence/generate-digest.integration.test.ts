import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
    rpc: vi.fn(),
    auth: { admin: { getUserById: vi.fn() } },
  },
}))

const DOSSIER_ID = '00000000-0000-4000-8000-000000000001'

async function mountRouter() {
  const router = (await import('../../src/api/intelligence-digest')).default
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = {
      id: 'user-1',
      email: 'user@example.test',
      role: 'editor',
      organization_id: 'org-1',
      clearance_level: 3,
      permissions: [],
    }
    next()
  })
  app.use(router)

  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, () => resolve(started))
  })
  const { port } = server.address() as AddressInfo
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

describe('DIGEST-04: generate and publish digest RPC flow', () => {
  let closeServer: (() => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockReturnValue({ rpc: mocks.rpc })
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === 'generate_digest') {
        return {
          data: {
            dossier_id: DOSSIER_ID,
            period: 'weekly',
            period_key: 'weekly-2026-W25',
            signals: [],
          },
          error: null,
        }
      }
      if (name === 'publish_digest') return { data: 'digest-1', error: null }
      return { data: null, error: null }
    })
  })

  afterEach(async () => {
    if (closeServer != null) {
      await closeServer()
      closeServer = null
    }
  })

  it('generates a preview digest and publishes the approved digest row', async () => {
    const server = await mountRouter()
    closeServer = server.close

    const generateResponse = await fetch(
      `${server.baseUrl}/generate?dossier_id=${DOSSIER_ID}&period=weekly`,
      { headers: { Authorization: 'Bearer caller-jwt' } },
    )
    const generated = await generateResponse.json()

    const publishResponse = await fetch(`${server.baseUrl}/publish`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer caller-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dossier_id: DOSSIER_ID,
        period: 'weekly',
        summary: 'Approved weekly intelligence summary',
        clearance_level_at_generation: 3,
      }),
    })
    const published = await publishResponse.json()

    expect(generateResponse.status).toBe(200)
    expect(generated).toMatchObject({ dossier_id: DOSSIER_ID, period: 'weekly' })
    expect(publishResponse.status).toBe(201)
    expect(published).toEqual({ id: 'digest-1' })
    expect(mocks.createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        global: {
          headers: { Authorization: 'Bearer caller-jwt' },
        },
      }),
    )
    expect(mocks.rpc).toHaveBeenCalledWith('generate_digest', {
      p_dossier_id: DOSSIER_ID,
      p_period: 'weekly',
    })
    expect(mocks.rpc).toHaveBeenCalledWith('publish_digest', {
      p_dossier_id: DOSSIER_ID,
      p_period: 'weekly',
      p_summary: 'Approved weekly intelligence summary',
      p_clearance_level_at_generation: 3,
    })
  })

  it('keeps digest subscription validation aligned to the live dossier type domain', async () => {
    const server = await mountRouter()
    closeServer = server.close

    const response = await fetch(`${server.baseUrl}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier_id: DOSSIER_ID,
        dossier_type: 'elected_official',
        frequency: 'daily',
      }),
    })

    expect(response.status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
