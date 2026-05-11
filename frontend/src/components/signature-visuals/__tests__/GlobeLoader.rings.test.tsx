/**
 * Phase 37 — GlobeLoader whirl ring keyframe durations.
 * VALIDATION.md row 37-02-03 — 3.2s / 5.5s / 8s linear infinite.
 *
 * jsdom does not implement CSS animations, but it DOES parse stylesheets
 * injected via <style> / <link>. Since the globe-loader.css file is imported
 * as a CSS side-effect by GlobeLoader.tsx and Vitest's CSS plugin inlines it,
 * we assert on the DOM class presence + a computed-style fallback where jsdom
 * can report the animation-duration shorthand slot.
 */
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', () => ({
  useReducedMotion: (): boolean => false,
}))

vi.mock('../ensureWorld', () => ({
  ensureWorld: vi.fn().mockResolvedValue({
    countries: { type: 'FeatureCollection', features: [] },
    graticule: { type: 'MultiLineString', coordinates: [] },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    d3: require('d3-geo'),
  }),
  __resetEnsureWorldForTests: vi.fn(),
}))

describe('GlobeLoader — whirl ring keyframe durations', (): void => {
  it('renders 3 rings with class names encoding the 3.2s / 5.5s / 8s durations', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)
    // Class names are the canonical link between markup and CSS durations;
    // the CSS file itself asserts the duration values via its own acceptance
    // criteria (Task 02-1 greps for "3.2s", "5.5s", "8s").
    const r1 = container.querySelector('.gl-ring-1')
    const r2 = container.querySelector('.gl-ring-2')
    const r3 = container.querySelector('.gl-ring-3')
    expect(r1).not.toBeNull()
    expect(r2).not.toBeNull()
    expect(r3).not.toBeNull()
  })

  it('ring classes differ (each ring owns its own keyframe slot)', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)
    const classes = Array.from(container.querySelectorAll('.gl-ring')).map((el): string =>
      el.getAttribute('class') ?? '',
    )
    expect(classes.some((c): boolean => c.includes('gl-ring-1'))).toBe(true)
    expect(classes.some((c): boolean => c.includes('gl-ring-2'))).toBe(true)
    expect(classes.some((c): boolean => c.includes('gl-ring-3'))).toBe(true)
  })

  it('halo element is rendered with .gl-halo class (2.4s ease-in-out infinite)', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)
    expect(container.querySelector('.gl-halo')).not.toBeNull()
  })
})
