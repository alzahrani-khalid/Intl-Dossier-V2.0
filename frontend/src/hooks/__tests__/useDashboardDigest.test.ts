/**
 * useDashboardDigest — Phase 45 plan 02 hook contract (renamed in Phase 54).
 *
 * Pins the dashboard digest read path to the dashboard_digest table and
 * the source_publication field before wiring the Digest widget to it.
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const limitMock = vi.fn()
const orderMock = vi.fn()
const selectMock = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string): unknown => fromMock(table),
  },
}))

import { useDashboardDigest } from '../useDashboardDigest'

const createWrapper = (): { wrapper: React.FC<{ children: React.ReactNode }> } => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper }
}

const buildBuilder = (resolved: { data: unknown; error: unknown }): void => {
  limitMock.mockResolvedValue(resolved)
  orderMock.mockReturnValue({ limit: limitMock })
  selectMock.mockReturnValue({ order: orderMock })
  fromMock.mockReturnValue({ select: selectMock })
}

beforeEach((): void => {
  limitMock.mockReset()
  orderMock.mockReset()
  selectMock.mockReset()
  fromMock.mockReset()
})

describe('useDashboardDigest', (): void => {
  it('queries dashboard_digest with publication source fields and default limit', async (): Promise<void> => {
    buildBuilder({
      data: [
        {
          id: 'digest-1',
          headline_en: 'Oil market update',
          headline_ar: null,
          summary_en: null,
          summary_ar: null,
          source_publication: 'Reuters',
          occurred_at: '2026-05-01T09:00:00Z',
          dossier_id: null,
          created_at: '2026-05-01T09:10:00Z',
        },
      ],
      error: null,
    })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDashboardDigest(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fromMock).toHaveBeenCalledWith('dashboard_digest')
    expect(selectMock).toHaveBeenCalledWith(
      'id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id, created_at',
    )
    expect(orderMock).toHaveBeenCalledWith('occurred_at', { ascending: false })
    expect(limitMock).toHaveBeenCalledWith(6)
    expect(result.current.data?.[0]?.source_publication).toBe('Reuters')
  })

  it('surfaces Supabase errors with digest-specific context', async (): Promise<void> => {
    buildBuilder({ data: null, error: { message: 'permission denied' } })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDashboardDigest(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toMatch(
      /^Failed to fetch dashboard digest: permission denied/,
    )
  })
})
