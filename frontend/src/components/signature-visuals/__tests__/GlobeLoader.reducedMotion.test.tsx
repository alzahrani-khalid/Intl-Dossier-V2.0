/**
 * Phase 37 — GlobeLoader reduced-motion gate.
 * VALIDATION.md row 37-02-05 / D-14 — when `useReducedMotion()` returns true,
 * the rAF loop MUST NOT be scheduled; the globe is painted once at λ=0 with
 * tilt φ applied, and the rings rely on the `@media (prefers-reduced-motion)`
 * CSS rule (set to `animation: none !important`).
 */
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', () => ({
  useReducedMotion: (): boolean => true,
}))

type RotateCall = [number, number]
const rotateCalls: RotateCall[] = []

vi.mock('../ensureWorld', () => {
  const d3Real = require('d3-geo') as typeof import('d3-geo')
  const shim: typeof import('d3-geo') = {
    ...d3Real,
    geoOrthographic: (): ReturnType<typeof d3Real.geoOrthographic> => {
      const inner = d3Real.geoOrthographic()
      const proxy = new Proxy(inner, {
        get(target, prop: string | symbol): unknown {
          if (prop === 'rotate') {
            return (angles?: unknown): unknown => {
              if (Array.isArray(angles) && angles.length >= 2) {
                rotateCalls.push([Number(angles[0]), Number(angles[1])])
              }
              const t = target as unknown as Record<string, (...a: unknown[]) => unknown>
              return t['rotate'].call(target, angles)
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (target as any)[prop]
        },
      })
      return proxy as unknown as ReturnType<typeof d3Real.geoOrthographic>
    },
  }
  return {
    ensureWorld: vi.fn().mockResolvedValue({
      countries: { type: 'FeatureCollection', features: [] },
      graticule: d3Real.geoGraticule10(),
      d3: shim,
    }),
    __resetEnsureWorldForTests: vi.fn(),
  }
})

describe('GlobeLoader — reduced-motion gate (D-14)', (): void => {
  let rafSpy: ReturnType<typeof vi.spyOn>

  beforeEach((): void => {
    rotateCalls.length = 0
    rafSpy = vi.spyOn(window, 'requestAnimationFrame')

    // jsdom's matchMedia returns undefined by default — stub it so that any
    // media query containing "prefers-reduced-motion" matches. The component
    // itself reads from useReducedMotion (mocked true above); this stub is
    // defensive so the CSS media-query assertion path can also resolve.
    window.matchMedia = vi.fn().mockImplementation(
      (query: string): MediaQueryList => ({
        matches: /prefers-reduced-motion/.test(query),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList,
    ) as typeof window.matchMedia
  })
  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it('does NOT schedule requestAnimationFrame when useReducedMotion() is true', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    render(<GlobeLoader tilt={-18} />)

    // Wait for ensureWorld to resolve and the one-shot paint to run.
    await waitFor((): void => {
      expect(rotateCalls.length).toBeGreaterThan(0)
    })

    // Reduced-motion path should paint once at λ=0, φ=tilt.
    const [lambda, phi] = rotateCalls[rotateCalls.length - 1]!
    expect(lambda).toBe(0)
    expect(phi).toBe(-18)

    // Most importantly: no rAF tick loop should have been scheduled.
    expect(rafSpy).not.toHaveBeenCalled()
  })
})
