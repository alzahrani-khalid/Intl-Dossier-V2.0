/**
 * Phase 37 — Kuwait flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 80-88).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function KuwaitFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#007A3D" />
      <rect y="10.7" width="32" height="10.6" fill="#fff" />
      <rect y="21.3" width="32" height="10.7" fill="#CE1126" />
      <path d="M0 0 L10 10.7 L10 21.3 L0 32 Z" fill="#000" />
    </g>
  )
}
