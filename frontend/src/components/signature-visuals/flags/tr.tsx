/**
 * Phase 37 — Turkey flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 106-114).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle / path) per T-37-01.
 */
import type { ReactElement } from 'react'

export function TurkeyFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#E30A17" />
      <circle cx="13" cy="16" r="6" fill="#fff" />
      <circle cx="15" cy="16" r="5" fill="#E30A17" />
      <path
        d="M22 13 L23 15.5 L25.5 15.5 L23.5 17 L24.3 19.5 L22 18 L19.7 19.5 L20.5 17 L18.5 15.5 L21 15.5 Z"
        fill="#fff"
      />
    </g>
  )
}
