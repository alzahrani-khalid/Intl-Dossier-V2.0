/**
 * Phase 37 — United Kingdom flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 150-159).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function UnitedKingdomFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#012169" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="4.5" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2" />
      <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="6" />
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="3" />
    </g>
  )
}
