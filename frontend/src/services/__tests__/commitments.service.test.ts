import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, limitMock, orMock, selectMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  limitMock: vi.fn(),
  orMock: vi.fn(),
  selectMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

import { getCommitments } from '../commitments.service'

describe('getCommitments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const builder = {
      limit: limitMock,
      or: orMock,
      order: vi.fn(),
    }
    builder.order.mockReturnValue(builder)
    orMock.mockReturnValue(builder)
    limitMock.mockResolvedValue({ data: [], error: null, count: 0 })
    selectMock.mockReturnValue(builder)
    fromMock.mockReturnValue({ select: selectMock })
  })

  it('quotes reserved search characters without stripping dots', async () => {
    await getCommitments({ search: 'a,b(c).d' })

    expect(orMock).toHaveBeenCalledWith('title.ilike."%a,b(c).d%",description.ilike."%a,b(c).d%"')
  })
})
