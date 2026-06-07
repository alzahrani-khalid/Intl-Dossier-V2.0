/**
 * Phase 37 — `<DossierGlyph>` — dossier visual identity primitive (VIZ-04).
 *
 * Resolution order (per D-09..D-11 + RESEARCH Pitfall 6):
 *   1. type='country' + iso in FLAG_CODES → accurate flag SVG from
 *      /assets/flags/{iso}.svg, clipped to a circle with a 1px rgba(0,0,0,0.15)
 *      hairline ring
 *   2. type='country' + unknown iso → initials fallback (1–2 chars from `name`)
 *   3. type in {forum, person, topic, organization} → Unicode symbol in a
 *      soft-tinted circle (D-10 — `color-mix(in srgb, ...)`)
 *   4. type in {engagement, working_group} → initials fallback (Pitfall 6).
 *      Note: DossierType has 7 members per
 *      `frontend/src/types/dossier-context.types.ts`; `elected_official` is a
 *      person_subtype, not a top-level dossier type, so it is unreachable here.
 *
 * Security (T-37-01): The flag asset is a same-origin static SVG loaded via the
 * SVG `<image href>` attribute (not `xlink:href`). The `iso` value is never
 * passed through verbatim — only codes present in the in-repo `FLAG_CODES`
 * allowlist (generated from the asset filenames) ever reach the
 * `/assets/flags/{iso}.svg` URL, so no traversal or injection input can flow
 * through. The `name` prop flows through a React text node (auto-escaped). No
 * raw-HTML-setting props, no `<script>` tags.
 */

import type { ReactElement } from 'react'

import type { DossierType } from '@/types/dossier-context.types'

import { FLAG_CODES } from './flagCodes'

const SYMBOL_MAP: Partial<Record<DossierType, string>> = {
  forum: '\u25C7',
  person: '\u25CF',
  topic: '\u25C6',
  organization: '\u25B2',
}

function toInitials(nameOrIso: string): string {
  const trimmed = nameOrIso.trim()
  if (trimmed.length === 0) {
    return '?'
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    const first = parts[0] ?? ''
    const second = parts[1] ?? ''
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

export interface DossierGlyphProps {
  type: DossierType
  iso?: string
  name?: string
  size?: number
  accent?: string
  className?: string
}

interface InitialsBadgeProps {
  text: string
  size: number
  accent: string
  className?: string
}

function InitialsBadge({
  text,
  size,
  accent,
  className,
}: InitialsBadgeProps): ReactElement {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: `color-mix(in srgb, ${accent} 12%, var(--surface-raised))`,
        color: accent,
        fontSize: size * 0.42,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {text}
    </span>
  )
}

export function DossierGlyph({
  type,
  iso,
  name,
  size = 32,
  accent = 'var(--ink)',
  className,
}: DossierGlyphProps): ReactElement {
  // 1. Country + known ISO → accurate flag asset from /assets/flags/{iso}.svg.
  if (type === 'country' && iso !== undefined) {
    const key = iso.toLowerCase()
    if (FLAG_CODES.has(key)) {
      const clipId = `dg-clip-${key}`
      return (
        <span
          className={className}
          style={{
            width: size,
            height: size,
            display: 'inline-block',
            lineHeight: 0,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            role="img"
            aria-label={key}
          >
            <defs>
              <clipPath id={clipId}>
                <circle cx="16" cy="16" r="16" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <image
                href={`/assets/flags/${key}.svg`}
                x="0"
                y="0"
                width="32"
                height="32"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
            <circle
              cx="16"
              cy="16"
              r="15.5"
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1"
            />
          </svg>
        </span>
      )
    }
    // 2. Country + unknown ISO → initials.
    return (
      <InitialsBadge
        text={toInitials(name ?? iso)}
        size={size}
        accent={accent}
        className={className}
      />
    )
  }

  // 3. Non-country supported type → Unicode symbol.
  const symbol = SYMBOL_MAP[type]
  if (symbol !== undefined) {
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: `color-mix(in srgb, ${accent} 12%, var(--surface-raised))`,
          color: accent,
          fontSize: size * 0.5,
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {symbol}
      </span>
    )
  }

  // 4. Unsupported DossierType (engagement, working_group) → initials (Pitfall 6).
  return (
    <InitialsBadge
      text={toInitials(name ?? '?')}
      size={size}
      accent={accent}
      className={className}
    />
  )
}
