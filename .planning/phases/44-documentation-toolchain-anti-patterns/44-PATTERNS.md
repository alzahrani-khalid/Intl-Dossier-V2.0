# Phase 44: Pattern Map

**Date:** 2026-05-07
**Phase:** 44 - Documentation, Toolchain & Anti-patterns
**Status:** Complete

## Pattern Assignments

| Target                                                        | Role                          | Closest Analog                                                                      | Pattern to Reuse                                                                  |
| ------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.planning/milestones/v6.0-phases/*/VERIFICATION.md`          | Retroactive verification docs | `.planning/milestones/v3.0-phases/12-enriched-dossier-pages/VERIFICATION.md`        | Short header, requirements table, summary, methodology                            |
| `.planning/milestones/v6.0-REQUIREMENTS.md`                   | Archive checkbox sync         | Existing v6.0 archive format                                                        | Preserve requirement text, only flip checkbox state where evidence exists         |
| `.planning/milestones/v6.0-ROADMAP.md`                        | Archive progress sync         | Existing progress table                                                             | Preserve phase sections, update status/progress rows only                         |
| `.planning/REQUIREMENTS.md`                                   | Active v6.1 requirements      | Current DOC/TOOL/LINT/STORY groups                                                  | Patch stale paths and commands without broad requirement rewrite                  |
| `frontend/.size-limit.json`                                   | Single bundle budget config   | Existing JSON array                                                                 | Keep array format consumed by `size-limit`; update paths and measured limits      |
| `frontend/vite.config.ts`                                     | Stable chunk naming           | Existing `manualChunks` function                                                    | Add source and dependency chunk cases before broad vendor buckets                 |
| `.github/workflows/ci.yml`                                    | CI size-limit enforcement     | Existing `bundle-size-check` job                                                    | Keep same job, ensure it builds and runs the repaired frontend size-limit command |
| `frontend/tests/e2e/helpers/qa-sweep.ts`                      | Axe helper precedent          | Phase 43 sweep helpers                                                              | Reuse login, settle, and axe patterns; add rule-specific gate only where needed   |
| `frontend/tests/e2e/dossier-drawer-axe.spec.ts`               | Drawer a11y open pattern      | Existing drawer axe spec                                                            | Reuse `openDrawerForFixtureDossier` fixture helper                                |
| `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` | WR-02/WR-03 target            | `frontend/src/pages/Dashboard/widgets/MyTasks.tsx` section labelling                | Prefer visible IDs plus `aria-labelledby`; remove dead fallback branches          |
| `frontend/src/pages/MyTasks.tsx`                              | WR-05 target                  | `frontend/src/pages/Dashboard/widgets/MyTasks.tsx`                                  | Checkbox references visible title with `aria-labelledby`                          |
| `.planning/decisions/ADR-006-storybook-deferral.md`           | Storybook deferral decision   | Existing ADR-style planning docs if present, otherwise project markdown conventions | Status, context, decision, replacement coverage table, revisit trigger            |

## Concrete Code Patterns

### Vite Manual Chunk Ordering

`frontend/vite.config.ts` already checks `node_modules` before returning broad
vendor names. Phase 44 should add the most specific cases before the existing
charts bucket:

```ts
if (id.includes('d3-geo') || id.includes('topojson-client') || id.includes('world-atlas')) {
  return 'signature-visuals-d3'
}
```

Then add a local source chunk outside the `node_modules` block:

```ts
if (id.includes('/src/components/signature-visuals/')) {
  return 'signature-visuals'
}
```

Keep `chunkFileNames: 'assets/[name]-[hash].js'` so size-limit can target
`dist/assets/signature-visuals-*.js` and `dist/assets/signature-visuals-d3-*.js`.

### Axe Rule for Label in Name

The Phase 43 helper filters serious/critical violations for broad sweeps. Phase
44 needs a rule-specific assertion for the audit item:

```ts
const results = await new AxeBuilder({ page })
  .include('main')
  .withRules(['label-content-name-mismatch'])
  .analyze()
expect(results.violations).toEqual([])
```

Use this in addition to existing broad a11y checks, not as a replacement.

### Archive Recovery From HEAD

The historical phase files are gone from the working tree but available in git:

```bash
git ls-tree -r --name-only HEAD .planning/phases/33-token-engine
git show HEAD:.planning/phases/33-token-engine/33-09-e2e-verification-SUMMARY.md
```

Executors can copy historical files into `.planning/milestones/v6.0-phases/`
without restoring old active paths.

### Storybook ADR Primitive Count

`frontend/src/components/signature-visuals/index.ts` exports visual primitives
and helpers. ADR-006 must count primitives only:

- Count: `GlobeLoader`, `GlobeSpinner`, `Sparkline`, `Donut`, `Icon`,
  `FullscreenLoader`, `DossierGlyph`.
- Exclude: `showGlobeLoader`, `subscribeGlobeLoader`,
  `getGlobeLoaderSnapshot`, `getGlobeLoaderServerSnapshot`, and types.
- Shared `Skeleton` / `Spinner` are outside this barrel and must be documented
  separately in the replacement coverage table.

## Existing Evidence Sources

### Missing Verification Requirements

From `.planning/milestones/v6.0-MILESTONE-AUDIT.md`:

- Phase 33: TOKEN-01..TOKEN-06.
- Phase 34: THEME-01..THEME-04.
- Phase 36: SHELL-01..SHELL-05.
- Phase 37: VIZ-01..VIZ-05.
- Phase 39: BOARD-01..BOARD-03.
- Phase 40: LIST-01..LIST-04.

Use `.planning/STATE.md` rollups and historical SUMMARY files as evidence.

### Current WR Source State

Some audit anchors have drifted:

- `DrawerCtaRow.tsx` no longer shows the flagged duplicate `aria-label` in the
  inspected CTA row.
- `VipVisits.tsx` currently exposes visible row text without a duplicate
  `aria-label`.
- `CalendarEntryForm.tsx` currently uses `useTranslation('calendar')` and
  `t('form.*')` patterns.

Plans should still verify the exact negative patterns with `rg` and patch any
remaining instances.

## PATTERN MAPPING COMPLETE
