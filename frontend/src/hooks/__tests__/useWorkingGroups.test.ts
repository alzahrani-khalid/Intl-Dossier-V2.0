import { beforeEach, describe, expect, it, vi } from 'vitest'

const { eqMock, fromMock, neqMock, orMock, rpcMock, selectMock } = vi.hoisted(() => ({
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  neqMock: vi.fn(),
  orMock: vi.fn(),
  rpcMock: vi.fn(),
  selectMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock, rpc: rpcMock },
}))

import { fetchWorkingGroupsPage } from '../useWorkingGroups'

describe('fetchWorkingGroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rpcMock.mockResolvedValue({ data: [], error: null })
    orMock.mockResolvedValue({ count: 0 })
    neqMock.mockReturnValue({ or: orMock })
    eqMock.mockReturnValue({ neq: neqMock })
    selectMock.mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ select: selectMock })
  })

  it('quotes reserved count-search characters without stripping dots', async () => {
    await fetchWorkingGroupsPage({ search: 'a,b(c).d' })

    expect(orMock).toHaveBeenCalledWith('name_en.ilike."%a,b(c).d%",name_ar.ilike."%a,b(c).d%"')
  })
})
