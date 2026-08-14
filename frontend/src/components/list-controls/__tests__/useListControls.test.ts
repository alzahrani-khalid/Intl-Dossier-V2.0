/**
 * useListControls — Phase 87 F24 (AFF-02)
 *
 * Pure URL-param logic: whitelist parsing + filter/display reducers. The hook is
 * router-agnostic (search in, reducer-applier out) so it unit-tests with a mock
 * setSearch that captures the emitted reducer and asserts its output.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  useListControls,
  parseListControlsSearch,
  type ListControlsConfig,
} from '../useListControls'

const config: ListControlsConfig = {
  filters: [
    {
      key: 'status',
      labelKey: 'x',
      options: [
        { value: 'active', labelKey: 'a' },
        { value: 'archived', labelKey: 'b' },
      ],
    },
    {
      key: 'sensitivity',
      labelKey: 'y',
      options: [
        { value: 'high', labelKey: 'c' },
        { value: 'low', labelKey: 'd' },
      ],
    },
  ],
  sortFields: [
    { id: 'updated_at', labelKey: 's1' },
    { id: 'name', labelKey: 's2' },
  ],
  properties: [
    { id: 'name', labelKey: 'p1', defaultVisible: true },
    { id: 'engagements', labelKey: 'p2', defaultVisible: true },
    { id: 'sensitivity', labelKey: 'p3', defaultVisible: false },
  ],
}

type Reducer = (prev: Record<string, unknown>) => Record<string, unknown>

function makeSetSearch(): { setSearch: (r: Reducer) => void; last: () => Reducer } {
  let captured: Reducer | undefined
  return {
    setSearch: (r: Reducer): void => {
      captured = r
    },
    last: (): Reducer => {
      if (!captured) throw new Error('setSearch was not called')
      return captured
    },
  }
}

describe('parseListControlsSearch', () => {
  it('whitelists unknown filter values, invalid dir, and unknown cols to undefined', () => {
    const parsed = parseListControlsSearch(
      { status: 'bogus', dir: 'sideways', cols: 'a,b' },
      config,
    )
    expect(parsed.status).toBeUndefined()
    expect(parsed.dir).toBeUndefined()
    expect(parsed.cols).toBeUndefined()
  })

  it('keeps valid filter/display values and filters cols to known property ids', () => {
    const parsed = parseListControlsSearch(
      { status: 'active', dir: 'desc', sort: 'name', cols: 'name,bogus,sensitivity', group: 'x' },
      config,
    )
    expect(parsed.status).toBe('active')
    expect(parsed.dir).toBe('desc')
    expect(parsed.sort).toBe('name')
    expect(parsed.cols).toBe('name,sensitivity')
    // config declares no grouping → group param dropped
    expect(parsed.group).toBeUndefined()
  })
})

describe('useListControls', () => {
  it('setFilter sets the key and resets page to 1', () => {
    const { setSearch, last } = makeSetSearch()
    const { result } = renderHook(() => useListControls(config, { page: 3 }, setSearch))

    act(() => result.current.setFilter('status', 'active'))

    const out = last()({ page: 3 })
    expect(out.status).toBe('active')
    expect(out.page).toBe(1)
  })

  it('clearAll removes all filter keys, keeps display params, resets page to 1', () => {
    const { setSearch, last } = makeSetSearch()
    const search = {
      status: 'active',
      sensitivity: 'high',
      sort: 'name',
      dir: 'asc',
      cols: 'name,sensitivity',
      page: 4,
    }
    const { result } = renderHook(() => useListControls(config, search, setSearch))

    act(() => result.current.clearAll())

    const out = last()({ ...search })
    expect(out.status).toBeUndefined()
    expect(out.sensitivity).toBeUndefined()
    expect(out.sort).toBe('name')
    expect(out.dir).toBe('asc')
    expect(out.cols).toBe('name,sensitivity')
    expect(out.page).toBe(1)
  })

  it('toggleProperty round-trips through the comma-joined cols param; all-defaults clears it', () => {
    const { setSearch, last } = makeSetSearch()
    const { result, rerender } = renderHook(
      ({ s }: { s: Record<string, unknown> }) => useListControls(config, s, setSearch),
      { initialProps: { s: {} as Record<string, unknown> } },
    )

    // cols absent → defaults visible
    expect(result.current.visibleProperties).toEqual(['name', 'engagements'])

    act(() => result.current.toggleProperty('sensitivity'))
    expect(last()({}).cols).toBe('name,engagements,sensitivity')

    // feed the written cols back in → sensitivity now visible
    rerender({ s: { cols: 'name,engagements,sensitivity' } })
    expect(result.current.visibleProperties).toEqual(['name', 'engagements', 'sensitivity'])

    // toggling back to the default set produces a clean URL (cols undefined)
    act(() => result.current.toggleProperty('sensitivity'))
    expect(last()({ cols: 'name,engagements,sensitivity' }).cols).toBeUndefined()
  })

  it('resetDisplay removes sort/dir/cols/group but leaves filters intact', () => {
    const { setSearch, last } = makeSetSearch()
    const search = {
      status: 'active',
      sort: 'name',
      dir: 'asc',
      cols: 'name',
      group: 'g',
      page: 2,
    }
    const { result } = renderHook(() => useListControls(config, search, setSearch))

    act(() => result.current.resetDisplay())

    const out = last()({ ...search })
    expect(out.sort).toBeUndefined()
    expect(out.dir).toBeUndefined()
    expect(out.cols).toBeUndefined()
    expect(out.group).toBeUndefined()
    expect(out.status).toBe('active')
  })

  it('activeFilterCount counts only filter params, not display params', () => {
    const { setSearch } = makeSetSearch()
    const search = {
      status: 'active',
      sensitivity: 'high',
      sort: 'name',
      dir: 'asc',
      cols: 'name',
      page: 1,
    }
    const { result } = renderHook(() => useListControls(config, search, setSearch))

    expect(result.current.activeFilterCount).toBe(2)
  })
})
