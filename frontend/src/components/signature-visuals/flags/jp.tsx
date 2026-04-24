/**
 * Phase 37 — Japan flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 170-176).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function JapanFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#fff" />
      <circle cx="16" cy="16" r="7" fill="#BC002D" />
    </g>
  )
}
