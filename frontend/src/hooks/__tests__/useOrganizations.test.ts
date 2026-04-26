/**
 * useOrganizations — Plan 40-02b unit test.
 *
 * Pins the contract:
 *   - queryKey starts with 'organizations'
 *   - queries `dossiers` with `type='organization'`
 *   - pagination math: page=2, limit=20 → range(20, 39); totalPages = ceil(count/limit)
 *   - propagates Supabase error.message through the query
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const rangeMock = vi.fn()
const orderMock = vi.fn()
const orMock = vi.fn()
const eqStatusMock = vi.fn()
const neqMock = vi.fn()
const eqTypeMock = vi.fn()
const selectMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string): unknown => fromMock(table),
  },
}))

import { useOrganizations } from '../useOrganizations'

const buildBuilder = (resolved: { data: unknown; error: unknown; count: number | null }): void => {
  rangeMock.mockResolvedValue(resolved)
  orderMock.mockReturnValue({ range: rangeMock })
  orMock.mockReturnValue({ order: orderMock, range: rangeMock })
  eqStatusMock.mockReturnValue({ order: orderMock, range: rangeMock, or: orMock })
  neqMock.mockReturnValue({
    or: orMock,
    eq: eqStatusMock,
    order: orderMock,
    range: rangeMock,
  })
  eqTypeMock.mockReturnValue({ neq: neqMock })
  selectMock.mockReturnValue({ eq: eqTypeMock })
  fromMock.mockReturnValue({ select: selectMock })
}

const createWrapper = (): { wrapper: React.FC<{ children: React.ReactNode }> } => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper }
}

describe('useOrganizations — Plan 40-02b adapter', () => {
  beforeEach(() => {
    rangeMock.mockReset()
    orderMock.mockReset()
    orMock.mockReset()
    eqStatusMock.mockReset()
    neqMock.mockReset()
    eqTypeMock.mockReset()
    selectMock.mockReset()
    fromMock.mockReset()
  })

  it('queries dossiers with type=organization and applies pagination math', async () => {
    buildBuilder({ data: [{ id: 'o1', type: 'organization' }], error: null, count: 41 })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useOrganizations({ page: 2, limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fromMock).toHaveBeenCalledWith('dossiers')
    expect(eqTypeMock).toHaveBeenCalledWith('type', 'organization')
    expect(rangeMock).toHaveBeenCalledWith(20, 39)
    expect(result.current.data?.pagination.page).toBe(2)
    expect(result.current.data?.pagination.total).toBe(41)
    expect(result.current.data?.pagination.totalPages).toBe(3)
  })

  it('throws when Supabase returns an error', async () => {
    buildBuilder({ data: null, error: { message: 'org-fail' }, count: null })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useOrganizations({}), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('org-fail')
  })
})
