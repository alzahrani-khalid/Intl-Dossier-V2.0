/**
 * Phase 37 — `<GlobeLoader>`.
 *
 * TypeScript port of the handoff `loader.jsx` <GlobeLoader> (147 LOC file,
 * lines 35-103). We keep the animation math, tilt, and ring layout verbatim;
 * the only deviations are:
 *
 *   - Dynamic `import()` replacing UMD <script> injection (via `ensureWorld`).
 *   - `useReducedMotion` gate (D-14) — full-stop for reduced-motion users.
 *   - Graceful degrade path (D-08) — if the lazy chunk fails, rings + halo
 *     keep animating and we emit exactly one `console.warn`.
 *   - No `d3.select` — the handoff relied on the full `d3` UMD bundle. Per
 *     D-05 we only import `d3-geo`, so sphere/graticule/land paths are
 *     appended via the native DOM API. This keeps the lazy chunk to just
 *     the geo projection + topojson decode + world atlas JSON.
 *
 * Rings + halo are painted by CSS keyframes (see globe-loader.css). The d3
 * chunk loads lazily on first mount; until it resolves, the user already
 * sees the rings + halo (progressive render per D-07).
 */
import { useEffect, useRef, type ReactElement } from 'react'

import { useReducedMotion } from '@/design-system/hooks'

import { ensureWorld } from './ensureWorld'
import './globe-loader.css'

const SVG_NS = 'http://www.w3.org/2000/svg'

export interface GlobeLoaderProps {
  /** Pixel size of the globe square. Default 120 (handoff). */
  size?: number
  /** Rotation speed in degrees-per-second. Default 16 (locked by VIZ-01). */
  speed?: number
  /** Rotation axis tilt in degrees. Default −18 (locked by VIZ-01). */
  tilt?: number
  /** Optional className appended to the host `<div>`. */
  className?: string
}

export function GlobeLoader({
  size = 120,
  speed = 16,
  tilt = -18,
  className,
}: GlobeLoaderProps): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect((): (() => void) => {
    let raf = 0
    let cancelled = false
    const run = async (): Promise<void> => {
      const { countries, graticule, d3 } = await ensureWorld()
      if (cancelled || hostRef.current === null) return

      const svg = hostRef.current.querySelector<SVGSVGElement>('.gl-svg')
      if (svg === null) return
      // Clear any paths from a previous mount before re-appending.
      svg.querySelectorAll('path').forEach((node): void => {
        node.remove()
      })

      const projection = d3
        .geoOrthographic()
        .scale(size * 0.4)
        .translate([0, 0])
        .clipAngle(90)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const path = d3.geoPath(projection as any)

      const createPath = (attrs: Record<string, string>): SVGPathElement => {
        const el = document.createElementNS(SVG_NS, 'path')
        Object.entries(attrs).forEach(([k, v]): void => {
          el.setAttribute(k, v)
        })
        svg.appendChild(el)
        return el
      }

      const sphere = createPath({
        d: path({ type: 'Sphere' } as never) ?? '',
        fill: 'none',
        stroke: 'var(--ink)',
        'stroke-width': '0.6',
        opacity: '0.45',
      })
      const grat = createPath({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d: path(graticule as any) ?? '',
        fill: 'none',
        stroke: 'var(--ink)',
        'stroke-width': '0.3',
        opacity: '0.25',
      })
      const land = createPath({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d: path(countries as any) ?? '',
        fill: 'var(--ink)',
        opacity: '0.75',
        'data-globe-land': 'true',
      })

      if (reducedMotion) {
        // D-14: full-stop — paint once at λ=0, φ=tilt, then return without rAF.
        projection.rotate([0, tilt])
        sphere.setAttribute('d', path({ type: 'Sphere' } as never) ?? '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grat.setAttribute('d', path(graticule as any) ?? '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        land.setAttribute('d', path(countries as any) ?? '')
        return
      }

      const start = performance.now()
      const tick = (now: number): void => {
        if (cancelled) return
        // Handoff formula (loader.jsx line 66):
        //   lambda = ((now - start) / 1000) * speed % 360 - 180
        const lambda = (((now - start) / 1000) * speed) % 360 - 180
        projection.rotate([lambda, tilt])
        sphere.setAttribute('d', path({ type: 'Sphere' } as never) ?? '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grat.setAttribute('d', path(graticule as any) ?? '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        land.setAttribute('d', path(countries as any) ?? '')
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    run().catch((err: unknown): void => {
      // D-08: graceful degrade — rings + halo keep spinning; we log once.
      console.warn('GlobeLoader: topojson failed to load', err)
    })

    return (): void => {
      cancelled = true
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, [size, speed, tilt, reducedMotion])

  return (
    <div
      ref={hostRef}
      className={['gl-host', className].filter(Boolean).join(' ')}
      style={{ ['--gl-size' as string]: `${size}px` }}
      role="img"
      aria-label="Loading globe"
    >
      <div className="gl-halo" aria-hidden="true" />
      <div className="gl-ring gl-ring-1" aria-hidden="true" />
      <div className="gl-ring gl-ring-2" aria-hidden="true" />
      <div className="gl-ring gl-ring-3" aria-hidden="true" />
      <svg className="gl-svg" viewBox="-100 -100 200 200" aria-hidden="true" />
    </div>
  )
}
