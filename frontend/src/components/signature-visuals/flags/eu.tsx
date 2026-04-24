/**
 * Phase 37 — European Union flag.
 * Verbatim port from `/tmp/inteldossier-handoff/inteldossier/project/src/glyph.jsx` (lines 202-213).
 *
 * Returns a `<g>`, not a `<svg>` — `<DossierGlyph>` owns the outer svg + circular clipPath.
 * Only primitive SVG shapes (rect / circle) per T-37-01. 12-point star ring generated
 * inline via deterministic trig — no data fetching, no external refs.
 */
import type { ReactElement } from 'react'

const STAR_INDEXES: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export function EuropeanUnionFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      <rect width="32" height="32" fill="#003399" />
      {STAR_INDEXES.map((i): ReactElement => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2
        const x = 16 + Math.cos(a) * 8
        const y = 16 + Math.sin(a) * 8
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#FFCC00" />
      })}
    </g>
  )
}
