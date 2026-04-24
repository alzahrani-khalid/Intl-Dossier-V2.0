/**
 * Phase 37 — China flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 115-125).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function ChinaFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#DE2910" />
      <path
        d="M10 5 L11.8 9.7 L17 10 L13 13.2 L14.2 18 L10 15.2 L5.8 18 L7 13.2 L3 10 L8.2 9.7 Z"
        fill="#FFDE00"
      />
      <circle cx="16" cy="6" r="0.9" fill="#FFDE00" />
      <circle cx="18" cy="10" r="0.9" fill="#FFDE00" />
      <circle cx="18" cy="15" r="0.9" fill="#FFDE00" />
      <circle cx="16" cy="19" r="0.9" fill="#FFDE00" />
    </g>
  )
}
