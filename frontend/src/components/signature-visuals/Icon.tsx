/**
 * Phase 42 — Plan 00 — `<Icon>` minimal stroked-glyph component (R-01).
 *
 * Verbatim port of the 14 stroked glyphs needed by Wave 1 pages from
 * `frontend/design-system/inteldossier_handoff_design/src/icons.jsx`.
 *
 * Path strings are copied verbatim from `42-PATTERNS.md` §Icon.tsx
 * (handoff source of truth). The component takes a `name` from a typed
 * union and renders an `<svg>` with `currentColor` stroke so glyphs
 * inherit color from their parent text style.
 *
 * Usage: `<Icon name="check" size={16} />`
 */

import type { CSSProperties, ReactElement } from 'react'

export type IconName =
  | 'plus'
  | 'check'
  | 'chevron-right'
  | 'chat'
  | 'file'
  | 'link'
  | 'alert'
  | 'dot'
  | 'cog'
  | 'bell'
  | 'shield'
  | 'lock'
  | 'people'
  | 'sparkle'

export interface IconProps {
  name: IconName
  size?: number
  style?: CSSProperties
  className?: string
  'aria-hidden'?: boolean
}

export function Icon({
  name,
  size = 18,
  style,
  className,
  'aria-hidden': ariaHidden = true,
}: IconProps): ReactElement {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    className: ['icon', `icon-${name}`, className].filter(Boolean).join(' '),
    'aria-hidden': ariaHidden,
    'data-testid': `icon-${name}`,
  }

  switch (name) {
    case 'plus':
      return (
        <svg {...commonProps}>
          <path d="M10 4v12M4 10h12" />
        </svg>
      )
    case 'check':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M6.5 10l2.5 2.5L14 7.5" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...commonProps}>
          <path d="M8 5l5 5-5 5" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...commonProps}>
          <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        </svg>
      )
    case 'file':
      return (
        <svg {...commonProps}>
          <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M12 3v4h4" />
        </svg>
      )
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M9 11a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1" />
          <path d="M11 9a3 3 0 0 0-4 0l-2 2a3 3 0 0 0 4 4l1-1" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...commonProps}>
          <path d="M10 3l8 14H2L10 3Z" />
          <path d="M10 8v4M10 14.5v.5" />
        </svg>
      )
    case 'dot':
      return (
        <svg {...commonProps}>
          <circle cx="10" cy="10" r="3" fill="currentColor" />
        </svg>
      )
    case 'cog':
      return (
        <svg {...commonProps}>
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...commonProps}>
          <path d="M5 13V9a5 5 0 0 1 10 0v4l1 2H4l1-2Z" />
          <path d="M8 16a2 2 0 0 0 4 0" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...commonProps}>
          <path d="M10 3l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V5l6-2Z" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...commonProps}>
          <rect x="4" y="9" width="12" height="8" rx="1.5" />
          <path d="M7 9V6a3 3 0 0 1 6 0v3" />
        </svg>
      )
    case 'people':
      return (
        <svg {...commonProps}>
          <circle cx="7" cy="8" r="2.5" />
          <circle cx="14" cy="8" r="2" />
          <path d="M2.5 16c.5-2.5 2.3-4 4.5-4s4 1.5 4.5 4" />
          <path d="M12 14.5c.4-1.5 1.6-2.5 3-2.5s2.3 1 2.5 2" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...commonProps}>
          <path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5L10 3Z" />
        </svg>
      )
    default:
      return (
        <svg {...commonProps}>
          <circle cx="10" cy="10" r="7" />
        </svg>
      )
  }
}
