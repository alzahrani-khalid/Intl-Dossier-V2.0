/**
 * useRetentionPolicies — envelope unwrap pins (RETENTION-CAST-01, UI-SPEC §8).
 *
 * Every `/data-retention/*` list endpoint answers the project's `{ data: [...] }` envelope. The six
 * list hooks used to cast that body straight to the row array, so a body the page could not read
 * rendered as "No policies" over rows the server had sent — the confident lie this milestone kills.
 * Each queryFn now unwraps and VALIDATES: `data` not an array ⇒ throw ⇒ the region's error state.
 *
 * These tests ARE the ban on the forbidden fix shape: `Array.isArray(x) ? x : []` cannot pass the
 * malformed cases below.
 *
 * `useQuery` is mocked to hand back its own options object, so each hook's real queryFn is pinned
 * directly — no renderHook / QueryClientProvider plumbing. The repository layer is real; only the
 * network client underneath it is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/lib/api-client', () => ({
  apiGet: vi.fn(),
  apiGetBlob: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet } from '@/lib/api-client'
import {
  useRetentionPolicies,
  useLegalHolds,
  useRetentionStatistics,
  usePendingActions,
  useExpiringRecords,
  useExecutionLog,
} from '../useRetentionPolicies'

/** The mocked `useQuery` returns its options, so the hook's own queryFn is reachable. */
const queryFnOf = (hookResult: unknown): (() => Promise<unknown[]>) =>
  (hookResult as { queryFn: () => Promise<unknown[]> }).queryFn

const answers = (body: unknown): void => {
  vi.mocked(apiGet).mockResolvedValue(body)
}

const MALFORMED = /malformed retention envelope/

beforeEach(() => {
  vi.mocked(apiGet).mockReset()
})

describe('retention list hooks — envelope unwrap', () => {
  it('maps an N-row envelope to exactly those N rows', async () => {
    const rows = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    answers({ data: rows })

    await expect(queryFnOf(useRetentionPolicies({ status: 'active' }))()).resolves.toEqual(rows)
  })

  it('maps a truthful empty envelope to []', async () => {
    answers({ data: [] })

    await expect(queryFnOf(useRetentionPolicies({ status: 'active' }))()).resolves.toEqual([])
  })

  it('THROWS on a bare array — the old lying assumption is not an envelope', async () => {
    answers([{ id: 'p1' }])

    await expect(queryFnOf(useRetentionPolicies())()).rejects.toThrow(MALFORMED)
  })

  it('THROWS on a non-array `data`', async () => {
    answers({ data: 'not-an-array' })

    await expect(queryFnOf(useRetentionPolicies())()).rejects.toThrow(MALFORMED)
  })

  it('THROWS on an undefined body', async () => {
    answers(undefined)

    await expect(queryFnOf(useRetentionPolicies())()).rejects.toThrow(MALFORMED)
  })

  // All six, not a sample: the fix is the whole file. A coerce-to-[] in any one of them fails here.
  const listHooks: Array<[string, () => unknown]> = [
    ['useRetentionPolicies', () => useRetentionPolicies()],
    ['useLegalHolds', () => useLegalHolds()],
    ['useRetentionStatistics', () => useRetentionStatistics()],
    ['usePendingActions', () => usePendingActions()],
    ['useExpiringRecords', () => useExpiringRecords()],
    ['useExecutionLog', () => useExecutionLog()],
  ]

  it.each(listHooks)('%s unwraps its envelope', async (_name, hook) => {
    const rows = [{ id: 'row-1' }, { id: 'row-2' }]
    answers({ data: rows })

    await expect(queryFnOf(hook())()).resolves.toEqual(rows)
  })

  it.each(listHooks)(
    '%s throws instead of rendering empty on a malformed body',
    async (_n, hook) => {
      answers({ rows: [{ id: 'row-1' }] })

      await expect(queryFnOf(hook())()).rejects.toThrow(MALFORMED)
    },
  )
})
