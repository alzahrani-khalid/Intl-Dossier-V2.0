/**
 * useCreateManualBrief — manual-brief mutation (feature fde9aa72).
 *
 * Pins the camelCase -> snake_case mapping the hook applies before calling the
 * repository, that it unwraps `{ data }` to the BriefContent, and that
 * repository rejections propagate to the mutation's error state.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateManualBrief } from '../useCreateManualBrief'
import { createManualBrief } from '../../repositories/ai.repository'
import type { BriefContent } from '../../types'

vi.mock('../../repositories/ai.repository', () => ({
  createManualBrief: vi.fn(),
}))

const mockedCreateManualBrief = vi.mocked(createManualBrief)

function makeBrief(overrides: Partial<BriefContent> = {}): BriefContent {
  return {
    id: 'brief-1',
    title: 'Manual brief',
    executiveSummary: 'A summary',
    background: '',
    keyParticipants: [],
    relevantPositions: [],
    activeCommitments: [],
    historicalContext: '',
    talkingPoints: [],
    recommendations: '',
    citations: [],
    status: 'completed',
    ...overrides,
  }
}

function createWrapper(): ({ children }: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useCreateManualBrief', () => {
  beforeEach(() => {
    mockedCreateManualBrief.mockReset()
  })

  it('maps camelCase params to snake_case and returns the brief', async () => {
    const brief = makeBrief({ id: 'brief-42', title: 'Trade summary' })
    mockedCreateManualBrief.mockResolvedValue({ data: brief })

    const { result } = renderHook(() => useCreateManualBrief(), { wrapper: createWrapper() })

    result.current.mutate({
      engagementId: 'eng-1',
      dossierId: 'dos-1',
      summary: 'Trade summary',
      background: 'Some background',
      recommendations: 'Proceed',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedCreateManualBrief).toHaveBeenCalledTimes(1)
    expect(mockedCreateManualBrief).toHaveBeenCalledWith({
      engagement_id: 'eng-1',
      dossier_id: 'dos-1',
      summary: 'Trade summary',
      background: 'Some background',
      recommendations: 'Proceed',
    })
    expect(result.current.data).toEqual(brief)
  })

  it('passes through undefined optional fields without inventing values', async () => {
    mockedCreateManualBrief.mockResolvedValue({ data: makeBrief() })

    const { result } = renderHook(() => useCreateManualBrief(), { wrapper: createWrapper() })

    result.current.mutate({ dossierId: 'dos-9', summary: 'Only a summary' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedCreateManualBrief).toHaveBeenCalledWith({
      engagement_id: undefined,
      dossier_id: 'dos-9',
      summary: 'Only a summary',
      background: undefined,
      recommendations: undefined,
    })
  })

  it('propagates repository errors to the mutation error state', async () => {
    mockedCreateManualBrief.mockRejectedValue(new Error('Failed to save manual brief'))

    const { result } = renderHook(() => useCreateManualBrief(), { wrapper: createWrapper() })

    result.current.mutate({ dossierId: 'dos-1', summary: 'A summary' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Failed to save manual brief')
  })
})
