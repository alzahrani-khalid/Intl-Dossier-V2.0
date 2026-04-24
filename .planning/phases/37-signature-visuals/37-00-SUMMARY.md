---
phase: 37-signature-visuals
plan: 00
status: complete
verification: PASS
completed_at: 2026-04-24
commits:
  - sha: 7410f469
    message: "feat(37-00): install d3-geo/topojson-client/world-atlas with exact pins"
  - sha: 922f7fc2
    message: "feat(37-00): scaffold signature-visuals folder tree with empty barrels"
  - sha: 792f79d2
    message: "feat(37-00): wire size-limit via .size-limit.json with signature-visuals budgets"
---

# Plan 37-00 — Wave 0 Infra

## Objective

Prepare the ground for Wave 1/2 component plans: install the three dataviz runtime deps,
scaffold the `signature-visuals/` folder tree with empty barrels, and migrate the
`size-limit` config into `frontend/.size-limit.json` with two new signature-visuals budgets.

## Tasks completed

1. **Dependencies (commit `7410f469`)** — exact-pinned `d3-geo@3.1.1`, `topojson-client@3.1.0`,
   `world-atlas@2.0.2` added to `frontend/package.json` dependencies via `pnpm add --save-exact`.
   `@types/d3-geo@3.1.0` and `@types/topojson-client@3.1.5` added as devDependencies.
   `pnpm-lock.yaml` regenerated deterministically.
2. **Folder scaffolding (commit `922f7fc2`)** — created:
   - `frontend/src/components/signature-visuals/index.ts` (empty barrel ready for Wave 1/2 exports)
   - `frontend/src/components/signature-visuals/flags/index.ts` (empty barrel for Wave 3 flag atlas)
   - `frontend/src/components/signature-visuals/__tests__/.gitkeep`
   - `frontend/e2e/signature-visuals/.gitkeep`
3. **size-limit wiring (commit `792f79d2`)** — migrated inline `size-limit` array out of
   `package.json` into `frontend/.size-limit.json`, preserving the four existing budgets and
   adding the two signature-visuals budgets:
   - `signature-visuals/d3-lazy-chunk` → 100 kB gzip (d3-geo + topojson-client + world-atlas lazy chunk)
   - `signature-visuals/static-primitives` → 15 kB gzip (static primitives, excluding d3 deps)
   Added `"size": "size-limit"` script alias.

## Files modified

- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/.size-limit.json` (new)
- `frontend/src/components/signature-visuals/index.ts` (new)
- `frontend/src/components/signature-visuals/flags/index.ts` (new)
- `frontend/src/components/signature-visuals/__tests__/.gitkeep` (new)
- `frontend/e2e/signature-visuals/.gitkeep` (new)

## Verification

- `pnpm install` — exit 0 (dependencies resolved; lockfile stable)
- `frontend/.size-limit.json` parses as valid JSON with 6 entries (4 existing + 2 new)
- `frontend/package.json` no longer has the inline `"size-limit"` field (single source of truth)
- New folders and barrels exist and are importable (empty but valid TypeScript)
- Typecheck unaffected (no component code shipped yet — barrels are valid empty modules)

## Deviations

- **Noted, not changed:** `frontend/tests/setup.ts` deliberately opts out of `@testing-library/jest-dom`
  (the file has an explicit comment documenting this architectural decision). Plans 02–07 that ship
  test coverage will register jest-dom themselves per-file, OR avoid `.toBeInTheDocument()` matchers.
  This is pre-existing convention from prior phases — not a Phase 37 concern.
- The Wave 0 plan file lists `frontend/vitest.config.ts` and `frontend/playwright.config.ts` under
  `files_modified`, but no changes were required: the existing configs already pick up
  `src/components/**/__tests__/**` and `e2e/**/*.spec.ts` glob patterns. The `.gitkeep`s we added
  get discovered automatically.

## Handoff to Wave 1

- Plan 37-01 (`useReducedMotion`) — no dependency on this plan's file outputs, can start immediately.
- Plan 37-02 (`GlobeLoader`) — will dynamic-`import('d3-geo')`, `import('topojson-client')`,
  `import('world-atlas/countries-110m.json')`. All three are now installed and pinned.
