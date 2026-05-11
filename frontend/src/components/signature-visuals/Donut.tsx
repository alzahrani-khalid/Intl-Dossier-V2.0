/**
 * Phase 37 — `<Donut>` — stacked strokeDasharray donut + center percentage pill.
 *
 * VIZ-05 primitive consumed by Phase 38 `SlaHealth` widget (DASH-05).
 * Math analog: `frontend/src/components/ui/pull-to-refresh-indicator.tsx`
 * lines 91-184 (dasharray / dashoffset formula).
 *
 * D-13 ban: plain `<circle>`, NOT framer-motion `m.circle`.
 *
 * Variants map: `variants[0]` → `var(--ok)`, `variants[1]` → `var(--risk)`,
 * `variants[2]` → `var(--bad)`. Track uses `var(--surface-raised)`. Center
 * text fills `var(--ink)` using the Phase 35 `var(--font-display)` cascade.
 *
 * Per-variant values are clamped to `[0, 100]` to guard against NaN or
 * negative dashoffsets; the sum is left to the caller (over 100% will
 * simply overdraw past the track).
 */
import type { ReactElement } from 'react'

export interface DonutProps {
  value: number
  variants: readonly [number, number, number]
  size?: number
  className?: string
}

const clampPct = (n: number): number => Math.max(0, Math.min(100, n))

export function Donut({
  value,
  variants,
  size = 72,
  className,
}: DonutProps): ReactElement {
  const r = 14
  const circumference = 2 * Math.PI * r

  const [okRaw, riskRaw, badRaw] = variants
  const ok = clampPct(okRaw)
  const risk = clampPct(riskRaw)
  const bad = clampPct(badRaw)

  const segOk = (ok / 100) * circumference
  const segRisk = (risk / 100) * circumference
  const segBad = (bad / 100) * circumference

  const pct = Math.round(clampPct(value))

  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      role="img"
      aria-label={`${pct} percent`}
      className={className}
    >
      {/* Track — always rendered (D-07 spirit: show something) */}
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--surface-raised)"
        strokeWidth="4"
      />
      {/* OK segment */}
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--ok)"
        strokeWidth="4"
        strokeLinecap="butt"
        strokeDasharray={`${segOk} ${circumference}`}
        strokeDashoffset={0}
        transform="rotate(-90 18 18)"
      />
      {/* Risk segment — offset chains past the OK arc */}
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--risk)"
        strokeWidth="4"
        strokeLinecap="butt"
        strokeDasharray={`${segRisk} ${circumference}`}
        strokeDashoffset={-segOk}
        transform="rotate(-90 18 18)"
      />
      {/* Bad segment — offset chains past the OK + Risk arcs */}
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--bad)"
        strokeWidth="4"
        strokeLinecap="butt"
        strokeDasharray={`${segBad} ${circumference}`}
        strokeDashoffset={-(segOk + segRisk)}
        transform="rotate(-90 18 18)"
      />
      {/* Center percentage pill — Phase 35 --font-display cascade */}
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--ink)"
        fontSize="8"
        fontWeight="600"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {pct}%
      </text>
    </svg>
  )
}
