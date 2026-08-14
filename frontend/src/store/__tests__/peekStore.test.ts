/**
 * peekStore — Wave-0 unit tests (Phase 87 plan 01 Task 1, F23 / AFF-01).
 *
 * Locks the position math, boundary disable (incl. cross-page next), and window
 * extension the DossierDrawer peek counter/chevrons depend on. The store is a
 * module singleton, so each test resets via clear() in beforeEach.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { usePeekStore } from '../peekStore'

const s = (): ReturnType<typeof usePeekStore.getState> => usePeekStore.getState()

describe('peekStore', () => {
  beforeEach(() => {
    s().clear()
  })

  it('positionOf returns the global 0-based position of a registered id', () => {
    s().register({ ids: ['a', 'b', 'c'], type: 'country', total: 15, pageOffset: 0 })
    expect(s().positionOf('b')).toBe(1)
    // pageOffset offsets the global index (window is page 2 of the filtered list)
    s().register({ ids: ['d', 'e', 'f'], type: 'country', total: 15, pageOffset: 3 })
    expect(s().positionOf('e')).toBe(4)
  })

  it('positionOf returns null for an id outside the loaded window', () => {
    s().register({ ids: ['a', 'b', 'c'], type: 'country', total: 15, pageOffset: 0 })
    expect(s().positionOf('zzz')).toBeNull()
  })

  it('canPrev/canNext derive from global position vs total, incl. cross-page next at the window edge', () => {
    // first row of the full list → no prev, has next
    s().register({ ids: ['a', 'b', 'c'], type: 'country', total: 15, pageOffset: 0 })
    expect(s().canPrev('a')).toBe(false)
    expect(s().canNext('a')).toBe(true)
    // last id of the LOADED window but not of the full list → canNext TRUE (cross-page)
    expect(s().canNext('c')).toBe(true)
    // the true last row of the full list → no next, has prev
    s().register({ ids: ['n', 'o'], type: 'country', total: 15, pageOffset: 13 })
    expect(s().positionOf('o')).toBe(14) // total - 1
    expect(s().canNext('o')).toBe(false)
    expect(s().canPrev('o')).toBe(true)
  })

  it('extendWindow appends on next and prepends + shifts pageOffset on prev', () => {
    s().register({ ids: ['d', 'e', 'f'], type: 'country', total: 15, pageOffset: 3 })
    s().extendWindow(['g', 'h', 'i'], 'next')
    expect(s().ids).toEqual(['d', 'e', 'f', 'g', 'h', 'i'])
    expect(s().pageOffset).toBe(3) // unchanged on append
    expect(s().positionOf('g')).toBe(6)
    s().extendWindow(['a', 'b', 'c'], 'prev')
    expect(s().ids).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
    expect(s().pageOffset).toBe(0) // 3 - 3
    expect(s().positionOf('d')).toBe(3)
  })

  it('clear resets to the empty registry so positionOf is null for everything', () => {
    s().register({ ids: ['a', 'b'], type: 'country', total: 2, pageOffset: 0 })
    s().clear()
    expect(s().ids).toEqual([])
    expect(s().total).toBe(0)
    expect(s().positionOf('a')).toBeNull()
  })

  it('register replaces any prior registration wholesale (no merge)', () => {
    s().register({
      ids: ['a', 'b', 'c'],
      type: 'country',
      total: 15,
      pageOffset: 0,
      fetchPage: async (): Promise<string[]> => [],
    })
    s().register({ ids: ['x'], type: 'organization', total: 1, pageOffset: 0 })
    expect(s().ids).toEqual(['x'])
    expect(s().type).toBe('organization')
    expect(s().total).toBe(1)
    expect(s().positionOf('a')).toBeNull() // old window gone
    expect(s().fetchPage).toBeUndefined() // old callback cleared, not merged
  })
})
