/**
 * Density migration shim (Plan 42-03 R-03).
 *
 * Verifies that legacy `id.density='spacious'` localStorage values are
 * one-time rewritten to `'dense'` on first read by DesignProvider, and
 * that all other valid values are left untouched.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DesignProvider } from '../DesignProvider'

const STORAGE_KEY = 'id.density'

describe('Density migration shim (Plan 42-03 R-03)', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    setItemSpy.mockRestore()
    cleanup()
    localStorage.clear()
  })

  it('rewrites legacy "spacious" → "dense" on first read', () => {
    localStorage.setItem(STORAGE_KEY, 'spacious')
    setItemSpy.mockClear() // ignore the seeding setItem call above
    render(
      <DesignProvider>
        <div>child</div>
      </DesignProvider>,
    )
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'dense')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dense')
  })

  it('leaves "comfortable" untouched (no rewrite)', () => {
    localStorage.setItem(STORAGE_KEY, 'comfortable')
    setItemSpy.mockClear()
    render(
      <DesignProvider>
        <div>child</div>
      </DesignProvider>,
    )
    const densityWrites = setItemSpy.mock.calls.filter((c) => c[0] === STORAGE_KEY)
    expect(densityWrites).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('comfortable')
  })

  it('leaves "dense" untouched (idempotent — no rewrite on second mount)', () => {
    localStorage.setItem(STORAGE_KEY, 'dense')
    setItemSpy.mockClear()
    render(
      <DesignProvider>
        <div>child</div>
      </DesignProvider>,
    )
    const densityWrites = setItemSpy.mock.calls.filter((c) => c[0] === STORAGE_KEY)
    expect(densityWrites).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dense')
  })

  it('does not write when key is missing (default density used)', () => {
    setItemSpy.mockClear()
    render(
      <DesignProvider>
        <div>child</div>
      </DesignProvider>,
    )
    const densityWrites = setItemSpy.mock.calls.filter((c) => c[0] === STORAGE_KEY)
    expect(densityWrites).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
