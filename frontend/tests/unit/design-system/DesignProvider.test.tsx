/**
 * Phase 33 plan 33-02 — DesignProvider unit tests.
 *
 * Exercises the six behaviours listed in the plan's test plan:
 *   1. Initial render writes tokens to :root
 *   2. setDirection → data-direction + localStorage persist
 *   3. setMode → .dark class toggles on <html>
 *   4. setHue → --sla-risk re-derives with (h+55)%360
 *   5. setDensity → --row-h reflects density preset
 *   6. `storage` event from another tab updates state
 *
 * Tests also verify each hook throws when used outside the provider.
 */

import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DesignProvider } from '@/design-system/DesignProvider'
import { useDensity } from '@/design-system/hooks/useDensity'
import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useDesignTokens } from '@/design-system/hooks/useDesignTokens'
import { useHue } from '@/design-system/hooks/useHue'
import { useMode } from '@/design-system/hooks/useMode'

const wrapper = ({ children }: { children: ReactNode }) => (
  <DesignProvider
    initialDirection="chancery"
    initialMode="light"
    initialHue={22}
    initialDensity="comfortable"
  >
    {children}
  </DesignProvider>
)

const resetRoot = (): void => {
  document.documentElement.removeAttribute('style')
  document.documentElement.classList.remove('dark')
  document.documentElement.removeAttribute('data-direction')
  document.documentElement.removeAttribute('data-density')
}

describe('DesignProvider — initial render', () => {
  beforeEach(() => {
    localStorage.clear()
    resetRoot()
  })

  afterEach(() => {
    resetRoot()
    localStorage.clear()
  })

  it('writes at least one token to :root on mount (--bg is non-empty)', () => {
    render(<DesignProvider>placeholder</DesignProvider>)

    const bg = document.documentElement.style.getPropertyValue('--bg')
    expect(bg).not.toBe('')
  })

  it('renders children inside the design-provider test wrapper', () => {
    const { getByTestId } = render(
      <DesignProvider>
        <span>child</span>
      </DesignProvider>,
    )

    expect(getByTestId('design-provider').textContent).toBe('child')
  })

  it('reads direction from localStorage when present', () => {
    localStorage.setItem('id.dir', 'bureau')

    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    expect(result.current.direction).toBe('bureau')
  })

  it('falls back to initialDirection when localStorage value is invalid', () => {
    localStorage.setItem('id.dir', 'not-a-direction')

    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    expect(result.current.direction).toBe('chancery')
  })
})

describe('DesignProvider — setters', () => {
  beforeEach(() => {
    localStorage.clear()
    resetRoot()
  })

  afterEach(() => {
    resetRoot()
    localStorage.clear()
  })

  it('setDirection updates state, data-direction attribute, and localStorage', () => {
    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    act(() => {
      result.current.setDirection('situation')
    })

    expect(result.current.direction).toBe('situation')
    expect(document.documentElement.getAttribute('data-direction')).toBe('situation')
    expect(localStorage.getItem('id.dir')).toBe('situation')
  })

  it('setMode("dark") adds .dark class to <html> and persists id.theme', () => {
    const { result } = renderHook(() => useMode(), { wrapper })

    act(() => {
      result.current.setMode('dark')
    })

    expect(result.current.mode).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('id.theme')).toBe('dark')
  })

  it('setMode("light") removes .dark class from <html>', () => {
    const { result } = renderHook(() => useMode(), { wrapper })

    act(() => {
      result.current.setMode('dark')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.setMode('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setHue(200) recomputes --sla-risk with hue+55 wrapped at 360', () => {
    // hue=200 → (200+55) % 360 = 255, so --sla-risk should contain "255"
    const hookResult = renderHook(
      () => ({
        hue: useHue(),
        tokens: useDesignTokens(),
      }),
      { wrapper },
    )

    act(() => {
      hookResult.result.current.hue.setHue(200)
    })

    expect(hookResult.result.current.tokens['--sla-risk']).toContain('255')
  })

  it('setDensity("dense") updates --row-h to 32px and data-density attribute', () => {
    const { result } = renderHook(() => useDensity(), { wrapper })

    act(() => {
      result.current.setDensity('dense')
    })

    expect(result.current.density).toBe('dense')
    expect(document.documentElement.style.getPropertyValue('--row-h')).toBe('32px')
    expect(document.documentElement.getAttribute('data-density')).toBe('dense')
    expect(localStorage.getItem('id.density')).toBe('dense')
  })

  it('setter dispatches a designChange CustomEvent', () => {
    const listener = vi.fn()
    window.addEventListener('designChange', listener)

    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    act(() => {
      result.current.setDirection('ministerial')
    })

    expect(listener).toHaveBeenCalled()
    window.removeEventListener('designChange', listener)
  })
})

describe('DesignProvider — cross-tab storage sync', () => {
  beforeEach(() => {
    localStorage.clear()
    resetRoot()
  })

  afterEach(() => {
    resetRoot()
    localStorage.clear()
  })

  it('updates direction when another tab writes id.dir', () => {
    const { result } = renderHook(() => useDesignDirection(), { wrapper })
    expect(result.current.direction).toBe('chancery')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'id.dir',
          newValue: 'bureau',
        }),
      )
    })

    expect(result.current.direction).toBe('bureau')
  })

  it('ignores storage events with invalid values', () => {
    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'id.dir',
          newValue: 'gibberish',
        }),
      )
    })

    expect(result.current.direction).toBe('chancery')
  })

  it('syncs mode across tabs', () => {
    const { result } = renderHook(() => useMode(), { wrapper })

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'id.theme',
          newValue: 'dark',
        }),
      )
    })

    expect(result.current.mode).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('DesignProvider — hook guards', () => {
  it('useDesignDirection throws outside provider', () => {
    expect(() => renderHook(() => useDesignDirection())).toThrow(
      /useDesignDirection must be used within/,
    )
  })

  it('useMode throws outside provider', () => {
    expect(() => renderHook(() => useMode())).toThrow(/useMode must be used within/)
  })

  it('useHue throws outside provider', () => {
    expect(() => renderHook(() => useHue())).toThrow(/useHue must be used within/)
  })

  it('useDensity throws outside provider', () => {
    expect(() => renderHook(() => useDensity())).toThrow(/useDensity must be used within/)
  })

  it('useDesignTokens throws outside provider', () => {
    expect(() => renderHook(() => useDesignTokens())).toThrow(/useDesignTokens must be used within/)
  })
})
