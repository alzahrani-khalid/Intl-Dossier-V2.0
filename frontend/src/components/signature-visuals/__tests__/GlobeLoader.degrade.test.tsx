/**
 * Phase 37 — GlobeLoader graceful degradation.
 * VALIDATION.md row 37-02-04 / D-08 — if the d3/topojson chunk fails to load,
 * rings + halo keep animating, land mesh is skipped, and exactly one
 * `console.warn` fires with a stable message prefix.
 */
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', () => ({
  useReducedMotion: (): boolean => false,
}))

vi.mock('../ensureWorld', () => ({
  ensureWorld: vi.fn().mockRejectedValue(new Error('network fail')),
  __resetEnsureWorldForTests: vi.fn(),
}))

describe('GlobeLoader — graceful degradation', (): void => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach((): void => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation((): void => {})
  })
  afterEach((): void => {
    warnSpy.mockRestore()
  })

  it('keeps rings+halo and logs a single console.warn when topojson fails', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    const { container } = render(<GlobeLoader />)

    // Rings + halo painted immediately by React, before the lazy chunk rejects.
    expect(container.querySelector('.gl-ring-1')).not.toBeNull()
    expect(container.querySelector('.gl-ring-2')).not.toBeNull()
    expect(container.querySelector('.gl-ring-3')).not.toBeNull()
    expect(container.querySelector('.gl-halo')).not.toBeNull()

    await waitFor((): void => {
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })
    const [firstArg] = warnSpy.mock.calls[0] ?? []
    expect(String(firstArg)).toMatch(/GlobeLoader: topojson failed to load/)

    // No land mesh should be appended.
    expect(container.querySelector('[data-globe-land]')).toBeNull()

    // Rings still present after the rejection.
    expect(container.querySelector('.gl-ring-1')).not.toBeNull()
  })
})
