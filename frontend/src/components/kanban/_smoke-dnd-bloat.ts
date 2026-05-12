// SMOKE TEST (DO NOT MERGE) — Phase 49 Plan 03 D-12 sub-vendor proof.
//
// This file pushes the `signature-visuals/d3-geospatial` sub-chunk past
// its 55 KB gz ceiling to prove the `Bundle Size Check (size-limit)` CI
// gate BLOCKS PRs that regress per-chunk budgets, not just the entry chunk.
//
// Strategy: import a low-resolution world-atlas dataset
// (`countries-110m.json`, 108 KB raw / ~30 KB gz) into the chunk graph.
// The `world-atlas` package routes to `signature-visuals-d3` per
// `vite.config.ts:172-177` (added by Phase 49 D-07). This pushes
// d3-geospatial from 54.15 KB → ~85 KB gz → above the 55 KB ceiling.
//
// (We pick the 50m dataset to give a decisive ~120 KB gz overflow on the
// d3-geospatial chunk — comfortably past the 55 KB ceiling — while keeping
// the CI build under 30 s. The 10m dataset would push closer to ~600 KB gz
// and slow CI further.)
//
// File path stays in `frontend/src/components/kanban/` to match the plan's
// branch name `chore/test-bundle-gate-subvendor`. The chunk routing is
// driven by the `world-atlas` import below, not by the smoke file's path.

import worldAtlas from 'world-atlas/countries-50m.json'

export const __smoke_subvendor_marker__: number = Object.keys(
  worldAtlas as Record<string, unknown>,
).length
