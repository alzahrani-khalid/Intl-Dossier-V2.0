/**
 * Phase 37 — Morocco flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 99-105).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function MoroccoFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#C1272D" />
      <path
        d="M16 9 L18.5 15 L25 15 L19.8 18.7 L21.7 25 L16 21 L10.3 25 L12.2 18.7 L7 15 L13.5 15 Z"
        fill="none"
        stroke="#006233"
        strokeWidth="1.3"
      />
    </g>
  )
}
