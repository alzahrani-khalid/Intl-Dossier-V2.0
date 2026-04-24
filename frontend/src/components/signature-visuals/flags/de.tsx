/**
 * Phase 37 — Germany flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 142-149).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect) per T-37-01.
 */
import type { ReactElement } from 'react'

export function GermanyFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#000" />
      <rect y="10.7" width="32" height="10.6" fill="#DD0000" />
      <rect y="21.3" width="32" height="10.7" fill="#FFCE00" />
    </g>
  )
}
