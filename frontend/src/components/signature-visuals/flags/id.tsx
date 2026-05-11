/**
 * Phase 37 — Indonesia flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 30-36).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect) per T-37-01.
 */
import type { ReactElement } from 'react'

export function IndonesiaFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="16" fill="#E70011" />
      <rect y="16" width="32" height="16" fill="#fff" />
    </g>
  )
}
