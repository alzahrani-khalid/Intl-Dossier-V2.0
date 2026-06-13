import { beforeEach, describe, expect, it, vi } from 'vitest'
import { engagementWizardConfig } from '../config/engagement.config'
import type { EngagementFormData } from '../schemas/engagement.schema'

// Hoisted mock state so vi.mock can reference it. getUser/insert are
// reset per-test; insertSpy captures the exact payload postCreate builds.
const mockState = vi.hoisted(() => {
  return {
    getUser: vi.fn(),
    insertSpy: vi.fn(),
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
      return { insert: mockState.insertSpy }
    },
  },
}))

// postCreate reads only the three participant id arrays from form data;
// the rest of EngagementFormData is irrelevant to the insert payload, so a
// minimal object cast through unknown is sufficient.
const makeFormData = (overrides: Partial<EngagementFormData>): EngagementFormData =>
  ({
    participant_country_ids: [],
    participant_organization_ids: [],
    participant_person_ids: [],
    ...overrides,
  }) as unknown as EngagementFormData

const callPostCreate = async (engagementId: string, data: EngagementFormData): Promise<void> => {
  const { postCreate } = engagementWizardConfig
  if (postCreate == null) {
    throw new Error('engagementWizardConfig.postCreate is not defined')
  }
  await postCreate(engagementId, data)
}

describe('engagementWizardConfig.postCreate participant payload', () => {
  beforeEach(() => {
    mockState.getUser.mockReset()
    mockState.insertSpy.mockReset()
    mockState.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockState.insertSpy.mockResolvedValue({ error: null })
  })

  it('inserts one row per participant with created_by set to the authenticated user id', async () => {
    const formData = makeFormData({
      participant_country_ids: ['c1'],
      participant_person_ids: ['p1'],
    })

    await callPostCreate('eng-1', formData)

    expect(mockState.insertSpy).toHaveBeenCalledTimes(1)
    const rows = mockState.insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>
    expect(rows).toHaveLength(2)

    for (const row of rows) {
      expect(row.created_by).toBe('user-1')
      expect(row.engagement_id).toBe('eng-1')
      expect(row.role).toBe('delegate')
    }

    const country = rows.find((r) => r.participant_type === 'country')
    const person = rows.find((r) => r.participant_type === 'person')
    expect(country?.participant_dossier_id).toBe('c1')
    expect(person?.participant_dossier_id).toBe('p1')
  })

  it('does not call insert when every participant id array is empty', async () => {
    const formData = makeFormData({})

    await callPostCreate('eng-1', formData)

    expect(mockState.insertSpy).not.toHaveBeenCalled()
  })

  it('skips insert without throwing when no authenticated user can be resolved', async () => {
    mockState.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const formData = makeFormData({ participant_person_ids: ['p1'] })

    await expect(callPostCreate('eng-1', formData)).resolves.toBeUndefined()

    expect(mockState.insertSpy).not.toHaveBeenCalled()
  })
})
