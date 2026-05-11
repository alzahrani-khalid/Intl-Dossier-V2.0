/**
 * Phase 37 — Bahrain flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 63-69).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function BahrainFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#CE1126" />
      <path
        d="M0 0 L12 0 L8 3.2 L12 6.4 L8 9.6 L12 12.8 L8 16 L12 19.2 L8 22.4 L12 25.6 L8 28.8 L12 32 L0 32 Z"
        fill="#fff"
      />
    </g>
  )
}
