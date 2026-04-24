/**
 * usePersonalCommitments — Phase 38 adapter hook unit test.
 *
 * Critical assertions (T-38-09 mitigation, Pitfall 8):
 *   1. `useCommitments` is called with `ownerType: 'internal'` so external-
 *      contact commitments NEVER reach the personal dashboard.
 *   2. Severity tiers map correctly: daysOverdue 1..2 → yellow, 3..6 → amber,
 *      7+ → red.
 *   3. Commitments not yet overdue (daysOverdue === 0) are filtered out.
 *   4. Items are grouped by `dossier_id`.
 */

import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deriveSeverity, deriveInitials } from '../usePersonalCommitments'

const useCommitmentsMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('@/hooks/useCommitments', () => ({
  useCommitments: (opts?: unknown) => useCommitmentsMock(opts),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

import { usePersonalCommitments } from '../usePersonalCommitments'

const DAY_MS = 86_400_000

function makeCommitment(overrides: Record<string, unknown>): Record<string, unknown> {
  const base = {
    id: 'c-default',
    dossier_id: 'd-default',
    after_action_id: null,
    title: 'Default',
    description: '',
    due_date: new Date(Date.now() - 1 * DAY_MS).toISOString(),
    status: 'pending',
    priority: 'medium',
    owner_type: 'internal',
    owner_user_id: 'u-1',
    owner_contact_id: null,
    tracking_mode: 'automatic',
    proof_required: false,
    proof_url: null,
    evidence_submitted_at: null,
    completed_at: null,
    completion_notes: null,
    ai_confidence: null,
    status_changed_at: null,
    created_by: null,
    updated_by: null,
    created_at: null,
    updated_at: null,
  }
  return { ...base, ...overrides }
}

describe('usePersonalCommitments — Phase 38 adapter (T-38-09)', () => {
  beforeEach(() => {
    useCommitmentsMock.mockReset()
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({ user: { id: 'me-42' } })
  })

  it("CRITICAL: passes ownerType: 'internal' to useCommitments (T-38-09 mitigation)", () => {
    useCommitmentsMock.mockReturnValue({
      data: { commitments: [] },
      isLoading: false,
      isError: false,
    })

    renderHook(() => usePersonalCommitments())

    expect(useCommitmentsMock).toHaveBeenCalledTimes(1)
    const callArg = useCommitmentsMock.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.ownerType).toBe('internal')
    expect(callArg.ownerId).toBe('me-42')
  })

  it('forwards loading/error state and undefined data while loading', () => {
    useCommitmentsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { result } = renderHook(() => usePersonalCommitments())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('groups overdue commitments by dossier_id and skips not-yet-overdue items', () => {
    const future = new Date(Date.now() + 2 * DAY_MS).toISOString()
    const fiveDaysAgo = new Date(Date.now() - 5 * DAY_MS).toISOString()
    const oneDayAgo = new Date(Date.now() - 1 * DAY_MS).toISOString()
    useCommitmentsMock.mockReturnValue({
      data: {
        commitments: [
          makeCommitment({ id: 'c1', dossier_id: 'A', due_date: fiveDaysAgo }),
          makeCommitment({ id: 'c2', dossier_id: 'A', due_date: oneDayAgo }),
          makeCommitment({ id: 'c3', dossier_id: 'B', due_date: fiveDaysAgo }),
          makeCommitment({ id: 'c4', dossier_id: 'C', due_date: future }),
        ],
      },
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => usePersonalCommitments())

    expect(result.current.data).toBeDefined()
    const groups = result.current.data ?? []
    expect(groups.map((g) => g.dossierId).sort()).toEqual(['A', 'B'])
    const groupA = groups.find((g) => g.dossierId === 'A')
    expect(groupA?.commitments.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('derives severity tiers correctly: 1..2 → yellow, 3..6 → amber, ≥7 → red', () => {
    expect(deriveSeverity(1)).toBe('yellow')
    expect(deriveSeverity(2)).toBe('yellow')
    expect(deriveSeverity(3)).toBe('amber')
    expect(deriveSeverity(6)).toBe('amber')
    expect(deriveSeverity(7)).toBe('red')
    expect(deriveSeverity(30)).toBe('red')
  })

  it('derives initials from a display name (max 2 chars)', () => {
    expect(deriveInitials('Khalid Alzahrani')).toBe('KA')
    expect(deriveInitials('jane')).toBe('J')
    expect(deriveInitials('  Mary Jane Watson  ')).toBe('MJ')
    expect(deriveInitials('')).toBe('')
  })

  it('does not call useCommitments query when there is no authenticated user.id', () => {
    useAuthMock.mockReturnValue({ user: null })
    useCommitmentsMock.mockReturnValue({ data: undefined, isLoading: false, isError: false })

    renderHook(() => usePersonalCommitments())

    const callArg = useCommitmentsMock.mock.calls[0][0] as Record<string, unknown>
    expect(callArg.enabled).toBe(false)
  })
})
