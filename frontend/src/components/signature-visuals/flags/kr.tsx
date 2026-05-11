/**
 * Phase 37 — South Korea flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 177-184).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function KoreaFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#fff" />
      <circle cx="16" cy="16" r="5.5" fill="#C60C30" />
      <path
        d="M16 10.5 A5.5 5.5 0 0 1 16 21.5 A2.75 2.75 0 0 1 16 16 A2.75 2.75 0 0 0 16 10.5"
        fill="#003478"
      />
    </g>
  )
}
