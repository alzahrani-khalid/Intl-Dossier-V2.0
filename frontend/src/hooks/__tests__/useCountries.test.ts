/**
 * useCountries — Plan 40-02b unit test.
 *
 * Pins the contract:
 *   - queryKey starts with 'countries'
 *   - pagination math: page=2, limit=20 → range(20, 39); totalPages = ceil(count/limit)
 *   - propagates Supabase error.message through the query
 *
 * Mocks `@/lib/supabase` with chained builder so we can capture `.range()` args.
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
const inMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string): unknown => fromMock(table),
  },
}))

import { useCountries } from '../useCountries'

const buildBuilder = (
  resolved: { data: unknown; error: unknown; count: number | null },
  // Resolution for the secondary `countries` extension lookup
  // (from('countries').select('id, iso_code_2').in('id', ids)).
  countriesResolved: { data: unknown; error: unknown } = { data: [], error: null },
): void => {
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
  inMock.mockResolvedValue(countriesResolved)
  // selectMock is shared by both from('dossiers') and from('countries'); it must
  // expose `.eq` (dossiers chain) and `.in` (countries chain).
  selectMock.mockReturnValue({ eq: eqTypeMock, in: inMock })
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

describe('useCountries — Plan 40-02b adapter', () => {
  beforeEach(() => {
    rangeMock.mockReset()
    orderMock.mockReset()
    orMock.mockReset()
    eqStatusMock.mockReset()
    neqMock.mockReset()
    eqTypeMock.mockReset()
    selectMock.mockReset()
    inMock.mockReset()
    fromMock.mockReset()
  })

  it('queries dossiers with type=country, applies pagination math, and returns totalPages', async () => {
    buildBuilder({ data: [{ id: 'c1', type: 'country' }], error: null, count: 47 })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCountries({ page: 2, limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fromMock).toHaveBeenCalledWith('dossiers')
    expect(eqTypeMock).toHaveBeenCalledWith('type', 'country')
    expect(rangeMock).toHaveBeenCalledWith(20, 39)
    expect(result.current.data?.pagination.page).toBe(2)
    expect(result.current.data?.pagination.limit).toBe(20)
    expect(result.current.data?.pagination.total).toBe(47)
    expect(result.current.data?.pagination.totalPages).toBe(3)
    expect(result.current.data?.data.length).toBe(1)
  })

  it('merges iso_code from the countries extension lookup', async () => {
    buildBuilder(
      { data: [{ id: 'c1', type: 'country' }], error: null, count: 1 },
      { data: [{ id: 'c1', iso_code_2: 'CN' }], error: null },
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCountries({}), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fromMock).toHaveBeenCalledWith('countries')
    expect(inMock).toHaveBeenCalledWith('id', ['c1'])
    expect((result.current.data?.data[0] as { iso_code?: string } | undefined)?.iso_code).toBe('CN')
  })

  it('throws when Supabase returns an error', async () => {
    buildBuilder({ data: null, error: { message: 'boom' }, count: null })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCountries({}), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('boom')
  })
})
