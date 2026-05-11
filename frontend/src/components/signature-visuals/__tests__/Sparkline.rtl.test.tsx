/**
 * Phase 37 — `<Sparkline>` RTL flip tests (VALIDATION row 37-06-02).
 *
 * VIZ-05 sanctioned RTL treatment: SVG `transform: scaleX(-1)` with
 * `transform-origin: center` (RESEARCH Pitfall 7) when `useLocale() === 'ar'`.
 *
 * Anti-patterns explicitly NOT tested (must stay absent): `.reverse()` of data,
 * `text-align: right`, DOM `dir` read.
 */
import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Hoist-safe mutable locale holder so we can flip between tests.
const localeState: { current: 'ar' | 'en' } = { current: 'en' }

vi.mock('@/design-system/hooks', async (): Promise<typeof import('@/design-system/hooks')> => {
  const actual =
    await vi.importActual<typeof import('@/design-system/hooks')>('@/design-system/hooks')
  return {
    ...actual,
    useLocale: (): { locale: 'ar' | 'en'; setLocale: (l: 'ar' | 'en') => void } => ({
      locale: localeState.current,
      setLocale: vi.fn(),
    }),
  }
})

import { Sparkline } from '../Sparkline'

const getTransformBundle = (el: Element | null): string => {
  if (el === null) {
    return ''
  }
  const style = el.getAttribute('style') ?? ''
  const transformAttr = el.getAttribute('transform') ?? ''
  return `${style} ${transformAttr}`
}

describe('Sparkline — RTL flip (VIZ-05)', (): void => {
  beforeEach((): void => {
    localeState.current = 'en'
  })

  it('applies scaleX(-1) with transform-origin: center when locale is ar', (): void => {
    localeState.current = 'ar'
    const { container } = render(<Sparkline data={[1, 2, 3]} />)
    const flipTarget =
      container.querySelector('[data-sparkline-flipped]') ?? container.querySelector('svg')
    const bundle = getTransformBundle(flipTarget)
    expect(bundle).toMatch(/scaleX\(-1\)/)
    // Pitfall 7 mitigation — must set transform-origin to center so flip stays inside viewBox.
    expect(bundle).toMatch(/transform-origin:\s*center|transformOrigin:\s*center/i)
  })

  it('does NOT apply scaleX(-1) when locale is en', (): void => {
    localeState.current = 'en'
    const { container } = render(<Sparkline data={[1, 2, 3]} />)
    const svg = container.querySelector('svg')!
    const bundle = getTransformBundle(svg)
    expect(bundle).not.toMatch(/scaleX\(-1\)/)
  })

  it('marks the flipped root with data-sparkline-flipped in ar, omits in en', (): void => {
    localeState.current = 'ar'
    const { container, rerender } = render(<Sparkline data={[1, 2, 3]} />)
    expect(container.querySelector('[data-sparkline-flipped="true"]')).not.toBeNull()

    localeState.current = 'en'
    rerender(<Sparkline data={[1, 2, 3]} />)
    expect(container.querySelector('[data-sparkline-flipped="true"]')).toBeNull()
  })

  it('uses useLocale (not document.dir) — flipping document.dir does NOT change transform', (): void => {
    // Baseline: locale en, dir ltr → no flip.
    localeState.current = 'en'
    const original = document.documentElement.getAttribute('dir')
    document.documentElement.setAttribute('dir', 'rtl')
    try {
      const { container } = render(<Sparkline data={[1, 2, 3]} />)
      const svg = container.querySelector('svg')!
      const bundle = getTransformBundle(svg)
      // locale is still 'en' — DOM direction must not drive the flip.
      expect(bundle).not.toMatch(/scaleX\(-1\)/)
    } finally {
      if (original === null) {
        document.documentElement.removeAttribute('dir')
      } else {
        document.documentElement.setAttribute('dir', original)
      }
    }
  })
})
