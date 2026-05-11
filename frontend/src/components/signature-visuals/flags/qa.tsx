/**
 * Phase 37 — Qatar flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 46-52).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function QatarFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#8A1538" />
      <path
        d="M0 0 L10 0 L7 3.5 L10 7 L7 10.5 L10 14 L7 17.5 L10 21 L7 24.5 L10 28 L7 31.5 L10 32 L0 32 Z"
        fill="#fff"
      />
    </g>
  )
}
