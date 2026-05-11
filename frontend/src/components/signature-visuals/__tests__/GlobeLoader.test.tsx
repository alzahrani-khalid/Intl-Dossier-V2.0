/**
 * Phase 37 — GlobeLoader mount/unmount + progressive paint tests.
 * VALIDATION.md row 37-02-01 — rAF cancel on unmount + rings paint immediately.
 */
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', () => ({
  useReducedMotion: (): boolean => false,
}))

vi.mock('../ensureWorld', () => {
  const d3 = require('d3-geo') as typeof import('d3-geo')
  return {
    ensureWorld: vi.fn().mockResolvedValue({
      countries: { type: 'FeatureCollection', features: [] },
      graticule: d3.geoGraticule10(),
      d3,
    }),
    __resetEnsureWorldForTests: vi.fn(),
  }
})

describe('GlobeLoader — mount, unmount, progressive paint', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
  })
  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it('renders rings + halo immediately before d3 chunk resolves (D-07)', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)
    expect(container.querySelector('.gl-host')).not.toBeNull()
    expect(container.querySelector('.gl-halo')).not.toBeNull()
    expect(container.querySelector('.gl-ring-1')).not.toBeNull()
    expect(container.querySelector('.gl-ring-2')).not.toBeNull()
    expect(container.querySelector('.gl-ring-3')).not.toBeNull()
  })

  it('cancels requestAnimationFrame on unmount (no rAF leak)', async (): Promise<void> => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { GlobeLoader } = await import('../GlobeLoader')
    const { unmount } = render(<GlobeLoader />)
    await waitFor((): void => {
      expect(cancelSpy).not.toHaveBeenCalledWith(0)
    }, { timeout: 100 }).catch((): void => {})
    unmount()
    // After unmount, cancelAnimationFrame should have been invoked at least
    // once (cleanup path). Microtasks from ensureWorld may race; wait briefly.
    await waitFor((): void => {
      expect(cancelSpy).toHaveBeenCalled()
    })
  })

  it('paints sphere + graticule + land paths after ensureWorld resolves', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)
    await waitFor((): void => {
      const svg = container.querySelector('.gl-svg')
      expect(svg).not.toBeNull()
      const paths = svg!.querySelectorAll('path')
      // sphere + graticule + land = at least 3
      expect(paths.length).toBeGreaterThanOrEqual(3)
      expect(svg!.querySelector('[data-globe-land="true"]')).not.toBeNull()
    })
  })
})
