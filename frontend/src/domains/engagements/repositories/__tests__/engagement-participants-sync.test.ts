import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncEngagementParticipants } from '../engagement-participants.repository'
import type { EngagementParticipant } from '@/types/engagement.types'

// Hoisted mock state so vi.mock can reference it. getUser/insert/delete().in()
// are reset per-test; the spies capture the exact payloads the diff produces.
const mockState = vi.hoisted(() => {
  return {
    getUser: vi.fn(),
    insertSpy: vi.fn(),
    deleteInSpy: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockState.getUser,
    },
    from: (table: string) => {
      if (table !== 'engagement_participants') {
        throw new Error(`unexpected table in test: ${table}`)
      }
      return {
        insert: mockState.insertSpy,
        delete: () => ({ in: mockState.deleteInSpy }),
      }
    },
  },
}))

// Minimal EngagementParticipant rows; only the fields the diff reads matter.
const participant = (over: Partial<EngagementParticipant>): EngagementParticipant =>
  ({
    id: 'row-x',
    engagement_id: 'eng-1',
    participant_type: 'country',
    role: 'delegate',
    attendance_status: 'expected',
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  }) as EngagementParticipant

describe('syncEngagementParticipants', () => {
  beforeEach(() => {
    mockState.getUser.mockReset()
    mockState.insertSpy.mockReset()
    mockState.deleteInSpy.mockReset()
    mockState.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockState.insertSpy.mockResolvedValue({ error: null })
    mockState.deleteInSpy.mockResolvedValue({ error: null })
  })

  it('inserts only the added dossier-linked participants, with created_by set', async () => {
    const original = [
      participant({ id: 'row-c1', participant_type: 'country', participant_dossier_id: 'c1' }),
    ]

    await syncEngagementParticipants(
      'eng-1',
      { countryIds: ['c1'], organizationIds: [], personIds: ['p1'] },
      original,
    )

    expect(mockState.insertSpy).toHaveBeenCalledTimes(1)
    const rows = mockState.insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      engagement_id: 'eng-1',
      participant_type: 'person',
      participant_dossier_id: 'p1',
      role: 'delegate',
      created_by: 'user-1',
    })
    // c1 already existed, so nothing is removed.
    expect(mockState.deleteInSpy).not.toHaveBeenCalled()
  })

  it('deletes removed dossier-linked participants by row id', async () => {
    const original = [
      participant({ id: 'row-c1', participant_type: 'country', participant_dossier_id: 'c1' }),
    ]

    await syncEngagementParticipants(
      'eng-1',
      { countryIds: [], organizationIds: [], personIds: [] },
      original,
    )

    expect(mockState.deleteInSpy).toHaveBeenCalledTimes(1)
    expect(mockState.deleteInSpy).toHaveBeenCalledWith('id', ['row-c1'])
    expect(mockState.insertSpy).not.toHaveBeenCalled()
  })

  it('preserves external / non-dossier participants — never deletes them', async () => {
    const original = [
      participant({ id: 'row-c1', participant_type: 'country', participant_dossier_id: 'c1' }),
      participant({
        id: 'row-ext',
        participant_type: 'external',
        participant_dossier_id: undefined,
        external_name_en: 'Jane Doe',
      }),
    ]

    await syncEngagementParticipants(
      'eng-1',
      { countryIds: [], organizationIds: [], personIds: [] },
      original,
    )

    // Only the dossier-linked country row is removed; the external row is kept.
    expect(mockState.deleteInSpy).toHaveBeenCalledTimes(1)
    expect(mockState.deleteInSpy).toHaveBeenCalledWith('id', ['row-c1'])
    expect(mockState.insertSpy).not.toHaveBeenCalled()
  })

  it('is a no-op when the selection already matches the original set', async () => {
    const original = [
      participant({ id: 'row-c1', participant_type: 'country', participant_dossier_id: 'c1' }),
    ]

    await syncEngagementParticipants(
      'eng-1',
      { countryIds: ['c1'], organizationIds: [], personIds: [] },
      original,
    )

    expect(mockState.insertSpy).not.toHaveBeenCalled()
    expect(mockState.deleteInSpy).not.toHaveBeenCalled()
  })
})
