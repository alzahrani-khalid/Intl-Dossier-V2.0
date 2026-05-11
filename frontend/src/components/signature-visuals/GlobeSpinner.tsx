/**
 * Phase 37 — `<GlobeSpinner>` — inline SVG spinner (VIZ-03).
 *
 * Verbatim port of /tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx
 * lines 121-144. Pure CSS animation: 1.4s forward `gs-whirl` + 2.8s reverse
 * `gs-globe` (keyframes shipped by Plan 02 in `./globe-loader.css`). No d3.
 *
 * Consumers:
 *   - Buttons (tints to button text color via `currentColor`)
 *   - Load-more rows (Phase 40)
 *   - `<Digest>` widget refresh overlay (Phase 38, DASH-04)
 *
 * A11y: `role="status"` + `aria-label` so screen readers announce loading.
 * Reduced-motion: `@media (prefers-reduced-motion: reduce)` in `globe-loader.css`
 * sets both groups to `animation: none`.
 */
import type { ReactElement } from 'react'
import './globe-loader.css'

export interface GlobeSpinnerProps {
  /** Width/height in pixels. Default 20. Does not affect the locked 40x40 viewBox. */
  size?: number
  /** Overrides the default 'Loading' screen-reader label. */
  'aria-label'?: string
  /** Forwarded to the wrapping span. */
  className?: string
}

export function GlobeSpinner({
  size = 20,
  'aria-label': ariaLabel = 'Loading',
  className,
}: GlobeSpinnerProps): ReactElement {
  const spanClassName = ['globe-spinner', className].filter(Boolean).join(' ')
  return (
    <span
      className={spanClassName}
      style={{ width: size, height: size, display: 'inline-flex' }}
      role="status"
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40 40"
        width={size}
        height={size}
      >
        <g className="gs-whirl">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="14 90"
            opacity="0.55"
          />
        </g>
        <g className="gs-globe">
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="11"
            ry="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.55"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="4.5"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.55"
          />
        </g>
      </svg>
    </span>
  )
}
