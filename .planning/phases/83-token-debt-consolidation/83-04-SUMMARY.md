---
phase: 83-token-debt-consolidation
plan: 04
subsystem: frontend
tags:
  [design-tokens, chart-palette, react-flow, DEBT-01, DEBT-03, DEBT-05, DEBT-08, lucide, shadows]
requires:
  - phase: 83-token-debt-consolidation
    provides: chart-1-to-8-css-vars + color-chart Tailwind utilities (plan 02)
provides:
  - graph-node-edge-palettes-on-chart-tokens
  - slice-shadow-discipline-dossier-dossiers-relationships-sla
  - zoom-slider-gradient-flattened
  - sla-and-relationshipgraph-emoji-as-lucide
affects:
  - frontend/src/components/dossier
  - frontend/src/components/dossiers
  - frontend/src/components/relationships
  - frontend/src/components/sla-countdown
tech-stack:
  added: []
  patterns:
    - 'React Flow node/edge palettes read var(--chart-N) via style objects; fallbacks → var(--ink-faint)'
    - 'React Flow markerEnd.color + Background color take var() directly (in-repo precedent: dossiers/RelationshipGraph var(--accent) since Phase 58)'
    - 'hex-alpha node tint (`${hex}20`) → color-mix(in srgb, var(--token) 12.5%, transparent) when the base becomes a CSS var'
    - 'FAB judgment: single static shadow-lg (allowed tier), banned tier + hover:shadow escalation removed; tooltip popper → surface-3 (bg-popover) + border-line, no shadow'
    - 'emoji status glyph → lucide via getStatusIcon(): ReactNode; icon+label wrapped inline-flex items-center gap-1 (layout-neutral)'
key-files:
  created:
    - .planning/phases/83-token-debt-consolidation/83-04-SUMMARY.md
  modified:
    - frontend/src/components/dossier/MiniRelationshipGraph.tsx
    - frontend/src/components/relationships/RelationshipGraph.tsx
    - frontend/src/components/dossiers/RelationshipGraph.tsx
    - frontend/src/components/relationships/AdvancedGraphVisualization.tsx
    - frontend/src/components/relationships/EnhancedGraphVisualization.tsx
    - frontend/src/components/relationships/GraphVisualization.tsx
    - frontend/src/components/relationships/TouchOptimizedGraphControls.tsx
    - frontend/src/components/dossiers/CustomEdges.tsx
    - frontend/src/components/dossier/AddToDossierMenu.tsx
    - frontend/src/components/dossier/DossierTypeGuide.tsx
    - frontend/src/components/dossier/DossierTypeSelector.tsx
    - frontend/src/components/dossier/CountryMapImage.tsx
    - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
    - frontend/src/components/dossier/dossier-overview/sections/RelatedDossiersSection.tsx
    - frontend/src/components/sla-countdown/SLACountdown.tsx
decisions:
  - 'A1 (var() in SVG markerEnd/Background) satisfied by in-repo precedent — dossiers/RelationshipGraph.tsx ships markerEnd.color: var(--accent) + Background color hsl(var(--border)) since Phase 58 (D-58-04-24), same @xyflow/react version. Used var(--chart-N) directly; no getComputedStyle fallback needed. Final live eyeball deferred to the 83-07 render-parity gate (per the plan verification section).'
  - 'MiniRelationshipGraph node tint `${nodeColor}20` (hex-alpha concat) rewritten to color-mix(in srgb, var(--chart-N) 12.5%, transparent) — hex-alpha strings cannot carry a CSS var (Rule 3 blocking adaptation). 0x20/0xFF ≈ 12.5%, tint preserved.'
  - 'DEBT-03/DEBT-05 are shared multi-plan requirements; 83-04 closes only the dossier/dossiers/relationships/sla-countdown slice share. Not marked complete — remaining files live in sibling Wave-2 slices (83-03/05/06). DEBT-08 requirement names exactly the two files this plan owns → marked complete.'
patterns-established:
  - 'Graph slice = 0 non-comment hex, 0 banned shadow-(sm|md|xl|2xl), 0 bg-gradient-, 0 UI-emoji under the widened unicode gate'
requirements-completed: [DEBT-08]
duration: 22min
completed: 2026-07-04
---

# Phase 83 Plan 04: Graph + Dossier Slice Token Migration Summary

**React Flow node/edge palettes routed onto `var(--chart-N)`/semantic tokens, graph-slice card shadows stripped (FAB judgment applied), the zoom-slider gradient flattened to `bg-accent`, and the two DEBT-08 emoji sites (SLACountdown + dossiers/RelationshipGraph) replaced with lucide icons — 15 files, 3 atomic commits, all slice grep gates at zero.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-07-04T21:07Z (approx)
- **Completed:** 2026-07-04T21:30Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- **DEBT-01 graph half (D-83-01):** `MiniRelationshipGraph` NODE_COLORS (7 dossier hues + neutral), EDGE_COLORS (same hue routing), all hex fallbacks, `markerEnd.color`, and the Background dots (`#e5e7eb` → `var(--line)`, the declared dark-mode bugfix) now resolve through `var(--chart-N)`/`--accent-ink`/`--ink-faint`. `relationships/RelationshipGraph` edge colors → `--danger`/`--chart-1/3/4`/`--ink-faint`; label fill `#ffffff` → `var(--accent-fg)`. Zero non-comment hex in the graph slice.
- **DEBT-03 slice share (D-83-03):** banned `shadow-(sm|md|xl|2xl)` removed across `dossier/`, `dossiers/`, `relationships/`, `sla-countdown/` — graph containers, node circles, tiles, edge-label pills, tooltip poppers, and a stray map `drop-shadow-sm`. `AddToDossierMenu` FABs collapsed to a single static `shadow-lg` (banned tier + `hover:shadow-*` escalation removed); its tooltip label → `bg-popover` (surface-3) + `border-line`, no shadow. `shadow-lg` (allowed tier) left intact.
- **DEBT-05 slice share (D-83-05):** `TouchOptimizedGraphControls` zoom-slider fill `bg-gradient-to-r from-primary to-primary/70` flattened to `bg-accent`. Zero `bg-gradient-` in `relationships/`.
- **DEBT-08 fully closed (D-83-08):** `SLACountdown.getStatusIcon()` is now `(): ReactNode` returning `TriangleAlert`/`CirclePause`/`Check`/`Zap`/`CircleAlert` (h-3.5); its pause/resume control glyphs `⏸`/`▶` → `Pause`/`Play` (h-3, inline-flex gap-1). `dossiers/RelationshipGraph` error `⚠️` → `TriangleAlert`, empty `🔗` → `Link2`. Widened unicode gate returns 0 on both files; data emoji untouched.

## Task Commits

1. **Task 1: Graph palettes → chart tokens + A1 check** - `f3b5c816` (feat)
2. **Task 2: Slice shadows + gradient + FAB judgment** - `accdad17` (refactor)
3. **Task 3: DEBT-08 emoji → lucide** - `ae041829` (fix)

## Files Created/Modified

- `dossier/MiniRelationshipGraph.tsx` - NODE/EDGE_COLORS + fallbacks + markerEnd + Background dots → chart/semantic tokens; node tint via color-mix; node-circle shadow-md dropped
- `relationships/RelationshipGraph.tsx` - RELATIONSHIP_COLORS + label fill → tokens; ContactNode hover:shadow-md stripped
- `dossiers/RelationshipGraph.tsx` - Card shadow-xl stripped (T2); error/empty emoji → TriangleAlert/Link2 (T3)
- `relationships/AdvancedGraphVisualization.tsx`, `EnhancedGraphVisualization.tsx`, `GraphVisualization.tsx` - banned shadows stripped from overlay/legend/node cards
- `relationships/TouchOptimizedGraphControls.tsx` - shadow-xl/2xl stripped; zoom-slider gradient → bg-accent
- `dossiers/CustomEdges.tsx` - edge-label pill shadow-md stripped
- `dossier/AddToDossierMenu.tsx` - FAB shadow judgment + tooltip popper re-skin
- `dossier/DossierTypeGuide.tsx`, `DossierTypeSelector.tsx`, `CountryMapImage.tsx`, `dossier-overview/sections/CalendarEventsSection.tsx`, `RelatedDossiersSection.tsx` - hover/drop shadow strips
- `sla-countdown/SLACountdown.tsx` - getStatusIcon(): ReactNode + lucide status/control icons

## Decisions Made

- **A1 (var() in SVG props):** relied on in-repo precedent rather than a fresh browser eyeball. `dossiers/RelationshipGraph.tsx` already ships `markerEnd.color: 'var(--accent)'` and `<Background color="hsl(var(--border))">` (Phase 58, D-58-04-24) in the same `@xyflow/react` version, proving React Flow forwards CSS vars into SVG presentation attributes. `var(--chart-N)` resolves by the identical mechanism, so no `getComputedStyle` fallback was applied. Final live eyeball is deferred to the 83-07 render-parity gate, which the plan's own verification section designates for it.
- **Node tint adaptation:** `${nodeColor}20` (hex + alpha byte) is invalid once `nodeColor` is a `var()`; rewrote to `color-mix(in srgb, ${nodeColor} 12.5%, transparent)` (0x20 ≈ 12.5%). Necessary Rule-3 blocking fix, tint visually preserved.
- **Requirement marking:** only DEBT-08 marked complete. DEBT-03/DEBT-05 are shared across the Wave-2 slices; this plan closes just its file share, so marking them done would falsely claim the sibling slices' work. DEBT-01 was already `[x]` in REQUIREMENTS.md (marked by an earlier plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hex-alpha node tint incompatible with CSS var**

- **Found during:** Task 1 (MiniRelationshipGraph palette migration)
- **Issue:** node-circle background `\`${nodeColor}20\``concatenates a hex alpha byte; once`nodeColor`became`var(--chart-N)`the string`var(--chart-1)20` is invalid CSS and the tint would vanish.
- **Fix:** `backgroundColor: \`color-mix(in srgb, ${nodeColor} 12.5%, transparent)\`` (0x20/0xFF ≈ 12.5%).
- **Files modified:** frontend/src/components/dossier/MiniRelationshipGraph.tsx
- **Verification:** type-check + lint clean; tint value preserved; no hex remains.
- **Committed in:** `f3b5c816` (Task 1 commit)

**2. [Rule 1 - Orphan cleanup] Dead classes/comment removed alongside strips**

- **Found during:** Task 2 (shadow strip)
- **Issue:** stripping `hover:shadow-md` / `drop-shadow-sm` left dead `transition-shadow`, an empty cn() string, a `filter` with no filter function, and an orphan explanatory comment.
- **Fix:** removed the now-dead siblings my strips created (my-own-mess cleanup only; no pre-existing dead code touched).
- **Files modified:** DossierTypeGuide.tsx, CountryMapImage.tsx, CalendarEventsSection.tsx, RelatedDossiersSection.tsx, relationships/RelationshipGraph.tsx
- **Verification:** lint clean on all touched files.
- **Committed in:** `accdad17` (Task 2 commit)

**3. [Scope] Node-circle shadow-md stripped in Task 1 rather than Task 2**

- **Found during:** Task 1 (rewriting the MiniRelationshipGraph node-circle style block for the tint)
- **Issue:** the `shadow-md` on the node circle sat on the same className being rewritten for the palette; splitting it into Task 2 would re-touch the same element.
- **Fix:** dropped it in the same edit. The Task-2 shadow gate still returns 0 for this file.
- **Committed in:** `f3b5c816` (Task 1 commit)

---

**Total deviations:** 3 (1 blocking adaptation, 1 orphan cleanup, 1 benign task-boundary merge)
**Impact on plan:** Mechanical, render-parity-preserving. No scope creep beyond the plan's four slice dirs.

## Issues Encountered

None blocking. The pre-commit build surfaced a pre-existing backend `PDFDocument` namespace-import warning (`reporting.service.ts`) — out of scope, logged only, not touched.

## Known Stubs

None introduced. `dossiers/RelationshipGraph.tsx` retains its pre-existing mock node stats (`mous`/`engagements`/`health_score` random values) — that is prior stub state, unrelated to this token/emoji migration and out of scope.

## Threat Flags

None. Class/constant/icon swaps in presentation components only — no new inputs, endpoints, deps, or data paths. T-83-04 (React Flow var() render) mitigated via in-repo precedent; T-83-SC (package installs) N/A — lucide-react already installed.

## Next Phase Readiness

- Graph + dossier slice token-clean; ready for the 83-06 ESLint carve-out tightening and 83-07 render-parity eyeball (which owns the deferred live markerEnd/Background/dark-dot check).
- DEBT-03 and DEBT-05 remain OPEN at the requirement level — sibling Wave-2 slices still hold the rest of their files.

## Deferred / Cross-Plan

- DEBT-03 (shadows), DEBT-05 (gradients): only this plan's slice share done; do not mark complete until the last owning slice lands.

## Self-Check: PASSED

- Commits verified present: `f3b5c816`, `accdad17`, `ae041829`
- Key files verified on disk (15 modified + SUMMARY)
- Slice gates re-run at zero: non-comment hex, banned shadows, `bg-gradient-` (relationships), widened emoji (DEBT-08 files)
- Carve-outs byte-untouched (list-pages.css shim, types comments, design-system/tokens, index.css :root, bootstrap.js)

---

_Phase: 83-token-debt-consolidation_
_Completed: 2026-07-04_
