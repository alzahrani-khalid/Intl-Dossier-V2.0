/**
 * useQuickSwitcherSearch — quick-switcher dead-link retarget pins (UI-SPEC A-8).
 *
 * Pins getWorkItemUrl: the three live dead links must never emit /mous/$id or
 * /documents/$id. mou retargets to the mounted /mous list (or the owning org's
 * mounted /mous tab); document retargets to the owning dossier's /docs tab when
 * a non-engagement dossier_context exists, else SUPPRESS (null). Suppression =
 * the affordance is absent, never disabled.
 */
import { describe, it, expect } from 'vitest'
import { getWorkItemUrl } from '../useQuickSwitcherSearch'
import type { QuickSwitcherWorkItem } from '../useQuickSwitcherSearch'
import type { DossierType } from '@/lib/dossier-type-guards'

function makeItem(overrides: Partial<QuickSwitcherWorkItem>): QuickSwitcherWorkItem {
  return {
    id: 'wi-1',
    type: 'task',
    title_en: 'Item',
    title_ar: 'عنصر',
    relevance_score: 1,
    matched_field: 'title',
    updated_at: '2026-06-13T00:00:00Z',
    ...overrides,
  }
}

function context(type: DossierType): QuickSwitcherWorkItem['dossier_context'] {
  return { id: 'ctx-1', type, name_en: 'Ctx', name_ar: 'سياق' }
}

describe('getWorkItemUrl', () => {
  it('maps position/task/commitment/intake unchanged', () => {
    expect(getWorkItemUrl(makeItem({ id: 'p1', type: 'position' }))).toBe('/positions/p1')
    expect(getWorkItemUrl(makeItem({ id: 't1', type: 'task' }))).toBe('/tasks/t1')
    expect(getWorkItemUrl(makeItem({ id: 'c1', type: 'commitment' }))).toBe('/commitments?id=c1')
    expect(getWorkItemUrl(makeItem({ id: 'i1', type: 'intake' }))).toBe('/intake/tickets/i1')
  })

  describe('mou — never /mous/$id', () => {
    it('without context → /mous list', () => {
      expect(getWorkItemUrl(makeItem({ id: 'm1', type: 'mou' }))).toBe('/mous')
    })

    it('with organization context → owning org mounted /mous tab', () => {
      const url = getWorkItemUrl(
        makeItem({ id: 'm1', type: 'mou', dossier_context: context('organization') }),
      )
      expect(url).toBe('/dossiers/organizations/ctx-1/mous')
    })

    it('with non-org context → /mous list', () => {
      const url = getWorkItemUrl(
        makeItem({ id: 'm1', type: 'mou', dossier_context: context('country') }),
      )
      expect(url).toBe('/mous')
    })
  })

  describe('document — never /documents/$id', () => {
    it('with country context → owning dossier /docs tab', () => {
      const url = getWorkItemUrl(
        makeItem({ id: 'd1', type: 'document', dossier_context: context('country') }),
      )
      expect(url).toBe('/dossiers/countries/ctx-1/docs')
    })

    it('without context → suppressed (null)', () => {
      expect(getWorkItemUrl(makeItem({ id: 'd1', type: 'document' }))).toBeNull()
    })

    it('with engagement context → suppressed (null, no /docs tab under engagements)', () => {
      const url = getWorkItemUrl(
        makeItem({ id: 'd1', type: 'document', dossier_context: context('engagement') }),
      )
      expect(url).toBeNull()
    })
  })
})
