/**
 * Phase 37 — Oman flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 70-79).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle) per T-37-01.
 */
import type { ReactElement } from 'react'

export function OmanFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="10.7" fill="#fff" />
      <rect y="10.7" width="32" height="10.6" fill="#DB161B" />
      <rect y="21.3" width="32" height="10.7" fill="#007A3D" />
      <rect width="10" height="32" fill="#DB161B" />
      <circle cx="5" cy="6" r="1.6" fill="#fff" stroke="#DB161B" strokeWidth="0.5" />
    </g>
  )
}
