import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

describe('DIGEST-01: digest subscriptions', () => {
  const makeChain = (result: unknown) => {
    const chain: any = {
      select: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      single: vi.fn(async () => result),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(result).then(onResolved, onRejected),
    }
    return chain
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes an authenticated user to a dossier digest', async () => {
    const row = {
      id: 'sub-1',
      subscriber_id: 'user-1',
      organization_id: 'org-1',
      dossier_id: '00000000-0000-4000-8000-000000000001',
      dossier_type: 'country',
      frequency: 'daily',
      is_active: true,
    }
    const chain = makeChain({ data: row, error: null })
    mocks.from.mockReturnValueOnce(chain)

    const { subscribeToDigest } = await import('../../src/services/intelligence-digest.service')
    const result = await subscribeToDigest({
      organization_id: 'org-1',
      subscriber_id: 'user-1',
      dossier_id: '00000000-0000-4000-8000-000000000001',
      dossier_type: 'country',
      frequency: 'daily',
      frequency_config: { channels: ['in_app'] },
    })

    expect(mocks.from).toHaveBeenCalledWith('intelligence_digest_subscriptions')
    expect(chain.upsert).toHaveBeenCalledWith(
      {
        organization_id: 'org-1',
        subscriber_id: 'user-1',
        dossier_id: '00000000-0000-4000-8000-000000000001',
        dossier_type: 'country',
        frequency: 'daily',
        frequency_config: { channels: ['in_app'] },
        is_active: true,
        updated_at: expect.any(String),
      },
      { onConflict: 'subscriber_id,dossier_id,frequency' },
    )
    expect(result).toEqual(row)
  })

  it('soft-unsubscribes only the authenticated user subscription', async () => {
    const chain = makeChain({ data: { id: 'sub-1', is_active: false }, error: null })
    mocks.from.mockReturnValueOnce(chain)

    const { unsubscribeFromDigest } = await import('../../src/services/intelligence-digest.service')
    await unsubscribeFromDigest('user-1', '00000000-0000-4000-8000-000000000001')

    expect(mocks.from).toHaveBeenCalledWith('intelligence_digest_subscriptions')
    expect(chain.update).toHaveBeenCalledWith({
      is_active: false,
      updated_at: expect.any(String),
    })
    expect(chain.eq).toHaveBeenCalledWith('subscriber_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('dossier_id', '00000000-0000-4000-8000-000000000001')
  })

  it('lists only the authenticated user subscriptions', async () => {
    const rows = [
      {
        id: 'sub-1',
        subscriber_id: 'user-1',
        dossier_id: '00000000-0000-4000-8000-000000000001',
        is_active: true,
      },
    ]
    const chain = makeChain({ data: rows, error: null })
    mocks.from.mockReturnValueOnce(chain)

    const { listSubscriptions } = await import('../../src/services/intelligence-digest.service')
    const result = await listSubscriptions('user-1')

    expect(result).toEqual(rows)
    expect(chain.eq).toHaveBeenCalledWith('subscriber_id', 'user-1')
    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })
})
