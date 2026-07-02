/**
 * Phase 33 plan 33-02 — DesignProvider unit tests.
 *
 * Exercises the provider behaviours (Phase 77: hue axis retired):
 *   1. Initial render writes tokens to :root
 *   2. setDirection → data-direction + localStorage persist (Linear-only)
 *   3. setMode → .dark class toggles on <html>
 *   4. setDensity → --row-h reflects density preset
 *   5. `storage` event from another tab updates state
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
import { useMode } from '@/design-system/hooks/useMode'

// Plan 77-04: direction is a constant 'linear' regardless of initialDirection/
// stored id.dir. initialMode="light" here exercises the light Linear token set;
// the dark-default and light-preservation cases use a bare provider below.
const wrapper = ({ children }: { children: ReactNode }) => (
  <DesignProvider initialDirection="linear" initialMode="light" initialDensity="comfortable">
    {children}
  </DesignProvider>
)

const bareWrapper = ({ children }: { children: ReactNode }) => (
  <DesignProvider>{children}</DesignProvider>
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

  it('coerces any stored (retired) id.dir to linear on init (TOKEN-04)', () => {
    localStorage.setItem('id.dir', 'bureau')

    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    expect(result.current.direction).toBe('linear')
  })

  it('initializes to linear regardless of an invalid stored id.dir', () => {
    localStorage.setItem('id.dir', 'not-a-direction')

    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    expect(result.current.direction).toBe('linear')
  })

  it('removes a retired id.hue key on mount (Phase 77 — hue axis retired)', () => {
    localStorage.setItem('id.hue', '200')

    renderHook(() => useDesignTokens(), { wrapper })

    expect(localStorage.getItem('id.hue')).toBeNull()
  })

  it('defaults to dark mode when id.theme is unset (Linear-canonical)', () => {
    const { result } = renderHook(() => useMode(), { wrapper: bareWrapper })

    expect(result.current.mode).toBe('dark')
  })

  it('preserves an explicitly persisted id.theme="light"', () => {
    localStorage.setItem('id.theme', 'light')

    const { result } = renderHook(() => useMode(), { wrapper: bareWrapper })

    expect(result.current.mode).toBe('light')
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

  it('setDirection persists the Linear direction + data-direction attribute', () => {
    const { result } = renderHook(() => useDesignDirection(), { wrapper })

    act(() => {
      result.current.setDirection('linear')
    })

    expect(result.current.direction).toBe('linear')
    expect(document.documentElement.getAttribute('data-direction')).toBe('linear')
    expect(localStorage.getItem('id.dir')).toBe('linear')
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

  it('linear SLA colors are verbatim palette literals, not hue-math', () => {
    const { result } = renderHook(() => useDesignTokens(), { wrapper })
    expect(result.current['--sla-risk']).not.toContain('oklch')
    expect(result.current['--sla-risk']).toMatch(/^#[0-9a-f]{6}$/i)
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

    const { result } = renderHook(() => useDensity(), { wrapper })

    act(() => {
      result.current.setDensity('dense')
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

  it('ignores cross-tab id.dir events for retired directions (guard accepts only linear)', () => {
    const { result } = renderHook(() => useDesignDirection(), { wrapper })
    expect(result.current.direction).toBe('linear')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'id.dir',
          newValue: 'bureau',
        }),
      )
    })

    // Plan 77-04: a legacy id.dir written by an old tab must not switch us off Linear.
    expect(result.current.direction).toBe('linear')
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

    expect(result.current.direction).toBe('linear')
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

  it('useDensity throws outside provider', () => {
    expect(() => renderHook(() => useDensity())).toThrow(/useDensity must be used within/)
  })

  it('useDesignTokens throws outside provider', () => {
    expect(() => renderHook(() => useDesignTokens())).toThrow(/useDesignTokens must be used within/)
  })
})
