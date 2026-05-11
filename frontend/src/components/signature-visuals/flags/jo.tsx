/**
 * Phase 37 — Jordan flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 53-62).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function JordanFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#000" />
      <rect y="10.7" width="32" height="10.6" fill="#fff" />
      <rect y="21.3" width="32" height="10.7" fill="#007A3D" />
      <path d="M0 0 L14 16 L0 32 Z" fill="#CE1126" />
      <circle cx="5" cy="16" r="1.4" fill="#fff" />
    </g>
  )
}
