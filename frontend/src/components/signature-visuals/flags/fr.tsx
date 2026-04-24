/**
 * Phase 37 — France flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 134-141).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect) per T-37-01.
 */
import type { ReactElement } from 'react'

export function FranceFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="10.7" height="32" fill="#0055A4" />
      <rect x="10.7" width="10.6" height="32" fill="#fff" />
      <rect x="21.3" width="10.7" height="32" fill="#EF4135" />
    </g>
  )
}
