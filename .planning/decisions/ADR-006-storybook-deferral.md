# ADR-006: Storybook Deferral for v6.0 Visual Primitives

Status: Accepted

Date: 2026-05-07

## Context

Plan 33-08 proposed a Storybook install, a token grid story, and visual-regression
coverage for the v6.0 design-system surface. That plan was deferred during the
v6.0 token-engine work and remains historical context in the milestone archive.

Phase 44 resolves the deferral through this ADR instead of shipping Storybook.
The replacement coverage must be explicit enough to close STORY-01 without
adding new toolchain scope, package dependencies, stories, snapshots, or visual
baselines in Phase 44.

## Decision

Do not ship Storybook in Phase 44.

Storybook remains deferred for v6.0 visual primitives. Existing Vitest
component/snapshot-style assertions and existing Playwright visual specs are the
accepted replacement coverage for the current primitive set.

## Replacement Coverage Strategy

Use the existing coverage stack:

- Vitest component tests under `frontend/src/components/signature-visuals/__tests__/`
  for primitive behavior, SVG structure, accessibility attributes, RTL handling,
  reduced-motion handling, fallback behavior, and component anatomy.
- Existing shared UI wrapper tests under `frontend/tests/unit/components/ui/`
  for shared primitives that are not exported from the signature-visuals barrel.
- Existing Playwright visual specs for route-level rendering:
  `frontend/tests/e2e/dashboard-visual.spec.ts`,
  `frontend/tests/e2e/list-pages-visual.spec.ts`, and
  `frontend/tests/e2e/dossier-drawer-visual.spec.ts`.

## Replacement Coverage Table

| STORY-01 target  | Replacement coverage                                                                                                                                                                                                                                                                                                                     | Existing paths or coverage expectation                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GlobeLoader      | Vitest component tests cover world rendering, rotation, reduced motion, ring anatomy, and degraded topojson loading. Fullscreen loader tests also verify composition with the loader shell.                                                                                                                                              | `frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx`; `GlobeLoader.rotation.test.tsx`; `GlobeLoader.reducedMotion.test.tsx`; `GlobeLoader.rings.test.tsx`; `GlobeLoader.degrade.test.tsx`; `FullscreenLoader.test.tsx`; route-level visual guard: `frontend/tests/e2e/dashboard-visual.spec.ts`         |
| GlobeSpinner     | Vitest component tests cover status semantics, labels, className passthrough, and SVG anatomy. Existing list-page E2E coverage verifies the load-more spinner state.                                                                                                                                                                     | `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx`; `GlobeSpinner.anatomy.test.tsx`; `frontend/tests/e2e/list-pages-engagements.spec.ts`; route-level visual guard: `frontend/tests/e2e/list-pages-visual.spec.ts`                                                                                   |
| FullscreenLoader | Vitest component tests cover shell rendering, dev-gate behavior, backdrop fallback CSS, and GlobeLoader composition.                                                                                                                                                                                                                     | `frontend/src/components/signature-visuals/__tests__/FullscreenLoader.test.tsx`; `FullscreenLoader.devGate.test.tsx`; `FullscreenLoader.backdrop.test.tsx`; route-level visual guard: `frontend/tests/e2e/dashboard-visual.spec.ts`                                                                                           |
| DossierGlyph     | Vitest component tests cover flags, initials, hairline rendering, symbol selection, and sanitization. Dossier and list visual specs provide route-level coverage where dossier identity visuals appear.                                                                                                                                  | `frontend/src/components/signature-visuals/__tests__/DossierGlyph.flags.test.tsx`; `DossierGlyph.initials.test.tsx`; `DossierGlyph.hairline.test.tsx`; `DossierGlyph.symbols.test.tsx`; `DossierGlyph.sanitized.test.tsx`; `frontend/tests/e2e/list-pages-visual.spec.ts`; `frontend/tests/e2e/dossier-drawer-visual.spec.ts` |
| Sparkline        | Vitest component tests cover SVG geometry, bounds, className passthrough, and RTL flipping markers. Dashboard visual specs cover the primary dashboard usage surface.                                                                                                                                                                    | `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx`; `Sparkline.rtl.test.tsx`; `frontend/tests/e2e/dashboard-visual.spec.ts`                                                                                                                                                                             |
| Donut            | Vitest component tests cover dasharray segment math, clamping, rotation, and pill rendering. Dashboard visual specs cover the primary dashboard usage surface.                                                                                                                                                                           | `frontend/src/components/signature-visuals/__tests__/Donut.test.tsx`; `Donut.pill.test.tsx`; `frontend/tests/e2e/dashboard-visual.spec.ts`                                                                                                                                                                                    |
| Skeleton         | Shared Skeleton is not exported from `frontend/src/components/signature-visuals/index.ts`. Existing wrapper tests cover the closest shared primitive and presets; list-page and drawer visual specs wait for skeletons to clear or suppress pulse residue for stable screenshots.                                                        | `frontend/tests/unit/components/ui/heroui-wrappers.test.tsx`; closest implementation: `frontend/src/components/ui/heroui-skeleton.tsx`; visual stability paths: `frontend/tests/e2e/list-pages-visual.spec.ts`; `frontend/tests/e2e/dossier-drawer-visual.spec.ts`                                                            |
| Spinner          | No separate shared `Spinner` export exists today; current spinner coverage is the signature `GlobeSpinner`. If a distinct shared `Spinner` primitive is added, it must receive component coverage for `role="status"` semantics, accessible label handling, and route-level visual coverage before it is treated as covered by this ADR. | Closest existing coverage: `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx`; `GlobeSpinner.anatomy.test.tsx`; `frontend/tests/e2e/list-pages-engagements.spec.ts`; replacement expectation for a future shared Spinner: add a component test plus coverage in the relevant Playwright visual spec  |

## Revisit Trigger

Revisit this decision when the visual primitive count exceeds 15.

## Primitive Count Source

The count source is `frontend/src/components/signature-visuals/index.ts`.

Count only named visual primitive exports from that barrel. Exclude type exports,
signal helpers, test utilities, and implementation helpers.

Current counted barrel primitives:

- `GlobeLoader`
- `GlobeSpinner`
- `Sparkline`
- `Donut`
- `Icon`
- `FullscreenLoader`
- `DossierGlyph`

Current count: 7.

Shared `Skeleton` and `Spinner` are counted outside the STORY-01 replacement
coverage table but are not counted toward the `frontend/src/components/signature-visuals/index.ts`
barrel threshold unless they are exported from that barrel in the future.

## Consequences

- No Storybook install in Phase 44.
- No `.storybook/` creation in Phase 44.
- No `frontend/src/stories/` creation in Phase 44.
- No package dependency changes for Storybook in Phase 44.
- No new visual baselines or snapshot updates in Phase 44.
- The archived 33-08 Storybook plan remains historical context and is superseded
  by this ADR for Phase 44 execution.
