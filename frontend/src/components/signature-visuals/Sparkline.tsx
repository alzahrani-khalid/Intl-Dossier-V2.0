/**
 * Phase 37 — `<Sparkline>` primitive (VIZ-05).
 *
 * 80×22 SVG polyline + trailing dot, min-max normalized on `data: number[]`.
 *
 * RTL flip: VIZ-05 sanctions `transform: scaleX(-1)` (NOT `.reverse()` on data,
 * NOT `text-align: right`). Pitfall 7 mitigation: `transform-origin: center`
 * keeps the flipped polyline inside the viewBox.
 *
 * Locale source: `useLocale()` from `@/design-system/hooks` (returns 'en' | 'ar').
 * PATTERNS.md CAUTION: do NOT use `useDesignDirection` — that enum carries
 * classification values, not 'ltr' | 'rtl'.
 *
 * Edge cases:
 *   - `data=[]` → empty SVG (no crash, no NaN)
 *   - `data=[v]` (single point, min===max) → `safeRange` guard avoids div-by-zero;
 *     trailing dot pinned to height/2 so a single value does not misleadingly
 *     render at the top or bottom edge.
 *
 * Consumers: Phase 38 SlaHealth widget, Phase 39 kcard anatomy, Phase 40 list columns.
 */
import type { ReactElement } from 'react'

import { useLocale } from '@/design-system/hooks'

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 22,
  stroke = 'currentColor',
  className,
}: SparklineProps): ReactElement {
  const { locale } = useLocale()
  const isRTL = locale === 'ar'

  // Empty-data short-circuit: render a blank svg so layout is stable.
  if (data.length === 0) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className={className}
      />
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min
  // Guard against divide-by-zero when every value is identical (e.g. single point).
  const safeRange = range === 0 ? 1 : range

  const points = data.map((value, i): { x: number; y: number } => {
    const x = data.length === 1 ? width : (i / (data.length - 1)) * width
    const normalized = (value - min) / safeRange
    const y = height - normalized * height
    return { x, y }
  })

  // Single-point data: pin to vertical center so the dot does not land at top/bottom
  // (min===max would otherwise place it at y=height per the normalization).
  if (data.length === 1) {
    points[0] = { x: width, y: height / 2 }
  }

  const pointsAttr = points
    .map((p): string => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
  const last = points[points.length - 1] as { x: number; y: number }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={className}
      data-sparkline-flipped={isRTL ? 'true' : undefined}
      style={{
        transform: isRTL ? 'scaleX(-1)' : undefined,
        transformOrigin: 'center',
      }}
    >
      {data.length >= 2 && (
        <polyline
          points={pointsAttr}
          fill="none"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <circle cx={last.x} cy={last.y} r="1.6" fill={stroke} />
    </svg>
  )
}
