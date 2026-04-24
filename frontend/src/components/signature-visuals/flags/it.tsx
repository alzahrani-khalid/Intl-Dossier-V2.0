/**
 * Phase 37 — Italy flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 126-133).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect) per T-37-01.
 */
import type { ReactElement } from 'react'

export function ItalyFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="10.7" height="32" fill="#008C45" />
      <rect x="10.7" width="10.6" height="32" fill="#fff" />
      <rect x="21.3" width="10.7" height="32" fill="#CD212A" />
    </g>
  )
}
