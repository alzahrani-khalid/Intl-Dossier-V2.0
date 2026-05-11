/**
 * Phase 37 — United Nations flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 214-222).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function UnitedNationsFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#5B92E5" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="1" />
      <circle cx="16" cy="16" r="2.5" fill="none" stroke="#fff" strokeWidth="0.8" />
      <path
        d="M16 9 V23 M9 16 H23 M11 11 L21 21 M21 11 L11 21"
        stroke="#fff"
        strokeWidth="0.5"
        opacity="0.8"
      />
    </g>
  )
}
