/**
 * Phase 37 — GlobeLoader rotation speed test.
 * VALIDATION.md row 37-02-02 — 16°/sec on a −18° tilt within ±0.5°.
 *
 * Strategy: Replace `requestAnimationFrame` with a synchronous harness that
 * invokes the tick callback at controllable timestamps, and intercept
 * `projection.rotate` via a proxy to capture the (λ, φ) pairs at t=0/1000/2000.
 */
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/design-system/hooks', () => ({
  useReducedMotion: (): boolean => false,
}))

type RotateCall = [number, number]
const rotateCalls: RotateCall[] = []

vi.mock('../ensureWorld', async () => {
  const d3Real = await vi.importActual<typeof import('d3-geo')>('d3-geo')
  // Build a shim d3 namespace whose `geoOrthographic` returns a projection
  // that records rotate([λ, φ]) invocations but otherwise behaves normally.
  const shim: typeof import('d3-geo') = {
    ...d3Real,
    geoOrthographic: (): ReturnType<typeof d3Real.geoOrthographic> => {
      const inner = d3Real.geoOrthographic()
      // Wrap the projection's `rotate` so we can record every call. Other
      // chained setters return the projection itself — keep them bound to
      // `inner` so the fluent API (`.scale().translate().clipAngle()`) works.
      const originalRotate = inner.rotate.bind(inner)
      ;(inner as unknown as { rotate: (a?: [number, number, number?]) => unknown }).rotate = (
        angles?: [number, number, number?],
      ): unknown => {
        if (Array.isArray(angles) && angles.length >= 2) {
          rotateCalls.push([Number(angles[0]), Number(angles[1])])
        }
        return originalRotate(angles as Parameters<typeof originalRotate>[0])
      }
      return inner
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

describe('GlobeLoader — rotation speed 16°/sec on −18° tilt', (): void => {
  let rafQueue: Array<(t: number) => void> = []

  beforeEach((): void => {
    rotateCalls.length = 0
    rafQueue = []
    let id = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb: FrameRequestCallback): number => {
        rafQueue.push(cb)
        id += 1
        return id
      },
    )
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((): void => {})
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })
  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it('samples λ at 16°/sec (tolerance ±0.5°) starting from −180°, φ = −18°', async (): Promise<void> => {
    const { GlobeLoader } = await import('../GlobeLoader')
    render(<GlobeLoader speed={16} tilt={-18} />)

    // Drain the ensureWorld microtask queue so the tick is scheduled.
    await waitFor((): void => {
      expect(rafQueue.length).toBeGreaterThan(0)
    })

    // Drive three ticks: t = 0, 1000, 2000 ms.
    const samples: RotateCall[] = []
    const run = (nowMs: number): void => {
      const cb = rafQueue.shift()
      if (cb === undefined) return
      ;(performance.now as unknown as ReturnType<typeof vi.fn>).mockReturnValue(nowMs)
      const before = rotateCalls.length
      cb(nowMs)
      // capture the last rotate call recorded by this tick
      const last = rotateCalls[rotateCalls.length - 1]
      if (last !== undefined && rotateCalls.length > before) samples.push(last)
    }
    run(0)
    run(1000)
    run(2000)

    expect(samples.length).toBeGreaterThanOrEqual(3)

    // Handoff formula: lambda = ((now - start) / 1000) * speed % 360 - 180
    // t=0   → λ = −180
    // t=1s  → λ = −180 + 16 = −164
    // t=2s  → λ = −180 + 32 = −148
    const [lam0, phi0] = samples[0]!
    const [lam1] = samples[1]!
    const [lam2] = samples[2]!
    expect(Math.abs(lam0 - -180)).toBeLessThan(0.5)
    expect(Math.abs(lam1 - -164)).toBeLessThan(0.5)
    expect(Math.abs(lam2 - -148)).toBeLessThan(0.5)
    expect(Math.abs(phi0 - -18)).toBeLessThan(0.5)
  })
})
