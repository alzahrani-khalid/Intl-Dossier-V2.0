/**
 * Phase 37 — Egypt flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 37-45).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function EgyptFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#CE1126" />
      <rect y="10.7" width="32" height="10.6" fill="#fff" />
      <rect y="21.3" width="32" height="10.7" fill="#000" />
      <circle cx="16" cy="16" r="2.4" fill="#C09300" />
    </g>
  )
}
