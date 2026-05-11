/**
 * Phase 37 — Brazil flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 194-201).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function BrazilFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#009C3B" />
      <path d="M16 5 L28 16 L16 27 L4 16 Z" fill="#FFDF00" />
      <circle cx="16" cy="16" r="4.5" fill="#002776" />
    </g>
  )
}
