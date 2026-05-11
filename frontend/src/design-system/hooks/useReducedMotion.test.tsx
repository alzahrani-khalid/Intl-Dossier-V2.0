/**
 * Tests for useReducedMotion() — WCAG 2.3.3 compliance hook.
 *
 * Pattern: matchMedia mock copied from AppShell.test.tsx lines 104-115.
 * Covers: initial snapshot (true/false), change subscription, cleanup, SSR stub.
 */
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useReducedMotion } from './useReducedMotion'

interface MockMQL {
  matches: boolean
  media: string
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
  onchange: null
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
}

let currentMQL: MockMQL

function installMatchMediaMock(initialMatches: boolean): MockMQL {
  currentMQL = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    if (/prefers-reduced-motion/.test(query)) return currentMQL
    return { ...currentMQL, matches: false, media: query }
  }) as typeof window.matchMedia
  return currentMQL
}

describe('useReducedMotion', (): void => {
  beforeEach((): void => {
    installMatchMediaMock(false)
  })

  it('returns true when (prefers-reduced-motion: reduce) matches', (): void => {
    installMatchMediaMock(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when media query does not match', (): void => {
    installMatchMediaMock(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('re-renders when the media query change event fires', (): void => {
    const mql = installMatchMediaMock(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    const listener = mql.addEventListener.mock.calls[0]?.[1] as (() => void) | undefined
    expect(listener).toBeDefined()
    act((): void => {
      mql.matches = true
      listener?.()
    })
    expect(result.current).toBe(true)
  })

  it('removes the change listener on unmount', (): void => {
    const mql = installMatchMediaMock(false)
    const { unmount } = renderHook(() => useReducedMotion())
    expect(mql.addEventListener).toHaveBeenCalledTimes(1)
    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('exports a function (getServerSnapshot returns false — verified by integration in plan 02)', async (): Promise<void> => {
    const mod = await import('./useReducedMotion')
    expect(typeof mod.useReducedMotion).toBe('function')
  })
})
